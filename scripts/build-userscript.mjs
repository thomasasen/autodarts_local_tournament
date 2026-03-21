import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");

const packageJsonPath = path.join(repoRoot, "package.json");
const manifestPath = path.join(repoRoot, "build", "manifest.json");
const cssPath = path.join(repoRoot, "src", "ui", "styles", "main.css");
const logoPath = path.join(repoRoot, "assets", "pdc_logo.png");

const canonicalBaseName = "autodarts-local-tournament";
const legacyBaseName = "autodarts-tournament-assistant";

const repositoryBaseUrl =
  "https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist";

const canonicalUrls = Object.freeze({
  download: `${repositoryBaseUrl}/${canonicalBaseName}.user.js`,
  update: `${repositoryBaseUrl}/${canonicalBaseName}.meta.js`,
});

const legacyUrls = Object.freeze({
  download: `${repositoryBaseUrl}/${legacyBaseName}.user.js`,
  update: `${repositoryBaseUrl}/${legacyBaseName}.meta.js`,
});

function normalizeSourceChunk(text) {
  return String(text || "")
    .replace(/^\uFEFF/, "")
    .replace(/^\s*\/\/ Auto-generated module split from dist source\.\r?\n/, "")
    .trimEnd();
}

function createUserscriptHeader({ version, downloadUrl, updateUrl }) {
  return `// ==UserScript==\n// @name         Autodarts Tournament Assistant\n// @namespace    https://github.com/thomasasen/autodarts_local_tournament\n// @version      ${version}\n// @description  Local tournament manager for play.autodarts.io (KO, Liga, Gruppen + KO)\n// @author       Thomas Asen\n// @license      MIT\n// @match        *://play.autodarts.io/*\n// @run-at       document-start\n// @grant        GM_getValue\n// @grant        GM_setValue\n// @grant        GM_xmlhttpRequest\n// @connect      api.autodarts.io\n// @downloadURL  ${downloadUrl}\n// @updateURL    ${updateUrl}\n// ==/UserScript==\n`;
}

function stripUserscriptHeader(sourceText) {
  return String(sourceText || "").replace(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/u, "");
}

function assertPlaceholderReplaced(text, placeholder, label) {
  if (String(text || "").includes(placeholder)) {
    throw new Error(`${label} placeholder replacement failed: ${placeholder}`);
  }
}

function toAbsoluteRepoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

async function readPackageVersion() {
  const packageJsonRaw = (await readFile(packageJsonPath, "utf8")).replace(/^\uFEFF/, "");
  const packageJson = JSON.parse(packageJsonRaw);
  const version = String(packageJson.version || "").trim();
  if (!version) {
    throw new Error("package.json is missing a valid version.");
  }
  return version;
}

async function readManifestFiles() {
  const manifestRaw = (await readFile(manifestPath, "utf8")).replace(/^\uFEFF/, "");
  const manifest = JSON.parse(manifestRaw);
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  if (!files.length) {
    throw new Error("build/manifest.json does not contain files.");
  }
  return files;
}

async function readBundleSource() {
  const manifestFiles = await readManifestFiles();
  const parts = [];

  for (const relativeFile of manifestFiles) {
    const fullPath = toAbsoluteRepoPath(relativeFile);
    const raw = await readFile(fullPath, "utf8");
    parts.push(normalizeSourceChunk(raw));
  }

  return `${parts.join("\n\n")}\n`;
}

async function replaceBundlePlaceholders(source, version) {
  const cssRaw = await readFile(cssPath, "utf8");
  const cssEscaped = cssRaw.trimEnd().replaceAll("`", "``").replaceAll("${", "\\${");

  const logoRaw = await readFile(logoPath);
  const logoDataUri = `data:image/png;base64,${logoRaw.toString("base64")}`;
  const logoEscaped = logoDataUri.replaceAll("`", "``").replaceAll("${", "\\${");

  let bundle = String(source || "");
  bundle = bundle.replaceAll("__ATA_APP_VERSION__", version);
  bundle = bundle.replaceAll("__ATA_UI_MAIN_CSS__", cssEscaped);
  bundle = bundle.replaceAll("__ATA_PDC_LOGO_DATA_URI__", logoEscaped);

  assertPlaceholderReplaced(bundle, "__ATA_APP_VERSION__", "Version");
  assertPlaceholderReplaced(bundle, "__ATA_UI_MAIN_CSS__", "CSS");
  assertPlaceholderReplaced(bundle, "__ATA_PDC_LOGO_DATA_URI__", "Logo");

  return stripUserscriptHeader(bundle).replace(/\r\n/g, "\n");
}

async function transpileBundle(sourceWithoutHeader) {
  const result = await build({
    stdin: {
      contents: sourceWithoutHeader,
      sourcefile: "autodarts-runtime-input.js",
      resolveDir: repoRoot,
      loader: "js",
    },
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["chrome100", "firefox100"],
    write: false,
    charset: "utf8",
    legalComments: "none",
  });

  const output = result.outputFiles?.[0]?.text;
  if (!output) {
    throw new Error("esbuild did not produce output.");
  }

  return output.replace(/\r\n/g, "\n").trimEnd() + "\n";
}

async function writeVariant({ baseName, urls, version, transpiledBody }) {
  const header = createUserscriptHeader({
    version,
    downloadUrl: urls.download,
    updateUrl: urls.update,
  });

  const userScriptPath = path.join(distDir, `${baseName}.user.js`);
  const metaPath = path.join(distDir, `${baseName}.meta.js`);

  await writeFile(userScriptPath, `${header}\n${transpiledBody}`, "utf8");
  await writeFile(metaPath, `${header}\n`, "utf8");
}

const version = await readPackageVersion();
const source = await readBundleSource();
const preparedSource = await replaceBundlePlaceholders(source, version);
const transpiledBody = await transpileBundle(preparedSource);

await mkdir(distDir, { recursive: true });

await writeVariant({
  baseName: canonicalBaseName,
  urls: canonicalUrls,
  version,
  transpiledBody,
});

await writeVariant({
  baseName: legacyBaseName,
  urls: legacyUrls,
  version,
  transpiledBody,
});

console.log(
  `Userscript build successful: dist/${canonicalBaseName}.user.js, dist/${canonicalBaseName}.meta.js (+ legacy aliases).`
);
