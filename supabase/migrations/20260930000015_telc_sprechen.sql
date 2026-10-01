-- telc next to Goethe in the Sprechen catalogue (ADR-0012). Existing topics are Goethe topics.
create type public.speaking_exam as enum ('goethe', 'telc');

alter table public.speaking_topics
  add column exam public.speaking_exam not null default 'goethe',
  -- telc Teil 2: the short text the discussion starts from.
  add column source_text text,
  -- telc Teil 1: questions the partner can ask after the report (Nachfragen).
  add column follow_up_questions text[] not null default '{}';

-- Each exam has its own parts; Teil 2 (discussion) exists in both.
alter table public.speaking_topics
  add constraint speaking_topics_exam_task_type check (
    (exam = 'goethe' and task_type in ('presentation', 'discussion'))
    or (exam = 'telc' and task_type in ('experience', 'discussion', 'planning'))
  );

-- Positions are counted per exam, so Goethe and telc discussions can both start at 1.
alter table public.speaking_topics drop constraint speaking_topics_level_task_type_position_key;
alter table public.speaking_topics
  add constraint speaking_topics_exam_level_task_type_position_key unique (exam, level, task_type, position);
