import React from 'react';
import ReactDOM from 'react-dom/client';
import { BarChart3, Calculator, ChevronDown, Download, FileDown, PiggyBank, RotateCcw, Save, Trash2, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};
type Frequency = 1 | 2 | 4 | 12 | 365;
type Language = 'es' | 'en';
type CurrencyCode = 'EUR' | 'USD' | 'GBP';
type ChartMode = 'total' | 'breakdown';
type Inputs = {
  initialCapital: number;
  periodicContribution: number;
  contributionFrequency: Frequency;
  annualInterestRate: number;
  errorMargin: number;
  monteCarloRuns: number;
  capitalizationFrequency: Frequency;
  years: number;
};
type YearRow = { year: number; total: number; contributed: number; interest: number };
type SavedConfig = { id: string; name: string; inputs: Inputs; createdAt: number };
type MonteCarloResult = {
  p10: number;
  p50: number;
  p90: number;
  lossProbability: number;
};

const savedConfigsKey = 'compound-interest-saved-configs';
const savedLanguageKey = 'compound-interest-language';
const savedCurrencyKey = 'compound-interest-currency';

const defaultInputs: Inputs = {
  initialCapital: 5000,
  periodicContribution: 250,
  contributionFrequency: 12,
  annualInterestRate: 7,
  errorMargin: 2,
  monteCarloRuns: 1000,
  capitalizationFrequency: 12,
  years: 20
};

