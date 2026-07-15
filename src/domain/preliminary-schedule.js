// Pure domain logic for balanced preliminary schedules.

  function getAllowedPreliminaryMatchCounts(rawParticipantCount) {
    const participantCount = clampInt(rawParticipantCount, 0, 0, TECHNICAL_PARTICIPANT_HARD_MAX);
    const allowed = [];
    for (let matchCount = 4; matchCount <= 8; matchCount += 1) {
      if (matchCount < participantCount && (participantCount * matchCount) % 2 === 0) {
        allowed.push(matchCount);
      }
    }
    return allowed;
  }

  function validatePreliminaryScheduleConfig(rawParticipantCount, rawMatchCount) {
    const participantCount = clampInt(rawParticipantCount, 0, 0, TECHNICAL_PARTICIPANT_HARD_MAX);
    const parsedMatchCount = Number(rawMatchCount);
    const matchCount = Number.isInteger(parsedMatchCount) ? parsedMatchCount : null;
    const allowedMatchCounts = getAllowedPreliminaryMatchCounts(participantCount);
    if (matchCount === null || matchCount < 4 || matchCount > 8) {
      return { ok: false, reasonCode: "preliminary_match_count_out_of_range", message: "Vorrundenspiele je Teilnehmer m\u00fcssen als ganze Zahl zwischen 4 und 8 angegeben werden.", participantCount, matchCount, allowedMatchCounts };
    }
    if (matchCount >= participantCount) {
      return { ok: false, reasonCode: "preliminary_match_count_exceeds_unique_opponents", message: `Mit ${participantCount} Teilnehmern sind h\u00f6chstens ${Math.max(0, participantCount - 1)} verschiedene Gegner m\u00f6glich.`, participantCount, matchCount, allowedMatchCounts };
    }
    if ((participantCount * matchCount) % 2 !== 0) {
      return { ok: false, reasonCode: "preliminary_equal_distribution_impossible", message: `Mit ${participantCount} Teilnehmern ist eine gleiche Verteilung von ${matchCount} Matches mathematisch nicht m\u00f6glich.`, participantCount, matchCount, allowedMatchCounts };
    }
    return { ok: true, reasonCode: "", message: "", participantCount, matchCount, allowedMatchCounts };
  }

  function createCanonicalPreliminaryEdge(leftIndex, rightIndex, participantIds) {
    const low = Math.min(leftIndex, rightIndex);
    const high = Math.max(leftIndex, rightIndex);
    return { key: `${low}:${high}`, leftIndex: low, rightIndex: high, player1Id: participantIds[low], player2Id: participantIds[high] };
  }

  function colorPreliminaryEdges(edges, colorCount, attemptLimit = 25000) {
    const adjacent = edges.map(() => []);
    for (let left = 0; left < edges.length; left += 1) {
      for (let right = left + 1; right < edges.length; right += 1) {
        if (
          edges[left].leftIndex === edges[right].leftIndex
          || edges[left].leftIndex === edges[right].rightIndex
          || edges[left].rightIndex === edges[right].leftIndex
          || edges[left].rightIndex === edges[right].rightIndex
        ) {
          adjacent[left].push(right);
          adjacent[right].push(left);
        }
      }
    }
    const colors = edges.map(() => -1);
    const selectNext = () => {
      let selected = null;
      for (let index = 0; index < edges.length; index += 1) {
        if (colors[index] !== -1) continue;
        const used = new Set(adjacent[index].map((neighbor) => colors[neighbor]).filter((color) => color >= 0));
        const available = Array.from({ length: colorCount }, (_, color) => color).filter((color) => !used.has(color));
        const coloredNeighbors = adjacent[index].filter((neighbor) => colors[neighbor] >= 0).length;
        if (!selected || available.length < selected.available.length || (available.length === selected.available.length && coloredNeighbors > selected.coloredNeighbors)) {
          selected = { index, available, coloredNeighbors };
        }
      }
      return selected;
    };
    let attempts = 0;
    const assign = (count) => {
      if (count === edges.length) return true;
      if (attempts >= attemptLimit) return false;
      attempts += 1;
      const next = selectNext();
      if (!next || !next.available.length) return false;
      for (const color of next.available) {
        colors[next.index] = color;
        if (assign(count + 1)) return true;
        colors[next.index] = -1;
      }
      return false;
    };
    if (edges.length) colors[0] = 0;
    return assign(edges.length ? 1 : 0) ? colors : null;
  }

  function buildPreliminaryRoundRobinFallback(edges, participantCount) {
    const edgeByKey = new Map(edges.map((edge) => [edge.key, edge]));
    const slots = Array.from({ length: participantCount }, (_, index) => index);
    if (participantCount % 2 !== 0) slots.push(-1);
    const rounds = [];
    for (let roundIndex = 0; roundIndex < slots.length - 1; roundIndex += 1) {
      const round = [];
      for (let pairIndex = 0; pairIndex < slots.length / 2; pairIndex += 1) {
        const leftIndex = slots[pairIndex];
        const rightIndex = slots[slots.length - 1 - pairIndex];
        if (leftIndex < 0 || rightIndex < 0) continue;
        const key = `${Math.min(leftIndex, rightIndex)}:${Math.max(leftIndex, rightIndex)}`;
        const edge = edgeByKey.get(key);
        if (edge) round.push(edge);
      }
      if (round.length) rounds.push(round.sort((left, right) => left.leftIndex - right.leftIndex || left.rightIndex - right.rightIndex));
      const last = slots.pop();
      slots.splice(1, 0, last);
    }
    return rounds;
  }

  function assignPreliminarySchedulingRounds(edges, participantCount, matchCount) {
    const lowerBound = participantCount % 2 === 0 ? matchCount : matchCount + 1;
    let colors = null;
    let colorCount = lowerBound;
    for (; colorCount <= matchCount + 1; colorCount += 1) {
      colors = colorPreliminaryEdges(edges, colorCount);
      if (colors) break;
    }
    if (!colors) return buildPreliminaryRoundRobinFallback(edges, participantCount);
    const rounds = Array.from({ length: colorCount }, () => []);
    edges.forEach((edge, index) => rounds[colors[index]].push(edge));
    return rounds.filter((round) => round.length).map((round) => round.slice().sort((left, right) => left.leftIndex - right.leftIndex || left.rightIndex - right.rightIndex));
  }

  function buildBalancedRegularPairings(rawParticipantIds, rawMatchCount) {
    const participantIds = (Array.isArray(rawParticipantIds) ? rawParticipantIds : []).map((id) => normalizeText(id || "")).filter(Boolean);
    const validation = validatePreliminaryScheduleConfig(participantIds.length, rawMatchCount);
    if (!validation.ok) return { ...validation, edges: [], rounds: [], totalMatches: 0, scheduleRoundCount: 0 };
    const participantCount = participantIds.length;
    const matchCount = validation.matchCount;
    const edgeByKey = new Map();
    const symmetricDistanceCount = Math.floor(matchCount / 2);
    for (let index = 0; index < participantCount; index += 1) {
      for (let distance = 1; distance <= symmetricDistanceCount; distance += 1) {
        const edge = createCanonicalPreliminaryEdge(index, (index + distance) % participantCount, participantIds);
        edgeByKey.set(edge.key, edge);
      }
      if (matchCount % 2 === 1) {
        const edge = createCanonicalPreliminaryEdge(index, (index + (participantCount / 2)) % participantCount, participantIds);
        edgeByKey.set(edge.key, edge);
      }
    }
    const edges = Array.from(edgeByKey.values()).sort((left, right) => left.leftIndex - right.leftIndex || left.rightIndex - right.rightIndex);
    const degreeByIndex = Array.from({ length: participantCount }, () => 0);
    edges.forEach((edge) => { degreeByIndex[edge.leftIndex] += 1; degreeByIndex[edge.rightIndex] += 1; });
    if (edges.length !== (participantCount * matchCount) / 2 || degreeByIndex.some((degree) => degree !== matchCount)) {
      throw new Error("preliminary_regular_graph_invariant_failed");
    }
    const rounds = assignPreliminarySchedulingRounds(edges, participantCount, matchCount);
    return { ...validation, edges, rounds, totalMatches: edges.length, scheduleRoundCount: rounds.length, degreeByParticipantId: Object.fromEntries(participantIds.map((id, index) => [id, degreeByIndex[index]])) };
  }

  function analyzePreliminaryFinalConfiguration(rawParticipantIds, rawMatchCount, finalStageType, rawQualifierCount) {
    const schedule = buildBalancedRegularPairings(rawParticipantIds, rawMatchCount);
    const normalizedFinalStageType = FINAL_STAGE_TYPES.includes(finalStageType) ? finalStageType : FINAL_STAGE_TYPE_KO;
    return { ...schedule, participantCount: Array.isArray(rawParticipantIds) ? rawParticipantIds.length : 0, qualifierCount: Number(rawQualifierCount), finalStageType: normalizedFinalStageType, finalStageLabel: normalizedFinalStageType === FINAL_STAGE_TYPE_DOUBLE_KO ? "Doppel-KO" : "KO" };
  }
