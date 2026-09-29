-- Sprechen B2 topics from the teacher: 27 Vortrag topics (Teil 1) and 31 Diskussion topics (Teil 2),
-- replacing the 20 placeholder topics of migration 0011. Titles were spelling-corrected and duplicates merged.
-- Teil 1 topics share the teacher's three Leitpunkte; Teil 2 topics carry their own discussion aspects (the four
-- discussion steps are shown by the app for every Teil 2 topic).

-- A student keeps seeing topics they already practised, even once unpublished, so their history and scores stay
-- intact. New practices, however, are only accepted for published topics.
drop policy "read published topics, staff reads all" on public.speaking_topics;
create policy "read published or practised topics, staff reads all" on public.speaking_topics for select
  to authenticated
  using (
    is_published
    or public.app_current_role() in ('teacher', 'admin')
    or exists (
      select 1 from public.speaking_practices p
      where p.topic_id = speaking_topics.id and p.student_id = auth.uid()
    )
  );

drop policy "student records own practice" on public.speaking_practices;
create policy "student records own practice" on public.speaking_practices for insert to authenticated
  with check (
    student_id = auth.uid()
    and public.app_current_role() = 'student'
    and exists (select 1 from public.speaking_topics t where t.id = speaking_practices.topic_id and t.is_published)
  );

-- The placeholders are unpublished, not deleted, so practices already recorded on them keep their topic. They move
-- out of the position range (unique per level and part) so the new topics can start at 1.
update public.speaking_topics
set is_published = false, position = position + 1000
where id in (
  select md5('zz:speaking:b2:teil' || part || ':' || n)::uuid
  from generate_series(1, 2) as part, generate_series(1, 10) as n
)
and position < 1000;

