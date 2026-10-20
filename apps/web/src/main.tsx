import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronRight, CircleDot, CircleHelp, Clock3, Crosshair, FileCheck2, FileSearch, Files, Fingerprint, FlaskConical, FolderOpen, Gavel, Info, Link2, LockKeyhole, MapPin, Menu, MessageSquareText, Microscope, Network, Scale, ScanSearch, Search, Send, ShieldCheck, ShieldQuestion, TerminalSquare, UserRound, type LucideIcon
} from 'lucide-react';
import './style.css';
import { NotebookPanel, DossiersPanel, AlibiPanel, ScoreReport, type InvestigatorNote, type NoteInput, type SuspectDossier, type AlibiCheck, type DetectiveScore } from './CasePanels';
import { ExpandedScene, VisualEvidenceBoard } from './InvestigationTools';
import { ForensicWorkbench, FinalReport, HintStation, type FinalReportData } from './ForensicPanels';
import { InvestigationExpansion } from './ExpansionPanel';
import { ImmersiveInvestigation } from './ImmersiveInvestigation';
import { LivingInvestigation } from './LivingInvestigation';

type Person = { id: string; name: string; role: string; initial: string; opening: string };
type Evidence = { id: string; title: string; type: string; detail: string; icon: string };
type CaseInfo = { title: string; location: string; date: string; briefing: string; people: Person[] };
type Chat = { role: string; text: string };
type Deduction = { id: string; title: string; explanation: string; evidenceIds: readonly [string, string] };
type View = 'briefing' | 'scene' | 'lab' | 'evidence' | 'board' | 'timeline' | 'interview' | 'accusation' | 'notebook' | 'dossiers' | 'alibis' | 'report' | 'advanced' | 'immersive' | 'living';
type Mode = 'checking' | 'ai-configured' | 'ai-live' | 'scripted-demo';
type Tab = { id: View; name: string; hint: string; icon: LucideIcon };

const tabs: Tab[] = [
  { id: 'briefing', name: 'Досие', hint: 'Обща информация', icon: FolderOpen },
  { id: 'scene', name: 'Местопрестъпление', hint: 'Апартамент 407', icon: ScanSearch },
  { id: 'immersive', name: 'Интерактивно разследване', hint: 'Инвентар и терминал', icon: LockKeyhole },
  { id: 'living', name: 'Живо разследване', hint: 'Правосъдие и нови случаи', icon: Scale },
  { id: 'lab', name: 'Криминалистика', hint: 'Анализи и материали', icon: Microscope },
  { id: 'evidence', name: 'Доказателства', hint: 'Събрани улики', icon: Files },
  { id: 'notebook', name: 'Бележник', hint: 'Лични хипотези', icon: BookOpen },
  { id: 'dossiers', name: 'Заподозрени', hint: 'Лични досиета', icon: UserRound },
  { id: 'alibis', name: 'Алибита', hint: 'Проверки на показания', icon: ShieldQuestion },
  { id: 'board', name: 'Връзки', hint: 'Логически заключения', icon: Network },
  { id: 'timeline', name: 'Хронология', hint: 'Последователност', icon: Clock3 },
  { id: 'interview', name: 'Разпити', hint: 'Свидетели и заподозрени', icon: MessageSquareText },
  { id: 'accusation', name: 'Обвинение', hint: 'Финално заключение', icon: Gavel },
  { id: 'advanced', name: 'Детективски инструменти', hint: 'Миниигри и прогрес', icon: Fingerprint },
  { id: 'report', name: 'Доклад', hint: 'Развръзка на случая', icon: ShieldCheck }
];

const allEvidence: Evidence[] = [
  ['E01', 'Протокол от огледа', 'Документ', 'Апартаментът е намерен заключен. Няма следи от взлом.', '▤'],
  ['E03', 'Последно обаждане', 'Телефон', 'В 01:17 е проведен 18-секунден разговор с Елена. Записът не разкрива съдържанието.', '☎'],
  ['E04', 'Съобщение 00:42', 'Кореспонденция', 'Никола е поискал от Мартин да донесе оригиналните фактури.', '✉'],
  ['E08', 'Дневник на ключалката', 'Системен лог', 'В 01:28 входната врата се затваря и заключва автоматично.', '⚿'],
  ['E09', 'Финансова чернова', 'Документ', 'Никола е подготвял сигнал за несъответствия по фактури.', '▥'],
  ['E05', 'Дневник на входния код', 'Системен лог', 'В 01:09 временен код отваря входа на сградата.', '⌁'],
  ['E06', 'Камера: асансьор', 'Видео', 'В 01:12 човек със светла диагонална презрамка се качва към четвъртия етаж.', '▣'],
  ['E07', 'Камера: вход', 'Видео', 'В 01:29 човек със сходна презрамка напуска сградата. Лицето е неясно.', '▣'],
  ['E10', 'Карта на пропуските', 'Регистър', 'Временният код е издаден за уговорено посещение. Не доказва самостоятелно самоличност.', '▦'],
  ['E02', 'Съдебномедицинска оценка', 'Експертиза', 'Ориентировъчният интервал на смъртта е 01:20–01:25; оценката не е точна до минута.', '✚'],
  ['E11', 'Показания на Елена', 'Протокол', 'Първоначално Елена отрича контакт, въпреки че телефонният регистър показва разговор.', '◈'],
  ['E12', 'Показания на Петър', 'Протокол', 'Петър посочва приблизително време на шума, но не е сигурен за минутата.', '◈']
].map(([id, title, type, detail, icon]) => ({ id, title, type, detail, icon }));

