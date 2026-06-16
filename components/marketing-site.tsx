"use client";

import {
  createContext,
  FormEvent,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Clock,
  Code2,
  CreditCard,
  Database,
  FileText,
  Gauge,
  Globe2,
  KeyRound,
  Layers3,
  LifeBuoy,
  Mail,
  MessageSquare,
  Search,
  ReceiptText,
  Send,
  Settings,
  Sparkles,
  Users2,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VendorLogo } from "@/components/vendor-logo";
import {
  defaultLanguage,
  getLanguageMeta,
  languages,
  languageChangeEventName,
  languageStorageKey,
  translations,
} from "@/lib/i18n";
import type { Direction, LanguageCode, MarketingCopy } from "@/lib/i18n";
import {
  capabilityLabels,
  capabilityOrder,
  compactCapabilityLabels,
  compactPlatformTagLabels,
  getSeriesById,
  getModelIconBySeries,
  modelCatalog,
  modelSeriesList,
  platformTagLabels,
  platformTagOrder,
  resolveModelIcon,
  resolveModelSeriesId,
} from "@/lib/model-catalog";
import type { CatalogModel, ModelCapability, ModelPlatformTag, ModelSeriesId } from "@/lib/model-catalog";
import { supportEmail } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type MarketingPage =
  | "features"
  | "models"
  | "pricing"
  | "docs"
  | "about"
  | "contact"
  | "faq"
  | "terms"
  | "privacy"
  | "refund";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: MarketingCopy;
  dir: Direction;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const iconMap: Record<string, LucideIcon> = {
  activity: Activity,
  briefcase: BriefcaseBusiness,
  building: Building2,
  card: CreditCard,
  clock: Clock,
  code: Code2,
  database: Database,
  file: FileText,
  gauge: Gauge,
  key: KeyRound,
  layers: Layers3,
  life: LifeBuoy,
  mail: Mail,
  message: MessageSquare,
  receipt: ReceiptText,
  settings: Settings,
  users: Users2,
  wallet: Wallet,
};

function isLanguageCode(value: string | null): value is LanguageCode {
  return languages.some((language) => language.code === value);
}

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") {
      return defaultLanguage;
    }

    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    return isLanguageCode(storedLanguage) ? storedLanguage : defaultLanguage;
  });

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
    window.dispatchEvent(new CustomEvent(languageChangeEventName, { detail: nextLanguage }));
  };

  const meta = getLanguageMeta(language);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    document.documentElement.dir = meta.dir;
  }, [language, meta.dir]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: translations[language],
      dir: meta.dir,
    }),
    [language, meta.dir],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }

  return value;
}

