# Release-Smoke

Diese manuelle Checkliste ergänzt die lokale und GitHub-basierte QA um Prüfungen, die einen authentifizierten AutoDarts-Account oder reale Hardware benötigen.

## Installation und Start

- [ ] Loader beziehungsweise Userscript aktualisieren.
- [ ] Version `0.13.0` im Assistant prüfen.
- [ ] Assistant öffnen und schließen.
- [ ] Fokus-Rückgabe an den Seitenauslöser prüfen.

## Tastatur und Hilfe

- [ ] Drawer vollständig nur per Tastatur bedienen.
- [ ] Spielregel-Editor öffnen und anschließend die kontextbezogene Hilfe öffnen.
- [ ] Erstes `Escape` schließt nur die Hilfe; der Spielregel-Editor bleibt offen.
- [ ] Zweites `Escape` schließt den Drawer.
- [ ] Fokus kehrt zum ursprünglichen Seitenauslöser zurück.

## Dokumentation und GUI-Abbildungen

- [ ] Nach sichtbaren GUI- oder Hilfetextänderungen die Anleitungsscreenshots mit `powershell -ExecutionPolicy Bypass -File scripts/test-ui-viewports.ps1 -UpdateGuideScreenshots` neu erzeugen.
- [ ] Alle in `README.md`, `docs/einstieg.md`, `docs/veranstalter-handbuch.md`, `docs/status-und-fehler.md` und `docs/dra-regeln-gui.md` eingebundenen Bilder visuell auf Lesbarkeit, korrekten Zustand und aktuelle Bezeichnungen prüfen.
- [ ] Sicherstellen, dass Bildunterschriften den relevanten Ausschnitt erklären und alle notwendigen Informationen zusätzlich als Text vorhanden bleiben.

## Turniererstellung

- [ ] Gültiges KO-Turnier anlegen.
- [ ] Gültiges `preliminary_final`-Turnier anlegen.
- [ ] Teilnehmerduplikat auslösen und Fehlermeldung sowie Fokusführung prüfen.
- [ ] Modus wechseln und erhaltene, aber nur im passenden Modus wirksame Draft-Werte prüfen.
- [ ] Preset wechseln und anschließenden Custom-Status nach manueller Änderung prüfen.
- [ ] Spielregel-Editor öffnen, ändern und schließen.
- [ ] Zeitprognose samt Board-Anzahl und Zeitprofil prüfen.

## Live-Integration

- [ ] Match mit authentifiziertem AutoDarts-Account starten.
- [ ] Ergebnis erfassen beziehungsweise synchronisieren.
- [ ] Aktualisierung im Tab `Spiele` prüfen.
- [ ] Turnierbaum prüfen.
- [ ] Turnier exportieren.
- [ ] Export reimportieren und resultierende Spieleansicht prüfen.
- [ ] Turnier zurücksetzen und Fokus auf die Turniererstellung prüfen.

## Grenzen

- [ ] Mit einem physischen Screenreader die Fokusansagen für Drawer, Hilfe und strukturelle Ansichtswechsel prüfen.
- [ ] Auf realer Touch-Hardware die wesentlichen Bedienelemente und den horizontalen Tab-/Tabellen-Scroll prüfen.
- [ ] Bestätigen, dass keine MultiBoard-Funktion erwartet oder behauptet wird.
- [ ] Bestätigen, dass keine pauschale PDC-/DRA-Konformitätsgarantie behauptet wird.
- [ ] Festhalten, dass CI keinen physischen Screenreader-Test ersetzt.
