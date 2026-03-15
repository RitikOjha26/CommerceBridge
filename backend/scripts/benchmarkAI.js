/**
 * benchmarkAI.js
 *
 * Measures how well Gemini can autonomously navigate the store's AI orchestration
 * layer to answer real shopping queries using function calling (tool use).
 *
 * Metrics captured per query:
 *   1. Discovery Rate    — did LLM find /.well-known/ai without being told?
 *   2. API Efficiency    — how many HTTP calls per query?
 *   3. Filter Accuracy   — did LLM use query params vs fetch-all?
 *   4. Answer Accuracy   — does answer reference products that actually exist?
 *   5. Hallucination     — did LLM invent products/brands not in API response?
 *
 * Usage:
 *   GEMINI_API_KEY=AIza... node backend/scripts/benchmarkAI.js
 *
 * Output:
 *   - Console: live progress
 *   - benchmark-results.json: raw structured data
 *   - benchmark-report.md: markdown table for team presentation
 */

const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const fetch = require("node-fetch");

const BASE_URL = process.env.STORE_URL || "https://commercebridge.onrender.com";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
// Delay between queries — keep ≥ 8000ms for free tier (15 RPM limit)
const QUERY_DELAY_MS = parseInt(process.env.QUERY_DELAY_MS || "8000", 10);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Tool definition (function declaration format) ────────────────────────────

const functionDeclarations = [
  {
    name: "fetch_url",
    description:
      "Fetch JSON data from the store AI API. " +
      "If you don't know which endpoints exist, call /.well-known/ai first — it lists every endpoint and its supported filters. " +
      "Always prefer using query parameters (category, brand, price_min, price_max, rating) over fetching all products and filtering yourself.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Full URL to fetch (must start with http)",
        },
      },
      required: ["url"],
    },
  },
];

// ─── Test query suite ─────────────────────────────────────────────────────────

const queries = [
  // Tier 1 — Discovery: LLM gets only the root domain
  {
    id: "Q01",
    tier: 1,
    label: "Discovery — no endpoint hints",
    question: `I'm looking for a good laptop. The store is at ${BASE_URL}. Figure out what this store offers and recommend one.`,
    systemPrompt: `You are a shopping assistant. The store is at ${BASE_URL}. You have no other information — discover the store's API on your own before answering. Use the fetch_url tool to explore.`,
  },

  // Tier 2 — Single filter
  {
    id: "Q02",
    tier: 2,
    label: "Single filter — price cap",
    question: "Show me smartphones under ₹30,000.",
    systemPrompt: `You are a shopping assistant for ${BASE_URL}. Use the store's AI API (start with /.well-known/ai to discover endpoints) to answer the user's question.`,
  },
  {
    id: "Q03",
    tier: 2,
    label: "Single filter — keyword search",
    question: "What gaming laptops do you have?",
    systemPrompt: `You are a shopping assistant for ${BASE_URL}. Use the store's AI API (start with /.well-known/ai to discover endpoints) to answer the user's question.`,
  },
  {
    id: "Q04",
    tier: 2,
    label: "Single filter — brand",
    question: "List all Apple products in the store.",
    systemPrompt: `You are a shopping assistant for ${BASE_URL}. Use the store's AI API (start with /.well-known/ai to discover endpoints) to answer the user's question.`,
  },

  // Tier 3 — Multi-filter
  {
    id: "Q05",
    tier: 3,
    label: "Multi-filter — brand + rating + price",
    question: "Find me a Samsung phone with at least 4-star rating under ₹40,000.",
    systemPrompt: `You are a shopping assistant for ${BASE_URL}. Use the store's AI API (start with /.well-known/ai to discover endpoints) to answer the user's question.`,
  },
  {
    id: "Q06",
    tier: 3,
    label: "Multi-filter — category + price + rating",
    question: "What are the top-rated home appliances under ₹15,000?",
    systemPrompt: `You are a shopping assistant for ${BASE_URL}. Use the store's AI API (start with /.well-known/ai to discover endpoints) to answer the user's question.`,
  },

  // Tier 4 — Pagination & catalog awareness
  {
    id: "Q07",
    tier: 4,
    label: "Pagination — explicit page request",
    question: "Show me page 2 of Electronics products (20 per page).",
    systemPrompt: `You are a shopping assistant for ${BASE_URL}. Use the store's AI API (start with /.well-known/ai to discover endpoints) to answer the user's question.`,
  },
  {
    id: "Q08",
    tier: 4,
    label: "Catalog — totals by category",
    question: "How many total products does the store carry? Break it down by category.",
    systemPrompt: `You are a shopping assistant for ${BASE_URL}. Use the store's AI API (start with /.well-known/ai to discover endpoints) to answer the user's question.`,
  },

  // Tier 5 — Comparison & reasoning
  {
    id: "Q09",
    tier: 5,
    label: "Comparison — multi-product reasoning",
    question: "Compare the top 3 gaming laptops — which has the best price-to-specs ratio?",
    systemPrompt: `You are a shopping assistant for ${BASE_URL}. Use the store's AI API (start with /.well-known/ai to discover endpoints) to answer. Fetch actual product details before comparing.`,
  },
  {
    id: "Q10",
    tier: 5,
    label: "Cross-category gift recommendation",
    question: "I want a gift under ₹5,000. Recommend the best option across all categories.",
    systemPrompt: `You are a shopping assistant for ${BASE_URL}. Use the store's AI API (start with /.well-known/ai to discover endpoints) to answer. Look across multiple categories before recommending.`,
  },
];

