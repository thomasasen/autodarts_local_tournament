# Changelog

## Unreleased

## 0.14.1

- AutoDarts-Domainwechsel unterstützt: Hauptskript und Loader starten auf `play.autodarts.com`; `play.autodarts.io` bleibt während des Redirect-Übergangs als zusätzlicher Match-Eintrag erhalten.
- API-Automatik, Auth-Header-Erkennung, Tampermonkey-Verbindungsrecht und Diagnose verwenden nun `api.autodarts.com`. Das Build-Gate prüft Play-Domains und API-Provider in Quelle, Runtime, Meta-Datei und Loader gegen Regressionen.
- Installations-, Einstiegs-, Status-, API- und Release-Dokumentation auf die neue Domain aktualisiert. Die API-Pfade `/gs/v0`, `/as/v0` und `/auth/v1` sowie die relevanten Play-Routen bleiben unverändert.
- Dokumentation um reproduzierbare GUI-Abbildungen für Turnieranlage, manuelle Ergebnisführung, Automatik, Kontext-Hilfe, Veranstalterregeln, Sicherung und Statuszustände ergänzt; Screenshot-Erzeugung und visueller Release-Check sind im Viewport-Skript beziehungsweise in der Release-Checkliste festgehalten.

## 0.14.0

- Vorrundenmatches mit genau zwei festen Legs können bei aktiver AutoDarts-Automatik gestartet werden. Die Lobby verwendet Matchmodus `Off`, indem `legs` und `sets` im Create-Payload fehlen; alle anderen Modi behalten unverändert ihr First-to-Payload.
- Eine eigene Steuerkarte auf der eindeutig verknüpften Route `/matches/{id}` führt durch `Leg 1 übernehmen & Leg 2 starten` und `Match abschließen & Ergebnis übernehmen`. Jeder API-Write wird durch einen Klick ausgelöst und nach erneutem `GET state` ausgeführt.
- Der pure Fixed-Legs-Resolver ordnet Spieler über eindeutige Namen/IDs zu, erkennt vertauschte API-Reihenfolge, Reloads, native Next-/Finish-Aktionen, rückläufige Zustände und Overruns. Ein begonnenes drittes Leg kann nur nach zusätzlicher Bestätigung beendet werden; mehr als zwei abgeschlossene Legs werden nie still gekürzt.
- `POST games/next` und `POST finish` sind idempotent abgesichert. `2:0`, `1:1` und `0:2` werden einschließlich History-/Background-Sync ohne vorausgesetzten API-Gewinner übernommen; die manuelle Leg-Erfassung bleibt kontrollierter Fallback.
- Persistenzschema auf `schemaVersion: 6` angehoben. Schema 5 erhält vorhandene Paarungen, Leg-Einträge und Ergebnisse; Legacy-`manual_only` wird ohne Neuauslosung nach `idle`, `linked` oder `manual` migriert.
- Domain-, Integrationssimulations- und Runtime-Selftests decken Phasen, Fehlercodes, wiederholte Klicks, verspätete Antworten, Routenbegrenzung, Draws, Migration und JSON-Roundtrip ab. Die historische Sicherheitsgrenze aus 0.5.0 bleibt als damaliger Stand unverändert dokumentiert.

## 0.13.0

- Die Oberfläche trennt Einsteiger- und Fachinformationen konsequent: Format- und Moduswahl erklären ihre Wirkung in Klartext, Spielregeln zeigen zuerst das Matchziel und technische Details erst danach, die kontextbezogene Hilfe klappt Beispiele, Einschränkungen, Regelstatus und Quellen progressiv auf.
- `Lokaler Spieleabend - 501 / Best of 5` ist die neue, ehrlich als Produktprofil bezeichnete Standardvorlage. `PDC European Tour - Runden 1 bis 4` bleibt als ausdrücklich begrenztes offizielles Profil verfügbar; die stabile technische ID des lokalen Profils erhält alte Best-of-5-Daten kompatibel.
- Manuelle Ergebnisführung ist sichtbar der robuste Standard: Scorefelder tragen Namen und Leg-Bedeutung, offene Slots werden ausgeschrieben und eine deaktivierte Automatik erzeugt keine roten Auth-/Boardwarnungen mehr.
- Einstellungen sind nach Turnierablauf, Zeitplanung und Veranstalterregeln gegliedert. Diagnose, Debug und Speicherdetails liegen in einem erweiterten Bereich; die Draw-Lock-Erklärung nennt korrekt KO und Doppel-KO.
- `Import/Export` heißt jetzt `Sichern`. Datei- und Textwiederherstellung zeigen vor dem Ersetzen Name, Modus und Teilnehmerzahl und verlangen eine Bestätigung.
- Die frühere Lang-README wurde in eine kurze Projektseite, Einsteigerleitfaden, Veranstalter-Handbuch, Glossar und Status-/Fehlerreferenz getrennt. In-App-Links führen direkt in die passende Zieldokumentation.
- Die lokale Regelwerkskopie wurde durch das offizielle `DRA Rules 2026`, in Kraft seit 31. März 2026, ersetzt. Die für die Anwendung relevanten Verweise 6.8.1, 6.12.1 und 6.16.1 bleiben auf den dokumentierten PDF-Seiten gültig.

## 0.12.1
- Vollständige Ansichtswechsel besitzen jetzt explizite Fokusziele: Spieleüberschrift nach erfolgreicher Turnieranlage und Import, Turniererstellungsüberschrift nach Reset sowie der aktivierte Navigationsbutton nach Tabwechsel. Die Überschriften sind nur programmatisch über `tabindex="-1"` fokussierbar und erzeugen keinen zusätzlichen Tabstopp.
- Der Shell-Fokus-Snapshot speichert den tatsächlich gerenderten View-Kontext. Der ordinale Fallback ist auf dieselbe Ansicht, denselben Elementtyp, fehlende explizite Fokusstrategie und widerspruchsfreie stabile Merkmale begrenzt; mehrdeutige Attributtreffer und Cross-View-Fallbacks werden verworfen. Feld-Re-Render erhalten weiterhin Fokus, Textauswahl und Scrollposition.
- Runtime-Selftests decken Anlage, Reset, Import, Navigation, Cross-View-Schutz, Textauswahl, Hilfe-/Drawer-Escape sowie den Host-Fallback bei entferntem Auslöser ab. Der Runtime-Vertrag prüft zusätzlich das programmatische Fokusziel der Turniererstellung.
- `.github/workflows/qa.yml` führt das autoritative `scripts/qa.ps1` auf `windows-latest` aus und prüft anschließend per `git diff --exit-code` die reproduzierbare Distribution. Berechtigungen und Concurrency sind minimal gehalten; es gibt weder Secrets noch Commit, Push oder Veröffentlichung.
- Ein dependency-freies `scripts/qa-repository-hygiene.ps1` prüft temporäre Artefakte, abgeschlossene Pläne, veraltete Release-7-Zukunftshinweise und lokale Markdown-Datei-/Ankerziele. `.gitignore` schützt die typischen lokalen Temp-, Log- und Patch-Artefakte.
- Der abgeschlossene UX-Plan, drei versehentlich versionierte Internet-Scan-Gitlinks und ein unreferenzierter Export auf Schema 4 wurden entfernt. Drei nachweislich unreferenzierte Funktionen sowie ein veraltetes Fokus-Snapshot-Attribut wurden bereinigt; referenzierte Screenshots, PDC-Logo, Compliance-Quellen und fachliche States bleiben erhalten.
- Die manuelle Release-Checkliste bündelt den authentifizierten Live-Smoke sowie physische Tastatur-, Touch- und Screenreader-Grenzen. Storage-Schema 5, Turnierregeln, Modi und Compliance-Einstufungen bleiben unverändert.

