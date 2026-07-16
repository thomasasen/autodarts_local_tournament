// Auto-generated module split from dist source.
  function renderMatchesTab() {
    const tournament = state.store.tournament;
    if (!tournament) {
      return `<section class="ata-card tournamentCard"><h3>Keine Turnierdaten</h3><p>Bitte zuerst ein Turnier erstellen.</p></section>`;
    }

    const activeStartedMatch = findActiveStartedMatch(tournament);
    const autoLobbyEnabled = state.store?.settings?.featureFlags?.autoLobbyStart === true;
    const sortMode = sanitizeMatchesSortMode(state.store?.ui?.matchesSortMode, MATCH_SORT_MODE_READY_FIRST);
    const sortOptions = [
      { id: MATCH_SORT_MODE_READY_FIRST, label: "Spielbar zuerst" },
      { id: MATCH_SORT_MODE_ROUND, label: "Phase/Spiel" },
      { id: MATCH_SORT_MODE_STATUS, label: "Status" },
    ];

    const matches = sortMatchesForDisplay(tournament, sortMode);
    const suggestedNextMatch = findSuggestedNextMatch(tournament);
    const suggestedNextMatchId = suggestedNextMatch?.id || "";
    const koFinalRound = getMatchesByStage(tournament, MATCH_STAGE_KO).reduce((maxRound, koMatch) => {
      const bracketSide = normalizeText(koMatch?.meta?.bracket?.bracketSide || "");
      if (normalizeText(koMatch?.meta?.bracket?.matchRole || "") === "third_place" || bracketSide === "losers") {
        return maxRound;
      }
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
      const isFixedPreliminary = isFixedLegsPreliminaryMatch(tournament, match);
      const matchLegsToWin = getLegsToWin(getMatchBestOfLegs(tournament, match));
      const isByeCompletion = isCompleted && isByeMatchResult(match);
      const isAutoStarted = match.status === STATUS_PENDING && auto.status === "started" && Boolean(auto.lobbyId);
      const isBlockedPending = match.status === STATUS_PENDING && !editable;
      const isReadyPending = match.status === STATUS_PENDING && editable;
      const isSuggestedNext = Boolean(suggestedNextMatchId) && match.id === suggestedNextMatchId;
      const isThirdPlaceMatch = normalizeText(match?.meta?.bracket?.matchRole || "") === "third_place";
      const bracketSide = normalizeText(match?.meta?.bracket?.bracketSide || "");
      const sectionRound = clampInt(match?.meta?.bracket?.sectionRound, match.round, 1, 64);
      const isDoubleKo = tournament.mode === "double_ko"
        || (tournament.mode === "preliminary_final" && tournament?.finalStage?.type === FINAL_STAGE_TYPE_DOUBLE_KO);
      const isGrandFinal = isDoubleKo && bracketSide === "finals" && sectionRound === 1;
      const isResetFinal = isDoubleKo && bracketSide === "finals" && sectionRound === 2;
      const isKoFinal = match.stage === MATCH_STAGE_KO
        && !isThirdPlaceMatch
        && (!isDoubleKo || bracketSide === "finals")
        && koFinalRound > 0
        && Number(match.round) === koFinalRound;
      const koRoundLabel = match.stage === MATCH_STAGE_KO && !isThirdPlaceMatch
        ? getKoRoundLabel(match.round, koFinalRound || match.round)
        : "";
      const stageLabel = match.stage === MATCH_STAGE_GROUP
        ? `Gruppe ${match.groupId || "?"}`
        : match.stage === MATCH_STAGE_LEAGUE
          ? "Liga (Round Robin)"
          : match.stage === MATCH_STAGE_PRELIMINARY
            ? "Vorrunde"
          : isDoubleKo
            ? (bracketSide === "losers"
              ? "Losers Bracket"
              : (bracketSide === "finals" ? "Finals" : "Winners Bracket"))
            : (isThirdPlaceMatch ? "KO (Spiel um Platz 3)" : "KO (Straight Knockout)");
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
      const matchCellText = isThirdPlaceMatch
        ? "Spiel um Platz 3"
        : isResetFinal
          ? "Reset Final"
          : isGrandFinal
            ? "Grand Final"
            : isDoubleKo && bracketSide === "losers"
              ? `Losers Bracket R${sectionRound} / Spiel ${match.number}`
              : isDoubleKo && bracketSide === "winners"
                ? `Winners Bracket R${sectionRound} / Spiel ${match.number}`
                : match.stage === MATCH_STAGE_KO
                  ? getKoRoundMatchLabel(match.round, koFinalRound || match.round, match.number)
                  : `Runde ${match.round} / Spiel ${match.number}`;
      const matchCellHelpText = isThirdPlaceMatch
        ? "Spiel um Platz 3 = separates Bronze-Match, getrennt vom Champion-Pfad."
        : isDoubleKo
          ? "Doppel-KO: Winners-Bracket-Verlierer wechseln in das Losers Bracket; das Grand Final entscheidet den Turniersieg."
          : match.stage === MATCH_STAGE_KO
            ? `KO-Phase = ${koRoundLabel} bzw. bei großen Feldern Letzte N, Spiel = Paarung innerhalb dieser Phase.`
            : "Runde = Turnierrunde, Spiel = Paarung innerhalb dieser Runde.";
      const legsP1HelpText = `Hier die Anzahl gewonnener Legs von ${player1} eintragen (nicht Punkte pro Wurf). Ziel: ${matchLegsToWin} Legs f\u00fcr den Matchgewinn.`;
      const legsP2HelpText = `Hier die Anzahl gewonnener Legs von ${player2} eintragen (nicht Punkte pro Wurf). Ziel: ${matchLegsToWin} Legs f\u00fcr den Matchgewinn.`;
      const saveHelpText = `Speichert Legs f\u00fcr ${player1} vs ${player2}. Sieger wird automatisch aus den Legs bestimmt. Sieger muss ${matchLegsToWin} Legs erreichen.`;
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
          : (isKoFinal
            ? `Champion: ${winner} (${match.legs.p1}:${match.legs.p2})`
            : (isThirdPlaceMatch
              ? `Platz 3: ${winner} (${match.legs.p1}:${match.legs.p2})`
              : (match.winnerId ? `Sieger: ${winner} (${match.legs.p1}:${match.legs.p2})` : `Unentschieden: ${match.legs.p1}:${match.legs.p2}`))))
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
          return `<span class="${classes.join(" ")}">Teilnehmer steht noch nicht fest</span>`;
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

      const fixedEntries = Array.isArray(match?.meta?.fixedLegs?.entries) ? match.meta.fixedLegs.entries : [];
      const fixedWinnerForLeg = (legIndex) => fixedEntries.find((entry) => entry.legIndex === legIndex)?.winnerId || "";
      const fixedEditorHtml = editable && isFixedPreliminary
        ? `<div class="ata-match-editor"><div class="ata-grid-2">
            ${[1, 2].map((legIndex) => {
              const selectId = `ata-fixed-leg-${match.id}-${legIndex}`;
              return `<div class="ata-field"><label for="${escapeHtml(selectId)}">Leg ${legIndex} gewonnen von</label><select id="${escapeHtml(selectId)}" data-field="fixed-leg-${legIndex}" data-match-id="${escapeHtml(match.id)}"><option value="">Noch offen</option><option value="${escapeHtml(match.player1Id)}" ${fixedWinnerForLeg(legIndex) === match.player1Id ? "selected" : ""}>${escapeHtml(player1)}</option><option value="${escapeHtml(match.player2Id)}" ${fixedWinnerForLeg(legIndex) === match.player2Id ? "selected" : ""}>${escapeHtml(player2)}</option></select></div>`;
            }).join("")}
          </div><div class="ata-editor-actions"><button type="button" class="ata-btn" data-action="save-fixed-match" data-match-id="${escapeHtml(match.id)}">Leg-Stand speichern</button><button type="button" class="ata-btn ata-btn-primary" disabled title="API-Start gesperrt: keine exakte Fixed-2-Legs-Abbildung.">Manuell erfassen</button></div></div>`
        : "";
      const regularEditorHtml = editable && !isFixedPreliminary
        ? `
          <div class="ata-match-editor">
            <p class="ata-match-score-help">Matchziel: zuerst ${escapeHtml(String(matchLegsToWin))} Legs. Bitte gewonnene Legs eintragen, nicht Wurfpunkte.</p>
            <div class="ata-score-grid">
              <label class="ata-score-entry">
                <span>${escapeHtml(player1)}: gewonnene Legs</span>
                <input
                  type="number"
                  min="0"
                  max="${matchLegsToWin}"
                  data-field="legs-p1"
                  data-match-id="${escapeHtml(match.id)}"
                  value="${match.legs.p1}"
                  aria-label="${escapeHtml(legsP1HelpText)}"
                  title="${escapeHtml(legsP1HelpText)}"
                >
              </label>
              <label class="ata-score-entry">
                <span>${escapeHtml(player2)}: gewonnene Legs</span>
                <input
                  type="number"
                  min="0"
                  max="${matchLegsToWin}"
                  data-field="legs-p2"
                  data-match-id="${escapeHtml(match.id)}"
                  value="${match.legs.p2}"
                  aria-label="${escapeHtml(legsP2HelpText)}"
                  title="${escapeHtml(legsP2HelpText)}"
                >
              </label>
            </div>
            <div class="ata-editor-actions">
              <button type="button" class="ata-btn" data-action="save-match" data-match-id="${escapeHtml(match.id)}" title="${escapeHtml(saveHelpText)}">Ergebnis speichern</button>
              <button type="button" class="ata-btn ata-btn-primary" data-action="start-match" data-match-id="${escapeHtml(match.id)}" ${startDisabledAttr} ${startTitleAttr}>${escapeHtml(startUi.label)}</button>
            </div>
          </div>
        `
        : "";
      const correctionHtml = isCompleted && isFixedPreliminary && tournament?.finalStage?.status !== "started" && tournament?.finalStage?.status !== "completed"
        ? `<div class="ata-editor-actions"><button type="button" class="ata-btn" data-action="correct-preliminary-match" data-match-id="${escapeHtml(match.id)}">Vorrundenergebnis korrigieren</button></div>`
        : "";
      const editorHtml = fixedEditorHtml || regularEditorHtml;

      const summaryHtml = summaryText
        ? `<span class="${escapeHtml(advanceClasses)}">${escapeHtml(summaryText)}</span>`
        : "";
      const nextPillHtml = isSuggestedNext
        ? `<span class="ata-match-next-pill" title="Empfohlene n\u00e4chste spielbare Paarung">N\u00e4chstes Match</span>`
        : "";
      const finalPillHtml = isKoFinal
        ? `<span class="ata-match-final-pill" title="Finale">🏆 Finale</span>`
        : "";
      const statusLineHtml = statusLine
        ? renderDocLinkableMessage(statusLine, {
          tagName: "div",
          className: "ata-match-note",
        })
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
          ${correctionHtml}
          ${statusLineHtml}
        </article>
      `;
    }).join("");

    const cardsHtml = cards || `<p class="ata-small">Keine Matches vorhanden.</p>`;
    const resultHeadingLinks = [
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Erklärung zu manueller Eingabe und Automatik öffnen", title: "Einsteigerleitfaden: Ergebnisführung" },
      { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerklärung zum Tie-Break öffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
    ];
    const nextMatchHelpLinks = renderInfoLinks([
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Ablauf der Ergebnisführung öffnen", title: "Einsteigerleitfaden: Ergebnisführung" },
      { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Turniermodus-Kontext öffnen", title: "Einsteigerleitfaden: Turniermodi" },
    ]);
    const nextHintHtml = suggestedNextMatchId
      ? `<p class="ata-small ata-next-hint">Die Markierung &bdquo;Nächstes Match&ldquo; zeigt die empfohlene nächste spielbare Paarung ${nextMatchHelpLinks}.</p>`
      : "";
    const sortButtonsHtml = sortOptions.map((option) => `
      <button type="button" class="ata-segmented-btn" data-action="set-matches-sort" data-sort-mode="${option.id}" data-active="${sortMode === option.id ? "1" : "0"}" aria-pressed="${sortMode === option.id ? "true" : "false"}">${escapeHtml(option.label)}</button>
    `).join("");

    return `
      <section class="ata-card tournamentCard ata-matches-card">
        ${renderSectionHeading("Ergebnisführung", resultHeadingLinks, {
          id: "ata-matches-heading",
          programmaticFocus: true,
        })}
        <p class="ata-small">${autoLobbyEnabled
          ? "Automatik aktiv: Match per Klick starten; das Ergebnis wird nach Matchende synchronisiert. Die manuelle Eingabe bleibt als Fallback verfügbar."
          : "Manuelle Ergebnisführung: Trage für beide Personen die gewonnenen Legs ein und speichere das Ergebnis. Die optionale AutoDarts-Automatik kannst du in den Einstellungen aktivieren."} ${renderInfoLinks([
          { href: README_API_AUTOMATION_URL, kind: "tech", label: "Voraussetzungen und Ablauf öffnen", title: "Einsteigerleitfaden: Ergebnisführung" },
        ])}</p>
        <div class="ata-matches-toolbar">
          <div class="ata-segmented" role="group" aria-label="Match-Sortierung">${sortButtonsHtml}</div>
        </div>
        ${nextHintHtml}
        <div class="ata-match-list">${cardsHtml}</div>
      </section>
    `;
  }