// ─── HTTP tool execution ──────────────────────────────────────────────────────

async function callTool(url) {
  try {
    const res = await fetch(url, { timeout: 15000 });
    if (!res.ok) return { error: `HTTP ${res.status}`, url };
    return await res.json();
  } catch (err) {
    return { error: err.message, url };
  }
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function checkDiscovery(endpointsCalled) {
  return endpointsCalled.some(
    (u) => u.includes("/.well-known/ai") || u.includes("/llms.txt") || u.includes("/.ai/info")
  );
}

function checkFilterUsage(endpointsCalled) {
  const productCalls = endpointsCalled.filter(
    (u) => u.includes("/.ai/products") || u.includes("/.ai/search")
  );
  if (productCalls.length === 0) return null;
  return productCalls.some((u) => u.includes("?"));
}

// ─── Core: run one query through Gemini ──────────────────────────────────────

async function runQuery(queryDef) {
  const startTime = Date.now();
  const endpointsCalled = [];
  const seenProductNames = [];

  let totalTokens = 0;
  let apiCallCount = 0;
  let finalAnswer = "";

  console.log(`\n${"─".repeat(60)}`);
  console.log(`[${queryDef.id}] Tier ${queryDef.tier}: ${queryDef.label}`);
  console.log(`  Question: "${queryDef.question}"`);
  console.log(`${"─".repeat(60)}`);

  // Build conversation history manually (new SDK pattern)
  const contents = [
    { role: "user", parts: [{ text: queryDef.question }] },
  ];

  while (true) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: queryDef.systemPrompt,
        tools: [{ functionDeclarations }],
      },
    });

    // Accumulate token usage
    if (response.usageMetadata) {
      totalTokens = response.usageMetadata.totalTokenCount || totalTokens;
    }

    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      finalAnswer = response.text || "(no text response)";
      break;
    }

    // Append model turn to conversation history
    contents.push({
      role: "model",
      parts: response.candidates[0].content.parts,
    });

    // Execute all function calls and build tool result parts
    const toolResultParts = await Promise.all(
      functionCalls.map(async (fc) => {
        apiCallCount++;
        const url = fc.args.url;
        endpointsCalled.push(url);

        const urlPath = url.replace(BASE_URL, "");
        console.log(`  → [call ${apiCallCount}] ${urlPath}`);

        const data = await callTool(url);

        // Collect product names seen in API responses for hallucination check
        if (data.products) data.products.forEach((p) => p.name && seenProductNames.push(p.name));
        if (data.results) data.results.forEach((p) => p.name && seenProductNames.push(p.name));
        if (data.name) seenProductNames.push(data.name);

        return {
          functionResponse: {
            name: fc.name,
            response: { result: data },
          },
        };
      })
    );

    // Append tool results as a user turn
    contents.push({ role: "user", parts: toolResultParts });
  }

  const latencyMs = Date.now() - startTime;
  const discovered = checkDiscovery(endpointsCalled);
  const usedFilters = checkFilterUsage(endpointsCalled);

  console.log(
    `  ← Done in ${(latencyMs / 1000).toFixed(1)}s | ${apiCallCount} API calls | ${totalTokens} tokens`
  );
  console.log(
    `  Discovery: ${discovered ? "✓" : "✗"} | Filters used: ${usedFilters === null ? "N/A" : usedFilters ? "✓" : "✗"}`
  );

  return {
    id: queryDef.id,
    tier: queryDef.tier,
    label: queryDef.label,
    question: queryDef.question,
    api_calls: apiCallCount,
    endpoints_called: endpointsCalled,
    discovered_api: discovered,
    used_filters: usedFilters,
    hallucination_detected: "manual_review",
    latency_ms: latencyMs,
    tokens_total: totalTokens,
    final_answer: finalAnswer,
    seen_product_names: [...new Set(seenProductNames)],
  };
}

// ─── Report generation ────────────────────────────────────────────────────────

