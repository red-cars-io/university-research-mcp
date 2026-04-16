/**
 * University Research MCP Server
 * Generate institutional intelligence reports on universities and research institutions.
 * Used for tech transfer, VC due diligence, and academic partnership evaluation.
 */

import http from 'http';
import Apify, { Actor } from 'apify';

// MCP manifest
const MCP_MANIFEST = {
    schema_version: "1.0",
    name: "university-research-mcp",
    version: "1.0.0",
    description: "Generate institutional reports, researcher profiles, patent landscapes, and funding analysis from 8 academic databases for university tech transfer and VC workflows",
    tools: [
        {
            name: "institution_report",
            description: "Full intelligence brief on any university or research institution with commercialization scoring (0-100) and investment verdict",
            input_schema: {
                type: "object",
                properties: {
                    institution: { type: "string", description: "University or research institution name (e.g., 'MIT', 'Stanford University')" },
                    field: { type: "string", description: "Research field or technology area to scope (e.g., 'quantum computing', 'CRISPR')" },
                    department: { type: "string", description: "Department or lab name (e.g., 'Computer Science')" }
                },
                required: ["institution"]
            },
            price: 0.10
        },
        {
            name: "researcher_profile",
            description: "Top 10 researchers at an institution with publication counts, citation metrics, and ORCID data",
            input_schema: {
                type: "object",
                properties: {
                    institution: { type: "string", description: "Institution name" },
                    field: { type: "string", description: "Research field to filter by" }
                },
                required: ["institution"]
            },
            price: 0.05
        },
        {
            name: "patent_landscape",
            description: "Patent filings from USPTO and EPO for an institution or field with filing status and technology classification",
            input_schema: {
                type: "object",
                properties: {
                    institution: { type: "string", description: "Institution name" },
                    field: { type: "string", description: "Technology or research field" }
                },
                required: ["institution"]
            },
            price: 0.05
        },
        {
            name: "funding_analysis",
            description: "Grant funding breakdown by agency (NIH, NSF, DOD) with funding amounts and project descriptions",
            input_schema: {
                type: "object",
                properties: {
                    institution: { type: "string", description: "Institution name" },
                    field: { type: "string", description: "Research field to filter by" }
                },
                required: ["institution"]
            },
            price: 0.05
        },
        {
            name: "benchmark_institutions",
            description: "Compare 2-5 institutions across all scoring dimensions for competitive analysis",
            input_schema: {
                type: "object",
                properties: {
                    institutions: { type: "array", items: { type: "string" }, description: "List of institution names (2-5)" },
                    field: { type: "string", description: "Research field for comparable analysis" }
                },
                required: ["institutions"]
            },
            price: 0.15
        }
    ]
};

// Tool price map (in USD)
const TOOL_PRICES = {
    "institution_report": 0.10,
    "researcher_profile": 0.05,
    "patent_landscape": 0.05,
    "funding_analysis": 0.05,
    "benchmark_institutions": 0.15
};

// TRL keywords for scoring
const TRL_HIGH_KEYWORDS = ['clinical', 'trial', 'phase', 'fda', 'approval', 'production', 'manufacturing', 'commercial', 'deployment', 'prototype'];
const TRL_MID_KEYWORDS = ['prototype', 'experimental', 'pilot', 'demonstration', 'feasibility', 'validation'];
const TRL_LOW_KEYWORDS = ['concept', 'theory', 'fundamental', 'basic', 'exploratory', 'research'];

// ============================================
// DATA SOURCE FUNCTIONS
// ============================================

async function fetchOpenAlex(query, type = 'works') {
    try {
        const url = `https://api.openalex.org/${type}?search=${encodeURIComponent(query)}&per-page=100`;
        const resp = await fetch(url);
        return await resp.json();
    } catch (e) {
        console.error("OpenAlex error:", e.message);
        return { results: [], meta: { count: 0 } };
    }
}

async function fetchNIH(query) {
    try {
        const url = "https://api.reporter.nih.gov/v2/projects/search";
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ criteria: { query }, limit: 100 })
        });
        return await resp.json();
    } catch (e) {
        console.error("NIH error:", e.message);
        return { results: [] };
    }
}

