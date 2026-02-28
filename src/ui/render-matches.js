// Auto-generated module split from dist source.
  function renderMatchesTab() {
    const tournament = state.store.tournament;
    if (!tournament) {
      return `<section class="ata-card tournamentCard"><h3>Keine Turnierdaten</h3><p>Bitte zuerst ein Turnier erstellen.</p></section>`;
    }

    const activeStartedMatch = findActiveStartedMatch(tournament);
    const sortMode = sanitizeMatchesSortMode(state.store?.ui?.matchesSortMode, MATCH_SORT_MODE_READY_FIRST);
    const sortOptions = [
      { id: MATCH_SORT_MODE_READY_FIRST, label: "Spielbar zuerst" },
      { id: MATCH_SORT_MODE_ROUND, label: "Runde/Spiel" },
      { id: MATCH_SORT_MODE_STATUS, label: "Status" },
    ];

    const matches = sortMatchesForDisplay(tournament, sortMode);
    const legsToWin = getLegsToWin(tournament.bestOfLegs);
    const suggestedNextMatch = findSuggestedNextMatch(tournament);
    const suggestedNextMatchId = suggestedNextMatch?.id || "";
    const koFinalRound = getMatchesByStage(tournament, MATCH_STAGE_KO).reduce((maxRound, koMatch) => {
      const roundNumber = Number.parseInt(String(koMatch?.round || "0"), 10);
      return Number.isFinite(roundNumber) && roundNumber > maxRound ? roundNumber : maxRound;
    }, 0);

    const cards = matches.map((match) => {
      const player1 = participantNameById(tournament, match.player1Id);
      const player2 = participantNameById(tournament, match.player2Id);
      const winner = participantNameById(tournament, match.winnerId);
      const isOpenSlot = (name) => name === "\u2205 offen";
      const playability = getMatchEditability(tournament, match);
      const editable = playability.editable;
      const auto = ensureMatchAutoMeta(match);
      const isCompleted = match.status === STATUS_COMPLETED;
      const isByeCompletion = isCompleted && isByeMatchResult(match);
      const isAutoStarted = match.status === STATUS_PENDING && auto.status === "started" && Boolean(auto.lobbyId);
      const isBlockedPending = match.status === STATUS_PENDING && !editable;
      const isReadyPending = match.status === STATUS_PENDING && editable;
      const isSuggestedNext = Boolean(suggestedNextMatchId) && match.id === suggestedNextMatchId;
      const isKoFinal = match.stage === MATCH_STAGE_KO && koFinalRound > 0 && Number(match.round) === koFinalRound;
      const stageLabel = match.stage === MATCH_STAGE_GROUP
        ? `Gruppe ${match.groupId || "?"}`
        : match.stage === MATCH_STAGE_LEAGUE
          ? "Liga (Round Robin)"
          : "KO (Straight Knockout)";
      const startUi = getApiMatchStartUi(tournament, match, activeStartedMatch);
      const startDisabledAttr = startUi.disabled ? "disabled" : "";
      const startTitleAttr = startUi.title ? `title="${escapeHtml(startUi.title)}"` : "";
      const autoStatus = getApiMatchStatusText(match);
      let statusLine = "";
      if (match.status === STATUS_PENDING) {
        if (!editable && playability.reason) {
          statusLine = auto.status === "idle"
            ? playability.reason
            : `${playability.reason} - ${autoStatus}`;
        } else if (auto.status !== "idle") {
          statusLine = autoStatus;
        }
      } else if (!isByeCompletion && auto.status !== "completed") {
        statusLine = autoStatus;
      }
      const matchCellText = `Runde ${match.round} / Spiel ${match.number}`;
      const matchCellHelpText = "Runde = Turnierrunde, Spiel = Paarung innerhalb dieser Runde.";
      const legsP1HelpText = `Hier die Anzahl gewonnener Legs von ${player1} eintragen (nicht Punkte pro Wurf). Ziel: ${legsToWin} Legs f\u00fcr den Matchgewinn.`;
      const legsP2HelpText = `Hier die Anzahl gewonnener Legs von ${player2} eintragen (nicht Punkte pro Wurf). Ziel: ${legsToWin} Legs f\u00fcr den Matchgewinn.`;
      const saveHelpText = `Speichert Legs f\u00fcr ${player1} vs ${player2}. Sieger wird automatisch aus den Legs bestimmt. Sieger muss ${legsToWin} Legs erreichen.`;
      const rowClasses = [
        "ata-match-card",
        isCompleted ? "ata-row-completed" : "",
        isByeCompletion ? "ata-row-bye" : "",
        isAutoStarted ? "ata-row-live" : "",
        isReadyPending ? "ata-row-ready" : "",
        isSuggestedNext ? "ata-row-next" : "",
        isKoFinal ? "ata-row-final" : "",
        isBlockedPending ? "ata-row-blocked" : "",
        !editable ? "ata-row-inactive" : "",
      ].filter(Boolean).join(" ");
      const statusBadgeText = isByeCompletion ? "Freilos (Bye)" : (isCompleted ? "Abgeschlossen" : "Offen");
      const contextPillClass = isByeCompletion
        ? "ata-match-context-pill ata-match-context-bye"
        : (isCompleted ? "ata-match-context-pill ata-match-context-completed" : "ata-match-context-pill ata-match-context-open");
      const contextText = `${stageLabel}, ${matchCellText}, ${statusBadgeText}`;
      const summaryText = isCompleted
        ? (isByeCompletion
          ? `Weiter (Bye): ${winner}`
          : (isKoFinal ? `Champion: ${winner} (${match.legs.p1}:${match.legs.p2})` : `Sieger: ${winner} (${match.legs.p1}:${match.legs.p2})`))
        : "";
      const advanceClasses = [
        "ata-match-advance-pill",
        isByeCompletion ? "ata-match-advance-bye" : "",
        isKoFinal ? "ata-match-advance-final" : "",
      ].filter(Boolean).join(" ");

      const buildPairingPlayerHtml = (name, participantId) => {
        const classes = ["ata-pairing-player"];
        if (isOpenSlot(name)) {
          classes.push("ata-open-slot");
          return `<span class="${classes.join(" ")}">${escapeHtml(name)}</span>`;
        }
        if (isCompleted && match.winnerId) {
          if (participantId === match.winnerId) {
            classes.push("is-winner");
            if (isKoFinal) {
              classes.push("is-champion");
            }
          } else if (participantId === match.player1Id || participantId === match.player2Id) {
            classes.push("is-loser");
          }
        }
        return `<span class="${classes.join(" ")}">${escapeHtml(name)}</span>`;
      };

      const player1PairingHtml = buildPairingPlayerHtml(player1, match.player1Id);
      const player2PairingHtml = buildPairingPlayerHtml(player2, match.player2Id);

      const editorHtml = editable
        ? `
          <div class="ata-match-editor">
            <div class="ata-score-grid">
              <input
                type="number"
                min="0"
                max="${legsToWin}"
                data-field="legs-p1"
                data-match-id="${escapeHtml(match.id)}"
                value="${match.legs.p1}"
                aria-label="${escapeHtml(legsP1HelpText)}"
                title="${escapeHtml(legsP1HelpText)}"
              >
              <input
                type="number"
                min="0"
                max="${legsToWin}"
                data-field="legs-p2"
                data-match-id="${escapeHtml(match.id)}"
                value="${match.legs.p2}"
                aria-label="${escapeHtml(legsP2HelpText)}"
                title="${escapeHtml(legsP2HelpText)}"
              >
            </div>
            <div class="ata-editor-actions">
              <button type="button" class="ata-btn" data-action="save-match" data-match-id="${escapeHtml(match.id)}" title="${escapeHtml(saveHelpText)}">Speichern</button>
              <button type="button" class="ata-btn ata-btn-primary" data-action="start-match" data-match-id="${escapeHtml(match.id)}" ${startDisabledAttr} ${startTitleAttr}>${escapeHtml(startUi.label)}</button>
            </div>
          </div>
        `
        : "";

      const summaryHtml = summaryText
        ? `<span class="${escapeHtml(advanceClasses)}">${escapeHtml(summaryText)}</span>`
        : "";
      const nextPillHtml = isSuggestedNext
        ? `<span class="ata-match-next-pill" title="Empfohlene n\u00e4chste Paarung (PDC: Next Match)">N\u00e4chstes Match</span>`
        : "";
      const finalPillHtml = isKoFinal
        ? `<span class="ata-match-final-pill" title="Finale">🏆 Finale</span>`
        : "";
      const statusLineHtml = statusLine
        ? `<div class="ata-match-note">${escapeHtml(statusLine)}</div>`
        : "";

      return `
        <article class="${escapeHtml(rowClasses)}" data-match-id="${escapeHtml(match.id)}">
          <div class="ata-match-card-head">
            <div class="ata-match-title-row">
              <div class="ata-match-pairing">${player1PairingHtml} <span class="ata-vs">vs</span> ${player2PairingHtml}</div>
              <div class="ata-match-meta-inline">
                ${finalPillHtml}
                ${nextPillHtml}
                <span class="${contextPillClass}" title="${escapeHtml(matchCellHelpText)}">${escapeHtml(contextText)}</span>
              </div>
            </div>
            ${summaryHtml}
          </div>
          ${editorHtml}
          ${statusLineHtml}
        </article>
      `;
    }).join("");

    const cardsHtml = cards || `<p class="ata-small">Keine Matches vorhanden.</p>`;
    const resultHeadingLinks = [
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Erklärung zur API-Halbautomatik öffnen", title: "README: API-Halbautomatik" },
      { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerklärung zum Tie-Break öffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
    ];
    const nextMatchHelpLinks = renderInfoLinks([
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Ablauf der Ergebnisführung öffnen", title: "README: API-Halbautomatik und Ergebnisführung" },
      { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Turniermodus-Kontext öffnen", title: "README: Turniermodi" },
    ]);
    const nextHintHtml = suggestedNextMatchId
      ? `<p class="ata-small ata-next-hint">Hinweis: Die Markierung "Nächstes Match" zeigt die empfohlene nächste Paarung (PDC: Next Match) ${nextMatchHelpLinks}.</p>`
      : "";
    const sortButtonsHtml = sortOptions.map((option) => `
      <button type="button" class="ata-segmented-btn" data-action="set-matches-sort" data-sort-mode="${option.id}" data-active="${sortMode === option.id ? "1" : "0"}">${escapeHtml(option.label)}</button>
    `).join("");

    return `
      <section class="ata-card tournamentCard ata-matches-card">
        ${renderSectionHeading("Ergebnisführung", resultHeadingLinks)}
        <p class="ata-small">API-Halbautomatik: Match per Klick starten, Ergebnis wird automatisch synchronisiert. Manuelle Eingabe bleibt als Fallback aktiv. ${renderInfoLinks([
          { href: README_API_AUTOMATION_URL, kind: "tech", label: "Voraussetzungen und Ablauf öffnen", title: "README: API-Halbautomatik" },
        ])}</p>
        <div class="ata-matches-toolbar">
          <div class="ata-segmented" role="group" aria-label="Match-Sortierung">${sortButtonsHtml}</div>
        </div>
        ${nextHintHtml}
        <div class="ata-match-list">${cardsHtml}</div>
      </section>
    `;
  }


