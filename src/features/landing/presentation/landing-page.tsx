import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router';
import { homePathFor, LOGIN_PATH, useAuth } from '@/features/auth';
import { Icon } from '@/shared/ui';
import {
  AUDIENCE,
  BENEFITS,
  CONTACT,
  PILLARS,
  PLATFORM_AVAILABLE,
  PLATFORM_COMING,
  SECTIONS,
  type Card,
} from './landing-content';
import { Reveal } from './reveal';

/** Anchor links scroll smoothly unless the visitor prefers reduced motion. */
function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
}

const rise = (index: number) => ({ '--rise-index': index }) as CSSProperties;

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <LandingHeader />
      <main>
        <Hero />
        <Audience />
        <About />
        <Pillars />
        <Platform />
        <Benefits />
        <FinalCall />
        <Contact />
      </main>
      <LandingFooter />
    </div>
  );
}

function LandingHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b border-hairline/60 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-20 sm:px-6">
        <a
          href="#inicio"
          onClick={(e) => scrollToSection(e, 'inicio')}
          className="flex shrink-0 items-center gap-2.5"
        >
          <img
            src="/brand/logo-192.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 rounded-full sm:h-10 sm:w-10"
          />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-semibold text-primary sm:text-xl">zack zack</span>
            <span className="rubric hidden !text-[9px] text-ink-soft sm:inline">
              akademie für Deutsch lernen
            </span>
          </span>
        </a>
        <nav aria-label="Seções da página" className="mx-auto hidden items-center gap-1 xl:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => scrollToSection(e, section.id)}
              className="rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-ink-soft transition-colors hover:bg-surface-low hover:text-primary"
            >
              {section.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <Link
            to={user ? homePathFor(user.role) : LOGIN_PATH}
            className="press inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap text-primary hover:bg-surface-low"
          >
            <Icon name={user ? 'dashboard' : 'login'} className="text-[18px]" />
            {user ? 'Minha área' : 'Entrar'}
          </Link>
          <a
            href={CONTACT.scheduleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="press hidden items-center rounded-full bg-primary-container px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-lift hover:bg-primary sm:inline-flex"
          >
            Agendar reunião gratuita
          </a>
        </div>
      </div>
    </header>
  );
}

function Eyebrow({
  icon,
  children,
  tone = 'high',
}: {
  icon: string;
  children: ReactNode;
  tone?: 'high' | 'low';
}) {
  return (
    <p
      className={`rubric inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-ink-soft ${
        tone === 'high' ? 'bg-surface-high' : 'bg-surface-lowest'
      }`}
    >
      <Icon name={icon} className="text-[16px] text-primary" />
      {children}
    </p>
  );
}

function ScheduleButton({ children, inverted = false }: { children: ReactNode; inverted?: boolean }) {
  return (
    <a
      href={CONTACT.scheduleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`press inline-flex items-center justify-center gap-3 rounded-full px-7 py-4 text-center text-sm font-semibold ${
        inverted
          ? 'bg-surface-lowest text-primary hover:bg-surface'
          : 'bg-primary-container text-white shadow-lift hover:bg-primary'
      }`}
    >
      {children}
      <Icon name="east" className="nudge text-[20px]" />
    </a>
  );
}

