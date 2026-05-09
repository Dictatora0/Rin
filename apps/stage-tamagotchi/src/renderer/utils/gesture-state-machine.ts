import type { GestureQualityState } from './gesture-quality'

export type GestureMachineGesture = 'open_palm' | 'victory' | 'thumbs_up'
export type GestureCandidateGesture = GestureMachineGesture | 'none' | 'unknown'
export type GestureMachineState = 'idle' | 'candidate' | 'stable' | 'armed' | 'triggered' | 'cooldown' | 'waiting_release'

export interface GestureVotingConfig {
  windowSize: number
  minVotes: number
  minAverageConfidence: number
  minGeometryPassRate: number
}

export interface GestureLifecycleConfig {
  holdDurationMs: number
  cooldownMs: number
}

export interface GestureStateMachineConfig {
  voting: GestureVotingConfig
  gestures: Record<GestureMachineGesture, GestureLifecycleConfig>
}

export interface GestureSampleInput {
  nowMs: number
  candidateGesture: GestureCandidateGesture
  confidence: number
  geometryPass: boolean
  qualityState: GestureQualityState
}

export interface GestureVoteStats {
  votes: number
  averageConfidence: number
  geometryPassRate: number
}

export interface GestureStateMachineDiagnostics {
  candidateGesture: GestureCandidateGesture
  stableGesture: GestureCandidateGesture
  gestureState: GestureMachineState
  gestureConfidence: number
  gestureVotes: number
  windowSize: number
  geometryPassRate: number
  holdProgressMs: number
  holdDurationMs: number
  cooldownRemainingMs: number
  releaseRequired: boolean
  qualityState: GestureQualityState
}

export interface GestureStateMachineOutput {
  triggeredGesture: GestureMachineGesture | null
  diagnostics: GestureStateMachineDiagnostics
}

interface VoteAccumulator {
  votes: number
  confidenceSum: number
  geometryPassCount: number
}

interface InternalSample {
  candidateGesture: GestureCandidateGesture
  confidence: number
  geometryPass: boolean
  qualityState: GestureQualityState
}

/**
 * Default robust voting and lifecycle parameters for experimental gestures.
 *
 * Use when:
 * - Running the gesture recognizer in balanced robustness mode.
 *
 * Expects:
 * - Caller loop to provide monotonic frame timestamps in milliseconds.
 *
 * Returns:
 * - Deterministic thresholds shared by runtime and tests.
 */
export const DEFAULT_GESTURE_STATE_MACHINE_CONFIG: GestureStateMachineConfig = {
  voting: {
    windowSize: 10,
    minVotes: 7,
    minAverageConfidence: 0.75,
    minGeometryPassRate: 0.7,
  },
  gestures: {
    open_palm: { holdDurationMs: 600, cooldownMs: 3_000 },
    victory: { holdDurationMs: 500, cooldownMs: 4_000 },
    thumbs_up: { holdDurationMs: 500, cooldownMs: 3_000 },
  },
}

const SUPPORTED_GESTURES: GestureMachineGesture[] = ['open_palm', 'victory', 'thumbs_up']

