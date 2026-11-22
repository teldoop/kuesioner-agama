'use client';
import { ArrowDown, ArrowUp, Info, MessageSquarePlus, Plus, Trash2, X } from 'lucide-react';
import { CARD_ICONS } from '@/lib/cardIcons';
import { uid, type Card, type Opt, type SliderItem } from '@/lib/qutil';
import type { QType } from '@/lib/types';

export const inp = 'nb-input w-full min-w-0 text-sm';
const iconBtn = 'nb-btn nb-btn-sm !px-2 shrink-0';

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-extrabold uppercase">{label}</div>
      {children}
      {hint && <p className="text-xs font-semibold opacity-80">{hint}</p>}
    </div>
  );
}
export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm font-bold cursor-pointer">
      <input type="checkbox" className="w-5 h-5 accent-black mt-0.5 shrink-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}{hint && <span className="block text-xs font-semibold opacity-80">{hint}</span>}</span>
    </label>
  );
}
function swap<T>(arr: T[], i: number, d: number) { const n = [...arr], j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; }
function Mover({ i, len, onChange, items, min }: { i: number; len: number; items: any[]; onChange: (l: any[]) => void; min: number }) {
  return (
    <>
      <button type="button" onClick={() => onChange(swap(items, i, -1))} disabled={i === 0} className={`${iconBtn} !bg-white`} aria-label="Naikkan"><ArrowUp size={14} strokeWidth={3} /></button>
      <button type="button" onClick={() => onChange(swap(items, i, 1))} disabled={i === len - 1} className={`${iconBtn} !bg-white`} aria-label="Turunkan"><ArrowDown size={14} strokeWidth={3} /></button>
      <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} disabled={len <= min} className={`${iconBtn} !bg-red-300`} aria-label="Hapus"><Trash2 size={14} strokeWidth={3} /></button>
    </>
  );
}

export function ListEditor({ items, onChange, placeholder = 'Tulis pilihan...', min = 0, addLabel = 'Tambah pilihan' }:
  { items: string[]; onChange: (l: string[]) => void; placeholder?: string; min?: number; addLabel?: string }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <span className="nb-tag !bg-yellow-300 shrink-0">{i + 1}</span>
          <input className={`${inp} flex-1 min-w-[8rem]`} value={it} placeholder={placeholder} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} />
          <Mover i={i} len={items.length} items={items} onChange={onChange} min={min} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])} className="nb-btn nb-btn-sm !bg-white"><Plus size={14} strokeWidth={3} /> {addLabel}</button>
    </div>
  );
}

function OptionRows({ items, onChange, followups }: { items: Opt[]; onChange: (l: Opt[]) => void; followups?: boolean }) {
  const set = (i: number, patch: Partial<Opt>) => onChange(items.map((o, k) => (k === i ? { ...o, ...patch } : o)));
  return (
    <div className="space-y-2">
      {items.map((o, i) => (
        <div key={i} className="border-[3px] border-black p-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="nb-tag !bg-yellow-300 shrink-0">{i + 1}</span>
            <input className={`${inp} flex-1 min-w-[8rem]`} placeholder="Tulis pilihan..." value={o.label} onChange={(e) => set(i, { label: e.target.value })} />
            <input type="number" min={0} max={100} className={`${inp} !w-20 shrink-0`} placeholder="Poin" title="Poin 0-100 untuk tipe hasil akhir (opsional)"
              value={o.score ?? ''} onChange={(e) => set(i, { score: e.target.value === '' ? null : Math.max(0, Math.min(100, +e.target.value)) })} />
            <Mover i={i} len={items.length} items={items} onChange={onChange} min={2} />
          </div>
          {followups && (o.followup ? (
            <div className="border-l-[3px] border-black pl-3 space-y-2">
              <div className="flex items-center gap-2">
                <input className={inp} placeholder="Pertanyaan lanjutan untuk pilihan ini..." value={o.followup.title} onChange={(e) => set(i, { followup: { ...o.followup!, title: e.target.value } })} />
                <button type="button" onClick={() => set(i, { followup: null })} className={`${iconBtn} !bg-white`} aria-label="Hapus pertanyaan lanjutan"><X size={14} strokeWidth={3} /></button>
              </div>
              <ListEditor items={o.followup.options} min={2} addLabel="Tambah jawaban lanjutan" onChange={(l) => set(i, { followup: { ...o.followup!, options: l } })} />
            </div>
          ) : (
            <button type="button" onClick={() => set(i, { followup: { title: '', options: ['', ''] } })} className="nb-btn nb-btn-sm !bg-sky-300"><MessageSquarePlus size={14} strokeWidth={3} /> Tambah pertanyaan lanjutan</button>
          ))}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { label: '' }])} className="nb-btn nb-btn-sm !bg-white"><Plus size={14} strokeWidth={3} /> Tambah pilihan</button>
    </div>
  );
}

