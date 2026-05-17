"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  ArrowRight,
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
  Play,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
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
  | "models"
  | "usage"
  | "recharge"
  | "orders"
  | "docs"
  | "admin";

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
  prompt_tokens: number | null;
  completion_tokens: number | null;
  cost: number | string | null;
  status: string | null;
  created_at: string;
};

type ManualRechargeResult = {
  order_id: string;
  user_id: string;
  email: string;
  new_balance: number | string;
  amount: number | string;
  note: string | null;
};

type ModelItem = {
  name: string;
  label: string;
  provider: string;
  inputPrice: string;
  outputPrice: string;
  inputPricePer1K: number;
  outputPricePer1K: number;
  desc: string;
};

const API_KEY_PREFIX_LENGTH = 16;

const modelList: ModelItem[] = [
  {
    name: "smart-chat",
    label: "聪明模型",
    provider: "GPT / Claude 优先",
    inputPrice: "¥0.02 / 1K tokens",
    outputPrice: "¥0.06 / 1K tokens",
    inputPricePer1K: 0.02,
    outputPricePer1K: 0.06,
    desc: "适合写作、代码、复杂分析。",
  },
  {
    name: "fast-chat",
    label: "快速模型",
    provider: "DeepSeek / Qwen 优先",
    inputPrice: "¥0.005 / 1K tokens",
    outputPrice: "¥0.015 / 1K tokens",
    inputPricePer1K: 0.005,
    outputPricePer1K: 0.015,
    desc: "适合客服、聊天、轻量任务。",
  },
  {
    name: "long-text",
    label: "长文本模型",
    provider: "Claude / Gemini 优先",
    inputPrice: "¥0.03 / 1K tokens",
    outputPrice: "¥0.08 / 1K tokens",
    inputPricePer1K: 0.03,
    outputPricePer1K: 0.08,
    desc: "适合长文档、总结、长上下文。",
  },
  {
    name: "cheap-chat",
    label: "便宜模型",
    provider: "Qwen / DeepSeek 优先",
    inputPrice: "¥0.002 / 1K tokens",
    outputPrice: "¥0.006 / 1K tokens",
    inputPricePer1K: 0.002,
    outputPricePer1K: 0.006,
    desc: "适合批量任务和测试。",
  },
];

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "概览", icon: <Gauge className="h-4 w-4" /> },
  { key: "keys", label: "API Key", icon: <KeyRound className="h-4 w-4" /> },
  { key: "playground", label: "在线测试", icon: <Play className="h-4 w-4" /> },
  { key: "models", label: "模型列表", icon: <Database className="h-4 w-4" /> },
  { key: "usage", label: "用量记录", icon: <Activity className="h-4 w-4" /> },
  { key: "recharge", label: "充值中心", icon: <CreditCard className="h-4 w-4" /> },
  { key: "orders", label: "订单记录", icon: <FileText className="h-4 w-4" /> },
  { key: "docs", label: "API 文档", icon: <BookOpen className="h-4 w-4" /> },
  { key: "admin", label: "管理后台", icon: <Settings className="h-4 w-4" /> },
];

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
    promptTokens: row.prompt_tokens ?? 0,
    completionTokens: row.completion_tokens ?? 0,
    cost: Number(row.cost ?? 0),
    status: row.status ?? "success",
  };
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