## 0.12.0
- Der Assistant-Drawer besitzt einen vollständigen Fokuslebenszyklus: definierter Initialfokus, sichtbare-Controls-Fokusfalle in beide Richtungen, Hilfe-vor-Drawer-Escape, offen bleibender Spielregel-Editor beim Schließen der Hilfe sowie sichere Rückgabe an den Auslöser oder den Assistant-Host, falls der Auslöser entfernt wurde.
- Shell-Re-Render erhalten den aktiven Tab beziehungsweise das aktive Control, Textauswahl und relevante Scrollpositionen. Die native Navigation bleibt ein `nav`-Landmark mit genau einem `aria-current="page"`; es werden bewusst keine unvollständigen Tab-ARIA-Rollen simuliert.
- Alle sichtbaren Formularfelder und Schalter haben programmatisch zugeordnete Namen und Beschreibungen. Das gilt nun auch für KO-/Platz-3- und Einstellungs-Checkboxen, Fixed-Leg-Auswahl sowie Veranstalter-Reihenfolgen. Match-Sortierung verwendet zusätzlich `aria-pressed`.
- Live-Ankündigungen sind auf einen atomaren Teilnehmerstatus, globale Statusmeldungen und echte Fehler-Alerts begrenzt. Statische Spielregel-/Übersichtstexte und Submit-Hinweise werden nicht mehrfach als Live-Region angekündigt; der Submit verweist stattdessen per `aria-describedby` auf seinen Status.
- Einheitliche `:focus-visible`-Darstellung, Forced-Colors-Fallback, globale Reduced-Motion-Abschaltung, mindestens 24-px-Ziele sowie 44-px-Ziele bei grober Zeigereingabe wurden ergänzt. Lange Namen, Pills, Matchkarten und die 320-px-Turnierübersicht brechen ohne unbeabsichtigten horizontalen Overflow um.
- Tote CSS-Klassen wurden entfernt. Die neue Edge-Viewport-Matrix prüft Anlage, Spielregel-Editor, Hilfe, Validation, aktives Turnier, Matches, Turnierbaum, Import/Export und Einstellungen bei zwölf Größen von `1920 × 1080` bis `320 × 800`, `800 × 360`, niedrigen Desktop-Höhen und einem `200 %`-Reflow-Äquivalent; Grobzeiger-Emulation prüft 44-px-Touchziele.
- Runtime-/DOM-Contracts umfassen jetzt 73 Selftests für Navigation, Labels, eindeutige IDs, Live-Regionen, Re-Render-Fokus, Fokusgrenzen, Escape-Priorität, entfernte Trigger und Notice-Semantik. Turnierlogik, Storage-Schema 5 und DRA-/PDC-Compliance-Status bleiben unverändert.

## 0.11.0
- Eine zentrale pure Create-Validation prüft Live-UI, Submit und Session-Erzeugung identisch. Bestehende Domain-Reason-Codes bleiben erhalten und werden um stabile Codes für Teilnehmernamen, Rohwerte, Boardzahl, Zeitprofil, Preset und Grand-Final-Regel ergänzt.
- Die Teilnehmeranalyse meldet erkannte Anzahl und Modusgrenzen, ignoriert nur leere Zeilen und blockiert normalisierte Duplikate mit Zeilenbezug sowie reservierte Freilosnamen. Mischen verändert die Reihenfolge, entfernt aber keine Eingaben mehr still.
- Feldnahe Fehlermeldungen erscheinen nach Feldberührung oder Submit, sind per `aria-describedby` verknüpft und setzen `aria-invalid`. Der neutrale Erstzustand erzeugt weder vorzeitige Feldfehler noch eine Alert-Ankündigung.
- Die Turnierübersicht zeigt Modus, Format, Teilnehmer, berechenbare Spielanzahl, Boards, Zeitprognose und offene Punkte. Prognose und Spielanzahl verwenden vorhandene Domainlogik; nicht belastbare Werte werden ausdrücklich als noch nicht berechenbar angezeigt.
- `Turnier anlegen` ist nur bei einer vollständigen gültigen Konfiguration aktiv. Ein manipulierter oder inzwischen veralteter UI-Zustand wird beim Submit erneut geprüft; die Fehlerzusammenfassung wird angekündigt und der Fokus führt zum ersten Problem, öffnet bei Bedarf den Spielregel-Editor oder schließt das Hilfe-Panel für Übersichtsfelder.
- Die Live-Prüfung deckt alle fünf Modi einschließlich Gruppenpolicy/-bestätigung und vollständigem Vorrundenprofil ab. Eine Zweiergruppe bleibt als Warnung sichtbar, externe Regelkonformität wird nicht pauschal behauptet.
- Domain-Tests decken Teilnehmernormalisierung, alle Modusgrenzen, Rohwerte, Gruppen-/Vorrundenfälle und Matchanzahlen ab. Runtime- und DOM-Contracts prüfen Live-Zustände, Submit-Sperre, ARIA, Fokusführung und zentrale Session-Validierung. Storage-Schema 5 bleibt unverändert.

