// Domain layer: deterministic tournament duration estimation with dependency-aware board scheduling.

  const TOURNAMENT_DURATION_BASE_LEG_MINUTES = 3.75;
  const TOURNAMENT_DURATION_RESULT_ENTRY_MINUTES = 0.80;
  const TOURNAMENT_DURATION_LOW_FACTOR = 0.90;
  const TOURNAMENT_DURATION_HIGH_BASE_PADDING = 0.12;
  const TOURNAMENT_DURATION_SCORE_FACTORS = Object.freeze({
    121: 0.50,
    170: 0.58,
    301: 0.74,
    501: 1.00,
    701: 1.24,
    901: 1.42,
  });
  const TOURNAMENT_DURATION_IN_FACTORS = Object.freeze({
    Straight: 1.00,
    Double: 1.06,
    Master: 1.10,
  });
  const TOURNAMENT_DURATION_OUT_FACTORS = Object.freeze({
    Straight: 0.93,
    Double: 1.00,
    Master: 1.05,
  });
  const TOURNAMENT_DURATION_BULL_FACTORS = Object.freeze({
    "25/50": 1.00,
    "50/50": 0.98,
  });
  const TOURNAMENT_DURATION_BULL_OFF_OVERHEAD = Object.freeze({
    Off: 0.00,
    Normal: 0.40,
    Official: 0.65,
  });
  const TOURNAMENT_DURATION_MAX_ROUNDS_HIGH_PADDING = Object.freeze({
    15: 0.00,
    20: 0.02,
    50: 0.06,
    80: 0.09,
  });
  const TOURNAMENT_TIME_PROFILE_META = Object.freeze({
    [TOURNAMENT_TIME_PROFILE_FAST]: Object.freeze({
      id: TOURNAMENT_TIME_PROFILE_FAST,
      label: "Schnell",
      description: "F\u00fcr z\u00fcgige Felder mit wenig Verz\u00f6gerung zwischen den Matches.",
      legPaceMultiplier: 0.88,
      matchTransitionMinutes: 0.55,
      phaseTransitionMultiplier: 0.90,
      highPaddingExtra: 0.00,
    }),
    [TOURNAMENT_TIME_PROFILE_NORMAL]: Object.freeze({
      id: TOURNAMENT_TIME_PROFILE_NORMAL,
      label: "Normal",
      description: "Ausgewogener Standard f\u00fcr lokale Turniere.",
      legPaceMultiplier: 1.00,
      matchTransitionMinutes: 0.80,
      phaseTransitionMultiplier: 1.00,
      highPaddingExtra: 0.00,
    }),
    [TOURNAMENT_TIME_PROFILE_SLOW]: Object.freeze({
      id: TOURNAMENT_TIME_PROFILE_SLOW,
      label: "Langsam",
      description: "F\u00fcr gemischte Felder oder langsamere Board-Wechsel.",
      legPaceMultiplier: 1.15,
      matchTransitionMinutes: 1.15,
      phaseTransitionMultiplier: 1.15,
      highPaddingExtra: 0.02,
    }),
  });


  function getTournamentTimeProfileMeta(profileId = TOURNAMENT_TIME_PROFILE_NORMAL) {
    const normalized = sanitizeTournamentTimeProfile(profileId, TOURNAMENT_TIME_PROFILE_NORMAL);
    return TOURNAMENT_TIME_PROFILE_META[normalized] || TOURNAMENT_TIME_PROFILE_META[TOURNAMENT_TIME_PROFILE_NORMAL];
  }


  function getTournamentDurationCombination(n, k) {
    if (!Number.isFinite(n) || !Number.isFinite(k) || k < 0 || k > n) {
      return 0;
    }
    let normalizedK = k;
    if (normalizedK > n - normalizedK) {
      normalizedK = n - normalizedK;
    }
    let result = 1;
    for (let index = 1; index <= normalizedK; index += 1) {
      result = (result * (n - normalizedK + index)) / index;
    }
    return result;
  }


  function getExpectedLegsForBestOf(bestOfLegs) {
    const bestOf = sanitizeBestOf(bestOfLegs);
    const legsToWin = getLegsToWin(bestOf);
    let expectedLegs = 0;
    for (let totalLegs = legsToWin; totalLegs < legsToWin * 2; totalLegs += 1) {
      const probability = 2
        * getTournamentDurationCombination(totalLegs - 1, legsToWin - 1)
        * Math.pow(0.5, totalLegs);
      expectedLegs += totalLegs * probability;
    }
    return expectedLegs;
  }


  function getTournamentDurationMatchCount(mode, participantCount) {
    const count = clampInt(participantCount, 0, 0, TECHNICAL_PARTICIPANT_HARD_MAX);
    if (mode === "league") {
      return (count * (count - 1)) / 2;
    }
    if (mode === "groups_ko") {
      const groupA = Math.ceil(count / 2);
      const groupB = Math.floor(count / 2);
      return ((groupA * (groupA - 1)) / 2) + ((groupB * (groupB - 1)) / 2) + 3;
    }
    return Math.max(0, count - 1);
  }


  function getTournamentDurationPhaseOverheadMinutes(mode, participantCount) {
    const count = clampInt(participantCount, 0, 0, TECHNICAL_PARTICIPANT_HARD_MAX);
    if (mode === "groups_ko") {
      return 4;
    }
    if (mode !== "ko" || count < 2) {
      return 0;
    }
    const bracketSize = calculateBracketSize(count);
    const rounds = Math.log2(bracketSize);
    return Math.max(0, rounds - 1) * 1.5;
  }


  function getTournamentDurationDifficultyPadding(x01Settings) {
    let padding = 0;
    if (x01Settings.baseScore === 701) {
      padding += 0.03;
    } else if (x01Settings.baseScore === 901) {
      padding += 0.05;
    }
    if (x01Settings.inMode === "Double") {
      padding += 0.01;
    } else if (x01Settings.inMode === "Master") {
      padding += 0.02;
    }
    if (x01Settings.outMode === "Master") {
      padding += 0.01;
    }
    if (x01Settings.bullOffMode === "Official") {
      padding += 0.01;
    }
    return padding;
  }


  function normalizeTournamentDurationParticipants(rawParticipants) {
    const source = Array.isArray(rawParticipants) ? rawParticipants : [];
    return source
      .map((entry, index) => {
        const id = normalizeText(entry?.id || entry?.name || entry || `p-${index + 1}`);
        return id || null;
      })
      .filter(Boolean);
  }


  function normalizeTournamentDurationTaskList(rawTasks) {
    const source = Array.isArray(rawTasks) ? rawTasks : [];
    const seen = new Set();
    const normalized = [];

    source.forEach((task, index) => {
      const taskId = normalizeText(task?.id || `duration-task-${index + 1}`);
      if (!taskId || seen.has(taskId)) {
        return;
      }
      seen.add(taskId);
      const participants = (Array.isArray(task?.participants) ? task.participants : [])
        .map((entry) => normalizeText(entry || ""))
        .filter(Boolean);
      const dependsOn = (Array.isArray(task?.dependsOn) ? task.dependsOn : [])
        .map((entry) => normalizeText(entry || ""))
        .filter(Boolean);
      normalized.push({
        id: taskId,
        participants,
        dependsOn,
      });
    });

    const taskIds = new Set(normalized.map((task) => task.id));
    return normalized.map((task) => ({
      ...task,
      dependsOn: task.dependsOn.filter((depId) => depId !== task.id && taskIds.has(depId)),
    }));
  }


  function buildTournamentDurationDependents(tasks) {
    const dependentsById = new Map();
    tasks.forEach((task) => {
      dependentsById.set(task.id, []);
    });
    tasks.forEach((task) => {
      task.dependsOn.forEach((depId) => {
        if (!dependentsById.has(depId)) {
          return;
        }
        dependentsById.get(depId).push(task.id);
      });
    });
    return dependentsById;
  }


  function getTournamentDurationTaskDepth(taskId, dependentsById, memo, visiting) {
    if (memo.has(taskId)) {
      return memo.get(taskId);
    }
    if (visiting.has(taskId)) {
      return 1;
    }

    visiting.add(taskId);
    const dependents = dependentsById.get(taskId) || [];
    let depth = 1;
    dependents.forEach((dependentId) => {
      depth = Math.max(
        depth,
        1 + getTournamentDurationTaskDepth(dependentId, dependentsById, memo, visiting),
      );
    });
    visiting.delete(taskId);
    memo.set(taskId, depth);
    return depth;
  }


  function estimateTournamentDurationSchedule(rawTasks, boardCount) {
    const safeBoardCount = sanitizeTournamentBoardCount(
      boardCount,
      TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT,
    );
    const tasks = normalizeTournamentDurationTaskList(rawTasks);
    if (!tasks.length) {
      return {
        waves: 0,
        peakParallelMatches: 0,
        averageParallelMatches: 0,
        boardUtilization: 0,
      };
    }

    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const dependentsById = buildTournamentDurationDependents(tasks);
    const remainingDependenciesById = new Map();
    tasks.forEach((task) => {
      const dependencyCount = task.dependsOn.filter((depId) => taskById.has(depId)).length;
      remainingDependenciesById.set(task.id, dependencyCount);
    });

    const criticalDepthById = new Map();
    tasks.forEach((task) => {
      getTournamentDurationTaskDepth(task.id, dependentsById, criticalDepthById, new Set());
    });

    const unscheduled = new Set(tasks.map((task) => task.id));
    let waves = 0;
    let peakParallelMatches = 0;
    let scheduledMatches = 0;

    while (unscheduled.size > 0) {
      const ready = tasks
        .filter((task) => unscheduled.has(task.id) && (remainingDependenciesById.get(task.id) || 0) <= 0)
        .sort((left, right) => {
          const leftDepth = criticalDepthById.get(left.id) || 1;
          const rightDepth = criticalDepthById.get(right.id) || 1;
          if (leftDepth !== rightDepth) {
            return rightDepth - leftDepth;
          }
          const leftDependentCount = (dependentsById.get(left.id) || []).length;
          const rightDependentCount = (dependentsById.get(right.id) || []).length;
          if (leftDependentCount !== rightDependentCount) {
            return rightDependentCount - leftDependentCount;
          }
          if (left.participants.length !== right.participants.length) {
            return right.participants.length - left.participants.length;
          }
          return left.id.localeCompare(right.id);
        });

      if (!ready.length) {
        const remaining = unscheduled.size;
        const fallbackWaves = Math.ceil(remaining / safeBoardCount);
        waves += fallbackWaves;
        peakParallelMatches = Math.max(peakParallelMatches, Math.min(safeBoardCount, remaining));
        scheduledMatches += remaining;
        break;
      }

      const usedParticipants = new Set();
      const selected = [];
      for (let index = 0; index < ready.length; index += 1) {
        if (selected.length >= safeBoardCount) {
          break;
        }
        const task = ready[index];
        const hasConflict = task.participants.some((participantId) => usedParticipants.has(participantId));
        if (hasConflict) {
          continue;
        }
        selected.push(task);
        task.participants.forEach((participantId) => usedParticipants.add(participantId));
      }

      if (!selected.length) {
        selected.push(ready[0]);
      }

      waves += 1;
      peakParallelMatches = Math.max(peakParallelMatches, selected.length);
      selected.forEach((task) => {
        if (!unscheduled.has(task.id)) {
          return;
        }
        unscheduled.delete(task.id);
        scheduledMatches += 1;
        const dependents = dependentsById.get(task.id) || [];
        dependents.forEach((dependentId) => {
          const currentCount = remainingDependenciesById.get(dependentId) || 0;
          remainingDependenciesById.set(dependentId, Math.max(0, currentCount - 1));
        });
      });
    }

    const averageParallelMatches = waves > 0 ? scheduledMatches / waves : 0;
    const boardUtilization = waves > 0
      ? scheduledMatches / (waves * safeBoardCount)
      : 0;
    return {
      waves,
      peakParallelMatches,
      averageParallelMatches,
      boardUtilization,
    };
  }


  function buildKoTournamentDurationTasks(participantCount) {
    const count = clampInt(participantCount, 0, 0, TECHNICAL_PARTICIPANT_HARD_MAX);
    if (count < 2) {
      return [];
    }

    const participants = Array.from({ length: count }, (_, index) => ({
      id: `ko-p-${index + 1}`,
      name: `P${index + 1}`,
    }));
    const structure = buildBracketStructure(participants, generateSeeds(participants, KO_DRAW_MODE_SEEDED));
    const playableMatchIds = new Set();

    structure.rounds.forEach((roundDef) => {
      roundDef.virtualMatches.forEach((virtualMatch) => {
        if (virtualMatch?.structuralBye) {
          return;
        }
        if (!virtualMatch?.competitors?.p1 || !virtualMatch?.competitors?.p2) {
          return;
        }
        playableMatchIds.add(virtualMatch.id);
      });
    });

    const tasks = [];
    structure.rounds.forEach((roundDef) => {
      roundDef.virtualMatches.forEach((virtualMatch) => {
        if (!playableMatchIds.has(virtualMatch.id)) {
          return;
        }
        const participantsInMatch = [];
        const dependencies = [];
        [virtualMatch.competitors?.p1, virtualMatch.competitors?.p2].forEach((competitorRef) => {
          if (competitorRef?.type === "participant") {
            const participantId = normalizeText(competitorRef.participantId || "");
            if (participantId) {
              participantsInMatch.push(`p:${participantId}`);
            }
            return;
          }
          if (competitorRef?.type !== "winner") {
            return;
          }
          const sourceMatchId = normalizeText(competitorRef.matchId || "");
          if (!sourceMatchId) {
            return;
          }
          participantsInMatch.push(`w:${sourceMatchId}`);
          if (playableMatchIds.has(sourceMatchId)) {
            dependencies.push(sourceMatchId);
          }
        });
        tasks.push({
          id: virtualMatch.id,
          participants: participantsInMatch,
          dependsOn: dependencies,
        });
      });
    });
    return tasks;
  }


  function buildLeagueTournamentDurationTasks(rawParticipants) {
    const participantIds = normalizeTournamentDurationParticipants(rawParticipants);
    const rounds = createRoundRobinPairings(participantIds);
    const tasks = [];
    rounds.forEach((pairs, roundIndex) => {
      pairs.forEach((pair, pairIndex) => {
        tasks.push({
          id: `league-r${roundIndex + 1}-m${pairIndex + 1}`,
          participants: [`p:${pair[0]}`, `p:${pair[1]}`],
          dependsOn: [],
        });
      });
    });
    return tasks;
  }


  function buildGroupsKoTournamentDurationTasks(rawParticipants) {
    const participantIds = normalizeTournamentDurationParticipants(rawParticipants);
    const groups = buildGroups(participantIds);
    const tasks = [];
    const groupStageTaskIds = [];

    groups.forEach((group) => {
      const rounds = createRoundRobinPairings(group.participantIds);
      rounds.forEach((pairs, roundIndex) => {
        pairs.forEach((pair, pairIndex) => {
          const taskId = `group-${group.id}-r${roundIndex + 1}-m${pairIndex + 1}`;
          tasks.push({
            id: taskId,
            participants: [`p:${pair[0]}`, `p:${pair[1]}`],
            dependsOn: [],
          });
          groupStageTaskIds.push(taskId);
        });
      });
    });

    const semifinalAId = "ko-r1-m1";
    const semifinalBId = "ko-r1-m2";
    const finalId = "ko-r2-m1";
    tasks.push({
      id: semifinalAId,
      participants: ["slot:A1", "slot:B2"],
      dependsOn: groupStageTaskIds,
    });
    tasks.push({
      id: semifinalBId,
      participants: ["slot:B1", "slot:A2"],
      dependsOn: groupStageTaskIds,
    });
    tasks.push({
      id: finalId,
      participants: [`w:${semifinalAId}`, `w:${semifinalBId}`],
      dependsOn: [semifinalAId, semifinalBId],
    });

    return tasks;
  }


  function buildTournamentDurationTasks(mode, participants, participantCount) {
    if (mode === "league") {
      return buildLeagueTournamentDurationTasks(participants);
    }
    if (mode === "groups_ko") {
      return buildGroupsKoTournamentDurationTasks(participants);
    }
    return buildKoTournamentDurationTasks(participantCount);
  }


  function buildCompletedTournamentDurationTaskIdSet(tournament, tasks) {
    const validTaskIds = new Set((Array.isArray(tasks) ? tasks : []).map((task) => task.id));
    const completedIds = new Set();
    (Array.isArray(tournament?.matches) ? tournament.matches : []).forEach((match) => {
      if (match?.status !== STATUS_COMPLETED) {
        return;
      }
      const taskId = normalizeText(match?.id || "");
      if (taskId && validTaskIds.has(taskId)) {
        completedIds.add(taskId);
      }
    });
    return completedIds;
  }


  function estimateTournamentDurationProgressFromTournament(tournament, settings = null) {
    const totalEstimate = estimateTournamentDurationFromTournament(tournament, settings);
    const progress = {
      ready: totalEstimate.ready,
      reason: totalEstimate.reason,
      totalEstimate,
      completedMatches: 0,
      remainingMatches: totalEstimate.matchCount,
      progressRatio: 0,
      remainingScheduleWaves: totalEstimate.scheduleWaves,
      remainingLikelyMinutes: totalEstimate.likelyMinutes,
      remainingLowMinutes: totalEstimate.lowMinutes,
      remainingHighMinutes: totalEstimate.highMinutes,
      modelElapsedMinutes: 0,
      elapsedMinutes: 0,
      paceMultiplier: 1,
      projectedRemainingLikelyMinutes: totalEstimate.likelyMinutes,
      projectedEndAtIso: "",
    };
    if (!totalEstimate.ready || !tournament) {
      return progress;
    }

    const mode = normalizeText(tournament?.mode || "ko");
    const participants = Array.isArray(tournament?.participants) ? tournament.participants : [];
    const tasks = buildTournamentDurationTasks(mode, participants, participants.length);
    if (!tasks.length) {
      return progress;
    }

    const completedTaskIds = buildCompletedTournamentDurationTaskIdSet(tournament, tasks);
    const remainingTasks = tasks.filter((task) => !completedTaskIds.has(task.id));
    const remainingSchedule = estimateTournamentDurationSchedule(remainingTasks, totalEstimate.boardCount);
    const remainingWaves = remainingSchedule.waves;
    const remainingLikelyMinutes = (remainingWaves * totalEstimate.matchMinutes)
      + (totalEstimate.phaseOverheadMinutes * (remainingTasks.length / tasks.length));
    const remainingLowMinutes = remainingLikelyMinutes * TOURNAMENT_DURATION_LOW_FACTOR;
    const likelyHighFactor = totalEstimate.likelyMinutes > 0
      ? totalEstimate.highMinutes / totalEstimate.likelyMinutes
      : (1 + TOURNAMENT_DURATION_HIGH_BASE_PADDING);
    const remainingHighMinutes = remainingLikelyMinutes * likelyHighFactor;

    const completedMatches = tasks.length - remainingTasks.length;
    const progressRatio = tasks.length > 0 ? (completedMatches / tasks.length) : 0;
    const modelElapsedMinutes = Math.max(0, totalEstimate.likelyMinutes - remainingLikelyMinutes);
    const elapsedMinutes = 0;
    const paceMultiplier = 1;
    const projectedRemainingLikelyMinutes = remainingLikelyMinutes;
    const projectedEndAtIso = "";

    progress.completedMatches = completedMatches;
    progress.remainingMatches = remainingTasks.length;
    progress.progressRatio = progressRatio;
    progress.remainingScheduleWaves = remainingWaves;
    progress.remainingLikelyMinutes = remainingLikelyMinutes;
    progress.remainingLowMinutes = remainingLowMinutes;
    progress.remainingHighMinutes = remainingHighMinutes;
    progress.modelElapsedMinutes = modelElapsedMinutes;
    progress.elapsedMinutes = elapsedMinutes;
    progress.paceMultiplier = paceMultiplier;
    progress.projectedRemainingLikelyMinutes = projectedRemainingLikelyMinutes;
    progress.projectedEndAtIso = projectedEndAtIso;
    return progress;
  }


  function estimateTournamentDuration(rawInput, settings = null) {
    const modeRaw = normalizeText(rawInput?.mode || "ko");
    const mode = ["ko", "league", "groups_ko"].includes(modeRaw) ? modeRaw : "ko";
    const participants = (Array.isArray(rawInput?.participants) ? rawInput.participants : [])
      .filter((entry) => normalizeText(entry?.id || entry?.name || entry || ""));
    const participantCount = participants.length;
    const participantLimits = getModeParticipantLimits(mode);
    const profile = getTournamentTimeProfileMeta(
      rawInput?.tournamentTimeProfile ?? settings?.tournamentTimeProfile,
    );
    const x01Settings = normalizeTournamentX01Settings({
      presetId: rawInput?.x01Preset,
      baseScore: rawInput?.startScore,
      inMode: rawInput?.x01InMode,
      outMode: rawInput?.x01OutMode,
      bullMode: rawInput?.x01BullMode,
      maxRounds: rawInput?.x01MaxRounds,
      bullOffMode: rawInput?.x01BullOffMode,
      lobbyVisibility: rawInput?.lobbyVisibility,
    }, rawInput?.startScore);
    const bestOfLegs = sanitizeBestOf(rawInput?.bestOfLegs);
    const boardCount = sanitizeTournamentBoardCount(
      rawInput?.boardCount,
      TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT,
    );
    const estimate = {
      ready: false,
      reason: "",
      mode,
      participantCount,
      participantLimits,
      profile,
      bestOfLegs,
      legsToWin: getLegsToWin(bestOfLegs),
      x01: x01Settings,
      expectedLegs: 0,
      legMinutes: 0,
      resultEntryMinutes: TOURNAMENT_DURATION_RESULT_ENTRY_MINUTES,
      matchTransitionMinutes: 0,
      bullOffOverheadMinutes: 0,
      matchOverheadMinutes: 0,
      matchMinutes: 0,
      matchCount: 0,
      boardCount,
      scheduleWaves: 0,
      averageParallelMatches: 0,
      peakParallelMatches: 0,
      boardUtilization: 0,
      phaseOverheadMinutes: 0,
      likelyMinutes: 0,
      lowMinutes: 0,
      highMinutes: 0,
      singleBoard: boardCount === 1,
    };

    if (participantCount < participantLimits.min || participantCount > participantLimits.max) {
      estimate.reason = getParticipantCountError(mode, participantCount);
      return estimate;
    }

    const expectedLegs = getExpectedLegsForBestOf(bestOfLegs);
    const bullModeFactor = x01Settings.bullOffMode === "Off"
      ? 1
      : (TOURNAMENT_DURATION_BULL_FACTORS[x01Settings.bullMode] || 1);
    const legMinutes = TOURNAMENT_DURATION_BASE_LEG_MINUTES
      * profile.legPaceMultiplier
      * (TOURNAMENT_DURATION_SCORE_FACTORS[x01Settings.baseScore] || 1)
      * (TOURNAMENT_DURATION_IN_FACTORS[x01Settings.inMode] || 1)
      * (TOURNAMENT_DURATION_OUT_FACTORS[x01Settings.outMode] || 1)
      * bullModeFactor;
    const bullOffOverheadMinutes = TOURNAMENT_DURATION_BULL_OFF_OVERHEAD[x01Settings.bullOffMode] || 0;
    const matchOverheadMinutes = TOURNAMENT_DURATION_RESULT_ENTRY_MINUTES
      + profile.matchTransitionMinutes
      + bullOffOverheadMinutes;
    const matchMinutes = (expectedLegs * legMinutes) + matchOverheadMinutes;
    const durationTasks = buildTournamentDurationTasks(mode, participants, participantCount);
    const fallbackMatchCount = getTournamentDurationMatchCount(mode, participantCount);
    const matchCount = durationTasks.length || fallbackMatchCount;
    const schedule = estimateTournamentDurationSchedule(durationTasks, boardCount);
    const scheduleWaves = schedule.waves > 0
      ? schedule.waves
      : (matchCount > 0 ? Math.ceil(matchCount / boardCount) : 0);
    const phaseOverheadMinutes = getTournamentDurationPhaseOverheadMinutes(mode, participantCount)
      * profile.phaseTransitionMultiplier;
    const likelyMinutes = (scheduleWaves * matchMinutes) + phaseOverheadMinutes;
    const highPadding = TOURNAMENT_DURATION_HIGH_BASE_PADDING
      + (TOURNAMENT_DURATION_MAX_ROUNDS_HIGH_PADDING[x01Settings.maxRounds] || 0)
      + getTournamentDurationDifficultyPadding(x01Settings)
      + profile.highPaddingExtra;

    estimate.ready = true;
    estimate.expectedLegs = expectedLegs;
    estimate.legMinutes = legMinutes;
    estimate.matchTransitionMinutes = profile.matchTransitionMinutes;
    estimate.bullOffOverheadMinutes = bullOffOverheadMinutes;
    estimate.matchOverheadMinutes = matchOverheadMinutes;
    estimate.matchMinutes = matchMinutes;
    estimate.matchCount = matchCount;
    estimate.scheduleWaves = scheduleWaves;
    estimate.averageParallelMatches = scheduleWaves > 0
      ? (matchCount / scheduleWaves)
      : 0;
    estimate.peakParallelMatches = schedule.peakParallelMatches > 0
      ? schedule.peakParallelMatches
      : (matchCount > 0 ? Math.min(boardCount, matchCount) : 0);
    estimate.boardUtilization = scheduleWaves > 0
      ? (matchCount / (scheduleWaves * boardCount))
      : 0;
    estimate.phaseOverheadMinutes = phaseOverheadMinutes;
    estimate.likelyMinutes = likelyMinutes;
    estimate.lowMinutes = likelyMinutes * TOURNAMENT_DURATION_LOW_FACTOR;
    estimate.highMinutes = likelyMinutes * (1 + highPadding);
    return estimate;
  }


  function estimateTournamentDurationFromDraft(rawDraft, settings = null) {
    const draft = normalizeCreateDraft(rawDraft, settings);
    const participants = parseParticipantLines(draft.participantsText);
    return estimateTournamentDuration({
      mode: draft.mode,
      bestOfLegs: draft.bestOfLegs,
      startScore: draft.startScore,
      x01Preset: draft.x01Preset,
      x01InMode: draft.x01InMode,
      x01OutMode: draft.x01OutMode,
      x01BullMode: draft.x01BullMode,
      x01MaxRounds: draft.x01MaxRounds,
      x01BullOffMode: draft.x01BullOffMode,
      lobbyVisibility: draft.lobbyVisibility,
      boardCount: draft.boardCount,
      participants,
      tournamentTimeProfile: settings?.tournamentTimeProfile,
    }, settings);
  }


  function estimateTournamentDurationFromTournament(tournament, settings = null) {
    if (!tournament) {
      return estimateTournamentDuration(null, settings);
    }
    const x01Settings = normalizeTournamentX01Settings(tournament?.x01, tournament?.startScore);
    return estimateTournamentDuration({
      mode: tournament.mode,
      bestOfLegs: tournament.bestOfLegs,
      startScore: x01Settings.baseScore,
      x01Preset: x01Settings.presetId,
      x01InMode: x01Settings.inMode,
      x01OutMode: x01Settings.outMode,
      x01BullMode: x01Settings.bullMode,
      x01MaxRounds: x01Settings.maxRounds,
      x01BullOffMode: x01Settings.bullOffMode,
      lobbyVisibility: x01Settings.lobbyVisibility,
      boardCount: tournament?.duration?.boardCount,
      participants: tournament.participants,
      tournamentTimeProfile: settings?.tournamentTimeProfile,
    }, settings);
  }
