# Desktop Interaction Improvements (Rin Stage Tamagotchi)

## Why this change

Rin is a desktop-floating character, so move/resize operations must be easy and predictable.
Previously, users often needed to rely on a small corner area or a single move control, which made positioning feel constrained.

## Previous limitations

- Window move affordance was limited to a small explicit drag control and did not expose a large stage-level drag zone.
- Resize relied mostly on edge/corner hit targets that felt narrow on some displays.
- Fade-on-hover click-through behavior could conflict with intentional move gestures.

## New design (Low-Risk A)

1. Move Mode toggle in controls-island (default off).
2. Stage move overlay only when Move Mode is enabled:
- Large centered drag panel.
- Non-Linux path uses existing `electron-click-drag-plugin` invoke chain.
- Linux path uses existing `drag-region` behavior.
3. Size controls in controls-island:
- Zoom In
- Zoom Out
- Reset Size (450x600 baseline, clamped by screen work area)
4. Enhanced resize handles:
- Keep existing resize chain (`useElectronWindowResize -> electron.window.resize -> resizeWindowByDelta`).
- Keep 8 directions and enlarge stage-layout hit areas.

## Anti-misdrag and interaction safety

- Move Mode is opt-in and disabled by default.
- Move overlay uses `pointer-events-none` outer shell and `pointer-events-auto` only on the drag panel.
- Controls/Vision/status/resource islands remain clickable because drag is not globally applied.
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
3. Drag using the stage move panel and verify window repositions naturally.
4. Toggle Move Mode off and verify normal click behavior returns.
5. Use Zoom In / Zoom Out / Reset Size and verify size changes remain clamped and usable.
6. Verify Vision Island and controls interactions remain clickable during and after move/resize.