## 0.10.0
- Alle elf Hilfethemen der Turnieranlage lösen aktuelle Auswahl, direkte Auswirkungen, Beispiele, Tipps, Abhängigkeiten, Grenzen, Herkunft, Regelstatus und Quellen aus dem normalisierten Draft auf. Bestehende pure Domain-Logik liefert Moduslimits, First-to, Gruppen-/Vorrundenanalyse, Spielregelzusammenfassung und Zeitprognose.
- Teilnehmer- und Draw-Hilfe erklärt erkannte Anzahl, Modusgrenzen, Setz-/Open-Draw-Wirkung und Freilose. Modusspezifische Hilfe reagiert auf Platz-3-Spiel, Grand-Final-Regel, gerade/ungerade Gruppen samt Bestätigung sowie das vollständige Vorrunden-/Finalphasenprofil.
- Spielregelhilfe trennt Presetwerte von technischen AutoDarts-Werten, erklärt `Best of` als `First to`, bildet Bull-off/Bull-Modus korrekt ab und grenzt Custom- sowie Kompatibilitätsprofile von offiziellen Formatclaims ab.
- Board- und Zeitprofilhilfe verwenden die reale Dauerprognose, bleiben aber ausdrücklich technische Planungsparameter ohne MultiBoard- oder Turnierregelbehauptung.
- Tipps besitzen einen eigenen visuellen Abschnitt. `Herkunft der Einstellung` und `Regelstatus und Konformität` werden separat und textlich verständlich gerendert; Geltungsbereich und technische Durchsetzung verhindern pauschale Gesamt-Konformitätsclaims.
- Ein geöffnetes Thema aktualisiert sich bei relevanten Eingaben, ohne selbstständig zu wechseln. Dynamische Gruppen-/Vorrundenfelder erhalten beim gezielten Teil-Render den aktiven Fokus und eine vorhandene Textauswahl.
- Quellenclaims wurden gegen die lokale DRA-PDF geprüft: Round Robin verweist auf Seite 18, Draw auf 19 und Veranstalter-Tie-Break auf 21. Das European-Tour-Preset ist auf die ersten vier Runden bis einschließlich Viertelfinale begrenzt; Halbfinale und Finale werden nicht als abgedeckt behauptet.
- Domain- und Runtime-Tests decken sichere Teil-Drafts, alle Modi und Presets, Abhängigkeiten, kritische Compliance-Texte, getrenntes Rendering, Live-Änderungen und Fokus-Erhalt ab. Storage-Schema 5 bleibt unverändert.

## 0.9.0
- Die Turnieranlage besitzt einen zentralen, datengetriebenen Help-Topic-Katalog mit elf echten Themen: Turniermodus, Preset/Format, Teilnehmer, KO-Auslosung, Platz 3, Doppel-KO Grand Final, ungerade Gruppenfelder, Vorrunde + Finalphase, Spielregeln/X01, Board-Anzahl und Zeitprofil.
- Einheitliche kreisförmige `?`-Buttons sind echte Buttons mit konkretem `aria-label`, stabilem `aria-controls`, synchronem `aria-expanded`, sichtbarem Tastaturfokus und vergrößertem Touch-Ziel. Einen globalen Hilfe-Schalter, Glühlampen oder eine Regelarten-Legende gibt es im Create-Formular nicht.
- Ein Klick öffnet rechts eine ergänzende, nicht-modale Hilferegion und ersetzt dort vorübergehend die Turnierübersicht. Auf Tablet und Mobile bleibt das Panel im normalen Dokumentfluss; die Übersichtskontrollen bleiben beim Umschalten im Formular erhalten.
- Jedes Thema zeigt mindestens Titel, Kurzbeschreibung, aktuelle Auswahl, direkte Turnierauswirkungen und konkret beschriftete Quellen. Regel- und Veranstalterbehauptungen werden fachlich eingeordnet; leere optionale Abschnitte werden nicht gerendert.
- Der Inhalt eines aktiven Themas reagiert auf die zugehörigen Draft- und Einstellungswerte, ohne das Thema automatisch zu wechseln. Ein expliziter Klick auf einen anderen `?`-Button wechselt es; reiner Fokus ändert nichts.
- Schließen-Button und `Escape` stellen die Übersicht wieder her und geben den Fokus stabil an den auslösenden Button zurück. Ein nach Moduswechsel unzulässiges Thema schließt ohne Fokusverschiebung. Drawer-Schließen, erfolgreiche Anlage, Import und Reset verwerfen den nicht persistierten Hilfezustand.
- Die alten formularnahen Info-/Regellink-Gruppen an Überschrift, Modus, Draw, Moduslimits und Zeitprognose wurden ohne doppelte Hilfe entfernt. Bestehende Link-Icons außerhalb der Turnieranlage bleiben unverändert.
- Domain- und Runtime-Tests decken Katalogvollständigkeit, Pflichtinhalte, unbekannte IDs, optionale Abschnitte, sichere Links, Öffnen, expliziten Themenwechsel, Live-Aktualisierung, Schließen, Fokus-Rückgabe, Escape und Modusinvalidierung ab. Storage-Schema 5 bleibt unverändert.
- Erweiterte Abhängigkeiten, Beispiele und detaillierte Compliance-Hilfe bleiben bewusst Release 5 vorbehalten.

## 0.8.0
- `Zusätzliche Turnierregeln` nutzt eine zentrale Zuordnung für alle fünf Modi: KO zeigt Draw und Platz 3, Doppel-KO Draw und Grand-Final-Regel, Liga nur eine kurze Leermeldung, `groups_ko` ausschließlich die vorhandene Gruppenpolicy/-analyse und `preliminary_final` ausschließlich seine bisherigen Spezialfelder.
- Inaktive Regelgruppen sind nicht nur optisch verborgen, sondern mitsamt Controls deaktiviert. Dadurch verschwinden sie aus Tastaturreihenfolge, Browser-Validierung und `FormData`.
- Das Draft-Lesen übernimmt nur aktive, tatsächlich gerenderte Modusfelder und erhält sonst die gespeicherten Werte. Platz-3-, Grand-Final-, Gruppen- und Vorrundenwerte stehen nach einer sicheren Rückkehr zum jeweiligen Modus wieder bereit; bestehende fachliche Reset-Logik für Gruppenbestätigungen bleibt erhalten.
- `scopeCreateConfigToMode()` entfernt vor Validierung und Turniererzeugung sämtliche irrelevanten Zusatzregeln. Die Domain wendet Platz 3 weiterhin nur für `ko`, Grand-Final-Regeln nur für `double_ko`, Gruppenregeln nur für `groups_ko` und Vorrundenwerte nur für `preliminary_final` an.
- `Spielregeln` zeigt standardmäßig eine Live-Zusammenfassung mit Preset-Herkunft, Startpunkten, effektivem Best-of/First-to, In/Out, Bull-off, wirksamem Bull-Modus und Maximalrunden. Bei Bull-off `Off` wird kein veralteter Bull-Modus ausgegeben; `preliminary_final` zeigt feste Vorrundenlegs und das eigene Finalphasen-Best-of.
- `Spielregeln bearbeiten` öffnet einen flüchtigen, zugänglichen Inline-Disclosure-Bereich mit stabiler Region-ID, `aria-expanded`/`aria-controls`, verborgenem Standardzustand und Fokus-Rückgabe beim Schließen. Preset-, Draft-, Zusammenfassungs- und Zeitprognose-Updates funktionieren im offenen und geschlossenen Zustand.
- Die langen dauerhaft sichtbaren Preset-Erklärblöcke im Spielregelbereich wurden auf den notwendigen Bull-off-Hinweis reduziert. Die kontextbezogene Regelhilfe aus Release 4 ist noch nicht implementiert.
- Domain- und Runtime-Tests prüfen zentrale Zuordnung, Config-Projektion, alle fünf Sichtbarkeitszustände, deaktivierte Fremdfelder, Draft-Rückkehr, Summary-Varianten, Bull-Abhängigkeit, Preset-Synchronität, Disclosure-Semantik und Fokus-Rückgabe. Storage-Schema 5 bleibt unverändert.

