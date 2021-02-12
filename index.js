const core = require("@actions/core");
const cache = require("@actions/cache");
const fs = require("fs");

const DEFAULT_FILENAME = "cc-coverage-default.json";

async function main() {
  const currBranch = getBranchName();
  const defaultBranch = core.getInput("default_branch");
  const path = core.getInput("path");

  // TODO: Check path file exists
  if (currBranch === defaultBranch) {
    core.info(`On default branch (${defaultBranch}): Caching coverage report`);
    await cacheDefaultCoverage(path);
  } else {
    core.info(`On ${currBranch}: Testing Coverage against ${defaultBranch}`);
    await testCoverage(path);
  }
}

function getBranchName() {
  return process.env.GITHUB_REF.split("/").slice(2).join("/");
}

function getCacheKey() {
  const defaultBranch = core.getInput("default_branch");
  const hash = process.env.GITHUB_SHA;
  return `coverage-${defaultBranch}-${hash}`;
}

function getCacheRestoreKeys() {
  const defaultBranch = core.getInput("default_branch");
  return [`coverage-${defaultBranch}-`];
}

async function cacheDefaultCoverage(path) {
  fs.readdirSync(".").forEach((file) => {
    core.info(file);
  });
  // TODO check if this works?
  fs.renameSync(path, DEFAULT_FILENAME);
  fs.readdirSync(".").forEach((file) => {
    core.info(file);
  });

  const key = getCacheKey();
  const cacheId = await cache.saveCache([DEFAULT_FILENAME], key);
  core.info(`Cache saved with key: ${key} @ ${cacheId}`);
}

async function testCoverage(path) {
  const currCoverage = getCoverage(path);
  core.info("Current Coverage: ", currCoverage);

  testMinCoverage(currCoverage);
  await testDiffCoverage(currCoverage);
}

function testMinCoverage(currCoverage) {
  const minCoverage = core.getInput("min_coverage");
  if (currCoverage >= minCoverage) {
    core.info(`Coverage meets the minimum requirement of ${minCoverage}`);
  } else {
    core.error(
      `Coverage is lower than the required percentage of ${minCoverage}`
    );
  }
}

async function testDiffCoverage(currCoverage) {
  const maxDiff = core.getInput("max_diff");
  //   Retreieve deafult branch coverage file from cache
  const primaryKey = getCacheKey();
  const restoreKeys = getCacheRestoreKeys();
  const cacheKey = await cache.restoreCache(["."], primaryKey, restoreKeys);
  if (!cacheKey) {
    core.info("Cache not found for input keys");
    return;
  } else {
    core.info("Cache found for input keys");
  }

  fs.readdirSync(".").forEach((file) => {
    core.info(file);
  });

  // Get Coverage from cached file
  const defaultCoverage = getCoverage(DEFAULT_FILENAME);
  core.info("Deafault Coverage: ", defaultCoverage);

  // Compare the difference
  const diff = currCoverage - defaultCoverage;
  core.info("Coverage Difference: ", diff);
  if (diff >= maxDiff) {
    core.info(`Coverage difference higher than the minimum: ${minCoverage}`);
  } else {
    core.error(`Coverage difference is lower than the minimum: ${minCoverage}`);
  }
}

function getCoverage(path) {
  let rawdata = fs.readFileSync(path);
  let data = JSON.parse(rawdata);
  if (!data.hasOwnProperty("total")) {
    throw new Error(`${path} does not contain totals`);
  }

  if (data.total.hasOwnProperty("percent_covered")) {
    return Number(data.total.percent_covered);
  }

  const totalSum = ["lines", "statements", "functions", "branches"]
    .map((i) => data.total[i].pct)
    .reduce((a, b) => a + b, 0);
  const avgCoverage = totalSum / 4;

  return avgCoverage;
}

main().catch((e) => {
  process.exitCode = 1;
  core.error(e);
});
