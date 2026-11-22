'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { useGSAP } from '@gsap/react';
import { Annoyed, ArrowLeft, ArrowRight, Check, Frown, Laugh, Meh, ShoppingBag, Smile } from 'lucide-react';
import type { Question } from '@/lib/types';
import { CARD_ICONS } from '@/lib/cardIcons';
import { cardKey, cards as getCards, normOpts, points, sliderItems } from '@/lib/qutil';

gsap.registerPlugin(useGSAP, Draggable);

export function QuestionRenderer({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  switch (q.question_type) {
    case 'multiple_choice': return <Choice q={q} value={value} onChange={onChange} />;
    case 'slider': return <Sliders q={q} value={value} onChange={onChange} />;
    case 'rating': return <Rating q={q} value={value} onChange={onChange} />;
    case 'card_swipe': return <Swipe q={q} value={value} onChange={onChange} />;
    case 'branching_choice': return <Branching q={q} value={value} onChange={onChange} />;
    case 'open_text': return <OpenText q={q} value={value} onChange={onChange} />;
  }
  return null;
}

function Option({ on, label, onClick, round }: { on: boolean; label: string; onClick: () => void; round?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`nb-opt ${on ? '!bg-black !text-white' : ''}`}>
      <span>{label}</span>
      <span className={`w-6 h-6 shrink-0 border-[3px] flex items-center justify-center ${round ? 'rounded-full' : ''} ${on ? 'bg-lime-300 border-lime-300' : 'border-black bg-white'}`}>
        {on && <Check size={16} strokeWidth={4} />}
      </span>
    </button>
  );
}

function Choice({ q, value, onChange }: any) {
  const opts = normOpts(q.options).filter((o) => o.label?.trim());
  const multiple = !!q.config?.multiple, allowOther = !!q.config?.allow_other;
  const otherLabel = q.config?.other_label?.trim() || 'Lainnya';
  const sel: string[] = value?.choices ?? [];
  const hasOther = value?.other !== undefined;
  const emit = (choices: string[], other?: string) => onChange({ choices, ...(other !== undefined ? { other } : {}) });
  const pick = (l: string) => (multiple ? emit(sel.includes(l) ? sel.filter((x) => x !== l) : [...sel, l], value?.other) : emit([l]));
  const pickOther = () => (hasOther ? emit(sel) : emit(multiple ? sel : [], ''));
  return (
    <div className="space-y-3">
      {opts.map((o) => <Option key={o.label} round={!multiple} on={sel.includes(o.label)} label={o.label} onClick={() => pick(o.label)} />)}
      {allowOther && <Option round={!multiple} on={hasOther} label={otherLabel} onClick={pickOther} />}
      {allowOther && hasOther && (
        <input className="nb-input w-full" placeholder="Tulis jawabanmu (opsional)" value={value.other} onChange={(e) => emit(sel, e.target.value)} />
      )}
      <p className="text-sm font-bold">{multiple ? 'Boleh pilih lebih dari satu' : 'Pilih salah satu'}</p>
    </div>
  );
}

const BG = ['bg-yellow-200', 'bg-lime-200', 'bg-pink-200', 'bg-sky-200'];
function Sliders({ q, value, onChange }: any) {
  const items = sliderItems(q);
  const v = value ?? {};
  useEffect(() => {
    const init = { ...v }; let changed = false;
    items.forEach((s) => { if (typeof init[s.id] !== 'number') { init[s.id] = Math.round((s.min + s.max) / 2); changed = true; } });
    if (changed) onChange(init);
  }, []); // eslint-disable-line
  return (
    <div className="space-y-5">
      {items.map((s, i) => (
        <div key={s.id} className={`border-[3px] border-black p-4 shadow-[3px_3px_0_0_var(--ink-c)] ${BG[i % BG.length]}`}>
          <div className="flex justify-between gap-3 font-extrabold uppercase mb-3">
            <span>{s.label}</span><span className="bg-black text-white px-2 h-fit">{v[s.id] ?? Math.round((s.min + s.max) / 2)}</span>
          </div>
          <input type="range" min={s.min} max={s.max} step={1} value={v[s.id] ?? Math.round((s.min + s.max) / 2)}
            onChange={(e) => onChange({ ...v, [s.id]: +e.target.value })} aria-label={s.label} />
          {(s.left || s.right) && <div className="flex justify-between gap-3 text-xs font-bold mt-2"><span>{s.left}</span><span className="text-right">{s.right}</span></div>}
        </div>
      ))}
    </div>
  );
}