## 0.7.0
- Presets stehen als kompakte, responsive Auswahlkarten im Bereich `Turnierformat`; jede Option nutzt native Radio-Semantik, eine zugeordnete Beschreibung, sichtbaren Fokus und einen textlich erkennbaren Auswahlzustand.
- Die bewusste Auswahl von `PDC European Tour (Official)` oder `PDC 501 / Double Out (Basic)` wendet alle bereits definierten Werte sofort an und aktualisiert Draft, Abhängigkeiten und Zeitprognose ohne zusätzliche Bestätigung.
- `Individuell / Manuell` behält alle Sachwerte bei. Manuelle Änderungen an Modus, Best-of oder X01-Feldern aktivieren diese Karte weiterhin unmittelbar.
- Select, Hidden-Preset-Feld, Status-Pill, separater Button `Preset anwenden`, die Action `apply-selected-preset` und die zugehörigen Handler/CSS-Regeln wurden entfernt. Die Radio-Gruppe ist die einzige autoritative `x01Preset`-Quelle für `FormData`.
- Turniername, Teilnehmer, Board-Anzahl und weitere nicht vom Preset gesteuerte Draft-Werte bleiben bei Preset-Wechseln erhalten. Das Storage-Schema bleibt unverändert bei Version 5.
- Die Legacy-ID `pdc_standard` wird weiterhin auf `PDC 501 / Double Out (Basic)` abgebildet; gespeicherte Best-of-5-Werte springen nicht still auf European Tour.
- Domain-, Runtime-Self- und Runtime-Contract-Tests decken direkte Anwendung, idempotente Wiederanwendung, Custom-Umschaltung, Rerender-Persistenz, Daten-Erhalt, Legacy-Verhalten, Markup und Accessibility ab.

## 0.6.0
- Die Turnieranlage ist ohne Änderung der Fachlogik in fünf klar erkennbare Bereiche gegliedert: `Turnierformat`, `Teilnehmer`, `Zusätzliche Turnierregeln`, `Spielregeln` und `Turnierübersicht`.
- Die unveränderbaren Angaben `Spielmodus` und `Lobby` erscheinen nicht mehr als schreibgeschützte Fake-Eingabefelder, sondern als kompakte Zusammenfassung des festen Setups (`X01 · Legs / First to N · Private Lobby`).
- Modusabhängige Regelgruppen besitzen stabile Render-Gruppen; alle bisherigen Optionen und alle fünf vorhandenen Turniermodi bleiben erhalten.
- Boardzahl, Zeitprofil, bestehende Live-Zeitprognose und primäre Anlegeaktion sind in der Turnierübersicht gebündelt. Draft-Erhalt, Preset-Auswahl mit separatem Apply-Button und Teilnehmer-Mischen funktionieren unverändert.
- Responsive Layout für große Desktops, `1366 × 768`, Tablet und schmale Ansichten ergänzt; nicht interaktive Karten reagieren nicht länger mit einem irreführenden Hover-Effekt.
- Runtime-Selftests und Runtime-Contract prüfen die Bereichsreihenfolge, bestehende Formular-Hooks, alle Modusoptionen, das feste Setup, Draft-/Shuffle-Verhalten und zentrale Responsive-Styles.
- Keine neuen Hilfe-Elemente, Preset-Karten, Live-Validierung oder fachlichen Regelbehauptungen; diese späteren UX-Releases bleiben bewusst außerhalb des Scopes.

## 0.5.0
- Neuer eigenständiger Modus `preliminary_final` (`Vorrunde + Finalphase`):
  - deterministischer regulärer Paarungsgraph mit exakt `4..8` verschiedenen Gegnern je Teilnehmer, ohne Selbst- oder Doppelbegegnungen
  - mathematisch unmögliche Kombinationen werden mit stabilen Reason Codes und zulässigen Alternativen blockiert; Scheduling-Runden bleiben klar von Matches je Teilnehmer getrennt
  - Vorrundenformat `2 Legs fest` erlaubt ausschließlich `2:0`, `1:1` und `0:2`; Zwischenstände nach Leg 1 bleiben persistierbar
  - konfigurierbare Veranstalterwertung mit Punkten, Leg-Differenz und gewonnenen Legs; ungeklärte Cutoff-Gleichstände verlangen eine sichtbare, begründete Veranstalterentscheidung
  - Finalphase entsteht erst nach vollständiger Vorrunde aus der Tabellenreihenfolge und nutzt die bestehenden KO- oder Doppel-KO-Engines mit eigenem ungeradem Best-of
- AutoDarts-Sicherheitsgrenze: Fixed-2-Legs wird mangels belegbarer exakter Zwei-Lobby-/Anwurfabbildung mit `fixed_legs_api_unsupported` für den API-Start gesperrt und sicher manuell erfasst. Es gibt keine Annäherung als First to 2 oder Best of 3.
- Persistenzschema auf `schemaVersion: 5` angehoben; Draft, Import, Export, Migration und JSON-Roundtrip erhalten Vorrunden-, Finalphasen- und Leg-Zwischenstandsdaten.
- Der bestehende Modus `groups_ko` bleibt unverändert verfügbar; das faire verkürzte Vorrundenformat wird ausschließlich durch `preliminary_final` ergänzt.
- Statischer Bracket-Fallback korrigiert: Nur Matches mit Status `completed` und zugleich gültigem Ergebnis erscheinen abgeschlossen; offene und unvollständig belegte Matches bleiben sichtbar offen.
- Dauerprognose berücksichtigt Vorrunde und abhängige Finalphase. MultiBoard ist nicht Bestandteil dieses Releases; die Board-Zahl ist ausschließlich ein Kapazitätsparameter der Turnierzeitprognose.
- Release-, README- und Compliance-Texte beschreiben das Format als deterministische technische Abbildung eines gespeicherten Veranstalterprofils. Es ist nur regelkonform, wenn die Konfiguration der konkreten Turnierordnung entspricht; eine allgemeine Verbandskonformität wird nicht behauptet.

