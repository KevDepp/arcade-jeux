# T-006 Fix AI Not Playing

Assigned developer: `developer_antigravity`

## Bug Description
In vs AI mode (Easy and Hard), the AI never plays. After the human move, the turn switches to the AI, but no move is made and the game is blocked.

## Objective
- Identify why the AI trigger is not firing (import/export, state/turn handling, async scheduling, etc.).
- Fix the bug so both Easy and Hard AI play correctly.
- Also fix the contrast on the game mode <select> so the selected text is readable.

## Definition of Done
- AI Easy and Hard play automatically within 1–2 seconds without freezing the UI.
- Manual AI checklist in `doc/TESTING_PLAN.md` passes.
- Game mode select contrast is readable.
