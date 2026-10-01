import type { CardStatus } from '../domain/card-status';
import type { FlashcardCategory } from '../domain/flashcard';

export const CATEGORY_LABELS: Record<FlashcardCategory, { readonly name: string; readonly icon: string }> = {
  work: { name: 'Trabalho e Profissão', icon: 'work' },
  environment: { name: 'Meio Ambiente', icon: 'eco' },
  health: { name: 'Saúde e Estilo de Vida', icon: 'health_and_safety' },
  technology: { name: 'Tecnologia e Mídia', icon: 'devices' },
  education: { name: 'Educação e Família', icon: 'school' },
  housing: { name: 'Moradia e Sociedade', icon: 'home' },
  verbs: { name: 'Verbos e Expressões', icon: 'sync_alt' },
  synonyms: { name: 'Sinônimos e Paráfrases', icon: 'compare_arrows' },
  general: { name: 'Vocabulário Geral', icon: 'abc' },
};

interface StatusLabel {
  readonly one: string;
  readonly many: string;
  readonly icon: string;
  readonly tone: 'neutral' | 'warning' | 'success';
}

/** Status names from the teacher's plan: Não feito, A revisar, Realizado. */
export const STATUS_LABELS: Record<CardStatus, StatusLabel> = {
  new: { one: 'Não feito', many: 'Não feitos', icon: 'radio_button_unchecked', tone: 'neutral' },
  review: { one: 'A revisar', many: 'A revisar', icon: 'replay', tone: 'warning' },
  known: { one: 'Realizado', many: 'Realizados', icon: 'check_circle', tone: 'success' },
};
