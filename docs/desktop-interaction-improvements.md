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

## Controls Island UI layout refinement

- Controls Island was refined from a mixed button panel into four clear sections:
  - Account
  - Core operations
  - Extension tools
  - Window controls
- Move / Zoom In / Zoom Out / Reset Size are now grouped under Window controls.
- The expand/collapse anchor remains always visible and keeps a stable interaction target.
- Tooltips, aria labels, and titles are kept across major controls to improve discoverability.
- This is a layout and visual hierarchy adjustment only:
  - Existing feature handlers are unchanged.
  - Vision, move-mode, and study-companion behaviors are preserved.

## Controls Island UI layout refinement (Round 2)

- Core / Tools / Window sections now share one consistent button grid system:
  - Same 3-column grid structure
  - Same spacing rhythm
  - Same button baseline sizing
- Window controls are fully integrated into the Window section grid:
  - Move Mode
  - Zoom In
  - Zoom Out
  - Reset Size
  - Drag Window
  - Close
- Repeated icon semantics were resolved:
  - Move Mode keeps directional-move icon
  - Drag Window uses a distinct hand-drag icon
  - Reset Size keeps reset/restore icon
- Mouse-leave auto collapse was removed for Controls Island:
  - Controls panel stays expanded after pointer leaves
  - Collapse is now user-driven only (toggle/anchor interaction)
  - Vision subpanel behavior no longer drives whole-panel auto collapse

## Controls + Vision usability refinement (Principles 2/3/4)

- Flexibility and efficiency:
  - Added persistent Controls UI mode switch (`novice` / `expert`) in Controls Island.
  - Added in-panel shortcut cheat sheet for stable window shortcuts:
    - `Cmd/Ctrl + +`
    - `Cmd/Ctrl + -`
    - `Cmd/Ctrl + 0`
  - Kept the existing zoom/reset button entry points aligned with those shortcuts.

- Aesthetic and minimalist:
  - Novice mode now shows short fixed labels under major controls for clarity.
  - Expert mode keeps compact icon-first density for experienced users.
  - Vision Island now supports layered density:
    - `novice`: task-focused, lower-noise content
    - `expert`: full advanced diagnostics and tuning controls

- Error recognition and recovery:
  - Added a user-facing recovery panel in Vision Island with actionable buttons.
  - Recovery guidance prioritizes:
    1. Camera permission/availability issues
    2. Vision runtime failure/retry/reset path
    3. Face gate blocking conditions
  - Updated runtime-related toast copy to natural user-facing messages.

## HCI Usability Pass（学习 + 视觉 + Controls）

- 本轮是有限范围可用性修整，不新增大功能、不改主进程、不改核心识别/门控逻辑。

- 学习模块（Study Island）：
  - 专注完成后增加“下一步选择卡”：
    - `休息 5 分钟`
    - `开始下一轮`（一键，不需要先重置）
    - `完成当前任务`（无待完成任务时禁用）
  - TaskList 空状态改为明确引导：
    - `还没有今日任务`
    - `添加一个任务，让 Rin 陪你完成它`
  - 任务从未完成切换为完成时，增加轻量正反馈：
    - `已完成，做得不错`

- 视觉模块（Vision Island）：
  - 默认界面从“调试导向”改为“用户状态导向”：
    - 摄像头
    - 主体状态
    - 人脸门控
    - 最近反馈
    - 恢复建议
  - 诊断字段保留但折叠到 `Advanced / Diagnostics`。
  - 新增“为什么 Rin 没响应？”恢复建议卡，覆盖：
    - `camera off`
    - `runtime failed`
    - `no_face`
    - `multiple_faces`
    - `locked / profile locked`
    - `unmatched`

- Controls Island：
  - Core / Tools / Window 三组维持统一 `3-column grid`。
  - 鼠标离开不自动收起，收起行为仅由用户触发。
  - 保留始终可见的 Toggle Anchor，并补充可点击的 `Emergency Anchor`（紧急收起）。
  - Move / Zoom In / Zoom Out / Reset / Close 保持在 Window 分组内。

- 对应 HCI 原则：
  - Recognition rather than recall：
    - 学习完成后直接给出下一步动作，减少“接下来做什么”的记忆负担。
    - Rin 无响应时直接给出原因与可执行恢复操作。
  - Flexibility and efficiency：
    - 一键开始下一轮；在同一位置完成休息/继续/完成任务。
    - Controls 收起从“系统推断”改为“用户主动控制”。
  - Aesthetic and minimalist design：
    - Vision 默认视图只保留核心信息，把诊断细节折叠到高级区。
  - Error recovery：
    - Vision 恢复建议卡提供明确恢复路径（开启摄像头、打开录入、重试运行时、关闭门控）。

## Demo steps

1. Run `pnpm dev:tamagotchi`.
2. Open controls-island and toggle Move Mode on.
3. Drag near Rin’s body (invisible hit area) and verify window repositions naturally.
4. Toggle Move Mode off and verify normal click behavior returns.
5. Use Zoom In / Zoom Out / Reset Size and verify size changes remain clamped and usable.
6. Verify Vision Island, controls-island, and resize handles remain clickable during and after move/resize.
