/*
  Manual runtime self-test helper (browser console):

  const result = window.__ATA_RUNTIME?.runSelfTests?.();
  console.table(result?.results || []);
  result;
*/

function printAtaSelfTestResult() {
  const api = window.__ATA_RUNTIME;
  if (!api || typeof api.runSelfTests !== "function") {
    return { ok: false, message: "ATA runtime API not available." };
  }
  const result = api.runSelfTests();
  if (Array.isArray(result?.results)) {
    console.table(result.results);
  }
  return result;
}
