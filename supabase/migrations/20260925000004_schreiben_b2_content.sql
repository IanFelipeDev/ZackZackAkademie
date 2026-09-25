-- Goethe-Zertifikat B2 Schreiben content (topics and Redemittel), imported from the original schreiben.html trainer.
-- Kept as a migration (not seed.sql) so the hosted project receives it via `supabase db push`.
-- IDs are deterministic (md5 of a stable key) so the migration is idempotent.

insert into public.units (id, level, position, title) values (md5('zz:unit:b2:teil1')::uuid, 'B2', 1, 'Schreiben Teil 1 – Forumsbeitrag')
  on conflict do nothing;

insert into public.lessons (id, unit_id, position, title, is_published) values
  (md5('zz:lesson:teil1:1')::uuid, md5('zz:unit:b2:teil1')::uuid, 1, 'Auto als umweltfreundliches Verkehrsmittel', true),
  (md5('zz:lesson:teil1:2')::uuid, md5('zz:unit:b2:teil1')::uuid, 2, 'Schönheitsoperationen', true),
  (md5('zz:lesson:teil1:3')::uuid, md5('zz:unit:b2:teil1')::uuid, 3, 'Konzertbesuch', true),
  (md5('zz:lesson:teil1:4')::uuid, md5('zz:unit:b2:teil1')::uuid, 4, 'Handy als Kommunikationsmittel', true),
  (md5('zz:lesson:teil1:5')::uuid, md5('zz:unit:b2:teil1')::uuid, 5, 'Private Fotos in sozialen Medien', true),
  (md5('zz:lesson:teil1:6')::uuid, md5('zz:unit:b2:teil1')::uuid, 6, 'Werbespots im Kinderfernsehen', true),
  (md5('zz:lesson:teil1:7')::uuid, md5('zz:unit:b2:teil1')::uuid, 7, 'Konsumverhalten', true),
  (md5('zz:lesson:teil1:8')::uuid, md5('zz:unit:b2:teil1')::uuid, 8, 'Erholung in der Großstadt', true),
  (md5('zz:lesson:teil1:9')::uuid, md5('zz:unit:b2:teil1')::uuid, 9, 'Umweltbewusster Tourismus', true),
  (md5('zz:lesson:teil1:10')::uuid, md5('zz:unit:b2:teil1')::uuid, 10, 'Umgang mit Lebensmitteln', true),
  (md5('zz:lesson:teil1:11')::uuid, md5('zz:unit:b2:teil1')::uuid, 11, 'Digitale Medien im Unterricht', true),
  (md5('zz:lesson:teil1:12')::uuid, md5('zz:unit:b2:teil1')::uuid, 12, 'Führerscheinverbot ab 80', true),
  (md5('zz:lesson:teil1:13')::uuid, md5('zz:unit:b2:teil1')::uuid, 13, 'Videoüberwachung in der Öffentlichkeit', true),
  (md5('zz:lesson:teil1:14')::uuid, md5('zz:unit:b2:teil1')::uuid, 14, 'Fleischreiche Ernährung', true),
  (md5('zz:lesson:teil1:15')::uuid, md5('zz:unit:b2:teil1')::uuid, 15, 'Verschmutzung der Umwelt', true),
  (md5('zz:lesson:teil1:16')::uuid, md5('zz:unit:b2:teil1')::uuid, 16, 'Autofreie Innenstadt', true),
  (md5('zz:lesson:teil1:17')::uuid, md5('zz:unit:b2:teil1')::uuid, 17, 'Benotung der Hausaufgaben', true),
  (md5('zz:lesson:teil1:18')::uuid, md5('zz:unit:b2:teil1')::uuid, 18, 'Führerschein ab 16', true),
  (md5('zz:lesson:teil1:19')::uuid, md5('zz:unit:b2:teil1')::uuid, 19, 'Umweltfreundliches Verhalten', true),
  (md5('zz:lesson:teil1:20')::uuid, md5('zz:unit:b2:teil1')::uuid, 20, 'Gesunde Ernährung', true),
  (md5('zz:lesson:teil1:21')::uuid, md5('zz:unit:b2:teil1')::uuid, 21, 'Sport', true),
  (md5('zz:lesson:teil1:22')::uuid, md5('zz:unit:b2:teil1')::uuid, 22, 'Wohnen in einer Großstadt', true),
  (md5('zz:lesson:teil1:23')::uuid, md5('zz:unit:b2:teil1')::uuid, 23, 'Verkehrsmittel Auto', true)
