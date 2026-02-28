  const __ATA_TEST_REGISTRY = [];


  function test(name, run) {
    __ATA_TEST_REGISTRY.push({ name, run });
  }


  function assert(condition, message = "Assertion failed.") {
    if (!condition) {
      throw new Error(message);
    }
  }


  function assertEqual(actual, expected, message = "") {
    if (actual !== expected) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
    }
  }


  function assertDeepEqual(actual, expected, message = "") {
    const left = JSON.stringify(actual);
    const right = JSON.stringify(expected);
    if (left !== right) {
      throw new Error(message || `Expected ${right}, got ${left}.`);
    }
  }


  function participantList(count, prefix = "P") {
    const list = [];
    for (let i = 1; i <= count; i += 1) {
      list.push({ id: `${prefix}${i}`, name: `${prefix}${i}` });
    }
    return list;
  }


  function createKoTournament(participants, overrides = {}) {
    return createTournament({
      name: overrides.name || "KO Test",
      mode: "ko",
      bestOfLegs: overrides.bestOfLegs || 3,
      startScore: overrides.startScore || 501,
      x01Preset: overrides.x01Preset || X01_PRESET_PDC_STANDARD,
      x01InMode: overrides.x01InMode || "Straight",
      x01OutMode: overrides.x01OutMode || "Double",
      x01BullMode: overrides.x01BullMode || "25/50",
      x01MaxRounds: overrides.x01MaxRounds || 50,
      x01BullOffMode: overrides.x01BullOffMode || "Normal",
      lobbyVisibility: "private",
      randomizeKoRound1: Boolean(overrides.randomizeKoRound1),
      koDrawLocked: overrides.koDrawLocked !== false,
      participants,
    });
  }


  function createLeagueTournament(participants, overrides = {}) {
    return createTournament({
      name: overrides.name || "League Test",
      mode: "league",
      bestOfLegs: overrides.bestOfLegs || 3,
      startScore: overrides.startScore || 501,
      x01Preset: overrides.x01Preset || X01_PRESET_PDC_STANDARD,
      x01InMode: overrides.x01InMode || "Straight",
      x01OutMode: overrides.x01OutMode || "Double",
      x01BullMode: overrides.x01BullMode || "25/50",
      x01MaxRounds: overrides.x01MaxRounds || 50,
      x01BullOffMode: overrides.x01BullOffMode || "Normal",
      lobbyVisibility: "private",
      randomizeKoRound1: false,
      koDrawLocked: true,
      participants,
    });
  }


  async function runRegisteredTests() {
    const results = [];

    for (const entry of __ATA_TEST_REGISTRY) {
      try {
        await entry.run();
        results.push({ name: entry.name, ok: true, details: "" });
      } catch (error) {
        results.push({
          name: entry.name,
          ok: false,
          details: normalizeText(error?.message || error),
        });
      }
    }

    const passed = results.filter((entry) => entry.ok).length;
    const failed = results.length - passed;
    return {
      ok: failed === 0,
      passed,
      failed,
      results,
      generatedAt: nowIso(),
    };
  }

