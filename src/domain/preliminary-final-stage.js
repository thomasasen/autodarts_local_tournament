// Pure/domain mutations for qualification and final-stage generation.

  function getPreliminaryMatches(tournament) {
    return getMatchesByStage(tournament, MATCH_STAGE_PRELIMINARY);
  }

  function isPreliminaryComplete(tournament) {
    const matches = getPreliminaryMatches(tournament);
    return matches.length > 0 && matches.every((match) => match.status === STATUS_COMPLETED && isCompletedMatchResultValid(tournament, match));
  }

  function getPreliminaryStandingBucketKey(row) {
    return `${row.points}|${row.legDifference}|${row.legsFor}`;
  }

  function analyzePreliminaryQualification(tournament) {
    if (!tournament || tournament.mode !== "preliminary_final") {
      return { ok: false, reasonCode: "final_stage_type_invalid", message: "Kein Vorrunde-und-Finalphase-Turnier." };
    }
    if (!isPreliminaryComplete(tournament)) {
      return { ok: false, reasonCode: "preliminary_not_completed", message: "Die Finalphase kann erst nach allen Vorrundenmatches erzeugt werden." };
    }
    const rows = buildPreliminaryStandings(tournament);
    const qualifierCount = clampInt(tournament?.finalStage?.qualifierCount, 0, 0, rows.length);
    const buckets = [];
    rows.forEach((row, index) => {
      const key = getPreliminaryStandingBucketKey(row);
      let bucket = buckets[buckets.length - 1];
      if (!bucket || bucket.key !== key) {
        bucket = { key, startIndex: index, rows: [] };
        buckets.push(bucket);
      }
      bucket.rows.push(row);
    });
    const unresolvedBuckets = buckets.filter((bucket) => bucket.rows.length > 1 && bucket.startIndex < qualifierCount);
    const storedResolution = tournament?.finalStage?.qualificationResolution;
    const storedOrder = storedResolution?.orderedParticipantIds || [];
    const bucketIndexById = new Map();
    buckets.forEach((bucket, bucketIndex) => bucket.rows.forEach((row) => bucketIndexById.set(row.id, bucketIndex)));
    const respectsObjectiveBuckets = storedOrder.every((participantId, index) => (
      index === 0 || bucketIndexById.get(participantId) >= bucketIndexById.get(storedOrder[index - 1])
    ));
    const hasStoredResolution = storedOrder.length === rows.length
      && new Set(storedOrder).size === rows.length
      && rows.every((row) => storedOrder.includes(row.id))
      && Boolean(normalizeText(storedResolution?.reason || ""))
      && respectsObjectiveBuckets;
    const orderedParticipantIds = unresolvedBuckets.length
      ? (hasStoredResolution ? storedOrder.slice() : null)
      : rows.map((row) => row.id);
    return {
      ok: Boolean(orderedParticipantIds),
      reasonCode: orderedParticipantIds ? "" : "final_stage_qualification_unresolved",
      message: orderedParticipantIds ? "" : "Gleichstand an einem Qualifikations- oder Setzplatz muss sichtbar aufgel\u00f6st werden.",
      rows,
      buckets,
      unresolvedBuckets,
      qualifierCount,
      orderedParticipantIds,
    };
  }

  function recordPreliminaryQualificationResolution(tournament, rawOrderedParticipantIds, rawReason) {
    if (!tournament || tournament.mode !== "preliminary_final") return { ok: false, reasonCode: "final_stage_type_invalid", message: "Kein passender Turniermodus." };
    if (hasPreliminaryFinalStageStarted(tournament)) return { ok: false, reasonCode: "final_stage_already_started", message: "Die Finalphase hat bereits begonnen." };
    if (!isPreliminaryComplete(tournament)) return { ok: false, reasonCode: "preliminary_not_completed", message: "Die Vorrunde ist noch nicht abgeschlossen." };
    const reason = normalizeText(rawReason || "");
    if (!reason) return { ok: false, reasonCode: "qualification_resolution_reason_required", message: "Bitte eine Begr\u00fcndung f\u00fcr die Veranstalterentscheidung angeben." };
    const rows = buildPreliminaryStandings(tournament);
    const orderedParticipantIds = (Array.isArray(rawOrderedParticipantIds) ? rawOrderedParticipantIds : []).map((id) => normalizeText(id || "")).filter(Boolean);
    if (orderedParticipantIds.length !== rows.length || new Set(orderedParticipantIds).size !== rows.length || rows.some((row) => !orderedParticipantIds.includes(row.id))) {
      return { ok: false, reasonCode: "qualification_resolution_order_invalid", message: "Die Reihenfolge muss jeden Teilnehmer genau einmal enthalten." };
    }
    const bucketIndexById = new Map();
    let bucketIndex = -1;
    let lastKey = null;
    rows.forEach((row) => {
      const key = getPreliminaryStandingBucketKey(row);
      if (key !== lastKey) { bucketIndex += 1; lastKey = key; }
      bucketIndexById.set(row.id, bucketIndex);
    });
    for (let index = 1; index < orderedParticipantIds.length; index += 1) {
      if (bucketIndexById.get(orderedParticipantIds[index]) < bucketIndexById.get(orderedParticipantIds[index - 1])) {
        return { ok: false, reasonCode: "qualification_resolution_order_invalid", message: "Eindeutig getrennte Tabellenpl\u00e4tze d\u00fcrfen nicht vertauscht werden." };
      }
    }
    tournament.finalStage.qualificationResolution = { orderedParticipantIds, reason, confirmedAt: nowIso() };
    tournament.updatedAt = nowIso();
    return { ok: true, resolution: tournament.finalStage.qualificationResolution };
  }

  function generatePreliminaryFinalStage(tournament) {
    if (!tournament || tournament.mode !== "preliminary_final") return { ok: false, reasonCode: "final_stage_type_invalid", message: "Kein passender Turniermodus." };
    if (!FINAL_STAGE_TYPES.includes(tournament?.finalStage?.type)) return { ok: false, reasonCode: "final_stage_type_invalid", message: "Finalphase muss KO oder Doppel-KO sein." };
    if (hasPreliminaryFinalStageStarted(tournament)) return { ok: false, reasonCode: "final_stage_already_started", message: "Die Finalphase hat bereits begonnen." };
    const analysis = analyzePreliminaryQualification(tournament);
    if (!analysis.ok) return analysis;
    const qualifierIds = analysis.orderedParticipantIds.slice(0, tournament.finalStage.qualifierCount);
    const participantByIdMap = new Map(tournament.participants.map((participant) => [participant.id, participant]));
    const qualifiers = qualifierIds.map((id) => participantByIdMap.get(id)).filter(Boolean);
    if (qualifiers.length !== tournament.finalStage.qualifierCount) return { ok: false, reasonCode: "final_stage_qualifier_count_invalid", message: "Qualifikanten konnten nicht vollst\u00e4ndig zugeordnet werden." };
    const seeds = generateSeeds(qualifiers, KO_DRAW_MODE_SEEDED);
    const isDoubleKo = tournament.finalStage.type === FINAL_STAGE_TYPE_DOUBLE_KO;
    const structure = isDoubleKo
      ? buildDoubleKoBracketStructure(qualifiers, seeds, { grandFinalResetMode: GRAND_FINAL_RESET_IF_NEEDED })
      : buildBracketStructure(qualifiers, seeds, { enableThirdPlaceMatch: false });
    tournament.finalStage.ko = buildKoMetaSnapshot(KO_DRAW_MODE_SEEDED, true, structure);
    tournament.finalStage.seeding = qualifierIds;
    tournament.finalStage.generatedAt = nowIso();
    tournament.finalStage.status = "generated";
    const nonKoMatches = tournament.matches.filter((match) => match.stage !== MATCH_STAGE_KO);
    tournament.matches = nonKoMatches.concat(buildKoMatchesFromStructure(structure));
    tournament.updatedAt = nowIso();
    return { ok: true, qualifierIds, matches: getMatchesByStage(tournament, MATCH_STAGE_KO) };
  }

  function hasPreliminaryFinalStageStarted(tournament) {
    if (!tournament || tournament.mode !== "preliminary_final") return false;
    return getMatchesByStage(tournament, MATCH_STAGE_KO).some((match) => {
      if (isByeMatchResult(match)) return false;
      const auto = ensureMatchAutoMeta(match);
      return match.status === STATUS_COMPLETED || (auto.status === "started" && Boolean(auto.lobbyId));
    });
  }

  function refreshPreliminaryFinalStageStatus(tournament) {
    if (!tournament || tournament.mode !== "preliminary_final") return false;
    let changed = false;
    const complete = isPreliminaryComplete(tournament);
    if (complete && !tournament.preliminary.completedAt) { tournament.preliminary.completedAt = nowIso(); changed = true; }
    if (!complete && tournament.preliminary.completedAt) { tournament.preliminary.completedAt = null; changed = true; }
    const finalMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    let nextStatus = finalMatches.length ? "generated" : "pending";
    if (hasPreliminaryFinalStageStarted(tournament)) nextStatus = "started";
    if (finalMatches.length && finalMatches.every((match) => match.status === STATUS_COMPLETED && isCompletedMatchResultValid(tournament, match))) nextStatus = "completed";
    if (tournament.finalStage.status !== nextStatus) { tournament.finalStage.status = nextStatus; changed = true; }
    return changed;
  }

  function resetPreliminaryMatchForCorrection(tournament, matchId) {
    if (!tournament || tournament.mode !== "preliminary_final") return { ok: false, reasonCode: "final_stage_type_invalid", message: "Kein passender Turniermodus." };
    if (hasPreliminaryFinalStageStarted(tournament)) return { ok: false, reasonCode: "final_stage_already_started", message: "Nach Beginn der Finalphase sind Vorrundenkorrekturen gesperrt." };
    const match = findMatch(tournament, matchId);
    if (!match || match.stage !== MATCH_STAGE_PRELIMINARY) return { ok: false, reasonCode: "match_not_found", message: "Vorrundenmatch nicht gefunden." };
    const discardedFinalStage = getMatchesByStage(tournament, MATCH_STAGE_KO).length > 0;
    if (discardedFinalStage) {
      tournament.matches = tournament.matches.filter((entry) => entry.stage !== MATCH_STAGE_KO);
      tournament.finalStage.ko = null;
      tournament.finalStage.seeding = [];
      tournament.finalStage.generatedAt = null;
      tournament.finalStage.status = "pending";
    }
    clearMatchResult(match);
    tournament.finalStage.qualificationResolution = null;
    tournament.preliminary.completedAt = null;
    tournament.updatedAt = nowIso();
    return { ok: true, discardedFinalStage };
  }
