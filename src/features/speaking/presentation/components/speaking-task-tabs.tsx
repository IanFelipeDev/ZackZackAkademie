import { Icon } from '@/shared/ui';
import { SPEAKING_TASK_TYPES, type SpeakingTaskType } from '../../domain/task-type';
import { SPEAKING_TASK_LABELS } from '../speaking-labels';

interface SpeakingTaskTabsProps {
  readonly value: SpeakingTaskType;
  readonly onChange: (taskType: SpeakingTaskType) => void;
}

export function SpeakingTaskTabs({ value, onChange }: SpeakingTaskTabsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Parte do exame"
      className="inline-flex rounded-full bg-surface-highest p-1.5 shadow-inner"
    >
      {SPEAKING_TASK_TYPES.map((taskType) => {
        const label = SPEAKING_TASK_LABELS[taskType];
        const isActive = taskType === value;
        return (
          <button
            key={taskType}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(taskType)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-6 ${
              isActive ? 'bg-primary-container text-white shadow-md' : 'text-ink-soft hover:text-primary'
            }`}
          >
            <Icon name={label.icon} className="text-[18px]" />
            <span className="tracking-wide uppercase">{label.part}</span>
            <span className="hidden text-xs font-normal opacity-80 sm:inline">{label.name}</span>
          </button>
        );
      })}
    </div>
  );
}
