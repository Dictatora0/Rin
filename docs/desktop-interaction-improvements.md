# Desktop Interaction Improvements (Rin Stage Tamagotchi)

## Why this change

Rin is a desktop-floating character, so move/resize operations must be easy and predictable.
Previously, users often needed to rely on a small corner area or a single move control, which made positioning feel constrained.

## Previous limitations

- Window move affordance was limited to a small explicit drag control and did not expose a large stage-level drag zone.
- Resize relied mostly on edge/corner hit targets that felt narrow on some displays.
- Fade-on-hover click-through behavior could conflict with intentional move gestures.

## Iteration note

The first Move Mode iteration used a visible centered panel. Real-device validation showed that this panel:

- Visually covered Rin’s character body.
- Could interfere with quick access to exit Move Mode.
- Felt intrusive compared with the desired “drag near Rin naturally” behavior.

## New design (Invisible Character Drag Hit Area)

1. Move Mode toggle remains in controls-island (default off).
2. Stage move overlay is now invisible by default:
- No large card, no visible border, no centered instruction text.
- Only a transparent drag hit area around Rin’s character zone is active.
3. Cross-platform drag behavior remains unchanged:
- Non-Linux path uses existing `electron-click-drag-plugin` invoke chain.
- Linux path uses existing `drag-region`.
4. Size controls remain:
- Zoom In
- Zoom Out
- Reset Size (450x600 baseline, clamped by screen work area)
5. Enhanced resize handles remain:
- Existing resize chain is preserved (`useElectronWindowResize -> electron.window.resize -> resizeWindowByDelta`).
- 8 directions with enlarged stage-layout heat zones.

## Anti-misdrag and interaction safety

- Move Mode is opt-in and disabled by default.
- Overlay root stays `pointer-events-none`; only the transparent hit area is `pointer-events-auto`.
- Controls island is forced above overlay with a higher layer and `no-drag` surface, so toggles/buttons remain clickable.
- Vision island, status/resource islands, and resize handles keep priority and remain interactive.
- Move Mode forces `setIgnoreMouseEvents(false)` while active, avoiding click-through stealing pointer events.

## Behavior protection scope

- No changes to study-companion.
- No changes to visual recognition core logic.
- No behavioral semantics change for Vision Island / controls-island existing feature flows.
- No structural main-process refactor.
- No new dependencies.

## Demo steps

1. Run `pnpm dev:tamagotchi`.
2. Open controls-island and toggle Move Mode on.
3. Drag near Rin’s body (invisible hit area) and verify window repositions naturally.
4. Toggle Move Mode off and verify normal click behavior returns.
5. Use Zoom In / Zoom Out / Reset Size and verify size changes remain clamped and usable.
6. Verify Vision Island, controls-island, and resize handles remain clickable during and after move/resize.