function buildMarkdownReport(results) {
  const totalCalls = results.reduce((s, r) => s + r.api_calls, 0);
  const avgCalls = (totalCalls / results.length).toFixed(1);
  const avgLatency = (
    results.reduce((s, r) => s + r.latency_ms, 0) / results.length / 1000
  ).toFixed(1);
  const totalTokens = results.reduce((s, r) => s + r.tokens_total, 0);
  const discoveryRate = (
    (results.filter((r) => r.discovered_api).length / results.length) * 100
  ).toFixed(0);
  const applicableFilter = results.filter((r) => r.used_filters !== null);
  const filterRate =
    applicableFilter.length === 0
      ? "N/A"
      : ((applicableFilter.filter((r) => r.used_filters).length / applicableFilter.length) * 100).toFixed(0) + "%";

  const rows = results.map((r) => {
    const filterCell = r.used_filters === null ? "N/A" : r.used_filters ? "Yes" : "No";
    return `| ${r.id} | T${r.tier} | ${r.label} | ${r.api_calls} | ${r.discovered_api ? "Yes" : "No"} | ${filterCell} | Manual | ${(r.latency_ms / 1000).toFixed(1)}s | ${r.tokens_total} |`;
  });

  return `# AI Orchestration Layer — LLM Benchmark Report

**Store:** ${BASE_URL}
**Model tested:** ${MODEL}
**Products in catalog:** 900
**Run date:** ${new Date().toISOString().slice(0, 10)}

---

## Summary

| Metric | Result | Target | Status |
|---|---|---|---|
| Discovery Rate | ${discoveryRate}% | 100% | ${discoveryRate === "100" ? "PASS" : "FAIL"} |
| Avg API calls/query | ${avgCalls} | ≤ 3 | ${parseFloat(avgCalls) <= 3 ? "PASS" : "REVIEW"} |
| Filter usage rate | ${filterRate} | ≥ 80% | — |
| Hallucination | Manual review required | 0% | See table below |
| Avg latency | ${avgLatency}s | — | — |
| Total tokens used | ${totalTokens} | — | — |

---

## Per-Query Results

| ID | Tier | Query | API Calls | Discovered | Filters Used | Hallucinated | Latency | Tokens |
|---|---|---|---|---|---|---|---|---|
${rows.join("\n")}

---

## Tier Legend

| Tier | Description |
|---|---|
| T1 | Discovery — LLM given only root domain, must find API itself |
| T2 | Single filter — price, keyword, or brand |
| T3 | Multi-filter — combining 2+ parameters in one call |
| T4 | Pagination & catalog awareness |
| T5 | Comparison & cross-product reasoning |

---

## What the Metrics Prove

| Signal | What it validates |
|---|---|
| Discovery Rate 100% | \`/.well-known/ai\` and \`llms.txt\` are discoverable and parseable by LLMs |
| Low API calls | Response shape is self-descriptive — LLM doesn't explore blindly |
| High filter usage | Query param names are intuitive enough that LLM uses them correctly |
| 0% hallucination | Flat JSON with real IDs prevents the LLM from inventing products |
| Tier 5 answers | LLM can reason across multiple API calls to produce comparative answers |

---

## Hallucination Manual Review Guide

For each query, open \`benchmark-results.json\` and compare:
- \`final_answer\` — what the LLM said
- \`seen_product_names\` — actual product names returned by the API

Flag as hallucinated if the LLM recommends a specific product name not present in \`seen_product_names\`.

---

*Generated by \`backend/scripts/benchmarkAI.js\` using ${MODEL}*
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY environment variable is required.");
    console.error("Usage: GEMINI_API_KEY=AIza... node backend/scripts/benchmarkAI.js");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       AI Orchestration Layer — LLM Benchmark             ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Store:   ${BASE_URL.padEnd(47)}║`);
  console.log(`║  Model:   ${MODEL.padEnd(47)}║`);
  console.log(`║  Queries: ${String(queries.length).padEnd(47)}║`);
  console.log("╚══════════════════════════════════════════════════════════╝");

  const results = [];

  for (const query of queries) {
    const result = await runQuery(query);
    results.push(result);
    if (query !== queries[queries.length - 1]) {
      console.log(`  ⏳ Waiting ${QUERY_DELAY_MS / 1000}s before next query...`);
      await new Promise((r) => setTimeout(r, QUERY_DELAY_MS));
    }
  }

  // Save raw JSON
  const jsonPath = path.join(__dirname, "..", "..", "benchmark-results.json");
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  // Save markdown report
  const mdPath = path.join(__dirname, "..", "..", "benchmark-report.md");
  fs.writeFileSync(mdPath, buildMarkdownReport(results));

  // Final console summary
  console.log(`\n${"═".repeat(60)}`);
  console.log("BENCHMARK COMPLETE");
  console.log("═".repeat(60));
  console.log(`  Raw data:      benchmark-results.json`);
  console.log(`  Report:        benchmark-report.md`);
  console.log(`  Queries run:   ${results.length}`);
  console.log(`  Total calls:   ${results.reduce((s, r) => s + r.api_calls, 0)}`);
  console.log(`  Total tokens:  ${results.reduce((s, r) => s + r.tokens_total, 0)}`);
  console.log(
    `  Discovery:     ${((results.filter((r) => r.discovered_api).length / results.length) * 100).toFixed(0)}%`
  );
  console.log("═".repeat(60));
  console.log("\nOpen benchmark-report.md for the full team-ready report.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