const timeline = [
  ['00:42', 'Съобщение за оригинални фактури', 'E04'],
  ['01:09', 'Временен код отваря входа', 'E05'],
  ['01:12', 'Камера засича фигура в асансьора', 'E06'],
  ['01:17', 'Последният разговор на Никола', 'E03'],
  ['01:20–01:25', 'Приблизителен интервал на смъртта', 'E02'],
  ['01:28', 'Автоматично заключване', 'E08'],
  ['01:29', 'Фигура напуска сградата', 'E07'],
  ['02:37', 'Откриване на тялото', 'E01']
] as const;

const storageKey = 'casefiles-demo-session';

async function call<T>(path: string, method = 'GET', body?: unknown, session?: string): Promise<T> {
  const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(session ? { 'x-case-session': session } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Връзката със сървъра е прекъсната.');
  return data;
}

function SectionHeader({ kicker, title, description, extra }: { kicker: string; title: string; description: string; extra?: React.ReactNode }) {
  return <div className="section-heading">
    <div className="heading-copy"><div className="eyebrow"><span className="eyebrow-line" />{kicker}</div><h1>{title}</h1><p>{description}</p></div>
    {extra && <div className="heading-extra">{extra}</div>}
  </div>;
}

function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={24} strokeWidth={1.6} /></div><strong>{title}</strong><p>{description}</p>{action}</div>;
}