insert into public.speaking_topics (id, level, task_type, position, title, prompt, guiding_points, is_published) values
  (md5('zz:speaking:b2:v2:teil1:1')::uuid, 'B2', 'presentation', 1, 'Berufserfahrung während des Studiums', 'Halten Sie einen Vortrag zum Thema „Berufserfahrung während des Studiums“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:2')::uuid, 'B2', 'presentation', 2, 'Fit bleiben', 'Halten Sie einen Vortrag zum Thema „Fit bleiben“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:3')::uuid, 'B2', 'presentation', 3, 'Teamarbeit', 'Halten Sie einen Vortrag zum Thema „Teamarbeit“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:4')::uuid, 'B2', 'presentation', 4, 'Umweltbewusst einkaufen', 'Halten Sie einen Vortrag zum Thema „Umweltbewusst einkaufen“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:5')::uuid, 'B2', 'presentation', 5, 'Die Wahl des Studiums', 'Halten Sie einen Vortrag zum Thema „Die Wahl des Studiums“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:6')::uuid, 'B2', 'presentation', 6, 'Neue Freunde finden', 'Halten Sie einen Vortrag zum Thema „Neue Freunde finden“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:7')::uuid, 'B2', 'presentation', 7, 'Umweltbewusst leben', 'Halten Sie einen Vortrag zum Thema „Umweltbewusst leben“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:8')::uuid, 'B2', 'presentation', 8, 'Eine neue Sportart lernen', 'Halten Sie einen Vortrag zum Thema „Eine neue Sportart lernen“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:9')::uuid, 'B2', 'presentation', 9, 'Umweltschutz am Arbeitsplatz', 'Halten Sie einen Vortrag zum Thema „Umweltschutz am Arbeitsplatz“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:10')::uuid, 'B2', 'presentation', 10, 'Umgang mit Stress am Arbeitsplatz', 'Halten Sie einen Vortrag zum Thema „Umgang mit Stress am Arbeitsplatz“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:11')::uuid, 'B2', 'presentation', 11, 'Ein Land kennenlernen', 'Halten Sie einen Vortrag zum Thema „Ein Land kennenlernen“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:12')::uuid, 'B2', 'presentation', 12, 'Gebrauchte Produkte kaufen', 'Halten Sie einen Vortrag zum Thema „Gebrauchte Produkte kaufen“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:13')::uuid, 'B2', 'presentation', 13, 'Vorbereitung auf ein Bewerbungsgespräch', 'Halten Sie einen Vortrag zum Thema „Vorbereitung auf ein Bewerbungsgespräch“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:14')::uuid, 'B2', 'presentation', 14, 'Arbeitsmodelle', 'Halten Sie einen Vortrag zum Thema „Arbeitsmodelle“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:15')::uuid, 'B2', 'presentation', 15, 'In einer Fremdsprache studieren', 'Halten Sie einen Vortrag zum Thema „In einer Fremdsprache studieren“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:16')::uuid, 'B2', 'presentation', 16, 'Eine neue Kultur kennenlernen', 'Halten Sie einen Vortrag zum Thema „Eine neue Kultur kennenlernen“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:17')::uuid, 'B2', 'presentation', 17, 'Sich in einem Verein engagieren', 'Halten Sie einen Vortrag zum Thema „Sich in einem Verein engagieren“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:18')::uuid, 'B2', 'presentation', 18, 'Stress vermeiden', 'Halten Sie einen Vortrag zum Thema „Stress vermeiden“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:19')::uuid, 'B2', 'presentation', 19, 'Sprachkenntnisse verbessern', 'Halten Sie einen Vortrag zum Thema „Sprachkenntnisse verbessern“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:20')::uuid, 'B2', 'presentation', 20, 'Privatsphäre in sozialen Medien', 'Halten Sie einen Vortrag zum Thema „Privatsphäre in sozialen Medien“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:21')::uuid, 'B2', 'presentation', 21, 'Mehr Bewegung im Alltag', 'Halten Sie einen Vortrag zum Thema „Mehr Bewegung im Alltag“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:22')::uuid, 'B2', 'presentation', 22, 'Arbeit im Ausland', 'Halten Sie einen Vortrag zum Thema „Arbeit im Ausland“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:23')::uuid, 'B2', 'presentation', 23, 'Öffentliche Verkehrsmittel', 'Halten Sie einen Vortrag zum Thema „Öffentliche Verkehrsmittel“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:24')::uuid, 'B2', 'presentation', 24, 'Eine Sprache online lernen', 'Halten Sie einen Vortrag zum Thema „Eine Sprache online lernen“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:25')::uuid, 'B2', 'presentation', 25, 'Eine neue Stadt kennenlernen', 'Halten Sie einen Vortrag zum Thema „Eine neue Stadt kennenlernen“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:26')::uuid, 'B2', 'presentation', 26, 'Von zu Hause aus studieren', 'Halten Sie einen Vortrag zum Thema „Von zu Hause aus studieren“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil1:27')::uuid, 'B2', 'presentation', 27, 'Energie sparen', 'Halten Sie einen Vortrag zum Thema „Energie sparen“.', array['Nennen Sie Möglichkeiten oder Alternativen und stellen Sie diese dar.', 'Beschreiben Sie eine Möglichkeit genauer.', 'Nennen Sie Vor- und Nachteile und bewerten Sie diese.']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:1')::uuid, 'B2', 'discussion', 1, 'Wohngemeinschaft', 'Sollten Jugendliche in einer Wohngemeinschaft wohnen oder allein leben?', array['Kosten teilen', 'Allein leben', 'Konflikte im Zusammenleben', 'Zusammenleben mit Gleichaltrigen']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:2')::uuid, 'B2', 'discussion', 2, 'Mieten oder kaufen', 'Sollte man eine Wohnung mieten oder ein Eigenheim kaufen?', array['Kosten: billiger oder teurer?', 'Ist ein Haus eine gute Investition?', 'Vor- und Nachteile des Wohnens zur Miete', 'Sorgenfrei wohnen', 'Gestaltung der eigenen Wohnung']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:3')::uuid, 'B2', 'discussion', 3, 'Ferienhaus', 'Ist ein eigenes oder gemietetes Wochenend- oder Ferienhaus eine gute Idee?', array['Die finanzielle Situation und ihre Rolle bei der Entscheidung']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:4')::uuid, 'B2', 'discussion', 4, 'Kürzere Arbeitswoche', 'Sollte die Arbeitswoche kürzer werden?', array['Mehr Freizeit', 'Kinderbetreuung: einfacher oder schwieriger?', 'Nimmt die Arbeitsmotivation ab oder zu?', 'Macht viel Freizeit zufrieden oder unzufrieden?']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:5')::uuid, 'B2', 'discussion', 5, 'Kostenpflichtige Nachrichten', 'Sollten Nachrichten im Internet kostenpflichtig sein?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:6')::uuid, 'B2', 'discussion', 6, 'Markenkleidung', 'Ist Markenkleidung wichtig?', array['Aussehen', 'Preis', 'Qualität']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:7')::uuid, 'B2', 'discussion', 7, 'Bargeldlos bezahlen', 'Sollten Kunden bargeldlos bezahlen?', array['Ist es einfacher oder nicht?', 'Nimmt die Sicherheit ab oder zu?', 'Gibt man mehr oder weniger Geld aus?', 'Vor- und Nachteile für Geschäfte']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:8')::uuid, 'B2', 'discussion', 8, 'Arbeitserfahrung im Ausland', 'Sollte man Arbeitserfahrung im Ausland sammeln?', array['Nimmt die Motivation ab oder zu?', 'Kosten', 'Vorteile für die Fremdsprache', 'Familie und Freunde zu Hause']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:9')::uuid, 'B2', 'discussion', 9, 'Urlaub im Ausland oder im eigenen Land', 'Sollte man im Ausland oder im eigenen Land Urlaub machen?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:10')::uuid, 'B2', 'discussion', 10, 'Soziale Netzwerke', 'Sollte man in sozialen Netzwerken aktiv sein?', array['Reichen virtuelle Beziehungen aus?', 'Datenschutz', 'Viele Freunde haben']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:11')::uuid, 'B2', 'discussion', 11, 'Homeoffice', 'Sollten Angestellte von zu Hause arbeiten (Heimarbeit oder Telearbeit)?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:12')::uuid, 'B2', 'discussion', 12, 'E-Books', 'Sollte man E-Books statt gedruckter Bücher lesen?', array['Größere Auswahl', 'Liest man mehr oder weniger?', 'Kosten']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:13')::uuid, 'B2', 'discussion', 13, 'Online einkaufen', 'Sollte man online einkaufen?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:14')::uuid, 'B2', 'discussion', 14, 'Filme in Originalsprache', 'Sollte man Filme in der Originalsprache sehen?', array['Warum sollte man Filme besser im Original sehen?', 'Sind Untertitel sinnvoll oder nicht?']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:15')::uuid, 'B2', 'discussion', 15, 'Onlinemeetings', 'Ist es sinnvoll, Präsenztreffen durch Onlinemeetings zu ersetzen?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:16')::uuid, 'B2', 'discussion', 16, 'Stadt oder Land', 'Sollte man in der Stadt oder auf dem Land wohnen?', array['Kosten: teurer oder billiger?', 'Lebensqualität', 'Entfernungen']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:17')::uuid, 'B2', 'discussion', 17, 'Fernstudium', 'Sollten Studierende online studieren (Fernstudium)?', array['Auswahl der Studiengänge', 'Lernt man effektiver oder weniger effektiv?', 'Konzentration beim Lernen']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:18')::uuid, 'B2', 'discussion', 18, 'Kostenloses Studium', 'Sollten Universitäten kostenlos oder kostenpflichtig sein?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:19')::uuid, 'B2', 'discussion', 19, 'Duales Studium', 'Ist ein duales Studium sinnvoll?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:20')::uuid, 'B2', 'discussion', 20, 'Praktikum während des Studiums', 'Sollte man während des Studiums ein Praktikum machen?', array['Ist die Studienbelastung höher oder niedriger?', 'Ist die Finanzierung des Studiums einfacher oder schwieriger?', 'Arbeitspraxis', 'Chancen auf dem Arbeitsmarkt nach dem Studium']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:21')::uuid, 'B2', 'discussion', 21, 'Noten abschaffen', 'Ist es sinnvoll, Noten in der Schule abzuschaffen?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:22')::uuid, 'B2', 'discussion', 22, 'Ladenöffnungszeiten', 'Sollten Geschäfte an jedem Tag der Woche geöffnet sein?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:23')::uuid, 'B2', 'discussion', 23, 'Großraumbüro', 'Ist ein Großraumbüro für Angestellte sinnvoll?', array['Fließen Informationen schneller oder langsamer?', 'Sinkt oder steigt die Produktivität?', 'Mehr oder weniger Ablenkung?', 'Bessere oder schlechtere Teamarbeit?']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:24')::uuid, 'B2', 'discussion', 24, 'Flexible Arbeitszeiten', 'Sollte die Arbeitszeit flexibel sein?', array['Flexibilität bei der Arbeitszeit', 'Zeit für die Familie', 'Arbeitsleistung']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:25')::uuid, 'B2', 'discussion', 25, 'Mit Kindern ins Ausland reisen', 'Sollte man mit Kindern ins Ausland reisen?', array['Kosten', 'Krankheiten']::text[], true),
  (md5('zz:speaking:b2:v2:teil2:26')::uuid, 'B2', 'discussion', 26, 'Haustiere für Kinder', 'Sollten Kinder ein Haustier haben?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:27')::uuid, 'B2', 'discussion', 27, 'Flugreisen besteuern', 'Sollte man Flugreisen stärker besteuern?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:28')::uuid, 'B2', 'discussion', 28, 'Selbstständige Arbeit', 'Sollte man sich selbstständig machen?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:29')::uuid, 'B2', 'discussion', 29, 'Erneuerbare Energien', 'Sollte man stärker auf erneuerbare Energien setzen?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:30')::uuid, 'B2', 'discussion', 30, 'Auto kaufen oder mieten', 'Sollte man ein Auto kaufen statt es zu mieten?', '{}'::text[], true),
  (md5('zz:speaking:b2:v2:teil2:31')::uuid, 'B2', 'discussion', 31, 'Umzug', 'Sollte man für eine neue Arbeitsstelle in eine andere Stadt umziehen?', '{}'::text[], true)
on conflict do nothing;
