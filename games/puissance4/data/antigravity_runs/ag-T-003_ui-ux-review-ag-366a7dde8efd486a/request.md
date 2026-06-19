You are Antigravity (Developer AG) working inside an Antidex-managed project.
Antidex is file-driven: the orchestrator only proceeds after you write the required files and the final turn marker.

Project cwd: C:\Users\kdeplus\OneDrive - Université Libre de Bruxelles\Bureau\code\Games\puissance4
Task id: T-003_ui-ux-review-ag
AG run id: ag-T-003_ui-ux-review-ag-366a7dde8efd486a
Conversation: REUSE existing project thread

All paths below are relative to the project cwd unless stated otherwise.

Delivery handshake (do FIRST, within 30 seconds):
- Write ACK (atomic) to: data/antigravity_runs/ag-T-003_ui-ux-review-ag-366a7dde8efd486a/ack.json
  - This ACK only proves you received the message; you can write it before reading everything else.

Then read (in order) before doing the real work:
- agents/AG_cursorrules.md
- agents/developer_antigravity.md
- data/tasks/T-003_ui-ux-review-ag/task.md
- data/tasks/T-003_ui-ux-review-ag/manager_instruction.md

Then execute the task described in data/tasks/T-003_ui-ux-review-ag/task.md. If anything is unclear, use the Q/A protocol described in agents/developer_antigravity.md.

Required outputs (file protocol):
- Heartbeat for progress: data/AG_internal_reports/heartbeat.json (update at least every 5 minutes during long work)
  - recommended fields: { updated_at, task_id, stage, note, expected_silence_ms }
  - if you expect a long browser-only period with little filesystem activity, set stage="browser" and expected_silence_ms to help the watchdog avoid false stalls.
- RESULT (atomic): write data/antigravity_runs/ag-T-003_ui-ux-review-ag-366a7dde8efd486a/result.tmp then rename -> data/antigravity_runs/ag-T-003_ui-ux-review-ag-366a7dde8efd486a/result.json
- Task pointer (required): data/tasks/T-003_ui-ux-review-ag/dev_result.json (schema in agents/developer_antigravity.md)
- Pipeline state: update data/pipeline_state.json with developer_status="ready_for_review" and a summary pointing to data/tasks/T-003_ui-ux-review-ag/dev_result.json
- Artifacts (optional but recommended): data/antigravity_runs/ag-T-003_ui-ux-review-ag-366a7dde8efd486a/artifacts (screenshots, exports, etc.)

Finish the turn LAST (atomic turn marker):
- write data/turn_markers/turn-fde8867ec431483a949d.tmp then rename -> data/turn_markers/turn-fde8867ec431483a949d.done (content: ok)

For traceability, this request is stored at: data/antigravity_runs/ag-T-003_ui-ux-review-ag-366a7dde8efd486a/request.md
