import { useId, useState } from 'react';
import { Icon } from '@/shared/ui';
import type { PhraseGroup } from '../../domain/useful-phrase';

interface RedemittelPanelProps {
  readonly groups: readonly PhraseGroup[];
  readonly onInsert: (phrase: string) => void;
}

export function RedemittelPanel({ groups, onInsert }: RedemittelPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between rounded-xl bg-surface-high/60 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-high"
      >
        <span className="flex items-center gap-2">
          <Icon name="auto_fix" className="text-[18px]" />
          Redemittel {isOpen ? 'ausblenden' : 'anzeigen'}
          <span className="font-normal text-ink-soft">(frases úteis para clicar e inserir)</span>
        </span>
        <Icon name={isOpen ? 'expand_less' : 'expand_more'} className="text-[20px]" />
      </button>

      {isOpen ? (
        <div id={panelId} className="flex flex-col gap-4 rounded-xl bg-surface-low p-4">
          {groups.map((group) => (
            <div key={group.category} className="flex flex-col gap-1.5">
              <h3 className="rubric font-sans text-secondary">{group.category}</h3>
              <div className="flex flex-wrap gap-1.5">
                {group.phrases.map((phrase) => (
                  <button
                    key={phrase.id}
                    type="button"
                    onClick={() => onInsert(phrase.text)}
                    title="Inserir no texto"
                    className="rounded-full bg-surface-lowest px-3 py-1.5 text-left text-xs text-primary shadow-sm transition-colors hover:bg-primary-container hover:text-white"
                  >
                    „{phrase.text}“
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
