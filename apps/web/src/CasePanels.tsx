import { useEffect, useState } from 'react';
import {
  ArrowRight, BookMarked, Check, CheckCheck, ClipboardList,
  Fingerprint, Lock, MessageSquareText, NotebookPen, Plus, Save, Search,
  ShieldAlert, ShieldCheck, Sparkles, Trash2, X,
  type LucideIcon
} from 'lucide-react';
import './features.css';

export type InvestigatorNote = { id: string; title: string; body: string; category: 'hypothesis' | 'lead' | 'question'; updatedAt: string };
export type NoteInput = Pick<InvestigatorNote, 'title' | 'body' | 'category'>;
export type SuspectDossier = {
  id: string; name: string; age: number; occupation: string; relationship: string;
  alibi: string; personality: string; portrait: string; color: string;
  relevantIds: string[]; interviewCount: number;
};
export type AlibiCheck = {
  id: string; personId: string; title: string; statement: string;
  finding: string | null; evidenceIds: readonly string[];
  supporting: string[]; ready: boolean; verified: boolean; kind: 'contradiction' | 'lead';
};
export type DetectiveScore = {
  total: number; rank: string;
  categories: { name: string; earned: number; max: number }[];
};
const categories: { id: InvestigatorNote['category']; label: string; icon: LucideIcon }[] = [
  { id: 'hypothesis', label: 'Хипотеза', icon: Fingerprint },
  { id: 'lead', label: 'Следа за проверка', icon: Search },
  { id: 'question', label: 'Въпрос', icon: MessageSquareText }
];
const blank = (): NoteInput => ({ title: '', body: '', category: 'hypothesis' });
function categoryName(category: InvestigatorNote['category']) {
  return categories.find(c => c.id === category)?.label || 'Бележка';
}

