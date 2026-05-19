const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const configText = fs.readFileSync(path.join(projectRoot, "app-config.js"), "utf8");

function readConfigValue(key) {
  const match = configText.match(new RegExp(`${key}:\\s*"([^"]+)"`));
  return match?.[1] || "";
}

async function readJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

(async () => {
  const supabaseUrl = process.env.SUPABASE_URL || readConfigValue("url");
  const anonKey = process.env.SUPABASE_ANON_KEY || readConfigValue("anonKey");
  const productionUrl = process.env.PRODUCTION_URL || "";

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase URL or anon key for production smoke checks.");
  }

  if (productionUrl) {
    const response = await fetch(productionUrl);
    if (!response.ok) {
      throw new Error(`${productionUrl} returned ${response.status}`);
    }
    const html = await response.text();
    if (!html.includes("Pathway to Christ")) {
      throw new Error("Production site did not return expected Pathway to Christ markup.");
    }
  }

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`
  };
  const wards = await readJson(`${supabaseUrl}/rest/v1/wards?select=id,name&order=name.asc`, headers);
  const pocatello = wards.find((ward) => /pocatello creek/i.test(ward.name || ""));

  if (!pocatello) {
    throw new Error("Pocatello Creek Ward was not returned by the public ward list.");
  }

  console.log(`Production smoke checks passed. Wards visible: ${wards.length}.`);
})();
