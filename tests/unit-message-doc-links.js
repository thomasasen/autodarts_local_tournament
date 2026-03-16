  test("README-Statuslinks: exakte Meldungen werden auf die richtige README-Stelle abgebildet", () => {
    const authDoc = getReadmeStatusMessageDoc("API Auth fehlt");
    assert(Boolean(authDoc), "Dokulink fuer API Auth fehlt erwartet.");
    assertEqual(authDoc.href, `${README_BASE_URL}#statusmeldung-api-auth-fehlt`);

    const boardDoc = getReadmeStatusMessageDoc("Kein aktives Board");
    assert(Boolean(boardDoc), "Dokulink fuer Kein aktives Board erwartet.");
    assertEqual(boardDoc.href, `${README_BASE_URL}#statusmeldung-kein-aktives-board`);
  });


  test("README-Statuslinks: dynamische Praefixe werden erkannt", () => {
    const boardDoc = getReadmeStatusMessageDoc("Board aktiv (abc1234...xyz789)");
    assert(Boolean(boardDoc), "Dokulink fuer Board aktiv erwartet.");
    assertEqual(boardDoc.href, `${README_BASE_URL}#statusmeldung-board-aktiv`);

    const syncDoc = getReadmeStatusMessageDoc("API-Sync: aktiv (Lobby lobby-42)");
    assert(Boolean(syncDoc), "Dokulink fuer aktiven API-Sync erwartet.");
    assertEqual(syncDoc.href, `${README_BASE_URL}#statusmeldung-api-sync-aktiv`);

    const predecessorDoc = getReadmeStatusMessageDoc("Vorgänger-Match Runde 2 / Spiel 1 muss zuerst abgeschlossen werden.");
    assert(Boolean(predecessorDoc), "Dokulink fuer blockierendes Vorgaenger-Match erwartet.");
    assertEqual(predecessorDoc.href, `${README_BASE_URL}#statusmeldung-vorgaenger-match-muss-zuerst-abgeschlossen-werden`);
  });


  test("README-Statuslinks: renderDocLinkableMessage rendert Links nur fuer dokumentierte Meldungen", () => {
    const linked = renderDocLinkableMessage("API Auth fehlt", {
      tagName: "span",
      className: "ata-status-pill",
    });
    assert(linked.includes("<a "), "Dokumentierte Meldung sollte als Link gerendert werden.");
    assert(linked.includes('href="https://github.com/thomasasen/autodarts_local_tournament/blob/main/README.md#statusmeldung-api-auth-fehlt"'));
    assert(linked.includes('class="ata-status-pill ata-doc-linkable"'));

    const plain = renderDocLinkableMessage("Unbekannte Kurzmeldung", {
      tagName: "div",
      className: "ata-note",
    });
    assert(plain.includes("<div"), "Undokumentierte Meldung sollte als Fallback-Tag gerendert werden.");
    assert(!plain.includes("<a "), "Undokumentierte Meldung darf kein Link sein.");
  });