const translations = {
  es: {
    appBadge: 'PWA instalable',
    title: 'Calculadora de inter\u00e9s compuesto',
    description:
      'Simula el crecimiento de tu inversi\u00f3n con capital inicial, aportaciones peri\u00f3dicas y distintas frecuencias de capitalizaci\u00f3n.',
    install: {
      installed: 'App instalada',
      install: 'Instalar app',
      ready: 'Instala la calculadora para abrirla como app.',
      fallback: 'Si el bot\u00f3n no est\u00e1 activo, usa la opci\u00f3n de instalar del navegador.'
    },
    language: {
      label: 'Idioma',
      spanish: 'Espa\u00f1ol',
      english: 'Ingl\u00e9s'
    },
    form: {
      title: 'Datos de la inversi\u00f3n',
      initialCapital: 'Capital inicial',
      periodicContribution: 'Aportaci\u00f3n peri\u00f3dica',
      contributionFrequency: 'Frecuencia de aportaci\u00f3n',
      annualInterestRate: 'Inter\u00e9s anual',
      errorMargin: 'Margen de error',
      monteCarloRuns: 'Simulaciones',
      capitalization: 'Capitalizaci\u00f3n',
      duration: 'Duraci\u00f3n',
      yearsSuffix: 'a\u00f1os'
    },
    controls: {
      reset: 'Restablecer valores',
      exportCsv: 'Exportar CSV',
      currency: 'Moneda'
    },
    frequencies: {
      annual: 'Anual',
      semiannual: 'Semestral',
      quarterly: 'Trimestral',
      monthly: 'Mensual',
      daily: 'Diaria'
    },
    configs: {
      title: 'Configuraciones',
      subtitle: 'Guarda escenarios y recup\u00e9ralos sin volver a introducir los datos.',
      placeholder: 'Nombre de la configuraci\u00f3n',
      save: 'Guardar',
      saveCurrent: 'Guardar actual',
      saved: 'Guardado',
      load: 'Cargar',
      empty: 'Todav\u00eda no hay configuraciones guardadas.',
      defaultName: 'Configuraci\u00f3n',
      delete: 'Borrar',
      savedOn: 'Guardado',
      compareTitle: 'Comparar presets',
      compareA: 'Primer preset',
      compareB: 'Segundo preset',
      compareHint: 'Guarda al menos dos configuraciones para compararlas.',
      difference: 'Diferencia'
    },
    stats: {
      finalValue: 'Valor final',
      contributed: 'Total aportado',
      interest: 'Intereses',
      gainPercent: 'Ganancia',
      estimatedRange: 'Rango estimado'
    },
    chart: {
      title: 'Evoluci\u00f3n',
      yearShort: 'a',
      yearLabel: 'A\u00f1o',
      totalName: 'Valor total',
      modeTotal: 'Total',
      modeBreakdown: 'Aportado vs intereses'
    },
    table: {
      title: 'Tabla anual',
      year: 'A\u00f1o',
      total: 'Valor total',
      contributed: 'Aportado',
      interest: 'Inter\u00e9s generado',
      interestShort: 'Inter\u00e9s',
      return: 'Rentabilidad'
    },
    risk: {
      bearish: 'Bajista',
      base: 'Base',
      bullish: 'Alcista',
      points: 'pp'
    },
    monteCarlo: {
      title: 'Monte Carlo',
      subtitle: 'Distribuci\u00f3n estimada usando el margen de error como volatilidad anual.',
      p10: 'P10',
      p50: 'Mediana',
      p90: 'P90',
      lossProbability: 'Prob. p\u00e9rdida',
      simulationsSuffix: 'sim.'
    },
    locale: 'es-ES'
  },
  en: {
    appBadge: 'Installable PWA',
    title: 'Compound interest calculator',
    description:
      'Simulate your investment growth with starting capital, recurring contributions, and different compounding frequencies.',
    install: {
      installed: 'App installed',
      install: 'Install app',
      ready: 'Install the calculator to open it as an app.',
      fallback: 'If the button is not active, use your browser install option.'
    },
    language: {
      label: 'Language',
      spanish: 'Spanish',
      english: 'English'
    },
    form: {
      title: 'Investment details',
      initialCapital: 'Starting capital',
      periodicContribution: 'Recurring contribution',
      contributionFrequency: 'Contribution frequency',
      annualInterestRate: 'Annual interest',
      errorMargin: 'Error margin',
      monteCarloRuns: 'Simulations',
      capitalization: 'Compounding',
      duration: 'Duration',
      yearsSuffix: 'years'
    },
    controls: {
      reset: 'Reset values',
      exportCsv: 'Export CSV',
      currency: 'Currency'
    },
    frequencies: {
      annual: 'Annual',
      semiannual: 'Semiannual',
      quarterly: 'Quarterly',
      monthly: 'Monthly',
      daily: 'Daily'
    },
    configs: {
      title: 'Configurations',
      subtitle: 'Save scenarios and restore them without entering the data again.',
      placeholder: 'Configuration name',
      save: 'Save',
      saveCurrent: 'Save current',
      saved: 'Saved',
      load: 'Load',
      empty: 'No saved configurations yet.',
      defaultName: 'Configuration',
      delete: 'Delete',
      savedOn: 'Saved',
      compareTitle: 'Compare presets',
      compareA: 'First preset',
      compareB: 'Second preset',
      compareHint: 'Save at least two configurations to compare them.',
      difference: 'Difference'
    },
    stats: {
      finalValue: 'Final value',
      contributed: 'Total contributed',
      interest: 'Interest',
      gainPercent: 'Gain',
      estimatedRange: 'Estimated range'
    },
    chart: {
      title: 'Growth',
      yearShort: 'yr',
      yearLabel: 'Year',
      totalName: 'Total value',
      modeTotal: 'Total',
      modeBreakdown: 'Contributed vs interest'
    },
    table: {
      title: 'Annual table',
      year: 'Year',
      total: 'Total value',
      contributed: 'Contributed',
      interest: 'Interest generated',
      interestShort: 'Interest',
      return: 'Return'
    },
    risk: {
      bearish: 'Bear',
      base: 'Base',
      bullish: 'Bull',
      points: 'pp'
    },
    monteCarlo: {
      title: 'Monte Carlo',
      subtitle: 'Estimated distribution using the error margin as annual volatility.',
      p10: 'P10',
      p50: 'Median',
      p90: 'P90',
      lossProbability: 'Loss prob.',
      simulationsSuffix: 'sim.'
    },
    locale: 'en-US'
  }
} as const;

