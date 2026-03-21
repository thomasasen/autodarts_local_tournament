import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

const scanRoots = ["src", "scripts", "installer", "tests", "dist"];
const skipDirectories = new Set(["node_modules", ".git", ".tmp-domain-tests", ".tmp-runtime-contract"]);
const jsExtensions = new Set([".js", ".mjs", ".cjs"]);

const jsonFiles = [
  "package.json",
  "package-lock.json",
  "build/manifest.json",
  "build/domain-test-manifest.json",
  "build/version.json",
];

function normalizeSourceChunk(text) {
  return String(text || "")
    .replace(/^\uFEFF/, "")
    .replace(/^\s*\/\/ Auto-generated module split from dist source\.\r?\n/, "")
    .trimEnd();
}

async function collectJavaScriptFiles(rootDirectory) {
  const absoluteRoot = path.join(repoRoot, rootDirectory);
  let entries;
  try {
    entries = await readdir(absoluteRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirectories.has(entry.name)) {
        continue;
      }
      const nestedDirectory = path.join(rootDirectory, entry.name);
      files.push(...(await collectJavaScriptFiles(nestedDirectory)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!jsExtensions.has(extension)) {
      continue;
    }

    files.push(path.join(rootDirectory, entry.name));
  }

  return files;
}

function assertNodeSyntax(absoluteFilePath, label) {
  const result = spawnSync(process.execPath, ["--check", absoluteFilePath], {
    cwd: repoRoot,
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(details || `node --check failed for ${label}`);
  }
}

async function assertManifestBundleSyntax() {
  const manifestRaw = (await readFile(path.join(repoRoot, "build", "manifest.json"), "utf8")).replace(/^\uFEFF/, "");
  const manifest = JSON.parse(manifestRaw);
  const files = Array.isArray(manifest.files) ? manifest.files : [];

  if (!files.length) {
    throw new Error("build/manifest.json does not contain files for source syntax check.");
  }

  const parts = [];
  for (const relativeFilePath of files) {
    const absolutePath = path.join(repoRoot, relativeFilePath);
    const raw = await readFile(absolutePath, "utf8");
    parts.push(normalizeSourceChunk(raw));
  }

  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "ata-syntax-"));
  const tempFilePath = path.join(tempDirectory, "manifest-bundle.js");

  try {
    await writeFile(tempFilePath, `${parts.join("\n\n")}\n`, "utf8");
    assertNodeSyntax(tempFilePath, "manifest bundle");
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

async function assertUtf8(relativeFilePath) {
  const absoluteFilePath = path.join(repoRoot, relativeFilePath);
  const raw = await readFile(absoluteFilePath);
  utf8Decoder.decode(raw);
}

async function assertJsonSyntax(relativeFilePath) {
  const absoluteFilePath = path.join(repoRoot, relativeFilePath);
  const jsonRaw = (await readFile(absoluteFilePath, "utf8")).replace(/^\uFEFF/, "");
  JSON.parse(jsonRaw);
}

const jsFiles = (
  await Promise.all(scanRoots.map((rootDirectory) => collectJavaScriptFiles(rootDirectory)))
)
  .flat()
  .sort((left, right) => left.localeCompare(right));

if (!jsFiles.length) {
  throw new Error("No JavaScript files found for syntax validation.");
}

const failures = [];

for (const relativeFilePath of jsFiles) {
  try {
    await assertUtf8(relativeFilePath);
    const isManifestSplitSource = relativeFilePath.startsWith("src/") || relativeFilePath.startsWith(`src${path.sep}`);
    if (!isManifestSplitSource) {
      assertNodeSyntax(path.join(repoRoot, relativeFilePath), relativeFilePath);
    }
  } catch (error) {
    failures.push({ file: relativeFilePath, error });
  }
}

try {
  await assertManifestBundleSyntax();
} catch (error) {
  failures.push({ file: "build/manifest.json -> bundled src syntax", error });
}

for (const relativeFilePath of jsonFiles) {
  const absolutePath = path.join(repoRoot, relativeFilePath);
  try {
    await readFile(absolutePath);
    await assertJsonSyntax(relativeFilePath);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      continue;
    }
    failures.push({ file: relativeFilePath, error });
  }
}

if (failures.length) {
  console.error(`Syntax check failed for ${failures.length} file(s):`);
  for (const failure of failures) {
    const message = failure.error instanceof Error ? failure.error.message : String(failure.error);
    console.error(`- ${failure.file}`);
    console.error(`  ${message}`);
  }
  process.exit(1);
}

console.log(
  `Syntax check passed: ${jsFiles.length} JavaScript file(s) + bundled src syntax + ${jsonFiles.length} JSON target(s).`
);
