# AGENTS.md

## Git Automation Rule
- Whenever a module is updated, automatically run:
  1. `git add <changed-files>`
  2. `git commit -m "chore(module): update <module-name>"`
  3. `git push origin <current-branch>`
- If there are no file changes, skip commit and push.