export default function EasyApiHubPage() {
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [page, setPage] = useState<Page>("home");
  const [dashboardTab, setDashboardTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [selectedModel, setSelectedModel] = useState("smart-chat");
  const [testPrompt, setTestPrompt] = useState("你好，帮我写一个 API 中转站介绍");
  const [testResult, setTestResult] = useState(
    "这里会显示模型回复。当前是本地演示版，不会真的请求上游 API。"
  );
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);

  const activeKey = apiKeys[0]?.oneTimeKey ?? (apiKeys[0] ? `${apiKeys[0].keyPrefix}...` : "你的_API_Key");
  const userEmail = session?.user.email ?? email;
  const isAdmin = profileRole === "admin";
  const visibleTabs = tabs.filter((tab) => tab.key !== "admin" || isAdmin);
  const activeDashboardTab = !isAdmin && dashboardTab === "admin" ? "overview" : dashboardTab;
  const selectedModelInfo =
    modelList.find((model) => model.name === selectedModel) ?? modelList[0];

  const code = useMemo(() => {
    return `from openai import OpenAI

client = OpenAI(
    api_key="${activeKey}",
    base_url="https://api.yourdomain.com/v1"
)

response = client.chat.completions.create(
    model="${selectedModel}",
    messages=[
        {"role": "user", "content": "你好，帮我写一个网站标题"}
    ]
)

print(response.choices[0].message.content)`;
  }, [activeKey, selectedModel]);

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
  }, []);

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
            .select("id,model,prompt_tokens,completion_tokens,cost,status,created_at")
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
      showCopyMessage("API Key 已创建，完整密钥只显示这一次。");
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
      if (item.oneTimeKey && createdApiKey === item.oneTimeKey) {
        setCreatedApiKey("");
      }
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
      `演示回复：你的请求已通过 ${selectedModel} 处理。\n\n这是本地模拟结果，不会请求真实 AI API，也不会写入 usage_logs。\n\nTokens：${total}\n模拟费用：¥${cost.toFixed(4)}`
    );
  };

  const recharge = (amount: number) => {
    showCopyMessage(`已选择 ¥${amount}，当前版本暂不接支付；订单和余额需要后台人工处理。`);
  };

  const handleManualRecharge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualRechargeMessage("");

    if (!supabase || !session || !isAdmin) {
      setManualRechargeMessage("只有管理员可以执行人工充值。");
      return;
    }

    const targetEmail = manualRechargeEmail.trim();
    const amount = Number(manualRechargeAmount);

    if (!targetEmail || !Number.isFinite(amount) || amount <= 0) {
      setManualRechargeMessage("请输入用户邮箱，并填写大于 0 的充值金额。");
      return;
    }

    setManualRechargeSubmitting(true);

    try {
      const { data, error } = await supabase.rpc("manual_recharge", {
        target_email: targetEmail,
        recharge_amount: amount,
        recharge_note: manualRechargeNote.trim() || null,
      });

      if (error) {
        throw error;
      }

      const result = Array.isArray(data)
        ? (data[0] as ManualRechargeResult | undefined)
        : (data as ManualRechargeResult | null);
      setManualRechargeMessage(
        `充值成功：${result?.email ?? targetEmail} 增加 ¥${Number(result?.amount ?? amount).toFixed(2)}，当前余额 ¥${Number(result?.new_balance ?? 0).toFixed(2)}。`
      );
      setManualRechargeEmail("");
      setManualRechargeAmount("");
      setManualRechargeNote("");

      if (result?.user_id === session.user.id) {
        await loadDashboardData(session);
      }
    } catch (error) {
      console.error(error);
      setManualRechargeMessage("充值失败。请确认你是 admin，并且 SQL 函数 manual_recharge 已执行。");
    } finally {
      setManualRechargeSubmitting(false);
    }
  };

  const LoginDialog = loginOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <Card className="w-full max-w-md rounded-3xl border-white/10 bg-slate-900 text-white shadow-2xl">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {authMode === "login" ? "登录控制台" : "注册账号"}
            </h2>
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

        <header className="relative z-10 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button onClick={() => setPage("home")} className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-950">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">EasyAPI Hub</span>
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
            <div>
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
            <div>
              <SectionTitle label="API Key" title="密钥管理" desc="创建、复制、显示、隐藏和删除你的接口密钥。" />
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
                      <p className="text-sm font-semibold text-cyan-100">请立即保存完整 API Key</p>
                      <p className="mt-2 break-all font-mono text-xs text-cyan-50">{createdApiKey}</p>
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
                              {showKeys && item.oneTimeKey
                                ? item.oneTimeKey
                                : `${item.keyPrefix}********************************`}
                            </p>
                            {!item.oneTimeKey ? (
                              <p className="mt-2 text-xs text-amber-200/80">完整密钥只在创建时显示一次。</p>
                            ) : null}
                            <p className="mt-2 text-xs text-slate-500">创建时间：{item.createdAt}</p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            {item.oneTimeKey ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copy(item.oneTimeKey ?? "", "已复制 API Key")}
                                className="hover:bg-white/10 hover:text-white"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            ) : null}
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
            <div>
              <SectionTitle label="Playground" title="在线测试台" desc="当前是本地模拟请求，买完 API Key 后可以接真实模型。" />
              <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <label className="text-sm text-slate-300">选择模型</label>
                  <select
                    value={selectedModel}
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

          {activeDashboardTab === "models" ? (
            <div>
              <SectionTitle label="Models" title="模型列表" desc="这里展示对外模型别名、价格和路由说明。" />
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
            </div>
          ) : null}

          {activeDashboardTab === "usage" ? (
            <div>
              <SectionTitle label="Usage" title="用量记录" desc="从 Supabase usage_logs 表读取。当前测试台不会写入真实用量。" />
              <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[580px] text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          <th className="py-3">时间</th>
                          <th className="py-3">模型</th>
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
            <div>
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
            <div>
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
            <div>
              <SectionTitle label="Docs" title="API 文档" desc="给用户复制 base_url、API Key 和接入代码。" />
              <Card className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">Base URL</p>
                      <p className="mt-2 break-all font-mono text-cyan-300">https://api.yourdomain.com/v1</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">模型名</p>
                      <p className="mt-2 font-mono text-cyan-300">{selectedModel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">接口</p>
                      <p className="mt-2 font-mono text-cyan-300">/chat/completions</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">Python 示例</h3>
                    <Button onClick={() => copy(code, "已复制接入代码")} className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                      <Copy className="mr-2 h-4 w-4" />
                      复制
                    </Button>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-5 text-sm leading-7 text-slate-200">
                    <code>{code}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "admin" && isAdmin ? (
            <div>
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
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  "用户管理",
                  "模型价格管理",
                  "供应商线路",
                  "财务统计",
                  "异常请求",
                  "系统监控",
                ].map((item) => (
                  <Card key={item} className="rounded-3xl border-white/10 bg-white/[0.06] text-white">
                    <CardContent className="p-6">
                      <Settings className="mb-4 h-6 w-6 text-cyan-300" />
                      <h3 className="text-lg font-bold">{item}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">当前是页面占位，后续接数据库和后端接口后可真实管理。</p>
                    </CardContent>
                  </Card>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-950">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">EasyAPI Hub</span>
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
              EasyAPI Hub 提供统一 Base URL、统一 API Key、统一账单和统一模型路由。用户只需要改一行配置，就能调用主流 AI 模型。
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
              <SectionTitle label="接入代码" title="只改 base_url，即可开始调用" desc="平台兼容 OpenAI SDK。用户原来怎么调用 OpenAI，现在就怎么调用 EasyAPI Hub。" />
            </div>
            <Card className="overflow-hidden rounded-3xl border-white/10 bg-slate-900 text-white">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Code2 className="h-4 w-4" /> Python 示例
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copy(code, "已复制接入代码")} className="text-slate-300 hover:bg-white/10 hover:text-white">
                    <Copy className="mr-2 h-4 w-4" />复制
                  </Button>
                </div>
                <pre className="overflow-x-auto p-5 text-sm leading-7 text-slate-200">
                  <code>{code}</code>
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
        © 2026 EasyAPI Hub. Built for developers and beginners.
      </footer>
    </div>
  );
}
