// Auto-generated module split from dist source.

  function clearMatchResult(match) {
    match.status = STATUS_PENDING;
    match.winnerId = null;
    match.source = null;
    match.legs = { p1: 0, p2: 0 };
    match.stats = normalizeMatchStats(null);
    setMatchResultKind(match, null);
    resetMatchAutomationMeta(match);
    match.updatedAt = nowIso();
  }


  function assignPlayerSlot(match, slot, participantId) {
    const field = slot === 1 ? "player1Id" : "player2Id";
    const currentValue = match[field] || null;
    const nextValue = participantId || null;
    if (currentValue === nextValue) {
      return false;
    }
    match[field] = nextValue;
    const hasStoredResult = match.status === STATUS_COMPLETED
      || Boolean(match.winnerId || match.source || match.legs?.p1 || match.legs?.p2);
    if (hasStoredResult) {
      clearMatchResult(match);
    }
    match.updatedAt = nowIso();
    return true;
  }

