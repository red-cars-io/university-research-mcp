# University Research MCP Server

Generate institutional reports, researcher profiles, patent landscapes, and funding analysis from 8 academic databases for university tech transfer and VC workflows. No API keys required.

## What This MCP Does

The University Research MCP server wraps five academic research capabilities into one unified interface:
- **institution_report** — Full intelligence brief on any university or research institution with commercialization scoring (0-100) and investment verdict (ACQUIRE_NOW | PARTNER | MONITOR | TOO_EARLY | PASS)
- **researcher_profile** — Top 10 researchers at an institution with publication counts, citation metrics, and ORCID data
- **patent_landscape** — Patent filings from USPTO and EPO with filing status, claims, and technology classification
- **funding_analysis** — Grant breakdown by agency (NIH, NSF, DOD) with funding amounts and project descriptions
- **benchmark_institutions** — Compare 2-5 institutions across all scoring dimensions

## Why AI Agents Need This

University tech transfer offices, VC analysts, and corporate development teams need structured research intelligence on academic institutions. University Research MCP aggregates OpenAlex, arXiv, USPTO, EPO, NIH Reporter, Grants.gov, and ORCID into one call — what would otherwise require 8 separate API integrations and weeks of normalization work.

## Quick Start

1. Connect via MCP protocol to `mcp.apify.com`
2. Call `institution_report` with an institution name
3. Receive full report with composite scores, verdict, and signal explanations

## MCP Tools

### institution_report

**Purpose:** Full intelligence brief on any university or research institution with commercialization scoring.

**Input:**
```json
{
  "institution": "string (required)",
  "field": "string (optional)",
  "department": "string (optional)"
}
```

**Output:** Full report with compositeScore (0-100), verdict (ACQUIRE_NOW|PARTNER|MONITOR|TOO_EARLY|PASS), recommendations, allSignals, scoring breakdown, dataSource counts, and top publications/patents/grants/researchers/preprints.

**When to call:** Tech transfer evaluation, VC due diligence, academic partnership assessment, investment research.

### researcher_profile

**Purpose:** Top 10 researchers at an institution with metrics.

**Input:**
```json
{
  "institution": "string (required)",
  "field": "string (optional)"
}
```

**Output:** Array of researchers with name, ORCID, works_count, cited_by_count, h_index.

### patent_landscape

**Purpose:** Top patents from USPTO and EPO for an institution or field.

**Input:**
```json
{
  "institution": "string (required)",
  "field": "string (optional)"
}
```

**Output:** Array of patents with patent_number, title, filing_date, status, claims, technology_classification, inventors.

### funding_analysis

**Purpose:** Grant funding breakdown by agency for an institution.

**Input:**
```json
{
  "institution": "string (required)",
  "field": "string (optional)"
}
```

**Output:** Grants array with agency, amount, title, PI, institution, and totals by agency.

### benchmark_institutions

**Purpose:** Compare 2-5 institutions across all scoring dimensions.

**Input:**
```json
{
  "institutions": ["string"] (required, 2-5),
  "field": "string (optional)"
}
```

**Output:** Comparisons with rank, compositeScore, scoring breakdown per dimension, and recommended_actions.

## Data Sources

- **OpenAlex** — 250M+ academic works, research institutions
- **arXiv** — 2.4M+ STEM preprints
- **USPTO** — US patent filings
- **EPO** — European patents
- **NIH Reporter** — Grant funding
- **Grants.gov** — Federal grant opportunities
- **ORCID** — Researcher profiles

## Pricing (Pay-Per-Event)

| Event | Price |
|-------|-------|
| institution_report | $0.10 |
| researcher_profile | $0.05 |
| patent_landscape | $0.05 |
| funding_analysis | $0.05 |
| benchmark_institutions | $0.15 |
| apify-actor-start | $0.00005 |

## Verdict System

| Composite Score | Verdict |
|-----------------|---------|
| 75+ | ACQUIRE_NOW |
| 55-74 | PARTNER |
| 35-54 | MONITOR |
| 15-34 | TOO_EARLY |
| <15 | PASS |

**Overrides:**
- WORLD_CLASS lab + commercialization ≥60 → ACQUIRE_NOW
- TRL ≥6 + weak lab <30 → MONITOR

## Scoring Models (4)

### Commercialization Readiness (30% weight)
- Pub-to-patent conversion ratio (max 30 pts)
- Patent recency 2024+ (max 25 pts)
- Grant funding log10 formula (max 25 pts)
- TRL keyword scanning (max 20 pts)

### Research Hotspot Detection (20% weight)
- ArXiv preprint velocity (max 30 pts)
- Citation density (max 30 pts)
- Researcher density (max 20 pts)
- Cross-source confirmation (max 20 pts)

### Lab Intelligence Profiling (25% weight)
- PI productivity (max 30 pts)
- Grant portfolio diversity (max 25 pts)
- IP volume (max 25 pts)
- Publication breadth (max 20 pts)

### Technology Maturity Assessment (25% weight)
- Weighted TRL average (max 35 pts)
- Patent grant ratio (max 25 pts)
- Landmark papers 100+ citations (max 20 pts)
- SBIR/STTR signals (max 20 pts)

## Use Cases

1. **Corporate Development/M&A** — Rank academic spinout targets by composite score
2. **Venture Capital** — Evaluate founding labs for deep tech investments
3. **Technology Licensing** — Find institutions with 30%+ conversion ratios
4. **Government Science Agencies** — Map institutional strengths for grant allocation
5. **University Benchmarking** — Compare commercialization performance vs. peers

## Limitations

- Patent data requires Google Patents API (not included in v1.0)
- ORCID coverage is opt-in — unregistered researchers invisible
- USPTO/EPO data lags 12-18 months
- Grants.gov = opportunities, NIH = historical awards

## Related MCPs

- **academic-research-mcp** — General academic paper search, citations, author profiles
- **web-intelligence-mcp** — Website reading and contact extraction
- **company-intelligence-mcp** — Company enrichment and sanctions screening
- **email-intelligence-mcp** — Email finding and verification

## Connect

- **Apify:** https://apify.com/university-research-mcp
- **GitHub:** https://github.com/red-cars-io/university-research-mcp
- **MCP Endpoint:** `https://university-research-mcp.apify.actor/mcp`

---

## SEO Keywords

tech transfer MCP, university intelligence, TRL assessment, commercialization scoring, institutional research report, patent landscape, researcher profile API, NIH grants lookup, ORCID search, no API key needed, AI agent, MCP server, VC due diligence university, academic spinout evaluation