## 0.4.1
- `groups_ko` behandelt ungerade Teilnehmerzahlen jetzt explizit und auditierbar:
  - sicherer Produktstandard `require_even` blockiert neue ungerade Felder mit stabilem Fehlercode
  - `allow_unequal` bleibt als ausdrücklich bestätigte Veranstalterregel verfügbar
  - Live-Analyse zeigt Gruppengrößen, Spiele je Spieler und Qualifikationsverhältnisse
  - Legacy-Turniere werden ohne Neuauslosung oder erfundene Bestätigung weitergeführt
  - nicht abbildbare offizielle Formate werden weder angenähert noch als allgemein regelkonform bezeichnet
  - diese Absicherung löst Issue #7 noch nicht vollständig: `groups_ko` bleibt bei zwei vollständigen Round-Robin-Gruppen, und `allow_unequal` beseitigt die unterschiedlichen Matchanzahlen je Spieler nicht
  - `0.4.1` sichert damit ungerade `groups_ko`-Felder ab, löst aber nicht das faire Vorrundenformat mit gleicher Matchanzahl; die funktionale Lösung folgt mit `0.5.0`
- Compliance-Wording präzisiert:
  - DRA 6.16.1 wird als Veranstalterermessen statt universeller Tie-Break-Reihenfolge beschrieben
  - das projektinterne Seed-Placement für Byes wird konkret benannt statt pauschal als allgemein verbandskonform bezeichnet

## 0.4.0
- KO-Phasen fachlich sauber benannt:
  - KO-Ansicht und Matchkarten zeigen jetzt offizielle Endphasenbezeichnungen (`Achtelfinale`, `Viertelfinale`, `Halbfinale`, `Finale`).
  - Frühere große KO-Stufen bleiben als `Letzte 32`, `Letzte 64` usw. statt künstlicher `...finale`-Labels benannt.
  - Blockiermeldungen für Vorgänger-Matches referenzieren dieselbe KO-Phase statt generischem `Runde <n>`.
- Matchstart robuster und besser debugbar gemacht:
  - `Match starten` nutzt jetzt einen testbaren Start-Flow mit strukturierter Schrittverfolgung.
  - fehlgeschlagene, noch nicht gestartete Lobbys werden vorsichtig per `DELETE /lobbies/{id}` bereinigt.
  - bullMode-Validierungsfehler behalten den bestehenden Fallback auf `25/50`, jetzt mit explizitem Debug-Nachweis.
  - Debug-Mode speichert ein kopierbares Matchstart-Protokoll im Tab `Einstellungen` und stellt es zusätzlich über `__ATA_RUNTIME.getDebugReport()` bereit.
  - Matchstart wird bei doppelten Teilnehmernamen bereits in der UI als nicht API-tauglich blockiert.
  - Auth-Fallback erweitert: wenn kein `Authorization`-Cookie vorhanden ist, wird ein Access-Token aus `autodarts_refresh_token` via `POST /auth/v1/refresh` geholt und gecacht.
  - zusätzlicher Auth-Fallback: wenn Cookie/Refresh fehlen, wird ein Bearer-Token aus laufenden `api.autodarts.io`-Request-Headern erkannt und als Runtime-Cache genutzt.
  - Auth-Header-Capture läuft jetzt über eine isolierte Page-Bridge statt direkter Userscript-Prototyp-Patches, damit die reguläre Autodarts-Matchanlage stabil bleibt.
  - Neue API-Dokumentation `docs/autodarts-api-capabilities.md` mit Endpoint-Matrix, Risikoklassen und Probe-Prozess ergänzt.
  - Versioniertes Console-Probe-Skript `docs/ata-api-probe-v2.js` ergänzt, inklusive Request-Body-Key-Erfassung für Capability-Reports.
  - Probe-Sicherheitsnetz ergänzt: keine Tokenwerte, keine Query-Parameterwerte, nur strukturelle Body-Key-Pfade im Report.
  - Troubleshooting ergänzt: `GET /gs/v0/matches/{id}/challenge` mit `404` als beobachteter, nicht blockierender App-Call dokumentiert; zusätzlicher Hinweis zu sensitiven SSO-Parametern in Roh-Logs.
  - API-Dokumentation mit Internet-Recherche erweitert: quellenmarkierte Gesamtliste (`A/B/C/P`-Confidence), zusätzliche Community-Endpunkte (`/matches/{id}/corrections`, `PATCH /matches/{id}/throws`, `/matches/{id}/undo`, `/lobbies/{id}/players/by-index/{index}`, `/as/v0/users/{id}/stats/{variant}`) und WebSocket-Hinweis `/ms/v0/subscribe`.
  - neuer State-of-the-art Leitfaden `docs/api-documentation-playbook.md` ergänzt (OpenAPI/AsyncAPI-Zielbild, RFC-9457-Fehlermodell, Governance-Checkliste und Sicherheitsregeln für API-Dokumentation).
- Runtime-Update-Pfad aus `autodarts-xconfig` technisch übernommen:
  - neue GitHub-Update-Erkennung im Tab `Einstellungen` mit gecachtem Versionsstatus, TTL und manuellem Recheck
  - `.meta.js`-Artefakt für leichtgewichtigen Versionsabgleich ergänzt
  - verfügbare Updates werden zusätzlich am Sidebar-Menüeintrag `xLokales Turnier` markiert
  - bei aktivem Loader reicht ein Reload; bei direkter Runtime-Installation öffnet der Assistent die veröffentlichte Userscript-Datei
- Regelhärtung für dokumentierte Entscheidungszeitpunkte:
  - Tie-Break-Profil ist nach dem ersten abgeschlossenen Gruppen-/Liga-Ergebnis gesperrt (`DRA 6.16.1`).
  - Draw-Lock-Entsperren wurde auf expliziten Promoter-Override mit Bestätigung und Zeitfenster umgestellt (`DRA 6.12.1`).
- KO optional um Platz-3-Spiel erweitert:
  - neues Turnierfeld `enableThirdPlaceMatch` (Default `false`) für `mode = ko`
  - Default-Verhalten unverändert: Single Elimination mit genau einem Finale
  - bei aktivierter Option: Halbfinal-Verlierer spielen um Platz 3, ohne Einfluss auf den Champion-Pfad
  - bei Bye-/Edge-Szenarien wird kein kaputter Placement-Pfad erzeugt
  - Bracket-Payload setzt bei vorhandenem Platz-3-Spiel `consolationFinal` und trennt Hauptbaum/Bronze per `group_id`
  - Legacy-Turniere ohne neues Feld bleiben kompatibel
