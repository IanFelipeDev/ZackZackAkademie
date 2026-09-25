import type { WritingTaskType } from '../domain/task-type';

interface TaskTypeLabel {
  readonly part: string;
  readonly name: string;
  readonly icon: string;
  /** Short value used in the URL (?teil=1). */
  readonly slug: string;
}

export const TASK_TYPE_LABELS: Record<WritingTaskType, TaskTypeLabel> = {
  forum_post: { part: 'Teil 1', name: 'Forumsbeitrag', icon: 'forum', slug: '1' },
  formal_email: { part: 'Teil 2', name: 'E-Mail formal', icon: 'mail', slug: '2' },
};

export function taskTypeFromSlug(slug: string | null): WritingTaskType {
  return slug === TASK_TYPE_LABELS.formal_email.slug ? 'formal_email' : 'forum_post';
}
