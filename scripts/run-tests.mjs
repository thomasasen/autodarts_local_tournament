import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const packageJsonPath = path.join(repoRoot, "package.json");
const buildScriptPath = path.join(repoRoot, "scripts", "build-userscript.mjs");
const syntaxCheckScriptPath = path.join(repoRoot, "scripts", "check-syntax.mjs");

const canonicalBaseName = "autodarts-local-tournament";
const legacyBaseName = "autodarts-tournament-assistant";

const canonicalUrls = Object.freeze({
  download:
    "https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-local-tournament.user.js",
  update:
    "https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-local-tournament.meta.js",
});

const legacyUrls = Object.freeze({
  download:
    "https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant.user.js",
  update:
    "https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant.meta.js",
});

const requiredGrantSet = new Set(["GM_getValue", "GM_setValue", "GM_xmlhttpRequest"]);
const requiredConnectSet = new Set(["api.autodarts.io"]);

function runCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}.`);
  }
}

function runPowerShellScript(relativeScriptPath) {
  const shell = process.platform === "win32" ? "powershell" : "pwsh";
  runCommand(
    shell,
    ["-ExecutionPolicy", "Bypass", "-File", path.join(repoRoot, relativeScriptPath)],
    relativeScriptPath
  );
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertMatch(text, pattern, message) {
  if (!pattern.test(text)) {
    throw new Error(message);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readUtf8(filePath) {
  return readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

function extractHeader(text) {
  const match = String(text || "").match(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/u);
  return match ? match[0] : "";
}

function collectHeaderEntries(header, key) {
  const regex = new RegExp(`^\\/\\/\\s*@${escapeRegExp(key)}\\s+(.+)$`, "gmu");
  const values = [];
  for (const match of header.matchAll(regex)) {
    values.push(String(match[1] || "").trim());
  }
  return values;
}

function assertUserscriptVariant({ variantLabel, userPath, metaPath, expectedUrls, packageVersion }) {
  assert(existsSync(userPath), `${variantLabel}: missing userscript artifact ${path.basename(userPath)}`);
  assert(existsSync(metaPath), `${variantLabel}: missing meta artifact ${path.basename(metaPath)}`);

  const userScriptText = readUtf8(userPath);
  const metaText = readUtf8(metaPath);

  const userHeader = extractHeader(userScriptText);
  const metaHeader = extractHeader(metaText);

  assert(userHeader, `${variantLabel}: userscript header missing.`);
  assert(metaHeader, `${variantLabel}: meta header missing.`);

  assertMatch(userHeader, new RegExp(`@name\\s+Autodarts Tournament Assistant`), `${variantLabel}: @name missing or changed.`);
  assertMatch(userHeader, new RegExp(`@namespace\\s+https://github\\.com/thomasasen/autodarts_local_tournament`), `${variantLabel}: @namespace missing or changed.`);
  assertMatch(userHeader, new RegExp(`@version\\s+${escapeRegExp(packageVersion)}`), `${variantLabel}: @version not synced to package.json.`);
  assertMatch(userHeader, /@description\s+Local tournament manager for play\.autodarts\.io/, `${variantLabel}: @description missing.`);
  assertMatch(userHeader, /@author\s+Thomas Asen/, `${variantLabel}: @author missing.`);
  assertMatch(userHeader, /@license\s+MIT/, `${variantLabel}: @license missing.`);
  assertMatch(userHeader, /@match\s+\*:\/\/play\.autodarts\.io\/*/, `${variantLabel}: @match missing.`);
  assertMatch(userHeader, /@run-at\s+document-start/, `${variantLabel}: @run-at missing.`);

  assertMatch(userHeader, new RegExp(`@downloadURL\\s+${escapeRegExp(expectedUrls.download)}`), `${variantLabel}: @downloadURL mismatch.`);
  assertMatch(userHeader, new RegExp(`@updateURL\\s+${escapeRegExp(expectedUrls.update)}`), `${variantLabel}: @updateURL mismatch.`);

  assertMatch(metaHeader, new RegExp(`@version\\s+${escapeRegExp(packageVersion)}`), `${variantLabel} meta: @version mismatch.`);
  assertMatch(metaHeader, new RegExp(`@downloadURL\\s+${escapeRegExp(expectedUrls.download)}`), `${variantLabel} meta: @downloadURL mismatch.`);
  assertMatch(metaHeader, new RegExp(`@updateURL\\s+${escapeRegExp(expectedUrls.update)}`), `${variantLabel} meta: @updateURL mismatch.`);

  assert(!userScriptText.includes("__ATA_APP_VERSION__"), `${variantLabel}: unresolved version placeholder in userscript.`);
  assert(!metaText.includes("__ATA_APP_VERSION__"), `${variantLabel}: unresolved version placeholder in meta.`);

  assertMatch(
    userScriptText,
    new RegExp(`const APP_VERSION = "${escapeRegExp(packageVersion)}";`),
    `${variantLabel}: APP_VERSION constant not synced to package.json.`
  );

  const grants = new Set(collectHeaderEntries(userHeader, "grant"));
  assert(grants.size === requiredGrantSet.size, `${variantLabel}: unexpected @grant count.`);
  for (const grant of requiredGrantSet) {
    assert(grants.has(grant), `${variantLabel}: missing @grant ${grant}.`);
  }

  const connectEntries = new Set(collectHeaderEntries(userHeader, "connect"));
  assert(connectEntries.size === requiredConnectSet.size, `${variantLabel}: unexpected @connect count.`);
  for (const connect of requiredConnectSet) {
    assert(connectEntries.has(connect), `${variantLabel}: missing @connect ${connect}.`);
  }

  const sequenceMarkers = [
    "const RUNTIME_GUARD_KEY = \"__ATA_RUNTIME_BOOTSTRAPPED\";",
    "function addCleanup(fn)",
    "function normalizeStoreShape(input)",
    "function migrateStorage(rawValue)",
    "async function loadPersistedStore()",
    "function initEventBridge()",
    "function setupRuntimeApi()",
    "function installRouteHooks()",
    "function renderShell()",
    "async function init()",
  ];

  let previousIndex = -1;
  for (const marker of sequenceMarkers) {
    const markerIndex = userScriptText.indexOf(marker);
    assert(markerIndex >= 0, `${variantLabel}: boot marker missing (${marker}).`);
    assert(markerIndex > previousIndex, `${variantLabel}: boot marker order changed around (${marker}).`);
    previousIndex = markerIndex;
  }

  assert(userScriptText.includes("window.dispatchEvent(new CustomEvent(READY_EVENT"), `${variantLabel}: READY_EVENT dispatch missing.`);
  assert(userScriptText.includes("window[RUNTIME_GUARD_KEY] = true"), `${variantLabel}: runtime guard assignment missing.`);
  assert(userScriptText.includes("window[RUNTIME_GLOBAL_KEY] = {"), `${variantLabel}: runtime public API missing.`);

  assert(!userScriptText.includes("REMOTE_SOURCE_URL"), `${variantLabel}: main dist must not include loader remote-download runtime.`);
  assert(!userScriptText.includes("executeWithCacheFallback"), `${variantLabel}: main dist must not include loader execution path.`);
}

runCommand(process.execPath, [syntaxCheckScriptPath], "syntax gate");
runCommand(process.execPath, [buildScriptPath], "userscript build");

const packageVersion = JSON.parse(readUtf8(packageJsonPath)).version;

assertUserscriptVariant({
  variantLabel: "canonical",
  userPath: path.join(repoRoot, "dist", `${canonicalBaseName}.user.js`),
  metaPath: path.join(repoRoot, "dist", `${canonicalBaseName}.meta.js`),
  expectedUrls: canonicalUrls,
  packageVersion,
});

assertUserscriptVariant({
  variantLabel: "legacy-alias",
  userPath: path.join(repoRoot, "dist", `${legacyBaseName}.user.js`),
  metaPath: path.join(repoRoot, "dist", `${legacyBaseName}.meta.js`),
  expectedUrls: legacyUrls,
  packageVersion,
});

runPowerShellScript("scripts/test-domain.ps1");
runPowerShellScript("scripts/test-runtime-contract.ps1");

console.log("All tests passed: syntax, build artifacts, headers, boot-order checks, domain tests, runtime contract.");