- Doppel-KO-Modus ergänzt:
  - neuer Modus `double_ko` mit Limit `2..32`
  - Winners Bracket, Losers Bracket und Finals werden deterministisch aus demselben Seed-/Open-Draw-Modell wie KO aufgebaut
  - Grand Final ist konfigurierbar: Reset-Finale falls nötig (Default) oder einzelnes Grand Final
  - Bracket-Payload nutzt `double_elimination`; statischer Fallback gruppiert Winners, Losers und Finals
  - Dauerprognose berücksichtigt `2n - 1` Matches mit Reset-Maximum bzw. `2n - 2` beim Einzel-Grand-Final
- History-Import robuster gemacht:
  - Legs-Abweichungen werden nicht mehr still normalisiert, sondern liefern zuerst `requires_confirmation`.
  - Bestätigung ist signaturgebunden und zeitlich begrenzt; ungültige/abgelaufene Bestätigungen werden abgelehnt.
  - Host-Erkennung auf `/history/matches/{id}` verschärft (kein Fallback auf beliebige erste Tabelle).
- Autodetect-Routen eingeschränkt:
  - DOM-Autodetect arbeitet nur noch auf `/matches/{id}` und `/lobbies/{id}`.
- Doku synchronisiert:
  - Open Draw überall konsistent als deterministische Reihenfolge beschrieben.
  - Compliance-Matrix und Regeltexte auf neue Guard-/Override-Logik aktualisiert.
  - README um klickbare Statusmeldungs-Referenz für Runtime-Leiste, API-Sync und History-Import ergänzt.
- Tests erweitert:
  - Domain-Tests für Tie-Break-Lock und Draw-Lock-Override.
  - Unit-Test für README-Statuslink-Mapping ergänzt.
  - Runtime-Selftests für Confirmation-Flow, Host-Guards und Route-Guards.
- Preset-Logik fachlich korrigiert:
  - neues Default-Preset `PDC European Tour (Official)` (`KO`, `Best of 11`, `501`, `Straight In`, `Double Out`, `Bull 25/50`)
  - bisheriges irreführendes `PDC Standard` wird nicht mehr als offizielles Preset geführt
  - Legacy-ID `pdc_standard` wird kompatibel auf `PDC 501 / Double Out (Basic)` normalisiert
  - `Max Runden 50` wird in UI/Doku explizit als technisches AutoDarts-Limit beschrieben, nicht als PDC-Regel
- Turnierformular für Presets erweitert:
  - Auswahlfeld + `Preset anwenden` statt hart verdrahtetem Einzelbutton
  - Preset-Status bleibt konsistent und springt bei manuellen Änderungen sauber auf `Individuell`
  - Hinweis ergänzt, dass `PDC World Championship` wegen fehlender Set-Unterstützung bewusst nicht als offizielles Preset enthalten ist
- QA für Presets ergänzt:
  - Schema-Selfcheck für alle Preset-Definitionen
  - Golden-Test für `PDC European Tour (Official)`
  - Runtime-Selbsttest für Preset-Auswahl + Apply im Formular
- Turnierzeit-Prognose nachkalibriert:
  - Zeitprofil beeinflusst jetzt auch Match-/Phasenübergänge statt nur die Leg-Geschwindigkeit
  - Score-Faktoren für kurze und lange X01-Distanzen näher an externen Richtwerten ausgerichtet
  - neue Dokumentation `docs/tournament-duration.md` mit Formel, Parametern und Benchmark-Basis
- Turnierzeit-Prognose um ein Kapazitätsmodell erweitert:
  - neues Eingabefeld `Boards für Zeitprognose` im Turnierformular (`1..32`)
  - Berechnung nutzt jetzt einen abhängigkeitssensitiven Scheduler (Board-Limit, Spieler-Konflikte, KO-/Phasenabhängigkeiten)
  - Ausgabe ergänzt um Match-Wellen, Peak-Parallelität und Board-Auslastung
  - Zeitprofil-Steuerung von `Einstellungen` direkt in den Tab `Turnier` zur Prognose verschoben
  - Prognose inkl. Parameter kann direkt ein-/ausgeblendet werden
  - bei aktivem Turnier zusätzliche laufende Restzeit-Prognose auf Basis des Spielfortschritts ergänzt
  - laufende Restzeit-Prognose auf statische Matchplan-Restzeit umgestellt (ohne Pace-/Uhrzeitfaktor, Neuberechnung nur bei Fortschritt)
- Turnierzeit-Prognose ergänzt:
  - neue pure Domain-Datei `src/domain/tournament-duration.js`
  - Live-Schätzung in der Turnieranlage unter `Teilnehmer`
  - Berechnung berücksichtigt Modus, Teilnehmerzahl, `Best of`, `Startpunkte`, `In`, `Out`, `Bull-off`, `Bull-Modus` und `Max Runden`
  - Ausgabe als Hauptwert plus realistische Spannweite
- Neue globale Einstellung:
  - `settings.tournamentTimeProfile` mit `fast | normal | slow`
  - Select im Tab `Turnier` zur Kalibrierung lokaler Spielgeschwindigkeit
- Tests und Doku erweitert:
  - neue Domain-Unit-Tests für Matchanzahl und Zeitlogik
  - README, Architektur- und Codebase-Dokumentation aktualisiert

## 0.3.4
- DRA-Compliance-Hardening umgesetzt:
  - Storage auf `schemaVersion: 4` angehoben.
  - Regelmodell auf `tournament.rules.tieBreakProfile` umgestellt:
    - `promoter_h2h_minitable`
    - `promoter_points_legdiff`
  - Legacy-Mapping ergänzt:
    - `dra_strict -> promoter_h2h_minitable`
    - `legacy -> promoter_points_legdiff`
- KO-Engine verfeinert:
  - vollständige Match-Materialisierung über alle KO-Runden
  - Freilose als explizite Bye-Matches (`meta.resultKind = bye`)
  - zukünftige KO-Slots bleiben als nicht editierbare offene Paarungen sichtbar
- Draw-Lock eingeführt:
  - neues Feature-Flag `settings.featureFlags.koDrawLockDefault` (Standard `true`)
  - neues Turnierfeld `tournament.ko.drawLocked`
  - neues Turnierfeld `tournament.ko.placement`
  - UI-Toggle für aktives KO-Turnier in den Einstellungen
- Bracket-Payload korrigiert:
  - Vollbaum-Darstellung auch bei frühem Turnierstand
  - Bye-/Completion-Kennzeichnung konsistent