function isSupportedGesture(gesture: GestureCandidateGesture): gesture is GestureMachineGesture {
  return gesture === 'open_palm' || gesture === 'victory' || gesture === 'thumbs_up'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function createAccumulatorMap() {
  return {
    open_palm: { votes: 0, confidenceSum: 0, geometryPassCount: 0 },
    victory: { votes: 0, confidenceSum: 0, geometryPassCount: 0 },
    thumbs_up: { votes: 0, confidenceSum: 0, geometryPassCount: 0 },
  } satisfies Record<GestureMachineGesture, VoteAccumulator>
}

function normalizeConfig(config?: Partial<GestureStateMachineConfig>): GestureStateMachineConfig {
  if (!config)
    return DEFAULT_GESTURE_STATE_MACHINE_CONFIG

  return {
    voting: {
      ...DEFAULT_GESTURE_STATE_MACHINE_CONFIG.voting,
      ...config.voting,
    },
    gestures: {
      open_palm: {
        ...DEFAULT_GESTURE_STATE_MACHINE_CONFIG.gestures.open_palm,
        ...config.gestures?.open_palm,
      },
      victory: {
        ...DEFAULT_GESTURE_STATE_MACHINE_CONFIG.gestures.victory,
        ...config.gestures?.victory,
      },
      thumbs_up: {
        ...DEFAULT_GESTURE_STATE_MACHINE_CONFIG.gestures.thumbs_up,
        ...config.gestures?.thumbs_up,
      },
    },
  }
}

/**
 * Creates a robust gesture state machine with sliding-window voting and release-to-retrigger.
 *
 * Use when:
 * - Turning noisy per-frame gesture candidates into stable trigger events.
 *
 * Expects:
 * - `ingest` to be called once per recognized gesture frame.
 * - `qualityState` to reflect per-frame input quality gating.
 *
 * Returns:
 * - `ingest` function that emits at most one triggered gesture per frame,
 *   plus UI-ready diagnostics.
 */
export function createGestureStateMachine(config?: Partial<GestureStateMachineConfig>) {
  const resolved = normalizeConfig(config)

  const samples: InternalSample[] = []
  const cooldownUntilByGesture: Record<GestureMachineGesture, number> = {
    open_palm: Number.NEGATIVE_INFINITY,
    victory: Number.NEGATIVE_INFINITY,
    thumbs_up: Number.NEGATIVE_INFINITY,
  }

  let state: GestureMachineState = 'idle'
  let stateEnteredAtMs = 0
  let currentGesture: GestureMachineGesture | null = null
  let releaseRequiredGesture: GestureMachineGesture | null = null
  let lastDiagnostics: GestureStateMachineDiagnostics = {
    candidateGesture: 'none',
    stableGesture: 'none',
    gestureState: 'idle',
    gestureConfidence: 0,
    gestureVotes: 0,
    windowSize: resolved.voting.windowSize,
    geometryPassRate: 0,
    holdProgressMs: 0,
    holdDurationMs: 0,
    cooldownRemainingMs: 0,
    releaseRequired: false,
    qualityState: 'unknown',
  }

  function setState(nextState: GestureMachineState, nowMs: number, gesture: GestureMachineGesture | null) {
    if (state !== nextState || currentGesture !== gesture) {
      state = nextState
      currentGesture = gesture
      stateEnteredAtMs = nowMs
    }
  }

  function collectVoteStats() {
    const accumulator = createAccumulatorMap()
    for (const sample of samples) {
      if (sample.qualityState !== 'good')
        continue
      if (!isSupportedGesture(sample.candidateGesture))
        continue

      const target = accumulator[sample.candidateGesture]
      target.votes += 1
      target.confidenceSum += sample.confidence
      if (sample.geometryPass)
        target.geometryPassCount += 1
    }

    const stats = {
      open_palm: { votes: 0, averageConfidence: 0, geometryPassRate: 0 },
      victory: { votes: 0, averageConfidence: 0, geometryPassRate: 0 },
      thumbs_up: { votes: 0, averageConfidence: 0, geometryPassRate: 0 },
    } satisfies Record<GestureMachineGesture, GestureVoteStats>

    for (const gesture of SUPPORTED_GESTURES) {
      const source = accumulator[gesture]
      if (source.votes <= 0)
        continue
      stats[gesture] = {
        votes: source.votes,
        averageConfidence: source.confidenceSum / source.votes,
        geometryPassRate: source.geometryPassCount / source.votes,
      }
    }

    return stats
  }

  function resolveStableGesture(voteStats: Record<GestureMachineGesture, GestureVoteStats>) {
    let winner: GestureMachineGesture | null = null
    for (const gesture of SUPPORTED_GESTURES) {
      const stats = voteStats[gesture]
      const passesThreshold = stats.votes >= resolved.voting.minVotes
        && stats.averageConfidence >= resolved.voting.minAverageConfidence
        && stats.geometryPassRate >= resolved.voting.minGeometryPassRate
      if (!passesThreshold)
        continue

      if (!winner) {
        winner = gesture
        continue
      }

      const winnerStats = voteStats[winner]
      if (stats.votes > winnerStats.votes
        || (stats.votes === winnerStats.votes && stats.averageConfidence > winnerStats.averageConfidence)) {
        winner = gesture
      }
    }
    return winner
  }

  function getFocusGesture(candidateGesture: GestureCandidateGesture, stableGesture: GestureMachineGesture | null) {
    if (stableGesture)
      return stableGesture
    if (isSupportedGesture(candidateGesture))
      return candidateGesture
    return null
  }

  function getFocusStats(
    focusGesture: GestureMachineGesture | null,
    voteStats: Record<GestureMachineGesture, GestureVoteStats>,
  ) {
    if (!focusGesture) {
      return {
        gestureVotes: 0,
        gestureConfidence: 0,
        geometryPassRate: 0,
      }
    }

    const stats = voteStats[focusGesture]
    return {
      gestureVotes: stats.votes,
      gestureConfidence: stats.averageConfidence,
      geometryPassRate: stats.geometryPassRate,
    }
  }

  function buildDiagnostics(
    nowMs: number,
    sample: GestureSampleInput,
    stableGesture: GestureMachineGesture | null,
    voteStats: Record<GestureMachineGesture, GestureVoteStats>,
  ): GestureStateMachineDiagnostics {
    const focusGesture = getFocusGesture(sample.candidateGesture, stableGesture)
    const focusStats = getFocusStats(focusGesture, voteStats)
    const holdDurationMs = focusGesture ? resolved.gestures[focusGesture].holdDurationMs : 0
    const cooldownRemainingMs = releaseRequiredGesture
      ? Math.max(0, cooldownUntilByGesture[releaseRequiredGesture] - nowMs)
      : 0

    const holdProgressMs = (focusGesture && (state === 'stable' || state === 'armed'))
      ? clamp(nowMs - stateEnteredAtMs, 0, holdDurationMs)
      : 0

    return {
      candidateGesture: sample.candidateGesture,
      stableGesture: stableGesture ?? 'none',
      gestureState: state,
      gestureConfidence: Number.isFinite(focusStats.gestureConfidence) ? focusStats.gestureConfidence : 0,
      gestureVotes: focusStats.gestureVotes,
      windowSize: resolved.voting.windowSize,
      geometryPassRate: Number.isFinite(focusStats.geometryPassRate) ? focusStats.geometryPassRate : 0,
      holdProgressMs,
      holdDurationMs,
      cooldownRemainingMs,
      releaseRequired: releaseRequiredGesture !== null,
      qualityState: sample.qualityState,
    }
  }

  function ingest(sample: GestureSampleInput): GestureStateMachineOutput {
    const normalizedSample: InternalSample = {
      candidateGesture: sample.candidateGesture,
      confidence: Number.isFinite(sample.confidence) ? sample.confidence : 0,
      geometryPass: sample.geometryPass,
      qualityState: sample.qualityState,
    }

    samples.push(normalizedSample)
    if (samples.length > resolved.voting.windowSize)
      samples.shift()

    const voteStats = collectVoteStats()
    const stableGesture = resolveStableGesture(voteStats)
    let triggeredGesture: GestureMachineGesture | null = null

    if (releaseRequiredGesture) {
      const stillHoldingReleasedGesture = sample.qualityState === 'good' && sample.candidateGesture === releaseRequiredGesture
      if (!stillHoldingReleasedGesture) {
        releaseRequiredGesture = null
        if (stableGesture) {
          setState('candidate', sample.nowMs, stableGesture)
        }
        else if (isSupportedGesture(sample.candidateGesture) && sample.qualityState === 'good') {
          setState('candidate', sample.nowMs, sample.candidateGesture)
        }
        else {
          setState('idle', sample.nowMs, null)
        }
      }
      else {
        const cooldownUntil = cooldownUntilByGesture[releaseRequiredGesture]
        if (sample.nowMs < cooldownUntil)
          setState('cooldown', sample.nowMs, releaseRequiredGesture)
        else
          setState('waiting_release', sample.nowMs, releaseRequiredGesture)
      }
    }
    else if (!stableGesture) {
      if (isSupportedGesture(sample.candidateGesture) && sample.qualityState === 'good')
        setState('candidate', sample.nowMs, sample.candidateGesture)
      else
        setState('idle', sample.nowMs, null)
    }
    else if (currentGesture !== stableGesture) {
      setState('candidate', sample.nowMs, stableGesture)
    }
    else if (state === 'candidate') {
      setState('stable', sample.nowMs, stableGesture)
    }
    else if (state === 'stable') {
      const holdDurationMs = resolved.gestures[stableGesture].holdDurationMs
      if ((sample.nowMs - stateEnteredAtMs) >= holdDurationMs)
        setState('armed', sample.nowMs, stableGesture)
    }
    else if (state === 'armed') {
      const cooldownUntil = cooldownUntilByGesture[stableGesture]
      if (sample.nowMs < cooldownUntil) {
        setState('cooldown', sample.nowMs, stableGesture)
      }
      else {
        triggeredGesture = stableGesture
        cooldownUntilByGesture[stableGesture] = sample.nowMs + resolved.gestures[stableGesture].cooldownMs
        releaseRequiredGesture = stableGesture
        setState('triggered', sample.nowMs, stableGesture)
      }
    }
    else if (state === 'triggered' && currentGesture) {
      setState('cooldown', sample.nowMs, currentGesture)
    }
    else if (state === 'cooldown' && currentGesture && sample.nowMs >= cooldownUntilByGesture[currentGesture]) {
      setState('waiting_release', sample.nowMs, currentGesture)
    }

    lastDiagnostics = buildDiagnostics(sample.nowMs, sample, stableGesture, voteStats)

    return {
      triggeredGesture,
      diagnostics: lastDiagnostics,
    }
  }

  function reset() {
    samples.length = 0
    cooldownUntilByGesture.open_palm = Number.NEGATIVE_INFINITY
    cooldownUntilByGesture.victory = Number.NEGATIVE_INFINITY
    cooldownUntilByGesture.thumbs_up = Number.NEGATIVE_INFINITY
    state = 'idle'
    stateEnteredAtMs = 0
    currentGesture = null
    releaseRequiredGesture = null
    lastDiagnostics = {
      candidateGesture: 'none',
      stableGesture: 'none',
      gestureState: 'idle',
      gestureConfidence: 0,
      gestureVotes: 0,
      windowSize: resolved.voting.windowSize,
      geometryPassRate: 0,
      holdProgressMs: 0,
      holdDurationMs: 0,
      cooldownRemainingMs: 0,
      releaseRequired: false,
      qualityState: 'unknown',
    }
  }

  function getDiagnostics() {
    return lastDiagnostics
  }

  return {
    config: resolved,
    ingest,
    reset,
    getDiagnostics,
  }
}