function Hero() {
  return (
    <section
      id="inicio"
      className="mx-auto grid max-w-6xl scroll-mt-24 grid-cols-1 items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:pt-16 lg:pb-28"
    >
      <div className="flex flex-col items-start gap-6 lg:col-span-7">
        <p
          style={rise(0)}
          className="landing-rise rubric inline-flex items-center gap-2 rounded-full bg-surface-lowest px-4 py-2 text-tertiary shadow-paper"
        >
          <span className="flex gap-0.5" aria-hidden>
            <span className="h-3.5 w-2 rounded-sm bg-ink" />
            <span className="h-3.5 w-2 rounded-sm bg-primary-container" />
            <span className="h-3.5 w-2 rounded-sm bg-tertiary" />
          </span>
          Alemão do zero e exames (Goethe, telc)
        </p>
        <h1
          style={rise(1)}
          className="landing-rise text-4xl leading-tight tracking-tight text-primary sm:text-5xl"
        >
          Aulas de alemão e monitoria personalizada com quem conquistou o B2 em 8 meses.
        </h1>
        <p style={rise(2)} className="landing-rise font-serif text-xl leading-relaxed text-ink-soft">
          Reforço, monitoria e preparação personalizada para você destravar a fala, dominar a gramática e
          passar na sua prova de proficiência com segurança.
        </p>
        <p style={rise(3)} className="landing-rise leading-relaxed text-ink">
          Seja você iniciante do zero ou alguém que já estuda e precisa superar os exames A1, A2, B1 ou B2,
          aqui você aprende no seu ritmo, com metodologia prática e acompanhamento individual.
        </p>
        <div
          style={rise(4)}
          className="landing-rise flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row sm:items-center"
        >
          <ScheduleButton>Agendar reunião de aconselhamento gratuita</ScheduleButton>
          <a
            href="#para-quem"
            onClick={(e) => scrollToSection(e, 'para-quem')}
            className="press rounded-full bg-surface-high px-6 py-4 text-center text-sm font-semibold text-primary hover:bg-surface-highest"
          >
            Conhecer o método
          </a>
        </div>
        <ul
          style={rise(5)}
          className="landing-rise flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-ink-soft"
        >
          <li className="flex items-center gap-2">
            <Icon name="school" className="text-[20px] text-tertiary" />
            Acompanhamento direto e exclusivo
          </li>
          <li className="flex items-center gap-2">
            <Icon name="event_available" className="text-[20px] text-tertiary" />
            Vagas selecionadas por semestre
          </li>
        </ul>
      </div>

      <div className="landing-rise-visual relative mx-auto w-full max-w-md lg:col-span-5">
        <div className="flex flex-col gap-5 rounded-2xl bg-surface-lowest p-5 shadow-lift sm:p-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/brand/logo-192.png"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-lg text-primary">zack zack</span>
                <span className="rubric text-ink-soft">Mentoria de alemão</span>
              </div>
            </div>
            <span className="rubric rounded-full bg-surface-high px-3 py-1 text-tertiary">GeR A1 · B2</span>
          </div>
          <img
            src="/landing/aulas-online.jpg"
            alt="Aprenda alemão com mais facilidade: aulas online personalizadas e dinâmicas"
            width={512}
            height={384}
            className="w-full rounded-xl object-cover"
          />
          <div className="grid grid-cols-2 gap-3">
            <Highlight icon="military_tech" label="Conquista real" value="Nível B2 em 8 meses" />
            <Highlight icon="record_voice_over" label="Sprechen ativo" value="Conversação sem medo" />
          </div>
        </div>
        <span className="absolute -top-4 -left-4 hidden items-center gap-2 rounded-full bg-surface-lowest px-4 py-2 text-xs font-semibold text-ink shadow-lift sm:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-tertiary" aria-hidden />
          Método direto e prático
        </span>
      </div>
    </section>
  );
}

function Highlight({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-low p-3">
      <Icon name={icon} className="text-[22px] text-primary" />
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] text-ink-soft">{label}</span>
        <span className="text-xs font-semibold text-primary">{value}</span>
      </div>
    </div>
  );
}

function SectionHeading({
  id,
  eyebrow,
  icon,
  title,
  text,
  centered = false,
}: {
  id: string;
  eyebrow: string;
  icon: string;
  title: string;
  text?: string;
  centered?: boolean;
}) {
  return (
    <Reveal className={`flex max-w-3xl flex-col gap-3 ${centered ? 'mx-auto items-center text-center' : ''}`}>
      <Eyebrow icon={icon} tone={centered ? 'low' : 'high'}>
        {eyebrow}
      </Eyebrow>
      <h2 id={id} className="text-3xl leading-tight tracking-tight text-primary sm:text-[44px]">
        {title}
      </h2>
      {text ? <p className="leading-relaxed text-ink-soft">{text}</p> : null}
    </Reveal>
  );
}