- QA erweitert:
  - neue Regelcheck-Marker für KO-Materialisierung, Bye-Handling, Draw-Lock und Promoter-Tie-Break-Profile
  - Selftests um KO-Struktur-, Draw-Lock- und Profilszenarien erweitert
- Neue Compliance-Dokumentation:
  - `docs/dra-compliance-matrix.md`

## 0.3.3
- History-Import gehärtet:
  - Ergebnis wird bevorzugt in das bereits per `lobbyId` verknüpfte offene Turnier-Match geschrieben.
  - Namenszuordnung robust erweitert (Teilnamen/Varianten), falls Tabellenanzeige vom Turniernamen abweicht.
  - Legs werden bei abweichenden Match-Settings sicher auf den Turniermodus normalisiert, damit das Ergebnis in `Ergebnisführung` gespeichert wird.
  - Zusätzliche Selftests für History-Import ergänzt.

## 0.3.2
- Match-Statistik-Import überarbeitet:
  - Floating-Shortcut unten rechts entfernt.
  - Inline-Import auf `/history/matches/{id}` visuell präsenter gestaltet.
  - Klick übernimmt Ergebnis primär direkt aus der Statistik-Tabelle (Spieler, Gewinner, Legs).
  - API-Sync wird nur noch als Fallback genutzt, wenn die Tabelle nicht parsbar ist.
  - Import priorisiert jetzt ein bereits verknüpftes Lobby-Match, um die Ergebnisführung sicher im richtigen Spiel zu aktualisieren.
  - Namenszuordnung wurde toleranter gemacht (Teilename/Varianten).
  - Legs werden bei abweichenden Match-Einstellungen kontrolliert auf den Turniermodus normalisiert.

## 0.3.1
- Ergebnisübernahme erweitert:
  - neuer Inline-Button auf `/history/matches/{id}`: `Ergebnis übernehmen & Turnier öffnen`
  - bestehender Floating-Shortcut bleibt als Fallback aktiv.
- API-Sync robuster gemacht:
  - Recovery kann offene Turnier-Matches auch ohne gespeicherte `lobbyId` über API-Stats/Spielernamen wiederfinden
  - bei mehrdeutiger Zuordnung wird mit klarer Meldung abgebrochen (kein unsicheres Auto-Write).
- Sync-Transparenz erhöht:
  - `syncResultForLobbyId` unterstützt `trigger` (`inline-history`, `floating-shortcut`, `background`)
  - Rückgaben enthalten `reasonCode` (`not_found`, `ambiguous`, `pending`, `completed`, `auth`, `error`)
  - zusätzliche `[ATA][api]`-Logs für Trigger, Recovery-Kandidaten und Sync-Ausgang.
- Persistenz gehärtet:
  - Recovery-Verknüpfung speichert sofort (mit Fallback auf Debounce), damit F5 die Zuordnung nicht verliert.

## 0.3.0
- Codebasis in Schichten aufgeteilt (`src/core`, `src/data`, `src/domain`, `src/infra`, `src/ui`, `src/bracket`, `src/runtime`).
- Build-Pipeline ohne npm/Node eingeführt:
  - deterministischer Build via `scripts/build.ps1`
  - Reihenfolge über `build/manifest.json`
  - CSS aus `src/ui/styles/main.css` wird in das Bundle eingebettet.
- Storage auf `schemaVersion: 3` angehoben.
- Neues Turnier-Regelfeld:
  - `tournament.rules.tieBreakMode` (`dra_strict | legacy`)
  - Bestandsdaten werden auf `dra_strict` migriert.
- DRA-strikte Tie-Break-Logik umgesetzt:
  - Punkte
  - Direktvergleich (2 Punktgleiche)
  - Teilgruppen-LegDiff (3+ Punktgleiche)
  - Gesamt-LegDiff
  - Gesamt-Legs+
  - danach `playoff_required`.
- Gruppen-zu-KO-Auflösung blockiert bei `playoff_required`.
- Regelbezogene Fachterminologie in der UI ergänzt:
  - `Freilos (Bye)`
  - `KO (Straight Knockout)`
  - `Liga (Round Robin)`
  - `Nächstes Match (Next Match)`.
- Diagnose-API ergänzt:
  - `window.__ATA_RUNTIME.runSelfTests()`.
- Mehrstufige QA-Skripte ergänzt:
  - `scripts/qa.ps1`
  - `scripts/qa-encoding.ps1`
  - `scripts/qa-regelcheck.ps1`.

## 0.2.17
- Turnierformular (`Neues Turnier erstellen`) visuell und strukturell optimiert:
  - kompakte Zwei-Zonen-Ansicht (Konfiguration links, Teilnehmer + Aktionen rechts), damit die Inhalte auf Desktop besser auf eine Bildschirmansicht passen
  - Preset-Button verkleinert (`PDC Preset anwenden`) und besser in die Formularlogik integriert
  - Feldreihenfolge angepasst (`Bull-off` vor `Bull mode`).
- Lokale Lobby-Härtung:
  - Lobby ist nicht mehr wählbar im Formular
  - API-Create setzt `isPrivate` nun fest auf `true`
  - interne Normalisierung erzwingt `lobbyVisibility = private`.

## 0.2.16
- Turnierformular im Tab `Turnier` auf 3-Spalten-Layout umgestellt, damit die X01-Einstellungen auf normalen Monitoren kompakter sichtbar sind.
- X01-Preset-Handling umgebaut:
  - Preset-Auswahlfeld entfernt
  - neuer Button `PDC Preset anwenden` setzt die PDC-Defaults direkt in die Formularfelder
  - manuelle X01-Änderungen markieren den Preset-Status automatisch als `Custom`.
- Formularabhängigkeiten erweitert:
  - bei `Bull-off = Off` wird `Bull mode` read-only deaktiviert
  - Persistenz bleibt stabil durch Hidden-Fallback für deaktivierte Felder.
- Match-Create-Payload verfeinert:
  - `bullOffMode` wird beim Lobby-Create auf Top-Level übertragen (wie in `play.autodarts.io`).
  - `bullMode` bleibt gesetzt (mit Fallback), damit Matchstart nicht an Backend-Validierungen scheitert.
- Legacy-Startscores (`101`, `201`) aus der X01-Auswahl und Sanitization entfernt.

## 0.2.15
- X01-Matchanlage für API-Start erweitert:
  - Turnier-Neuanlage enthält jetzt X01-Parameter aus der Autodarts-Lobbyoberfläche:
    - Startscore, In mode, Out mode, Bull mode, Bull-off, Max Runden, Lobby-Sichtbarkeit
  - Spielmodus bleibt bewusst `Legs` und wird aus `Best-of Legs` als `First to N` abgeleitet
  - `Match starten` übernimmt diese Werte konsistent in den Lobby-Create-Payload.
