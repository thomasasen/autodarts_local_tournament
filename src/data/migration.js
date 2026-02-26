// Auto-generated module split from dist source.
  async function persistKoMigrationBackup(tournamentSnapshot, reason = "ko-engine-v2-migration") {
    const snapshot = cloneSerializable(tournamentSnapshot);
    if (!snapshot) {
      return false;
    }

    const backupsRaw = await readStoreValue(STORAGE_KO_MIGRATION_BACKUPS_KEY, []);
    const backups = Array.isArray(backupsRaw) ? backupsRaw : [];
    backups.unshift({
      id: uuid("ko-backup"),
      reason: normalizeText(reason) || "ko-engine-v2-migration",
      createdAt: nowIso(),
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tournament: snapshot,
    });
    const limitedBackups = backups.slice(0, 5);
    await writeStoreValue(STORAGE_KO_MIGRATION_BACKUPS_KEY, limitedBackups);
    return true;
  }


  function migrateStorage(rawValue) {
    if (!rawValue || typeof rawValue !== "object") {
      return createDefaultStore();
    }

    const version = Number(rawValue.schemaVersion || 0);
    switch (version) {
      case 4:
      case 3:
      case 2:
      case 1:
        return normalizeStoreShape({
          ...rawValue,
          tournament: rawValue.tournament
            ? {
              ...rawValue.tournament,
              rules: normalizeTournamentRules(rawValue.tournament.rules),
            }
            : rawValue.tournament,
        });
      default:
        if (rawValue.mode && rawValue.participants) {
          return normalizeStoreShape({
            tournament: {
              ...rawValue,
              rules: normalizeTournamentRules(rawValue.rules),
            },
          });
        }
        return createDefaultStore();
    }
  }


