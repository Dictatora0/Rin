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

## Study / Vision 独立 Floating Panel（Round 3）

- Controls Island 回归“轻量入口 + 桌面控制器”：
  - 保留学习入口、视觉入口、聊天/设置、Move/Zoom/Reset/Close、Emergency Anchor。
  - 不再在 Controls 内承载 Study/Vision 的完整长内容。

- 新增 renderer 层独立浮动面板壳 `StageFloatingPanel`：
  - `fixed` 定位，`pointer-events-auto`，`-webkit-app-region: no-drag`。
  - 与 Controls 分层渲染，不进入 Controls 内部滚动流。
  - 内容区独立滚动，宽高受限：
    - `max-height: min(80vh, 720px)`
    - `max-width: calc(100vw - 32px)`
  - Study / Vision 分别使用不同宽度区间（study 更窄，vision 更宽）。

- Study 浮动面板：
  - 标题：`学习陪伴`。
  - 关闭只改变 `studyPanelOpen`，不触发重置计时、不清空任务/统计。
  - 再次打开继续当前学习状态。

- Vision 浮动面板：
  - 标题：`视觉感知`。
  - 关闭只改变 `visionPanelOpen`，不强制 stop camera、不重置 runtime、不改 face gate。
  - Controls 视觉入口区分两类信号：
    - 面板打开态（高亮 ring）
    - 摄像头运行态（状态点），避免把“正在运行”误读成“面板仍打开”。

- 层级与交互：
  - 浮动面板层级高于 move overlay，Move Mode 开启时仍可点击。
  - 浮动面板默认放在右侧偏中上，避免压住右下角 anchor 的基本可用性。

- 对应 HCI 原则：
  - Aesthetic and minimalist design：Controls 不再拥挤，职责清晰。
  - Recognition rather than recall：入口、标题、关闭语义更直接。
  - Flexibility and efficiency of use：快捷入口与完整面板分离，减少滚动冲突与误操作。

## Study Companion 可用性补强（Round 4，仅学习模块）

- 本轮仅增强学习模块，不改视觉模块、不改拖拽/缩放与 Controls 架构、不改主进程。

- 自定义专注/休息节奏：
  - 新增 `focusMinutes` / `breakMinutes` 可配置项。
  - 默认值维持 `25 / 5`，并做范围限制：
    - 专注：`5-120` 分钟
    - 休息：`1-60` 分钟
  - 设置项持久化；运行中不强制打断当前计时，仅下一轮使用新时长。

- 任务与专注关联：
  - 新增 `selectedFocusTaskId`，允许选择“当前专注任务”。
  - 专注开始事件可记录 taskId（用于复盘与导出）。
  - 专注完成卡支持“一键完成当前任务”，完成后自动清空选择并给出轻量正反馈。

- Markdown 学习报告导出：
  - 保留原 JSON 导出，新增 Markdown 报告导出。
  - 文件名：`rin-study-report-YYYY-MM-DD.md`。
  - 报告包含：
    - 今日核心指标（专注分钟、轮数、完成任务数、中断次数、当前时长设置）
    - 今日任务表格
    - 最近学习事件摘要（最多 10 条）

- 休息建议：
  - 新增本地建议池（不接 LLM），在进入休息时给出一条短建议。
  - 同一次休息期间不频繁变化；离开休息状态后隐藏。

- 今日中断次数展示：
  - 基于当天 `focus_reset` 事件统计“今日中断”。
  - `pause` 不计入中断。
  - UI 统计卡与 Markdown 报告都展示中断次数。

- 对应 HCI 原则：
  - Flexibility and efficiency of use：支持个性化节奏与一键完成任务。
  - Recognition rather than recall：明确展示当前专注任务、今日中断与下一步动作。
  - Help and documentation：一键导出结构化 Markdown 报告，便于课程答辩与复盘。
  - Aesthetic and minimalist design：新增能力收敛到学习设置/导出区，主面板保持轻量。

## Study Analytics & Readability（Round 5）

- 目标：
  - 在不破坏原有学习计时/任务/导出/浮动面板的前提下，增强学习数据能力与默认可理解性。

- 学习模块新增：
  - 多日历史统计（7/14/30 天）与持久化 `historyEntries`。
  - 最近 7 天专注柱状图（Study Floating Panel 内可见）。
  - 最近 30 天学习热力图（学习设置页可见）。
  - 今日任务扩展字段：
    - 优先级（高/中/低）
    - 截止日期（可选）
  - 任务录入区补充“优先级 / 截止日期”明确标签，截止日期用于排序和逾期提示，降低录入歧义。
  - 智能排序规则：
    - 未完成优先
    - 高优先级优先
    - 更早截止优先
    - 同条件按创建时间
  - Markdown 报告增强：
    - 任务表新增优先级/截止日期
    - 新增最近 7 天趋势摘要
    - 保留原 JSON 导出能力

- 默认界面可理解性：
  - Study 默认面板仅展示任务、状态、统计与趋势，不暴露技术型字段。
  - Vision 默认视图继续保持“用户状态面板”而非 raw debug 面板。
  - 诊断信息保留在 Advanced / Diagnostics，不删除调试能力。

- 对应 HCI 原则：
  - Recognition rather than recall：
    - 用中文状态与可视化趋势替代抽象事件理解负担。
  - Flexibility and efficiency of use：
    - 通过优先级、截止日期、智能排序快速决定“先做什么”。
  - Aesthetic and minimalist design：
    - 技术字段默认折叠，主视图只保留高价值信息。
  - Help users recover / Help and documentation：
    - 报告导出包含趋势与任务语义字段，便于复盘与展示。

## Demo steps

1. Run `pnpm dev:tamagotchi`.
2. Open controls-island and toggle Move Mode on.
3. Drag near Rin’s body (invisible hit area) and verify window repositions naturally.
4. Toggle Move Mode off and verify normal click behavior returns.
5. Use Zoom In / Zoom Out / Reset Size and verify size changes remain clamped and usable.
6. Verify Vision Island, controls-island, and resize handles remain clickable during and after move/resize.
