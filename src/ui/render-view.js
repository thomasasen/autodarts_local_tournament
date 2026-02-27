// Auto-generated module split from dist source.
  function renderStandingsTable(rows, headline, headingLinks = []) {
    const bodyRows = rows.map((row) => `
      <tr>
        <td>${row.rank}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.played}</td>
        <td>${row.wins}</td>
        <td>${row.draws || 0}</td>
        <td>${row.losses}</td>
        <td>${row.points}</td>
        <td>${row.legDiff}</td>
        <td>${row.legsFor}</td>
        <td>${row.tiebreakState === "playoff_required" ? "Playoff" : "-"}</td>
      </tr>
    `).join("");

    return `
      <div class="ata-card">
        ${renderSectionHeading(headline, headingLinks)}
        <div class="ata-table-wrap">
          <table class="ata-table tournamentRanking">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Sp</th>
                <th>S</th>
                <th>U</th>
                <th>N</th>
                <th>Pkt</th>
                <th>LegDiff</th>
                <th>Legs+</th>
                <th>TB</th>
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }


  function renderLeagueSchedule(tournament) {
    const matches = getMatchesByStage(tournament, MATCH_STAGE_LEAGUE);
    if (!matches.length) {
      return "";
    }
    const rows = matches.map((match) => `
      <tr>
        <td>R${match.round}</td>
        <td>${escapeHtml(participantNameById(tournament, match.player1Id))}</td>
        <td>${escapeHtml(participantNameById(tournament, match.player2Id))}</td>
        <td>${match.status === STATUS_COMPLETED ? escapeHtml(participantNameById(tournament, match.winnerId)) : "-"}</td>
        <td>${match.status === STATUS_COMPLETED ? `${match.legs.p1}:${match.legs.p2}` : "-"}</td>
      </tr>
    `).join("");

    return `
      <div class="ata-card">
        <h3>Liga-Spielplan</h3>
        <div class="ata-table-wrap">
          <table class="ata-table tournamentRanking">
            <thead>
              <tr>
                <th>Runde</th>
                <th>Spieler 1</th>
                <th>Spieler 2</th>
                <th>Winner</th>
                <th>Legs</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }


  function renderStaticBracketFallback(tournament) {
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    if (!koMatches.length) {
      return `<p class="ata-small">Kein KO-Turnierbaum vorhanden.</p>`;
    }

    const rounds = new Map();
    koMatches.forEach((match) => {
      if (!rounds.has(match.round)) {
        rounds.set(match.round, []);
      }
      rounds.get(match.round).push(match);
    });

    const roundHtml = [...rounds.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([roundNumber, matches]) => {
        const matchesHtml = matches
          .sort((a, b) => a.number - b.number)
          .map((match) => {
            const isCompleted = isCompletedMatchResultValid(tournament, match);
            const isBye = isCompleted && isByeMatchResult(match);
            const player1Name = participantNameById(tournament, match.player1Id);
            const player2Name = participantNameById(tournament, match.player2Id);
            const hasLegScores = isCompleted && Number.isFinite(match?.legs?.p1) && Number.isFinite(match?.legs?.p2);
            const winnerId = isCompleted ? normalizeText(match.winnerId) : "";
            const player1IsWinner = Boolean(winnerId) && normalizeText(match.player1Id) === winnerId;
            const player2IsWinner = Boolean(winnerId) && normalizeText(match.player2Id) === winnerId;
            const player1Classes = [
              "ata-bracket-player",
              player1Name === "\u2205 offen" ? "ata-open-slot" : "",
              player1IsWinner ? "is-winner" : "",
              (isCompleted && !isBye && !player1IsWinner && normalizeText(match.player1Id)) ? "is-loser" : "",
            ].filter(Boolean).join(" ");
            const player2Classes = [
              "ata-bracket-player",
              player2Name === "\u2205 offen" ? "ata-open-slot" : "",
              player2IsWinner ? "is-winner" : "",
              (isCompleted && !isBye && !player2IsWinner && normalizeText(match.player2Id)) ? "is-loser" : "",
            ].filter(Boolean).join(" ");
            const statusBadgeClass = isBye
              ? "ata-match-status ata-match-status-bye"
              : (isCompleted ? "ata-match-status ata-match-status-completed" : "ata-match-status ata-match-status-open");
            const statusBadgeText = isBye ? "Freilos (Bye)" : (isCompleted ? "Abgeschlossen" : "Offen");
            const statusText = !isCompleted
              ? "Noch nicht abgeschlossen."
                : isBye
                ? `Freilos (Bye): ${escapeHtml(participantNameById(tournament, match.winnerId))}`
                : `Gewinner: ${escapeHtml(participantNameById(tournament, match.winnerId))} (${match.legs.p1}:${match.legs.p2})`;
            return `
              <div class="ata-bracket-match">
                <div class="${player1Classes}">
                  <span>${escapeHtml(player1Name)}</span>
                  ${hasLegScores ? `<span class="ata-bracket-score ${player1IsWinner ? "is-win" : (isBye ? "" : "is-loss")}">${match.legs.p1}</span>` : ""}
                </div>
                <div class="${player2Classes}">
                  <span>${escapeHtml(player2Name)}</span>
                  ${hasLegScores ? `<span class="ata-bracket-score ${player2IsWinner ? "is-win" : (isBye ? "" : "is-loss")}">${match.legs.p2}</span>` : ""}
                </div>
                <div><span class="${statusBadgeClass}">${statusBadgeText}</span></div>
                <div class="ata-small">${statusText}</div>
              </div>
            `;
          }).join("");

        return `
          <div class="ata-bracket-round">
            <strong>Runde ${roundNumber}</strong>
            ${matchesHtml}
          </div>
        `;
      }).join("");

    return `<div class="ata-bracket-grid">${roundHtml}</div>`;
  }


  function renderViewTab() {
    const tournament = state.store.tournament;
    if (!tournament) {
      return `<section class="ata-card tournamentCard"><h3>Keine Turnierdaten</h3><p>Bitte zuerst ein Turnier erstellen.</p></section>`;
    }

    let html = "";
    const fallbackVisible = state.bracket.failed ? "1" : "0";

    if (tournament.mode === "league") {
      const standings = standingsForMatches(tournament, getMatchesByStage(tournament, MATCH_STAGE_LEAGUE));
      html += renderStandingsTable(standings, "Liga-Tabelle", [
        { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerklärung zum Tie-Break öffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
      ]);
      html += renderLeagueSchedule(tournament);
    } else if (tournament.mode === "groups_ko") {
      const standingsMap = groupStandingsMap(tournament);
      const groupCards = [];
      const blockedGroups = [];
      standingsMap.forEach((entry) => {
        groupCards.push(renderStandingsTable(entry.rows, `Tabelle ${entry.group.name}`, [
          { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerklärung zum Tie-Break öffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
        ]));
        if (entry.groupResolution?.status === "playoff_required") {
          blockedGroups.push(`${entry.group.name}: ${entry.groupResolution.reason}`);
        }
      });
      html += `<div class="ata-group-grid">${groupCards.join("")}</div>`;
      if (blockedGroups.length) {
        html += `
          <section class="ata-card tournamentCard">
            ${renderSectionHeading("Gruppenentscheidung offen", [
              { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerklärung zum Tie-Break öffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
            ])}
            <p class="ata-small">KO-Qualifikation ist blockiert, bis folgende DRA-Entscheidungen geklärt sind:</p>
            <ul class="ata-small">
              ${blockedGroups.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}
            </ul>
          </section>
        `;
      }
    }

    if (tournament.mode === "ko" || tournament.mode === "groups_ko") {
      html += `
        <section class="ata-card tournamentCard">
          ${renderSectionHeading("KO-Turnierbaum", [
            { href: DRA_GUI_RULE_BYE_URL, kind: "rule", label: "DRA-Regelerklärung zu Freilosen öffnen", title: "DRA-Regeln in der GUI: Freilos (Bye)" },
          ])}
          <div class="ata-bracket-dock" id="ata-bracket-dock">
            <div class="ata-bracket-shell">
              <iframe id="ata-bracket-frame" class="ata-bracket-frame" title="Turnierbaum" sandbox="allow-scripts allow-same-origin"></iframe>
              <div class="ata-bracket-fallback" id="ata-bracket-fallback" data-visible="${fallbackVisible}">
                ${renderStaticBracketFallback(tournament)}
              </div>
            </div>
          </div>
          <div class="ata-actions" style="margin-top: 10px;">
            <button type="button" class="ata-btn" data-action="retry-bracket">Turnierbaum neu laden</button>
          </div>
          <p class="ata-small">CDN-Render aktiv. Der HTML-Fallback wird nur bei Fehlern oder Timeout angezeigt.</p>
        </section>
      `;
    }

    return html || `<section class="ata-card tournamentCard"><h3>Turnierbaum</h3><p>Keine Daten.</p></section>`;
  }


  function syncBracketFallbackVisibility() {
    const shadow = state.shadowRoot;
    if (!shadow || state.activeTab !== "view") {
      return;
    }
    const fallback = shadow.getElementById("ata-bracket-fallback");
    if (!(fallback instanceof HTMLElement)) {
      return;
    }
    fallback.setAttribute("data-visible", state.bracket.failed ? "1" : "0");
  }


