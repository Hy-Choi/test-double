#!/usr/bin/env node

import { performance } from "node:perf_hooks";

const defaultBaseUrl = process.env.BASE_URL || "http://localhost:3010";
const defaultRuns = Number(process.env.RUNS || 20);
const defaultQueries = (process.env.QUERIES || "입,입례,예배하는 자 되어")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const defaultIncludeSuggestions = process.env.INCLUDE_SUGGESTIONS || "both";

function normalizeIncludeSuggestions(value) {
  const normalized = String(value || "both").trim().toLowerCase();
  if (["0", "false", "off"].includes(normalized)) {
    return "0";
  }
  if (["1", "true", "on"].includes(normalized)) {
    return "1";
  }
  return "both";
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    baseUrl: defaultBaseUrl,
    runs: Number.isFinite(defaultRuns) && defaultRuns > 0 ? defaultRuns : 20,
    queries: defaultQueries,
    includeSuggestions: normalizeIncludeSuggestions(defaultIncludeSuggestions)
  };

  for (const arg of args) {
    if (arg.startsWith("--base=")) {
      config.baseUrl = arg.slice("--base=".length);
      continue;
    }
    if (arg.startsWith("--runs=")) {
      const parsed = Number(arg.slice("--runs=".length));
      if (Number.isFinite(parsed) && parsed > 0) {
        config.runs = parsed;
      }
      continue;
    }
    if (arg.startsWith("--queries=")) {
      const parsed = arg
        .slice("--queries=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        config.queries = parsed;
      }
      continue;
    }
    if (arg.startsWith("--includeSuggestions=")) {
      config.includeSuggestions = normalizeIncludeSuggestions(arg.slice("--includeSuggestions=".length));
      continue;
    }
  }

  return config;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const index = Math.min(Math.max(rank, 0), sorted.length - 1);
  return sorted[index];
}

function mean(values) {
  if (values.length === 0) return 0;
  const total = values.reduce((acc, item) => acc + item, 0);
  return total / values.length;
}

function buildSearchUrl(baseUrl, query, includeSuggestions) {
  return `${baseUrl}/api/search?q=${encodeURIComponent(query)}&includeSuggestions=${includeSuggestions}`;
}

async function ping(baseUrl, includeSuggestions) {
  const response = await fetch(buildSearchUrl(baseUrl, "입", includeSuggestions), {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Warmup failed: ${response.status}`);
  }
  await response.json();
}

async function runSingleQuery(baseUrl, query, runs, includeSuggestions) {
  const samples = [];

  for (let i = 0; i < runs; i += 1) {
    const startedAt = performance.now();
    const response = await fetch(buildSearchUrl(baseUrl, query, includeSuggestions), {
      cache: "no-store"
    });
    const elapsed = performance.now() - startedAt;

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Request failed for "${query}" (${response.status}): ${body.slice(0, 200)}`);
    }

    await response.json();
    samples.push(elapsed);
  }

  return {
    query,
    includeSuggestions,
    min: Math.min(...samples),
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    avg: mean(samples),
    max: Math.max(...samples)
  };
}

function getIncludeSuggestionModes(mode) {
  if (mode === "both") {
    return ["0", "1"];
  }
  return [mode];
}

function toReportKey(includeSuggestions, query) {
  return `${includeSuggestions}:${query}`;
}

function printReports(reports) {
  console.log("\nSearch benchmark report (ms)");
  console.log("includeSuggestions\tquery\tmin\tp50\tp95\tavg\tmax");
  for (const report of reports) {
    console.log(
      `${report.includeSuggestions}\t${report.query}\t${report.min.toFixed(1)}\t${report.p50.toFixed(1)}\t${report.p95.toFixed(1)}\t${report.avg.toFixed(1)}\t${report.max.toFixed(1)}`
    );
  }
}

function printComparison(reports, queries) {
  const reportMap = new Map(reports.map((item) => [toReportKey(item.includeSuggestions, item.query), item]));

  const hasBothModes = queries.every(
    (query) => reportMap.has(toReportKey("0", query)) && reportMap.has(toReportKey("1", query))
  );
  if (!hasBothModes) {
    return;
  }

  console.log("\nDiff (suggestions=1 minus suggestions=0)");
  console.log("query\tp50 diff\tp95 diff\tavg diff");

  for (const query of queries) {
    const withoutSuggestions = reportMap.get(toReportKey("0", query));
    const withSuggestions = reportMap.get(toReportKey("1", query));
    if (!withoutSuggestions || !withSuggestions) continue;

    const p50Diff = withSuggestions.p50 - withoutSuggestions.p50;
    const p95Diff = withSuggestions.p95 - withoutSuggestions.p95;
    const avgDiff = withSuggestions.avg - withoutSuggestions.avg;

    console.log(`${query}\t${p50Diff.toFixed(1)}\t${p95Diff.toFixed(1)}\t${avgDiff.toFixed(1)}`);
  }
}

async function runBenchmark() {
  const { baseUrl, runs, queries, includeSuggestions } = parseArgs();
  const modes = getIncludeSuggestionModes(includeSuggestions);

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Runs per query: ${runs}`);
  console.log(`Queries: ${queries.join(", ")}`);
  console.log(`includeSuggestions mode: ${includeSuggestions}`);

  for (const mode of modes) {
    await ping(baseUrl, mode);
  }

  const reports = [];
  for (const mode of modes) {
    for (const query of queries) {
      const report = await runSingleQuery(baseUrl, query, runs, mode);
      reports.push(report);
    }
  }

  printReports(reports);
  printComparison(reports, queries);
}

runBenchmark().catch((error) => {
  console.error("bench:search failed", error);
  process.exit(1);
});
