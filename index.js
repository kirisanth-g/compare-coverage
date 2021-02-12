const core = require("@actions/core");
const cache = require("@actions/cache");
const fs = require("fs");

const DEFAULT_FILENAME = "coverage-default.json";

async function main() {
  const currBranch = getBranchName();
  const defaultBranch = core.getInput("default_branch");
  const path = core.getInput("path");

  // TODO: Check path file exists

  if (currBranch === defaultBranch) {
    console.log("On default branch");
    await cacheDefaultCoverage(defaultBranch, path);
  } else {
    await testCoverage(defaultBranch, path);
  }
}

function getBranchName() {
  core.exportVariable(
    "BRANCH_NAME",
    process.env.GITHUB_REF.split("/").slice(2).join("/")
  );
}

async function cacheDefaultCoverage(defaultBranch, path) {
  // TODO check if this works?
  fs.renameSync(path, DEFAULT_FILENAME);
  const hash = process.env.GITHUB_SHA;
  const key = `coverage-${defaultBranch}-${hash}`;
  await cache.saveCache([DEFAULT_FILENAME], key);
}

async function testCoverage(defaultBranch, path) {
  const currCoverage = getCoverage(path);
  console.log("Curr Coverage: ", currCoverage);
  testMinCoverage(currCoverage);
  await testDiffCoverage(currCoverage, defaultBranch);
}

function testMinCoverage(currCoverage) {
  const minCoverage = core.getInput("min_coverage");
  return currCoverage >= minCoverage;
}

async function testDiffCoverage(currCoverage, defaultBranch) {
  const maxDiff = core.getInput("max_diff");
  //   Retreieve deafult branch coverage file from cache
  const restoreKey = `coverage-${defaultBranch}-`;
  await cache.restoreCache(paths, restoreKey, [restoreKey]);
  // Get Coverage from cached file
  const defaultCoverage = getCoverage(DEFAULT_FILENAME);
  console.log("Deafault Coverage: ", defaultCoverage);
  // Compare the difference
  return currCoverage - defaultCoverage >= maxDiff;
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
  console.error(e);
});
