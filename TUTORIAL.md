# Add University Research Intelligence to Your AI Agent in 5 Minutes

A practical guide for AI agent developers (LangChain, AutoGen, CrewAI) to add university tech transfer intelligence — institutional reports, researcher profiles, patent landscapes, and funding analysis — to their agents in minutes. No API keys required beyond your Apify token.

## What We're Building

An AI agent that can:
1. Generate full institutional intelligence reports with commercialization scores
2. Find top researchers at any university with publication metrics
3. Map patent landscapes from USPTO and EPO
4. Analyze grant funding by agency (NIH, NSF, DOD)
5. Benchmark multiple institutions side-by-side

## Prerequisites

- Node.js 18+
- An Apify API token ([free account works](https://console.apify.com/settings/integrations))
- An AI agent framework: LangChain, AutoGen, or CrewAI

## The MCPs We're Using

| MCP | Purpose | Cost | Endpoint |
|-----|---------|------|----------|
| `university-research-mcp` | Institution reports, researcher profiles, patents, funding | $0.05-0.15/call | `university-research-mcp.apify.actor` |
| `academic-research-mcp` | Paper search, citations, author profiles | $0.01-0.10/call | `academic-research-mcp.apify.actor` |
| `patent-search-mcp` | Patent lookup by number, citation chains | $0.03-0.05/call | `patent-search-mcp.apify.actor` |
| `healthcare-compliance-mcp` | FDA device approvals, MAUDE, ClinicalTrials | $0.03-0.15/call | `red-cars--healthcare-compliance-mcp.apify.actor` |

**Note:** `university-research-mcp` provides institutional-level intelligence for tech transfer and licensing. Chain it with `academic-research-mcp` for paper-level analysis, `patent-search-mcp` for detailed patent lookup, and `healthcare-compliance-mcp` for clinical trial data.

## Step 1: Add the MCP Servers

### MCP Server Configuration

```json
{
  "mcpServers": {
    "university-research": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "university-research-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "academic-research": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "academic-research-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "patent-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "patent-search-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "healthcare-compliance": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "red-cars--healthcare-compliance-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    }
  }
}
```

### LangChain Configuration

```javascript
import { ApifyAdapter } from "@langchain/community/tools/apify";
import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

const tools = [
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "university-research-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "academic-research-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "patent-search-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "red-cars--healthcare-compliance-mcp",
  }),
];

const agent = await initializeAgentExecutorWithOptions(tools, new ChatOpenAI({
  model: "gpt-4",
  temperature: 0
}), { agentType: "openai-functions" });
```

### AutoGen Configuration

```javascript
import { MCPAgent } from "autogen-mcp";

const universityResearchAgent = new MCPAgent({
  name: "university-research",
  mcpServers: [
    {
      name: "university-research",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "university-research-mcp"],
    },
    {
      name: "academic-research",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "academic-research-mcp"],
    },
    {
      name: "patent-search",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "patent-search-mcp"],
    },
    {
      name: "healthcare-compliance",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "red-cars--healthcare-compliance-mcp"],
    }
  ]
});
```

### CrewAI Configuration

```yaml
# crewai.yaml
tools:
  - name: university_research
    type: apify
    actor_id: university-research-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: academic_research
    type: apify
    actor_id: academic-research-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: patent_search
    type: apify
    actor_id: patent-search-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: healthcare_compliance
    type: apify
    actor_id: red-cars--healthcare-compliance-mcp
    api_token: ${APIFY_API_TOKEN}
```

## Step 2: University Research Queries

### Generate Institution Report

```javascript
const result = await universityResearchAgent.execute({
  action: "institution_report",
  institution: "MIT",
  field: "artificial intelligence"
});

console.log(result);
// Returns: full report with compositeScore (0-100), verdict
// (ACQUIRE_NOW|PARTNER|MONITOR|TOO_EARLY|PASS), top publications,
// patents, grants, researchers, and signal explanations
```

### Get Researcher Profiles

```javascript
const result = await universityResearchAgent.execute({
  action: "researcher_profile",
  institution: "Stanford University",
  field: "machine learning",
  max_results: 10
});

console.log(result);
// Returns: top 10 researchers with name, ORCID,
// works_count, cited_by_count, h_index, top papers
```

### Map Patent Landscape

```javascript
const result = await universityResearchAgent.execute({
  action: "patent_landscape",
  institution: "University of California Berkeley",
  field: "robotics",
  max_results: 20
});

console.log(result);
// Returns: patents with patent_number, title, filing_date,
// status, claims, technology_classification, inventors
```

### Analyze Funding Landscape

```javascript
const result = await universityResearchAgent.execute({
  action: "funding_analysis",
  institution: "Harvard University",
  field: "biomedical",
  max_results: 10
});

console.log(result);
// Returns: grants breakdown by agency (NIH, NSF, DOD),
// with amounts, titles, PIs, and totals by agency
```

### Benchmark Institutions

```javascript
const result = await universityResearchAgent.execute({
  action: "benchmark_institutions",
  institutions: ["MIT", "Stanford", "Carnegie Mellon"],
  field: "computer science"
});

console.log(result);
// Returns: side-by-side comparison with rank, compositeScore,
// scoring breakdown per dimension (commercialization, research
// hotspot, lab intelligence, technology maturity), recommended_actions
```

## Step 3: Chain University + Academic + Patent + Healthcare Intelligence

### Full Example: Tech Transfer Opportunity Assessment

```javascript
import { ApifyClient } from 'apify';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function assessTechTransferOpportunity(university, field) {
  console.log(`=== Tech Transfer Assessment: ${university} ===\n`);

  // Step 1: Get institution report
  console.log('[1/6] Generating institution report...');
  const institution = await apify.call('university-research-mcp', {
    action: 'institution_report',
    institution: university,
    field: field
  });

  // Step 2: Get researcher profiles
  console.log('[2/6] Finding top researchers...');
  const researchers = await apify.call('university-research-mcp', {
    action: 'researcher_profile',
    institution: university,
    field: field,
    max_results: 5
  });

  // Step 3: Map patent landscape
  console.log('[3/6] Mapping patent landscape...');
  const patents = await apify.call('university-research-mcp', {
    action: 'patent_landscape',
    institution: university,
    field: field,
    max_results: 10
  });

  // Step 4: Analyze funding
  console.log('[4/6] Analyzing funding landscape...');
  const funding = await apify.call('university-research-mcp', {
    action: 'funding_analysis',
    institution: university,
    field: field
  });

  // Step 5: Deep dive on top patent with patent-search-mcp
  console.log('[5/6] Getting detailed patent analysis...');
  let patentDetails = null;
  if (patents.data?.patents?.[0]?.patent_number) {
    patentDetails = await apify.call('patent-search-mcp', {
      action: 'get_patent_details',
      patent_number: patents.data.patents[0].patent_number
    });
  }

  // Step 6: Check clinical trials if biomedical
  console.log('[6/6] Checking clinical trials...');
  let clinicalTrials = null;
  if (field.toLowerCase().includes('bio') || field.toLowerCase().includes('med')) {
    clinicalTrials = await apify.call('red-cars--healthcare-compliance-mcp', {
      action: 'search_clinical_trials',
      condition: field,
      phase: 'PHASE3',
      max_results: 5
    });
  }

  // Build report
  const report = {
    institution: {
      name: university,
      compositeScore: institution.data?.compositeScore || 0,
      verdict: institution.data?.verdict || 'UNKNOWN',
      topSignals: institution.data?.allSignals?.slice(0, 5) || []
    },
    researchers: {
      count: researchers.data?.researchers?.length || 0,
      topResearcher: researchers.data?.researchers?.[0]?.name || 'N/A',
      topHIndex: researchers.data?.researchers?.[0]?.h_index || 0
    },
    patents: {
      count: patents.data?.total || 0,
      topPatent: patents.data?.patents?.[0]?.title || 'N/A',
      topPatentNumber: patents.data?.patents?.[0]?.patent_number || 'N/A'
    },
    funding: {
      totalGrants: funding.data?.total || 0,
      topAgency: funding.data?.by_agency?.[0]?.agency || 'N/A',
      topAmount: funding.data?.by_agency?.[0]?.total_amount || 0
    },
    clinicalTrials: clinicalTrials ? {
      phase3Count: clinicalTrials.data?.total || 0,
      trials: clinicalTrials.data?.trials || []
    } : null,
    patentDetails: patentDetails ? {
      abstract: patentDetails.data?.abstract || 'N/A',
      inventors: patentDetails.data?.inventors || [],
      claims: patentDetails.data?.claims?.slice(0, 3) || []
    } : null
  };

  console.log('\n=== TECH TRANSFER SUMMARY ===');
  console.log(`Institution: ${report.institution.name}`);
  console.log(`Composite Score: ${report.institution.compositeScore}/100`);
  console.log(`Verdict: ${report.institution.verdict}`);
  console.log(`Top Researchers: ${report.researchers.count}`);
  console.log(`Patents: ${report.patents.count}`);
  console.log(`Grants: ${report.funding.totalGrants}`);
  if (report.clinicalTrials) {
    console.log(`Phase 3 Clinical Trials: ${report.clinicalTrials.phase3Count}`);
  }

  return report;
}

assessTechTransferOpportunity('MIT', 'artificial intelligence').catch(console.error);
```

### Expected Output

```
=== Tech Transfer Assessment: MIT ===

[1/6] Generating institution report...
[2/6] Finding top researchers...
[3/6] Mapping patent landscape...
[4/6] Analyzing funding landscape...
[5/6] Getting detailed patent analysis...
[6/6] Checking clinical trials...

=== TECH TRANSFER SUMMARY ===
Institution: MIT
Composite Score: 82/100
Verdict: ACQUIRE_NOW
Top Researchers: 5
Patents: 47
Grants: 23
```

## MCP Tool Reference

### University Research MCP

**Endpoint:** `university-research-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `institution_report` | $0.10 | Full institution intelligence brief | `institution`, `field` |
| `researcher_profile` | $0.05 | Top 10 researchers at institution | `institution`, `field`, `max_results` |
| `patent_landscape` | $0.05 | USPTO/EPO patent filings | `institution`, `field`, `max_results` |
| `funding_analysis` | $0.05 | Grant breakdown by agency | `institution`, `field` |
| `benchmark_institutions` | $0.15 | Compare 2-5 institutions | `institutions[]`, `field` |

### Academic Research MCP

**Endpoint:** `academic-research-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `search_papers` | $0.02 | Search 600M+ papers | `query`, `max_results` |
| `author_research_profile` | $0.03 | Author h-index, top papers | `author_name`, `institution` |
| `research_trends` | $0.05 | Topic trends over time | `topic`, `year_from` |

### Patent Search MCP

**Endpoint:** `patent-search-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `get_patent_details` | $0.03 | Patent lookup by number | `patent_number` |
| `find_patent_citations` | $0.05 | Citation chains | `patent_number`, `citation_type` |

### Healthcare Compliance MCP

**Endpoint:** `red-cars--healthcare-compliance-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `search_clinical_trials` | $0.05 | ClinicalTrials.gov search | `condition`, `phase`, `status` |
| `search_fda_approvals` | $0.03 | FDA device approvals | `searchTerm`, `deviceState` |

## Cost Summary

| MCP | Typical Query | Est. Cost |
|-----|---------------|-----------|
| university-research-mcp | Institution report | ~$0.10 |
| university-research-mcp | Researcher profile | ~$0.05 |
| university-research-mcp | Patent landscape | ~$0.05 |
| university-research-mcp | Benchmark (3 institutions) | ~$0.15 |
| patent-search-mcp | Patent details | ~$0.03 |

Full tech transfer assessment (6 MCP calls): ~$0.38 per report

## Next Steps

1. Clone the [university-research-mcp](https://github.com/red-cars-io/university-research-mcp) repo
2. Copy `.env.example` to `.env` and add your `APIFY_API_TOKEN`
3. Run `npm install`
4. Try the examples: `node examples/institution-report.js`

## Related Repositories

- [Academic Research MCP](https://github.com/red-cars-io/academic-research-mcp) - 600M+ papers, citations, author profiles
- [Patent Search MCP](https://github.com/red-cars-io/patent-search-mcp) - Patent lookup by number, citation chains
- [Healthcare Compliance MCP](https://github.com/red-cars-io/healthcare-compliance-mcp) - FDA device approvals, MAUDE, ClinicalTrials
- [Drug Intelligence MCP](https://github.com/red-cars-io/drug-intelligence-mcp) - FDA drug labels, adverse events, drug interactions
- [Tech Scouting Report MCP](https://github.com/red-cars-io/tech-scouting-report-mcp) - Technology commercialization intelligence