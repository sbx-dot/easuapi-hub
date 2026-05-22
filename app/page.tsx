"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  ArrowRight,
  Bot,
  BookOpen,
  Check,
  Copy,
  CreditCard,
  Database,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  KeyRound,
  LogOut,
  Menu,
  MessageSquare,
  Play,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
  X,
  Code2,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Page = "home" | "dashboard";
type Tab =
  | "overview"
  | "keys"
  | "playground"
  | "chat"
  | "models"
  | "usage"
  | "recharge"
  | "orders"
  | "docs"
  | "admin";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  createdAt: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    details?: unknown;
    request_id?: string;
  };
  [key: string]: unknown;
};

type DashboardNavItem = {
  label: string;
  id: string;
  tab: Tab;
  adminOnly?: boolean;
};

type ChatApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
};

type ChatApiKeyRow = {
  id: string;
  name: string | null;
  key_prefix: string;
  created_at: string;
};

type ApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  oneTimeKey?: string;
  createdAt: string;
};

type UsageItem = {
  id: string;
  time: string;
  model: string;
  supplierName: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  status: string;
};

type OrderItem = {
  id: string;
  time: string;
  amount: number;
  method: string;
  status: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  balance: number | string | null;
  role: string | null;
  created_at: string;
};

type ApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  revoked: boolean;
};

type OrderRow = {
  id: string;
  amount: number | string | null;
  method: string | null;
  status: string | null;
  note: string | null;
  created_at: string;
};

type UsageLogRow = {
  id: string;
  model: string | null;
  supplier_name: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  cost: number | string | null;
  status: string | null;
  created_at: string;
};

type BalanceAdjustmentResult = {
  order_id: string;
  user_id: string;
  email: string;
  new_balance: number | string;
  amount: number | string;
  note: string | null;
};

type ModelRow = {
  id: string;
  name: string;
  upstream_model: string;
  display_name: string;
  supplier_name: string | null;
  provider: string;
  input_price_per_1k: number | string;
  output_price_per_1k: number | string;
  enabled: boolean;
  description: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

type ModelItem = {
  id?: string;
  name: string;
  upstreamModel: string;
  label: string;
  supplierName: string;
  provider: string;
  inputPrice: string;
  outputPrice: string;
  inputPricePer1K: number;
  outputPricePer1K: number;
  desc: string;
  enabled: boolean;
  sortOrder: number;
};

type ModelFormState = {
  name: string;
  displayName: string;
  provider: string;
  upstreamModel: string;
  supplierName: string;
  inputPrice: string;
  outputPrice: string;
  enabled: boolean;
  description: string;
  sortOrder: string;
};

type SupplierRow = {
  id: string;
  name: string;
  display_name: string;
  base_url: string;
  provider_type: string;
  enabled: boolean;
  priority: number | null;
  notes: string | null;
  api_key_configured: boolean | null;
  created_at: string;
  updated_at: string;
};

type SupplierItem = {
  id?: string;
  name: string;
  displayName: string;
  baseUrl: string;
  providerType: string;
  enabled: boolean;
  priority: number;
  notes: string;
  apiKeyConfigured: boolean;
};

type SupplierFormState = {
  name: string;
  displayName: string;
  baseUrl: string;
  providerType: string;
  apiKey: string;
  enabled: boolean;
  priority: string;
  notes: string;
};

type AdminUserRoleFilter = "all" | "admin" | "user";
type AdminUserSort = "balance_desc" | "balance_asc" | "last_usage_desc" | "last_usage_asc";
type AdminUserDetailView = "apiKeys" | "usage" | "orders";
type BalanceAdjustMode = "increase" | "decrease";
type FinanceRange = "today" | "7d" | "30d" | "all";
type ErrorRange = "today" | "7d" | "30d" | "all";
type ErrorStatusFilter = "all" | "failed" | "blocked" | "rate_limited";

type AdminUserRow = {
  user_id: string;
  email: string | null;
  role: string | null;
  balance: number | string | null;
  api_key_count: number | string | null;
  total_recharge_amount: number | string | null;
  total_spend_amount: number | string | null;
  last_usage_at: string | null;
  created_at: string;
};

type AdminUserItem = {
  id: string;
  email: string;
  role: string;
  balance: number;
  apiKeyCount: number;
  totalRecharge: number;
  totalSpend: number;
  lastUsageAt: string | null;
  createdAt: string;
};

type AdminUserApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  revoked: boolean;
  created_at: string;
};

type AdminUserUsageRow = {
  id: string;
  model: string | null;
  supplier_name: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  cost: number | string | null;
  status: string | null;
  created_at: string;
};

type AdminUserOrderRow = {
  id: string;
  amount: number | string | null;
  method: string | null;
  status: string | null;
  note: string | null;
  created_at: string;
};

type FinanceSummaryRow = {
  total_users: number | string | null;
  total_balance: number | string | null;
  total_recharge_amount: number | string | null;
  total_consumption_amount: number | string | null;
  today_consumption_amount: number | string | null;
  today_call_count: number | string | null;
  today_failed_count: number | string | null;
  today_failure_rate: number | string | null;
  average_cost_per_call: number | string | null;
  cost_configured: boolean | null;
  estimated_upstream_cost: number | string | null;
  estimated_gross_profit: number | string | null;
  range_call_count: number | string | null;
  range_success_count: number | string | null;
  range_failed_count: number | string | null;
  range_consumption_amount: number | string | null;
  range_recharge_amount: number | string | null;
};

type FinanceRankingRow = {
  ranking_type: "top_spenders" | "top_rechargers" | "model_rankings" | "supplier_rankings";
  label: string | null;
  email: string | null;
  model: string | null;
  supplier_name: string | null;
  total_amount: number | string | null;
  call_count: number | string | null;
  success_count: number | string | null;
  failed_count: number | string | null;
  token_count: number | string | null;
  order_count: number | string | null;
  last_usage_at: string | null;
};

type RecentFinanceOrderRow = {
  id: string;
  user_email: string | null;
  amount: number | string | null;
  method: string | null;
  status: string | null;
  note: string | null;
  created_at: string;
};

type ErrorSummaryRow = {
  today_error_count: number | string | null;
  today_401_count: number | string | null;
  today_402_count: number | string | null;
  today_429_count: number | string | null;
  today_upstream_failed_count: number | string | null;
  today_failure_rate: number | string | null;
  last_hour_error_count: number | string | null;
  top_error_user_email: string | null;
  top_error_user_count: number | string | null;
  top_error_model: string | null;
  top_error_model_count: number | string | null;
  top_error_supplier: string | null;
  top_error_supplier_count: number | string | null;
  high_frequency_key_prefix: string | null;
  high_frequency_key_count: number | string | null;
  frequent_402_email: string | null;
  frequent_402_count: number | string | null;
  failing_supplier_name: string | null;
  failing_supplier_rate: number | string | null;
  invalid_key_count: number | string | null;
};

type ErrorLogRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  email: string | null;
  api_key_id: string | null;
  api_key_prefix: string | null;
  api_key_revoked: boolean | null;
  model: string | null;
  model_display_name: string | null;
  supplier_name: string | null;
  supplier_display_name: string | null;
  http_status: number | null;
  error_code: string | null;
  error_message: string | null;
  latency_ms: number | null;
  cost: number | string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  status: string | null;
  request_id: string | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
};

const API_KEY_PREFIX_LENGTH = 16;

const emptyModelForm: ModelFormState = {
  name: "",
  displayName: "",
  provider: "deepseek",
  upstreamModel: "",
  supplierName: "deepseek",
  inputPrice: "0.01",
  outputPrice: "0.01",
  enabled: true,
  description: "",
  sortOrder: "100",
};

const emptySupplierForm: SupplierFormState = {
  name: "",
  displayName: "",
  baseUrl: "https://api.deepseek.com/v1",
  providerType: "openai-compatible",
  apiKey: "",
  enabled: true,
  priority: "100",
  notes: "",
};

const fallbackModelList: ModelItem[] = [
  {
    name: "deepseek-chat",
    upstreamModel: "deepseek-chat",
    label: "DeepSeek Chat",
    supplierName: "deepseek",
    provider: "deepseek",
    inputPrice: "¥0.01 / 1K tokens",
    outputPrice: "¥0.01 / 1K tokens",
    inputPricePer1K: 0.01,
    outputPricePer1K: 0.01,
    desc: "适合通用聊天、写作、代码和轻量分析。",
    enabled: true,
    sortOrder: 10,
  },
  {
    name: "deepseek-reasoner",
    upstreamModel: "deepseek-reasoner",
    label: "DeepSeek Reasoner",
    supplierName: "deepseek",
    provider: "deepseek",
    inputPrice: "¥0.02 / 1K tokens",
    outputPrice: "¥0.02 / 1K tokens",
    inputPricePer1K: 0.02,
    outputPricePer1K: 0.02,
    desc: "适合复杂推理、规划和多步骤问题。",
    enabled: true,
    sortOrder: 20,
  },
];

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "概览", icon: <Gauge className="h-4 w-4" /> },
  { key: "keys", label: "API Key", icon: <KeyRound className="h-4 w-4" /> },
  { key: "playground", label: "在线测试", icon: <Play className="h-4 w-4" /> },
  { key: "chat", label: "AI 聊天", icon: <MessageSquare className="h-4 w-4" /> },
  { key: "models", label: "模型列表", icon: <Database className="h-4 w-4" /> },
  { key: "usage", label: "用量记录", icon: <Activity className="h-4 w-4" /> },
  { key: "recharge", label: "充值中心", icon: <CreditCard className="h-4 w-4" /> },
  { key: "orders", label: "订单记录", icon: <FileText className="h-4 w-4" /> },
  { key: "docs", label: "API 文档", icon: <BookOpen className="h-4 w-4" /> },
  { key: "admin", label: "管理后台", icon: <Settings className="h-4 w-4" /> },
];

const dashboardNavItems: DashboardNavItem[] = [
  { label: "概览", id: "overview", tab: "overview" },
  { label: "API Key", id: "api-keys", tab: "keys" },
  { label: "在线测试", id: "playground", tab: "playground" },
  { label: "AI 聊天", id: "chat", tab: "chat" },
  { label: "模型列表", id: "models", tab: "models" },
  { label: "用量记录", id: "usage-logs", tab: "usage" },
  { label: "充值中心", id: "recharge", tab: "recharge" },
  { label: "订单记录", id: "orders", tab: "orders" },
  { label: "API 文档", id: "docs", tab: "docs" },
  { label: "管理后台", id: "admin", tab: "admin", adminOnly: true },
  { label: "模型价格管理", id: "model-pricing", tab: "admin", adminOnly: true },
  { label: "供应商线路", id: "suppliers", tab: "admin", adminOnly: true },
  { label: "用户管理", id: "users", tab: "admin", adminOnly: true },
  { label: "财务统计", id: "finance", tab: "admin", adminOnly: true },
  { label: "异常请求", id: "errors", tab: "admin", adminOnly: true },
  { label: "系统监控", id: "monitoring", tab: "admin", adminOnly: true },
];

const activeSectionIdByTab: Record<Tab, string> = {
  overview: "overview",
  keys: "api-keys",
  playground: "playground",
  chat: "chat",
  models: "models",
  usage: "usage-logs",
  recharge: "recharge",
  orders: "orders",
  docs: "docs",
  admin: "admin",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createLiveApiKey() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(40);
  crypto.getRandomValues(bytes);

  return `sk_live_${Array.from(bytes, (byte) => chars[byte % chars.length]).join("")}`;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function mapApiKey(row: ApiKeyRow, oneTimeKey?: string): ApiKeyItem {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    oneTimeKey,
    createdAt: formatDateTime(row.created_at),
  };
}

function mapChatApiKey(row: ChatApiKeyRow): ChatApiKeyItem {
  return {
    id: row.id,
    name: row.name ?? "API Key",
    keyPrefix: row.key_prefix,
    createdAt: formatDateTime(row.created_at),
  };
}

function mapOrder(row: OrderRow): OrderItem {
  return {
    id: row.id,
    time: formatDateTime(row.created_at),
    amount: Number(row.amount ?? 0),
    method: row.note ? `${row.method ?? "未知"} / ${row.note}` : row.method ?? "未知",
    status: row.status ?? "pending",
  };
}

function mapUsageLog(row: UsageLogRow): UsageItem {
  return {
    id: row.id,
    time: formatDateTime(row.created_at),
    model: row.model ?? "unknown",
    supplierName: row.supplier_name ?? "unknown",
    promptTokens: row.prompt_tokens ?? 0,
    completionTokens: row.completion_tokens ?? 0,
    cost: Number(row.cost ?? 0),
    status: row.status ?? "success",
  };
}

function formatModelPrice(value: number) {
  const normalized = Number.isFinite(value) ? value : 0;
  const text = normalized.toFixed(4).replace(/\.?0+$/u, "");

  return `¥${text || "0"} / 1K tokens`;
}

function formatMoney(value: number | string | null | undefined, digits = 2) {
  const amount = Number(value ?? 0);
  const normalized = Number.isFinite(amount) ? amount : 0;

  return `¥${normalized.toFixed(digits)}`;
}

function formatNumber(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  const normalized = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat("zh-CN").format(normalized);
}

function formatPercent(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  const normalized = Number.isFinite(amount) ? amount : 0;

  return `${normalized.toFixed(2)}%`;
}

function formatLatency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  const normalized = Number.isFinite(amount) ? amount : 0;

  return normalized > 0 ? `${Math.round(normalized)} ms` : "无";
}

function formatShortHash(value: string | null | undefined) {
  return value ? `${value.slice(0, 12)}...` : "无";
}

function getErrorStatusClass(status: string | null | undefined) {
  if (status === "rate_limited") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  if (status === "blocked") {
    return "border-red-300/30 bg-red-400/10 text-red-100";
  }

  return "border-rose-300/30 bg-rose-400/10 text-rose-100";
}

function mapModel(row: ModelRow): ModelItem {
  const inputPricePer1K = Number(row.input_price_per_1k ?? 0);
  const outputPricePer1K = Number(row.output_price_per_1k ?? 0);

  return {
    id: row.id,
    name: row.name,
    upstreamModel: row.upstream_model,
    label: row.display_name,
    supplierName: row.supplier_name ?? "deepseek",
    provider: row.provider,
    inputPrice: formatModelPrice(inputPricePer1K),
    outputPrice: formatModelPrice(outputPricePer1K),
    inputPricePer1K,
    outputPricePer1K,
    desc: row.description ?? "暂无说明。",
    enabled: row.enabled,
    sortOrder: row.sort_order ?? 100,
  };
}

function modelToForm(model: ModelItem): ModelFormState {
  return {
    name: model.name,
    displayName: model.label,
    provider: model.provider,
    upstreamModel: model.upstreamModel,
    supplierName: model.supplierName,
    inputPrice: String(model.inputPricePer1K),
    outputPrice: String(model.outputPricePer1K),
    enabled: model.enabled,
    description: model.desc === "暂无说明。" ? "" : model.desc,
    sortOrder: String(model.sortOrder),
  };
}

function mapSupplier(row: SupplierRow): SupplierItem {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    baseUrl: row.base_url,
    providerType: row.provider_type,
    enabled: row.enabled,
    priority: row.priority ?? 100,
    notes: row.notes ?? "",
    apiKeyConfigured: Boolean(row.api_key_configured),
  };
}

function supplierToForm(supplier: SupplierItem): SupplierFormState {
  return {
    name: supplier.name,
    displayName: supplier.displayName,
    baseUrl: supplier.baseUrl,
    providerType: supplier.providerType,
    apiKey: "",
    enabled: supplier.enabled,
    priority: String(supplier.priority),
    notes: supplier.notes,
  };
}

function mapAdminUser(row: AdminUserRow): AdminUserItem {
  return {
    id: row.user_id,
    email: row.email ?? "未设置邮箱",
    role: row.role ?? "user",
    balance: Number(row.balance ?? 0),
    apiKeyCount: Number(row.api_key_count ?? 0),
    totalRecharge: Number(row.total_recharge_amount ?? 0),
    totalSpend: Number(row.total_spend_amount ?? 0),
    lastUsageAt: row.last_usage_at,
    createdAt: row.created_at,
  };
}

function parseAdminUserSort(sort: AdminUserSort) {
  if (sort === "balance_asc") {
    return { sortKey: "balance", sortDirection: "asc" };
  }

  if (sort === "last_usage_desc") {
    return { sortKey: "last_usage_at", sortDirection: "desc" };
  }

  if (sort === "last_usage_asc") {
    return { sortKey: "last_usage_at", sortDirection: "asc" };
  }

  return { sortKey: "balance", sortDirection: "desc" };
}