- PDC-Preset für Neuanlage eingeführt:
  - Standard ist `PDC Standard` (501, Straight In, Double Out, 25/50, Bull-off Normal, Max Rounds 50, Lobby privat)
  - optionaler `Custom`-Modus für abweichende X01-Einstellungen.
- Startscore-Optionen um die X01-Lobbywerte erweitert (`121, 170, 301, 501, 701, 901`; Legacy `101, 201` bleibt import-/kompatibel).
- UI-Transparenz verbessert:
  - aktives Turnier zeigt die hinterlegten X01-Settings kompakt an.

## 0.2.14
- Match-Seiten-Shortcut hinzugefügt:
  - auf `/lobbies/{id}` und `/matches/{id}` erscheint ein Button für `Ergebnis übernehmen & Turnier öffnen`
  - Shortcut öffnet direkt den Tab `Spiele` im Turnierassistenten.
- Gezielte manuelle Ergebnisübernahme pro Lobby-ID:
  - Sync kann für genau ein Lobby-Match aktiv ausgelöst werden (statt nur passiv im Background-Polling).
- API-Sync robuster gemacht:
  - Pending-Matches mit `auto.status=error` werden nun ebenfalls erneut versucht
  - dadurch können temporäre Fehler ohne manuelles Zurücksetzen wieder in `started/completed` übergehen.
- Fehler-/Hinweislogik beim Sync entprellt:
  - weniger wiederholte Fehlermeldungen bei gleicher Ursache.

## 0.2.13
- KO-Engine v2 eingeführt:
  - Hybrid-Draw für neue KO-Turniere:
    - `randomize ON` -> `open_draw`
    - `randomize OFF` -> `seeded`
  - deterministische Bye-Verteilung über das projektinterne Standard-Seed-Placement
  - Fehlerfall bei 9 Teilnehmern behoben (kein `Seed 1 vs Seed 2` in Runde 1 mehr).
- Legacy-KO-Turniere werden beim Laden auf Engine v2 migriert:
  - vor Migration wird automatisch ein Backup geschrieben (`ata:tournament:ko-migration-backups:v2`).
- Match-Metadaten erweitert um `match.meta.resultKind`:
  - `bye` kennzeichnet automatisch weitergeleitete Freilose.
- Tab `Spiele` verbessert:
  - Freilose werden als eigener Status `Freilos` angezeigt
  - Legs-Spalte zeigt bei Freilos nicht mehr ein reguläres `0:0`.
- Persistenzschema auf `schemaVersion: 2` angehoben (Storage-Key bleibt kompatibel: `ata:tournament:v1`).
- Interne Struktur klarer getrennt in Datenhaltung, Turnierlogik und Präsentation (inkrementell in `dist`).

## 0.2.12
- Teilnehmer-Limits auf regelbasierte, modusabhängige Grenzen umgestellt:
  - `ko`: `2..128`
  - `league`: `2..16`
  - `groups_ko`: `4..16`
- Validierung für Turniererstellung und Import auf die neuen Modus-Limits umgestellt.
- GUI-Hinweise im Tab `Turnier` und `Einstellungen` erweitert, inklusive Link auf `README.md#regelbasis-und-limits`.
- Dokumentation aktualisiert (`README.md`, `docs/architecture.md`) mit Regelbasis und Begründung.

## 0.2.7
- Bracket-Renderer auf `brackets-viewer@1.9.0` vereinheitlicht; GoJS-Anteil entfernt.
- Bracket-iframe visuell auf Autodarts-Look angepasst (größere Schrift, bessere Proportionen, volle Breiten-/Scrollnutzung).
- Doppelte/unerwünschte interne Bracket-Überschrift ausgeblendet.
- KO-Payload defensiv gehärtet: Unbekannte Teilnehmer-IDs werden nicht mehr als valide Opponents übernommen.
- HTML-Fallback im Tab `View` jetzt standardmäßig verborgen und nur bei Renderfehler/Timeout sichtbar.
- Diverse UI-Texte korrigiert (u. a. Umlaute bei Fehlermeldungen).

## 0.2.0
- API-Halbautomatik umgesetzt:
  - Matchstart per Button im Tab `Spiele` (`Match starten` / `Zum Match`)
  - automatische Ergebnissynchronisierung über Autodarts-API für gestartete Matches
  - Single-active-match-Regel (ein aktives gestartetes Match gleichzeitig).
- Persistenter Automationsstatus pro Match in `match.meta.auto` (abwärtskompatibel).
- Userscript-Metadaten erweitert um `GM_xmlhttpRequest` und `@connect api.autodarts.io`.
- Loader-Metadaten erweitert um `@connect api.autodarts.io` für API-Zugriffe im Loader-Kontext.
- Settings-Text aktualisiert: `Automatischer Lobby-Start + API-Sync` ist jetzt funktional.

## 0.1.2
- Alle Loader- und Script-Metadaten auf das korrekte Repo `thomasasen/autodarts_local_tournament` umgestellt (`namespace`, `downloadURL`, `updateURL`, RAW-Quelle).
- Menübezeichnung auf `xLokale Turniere` geändert.
- Menüposition verbessert: bevorzugt direkt unter `Boards/Meine Boards` (auch bei verschachtelter DOM-Struktur).
- Klick-Handling gehärtet: Toggle wird bei frühem Klick über `ata:ready` nachgeholt, falls die Runtime noch nicht geladen war.

## 0.1.1
- Loader-Menüpunkt `Turnier` auf robuste Sidebar-Erkennung umgestellt (analog zum `xConfig`-Muster mit Kandidaten-Scoring).
- Stabilere Einfügeposition im Hauptmenü (bevorzugt hinter `Boards`, sonst vor Profilbereich).
- Responsives Label-Verhalten: blendet den Text bei schmaler Sidebar aus, Icon bleibt sichtbar.

## 0.1.0 (MVP)
- Neues Loader-Userscript mit RAW-Load + Cache-Fallback.
- Neues Haupt-Userscript mit:
  - Shadow-DOM Drawer UI
  - Turniererstellung für KO, Liga, Gruppen + KO
  - Match-Ergebnisführung (auto + manuell)
  - Tabellenberechnung (Punkte > LegDiff > Legs+)
  - Bracket-Anzeige via `brackets-viewer` (iframe) + HTML-Fallback
  - JSON Export/Import (Datei + Copy/Paste)
  - Storage-Versionierung (`ata:tournament:v1`) inklusive Migrations-Stub
  - SPA-Routing-Stabilisierung und zentralem Cleanup.
