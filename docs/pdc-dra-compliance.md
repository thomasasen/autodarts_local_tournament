# PDC/DRA Compliance-Mapping

## Quellen
- DRA Rulebook (offiziell): https://www.thedra.co.uk/dra-rulebook
- DRA PDF (Projektkopie): [DRA-RULE_BOOK.pdf](DRA-RULE_BOOK.pdf)
- Detailmatrix: [dra-compliance-matrix.md](dra-compliance-matrix.md)

## Umgesetzte Punkte

1. **Round Robin Tie-Break als Veranstalterprofil (DRA 6.16.1)**
- DRA `6.16.1` schreibt keine universelle Tie-Break-Reihenfolge vor; die konkrete Reihenfolge ist eine Veranstalterregel.
- Implementiert in `standingsForMatches`.
- Profil `promoter_h2h_minitable`:
  - Punkte
  - Direktvergleich (bei genau 2 Punktgleichen)
  - Teilgruppen-Leg-Differenz (bei 3+ Punktgleichen)
  - Gesamt-Leg-Differenz
  - Gesamt-Legs gewonnen
  - danach `playoff_required`
- Referenz: DRA Rulebook `6.16.1` (Seite 21), PDF-Link: [DRA-RULE_BOOK.pdf#page=21](DRA-RULE_BOOK.pdf#page=21)
- Profilwechsel ist nach dem ersten abgeschlossenen Gruppen-/Liga-Ergebnis technisch gesperrt.

<a id="pdc-dra-groups-resolution"></a>
2. **Gruppenauflösung**
- `groupResolution.status` wird auf `playoff_required` gesetzt, wenn Gleichstände nicht auflösbar sind.
- KO-Qualifikation wird bis zur manuellen Klärung blockiert.
- Für neue ungerade `groups_ko`-Felder verlangt die Anwendung eine ausdrückliche Veranstalterregel:
  - `require_even` ist der sichere Produktstandard, keine DRA-Universalregel.
  - `allow_unequal` erhält die deterministische A/B-Verteilung und erfordert bei ungerader Anzahl eine Bestätigung der konkreten Turnierordnung.
- Unterstützt werden ausschließlich zwei Gruppen mit vollständigem Round Robin und Top 2 je Gruppe. Andere offizielle Formate werden nicht angenähert oder als durch diesen Modus regelkonform abgebildet bezeichnet.
- Legacy-Turniere bleiben ohne Neuverteilung spielbar; eine fehlende historische Bestätigung wird transparent angezeigt und nicht erfunden.

<a id="pdc-dra-ko"></a>
3. **KO / Straight Knockout**
- KO-Bracket bleibt Single Elimination.
- Default bleibt ein klassischer KO-Baum mit genau einem Finale.
- Seeded/Open Draw bleiben verfügbar.
- Alle KO-Runden werden als Match-Knoten materialisiert (inklusive zukünftiger offener Paarungen).
- Freilose (Bye) werden explizit als abgeschlossene Bye-Matches geführt; ihre Verteilung folgt dem im Projekt festgelegten Seed-Placement.
- Optional kann per Turnierregel `enableThirdPlaceMatch` ein Platz-3-Spiel aktiviert werden:
  - Halbfinal-Sieger bleiben im Hauptfinale.
  - Halbfinal-Verlierer spielen separat um Platz 3.
  - Keine Auswirkung auf den Champion-Pfad.
  - Bei Bye-/Edge-Szenarien wird kein unvollständiger Placement-Pfad erzeugt.
- Draw-Lock ist standardmäßig aktiv und hält den initialen KO-Draw stabil.
- Entsperren ist nur als expliziter Promoter-Override mit Bestätigung zulässig.
- Referenz: DRA Rulebook `6.8.1` (Seite 17), `6.12.1` (Seite 19), sowie `1.2`/`6.8.4` für explizite Tournament-/Promoter-Rules; PDF-Links: [KO](DRA-RULE_BOOK.pdf#page=17), [Draw](DRA-RULE_BOOK.pdf#page=19)

<a id="pdc-dra-preliminary-final"></a>
3a. **Vorrunde + Finalphase als Veranstalterprofil**
- `preliminary_final` erzeugt deterministisch einen einfachen regulären Paarungsgraphen mit gleicher realer Matchanzahl für alle Teilnehmer.
- Das gespeicherte Profil regelt zwei feste Legs, Punkte, Rangfolge, Qualifikantenzahl und KO-/Doppel-KO-Finalphase. Diese Details werden nicht als universelle DRA-/PDC-/WDF-Regel bezeichnet.
- Bei weiterem Gleichstand am Cutoff bleibt der Status `playoff_required`; die gespeicherte Veranstalterentscheidung braucht sichtbare Reihenfolge und Begründung.
- Fixed-2-Legs wird mangels belegbarer exakter AutoDarts-Anwurfabbildung nur manuell erfasst. Der API-Start ist gesperrt; First to 2 und Best of 3 sind keine Ersatzregeln.

4. **Regelbezogene Terminologie mit technischer Abgrenzung**
- Die UI nutzt deutsche Begriffe mit PDC-Bezug, z. B.:
  - `Freilos (Bye)`
  - `KO (Straight Knockout)`
  - `Liga (Round Robin)`
  - `Nächstes Match (Next Match)`

<a id="pdc-dra-preset-logic"></a>
5. **Preset-Logik (ehrlich statt irreführend)**
- Offizielles Preset in der UI:
  - `PDC European Tour (Official)`
  - Format der ersten vier Runden bis einschließlich Viertelfinale: `KO`, `Best of 11 Legs (First to 6)`, `501`, `Straight In`, `Double Out`, `Bull 25/50`
  - Halbfinale (`Best of 13`) und Finale (`Best of 15`) sind längere Eventrunden und werden von diesem Einzelrunden-Preset nicht abgebildet.
- PDC-Europe-Quelle: [European Darts Open 2026 – Format](https://www.pdc-europe.tv/tournaments/et-2026-en/european-darts-open-2026/)
- Technische AutoDarts-Werte bleiben explizit getrennt:
  - `Bull-off Normal` ist die technische Lobby-Abbildung im Tool
  - `Max Runden 50` ist **kein** PDC-Regelpunkt, sondern nur ein technisches Limit für die Lobby
- Das frühere irreführende `PDC Standard` wurde nicht als offizielles Preset weitergeführt:
  - alte gespeicherte Daten mit `pdc_standard` landen jetzt ehrlich bei `PDC 501 / Double Out (Basic)`
  - damit bleiben ältere `Best of 5`-Entwürfe kompatibel, ohne still auf `Best of 11` umzuschalten

## Bewusste Nicht-Automatisierung
- Bei vollständigem Deadlock wird keine automatische Entscheidung getroffen.
- Der Systemstatus ist `playoff_required` und erfordert eine manuelle Turnierentscheidung.
- `PDC World Championship` wird nicht als offizielles Preset behauptet, weil das reale Format `Sets` benötigt und die AutoDarts-/ATA-Integration hier nur `Legs / First to N` abbilden kann.
- MultiBoard ist nicht Bestandteil von Version `0.12.1`. Die Board-Anzahl ist ausschließlich ein Kapazitätsparameter der Zeitprognose; Board-Zuweisung, parallele Lobbyverwaltung und mehrere gleichzeitig gestartete Matches bleiben außerhalb des Scopes.

## Accessibility-Abschluss in Release 7

- Die Regel- und Compliance-Aussagen sind über echte Buttons/Links, sichtbaren Fokus, vollständige Drawer-Tastaturführung und programmatische Formularbeschriftungen erreichbar.
- Hilfe-Escape wird vor Drawer-Escape behandelt; Fokus kehrt zum auslösenden Hilfebutton beziehungsweise beim Drawer-Schließen zum ursprünglichen Seitenauslöser zurück.
- Seit Release `0.12.1` fokussieren strukturelle Ansichtswechsel explizit die resultierende Spiele- oder Turniererstellungsüberschrift beziehungsweise den aktivierten Navigationsbutton; ein DOM-Positionsfallback ist über Ansichtsgrenzen gesperrt.
- Live-Regionen kündigen nur veränderliche Teilnehmer- und globale Statusinformationen sowie echte Fehler an. Statische Regelzusammenfassungen werden nicht mehrfach vorgelesen.
- Diese Änderungen verbessern ausschließlich Bedienbarkeit und Wahrnehmbarkeit. Sie automatisieren keine Veranstalterentscheidung, erweitern kein offizielles Format und ändern keine DRA-/PDC-Compliance-Einstufung.
