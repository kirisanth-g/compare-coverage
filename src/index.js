const core = require("@actions/core");

import { getBranchName } from "./utils/data";
import { parseCoverage } from "./utils/parser";
import { cacheDefaultCoverage, cacheRetrieval } from "./utils/cache";
import { DEFAULT_FILENAME } from "./constants";

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

async function testCoverage(path) {
  const currCoverage = parseCoverage(path);
  core.info(`Current Coverage: ${currCoverage}`);

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
  const foundCache = cacheRetrieval();
  if (!foundCache) {
    // TODO: Get main cache
  }

  // Get Coverage from cached file
  const defaultCoverage = parseCoverage(DEFAULT_FILENAME);
  core.info(`Default Coverage: ${defaultCoverage}`);

  // Compare the difference
  const diff = currCoverage - defaultCoverage;
  core.info(`Coverage Difference: ${diff}`);
  if (diff >= maxDiff) {
    core.info(`Coverage difference higher than the minimum: ${maxDiff}`);
  } else {
    core.error(`Coverage difference is lower than the minimum: ${maxDiff}`);
  }
}

main().catch((e) => {
  process.exitCode = 1;
  core.error(e);
});
