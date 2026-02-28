// App layer: runtime orchestration, persistence scheduling and user feedback.

  function maybePersistKoMigrationBackup(tournament, defaultDrawMode = KO_DRAW_MODE_SEEDED) {
    if (!tournament || tournament.mode !== "ko") {
      return;
    }

    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, defaultDrawMode);
    const drawLocked = tournament?.ko?.drawLocked !== false;
    const engineVersion = normalizeKoEngineVersion(tournament?.ko?.engineVersion, 0);
    if (engineVersion >= KO_ENGINE_VERSION) {
      return;
    }

    const normalizedKo = normalizeTournamentKoMeta(tournament?.ko, drawMode, drawLocked);
    const nextKo = {
      ...normalizedKo,
      drawMode,
      drawLocked,
      engineVersion: KO_ENGINE_VERSION,
    };
    if (isSerializableEqual(tournament.ko, nextKo)) {
      return;
    }

    const backupSnapshot = cloneSerializable(tournament);
    if (!backupSnapshot) {
      return;
    }

    persistKoMigrationBackup(backupSnapshot, "ko-engine-v3-migration").catch((error) => {
      logWarn("storage", "KO migration backup write failed.", error);
    });
  }


  function refreshDerivedMatches(tournament) {
    if (!tournament) {
      return false;
    }

    let changedAny = false;
    for (let i = 0; i < 8; i += 1) {
      let changed = false;
      maybePersistKoMigrationBackup(tournament, KO_DRAW_MODE_SEEDED);
      changed = migrateKoTournamentToV3(tournament, KO_DRAW_MODE_SEEDED) || changed;
      changed = resolveGroupsToKoAssignments(tournament) || changed;
      changed = synchronizeKoBracketState(tournament) || changed;
      changed = normalizeCompletedMatchResults(tournament) || changed;
      changed = synchronizeKoBracketState(tournament) || changed;
      if (tournament.mode === "groups_ko") {
        changed = advanceKoWinners(tournament) || changed;
      }
      changed = refreshTournamentResultsIndex(tournament) || changed;
      changedAny = changedAny || changed;
      if (!changed) {
        break;
      }
    }

    return changedAny;
  }

