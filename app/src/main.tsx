import React from 'react';
import ReactDOM from 'react-dom/client';
import { Calculator, Download, PiggyBank, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};
type Frequency = 1 | 2 | 4 | 12 | 365;
type Inputs = {
  initialCapital: number;
  periodicContribution: number;
  contributionFrequency: Frequency;
  annualInterestRate: number;
  capitalizationFrequency: Frequency;
  years: number;
};
type YearRow = { year: number; total: number; contributed: number; interest: number };

const defaultInputs: Inputs = {
  initialCapital: 5000,
  periodicContribution: 250,
  contributionFrequency: 12,
  annualInterestRate: 7,
  capitalizationFrequency: 12,
  years: 20
};

const frequencyOptions: Array<{ label: string; value: Frequency }> = [
  { label: 'Anual', value: 1 },
  { label: 'Semestral', value: 2 },
  { label: 'Trimestral', value: 4 },
  { label: 'Mensual', value: 12 },
  { label: 'Diaria', value: 365 }
];

const contributionOptions: Array<{ label: string; value: Frequency }> = [
  { label: 'Anual', value: 1 },
  { label: 'Trimestral', value: 4 },
  { label: 'Mensual', value: 12 }
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
    if (month % contributionMonths === 0) {
      balance += inputs.periodicContribution;
      contributed += inputs.periodicContribution;
    }
    if (month % capitalizationMonths === 0) {
      balance *= 1 + periodicRate;
    }
    if (month % 12 === 0) {
      rows.push({ year: month / 12, total: balance, contributed, interest: balance - contributed });
    }
  }

  if (rows.length === 0) rows.push({ year: 0, total: balance, contributed, interest: 0 });
  return rows;
}

const currency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
});
const compactCurrency = new Intl.NumberFormat('es-ES', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const numberFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

function formatReturn(row: YearRow) {
  if (row.contributed <= 0) return '0%';
  return `${numberFormatter.format((row.interest / row.contributed) * 100)}%`;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => setMatches(media.matches);

    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(standaloneQuery.matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
  };

  return { canInstall: Boolean(installPrompt), install, isInstalled };
}

function Field({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const [draftValue, setDraftValue] = React.useState(String(value));
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) setDraftValue(String(value));
  }, [isEditing, value]);

  const normalize = (nextValue: number) => {
    if (min !== undefined && nextValue < min) return min;
    if (max !== undefined && nextValue > max) return max;
    return nextValue;
  };

  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <div className="flex min-w-0 items-center rounded-2xl border border-slate-700 bg-slate-900/80 px-4 focus-within:border-blue-400">
        <input
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none"
          type="number"
          value={draftValue}
          min={min}
          max={max}
          step={step}
          onFocus={() => {
            setIsEditing(true);
            setDraftValue(value === 0 ? '' : String(value));
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDraftValue(nextValue);
            if (nextValue !== '') onChange(Number(nextValue));
          }}
          onBlur={() => {
            const normalizedValue = normalize(draftValue === '' ? min ?? 0 : Number(draftValue));
            setIsEditing(false);
            setDraftValue(String(normalizedValue));
            onChange(normalizedValue);
          }}
        />
        {suffix ? <span className="shrink-0 pl-2 text-sm text-slate-400">{suffix}</span> : null}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: Frequency;
  options: Array<{ label: string; value: Frequency }>;
  onChange: (value: Frequency) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <select
        className="w-full min-w-0 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white outline-none focus:border-blue-400"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as Frequency)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur sm:p-5">
      <div className="mb-3 flex items-center gap-3 text-slate-300">
        <div className="shrink-0 rounded-xl bg-blue-500/20 p-2 text-blue-200">{icon}</div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="break-words text-2xl font-bold tracking-tight text-white lg:text-3xl">{value}</p>
    </div>
  );
}