function formatText(text: string) {
  return text.replaceAll("{email}", supportEmail);
}

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-cyan-300/20 bg-cyan-300/10">
        <Image
          src="/logo-eelapi.png"
          alt="eelapi logo"
          width={36}
          height={36}
          className="h-full w-full object-contain"
        />
      </span>
      <span className="whitespace-nowrap text-[15px] font-semibold tracking-normal text-slate-950">
        电鳗 eelapi
      </span>
    </span>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className="flex h-8 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-600">
      <Globe2 className="h-3.5 w-3.5 text-blue-500" />
      <span className="sr-only">{t.languageLabel}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        className="max-w-32 bg-transparent text-xs outline-none sm:max-w-36"
        aria-label={t.languageLabel}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code} className="bg-white text-slate-950">
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function HeaderAction({
  label,
  href,
  onClick,
  variant = "primary",
}: {
  label: string;
  href: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
}) {
  const className =
    variant === "primary"
      ? "eel-button-primary h-8 px-3.5 text-sm"
      : "h-8 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950";

  if (onClick) {
    return (
      <Button
        type="button"
        onClick={onClick}
        variant={variant === "ghost" ? "ghost" : "default"}
        className={className}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant === "ghost" ? "ghost" : "default"} className={className}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export function MarketingHeader({
  onLogin,
  onSignup,
}: {
  onLogin?: () => void;
  onSignup?: () => void;
}) {
  const { t } = useI18n();
  const navItems = [
    { label: t.nav.features, href: "/features" },
    { label: t.nav.models ?? "Models", href: "/models" },
    { label: t.nav.pricing, href: "/pricing" },
    { label: t.nav.docs, href: "/docs" },
    { label: t.nav.faq, href: "/faq" },
    { label: t.nav.about, href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="eelapi home">
            <BrandLogo />
          </Link>
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <HeaderAction label={t.nav.login} href="/?auth=login" onClick={onLogin} variant="ghost" />
            <div className="hidden sm:block">
              <HeaderAction label={t.nav.start} href="/?auth=signup" onClick={onSignup} />
            </div>
          </div>
        </div>

        <nav className="flex gap-5 overflow-x-auto pb-1 text-[13px] font-medium text-slate-500 lg:min-w-0 lg:flex-1 lg:justify-center lg:overflow-visible lg:pb-0">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 whitespace-nowrap transition hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <HeaderAction label={t.nav.login} href="/?auth=login" onClick={onLogin} variant="ghost" />
          <HeaderAction label={t.nav.start} href="/?auth=signup" onClick={onSignup} />
        </div>
      </div>
    </header>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 flex flex-col gap-2.5">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-slate-950">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MarketingFooter() {
  const { t } = useI18n();
  const productLinks = [
    { label: t.nav.features, href: "/features" },
    { label: t.nav.models ?? "Models", href: "/models" },
    { label: t.nav.pricing, href: "/pricing" },
    { label: t.nav.docs, href: "/docs" },
  ];
  const resourceLinks = [
    { label: t.nav.faq, href: "/faq" },
    { label: t.footer.supportFlow, href: "/contact" },
  ];
  const companyLinks = [
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];
  const policyLinks = [
    { label: t.pages.terms.hero.title, href: "/terms" },
    { label: t.pages.privacy.hero.title, href: "/privacy" },
    { label: t.pages.refund.hero.title, href: "/refund-policy" },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-2 lg:grid-cols-[1.7fr_0.9fr_0.9fr_0.9fr_1fr]">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">{formatText(t.footer.description)}</p>
          <p className="mt-4 break-all text-xs leading-6 text-slate-500 sm:text-sm">
            {t.footer.supportEmail}:{" "}
            <a href={`mailto:${supportEmail}`} className="text-slate-700 hover:text-slate-950">
              {supportEmail}
            </a>
          </p>
        </div>
        <FooterColumn title={t.footer.product} links={productLinks} />
        <FooterColumn title={t.footer.resources} links={resourceLinks} />
        <FooterColumn title={t.footer.company} links={companyLinks} />
        <FooterColumn title={t.footer.legal} links={policyLinks} />
      </div>
      <div className="mx-auto mt-7 flex max-w-7xl flex-col gap-2 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>{t.footer.copyright}</p>
        <p>{t.footer.tagline}</p>
      </div>
    </footer>
  );
}

function MarketingSurface({ children }: { children: ReactNode }) {
  const { dir } = useI18n();

  return (
    <div dir={dir} className="eel-marketing-shell text-slate-950">
      {children}
    </div>
  );
}

function MarketingRoot({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <MarketingSurface>{children}</MarketingSurface>
    </LanguageProvider>
  );
}

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <MarketingRoot>
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </MarketingRoot>
  );
}

export function PageHero({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-blue-600">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-4xl lg:text-[2.65rem]">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{desc}</p>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  desc,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-7", align === "center" && "text-center")}>
      <p className="text-sm font-semibold text-blue-600">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-[1.9rem]">
        {title}
      </h2>
      {desc ? (
        <p className={cn("mt-4 text-base leading-8 text-slate-600", align === "center" && "mx-auto max-w-3xl")}>
          {desc}
        </p>
      ) : null}
    </div>
  );
}

export function FeatureTile({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  const Icon = iconMap[icon] ?? Sparkles;

  return (
    <div className="eel-panel p-5 transition hover:border-cyan-300/25">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{formatText(desc)}</p>
    </div>
  );
}

function TextCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="eel-panel p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{formatText(desc)}</p>
    </div>
  );
}

function AiPromptBox({ onAskAi }: { onAskAi: (prompt: string) => void }) {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");

  const submitPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedPrompt = prompt.trim() || t.home.hero.promptPlaceholder;
    onAskAi(cleanedPrompt);
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-3xl">
      <form
        onSubmit={submitPrompt}
        className="rounded-xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50"
      >
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2 sm:flex-row sm:items-center">
          <Search className="ml-2 hidden h-4 w-4 text-slate-400 sm:block" />
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="h-12 flex-1 rounded-lg bg-transparent px-3 text-base text-slate-950 outline-none placeholder:text-slate-400 sm:h-14 sm:px-2"
            placeholder={t.home.hero.promptPlaceholder}
          />
          <Button
            type="submit"
            className="eel-button-primary h-10 shrink-0 px-4 text-sm sm:h-11"
          >
            {t.home.hero.promptButton}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
      <p className="mt-3 text-center text-xs leading-6 text-slate-500 sm:text-sm">{t.home.hero.promptHint}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {t.home.hero.chips.slice(0, 3).map((chip) => (
          <button
            type="button"
            key={chip.label}
            onClick={() => onAskAi(chip.prompt)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeHero({
  onSignup,
}: {
  onSignup: () => void;
  onOpenDashboard: () => void;
  onAskAi: (prompt: string) => void;
}) {
  const { t } = useI18n();

  return (
    <section className="eel-hero-stage px-4 pb-14 pt-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto flex min-h-[590px] max-w-7xl flex-col items-center justify-center">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {t.home.hero.eyebrow}
          </p>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-slate-950 sm:text-6xl lg:text-[4.85rem]">
            {t.home.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            {t.home.hero.desc}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={onSignup}
              className="eel-button-primary h-11 px-6 text-sm"
            >
              {t.nav.start}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              asChild
              variant="outline"
              className="eel-button-subtle h-11 px-6 text-sm"
            >
              <Link href="/models">{t.nav.models ?? "Models"}</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid w-full max-w-5xl gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
          {t.home.stats.slice(0, 4).map(([label, value]) => (
            <div key={label} className="bg-white px-5 py-5 text-center">
              <p className="text-2xl font-semibold tracking-normal text-slate-950">{formatText(value)}</p>
              <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid({ items }: { items: MarketingCopy["capabilities"] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <FeatureTile key={item.title} {...item} />
      ))}
    </div>
  );
}

function getSupportValue(model: CatalogModel, support: string) {
  if (support === "streaming") {
    return Boolean(model.supports.streaming);
  }

  if (support === "imageInput") {
    return Boolean(model.supports.imageInput);
  }

  if (support === "functionCalling") {
    return Boolean(model.supports.functionCalling);
  }

  if (support === "longContext") {
    return Boolean(model.supports.longContext);
  }

  return true;
}

function ModelCatalogPageContent() {
  const [query, setQuery] = useState("");
  const [seriesFilter, setSeriesFilter] = useState<ModelSeriesId | "all">("all");
  const [capabilityFilters, setCapabilityFilters] = useState<ModelCapability[]>([]);
  const [tagFilters, setTagFilters] = useState<ModelPlatformTag[]>([]);
  const [supportFilter, setSupportFilter] = useState<"all" | "streaming" | "imageInput" | "functionCalling" | "longContext">("all");

  const catalogModelsWithSeries = useMemo(() => {
    return modelCatalog.map((model) => {
      const seriesId = model.series ?? resolveModelSeriesId(model.name, model.displayName, model.providerName, model.description);

      return {
        ...model,
        seriesId,
        seriesMeta: getSeriesById(seriesId),
      };
    });
  }, []);

  const seriesCounts = useMemo(() => {
    return modelSeriesList.reduce<Record<string, number>>((counts, series) => {
      counts[series.id] = catalogModelsWithSeries.filter((model) => model.seriesId === series.id).length;
      return counts;
    }, {});
  }, [catalogModelsWithSeries]);

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalogModelsWithSeries.filter((model) => {
      const matchesQuery =
        !normalizedQuery ||
        [model.name, model.displayName, model.seriesMeta.name, model.seriesMeta.providerName, model.providerName, model.description]
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesSeries = seriesFilter === "all" || model.seriesId === seriesFilter;
      const matchesCapability =
        capabilityFilters.length === 0 ||
        capabilityFilters.every((capability) => model.capabilities.includes(capability));
      const matchesTag =
        tagFilters.length === 0 ||
        tagFilters.every((tag) => model.tags.includes(tag));
      const matchesSupport = supportFilter === "all" || getSupportValue(model, supportFilter);

      return matchesQuery && matchesSeries && matchesCapability && matchesTag && matchesSupport;
    });
  }, [capabilityFilters, catalogModelsWithSeries, query, seriesFilter, supportFilter, tagFilters]);

  const resetFilters = () => {
    setQuery("");
    setSeriesFilter("all");
    setCapabilityFilters([]);
    setTagFilters([]);
    setSupportFilter("all");
  };

  const toggleCapabilityFilter = (capability: ModelCapability) => {
    setCapabilityFilters((current) =>
      current.includes(capability)
        ? current.filter((item) => item !== capability)
        : [...current, capability]
    );
  };

  const toggleTagFilter = (tag: ModelPlatformTag) => {
    setTagFilters((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  };

  const supportFilters = [
    { key: "streaming", label: "支持流式输出" },
    { key: "imageInput", label: "支持图片输入" },
    { key: "functionCalling", label: "支持函数调用" },
    { key: "longContext", label: "支持长上下文" },
  ] as const;

  return (
    <>
      <section className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-blue-600">Model catalog</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-5xl">
                直接选择适合你的 AI 模型
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                像模型切换面板一样浏览具体模型版本，再用搜索、系列、能力和标签快速缩小范围。
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-2xl font-semibold text-slate-950">{modelCatalog.length}</p>
                  <p className="mt-1 text-sm text-slate-500">目录版本</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-950">{modelSeriesList.length}</p>
                  <p className="mt-1 text-sm text-slate-500">产品系列</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-950">OpenAI</p>
                  <p className="mt-1 text-sm text-slate-500">兼容调用方式</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索版本名、系列名或描述关键词"
                  className="h-11 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="text-sm text-slate-500">
                显示 <span className="font-semibold text-slate-950">{filteredModels.length}</span> / {modelCatalog.length} 个模型
              </div>
              <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                清空筛选
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">系列</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSeriesFilter("all")}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                      seriesFilter === "all"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    全部 <span className="text-xs text-slate-400">{modelCatalog.length}</span>
                  </button>
                  {modelSeriesList.map((series) => {
                    const icon = getModelIconBySeries(series.id);

                    return (
                      <button
                        key={series.id}
                        type="button"
                        onClick={() => setSeriesFilter(series.id)}
                        className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                          seriesFilter === series.id
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        <VendorLogo
                          providerId={series.provider}
                          providerName={series.name}
                          logoSrc={icon.src}
                          logoAlt={icon.alt}
                          size="xs"
                        />
                        {series.name}
                        <span className="text-xs text-slate-400">{seriesCounts[series.id] ?? 0}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">能力</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCapabilityFilters([])}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                        capabilityFilters.length === 0
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      全部
                    </button>
                    {capabilityOrder.map((capability) => (
                      <button
                        key={capability}
                        type="button"
                        onClick={() => toggleCapabilityFilter(capability)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          capabilityFilters.includes(capability)
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {capabilityLabels[capability]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">调用特性</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSupportFilter("all")}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                        supportFilter === "all"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      全部
                    </button>
                    {supportFilters.map((support) => (
                      <button
                        key={support.key}
                        type="button"
                        onClick={() => setSupportFilter(support.key)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          supportFilter === support.key
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {support.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">平台标签</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTagFilters([])}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                        tagFilters.length === 0
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      全部
                    </button>
                    {platformTagOrder.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTagFilter(tag)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          tagFilters.includes(tag)
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {platformTagLabels[tag]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-200/50">
            <div className="divide-y divide-slate-100">
              {filteredModels.map((model) => {
                const series = getSeriesById(model.seriesId);
                const icon = resolveModelIcon({
                  seriesId: model.seriesId,
                  name: model.name,
                  displayName: model.displayName,
                  provider: model.provider,
                  providerName: model.providerName,
                  description: model.description,
                });

                return (
                  <article
                    key={model.id}
                    className="flex flex-col gap-3 px-3.5 py-3 transition hover:bg-blue-50/40 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <VendorLogo
                        providerId={series.provider}
                        providerName={series.name}
                        logoSrc={icon.src}
                        logoAlt={icon.alt}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold tracking-normal text-slate-950">{model.displayName}</h3>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {series.name} · {model.providerName} · <span className="font-mono">{model.name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 lg:justify-center">
                      {model.capabilities.slice(0, 3).map((capability) => (
                        <span
                          key={capability}
                          className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                        >
                          {compactCapabilityLabels[capability]}
                        </span>
                      ))}
                      {model.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                          {compactPlatformTagLabels[tag]}
                        </span>
                      ))}
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-4 lg:min-w-[300px] lg:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">输入 / 输出</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-950">
                          {model.inputPrice ?? "按供应商结算"} · {model.outputPrice ?? "按供应商结算"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">上下文</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-950">{model.contextLength ?? "视模型而定"}</p>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                        i
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
            {filteredModels.length === 0 ? (
              <div className="m-3 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-lg font-semibold text-slate-950">没有匹配的模型</p>
                <p className="mt-2 text-sm text-slate-500">尝试清空搜索词或切换筛选条件。</p>
                <Button type="button" onClick={resetFilters} className="eel-button-primary mt-5">
                  重置筛选
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </>
  );
}

function HomeSections({ onAskAi }: { onAskAi: (prompt: string) => void }) {
  const { t } = useI18n();
  const homeCapabilities = [t.capabilities[0], t.capabilities[2], t.capabilities[3], t.capabilities[5]].filter(
    (item): item is MarketingCopy["capabilities"][number] => Boolean(item),
  );
  const platformCards = [
    { icon: "database", title: t.home.startHeading.title, desc: t.home.startHeading.desc },
    { icon: "receipt", title: t.home.billingHeading.title, desc: t.home.billingHeading.desc },
    { icon: "gauge", title: t.home.docsHeading.title, desc: t.home.docsHeading.desc },
  ];
  const featuredSeries = modelSeriesList.filter((series) =>
    ["chatgpt", "claude", "gemini", "deepseek", "qwen", "kimi", "grok", "glm"].includes(series.id)
  );

  return (
    <>
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading {...t.home.capabilitiesHeading} align="center" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {homeCapabilities.map((item) => {
              const Icon = iconMap[item.icon] ?? Sparkles;

              return (
                <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{formatText(item.desc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/70 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <SectionHeading {...t.home.docsHeading} />
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {featuredSeries.map((series) => {
                const icon = getModelIconBySeries(series.id);

                return (
                  <Link
                    key={series.id}
                    href="/models"
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    <VendorLogo
                      providerId={series.provider}
                      providerName={series.name}
                      logoSrc={icon.src}
                      logoAlt={icon.alt}
                      size="sm"
                    />
                    <span className="truncate">{series.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3">
            {platformCards.map((item) => {
              const Icon = iconMap[item.icon] ?? Sparkles;

              return (
                <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{formatText(item.desc)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <SectionHeading {...t.home.whyHeading} align="center" />
          <AiPromptBox onAskAi={onAskAi} />
        </div>
      </section>

      <section className="border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="eel-panel mx-auto max-w-5xl p-7 text-center sm:p-8">
          <p className="text-sm font-semibold text-blue-600">{t.home.cta.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-[1.9rem]">
            {t.home.cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{t.home.cta.desc}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="eel-button-primary h-10 px-5 text-sm">
              <Link href="/?auth=signup">{t.home.cta.signup}</Link>
            </Button>
            <Button asChild variant="outline" className="eel-button-subtle h-10 px-5 text-sm">
              <Link href="/?auth=login">{t.home.cta.login}</Link>
            </Button>
            <Button asChild variant="ghost" className="h-10 rounded-md text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950">
              <Link href="/pricing">{t.home.cta.pricing}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function CodeExample() {
  const { t } = useI18n();

  return (
    <div className="eel-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Code2 className="h-4 w-4" />
          {t.common.pythonExample}
        </div>
        <Link href="/docs" className="text-sm text-blue-600 hover:text-blue-800">
          {t.common.viewDocs}
        </Link>
      </div>
      <pre className="overflow-x-auto bg-slate-950 p-5 text-left text-sm leading-7 text-slate-100" dir="ltr">
        <code>{`import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["EELAPI_API_KEY"],
    base_url="https://eelapi.com/api/v1"
)

completion = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Hello eelapi"}]
)

print(completion.choices[0].message.content)`}</code>
      </pre>
    </div>
  );
}

export function MarketingHome({
  loginDialog,
  onLogin,
  onSignup,
  onOpenDashboard,
  onAskAi,
}: {
  loginDialog: ReactNode;
  onLogin: () => void;
  onSignup: () => void;
  onOpenDashboard: () => void;
  onAskAi: (prompt: string) => void;
}) {
  return (
    <MarketingRoot>
      {loginDialog}
      <MarketingHeader onLogin={onLogin} onSignup={onSignup} />
      <main>
        <HomeHero onSignup={onSignup} onOpenDashboard={onOpenDashboard} onAskAi={onAskAi} />
        <HomeSections onAskAi={onAskAi} />
      </main>
      <MarketingFooter />
    </MarketingRoot>
  );
}

function FeaturesPageContent() {
  const { t } = useI18n();
  return (
    <>
      <PageHero {...t.pages.features.hero} />
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading {...t.pages.features.heading} />
          <FeatureGrid items={t.featureDetails} />
        </div>
      </section>
      <section className="border-y border-slate-200 bg-slate-50/70 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {t.pages.features.scenarios.map((item) => (
            <TextCard key={item.title} {...item} />
          ))}
        </div>
      </section>
    </>
  );
}

function PricingPageContent() {
  const { t } = useI18n();
  const page = t.pages.pricing;
  return (
    <>
      <PageHero {...page.hero} />
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading {...page.plansHeading} align="center" />
          <div className="grid gap-5 lg:grid-cols-3">
            {t.pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-lg border p-5 sm:p-6",
                  plan.highlighted ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white",
                )}
              >
                <p className="text-sm text-slate-400">{plan.audience}</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">{plan.name}</h2>
                <p className="mt-4 text-2xl font-semibold text-slate-950">{plan.price}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{plan.desc}</p>
                <div className="mt-5 space-y-3 rounded-md border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-950">{page.billingLabel}</span>{plan.billing}</p>
                  <p><span className="font-semibold text-slate-950">{page.prepayLabel}</span>{plan.prepay}</p>
                  <p><span className="font-semibold text-slate-950">{page.fitLabel}</span>{plan.fit}</p>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="eel-button-primary mt-7 h-10 w-full">
                  <Link href="/?auth=signup">{t.nav.start}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-slate-200 bg-slate-50/70 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {page.notes.map((item) => (
            <TextCard key={item.title} {...item} />
          ))}
        </div>
      </section>
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading {...page.logicHeading} />
          <div className="grid gap-4 sm:grid-cols-2">
            {page.logicItems.map((item) => (
              <TextCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function DocsPageContent() {
  const { t } = useI18n();
  const page = t.pages.docs;
  return (
    <>
      <PageHero {...page.hero} />
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading {...page.heading} />
            <div className="space-y-4 text-slate-600">
              {page.bullets.map((item) => (
                <p key={item} className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-7 sm:text-base">
                  {item}
                </p>
              ))}
            </div>
          </div>
          <CodeExample />
        </div>
      </section>
    </>
  );
}

function AboutPageContent() {
  const { t } = useI18n();
  const page = t.pages.about;
  return (
    <>
      <PageHero {...page.hero} />
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading {...page.positioning} />
          <div className="grid gap-5 md:grid-cols-2">
            {page.introCards.map((item) => (
              <TextCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-slate-200 bg-slate-50/70 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading {...page.audienceHeading} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {page.audience.map((item) => (
              <TextCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow={t.pages.features.heading.eyebrow} title={t.pages.features.heading.title} desc={t.pages.features.heading.desc} />
          <FeatureGrid items={t.featureDetails.slice(0, 6)} />
        </div>
      </section>
      <section className="border-y border-slate-200 bg-slate-50/70 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-4">
          {page.focusItems.map((item) => (
            <TextCard key={item.title} {...item} />
          ))}
        </div>
      </section>
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading {...page.trustHeading} />
          <FeatureGrid items={t.trustItems} />
        </div>
      </section>
    </>
  );
}

function ContactPageContent() {
  const { t } = useI18n();
  const page = t.pages.contact;
  return (
    <>
      <PageHero {...page.hero} />
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading {...page.heading} />
          <FeatureGrid items={page.items} />
        </div>
      </section>
      <section className="border-y border-slate-200 bg-slate-50/70 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading {...page.processHeading} />
          <div className="grid gap-4 sm:grid-cols-2">
            {page.process.map((item) => (
              <TextCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-blue-200 bg-blue-50 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold leading-tight text-slate-950">{page.scopeTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{formatText(page.scopeDesc)}</p>
        </div>
      </section>
    </>
  );
}

function FaqPageContent() {
  const { t } = useI18n();
  const page = t.pages.faq;
  return (
    <>
      <PageHero {...page.hero} />
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeading {...page.heading} />
          <div className="space-y-5">
            {page.items.map((item) => (
              <article key={item.question} className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-slate-950">{item.question}</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{formatText(item.answer)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function PolicyPageContent({ page }: { page: "terms" | "privacy" | "refund" }) {
  const { t } = useI18n();
  const content = t.pages[page];
  const heading =
    page === "refund"
      ? t.pages.refund.heading
      : { eyebrow: t.common.legalSectionEyebrow, title: t.pages[page].heading, desc: undefined };

  return (
    <>
      <PageHero {...content.hero} />
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeading {...heading} />
          <div className="space-y-5">
            {content.sections.map((section) => (
              <article key={section.title} className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{formatText(paragraph)}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function MarketingStaticPage({ page }: { page: MarketingPage }) {
  return (
    <MarketingPageShell>
      {page === "features" ? <FeaturesPageContent /> : null}
      {page === "models" ? <ModelCatalogPageContent /> : null}
      {page === "pricing" ? <PricingPageContent /> : null}
      {page === "docs" ? <DocsPageContent /> : null}
      {page === "about" ? <AboutPageContent /> : null}
      {page === "contact" ? <ContactPageContent /> : null}
      {page === "faq" ? <FaqPageContent /> : null}
      {page === "terms" ? <PolicyPageContent page="terms" /> : null}
      {page === "privacy" ? <PolicyPageContent page="privacy" /> : null}
      {page === "refund" ? <PolicyPageContent page="refund" /> : null}
    </MarketingPageShell>
  );
}
