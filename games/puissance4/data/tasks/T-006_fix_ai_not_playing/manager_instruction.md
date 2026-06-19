# Instructions Manager — T-006_fix_ai_not_playing

Task must be done by `developer_antigravity` (per doc/TODO.md).

## Goal
Fix the bug where the AI never plays in vs AI mode (Easy + Hard). After the human move, the AI must automatically play its turn within 1–2 seconds without freezing the UI.
Also fix the contrast issue for the game mode <select> so the selected option text is readable.

## Scope Hints
- Verify the AI trigger after a human move (mode switch, currentPlayer, turn indicator).
- Check AI scheduling (setTimeout / async flow) and imports/exports.
- Ensure undo logic (T-005) does not block the AI turn.

## Deliverables (AG)
- `data/antigravity_runs/<runId>/ack.json` then `result.json` (atomic)
- Pointer: `data/tasks/T-006_fix_ai_not_playing/dev_result.json`
- Code changes applied and files listed in the result

## Tests
- Run the manual AI checklist from `doc/TESTING_PLAN.md` (Easy + Hard) and report results.

## Definition of Done
- AI Easy and Hard play automatically in vs AI mode.
- No UI freeze; turn indicator updates correctly.
- Game mode select contrast is readable.
