const RUNTIME_API_CONTRACT = Object.freeze({
  globalKey: "__ATA_RUNTIME",
  requiredKeys: Object.freeze([
    "version",
    "isReady",
    "openDrawer",
    "closeDrawer",
    "toggleDrawer",
    "getDebugReport",
    "runSelfTests",
  ]),
  functionKeys: Object.freeze([
    "isReady",
    "openDrawer",
    "closeDrawer",
    "toggleDrawer",
    "getDebugReport",
    "runSelfTests",
  ]),
});