const languageOptions: Array<{ value: Language; labelKey: 'spanish' | 'english'; flag: string }> = [
  { value: 'es', labelKey: 'spanish', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
  { value: 'en', labelKey: 'english', flag: '\uD83C\uDDEC\uD83C\uDDE7' }
];
const currencyOptions: Array<{ label: string; value: CurrencyCode }> = [
  { label: 'EUR', value: 'EUR' },
  { label: 'USD', value: 'USD' },
  { label: 'GBP', value: 'GBP' }
];

function getFrequencyOptions(language: Language) {
  const labels = translations[language].frequencies;
  return [
    { label: labels.annual, value: 1 },
    { label: labels.semiannual, value: 2 },
    { label: labels.quarterly, value: 4 },
    { label: labels.monthly, value: 12 },
    { label: labels.daily, value: 365 }
  ] satisfies Array<{ label: string; value: Frequency }>;
}

function getContributionOptions(language: Language) {
  const labels = translations[language].frequencies;
  return [
    { label: labels.annual, value: 1 },
    { label: labels.quarterly, value: 4 },
    { label: labels.monthly, value: 12 }
  ] satisfies Array<{ label: string; value: Frequency }>;
}

function calculateCompoundInterest(inputs: Inputs, annualInterestRate = inputs.annualInterestRate): YearRow[] {
  const months = Math.max(0, Math.round(inputs.years * 12));
  const periodicRate = annualInterestRate / 100 / inputs.capitalizationFrequency;
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

function randomNormal() {
  const first = Math.max(Number.MIN_VALUE, Math.random());
  const second = Math.random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function percentile(sortedValues: number[], target: number) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor((sortedValues.length - 1) * target)));
  return sortedValues[index];
}

function runMonteCarlo(inputs: Inputs): MonteCarloResult {
  const months = Math.max(0, Math.round(inputs.years * 12));
  const contributionMonths = 12 / inputs.contributionFrequency;
  const simulations = Math.max(100, Math.min(10000, Math.round(inputs.monteCarloRuns)));
  const monthlyMean = inputs.annualInterestRate / 100 / 12;
  const monthlyVolatility = inputs.errorMargin / 100 / Math.sqrt(12);
  const finals: number[] = [];
  let lossCount = 0;

  for (let simulation = 0; simulation < simulations; simulation += 1) {
    let balance = inputs.initialCapital;
    let contributed = inputs.initialCapital;

    for (let month = 1; month <= months; month += 1) {
      if (month % contributionMonths === 0) {
        balance += inputs.periodicContribution;
        contributed += inputs.periodicContribution;
      }

      const monthlyReturn = Math.max(-0.95, monthlyMean + randomNormal() * monthlyVolatility);
      balance *= 1 + monthlyReturn;
    }

    if (balance < contributed) lossCount += 1;
    finals.push(balance);
  }

  finals.sort((first, second) => first - second);
  return {
    p10: percentile(finals, 0.1),
    p50: percentile(finals, 0.5),
    p90: percentile(finals, 0.9),
    lossProbability: (lossCount / simulations) * 100
  };
}

function readSavedLanguage() {
  try {
    const savedValue = window.localStorage.getItem(savedLanguageKey);
    return savedValue === 'en' || savedValue === 'es' ? savedValue : 'es';
  } catch {
    return 'es';
  }
}

function readSavedCurrency() {
  try {
    const savedValue = window.localStorage.getItem(savedCurrencyKey);
    return savedValue === 'USD' || savedValue === 'GBP' || savedValue === 'EUR' ? savedValue : 'EUR';
  } catch {
    return 'EUR';
  }
}