function App() {
  const [view, setView] = useState<View>('briefing');
  const [info, setInfo] = useState<CaseInfo | null>(null);
  const [session, setSession] = useState('');
  const [found, setFound] = useState<string[]>([]);
  const [messages, setMessages] = useState<Record<string, Chat[]>>({});
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [notes, setNotes] = useState<InvestigatorNote[]>([]);
  const [suspects, setSuspects] = useState<SuspectDossier[]>([]);
  const [alibiChecks, setAlibiChecks] = useState<AlibiCheck[]>([]);
  const [linkA, setLinkA] = useState('');
  const [linkB, setLinkB] = useState('');
  const [linkNotice, setLinkNotice] = useState('');
  const [activePerson, setActivePerson] = useState('martin');
  const [selected, setSelected] = useState<Evidence | null>(null);
  const [question, setQuestion] = useState('');
  const [present, setPresent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [aiMode, setAiMode] = useState<Mode>('checking');
  const [interviewStyle, setInterviewStyle] = useState<'neutral'|'challenge'|'empathy'>('neutral');
  const [scriptedOnly, setScriptedOnly] = useState(true);
  const [pressure, setPressure] = useState<Record<string,number>>({});
  const [finalReport, setFinalReport] = useState<FinalReportData|null>(null);
  const [suspect, setSuspect] = useState('martin');
  const [motive, setMotive] = useState('');
  const [sequence, setSequence] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<{ status: string; title: string; explanation: string; score: DetectiveScore } | null>(null);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('Всички');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    call<CaseInfo>('/case').then(setInfo).catch(e => setError(String(e)));
    call<{ mode: 'ai-configured' | 'scripted-demo' }>('/health')
      .then(data => setAiMode(data.mode)).catch(() => setAiMode('scripted-demo'));
    const old = localStorage.getItem(storageKey);
    if (old) call<{ found: string[]; messages: Record<string, Chat[]>; pressure?: Record<string,number>; solved?: boolean }>('/session', 'GET', undefined, old)
      .then(s => {
        setSession(old);
        setFound(s.found);
        setMessages(s.messages);
        setPressure(s.pressure||{});
        if (s.solved) void call<FinalReportData>('/report','GET',undefined,old).then(setFinalReport).catch(()=>{});
        void call<Deduction[]>('/deductions', 'GET', undefined, old).then(setDeductions).catch(() => setDeductions([]));
        void loadCaseExtras(old);
      }).catch(() => localStorage.removeItem(storageKey));
  }, []);

  useEffect(() => {
    if (view === 'interview') chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, activePerson, view]);

  const go = (destination: View) => {
    setView(destination);
    setError('');
    setSidebarOpen(false);
  };

  const loadCaseExtras = async (token: string) => {
    const results = await Promise.allSettled([
      call<InvestigatorNote[]>('/notes', 'GET', undefined, token),
      call<SuspectDossier[]>('/suspects', 'GET', undefined, token),
      call<AlibiCheck[]>('/contradictions', 'GET', undefined, token)
    ]);
    if (results[0].status === 'fulfilled') setNotes(results[0].value);
    if (results[1].status === 'fulfilled') setSuspects(results[1].value);
    if (results[2].status === 'fulfilled') setAlibiChecks(results[2].value);
  };

  const refreshClues = (token: string) => {
    void call<AlibiCheck[]>('/contradictions','GET',undefined,token).then(setAlibiChecks).catch(()=>{});
    void call<SuspectDossier[]>('/suspects','GET',undefined,token).then(setSuspects).catch(()=>{});
  };

  const restoreSessionAccess = async (token: string): Promise<void> => {
    const state = await call<{ found: string[]; messages: Record<string,Chat[]>; pressure?:Record<string,number>; solved?:boolean }>('/session','GET',undefined,token);
    localStorage.setItem(storageKey,token);
    setSession(token);setFound(state.found);setMessages(state.messages);
    setPressure(state.pressure||{});setError('');
    if(state.solved) setFinalReport(await call<FinalReportData>('/report','GET',undefined,token));
    else setFinalReport(null);
    setDeductions(await call<Deduction[]>('/deductions','GET',undefined,token));
    await loadCaseExtras(token);
  };

  const restorePortableBackup = async (archive: unknown): Promise<void> => {
    const result = await call<{sessionId:string}>('/session','POST');
    await call('/backup/restore','POST',archive,result.sessionId);
    await restoreSessionAccess(result.sessionId);
  };

  const start = async () => {
    setBusy(true); setError('');
    try {
      const data = await call<{ sessionId: string }>('/session', 'POST');
      localStorage.setItem(storageKey, data.sessionId);
      setSession(data.sessionId); setFound([]); setMessages({}); setDeductions([]);
      setSelected(null); setLinkA(''); setLinkB(''); setLinkNotice('');
      setFinalReport(null); setPressure({}); setInterviewStyle('neutral'); setScriptedOnly(true);
      setNotes([]); setAlibiChecks([]); setSuspects([]);
      void loadCaseExtras(data.sessionId);
      setChecked([]); setVerdict(null); go('scene');
    } catch (e) { setError(String(e)); } finally { setBusy(false); }
  };

  const discover = async (item: Evidence) => {
    if (!session) { setError('Първо започни разследване от досието.'); return; }
    if (found.includes(item.id)) { setSelected(item); return; }
    if (busy) return;
    setBusy(true); setError('');
    try {
      const data = await call<{ found: string[] }>('/discover/' + item.id, 'POST', {}, session);
      setFound(data.found); setSelected(item); refreshClues(session);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const send = async () => {
    if (!question.trim() || busy || !session) return;
    const text = question.trim();
    setBusy(true); setError('');
    try {
      const data = await call<{ reply: string; found: string[]; mode: 'ai-live' | 'scripted-demo'; pressure: number }>(
        '/interview', 'POST',
        { personId: activePerson, message: text, interviewStyle, scriptedOnly, ...(present ? { evidenceId: present } : {}) }, session
      );
      setMessages(m => ({ ...m, [activePerson]: [...(m[activePerson] || []), { role: 'player', text }, { role: 'npc', text: data.reply }] }));
      setFound(data.found); setAiMode(data.mode); setPressure(m=>({...m,[activePerson]:data.pressure})); setQuestion(''); setPresent(''); refreshClues(session);
    } catch (e) { setError(String(e)); } finally { setBusy(false); }
  };

  const connect = async () => {
    if (!session || busy || !linkA || !linkB || linkA === linkB) return;
    setBusy(true); setLinkNotice('');
    try {
      const data = await call<{ deduction: Deduction }>('/deductions', 'POST', { firstId: linkA, secondId: linkB }, session);
      setDeductions(current => current.some(x => x.id === data.deduction.id) ? current : [...current, data.deduction]);
      setLinkNotice('Установена връзка: ' + data.deduction.title);
    } catch (e) { setLinkNotice(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const saveNote = async (payload: NoteInput, id?: string): Promise<void> => {
    if (!session) throw Error('Първо започни разследването.');
    setBusy(true);
    try {
      const data = await call<{notes: InvestigatorNote[]}>(id ? '/notes/'+id : '/notes', id ? 'PUT' : 'POST', payload, session);
      setNotes(data.notes);
    } finally { setBusy(false); }
  };
  const deleteNote = async (id: string): Promise<void> => {
    if (!session) return;
    setBusy(true);
    try {
      const data = await call<{notes: InvestigatorNote[]}>('/notes/'+id,'DELETE',undefined,session);
      setNotes(data.notes);
    } catch(e) { setError(e instanceof Error?e.message:String(e)); }
    finally { setBusy(false); }
  };
  const verifyAlibi = async (id: string): Promise<void> => {
    if (!session) return;
    setBusy(true); setError('');
    try {
      await call('/contradictions/'+id,'POST',{},session);
      const updates = await call<AlibiCheck[]>('/contradictions','GET',undefined,session);
      setAlibiChecks(updates);
    } catch(e) { setError(e instanceof Error?e.message:String(e)); }
    finally { setBusy(false); }
  };
  const pickBoard = (id: string) => {
    if (!linkA || linkB || linkA===id) { setLinkA(id); setLinkB(''); }
    else setLinkB(id);
    setLinkNotice('');
  };
  const accuse = async () => {
    if (!session || busy) return;
    setBusy(true); setError('');
    try {
      const result = await call<{ status:string;title:string;explanation:string;score:DetectiveScore;report?:FinalReportData }>('/accusation', 'POST', { suspectId: suspect, motive, timeline: sequence, evidenceIds: checked }, session);
      setVerdict(result);
      if(result.report)setFinalReport(result.report);
    } catch (e) { setError(String(e)); } finally { setBusy(false); }
  };

  const progress = Math.round(found.length / allEvidence.length * 100);
  const activeTab = tabs.find(t => t.id === view)!;
  const ActiveIcon = activeTab.icon;
  const person = info?.people.find(p => p.id === activePerson);
  const visibleTimeline = timeline.filter(([, , id]) => found.includes(id));
  const evidenceTypes = ['Всички', ...new Set(allEvidence.filter(e => found.includes(e.id)).map(e => e.type))];
  const filteredEvidence = allEvidence.filter(e => found.includes(e.id) && (filterType === 'Всички' || e.type === filterType) && (e.title + e.detail + e.id).toLocaleLowerCase('bg').includes(query.toLocaleLowerCase('bg')));
  const statusText = aiMode === 'ai-live' ? 'Последен отговор: AI' : aiMode === 'ai-configured' ? 'AI ключ · непотвърден' : aiMode === 'checking' ? 'Проверка на AI' : 'Демо диалози';

  const evidenceCards = (ids: string[]) => <div className="evidence-grid">{ids.map(id => {
    const item = allEvidence.find(e => e.id === id);
    if (!item) return null;
    const collected = found.includes(id);
    return <button className={'e-card ' + (collected ? 'collected' : '')} key={id} onClick={() => void discover(item)}>
      <span className="e-card-top"><span className="evidence-icon"><FileSearch size={23} strokeWidth={1.5} /></span><span className={'evidence-state ' + (collected ? 'is-found' : '')}>{collected ? <><Check size={12} /> ОТКРИТО</> : 'ЗА ПРОВЕРКА'}</span></span>
      <span className="evidence-id">{item.id} / {item.type}</span>
      <strong>{item.title}</strong>
      <span className="e-card-description">{collected ? item.detail : 'Разгледай, за да добавиш материала към досието.'}</span>
      <span className="e-card-action">{collected ? 'Преглед на уликата' : 'Разгледай материала'} <ArrowUpRight size={15} /></span>
    </button>;
  })}</div>;

  return <div className="app-shell">
    <aside className={'sidebar ' + (sidebarOpen ? 'sidebar-open' : '')}>
      <div className="sidebar-brand">
        <div className="brand-symbol"><Fingerprint size={25} strokeWidth={1.4} /></div>
        <div className="brand-text"><strong>CASE<span>FILES</span></strong><small>THE TRUTH IS HIDDEN</small></div>
      </div>

      <div className="sidebar-case">
        <div className="sidebar-case-top"><span>АКТИВНО ДОСИЕ</span><span className="sidebar-case-dot" /></div>
        <strong>Последното<br />обаждане</strong>
        <div className="sidebar-case-meta"><MapPin size={12} /> СОФИЯ <span className="meta-separator">/</span> #001</div>
      </div>

      <div className="nav-group-label">РАЗСЛЕДВАНЕ <span>01 — 15</span></div>
      <nav className="main-nav" aria-label="Навигация по разследването">
        {tabs.map(t => {
          const Icon = t.icon;
          return <button type="button" key={t.id} aria-current={view === t.id ? 'page' : undefined} className={'nav-link ' + (view === t.id ? 'active' : '')} onClick={() => go(t.id)}>
            <span className="nav-icon"><Icon size={18} strokeWidth={1.7} /></span>
            <span className="nav-copy"><strong>{t.name}</strong><small>{t.hint}</small></span>
            {t.id === 'evidence' && found.length > 0 ? <span className="nav-count">{found.length}</span> : view === t.id ? <ChevronRight size={15} className="nav-chevron" /> : null}
          </button>;
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-progress">
          <div className="progress-heading"><span>НАПРЕДЪК ПО СЛУЧАЯ</span><strong>{progress}%</strong></div>
          <div className="progress-track"><span style={{ width: progress + '%' }} /></div>
          <div className="progress-desc">{found.length} от {allEvidence.length} доказателства</div>
        </div>
        <div className="sidebar-foot"><span className="live-indicator" /> {session ? 'РАЗСЛЕДВАНЕ В ХОД' : 'ИЗЧАКВА СЕСИЯ'}</div>
      </div>
    </aside>

    <div className="workspace">
      <header className="topbar">
        <div className="topbar-start">
          <button type="button" className="mobile-menu" aria-label="Отвори навигацията" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>CASEFILES</span><ChevronRight size={14} /><span>СЛУЧАЙ #001</span><ChevronRight size={14} /><strong>{activeTab.name}</strong></div>
        </div>
        <div className="topbar-end">
          <span className="system-status"><span className="status-light" /> СИСТЕМА ОНЛАЙН</span>
          <span className="topbar-divider" />
          <span className="case-chip"><LockKeyhole size={13} /> ПОВЕРИТЕЛНО</span>
        </div>
      </header>

      <div className="workspace-body">
        <main className="main-panel" id="case-main">
          <div className="panel-meta"><div className="panel-path"><ActiveIcon size={15} /> {activeTab.name.toLocaleUpperCase('bg')}</div><div className="panel-meta-right"><span className="panel-meta-dot" /> CASE FILE / 001</div></div>
          {error && <div className="error" role="alert"><Info size={18} /><span>{error}</span><button type="button" aria-label="Затвори съобщението" onClick={() => setError('')}>×</button></div>}

          <div className="screen" key={view}>
            {view === 'briefing' && <>
              <SectionHeader kicker="ПОЛЕВО ДОСИЕ / 001" title="Последното обаждане" description="Всеки детайл има значение. Нищо не е точно такова, каквото изглежда." extra={<span className="tag"><CircleDot size={12} /> АКТИВЕН СЛУЧАЙ</span>} />
              <div className="hero">
                <div className="hero-grid" />
                <div className="hero-visual"><div className="hero-outline hero-outline-one" /><div className="hero-outline hero-outline-two" /><div className="hero-door"><span>407</span></div><span className="hero-beam" /></div>
                <div className="hero-content">
                  <div className="hero-overline"><span className="hero-line-marker" /> СЛУЧАЙ 001 · КРИМИНАЛЕН ОТДЕЛ</div>
                  <h2>Един апартамент.<br />Трима заподозрени.<br /><em>Една истина.</em></h2>
                  <p>София, 14 октомври 2026 г. Млад мъж е намерен мъртъв зад заключена врата.</p>
                  <button type="button" className="primary hero-cta" disabled={busy || !info} onClick={() => session ? go('scene') : void start()}>{session ? 'Продължи разследването' : 'Започни разследването'} <ArrowRight size={17} /></button>
                </div>
                <div className="hero-footer"><span><Crosshair size={13} /> АПАРТАМЕНТ 407</span><span>02:37 / НАЧАЛО НА ОГЛЕДА</span></div>
              </div>

              <div className="stats-row">
                <div className="stat-card"><span className="stat-icon"><Files size={19} /></span><span className="stat-number">{String(found.length).padStart(2, '0')}<small> / 12</small></span><span className="stat-label">Открити улики</span></div>
                <div className="stat-card"><span className="stat-icon"><UserRound size={19} /></span><span className="stat-number">03</span><span className="stat-label">Лица за разпит</span></div>
                <div className="stat-card"><span className="stat-icon"><Link2 size={19} /></span><span className="stat-number">{String(deductions.length).padStart(2, '0')}</span><span className="stat-label">Разкрити връзки</span></div>
              </div>
              <div className="content-split">
                <section className="surface-card narrative-card"><div className="card-header"><span className="section-number">01</span><h3>Първоначален доклад</h3></div><p>{info?.briefing || 'Зареждане на първоначалния доклад...'}</p><div className="document-sign"><ShieldCheck size={16} /> ИНФОРМАЦИЯ ОТ ПЪРВОНАЧАЛНИЯ ОГЛЕД</div></section>
                <section className="surface-card objectives-card"><div className="card-header"><span className="section-number">02</span><h3>План на разследването</h3></div>
                  <div className="objective"><span className="objective-index">01</span><div><strong>Разгледай местопрестъплението</strong><small>Потърси следи и прегледай материалите</small></div><ChevronRight size={16} /></div>
                  <div className="objective"><span className="objective-index">02</span><div><strong>Изгради своята версия</strong><small>Свързвай улики и проверявай алибита</small></div><ChevronRight size={16} /></div>
                  <div className="objective"><span className="objective-index">03</span><div><strong>Предай заключението</strong><small>Обоснови обвинението си с доказателства</small></div><ChevronRight size={16} /></div>
                </section>
              </div>
            </>}

            {view === 'scene' && <>
              <SectionHeader kicker="ЛОКАЦИЯ 01 / МЕСТОПРЕСТЪПЛЕНИЕ" title="Апартамент 407" description="Разгледай всекидневната, работния кът и антрето. Намери петте ключови материала от огледа." extra={<span className="tag"><MapPin size={13} /> 3 ЗОНИ ЗА ОГЛЕД</span>} />
              <ExpandedScene found={found} clues={allEvidence} loading={busy} onDiscover={discover} onView={setSelected} />
            </>}

            {view === 'immersive' && <>
              <SectionHeader kicker="CASEFILES 0.6 / IMMERSIVE INVESTIGATION" title="Интерактивно разследване" description="Потърси скрити предмети, комбинирай инвентара, отключи сейфа, провеждай разклонени разговори и проучвай полицейските архиви." extra={<span className="tag"><LockKeyhole size={13}/> СЛЕДСТВЕНИ ИНСТРУМЕНТИ</span>} />
              <ImmersiveInvestigation session={session} found={found}/>
            </>}
            {view === 'living' && <>
              <SectionHeader kicker="CASEFILES 0.7 / LIVING INVESTIGATION" title="Живо разследване" description="Разрешения за обиск, проверка на доказателства, експертизи, събития и последствия, финансови следи, съдебен процес и нови криминални случаи." extra={<span className="tag"><Scale size={13}/> CASE #001 + #002</span>} />
              <LivingInvestigation session={session} found={found}/>
            </>}
            {view === 'lab' && <>
              <SectionHeader kicker="ЛАБОРАТОРИЯ / АНАЛИЗИ" title="Криминалистика" description="Превъртай записа кадър по кадър и изследвай страници от документи. Само потвърдените наблюдения отключват нови улики." extra={<span className="tag"><FlaskConical size={13}/> FORENSIC UPDATE 0.4</span>}/>
              <ForensicWorkbench session={session} onFound={ids=>{setFound(ids);refreshClues(session);}}/>
              <div className="subsection-title"><div><h2>Други налични експертизи</h2><p>Прегледай допълнителните материали от лабораторията.</p></div></div>
              {evidenceCards(['E05','E02'])}
            </>}

            {view === 'evidence' && <>
              <SectionHeader kicker="АРХИВ / СЪБРАНИ МАТЕРИАЛИ" title="Доказателства" description="Всяка открита следа се документира тук. Преглеждай, филтрирай и подготвяй материали за разпит." extra={<span className="tag"><Files size={13} /> {found.length} / {allEvidence.length} УЛИКИ</span>} />
              <div className="evidence-controls"><label className="search-field"><Search size={17} /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Търси в откритите улики..." aria-label="Търси улики" /></label><select value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Филтрирай по вид">{evidenceTypes.map(t => <option value={t} key={t}>{t}</option>)}</select></div>
              {filteredEvidence.length ? evidenceCards(filteredEvidence.map(e => e.id)) : <EmptyState icon={FileSearch} title={found.length ? 'Няма съвпадения' : 'Все още няма доказателства'} description={found.length ? 'Опитай с друг термин или премахни филтъра.' : 'Посети местопрестъплението или криминалистичното бюро и открий първите следи.'} action={!found.length ? <button className="secondary" type="button" onClick={() => go('scene')}>Към местопрестъплението <ArrowRight size={15} /></button> : undefined} />}
            </>}

            {view === 'board' && <>
              <SectionHeader kicker="АНАЛИТИЧЕН МОДУЛ / ДОКАЗАТЕЛСТВА" title="Визуална дъска" description="Плъзни карта върху друга или избери две улики последователно. Провери логическата връзка със сървъра." extra={<span className="tag"><Network size={13} /> {deductions.length} ЗАКЛЮЧЕНИЯ</span>} />
              <VisualEvidenceBoard clues={allEvidence.filter(e=>found.includes(e.id))} deductions={deductions} first={linkA} second={linkB} notice={linkNotice} loading={busy} onChoose={pickBoard} onPair={(a,b)=>{setLinkA(a);setLinkB(b);setLinkNotice('');}} onVerify={connect}/>
            </>}

            {view === 'notebook' && <>
              <SectionHeader kicker="ЛИЧНИ ЗАПИСКИ / CASE #001" title="Детективски бележник" description="Организирай собствените си хипотези и въпроси. Бележките остават в игровата сесия." extra={<span className="tag"><BookOpen size={13}/> {notes.length} БЕЛЕЖКИ</span>} />
              <NotebookPanel notes={notes} enabled={!!session} saving={busy} onSave={saveNote} onDelete={deleteNote}/>
            </>}
            {view === 'dossiers' && <>
              <SectionHeader kicker="ОПЕРАТИВНИ ДОСИЕТА / ЛИЦА" title="Заподозрени" description="Преглеждай известните данни, сравнявай алибитата и преминавай директно към разпит." extra={<span className="tag"><UserRound size={13}/> 3 ДОСИЕТА</span>} />
              <DossiersPanel suspects={suspects} found={found} checks={alibiChecks} onInterview={id=>{setActivePerson(id);go('interview');}} />
            </>}
            {view === 'alibis' && <>
              <SectionHeader kicker="АНАЛИЗ НА ПОКАЗАНИЯ / ПРОТИВОРЕЧИЯ" title="Алибита и противоречия" description="Сравни твърденията с уликите, но не бъркай подозрението с доказана вина." extra={<span className="tag"><ShieldQuestion size={13}/> {alibiChecks.filter(c=>c.verified).length} ПРОВЕРКИ</span>} />
              <AlibiPanel checks={alibiChecks} suspects={suspects} loading={busy} onVerify={verifyAlibi}/>
            </>}
            {view === 'timeline' && <>
              <SectionHeader kicker="ХРОНОЛОГИЯ / РЕКОНСТРУКЦИЯ" title="Последователност на събитията" description="Подреди нощта на престъплението. Показват се само събития, подкрепени от открити доказателства." extra={<span className="tag"><Clock3 size={13} /> {visibleTimeline.length} / {timeline.length} СЪБИТИЯ</span>} />
              <div className="timeline-head"><span><Clock3 size={17} /> НОЩТА НА 14 ОКТОМВРИ 2026</span><span>РЕКОНСТРУКЦИЯ / 001</span></div>
              {visibleTimeline.length ? <div className="timeline">{visibleTimeline.map(([time, label, id], index) => <div className="time-item" key={id}><div className="time-left"><span className="time-step">{String(index + 1).padStart(2, '0')}</span><span className="time-value">{time}</span></div><div className="time-event"><span className="time-source">{id} / ПОТВЪРДЕНО ОТ УЛИКА</span><h3>{label}</h3></div><div className="time-confirm"><Check size={16} /></div></div>)}</div> : <EmptyState icon={Clock3} title="Все още няма потвърдени събития" description="Установи времеви точки чрез оглед или експертиза." />}
            </>}

            {view === 'interview' && <>
              <SectionHeader kicker="ОПЕРАТИВЕН РАЗПИТ / СТАЯ 03" title="Стая за разпити" description="Задавай въпроси и предявявай намерените доказателства. Реакциите могат да разкрият противоречия." extra={<span className="tag"><MessageSquareText size={13} /> {info?.people.length || 3} ЛИЦА</span>} />
              <div className="people">{info?.people.map((p, i) => <button key={p.id} type="button" className={'person ' + (activePerson === p.id ? 'selected' : '')} onClick={() => setActivePerson(p.id)}><span className={'avatar portrait-' + i}>{p.initial}</span><span className="person-copy"><strong>{p.name}</strong><small>{p.role}</small></span>{activePerson === p.id && <span className="person-active-dot" />}</button>)}</div>
              <div className="interview">
                <div className="interview-head"><div className="interview-ident"><span className="avatar large">{person?.initial || '·'}</span><div><div className="interview-subtitle">РАЗПИТ / АКТИВЕН ПРОТОКОЛ</div><h3>{person?.name}</h3><p>{person?.role} · СЛУЧАЙ 001</p></div></div><div className="recording-badge"><span /> ЗАПИС НА РАЗГОВОР</div></div>
                <div className="chat" role="log" aria-label="Разговор със заподозрения" aria-live="polite"><div className="transcript-label"><span>НАЧАЛО НА РАЗПИТА</span></div><div className="bubble"><div className="bubble-label"><UserRound size={13} /> {person?.name}</div><p>{person?.opening}</p></div>{(messages[activePerson] || []).map((m, i) => <div key={i} className={'bubble ' + (m.role === 'player' ? 'player' : '')}><div className="bubble-label">{m.role === 'player' ? <><ShieldCheck size={13} /> ДЕТЕКТИВ</> : <><UserRound size={13} /> {person?.name}</>}</div><p>{m.text}</p></div>)}{busy && <div className="typing-indicator"><span /><span /><span /> Подготвя се отговор...</div>}<div ref={chatEndRef} /></div>
                <div className="interview-compose"><label htmlFor="present"><FileCheck2 size={15} /> ПРЕДЯВЕНО ДОКАЗАТЕЛСТВО <span>НЕЗАДЪЛЖИТЕЛНО</span></label><select id="present" value={present} onChange={e => setPresent(e.target.value)}><option value="">Без приложена улика</option>{allEvidence.filter(e => found.includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.id} · {e.title}</option>)}</select><div className="f04-interview-strategy">
                  <div className="f04-pressure-head"><strong>СТРАТЕГИЯ НА РАЗПИТА</strong><span>НАПРЕЖЕНИЕ: {pressure[activePerson]||20} / 100</span></div>
                  <div className="f04-pressure-track"><span style={{width:(pressure[activePerson]||20)+'%'}}/></div>
                  <div className="f04-interview-modes">
                    {([['neutral','Неутрален'],['empathy','Емпатия'],['challenge','Конфронтация']] as const).map(([id,label])=><button key={id} type="button" className={interviewStyle===id?'active':''} onClick={()=>setInterviewStyle(id)}>{label}</button>)}
                  </div>
                  <label className="f04-script-toggle"><input type="checkbox" checked={scriptedOnly} onChange={e=>setScriptedOnly(e.target.checked)}/> Сценарен режим без AI заявки</label>
                </div>
                <form className="composer" onSubmit={e => { e.preventDefault(); void send(); }}><input maxLength={600} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Въведи въпроса си към заподозрения..." aria-label="Въпрос към заподозрения" /><button className="primary send-btn" disabled={!session || busy || !question.trim()} type="submit"><Send size={16} /> Изпрати</button></form><div className="composer-foot"><span><LockKeyhole size={12} /> Разговорът е част от досието</span><span>{question.length} / 600</span></div></div>
              </div>
              <div className="interview-disclaimer"><Info size={15} /> {aiMode === 'ai-live' ? 'Последният отговор беше генериран от AI.' : aiMode === 'ai-configured' ? 'AI ключ е конфигуриран, но реален отговор не е потвърден. При грешка се използва демонстрационен диалог.' : 'В момента се използват демонстрационни реплики.'}</div>
            </>}

            {view === 'advanced' && <>
              <SectionHeader kicker="CASEFILES / РАЗШИРЕНИ ИНСТРУМЕНТИ" title="Детективски център" description="Нови криминалистични миниигри, карта, логическа проверка, реконструкция, история на решенията и постижения." extra={<span className="tag"><Fingerprint size={13}/> DIGITAL INVESTIGATION</span>} />
              <InvestigationExpansion session={session} foundCount={found.length} onRestoreSession={restoreSessionAccess} onRestoreBackup={restorePortableBackup}/>
            </>}
            {view === 'report' && <>
              <SectionHeader kicker="ЗАКЛЮЧИТЕЛЕН ДОКЛАД / СЛУЧАЙ 001" title="Реконструкция на случая" description="Пълната хронология и пропуснатите улики се показват само след успешно обосновано обвинение." extra={<span className="tag"><ShieldCheck size={13}/> {finalReport?'СЛУЧАЙ ПРИКЛЮЧЕН':'ЗАПЕЧАТАНО ДОСИЕ'}</span>}/>
              <FinalReport report={finalReport}/>
            </>}

            {view === 'accusation' && <>
              <SectionHeader kicker="ФИНАЛЕН ЕТАП / ЗАКЛЮЧЕНИЕ" title="Предаване на обвинението" description="Тук интуицията не е достатъчна. Свържи фактите, докажи възможността и защити версията си." extra={<span className="tag tag-alert"><Scale size={13} /> ФИНАЛНО РЕШЕНИЕ</span>} />
              <div className="accusation-notice"><ShieldQuestion size={23} /><div><strong>Преди да продължиш</strong><p>Изборът на правилен заподозрян не е достатъчен. Изискват се събрани доказателства, установени връзки, мотив и хронология.</p></div></div>
              <div className="formpanel accusation-form"><div className="form-section"><div className="form-section-heading"><span>01</span><div><h3>Кого обвиняваш?</h3><p>Избери един от лицата по случая</p></div></div><label htmlFor="suspect" className="field-label">ЗАПОДОЗРЯН</label><select id="suspect" value={suspect} onChange={e => setSuspect(e.target.value)}>{info?.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="form-section"><div className="form-section-heading"><span>02</span><div><h3>С какво го доказваш?</h3><p>Избери минимум три доказателства</p></div></div><div className="checks">{allEvidence.filter(e => found.includes(e.id)).map(e => <label key={e.id} className={'check ' + (checked.includes(e.id) ? 'checked' : '')}><input type="checkbox" checked={checked.includes(e.id)} onChange={x => setChecked(prev => x.target.checked ? [...prev, e.id] : prev.filter(id => id !== e.id))} /><span className="check-square"><Check size={13} /></span><span><strong>{e.id}</strong>{e.title}</span></label>)}</div>{!found.length && <p className="form-help">Няма събрани доказателства. Започни с огледа.</p>}<div className="selection-count">{checked.length} ОТ МИНИМУМ 3 ИЗБРАНИ</div></div>
                <div className="form-section"><div className="form-section-heading"><span>03</span><div><h3>Каква е твоята версия?</h3><p>Обясни мотив и последователност</p></div></div><label htmlFor="motive" className="field-label">ПРЕДПОЛАГАЕМ МОТИВ</label><textarea id="motive" value={motive} onChange={e => setMotive(e.target.value)} placeholder="Опиши защо заподозреният би извършил престъплението..." maxLength={1200} /><label htmlFor="sequence" className="field-label">ХРОНОЛОГИЯ И ВЪЗМОЖНОСТ</label><textarea id="sequence" value={sequence} onChange={e => setSequence(e.target.value)} placeholder="Посочи последователността на събитията и как доказателствата ги подкрепят..." maxLength={1200} /></div>
                <div className="accusation-bottom"><div><LockKeyhole size={15} /> ЗАКЛЮЧЕНИЕТО СЕ ОЦЕНЯВА ПО ДОКАЗАТЕЛСТВАТА</div><button className="primary" disabled={!session || busy || checked.length < 3 || motive.trim().length < 12 || sequence.trim().length < 12} onClick={() => void accuse()} type="button">Предай заключението <ArrowRight size={16} /></button></div>
                {verdict && <div className={'verdict ' + verdict.status} role="status"><div className="verdict-symbol">{verdict.status === 'solved' ? <CheckCheck size={24} /> : <Info size={24} />}</div><div><strong>{verdict.title}</strong><p>{verdict.explanation}</p></div></div>}
                {verdict?.score && <ScoreReport score={verdict.score} status={verdict.status}/>}
                {finalReport && <button type="button" className="primary" onClick={()=>go('report')}>Прегледай финалния доклад <ArrowRight size={16}/></button>}
              </div>
            </>}
          </div>
          <div className="main-footer"><span>CASEFILES <span className="footer-separator">/</span> CRIMINAL INVESTIGATION SYSTEM</span><span>CASE #001 <span className="footer-separator">·</span> VERSION 0.7</span></div>
        </main>

        <aside className="inspector">
          <div className="inspector-head"><div className="eyebrow"><span className="eyebrow-line" /> КОНТЕКСТЕН ПАНЕЛ</div><div className="inspector-title-row"><h2>Детайли по случая</h2><span className="panel-round-icon"><BookOpen size={17} /></span></div><p>Оперативна информация в реално време</p></div>
          <div className="inspector-divider" />
          {selected ? <>
            <div className="inspector-document"><div className="document-corners" /><FileSearch size={57} strokeWidth={1} /><span>{selected.id}</span></div>
            <div className="inspector-tag"><CircleDot size={12} /> ИЗБРАНО ДОКАЗАТЕЛСТВО</div>
            <h3 className="inspector-evidence-title">{selected.title}</h3>
            <div className="inspector-evidence-type">{selected.type} <span> / {selected.id}</span></div>
            <p className="inspector-detail">{found.includes(selected.id) ? selected.detail : 'Този материал още не е разгледан.'}</p>
            <div className="inspector-data"><span>СТАТУС</span><strong><span className="mini-dot" /> {found.includes(selected.id) ? 'ОТКРИТО' : 'НЕПРОВЕРЕНО'}</strong></div>
            <button className="secondary inspector-action" type="button" onClick={() => { go('interview'); setPresent(selected.id); }} disabled={!found.includes(selected.id)}><MessageSquareText size={15} /> Предяви при разпит <ArrowUpRight size={15} /></button>
            <button className="text-action" type="button" onClick={() => setSelected(null)}>Изчисти избора <ChevronRight size={14} /></button>
          </> : <>
            <div className="inspector-illustration"><Crosshair size={58} strokeWidth={1} /><span className="inspector-coordinate inspector-coordinate-top">47° / 001</span><span className="inspector-coordinate inspector-coordinate-bottom">CASE FILE ACTIVE</span></div>
            <div className="inspector-tag"><CircleDot size={12} /> ПОЛЕВО ДОСИЕ</div>
            <h3 className="inspector-evidence-title">Разследване #001</h3>
            <p className="inspector-detail">Избери доказателство, за да разгледаш информацията, статуса и възможните действия с него.</p>
          </>}
          <div className="inspector-divider" />
          <div className="inspector-section-label">СЪСТОЯНИЕ НА РАЗСЛЕДВАНЕТО</div>
          <div className="inspector-metrics"><div><span><Files size={15} /> Доказателства</span><strong>{found.length}<small>/{allEvidence.length}</small></strong></div><div><span><Link2 size={15} /> Връзки</span><strong>{deductions.length}</strong></div><div><span><Activity size={15} /> Сесия</span><strong className={session ? 'state-green' : 'state-muted'}>{session ? 'Активна' : 'Няма'}</strong></div></div>
          <div className="inspector-progress"><div className="inspector-progress-top"><span>ПРОГРЕС</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: progress + '%' }} /></div></div>
          <div className="inspector-bottom"><HintStation session={session}/><div className="inspector-hint"><CircleHelp size={17} /><p>Най-добрите заключения идват от две независими улики.</p></div><div className="inspector-ai"><TerminalSquare size={14} /><span>{statusText}</span></div></div>
        </aside>
      </div>
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