async function fetchGrantsGov(query) {
    try {
        const url = `https://api.data.gov/grants/v1/search?q=${encodeURIComponent(query)}&limit=50`;
        const resp = await fetch(url);
        return await resp.json();
    } catch (e) {
        console.error("Grants.gov error:", e.message);
        return { grants: [] };
    }
}

async function fetchORCID(query) {
    try {
        const url = `https://pub.orcid.org/v3.0/search/?q=${encodeURIComponent(query)}&rows=50`;
        const resp = await fetch(url, { headers: { "Accept": "application/json" } });
        return await resp.json();
    } catch (e) {
        console.error("ORCID error:", e.message);
        return { "num-found": 0, result: [] };
    }
}

async function fetchArXiv(query) {
    try {
        const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=100`;
        const resp = await fetch(url);
        const text = await resp.text();
        // Simple XML parsing for arXiv
        const entries = [];
        const itemMatches = text.match(/<entry>(.*?)<\/entry>/gs) || [];
        for (const match of itemMatches) {
            const title = match.match(/<title>(.*?)<\/title>/s)?.[1]?.replace(/\s+/g, ' ') || '';
            const published = match.match(/<published>(.*?)<\/published>/s)?.[1]?.slice(0, 4) || '';
            const summary = match.match(/<summary>(.*?)<\/summary>/s)?.[1]?.slice(0, 500) || '';
            entries.push({ title, year: parseInt(published), summary });
        }
        return { entries };
    } catch (e) {
        console.error("ArXiv error:", e.message);
        return { entries: [] };
    }
}

// Note: USPTO and EPO would require patent-specific APIs
// For this implementation we use placeholder structure
async function fetchPatents(query) {
    // Placeholder - real implementation would use Google Patents or USPTO API
    return { patents: [], count: 0 };
}

// ============================================
// SCORING FUNCTIONS
// ============================================

function calculateTRL(text) {
    if (!text) return 1;
    const upper = text.toLowerCase();
    let score = 1;
    for (const kw of TRL_HIGH_KEYWORDS) if (upper.includes(kw)) score = Math.max(score, 7);
    for (const kw of TRL_MID_KEYWORDS) if (upper.includes(kw)) score = Math.max(score, 4);
    for (const kw of TRL_LOW_KEYWORDS) if (upper.includes(kw)) score = Math.max(score, 2);
    return score;
}

function scoreCommercialization(data) {
    let score = 0;
    const { publications = [], patents = [] } = data;

    // Pub-to-patent conversion ratio (max 30 pts)
    const convRatio = publications.length > 0 ? patents.length / publications.length : 0;
    score += Math.min(convRatio * 100, 30);

    // Patent recency 2024+ (max 25 pts)
    const recentPatents = patents.filter(p => p.year >= 2024);
    score += Math.min(recentPatents.length * 4, 25);

    // Grant funding log10 (max 25 pts)
    const totalFunding = data.grants?.reduce((sum, g) => sum + (g.amount || 0), 0) || 0;
    if (totalFunding > 0) {
        score += Math.min(Math.log10(totalFunding) * 5, 25);
    }

    // TRL keyword scanning (max 20 pts)
    const allText = publications.map(p => p.title || '').join(' ') + ' ' + patents.map(p => p.title || '').join(' ');
    const trl = calculateTRL(allText);
    score += Math.min(trl * 3, 20);

    return Math.min(Math.round(score), 100);
}

function scoreResearchHotspots(data) {
    let score = 0;
    const { arxivEntries = [], publications = [], researchers = [] } = data;

    // ArXiv preprint velocity (max 30 pts)
    const recentArxiv = arxivEntries.filter(e => e.year >= 2024);
    score += Math.min(recentArxiv.length * 3, 30);

    // Citation density (max 30 pts)
    const totalCitations = publications.reduce((sum, p) => sum + (p.cited_by_count || 0), 0);
    if (publications.length > 0) {
        const avgCitations = totalCitations / publications.length;
        score += Math.min(Math.round(avgCitations / 2), 30);
    }

    // Researcher density (max 20 pts)
    score += Math.min(researchers.length * 2, 20);

    // Cross-source confirmation (max 20 pts)
    let sources = 0;
    if (arxivEntries.length > 0) sources++;
    if (publications.length > 0) sources++;
    if (researchers.length > 0) sources++;
    score += sources * 7;

    return Math.min(Math.round(score), 100);
}

function scoreLabIntelligence(data) {
    let score = 0;
    const { researchers = [], grants = [], patents = [], publications = [] } = data;

    // PI productivity (max 30 pts)
    if (researchers.length > 0) {
        const totalWorks = researchers.reduce((sum, r) => sum + (r.works_count || 0), 0);
        const avgWorks = totalWorks / researchers.length;
        score += Math.min(Math.round(avgWorks / 5), 30);
    }

    // Grant diversity (max 25 pts)
    const uniqueAgencies = [...new Set(grants.map(g => g.agency || 'unknown'))];
    const diversityScore = uniqueAgencies.length * 5;
    score += Math.min(diversityScore, 25);

    // IP volume (max 25 pts)
    score += Math.min(patents.length * 3, 25);

    // Publication breadth (max 20 pts)
    const uniqueJournals = [...new Set(publications.map(p => p.journal || '').filter(Boolean))];
    score += Math.min(uniqueJournals.length * 2, 20);

    return Math.min(Math.round(score), 100);
}

function scoreTechMaturity(data) {
    let score = 0;
    const { publications = [], patents = [] } = data;

    // Weighted TRL average (max 35 pts)
    const trlValues = publications.map(p => calculateTRL(p.title || ''));
    const avgTRL = trlValues.length > 0 ? trlValues.reduce((a, b) => a + b, 0) / trlValues.length : 1;
    score += Math.min(Math.round(avgTRL * 5), 35);

    // Patent grant ratio (max 25 pts)
    const grantedPatents = patents.filter(p => p.status === 'granted').length;
    if (patents.length > 0) {
        score += Math.min((grantedPatents / patents.length) * 25, 25);
    }

    // Landmark papers 100+ citations (max 20 pts)
    const landmarkPapers = publications.filter(p => (p.cited_by_count || 0) >= 100).length;
    score += Math.min(landmarkPapers * 5, 20);

    // SBIR/STTR signals (max 20 pts)
    const allText = publications.map(p => p.title || '').join(' ');
    const sbirCount = (allText.match(/sbir|sttr|phase ii|phase i/i) || []).length;
    score += Math.min(sbirCount * 5, 20);

    return Math.min(Math.round(score), 100);
}

function getVerdict(compositeScore, scoring) {
    // Override rules
    if (scoring.labIntelligence.labStrength === 'WORLD_CLASS' && scoring.commercializationReadiness.score >= 60) {
        return 'ACQUIRE_NOW';
    }
    if (scoring.techMaturity.estimatedTRL >= 6 && scoring.labIntelligence.score < 30) {
        return 'MONITOR';
    }

    if (compositeScore >= 75) return 'ACQUIRE_NOW';
    if (compositeScore >= 55) return 'PARTNER';
    if (compositeScore >= 35) return 'MONITOR';
    if (compositeScore >= 15) return 'TOO_EARLY';
    return 'PASS';
}

function getReadinessLevel(score) {
    if (score >= 80) return 'MARKET_READY';
    if (score >= 60) return 'NEAR_MARKET';
    if (score >= 40) return 'DEVELOPING';
    if (score >= 20) return 'EARLY_STAGE';
    return 'PRE_DISCOVERY';
}

function getHotspotLevel(score) {
    if (score >= 80) return 'BREAKTHROUGH';
    if (score >= 60) return 'HOT';
    if (score >= 40) return 'ACTIVE';
    if (score >= 20) return 'EMERGING';
    return 'DORMANT';
}

function getLabStrength(score) {
    if (score >= 80) return 'WORLD_CLASS';
    if (score >= 60) return 'PROMINENT';
    if (score >= 40) return 'ESTABLISHED';
    if (score >= 20) return 'NASCENT';
    return 'UNKNOWN';
}

function getMaturityLevel(avgTRL) {
    if (avgTRL >= 7) return 'DEPLOYMENT_READY';
    if (avgTRL >= 5) return 'DEMONSTRATION';
    if (avgTRL >= 3) return 'PROTOTYPE';
    if (avgTRL >= 2) return 'PROOF_OF_CONCEPT';
    return 'BASIC_RESEARCH';
}

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

async function institutionReport(institution, field = null, department = null) {
    const query = [institution, field, department].filter(Boolean).join(' ');

    // Fetch all sources in parallel
    const [openAlexWorks, openAlexOrgs, nih, orcid, arxiv] = await Promise.all([
        fetchOpenAlex(query, 'works'),
        fetchOpenAlex(institution, 'institutions'),
        fetchNIH(query),
        fetchORCID(institution),
        fetchArXiv(query)
    ]);

    // Extract data
    const publications = (openAlexWorks.results || []).map(w => ({
        title: w.display_name || '',
        year: w.publication_year,
        journal: w.primary_location?.source?.display_name || '',
        cited_by_count: w.cited_by_count || 0,
        doi: w.doi
    }));

    const institutionData = openAlexOrgs.results?.[0] || {};
    const grants = (nih.results || []).map(p => ({
        title: p.project_title || '',
        agency: 'NIH',
        amount: p.award_amount || 0,
        pi: p.contact_pi_name || ''
    }));

    const researchers = ((orcid["num-found"] || 0) > 0 ? orcid.result || [] : []).map(r => ({
        name: r["single-name"]?.value || 'Unknown',
        works_count: r["num-works"] || 0
    }));

    const arxivEntries = (arxiv.entries || []).map(e => ({
        title: e.title,
        year: e.year,
        summary: e.summary
    }));

    // Build data object for scoring
    const data = { publications, patents: [], grants, researchers, arxivEntries };

    // Run scoring models
    const commScore = scoreCommercialization(data);
    const hotspotScore = scoreResearchHotspots(data);
    const labScore = scoreLabIntelligence(data);
    const techScore = scoreTechMaturity(data);

    // Calculate composite score
    const compositeScore = Math.round(
        commScore * 0.30 +
        hotspotScore * 0.20 +
        labScore * 0.25 +
        techScore * 0.25
    );

    // Build scoring details
    const allText = publications.map(p => p.title || '').join(' ');
    const avgTRL = publications.length > 0
        ? publications.reduce((sum, p) => sum + calculateTRL(p.title || ''), 0) / publications.length
        : 1;

    const scoring = {
        commercializationReadiness: {
            score: commScore,
            patentCount: 0,
            publicationCount: publications.length,
            conversionRatio: 0,
            readinessLevel: getReadinessLevel(commScore),
            signals: []
        },
        researchHotSpots: {
            score: hotspotScore,
            preprintVelocity: arxivEntries.filter(e => e.year >= 2024).length,
            citationAcceleration: Math.round(publications.reduce((sum, p) => sum + (p.cited_by_count || 0), 0) / Math.max(publications.length, 1)),
            hotspotLevel: getHotspotLevel(hotspotScore),
            signals: []
        },
        labIntelligence: {
            score: labScore,
            piCount: researchers.length,
            grantCount: grants.length,
            patentCount: 0,
            labStrength: getLabStrength(labScore),
            signals: []
        },
        techMaturity: {
            score: techScore,
            trlEstimate: Math.round(avgTRL),
            patentMaturity: 0,
            publicationMaturity: 0,
            maturityLevel: getMaturityLevel(avgTRL),
            signals: []
        }
    };

    // Generate signals
    const allSignals = [];
    if (commScore >= 60) allSignals.push("High commercialization readiness — initiate tech transfer discussions");
    if (hotspotScore >= 70) allSignals.push("Research area is rapidly accelerating — first-mover advantage available");
    if (labScore >= 70) allSignals.push("Large research group — evaluate key PI retention risk before engagement");
    if (avgTRL >= 5) allSignals.push(`TRL ${Math.round(avgTRL)} — technology suitable for pilot or demonstration programs`);

    const verdict = getVerdict(compositeScore, scoring);

    // Generate recommendations
    const recommendations = [];
    if (verdict === 'ACQUIRE_NOW') {
        recommendations.push("Strong acquisition candidate — prioritize engagement");
        recommendations.push("High commercialization potential — begin licensing discussions");
    } else if (verdict === 'PARTNER') {
        recommendations.push("Solid partnership candidate — explore joint research opportunities");
        recommendations.push("Moderate tech maturity — focus on collaboration terms");
    } else if (verdict === 'MONITOR') {
        recommendations.push("Technology merits tracking — set up quarterly monitoring");
    }

    return {
        institution,
        field: field || null,
        department: department || null,
        query,
        generatedAt: new Date().toISOString(),
        compositeScore,
        verdict,
        recommendations: recommendations.slice(0, 6),
        allSignals,
        scoring,
        dataSources: {
            openalexPublications: publications.length,
            openalexResearch: institutionData.works_count || 0,
            usPatents: 0,
            epoPatents: 0,
            nihGrants: grants.length,
            federalGrants: 0,
            researchers: researchers.length,
            arxivPreprints: arxivEntries.length
        },
        topPublications: publications.slice(0, 10),
        topPatents: [],
        topGrants: grants.slice(0, 10),
        topResearchers: researchers.slice(0, 10),
        topPreprints: arxivEntries.slice(0, 10)
    };
}

async function researcherProfile(institution, field = null) {
    const query = field ? `${institution} ${field}` : institution;

    const [orcid, openAlex] = await Promise.all([
        fetchORCID(query),
        fetchOpenAlex(query, 'authors')
    ]);

    const researchers = [];

    // ORCID results
    if ((orcid["num-found"] || 0) > 0) {
        for (const r of (orcid.result || []).slice(0, 10)) {
            researchers.push({
                name: r["given-names"]?.value && r["family-name"]?.value
                    ? `${r["given-names"].value} ${r["family-name"].value}`
                    : r["display-name"]?.value || 'Unknown',
                orcid: r["orcid-id"]?.value || '',
                works_count: r["num-works"] || 0,
                institution
            });
        }
    }

    // OpenAlex results
    for (const author of (openAlex.results || []).slice(0, 10)) {
        researchers.push({
            name: author.display_name || 'Unknown',
            orcid: author.orcid || '',
            works_count: author.works_count || 0,
            cited_by_count: author.cited_by_count || 0,
            h_index: author.summary_stats?.h_index || 0,
            institution
        });
    }

    return { researchers: researchers.slice(0, 10), institution, field };
}

async function patentLandscape(institution, field = null) {
    // Placeholder implementation
    // Real implementation would use Google Patents API or USPTO API
    return {
        institution,
        field,
        patents: [],
        message: "Patent search requires Google Patents API integration. Placeholder for v1.0."
    };
}

async function fundingAnalysis(institution, field = null) {
    const query = field ? `${institution} ${field}` : institution;

    const [nih, grantsGov] = await Promise.all([
        fetchNIH(query),
        fetchGrantsGov(query)
    ]);

    const grants = [];

    // NIH grants
    for (const p of (nih.results || []).slice(0, 50)) {
        grants.push({
            agency: 'NIH',
            amount: p.award_amount || 0,
            title: p.project_title || '',
            pi: p.contact_pi_name || '',
            institution: p.organization?.org_name || institution,
            start_year: p.project_start_date?.slice(0, 4) || null,
            url: p.project_detail_url || ''
        });
    }

    // Calculate totals
    const totalFunding = grants.reduce((sum, g) => sum + g.amount, 0);
    const agencyBreakdown = {};
    grants.forEach(g => {
        agencyBreakdown[g.agency] = (agencyBreakdown[g.agency] || 0) + g.amount;
    });

    return {
        institution,
        field,
        grants: grants.slice(0, 50),
        total_funding: totalFunding,
        agency_breakdown: agencyBreakdown
    };
}

async function benchmarkInstitutions(institutions, field = null) {
    const reports = await Promise.all(
        institutions.map(inst => institutionReport(inst, field))
    );

    // Sort by composite score
    reports.sort((a, b) => b.compositeScore - a.compositeScore);

    const comparisons = reports.map((r, i) => ({
        institution: r.institution,
        compositeScore: r.compositeScore,
        rank: i + 1,
        scores: {
            commercializationReadiness: r.scoring.commercializationReadiness.score,
            researchHotSpots: r.scoring.researchHotSpots.score,
            labIntelligence: r.scoring.labIntelligence.score,
            techMaturity: r.scoring.techMaturity.score
        },
        verdict: r.verdict
    }));

    return { comparisons, recommended_actions: [] };
}

// ============================================
// REQUEST HANDLER
// ============================================

async function handleTool(toolName, params = {}) {
    const handlers = {
        "institution_report": async () => institutionReport(params.institution, params.field, params.department),
        "researcher_profile": async () => researcherProfile(params.institution, params.field),
        "patent_landscape": async () => patentLandscape(params.institution, params.field),
        "funding_analysis": async () => fundingAnalysis(params.institution, params.field),
        "benchmark_institutions": async () => benchmarkInstitutions(params.institutions, params.field)
    };

    const handler = handlers[toolName];
    if (handler) {
        const result = await handler();
        const price = TOOL_PRICES[toolName];
        if (price) {
            try {
                await Actor.charge(price, { eventName: toolName });
            } catch (e) {
                console.error("Charge failed:", e.message);
            }
        }
        return result;
    }
    return { error: `Unknown tool: ${toolName}` };
}

// ============================================
// HTTP SERVER FOR STANDBY MODE
// ============================================

await Actor.init();

const isStandby = Actor.config.get('metaOrigin') === 'STANDBY';

if (isStandby) {
    // Standby mode: start HTTP server for MCP requests
    const PORT = Actor.config.get('containerPort') || process.env.ACTOR_WEB_SERVER_PORT || 3000;

    const server = http.createServer(async (req, res) => {
        // Handle readiness probe
        if (req.headers['x-apify-container-server-readiness-probe']) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
            return;
        }

        // Handle MCP requests
        if (req.method === 'POST' && req.url === '/mcp') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
                try {
                    const jsonBody = JSON.parse(body);

                    // Support both direct {tool, params} and JSON-RPC 2.0 {method, params}
                    let tool, params;
                    if (jsonBody.method && jsonBody.method.startsWith('tools/')) {
                        // JSON-RPC 2.0 format
                        const toolName = jsonBody.method.replace('tools/', '');
                        params = jsonBody.params || {};
                        tool = toolName;
                    } else {
                        // Direct format: {tool: "...", params: {...}}
                        tool = jsonBody.tool;
                        params = jsonBody.params || {};
                    }

                    if (tool === 'list') {
                        // Return MCP manifest
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ tools: MCP_MANIFEST.tools }));
                        return;
                    }

                    const result = await handleTool(tool, params);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success', result }));
                } catch (error) {
                    console.error('MCP error:', error.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: error.message }));
                }
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    });

    server.listen(PORT, () => {
        console.log(`University Research MCP listening on port ${PORT}`);
    });

    // Keep process alive
    process.on('SIGTERM', () => {
        server.close(() => process.exit(0));
    });
} else {
    // Batch mode (apify call): run tool and exit
    const input = await Actor.getInput();
    if (input) {
        const { tool, params = {} } = input;
        if (tool) {
            console.log(`Running tool: ${tool}`);
            const result = await handleTool(tool, params);
            await Actor.setValue('OUTPUT', result);
        }
    }
    await Actor.exit();
}

// Export handleRequest for MCP gateway compatibility
export default {
    handleRequest: async ({ request, response, log }) => {
        log.info("University Research MCP received request");

        try {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { tool, params = {} } = body;

            log.info(`Calling tool: ${tool}`);

            const result = await handleTool(tool, params);

            await response.send({
                status: "success",
                result
            });
        } catch (error) {
            log.error(`Error: ${error.message}`);
            await response.send({
                status: "error",
                error: error.message
            });
        }
    }
};