on conflict do nothing;

insert into public.exercises (id, lesson_id, prompt, min_words, max_words, task_type, guiding_points, recipient) values
  (md5('zz:exercise:teil1:1')::uuid, md5('zz:lesson:teil1:1')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Auto als umweltfreundliches Verkehrsmittel“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Thema Verkehrsmittel im Alltag.', 'Nennen Sie Gründe, warum das Auto so beliebt ist.', 'Nennen Sie andere Möglichkeiten, wie man sich fortbewegen kann.', 'Nennen Sie Vorteile dieser anderen Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:2')::uuid, md5('zz:lesson:teil1:2')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Schönheitsoperationen“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zu Schönheitsoperationen.', 'Nennen Sie Gründe für die steigende Zahl der Eingriffe.', 'Beschreiben Sie andere Möglichkeiten, um schön auszusehen.', 'Nennen Sie Vorteile dieser anderen Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:3')::uuid, md5('zz:lesson:teil1:3')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Konzertbesuch“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Thema Konzertbesuch.', 'Nennen Sie Gründe, warum Sie für oder gegen Konzertbesuche sind.', 'Nennen Sie andere Möglichkeiten der Freizeitgestaltung.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:4')::uuid, md5('zz:lesson:teil1:4')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Handy als Kommunikationsmittel“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Handy im Alltag.', 'Nennen Sie Vorteile der Telekommunikation.', 'Erläutern Sie Situationen, in denen Telefongespräche stören können.', 'Nennen Sie andere Kommunikationsmöglichkeiten und deren Vorteile.']::text[], null),
  (md5('zz:exercise:teil1:5')::uuid, md5('zz:lesson:teil1:5')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Private Fotos in sozialen Medien“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zu privaten Fotos in sozialen Medien.', 'Begründen Sie, warum Sie dafür oder dagegen sind.', 'Nennen Sie mehrere Möglichkeiten der Weitergabe von Fotos.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:6')::uuid, md5('zz:lesson:teil1:6')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Werbespots im Kinderfernsehen“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zu Werbespots im Fernsehen für Kinder.', 'Begründen Sie, warum Sie für oder gegen Werbung im Kinderfernsehen sind.', 'Erläutern Sie Vor- und Nachteile der Werbespots im Kinderfernsehen.', 'Nennen Sie Möglichkeiten des kritischen Umgangs mit Werbespots.']::text[], null),
  (md5('zz:exercise:teil1:7')::uuid, md5('zz:lesson:teil1:7')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Konsumverhalten“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zu unserem Konsumverhalten.', 'Erläutern Sie, ob Sie für oder gegen häufiges Kaufen sind.', 'Nennen Sie verschiedene Möglichkeiten der Wiederverwertung von Kleidung.', 'Erläutern Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:8')::uuid, md5('zz:lesson:teil1:8')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Erholung in der Großstadt“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Leben in Großstädten.', 'Nennen Sie Gründe, warum Parks in unseren Großstädten so beliebt sind.', 'Nennen Sie andere Möglichkeiten zur Erholung.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:9')::uuid, md5('zz:lesson:teil1:9')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Umweltbewusster Tourismus“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Reisen.', 'Nennen Sie Gründe, warum Reisen sehr beliebt ist.', 'Nennen Sie Möglichkeiten des umweltbewussten Tourismus.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:10')::uuid, md5('zz:lesson:teil1:10')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Umgang mit Lebensmitteln“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum heutigen Umgang mit Lebensmitteln.', 'Nennen Sie Ursachen der Lebensmittelverschwendung.', 'Erläutern Sie Alternativen zur Vermeidung von Lebensmittelverschwendung.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:11')::uuid, md5('zz:lesson:teil1:11')::uuid, 'Sie schreiben einen Forumsbeitrag zum Einsatz von digitalen Medien im Unterricht.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zu digitalen Medien im Unterricht.', 'Nennen Sie Gründe, warum Lehrer immer öfter digitale Medien einbeziehen.', 'Schlagen Sie geeignete Medien für den Deutschunterricht vor.', 'Nennen Sie Vor- oder Nachteile herkömmlicher Unterrichtsmethoden.']::text[], null),
  (md5('zz:exercise:teil1:12')::uuid, md5('zz:lesson:teil1:12')::uuid, 'Sie äußern sich in einem Blog zum Thema „Führerscheinverbot im Alter“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Führerscheinverbot im Alter.', 'Nennen Sie Gründe, warum ältere Menschen nicht mehr fahren sollten.', 'Nennen Sie andere Möglichkeiten, wie sich ältere Menschen fortbewegen könnten.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:13')::uuid, md5('zz:lesson:teil1:13')::uuid, 'Sie äußern sich in einem Blog zum Thema „Videocamera-Überwachung in öffentlichen Bereichen“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zu diesem Thema.', 'Begründen Sie, warum Sie für oder gegen Videoüberwachung in der Öffentlichkeit sind.', 'Nennen Sie andere Möglichkeiten, wie man Sicherheit in der Innenstadt erhöhen kann.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:14')::uuid, md5('zz:lesson:teil1:14')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Fleischreiche Ernährung“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Thema fleischreiche Ernährung.', 'Nennen Sie Gründe, warum fleischreiche Ernährung so verbreitet ist.', 'Nennen Sie Alternativen zu diesem Ernährungsstil.', 'Nennen Sie Vorteile dieser Alternativen.']::text[], null),
  (md5('zz:exercise:teil1:15')::uuid, md5('zz:lesson:teil1:15')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Verschmutzung der Umwelt“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zur Verschmutzung der Umwelt durch Plastikverpackungen.', 'Nennen Sie Gründe, warum Plastikverpackungen so verbreitet sind.', 'Nennen Sie Alternativen zu Plastikverpackungen.', 'Nennen Sie Vorteile dieser Alternativen.']::text[], null),
  (md5('zz:exercise:teil1:16')::uuid, md5('zz:lesson:teil1:16')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Autofreie Innenstadt“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Autoverkehr in Innenstädten.', 'Nennen Sie Gründe, warum der Verkehr in den Innenstädten so hoch ist.', 'Nennen Sie andere Möglichkeiten der Fortbewegung in der Innenstadt.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:17')::uuid, md5('zz:lesson:teil1:17')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Benotung der Hausaufgaben“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zur Benotung von Hausaufgaben.', 'Nennen Sie Gründe, warum diese Benotung so verbreitet ist.', 'Nennen Sie Alternativen zur Benotung von Hausaufgaben.', 'Nennen Sie Vorteile dieser Alternativen.']::text[], null),
  (md5('zz:exercise:teil1:18')::uuid, md5('zz:lesson:teil1:18')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Führerschein ab 16“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung dazu, ob Jugendliche schon mit 16 Jahren Auto fahren sollten.', 'Nennen Sie Gründe, die dafürsprechen.', 'Nennen Sie andere Möglichkeiten der Fortbewegung für Jugendliche.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:19')::uuid, md5('zz:lesson:teil1:19')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Umweltfreundliches Verhalten“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zu umweltfreundlichen Produkten.', 'Nennen Sie Gründe, warum umweltfreundliche Produkte oft nicht genutzt werden.', 'Nennen Sie andere Möglichkeiten für umweltfreundliches Verhalten im Alltag.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:20')::uuid, md5('zz:lesson:teil1:20')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Gesunde Ernährung“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zu vegetarischer Ernährung.', 'Nennen Sie Gründe, warum vegetarische Ernährung immer beliebter wird.', 'Nennen Sie Alternativen zur vegetarischen Ernährung.', 'Nennen Sie Vorteile dieser Alternativen.']::text[], null),
  (md5('zz:exercise:teil1:21')::uuid, md5('zz:lesson:teil1:21')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Sport“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zur Bedeutung von Sport.', 'Nennen Sie Gründe, warum Sport für die Gesundheit wichtig ist.', 'Nennen Sie andere Möglichkeiten, regelmäßig Sport zu treiben.', 'Nennen Sie Vorteile dieser Möglichkeiten.']::text[], null),
  (md5('zz:exercise:teil1:22')::uuid, md5('zz:lesson:teil1:22')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Wohnen in einer Großstadt“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Leben in einer Großstadt.', 'Nennen Sie Vor- und Nachteile des Wohnens in einer Großstadt.', 'Nennen Sie Alternativen zum Wohnen in einer Großstadt.', 'Nennen Sie Vorteile dieser Alternativen.']::text[], null),
  (md5('zz:exercise:teil1:23')::uuid, md5('zz:lesson:teil1:23')::uuid, 'Sie schreiben einen Forumsbeitrag zum Thema „Verkehrsmittel Auto“.', 150, 180, 'forum_post', array['Äußern Sie Ihre Meinung zum Auto als Verkehrsmittel.', 'Nennen Sie Gründe, warum das Auto so beliebt ist.', 'Nennen Sie andere Verkehrsmittel und deren Eigenschaften.', 'Nennen Sie Vorteile dieser anderen Verkehrsmittel.']::text[], null)
on conflict do nothing;

insert into public.useful_phrases (task_type, category, text, position) values
  ('forum_post', 'Einleitung', 'Das Thema … ist heutzutage ein viel diskutiertes Anliegen.', 1),
  ('forum_post', 'Einleitung', 'Ich möchte im Folgenden meine persönliche Meinung dazu äußern.', 2),
  ('forum_post', 'Meinung äußern', 'Ich bin der Ansicht, dass …', 3),
  ('forum_post', 'Meinung äußern', 'Meines Erachtens …', 4),
  ('forum_post', 'Meinung äußern', 'Es liegt auf der Hand, dass …', 5),
  ('forum_post', 'Meinung äußern', 'Ich bin fest davon überzeugt, dass …', 6),
  ('forum_post', 'Gründe nennen', 'Einerseits …, andererseits …', 7),
  ('forum_post', 'Gründe nennen', 'Ein weiterer Grund dafür ist, dass …', 8),
  ('forum_post', 'Gründe nennen', 'Das liegt vor allem daran, dass …', 9),
  ('forum_post', 'Alternativen nennen', 'Eine Alternative dazu wäre …', 10),
  ('forum_post', 'Alternativen nennen', 'Man könnte stattdessen …', 11),
  ('forum_post', 'Alternativen nennen', 'Es gibt verschiedene Möglichkeiten, zum Beispiel …', 12),
  ('forum_post', 'Vorteile nennen', 'Der Hauptvorteil dieses Wegs besteht meines Erachtens darin, dass …', 13),
  ('forum_post', 'Vorteile nennen', 'Das hat den Vorteil, dass …', 14),
  ('forum_post', 'Vorteile nennen', 'Dadurch wird … ermöglicht.', 15),
  ('forum_post', 'Schluss', 'Zusammenfassend kommt man zu dem Ergebnis, dass …', 16),
  ('forum_post', 'Schluss', 'Abschließend lässt sich sagen, dass …', 17)
on conflict do nothing;

insert into public.units (id, level, position, title) values (md5('zz:unit:b2:teil2')::uuid, 'B2', 2, 'Schreiben Teil 2 – E-Mail formal')
  on conflict do nothing;

insert into public.lessons (id, unit_id, position, title, is_published) values
  (md5('zz:lesson:teil2:1')::uuid, md5('zz:unit:b2:teil2')::uuid, 1, 'Museumsführung absagen', true),
  (md5('zz:lesson:teil2:2')::uuid, md5('zz:unit:b2:teil2')::uuid, 2, 'Museumsbesuch absagen (Malkurs)', true),
  (md5('zz:lesson:teil2:3')::uuid, md5('zz:unit:b2:teil2')::uuid, 3, 'Praktikum verlängern', true),
  (md5('zz:lesson:teil2:4')::uuid, md5('zz:unit:b2:teil2')::uuid, 4, 'Praktikum verlängern (Abteilungswechsel)', true),
  (md5('zz:lesson:teil2:5')::uuid, md5('zz:unit:b2:teil2')::uuid, 5, 'Papierloses Büro vorschlagen', true),
  (md5('zz:lesson:teil2:6')::uuid, md5('zz:unit:b2:teil2')::uuid, 6, 'Papierloses Büro (Zustimmung & Termin)', true),
  (md5('zz:lesson:teil2:7')::uuid, md5('zz:unit:b2:teil2')::uuid, 7, 'Arbeitszeugnis verloren', true),
  (md5('zz:lesson:teil2:8')::uuid, md5('zz:unit:b2:teil2')::uuid, 8, 'Bewerbungsgespräch verpasst', true),
  (md5('zz:lesson:teil2:9')::uuid, md5('zz:unit:b2:teil2')::uuid, 9, 'Firmenumzug organisieren', true),
  (md5('zz:lesson:teil2:10')::uuid, md5('zz:unit:b2:teil2')::uuid, 10, 'Schulung am Arbeitsplatz leiten', true),
  (md5('zz:lesson:teil2:11')::uuid, md5('zz:unit:b2:teil2')::uuid, 11, 'Teilweise von zu Hause arbeiten', true),
  (md5('zz:lesson:teil2:12')::uuid, md5('zz:unit:b2:teil2')::uuid, 12, 'Büchereibesuch – Hilfe anbieten', true),
  (md5('zz:lesson:teil2:13')::uuid, md5('zz:unit:b2:teil2')::uuid, 13, 'Schreibwettbewerb absagen', true),
  (md5('zz:lesson:teil2:14')::uuid, md5('zz:unit:b2:teil2')::uuid, 14, 'Arbeitszeit reduzieren', true),
  (md5('zz:lesson:teil2:15')::uuid, md5('zz:unit:b2:teil2')::uuid, 15, 'Interviewtermin mit einer Unternehmerin', true),
  (md5('zz:lesson:teil2:16')::uuid, md5('zz:unit:b2:teil2')::uuid, 16, 'Falsches Buch verschickt', true),
  (md5('zz:lesson:teil2:17')::uuid, md5('zz:unit:b2:teil2')::uuid, 17, 'Falsche Einladung verschickt', true)
on conflict do nothing;

insert into public.exercises (id, lesson_id, prompt, min_words, max_words, task_type, guiding_points, recipient) values
  (md5('zz:exercise:teil2:1')::uuid, md5('zz:lesson:teil2:1')::uuid, 'Sie haben für Ihre Gruppe aus dem Deutschkurs eine Museumsführung organisiert. Aufgrund anderer Verpflichtungen kann die Gruppe doch nicht an der Führung teilnehmen. Schreiben Sie eine E-Mail an Herrn Groth vom Museum.', 100, 120, 'formal_email', array['Erklären Sie den Grund für die Absage.', 'Fragen Sie nach einem neuen Termin von Herrn Groth für eine neue Führung.', 'Machen Sie eigene Vorschläge für neue Termine.', 'Bitten Sie um Verständnis.']::text[], 'Herrn Groth (Museum)'),
  (md5('zz:exercise:teil2:2')::uuid, md5('zz:lesson:teil2:2')::uuid, 'Sie besuchen einen Malkurs. Ihre Kursleiterin, Frau Lehman, hat für Ihre Gruppe einen Museumsbesuch gebucht. Sie können daran nicht teilnehmen. Schreiben Sie eine E-Mail an Frau Lehman.', 100, 120, 'formal_email', array['Nennen Sie den Grund, warum Sie nicht mitgehen können.', 'Entschuldigen Sie sich für die Nichtteilnahme.', 'Bitten Sie um Verständnis für Ihre Situation.', 'Machen Sie einen Vorschlag, bei der Organisation des nächsten Museumsbesuchs zu helfen.']::text[], 'Frau Lehman (Kursleiterin)'),
  (md5('zz:exercise:teil2:3')::uuid, md5('zz:lesson:teil2:3')::uuid, 'Sie haben mit der Gruppe des Deutschkurses ein Praktikum bei einem Unternehmen gemacht und möchten Ihr Praktikum verlängern lassen. Schreiben Sie eine E-Mail an Frau Krolop.', 100, 120, 'formal_email', array['Bitten Sie um die Verlängerung Ihres Praktikums.', 'Bitten Sie um Verständnis.', 'Erklären Sie, warum Sie Ihr Praktikum verlängern lassen möchten.', 'Machen Sie Vorschläge zur Verlängerung.']::text[], 'Frau Krolop (Praktikumsleiterin)'),
  (md5('zz:exercise:teil2:4')::uuid, md5('zz:lesson:teil2:4')::uuid, 'Sie haben mit der Gruppe des Deutschkurses ein Praktikum bei einem Unternehmen gemacht und möchten Ihr Praktikum verlängern lassen. Schreiben Sie eine E-Mail an Frau Krolop.', 100, 120, 'formal_email', array['Erklären Sie, warum Sie Ihr Praktikum verlängern lassen möchten.', 'Bitten Sie um Verständnis.', 'In welcher Abteilung waren Sie vorher und was war Ihre Aufgabe?', 'In welcher Abteilung wollen Sie nun arbeiten und was sind Ihre Aufgaben?']::text[], 'Frau Krolop (Praktikumsleiterin)'),
  (md5('zz:exercise:teil2:5')::uuid, md5('zz:lesson:teil2:5')::uuid, 'Ihr Unternehmen will ein papierloses Projekt umsetzen, und Sie möchten an diesem Projekt mitarbeiten. Schreiben Sie eine E-Mail an Ihren Chef, Herrn Meinert.', 100, 120, 'formal_email', array['Erklären Sie den Grund, warum Sie papierlos arbeiten möchten.', 'Schlagen Sie Vorteile für das Unternehmen vor.', 'Erzählen Sie über Ihre Erfahrungen.', 'Wie können Sie bei der Organisation der Arbeit helfen?']::text[], 'Herrn Meinert (Chef)'),
  (md5('zz:exercise:teil2:6')::uuid, md5('zz:lesson:teil2:6')::uuid, 'Sie verstehen die Wichtigkeit des Umweltschutzes und der Nachhaltigkeit und haben einen Vorschlag, das Büro, in dem Sie tätig sind, papierlos zu gestalten. Schreiben Sie eine E-Mail an Herrn Meinert.', 100, 120, 'formal_email', array['Erklären Sie den Grund, warum Sie papierlos arbeiten möchten.', 'Nennen Sie Vorteile für das Unternehmen.', 'Erzählen Sie über Ihre Erfahrungen.', 'Bitten Sie um Zustimmung Ihres Chefs und vereinbaren Sie einen Termin.']::text[], 'Herrn Meinert (Chef)'),
  (md5('zz:exercise:teil2:7')::uuid, md5('zz:lesson:teil2:7')::uuid, 'Sie haben Ihr Praktikum bei einer deutschen Firma gemacht. Ihr Ausbildungsleiter, Herr Weigert, hat Ihnen ein Arbeitszeugnis ausgehändigt, das Sie leider verloren haben. Schreiben Sie eine E-Mail an Herrn Weigert.', 100, 120, 'formal_email', array['Erklären Sie, warum Sie das Arbeitszeugnis verloren haben.', 'Entschuldigen Sie sich höflich.', 'Bitten Sie um die Erstellung eines neuen Arbeitszeugnisses.', 'Fragen Sie, wann Sie ein neues Zeugnis bekommen können.']::text[], 'Herrn Weigert (Ausbildungsleiter)'),
  (md5('zz:exercise:teil2:8')::uuid, md5('zz:lesson:teil2:8')::uuid, 'Sie wollen Ihr Praktikum bei einer deutschen Firma machen, haben aber das Bewerbungsgespräch verpasst. Schreiben Sie eine E-Mail an Ihre Ausbildungsleiterin, Frau Herbst.', 100, 120, 'formal_email', array['Erklären Sie den Grund der Verspätung bzw. Verpassung.', 'Entschuldigen Sie sich höflich.', 'Erklären Sie, warum Sie das Praktikum in diesem Unternehmen machen möchten.', 'Schlagen Sie die Vereinbarung eines neuen Termins vor.']::text[], 'Frau Herbst (Ausbildungsleiterin)'),
  (md5('zz:exercise:teil2:9')::uuid, md5('zz:lesson:teil2:9')::uuid, 'Das Unternehmen, in dem Sie arbeiten, zieht um und muss den Umzug organisieren. Sie möchten dabei behilflich sein. Informieren Sie darüber Ihren Chef, Herrn Franz.', 100, 120, 'formal_email', array['Erzählen Sie Ihre Erfahrungen mit organisatorischen Aufgaben.', 'Erläutern Sie den Grund, warum Sie helfen möchten.', 'Welche Aufgaben können Sie übernehmen?', 'Vereinbaren Sie einen Termin mit Ihrem Chef.']::text[], 'Herrn Franz (Chef)'),
  (md5('zz:exercise:teil2:10')::uuid, md5('zz:lesson:teil2:10')::uuid, 'Sie möchten eine Schulung zum Thema „Kommunikation am Arbeitsplatz“ in Ihrer Firma leiten. Schreiben Sie darüber an Ihre Abteilungsleiterin, Frau Landgraf.', 100, 120, 'formal_email', array['Warum möchten Sie diese Schulung leiten?', 'Schreiben Sie über Ihre Erfahrung mit diesem Thema.', 'Machen Sie ein Angebot für diese Stelle.', 'Vereinbaren Sie einen Termin mit dem Chef.']::text[], 'Frau Landgraf (Abteilungsleiterin)'),
  (md5('zz:exercise:teil2:11')::uuid, md5('zz:lesson:teil2:11')::uuid, 'Sie haben einen sehr langen Anfahrtsweg zu Ihrer Arbeitsstelle und möchten teilweise von zu Hause arbeiten. Schreiben Sie eine Nachricht an Ihren Vorgesetzten, Herrn Müller.', 100, 120, 'formal_email', array['Welche Vorteile hat das für das Unternehmen?', 'Bitten Sie um Verständnis für Ihre Situation.', 'Sagen Sie, was Sie von zu Hause aus für das Unternehmen tun können.', 'Erklären Sie den Grund, warum Sie teilweise von zu Hause arbeiten möchten.']::text[], 'Herrn Müller (Vorgesetzter)'),
  (md5('zz:exercise:teil2:12')::uuid, md5('zz:lesson:teil2:12')::uuid, 'Die Sprachschule, in der Sie einen Deutschkurs machen, möchte einen Büchereibesuch mit verschiedenen Aktivitäten organisieren. Sie würden gern daran teilnehmen und Ihre Hilfe anbieten. Schreiben Sie an die Bibliotheksleiterin, Frau Mayler.', 100, 120, 'formal_email', array['Nennen Sie den Grund, warum Sie helfen möchten.', 'Machen Sie Vorschläge, wie Sie helfen könnten.', 'Bitten Sie um einen genauen Termin.', 'Erzählen Sie über Ihre Erfahrungen und Aktivitäten rund um Büchereibesuche.']::text[], 'Frau Mayler (Bibliotheksleiterin)'),
  (md5('zz:exercise:teil2:13')::uuid, md5('zz:lesson:teil2:13')::uuid, 'In der Bibliothek „Unsere Bücher“ wird am kommenden Freitag ein Schreibwettbewerb organisiert. Ihre Gruppe nimmt daran auch teil. Sie können aber nicht kommen. Schreiben Sie an Ihren Kursleiter, Herrn Koch.', 100, 120, 'formal_email', array['Entschuldigen Sie sich für die Nichtteilnahme.', 'Nennen Sie den Grund, warum Sie an dem Schreibwettbewerb nicht teilnehmen.', 'Betonen Sie, dass Sie an zukünftigen Wettbewerben aktiv teilnehmen möchten.', 'Bitten Sie um Verständnis für Ihre Situation.']::text[], 'Herrn Koch (Kursleiter)'),
  (md5('zz:exercise:teil2:14')::uuid, md5('zz:lesson:teil2:14')::uuid, 'Sie arbeiten Vollzeit in einem deutschen Unternehmen. In Zukunft möchten Sie aber Ihre Arbeitszeit reduzieren und nur noch Teilzeit arbeiten. Schreiben Sie eine Nachricht an Ihre Chefin, Frau Eisenstein.', 100, 120, 'formal_email', array['Erklären Sie, warum Sie Ihre Arbeitszeit reduzieren lassen möchten.', 'Bitten Sie um die Verringerung der Arbeitszeit.', 'Machen Sie Vorschläge, wie man die Arbeitszeit ermöglichen kann.', 'Zeigen Sie Ihr Verständnis für die Arbeitssituation im Unternehmen.']::text[], 'Frau Eisenstein (Chefin)'),
  (md5('zz:exercise:teil2:15')::uuid, md5('zz:lesson:teil2:15')::uuid, 'Sie haben einen Blog, in dem Sie über „Frauen in Führungsposition“ schreiben. Sie haben eine Frau gefunden, die die Leitung eines Unternehmens innehat, und möchten ein Interview mit ihr vereinbaren.', 100, 120, 'formal_email', array['Informieren Sie die Frau über diesen Blog.', 'Bitten Sie um ein Interview.', 'Warum haben Sie Interesse an diesem Thema?', 'Schlagen Sie einen genauen Termin vor.']::text[], 'eine Frau in Führungsposition'),
  (md5('zz:exercise:teil2:16')::uuid, md5('zz:lesson:teil2:16')::uuid, 'Sie mussten einem Professor heute ein Buch schicken, haben aber versehentlich ein falsches Buch geschickt. Schreiben Sie eine E-Mail an den Professor.', 100, 120, 'formal_email', array['Erklären Sie, was passiert ist.', 'Entschuldigen Sie sich dafür.', 'Erklären Sie, wie Sie den Fehler beheben werden.', 'Bedanken Sie sich im Voraus für das Verständnis.']::text[], 'einen Professor'),
  (md5('zz:exercise:teil2:17')::uuid, md5('zz:lesson:teil2:17')::uuid, 'Sie haben aus Versehen die Einladungs-E-Mails für eine Sitzung mit falschem Datum und falscher Uhrzeit verschickt. Schreiben Sie eine E-Mail, in der Sie den Fehler erklären.', 100, 120, 'formal_email', array['Erklären Sie, was passiert ist.', 'Entschuldigen Sie sich dafür.', 'Erklären Sie, wie Sie das Problem bereits gelöst haben.', 'Sagen Sie, wie Sie das zukünftig vermeiden werden.']::text[], 'eine Kollegin')
on conflict do nothing;

insert into public.useful_phrases (task_type, category, text, position) values
  ('formal_email', 'Einleitung', 'Sehr geehrte/r Frau/Herr …,', 1),
  ('formal_email', 'Einleitung', 'da ich Sie telefonisch nicht erreichen konnte, schreibe ich Ihnen diese E-Mail.', 2),
  ('formal_email', 'Grund erklären', 'Mit großem Bedauern muss ich Ihnen mitteilen, dass …', 3),
  ('formal_email', 'Grund erklären', 'Der Grund für mein Anliegen ist, dass …', 4),
  ('formal_email', 'Grund erklären', 'Ich möchte Ihnen mitteilen, dass …', 5),
  ('formal_email', 'Entschuldigen', 'Ich möchte mich bei Ihnen dafür entschuldigen.', 6),
  ('formal_email', 'Entschuldigen', 'Bitte akzeptieren Sie meine aufrichtige Entschuldigung.', 7),
  ('formal_email', 'Bitten', 'Höflich wende ich mich an Sie mit der Bitte, …', 8),
  ('formal_email', 'Bitten', 'Ich wäre Ihnen sehr dankbar, wenn …', 9),
  ('formal_email', 'Bitten', 'Könnten Sie mir bitte mitteilen, …?', 10),
  ('formal_email', 'Termin vorschlagen', 'Könnten wir uns bitte zu einem Gespräch treffen, um die Details zu besprechen?', 11),
  ('formal_email', 'Termin vorschlagen', 'Wenn es geht, würde ich Ihnen gerne den Termin am … vorschlagen.', 12),
  ('formal_email', 'Termin vorschlagen', 'Ich bin sehr flexibel und kann mich nach Ihrem Zeitplan richten.', 13),
  ('formal_email', 'Schluss', 'Ich hoffe, dass Sie meine Situation nachvollziehen können.', 14),
  ('formal_email', 'Schluss', 'Im Voraus danke ich Ihnen dafür, dass Sie mir so bald wie möglich antworten.', 15),
  ('formal_email', 'Schluss', 'Mit freundlichen Grüßen', 16)
on conflict do nothing;