function formatNullableDateTime(value: string | null) {
  return value ? formatDateTime(value) : "暂无";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return "未知错误";
}

function isAdminPermissionError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return message.includes("not admin") || message.includes("only admins");
}

function createChatMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatChatMessageTime() {
  return new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readChatAssistantReply(data: ChatCompletionResponse | null) {
  const content = data?.choices?.[0]?.message?.content;

  return typeof content === "string" ? content.trim() : "";
}

function stringifyChatErrorDetails(details: unknown) {
  if (details === undefined || details === null) {
    return "";
  }

  if (typeof details === "string") {
    return details;
  }

  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

function readChatApiError(data: ChatCompletionResponse | null, fallback: string) {
  const message = data?.error?.message;
  const details = stringifyChatErrorDetails(data?.error?.details);

  if (typeof message === "string" && message.trim()) {
    return details ? `${message.trim()}：${details}` : message.trim();
  }

  return fallback || "请求失败，请稍后重试。";
}

function SectionTitle({
  label,
  title,
  desc,
}: {
  label: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-cyan-300">{label}</p>
      <h2 className="mt-2 text-2xl font-black sm:text-3xl">{title}</h2>
      {desc ? <p className="mt-3 text-slate-400">{desc}</p> : null}
    </div>
  );
}

function BrandMark({ className = "" }: { className?: string }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_18px_rgba(34,211,238,0.16)]">
        {logoFailed ? (
          <span className="text-lg leading-none">⚡</span>
        ) : (
          <Image
            src="/logo-eelapi.png"
            alt=""
            width={36}
            height={36}
            className="h-full w-full object-contain"
            onError={() => setLogoFailed(true)}
          />
        )}
      </span>
      <span className="text-lg font-bold">电鳗 eelapi</span>
    </span>
  );
}

