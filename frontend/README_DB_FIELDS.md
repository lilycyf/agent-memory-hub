# Database Fields Reference

This document reflects the live database schema after removing deprecated `tracks` and `categories` from `public.entities`.

## Scope

- Database: Supabase Postgres (`public` schema)
- Tables covered:
  - `public.entities`
  - `public.qa_items`
- Notes:
  - `nullable = NO` means DB-level required field.
- `jsonb` fields are returned as JSON objects.
  - `numeric` is read as number/decimal in application code.

## `public.entities`

### Field definitions

| Field | Type | Nullable | Meaning |
|---|---|---|---|
| `entity_id` | text | NO | Unique entity identifier (e.g. `github:owner/repo`). |
| `name` | text | NO | Display name of the project/entity. |
| `github_url` | text | YES | GitHub repository URL. |
| `github_full_name` | text | YES | GitHub full repo name (`owner/repo`). |
| `github_default_branch` | text | YES | Default branch name on GitHub. |
| `arxiv_url` | text | YES | Linked arXiv URL. |
| `tag_flags` | jsonb | NO | Tag boolean map keyed by taxonomy tag (`true` = selected, `false` = unselected). |
| `created_at` | timestamp with time zone | NO | Record creation timestamp in DB. |
| `updated_at` | timestamp with time zone | NO | Record update timestamp in DB. |
| `description` | text | YES | Project description text. |
| `homepage_url` | text | YES | Project homepage URL. |
| `docs_url` | text | YES | Documentation URL. |
| `license` | text | YES | Repository license string. |
| `primary_language` | text | YES | Main programming language. |
| `stargazers_count` | integer | YES | GitHub stars count. |
| `forks_count` | integer | YES | GitHub forks count. |
| `open_issues_count` | integer | YES | Open issues count. |
| `watchers_count` | integer | YES | GitHub watchers count. |
| `subscribers_count` | integer | YES | GitHub subscribers count. |
| `repo_created_at` | timestamp with time zone | YES | Repository creation time on GitHub. |
| `repo_updated_at` | timestamp with time zone | YES | Repository update time on GitHub. |
| `repo_pushed_at` | timestamp with time zone | YES | Last push time on GitHub. |
| `arxiv_id` | text | YES | arXiv ID. |
| `arxiv_title` | text | YES | arXiv paper title. |
| `arxiv_match_type` | text | NO | Match type between repo and paper (`official` / `lineage` / `related` / `none`). |
| `arxiv_confidence` | numeric | NO | Matching confidence score (0-1). |
| `source_snapshot_at` | timestamp with time zone | YES | Snapshot timestamp for source ingestion. |
| `ingest_version` | text | YES | Ingestion pipeline/version marker. |

### Frontend mapping (important)

The frontend API does **not** return every DB field directly. In `src/lib/repository.ts`, only a selected subset is returned and mapped:

- Returned directly/with rename:
  - `entity_id -> entityId`
  - `github_full_name -> githubFullName`
  - `github_url -> githubUrl`
  - `tag_flags -> tags` (frontend reconstructs `tags: string[]` from `true` keys)
  - `primary_language -> language`
  - `repo_updated_at -> repoUpdatedAt`
- Nested under `stats`:
  - `stargazers_count -> stats.stars`
  - `forks_count -> stats.forks`
  - `open_issues_count -> stats.openIssues`
- Nested under `arxiv`:
  - `arxiv_id -> arxiv.id`
  - `arxiv_url -> arxiv.url`
  - `arxiv_title -> arxiv.title`
  - `arxiv_match_type -> arxiv.matchType`
  - `arxiv_confidence -> arxiv.confidence`
- Not currently returned by API (examples):
  - `github_default_branch`, `watchers_count`, `subscribers_count`, `repo_created_at`, `repo_pushed_at`, `source_snapshot_at`, `ingest_version`, `created_at`, `updated_at`

## `public.qa_items`

### Field definitions

| Field | Type | Nullable | Meaning |
|---|---|---|---|
| `entity_id` | text | NO | Linked entity ID (`public.entities.entity_id`). |
| `question_no` | integer | NO | Question sequence number. |
| `section` | text | NO | Question section/category. |
| `question` | text | NO | Question text. |
| `answer` | text | NO | Answer text. |
| `confidence` | numeric | NO | Answer confidence score. |
| `evidence` | jsonb | NO | Structured evidence list (url/snippet/path/lines/source, etc.). |
| `created_at` | timestamp with time zone | NO | Record creation timestamp. |
| `updated_at` | timestamp with time zone | NO | Record update timestamp. |

### Frontend mapping

For `qa_items`, API currently maps only:

- `question_no -> id`
- `section -> section`
- `question -> question`
- `answer -> answer`
- `confidence -> confidence`

`evidence`, `created_at`, `updated_at` are currently not exposed in API responses.

## Sample row keys (live DB)

- `entities` sample key count: `29`
- `qa_items` sample key count: `9`

If you want, I can also generate a JSON schema file (e.g. `frontend/docs/db-schema.json`) from the same DB introspection result for downstream validation/codegen.