export default function QuestionForm({ type, options, config, onChange }:
  { type: QType; options: any; config: any; onChange: (options: any, config: any) => void }) {
  const setCfg = (patch: any) => onChange(options, { ...config, ...patch });
  const text = (key: string, label: string, hint?: string) => (
    <Field label={label} hint={hint}><input className={inp} value={config[key] ?? ''} onChange={(e) => setCfg({ [key]: e.target.value })} /></Field>
  );
  const scoreHint = 'Isi "Poin" (0-100) di setiap pilihan jika ingin dihitung untuk tipe hasil akhir. Kosongkan jika tidak.';

  if (type === 'multiple_choice') return (
    <div className="space-y-4">
      <Field label="Cara memilih">
        <select className={inp} value={config.multiple ? 'multi' : 'single'} onChange={(e) => setCfg({ multiple: e.target.value === 'multi' })}>
          <option value="single">Pilih salah satu</option>
          <option value="multi">Boleh pilih lebih dari satu (tanpa batas)</option>
        </select>
      </Field>
      <Field label="Pilihan jawaban" hint={scoreHint}><OptionRows items={options ?? []} onChange={(l) => onChange(l, config)} /></Field>
      <Toggle checked={!!config.allow_other} onChange={(v) => setCfg({ allow_other: v })} label='Tambahkan pilihan "Lainnya"' hint="Responden boleh mengisi teks sendiri; mengisinya tidak wajib." />
      {config.allow_other && <Field label='Teks pilihan "Lainnya"'><input className={inp} placeholder="Lainnya" value={config.other_label ?? ''} onChange={(e) => setCfg({ other_label: e.target.value })} /></Field>}
    </div>
  );

  if (type === 'branching_choice') return (
    <div className="space-y-4">
      <p className="text-xs font-semibold flex gap-2"><Info size={16} strokeWidth={3} className="shrink-0" /> Responden memilih salah satu. Tiap pilihan boleh punya pertanyaan lanjutan yang hanya muncul jika pilihan itu dipilih.</p>
      <Field label="Pilihan jawaban" hint={scoreHint}><OptionRows followups items={options ?? []} onChange={(l) => onChange(l, config)} /></Field>
    </div>
  );

  if (type === 'slider') {
    const items: SliderItem[] = options ?? [];
    const set = (i: number, patch: Partial<SliderItem>) => onChange(items.map((s, k) => (k === i ? { ...s, ...patch } : s)), config);
    const num = (v: string) => (v === '' ? 0 : +v);
    return (
      <div className="space-y-4">
        <Field label="Slider" hint="Boleh satu atau lebih. Tiap slider punya judul dan rentang nilainya sendiri.">
          <div className="space-y-3">
            {items.map((s, i) => (
              <div key={s.id} className="border-[3px] border-black p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="nb-tag !bg-yellow-300 shrink-0">{i + 1}</span>
                  <input className={`${inp} flex-1 min-w-[8rem]`} placeholder="Judul slider..." value={s.label} onChange={(e) => set(i, { label: e.target.value })} />
                  <Mover i={i} len={items.length} items={items} onChange={(l) => onChange(l, config)} min={1} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-bold">Nilai terendah <input type="number" className={inp} value={s.min} onChange={(e) => set(i, { min: num(e.target.value) })} /></label>
                  <label className="text-xs font-bold">Nilai tertinggi <input type="number" className={inp} value={s.max} onChange={(e) => set(i, { max: num(e.target.value) })} /></label>
                  <label className="text-xs font-bold">Keterangan ujung kiri <input className={inp} value={s.left ?? ''} onChange={(e) => set(i, { left: e.target.value })} /></label>
                  <label className="text-xs font-bold">Keterangan ujung kanan <input className={inp} value={s.right ?? ''} onChange={(e) => set(i, { right: e.target.value })} /></label>
                </div>
                <Toggle checked={!!s.scored} onChange={(v) => set(i, { scored: v })} label="Ikut dihitung untuk tipe hasil akhir" hint="Nilai makin tinggi = skor makin tinggi." />
              </div>
            ))}
            <button type="button" onClick={() => onChange([...items, { id: uid(), label: '', min: 0, max: 100 }], config)} className="nb-btn nb-btn-sm !bg-white"><Plus size={14} strokeWidth={3} /> Tambah slider</button>
          </div>
        </Field>
      </div>
    );
  }

  if (type === 'rating') return (
    <div className="space-y-4">
      <Field label="Jumlah tingkat skala" hint="Skala dimulai dari 1. Ikon wajah tampil jika memakai 5 tingkat.">
        <select className={inp} value={config.points ?? 5} onChange={(e) => setCfg({ points: +e.target.value })}>
          {[3, 4, 5, 6, 7, 10].map((n) => <option key={n} value={n}>{n} tingkat</option>)}
        </select>
      </Field>
      {text('low_label', 'Keterangan nilai terendah (1)')}
      {text('high_label', 'Keterangan nilai tertinggi')}
      <Toggle checked={!!config.scored} onChange={(v) => setCfg({ scored: v })} label="Ikut dihitung untuk tipe hasil akhir" hint="Nilai makin tinggi = skor makin tinggi." />
    </div>
  );

  if (type === 'card_swipe') {
    const list: Card[] = options ?? [];
    const set = (i: number, patch: Partial<Card>) => onChange(list.map((c, k) => (k === i ? { ...c, ...patch } : c)), config);
    return (
      <div className="space-y-4">
        <Field label="Kartu" hint="Responden menggeser kartu satu per satu ke kiri atau ke kanan.">
          <div className="space-y-2">
            {list.map((c, i) => {
              const Icon = (CARD_ICONS[c.icon ?? ''] ?? CARD_ICONS.bag).Icon;
              return (
                <div key={c.id ?? i} className="flex flex-wrap items-center gap-2">
                  <span className="nb-tag !bg-pink-300 shrink-0"><Icon size={16} strokeWidth={3} /></span>
                  <input className={`${inp} flex-1 min-w-[8rem]`} placeholder="Teks kartu..." value={c.label} onChange={(e) => set(i, { label: e.target.value })} />
                  <select className={`${inp} !w-32 shrink-0`} value={c.icon ?? 'bag'} aria-label="Ikon" onChange={(e) => set(i, { icon: e.target.value })}>
                    {Object.entries(CARD_ICONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <Mover i={i} len={list.length} items={list} onChange={(l) => onChange(l, config)} min={1} />
                </div>
              );
            })}
            <button type="button" onClick={() => onChange([...list, { id: uid(), label: '', icon: 'bag' }], config)} className="nb-btn nb-btn-sm !bg-white"><Plus size={14} strokeWidth={3} /> Tambah kartu</button>
          </div>
        </Field>
        {text('left_label', 'Teks tombol kiri (geser ke kiri)')}
        {text('right_label', 'Teks tombol kanan (geser ke kanan)')}
        <Toggle checked={!!config.scored} onChange={(v) => setCfg({ scored: v })} label="Ikut dihitung untuk tipe hasil akhir" hint="Geser kanan = skor tinggi, kiri = skor rendah." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toggle checked={config.multiline !== false} onChange={(v) => setCfg({ multiline: v })} label="Jawaban panjang (kotak teks besar)" />
      {text('placeholder', 'Teks petunjuk di dalam kotak (opsional)')}
    </div>
  );
}
