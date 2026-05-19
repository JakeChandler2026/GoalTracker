const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
const demoHtml = fs.readFileSync(path.join(projectRoot, "demo-test-app.html"), "utf8");

const requiredSharedIds = [
  "registerWard",
  "registerNewWardField",
  "registerNewWard",
  "registerOrganizationField",
  "registerOrganization",
  "registerCompetitionField",
  "registerCompetitionOptIn",
  "registerPassword"
];

const missingIds = requiredSharedIds.filter((id) =>
  indexHtml.includes(`id="${id}"`) && !demoHtml.includes(`id="${id}"`)
);

if (missingIds.length) {
  throw new Error(`demo-test-app.html is missing signup fixture ids from index.html: ${missingIds.join(", ")}`);
}

console.log("Demo fixture signup controls are in sync.");
