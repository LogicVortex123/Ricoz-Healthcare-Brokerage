# Local reference materials

Files copied from elsewhere on this machine into the repo so internship research and earlier prototype work stay with the main PracticeBridge codebase.

| File | Original location |
| --- | --- |
| `Healthcare Practice Transition Brokerage project.jpeg` | Desktop |
| `Healthcare Practice Transition Brokerage Platform — Complete PRD (v2.0).pdf` | Downloads |
| `Dental Practice Transition Brokerage Platform (India-first) Research and PRD.pdf` | Downloads |

The earlier Ricoz Innovation prototype lives in `archive/ricoz-innovation-prototype/` (source and docs only; no `node_modules`, `.next`, or local MongoDB data).

Not stored in git (by design): secrets (`.env`), dependencies (`node_modules`), and build output (`.next`, `dist`). Those are restored with `npm install` and `npm run build`.
