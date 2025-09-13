# Games API Roadmap (Rebrand Transition 2.1.x → 3.0.0)

Status: Transitional. Current production dataset = Shakespeare productions. This roadmap introduces a general Games domain while keeping production endpoints stable.

## Guiding Principles
- Non-breaking incremental introduction (`/api/games` additive first)
- Clear deprecation headers when/if production endpoints are superseded
- Consistent response envelope pattern with existing API (`Response`, `Error`, etc.)
- Avoid premature schema complexity: start with minimal normalized fields; allow enrichment later

## Phase 1 – Data Foundations (2.2.0)
Deliverables:
- `data/sample-games.json` (5–10 representative records)
- Loader: `lib/games-data.js` (mirrors productions loader pattern)
- Shape (initial):
```jsonc
{
  "id": "game_1",          // stable opaque id
  "title": "The Legend of Zelda: Tears of the Kingdom",
  "release_year": 2023,
  "platforms": ["Switch"],
  "genres": ["Action-Adventure"],
  "developer": "Nintendo",
  "publisher": "Nintendo",
  "external_url": "https://example.com/zelda",
  "summary": "Short description..."
}
```
- Derived fields: none initially (e.g., slug computed on demand if needed)

Tasks:
1. Create sample JSON
2. Implement loader with optional private dataset override at `internal/enhanced-games.json`
3. Unit test for loader shape & fallback

## Phase 2 – Read Endpoints (2.2.0)
Endpoints (Netlify function additions or extension of existing `api.js`):
- `GET /api/games` – paginated list
  - Query params: `page`, `pageSize`, `title`, `year`, `platform`, `genre`, `developer`
- `GET /api/games/{id}` – direct lookup
- `GET /api/games/search` (optional) OR reuse `/api/games?s=` consolidated pattern (prefer consistent root style used by productions root: keep simpler: `GET /api/games?s=zelda`)

Response examples:
```json
{
  "Response": "True",
  "totalResults": 1,
  "games": [{ ... }]
}
```
Errors mirror current format:
```json
{ "Response": "False", "Error": "Game not found" }
```

Tasks:
1. Add routing in a new function `games.js` (parallel to `productions.js`) OR extend monolithic `api.js` with a path segment check
2. Shared pagination util (consider small helper in `lib/paginate.js`)
3. Tests: list, filter by title substring, 404 unknown id

## Phase 3 – Indexing & Search (2.3.0)
- Add Postgres table `games` (id, title, release_year, developer, publisher, platforms TEXT[], genres TEXT[], search_vector tsvector)
- SQL migration + trigger for search_vector
- Update function: if `USE_DB_GAMES=1` perform DB-backed search else in-memory
- Add filter clauses for platform/genre (array containment) – use `platforms @> ARRAY[$1]` pattern

## Phase 4 – Extended Metadata (2.4.0)
Add optional enrichment fields:
- `rating_esrb`, `rating_pegi`
- `metacritic_score`
- `play_modes` (e.g., `Single-player`, `Co-op`)
- `tags` (free-form array)
Versioning Strategy:
- Introduce fields additive only; no breaking changes

## Phase 5 – Rate Limit & Pricing Adjustments (2.5.0)
- Introduce plan-based access gating to enriched fields (e.g., advanced fields only on Professional+)
- Add response header `X-Fields-Restricted: true` when fields omitted

## Phase 6 – Deprecation Review (Pre-3.0.0)
- Decide if productions remain first-class or move to separate subdomain / optional addon
- Provide deprecation notice headers for any endpoints planned for removal two minor versions ahead

## Data Quality & Integrity
- ID policy: never reuse IDs; opaque strings (`game_<nanoid>`) to allow backend migration freedom
- Validation: lightweight JSON Schema in `scripts/validate-games.js` (stretch goal)

## Testing Matrix
- Unit: loaders (games-data)
- Integration: /api/games list, search, filter, 404
- Performance smoke: ensure <150ms p95 in-memory for 1k records (synthetic test script)

## OpenAPI Spec Updates
- Add `Game` schema, `PaginatedGames`, `SearchGamesResponse`
- Tag endpoints with `Games` tag; maintain separate `Productions` tag

## Security & Abuse Considerations
- Same API key validation path; no separate quota initially
- Potential future: separate quota buckets per domain (games vs productions)

## Milestone Summary
| Version | Focus | Notes |
|---------|-------|-------|
| 2.2.0 | Sample data + basic /api/games endpoints | In-memory only |
| 2.3.0 | Postgres search + filtering | Feature flag `USE_DB_GAMES` |
| 2.4.0 | Enrichment fields | Additive fields |
| 2.5.0 | Pricing & restricted fields | Headers to signal omissions |
| 3.0.0 | Potential deprecations | Announce ≥2 minors prior |

## Immediate Next Steps
1. Create `data/sample-games.json`
2. Implement `lib/games-data.js`
3. New Netlify function `games.js` with list & detail
4. Add tests in `tests/games.basic.test.js`
5. OpenAPI add schemas + paths (tagged)

---
Owner: @greg.robleto
Last Updated: (auto) Rebrand 2.1.0
