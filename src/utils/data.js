const core = require("@actions/core");

export function getBranchName() {
  return process.env.GITHUB_REF.split("/").slice(2).join("/");
}

export function getCacheKey() {
  const defaultBranch = core.getInput("default_branch");
  const hash = process.env.GITHUB_SHA;
  return `coverage-${defaultBranch}-${hash}`;
}

export function getCacheRestoreKeys() {
  const defaultBranch = core.getInput("default_branch");
  return [`coverage-${defaultBranch}-`];
}