function Audience() {
  return (
    <section
      id="para-quem"
      aria-labelledby="para-quem-titulo"
      className="scroll-mt-20 bg-surface-low py-20 lg:py-28"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading
          id="para-quem-titulo"
          eyebrow="Diagnóstico de perfil"
          icon="person_search"
          title="Esta monitoria é para você se:"
          text="A mentoria se molda ao seu estágio exato de aprendizado, eliminando lacunas de estudo e acelerando o domínio prático do alemão."
        />
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map((card, index) => (
            <Reveal as="li" key={card.title} index={index}>
              <article className="lift flex h-full flex-col gap-4 rounded-2xl border border-hairline bg-surface-lowest p-6 shadow-paper hover:border-primary-container/40">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-surface-container text-primary">
                  <Icon name={card.icon} className="text-[26px]" />
                </span>
                <p className="rubric text-tertiary">{card.eyebrow}</p>
                <h3 className="text-xl leading-snug text-primary">{card.title}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{card.text}</p>
                <p className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-semibold text-primary">
                  <Icon name="check_circle" className="text-[18px]" />
                  {card.footnote}
                </p>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function About() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="mx-auto grid max-w-6xl scroll-mt-20 grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:py-28"
    >
      <div className="lg:col-span-5">
        <figure className="rounded-2xl bg-surface-lowest p-3 shadow-lift">
          <Reveal variant="image" className="relative overflow-hidden rounded-xl">
            <img
              src="/landing/melissa.jpg"
              alt="Melissa, professora e criadora do método zack zack"
              width={512}
              height={489}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover object-top"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"
              aria-hidden
            />
            <figcaption className="absolute right-5 bottom-5 left-5 text-white">
              <p className="font-serif text-2xl">Profª Melissa</p>
              <p className="rubric text-white/85">Mentora e criadora do método zack zack</p>
            </figcaption>
          </Reveal>
          <p className="flex items-center justify-between px-2 pt-3 pb-1 text-xs text-ink-soft">
            <span>Formação e vivência prática</span>
            <span className="rubric text-tertiary">Método zack zack</span>
          </p>
        </figure>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-7">
        <SectionHeading
          id="sobre-titulo"
          eyebrow="Sobre a Melissa"
          icon="history_edu"
          title="Aprendizado leve com quem viveu o mesmo processo na prática."
        />
        <Reveal index={1} className="flex flex-col gap-4 text-lg leading-relaxed text-ink">
          <p>
            Eu sei exatamente qual é a sensação de olhar para uma página em alemão e achar que nunca vai
            entender. Passei por toda a pressão, pelas dúvidas e pela rotina intensa até passar na prova do
            nível B2 em apenas 8 meses.
          </p>
          <p>
            Por ter percorrido esse caminho recentemente, desenvolvi uma metodologia real, simples e sem
            termos desnecessários. O meu objetivo aqui não é complicar o idioma, mas sim te dar a autonomia e
            a confiança que você precisa para alcançar seus objetivos no alemão.
          </p>
        </Reveal>
        <dl className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
          {[
            ['8 meses', 'Do zero ao nível B2'],
            ['100%', 'Atenção individual'],
            ['4', 'Habilidades treinadas'],
          ].map(([value, label], index) => (
            <Reveal
              key={label}
              index={index + 2}
              className="flex flex-col-reverse gap-1 rounded-xl bg-surface-low p-5"
            >
              <dt className="text-sm text-ink-soft">{label}</dt>
              <dd className="font-serif text-4xl font-semibold text-primary">{value}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

function CardGrid({ cards, columns }: { cards: readonly Card[]; columns: string }) {
  return (
    <ul className={`grid grid-cols-1 gap-5 ${columns}`}>
      {cards.map((card, index) => (
        <Reveal as="li" key={card.title} index={index}>
          <article className="flex h-full flex-col gap-4 rounded-2xl bg-surface-lowest p-7 shadow-paper">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-surface-container text-primary">
              <Icon name={card.icon} className="text-[26px]" />
            </span>
            <h3 className="text-xl text-primary">{card.title}</h3>
            <p className="text-sm leading-relaxed text-ink-soft">{card.text}</p>
          </article>
        </Reveal>
      ))}
    </ul>
  );
}

function Pillars() {
  return (
    <section
      id="o-que-trabalhamos"
      aria-labelledby="o-que-trabalhamos-titulo"
      className="scroll-mt-20 bg-surface-container py-20 lg:py-28"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading
          id="o-que-trabalhamos-titulo"
          centered
          eyebrow="Metodologia e frentes"
          icon="auto_stories"
          title="Tudo o que você precisa para evoluir no idioma."
          text="Construção passo a passo com foco em resultados mensuráveis e segurança comunicativa."
        />
        <CardGrid cards={PILLARS.slice(0, 3)} columns="md:grid-cols-3" />
        <CardGrid cards={PILLARS.slice(3)} columns="md:grid-cols-2" />
      </div>
    </section>
  );
}

function Platform() {
  return (
    <section
      id="plataforma"
      aria-labelledby="plataforma-titulo"
      className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-12 px-4 py-20 sm:px-6 lg:py-28"
    >
      <SectionHeading
        id="plataforma-titulo"
        eyebrow="Ambiente virtual exclusivo"
        icon="devices"
        title="Sua plataforma de estudos: treino, correções e progresso em um só lugar."
        text="Cada aluno recebe acesso a um painel individual com a mesma estética leve e organizada do curso, para treinar entre as aulas e acompanhar a própria evolução."
      />
      <Reveal className="flex flex-col gap-8 rounded-3xl bg-surface-lowest p-5 shadow-lift sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-5">
          <div className="flex items-center gap-2" aria-hidden>
            <span className="h-3 w-3 rounded-full bg-primary/40" />
            <span className="h-3 w-3 rounded-full bg-tertiary/40" />
            <span className="h-3 w-3 rounded-full bg-surface-highest" />
            <span className="ml-3 text-sm text-ink-soft">zack zack · painel do aluno</span>
          </div>
          <span className="rubric rounded-full bg-surface-container px-3 py-1 text-primary">
            Disponível agora: Schreiben &amp; Sprechen B2
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {PLATFORM_AVAILABLE.map((card) => (
            <li key={card.title} className="flex flex-col gap-3 rounded-2xl bg-surface-low p-6">
              <div className="flex items-center justify-between">
                <Icon name={card.icon} className="text-[28px] text-primary" />
                <span className="rubric text-tertiary">{card.eyebrow}</span>
              </div>
              <h3 className="text-xl text-primary">{card.title}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{card.text}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-hairline p-5">
          <p className="rubric flex items-center gap-2 text-ink-soft">
            <Icon name="schedule" className="text-[16px] text-tertiary" />
            Em breve na plataforma
          </p>
          <ul className="flex flex-wrap gap-2">
            {PLATFORM_COMING.map((item) => (
              <li
                key={item.title}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-low px-3 py-1.5 text-sm text-ink-soft"
              >
                <Icon name={item.icon} className="text-[18px] text-outline" />
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

function Benefits() {
  return (
    <section aria-labelledby="vantagens-titulo" className="bg-surface-low py-20 lg:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading
          id="vantagens-titulo"
          centered
          eyebrow="Vantagens reais"
          icon="verified"
          title="Flexibilidade e suporte constante para a sua rotina."
        />
        <CardGrid cards={BENEFITS} columns="md:grid-cols-3" />
      </div>
    </section>
  );
}

function FinalCall() {
  return (
    <section
      id="agendar"
      aria-labelledby="agendar-titulo"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28"
    >
      <Reveal className="relative overflow-hidden rounded-3xl bg-primary p-8 text-white shadow-lift sm:p-12 lg:p-16">
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-secondary/40 blur-3xl"
          aria-hidden
        />
        <div className="relative flex max-w-3xl flex-col gap-6">
          <p className="rubric inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1.5">
            <Icon name="event_available" className="text-[16px]" />
            Encontro individual gratuito
          </p>
          <h2 id="agendar-titulo" className="text-3xl leading-tight tracking-tight sm:text-[44px]">
            Vamos montar juntos o plano ideal para a sua aprovação?
          </h2>
          <p className="text-lg leading-relaxed text-white/85">
            Agende uma reunião individual de aconselhamento. Vamos conversar sobre o seu momento atual,
            avaliar o seu nível, entender suas principais dificuldades e montar uma proposta de plano
            personalizada para o seu perfil.
          </p>
          <div className="pt-2">
            <ScheduleButton inverted>Quero agendar minha reunião</ScheduleButton>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
            <li>Sem compromisso</li>
            <li>Duração: 25 a 30 minutos</li>
            <li>Online via Google Meet</li>
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

function Contact() {
  return (
    <section
      id="contato"
      aria-labelledby="contato-titulo"
      className="scroll-mt-20 bg-surface-container py-16"
    >
      <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 text-center sm:px-6">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/brand/logo-192.png"
            alt=""
            width={80}
            height={80}
            loading="lazy"
            className="h-20 w-20 rounded-full shadow-paper"
          />
          <h2 id="contato-titulo" className="text-2xl text-primary">
            zack zack · akademie für Deutsch lernen
          </h2>
          <p className="max-w-md text-ink-soft">Ficou com alguma dúvida? Fale direto com a gente:</p>
        </div>
        <ul className="flex flex-wrap justify-center gap-3">
          <li>
            <ContactLink href={CONTACT.whatsappUrl} icon="chat">
              WhatsApp: {CONTACT.whatsappLabel}
            </ContactLink>
          </li>
          {CONTACT.instagrams.map((instagram) => (
            <li key={instagram.handle}>
              <ContactLink href={instagram.url} icon="photo_camera">
                Instagram ({instagram.owner}): {instagram.handle}
              </ContactLink>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-ink-soft">
          <li className="flex items-center gap-2">
            <Icon name="verified" className="text-[18px] text-tertiary" />
            Quadro Europeu Comum (GeR A1 ao B2)
          </li>
          <li className="flex items-center gap-2">
            <Icon name="check_circle" className="text-[18px] text-tertiary" />
            Goethe-Zertifikat · telc
          </li>
          <li className="flex items-center gap-2">
            <Icon name="handshake" className="text-[18px] text-tertiary" />
            Mentoria individual com a Melissa
          </li>
        </ul>
      </Reveal>
    </section>
  );
}

function ContactLink({ href, icon, children }: { href: string; icon: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="press inline-flex items-center gap-3 rounded-full bg-surface-lowest px-5 py-3 text-sm font-semibold text-primary shadow-paper hover:bg-surface"
    >
      <Icon name={icon} className="text-[20px] text-tertiary" />
      {children}
    </a>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-hairline/60 bg-surface-low py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-sm text-ink-soft sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>
          Mentoria e preparação para exames de alemão com a professora Melissa.
          <br />© {new Date().getFullYear()} zack zack · akademie für Deutsch lernen
        </p>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-5 gap-y-2">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => scrollToSection(e, section.id)}
              className="hover:text-primary"
            >
              {section.label}
            </a>
          ))}
          <Link to={LOGIN_PATH} className="font-semibold text-primary hover:underline">
            Área do aluno
          </Link>
        </nav>
      </div>
    </footer>
  );
}
