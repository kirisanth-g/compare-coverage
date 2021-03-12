const fs = require("fs");
import { getCacheKey, getCacheRestoreKeys } from "./data";
import { DEFAULT_FILENAME } from "../constants";

export async function cacheDefaultCoverage(path) {
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

export async function cacheRetrieval() {
  const primaryKey = getCacheKey();
  const restoreKeys = getCacheRestoreKeys();
  core.info(
    `Attempting restore cache with keys: ${[primaryKey, ...restoreKeys].join(
      ", "
    )}`
  );
  const cacheKey = await cache.restoreCache(
    [DEFAULT_FILENAME],
    primaryKey,
    restoreKeys
  );
  if (!cacheKey) {
    core.info("Cache not found for input keys");
  } else {
    core.info("Cache found for input keys");
  }

  fs.readdirSync(".").forEach((file) => {
    core.info(file);
  });

  return cacheKey;
}
