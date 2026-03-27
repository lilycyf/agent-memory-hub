# New Memory Framework Onboarding Guide

This guide defines the required information and validation steps when adding a new memory framework to the index.

## 1) Deliverables Checklist

- One framework record in `public.entities` (required core fields completed)
- 38 Q&A records in `public.qa_items` (`question_no` 1..38)
- At least one evidence item per Q&A in `qa_items.evidence` (stored even if frontend currently shows only Q&A text)
- One source markdown file named like `xxx_Q1-Q38_YYYY-MM-DD.md` at repo root

## 2) Required Framework Metadata (`public.entities`)

Minimum required for usable frontend display:

- `entity_id` (required): use `github:owner/repo`
- `name` (required): short display name, e.g. `mem0`
- `github_url`
- `github_full_name` (`owner/repo`)
- `description`
- `tag_flags` (required jsonb map; taxonomy tag -> boolean)
- `arxiv_match_type` (required): `official` | `lineage` | `related` | `none`
- `arxiv_confidence` (required numeric 0..1)

Strongly recommended:

- `homepage_url`
- `docs_url`
- `license`
- `primary_language`
- `stargazers_count`, `forks_count`, `open_issues_count`
- `repo_updated_at`
- `arxiv_id`, `arxiv_url`, `arxiv_title` (when applicable)

## 3) Required Q&A Data (`public.qa_items`)

For each framework, insert exactly 38 rows:

- `entity_id`: must match the framework `entity_id`
- `question_no`: integer from 1 to 38, no gaps, no duplicates
- `section`: section label used by UI grouping
- `question`: the canonical question text
- `answer`: extracted answer text (can be `unknown` if truly unavailable)
- `confidence`: numeric in [0, 1]
- `evidence` (jsonb): structured evidence list for traceability

### Evidence JSON Suggested Shape

Store an array of evidence objects, e.g.:

```json
[
  {
    "source": "README.md",
    "url": "https://github.com/owner/repo/blob/main/README.md",
    "path": "README.md",
    "lines": "120-155",
    "snippet": "..."
  }
]
```

Notes:

- `evidence` is required in DB even if frontend currently does not render it directly.
- Prefer primary sources: official docs, repo code, official blog, arXiv paper.

## 4) Data Collection Process (Recommended Order)

1. Identify framework target:
   - GitHub repo, owner/repo, homepage, docs
2. Collect repo metadata:
   - language, stars/forks/issues, license, updated_at
3. Determine paper linkage:
   - `official` if direct paper for this framework
   - `lineage` or `related` only with explicit rationale
   - `none` if no credible match
4. Produce Q1..Q38 answers:
   - derive from code/docs, not assumptions
   - assign calibrated confidence
5. Attach evidence for every answer:
   - include URL/path/lines/snippet where possible
6. Run pre-ingest validation (Section 6)
7. Insert/update DB rows
8. Verify in UI (`/framework` and `/framework/[slug]`)

## 5) Tagging Rules

- Only use taxonomy-approved tags
- Prefer specific technical tags over vague labels
- Keep tags concise and composable (storage, retrieval, model, infra, config)
- Remove duplicates and normalize case/style to project conventions

## 6) Pre-Ingest Validation Checklist

### Framework Record Validation

- `entity_id` matches `github_full_name` logically (`github:owner/repo`)
- `github_url` is reachable and consistent with `github_full_name`
- `arxiv_match_type` is set and `arxiv_confidence` in [0,1]
- If `arxiv_url` exists, `arxiv_match_type` should not be `none`
- `tag_flags` contains only taxonomy-approved keys
- at least one taxonomy tag is set to `true`

### Q&A Validation

- Exactly 38 rows exist for this `entity_id`
- `question_no` complete set = {1..38}
- `confidence` always in [0,1]
- `evidence` present and non-empty for each row
- `unknown` answers are justified (not due to missing review)

## 7) Frontend Visibility Notes

Current frontend views depend on:

- Framework list page: `/framework`
- Framework detail page: `/framework/[slug]`
- Compare page: `/compare`

Currently mapped fields used by frontend:

- `entity_id -> entityId`
- `github_full_name -> githubFullName`
- `github_url -> githubUrl`
- `primary_language -> language`
- `repo_updated_at -> repoUpdatedAt`
- `stargazers_count/forks_count/open_issues_count -> stats`
- `arxiv_* -> arxiv.*`

Q&A mapping currently includes:

- `question_no`, `section`, `question`, `answer`, `confidence`

`qa_items.evidence` is stored for auditability and future rendering.

## 8) Naming & File Conventions

- Q&A research file: `frameworkName_Q1-Q38_YYYY-MM-DD.md`
- Use consistent question numbering and section headers
- Prefer UTC date format in filenames

## 9) Quality Bar (Do/Don't)

Do:

- cite concrete source lines/URLs
- distinguish official paper vs related work
- keep confidence realistic

Don't:

- infer architecture claims without source evidence
- set all confidences to the same value
- leave broken URLs or stale repo metadata unchecked

## 10) Quick Handoff Template

Use this template when handing off a newly onboarded framework:

- Framework: `<name>` (`github:owner/repo`)
- Repo: `<url>`
- Docs/Homepage: `<url>` / `<url>`
- arXiv: `<id/url or none>` (`match_type=<...>`, `confidence=<...>`)
- Tags: `<tag1, tag2, ...>`
- Q&A coverage: `38/38`
- Evidence coverage: `<N>/38 non-empty evidence`
- Notes/Risks: `<any uncertainty or pending verification>`
