import { eventHandler, getQuery, H3, handleCors } from 'h3'

import { createH3Server } from '../../server'

export interface LoopbackCallbackResult {
  code: string
  state: string
}

export interface LoopbackServerOptions {
  redirectUri?: string
  onCallbackEvent?: (event: LoopbackCallbackEvent) => void
}

export interface LoopbackCallbackEvent {
  type: 'hit' | 'error-param' | 'missing-params' | 'success' | 'timeout' | 'cancelled'
  callbackHitCount: number
  loopbackPort: number | null
  redirectUri: string
  queryKeys?: string[]
  hasCode?: boolean
  hasState?: boolean
  error?: string
  description?: string
}

/**
 * Starts a temporary loopback callback server for the Electron OIDC flow.
 *
 * Use when:
 * - Exchanging authorization code from system browser callback
 *
 * Expects:
 * - Callback request on `GET /callback?code=...&state=...`
 * - One-shot lifecycle; first successful callback closes the server
 *
 * Returns:
 * - Random bound port, callback result promise, and manual cancellation method
 */
export async function startLoopbackServer(): Promise<{
  port: number
  result: Promise<LoopbackCallbackResult>
  close: () => void
}>
export async function startLoopbackServer(options: LoopbackServerOptions): Promise<{
  port: number
  result: Promise<LoopbackCallbackResult>
  close: () => void
}>
export async function startLoopbackServer(options: LoopbackServerOptions = {}): Promise<{
  port: number
  result: Promise<LoopbackCallbackResult>
  close: () => void
}> {
  const host = '127.0.0.1'
  let settled = false
  let timeout: ReturnType<typeof setTimeout> | undefined
  let loopbackPort: number | null = null

  let callbackHitCount = 0
  let lastCallbackQueryKeys: string[] = []
  let lastCallbackOutcome: 'none' | 'error-param' | 'missing-params' | 'success' = 'none'
  let lastCallbackAt: number | null = null
  const redirectUri = options.redirectUri ?? '(not-provided)'

  let resolveResult!: (value: LoopbackCallbackResult) => void
  let rejectResult!: (reason: Error) => void

  const result = new Promise<LoopbackCallbackResult>((resolve, reject) => {
    resolveResult = resolve
    rejectResult = reject
  })

  const app = new H3()
  const loopbackServer = createH3Server({ app, host })
  const corsOptions = {
    origin: '*',
    methods: '*',
    preflight: {
      statusCode: 204,
    },
  } as const

  function emitCallbackEvent(event: Omit<LoopbackCallbackEvent, 'loopbackPort' | 'redirectUri' | 'callbackHitCount'> & {
    type: LoopbackCallbackEvent['type']
    callbackHitCount?: number
  }) {
    options.onCallbackEvent?.({
      callbackHitCount: event.callbackHitCount ?? callbackHitCount,
      loopbackPort,
      redirectUri,
      ...event,
    })
  }

  function formatLoopbackDiagnostics() {
    const queryKeys = lastCallbackQueryKeys.length > 0 ? lastCallbackQueryKeys.join(',') : '(none)'
    const lastCallbackAtText = lastCallbackAt ? new Date(lastCallbackAt).toISOString() : 'never'
    const portText = loopbackPort === null ? 'unknown' : String(loopbackPort)
    return [
      `redirectUri=${redirectUri}`,
      `loopbackPort=${portText}`,
      `callbackHits=${callbackHitCount}`,
      `lastCallbackOutcome=${lastCallbackOutcome}`,
      `lastCallbackAt=${lastCallbackAtText}`,
      `lastCallbackQueryKeys=${queryKeys}`,
    ].join(', ')
  }

  const finish = (callback: () => void) => {
    if (settled) {
      return
    }

    settled = true
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
    callback()
    void loopbackServer.stop()
  }

  app.options('/callback', eventHandler(async (event) => {
    const corsResponse = handleCors(event, corsOptions)
    if (corsResponse !== false) {
      return corsResponse
    }

    return new Response(null, { status: 204 })
  }))

  app.get('/callback', eventHandler(async (event) => {
    const corsResponse = handleCors(event, corsOptions)
    if (corsResponse !== false) {
      return corsResponse
    }

    const query = getQuery(event)
    callbackHitCount += 1
    lastCallbackAt = Date.now()
    lastCallbackQueryKeys = Object.keys(query)
    emitCallbackEvent({
      type: 'hit',
      queryKeys: lastCallbackQueryKeys,
    })

    const error = typeof query.error === 'string' ? query.error : undefined
    if (error) {
      const description = typeof query.error_description === 'string' && query.error_description.length > 0
        ? query.error_description
        : error
      lastCallbackOutcome = 'error-param'
      emitCallbackEvent({
        type: 'error-param',
        error,
        description,
      })
      finish(() => {
        rejectResult(new Error(description))
      })
      return new Response('<html><body><h2>Authentication failed</h2><p>You can close this window.</p></body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    const code = typeof query.code === 'string' ? query.code : ''
    const state = typeof query.state === 'string' ? query.state : ''

    if (!code || !state) {
      lastCallbackOutcome = 'missing-params'
      emitCallbackEvent({
        type: 'missing-params',
        hasCode: !!code,
        hasState: !!state,
      })
      return new Response('<html><body><h2>Missing parameters</h2></body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    lastCallbackOutcome = 'success'
    emitCallbackEvent({
      type: 'success',
    })

    finish(() => {
      resolveResult({ code, state })
    })

    return new Response('<html><body><h2>Authentication successful!</h2><p>You can close this window and return to the app.</p></body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }))

  const address = await loopbackServer.start()
  loopbackPort = address.port

  timeout = setTimeout(() => {
    emitCallbackEvent({
      type: 'timeout',
    })
    finish(() => {
      rejectResult(new Error(`Sign-in timed out — no callback received (${formatLoopbackDiagnostics()})`))
    })
  }, 5 * 60 * 1000)

  return {
    port: address.port,
    result,
    close: () => {
      emitCallbackEvent({
        type: 'cancelled',
      })
      finish(() => {
        rejectResult(new Error('OIDC sign-in attempt cancelled'))
      })
    },
  }
}
