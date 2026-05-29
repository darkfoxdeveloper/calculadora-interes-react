import React from 'react';
import ReactDOM from 'react-dom/client';
import { Calculator, Download, PiggyBank, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

type Frequency = 1 | 2 | 4 | 12 | 365;
type Inputs = { initialCapital: number; periodicContribution: number; contributionFrequency: Frequency; annualInterestRate: number; capitalizationFrequency: Frequency; years: number };
type YearRow = { year: number; total: number; contributed: number; interest: number };

const defaultInputs: Inputs = { initialCapital: 5000, periodicContribution: 250, contributionFrequency: 12, annualInterestRate: 7, capitalizationFrequency: 12, years: 20 };
const frequencyOptions: Array<{ label: string; value: Frequency }> = [
  { label: 'Anual', value: 1 }, { label: 'Semestral', value: 2 }, { label: 'Trimestral', value: 4 }, { label: 'Mensual', value: 12 }, { label: 'Diaria', value: 365 }
];
const contributionOptions: Array<{ label: string; value: Frequency }> = [
  { label: 'Anual', value: 1 }, { label: 'Trimestral', value: 4 }, { label: 'Mensual', value: 12 }
];

function calculateCompoundInterest(inputs: Inputs): YearRow[] {
  const months = Math.max(0, Math.round(inputs.years * 12));
  const periodicRate = inputs.annualInterestRate / 100 / inputs.capitalizationFrequency;
  const capitalizationMonths = 12 / inputs.capitalizationFrequency;
  const contributionMonths = 12 / inputs.contributionFrequency;
  let balance = inputs.initialCapital;
  let contributed = inputs.initialCapital;
  const rows: YearRow[] = [];

  for (let month = 1; month <= months; month += 1) {
    if (month % contributionMonths === 0) { balance += inputs.periodicContribution; contributed += inputs.periodicContribution; }
    if (month % capitalizationMonths === 0) { balance *= 1 + periodicRate; }
    if (month % 12 === 0) rows.push({ year: month / 12, total: balance, contributed, interest: balance - contributed });
  }
  if (rows.length === 0) rows.push({ year: 0, total: balance, contributed, interest: 0 });
  return rows;
}

const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

function Field({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min?: number; max?: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">{label}</span><div className="flex items-center rounded-2xl border border-slate-700 bg-slate-900/80 px-4 focus-within:border-blue-400"><input className="w-full bg-transparent py-3 text-base text-white outline-none" type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />{suffix ? <span className="text-sm text-slate-400">{suffix}</span> : null}</div></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: Frequency; options: Array<{ label: string; value: Frequency }>; onChange: (value: Frequency) => void }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">{label}</span><select className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white outline-none focus:border-blue-400" value={value} onChange={(event) => onChange(Number(event.target.value) as Frequency)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-soft backdrop-blur"><div className="mb-3 flex items-center gap-3 text-slate-300"><div className="rounded-2xl bg-blue-500/20 p-2 text-blue-200">{icon}</div><span className="text-sm font-medium">{title}</span></div><p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{value}</p></div>;
}

function App() {
  const [inputs, setInputs] = React.useState<Inputs>(defaultInputs);
  const rows = React.useMemo(() => calculateCompoundInterest(inputs), [inputs]);
  const final = rows[rows.length - 1];
  const update = <K extends keyof Inputs>(key: K, value: Inputs[K]) => setInputs((current) => ({ ...current, [key]: value }));

  return <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
    <header className="flex flex-col justify-between gap-5 rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-soft backdrop-blur md:flex-row md:items-center">
      <div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-100"><Calculator size={16} /> PWA instalable</div><h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Calculadora de interés compuesto</h1><p className="mt-3 max-w-2xl text-slate-300">Simula el crecimiento de tu inversión con capital inicial, aportaciones periódicas y distintas frecuencias de capitalización.</p></div>
      <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100"><Download className="mb-2" size={22} />En móvil o escritorio, usa “Instalar app” desde el navegador.</div>
    </header>

    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur sm:p-6"><h2 className="mb-5 text-xl font-bold text-white">Datos de la inversión</h2><div className="grid gap-4"><Field label="Capital inicial" value={inputs.initialCapital} min={0} step={100} suffix="€" onChange={(value) => update('initialCapital', value)} /><Field label="Aportación periódica" value={inputs.periodicContribution} min={0} step={25} suffix="€" onChange={(value) => update('periodicContribution', value)} /><SelectField label="Frecuencia de aportación" value={inputs.contributionFrequency} options={contributionOptions} onChange={(value) => update('contributionFrequency', value)} /><Field label="Interés anual" value={inputs.annualInterestRate} min={0} max={100} step={0.1} suffix="%" onChange={(value) => update('annualInterestRate', value)} /><SelectField label="Capitalización" value={inputs.capitalizationFrequency} options={frequencyOptions} onChange={(value) => update('capitalizationFrequency', value)} /><Field label="Duración" value={inputs.years} min={1} max={80} step={1} suffix="años" onChange={(value) => update('years', value)} /></div></form>
      <div className="flex flex-col gap-6"><div className="grid gap-4 sm:grid-cols-3"><StatCard title="Valor final" value={currency.format(final.total)} icon={<TrendingUp size={20} />} /><StatCard title="Total aportado" value={currency.format(final.contributed)} icon={<PiggyBank size={20} />} /><StatCard title="Intereses" value={currency.format(final.interest)} icon={<Calculator size={20} />} /></div><section className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur sm:p-6"><h2 className="mb-4 text-xl font-bold text-white">Evolución</h2><div className="h-72 w-full sm:h-96"><ResponsiveContainer><AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}><defs><linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, .18)" /><XAxis dataKey="year" stroke="#94a3b8" tickFormatter={(year) => `${year}a`} /><YAxis stroke="#94a3b8" tickFormatter={(value) => currency.format(Number(value))} width={82} /><Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,.25)', borderRadius: 16 }} formatter={(value: number) => currency.format(value)} labelFormatter={(label) => `Año ${label}`} /><Area type="monotone" dataKey="total" name="Valor total" stroke="#60a5fa" fill="url(#totalGradient)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div></section></div>
    </section>

    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-soft backdrop-blur"><div className="border-b border-white/10 p-5"><h2 className="text-xl font-bold text-white">Tabla anual</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-white/5 text-slate-300"><tr><th className="px-5 py-3">Año</th><th className="px-5 py-3">Valor total</th><th className="px-5 py-3">Aportado</th><th className="px-5 py-3">Interés generado</th><th className="px-5 py-3">Rentabilidad</th></tr></thead><tbody className="divide-y divide-white/10 text-slate-200">{rows.map((row) => <tr key={row.year}><td className="px-5 py-3 font-semibold text-white">{row.year}</td><td className="px-5 py-3">{currency.format(row.total)}</td><td className="px-5 py-3">{currency.format(row.contributed)}</td><td className="px-5 py-3">{currency.format(row.interest)}</td><td className="px-5 py-3">{numberFormatter.format((row.interest / row.contributed) * 100)}%</td></tr>)}</tbody></table></div></section>
  </main>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