export default function EasyApiHubPage() {
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState<Page>("home");
  const [dashboardTab, setDashboardTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [functionNavOpen, setFunctionNavOpen] = useState(false);
  const [dashboardScrollTarget, setDashboardScrollTarget] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authMessage, setAuthMessage] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [dataMessage, setDataMessage] = useState("");
  const [createdApiKey, setCreatedApiKey] = useState("");
  const [profileRole, setProfileRole] = useState("user");
  const [manualRechargeEmail, setManualRechargeEmail] = useState("");
  const [manualRechargeAmount, setManualRechargeAmount] = useState("");
  const [manualRechargeNote, setManualRechargeNote] = useState("");
  const [manualRechargeSubmitting, setManualRechargeSubmitting] = useState(false);
  const [manualRechargeMessage, setManualRechargeMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [balance, setBalance] = useState(0);
  const [showKeys, setShowKeys] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");
  const [testPrompt, setTestPrompt] = useState("你好，帮我写一个 API 中转站介绍");
  const [testResult, setTestResult] = useState(
    "这里会显示模型回复。当前是本地演示版，不会真的请求上游 API。"
  );
  const [chatModel, setChatModel] = useState("deepseek-chat");
  const [chatInput, setChatInput] = useState("你好");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatRawResponse, setChatRawResponse] = useState("");
  const [chatApiKeys, setChatApiKeys] = useState<ChatApiKeyItem[]>([]);
  const [selectedChatApiKeyId, setSelectedChatApiKeyId] = useState("");
  const [chatKeysLoading, setChatKeysLoading] = useState(false);
  const [chatKeysMessage, setChatKeysMessage] = useState("");
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [modelList, setModelList] = useState<ModelItem[]>(fallbackModelList);
  const [adminModels, setAdminModels] = useState<ModelItem[]>([]);
  const [adminSuppliers, setAdminSuppliers] = useState<SupplierItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersMessage, setAdminUsersMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<AdminUserRoleFilter>("all");
  const [userSort, setUserSort] = useState<AdminUserSort>("balance_desc");
  const [selectedAdminUser, setSelectedAdminUser] = useState<AdminUserItem | null>(null);
  const [adminUserDetailView, setAdminUserDetailView] = useState<AdminUserDetailView | null>(null);
  const [adminUserApiKeys, setAdminUserApiKeys] = useState<AdminUserApiKeyRow[]>([]);
  const [adminUserUsageLogs, setAdminUserUsageLogs] = useState<AdminUserUsageRow[]>([]);
  const [adminUserOrders, setAdminUserOrders] = useState<AdminUserOrderRow[]>([]);
  const [adminUserDetailLoading, setAdminUserDetailLoading] = useState(false);
  const [userRoleSubmittingId, setUserRoleSubmittingId] = useState("");
  const [balanceAdjustUser, setBalanceAdjustUser] = useState<AdminUserItem | null>(null);
  const [balanceAdjustMode, setBalanceAdjustMode] = useState<BalanceAdjustMode>("increase");
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState("");
  const [balanceAdjustNote, setBalanceAdjustNote] = useState("");
  const [balanceAdjustSubmitting, setBalanceAdjustSubmitting] = useState(false);
  const [financeRange, setFinanceRange] = useState<FinanceRange>("today");
  const [financeSummary, setFinanceSummary] = useState<FinanceSummaryRow | null>(null);
  const [financeRankings, setFinanceRankings] = useState<FinanceRankingRow[]>([]);
  const [recentFinanceOrders, setRecentFinanceOrders] = useState<RecentFinanceOrderRow[]>([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeMessage, setFinanceMessage] = useState("");
  const [errorRange, setErrorRange] = useState<ErrorRange>("today");
  const [errorEmailSearch, setErrorEmailSearch] = useState("");
  const [errorStatusFilter, setErrorStatusFilter] = useState<ErrorStatusFilter>("all");
  const [errorHttpStatusFilter, setErrorHttpStatusFilter] = useState("all");
  const [errorModelFilter, setErrorModelFilter] = useState("all");
  const [errorSupplierFilter, setErrorSupplierFilter] = useState("all");
  const [errorSummary, setErrorSummary] = useState<ErrorSummaryRow | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLogRow[]>([]);
  const [errorLoading, setErrorLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedErrorLog, setSelectedErrorLog] = useState<ErrorLogRow | null>(null);
  const [disablingApiKeyId, setDisablingApiKeyId] = useState("");
  const [modelsMessage, setModelsMessage] = useState("");
  const [modelForm, setModelForm] = useState<ModelFormState>(emptyModelForm);
  const [editModelForm, setEditModelForm] = useState<ModelFormState>(emptyModelForm);
  const [editingModelId, setEditingModelId] = useState("");
  const [modelSubmitting, setModelSubmitting] = useState(false);
  const [adminModelMessage, setAdminModelMessage] = useState("");
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [editSupplierForm, setEditSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [editingSupplierId, setEditingSupplierId] = useState("");
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);
  const [adminSupplierMessage, setAdminSupplierMessage] = useState("");

  const activeKey = apiKeys[0] ? `${apiKeys[0].keyPrefix}...` : "你的_API_Key";
  const userEmail = session?.user.email ?? email;
  const isAdmin = profileRole === "admin";
  const visibleTabs = tabs.filter((tab) => tab.key !== "admin" || isAdmin);
  const activeDashboardTab = !isAdmin && dashboardTab === "admin" ? "overview" : dashboardTab;
  const selectedModelInfo =
    modelList.find((model) => model.name === selectedModel) ?? modelList[0] ?? fallbackModelList[0];
  const selectedModelName = selectedModelInfo.name;
  const chatAvailableModels = useMemo(
    () => (isSupabaseConfigured && !modelsMessage ? modelList : []),
    [modelList, modelsMessage]
  );
  const chatModelInfo = chatAvailableModels.find((model) => model.name === chatModel) ?? chatAvailableModels[0] ?? null;
  const activeChatApiKey = chatApiKeys.find((key) => key.id === selectedChatApiKeyId) ?? chatApiKeys[0] ?? null;
  const apiBaseUrl = "https://eelapi.com/api/v1";
  const exampleModel = "deepseek-chat";
  const supplierOptions =
    adminSuppliers.length > 0
      ? adminSuppliers
      : [
          {
            name: "deepseek",
            displayName: "DeepSeek 官方",
          },
        ];
  const functionNavItems = dashboardNavItems.filter((item) => !item.adminOnly || isAdmin);
  const topSpenders = financeRankings.filter((item) => item.ranking_type === "top_spenders");
  const topRechargers = financeRankings.filter((item) => item.ranking_type === "top_rechargers");
  const modelFinanceRankings = financeRankings.filter((item) => item.ranking_type === "model_rankings");
  const supplierFinanceRankings = financeRankings.filter((item) => item.ranking_type === "supplier_rankings");
  const financeRangeLabel =
    financeRange === "today" ? "今天" : financeRange === "7d" ? "7 天" : financeRange === "30d" ? "30 天" : "全部";
  const financeStatCards = [
    ["总用户数", formatNumber(financeSummary?.total_users), "profiles"],
    ["总余额池", formatMoney(financeSummary?.total_balance, 4), "sum(balance)"],
    ["累计充值金额", formatMoney(financeSummary?.total_recharge_amount, 2), "paid/manual/admin_adjust"],
    ["累计消费金额", formatMoney(financeSummary?.total_consumption_amount, 4), "usage cost"],
    ["今日消费金额", formatMoney(financeSummary?.today_consumption_amount, 4), "today"],
    ["今日调用次数", formatNumber(financeSummary?.today_call_count), "calls"],
    ["今日失败次数", formatNumber(financeSummary?.today_failed_count), "failed"],
    ["失败率", formatPercent(financeSummary?.today_failure_rate), "today"],
    ["平均单次消费", formatMoney(financeSummary?.average_cost_per_call, 6), "avg"],
    [
      "预估毛利",
      financeSummary?.cost_configured ? formatMoney(financeSummary?.estimated_gross_profit, 4) : "成本价未配置",
      financeSummary?.cost_configured ? `成本 ${formatMoney(financeSummary?.estimated_upstream_cost, 4)}` : "models 成本字段为 0",
    ],
  ];
  const errorRangeLabel =
    errorRange === "today" ? "今天" : errorRange === "7d" ? "7 天" : errorRange === "30d" ? "30 天" : "全部";
  const errorHttpStatusValue = errorHttpStatusFilter === "all" ? null : Number(errorHttpStatusFilter);
  const errorStatCards = [
    ["今日异常请求数", formatNumber(errorSummary?.today_error_count), "blocked / failed / rate_limited"],
    ["今日 401 数", formatNumber(errorSummary?.today_401_count), "无效或缺少 API Key"],
    ["今日 402 数", formatNumber(errorSummary?.today_402_count), "余额不足"],
    ["今日 429 数", formatNumber(errorSummary?.today_429_count), "限流触发"],
    ["今日上游失败数", formatNumber(errorSummary?.today_upstream_failed_count), "upstream_error / timeout"],
    ["今日失败率", formatPercent(errorSummary?.today_failure_rate), "异常 / 全部请求"],
    ["最近 1 小时异常数", formatNumber(errorSummary?.last_hour_error_count), "rolling 1h"],
    [
      "异常最多用户",
      errorSummary?.top_error_user_email ?? "暂无",
      `${formatNumber(errorSummary?.top_error_user_count)} 次`,
    ],
    [
      "异常最多模型",
      errorSummary?.top_error_model ?? "暂无",
      `${formatNumber(errorSummary?.top_error_model_count)} 次`,
    ],
    [
      "异常最多供应商",
      errorSummary?.top_error_supplier ?? "暂无",
      `${formatNumber(errorSummary?.top_error_supplier_count)} 次`,
    ],
  ];
  const errorRiskHints = [
    Number(errorSummary?.high_frequency_key_count ?? 0) > 0
      ? `API Key ${errorSummary?.high_frequency_key_prefix ?? "unknown"} 1 分钟内多次触发 429，疑似高频调用。`
      : "",
    Number(errorSummary?.frequent_402_count ?? 0) > 0
      ? `${errorSummary?.frequent_402_email ?? "某用户"} 最近 1 小时多次余额不足，建议提醒充值或检查自动重试。`
      : "",
    Number(errorSummary?.failing_supplier_rate ?? 0) >= 50
      ? `${errorSummary?.failing_supplier_name ?? "某供应商"} 今日失败率 ${formatPercent(
          errorSummary?.failing_supplier_rate
        )}，供应商线路可能异常。`
      : "",
    Number(errorSummary?.invalid_key_count ?? 0) >= 5
      ? `今日 401 较多，可能存在无效 Key 探测或客户端密钥配置错误。`
      : "",
  ].filter(Boolean);

  const pythonCode = useMemo(() => {
    return `from openai import OpenAI

client = OpenAI(
    api_key="${activeKey}",
    base_url="${apiBaseUrl}"
)

completion = client.chat.completions.create(
    model="${exampleModel}",
    messages=[
        {"role": "user", "content": "你好"}
    ]
)

print(completion.choices[0].message.content)`;
  }, [activeKey, apiBaseUrl, exampleModel]);

  const javascriptCode = useMemo(() => {
    return `fetch("${apiBaseUrl}/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${activeKey}"
  },
  body: JSON.stringify({
    model: "${exampleModel}",
    messages: [
      { role: "user", content: "你好" }
    ]
  })
})`;
  }, [activeKey, apiBaseUrl, exampleModel]);

  const resetDashboardData = useCallback(() => {
    setBalance(0);
    setApiKeys([]);
    setOrders([]);
    setUsageLogs([]);
    setCreatedApiKey("");
    setDataMessage("");
    setProfileRole("user");
    setManualRechargeEmail("");
    setManualRechargeAmount("");
    setManualRechargeNote("");
    setManualRechargeMessage("");
    setAdminModels([]);
    setAdminSuppliers([]);
    setAdminUsers([]);
    setAdminUsersLoading(false);
    setAdminUsersMessage("");
    setUserSearch("");
    setUserRoleFilter("all");
    setUserSort("balance_desc");
    setSelectedAdminUser(null);
    setAdminUserDetailView(null);
    setAdminUserApiKeys([]);
    setAdminUserUsageLogs([]);
    setAdminUserOrders([]);
    setAdminUserDetailLoading(false);
    setUserRoleSubmittingId("");
    setBalanceAdjustUser(null);
    setBalanceAdjustMode("increase");
    setBalanceAdjustAmount("");
    setBalanceAdjustNote("");
    setBalanceAdjustSubmitting(false);
    setFinanceRange("today");
    setFinanceSummary(null);
    setFinanceRankings([]);
    setRecentFinanceOrders([]);
    setFinanceLoading(false);
    setFinanceMessage("");
    setErrorRange("today");
    setErrorEmailSearch("");
    setErrorStatusFilter("all");
    setErrorHttpStatusFilter("all");
    setErrorModelFilter("all");
    setErrorSupplierFilter("all");
    setErrorSummary(null);
    setErrorLogs([]);
    setErrorLoading(false);
    setErrorMessage("");
    setSelectedErrorLog(null);
    setDisablingApiKeyId("");
    setModelForm(emptyModelForm);
    setEditModelForm(emptyModelForm);
    setEditingModelId("");
    setAdminModelMessage("");
    setSupplierForm(emptySupplierForm);
    setEditSupplierForm(emptySupplierForm);
    setEditingSupplierId("");
    setAdminSupplierMessage("");
    setChatMessages([]);
    setChatInput("你好");
    setChatError("");
    setChatRawResponse("");
    setChatApiKeys([]);
    setSelectedChatApiKeyId("");
    setChatKeysLoading(false);
    setChatKeysMessage("");
  }, []);

  const loadEnabledModels = useCallback(async () => {
    if (!supabase) {
      setModelsMessage("Supabase 未配置，暂时显示本地默认模型。");
      setModelList(fallbackModelList);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("models")
        .select(
          "id,name,upstream_model,display_name,supplier_name,provider,input_price_per_1k,output_price_per_1k,enabled,description,sort_order,created_at,updated_at"
        )
        .eq("enabled", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      const nextModels = ((data ?? []) as ModelRow[]).map((row) => mapModel(row));
      setModelList(nextModels);
      setModelsMessage(nextModels.length === 0 ? "当前没有启用的模型，请联系管理员启用模型。" : "");
    } catch (error) {
      console.error(error);
      setModelList(fallbackModelList);
      setModelsMessage("模型列表读取失败。请确认已经在 Supabase SQL Editor 执行最新 user-data-schema.sql。");
    }
  }, []);

  const loadAdminModels = useCallback(async () => {
    if (!supabase) {
      setAdminModels([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("models")
        .select(
          "id,name,upstream_model,display_name,supplier_name,provider,input_price_per_1k,output_price_per_1k,enabled,description,sort_order,created_at,updated_at"
        )
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      setAdminModels(((data ?? []) as ModelRow[]).map((row) => mapModel(row)));
    } catch (error) {
      console.error(error);
      setAdminModelMessage("模型管理数据读取失败，请确认 models 表和 RLS policy 已执行。");
    }
  }, []);

  const loadAdminSuppliers = useCallback(async () => {
    if (!supabase) {
      setAdminSuppliers([]);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("list_suppliers_admin");

      if (error) {
        throw error;
      }

      setAdminSuppliers(((data ?? []) as SupplierRow[]).map((row) => mapSupplier(row)));
    } catch (error) {
      console.error(error);
      setAdminSupplierMessage("供应商线路读取失败，请确认 suppliers 表、RLS policy 和 list_suppliers_admin RPC 已执行。");
    }
  }, []);

  const loadAdminUsers = useCallback(async () => {
    if (!supabase) {
      setAdminUsers([]);
      return;
    }

    const { sortKey, sortDirection } = parseAdminUserSort(userSort);
    setAdminUsersLoading(true);

    try {
      const { data, error } = await supabase.rpc("list_users_admin", {
        search_email: userSearch.trim() || null,
        role_filter: userRoleFilter,
        sort_key: sortKey,
        sort_direction: sortDirection,
      });

      if (error) {
        throw error;
      }

      setAdminUsers(((data ?? []) as AdminUserRow[]).map((row) => mapAdminUser(row)));
    } catch (error) {
      console.error(error);
      setAdminUsersMessage("用户管理数据读取失败，请确认 list_users_admin RPC 已执行。");
    } finally {
      setAdminUsersLoading(false);
    }
  }, [userRoleFilter, userSearch, userSort]);

  const findAdminUserByEmail = useCallback(async (targetEmail: string) => {
    if (!supabase) {
      return null;
    }

    const normalizedEmail = targetEmail.trim().toLowerCase();
    const { data, error } = await supabase.rpc("list_users_admin", {
      search_email: targetEmail,
      role_filter: "all",
      sort_key: "created_at",
      sort_direction: "desc",
    });

    if (error) {
      throw error;
    }

    const matchedRow = ((data ?? []) as AdminUserRow[]).find(
      (row) => row.email?.trim().toLowerCase() === normalizedEmail
    );

    return matchedRow ? mapAdminUser(matchedRow) : null;
  }, []);

  const adjustUserBalanceAdmin = useCallback(
    async (targetUserId: string, adjustmentAmount: number, adjustmentNote: string) => {
      if (!supabase) {
        throw new Error("Supabase 未配置");
      }

      const { data, error } = await supabase.rpc("adjust_user_balance_admin", {
        target_user_id: targetUserId,
        adjustment_amount: adjustmentAmount,
        adjustment_note: adjustmentNote,
      });

      if (error) {
        throw error;
      }

      return Array.isArray(data)
        ? (data[0] as BalanceAdjustmentResult | undefined)
        : (data as BalanceAdjustmentResult | null);
    },
    []
  );

  const loadAdminFinance = useCallback(async () => {
    if (!supabase) {
      setFinanceSummary(null);
      setFinanceRankings([]);
      setRecentFinanceOrders([]);
      return;
    }

    setFinanceLoading(true);
    setFinanceMessage("");

    try {
      const [summaryResult, rankingsResult, ordersResult] = await Promise.all([
        supabase.rpc("get_finance_summary_admin", {
          range_filter: financeRange,
        }),
        supabase.rpc("get_finance_rankings_admin", {
          range_filter: financeRange,
        }),
        supabase.rpc("get_recent_orders_admin"),
      ]);

      const firstError = summaryResult.error ?? rankingsResult.error ?? ordersResult.error;

      if (firstError) {
        throw firstError;
      }

      const summaryData = Array.isArray(summaryResult.data)
        ? (summaryResult.data[0] as FinanceSummaryRow | undefined)
        : (summaryResult.data as FinanceSummaryRow | null);

      setFinanceSummary(summaryData ?? null);
      setFinanceRankings((rankingsResult.data ?? []) as FinanceRankingRow[]);
      setRecentFinanceOrders((ordersResult.data ?? []) as RecentFinanceOrderRow[]);
    } catch (error) {
      console.error(error);
      setFinanceMessage("财务统计读取失败，请确认最新 finance admin RPC 已在 Supabase SQL Editor 执行。");
    } finally {
      setFinanceLoading(false);
    }
  }, [financeRange]);

  const loadAdminErrors = useCallback(async () => {
    if (!supabase) {
      setErrorSummary(null);
      setErrorLogs([]);
      return;
    }

    setErrorLoading(true);
    setErrorMessage("");

    try {
      const [summaryResult, logsResult] = await Promise.all([
        supabase.rpc("get_error_summary_admin"),
        supabase.rpc("list_error_logs_admin", {
          search_email: errorEmailSearch.trim() || null,
          status_filter: errorStatusFilter,
          http_status_filter: Number.isFinite(errorHttpStatusValue) ? errorHttpStatusValue : null,
          model_filter: errorModelFilter,
          supplier_filter: errorSupplierFilter,
          range_filter: errorRange,
          limit_count: 100,
        }),
      ]);

      const firstError = summaryResult.error ?? logsResult.error;

      if (firstError) {
        throw firstError;
      }

      const summaryData = Array.isArray(summaryResult.data)
        ? (summaryResult.data[0] as ErrorSummaryRow | undefined)
        : (summaryResult.data as ErrorSummaryRow | null);

      setErrorSummary(summaryData ?? null);
      setErrorLogs((logsResult.data ?? []) as ErrorLogRow[]);
    } catch (error) {
      console.error(error);
      setErrorMessage("异常请求读取失败，请确认最新 error monitoring RPC 和 usage_logs 字段已在 Supabase SQL Editor 执行。");
    } finally {
      setErrorLoading(false);
    }
  }, [
    errorEmailSearch,
    errorHttpStatusValue,
    errorModelFilter,
    errorRange,
    errorStatusFilter,
    errorSupplierFilter,
  ]);

  const loadDashboardData = useCallback(async (nextSession: Session) => {
    if (!supabase) {
      resetDashboardData();
      return;
    }

    setDataLoading(true);
    setDataMessage("");

    const userId = nextSession.user.id;

    try {
      const [profileResult, apiKeysResult, ordersResult, usageLogsResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id,email,balance,role,created_at")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("api_keys")
            .select("id,name,key_prefix,created_at,revoked")
            .eq("user_id", userId)
            .eq("revoked", false)
            .order("created_at", { ascending: false }),
          supabase
            .from("orders")
            .select("id,amount,method,status,note,created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("usage_logs")
            .select("id,model,supplier_name,prompt_tokens,completion_tokens,cost,status,created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        ]);

      const firstError =
        profileResult.error ??
        apiKeysResult.error ??
        ordersResult.error ??
        usageLogsResult.error;

      if (firstError) {
        throw firstError;
      }

      const profile = profileResult.data as ProfileRow | null;
      setBalance(Number(profile?.balance ?? 0));
      setProfileRole(profile?.role ?? "user");
      setEmail(profile?.email ?? nextSession.user.email ?? "");
      setApiKeys(((apiKeysResult.data ?? []) as ApiKeyRow[]).map((row) => mapApiKey(row)));
      setOrders(((ordersResult.data ?? []) as OrderRow[]).map((row) => mapOrder(row)));
      setUsageLogs(((usageLogsResult.data ?? []) as UsageLogRow[]).map((row) => mapUsageLog(row)));
    } catch (error) {
      console.error(error);
      resetDashboardData();
      setDataMessage("数据库数据读取失败。请确认已经在 Supabase SQL Editor 执行 user-data-schema.sql。");
    } finally {
      setDataLoading(false);
    }
  }, [resetDashboardData]);

  const loadChatApiKeys = useCallback(async (nextSession?: Session | null) => {
    const activeSession = nextSession ?? session;

    if (!activeSession) {
      setChatApiKeys([]);
      setSelectedChatApiKeyId("");
      setChatKeysMessage("");
      return;
    }

    setChatKeysLoading(true);
    setChatKeysMessage("");

    try {
      const response = await fetch("/api/chat/keys", {
        headers: {
          Authorization: `Bearer ${activeSession.access_token}`,
        },
      });
      const data = (await response.json()) as {
        api_keys?: ChatApiKeyRow[];
        error?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(data.error?.message ?? "API Key 读取失败");
      }

      const nextKeys = (data.api_keys ?? []).map((row) => mapChatApiKey(row));

      setChatApiKeys(nextKeys);
      setSelectedChatApiKeyId((currentId) =>
        nextKeys.some((key) => key.id === currentId) ? currentId : nextKeys[0]?.id ?? ""
      );
    } catch (error) {
      console.error(error);
      setChatApiKeys([]);
      setSelectedChatApiKeyId("");
      setChatKeysMessage(getErrorMessage(error));
    } finally {
      setChatKeysLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEnabledModels();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEnabledModels]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const preferredModel = chatAvailableModels.find((model) => model.name === "deepseek-chat") ?? chatAvailableModels[0];

      if (!preferredModel) {
        setChatModel("");
        return;
      }

      setChatModel((currentModel) =>
        chatAvailableModels.some((model) => model.name === currentModel) ? currentModel : preferredModel.name
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [chatAvailableModels]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadChatApiKeys();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadChatApiKeys]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({
      block: "end",
    });
  }, [chatLoading, chatMessages.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAdmin) {
        void Promise.all([loadAdminModels(), loadAdminSuppliers()]);
      } else {
        setAdminModels([]);
        setAdminSuppliers([]);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isAdmin, loadAdminModels, loadAdminSuppliers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAdmin) {
        void loadAdminUsers();
      } else {
        setAdminUsers([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isAdmin, loadAdminUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAdmin) {
        void loadAdminFinance();
      } else {
        setFinanceSummary(null);
        setFinanceRankings([]);
        setRecentFinanceOrders([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isAdmin, loadAdminFinance]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAdmin) {
        void loadAdminErrors();
      } else {
        setErrorSummary(null);
        setErrorLogs([]);
        setSelectedErrorLog(null);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [isAdmin, loadAdminErrors]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setEmail(data.session?.user.email ?? "");
      if (data.session) {
        void loadDashboardData(data.session);
      } else {
        resetDashboardData();
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setEmail(nextSession?.user.email ?? "");
      if (nextSession) {
        void loadDashboardData(nextSession);
      } else {
        resetDashboardData();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadDashboardData, resetDashboardData]);

  useEffect(() => {
    if (!dashboardScrollTarget || page !== "dashboard") {
      return;
    }

    const timer = window.setTimeout(() => {
      document.getElementById(dashboardScrollTarget)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setDashboardScrollTarget("");
    }, 80);

    return () => window.clearTimeout(timer);
  }, [activeDashboardTab, dashboardScrollTarget, page]);

  const showCopyMessage = (message: string) => {
    if (copyTimer.current) {
      clearTimeout(copyTimer.current);
    }

    setCopiedText(message);
    copyTimer.current = setTimeout(() => setCopiedText(""), 1500);
  };

  const copy = async (text: string, label = "已复制") => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API is unavailable");
      }

      await navigator.clipboard.writeText(text);
      showCopyMessage(label);
    } catch {
      showCopyMessage("复制失败，请手动复制");
    }
  };

  const openDashboard = () => {
    if (authLoading || !session) {
      setAuthMode("login");
      setAuthMessage("");
      setLoginOpen(true);
      return;
    }
    setMenuOpen(false);
    setPage("dashboard");
  };

  const navigateDashboardModule = (item: DashboardNavItem) => {
    setFunctionNavOpen(false);
    setDashboardScrollTarget(item.id);
    setPage("dashboard");
    setDashboardTab(item.tab);
  };

  const closeLoginDialog = () => {
    setLoginOpen(false);
    setAuthMessage("");
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage("");

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage("请先在 Netlify 或本地 .env.local 中配置 Supabase URL 和 Publishable key。");
      return;
    }

    if (!email.trim() || password.length < 6) {
      setAuthMessage("请输入邮箱，并使用至少 6 位密码。");
      return;
    }

    setAuthSubmitting(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo:
              typeof window === "undefined" ? undefined : window.location.origin,
          },
        });

        if (error) {
          setAuthMessage(error.message);
          return;
        }

        if (data.session) {
          setSession(data.session);
          void loadDashboardData(data.session);
          setLoginOpen(false);
          setPage("dashboard");
          return;
        }

        setAuthMessage("注册成功，请先打开邮箱确认邮件，然后再登录。");
        setAuthMode("login");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      if (data.session) {
        setSession(data.session);
        void loadDashboardData(data.session);
        setLoginOpen(false);
        setPage("dashboard");
        return;
      }

      setAuthMessage("登录没有返回会话，请检查 Supabase 邮箱确认设置。");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const logout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showCopyMessage(`退出失败：${error.message}`);
        return;
      }
    }

    setSession(null);
    setPassword("");
    setFunctionNavOpen(false);
    resetDashboardData();
    setPage("home");
  };

  const addApiKey = async () => {
    if (!supabase || !session) {
      openDashboard();
      return;
    }

    try {
      const fullKey = createLiveApiKey();
      const keyPrefix = fullKey.slice(0, API_KEY_PREFIX_LENGTH);
      const keyHash = await sha256Hex(fullKey);
      const keyName = `项目密钥 ${apiKeys.length + 1}`;

      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          user_id: session.user.id,
          name: keyName,
          key_prefix: keyPrefix,
          key_hash: keyHash,
        })
        .select("id,name,key_prefix,created_at,revoked")
        .single();

      if (error) {
        throw error;
      }

      const createdKey = mapApiKey(data as ApiKeyRow, fullKey);
      setApiKeys((items) => [createdKey, ...items]);
      setCreatedApiKey(fullKey);
      setShowKeys(true);
      setSelectedChatApiKeyId(createdKey.id);
      void loadChatApiKeys(session);
      showCopyMessage("API Key 已创建，完整密钥只可复制一次。");
    } catch (error) {
      console.error(error);
      showCopyMessage("创建失败，请确认 api_keys 表和 RLS 策略已经执行。");
    }
  };

  const revokeApiKey = async (item: ApiKeyItem) => {
    if (!supabase || !session) {
      return;
    }

    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ revoked: true })
        .eq("id", item.id)
        .eq("user_id", session.user.id);

      if (error) {
        throw error;
      }

      setApiKeys((items) => items.filter((key) => key.id !== item.id));
      setChatApiKeys((items) => items.filter((key) => key.id !== item.id));
      setSelectedChatApiKeyId((currentId) => (currentId === item.id ? "" : currentId));
      if (item.oneTimeKey && createdApiKey === item.oneTimeKey) {
        setCreatedApiKey("");
      }
      void loadChatApiKeys(session);
      showCopyMessage("API Key 已撤销。");
    } catch (error) {
      console.error(error);
      showCopyMessage("撤销失败，请稍后重试。");
    }
  };

  const runTest = () => {
    const promptTokens = Math.max(20, Math.round(testPrompt.length * 1.8));
    const completionTokens = Math.floor(120 + Math.random() * 260);
    const cost = Number(
      (
        (promptTokens / 1000) * selectedModelInfo.inputPricePer1K +
        (completionTokens / 1000) * selectedModelInfo.outputPricePer1K
      ).toFixed(4)
    );
    const total = promptTokens + completionTokens;

    setTestResult(
      `演示回复：你的请求已通过 ${selectedModelName} 处理。\n\n这是本地模拟结果，不会请求真实 AI API，也不会写入 usage_logs。\n\nTokens：${total}\n模拟费用：¥${cost.toFixed(4)}`
    );
  };

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userContent = chatInput.trim();

    if (!userContent) {
      setChatError("请输入要发送的内容。");
      return;
    }

    if (!session) {
      setChatError("请先登录后再使用 AI 聊天。");
      return;
    }

    if (!activeChatApiKey) {
      setChatError("你还没有 API Key，请先到 API Key 页面创建一个。");
      return;
    }

    if (!chatModelInfo) {
      setChatError("当前没有可用模型，请联系管理员启用模型。");
      return;
    }

    const requestModel = chatModelInfo.name;
    const userMessage: ChatMessage = {
      id: createChatMessageId(),
      role: "user",
      content: userContent,
      model: requestModel,
      createdAt: formatChatMessageTime(),
    };
    const nextMessages = [...chatMessages, userMessage];

    setChatMessages(nextMessages);
    setChatInput("");
    setChatError("");
    setChatRawResponse("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          model: requestModel,
          api_key_id: activeChatApiKey.id,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });
      const responseText = await response.text();
      let responseData: ChatCompletionResponse | null = null;

      if (responseText) {
        try {
          responseData = JSON.parse(responseText) as ChatCompletionResponse;
        } catch {
          responseData = null;
        }
      }

      setChatRawResponse(responseData ? JSON.stringify(responseData, null, 2) : responseText);

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error("余额不足，请先充值。");
        }

        throw new Error(readChatApiError(responseData, responseText || response.statusText));
      }

      const assistantReply =
        readChatAssistantReply(responseData) || responseText || "接口返回成功，但没有可展示的 assistant 内容。";

      setChatMessages((items) => [
        ...items,
        {
          id: createChatMessageId(),
          role: "assistant",
          content: assistantReply,
          model: requestModel,
          createdAt: formatChatMessageTime(),
        },
      ]);

      if (session) {
        void loadDashboardData(session);
        void loadChatApiKeys(session);
      }
    } catch (error) {
      setChatError(getErrorMessage(error));
    } finally {
      setChatLoading(false);
    }
  };

  const recharge = (amount: number) => {
    showCopyMessage(`已选择 ¥${amount}，当前版本暂不接支付；订单和余额需要后台人工处理。`);
  };

  const handleManualRecharge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualRechargeMessage("");

    if (!supabase || !session || !isAdmin) {
      setManualRechargeMessage("not admin");
      return;
    }

    const targetEmail = manualRechargeEmail.trim();
    const rechargeAmount = Number(manualRechargeAmount);
    const rechargeNote = manualRechargeNote.trim();

    if (!targetEmail || !Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
      setManualRechargeMessage("请输入用户邮箱，并填写大于 0 的充值金额。");
      return;
    }

    if (!rechargeNote) {
      setManualRechargeMessage("请填写备注。");
      return;
    }

    setManualRechargeSubmitting(true);

    try {
      const targetUser = await findAdminUserByEmail(targetEmail);

      if (!targetUser) {
        setManualRechargeMessage("目标用户不存在");
        return;
      }

      const result = await adjustUserBalanceAdmin(targetUser.id, rechargeAmount, rechargeNote);
      setManualRechargeMessage(
        `充值成功：${result?.email ?? targetUser.email} 增加 ¥${Number(result?.amount ?? rechargeAmount).toFixed(2)}，当前余额 ¥${Number(result?.new_balance ?? targetUser.balance + rechargeAmount).toFixed(2)}。`
      );
      setManualRechargeEmail("");
      setManualRechargeAmount("");
      setManualRechargeNote("");

      await Promise.all([loadAdminUsers(), loadDashboardData(session)]);
    } catch (error) {
      console.error(error);
      if (isAdminPermissionError(error)) {
        setManualRechargeMessage("not admin");
      } else {
        setManualRechargeMessage(`充值失败：${getErrorMessage(error)}`);
      }
    } finally {
      setManualRechargeSubmitting(false);
    }
  };

  const updateAdminUserRole = async (user: AdminUserItem, nextRole: "admin" | "user") => {
    setAdminUsersMessage("");

    if (!supabase || !session || !isAdmin) {
      setAdminUsersMessage("只有管理员可以修改用户角色。");
      return;
    }

    setUserRoleSubmittingId(user.id);

    try {
      const { error } = await supabase.rpc("set_user_role_admin", {
        target_user_id: user.id,
        target_role: nextRole,
      });

      if (error) {
        throw error;
      }

      setAdminUsersMessage(`${user.email} 已设为 ${nextRole}。`);
      await Promise.all([loadAdminUsers(), loadDashboardData(session)]);
    } catch (error) {
      console.error(error);
      setAdminUsersMessage(`角色更新失败：${getErrorMessage(error)}`);
    } finally {
      setUserRoleSubmittingId("");
    }
  };

  const startBalanceAdjust = (user: AdminUserItem, mode: BalanceAdjustMode) => {
    setBalanceAdjustUser(user);
    setBalanceAdjustMode(mode);
    setBalanceAdjustAmount("");
    setBalanceAdjustNote("");
    setAdminUsersMessage(`正在${mode === "increase" ? "增加" : "减少"} ${user.email} 的余额。`);
  };

  const cancelBalanceAdjust = () => {
    setBalanceAdjustUser(null);
    setBalanceAdjustAmount("");
    setBalanceAdjustNote("");
  };

  const submitBalanceAdjust = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminUsersMessage("");

    if (!supabase || !session || !isAdmin || !balanceAdjustUser) {
      setAdminUsersMessage("只有管理员可以调整余额。");
      return;
    }

    const parsedAmount = Number(balanceAdjustAmount);
    const note = balanceAdjustNote.trim();

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAdminUsersMessage("请输入大于 0 的调整金额。");
      return;
    }

    if (!note) {
      setAdminUsersMessage("调整余额必须填写备注。");
      return;
    }

    const adjustmentAmount = balanceAdjustMode === "increase" ? parsedAmount : -parsedAmount;
    setBalanceAdjustSubmitting(true);

    try {
      await adjustUserBalanceAdmin(balanceAdjustUser.id, adjustmentAmount, note);

      setAdminUsersMessage(
        `${balanceAdjustUser.email} 余额已${balanceAdjustMode === "increase" ? "增加" : "减少"} ¥${parsedAmount.toFixed(2)}。`
      );
      cancelBalanceAdjust();
      await Promise.all([loadAdminUsers(), loadDashboardData(session)]);
    } catch (error) {
      console.error(error);
      setAdminUsersMessage(`余额调整失败：${getErrorMessage(error)}`);
    } finally {
      setBalanceAdjustSubmitting(false);
    }
  };

  const openAdminUserDetail = async (user: AdminUserItem, view: AdminUserDetailView) => {
    setSelectedAdminUser(user);
    setAdminUserDetailView(view);
    setAdminUsersMessage("");
    setAdminUserApiKeys([]);
    setAdminUserUsageLogs([]);
    setAdminUserOrders([]);

    if (!supabase || !isAdmin) {
      setAdminUsersMessage("只有管理员可以查看用户详情。");
      return;
    }

    setAdminUserDetailLoading(true);

    try {
      if (view === "apiKeys") {
        const { data, error } = await supabase.rpc("list_user_api_keys_admin", {
          target_user_id: user.id,
        });

        if (error) {
          throw error;
        }

        setAdminUserApiKeys((data ?? []) as AdminUserApiKeyRow[]);
      }

      if (view === "usage") {
        const { data, error } = await supabase.rpc("list_user_usage_logs_admin", {
          target_user_id: user.id,
          limit_count: 20,
        });

        if (error) {
          throw error;
        }

        setAdminUserUsageLogs((data ?? []) as AdminUserUsageRow[]);
      }

      if (view === "orders") {
        const { data, error } = await supabase.rpc("list_user_orders_admin", {
          target_user_id: user.id,
          limit_count: 20,
        });

        if (error) {
          throw error;
        }

        setAdminUserOrders((data ?? []) as AdminUserOrderRow[]);
      }
    } catch (error) {
      console.error(error);
      setAdminUsersMessage(`用户详情读取失败：${getErrorMessage(error)}`);
    } finally {
      setAdminUserDetailLoading(false);
    }
  };

  const jumpToAdminSection = (id: string) => {
    setPage("dashboard");
    setDashboardTab("admin");
    setDashboardScrollTarget(id);
  };

  const viewErrorUser = (log: ErrorLogRow) => {
    if (!log.email) {
      setErrorMessage("这条异常无法关联到具体用户，通常是缺失或无效 API Key。");
      return;
    }

    setUserSearch(log.email);
    setErrorMessage(`已将用户管理搜索条件设置为 ${log.email}。`);
    jumpToAdminSection("users");
  };

  const viewErrorApiKeyRecords = (log: ErrorLogRow) => {
    setSelectedErrorLog(log);
    setErrorMessage(
      log.api_key_prefix
        ? `已展开 API Key ${log.api_key_prefix} 的异常详情。完整 Key 不会显示。`
        : "这条异常没有可关联的 API Key 前缀。"
    );
  };

  const disableErrorApiKey = async (log: ErrorLogRow) => {
    if (!supabase || !session || !isAdmin) {
      setErrorMessage("只有管理员可以禁用 API Key。");
      return;
    }

    if (!log.api_key_id) {
      setErrorMessage("这条异常没有可禁用的 API Key，可能是缺失或无效 Key 请求。");
      return;
    }

    setDisablingApiKeyId(log.api_key_id);
    setErrorMessage("");

    try {
      const { error } = await supabase.rpc("disable_api_key_admin", {
        target_api_key_id: log.api_key_id,
      });

      if (error) {
        throw error;
      }

      setErrorMessage(`API Key ${log.api_key_prefix ?? log.api_key_id} 已禁用。`);
      await Promise.all([loadAdminErrors(), loadAdminUsers()]);
    } catch (error) {
      console.error(error);
      setErrorMessage(`API Key 禁用失败：${getErrorMessage(error)}`);
    } finally {
      setDisablingApiKeyId("");
    }
  };

  const resetModelForm = () => {
    setModelForm(emptyModelForm);
    setEditModelForm(emptyModelForm);
    setEditingModelId("");
  };

  const startEditModel = (model: ModelItem) => {
    if (!model.id) {
      return;
    }

    setEditingModelId(model.id);
    setEditModelForm(modelToForm(model));
    setAdminModelMessage(`正在编辑模型：${model.name}`);
  };

  const parseModelForm = (form: ModelFormState) => {
    const name = form.name.trim();
    const displayName = form.displayName.trim();
    const upstreamModel = form.upstreamModel.trim();
    const supplierName = form.supplierName.trim() || "deepseek";
    const provider = form.provider.trim() || "deepseek";
    const inputPrice = Number(form.inputPrice);
    const outputPrice = Number(form.outputPrice);
    const sortOrder = Number(form.sortOrder || 100);
    const description = form.description.trim() || null;

    if (!name || !displayName || !upstreamModel || !supplierName) {
      return {
        error: "请填写 model name、展示名称、上游模型名和供应商线路。",
        payload: null,
      };
    }

    if (
      !Number.isFinite(inputPrice) ||
      inputPrice < 0 ||
      !Number.isFinite(outputPrice) ||
      outputPrice < 0
    ) {
      return {
        error: "模型价格必须是大于等于 0 的数字。",
        payload: null,
      };
    }

    return {
      error: "",
      payload: {
        name,
        upstream_model: upstreamModel,
        display_name: displayName,
        supplier_name: supplierName,
        provider,
        input_price_per_1k: inputPrice,
        output_price_per_1k: outputPrice,
        enabled: form.enabled,
        description,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 100,
      },
    };
  };

  const handleModelSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminModelMessage("");

    if (!supabase || !session || !isAdmin) {
      setAdminModelMessage("只有管理员可以管理模型价格。");
      return;
    }

    const { error: formError, payload } = parseModelForm(modelForm);

    if (formError || !payload) {
      setAdminModelMessage(formError);
      return;
    }

    setModelSubmitting(true);

    try {
      const { error } = await supabase.from("models").insert(payload);

      if (error) {
        throw error;
      }

      setAdminModelMessage(`模型已新增：${payload.name}`);
      setModelForm(emptyModelForm);
      await Promise.all([loadEnabledModels(), loadAdminModels()]);
    } catch (error) {
      console.error(error);
      setAdminModelMessage(`模型保存失败：${getErrorMessage(error)}`);
    } finally {
      setModelSubmitting(false);
    }
  };

  const saveEditedModel = async (model: ModelItem) => {
    setAdminModelMessage("");

    if (!supabase || !session || !isAdmin || !model.id) {
      setAdminModelMessage("只有管理员可以编辑模型价格。");
      return;
    }

    const { error: formError, payload } = parseModelForm({
      ...editModelForm,
      name: model.name,
    });

    if (formError || !payload) {
      setAdminModelMessage(formError);
      return;
    }

    const { name: _name, ...updatePayload } = payload;
    void _name;
    setModelSubmitting(true);

    try {
      const { error } = await supabase.from("models").update(updatePayload).eq("id", model.id);

      if (error) {
        throw error;
      }

      setAdminModelMessage(`模型已更新：${model.name}`);
      setEditingModelId("");
      setEditModelForm(emptyModelForm);
      await Promise.all([loadEnabledModels(), loadAdminModels()]);
    } catch (error) {
      console.error(error);
      setAdminModelMessage(`模型保存失败：${getErrorMessage(error)}`);
    } finally {
      setModelSubmitting(false);
    }
  };

  const toggleModelEnabled = async (model: ModelItem) => {
    if (!supabase || !session || !isAdmin || !model.id) {
      setAdminModelMessage("只有管理员可以启用或禁用模型。");
      return;
    }

    setModelSubmitting(true);
    setAdminModelMessage("");

    try {
      const { error } = await supabase
        .from("models")
        .update({ enabled: !model.enabled })
        .eq("id", model.id);

      if (error) {
        throw error;
      }

      setAdminModelMessage(`${model.name} 已${model.enabled ? "禁用" : "启用"}。`);
      await Promise.all([loadEnabledModels(), loadAdminModels()]);
    } catch (error) {
      console.error(error);
      setAdminModelMessage(`状态更新失败：${getErrorMessage(error)}`);
    } finally {
      setModelSubmitting(false);
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm(emptySupplierForm);
    setEditSupplierForm(emptySupplierForm);
    setEditingSupplierId("");
  };

  const startEditSupplier = (supplier: SupplierItem) => {
    if (!supplier.id) {
      return;
    }

    setEditingSupplierId(supplier.id);
    setEditSupplierForm(supplierToForm(supplier));
    setAdminSupplierMessage(`正在编辑供应商线路：${supplier.name}`);
  };

  const parseSupplierForm = (form: SupplierFormState, includeName: boolean) => {
    const name = form.name.trim();
    const displayName = form.displayName.trim();
    const baseUrl = form.baseUrl.trim().replace(/\/+$/u, "");
    const providerType = form.providerType.trim() || "openai-compatible";
    const priority = Number(form.priority || 100);
    const notes = form.notes.trim() || null;
    const apiKey = form.apiKey.trim();

    if ((includeName && !name) || !displayName || !baseUrl || !providerType) {
      return {
        error: "请填写供应商 name、展示名称、Base URL 和 provider_type。",
        payload: null,
      };
    }

    try {
      new URL(baseUrl);
    } catch {
      return {
        error: "Base URL 必须是有效 URL，例如 https://api.deepseek.com/v1。",
        payload: null,
      };
    }

    if (!Number.isFinite(priority)) {
      return {
        error: "priority 必须是数字。",
        payload: null,
      };
    }

    return {
      error: "",
      payload: {
        ...(includeName ? { name } : {}),
        display_name: displayName,
        base_url: baseUrl,
        ...(apiKey ? { api_key_encrypted: apiKey } : {}),
        provider_type: providerType,
        enabled: form.enabled,
        priority,
        notes,
      },
    };
  };

  const handleSupplierSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminSupplierMessage("");

    if (!supabase || !session || !isAdmin) {
      setAdminSupplierMessage("只有管理员可以管理供应商线路。");
      return;
    }

    const { error: formError, payload } = parseSupplierForm(supplierForm, true);

    if (formError || !payload) {
      setAdminSupplierMessage(formError);
      return;
    }

    setSupplierSubmitting(true);

    try {
      const { error } = await supabase.from("suppliers").insert(payload);

      if (error) {
        throw error;
      }

      setAdminSupplierMessage(`供应商线路已新增：${supplierForm.name.trim()}`);
      setSupplierForm(emptySupplierForm);
      await loadAdminSuppliers();
    } catch (error) {
      console.error(error);
      setAdminSupplierMessage(`供应商保存失败：${getErrorMessage(error)}`);
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const saveEditedSupplier = async (supplier: SupplierItem) => {
    setAdminSupplierMessage("");

    if (!supabase || !session || !isAdmin || !supplier.id) {
      setAdminSupplierMessage("只有管理员可以编辑供应商线路。");
      return;
    }

    const { error: formError, payload } = parseSupplierForm(editSupplierForm, false);

    if (formError || !payload) {
      setAdminSupplierMessage(formError);
      return;
    }

    setSupplierSubmitting(true);

    try {
      const { error } = await supabase.from("suppliers").update(payload).eq("id", supplier.id);

      if (error) {
        throw error;
      }

      setAdminSupplierMessage(`供应商线路已更新：${supplier.name}`);
      setEditingSupplierId("");
      setEditSupplierForm(emptySupplierForm);
      await loadAdminSuppliers();
    } catch (error) {
      console.error(error);
      setAdminSupplierMessage(`供应商保存失败：${getErrorMessage(error)}`);
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const toggleSupplierEnabled = async (supplier: SupplierItem) => {
    if (!supabase || !session || !isAdmin || !supplier.id) {
      setAdminSupplierMessage("只有管理员可以启用或禁用供应商线路。");
      return;
    }

    setSupplierSubmitting(true);
    setAdminSupplierMessage("");

    try {
      const { error } = await supabase
        .from("suppliers")
        .update({ enabled: !supplier.enabled })
        .eq("id", supplier.id);

      if (error) {
        throw error;
      }

      setAdminSupplierMessage(`${supplier.name} 已${supplier.enabled ? "禁用" : "启用"}。`);
      await loadAdminSuppliers();
    } catch (error) {
      console.error(error);
      setAdminSupplierMessage(`供应商状态更新失败：${getErrorMessage(error)}`);
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const LoginDialog = loginOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <Card className="w-full max-w-md rounded-3xl border-white/10 bg-slate-900 text-white shadow-2xl">
        <CardContent className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <BrandMark />
              <h2 className="mt-4 text-2xl font-bold">
                {authMode === "login" ? "登录控制台" : "注册账号"}
              </h2>
            </div>
            <button onClick={closeLoginDialog} type="button">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-slate-950/80 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
              }}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                authMode === "login" ? "bg-white text-slate-950" : "text-slate-300"
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setAuthMessage("");
              }}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                authMode === "signup" ? "bg-white text-slate-950" : "text-slate-300"
              }`}
            >
              注册
            </button>
          </div>
          <form onSubmit={handleAuthSubmit}>
            <label className="text-sm text-slate-300">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
              placeholder="you@example.com"
            />
            <label className="mt-4 block text-sm text-slate-300">密码</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
              placeholder="至少 6 位"
            />
            {authMessage ? (
              <p className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                {authMessage}
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-400">
                当前只接入 Supabase 登录注册；支付、真实 AI API 和数据库业务表暂不启用。
              </p>
            )}
            <Button
              type="submit"
              disabled={authSubmitting || authLoading}
              className="mt-5 w-full rounded-2xl bg-white text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authSubmitting
                ? "处理中..."
                : authMode === "login"
                  ? "登录"
                  : "注册"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  ) : null;

  if (page === "dashboard") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-24 right-10 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        <Button
          type="button"
          onClick={() => setFunctionNavOpen(true)}
          className="fixed left-4 top-28 z-40 rounded-2xl border border-cyan-300/30 bg-slate-900/90 text-white shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-xl hover:bg-slate-800"
        >
          <Menu className="mr-2 h-4 w-4" />
          功能导航
        </Button>

        <div
          className={`fixed inset-0 z-[70] transition ${
            functionNavOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <button
            type="button"
            aria-label="关闭功能导航"
            onClick={() => setFunctionNavOpen(false)}
            className={`absolute inset-0 bg-slate-950/55 transition-opacity ${
              functionNavOpen ? "opacity-100" : "opacity-0"
            }`}
          />
          <aside
            className={`absolute left-0 top-0 flex h-full w-[85vw] flex-col border-r border-cyan-300/20 bg-slate-950/90 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl transition-transform duration-300 sm:w-[420px] lg:w-[25vw] ${
              functionNavOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-sm font-semibold text-cyan-300">后台导航</p>
                <h2 className="mt-1 text-xl font-bold text-white">功能导航</h2>
              </div>
              <button
                type="button"
                aria-label="关闭功能导航"
                onClick={() => setFunctionNavOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-2 overflow-y-auto p-5">
              {functionNavItems.map((item) => {
                const isActive = activeSectionIdByTab[activeDashboardTab] === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateDashboardModule(item)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>

        <header className="relative z-10 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button onClick={() => setPage("home")} className="flex items-center gap-2">
              <BrandMark />
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:flex">
                <User className="h-4 w-4" />
                {userEmail || "已登录用户"}
              </div>
              <Button
                variant="ghost"
                className="text-slate-200 hover:bg-white/10 hover:text-white"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold text-cyan-300">控制台</p>
            <h1 className="mt-2 text-3xl font-black sm:text-5xl">API 管理后台</h1>
            <p className="mt-4 text-slate-300">这是本地演示版：功能能点能用，数据存在浏览器内存，刷新页面会重置。</p>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDashboardTab(tab.key)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition ${
                  activeDashboardTab === tab.key
                    ? "bg-white text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {copiedText ? (
            <div className="mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              {copiedText}
            </div>
          ) : null}

          {dataMessage ? (
            <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {dataMessage}
            </div>
          ) : null}

          {dataLoading ? (
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300">
              正在读取你的 Supabase 数据...
            </div>
          ) : null}

          {activeDashboardTab === "overview" ? (
            <div id="overview" className="scroll-mt-28">
              <SectionTitle label="Overview" title="平台概览" desc="查看余额、请求数、密钥数量和模型数量。" />
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  ["当前余额", `¥${balance.toFixed(4)}`, <Wallet key="wallet" className="h-5 w-5" />],
                  ["API Key 数量", String(apiKeys.length), <KeyRound key="key" className="h-5 w-5" />],
                  ["今日请求", String(usageLogs.length), <Activity key="activity" className="h-5 w-5" />],
                  ["可用模型", String(modelList.length), <Database key="db" className="h-5 w-5" />],
                ].map(([label, value, icon]) => (
                  <Card key={String(label)} className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                    <CardContent className="p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-950">
                        {icon}
                      </div>
                      <p className="text-sm text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-bold">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {activeDashboardTab === "keys" ? (
            <div id="api-keys" className="scroll-mt-28">
              <SectionTitle label="API Key" title="密钥管理" desc="创建、复制和删除你的接口密钥；列表只展示 Key 前缀。" />
              <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <Button
                      onClick={() => setShowKeys(!showKeys)}
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    >
                      {showKeys ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {showKeys ? "隐藏密钥" : "显示密钥"}
                    </Button>
                    <Button onClick={addApiKey} className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                      <Plus className="mr-2 h-4 w-4" />
                      新建 API Key
                    </Button>
                  </div>
                  {createdApiKey ? (
                    <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                      <p className="text-sm font-semibold text-cyan-100">API Key 已创建</p>
                      <p className="mt-2 break-all font-mono text-xs text-cyan-50">
                        前缀：{createdApiKey.slice(0, API_KEY_PREFIX_LENGTH)}...
                      </p>
                      <p className="mt-2 text-xs leading-5 text-cyan-100/80">
                        完整密钥不会在页面明文展示；如需接入外部开发者接口，请立即复制，离开后无法再次获取。
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => copy(createdApiKey, "已复制完整 API Key")}
                          className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          复制
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCreatedApiKey("")}
                          className="text-cyan-100 hover:bg-white/10 hover:text-white"
                        >
                          我已保存
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    {apiKeys.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold">{item.name}</p>
                            <p className="mt-1 break-all font-mono text-xs text-slate-400">
                              {showKeys ? `${item.keyPrefix}...` : `${item.keyPrefix}********************************`}
                            </p>
                            <p className="mt-2 text-xs text-amber-200/80">完整密钥不会在列表中显示。</p>
                            <p className="mt-2 text-xs text-slate-500">创建时间：{item.createdAt}</p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void revokeApiKey(item)}
                              className="hover:bg-red-500/15 hover:text-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {apiKeys.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-400">还没有 API Key，请点击新建。</div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "playground" ? (
            <div id="playground" className="scroll-mt-28">
              <SectionTitle label="Playground" title="在线测试台" desc="当前是本地模拟请求，买完 API Key 后可以接真实模型。" />
              <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <label className="text-sm text-slate-300">选择模型</label>
                  <select
                    value={selectedModelName}
                    onChange={(event) => setSelectedModel(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  >
                    {modelList.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name} - {model.label}
                      </option>
                    ))}
                  </select>
                  <label className="mt-4 block text-sm text-slate-300">输入内容</label>
                  <textarea
                    value={testPrompt}
                    onChange={(event) => setTestPrompt(event.target.value)}
                    className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                  <Button onClick={runTest} className="mt-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                    <Play className="mr-2 h-4 w-4" />
                    发送测试
                  </Button>
                  <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-7 text-slate-200">
                    {testResult}
                  </pre>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "chat" ? (
            <div id="chat" className="scroll-mt-28">
              <SectionTitle
                label="AI Chat"
                title="AI 聊天"
                desc="登录后使用当前账号的 API Key、余额和启用模型发起正式聊天请求。"
              />
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Card className="rounded-3xl border-cyan-300/15 bg-white/[0.06] text-white shadow-[0_0_28px_rgba(34,211,238,0.08)]">
                  <CardContent className="p-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">/api/chat</p>
                          <p className="text-xs text-slate-400">POST · 登录态内部调用</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                          当前模型：{chatModelInfo?.name ?? "暂无可用模型"}
                        </span>
                        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                          当前余额：¥{balance.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    <div className="max-h-[520px] min-h-[330px] overflow-y-auto p-5">
                      {!activeChatApiKey ? (
                        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-amber-300/25 bg-amber-300/10 p-6 text-center">
                          <div>
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-amber-100">
                              <KeyRound className="h-6 w-6" />
                            </div>
                            <p className="font-semibold text-amber-50">你还没有 API Key，请先到 API Key 页面创建一个。</p>
                            <Button
                              type="button"
                              onClick={() =>
                                navigateDashboardModule({
                                  label: "API Key",
                                  id: "api-keys",
                                  tab: "keys",
                                })
                              }
                              className="mt-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-200"
                            >
                              去创建 API Key
                            </Button>
                          </div>
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-cyan-300/20 bg-slate-950/50 p-6 text-center">
                          <div>
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                              <Bot className="h-6 w-6" />
                            </div>
                            <p className="font-semibold text-slate-100">还没有聊天记录</p>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              选择模型，然后发送第一条消息。Enter 发送，Shift+Enter 换行。
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatMessages.map((message) => {
                            const isUserMessage = message.role === "user";

                            return (
                              <div
                                key={message.id}
                                className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[86%] rounded-3xl border px-4 py-3 ${
                                    isUserMessage
                                      ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-50"
                                      : "border-white/10 bg-slate-950/70 text-slate-100"
                                  }`}
                                >
                                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                    {isUserMessage ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                    <span>{isUserMessage ? "你" : "Assistant"}</span>
                                    <span>{message.createdAt}</span>
                                    {message.model ? (
                                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-cyan-200">
                                        {message.model}
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.content}</p>
                                </div>
                              </div>
                            );
                          })}
                          {chatLoading ? (
                            <div className="flex justify-start">
                              <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                                <span className="mr-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                                正在等待模型回复...
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>

                    {chatError ? (
                      <div className="mx-5 mb-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-100">
                        {chatError}
                      </div>
                    ) : null}

                    <form onSubmit={handleChatSubmit} className="border-t border-white/10 p-5">
                      <label className="text-sm text-slate-300">输入内容</label>
                      <textarea
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                          }
                        }}
                        disabled={chatLoading}
                        className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
                        placeholder="请输入要发送给模型的消息"
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs leading-5 text-slate-400">
                          Enter 发送，Shift+Enter 换行；不会把 prompt 或完整 API Key 写入 localStorage。
                        </p>
                        <Button
                          type="submit"
                          disabled={chatLoading || !chatInput.trim() || !activeChatApiKey || !chatModelInfo || !session}
                          className="rounded-2xl bg-white px-5 text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {chatLoading ? "发送中..." : "发送"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-5">
                  <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold">调用设置</h3>
                      <div className="mt-5">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-sm text-slate-300">使用 API Key</label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={chatKeysLoading || !session}
                            onClick={() => void loadChatApiKeys(session)}
                            className="text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {chatKeysLoading ? "刷新中..." : "刷新"}
                          </Button>
                        </div>
                        {chatApiKeys.length > 0 ? (
                          <select
                            value={activeChatApiKey?.id ?? ""}
                            onChange={(event) => setSelectedChatApiKeyId(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                          >
                            {chatApiKeys.map((key) => (
                              <option key={key.id} value={key.id}>
                                {key.name} - {key.keyPrefix}...
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="mt-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                            你还没有 API Key，请先到 API Key 页面创建一个。
                          </div>
                        )}
                        {chatKeysMessage ? (
                          <p className="mt-2 text-xs leading-5 text-rose-200">{chatKeysMessage}</p>
                        ) : (
                          <p className="mt-2 text-xs leading-5 text-slate-400">
                            这里只显示 key_prefix，不显示也不保存完整 API Key。
                          </p>
                        )}
                      </div>

                      <div className="mt-5">
                        <label className="text-sm text-slate-300">选择模型</label>
                        <select
                          value={chatModel}
                          onChange={(event) => setChatModel(event.target.value)}
                          disabled={chatAvailableModels.length === 0}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                        >
                          {chatAvailableModels.map((model) => (
                            <option key={model.name} value={model.name}>
                              {model.name} - {model.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {chatModelInfo ? (
                        <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                          <p className="font-mono text-sm text-cyan-100">{chatModelInfo.name}</p>
                          <p className="mt-2 text-sm font-semibold text-white">{chatModelInfo.label}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{chatModelInfo.desc}</p>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                          当前没有启用模型，请联系管理员在模型价格管理里启用。
                        </div>
                      )}

                      <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                        <p className="text-sm text-emerald-100">账户余额</p>
                        <p className="mt-2 text-2xl font-black text-white">¥{balance.toFixed(4)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold">接口返回结果</h3>
                        {chatRawResponse ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => copy(chatRawResponse, "已复制接口返回结果")}
                            className="text-slate-300 hover:bg-white/10 hover:text-white"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            复制
                          </Button>
                        ) : null}
                      </div>
                      <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-slate-300">
                        {chatRawResponse || "发送成功后，这里会显示原始 JSON 返回。"}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : null}

          {activeDashboardTab === "models" ? (
            <div id="models" className="scroll-mt-28">
              <SectionTitle label="Models" title="模型列表" desc="这里展示对外模型别名、价格和路由说明。" />
              {modelsMessage ? (
                <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  {modelsMessage}
                </div>
              ) : null}
              <div className="grid gap-4 lg:grid-cols-2">
                {modelList.map((model) => (
                  <Card key={model.name} className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm text-cyan-300">{model.name}</p>
                          <h3 className="mt-2 text-xl font-bold">{model.label}</h3>
                          <p className="mt-2 text-sm text-slate-400">{model.provider}</p>
                          <p className="mt-3 text-slate-300">{model.desc}</p>
                        </div>
                        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">正常</span>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                        <span>输入：{model.inputPrice}</span>
                        <span>输出：{model.outputPrice}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {modelList.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-400">
                  暂无启用模型，请联系管理员在模型价格管理里启用。
                </div>
              ) : null}
            </div>
          ) : null}

          {activeDashboardTab === "usage" ? (
            <div id="usage-logs" className="scroll-mt-28">
              <SectionTitle label="Usage" title="用量记录" desc="从 Supabase usage_logs 表读取。当前测试台不会写入真实用量。" />
              <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          <th className="py-3">时间</th>
                          <th className="py-3">模型</th>
                          <th className="py-3">供应商</th>
                          <th className="py-3">输入</th>
                          <th className="py-3">输出</th>
                          <th className="py-3">费用</th>
                          <th className="py-3">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageLogs.map((log) => (
                          <tr key={log.id} className="border-b border-white/5">
                            <td className="py-3 text-slate-300">{log.time}</td>
                            <td className="py-3 font-mono text-cyan-300">{log.model}</td>
                            <td className="py-3 font-mono text-xs text-slate-300">{log.supplierName}</td>
                            <td className="py-3 text-slate-300">{log.promptTokens}</td>
                            <td className="py-3 text-slate-300">{log.completionTokens}</td>
                            <td className="py-3 text-slate-300">¥{log.cost.toFixed(4)}</td>
                            <td className="py-3 text-emerald-300">{log.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {usageLogs.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-400">
                        还没有用量记录。接入真实 API 中转后，这里会显示 usage_logs 数据。
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "recharge" ? (
            <div id="recharge" className="scroll-mt-28">
              <SectionTitle label="Recharge" title="充值中心" desc="当前只保留演示按钮，不接支付；余额和订单需要后台人工处理。" />
              <div className="grid gap-4 md:grid-cols-4">
                {[10, 50, 100, 500].map((amount) => (
                  <Card key={amount} className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                    <CardContent className="p-6">
                      <p className="text-sm text-slate-400">充值金额</p>
                      <p className="mt-3 text-3xl font-black">¥{amount}</p>
                      <Button onClick={() => recharge(amount)} className="mt-5 w-full rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                        模拟充值
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {activeDashboardTab === "orders" ? (
            <div id="orders" className="scroll-mt-28">
              <SectionTitle label="Orders" title="订单记录" desc="从 Supabase orders 表读取，当前不允许前端自己创建订单。" />
              <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          <th className="py-3">订单号</th>
                          <th className="py-3">时间</th>
                          <th className="py-3">金额</th>
                          <th className="py-3">方式</th>
                          <th className="py-3">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b border-white/5">
                            <td className="py-3 text-slate-300">{order.id}</td>
                            <td className="py-3 text-slate-300">{order.time}</td>
                            <td className="py-3 text-slate-300">¥{order.amount}</td>
                            <td className="py-3 text-slate-300">{order.method}</td>
                            <td className="py-3 text-emerald-300">{order.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {orders.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-400">
                        还没有订单记录。后续接人工充值或支付后，这里会显示 orders 数据。
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "docs" ? (
            <div id="docs" className="scroll-mt-28">
              <SectionTitle label="Docs" title="API 文档" desc="给用户复制 base_url、API Key 和接入代码。" />
              <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">Base URL</p>
                      <p className="mt-2 break-all font-mono text-cyan-300">{apiBaseUrl}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">模型名</p>
                      <p className="mt-2 font-mono text-cyan-300">{selectedModelName}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">接口</p>
                      <p className="mt-2 font-mono text-cyan-300">/chat/completions</p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
                    model 必须使用平台支持并启用的模型名，例如 <span className="font-mono text-cyan-300">deepseek-chat</span>。不同模型的输入和输出价格可能不同，实际扣费按上游返回的 usage 计算。
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">JavaScript fetch 示例</h3>
                    <Button onClick={() => copy(javascriptCode, "已复制 JavaScript 示例")} className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                      <Copy className="mr-2 h-4 w-4" />
                      复制
                    </Button>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-5 text-sm leading-7 text-slate-200">
                    <code>{javascriptCode}</code>
                  </pre>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">Python OpenAI SDK 示例</h3>
                    <Button onClick={() => copy(pythonCode, "已复制 Python 示例")} className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                      <Copy className="mr-2 h-4 w-4" />
                      复制
                    </Button>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-5 text-sm leading-7 text-slate-200">
                    <code>{pythonCode}</code>
                  </pre>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                    <h3 className="text-lg font-bold">常见错误码</h3>
                    <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                      {[
                        ["400", "暂不支持 stream、请求超限，或 model not supported or disabled"],
                        ["401", "缺少或无效 API Key"],
                        ["402", "余额不足"],
                        ["429", "请求过快：每个 API Key 每分钟最多 20 次"],
                      ].map(([status, desc]) => (
                        <div key={status} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="font-mono text-cyan-300">{status}</p>
                          <p className="mt-2">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "admin" && isAdmin ? (
            <div id="admin" className="scroll-mt-28">
              <SectionTitle label="Admin" title="管理后台" desc="管理员人工处理充值，不接真实支付，不允许普通用户改余额。" />
              <Card className="mb-6 rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold">人工充值</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      通过 Supabase RPC 执行。数据库函数会检查当前用户是否为 admin，然后更新目标用户余额并写入 paid 订单。
                    </p>
                  </div>
                  <form onSubmit={handleManualRecharge} className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr_1fr_auto] lg:items-end">
                    <div>
                      <label className="text-sm text-slate-300">用户邮箱</label>
                      <input
                        type="email"
                        value={manualRechargeEmail}
                        onChange={(event) => setManualRechargeEmail(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">充值金额</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={manualRechargeAmount}
                        onChange={(event) => setManualRechargeAmount(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">备注</label>
                      <input
                        value={manualRechargeNote}
                        onChange={(event) => setManualRechargeNote(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="人工转账 / 测试额度"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={manualRechargeSubmitting}
                      className="rounded-2xl bg-white px-6 text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {manualRechargeSubmitting ? "处理中..." : "确认充值"}
                    </Button>
                  </form>
                  {manualRechargeMessage ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                      {manualRechargeMessage}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              <Card id="users" className="mb-6 scroll-mt-28 rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">用户管理</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        查看所有用户的角色、余额、API Key、充值、消费和最近调用概况。所有数据通过 admin RPC 读取，不暴露 service role key。
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => void loadAdminUsers()}
                      disabled={adminUsersLoading}
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adminUsersLoading ? "刷新中..." : "刷新用户"}
                    </Button>
                  </div>

                  <div className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_0.7fr_0.9fr]">
                    <div>
                      <label className="text-sm text-slate-300">按邮箱搜索</label>
                      <input
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">角色筛选</label>
                      <select
                        value={userRoleFilter}
                        onChange={(event) => setUserRoleFilter(event.target.value as AdminUserRoleFilter)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        <option value="all">全部</option>
                        <option value="admin">admin</option>
                        <option value="user">user</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">排序</label>
                      <select
                        value={userSort}
                        onChange={(event) => setUserSort(event.target.value as AdminUserSort)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        <option value="balance_desc">余额高到低</option>
                        <option value="balance_asc">余额低到高</option>
                        <option value="last_usage_desc">最近调用时间新到旧</option>
                        <option value="last_usage_asc">最近调用时间旧到新</option>
                      </select>
                    </div>
                  </div>

                  {adminUsersMessage ? (
                    <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                      {adminUsersMessage}
                    </div>
                  ) : null}

                  {balanceAdjustUser ? (
                    <form
                      onSubmit={submitBalanceAdjust}
                      className="mb-5 grid gap-4 rounded-2xl border border-cyan-300/20 bg-slate-950/70 p-4 lg:grid-cols-[0.8fr_0.7fr_1.4fr_auto_auto] lg:items-end"
                    >
                      <div>
                        <p className="text-sm text-slate-400">调整用户</p>
                        <p className="mt-2 truncate font-mono text-sm text-cyan-200">{balanceAdjustUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">方式</label>
                        <select
                          value={balanceAdjustMode}
                          onChange={(event) => setBalanceAdjustMode(event.target.value as BalanceAdjustMode)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        >
                          <option value="increase">增加余额</option>
                          <option value="decrease">减少余额</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">金额</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={balanceAdjustAmount}
                          onChange={(event) => setBalanceAdjustAmount(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                          placeholder="10"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="text-sm text-slate-300">备注</label>
                        <input
                          value={balanceAdjustNote}
                          onChange={(event) => setBalanceAdjustNote(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                          placeholder="必须填写调整原因"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={balanceAdjustSubmitting}
                        className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {balanceAdjustSubmitting ? "保存中..." : "确认调整"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={cancelBalanceAdjust}
                        className="text-slate-200 hover:bg-white/10 hover:text-white"
                      >
                        取消
                      </Button>
                    </form>
                  ) : null}

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1380px] text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          <th className="py-3">邮箱</th>
                          <th className="py-3">角色</th>
                          <th className="py-3">余额</th>
                          <th className="py-3">API Key</th>
                          <th className="py-3">累计充值</th>
                          <th className="py-3">累计消费</th>
                          <th className="py-3">最近调用</th>
                          <th className="py-3">创建时间</th>
                          <th className="py-3">状态</th>
                          <th className="py-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((user) => (
                          <tr key={user.id} className="border-b border-white/5 align-top">
                            <td className="py-3 pr-3 font-mono text-cyan-300">{user.email}</td>
                            <td className="py-3 pr-3 text-slate-300">{user.role}</td>
                            <td className="py-3 pr-3 text-slate-300">¥{user.balance.toFixed(4)}</td>
                            <td className="py-3 pr-3 text-slate-300">{user.apiKeyCount}</td>
                            <td className="py-3 pr-3 text-emerald-300">¥{user.totalRecharge.toFixed(2)}</td>
                            <td className="py-3 pr-3 text-amber-200">¥{user.totalSpend.toFixed(4)}</td>
                            <td className="py-3 pr-3 text-slate-300">{formatNullableDateTime(user.lastUsageAt)}</td>
                            <td className="py-3 pr-3 text-slate-300">{formatDateTime(user.createdAt)}</td>
                            <td className={user.role === "admin" ? "py-3 pr-3 text-cyan-200" : "py-3 pr-3 text-emerald-300"}>
                              {user.role === "admin" ? "管理员" : "正常"}
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={userRoleSubmittingId === user.id}
                                  onClick={() => void updateAdminUserRole(user, user.role === "admin" ? "user" : "admin")}
                                  className="hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {user.role === "admin" ? "取消 admin" : "设为 admin"}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startBalanceAdjust(user, "increase")}
                                  className="hover:bg-white/10 hover:text-white"
                                >
                                  增加余额
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startBalanceAdjust(user, "decrease")}
                                  className="hover:bg-white/10 hover:text-white"
                                >
                                  减少余额
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void openAdminUserDetail(user, "apiKeys")}
                                  className="hover:bg-white/10 hover:text-white"
                                >
                                  API Key
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void openAdminUserDetail(user, "usage")}
                                  className="hover:bg-white/10 hover:text-white"
                                >
                                  用量
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void openAdminUserDetail(user, "orders")}
                                  className="hover:bg-white/10 hover:text-white"
                                >
                                  订单
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {adminUsers.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-400">
                        {adminUsersLoading ? "正在读取用户数据..." : "暂无匹配用户。"}
                      </div>
                    ) : null}
                  </div>

                  {selectedAdminUser && adminUserDetailView ? (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">用户详情</p>
                          <h4 className="mt-1 break-all font-mono text-cyan-200">{selectedAdminUser.email}</h4>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAdminUser(null);
                            setAdminUserDetailView(null);
                          }}
                          className="hover:bg-white/10 hover:text-white"
                        >
                          关闭
                        </Button>
                      </div>

                      {adminUserDetailLoading ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-slate-400">
                          正在读取详情...
                        </div>
                      ) : null}

                      {!adminUserDetailLoading && adminUserDetailView === "apiKeys" ? (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[620px] text-left text-sm">
                            <thead className="text-slate-400">
                              <tr className="border-b border-white/10">
                                <th className="py-3">名称</th>
                                <th className="py-3">前缀</th>
                                <th className="py-3">状态</th>
                                <th className="py-3">创建时间</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminUserApiKeys.map((key) => (
                                <tr key={key.id} className="border-b border-white/5">
                                  <td className="py-3 text-slate-300">{key.name}</td>
                                  <td className="py-3 font-mono text-cyan-300">{key.key_prefix}********</td>
                                  <td className={key.revoked ? "py-3 text-amber-300" : "py-3 text-emerald-300"}>
                                    {key.revoked ? "已撤销" : "可用"}
                                  </td>
                                  <td className="py-3 text-slate-300">{formatDateTime(key.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {adminUserApiKeys.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-slate-400">
                              该用户暂无 API Key。
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {!adminUserDetailLoading && adminUserDetailView === "usage" ? (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="text-slate-400">
                              <tr className="border-b border-white/10">
                                <th className="py-3">时间</th>
                                <th className="py-3">模型</th>
                                <th className="py-3">供应商</th>
                                <th className="py-3">输入</th>
                                <th className="py-3">输出</th>
                                <th className="py-3">费用</th>
                                <th className="py-3">状态</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminUserUsageLogs.map((log) => (
                                <tr key={log.id} className="border-b border-white/5">
                                  <td className="py-3 text-slate-300">{formatDateTime(log.created_at)}</td>
                                  <td className="py-3 font-mono text-cyan-300">{log.model ?? "unknown"}</td>
                                  <td className="py-3 font-mono text-xs text-slate-300">{log.supplier_name ?? "unknown"}</td>
                                  <td className="py-3 text-slate-300">{log.prompt_tokens ?? 0}</td>
                                  <td className="py-3 text-slate-300">{log.completion_tokens ?? 0}</td>
                                  <td className="py-3 text-slate-300">¥{Number(log.cost ?? 0).toFixed(4)}</td>
                                  <td className="py-3 text-emerald-300">{log.status ?? "success"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {adminUserUsageLogs.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-slate-400">
                              该用户暂无用量记录。
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {!adminUserDetailLoading && adminUserDetailView === "orders" ? (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="text-slate-400">
                              <tr className="border-b border-white/10">
                                <th className="py-3">时间</th>
                                <th className="py-3">订单号</th>
                                <th className="py-3">金额</th>
                                <th className="py-3">方式</th>
                                <th className="py-3">状态</th>
                                <th className="py-3">备注</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminUserOrders.map((order) => (
                                <tr key={order.id} className="border-b border-white/5">
                                  <td className="py-3 text-slate-300">{formatDateTime(order.created_at)}</td>
                                  <td className="py-3 font-mono text-xs text-cyan-300">{order.id}</td>
                                  <td className="py-3 text-slate-300">¥{Number(order.amount ?? 0).toFixed(2)}</td>
                                  <td className="py-3 text-slate-300">{order.method ?? "unknown"}</td>
                                  <td className="py-3 text-emerald-300">{order.status ?? "pending"}</td>
                                  <td className="py-3 text-slate-300">{order.note ?? "无"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {adminUserOrders.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-slate-400">
                              该用户暂无订单记录。
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              <Card id="finance" className="mb-6 scroll-mt-28 rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">财务统计</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        汇总平台充值、消费、余额、订单、用量和利润估算。第一版通过 admin RPC 聚合全站数据，不向前端暴露 service role key。
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={financeRange}
                        onChange={(event) => setFinanceRange(event.target.value as FinanceRange)}
                        className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-white outline-none focus:border-cyan-300"
                      >
                        <option value="today">今天</option>
                        <option value="7d">7 天</option>
                        <option value="30d">30 天</option>
                        <option value="all">全部</option>
                      </select>
                      <Button
                        type="button"
                        onClick={() => void loadAdminFinance()}
                        disabled={financeLoading}
                        variant="outline"
                        className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {financeLoading ? "刷新中..." : "刷新财务"}
                      </Button>
                    </div>
                  </div>

                  {financeMessage ? (
                    <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                      {financeMessage}
                    </div>
                  ) : null}

                  {financeLoading && !financeSummary ? (
                    <div className="mb-5 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                      正在读取财务统计...
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {financeStatCards.map(([label, value, hint]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_18px_rgba(34,211,238,0.06)]"
                      >
                        <p className="text-sm text-slate-400">{label}</p>
                        <p className="mt-2 break-words text-2xl font-black text-cyan-200">{value}</p>
                        <p className="mt-2 text-xs text-slate-500">{hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-bold">趋势统计</h4>
                        <p className="mt-1 text-sm text-slate-400">当前范围：{financeRangeLabel}</p>
                      </div>
                      {!financeSummary?.cost_configured ? (
                        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                          成本价未配置
                        </span>
                      ) : null}
                    </div>
                    <div className="grid gap-3 md:grid-cols-5">
                      {[
                        ["调用次数", formatNumber(financeSummary?.range_call_count)],
                        ["成功次数", formatNumber(financeSummary?.range_success_count)],
                        ["失败次数", formatNumber(financeSummary?.range_failed_count)],
                        ["消费金额", formatMoney(financeSummary?.range_consumption_amount, 4)],
                        ["充值金额", formatMoney(financeSummary?.range_recharge_amount, 2)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                          <p className="text-xs text-slate-400">{label}</p>
                          <p className="mt-2 text-lg font-bold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <h4 className="mb-4 text-lg font-bold">消费最多用户 Top 10</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-sm">
                          <thead className="text-slate-400">
                            <tr className="border-b border-white/10">
                              <th className="py-3">邮箱</th>
                              <th className="py-3">消费金额</th>
                              <th className="py-3">调用</th>
                              <th className="py-3">最近调用</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topSpenders.map((item) => (
                              <tr key={`spender-${item.label}`} className="border-b border-white/5">
                                <td className="py-3 pr-3 font-mono text-cyan-300">{item.email ?? item.label}</td>
                                <td className="py-3 pr-3 text-slate-300">{formatMoney(item.total_amount, 4)}</td>
                                <td className="py-3 pr-3 text-slate-300">{formatNumber(item.call_count)}</td>
                                <td className="py-3 pr-3 text-slate-300">{formatNullableDateTime(item.last_usage_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {topSpenders.length === 0 ? (
                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                            暂无消费排行数据。
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <h4 className="mb-4 text-lg font-bold">充值最多用户 Top 10</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-left text-sm">
                          <thead className="text-slate-400">
                            <tr className="border-b border-white/10">
                              <th className="py-3">邮箱</th>
                              <th className="py-3">充值金额</th>
                              <th className="py-3">订单数</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topRechargers.map((item) => (
                              <tr key={`recharger-${item.label}`} className="border-b border-white/5">
                                <td className="py-3 pr-3 font-mono text-cyan-300">{item.email ?? item.label}</td>
                                <td className="py-3 pr-3 text-slate-300">{formatMoney(item.total_amount, 2)}</td>
                                <td className="py-3 pr-3 text-slate-300">{formatNumber(item.order_count)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {topRechargers.length === 0 ? (
                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                            暂无充值排行数据。
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <h4 className="mb-4 text-lg font-bold">模型消费排行</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-sm">
                          <thead className="text-slate-400">
                            <tr className="border-b border-white/10">
                              <th className="py-3">model</th>
                              <th className="py-3">调用</th>
                              <th className="py-3">tokens</th>
                              <th className="py-3">消费</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modelFinanceRankings.map((item) => (
                              <tr key={`model-${item.model}`} className="border-b border-white/5">
                                <td className="py-3 pr-3 font-mono text-cyan-300">{item.model ?? "unknown"}</td>
                                <td className="py-3 pr-3 text-slate-300">{formatNumber(item.call_count)}</td>
                                <td className="py-3 pr-3 text-slate-300">{formatNumber(item.token_count)}</td>
                                <td className="py-3 pr-3 text-slate-300">{formatMoney(item.total_amount, 4)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {modelFinanceRankings.length === 0 ? (
                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                            暂无模型排行数据。
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <h4 className="mb-4 text-lg font-bold">供应商调用排行</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                          <thead className="text-slate-400">
                            <tr className="border-b border-white/10">
                              <th className="py-3">supplier</th>
                              <th className="py-3">调用</th>
                              <th className="py-3">成功</th>
                              <th className="py-3">失败</th>
                              <th className="py-3">消费</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplierFinanceRankings.map((item) => (
                              <tr key={`supplier-${item.supplier_name}`} className="border-b border-white/5">
                                <td className="py-3 pr-3 font-mono text-cyan-300">
                                  {item.label ?? item.supplier_name ?? "unknown"}
                                </td>
                                <td className="py-3 pr-3 text-slate-300">{formatNumber(item.call_count)}</td>
                                <td className="py-3 pr-3 text-emerald-300">{formatNumber(item.success_count)}</td>
                                <td className="py-3 pr-3 text-amber-300">{formatNumber(item.failed_count)}</td>
                                <td className="py-3 pr-3 text-slate-300">{formatMoney(item.total_amount, 4)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {supplierFinanceRankings.length === 0 ? (
                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                            暂无供应商排行数据。
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <h4 className="mb-4 text-lg font-bold">最近 20 条订单</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="text-slate-400">
                          <tr className="border-b border-white/10">
                            <th className="py-3">用户邮箱</th>
                            <th className="py-3">金额</th>
                            <th className="py-3">method</th>
                            <th className="py-3">status</th>
                            <th className="py-3">note</th>
                            <th className="py-3">created_at</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentFinanceOrders.map((order) => (
                            <tr key={order.id} className="border-b border-white/5">
                              <td className="py-3 pr-3 font-mono text-cyan-300">{order.user_email ?? "unknown"}</td>
                              <td className="py-3 pr-3 text-slate-300">{formatMoney(order.amount, 2)}</td>
                              <td className="py-3 pr-3 text-slate-300">{order.method ?? "unknown"}</td>
                              <td className="py-3 pr-3 text-emerald-300">{order.status ?? "pending"}</td>
                              <td className="py-3 pr-3 text-slate-300">{order.note ?? "无"}</td>
                              <td className="py-3 pr-3 text-slate-300">{formatDateTime(order.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {recentFinanceOrders.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                          暂无订单数据。
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card id="errors" className="mb-6 scroll-mt-28 rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">异常请求 / 风控监控</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        聚合失败请求、限流、余额不足、供应商错误和无效 API Key。只记录错误元数据、哈希和 Key 前缀，不保存 prompt、完整 IP 或完整 API Key。
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => void loadAdminErrors()}
                      disabled={errorLoading}
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {errorLoading ? "刷新中..." : "刷新异常"}
                    </Button>
                  </div>

                  {errorMessage ? (
                    <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                      {errorMessage}
                    </div>
                  ) : null}

                  {errorLoading && errorLogs.length === 0 ? (
                    <div className="mb-5 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                      正在读取异常请求...
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {errorStatCards.map(([label, value, hint]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_18px_rgba(34,211,238,0.06)]"
                      >
                        <p className="text-sm text-slate-400">{label}</p>
                        <p className="mt-2 break-words text-2xl font-black text-cyan-200">{value}</p>
                        <p className="mt-2 text-xs text-slate-500">{hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-bold">风控建议</h4>
                        <p className="mt-1 text-sm text-slate-400">当前列表范围：{errorRangeLabel}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {(errorRiskHints.length > 0 ? errorRiskHints : ["暂无明显风险信号。"]).map((hint) => (
                        <div
                          key={hint}
                          className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50"
                        >
                          {hint}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-6">
                    <div className="lg:col-span-2">
                      <label className="text-sm text-slate-300">按邮箱搜索</label>
                      <input
                        value={errorEmailSearch}
                        onChange={(event) => setErrorEmailSearch(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">状态</label>
                      <select
                        value={errorStatusFilter}
                        onChange={(event) => setErrorStatusFilter(event.target.value as ErrorStatusFilter)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        <option value="all">全部</option>
                        <option value="failed">failed</option>
                        <option value="blocked">blocked</option>
                        <option value="rate_limited">rate_limited</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">HTTP</label>
                      <select
                        value={errorHttpStatusFilter}
                        onChange={(event) => setErrorHttpStatusFilter(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        <option value="all">全部</option>
                        <option value="400">400</option>
                        <option value="401">401</option>
                        <option value="402">402</option>
                        <option value="429">429</option>
                        <option value="500">500+</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">时间范围</label>
                      <select
                        value={errorRange}
                        onChange={(event) => setErrorRange(event.target.value as ErrorRange)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        <option value="today">今天</option>
                        <option value="7d">7 天</option>
                        <option value="30d">30 天</option>
                        <option value="all">全部</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">模型</label>
                      <select
                        value={errorModelFilter}
                        onChange={(event) => setErrorModelFilter(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        <option value="all">全部</option>
                        {adminModels.map((model) => (
                          <option key={model.name} value={model.name}>
                            {model.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">供应商</label>
                      <select
                        value={errorSupplierFilter}
                        onChange={(event) => setErrorSupplierFilter(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        <option value="all">全部</option>
                        {adminSuppliers.map((supplier) => (
                          <option key={supplier.name} value={supplier.name}>
                            {supplier.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedErrorLog ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h4 className="text-base font-bold">异常详情</h4>
                        <button
                          type="button"
                          onClick={() => setSelectedErrorLog(null)}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                        >
                          关闭
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div>Request ID：{selectedErrorLog.request_id ?? "无"}</div>
                        <div>API Key：{selectedErrorLog.api_key_prefix ?? "无"}</div>
                        <div>IP Hash：{formatShortHash(selectedErrorLog.ip_hash)}</div>
                        <div>UA Hash：{formatShortHash(selectedErrorLog.user_agent_hash)}</div>
                        <div className="md:col-span-2 xl:col-span-4">
                          错误信息：{selectedErrorLog.error_message ?? "无"}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <table className="w-full min-w-[1280px] text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          <th className="py-3">时间</th>
                          <th className="py-3">用户邮箱</th>
                          <th className="py-3">API Key</th>
                          <th className="py-3">model</th>
                          <th className="py-3">supplier</th>
                          <th className="py-3">HTTP</th>
                          <th className="py-3">error_code</th>
                          <th className="py-3">error_message</th>
                          <th className="py-3">latency</th>
                          <th className="py-3">cost</th>
                          <th className="py-3">tokens</th>
                          <th className="py-3">状态</th>
                          <th className="py-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errorLogs.map((log) => (
                          <tr key={log.id} className="border-b border-white/5 align-top">
                            <td className="py-3 pr-3 text-slate-300">{formatDateTime(log.created_at)}</td>
                            <td className="py-3 pr-3 font-mono text-cyan-300">{log.email ?? "未关联"}</td>
                            <td className="py-3 pr-3 font-mono text-xs text-slate-300">
                              {log.api_key_prefix ?? "无"}
                              {log.api_key_revoked ? <span className="ml-2 text-amber-300">已禁用</span> : null}
                            </td>
                            <td className="py-3 pr-3 font-mono text-slate-300">
                              {log.model_display_name ?? log.model ?? "unknown"}
                            </td>
                            <td className="py-3 pr-3 font-mono text-slate-300">
                              {log.supplier_display_name ?? log.supplier_name ?? "unknown"}
                            </td>
                            <td className="py-3 pr-3 text-amber-200">{log.http_status ?? "无"}</td>
                            <td className="py-3 pr-3 font-mono text-xs text-rose-200">{log.error_code ?? "unknown"}</td>
                            <td className="max-w-[280px] py-3 pr-3 text-slate-300">{log.error_message ?? "无"}</td>
                            <td className="py-3 pr-3 text-slate-300">{formatLatency(log.latency_ms)}</td>
                            <td className="py-3 pr-3 text-slate-300">{formatMoney(log.cost, 6)}</td>
                            <td className="py-3 pr-3 text-slate-300">
                              {formatNumber(Number(log.prompt_tokens ?? 0) + Number(log.completion_tokens ?? 0))}
                            </td>
                            <td className="py-3 pr-3">
                              <span
                                className={`rounded-full border px-2 py-1 text-xs ${getErrorStatusClass(log.status)}`}
                              >
                                {log.status ?? "failed"}
                              </span>
                            </td>
                            <td className="py-3 pr-3">
                              <div className="flex min-w-[260px] flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedErrorLog(log)}
                                  className="hover:bg-white/10 hover:text-white"
                                >
                                  详情
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => viewErrorUser(log)}
                                  className="hover:bg-white/10 hover:text-white"
                                >
                                  查看用户
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => viewErrorApiKeyRecords(log)}
                                  className="hover:bg-white/10 hover:text-white"
                                >
                                  Key 记录
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (log.supplier_name) {
                                      setErrorSupplierFilter(log.supplier_name);
                                    }
                                    jumpToAdminSection("suppliers");
                                  }}
                                  className="hover:bg-white/10 hover:text-white"
                                >
                                  供应商
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={!log.api_key_id || log.api_key_revoked === true || disablingApiKeyId === log.api_key_id}
                                  onClick={() => void disableErrorApiKey(log)}
                                  className="text-rose-200 hover:bg-rose-400/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {disablingApiKeyId === log.api_key_id ? "禁用中" : "禁用 Key"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {errorLogs.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-slate-400">
                        暂无异常请求。可以切换时间范围，或触发一次 401 / 402 / 429 / 上游失败后再刷新。
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
              <Card id="suppliers" className="mb-6 scroll-mt-28 rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">供应商线路</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        第一版支持 OpenAI-compatible 的 /v1/chat/completions。API Key 列表只显示配置状态，编辑时填写新 Key 会覆盖旧值。
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={resetSupplierForm}
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      新增供应商
                    </Button>
                  </div>

                  <form onSubmit={handleSupplierSubmit} className="grid gap-4 lg:grid-cols-4">
                    <div>
                      <label className="text-sm text-slate-300">name</label>
                      <input
                        value={supplierForm.name}
                        onChange={(event) => setSupplierForm((form) => ({ ...form, name: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-300"
                        placeholder="deepseek"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">展示名称</label>
                      <input
                        value={supplierForm.displayName}
                        onChange={(event) =>
                          setSupplierForm((form) => ({ ...form, displayName: event.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="DeepSeek 官方"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="text-sm text-slate-300">Base URL</label>
                      <input
                        value={supplierForm.baseUrl}
                        onChange={(event) => setSupplierForm((form) => ({ ...form, baseUrl: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-300"
                        placeholder="https://api.deepseek.com/v1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">provider_type</label>
                      <input
                        value={supplierForm.providerType}
                        onChange={(event) =>
                          setSupplierForm((form) => ({ ...form, providerType: event.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="openai-compatible"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">API Key</label>
                      <input
                        type="password"
                        value={supplierForm.apiKey}
                        onChange={(event) => setSupplierForm((form) => ({ ...form, apiKey: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="可留空，继续使用环境变量兜底"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">priority</label>
                      <input
                        type="number"
                        step="1"
                        value={supplierForm.priority}
                        onChange={(event) => setSupplierForm((form) => ({ ...form, priority: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      />
                    </div>
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 lg:mt-7">
                      <input
                        type="checkbox"
                        checked={supplierForm.enabled}
                        onChange={(event) => setSupplierForm((form) => ({ ...form, enabled: event.target.checked }))}
                        className="h-4 w-4"
                      />
                      启用线路
                    </label>
                    <div className="lg:col-span-4">
                      <label className="text-sm text-slate-300">备注</label>
                      <textarea
                        value={supplierForm.notes}
                        onChange={(event) => setSupplierForm((form) => ({ ...form, notes: event.target.value }))}
                        className="mt-2 min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="线路用途、额度、风控说明等"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 lg:col-span-4">
                      <Button
                        type="submit"
                        disabled={supplierSubmitting}
                        className="rounded-2xl bg-white px-6 text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {supplierSubmitting ? "保存中..." : "新增供应商"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setSupplierForm({
                            name: "deepseek",
                            displayName: "DeepSeek 官方",
                            baseUrl: "https://api.deepseek.com/v1",
                            providerType: "openai-compatible",
                            apiKey: "",
                            enabled: true,
                            priority: "10",
                            notes: "",
                          })
                        }
                        className="text-slate-200 hover:bg-white/10 hover:text-white"
                      >
                        填入 DeepSeek 示例
                      </Button>
                    </div>
                  </form>

                  {adminSupplierMessage ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                      {adminSupplierMessage}
                    </div>
                  ) : null}

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[1260px] text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          <th className="py-3">展示名称</th>
                          <th className="py-3">name</th>
                          <th className="py-3">Base URL</th>
                          <th className="py-3">provider_type</th>
                          <th className="py-3">API Key</th>
                          <th className="py-3">priority</th>
                          <th className="py-3">状态</th>
                          <th className="py-3">备注</th>
                          <th className="py-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminSuppliers.map((supplier) => {
                          const isEditing = editingSupplierId === supplier.id;
                          const inputClass =
                            "w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-white outline-none focus:border-cyan-300";

                          return (
                            <tr key={supplier.id ?? supplier.name} className="border-b border-white/5 align-top">
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <input
                                    value={editSupplierForm.displayName}
                                    onChange={(event) =>
                                      setEditSupplierForm((form) => ({ ...form, displayName: event.target.value }))
                                    }
                                    className={inputClass}
                                  />
                                ) : (
                                  supplier.displayName
                                )}
                              </td>
                              <td className="py-3 pr-3 font-mono text-cyan-300">{supplier.name}</td>
                              <td className="py-3 pr-3 font-mono text-xs text-slate-300">
                                {isEditing ? (
                                  <input
                                    value={editSupplierForm.baseUrl}
                                    onChange={(event) =>
                                      setEditSupplierForm((form) => ({ ...form, baseUrl: event.target.value }))
                                    }
                                    className={`${inputClass} font-mono text-xs`}
                                  />
                                ) : (
                                  supplier.baseUrl
                                )}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <input
                                    value={editSupplierForm.providerType}
                                    onChange={(event) =>
                                      setEditSupplierForm((form) => ({ ...form, providerType: event.target.value }))
                                    }
                                    className={inputClass}
                                  />
                                ) : (
                                  supplier.providerType
                                )}
                              </td>
                              <td className={supplier.apiKeyConfigured ? "py-3 pr-3 text-emerald-300" : "py-3 pr-3 text-amber-300"}>
                                {isEditing ? (
                                  <input
                                    type="password"
                                    value={editSupplierForm.apiKey}
                                    onChange={(event) =>
                                      setEditSupplierForm((form) => ({ ...form, apiKey: event.target.value }))
                                    }
                                    className={inputClass}
                                    placeholder={supplier.apiKeyConfigured ? "留空保持当前 Key" : "填写 API Key"}
                                  />
                                ) : supplier.apiKeyConfigured ? (
                                  "已配置"
                                ) : (
                                  "未配置"
                                )}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="1"
                                    value={editSupplierForm.priority}
                                    onChange={(event) =>
                                      setEditSupplierForm((form) => ({ ...form, priority: event.target.value }))
                                    }
                                    className={inputClass}
                                  />
                                ) : (
                                  supplier.priority
                                )}
                              </td>
                              <td className={supplier.enabled ? "py-3 pr-3 text-emerald-300" : "py-3 pr-3 text-amber-300"}>
                                {isEditing ? (
                                  <label className="flex items-center gap-2 text-sm text-slate-200">
                                    <input
                                      type="checkbox"
                                      checked={editSupplierForm.enabled}
                                      onChange={(event) =>
                                        setEditSupplierForm((form) => ({ ...form, enabled: event.target.checked }))
                                      }
                                      className="h-4 w-4"
                                    />
                                    启用
                                  </label>
                                ) : supplier.enabled ? (
                                  "启用"
                                ) : (
                                  "禁用"
                                )}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <textarea
                                    value={editSupplierForm.notes}
                                    onChange={(event) =>
                                      setEditSupplierForm((form) => ({ ...form, notes: event.target.value }))
                                    }
                                    className={`${inputClass} min-h-20 min-w-52`}
                                  />
                                ) : (
                                  <span className="block max-w-64 leading-6">{supplier.notes || "暂无备注"}</span>
                                )}
                              </td>
                              <td className="py-3">
                                <div className="flex gap-2">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        type="button"
                                        size="sm"
                                        disabled={supplierSubmitting}
                                        onClick={() => void saveEditedSupplier(supplier)}
                                        className="rounded-xl bg-white text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        保存修改
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={resetSupplierForm}
                                        className="hover:bg-white/10 hover:text-white"
                                      >
                                        取消
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditSupplier(supplier)}
                                        className="hover:bg-white/10 hover:text-white"
                                      >
                                        编辑
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        disabled={supplierSubmitting}
                                        onClick={() => void toggleSupplierEnabled(supplier)}
                                        className="hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {supplier.enabled ? "禁用" : "启用"}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {adminSuppliers.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-400">
                        暂无供应商线路数据。请先在 Supabase SQL Editor 执行最新 user-data-schema.sql。
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
              <Card id="model-pricing" className="mb-6 scroll-mt-28 rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">模型价格管理</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        这里管理平台对外 model name、上游模型名、输入/输出价格和启用状态。禁用模型后，API 中转会返回 400。
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={resetModelForm}
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      新增模型
                    </Button>
                  </div>

                  <form onSubmit={handleModelSubmit} className="grid gap-4 lg:grid-cols-4">
                    <div>
                      <label className="text-sm text-slate-300">model name</label>
                      <input
                        value={modelForm.name}
                        onChange={(event) => setModelForm((form) => ({ ...form, name: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-300"
                        placeholder="deepseek-v4-pro"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">展示名称</label>
                      <input
                        value={modelForm.displayName}
                        onChange={(event) => setModelForm((form) => ({ ...form, displayName: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="DeepSeek V4 Pro"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">provider</label>
                      <input
                        value={modelForm.provider}
                        onChange={(event) => setModelForm((form) => ({ ...form, provider: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="deepseek"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">供应商线路</label>
                      <select
                        value={modelForm.supplierName}
                        onChange={(event) => setModelForm((form) => ({ ...form, supplierName: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        {supplierOptions.map((supplier) => (
                          <option key={supplier.name} value={supplier.name}>
                            {supplier.name} - {supplier.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">上游模型名</label>
                      <input
                        value={modelForm.upstreamModel}
                        onChange={(event) => setModelForm((form) => ({ ...form, upstreamModel: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-300"
                        placeholder="deepseek-v4-pro"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">输入价格 / 1K</label>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={modelForm.inputPrice}
                        onChange={(event) => setModelForm((form) => ({ ...form, inputPrice: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">输出价格 / 1K</label>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={modelForm.outputPrice}
                        onChange={(event) => setModelForm((form) => ({ ...form, outputPrice: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">排序</label>
                      <input
                        type="number"
                        step="1"
                        value={modelForm.sortOrder}
                        onChange={(event) => setModelForm((form) => ({ ...form, sortOrder: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      />
                    </div>
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 lg:mt-7">
                      <input
                        type="checkbox"
                        checked={modelForm.enabled}
                        onChange={(event) => setModelForm((form) => ({ ...form, enabled: event.target.checked }))}
                        className="h-4 w-4"
                      />
                      启用模型
                    </label>
                    <div className="lg:col-span-4">
                      <label className="text-sm text-slate-300">说明</label>
                      <textarea
                        value={modelForm.description}
                        onChange={(event) => setModelForm((form) => ({ ...form, description: event.target.value }))}
                        className="mt-2 min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="DeepSeek V4 Pro 模型"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 lg:col-span-4">
                      <Button
                        type="submit"
                        disabled={modelSubmitting}
                        className="rounded-2xl bg-white px-6 text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {modelSubmitting ? "保存中..." : "新增模型"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setModelForm({
                            name: "deepseek-v4-pro",
                            upstreamModel: "deepseek-v4-pro",
                            displayName: "DeepSeek V4 Pro",
                            provider: "deepseek",
                            supplierName: "deepseek",
                            inputPrice: "0.02",
                            outputPrice: "0.02",
                            enabled: true,
                            description: "DeepSeek V4 Pro 模型",
                            sortOrder: "30",
                          })
                        }
                        className="text-slate-200 hover:bg-white/10 hover:text-white"
                      >
                        填入 DeepSeek V4 Pro 示例
                      </Button>
                    </div>
                  </form>

                  {adminModelMessage ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                      {adminModelMessage}
                    </div>
                  ) : null}

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[1320px] text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          <th className="py-3">model</th>
                          <th className="py-3">展示名称</th>
                          <th className="py-3">provider</th>
                          <th className="py-3">供应商</th>
                          <th className="py-3">上游</th>
                          <th className="py-3">输入</th>
                          <th className="py-3">输出</th>
                          <th className="py-3">说明</th>
                          <th className="py-3">排序</th>
                          <th className="py-3">状态</th>
                          <th className="py-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminModels.map((model) => {
                          const isEditing = editingModelId === model.id;
                          const inputClass =
                            "w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-white outline-none focus:border-cyan-300";

                          return (
                            <tr key={model.id ?? model.name} className="border-b border-white/5 align-top">
                              <td className="py-3 font-mono text-cyan-300">{model.name}</td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <input
                                    value={editModelForm.displayName}
                                    onChange={(event) =>
                                      setEditModelForm((form) => ({ ...form, displayName: event.target.value }))
                                    }
                                    className={inputClass}
                                  />
                                ) : (
                                  model.label
                                )}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <input
                                    value={editModelForm.provider}
                                    onChange={(event) =>
                                      setEditModelForm((form) => ({ ...form, provider: event.target.value }))
                                    }
                                    className={inputClass}
                                  />
                                ) : (
                                  model.provider
                                )}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <select
                                    value={editModelForm.supplierName}
                                    onChange={(event) =>
                                      setEditModelForm((form) => ({ ...form, supplierName: event.target.value }))
                                    }
                                    className={inputClass}
                                  >
                                    {supplierOptions.map((supplier) => (
                                      <option key={supplier.name} value={supplier.name}>
                                        {supplier.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  model.supplierName
                                )}
                              </td>
                              <td className="py-3 pr-3 font-mono text-xs text-slate-300">
                                {isEditing ? (
                                  <input
                                    value={editModelForm.upstreamModel}
                                    onChange={(event) =>
                                      setEditModelForm((form) => ({ ...form, upstreamModel: event.target.value }))
                                    }
                                    className={`${inputClass} font-mono text-xs`}
                                  />
                                ) : (
                                  model.upstreamModel
                                )}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.0001"
                                    value={editModelForm.inputPrice}
                                    onChange={(event) =>
                                      setEditModelForm((form) => ({ ...form, inputPrice: event.target.value }))
                                    }
                                    className={inputClass}
                                  />
                                ) : (
                                  model.inputPrice
                                )}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.0001"
                                    value={editModelForm.outputPrice}
                                    onChange={(event) =>
                                      setEditModelForm((form) => ({ ...form, outputPrice: event.target.value }))
                                    }
                                    className={inputClass}
                                  />
                                ) : (
                                  model.outputPrice
                                )}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <textarea
                                    value={editModelForm.description}
                                    onChange={(event) =>
                                      setEditModelForm((form) => ({ ...form, description: event.target.value }))
                                    }
                                    className={`${inputClass} min-h-20 min-w-52`}
                                  />
                                ) : (
                                  <span className="block max-w-64 leading-6">{model.desc}</span>
                                )}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="1"
                                    value={editModelForm.sortOrder}
                                    onChange={(event) =>
                                      setEditModelForm((form) => ({ ...form, sortOrder: event.target.value }))
                                    }
                                    className={inputClass}
                                  />
                                ) : (
                                  model.sortOrder
                                )}
                              </td>
                              <td className={model.enabled ? "py-3 pr-3 text-emerald-300" : "py-3 pr-3 text-amber-300"}>
                                {isEditing ? (
                                  <label className="flex items-center gap-2 text-sm text-slate-200">
                                    <input
                                      type="checkbox"
                                      checked={editModelForm.enabled}
                                      onChange={(event) =>
                                        setEditModelForm((form) => ({ ...form, enabled: event.target.checked }))
                                      }
                                      className="h-4 w-4"
                                    />
                                    启用
                                  </label>
                                ) : model.enabled ? (
                                  "启用"
                                ) : (
                                  "禁用"
                                )}
                              </td>
                              <td className="py-3">
                                <div className="flex gap-2">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        type="button"
                                        size="sm"
                                        disabled={modelSubmitting}
                                        onClick={() => void saveEditedModel(model)}
                                        className="rounded-xl bg-white text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        保存修改
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={resetModelForm}
                                        className="hover:bg-white/10 hover:text-white"
                                      >
                                        取消
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditModel(model)}
                                        className="hover:bg-white/10 hover:text-white"
                                      >
                                        编辑
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        disabled={modelSubmitting}
                                        onClick={() => void toggleModelEnabled(model)}
                                        className="hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {model.enabled ? "禁用" : "启用"}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {adminModels.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-400">
                        暂无模型数据。请先在 Supabase SQL Editor 执行最新 user-data-schema.sql。
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["monitoring", "系统监控", "后续展示 QPS、延迟、可用率和供应商健康状态。"],
                ].map(([id, title, desc]) => (
                  <div
                    id={id}
                    key={id}
                    className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-white shadow-[0_0_18px_rgba(34,211,238,0.06)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                        <Settings className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold">{title}</h3>
                          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-xs text-amber-100">
                            未完成
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    );
  }

  const navItems = ["功能", "模型", "价格", "接入代码", "安全"];
  const features = [
    {
      icon: <KeyRound className="h-5 w-5" />,
      title: "一键创建 API Key",
      desc: "新手登录后即可生成密钥，支持限额、模型权限和 IP 白名单。",
    },
    {
      icon: <Server className="h-5 w-5" />,
      title: "统一模型网关",
      desc: "兼容 OpenAI SDK，统一调用 OpenAI、Claude、Gemini、DeepSeek、Qwen。",
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      title: "余额与用量明细",
      desc: "按 token 计费，清楚展示每次请求的模型、消耗、延迟和状态。",
    },
    {
      icon: <Gauge className="h-5 w-5" />,
      title: "自动路由与重试",
      desc: "根据延迟、失败率、成本和状态自动选择更稳定的上游线路。",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "隐私保护默认开启",
      desc: "默认不保存完整 prompt 和 response，只保留必要计费与错误信息。",
    },
    {
      icon: <Activity className="h-5 w-5" />,
      title: "实时监控后台",
      desc: "管理员可查看 QPS、错误率、成本、收入、模型状态和异常用户。",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {LoginDialog}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-24 right-10 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2">
            <BrandMark />
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a key={item} href={`#${item}`} className="text-sm text-slate-300 hover:text-white">
                {item}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Button
              variant="ghost"
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
                setLoginOpen(true);
              }}
              className="text-slate-200 hover:bg-white/10 hover:text-white"
            >
              登录
            </Button>
            <Button onClick={openDashboard} className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
              打开控制台
            </Button>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen ? (
          <div className="border-t border-white/10 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a key={item} href={`#${item}`} className="text-sm text-slate-300" onClick={() => setMenuOpen(false)}>
                  {item}
                </a>
              ))}
              <Button onClick={openDashboard} className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                打开控制台
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              兼容 OpenAI SDK 的 AI API 聚合网关
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
              让新手也能轻松接入
              <span className="block bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">多模型 API 中转站</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              电鳗 eelapi 提供统一 Base URL、统一 API Key、统一账单和统一模型路由。用户只需要改一行配置，就能调用主流 AI 模型。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => {
                  setAuthMode("signup");
                  setAuthMessage("");
                  setLoginOpen(true);
                }}
                className="rounded-2xl bg-white px-7 text-slate-950 hover:bg-slate-200"
              >
                立即免费试用 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" onClick={openDashboard} variant="outline" className="rounded-2xl border-white/15 bg-white/5 px-7 text-white hover:bg-white/10">
                打开控制台
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <Card className="overflow-hidden rounded-3xl border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white">实时请求监控</p>
                    <p className="text-xs text-slate-400">API Gateway / Live Overview</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">正常运行</span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  {[
                    ["今日请求", "128,430"],
                    ["平均延迟", "1.24s"],
                    ["成功率", "99.82%"],
                    ["今日收入", "¥3,284"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section id="功能" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionTitle label="核心功能" title="不是简单转发，而是完整 API 网关" desc="从用户注册、密钥管理、模型路由、计费扣费到日志监控，一套系统直接跑起来。" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="rounded-3xl border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.09]">
                <CardContent className="p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="模型" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-8">
            <SectionTitle label="模型别名" title="让小白不用记复杂模型名" />
            <div className="grid gap-4 lg:grid-cols-4">
              {modelList.map((model) => (
                <div key={model.name} className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                  <p className="font-mono text-sm text-cyan-300">{model.name}</p>
                  <h3 className="mt-3 text-xl font-bold">{model.label}</h3>
                  <p className="mt-2 text-sm text-slate-400">{model.provider}</p>
                  <p className="mt-4 leading-7 text-slate-300">{model.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="价格" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold text-cyan-300">价格方案</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">充值按量扣费，账单清清楚楚</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              ["体验版", "¥0", "适合新手测试接口", ["赠送少量测试额度", "基础模型可用", "在线测试台", "社区支持"]],
              ["开发者版", "按量计费", "适合个人开发和小项目", ["完整 API Key 管理", "用量明细", "更高并发", "模型自动切换"]],
              ["团队版", "定制", "适合团队和企业项目", ["团队余额", "成员权限", "专属线路", "账单导出"]],
            ].map(([name, price, desc, items], index) => (
              <Card key={String(name)} className={`rounded-3xl text-white ${index === 1 ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-white/[0.06]"}`}>
                <CardContent className="p-7">
                  <h3 className="text-xl font-bold">{String(name)}</h3>
                  <p className="mt-2 text-slate-300">{String(desc)}</p>
                  <div className="mt-6 text-4xl font-black">{String(price)}</div>
                  <ul className="mt-6 space-y-3">
                    {(items as string[]).map((item) => (
                      <li key={item} className="flex items-center gap-3 text-slate-200">
                        <Check className="h-4 w-4 text-emerald-300" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={openDashboard} className={`mt-7 w-full rounded-2xl ${index === 1 ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-white/10 text-white hover:bg-white/15"}`}>
                    开始使用
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="接入代码" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionTitle label="接入代码" title="只改 base_url，即可开始调用" desc="平台兼容 OpenAI SDK。用户原来怎么调用 OpenAI，现在就怎么调用电鳗。" />
            </div>
            <Card className="overflow-hidden rounded-3xl border-white/10 bg-slate-900 text-white">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Code2 className="h-4 w-4" /> Python 示例
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copy(pythonCode, "已复制接入代码")} className="text-slate-300 hover:bg-white/10 hover:text-white">
                    <Copy className="mr-2 h-4 w-4" />复制
                  </Button>
                </div>
                <pre className="overflow-x-auto p-5 text-sm leading-7 text-slate-200">
                  <code>{pythonCode}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="安全" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <SectionTitle
                  label="安全与合规"
                  title="生产版安全规划"
                  desc="当前页面是本地演示版；正式上线前需要补齐鉴权、密钥存储、限流、审计和告警。"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {["API Key 哈希保存", "上游 Key 加密存储", "默认不保存对话内容", "Redis 限流防刷", "Cloudflare WAF 防护", "异常消费自动提醒"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <Check className="h-5 w-5 text-emerald-300" />
                    <span className="text-slate-200">生产版：{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-4 py-8 text-center text-sm text-slate-400 sm:px-6 lg:px-8">
        © 2026 电鳗 eelapi. Built for developers and beginners.
      </footer>
    </div>
  );
}
