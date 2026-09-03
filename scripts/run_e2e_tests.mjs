#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const TEST_TIERS = [
  {
    tier: 1,
    name: "Tier 1: Feature Verification (R1, R2, R3)",
    file: "tests/e2e/tier1_features.test.mjs",
    minThreshold: 27,
  },
  {
    tier: 2,
    name: "Tier 2: Boundary Value Analysis & Limits",
    file: "tests/e2e/tier2_boundaries.test.mjs",
    minThreshold: 27,
  },
  {
    tier: 3,
    name: "Tier 3: Pairwise & Cross-Feature Combinations",
    file: "tests/e2e/tier3_combinations.test.mjs",
    minThreshold: 10,
  },
  {
    tier: 4,
    name: "Tier 4: Realistic Full-Stack Application Scenarios",
    file: "tests/e2e/tier4_scenarios.test.mjs",
    minThreshold: 5,
  },
];

async function runTestTier(tierConfig) {
  const filePath = path.resolve(projectRoot, tierConfig.file);
  const startTime = Date.now();

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [filePath], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const str = chunk.toString();
      stdout += str;
      process.stdout.write(str);
    });

    child.stderr.on("data", (chunk) => {
      const str = chunk.toString();
      stderr += str;
      process.stderr.write(str);
    });

    child.on("close", (exitCode) => {
      const durationMs = Date.now() - startTime;

      // Extract test count from stdout output
      // Pattern: "ℹ tests X" and "ℹ pass Y" and "ℹ fail Z"
      const testsMatch = stdout.match(/ℹ tests (\d+)/);
      const passMatch = stdout.match(/ℹ pass (\d+)/);
      const failMatch = stdout.match(/ℹ fail (\d+)/);

      const totalTests = testsMatch ? parseInt(testsMatch[1], 10) : 0;
      const passedTests = passMatch ? parseInt(passMatch[1], 10) : (exitCode === 0 ? totalTests : 0);
      const failedTests = failMatch ? parseInt(failMatch[1], 10) : (exitCode !== 0 ? 1 : 0);

      resolve({
        tier: tierConfig.tier,
        name: tierConfig.name,
        file: tierConfig.file,
        minThreshold: tierConfig.minThreshold,
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        exitCode,
        durationMs,
        stdout,
        stderr,
      });
    });
  });
}

async function main() {
  console.log("===============================================================================");
  console.log("       BOEMI NUSANTARA PLATFORM — 4-TIER E2E TEST SUITE RUNNER                ");
  console.log("===============================================================================\n");

  const overallStart = Date.now();
  const results = [];
  let allTiersPassed = true;

  for (const tier of TEST_TIERS) {
    console.log(`\n-------------------------------------------------------------------------------`);
    console.log(`▶ Executing ${tier.name}`);
    console.log(`  File: ${tier.file} (Min Requirement: >=${tier.minThreshold} tests)`);
    console.log(`-------------------------------------------------------------------------------`);

    const result = await runTestTier(tier);
    results.push(result);

    if (result.exitCode !== 0 || result.failed > 0 || result.total < tier.minThreshold) {
      allTiersPassed = false;
    }
  }

  const overallDurationMs = Date.now() - overallStart;

  console.log("\n===============================================================================");
  console.log("                        E2E TEST SUITE SUMMARY REPORT                          ");
  console.log("===============================================================================");

  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;

  console.log("\n| Tier | Description                                    | Req | Exec | Pass | Fail | Status |");
  console.log("|:----:|:-----------------------------------------------|:---:|:----:|:----:|:----:|:------:|");

  for (const res of results) {
    grandTotal += res.total;
    grandPassed += res.passed;
    grandFailed += res.failed;

    const thresholdMet = res.total >= res.minThreshold;
    const isSuccess = res.exitCode === 0 && res.failed === 0 && thresholdMet;
    const statusStr = isSuccess ? "✅ PASS" : "❌ FAIL";

    const namePadded = res.name.padEnd(46, " ");
    const reqStr = String(res.minThreshold).padStart(3, " ");
    const execStr = String(res.total).padStart(4, " ");
    const passStr = String(res.passed).padStart(4, " ");
    const failStr = String(res.failed).padStart(4, " ");

    console.log(`|  T${res.tier}  | ${namePadded} | ${reqStr} | ${execStr} | ${passStr} | ${failStr} | ${statusStr} |`);
  }

  console.log("-------------------------------------------------------------------------------");
  console.log(`Total Tests Executed: ${grandTotal} | Passed: ${grandPassed} | Failed: ${grandFailed}`);
  console.log(`Total Duration: ${(overallDurationMs / 1000).toFixed(2)}s`);
  console.log(`Pass Rate: ${grandTotal > 0 ? ((grandPassed / grandTotal) * 100).toFixed(1) : 0}%`);
  console.log("===============================================================================");

  if (allTiersPassed && grandFailed === 0) {
    console.log("\n🎉 ALL E2E TEST TIERS PASSED WITH 100% SUCCESS RATE!\n");
    process.exit(0);
  } else {
    console.error("\n💥 TEST SUITE COMPLETED WITH FAILURES OR THRESHOLD DEFICIT.\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Runner encountered unhandled fatal exception:", err);
  process.exit(1);
});
