const GLOBALS_CONTRACT = Object.freeze({
  requiredKeys: Object.freeze([
    "__ATA_RUNTIME_BOOTSTRAPPED",
    "__ATA_RUNTIME",
  ]),
  forbiddenNewAtaGlobals: Object.freeze([
    "__ATA_APP",
    "__ATA_TEST_CONTRACTS",
  ]),
});