function App() {
  const [inputs, setInputs] = React.useState<Inputs>(defaultInputs);
  const rows = React.useMemo(() => calculateCompoundInterest(inputs), [inputs]);
  const final = rows[rows.length - 1];
  const isSmallScreen = useMediaQuery('(max-width: 639px)');
  const { canInstall, install, isInstalled } = useInstallPrompt();
  const update = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((current) => ({ ...current, [key]: value }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:gap-8 lg:px-8">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur sm:p-6 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-100 sm:text-sm">
            <Calculator size={16} /> PWA instalable
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {'Calculadora de inter\u00e9s compuesto'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            {'Simula el crecimiento de tu inversi\u00f3n con capital inicial, aportaciones peri\u00f3dicas y distintas frecuencias de capitalizaci\u00f3n.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100 md:max-w-[250px] md:p-4">
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-300/25 disabled:text-emerald-50/60"
            type="button"
            onClick={install}
            disabled={!canInstall || isInstalled}
          >
            <Download className="shrink-0" size={18} />
            {isInstalled ? 'App instalada' : 'Instalar app'}
          </button>
          <span>
            {canInstall
              ? 'Instala la calculadora para abrirla como app.'
              : 'Si el bot\u00f3n no est\u00e1 activo, usa la opci\u00f3n de instalar del navegador.'}
          </span>
        </div>
      </header>

      <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:gap-6">
        <form className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-soft backdrop-blur sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-white sm:mb-5 sm:text-xl">
            {'Datos de la inversi\u00f3n'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Field
              label="Capital inicial"
              value={inputs.initialCapital}
              min={0}
              step={100}
              suffix={'\u20ac'}
              onChange={(value) => update('initialCapital', value)}
            />
            <Field
              label={'Aportaci\u00f3n peri\u00f3dica'}
              value={inputs.periodicContribution}
              min={0}
              step={25}
              suffix={'\u20ac'}
              onChange={(value) => update('periodicContribution', value)}
            />
            <SelectField
              label={'Frecuencia de aportaci\u00f3n'}
              value={inputs.contributionFrequency}
              options={contributionOptions}
              onChange={(value) => update('contributionFrequency', value)}
            />
            <Field
              label={'Inter\u00e9s anual'}
              value={inputs.annualInterestRate}
              min={0}
              max={100}
              step={0.1}
              suffix="%"
              onChange={(value) => update('annualInterestRate', value)}
            />
            <SelectField
              label={'Capitalizaci\u00f3n'}
              value={inputs.capitalizationFrequency}
              options={frequencyOptions}
              onChange={(value) => update('capitalizationFrequency', value)}
            />
            <Field
              label={'Duraci\u00f3n'}
              value={inputs.years}
              min={1}
              max={80}
              step={1}
              suffix={'a\u00f1os'}
              onChange={(value) => update('years', value)}
            />
          </div>
        </form>

        <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard title="Valor final" value={currency.format(final.total)} icon={<TrendingUp size={20} />} />
            <StatCard title="Total aportado" value={currency.format(final.contributed)} icon={<PiggyBank size={20} />} />
            <StatCard title="Intereses" value={currency.format(final.interest)} icon={<Calculator size={20} />} />
          </div>

          <section className="min-w-0 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">{'Evoluci\u00f3n'}</h2>
            <div className="h-64 w-full sm:h-80 lg:h-96">
              <ResponsiveContainer>
                <AreaChart
                  data={rows}
                  margin={{ top: 8, right: isSmallScreen ? 4 : 8, left: isSmallScreen ? -20 : 0, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, .18)" />
                  <XAxis dataKey="year" stroke="#94a3b8" tickFormatter={(year) => `${year}a`} />
                  <YAxis
                    stroke="#94a3b8"
                    tickFormatter={(value) =>
                      isSmallScreen ? compactCurrency.format(Number(value)) : currency.format(Number(value))
                    }
                    width={isSmallScreen ? 58 : 82}
                  />
                  <Tooltip
                    contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,.25)', borderRadius: 16 }}
                    formatter={(value: number) => currency.format(value)}
                    labelFormatter={(label) => `A\u00f1o ${label}`}
                  />
                  <Area type="monotone" dataKey="total" name="Valor total" stroke="#60a5fa" fill="url(#totalGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-soft backdrop-blur">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <h2 className="text-lg font-bold text-white sm:text-xl">Tabla anual</h2>
        </div>

        <div className="grid gap-3 p-3 sm:hidden">
          {rows.map((row) => (
            <article key={row.year} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{`A\u00f1o ${row.year}`}</h3>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-100">
                  {formatReturn(row)}
                </span>
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Valor total</dt>
                  <dd className="font-medium text-white">{currency.format(row.total)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Aportado</dt>
                  <dd className="font-medium text-slate-200">{currency.format(row.contributed)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">{'Inter\u00e9s'}</dt>
                  <dd className="font-medium text-slate-200">{currency.format(row.interest)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-4 py-3 sm:px-5">{'A\u00f1o'}</th>
                <th className="px-4 py-3 sm:px-5">Valor total</th>
                <th className="px-4 py-3 sm:px-5">Aportado</th>
                <th className="px-4 py-3 sm:px-5">{'Inter\u00e9s generado'}</th>
                <th className="px-4 py-3 sm:px-5">Rentabilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              {rows.map((row) => (
                <tr key={row.year}>
                  <td className="px-4 py-3 font-semibold text-white sm:px-5">{row.year}</td>
                  <td className="px-4 py-3 sm:px-5">{currency.format(row.total)}</td>
                  <td className="px-4 py-3 sm:px-5">{currency.format(row.contributed)}</td>
                  <td className="px-4 py-3 sm:px-5">{currency.format(row.interest)}</td>
                  <td className="px-4 py-3 sm:px-5">{formatReturn(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
