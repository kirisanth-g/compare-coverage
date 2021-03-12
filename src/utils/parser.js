const fs = require("fs");

export function parseCoverage(path) {
  let rawdata = fs.readFileSync(path);
  let data = JSON.parse(rawdata);
  if (!data.hasOwnProperty("total")) {
    throw new Error(`${path} does not contain totals`);
  }

  if (data.total.hasOwnProperty("percent_covered")) {
    return Number(data.total.percent_covered);
  }

  console.log("totals: ", data.total);

  let totalSum = ["lines", "statements", "functions", "branches"]
    .map((i) => data.total[i].pct)
    .reduce((a, b) => a + b, 0);
  console.log("sum: ", totalSum);
  return (totalSum / 4) * 100;
}