export function NotebookPanel({ notes, enabled, saving, onSave, onDelete }: {
  notes: InvestigatorNote[]; enabled: boolean; saving: boolean;
  onSave: (note: NoteInput, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<NoteInput>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const filtered = notes.filter(n => (n.title + n.body).toLocaleLowerCase('bg').includes(search.toLocaleLowerCase('bg')));
  const editingNote = notes.find(n => n.id === editing);
  useEffect(() => {
    if (editing && !editingNote) { setEditing(null); setDraft(blank()); }
  }, [editing, editingNote]);
  function cancel() { setDraft(blank()); setEditing(null); setCreateOpen(false); setLocalError(''); }
  function edit(note: InvestigatorNote) {
    setDraft({ title: note.title, body: note.body, category: note.category });
    setEditing(note.id);
    setCreateOpen(true);
    setLocalError('');
  }
  async function submit() {
    if (draft.title.trim().length < 2 || !draft.body.trim()) { setLocalError('Добави заглавие и съдържание.'); return; }
    setLocalError('');
    try { await onSave(draft, editing || undefined); cancel(); }
    catch (e) { setLocalError(e instanceof Error ? e.message : 'Неуспешен запис.'); }
  }
  return <div className="v03-column">
    <div className="v03-topline">
      <div className="v03-lead"><BookMarked size={20} /><div><strong>Личен детективски бележник</strong><span>Записвай хипотези, въпроси и следи, които искаш да провериш.</span></div></div>
      <button type="button" className="primary" disabled={!enabled || saving || notes.length >= 35} onClick={() => { cancel(); setCreateOpen(true); }}><Plus size={15} /> Нова бележка</button>
    </div>
    <div className="v03-note-toolbar">
      <label className="v03-search"><Search size={16} /><input type="search" aria-label="Търси бележки" placeholder="Търси в бележките..." value={search} onChange={e => setSearch(e.target.value)} /></label>
      <span className="v03-counter">{notes.length} / 35 БЕЛЕЖКИ</span>
    </div>
    {createOpen && <div className="v03-editor">
      <div className="v03-editor-title"><strong><NotebookPen size={17} /> {editing ? 'Редактирай бележка' : 'Нова бележка'}</strong><button type="button" aria-label="Затвори" onClick={cancel}><X size={18} /></button></div>
      <div className="v03-type-selector">{categories.map(c => <button type="button" key={c.id} className={draft.category === c.id ? 'active' : ''} onClick={() => setDraft(d => ({ ...d, category: c.id }))}><c.icon size={15} />{c.label}</button>)}</div>
      <label className="v03-field-label" htmlFor="note-title">ЗАГЛАВИЕ</label>
      <input id="note-title" maxLength={100} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Например: Неясното алиби на Мартин" />
      <label className="v03-field-label" htmlFor="note-body">БЕЛЕЖКИ И ХИПОТЕЗИ</label>
      <textarea id="note-body" maxLength={2000} rows={5} value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} placeholder="Какво знам, какво липсва и какво трябва да проверя..." />
      {localError && <p className="v03-error" role="alert">{localError}</p>}
      <div className="v03-editor-actions"><button type="button" className="secondary" onClick={cancel}>Отказ</button><button className="primary" type="button" disabled={saving || !enabled} onClick={() => void submit()}><Save size={15} /> {saving ? 'Запазване...' : 'Запази бележката'}</button></div>
    </div>}
    {filtered.length ? <div className="v03-notes-grid">{filtered.map(n => {
      const cat = categories.find(c => c.id === n.category)!;
      const Icon = cat.icon;
      return <article className="v03-note" key={n.id}><div className="v03-note-head"><span><Icon size={15} /> {categoryName(n.category)}</span><span className="v03-note-date">{new Date(n.updatedAt).toLocaleDateString('bg-BG')}</span></div><h3>{n.title}</h3><p>{n.body}</p><div className="v03-note-actions"><button type="button" onClick={() => edit(n)}><NotebookPen size={14} /> Редакция</button><button type="button" disabled={saving} onClick={() => void onDelete(n.id)}><Trash2 size={14} /> Изтрий</button></div></article>;
    })}</div> : <div className="v03-empty"><NotebookPen size={26} /><strong>{search ? 'Няма съвпадения' : 'Бележникът е празен'}</strong><p>{search ? 'Опитай друго търсене.' : 'Започни разследване и запиши първата си хипотеза.'}</p></div>}
  </div>;
}

export function DossiersPanel({ suspects, found, checks, onInterview }: {
  suspects: SuspectDossier[];
  found: string[];
  checks: AlibiCheck[];
  onInterview: (id: string) => void;
}) {
  return <div className="v03-dossiers">{suspects.map((person, index) => {
    const known = checks.filter(c => c.personId === person.id && c.verified);
    return <article key={person.id} className="v03-dossier">
      <div className="v03-dossier-hero"><span className={'v03-portrait '+person.color}><span className="v03-portrait-pattern" /><span>{person.portrait}</span></span><div className="v03-dossier-identity"><span className="v03-mono">ДОСИЕ / {String(index + 1).padStart(2, '0')}</span><h3>{person.name}</h3><span>{person.age} г. · {person.occupation}</span></div></div>
      <div className="v03-dossier-facts">
        <div><span>ВРЪЗКА С ЖЕРТВАТА</span><p>{person.relationship}</p></div>
        <div><span>ЗАЯВЕНО АЛИБИ</span><p>{person.alibi}</p></div>
        <div><span>ПОВЕДЕНИЕ</span><p>{person.personality}</p></div>
      </div>
      <div className="v03-dossier-foot"><div><strong>{person.relevantIds.length}</strong><span>Свързани улики</span></div><div><strong>{person.interviewCount}</strong><span>Въпроси</span></div><div><strong>{known.length}</strong><span>Проверки</span></div></div>
      {person.relevantIds.length > 0 && <div className="v03-clue-chips">{person.relevantIds.filter(id => found.includes(id)).map(id => <span key={id}>{id}</span>)}</div>}
      <button type="button" className="secondary v03-dossier-action" onClick={() => onInterview(person.id)}><MessageSquareText size={15} /> Към разпит <ArrowRight size={16} /></button>
    </article>;
  })}</div>;
}

export function AlibiPanel({ checks, suspects, loading, onVerify }: {
  checks: AlibiCheck[]; suspects: SuspectDossier[]; loading: boolean;
  onVerify: (id: string) => Promise<void>;
}) {
  return <div className="v03-column">
    <div className="v03-topline"><div className="v03-lead"><ShieldAlert size={22} /><div><strong>Проверка на показанията</strong><span>Съпоставяй алибита с конкретни доказателства. Съмнение не означава доказана вина.</span></div></div><span className="v03-counter">{checks.filter(c => c.verified).length} / {checks.length} ПРОВЕРЕНИ</span></div>
    {checks.map(c => {
      const person = suspects.find(p => p.id === c.personId);
      return <article className={'v03-check '+(c.verified ? 'confirmed' : '')} key={c.id}>
        <div className="v03-check-head"><span className="v03-mono">{c.id} / {person?.name}</span><span className={'v03-flag '+(c.verified ? 'verified' : c.ready ? 'ready' : '')}>{c.verified ? <><CheckCheck size={13} /> ПРОВЕРЕНО</> : c.ready ? 'ГОТОВО ЗА ПРОВЕРКА' : <><Lock size={12} /> ЛИПСВАТ УЛИКИ</>}</span></div>
        <div className="v03-check-content"><div><span className="v03-mono">ЗАЯВЛЕНИЕ</span><h3>{c.title}</h3><p>{c.statement}</p></div><div><span className="v03-mono">НЕОБХОДИМИ ДОКАЗАТЕЛСТВА</span><div className="v03-check-clues">{c.evidenceIds.map(id => <span key={id} className={c.supporting.includes(id) ? 'available' : ''}>{c.supporting.includes(id) ? <Check size={13} /> : <Lock size={12} />}{id}</span>)}</div></div></div>
        {c.verified && c.finding && <div className="v03-finding"><ShieldCheck size={17} /><span>{c.finding}</span></div>}
        <div className="v03-check-bottom"><span>{c.kind === 'contradiction' ? 'ПОТЕНЦИАЛНО ПРОТИВОРЕЧИЕ' : 'ЛИНИЯ ЗА ПРОВЕРКА'}</span><button type="button" className="secondary" onClick={() => void onVerify(c.id)} disabled={!c.ready || c.verified || loading}>{c.verified ? 'Проверено' : 'Провери алибито'} <ArrowRight size={14} /></button></div>
      </article>;
    })}
  </div>;
}

export function ScoreReport({ score, status }: { score: DetectiveScore; status: string }) {
  return <div className="v03-score">
    <div className="v03-score-head"><span className="v03-medal"><Sparkles size={30} /></span><div><span className="v03-mono">ДОКЛАД ЗА РАЗСЛЕДВАНЕТО</span><h3>{score.rank}</h3><p>{status === 'solved' ? 'Случаят е разрешен.' : 'Разследването изисква още работа.'}</p></div><div className="v03-score-total"><strong>{score.total}</strong><span>/ 100</span></div></div>
    <div className="v03-score-bars">{score.categories.map(c => <div className="v03-score-row" key={c.name}><div><span>{c.name}</span><strong>{c.earned} / {c.max}</strong></div><div className="v03-score-track"><span style={{ width: (100 * c.earned / c.max) + '%' }} /></div></div>)}</div>
    <div className="v03-score-footer"><ClipboardList size={16} /> Резултатът се изчислява от сървъра според събраните доказателства и проверените заключения.</div>
  </div>;
}