const FACES = [Frown, Annoyed, Meh, Smile, Laugh];
const FACE_BG = ['bg-red-300', 'bg-orange-300', 'bg-yellow-200', 'bg-lime-200', 'bg-green-300'];
function Rating({ q, value, onChange }: any) {
  const N = points(q);
  return (
    <div className="space-y-2">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
        {Array.from({ length: N }, (_, i) => {
          const F = N === 5 ? FACES[i] : null;
          return (
            <button type="button" key={i} onClick={() => onChange(i + 1)}
              className={`flex flex-col items-center gap-1 border-[3px] border-black py-4 transition-all ${N === 5 ? FACE_BG[i] : 'bg-yellow-200'} ${value === i + 1 ? 'translate-x-[3px] translate-y-[3px] ring-4 ring-black' : 'shadow-[3px_3px_0_0_var(--ink-c)]'}`}>
              {F && <F size={28} strokeWidth={2.5} />}<span className="text-sm font-extrabold">{i + 1}</span>
            </button>
          );
        })}
      </div>
      {(q.config?.low_label || q.config?.high_label) && (
        <div className="flex justify-between gap-3 text-xs font-bold"><span>{q.config?.low_label}</span><span className="text-right">{q.config?.high_label}</span></div>
      )}
    </div>
  );
}

function Swipe({ q, value = {}, onChange }: any) {
  const list = getCards(q).filter((c) => c.label?.trim());
  const found = list.findIndex((c) => !value?.[cardKey(c)]);
  const idx = found === -1 ? list.length : found;
  const scope = useRef<HTMLDivElement>(null);
  const decide = (choice: 'left' | 'right') => {
    const el = scope.current?.querySelector('[data-card]') as HTMLElement | null;
    if (!el || idx >= list.length) return;
    const dir = choice === 'right' ? 1 : -1;
    gsap.to(el, { x: dir * 420, rotation: dir * 18, opacity: 0, duration: 0.25, onComplete: () => onChange({ ...value, [cardKey(list[idx])]: choice }) });
  };
  useGSAP(() => {
    const el = scope.current?.querySelector('[data-card]') as HTMLElement | null;
    if (!el) return;
    gsap.fromTo(el, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
    const [d] = Draggable.create(el, {
      type: 'x',
      onDrag() { gsap.set(this.target, { rotation: this.x / 14 }); },
      onDragEnd() {
        if (Math.abs(this.x) > 90) decide(this.x > 0 ? 'right' : 'left');
        else gsap.to(this.target, { x: 0, rotation: 0, duration: 0.3 });
      },
    });
    return () => d.kill();
  }, { dependencies: [idx], scope });
  const c = q.config ?? {};
  const Icon = idx < list.length ? (CARD_ICONS[list[idx].icon ?? ''] ?? { Icon: ShoppingBag }).Icon : ShoppingBag;
  return (
    <div ref={scope} className="space-y-5">
      <div className="relative h-60 flex items-center justify-center select-none touch-pan-y">
        {idx < list.length ? (
          <div key={idx} data-card className="absolute w-64 h-56 border-[3px] border-black bg-pink-300 shadow-[6px_6px_0_0_var(--ink-c)] flex flex-col items-center justify-center gap-4 cursor-grab">
            <Icon size={64} strokeWidth={2.5} />
            <span className="font-extrabold uppercase text-center px-3 leading-tight">{list[idx].label}</span>
          </div>
        ) : (
          <p className="nb-tag !bg-lime-300 !text-base"><Check size={18} strokeWidth={4} /> Semua kartu selesai</p>
        )}
      </div>
      {idx < list.length && (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => decide('left')} className="nb-btn !bg-white !px-2 !text-xs"><ArrowLeft size={16} strokeWidth={3} />{c.left_label || 'Kiri'}</button>
          <button type="button" onClick={() => decide('right')} className="nb-btn !bg-lime-300 !px-2 !text-xs">{c.right_label || 'Kanan'}<ArrowRight size={16} strokeWidth={3} /></button>
        </div>
      )}
      <p className="text-center text-sm font-bold">{Math.min(idx + 1, list.length)}/{list.length}</p>
    </div>
  );
}

function Branching({ q, value = {}, onChange }: any) {
  const opts = normOpts(q.options).filter((o) => o.label?.trim());
  const cur = opts.find((o) => o.label === value?.choice);
  const f = cur?.followup?.title && cur.followup.options?.length ? cur.followup : null;
  const box = useRef<HTMLDivElement>(null);
  useGSAP(() => { if (f) gsap.from(box.current, { opacity: 0, y: 20, duration: 0.35 }); }, { dependencies: [cur?.label] });
  return (
    <div className="space-y-3">
      {opts.map((o) => <Option key={o.label} round on={value?.choice === o.label} label={o.label} onClick={() => onChange({ choice: o.label })} />)}
      {f && (
        <div ref={box} className="pt-4 space-y-3 border-t-[3px] border-black border-dashed">
          <p className="font-extrabold">{f.title}</p>
          {f.options.filter((x: string) => x?.trim()).map((o: string) => <Option key={o} round on={value?.followup === o} label={o} onClick={() => onChange({ ...value, followup: o })} />)}
        </div>
      )}
    </div>
  );
}

function OpenText({ q, value, onChange }: any) {
  const ph = q.config?.placeholder || 'Tulis jawabanmu...';
  return q.config?.multiline === false
    ? <input className="nb-input w-full" placeholder={ph} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    : <textarea className="nb-input w-full" rows={5} placeholder={ph} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
}
