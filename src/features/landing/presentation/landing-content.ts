// Texts and links of the public landing page. Kept apart from the layout so wording can change without
// touching components. Only features that exist in the platform are listed as available (ADR-0011).

const WHATSAPP_NUMBER = '5511910702513';

export const CONTACT = {
  whatsappLabel: '(11) 91070-2513',
  whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
  scheduleUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Olá, Melissa! Gostaria de agendar minha reunião de aconselhamento gratuita.',
  )}`,
  instagrams: [
    { handle: '@euamelissx', owner: 'Melissa', url: 'https://instagram.com/euamelissx' },
    { handle: '@zackzack.deutsch', owner: 'Escola', url: 'https://instagram.com/zackzack.deutsch' },
  ],
} as const;

export const SECTIONS = [
  { id: 'para-quem', label: 'Para quem é' },
  { id: 'sobre', label: 'Sobre a Melissa' },
  { id: 'o-que-trabalhamos', label: 'O que trabalhamos' },
  { id: 'plataforma', label: 'Plataforma' },
  { id: 'contato', label: 'Contato' },
] as const;

export interface Card {
  readonly icon: string;
  readonly title: string;
  readonly text: string;
  readonly eyebrow?: string;
  readonly footnote?: string;
}

export const AUDIENCE: readonly Card[] = [
  {
    icon: 'explore',
    eyebrow: 'Nível iniciante',
    title: 'Está começando do absoluto zero (A0)',
    text: 'Quer dar os primeiros passos no idioma sem se assustar com a gramática.',
    footnote: 'Passo a passo calmo',
  },
  {
    icon: 'lock_open',
    eyebrow: 'Em andamento',
    title: 'Já estuda nos níveis A1, A2, B1 ou B2',
    text: 'Mas sente que está travado, acumulando dúvidas ou com dificuldades na fala (Sprechen).',
    footnote: 'Destrave de fluência',
  },
  {
    icon: 'assignment_turned_in',
    eyebrow: 'Exames oficiais',
    title: 'Precisa passar na prova de proficiência',
    text: 'Quer se preparar especificamente para os exames oficiais e precisa de simulados, diagnósticos e correções detalhadas.',
    footnote: 'Foco no Goethe e telc',
  },
  {
    icon: 'support_agent',
    eyebrow: 'Rotina e apoio',
    title: 'Procura auxílio pontual e acompanhamento',
    text: 'Precisa de alguém para organizar sua rotina, tirar dúvidas do dia a dia e acompanhar seu progresso de perto.',
    footnote: 'Acompanhamento real',
  },
];

export const PILLARS: readonly Card[] = [
  {
    icon: 'spa',
    title: 'Alemão do zero de forma leve',
    text: 'Acompanhamento passo a passo para quem está começando do absoluto zero (A0). Construímos uma base sólida no seu próprio ritmo, sem pressão, desmistificando a gramática e treinando a pronúncia de maneira simples e prática desde a primeira aula.',
  },
  {
    icon: 'forum',
    title: 'Treinos de Sprechen para a vida e para provas',
    text: 'Prática focada na conversa para perder a vergonha de falar, dominar estruturas usadas em situações reais do dia a dia e se preparar com segurança para testes orais.',
  },
  {
    icon: 'menu_book',
    title: 'Gramática prática e direcionada',
    text: 'Aulas de reforço estruturadas a partir dos materiais didáticos oficiais Schritte e Sicher, focando direto no que você precisa saber, sem complicações ou termos desnecessários.',
  },
  {
    icon: 'fact_check',
    title: 'Preparação específica para exames',
    text: 'Plano focado na sua prova de proficiência, cobrindo simulados, estratégias de resolução, treino de escrita e análise detalhada dos seus erros para buscar a sua aprovação.',
  },
  {
    icon: 'tune',
    title: 'Diagnóstico e aulas personalizadas',
    text: 'Mapeamento exato das suas maiores dificuldades para criar encontros totalmente focados nas suas necessidades e objetivos.',
  },
];

/** What students already have in the platform. */
export const PLATFORM_AVAILABLE: readonly Card[] = [
  {
    icon: 'edit_note',
    eyebrow: 'Schreiben',
    title: 'Treino de escrita com correção',
    text: 'Temas reais do Goethe-Zertifikat B2 (Teil 1 e Teil 2), cronômetro, Leitpunkte e Redemittel. Cada texto enviado volta com nota e comentário da Melissa.',
  },
  {
    icon: 'record_voice_over',
    eyebrow: 'Sprechen',
    title: 'Treino de fala com cronômetro',
    text: 'Temas de Vortrag e Diskussion com um cronômetro que marca introdução, desenvolvimento e conclusão. A Melissa lança a nota de cada prática.',
  },
  {
    icon: 'style',
    eyebrow: 'Wortschatz',
    title: 'Flashcards de vocabulário',
    text: 'Mais de 800 cartões por tema, de trabalho a meio ambiente, com tradução e sinônimos. Marque o que já sabe e o que quer revisar.',
  },
  {
    icon: 'insights',
    eyebrow: 'Progresso',
    title: 'Painel de desempenho',
    text: 'Seu progresso nas habilidades em um só lugar: textos corrigidos, temas praticados, notas médias e as últimas correções.',
  },
  {
    icon: 'history_edu',
    eyebrow: 'Histórico',
    title: 'Todos os seus textos e notas',
    text: 'Rascunhos salvos automaticamente e o histórico completo das tentativas, com as correções para revisar quando quiser.',
  },
];

/** Planned features, shown as "Em breve" so nobody signs up expecting them today. */
export const PLATFORM_COMING: readonly Pick<Card, 'icon' | 'title'>[] = [
  { icon: 'auto_stories', title: 'Lesen (leitura)' },
  { icon: 'headphones', title: 'Hören (audição)' },
  { icon: 'calendar_month', title: 'Planner e rotina de estudos' },
  { icon: 'slideshow', title: 'Slides e materiais das aulas' },
  { icon: 'hub', title: 'Curadoria de sites e ferramentas' },
];

export const BENEFITS: readonly Card[] = [
  {
    icon: 'schedule',
    title: 'Horários flexíveis',
    text: 'Aulas que se encaixam no seu dia a dia, sem comprometer seu trabalho ou rotina pessoal.',
  },
  {
    icon: 'payments',
    title: 'Valores acessíveis',
    text: 'Um acompanhamento completo por um investimento justo para o seu bolso.',
  },
  {
    icon: 'volunteer_activism',
    title: 'Ambiente empático e seguro',
    text: 'Espaço para errar, perguntar e evoluir sem julgamentos.',
  },
];
