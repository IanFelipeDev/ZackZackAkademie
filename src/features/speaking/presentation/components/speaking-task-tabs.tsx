import { Icon } from '@/shared/ui';
import { EXAM_TASK_TYPES, SPEAKING_EXAMS, type SpeakingExam } from '../../domain/exam';
import type { SpeakingTaskType } from '../../domain/task-type';
import { EXAM_LABELS, SPEAKING_TASK_LABELS } from '../speaking-labels';

const GROUP_CLASS = 'inline-flex rounded-full bg-surface-highest p-1.5 shadow-inner';

function optionClass(isActive: boolean): string {
  return `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5 ${
    isActive ? 'bg-primary-container text-white shadow-md' : 'text-ink-soft hover:text-primary'
  }`;
}

interface SpeakingExamTabsProps {
  readonly value: SpeakingExam;
  readonly onChange: (exam: SpeakingExam) => void;
}

export function SpeakingExamTabs({ value, onChange }: SpeakingExamTabsProps) {
  return (
    <div role="radiogroup" aria-label="Prova" className={GROUP_CLASS}>
      {SPEAKING_EXAMS.map((exam) => (
        <button
          key={exam}
          type="button"
          role="radio"
          aria-checked={exam === value}
          onClick={() => onChange(exam)}
          className={optionClass(exam === value)}
        >
          {EXAM_LABELS[exam].name}
        </button>
      ))}
    </div>
  );
}

interface SpeakingTaskTabsProps {
  readonly exam: SpeakingExam;
  readonly value: SpeakingTaskType;
  readonly onChange: (taskType: SpeakingTaskType) => void;
}

export function SpeakingTaskTabs({ exam, value, onChange }: SpeakingTaskTabsProps) {
  return (
    <div role="radiogroup" aria-label="Parte do exame" className={GROUP_CLASS}>
      {EXAM_TASK_TYPES[exam].map((taskType) => {
        const label = SPEAKING_TASK_LABELS[taskType];
        const isActive = taskType === value;
        return (
          <button
            key={taskType}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(taskType)}
            className={optionClass(isActive)}
          >
            <Icon name={label.icon} className="text-[18px]" />
            <span className="tracking-wide uppercase">{label.part}</span>
            <span className="hidden text-xs font-normal opacity-80 sm:inline">{label.shortName}</span>
          </button>
        );
      })}
    </div>
  );
}
