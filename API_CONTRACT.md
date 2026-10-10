# Innovation API contract

All endpoints accept and return JSON. The frontend sends complete idea objects so an unpersisted backend never has to resolve opaque client IDs.

- `POST /api/discover` — `{ prompt }` → `DiscoveryIdea[]`
- `POST /api/expand` — `{ idea: IdeaNode, count }` → `IdeaNode[]`
- `POST /api/merge` — `{ ideas: IdeaNode[] }` → `IdeaNode`
- `POST /api/critique` — `{ idea: IdeaNode }` → `CritiqueResult` (partial `evaluations` may be returned)
- `POST /api/improve` — `{ idea: IdeaNode, critique?: CritiqueResult }` → `IdeaNode`

Set `NEXT_PUBLIC_USE_MOCK_API=false` to use these endpoints. Secrets and model calls belong on the server, never in browser code.