function readSavedConfigs() {
  try {
    const savedValue = window.localStorage.getItem(savedConfigsKey);
    if (!savedValue) return [];
    const parsedValue = JSON.parse(savedValue);
    if (!Array.isArray(parsedValue)) return [];
    return parsedValue.map((config) => ({
      ...config,
      inputs: { ...defaultInputs, ...config.inputs }
    })) as SavedConfig[];
  } catch {
    return [];
  }
}

function createConfigId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

function LanguageSelector({
  language,
  onChange
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  const t = translations[language].language;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-1">
      <span className="sr-only">{t.label}</span>
      <div className="grid grid-cols-2 gap-1">
        {languageOptions.map((option) => {
          const isActive = language === option.value;

          return (
            <button
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                isActive ? 'bg-blue-400 text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
            >
              <span aria-hidden="true">{option.flag}</span>
              {option.value.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CurrencySelector({
  currencyCode,
  label,
  onChange
}: {
  currencyCode: CurrencyCode;
  label: string;
  onChange: (currency: CurrencyCode) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-700 bg-slate-900/80 p-1">
        {currencyOptions.map((option) => {
          const isActive = currencyCode === option.value;

          return (
            <button
              className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                isActive ? 'bg-blue-400 text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
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
  value: string | number;
  options: Array<{ label: string; value: string | number }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <div className="relative">
        <select
          className="w-full min-w-0 appearance-none rounded-2xl border border-slate-700 bg-slate-900/80 py-3 pl-4 pr-12 text-base text-white outline-none transition focus:border-blue-400"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
      </div>
    </label>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
      <div className="mb-2 flex items-center gap-2 text-slate-300">
        <div className="shrink-0 rounded-lg bg-blue-500/15 p-1.5 text-blue-200">{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-[0.08em]">{title}</span>
      </div>
      <p className="break-words text-xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

function App() {
  const [language, setLanguage] = React.useState<Language>(() => readSavedLanguage());
  const [currencyCode, setCurrencyCode] = React.useState<CurrencyCode>(() => readSavedCurrency());
  const [chartMode, setChartMode] = React.useState<ChartMode>('total');
  const [inputs, setInputs] = React.useState<Inputs>(defaultInputs);
  const [savedConfigs, setSavedConfigs] = React.useState<SavedConfig[]>(() => readSavedConfigs());
  const [configName, setConfigName] = React.useState('');
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saved'>('idle');
  const [compareIds, setCompareIds] = React.useState<{ first: string; second: string }>({ first: '', second: '' });
  const t = translations[language];
  const frequencyOptions = React.useMemo(() => getFrequencyOptions(language), [language]);
  const contributionOptions = React.useMemo(() => getContributionOptions(language), [language]);
  const currency = React.useMemo(
    () =>
      new Intl.NumberFormat(t.locale, {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 0
      }),
    [currencyCode, t.locale]
  );
  const compactCurrency = React.useMemo(
    () =>
      new Intl.NumberFormat(t.locale, {
        notation: 'compact',
        maximumFractionDigits: 1
      }),
    [t.locale]
  );
  const numberFormatter = React.useMemo(() => new Intl.NumberFormat(t.locale, { maximumFractionDigits: 2 }), [t.locale]);
  const rows = React.useMemo(() => calculateCompoundInterest(inputs), [inputs]);
  const final = rows[rows.length - 1];
  const bearishRate = Math.max(0, inputs.annualInterestRate - inputs.errorMargin);
  const bullishRate = inputs.annualInterestRate + inputs.errorMargin;
  const bearishRows = React.useMemo(() => calculateCompoundInterest(inputs, bearishRate), [bearishRate, inputs]);
  const bullishRows = React.useMemo(() => calculateCompoundInterest(inputs, bullishRate), [bullishRate, inputs]);
  const bearishFinal = bearishRows[bearishRows.length - 1];
  const bullishFinal = bullishRows[bullishRows.length - 1];
  const gainPercent = final.contributed > 0 ? (final.interest / final.contributed) * 100 : 0;
  const monteCarlo = React.useMemo(() => runMonteCarlo(inputs), [inputs]);
  const compareFirst = savedConfigs.find((config) => config.id === compareIds.first);
  const compareSecond = savedConfigs.find((config) => config.id === compareIds.second);
  const compareFirstRows = compareFirst ? calculateCompoundInterest(compareFirst.inputs) : [];
  const compareSecondRows = compareSecond ? calculateCompoundInterest(compareSecond.inputs) : [];
  const compareFirstFinal = compareFirstRows[compareFirstRows.length - 1];
  const compareSecondFinal = compareSecondRows[compareSecondRows.length - 1];
  const isSmallScreen = useMediaQuery('(max-width: 639px)');
  const { canInstall, install, isInstalled } = useInstallPrompt();
  const update = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((current) => ({ ...current, [key]: value }));
  const formatReturn = (row: YearRow) => {
    if (row.contributed <= 0) return '0%';
    return `${numberFormatter.format((row.interest / row.contributed) * 100)}%`;
  };
  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    window.localStorage.setItem(savedLanguageKey, nextLanguage);
  };
  const changeCurrency = (nextCurrency: CurrencyCode) => {
    setCurrencyCode(nextCurrency);
    window.localStorage.setItem(savedCurrencyKey, nextCurrency);
  };
  const persistConfigs = (configs: SavedConfig[]) => {
    setSavedConfigs(configs);
    window.localStorage.setItem(savedConfigsKey, JSON.stringify(configs));
  };
  const saveCurrentConfig = () => {
    const name = configName.trim() || `${t.configs.defaultName} ${savedConfigs.length + 1}`;
    const nextConfig: SavedConfig = {
      id: createConfigId(),
      name,
      inputs,
      createdAt: Date.now()
    };

    persistConfigs([nextConfig, ...savedConfigs]);
    setConfigName('');
    setSaveStatus('saved');
    window.setTimeout(() => setSaveStatus('idle'), 1600);
  };
  const loadConfig = (config: SavedConfig) => setInputs(config.inputs);
  const deleteConfig = (configId: string) => persistConfigs(savedConfigs.filter((config) => config.id !== configId));
  const exportCsv = () => {
    const headers = [t.table.year, t.table.total, t.table.contributed, t.table.interest, t.table.return];
    const csvRows = rows.map((row) => [
      row.year,
      row.total.toFixed(2),
      row.contributed.toFixed(2),
      row.interest.toFixed(2),
      formatReturn(row)
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'compound-interest.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.title;
  }, [language, t.title]);

  React.useEffect(() => {
    if (savedConfigs.length < 2) return;
    setCompareIds((current) => ({
      first: current.first || savedConfigs[0].id,
      second: current.second || savedConfigs[1].id
    }));
  }, [savedConfigs]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:gap-8 lg:px-8">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur sm:p-6 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-100 sm:text-sm">
            <Calculator size={16} /> {t.appBadge}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{t.description}</p>
        </div>
        <div className="flex flex-col gap-3 md:w-[250px]">
          <LanguageSelector language={language} onChange={changeLanguage} />
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100 md:p-4">
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-300/25 disabled:text-emerald-50/60"
              type="button"
              onClick={install}
              disabled={!canInstall || isInstalled}
            >
              <Download className="shrink-0" size={18} />
              {isInstalled ? t.install.installed : t.install.install}
            </button>
            <span>{canInstall ? t.install.ready : t.install.fallback}</span>
          </div>
        </div>
      </header>

      <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:gap-6">
        <form className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-soft backdrop-blur sm:p-6">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white sm:text-xl">{t.form.title}</h2>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 transition hover:border-blue-400 hover:text-white"
                  type="button"
                  aria-label={t.controls.reset}
                  title={t.controls.reset}
                  onClick={() => setInputs(defaultInputs)}
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 transition hover:border-blue-400 hover:text-white"
                  type="button"
                  aria-label={t.controls.exportCsv}
                  title={t.controls.exportCsv}
                  onClick={exportCsv}
                >
                  <FileDown size={17} />
                </button>
              </div>
            </div>
            <CurrencySelector currencyCode={currencyCode} label={t.controls.currency} onChange={changeCurrency} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Field
              label={t.form.initialCapital}
              value={inputs.initialCapital}
              min={0}
              step={100}
              suffix={'\u20ac'}
              onChange={(value) => update('initialCapital', value)}
            />
            <Field
              label={t.form.periodicContribution}
              value={inputs.periodicContribution}
              min={0}
              step={25}
              suffix={'\u20ac'}
              onChange={(value) => update('periodicContribution', value)}
            />
            <SelectField
              label={t.form.contributionFrequency}
              value={inputs.contributionFrequency}
              options={contributionOptions}
              onChange={(value) => update('contributionFrequency', Number(value) as Frequency)}
            />
            <Field
              label={t.form.annualInterestRate}
              value={inputs.annualInterestRate}
              min={0}
              max={100}
              step={0.1}
              suffix="%"
              onChange={(value) => update('annualInterestRate', value)}
            />
            <Field
              label={t.form.errorMargin}
              value={inputs.errorMargin}
              min={0}
              max={50}
              step={0.1}
              suffix={t.risk.points}
              onChange={(value) => update('errorMargin', value)}
            />
            <Field
              label={t.form.monteCarloRuns}
              value={inputs.monteCarloRuns}
              min={100}
              max={10000}
              step={100}
              suffix={t.monteCarlo.simulationsSuffix}
              onChange={(value) => update('monteCarloRuns', value)}
            />
            <SelectField
              label={t.form.capitalization}
              value={inputs.capitalizationFrequency}
              options={frequencyOptions}
              onChange={(value) => update('capitalizationFrequency', Number(value) as Frequency)}
            />
            <Field
              label={t.form.duration}
              value={inputs.years}
              min={1}
              max={80}
              step={1}
              suffix={t.form.yearsSuffix}
              onChange={(value) => update('years', value)}
            />
          </div>

        </form>

        <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.95fr)_minmax(0,1.05fr)]">
              <div className="rounded-2xl border border-blue-300/20 bg-blue-400/10 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-blue-100">
                    <div className="rounded-xl bg-blue-400/20 p-2">
                      <TrendingUp size={22} />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-[0.1em]">{t.stats.finalValue}</span>
                  </div>
                  <span className="rounded-full bg-blue-300/15 px-3 py-1 text-sm font-bold text-blue-100">
                    {numberFormatter.format(inputs.annualInterestRate)}%
                  </span>
                </div>
                <p className="break-words text-4xl font-black tracking-tight text-white lg:text-5xl">{currency.format(final.total)}</p>
                <p className="mt-3 text-sm text-slate-300">
                  {t.stats.estimatedRange}: {currency.format(bearishFinal.total)} - {currency.format(bullishFinal.total)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <StatCard title={t.stats.contributed} value={currency.format(final.contributed)} icon={<PiggyBank size={18} />} />
                <StatCard title={t.stats.interest} value={currency.format(final.interest)} icon={<Calculator size={18} />} />
                <StatCard title={t.stats.gainPercent} value={`${numberFormatter.format(gainPercent)}%`} icon={<BarChart3 size={18} />} />
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-950/45 p-4">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-rose-200">{t.risk.bearish}</span>
                <span className="font-semibold text-blue-100">{t.risk.base}</span>
                <span className="font-semibold text-emerald-200">{t.risk.bullish}</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-rose-300/70" />
                <div className="absolute inset-y-0 left-1/3 w-1/3 bg-blue-300/80" />
                <div className="absolute inset-y-0 right-0 w-1/3 bg-emerald-300/70" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                {[
                  { rate: bearishRate, value: bearishFinal.total, align: 'text-left' },
                  { rate: inputs.annualInterestRate, value: final.total, align: 'text-center' },
                  { rate: bullishRate, value: bullishFinal.total, align: 'text-right' }
                ].map((scenario) => (
                  <div className={scenario.align} key={scenario.rate}>
                    <p className="font-bold text-white">{currency.format(scenario.value)}</p>
                    <p className="mt-1 text-xs text-slate-400">{numberFormatter.format(scenario.rate)}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-semibold text-white">{t.monteCarlo.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{t.monteCarlo.subtitle}</p>
                </div>
                <span className="text-sm font-bold text-blue-100">
                  {numberFormatter.format(inputs.monteCarloRuns)} {t.monteCarlo.simulationsSuffix}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: t.monteCarlo.p10, value: currency.format(monteCarlo.p10), tone: 'text-rose-200' },
                  { label: t.monteCarlo.p50, value: currency.format(monteCarlo.p50), tone: 'text-blue-100' },
                  { label: t.monteCarlo.p90, value: currency.format(monteCarlo.p90), tone: 'text-emerald-200' },
                  {
                    label: t.monteCarlo.lossProbability,
                    value: `${numberFormatter.format(monteCarlo.lossProbability)}%`,
                    tone: 'text-amber-100'
                  }
                ].map((metric) => (
                  <div className="rounded-xl bg-white/[0.04] p-3" key={metric.label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{metric.label}</p>
                    <p className={`mt-1 truncate text-lg font-black ${metric.tone}`}>{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-white sm:text-xl">{t.chart.title}</h2>
              <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-slate-950/50 p-1 text-xs sm:text-sm">
                <button
                  className={`inline-flex items-center justify-center rounded-xl px-3 py-2 font-bold transition ${
                    chartMode === 'total' ? 'bg-blue-400 text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  type="button"
                  aria-pressed={chartMode === 'total'}
                  onClick={() => setChartMode('total')}
                >
                  {t.chart.modeTotal}
                </button>
                <button
                  className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 font-bold transition sm:gap-2 ${
                    chartMode === 'breakdown' ? 'bg-blue-400 text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  type="button"
                  aria-pressed={chartMode === 'breakdown'}
                  onClick={() => setChartMode('breakdown')}
                >
                  <BarChart3 className="hidden sm:block" size={16} />
                  {t.chart.modeBreakdown}
                </button>
              </div>
            </div>
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
                    <linearGradient id="contributedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.65} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.12} />
                    </linearGradient>
                    <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.12} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, .18)" />
                  <XAxis dataKey="year" stroke="#94a3b8" tickFormatter={(year) => `${year}${t.chart.yearShort}`} />
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
                    labelFormatter={(label) => `${t.chart.yearLabel} ${label}`}
                  />
                  {chartMode === 'total' ? (
                    <Area
                      type="monotone"
                      dataKey="total"
                      name={t.chart.totalName}
                      stroke="#60a5fa"
                      fill="url(#totalGradient)"
                      strokeWidth={3}
                    />
                  ) : (
                    <>
                      <Area
                        type="monotone"
                        dataKey="contributed"
                        name={t.stats.contributed}
                        stackId="growth"
                        stroke="#34d399"
                        fill="url(#contributedGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="interest"
                        name={t.stats.interest}
                        stackId="growth"
                        stroke="#60a5fa"
                        fill="url(#interestGradient)"
                        strokeWidth={2}
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-soft backdrop-blur sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-start">
          <div>
            <h2 className="text-lg font-bold text-white sm:text-xl">{t.configs.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{t.configs.subtitle}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="min-w-0">
              <span className="sr-only">{t.configs.placeholder}</span>
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                type="text"
                value={configName}
                placeholder={t.configs.placeholder}
                onChange={(event) => setConfigName(event.target.value)}
              />
            </label>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-blue-300"
              type="button"
              onClick={saveCurrentConfig}
            >
              <Save size={18} />
              {saveStatus === 'saved' ? t.configs.saved : t.configs.saveCurrent}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          {savedConfigs.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {savedConfigs.map((config) => (
              <article className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-blue-300/30 hover:bg-white/[0.07]" key={config.id}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{config.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.configs.savedOn} {new Intl.DateTimeFormat(t.locale, { dateStyle: 'medium' }).format(config.createdAt)}
                    </p>
                  </div>
                  <button
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200"
                    type="button"
                    aria-label={`${t.configs.delete} ${config.name}`}
                    onClick={() => deleteConfig(config.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <dt className="truncate text-xs text-slate-500">{t.form.initialCapital}</dt>
                    <dd className="mt-1 truncate font-semibold text-slate-100">{currency.format(config.inputs.initialCapital)}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <dt className="truncate text-xs text-slate-500">{t.form.annualInterestRate}</dt>
                    <dd className="mt-1 truncate font-semibold text-slate-100">{config.inputs.annualInterestRate}%</dd>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <dt className="truncate text-xs text-slate-500">{t.form.duration}</dt>
                    <dd className="mt-1 truncate font-semibold text-slate-100">
                      {config.inputs.years}
                      {t.chart.yearShort}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 truncate text-sm text-slate-400">
                  {currency.format(config.inputs.periodicContribution)}
                  {' · '}
                  {t.form.contributionFrequency.toLowerCase()}
                  {' · '}
                  {config.inputs.annualInterestRate}% ± {config.inputs.errorMargin}
                  {t.risk.points} · {config.inputs.years}
                  {t.chart.yearShort}
                </p>

                <button
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-blue-300/30 bg-blue-400/10 px-4 py-3 font-bold text-blue-100 transition hover:border-blue-300/60 hover:bg-blue-400/20"
                  type="button"
                  onClick={() => loadConfig(config)}
                >
                  {t.configs.load}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-slate-500">
            {t.configs.empty}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="font-semibold text-white">{t.configs.compareTitle}</h3>
          {savedConfigs.length >= 2 ? (
            <div className="mt-4 grid gap-3">
              <SelectField
                label={t.configs.compareA}
                value={compareIds.first}
                options={savedConfigs.map((config) => ({ label: config.name, value: config.id }))}
                onChange={(value) => setCompareIds((current) => ({ ...current, first: value }))}
              />
              <SelectField
                label={t.configs.compareB}
                value={compareIds.second}
                options={savedConfigs.map((config) => ({ label: config.name, value: config.id }))}
                onChange={(value) => setCompareIds((current) => ({ ...current, second: value }))}
              />
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-xs text-slate-500">{t.configs.difference}</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {compareFirstFinal && compareSecondFinal
                    ? currency.format(compareSecondFinal.total - compareFirstFinal.total)
                    : currency.format(0)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">{t.configs.compareHint}</p>
          )}
        </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-soft backdrop-blur">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <h2 className="text-lg font-bold text-white sm:text-xl">{t.table.title}</h2>
        </div>

        <div className="grid gap-3 p-3 sm:hidden">
          {rows.map((row) => (
            <article key={row.year} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{`${t.table.year} ${row.year}`}</h3>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-100">
                  {formatReturn(row)}
                </span>
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">{t.table.total}</dt>
                  <dd className="font-medium text-white">{currency.format(row.total)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">{t.table.contributed}</dt>
                  <dd className="font-medium text-slate-200">{currency.format(row.contributed)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">{t.table.interestShort}</dt>
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
                <th className="px-4 py-3 sm:px-5">{t.table.year}</th>
                <th className="px-4 py-3 sm:px-5">{t.table.total}</th>
                <th className="px-4 py-3 sm:px-5">{t.table.contributed}</th>
                <th className="px-4 py-3 sm:px-5">{t.table.interest}</th>
                <th className="px-4 py-3 sm:px-5">{t.table.return}</th>
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
