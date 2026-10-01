-- telc Deutsch B2 Mündlicher Ausdruck (ADR-0012): Teil 1 is a report on an experience (Über Erfahrungen
-- sprechen), Teil 3 a joint planning task (Gemeinsam etwas planen); Teil 2 is a discussion, as in Goethe.
-- New enum values can only be used once committed, so they get a migration of their own.
alter type public.speaking_task_type add value if not exists 'experience';
alter type public.speaking_task_type add value if not exists 'planning';
