"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  Bot,
  BookOpen,
  Copy,
  CreditCard,
  Database,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  Globe2,
  KeyRound,
  LogOut,
  Menu,
  MessageSquare,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingHome } from "@/components/marketing-site";
import { VendorLogo } from "@/components/vendor-logo";
import {
  defaultLanguage,
  getLanguageMeta,
  languages,
  languageChangeEventName,
  languageStorageKey,
} from "@/lib/i18n";
import type { LanguageCode } from "@/lib/i18n";
import {
  capabilityLabels,
  compactCapabilityLabels,
  compactPlatformTagLabels,
  capabilityOrder,
  getProviderById,
  getModelIconBySeries,
  getSeriesById,
  modelCatalog,
  modelSeriesList,
  platformTagLabels,
  platformTagOrder,
  resolveModelIcon,
  resolveModelProviderId,
  resolveModelSeriesId,
} from "@/lib/model-catalog";
import type { CatalogModel, ModelCapability, ModelPlatformTag, ModelProviderId, ModelSeriesId } from "@/lib/model-catalog";
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

const pendingChatPromptStorageKey = "eelapi.pendingChatPrompt";
type ChatNavigationHistoryMode = "push" | "replace";
type OAuthProvider = "google" | "github";

const oauthProviderEnabled: Record<OAuthProvider, boolean> = {
  google: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "false",
  github: process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED !== "false",
};

type DashboardCopy = {
  languageLabel: string;
  functionNav: string;
  dashboardNav: string;
  closeNav: string;
  consoleLabel: string;
  consoleTitle: string;
  consoleDesc: string;
  signedInUser: string;
  logout: string;
  loadingData: string;
  tabs: Record<Tab, string>;
  adminNav: Record<string, string>;
  auth: {
    loginTitle: string;
    signupTitle: string;
    login: string;
    signup: string;
    email: string;
    password: string;
    passwordPlaceholder: string;
    helper: string;
    emailAuthLabel: string;
    oauthDivider: string;
    googleLogin: string;
    githubLogin: string;
    googlePending: string;
    githubPending: string;
    oauthRedirecting: string;
    oauthError: string;
    submitting: string;
    loginRequiredChat: string;
    missingSupabase: string;
    invalidCredentials: string;
    signupConfirm: string;
    noSession: string;
  };
  overview: {
    label: string;
    title: string;
    desc: string;
    balance: string;
    apiKeys: string;
    todayRequests: string;
    models: string;
  };
  keys: {
    label: string;
    title: string;
    desc: string;
    show: string;
    hide: string;
    create: string;
    created: string;
    prefix: string;
    copy: string;
    saved: string;
    empty: string;
    completeKeyHint: string;
    listHint: string;
  };
  playground: {
    label: string;
    title: string;
    desc: string;
    chooseModel: string;
    input: string;
    send: string;
  };
  chat: {
    label: string;
    title: string;
    desc: string;
    endpointHint: string;
    currentModel: string;
    noModel: string;
    balance: string;
    missingKey: string;
    createKey: string;
    emptyTitle: string;
    emptyDesc: string;
    waiting: string;
    inputLabel: string;
    placeholder: string;
    inputHint: string;
    sending: string;
    send: string;
    settings: string;
    useApiKey: string;
    refresh: string;
    refreshing: string;
    keyPrefixHint: string;
    chooseModel: string;
    modelSearchPlaceholder: string;
    noModelMatches: string;
    selectedModel: string;
    noEnabledModel: string;
    rawResponse: string;
    rawResponseHint: string;
    copyRaw: string;
    user: string;
    assistant: string;
    insufficientBalance: string;
    loginRequired: string;
    missingKeyError: string;
    noModelError: string;
    emptyInput: string;
  };
};

type DashboardCopyOverrides = Partial<
  Omit<DashboardCopy, "tabs" | "adminNav" | "auth" | "overview" | "keys" | "playground" | "chat">
> & {
  tabs?: Partial<Record<Tab, string>>;
  adminNav?: Record<string, string>;
  auth?: Partial<DashboardCopy["auth"]>;
  overview?: Partial<DashboardCopy["overview"]>;
  keys?: Partial<DashboardCopy["keys"]>;
  playground?: Partial<DashboardCopy["playground"]>;
  chat?: Partial<DashboardCopy["chat"]>;
};

function mergeDashboardCopy(copy: DashboardCopyOverrides): DashboardCopy {
  return {
    ...dashboardCopyZh,
    ...copy,
    tabs: { ...dashboardCopyZh.tabs, ...copy.tabs },
    adminNav: { ...dashboardCopyZh.adminNav, ...copy.adminNav },
    auth: { ...dashboardCopyZh.auth, ...copy.auth },
    overview: { ...dashboardCopyZh.overview, ...copy.overview },
    keys: { ...dashboardCopyZh.keys, ...copy.keys },
    playground: { ...dashboardCopyZh.playground, ...copy.playground },
    chat: { ...dashboardCopyZh.chat, ...copy.chat },
  };
}

const dashboardCopyZh: DashboardCopy = {
  languageLabel: "语言",
  functionNav: "功能导航",
  dashboardNav: "后台导航",
  closeNav: "关闭功能导航",
  consoleLabel: "控制台",
  consoleTitle: "eelapi 开发者控制台",
  consoleDesc: "统一管理 AI 聊天、API Key、模型、用量、充值和运营后台，让接入、调试和账单核对保持在同一工作流中。",
  signedInUser: "已登录用户",
  logout: "退出",
  loadingData: "正在读取你的 Supabase 数据...",
  tabs: {
    overview: "概览",
    chat: "AI 聊天",
    keys: "API Key",
    playground: "接口调试",
    models: "模型列表",
    usage: "用量记录",
    recharge: "充值中心",
    orders: "充值记录",
    docs: "API 文档",
    admin: "管理后台",
  },
  adminNav: {
    modelPricing: "模型价格管理",
    suppliers: "供应商线路",
    rechargeReview: "充值审核/记录",
    users: "用户管理",
    finance: "财务统计",
    errors: "异常请求",
    monitoring: "系统监控",
  },
  auth: {
    loginTitle: "登录控制台",
    signupTitle: "注册账号",
    login: "登录",
    signup: "注册",
    email: "邮箱",
    password: "密码",
    passwordPlaceholder: "至少 6 位",
    helper: "登录后可管理 AI 聊天、API Key、接口调试、用量记录、账户账单和后台运营信息。",
    emailAuthLabel: "邮箱登录 / 注册",
    oauthDivider: "或使用第三方账号继续",
    googleLogin: "使用 Google 登录",
    githubLogin: "使用 GitHub 登录",
    googlePending: "Google 登录正在配置中，请暂时使用邮箱登录。",
    githubPending: "GitHub 登录正在配置中，请暂时使用邮箱登录。",
    oauthRedirecting: "正在跳转到第三方登录页面...",
    oauthError: "第三方登录暂不可用，请暂时使用邮箱登录。",
    submitting: "处理中...",
    loginRequiredChat: "请先登录后继续 AI 对话，登录成功后会自动带入刚才的问题。",
    missingSupabase: "请先在 Netlify 或本地 .env.local 中配置 Supabase URL 和 Publishable key。",
    invalidCredentials: "请输入邮箱，并使用至少 6 位密码。",
    signupConfirm: "注册成功，请先打开邮箱确认邮件，然后再登录。",
    noSession: "登录没有返回会话，请检查 Supabase 邮箱确认设置。",
  },
  overview: {
    label: "Overview",
    title: "平台概览",
    desc: "查看余额、请求数、密钥数量和模型数量。",
    balance: "当前余额",
    apiKeys: "API Key 数量",
    todayRequests: "今日请求",
    models: "可用模型",
  },
  keys: {
    label: "API Key",
    title: "密钥管理",
    desc: "创建、复制和删除你的接口密钥；列表只展示 Key 前缀。",
    show: "显示密钥",
    hide: "隐藏密钥",
    create: "新建 API Key",
    created: "API Key 已创建",
    prefix: "前缀",
    copy: "复制",
    saved: "我已保存",
    empty: "还没有 API Key，请点击新建。",
    completeKeyHint: "完整密钥不会在页面明文展示；如需接入外部开发者接口，请立即复制，离开后无法再次获取。",
    listHint: "完整密钥不会在列表中显示。",
  },
  playground: {
    label: "Playground",
    title: "接口调试台",
    desc: "用于验证模型、消息格式和响应流程，便于开发者在接入前完成调试。",
    chooseModel: "选择模型",
    input: "输入内容",
    send: "发送请求",
  },
  chat: {
    label: "AI Chat",
    title: "AI Console",
    desc: "使用当前账号的 API Key、余额和启用模型发起正式聊天请求，适合接入前验证和日常调试。",
    endpointHint: "登录态内部调用",
    currentModel: "当前模型",
    noModel: "暂无可用模型",
    balance: "当前余额",
    missingKey: "你还没有 API Key，请先到 API Key 页面创建一个。",
    createKey: "去创建 API Key",
    emptyTitle: "准备发送第一条消息",
    emptyDesc: "从首页带入的问题会出现在下方输入框。确认模型和 API Key 后即可发送。",
    waiting: "正在等待模型回复...",
    inputLabel: "向模型提问",
    placeholder: "请输入要发送给模型的消息",
    inputHint: "Enter 发送，Shift+Enter 换行；不会把 prompt 或完整 API Key 写入 localStorage。",
    sending: "发送中...",
    send: "发送",
    settings: "调用设置",
    useApiKey: "使用 API Key",
    refresh: "刷新",
    refreshing: "刷新中...",
    keyPrefixHint: "这里只显示 key_prefix，不显示也不保存完整 API Key。",
    chooseModel: "选择模型",
    modelSearchPlaceholder: "搜索模型名称、slug、厂商或系列",
    noModelMatches: "没有匹配的模型",
    selectedModel: "当前选择",
    noEnabledModel: "当前没有启用模型，请联系管理员在模型价格管理里启用。",
    rawResponse: "原始返回",
    rawResponseHint: "发送成功后，这里会显示原始 JSON 返回。",
    copyRaw: "复制接口返回结果",
    user: "你",
    assistant: "Assistant",
    insufficientBalance: "余额不足，请先充值。",
    loginRequired: "请先登录后再使用 AI 聊天。",
    missingKeyError: "你还没有 API Key，请先到 API Key 页面创建一个。",
    noModelError: "当前没有可用模型，请联系管理员启用模型。",
    emptyInput: "请输入要发送的内容。",
  },
};

const dashboardCopyEn = mergeDashboardCopy({
  languageLabel: "Language",
  functionNav: "Navigation",
  dashboardNav: "Dashboard",
  closeNav: "Close navigation",
  consoleLabel: "Console",
  consoleTitle: "eelapi developer console",
  consoleDesc: "Manage AI Chat, API Keys, models, usage, top-ups, and operations in one workflow for integration and billing review.",
  signedInUser: "Signed-in user",
  logout: "Log out",
  loadingData: "Loading your Supabase data...",
  tabs: {
    overview: "Overview",
    chat: "AI Chat",
    keys: "API Key",
    playground: "Playground",
    models: "Models",
    usage: "Usage",
    recharge: "Top-up",
    orders: "Top-up records",
    docs: "API docs",
    admin: "Admin",
  },
  adminNav: {
    modelPricing: "Model pricing",
    suppliers: "Suppliers",
    rechargeReview: "Top-up review",
    users: "Users",
    finance: "Finance",
    errors: "Errors",
    monitoring: "Monitoring",
  },
  auth: {
    loginTitle: "Log in to console",
    signupTitle: "Create account",
    login: "Log in",
    signup: "Sign up",
    email: "Email",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    helper: "After signing in, you can use AI chat, API Keys, request validation, usage records, billing, and operations.",
    emailAuthLabel: "Email login / sign up",
    oauthDivider: "Or continue with a third-party account",
    googleLogin: "Continue with Google",
    githubLogin: "Continue with GitHub",
    googlePending: "Google login is being configured. Please use email login for now.",
    githubPending: "GitHub login is being configured. Please use email login for now.",
    oauthRedirecting: "Redirecting to the third-party login page...",
    oauthError: "Third-party login is temporarily unavailable. Please use email login for now.",
    submitting: "Processing...",
    loginRequiredChat: "Please log in to continue AI chat. Your question will be kept after login.",
    missingSupabase: "Configure Supabase URL and Publishable key in Netlify or .env.local first.",
    invalidCredentials: "Enter an email and a password with at least 6 characters.",
    signupConfirm: "Account created. Please confirm the email, then log in.",
    noSession: "No session returned. Check Supabase email confirmation settings.",
  },
  overview: {
    label: "Overview",
    title: "Platform overview",
    desc: "Review balance, requests, API Keys, and enabled models.",
    balance: "Balance",
    apiKeys: "API Keys",
    todayRequests: "Requests today",
    models: "Models",
  },
  keys: {
    title: "API Key management",
    desc: "Create, copy, and revoke API Keys. The list only shows key prefixes.",
    show: "Show keys",
    hide: "Hide keys",
    create: "New API Key",
    created: "API Key created",
    prefix: "Prefix",
    copy: "Copy",
    saved: "Saved",
    empty: "No API Key yet. Create one to start.",
    completeKeyHint: "The full key is not shown later. Copy it now if you need external API access.",
    listHint: "Full keys are never shown in the list.",
  },
  playground: {
    title: "Online playground",
    desc: "Validate models, message format, and response flow before integration.",
    chooseModel: "Model",
    input: "Input",
    send: "Send request",
  },
  chat: {
    title: "AI Console",
    desc: "Send real chat requests with your account API Key, balance, and enabled models for integration checks and daily debugging.",
    endpointHint: "Authenticated internal call",
    currentModel: "Model",
    noModel: "No model",
    balance: "Balance",
    missingKey: "No API Key yet. Create one before using AI Chat.",
    createKey: "Create API Key",
    emptyTitle: "Ready for the first message",
    emptyDesc: "Questions from the homepage appear in the input below. Confirm model and API Key, then send.",
    waiting: "Waiting for model response...",
    inputLabel: "Ask the model",
    placeholder: "Enter a message for the model",
    inputHint: "Enter to send, Shift+Enter for new line. Prompts and full API Keys are not written to localStorage.",
    sending: "Sending...",
    send: "Send",
    settings: "Run settings",
    useApiKey: "API Key",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    keyPrefixHint: "Only key_prefix is shown here. Full API Keys are not displayed or stored.",
    chooseModel: "Model",
    modelSearchPlaceholder: "Search model name, slug, provider, or series",
    noModelMatches: "No matching models",
    selectedModel: "Selected",
    noEnabledModel: "No enabled model. Ask an admin to enable one in model pricing.",
    rawResponse: "Raw response",
    rawResponseHint: "The raw JSON response appears here after a successful request.",
    copyRaw: "Copy raw response",
    user: "You",
    insufficientBalance: "Insufficient balance. Please top up first.",
    loginRequired: "Please log in before using AI Chat.",
    missingKeyError: "No API Key yet. Create one before using AI Chat.",
    noModelError: "No available model. Contact an admin to enable a model.",
    emptyInput: "Enter a message first.",
  },
});

function mergeDashboardCopyFromEnglish(copy: DashboardCopyOverrides): DashboardCopy {
  return {
    ...dashboardCopyEn,
    ...copy,
    tabs: { ...dashboardCopyEn.tabs, ...copy.tabs },
    adminNav: { ...dashboardCopyEn.adminNav, ...copy.adminNav },
    auth: { ...dashboardCopyEn.auth, ...copy.auth },
    overview: { ...dashboardCopyEn.overview, ...copy.overview },
    keys: { ...dashboardCopyEn.keys, ...copy.keys },
    playground: { ...dashboardCopyEn.playground, ...copy.playground },
    chat: { ...dashboardCopyEn.chat, ...copy.chat },
  };
}

const dashboardCopies: Record<LanguageCode, DashboardCopy> = {
  zh: dashboardCopyZh,
  en: dashboardCopyEn,
  ja: mergeDashboardCopyFromEnglish({
    languageLabel: "言語",
    functionNav: "機能ナビ",
    dashboardNav: "コンソール",
    closeNav: "ナビを閉じる",
    consoleLabel: "コンソール",
    consoleTitle: "API 管理コンソール",
    consoleDesc: "API Key、AI チャット、テスト、モデル、利用記録、請求を管理します。",
    signedInUser: "ログイン中",
    logout: "ログアウト",
    loadingData: "Supabase データを読み込み中...",
    tabs: { overview: "概要", chat: "AI チャット", keys: "API Key", playground: "オンラインテスト", models: "モデル", usage: "利用記録", recharge: "チャージ", orders: "チャージ記録", docs: "API ドキュメント", admin: "管理" },
    auth: { loginTitle: "コンソールにログイン", signupTitle: "アカウント作成", login: "ログイン", signup: "登録", email: "メール", password: "パスワード", passwordPlaceholder: "6 文字以上", helper: "ログイン後、AI チャット、API Key、検証、利用記録、請求を管理できます。", emailAuthLabel: "メールでログイン / 登録", oauthDivider: "または外部アカウントで続行", googleLogin: "Google でログイン", githubLogin: "GitHub でログイン", googlePending: "Google ログインは設定中です。しばらくはメールログインをご利用ください。", githubPending: "GitHub ログインは設定中です。しばらくはメールログインをご利用ください。", submitting: "処理中...", loginRequiredChat: "AI チャットを続けるにはログインしてください。質問は保持されます。" },
    overview: { title: "プラットフォーム概要", desc: "残高、リクエスト、API Key、モデル数を確認します。", balance: "残高", apiKeys: "API Key", todayRequests: "本日のリクエスト", models: "モデル" },
    chat: { title: "AI チャットコンソール", desc: "アカウントの API Key、残高、有効モデルで正式なチャットリクエストを送信します。", missingKey: "API Key がありません。先に作成してください。", createKey: "API Key を作成", emptyTitle: "AI チャットを開始", emptyDesc: "ホームからの質問は下の入力欄に入ります。モデルと API Key を確認して送信してください。", inputLabel: "モデルへ質問", send: "送信", sending: "送信中...", settings: "呼び出し設定" },
  }),
  ko: mergeDashboardCopyFromEnglish({
    languageLabel: "언어",
    functionNav: "기능 탐색",
    dashboardNav: "콘솔",
    closeNav: "탐색 닫기",
    consoleLabel: "콘솔",
    consoleTitle: "API 관리 콘솔",
    consoleDesc: "API Key, AI 채팅, 테스트, 모델, 사용 기록, 청구를 관리합니다.",
    signedInUser: "로그인 사용자",
    logout: "로그아웃",
    loadingData: "Supabase 데이터를 읽는 중...",
    tabs: { overview: "개요", chat: "AI 채팅", keys: "API Key", playground: "온라인 테스트", models: "모델", usage: "사용 기록", recharge: "충전", orders: "충전 기록", docs: "API 문서", admin: "관리" },
    auth: { loginTitle: "콘솔 로그인", signupTitle: "계정 만들기", login: "로그인", signup: "가입", email: "이메일", password: "비밀번호", passwordPlaceholder: "6자 이상", helper: "로그인 후 AI 채팅, API Key, 테스트, 사용 기록, 청구를 관리할 수 있습니다.", submitting: "처리 중...", loginRequiredChat: "AI 채팅을 계속하려면 로그인하세요. 질문은 유지됩니다." },
    overview: { title: "플랫폼 개요", balance: "잔액", apiKeys: "API Key", todayRequests: "오늘 요청", models: "모델" },
    chat: { title: "AI 채팅 콘솔", desc: "계정 API Key, 잔액, 활성 모델로 실제 채팅 요청을 보냅니다.", missingKey: "API Key가 없습니다. 먼저 생성하세요.", createKey: "API Key 생성", emptyTitle: "AI 채팅 준비", inputLabel: "모델에 질문", send: "보내기", sending: "전송 중...", settings: "호출 설정" },
  }),
  es: mergeDashboardCopyFromEnglish({
    languageLabel: "Idioma",
    functionNav: "Navegación",
    dashboardNav: "Consola",
    closeNav: "Cerrar navegación",
    consoleLabel: "Consola",
    consoleTitle: "Consola de gestión API",
    consoleDesc: "Gestiona API Keys, chat AI, pruebas, modelos, uso y facturación.",
    signedInUser: "Usuario conectado",
    logout: "Salir",
    loadingData: "Cargando datos de Supabase...",
    tabs: { overview: "Resumen", chat: "Chat AI", keys: "API Key", playground: "Pruebas", models: "Modelos", usage: "Uso", recharge: "Recarga", orders: "Registros", docs: "Docs API", admin: "Admin" },
    auth: { loginTitle: "Entrar a la consola", signupTitle: "Crear cuenta", login: "Entrar", signup: "Registrarse", email: "Email", password: "Contraseña", passwordPlaceholder: "Al menos 6 caracteres", helper: "Tras entrar puedes usar chat AI, API Keys, validación, uso y facturación.", emailAuthLabel: "Email / registro", oauthDivider: "O continúa con una cuenta externa", googleLogin: "Continuar con Google", githubLogin: "Continuar con GitHub", googlePending: "Google Login está en configuración. Usa el acceso por email por ahora.", githubPending: "GitHub Login está en configuración. Usa el acceso por email por ahora.", submitting: "Procesando...", loginRequiredChat: "Inicia sesión para continuar el chat AI. Conservaremos tu pregunta." },
    overview: { title: "Resumen de plataforma", balance: "Saldo", apiKeys: "API Keys", todayRequests: "Solicitudes hoy", models: "Modelos" },
    chat: { title: "Consola de Chat AI", desc: "Envía solicitudes reales con tu API Key, saldo y modelos activos.", missingKey: "No tienes API Key. Crea una primero.", createKey: "Crear API Key", emptyTitle: "Listo para chatear", inputLabel: "Pregunta al modelo", send: "Enviar", sending: "Enviando...", settings: "Ajustes" },
  }),
  fr: mergeDashboardCopyFromEnglish({
    languageLabel: "Langue",
    functionNav: "Navigation",
    dashboardNav: "Console",
    closeNav: "Fermer",
    consoleLabel: "Console",
    consoleTitle: "Console de gestion API",
    consoleDesc: "Gérez API Keys, chat AI, validation, modèles, usage et facturation.",
    signedInUser: "Utilisateur connecté",
    logout: "Déconnexion",
    loadingData: "Chargement des données Supabase...",
    tabs: { overview: "Vue d’ensemble", chat: "Chat AI", keys: "API Key", playground: "Validation API", models: "Modèles", usage: "Usage", recharge: "Recharge", orders: "Historique", docs: "Docs API", admin: "Admin" },
    auth: { loginTitle: "Connexion console", signupTitle: "Créer un compte", login: "Connexion", signup: "Inscription", email: "Email", password: "Mot de passe", passwordPlaceholder: "Au moins 6 caractères", helper: "Après connexion, vous pouvez gérer chat AI, API Keys, validation, usage et facturation.", submitting: "Traitement...", loginRequiredChat: "Connectez-vous pour continuer le chat AI. Votre question sera conservée." },
    overview: { title: "Vue d’ensemble", balance: "Solde", apiKeys: "API Keys", todayRequests: "Requêtes du jour", models: "Modèles" },
    chat: { title: "Console Chat AI", desc: "Envoyez des requêtes avec votre API Key, votre solde et les modèles actifs.", missingKey: "Aucune API Key. Créez-en une d’abord.", createKey: "Créer API Key", emptyTitle: "Prêt pour le chat AI", inputLabel: "Question au modèle", send: "Envoyer", sending: "Envoi...", settings: "Paramètres" },
  }),
  de: mergeDashboardCopyFromEnglish({
    languageLabel: "Sprache",
    functionNav: "Navigation",
    dashboardNav: "Konsole",
    closeNav: "Schließen",
    consoleLabel: "Konsole",
    consoleTitle: "API-Verwaltungskonsole",
    consoleDesc: "API Keys, AI Chat, Validierung, Modelle, Nutzung und Abrechnung verwalten.",
    signedInUser: "Angemeldeter Nutzer",
    logout: "Abmelden",
    loadingData: "Supabase-Daten werden geladen...",
    tabs: { overview: "Übersicht", chat: "AI Chat", keys: "API Key", playground: "API-Validierung", models: "Modelle", usage: "Nutzung", recharge: "Aufladen", orders: "Aufladungen", docs: "API-Doku", admin: "Admin" },
    auth: { loginTitle: "In Konsole anmelden", signupTitle: "Konto erstellen", login: "Anmelden", signup: "Registrieren", email: "E-Mail", password: "Passwort", passwordPlaceholder: "Mindestens 6 Zeichen", helper: "Nach Anmeldung können Sie AI Chat, API Keys, Validierung, Nutzung und Abrechnung verwalten.", submitting: "Wird verarbeitet...", loginRequiredChat: "Bitte anmelden, um AI Chat fortzusetzen. Ihre Frage bleibt erhalten." },
    overview: { title: "Plattformübersicht", balance: "Saldo", apiKeys: "API Keys", todayRequests: "Anfragen heute", models: "Modelle" },
    chat: { title: "AI Chat Konsole", desc: "Senden Sie echte Chat-Anfragen mit API Key, Saldo und aktivierten Modellen.", missingKey: "Noch kein API Key. Bitte zuerst erstellen.", createKey: "API Key erstellen", emptyTitle: "Bereit für AI Chat", inputLabel: "Modell fragen", send: "Senden", sending: "Senden...", settings: "Einstellungen" },
  }),
  pt: mergeDashboardCopyFromEnglish({
    languageLabel: "Idioma",
    functionNav: "Navegação",
    dashboardNav: "Console",
    closeNav: "Fechar",
    consoleLabel: "Console",
    consoleTitle: "Console de gestão API",
    consoleDesc: "Gerencie API Keys, chat AI, validação, modelos, uso e cobrança.",
    signedInUser: "Usuário conectado",
    logout: "Sair",
    loadingData: "Carregando dados do Supabase...",
    tabs: { overview: "Visão geral", chat: "Chat AI", keys: "API Key", playground: "Validação API", models: "Modelos", usage: "Uso", recharge: "Recarga", orders: "Registros", docs: "Docs API", admin: "Admin" },
    auth: { loginTitle: "Entrar no console", signupTitle: "Criar conta", login: "Entrar", signup: "Cadastrar", email: "Email", password: "Senha", passwordPlaceholder: "Pelo menos 6 caracteres", helper: "Após entrar, gerencie chat AI, API Keys, validação, uso e cobrança.", submitting: "Processando...", loginRequiredChat: "Entre para continuar o chat AI. Sua pergunta será mantida." },
    overview: { title: "Visão geral", balance: "Saldo", apiKeys: "API Keys", todayRequests: "Solicitações hoje", models: "Modelos" },
    chat: { title: "Console de Chat AI", desc: "Envie solicitações reais com sua API Key, saldo e modelos ativos.", missingKey: "Você ainda não tem API Key. Crie uma primeiro.", createKey: "Criar API Key", emptyTitle: "Pronto para chat AI", inputLabel: "Perguntar ao modelo", send: "Enviar", sending: "Enviando...", settings: "Configurações" },
  }),
  ru: mergeDashboardCopyFromEnglish({
    languageLabel: "Язык",
    functionNav: "Навигация",
    dashboardNav: "Консоль",
    closeNav: "Закрыть",
    consoleLabel: "Консоль",
    consoleTitle: "Консоль управления API",
    consoleDesc: "Управляйте API Keys, AI-чатом, тестами, моделями, использованием и биллингом.",
    signedInUser: "Пользователь",
    logout: "Выйти",
    loadingData: "Загрузка данных Supabase...",
    tabs: { overview: "Обзор", chat: "AI-чат", keys: "API Key", playground: "Тест", models: "Модели", usage: "Использование", recharge: "Пополнение", orders: "Записи", docs: "API-доки", admin: "Админ" },
    auth: { loginTitle: "Войти в консоль", signupTitle: "Создать аккаунт", login: "Войти", signup: "Регистрация", email: "Email", password: "Пароль", passwordPlaceholder: "Минимум 6 символов", helper: "После входа доступны AI-чат, API Keys, тесты, использование и биллинг.", submitting: "Обработка...", loginRequiredChat: "Войдите, чтобы продолжить AI-чат. Вопрос будет сохранен." },
    overview: { title: "Обзор платформы", balance: "Баланс", apiKeys: "API Keys", todayRequests: "Запросы сегодня", models: "Модели" },
    chat: { title: "Консоль AI-чата", desc: "Отправляйте реальные запросы с API Key, балансом и активными моделями.", missingKey: "API Key нет. Сначала создайте ключ.", createKey: "Создать API Key", emptyTitle: "Готово к AI-чату", inputLabel: "Вопрос модели", send: "Отправить", sending: "Отправка...", settings: "Настройки" },
  }),
  ar: mergeDashboardCopyFromEnglish({
    languageLabel: "اللغة",
    functionNav: "التنقل",
    dashboardNav: "لوحة التحكم",
    closeNav: "إغلاق",
    consoleLabel: "لوحة التحكم",
    consoleTitle: "لوحة إدارة API",
    consoleDesc: "إدارة مفاتيح API ودردشة AI والاختبار والنماذج والاستخدام والفوترة.",
    signedInUser: "مستخدم مسجل",
    logout: "تسجيل الخروج",
    loadingData: "جارٍ تحميل بيانات Supabase...",
    tabs: { overview: "نظرة عامة", chat: "دردشة AI", keys: "API Key", playground: "اختبار", models: "النماذج", usage: "الاستخدام", recharge: "الشحن", orders: "السجلات", docs: "وثائق API", admin: "الإدارة" },
    auth: { loginTitle: "تسجيل الدخول للوحة التحكم", signupTitle: "إنشاء حساب", login: "تسجيل الدخول", signup: "تسجيل", email: "البريد", password: "كلمة المرور", passwordPlaceholder: "6 أحرف على الأقل", helper: "بعد الدخول يمكنك استخدام دردشة AI ومفاتيح API والاختبار والاستخدام والفوترة.", submitting: "جارٍ المعالجة...", loginRequiredChat: "سجّل الدخول لمتابعة دردشة AI. سيتم حفظ سؤالك." },
    overview: { title: "نظرة عامة", balance: "الرصيد", apiKeys: "مفاتيح API", todayRequests: "طلبات اليوم", models: "النماذج" },
    chat: { title: "لوحة دردشة AI", desc: "أرسل طلبات حقيقية باستخدام API Key والرصيد والنماذج المفعلة.", missingKey: "لا يوجد API Key. أنشئ واحداً أولاً.", createKey: "إنشاء API Key", emptyTitle: "جاهز لدردشة AI", inputLabel: "اسأل النموذج", send: "إرسال", sending: "جارٍ الإرسال...", settings: "الإعدادات" },
  }),
};

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

type OrderStatus = "pending" | "submitted" | "paid" | "rejected" | "canceled" | string;
type ManualRechargePaymentMethod = "alipay_manual" | "wechat_manual";
type RechargePaymentMethod = ManualRechargePaymentMethod | "paypal" | "stripe";
type AdminRechargePaymentFilter = "all" | "stripe" | "paypal" | "alipay_manual" | "wechat_manual" | "manual";
type AdminRechargeStatusFilter = "pending_submitted" | "all" | "pending" | "submitted" | "paid" | "rejected" | "failed" | "canceled";

type OrderItem = {
  id: string;
  time: string;
  amount: number;
  method: string;
  paymentMethod: string;
  status: OrderStatus;
  note: string;
  reviewNote: string;
  paidAt: string | null;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  amountUsd: number | null;
  amountCny: number | null;
  exchangeRate: number | null;
  currency: string | null;
};

type ManualRechargeFormState = {
  note: string;
  message: string;
  submitting: boolean;
  createdOrder: OrderItem | null;
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
  user_id?: string | null;
  amount: number | string | null;
  method: string | null;
  payment_method?: string | null;
  status: string | null;
  note: string | null;
  review_note?: string | null;
  created_at: string;
  paid_at?: string | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  amount_usd?: number | string | null;
  amount_cny?: number | string | null;
  exchange_rate?: number | string | null;
  currency?: string | null;
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

type RechargeOrderResult = {
  id: string;
  user_id: string;
  amount: number | string;
  method: string;
  payment_method?: string | null;
  status: OrderStatus;
  note: string | null;
  review_note?: string | null;
  created_at: string;
  paid_at: string | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  amount_usd?: number | string | null;
  amount_cny?: number | string | null;
  exchange_rate?: number | string | null;
  currency?: string | null;
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
type FinanceRange = "today" | "week" | "month" | "all";
type ErrorRange = "today" | "7d" | "30d" | "all";
type ErrorStatusFilter = "all" | "failed" | "blocked" | "rate_limited";
type ModelDirectoryFilter<T extends string> = T | "all";
type DashboardOrderStatusFilter = "all" | OrderStatus;
type DashboardPaymentFilter = "all" | "stripe" | "paypal" | "alipay_manual" | "wechat_manual" | "manual";

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
  payment_method?: string | null;
  status: string | null;
  note: string | null;
  review_note?: string | null;
  created_at: string;
  paid_at?: string | null;
  reviewed_at?: string | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  amount_usd?: number | string | null;
  amount_cny?: number | string | null;
  exchange_rate?: number | string | null;
  currency?: string | null;
};

type AdminRechargeOrderRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  amount: number | string | null;
  method: string | null;
  payment_method?: string | null;
  status: OrderStatus;
  note: string | null;
  review_note?: string | null;
  created_at: string;
  paid_at: string | null;
  reviewed_at?: string | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  amount_usd?: number | string | null;
  amount_cny?: number | string | null;
  exchange_rate?: number | string | null;
  currency?: string | null;
  webhook_event_id?: string | null;
};

type FinanceSummaryRow = {
  total_users: number | string | null;
  total_balance: number | string | null;
  total_recharge_amount: number | string | null;
  total_consumption_amount: number | string | null;
  today_recharge_amount: number | string | null;
  today_consumption_amount: number | string | null;
  week_recharge_amount: number | string | null;
  week_consumption_amount: number | string | null;
  month_recharge_amount: number | string | null;
  month_consumption_amount: number | string | null;
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
  ranking_type: "top_spenders" | "top_rechargers" | "model_rankings" | "supplier_rankings" | "payment_method_stats";
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
  payment_method?: string | null;
  status: string | null;
  note: string | null;
  review_note?: string | null;
  created_at: string;
  amount_usd?: number | string | null;
  amount_cny?: number | string | null;
  exchange_rate?: number | string | null;
  currency?: string | null;
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

type ModelDirectoryItem = {
  id: string;
  name: string;
  upstreamModel: string;
  displayName: string;
  series: ModelSeriesId;
  provider: ModelProviderId;
  providerName: string;
  supplierName: string;
  description: string;
  capabilities: ModelCapability[];
  tags: ModelPlatformTag[];
  inputPrice: string;
  outputPrice: string;
  contextLength: string;
  connected: boolean;
  enabled: boolean;
  source: "database" | "catalog" | "merged";
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
  { key: "chat", label: "AI 聊天", icon: <MessageSquare className="h-4 w-4" /> },
  { key: "keys", label: "API Key", icon: <KeyRound className="h-4 w-4" /> },
  { key: "playground", label: "接口调试", icon: <Play className="h-4 w-4" /> },
  { key: "models", label: "模型列表", icon: <Database className="h-4 w-4" /> },
  { key: "usage", label: "用量记录", icon: <Activity className="h-4 w-4" /> },
  { key: "recharge", label: "充值中心", icon: <CreditCard className="h-4 w-4" /> },
  { key: "orders", label: "充值记录", icon: <FileText className="h-4 w-4" /> },
  { key: "docs", label: "API 文档", icon: <BookOpen className="h-4 w-4" /> },
  { key: "admin", label: "管理后台", icon: <Settings className="h-4 w-4" /> },
];

const dashboardNavItems: DashboardNavItem[] = [
  { label: "概览", id: "overview", tab: "overview" },
  { label: "AI 聊天", id: "chat", tab: "chat" },
  { label: "API Key", id: "api-keys", tab: "keys" },
  { label: "接口调试", id: "playground", tab: "playground" },
  { label: "模型列表", id: "models", tab: "models" },
  { label: "用量记录", id: "usage-logs", tab: "usage" },
  { label: "充值中心", id: "recharge", tab: "recharge" },
  { label: "充值记录", id: "orders", tab: "orders" },
  { label: "API 文档", id: "docs", tab: "docs" },
  { label: "管理后台", id: "admin", tab: "admin", adminOnly: true },
  { label: "模型价格管理", id: "model-pricing", tab: "admin", adminOnly: true },
  { label: "供应商线路", id: "suppliers", tab: "admin", adminOnly: true },
  { label: "充值审核/记录", id: "recharge-review", tab: "admin", adminOnly: true },
  { label: "用户管理", id: "users", tab: "admin", adminOnly: true },
  { label: "财务统计", id: "finance", tab: "admin", adminOnly: true },
  { label: "异常请求", id: "errors", tab: "admin", adminOnly: true },
  { label: "系统监控", id: "monitoring", tab: "admin", adminOnly: true },
];

const adminNavCopyKeys: Record<string, keyof DashboardCopy["adminNav"]> = {
  "model-pricing": "modelPricing",
  suppliers: "suppliers",
  "recharge-review": "rechargeReview",
  users: "users",
  finance: "finance",
  errors: "errors",
  monitoring: "monitoring",
};

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

const rechargeAmountOptions = [10, 30, 50, 100];
const manualRechargePaymentOptions: Array<{
  key: ManualRechargePaymentMethod;
  title: string;
  label: string;
  desc: string;
  qrSrc: string;
}> = [
  {
    key: "alipay_manual",
    title: "支付宝手动转账",
    label: "支付宝",
    desc: "人工审核，付款后请等待管理员确认。",
    qrSrc: "/alipay-qr.png",
  },
  {
    key: "wechat_manual",
    title: "微信手动转账",
    label: "微信",
    desc: "人工审核，付款后请等待管理员确认。",
    qrSrc: "/wechat-qr.png",
  },
];
const rechargePaymentOptions: Array<{
  key: RechargePaymentMethod;
  label: string;
  title: string;
  desc: string;
  badge?: string;
  disabled?: boolean;
}> = [
  {
    key: "wechat_manual",
    label: "微信支付",
    title: "微信支付",
    desc: "扫码转账，提交后等待管理员审核。",
  },
  {
    key: "alipay_manual",
    label: "支付宝",
    title: "支付宝",
    desc: "扫码转账，提交后等待管理员审核。",
  },
  {
    key: "paypal",
    label: "PayPal",
    title: "PayPal",
    desc: "美元支付，按汇率折算人民币到账。",
  },
  {
    key: "stripe",
    label: "Stripe",
    title: "Stripe 支付",
    desc: "银行卡支付正在开通审核中，暂不接受正式充值。",
    badge: "审核中",
    disabled: true,
  },
];
const stripePendingMessage = "Stripe 支付正在开通中，请暂时使用 PayPal、微信或支付宝充值。";
const adminRechargePaymentFilters: Array<{ value: AdminRechargePaymentFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "alipay_manual", label: "支付宝" },
  { value: "wechat_manual", label: "微信" },
  { value: "manual", label: "手动" },
];
const adminRechargeStatusFilters: Array<{ value: AdminRechargeStatusFilter; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "pending_submitted", label: "待审核" },
  { value: "pending", label: "待支付" },
  { value: "submitted", label: "已提交" },
  { value: "paid", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
  { value: "failed", label: "支付失败" },
  { value: "canceled", label: "已取消" },
];

function createManualRechargeForms(): Record<ManualRechargePaymentMethod, ManualRechargeFormState> {
  return {
    alipay_manual: {
      note: "",
      message: "",
      submitting: false,
      createdOrder: null,
    },
    wechat_manual: {
      note: "",
      message: "",
      submitting: false,
      createdOrder: null,
    },
  };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const target = new Date(value);
  const now = new Date();

  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

function formatCompactId(value: string | null | undefined, head = 8, tail = 6) {
  if (!value) {
    return "无";
  }

  if (value.length <= head + tail + 3) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
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
  const paymentMethod = row.payment_method ?? row.method ?? "未知";

  return {
    id: row.id,
    time: formatDateTime(row.created_at),
    amount: Number(row.amount ?? 0),
    method: row.method ?? paymentMethod,
    paymentMethod,
    status: row.status ?? "pending",
    note: row.note ?? "",
    reviewNote: row.review_note ?? "",
    paidAt: row.paid_at ?? null,
    paypalOrderId: row.paypal_order_id ?? null,
    paypalCaptureId: row.paypal_capture_id ?? null,
    stripeSessionId: row.stripe_session_id ?? null,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? null,
    amountUsd: row.amount_usd == null ? null : Number(row.amount_usd),
    amountCny: row.amount_cny == null ? null : Number(row.amount_cny),
    exchangeRate: row.exchange_rate == null ? null : Number(row.exchange_rate),
    currency: row.currency ?? null,
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

function uniqueValues<T extends string>(values: T[]) {
  return Array.from(new Set(values));
}

function inferProviderId(model: Pick<ModelItem, "name" | "provider" | "supplierName">): ModelProviderId {
  return resolveModelProviderId(model.provider, model.supplierName, model.name);
}

function inferSeriesId(model: Pick<ModelItem, "name" | "upstreamModel" | "label" | "provider" | "supplierName" | "desc">, catalogModel?: CatalogModel): ModelSeriesId {
  return catalogModel?.series ?? resolveModelSeriesId(model.name, model.upstreamModel, model.label, model.provider, model.supplierName, model.desc);
}

function catalogMatchesModel(catalogModel: CatalogModel, model: Pick<ModelItem, "name" | "upstreamModel">) {
  const modelName = model.name.toLowerCase();
  const upstreamModel = model.upstreamModel.toLowerCase();

  return (
    catalogModel.name.toLowerCase() === modelName ||
    catalogModel.id.toLowerCase() === modelName ||
    catalogModel.name.toLowerCase() === upstreamModel ||
    catalogModel.id.toLowerCase() === upstreamModel
  );
}

function findCatalogModel(model: Pick<ModelItem, "name" | "upstreamModel">) {
  return modelCatalog.find((catalogModel) => catalogMatchesModel(catalogModel, model));
}

function inferCapabilities(model: ModelItem, catalogModel?: CatalogModel): ModelCapability[] {
  if (catalogModel?.capabilities.length) {
    return catalogModel.capabilities;
  }

  const source = `${model.name} ${model.label} ${model.desc}`.toLowerCase();
  const capabilities: ModelCapability[] = [];

  if (source.includes("embedding") || source.includes("embed")) capabilities.push("embedding");
  if (source.includes("rerank")) capabilities.push("rerank");
  if (source.includes("image") || source.includes("图像") || source.includes("vision")) capabilities.push("image");
  if (source.includes("video") || source.includes("视频")) capabilities.push("video");
  if (source.includes("audio") || source.includes("音频") || source.includes("voice")) capabilities.push("audio");
  if (source.includes("multimodal") || source.includes("多模态") || source.includes("vision")) capabilities.push("multimodal");
  if (source.includes("code") || source.includes("代码")) capabilities.push("code");

  capabilities.push("text");
  return uniqueValues(capabilities);
}

function inferPlatformTags(model: ModelItem, connected: boolean, catalogModel?: CatalogModel, seriesId?: ModelSeriesId): ModelPlatformTag[] {
  const seriesTags = seriesId ? getSeriesById(seriesId).defaultTags : [];
  const tags = [...seriesTags, ...(catalogModel?.tags ?? [])];

  if (connected) {
    tags.push("connected");
  }

  if (model.sortOrder <= 10) {
    tags.push("featured");
  }

  if (model.sortOrder <= 30) {
    tags.push("recommended");
  }

  if (model.inputPricePer1K > 0 && model.inputPricePer1K <= 0.01) {
    tags.push("discount");
  }

  return uniqueValues(tags.length ? tags : ["recommended"]).filter((tag) => connected || tag !== "connected");
}

function toDirectoryModel(model: ModelItem, catalogModel?: CatalogModel): ModelDirectoryItem {
  const series = inferSeriesId(model, catalogModel);
  const seriesMeta = getSeriesById(series);
  const provider = catalogModel?.provider ?? seriesMeta.provider ?? inferProviderId(model);
  const providerMeta = getProviderById(provider);
  const connected = Boolean(model.enabled);

  return {
    id: catalogModel?.id ?? model.name,
    name: model.name,
    upstreamModel: model.upstreamModel,
    displayName: model.label,
    series,
    provider,
    providerName: catalogModel?.providerName ?? providerMeta.name,
    supplierName: model.supplierName,
    description: model.desc,
    capabilities: inferCapabilities(model, catalogModel),
    tags: inferPlatformTags(model, connected, catalogModel, series),
    inputPrice: model.inputPrice,
    outputPrice: model.outputPrice,
    contextLength: catalogModel?.contextLength ?? "未标注",
    connected,
    enabled: model.enabled,
    source: catalogModel ? "merged" : "database",
  };
}

function catalogOnlyToDirectoryModel(model: CatalogModel): ModelDirectoryItem {
  const tags = model.tags.filter((tag) => tag !== "connected");
  const series = model.series ?? resolveModelSeriesId(model.name, model.displayName, model.providerName, model.description);

  return {
    id: model.id,
    name: model.name,
    upstreamModel: model.name,
    displayName: model.displayName,
    series,
    provider: model.provider,
    providerName: model.providerName,
    supplierName: model.provider,
    description: model.description,
    capabilities: model.capabilities,
    tags,
    inputPrice: model.inputPrice ?? "按供应商定价",
    outputPrice: model.outputPrice ?? "按供应商定价",
    contextLength: model.contextLength ?? "未标注",
    connected: false,
    enabled: false,
    source: "catalog",
  };
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

function getOrderStatusMeta(status: OrderStatus) {
  if (status === "pending") {
    return {
      label: "待支付",
      className: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    };
  }

  if (status === "submitted") {
    return {
      label: "待审核",
      className: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    };
  }

  if (status === "paid") {
    return {
      label: "已到账",
      className: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    };
  }

  if (status === "rejected") {
    return {
      label: "已拒绝",
      className: "border-rose-300/25 bg-rose-300/10 text-rose-200",
    };
  }

  if (status === "failed") {
    return {
      label: "支付失败",
      className: "border-rose-300/25 bg-rose-300/10 text-rose-200",
    };
  }

  if (status === "canceled") {
    return {
      label: "已取消",
      className: "border-slate-300/20 bg-slate-300/10 text-slate-200",
    };
  }

  return {
    label: status || "未知",
    className: "border-white/15 bg-white/10 text-slate-200",
  };
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = getOrderStatusMeta(status);

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function formatOrderMethod(method: string | null | undefined) {
  if (method === "manual_transfer") {
    return "手动转账";
  }

  if (method === "admin_adjust") {
    return "管理员调整";
  }

  if (method === "manual") {
    return "手动转账";
  }

  if (method === "alipay_manual") {
    return "支付宝";
  }

  if (method === "wechat_manual") {
    return "微信";
  }

  if (method === "paypal") {
    return "PayPal";
  }

  if (method === "stripe") {
    return "Stripe";
  }

  return method || "未知";
}

function isUsdPaymentMethod(method: string | null | undefined) {
  return method === "paypal" || method === "stripe";
}

function formatOrderPaymentAmount(
  amount: number | string | null | undefined,
  method: string | null | undefined,
  amountUsd?: number | string | null
) {
  const value = Number(amount ?? 0);
  const usdValue = Number(amountUsd ?? amount ?? 0);
  const normalized = Number.isFinite(isUsdPaymentMethod(method) ? usdValue : value)
    ? isUsdPaymentMethod(method)
      ? usdValue
      : value
    : 0;
  const prefix = isUsdPaymentMethod(method) ? "$" : "￥";

  return `${prefix}${normalized.toFixed(2)}`;
}

function formatOrderCreditAmount(
  amount: number | string | null | undefined,
  method: string | null | undefined,
  amountCny?: number | string | null
) {
  const value = Number(isUsdPaymentMethod(method) ? amountCny ?? amount : amount);
  const normalized = Number.isFinite(value) ? value : 0;

  return `￥${normalized.toFixed(2)}`;
}

function formatExchangeRate(method: string | null | undefined, exchangeRate?: number | string | null) {
  if (!isUsdPaymentMethod(method)) {
    return "-";
  }

  const rate = Number(exchangeRate ?? 0);

  return Number.isFinite(rate) && rate > 0 ? `1 USD = ${rate.toFixed(2)} CNY` : "待记录";
}

function isValidRechargeAmount(amount: number) {
  return Number.isFinite(amount) && amount > 0 && amount <= 50000 && Math.round(amount * 100) / 100 === amount;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return "未知错误";
}

function getAuthErrorMessage(error: unknown) {
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "邮箱或密码错误，请检查后重试。";
  }

  if (normalized.includes("email not confirmed")) {
    return "邮箱尚未完成验证，请先打开邮箱确认邮件后再登录。";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "该邮箱已注册，请直接登录。";
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "当前暂未开放注册，请联系管理员。";
  }

  if (normalized.includes("provider") || normalized.includes("oauth") || normalized.includes("unsupported")) {
    return "第三方登录暂不可用，请确认 Google/GitHub 登录已在 Supabase 后台配置，或暂时使用邮箱登录。";
  }

  return message || "登录失败，请稍后重试。";
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
    <div className="mb-6 border-b border-slate-200 pb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">{title}</h2>
      {desc ? <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{desc}</p> : null}
    </div>
  );
}

function BrandMark({ className = "" }: { className?: string }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-cyan-300/25 bg-cyan-300/10">
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
      <span className="text-base font-semibold tracking-normal">电鳗 eelapi</span>
    </span>
  );
}

function isLanguageCode(value: string | null): value is LanguageCode {
  return languages.some((language) => language.code === value);
}

function readStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const storedLanguage = window.localStorage.getItem(languageStorageKey);
  return isLanguageCode(storedLanguage) ? storedLanguage : defaultLanguage;
}

function DashboardLanguageSwitcher({
  language,
  copy,
  onChange,
}: {
  language: LanguageCode;
  copy: DashboardCopy;
  onChange: (language: LanguageCode) => void;
}) {
  return (
    <label className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm">
      <Globe2 className="h-4 w-4 text-blue-500" />
      <span className="sr-only">{copy.languageLabel}</span>
      <select
        value={language}
        onChange={(event) => onChange(event.target.value as LanguageCode)}
        aria-label={copy.languageLabel}
        className="max-w-36 bg-transparent text-sm outline-none"
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

export default function EasyApiHubPage() {
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatModelPickerRef = useRef<HTMLDivElement | null>(null);
  const paypalReturnHandledRef = useRef(false);
  const [appLanguage, setAppLanguage] = useState<LanguageCode>(() => readStoredLanguage());
  const [page, setPage] = useState<Page>("home");
  const [dashboardTab, setDashboardTab] = useState<Tab>("overview");
  const [functionNavOpen, setFunctionNavOpen] = useState(false);
  const [dashboardScrollTarget, setDashboardScrollTarget] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [oauthSubmittingProvider, setOauthSubmittingProvider] = useState<OAuthProvider | "">("");
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
  const [modelSearch, setModelSearch] = useState("");
  const [modelSeriesFilter, setModelSeriesFilter] = useState<ModelDirectoryFilter<ModelSeriesId>>("all");
  const [modelCapabilityFilters, setModelCapabilityFilters] = useState<ModelCapability[]>([]);
  const [modelTagFilters, setModelTagFilters] = useState<ModelPlatformTag[]>([]);
  const [previewPrompt, setPreviewPrompt] = useState("你好，帮我写一个 AI API 聚合平台介绍");
  const [previewResult, setPreviewResult] = useState(
    "这里会显示模型响应或接口预览结果。"
  );
  const [chatModel, setChatModel] = useState("deepseek-chat");
  const [chatModelSearch, setChatModelSearch] = useState("");
  const [chatModelPickerOpen, setChatModelPickerOpen] = useState(false);
  const [chatInput, setChatInput] = useState("你好");
  const [pendingChatPrompt, setPendingChatPrompt] = useState("");
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
  const [manualRechargeForms, setManualRechargeForms] = useState(createManualRechargeForms);
  const [rechargeAmountChoice, setRechargeAmountChoice] = useState("30");
  const [customRechargeAmount, setCustomRechargeAmount] = useState("");
  const [selectedRechargePaymentMethod, setSelectedRechargePaymentMethod] =
    useState<RechargePaymentMethod>("wechat_manual");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [rechargeMessage, setRechargeMessage] = useState("");
  const [manualQrStatus, setManualQrStatus] = useState<Record<"alipay_manual" | "wechat_manual", "unknown" | "loaded" | "missing">>({
    alipay_manual: "unknown",
    wechat_manual: "unknown",
  });
  const [orderMessage, setOrderMessage] = useState("");
  const [submittingPaymentOrderId, setSubmittingPaymentOrderId] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<DashboardOrderStatusFilter>("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<DashboardPaymentFilter>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [paypalMessage, setPaypalMessage] = useState("");
  const [paypalSubmitting, setPaypalSubmitting] = useState(false);
  const [paypalCapturing, setPaypalCapturing] = useState(false);
  const [paypalReturnOrderId, setPaypalReturnOrderId] = useState("");
  const [paypalExchangeRate, setPaypalExchangeRate] = useState(7.2);
  const [stripeMessage, setStripeMessage] = useState("");
  const [modelList, setModelList] = useState<ModelItem[]>(fallbackModelList);
  const [adminModels, setAdminModels] = useState<ModelItem[]>([]);
  const [adminSuppliers, setAdminSuppliers] = useState<SupplierItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersMessage, setAdminUsersMessage] = useState("");
  const [adminRechargeOrders, setAdminRechargeOrders] = useState<AdminRechargeOrderRow[]>([]);
  const [adminRechargeLoading, setAdminRechargeLoading] = useState(false);
  const [adminRechargeMessage, setAdminRechargeMessage] = useState("");
  const [adminRechargeMethodFilter, setAdminRechargeMethodFilter] = useState<AdminRechargePaymentFilter>("all");
  const [adminRechargeStatusFilter, setAdminRechargeStatusFilter] =
    useState<AdminRechargeStatusFilter>("pending_submitted");
  const [adminRechargeOrderSearch, setAdminRechargeOrderSearch] = useState("");
  const [adminRechargeEmailSearch, setAdminRechargeEmailSearch] = useState("");
  const [adminRechargeNoteSearch, setAdminRechargeNoteSearch] = useState("");
  const [selectedAdminRechargeOrder, setSelectedAdminRechargeOrder] = useState<AdminRechargeOrderRow | null>(null);
  const [reviewNoteByOrderId, setReviewNoteByOrderId] = useState<Record<string, string>>({});
  const [reviewingRechargeOrderId, setReviewingRechargeOrderId] = useState("");
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
  const [adminOverviewSummary, setAdminOverviewSummary] = useState<FinanceSummaryRow | null>(null);
  const [adminOverviewPendingRechargeCount, setAdminOverviewPendingRechargeCount] = useState(0);
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(false);
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
  const selectedRechargeAmount =
    rechargeAmountChoice === "custom" ? Number(customRechargeAmount) : Number(rechargeAmountChoice);
  const selectedRechargePaymentOption =
    rechargePaymentOptions.find((option) => option.key === selectedRechargePaymentMethod) ?? rechargePaymentOptions[0];
  const activeManualPaymentMethod: ManualRechargePaymentMethod | null =
    selectedRechargePaymentMethod === "alipay_manual" || selectedRechargePaymentMethod === "wechat_manual"
      ? selectedRechargePaymentMethod
      : null;
  const activeManualRechargeForm = activeManualPaymentMethod ? manualRechargeForms[activeManualPaymentMethod] : null;
  const activeManualRechargeOption = activeManualPaymentMethod
    ? manualRechargePaymentOptions.find((option) => option.key === activeManualPaymentMethod) ?? null
    : null;
  const selectedPaypalAmount =
    Number.isFinite(selectedRechargeAmount) && selectedRechargeAmount > 0 && paypalExchangeRate > 0
      ? Math.max(Math.round((selectedRechargeAmount / paypalExchangeRate) * 100) / 100, 0.01)
      : 0;
  const estimatedPaypalCny =
    Number.isFinite(selectedPaypalAmount) && selectedPaypalAmount > 0 ? selectedPaypalAmount * paypalExchangeRate : 0;
  const selectedModelInfo =
    modelList.find((model) => model.name === selectedModel) ?? modelList[0] ?? fallbackModelList[0];
  const selectedModelName = selectedModelInfo.name;
  const modelDirectoryItems = useMemo(() => {
    const usedModelNames = new Set<string>();
    const catalogItems = modelCatalog.map((catalogModel) => {
      const matchedModel = modelList.find((model) => catalogMatchesModel(catalogModel, model));

      if (matchedModel) {
        usedModelNames.add(matchedModel.name.toLowerCase());
        return toDirectoryModel(matchedModel, catalogModel);
      }

      return catalogOnlyToDirectoryModel(catalogModel);
    });
    const databaseOnlyItems = modelList
      .filter((model) => !usedModelNames.has(model.name.toLowerCase()))
      .map((model) => toDirectoryModel(model));
    const seriesOrder = new Map(modelSeriesList.map((series, index) => [series.id, index]));

    return [...catalogItems, ...databaseOnlyItems].sort((left, right) => {
      if (left.connected !== right.connected) {
        return left.connected ? -1 : 1;
      }

      return (
        (seriesOrder.get(left.series) ?? 999) - (seriesOrder.get(right.series) ?? 999) ||
        left.displayName.localeCompare(right.displayName, "zh-CN")
      );
    });
  }, [modelList]);
  const modelSeriesCounts = useMemo(() => {
    return modelSeriesList.reduce<Record<ModelSeriesId, number>>((counts, series) => {
      counts[series.id] = modelDirectoryItems.filter((model) => model.series === series.id).length;
      return counts;
    }, {} as Record<ModelSeriesId, number>);
  }, [modelDirectoryItems]);
  const filteredModelDirectoryItems = useMemo(() => {
    const query = modelSearch.trim().toLowerCase();

    return modelDirectoryItems.filter((model) => {
      const seriesMeta = getSeriesById(model.series);
      const queryMatched =
        !query ||
        [
          model.name,
          model.upstreamModel,
          model.displayName,
          seriesMeta.name,
          seriesMeta.providerName,
          model.providerName,
          model.supplierName,
          model.description,
          ...model.capabilities.map((capability) => capabilityLabels[capability]),
          ...model.tags.map((tag) => platformTagLabels[tag]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const seriesMatched = modelSeriesFilter === "all" || model.series === modelSeriesFilter;
      const capabilityMatched =
        modelCapabilityFilters.length === 0 ||
        modelCapabilityFilters.every((capability) => model.capabilities.includes(capability));
      const tagMatched =
        modelTagFilters.length === 0 ||
        modelTagFilters.every((tag) => model.tags.includes(tag));

      return queryMatched && seriesMatched && capabilityMatched && tagMatched;
    });
  }, [modelCapabilityFilters, modelDirectoryItems, modelSearch, modelSeriesFilter, modelTagFilters]);
  const connectedModelCount = modelDirectoryItems.filter((model) => model.connected).length;
  const modelDirectoryHasActiveFilters =
    modelSearch.trim() !== "" ||
    modelSeriesFilter !== "all" ||
    modelCapabilityFilters.length > 0 ||
    modelTagFilters.length > 0;
  const toggleModelCapabilityFilter = (capability: ModelCapability) => {
    setModelCapabilityFilters((current) =>
      current.includes(capability)
        ? current.filter((item) => item !== capability)
        : [...current, capability]
    );
  };
  const toggleModelTagFilter = (tag: ModelPlatformTag) => {
    setModelTagFilters((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  };
  const chatAvailableModels = useMemo(
    () => (isSupabaseConfigured && !modelsMessage ? modelList : []),
    [modelList, modelsMessage]
  );
  const chatModelInfo = chatAvailableModels.find((model) => model.name === chatModel) ?? chatAvailableModels[0] ?? null;
  const chatModelOptions = useMemo(() => {
    const seriesOrder = new Map(modelSeriesList.map((series, index) => [series.id, index]));

    return chatAvailableModels
      .map((model) => toDirectoryModel(model, findCatalogModel(model)))
      .sort((left, right) => {
        if (left.enabled !== right.enabled) {
          return left.enabled ? -1 : 1;
        }

        if (left.connected !== right.connected) {
          return left.connected ? -1 : 1;
        }

        return (
          (seriesOrder.get(left.series) ?? 999) - (seriesOrder.get(right.series) ?? 999) ||
          left.displayName.localeCompare(right.displayName, "zh-CN")
        );
      });
  }, [chatAvailableModels]);
  const selectedChatModelOption =
    chatModelOptions.find((model) => model.name === (chatModelInfo?.name ?? chatModel)) ?? chatModelOptions[0] ?? null;
  const filteredChatModelOptions = useMemo(() => {
    const query = chatModelSearch.trim().toLowerCase();

    if (!query) {
      return chatModelOptions;
    }

    return chatModelOptions.filter((model) => {
      const seriesMeta = getSeriesById(model.series);
      const searchText = [
        model.displayName,
        model.name,
        model.upstreamModel,
        model.providerName,
        model.supplierName,
        seriesMeta.name,
        seriesMeta.providerName,
        model.description,
        ...model.capabilities.map((capability) => capabilityLabels[capability]),
        ...model.capabilities.map((capability) => compactCapabilityLabels[capability]),
        ...model.tags.map((tag) => platformTagLabels[tag]),
        ...model.tags.map((tag) => compactPlatformTagLabels[tag]),
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [chatModelOptions, chatModelSearch]);
  useEffect(() => {
    if (!chatModelPickerOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!chatModelPickerRef.current?.contains(event.target as Node)) {
        setChatModelPickerOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChatModelPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [chatModelPickerOpen]);
  const selectedChatModelIcon = selectedChatModelOption
    ? resolveModelIcon({
        seriesId: selectedChatModelOption.series,
        name: selectedChatModelOption.name,
        displayName: selectedChatModelOption.displayName,
        providerName: selectedChatModelOption.providerName,
        provider: selectedChatModelOption.provider,
        supplierName: selectedChatModelOption.supplierName,
        upstreamModel: selectedChatModelOption.upstreamModel,
        description: selectedChatModelOption.description,
      })
    : null;
  const selectedChatModelSeries = selectedChatModelOption ? getSeriesById(selectedChatModelOption.series) : null;
  const activeChatApiKey = chatApiKeys.find((key) => key.id === selectedChatApiKeyId) ?? chatApiKeys[0] ?? null;
  const apiBaseUrl = "https://eelapi.com/api/v1";
  const exampleModel = "deepseek-chat";
  const dashboardLanguage: LanguageCode = "zh";
  const dashboardCopy = dashboardCopies[dashboardLanguage] ?? dashboardCopyZh;
  const languageMeta = getLanguageMeta(appLanguage);
  const dashboardUiText =
    dashboardLanguage === "zh"
      ? {
          enabled: "正常",
          input: "输入",
          output: "输出",
          noEnabledModels: "暂无启用模型，请联系管理员在模型价格管理里启用。",
          noUsage: "还没有用量记录。接入真实 API 中转后，这里会显示 usage_logs 数据。",
          usageHeaders: ["时间", "模型", "供应商", "输入", "输出", "费用", "状态"],
          rechargeStepAmount: "选择金额",
          rechargeAmount: "充值金额",
          customAmount: "自定义人民币金额",
          customAmountPlaceholder: "输入其他人民币金额",
          rechargeStepPayment: "选择支付方式",
          rechargeStepConfirm: "确认支付",
          paymentMethod: "支付方式",
          creditMethod: "到账方式",
          confirmPayment: "确认支付",
          confirming: "确认中...",
          confirmPaypal: "确认 PayPal 到账",
          manualCredit: "提交审核后，管理员确认到账",
          ordersHeaders: ["订单号", "金额", "支付方式", "订单状态", "创建时间", "到账时间", "审核/订单备注", "操作"],
          copiedOrderId: "订单号已复制",
          copyOrderId: "复制完整订单号",
          reviewNote: "审核",
          orderNote: "订单",
          none: "无",
          submitting: "提交中...",
          paidSubmit: "我已付款",
          noOrders: "还没有充值记录。创建充值订单后，这里会显示审核进度。",
          modelName: "模型名",
          endpoint: "接口",
          docsNotice:
            "model 必须使用平台支持并启用的模型名，例如 deepseek-chat。不同模型的输入和输出价格可能不同，实际扣费按上游返回的 usage 计算。",
          jsExample: "JavaScript fetch 示例",
          pythonExample: "Python OpenAI SDK 示例",
          copy: "复制",
          errorCodes: "常见错误码",
          copiedJs: "已复制 JavaScript 示例",
          copiedPython: "已复制 Python 示例",
        }
      : {
          enabled: "Enabled",
          input: "Input",
          output: "Output",
          noEnabledModels: "No enabled models. Ask an admin to enable one in model pricing.",
          noUsage: "No usage records yet. API gateway usage_logs data will appear here after real calls.",
          usageHeaders: ["Time", "Model", "Supplier", "Input", "Output", "Cost", "Status"],
          rechargeStepAmount: "Choose amount",
          rechargeAmount: "Top-up amount",
          customAmount: "Custom CNY amount",
          customAmountPlaceholder: "Enter another CNY amount",
          rechargeStepPayment: "Choose payment method",
          rechargeStepConfirm: "Confirm payment",
          paymentMethod: "Payment method",
          creditMethod: "Balance credit",
          confirmPayment: "Confirm payment",
          confirming: "Confirming...",
          confirmPaypal: "Confirm PayPal credit",
          manualCredit: "After review, an admin confirms the balance credit.",
          ordersHeaders: ["Order ID", "Amount", "Payment", "Status", "Created", "Paid at", "Review / order note", "Action"],
          copiedOrderId: "Order ID copied",
          copyOrderId: "Copy full order ID",
          reviewNote: "Review",
          orderNote: "Order",
          none: "None",
          submitting: "Submitting...",
          paidSubmit: "I have paid",
          noOrders: "No top-up records yet. Review progress appears here after creating an order.",
          modelName: "Model name",
          endpoint: "Endpoint",
          docsNotice:
            "The model field must use a supported and enabled model name, for example deepseek-chat. Prices may differ by model, and actual charges are calculated from upstream usage.",
          jsExample: "JavaScript fetch example",
          pythonExample: "Python OpenAI SDK example",
          copy: "Copy",
          errorCodes: "Common error codes",
          copiedJs: "JavaScript example copied",
          copiedPython: "Python example copied",
        };

  function setDashboardLanguage(nextLanguage: LanguageCode) {
    setAppLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(languageStorageKey, nextLanguage);
      window.dispatchEvent(new CustomEvent(languageChangeEventName, { detail: nextLanguage }));
    }
  }

  function getDashboardNavLabel(item: DashboardNavItem) {
    const adminCopyKey = adminNavCopyKeys[item.id];

    if (adminCopyKey) {
      return dashboardCopy.adminNav[adminCopyKey];
    }

    return dashboardCopy.tabs[item.tab] ?? item.label;
  }

  function normalizeChatPrompt(prompt: string) {
    return prompt.trim();
  }

  function writeChatUrl(prompt: string, mode: ChatNavigationHistoryMode, requireLogin = false) {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("tab", "chat");
    if (prompt) {
      params.set("question", prompt);
    } else {
      params.delete("question");
    }
    if (requireLogin) {
      params.set("auth", "login");
    } else {
      params.delete("auth");
    }

    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
    const historyMethod = mode === "replace" ? "replaceState" : "pushState";
    window.history[historyMethod](null, "", nextUrl);
  }

  function rememberPendingChatPrompt(prompt: string) {
    const cleanedPrompt = normalizeChatPrompt(prompt);
    setPendingChatPrompt(cleanedPrompt);

    if (typeof window !== "undefined" && cleanedPrompt) {
      window.sessionStorage.setItem(pendingChatPromptStorageKey, cleanedPrompt);
    }
  }

  function readPendingChatPrompt() {
    if (pendingChatPrompt) {
      return pendingChatPrompt;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return window.sessionStorage.getItem(pendingChatPromptStorageKey) ?? "";
  }

  function clearPendingChatPrompt() {
    setPendingChatPrompt("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(pendingChatPromptStorageKey);
    }
  }

  function openChatWithPrompt(prompt: string, mode: ChatNavigationHistoryMode = "push") {
    const cleanedPrompt = normalizeChatPrompt(prompt);
    setChatInput(cleanedPrompt || "你好");
    setChatError("");
    setPage("dashboard");
    setDashboardTab("chat");
    setDashboardScrollTarget("chat");
    writeChatUrl(cleanedPrompt, mode, false);
  }

  function openPendingChatAfterAuth() {
    const prompt = readPendingChatPrompt();
    if (!prompt) {
      return false;
    }

    clearPendingChatPrompt();
    openChatWithPrompt(prompt, "replace");
    return true;
  }

  function requestAiChat(prompt: string) {
    const cleanedPrompt = normalizeChatPrompt(prompt) || "你好";
    setChatInput(cleanedPrompt);

    if (authLoading || !session) {
      rememberPendingChatPrompt(cleanedPrompt);
      setAuthMode("login");
      setAuthMessage(dashboardCopy.auth.loginRequiredChat);
      setLoginOpen(true);
      writeChatUrl(cleanedPrompt, "push", true);
      return;
    }

    clearPendingChatPrompt();
    openChatWithPrompt(cleanedPrompt);
  }

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
  const paymentMethodFinanceRankings = financeRankings.filter((item) => item.ranking_type === "payment_method_stats");
  const financeRangeLabel =
    financeRange === "today" ? "今天" : financeRange === "week" ? "本周" : financeRange === "month" ? "本月" : "全部";
  const financeStatCards = [
    ["总用户数", formatNumber(financeSummary?.total_users), "profiles"],
    ["总余额池", formatMoney(financeSummary?.total_balance, 4), "sum(balance)"],
    ["累计充值金额", formatMoney(financeSummary?.total_recharge_amount, 2), "paid/manual/admin_adjust"],
    ["累计消费金额", formatMoney(financeSummary?.total_consumption_amount, 4), "usage cost"],
    ["今日充值金额", formatMoney(financeSummary?.today_recharge_amount, 2), "today paid"],
    ["今日消费金额", formatMoney(financeSummary?.today_consumption_amount, 4), "today"],
    ["本周充值金额", formatMoney(financeSummary?.week_recharge_amount, 2), "week paid"],
    ["本周消费金额", formatMoney(financeSummary?.week_consumption_amount, 4), "week usage"],
    ["本月充值金额", formatMoney(financeSummary?.month_recharge_amount, 2), "month paid"],
    ["本月消费金额", formatMoney(financeSummary?.month_consumption_amount, 4), "month usage"],
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
  const adminRechargeVisibleOrders = useMemo(() => {
    const noteQuery = adminRechargeNoteSearch.trim().toLowerCase();

    if (!noteQuery) {
      return adminRechargeOrders;
    }

    return adminRechargeOrders.filter((order) => {
      const haystack = [
        order.note,
        order.review_note,
        order.paypal_order_id,
        order.paypal_capture_id,
        order.stripe_session_id,
        order.stripe_payment_intent_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(noteQuery);
    });
  }, [adminRechargeNoteSearch, adminRechargeOrders]);
  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
        const paymentMethod = order.paymentMethod || order.method;
        const methodMatched =
          orderPaymentFilter === "all" ||
          paymentMethod === orderPaymentFilter ||
          (orderPaymentFilter === "manual" && ["manual", "manual_transfer"].includes(paymentMethod));
        const statusMatched = orderStatusFilter === "all" || order.status === orderStatusFilter;
        const queryMatched =
          !query ||
          [
            order.id,
            order.note,
            order.reviewNote,
            order.paypalOrderId,
            order.paypalCaptureId,
            order.stripeSessionId,
            order.stripePaymentIntentId,
            paymentMethod,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);

        return methodMatched && statusMatched && queryMatched;
      });
  }, [orderPaymentFilter, orderSearch, orderStatusFilter, orders]);
  const todayNewUserCount = adminUsers.filter((user) => isToday(user.createdAt)).length;
  const adminOverviewCards = [
    ["用户总数", formatNumber(adminOverviewSummary?.total_users ?? adminUsers.length), "profiles"],
    ["今日新增用户", formatNumber(todayNewUserCount), "按注册时间统计"],
    ["待审核充值订单", formatNumber(adminOverviewPendingRechargeCount), "pending/submitted"],
    ["今日充值金额", formatMoney(adminOverviewSummary?.today_recharge_amount, 2), "今日 paid"],
    ["总充值金额", formatMoney(adminOverviewSummary?.total_recharge_amount, 2), "累计 paid/manual/admin_adjust"],
    ["今日请求数", formatNumber(adminOverviewSummary?.today_call_count), "usage_logs"],
    ["总请求数", formatNumber(adminOverviewSummary?.range_call_count), "全部调用"],
    ["启用模型数", formatNumber(adminModels.filter((model) => model.enabled).length || modelList.length), "models.enabled"],
  ];

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
    setManualRechargeForms(createManualRechargeForms());
    setRechargeAmountChoice("30");
    setCustomRechargeAmount("");
    setSelectedRechargePaymentMethod("wechat_manual");
    setPaymentDialogOpen(false);
    setRechargeMessage("");
    setManualQrStatus({
      alipay_manual: "unknown",
      wechat_manual: "unknown",
    });
    setOrderMessage("");
    setSubmittingPaymentOrderId("");
    setOrderStatusFilter("all");
    setOrderPaymentFilter("all");
    setOrderSearch("");
    setSelectedOrder(null);
    setPaypalMessage("");
    setPaypalSubmitting(false);
    setPaypalCapturing(false);
    setPaypalReturnOrderId("");
    setPaypalExchangeRate(7.2);
    setUsageLogs([]);
    setCreatedApiKey("");
    setDataMessage("");
    setProfileRole("user");
    setManualRechargeEmail("");
    setManualRechargeAmount("");
    setManualRechargeNote("");
    setManualRechargeMessage("");
    setModelSearch("");
    setModelSeriesFilter("all");
    setModelCapabilityFilters([]);
    setModelTagFilters([]);
    setAdminModels([]);
    setAdminSuppliers([]);
    setAdminUsers([]);
    setAdminUsersLoading(false);
    setAdminUsersMessage("");
    setAdminRechargeOrders([]);
    setAdminRechargeLoading(false);
    setAdminRechargeMessage("");
    setAdminRechargeMethodFilter("all");
    setAdminRechargeStatusFilter("pending_submitted");
    setAdminRechargeOrderSearch("");
    setAdminRechargeEmailSearch("");
    setAdminRechargeNoteSearch("");
    setSelectedAdminRechargeOrder(null);
    setReviewNoteByOrderId({});
    setReviewingRechargeOrderId("");
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
    setAdminOverviewSummary(null);
    setAdminOverviewPendingRechargeCount(0);
    setAdminOverviewLoading(false);
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

  const loadAdminRechargeOrders = useCallback(async () => {
    if (!supabase) {
      setAdminRechargeOrders([]);
      return;
    }

    setAdminRechargeLoading(true);
    setAdminRechargeMessage("");

    try {
      const { data, error } = await supabase.rpc("list_recharge_orders_admin", {
        payment_method_filter: adminRechargeMethodFilter,
        status_filter: adminRechargeStatusFilter,
        search_order: adminRechargeOrderSearch.trim() || null,
        search_email: adminRechargeEmailSearch.trim() || null,
        limit_count: 300,
      });

      if (error) {
        throw error;
      }

      setAdminRechargeOrders((data ?? []) as AdminRechargeOrderRow[]);
    } catch (error) {
      console.error(error);
      setAdminRechargeMessage("充值审核订单读取失败，请确认充值审核 RPC 已执行。");
    } finally {
      setAdminRechargeLoading(false);
    }
  }, [adminRechargeEmailSearch, adminRechargeMethodFilter, adminRechargeOrderSearch, adminRechargeStatusFilter]);

  const loadAdminOverview = useCallback(async () => {
    if (!supabase) {
      setAdminOverviewSummary(null);
      setAdminOverviewPendingRechargeCount(0);
      return;
    }

    setAdminOverviewLoading(true);

    try {
      const [summaryResult, pendingOrdersResult] = await Promise.all([
        supabase.rpc("get_finance_summary_admin", {
          range_filter: "all",
        }),
        supabase.rpc("list_recharge_orders_admin", {
          payment_method_filter: "all",
          status_filter: "pending_submitted",
          search_order: null,
          search_email: null,
          limit_count: 300,
        }),
      ]);

      const firstError = summaryResult.error ?? pendingOrdersResult.error;

      if (firstError) {
        throw firstError;
      }

      const summaryData = Array.isArray(summaryResult.data)
        ? (summaryResult.data[0] as FinanceSummaryRow | undefined)
        : (summaryResult.data as FinanceSummaryRow | null);

      setAdminOverviewSummary(summaryData ?? null);
      setAdminOverviewPendingRechargeCount((pendingOrdersResult.data ?? []).length);
    } catch (error) {
      console.error(error);
      setAdminOverviewSummary(null);
      setAdminOverviewPendingRechargeCount(0);
    } finally {
      setAdminOverviewLoading(false);
    }
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
            .select("id,user_id,amount,method,payment_method,status,note,review_note,created_at,paid_at,paypal_order_id,paypal_capture_id,stripe_session_id,stripe_payment_intent_id,amount_usd,amount_cny,exchange_rate,currency")
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

  const loadPaypalExchangeRate = useCallback(async () => {
    try {
      const response = await fetch("/api/payments/paypal/rate");
      const data = (await response.json()) as {
        exchange_rate?: number | string | null;
      };
      const rate = Number(data.exchange_rate);

      if (response.ok && Number.isFinite(rate) && rate > 0) {
        setPaypalExchangeRate(rate);
      }
    } catch (error) {
      console.error("Failed to load PayPal exchange rate", error);
    }
  }, []);

  const capturePaypalOrder = useCallback(
    async (paypalOrderId: string, autoCapture = false) => {
      if (!session) {
        setPaypalReturnOrderId(paypalOrderId);
        setPaypalMessage("PayPal 支付已返回，请登录后点击确认到账。");
        return;
      }

      setPaypalCapturing(true);
      setPaypalMessage(autoCapture ? "PayPal 支付已返回，正在确认到账..." : "");

      try {
        const response = await fetch("/api/payments/paypal/capture-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            paypal_order_id: paypalOrderId,
          }),
        });
        const data = (await response.json()) as {
          success?: boolean;
          already_paid?: boolean;
          error?: {
            message?: string;
          };
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message ?? "PayPal 确认到账失败");
        }

        setPaypalMessage(data.already_paid ? "该 PayPal 订单已到账，无需重复确认。" : "PayPal 支付成功，余额已到账。");
        setPaypalReturnOrderId("");
        await loadDashboardData(session);
      } catch (error) {
        console.error(error);
        setPaypalReturnOrderId(paypalOrderId);
        setPaypalMessage(`PayPal 确认失败：${getErrorMessage(error)}`);
      } finally {
        setPaypalCapturing(false);
      }
    },
    [loadDashboardData, session]
  );

  const cancelPaypalOrder = useCallback(
    async (paypalOrderId: string) => {
      if (!session) {
        setPaypalMessage("PayPal 支付已取消。登录状态恢复后，可在充值记录中查看订单。");
        return;
      }

      try {
        const response = await fetch("/api/payments/paypal/cancel-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            paypal_order_id: paypalOrderId,
          }),
        });
        const data = (await response.json()) as {
          success?: boolean;
          error?: {
            message?: string;
          };
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message ?? "PayPal 订单取消状态更新失败");
        }

        setPaypalMessage("PayPal 支付已取消。");
        await loadDashboardData(session);
      } catch (error) {
        console.error(error);
        setPaypalMessage(`PayPal 支付已取消，但订单状态更新失败：${getErrorMessage(error)}`);
      }
    },
    [loadDashboardData, session]
  );

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
    document.documentElement.lang = appLanguage === "zh" ? "zh-CN" : appLanguage;
    document.documentElement.dir = languageMeta.dir;
  }, [appLanguage, languageMeta.dir]);

  useEffect(() => {
    const syncLanguage = (nextLanguage: string | null) => {
      if (isLanguageCode(nextLanguage)) {
        setAppLanguage(nextLanguage);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === languageStorageKey) {
        syncLanguage(event.newValue);
      }
    };

    const handleLanguageChange = (event: Event) => {
      syncLanguage((event as CustomEvent<string>).detail);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(languageChangeEventName, handleLanguageChange);
    syncLanguage(window.localStorage.getItem(languageStorageKey));

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(languageChangeEventName, handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPaypalExchangeRate();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPaypalExchangeRate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (paypalReturnHandledRef.current) {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const paypalStatus = params.get("paypal");

      if (!paypalStatus) {
        return;
      }

      setPage("dashboard");
      setDashboardTab("recharge");

      const clearPaypalParams = () => {
        params.delete("paypal");
        params.delete("token");
        params.delete("PayerID");
        params.delete("paypal_order_id");
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
        window.history.replaceState(null, "", nextUrl);
      };

      if (paypalStatus === "cancel") {
        const paypalOrderId = params.get("token") ?? params.get("paypal_order_id") ?? "";

        if (paypalOrderId && !session) {
          setPaypalMessage("PayPal 支付已取消，正在等待登录状态以更新订单。");
          return;
        }

        paypalReturnHandledRef.current = true;
        clearPaypalParams();
        if (paypalOrderId) {
          void cancelPaypalOrder(paypalOrderId);
        } else {
          setPaypalMessage("PayPal 支付已取消，订单仍可重新创建。");
        }
        return;
      }

      if (paypalStatus !== "success") {
        return;
      }

      const paypalOrderId = params.get("token") ?? params.get("paypal_order_id") ?? "";

      if (!paypalOrderId) {
        paypalReturnHandledRef.current = true;
        setPaypalMessage("PayPal 支付已返回，但缺少 PayPal 订单号，请联系管理员。");
        clearPaypalParams();
        return;
      }

      setPaypalReturnOrderId(paypalOrderId);

      if (!session) {
        setPaypalMessage("PayPal 支付已返回，正在等待登录状态以确认到账。");
        return;
      }

      paypalReturnHandledRef.current = true;
      clearPaypalParams();
      void capturePaypalOrder(paypalOrderId, true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [cancelPaypalOrder, capturePaypalOrder, session]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/u, ""));
      const authIntent = params.get("auth");
      const oauthError = params.get("error_description") ?? params.get("error") ?? hashParams.get("error_description") ?? hashParams.get("error");
      const hasOAuthCallback =
        authIntent === "callback" ||
        params.has("code") ||
        hashParams.has("access_token") ||
        hashParams.has("refresh_token");

      if (authIntent !== "login" && authIntent !== "signup" && !hasOAuthCallback && !oauthError) {
        return;
      }

      if (authLoading) {
        return;
      }

      const clearAuthParams = () => {
        [
          "auth",
          "code",
          "error",
          "error_code",
          "error_description",
          "provider",
          "next",
        ].forEach((key) => params.delete(key));
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
        window.history.replaceState(null, "", nextUrl);
      };

      if (oauthError) {
        setAuthMode("login");
        setAuthMessage(getAuthErrorMessage(oauthError));
        setLoginOpen(true);
        clearAuthParams();
        return;
      }

      if (session) {
        setAuthMessage("");
        setLoginOpen(false);
        setPage("dashboard");
        setDashboardTab("overview");
        setDashboardScrollTarget("overview");
        clearAuthParams();
        return;
      }

      const oauthCode = params.get("code");
      if (oauthCode && supabase) {
        setAuthMode("login");
        setAuthMessage("正在完成第三方登录...");
        setLoginOpen(true);

        const { data, error } = await supabase.auth.exchangeCodeForSession(oauthCode);

        if (error) {
          setAuthMessage(getAuthErrorMessage(error));
          clearAuthParams();
          return;
        }

        if (data.session) {
          setSession(data.session);
          setEmail(data.session.user.email ?? "");
          void loadDashboardData(data.session);
          setAuthMessage("");
          setLoginOpen(false);
          setPage("dashboard");
          setDashboardTab("overview");
          setDashboardScrollTarget("overview");
          clearAuthParams();
          return;
        }
      }

      if (hasOAuthCallback) {
        setAuthMode("login");
        setAuthMessage("第三方登录未完成，请重试或暂时使用邮箱登录。");
        setLoginOpen(true);
        clearAuthParams();
        return;
      }

      setAuthMode(authIntent as "login" | "signup");
      setAuthMessage("");
      setLoginOpen(true);
      clearAuthParams();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authLoading, loadDashboardData, session]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const requestedTab = tabs.some((tab) => tab.key === tabParam) ? (tabParam as Tab) : null;

      if (!requestedTab) {
        return;
      }

      const prompt = requestedTab === "chat" ? (params.get("question") ?? "").trim() : "";
      if (prompt) {
        setChatInput(prompt);
        setPendingChatPrompt(prompt);
        window.sessionStorage.setItem(pendingChatPromptStorageKey, prompt);
      }

      if (authLoading) {
        return;
      }

      if (!session) {
        setAuthMode("login");
        setAuthMessage(
          requestedTab === "chat" ? dashboardCopy.auth.loginRequiredChat : "请先登录后继续。"
        );
        setLoginOpen(true);
        return;
      }

      if (requestedTab === "chat") {
        setPendingChatPrompt("");
        window.sessionStorage.removeItem(pendingChatPromptStorageKey);
        setChatError("");
      }

      setLoginOpen(false);
      setPage("dashboard");
      setDashboardTab(requestedTab);
      setDashboardScrollTarget(activeSectionIdByTab[requestedTab]);

      params.delete("auth");
      params.delete("tab");
      params.delete("question");
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", nextUrl);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authLoading, dashboardCopy.auth.loginRequiredChat, session]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({
      block: "end",
    });
  }, [chatLoading, chatMessages.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAdmin) {
        void loadAdminOverview();
      } else {
        setAdminOverviewSummary(null);
        setAdminOverviewPendingRechargeCount(0);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isAdmin, loadAdminOverview]);

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
        void Promise.all([loadAdminUsers(), loadAdminRechargeOrders()]);
      } else {
        setAdminUsers([]);
        setAdminRechargeOrders([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isAdmin, loadAdminRechargeOrders, loadAdminUsers]);

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
    setPage("dashboard");
  };

  const navigateDashboardModule = (item: DashboardNavItem) => {
    setFunctionNavOpen(false);

    if (authLoading || !session) {
      setDashboardScrollTarget(item.id);
      setDashboardTab(item.tab);
      setAuthMode("login");
      setAuthMessage("请先登录后继续。");
      setLoginOpen(true);
      return;
    }

    setDashboardScrollTarget(item.id);
    setPage("dashboard");
    setDashboardTab(item.tab);
  };

  const closeLoginDialog = () => {
    setLoginOpen(false);
    setAuthMessage("");
    setOauthSubmittingProvider("");
  };

  const buildAuthRedirectUrl = (provider?: OAuthProvider) => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const redirectUrl = new URL("/", window.location.origin);
    redirectUrl.searchParams.set("auth", "callback");
    redirectUrl.searchParams.set("next", "dashboard");
    if (provider) {
      redirectUrl.searchParams.set("provider", provider);
    }

    return redirectUrl.toString();
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setAuthMessage("");

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage(dashboardCopy.auth.missingSupabase);
      return;
    }

    if (!oauthProviderEnabled[provider]) {
      setAuthMessage(provider === "google" ? dashboardCopy.auth.googlePending : dashboardCopy.auth.githubPending);
      return;
    }

    setOauthSubmittingProvider(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: buildAuthRedirectUrl(provider),
        },
      });

      if (error) {
        setAuthMessage(getAuthErrorMessage(error));
        return;
      }

      setAuthMessage(dashboardCopy.auth.oauthRedirecting);
    } catch (error) {
      setAuthMessage(`${dashboardCopy.auth.oauthError} ${getErrorMessage(error)}`);
    } finally {
      setOauthSubmittingProvider("");
    }
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage("");

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage(dashboardCopy.auth.missingSupabase);
      return;
    }

    if (!email.trim() || password.length < 6) {
      setAuthMessage(dashboardCopy.auth.invalidCredentials);
      return;
    }

    setAuthSubmitting(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: buildAuthRedirectUrl(),
          },
        });

        if (error) {
          setAuthMessage(getAuthErrorMessage(error));
          return;
        }

        if (data.session) {
          setSession(data.session);
          void loadDashboardData(data.session);
          setLoginOpen(false);
          if (!openPendingChatAfterAuth()) {
            setPage("dashboard");
          }
          return;
        }

        setAuthMessage(dashboardCopy.auth.signupConfirm);
        setAuthMode("login");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthMessage(getAuthErrorMessage(error));
        return;
      }

      if (data.session) {
        setSession(data.session);
        void loadDashboardData(data.session);
        setLoginOpen(false);
        if (!openPendingChatAfterAuth()) {
          setPage("dashboard");
        }
        return;
      }

      setAuthMessage(dashboardCopy.auth.noSession);
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

  const runPreview = () => {
    const promptTokens = Math.max(20, Math.round(previewPrompt.length * 1.8));
    const completionTokens = Math.floor(120 + Math.random() * 260);
    const cost = Number(
      (
        (promptTokens / 1000) * selectedModelInfo.inputPricePer1K +
        (completionTokens / 1000) * selectedModelInfo.outputPricePer1K
      ).toFixed(4)
    );
    const total = promptTokens + completionTokens;

    setPreviewResult(
      `接口预览响应：你的请求已通过 ${selectedModelName} 的调试流程处理。\n\n当前结果用于开发者控制台预览，请以正式 API 调用和用量记录为准。\n\nTokens：${total}\n预估费用：¥${cost.toFixed(4)}`
    );
  };

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userContent = chatInput.trim();

    if (!userContent) {
      setChatError(dashboardCopy.chat.emptyInput);
      return;
    }

    if (!session) {
      setChatError(dashboardCopy.chat.loginRequired);
      return;
    }

    if (!activeChatApiKey) {
      setChatError(dashboardCopy.chat.missingKeyError);
      return;
    }

    if (!chatModelInfo) {
      setChatError(dashboardCopy.chat.noModelError);
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
          throw new Error(dashboardCopy.chat.insufficientBalance);
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

  const updateManualRechargeForm = (
    paymentMethod: ManualRechargePaymentMethod,
    patch: Partial<ManualRechargeFormState>
  ) => {
    setManualRechargeForms((current) => ({
      ...current,
      [paymentMethod]: {
        ...current[paymentMethod],
        ...patch,
      },
    }));
  };

  const openRechargePaymentDialog = () => {
    setRechargeMessage("");
    setPaypalMessage("");
    setStripeMessage("");

    if (selectedRechargePaymentMethod === "stripe") {
      setStripeMessage(stripePendingMessage);
      return;
    }

    if (!isValidRechargeAmount(selectedRechargeAmount)) {
      setRechargeMessage("请选择或输入大于 0 且不超过 50000 的金额，最多保留 2 位小数。");
      return;
    }

    setPaymentDialogOpen(true);
  };

  const handleCreateRechargeOrder = async (
    event: FormEvent<HTMLFormElement>,
    paymentMethod: ManualRechargePaymentMethod
  ) => {
    event.preventDefault();
    const rechargeForm = manualRechargeForms[paymentMethod];

    setRechargeMessage("");
    updateManualRechargeForm(paymentMethod, {
      message: "",
      createdOrder: null,
    });

    if (!supabase || !session) {
      updateManualRechargeForm(paymentMethod, {
        message: "请先登录后再创建充值订单。",
      });
      return;
    }

    if (!isValidRechargeAmount(selectedRechargeAmount)) {
      updateManualRechargeForm(paymentMethod, {
        message: "请选择或输入大于 0 且不超过 50000 的金额，最多保留 2 位小数。",
      });
      return;
    }

    if (!rechargeForm.note.trim()) {
      updateManualRechargeForm(paymentMethod, {
        message: "请填写付款账号后四位或转账备注，方便管理员审核。",
      });
      return;
    }

    updateManualRechargeForm(paymentMethod, {
      submitting: true,
    });

    try {
      const { data, error } = await supabase.rpc("create_recharge_order", {
        recharge_amount: selectedRechargeAmount,
        recharge_note: rechargeForm.note.trim() || null,
        recharge_payment_method: paymentMethod,
      });

      if (error) {
        throw error;
      }

      const result = Array.isArray(data)
        ? (data[0] as RechargeOrderResult | undefined)
        : (data as RechargeOrderResult | null);

      if (!result) {
        throw new Error("订单创建失败，请稍后重试。");
      }

      const createdOrder = mapOrder(result);
      updateManualRechargeForm(paymentMethod, {
        createdOrder,
        message: "已提交付款信息，订单进入待审核状态，请等待管理员确认。",
        note: "",
      });
      await loadDashboardData(session);
    } catch (error) {
      console.error(error);
      updateManualRechargeForm(paymentMethod, {
        message: `订单创建失败：${getErrorMessage(error)}`,
      });
    } finally {
      updateManualRechargeForm(paymentMethod, {
        submitting: false,
      });
    }
  };

  const handleCreatePaypalOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPaypalMessage("");

    if (!session) {
      setPaypalMessage("请先登录后再使用 PayPal 支付。");
      return;
    }

    if (!isValidRechargeAmount(selectedRechargeAmount) || !Number.isFinite(selectedPaypalAmount) || selectedPaypalAmount <= 0) {
      setPaypalMessage("请选择或输入大于 0 且不超过 50000 的充值金额，最多保留 2 位小数。");
      return;
    }

    setPaypalSubmitting(true);

    try {
      const response = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: selectedPaypalAmount,
        }),
      });
      const data = (await response.json()) as {
        approve_url?: string;
        paypal_order_id?: string;
        amount_usd?: number | string;
        amount_cny?: number | string;
        exchange_rate?: number | string;
        error?: {
          message?: string;
        };
      };

      if (!response.ok || !data.approve_url) {
        throw new Error(data.error?.message ?? "PayPal 订单创建失败");
      }

      setPaypalReturnOrderId(data.paypal_order_id ?? "");
      setPaypalMessage(
        `PayPal 订单已创建：支付 $${Number(data.amount_usd ?? selectedPaypalAmount).toFixed(2)}，预计到账 ￥${Number(data.amount_cny ?? estimatedPaypalCny).toFixed(2)}，汇率 1 USD = ${Number(data.exchange_rate ?? paypalExchangeRate).toFixed(2)} CNY。正在跳转到 PayPal 支付页...`
      );
      window.location.href = data.approve_url;
    } catch (error) {
      console.error(error);
      setPaypalMessage(`PayPal 订单创建失败：${getErrorMessage(error)}`);
      setPaypalSubmitting(false);
    }
  };

  const handleCreateStripeCheckoutSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStripeMessage(stripePendingMessage);
  };

  const submitRechargePayment = async (orderId: string, messageTarget: "recharge" | "orders" = "recharge") => {
    if (!supabase || !session) {
      const message = "请先登录后再提交付款状态。";
      if (messageTarget === "orders") {
        setOrderMessage(message);
      } else {
        setRechargeMessage(message);
      }
      return;
    }

    setSubmittingPaymentOrderId(orderId);
    if (messageTarget === "orders") {
      setOrderMessage("");
    } else {
      setRechargeMessage("");
    }

    try {
      const { data, error } = await supabase.rpc("submit_recharge_order", {
        target_order_id: orderId,
      });

      if (error) {
        throw error;
      }

      const result = Array.isArray(data)
        ? (data[0] as RechargeOrderResult | undefined)
        : (data as RechargeOrderResult | null);

      if (result) {
        const submittedOrder = mapOrder(result);
        setManualRechargeForms((current) => {
          const next = { ...current };

          for (const method of manualRechargePaymentOptions) {
            if (current[method.key].createdOrder?.id === submittedOrder.id) {
              next[method.key] = {
                ...current[method.key],
                createdOrder: submittedOrder,
              };
            }
          }

          return next;
        });
      }

      const message = "已提交付款信息，等待管理员审核。";
      if (messageTarget === "orders") {
        setOrderMessage(message);
      } else {
        setRechargeMessage(message);
      }
      await loadDashboardData(session);
    } catch (error) {
      console.error(error);
      const message = `提交失败：${getErrorMessage(error)}`;
      if (messageTarget === "orders") {
        setOrderMessage(message);
      } else {
        setRechargeMessage(message);
      }
    } finally {
      setSubmittingPaymentOrderId("");
    }
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

  const reviewRechargeOrderAdmin = async (order: AdminRechargeOrderRow, action: "approve" | "reject") => {
    setAdminRechargeMessage("");

    if (!supabase || !session || !isAdmin) {
      setAdminRechargeMessage("只有管理员可以审核充值订单。");
      return;
    }

    if (!["pending", "submitted"].includes(order.status)) {
      setAdminRechargeMessage("只有待支付或待审核订单可以执行审核操作。");
      return;
    }

    const reviewNote = reviewNoteByOrderId[order.id]?.trim() ?? "";

    setReviewingRechargeOrderId(order.id);

    try {
      const { error } = await supabase.rpc(
        action === "approve" ? "approve_recharge_order_admin" : "reject_recharge_order_admin",
        {
          target_order_id: order.id,
          admin_review_note: reviewNote || null,
        }
      );

      if (error) {
        throw error;
      }

      setAdminRechargeMessage(
        action === "approve"
          ? `订单 ${order.id} 已通过，余额已增加 ¥${Number(order.amount ?? 0).toFixed(2)}。`
          : `订单 ${order.id} 已拒绝。`
      );
      setReviewNoteByOrderId((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
      setSelectedAdminRechargeOrder(null);
      await Promise.all([
        loadAdminRechargeOrders(),
        loadAdminOverview(),
        loadAdminUsers(),
        loadAdminFinance(),
        loadDashboardData(session),
      ]);
    } catch (error) {
      console.error(error);
      setAdminRechargeMessage(`审核失败：${getErrorMessage(error)}`);
    } finally {
      setReviewingRechargeOrderId("");
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <CardContent className="p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <BrandMark />
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                {authMode === "login" ? dashboardCopy.auth.loginTitle : dashboardCopy.auth.signupTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{dashboardCopy.auth.helper}</p>
            </div>
            <button
              onClick={closeLoginDialog}
              type="button"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                authMode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              {dashboardCopy.auth.login}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setAuthMessage("");
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                authMode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              {dashboardCopy.auth.signup}
            </button>
          </div>
          <div className="mb-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{dashboardCopy.auth.oauthDivider}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleOAuthSignIn("google")}
                disabled={authLoading || authSubmitting || Boolean(oauthSubmittingProvider)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Globe2 className="h-4 w-4 text-blue-500" />
                <span className="truncate">
                  {oauthSubmittingProvider === "google" ? dashboardCopy.auth.submitting : dashboardCopy.auth.googleLogin}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleOAuthSignIn("github")}
                disabled={authLoading || authSubmitting || Boolean(oauthSubmittingProvider)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4 text-slate-800" />
                <span className="truncate">
                  {oauthSubmittingProvider === "github" ? dashboardCopy.auth.submitting : dashboardCopy.auth.githubLogin}
                </span>
              </button>
            </div>
          </div>
          <form onSubmit={handleAuthSubmit}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{dashboardCopy.auth.emailAuthLabel}</p>
            <label className="text-sm font-medium text-slate-700">{dashboardCopy.auth.email}</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="you@example.com"
            />
            <label className="mt-4 block text-sm font-medium text-slate-700">{dashboardCopy.auth.password}</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder={dashboardCopy.auth.passwordPlaceholder}
            />
            {authMessage ? (
              <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
                {authMessage}
              </p>
            ) : (
              <p className="mt-4 text-xs leading-5 text-slate-500">支持多语言控制台，登录后会保持当前语言偏好。</p>
            )}
            <Button
              type="submit"
              disabled={authSubmitting || authLoading || Boolean(oauthSubmittingProvider)}
              className="mt-5 h-11 w-full rounded-xl bg-slate-950 text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authSubmitting
                ? dashboardCopy.auth.submitting
                : authMode === "login"
                  ? dashboardCopy.auth.login
                  : dashboardCopy.auth.signup}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  ) : null;

  if (page === "dashboard") {
    return (
      <div dir={languageMeta.dir} className="eel-console-shell min-h-screen text-slate-950">
        <Button
          type="button"
          onClick={() => setFunctionNavOpen(true)}
          className="eel-button-subtle fixed left-4 top-24 z-40 h-9 px-3 text-sm shadow-sm backdrop-blur-xl"
        >
          <Menu className="mr-2 h-4 w-4" />
          {dashboardCopy.functionNav}
        </Button>

        <div
          className={`fixed inset-0 z-[70] transition ${
            functionNavOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <button
            type="button"
            aria-label={dashboardCopy.closeNav}
            onClick={() => setFunctionNavOpen(false)}
            className={`absolute inset-0 bg-slate-950/25 backdrop-blur-sm transition-opacity ${
              functionNavOpen ? "opacity-100" : "opacity-0"
            }`}
          />
          <aside
            className={`absolute left-0 top-0 flex h-full w-[85vw] flex-col border-r border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl transition-transform duration-300 sm:w-[420px] lg:w-[25vw] ${
              functionNavOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{dashboardCopy.dashboardNav}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">{dashboardCopy.functionNav}</h2>
              </div>
              <button
                type="button"
                aria-label={dashboardCopy.closeNav}
                onClick={() => setFunctionNavOpen(false)}
                className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
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
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    {getDashboardNavLabel(item)}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>

        <header className="relative z-10 border-b border-slate-200 bg-white/88 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <button onClick={() => setPage("home")} className="flex items-center gap-2">
              <BrandMark />
            </button>
            <div className="flex items-center gap-3">
              <DashboardLanguageSwitcher
                language={appLanguage}
                copy={dashboardCopy}
                onChange={setDashboardLanguage}
              />
              <div className="hidden h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 sm:flex">
                <User className="h-4 w-4 text-blue-500" />
                {userEmail || dashboardCopy.signedInUser}
              </div>
              <Button
                variant="ghost"
                className="text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {dashboardCopy.logout}
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{dashboardCopy.consoleLabel}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">{dashboardCopy.consoleTitle}</h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">{dashboardCopy.consoleDesc}</p>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDashboardTab(tab.key)}
                className={`eel-console-tab ${
                  activeDashboardTab === tab.key
                    ? "eel-console-tab-active"
                    : tab.key === "chat"
                      ? "eel-console-tab-accent"
                      : ""
                }`}
              >
                {tab.icon}
                {dashboardCopy.tabs[tab.key]}
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
              {dashboardCopy.loadingData}
            </div>
          ) : null}

          {activeDashboardTab === "overview" ? (
            <div id="overview" className="scroll-mt-28">
              <SectionTitle
                label={dashboardCopy.overview.label}
                title={dashboardCopy.overview.title}
                desc={dashboardCopy.overview.desc}
              />
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  [dashboardCopy.overview.balance, `¥${balance.toFixed(4)}`, <Wallet key="wallet" className="h-5 w-5" />],
                  [dashboardCopy.overview.apiKeys, String(apiKeys.length), <KeyRound key="key" className="h-5 w-5" />],
                  [dashboardCopy.overview.todayRequests, String(usageLogs.length), <Activity key="activity" className="h-5 w-5" />],
                  [dashboardCopy.overview.models, String(modelList.length), <Database key="db" className="h-5 w-5" />],
                ].map(([label, value, icon]) => (
                  <Card key={String(label)} className="rounded-lg border-white/10 bg-white/[0.06] text-white">
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
              {isAdmin ? (
                <div className="mt-8">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">运营概览</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        管理员日常关注的用户、充值、请求和模型启用情况。
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void loadAdminOverview()}
                      disabled={adminOverviewLoading}
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adminOverviewLoading ? "刷新中..." : "刷新概览"}
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {adminOverviewCards.map(([label, value, hint]) => (
                      <Card key={label} className="rounded-lg border-white/10 bg-slate-900/80 text-white">
                        <CardContent className="p-5">
                          <p className="text-sm text-slate-400">{label}</p>
                          <p className="mt-2 text-2xl font-bold text-cyan-100">{value}</p>
                          <p className="mt-2 text-xs text-slate-500">{hint}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeDashboardTab === "keys" ? (
            <div id="api-keys" className="scroll-mt-28">
              <SectionTitle
                label={dashboardCopy.keys.label}
                title={dashboardCopy.keys.title}
                desc={dashboardCopy.keys.desc}
              />
              <Card className="border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <Button
                      onClick={() => setShowKeys(!showKeys)}
                      variant="outline"
                      className="eel-button-subtle"
                    >
                      {showKeys ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {showKeys ? dashboardCopy.keys.hide : dashboardCopy.keys.show}
                    </Button>
                    <Button onClick={addApiKey} className="eel-button-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      {dashboardCopy.keys.create}
                    </Button>
                  </div>
                  {createdApiKey ? (
                    <div className="mb-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
                      <p className="text-sm font-semibold text-cyan-100">{dashboardCopy.keys.created}</p>
                      <p className="mt-2 break-all font-mono text-xs text-cyan-50">
                        {dashboardCopy.keys.prefix}: {createdApiKey.slice(0, API_KEY_PREFIX_LENGTH)}...
                      </p>
                      <p className="mt-2 text-xs leading-5 text-cyan-100/80">
                        {dashboardCopy.keys.completeKeyHint}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => copy(createdApiKey, `${dashboardCopy.keys.copy} API Key`)}
                          className="eel-button-primary"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {dashboardCopy.keys.copy}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCreatedApiKey("")}
                          className="text-cyan-100 hover:bg-white/10 hover:text-white"
                        >
                          {dashboardCopy.keys.saved}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/45">
                    {apiKeys.map((item) => (
                      <div key={item.id} className="border-b border-white/10 p-4 last:border-b-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{item.name}</p>
                              <span className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-200">
                                active
                              </span>
                            </div>
                            <p className="mt-1 break-all font-mono text-xs text-slate-400">
                              {showKeys ? `${item.keyPrefix}...` : `${item.keyPrefix}********************************`}
                            </p>
                            <p className="mt-2 text-xs text-amber-200/80">{dashboardCopy.keys.listHint}</p>
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
                      <div className="p-4 text-slate-400">{dashboardCopy.keys.empty}</div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "playground" ? (
            <div id="playground" className="scroll-mt-28">
              <SectionTitle
                label={dashboardCopy.playground.label}
                title={dashboardCopy.playground.title}
                desc={dashboardCopy.playground.desc}
              />
              <Card className="rounded-lg border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <label className="text-sm text-slate-300">{dashboardCopy.playground.chooseModel}</label>
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
                  <label className="mt-4 block text-sm text-slate-300">{dashboardCopy.playground.input}</label>
                  <textarea
                    value={previewPrompt}
                    onChange={(event) => setPreviewPrompt(event.target.value)}
                    className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                  <Button onClick={runPreview} className="mt-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                    <Play className="mr-2 h-4 w-4" />
                    {dashboardCopy.playground.send}
                  </Button>
                  <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-7 text-slate-200">
                    {previewResult}
                  </pre>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "chat" ? (
            <div id="chat" className="scroll-mt-28">
              <SectionTitle
                label={dashboardCopy.chat.label}
                title={dashboardCopy.chat.title}
                desc={dashboardCopy.chat.desc}
              />
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <Card className="border-cyan-300/20 bg-slate-900/80 text-white">
                  <CardContent className="p-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">/api/chat</p>
                          <p className="text-xs text-slate-400">POST · {dashboardCopy.chat.endpointHint}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                          {dashboardCopy.chat.currentModel}: {chatModelInfo?.name ?? dashboardCopy.chat.noModel}
                        </span>
                        <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                          {dashboardCopy.chat.balance}: ¥{balance.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    <div className="max-h-[56vh] min-h-[360px] overflow-y-auto p-5">
                      {!activeChatApiKey ? (
                        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-amber-300/25 bg-amber-300/10 p-6 text-center">
                          <div>
                            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-amber-300/25 bg-amber-300/10 text-amber-100">
                              <KeyRound className="h-6 w-6" />
                            </div>
                            <p className="font-semibold text-amber-50">{dashboardCopy.chat.missingKey}</p>
                            <Button
                              type="button"
                              onClick={() =>
                                navigateDashboardModule({
                                  label: "API Key",
                                  id: "api-keys",
                                  tab: "keys",
                                })
                              }
                              className="eel-button-primary mt-4"
                            >
                              {dashboardCopy.chat.createKey}
                            </Button>
                          </div>
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-cyan-300/20 bg-slate-950/50 p-6 text-center">
                          <div>
                            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                              <Bot className="h-6 w-6" />
                            </div>
                            <p className="font-semibold text-slate-100">{dashboardCopy.chat.emptyTitle}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {dashboardCopy.chat.emptyDesc}
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
                                  className={`max-w-[86%] rounded-lg border px-4 py-3 ${
                                    isUserMessage
                                      ? "border-cyan-300/24 bg-cyan-300/12 text-cyan-50"
                                      : "border-white/10 bg-slate-950/70 text-slate-100"
                                  }`}
                                >
                                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                    {isUserMessage ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                    <span>{isUserMessage ? dashboardCopy.chat.user : dashboardCopy.chat.assistant}</span>
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
                              <div className="rounded-lg border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                                <span className="mr-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                                {dashboardCopy.chat.waiting}
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
                      <label className="text-sm font-medium text-slate-300">{dashboardCopy.chat.inputLabel}</label>
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
                        className="mt-2 min-h-28 w-full resize-none rounded-lg border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
                        placeholder={dashboardCopy.chat.placeholder}
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs leading-5 text-slate-400">
                          {dashboardCopy.chat.inputHint}
                        </p>
                        <Button
                          type="submit"
                          disabled={chatLoading || !chatInput.trim() || !activeChatApiKey || !chatModelInfo || !session}
                          className="eel-button-primary px-5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {chatLoading ? dashboardCopy.chat.sending : dashboardCopy.chat.send}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-5">
                  <Card className="border-white/10 bg-white/[0.045] text-white">
                    <CardContent className="p-5">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">{dashboardCopy.chat.settings}</h3>
                      <div className="mt-5">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-sm text-slate-300">{dashboardCopy.chat.useApiKey}</label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={chatKeysLoading || !session}
                            onClick={() => void loadChatApiKeys(session)}
                            className="text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {chatKeysLoading ? dashboardCopy.chat.refreshing : dashboardCopy.chat.refresh}
                          </Button>
                        </div>
                        {chatApiKeys.length > 0 ? (
                          <select
                            value={activeChatApiKey?.id ?? ""}
                            onChange={(event) => setSelectedChatApiKeyId(event.target.value)}
                            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                          >
                            {chatApiKeys.map((key) => (
                              <option key={key.id} value={key.id}>
                                {key.name} - {key.keyPrefix}...
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="mt-2 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                            {dashboardCopy.chat.missingKey}
                          </div>
                        )}
                        {chatKeysMessage ? (
                          <p className="mt-2 text-xs leading-5 text-rose-200">{chatKeysMessage}</p>
                        ) : (
                          <p className="mt-2 text-xs leading-5 text-slate-400">
                            {dashboardCopy.chat.keyPrefixHint}
                          </p>
                        )}
                      </div>

                      <div className="mt-5">
                        <label className="text-sm text-slate-300">{dashboardCopy.chat.chooseModel}</label>
                        <div ref={chatModelPickerRef} className="relative mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (chatModelOptions.length > 0) {
                                setChatModelPickerOpen((current) => !current);
                              }
                            }}
                            disabled={chatModelOptions.length === 0}
                            className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-left text-white outline-none transition hover:border-cyan-300/60 focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {selectedChatModelOption && selectedChatModelIcon ? (
                              <VendorLogo
                                providerId={selectedChatModelOption.provider}
                                providerName={selectedChatModelOption.providerName}
                                logoSrc={selectedChatModelIcon.src}
                                logoAlt={selectedChatModelIcon.alt}
                                size="sm"
                                className="border-white/10 bg-white"
                              />
                            ) : (
                              <Bot className="h-5 w-5 shrink-0 text-cyan-100" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-white" title={selectedChatModelOption?.displayName ?? dashboardCopy.chat.noModel}>
                                {selectedChatModelOption?.displayName ?? dashboardCopy.chat.noModel}
                              </span>
                              <span className="mt-0.5 block truncate font-mono text-xs text-slate-400" title={selectedChatModelOption?.name}>
                                {selectedChatModelOption?.name ?? dashboardCopy.chat.noEnabledModel}
                              </span>
                            </span>
                            <Search className="h-4 w-4 shrink-0 text-slate-400" />
                          </button>

                          {chatModelPickerOpen ? (
                            <div className="absolute right-0 top-full z-[80] mt-2 w-full overflow-hidden rounded-xl border border-cyan-300/20 bg-slate-950 shadow-2xl shadow-black/40 sm:w-[28rem] sm:max-w-[calc(100vw-2rem)]">
                              <div className="border-b border-white/10 p-3">
                                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
                                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                                  <input
                                    value={chatModelSearch}
                                    onChange={(event) => setChatModelSearch(event.target.value)}
                                    autoFocus
                                    placeholder={dashboardCopy.chat.modelSearchPlaceholder}
                                    className="h-8 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                                  />
                                </div>
                              </div>
                              <div className="max-h-[420px] overflow-y-auto p-2">
                                {filteredChatModelOptions.length > 0 ? (
                                  filteredChatModelOptions.map((model) => {
                                    const series = getSeriesById(model.series);
                                    const icon = resolveModelIcon({
                                      seriesId: model.series,
                                      name: model.name,
                                      displayName: model.displayName,
                                      providerName: model.providerName,
                                      provider: model.provider,
                                      supplierName: model.supplierName,
                                      upstreamModel: model.upstreamModel,
                                      description: model.description,
                                    });
                                    const badges = [
                                      ...capabilityOrder
                                        .filter((capability) => model.capabilities.includes(capability))
                                        .map((capability) => compactCapabilityLabels[capability]),
                                      ...platformTagOrder
                                        .filter((tag) => model.tags.includes(tag))
                                        .map((tag) => compactPlatformTagLabels[tag]),
                                    ].slice(0, 6);
                                    const selected = model.name === (chatModelInfo?.name ?? chatModel);

                                    return (
                                      <button
                                        key={model.name}
                                        type="button"
                                        onClick={() => {
                                          setChatModel(model.name);
                                          setChatModelSearch("");
                                          setChatModelPickerOpen(false);
                                        }}
                                        className={`flex w-full gap-3 rounded-lg px-3 py-3 text-left transition ${
                                          selected
                                            ? "border border-cyan-300/30 bg-cyan-300/15"
                                            : "border border-transparent hover:bg-white/10"
                                        }`}
                                      >
                                        <VendorLogo
                                          providerId={model.provider}
                                          providerName={model.providerName}
                                          logoSrc={icon.src}
                                          logoAlt={icon.alt}
                                          size="sm"
                                          className="mt-0.5 border-white/10 bg-white"
                                        />
                                        <span className="min-w-0 flex-1">
                                          <span className="flex min-w-0 items-center gap-2">
                                            <span className="truncate text-sm font-semibold text-white" title={model.displayName}>
                                              {model.displayName}
                                            </span>
                                            {selected ? (
                                              <span className="shrink-0 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
                                                {dashboardCopy.chat.selectedModel}
                                              </span>
                                            ) : null}
                                          </span>
                                          <span className="mt-1 block truncate font-mono text-xs text-cyan-100" title={model.name}>
                                            {model.name}
                                          </span>
                                          <span className="mt-1 block truncate text-xs text-slate-400" title={`${model.providerName} / ${series.name}`}>
                                            {model.providerName} / {series.name}
                                          </span>
                                          <span className="mt-2 flex flex-wrap gap-1.5">
                                            {badges.map((badge) => (
                                              <span key={badge} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                                                {badge}
                                              </span>
                                            ))}
                                          </span>
                                        </span>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
                                    {dashboardCopy.chat.noModelMatches}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {chatModelInfo ? (
                        <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
                          <div className="flex items-start gap-3">
                            {selectedChatModelOption && selectedChatModelIcon ? (
                              <VendorLogo
                                providerId={selectedChatModelOption.provider}
                                providerName={selectedChatModelOption.providerName}
                                logoSrc={selectedChatModelIcon.src}
                                logoAlt={selectedChatModelIcon.alt}
                                size="sm"
                                className="border-white/10 bg-white"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm text-cyan-100" title={chatModelInfo.name}>{chatModelInfo.name}</p>
                              <p className="mt-2 truncate text-sm font-semibold text-white" title={chatModelInfo.label}>{chatModelInfo.label}</p>
                              {selectedChatModelSeries ? (
                                <p className="mt-1 text-xs text-slate-400">{selectedChatModelOption?.providerName} / {selectedChatModelSeries.name}</p>
                              ) : null}
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{chatModelInfo.desc}</p>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                          {dashboardCopy.chat.noEnabledModel}
                        </div>
                      )}

                      <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
                        <p className="text-sm text-emerald-100">{dashboardCopy.chat.balance}</p>
                        <p className="mt-2 text-2xl font-bold text-white">¥{balance.toFixed(4)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/[0.045] text-white">
                    <CardContent className="p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold">{dashboardCopy.chat.rawResponse}</h3>
                        {chatRawResponse ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => copy(chatRawResponse, dashboardCopy.chat.copyRaw)}
                            className="text-slate-300 hover:bg-white/10 hover:text-white"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {dashboardCopy.keys.copy}
                          </Button>
                        ) : null}
                      </div>
                      <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-slate-300">
                        {chatRawResponse || dashboardCopy.chat.rawResponseHint}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : null}

          {activeDashboardTab === "models" ? (
            <div id="models" className="scroll-mt-28">
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Model Directory</p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      模型选择面板
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                      直接浏览具体模型版本，再用搜索、产品系列、能力和标签快速缩小范围。真实接入状态来自 Supabase models 表，产品识别和标签由前端映射层补齐。
                    </p>
                  </div>
                  <div className="grid min-w-[220px] grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-slate-500">目录版本</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-950">{modelDirectoryItems.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-blue-50 p-3">
                      <p className="text-blue-600">已接入</p>
                      <p className="mt-1 text-2xl font-semibold text-blue-700">{connectedModelCount}</p>
                    </div>
                  </div>
                </div>
                <div className="relative mt-6">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={modelSearch}
                    onChange={(event) => setModelSearch(event.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="搜索版本名、系列名或描述关键词，例如 ChatGPT、Claude、DeepSeek、代码、视频"
                  />
                </div>
              </div>
              {modelsMessage ? (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {modelsMessage}
                </div>
              ) : null}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">筛选条件</h3>
                      <p className="mt-1 text-xs text-slate-500">筛选只影响下方模型列表，不会改变目录结构。</p>
                    </div>
                    {modelDirectoryHasActiveFilters ? (
                      <button
                        type="button"
                        onClick={() => {
                          setModelSearch("");
                          setModelSeriesFilter("all");
                          setModelCapabilityFilters([]);
                          setModelTagFilters([]);
                        }}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        清空全部
                      </button>
                    ) : null}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">系列</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {[{ id: "all" as const, name: "全部", provider: "other" as const, providerName: "All", productIconSrc: "", productIconAlt: "", logoSrc: "", logoAlt: "", description: "查看所有模型", defaultTags: [], aliases: [] }, ...modelSeriesList].map((series) => {
                          const isActive = modelSeriesFilter === series.id;
                          const count = series.id === "all" ? modelDirectoryItems.length : modelSeriesCounts[series.id] ?? 0;
                          const icon = series.id === "all" ? null : getModelIconBySeries(series.id);

                          return (
                            <button
                              key={series.id}
                              type="button"
                              onClick={() => setModelSeriesFilter(series.id as ModelDirectoryFilter<ModelSeriesId>)}
                              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                                isActive
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                              }`}
                            >
                              {series.id === "all" ? (
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                                  <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                                </span>
                              ) : (
                                <VendorLogo
                                  providerId={series.provider}
                                  providerName={series.name}
                                  logoSrc={icon?.src}
                                  logoAlt={icon?.alt}
                                  size="xs"
                                />
                              )}
                              <span>{series.name}</span>
                              <span className="text-xs text-slate-400">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">能力</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setModelCapabilityFilters([])}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                              modelCapabilityFilters.length === 0
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
                              onClick={() => toggleModelCapabilityFilter(capability)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                                modelCapabilityFilters.includes(capability)
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
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">平台标签</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setModelTagFilters([])}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                              modelTagFilters.length === 0
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
                              onClick={() => toggleModelTagFilter(tag)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                                modelTagFilters.includes(tag)
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

                <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 text-sm text-slate-600">
                    <span>
                      已找到 <strong className="text-slate-950">{filteredModelDirectoryItems.length}</strong> 个具体模型
                    </span>
                    <span>
                      当前筛选：
                      <strong className="ml-1 text-slate-950">
                        {modelSeriesFilter === "all" ? "全部系列" : getSeriesById(modelSeriesFilter).name}
                        {" · "}
                        {modelCapabilityFilters.length === 0 ? "全部能力" : modelCapabilityFilters.map((capability) => capabilityLabels[capability]).join(" + ")}
                        {" · "}
                        {modelTagFilters.length === 0 ? "全部标签" : modelTagFilters.map((tag) => platformTagLabels[tag]).join(" + ")}
                      </strong>
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredModelDirectoryItems.map((model) => {
                      const series = getSeriesById(model.series);
                      const icon = resolveModelIcon({
                        seriesId: model.series,
                        name: model.name,
                        upstreamModel: model.upstreamModel,
                        displayName: model.displayName,
                        provider: model.provider,
                        providerName: model.providerName,
                        supplierName: model.supplierName,
                        description: model.description,
                      });

                      return (
                        <article
                          key={`${model.source}-${model.id}-${model.name}`}
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
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-semibold text-slate-950">{model.displayName}</h4>
                                {model.connected ? (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                    已接入
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                    目录
                                  </span>
                                )}
                              </div>
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
                                {model.inputPrice} · {model.outputPrice}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">上下文</p>
                              <p className="mt-0.5 text-sm font-semibold text-slate-950">{model.contextLength}</p>
                            </div>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                              i
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {filteredModelDirectoryItems.length === 0 ? (
                    <div className="m-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                      没有匹配的模型。可以清空搜索或筛选条件后再试。
                    </div>
                  ) : null}
                </section>
              </div>
            </div>
          ) : null}

          {activeDashboardTab === "usage" ? (
            <div id="usage-logs" className="scroll-mt-28">
              <SectionTitle
                label={dashboardCopy.tabs.usage}
                title={dashboardCopy.tabs.usage}
                desc="Review request records, token usage, cost, and status for account billing."
              />
              <Card className="rounded-lg border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          {dashboardUiText.usageHeaders.map((header) => (
                            <th key={header} className="py-3">{header}</th>
                          ))}
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
                        {dashboardUiText.noUsage}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "recharge" ? (
            <div id="recharge" className="scroll-mt-28">
              <SectionTitle
                label={dashboardCopy.tabs.recharge}
                title={dashboardCopy.tabs.recharge}
                desc="Select a recharge amount, choose a payment method, and add funds to account balance."
              />
              <Card className="rounded-lg border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="grid gap-8">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-sm font-bold text-cyan-100">
                          1
                        </span>
                        <h3 className="text-xl font-bold">{dashboardUiText.rechargeStepAmount}</h3>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        {rechargeAmountOptions.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setRechargeAmountChoice(String(amount))}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              rechargeAmountChoice === String(amount)
                                ? "border-cyan-300 bg-cyan-300/15 text-cyan-100"
                                : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-cyan-300/60"
                            }`}
                          >
                            <span className="block text-sm text-slate-400">{dashboardUiText.rechargeAmount}</span>
                            <span className="mt-2 block text-2xl font-black">￥{amount}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 max-w-sm">
                        <label className="text-sm text-slate-300">{dashboardUiText.customAmount}</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={customRechargeAmount}
                          onFocus={() => setRechargeAmountChoice("custom")}
                          onChange={(event) => {
                            setRechargeAmountChoice("custom");
                            setCustomRechargeAmount(event.target.value);
                          }}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                          placeholder={dashboardUiText.customAmountPlaceholder}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-sm font-bold text-cyan-100">
                          2
                        </span>
                        <h3 className="text-xl font-bold">{dashboardUiText.rechargeStepPayment}</h3>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {rechargePaymentOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              if (option.disabled) {
                                setStripeMessage(stripePendingMessage);
                                setRechargeMessage("");
                                setPaypalMessage("");
                                return;
                              }

                              setSelectedRechargePaymentMethod(option.key);
                              setRechargeMessage("");
                              setPaypalMessage("");
                              setStripeMessage("");
                            }}
                            aria-disabled={option.disabled ? true : undefined}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              selectedRechargePaymentMethod === option.key
                                ? "border-cyan-300 bg-cyan-300/15 text-cyan-100"
                                : option.disabled
                                  ? "cursor-not-allowed border-white/10 bg-slate-900/60 text-slate-500"
                                : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-cyan-300/60"
                            }`}
                          >
                            <span className="flex items-center gap-2 text-base font-bold">
                              {option.label}
                              {option.badge ? (
                                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                                  {option.badge}
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-2 block text-xs leading-5 text-slate-400">{option.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/70 p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-sm font-bold text-cyan-100">
                          3
                        </span>
                        <h3 className="text-xl font-bold">{dashboardUiText.rechargeStepConfirm}</h3>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                          <p className="text-slate-400">{dashboardUiText.rechargeAmount}</p>
                          <p className="mt-2 text-2xl font-black text-white">
                            ￥{Number.isFinite(selectedRechargeAmount) && selectedRechargeAmount > 0 ? selectedRechargeAmount.toFixed(2) : "0.00"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                          <p className="text-slate-400">{dashboardUiText.paymentMethod}</p>
                          <p className="mt-2 text-lg font-bold text-cyan-100">{selectedRechargePaymentOption.label}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                          <p className="text-slate-400">{dashboardUiText.creditMethod}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">
                            {selectedRechargePaymentMethod === "paypal"
                              ? `约 $${selectedPaypalAmount.toFixed(2)} 支付，预计到账 ￥${estimatedPaypalCny.toFixed(2)}`
                              : selectedRechargePaymentMethod === "stripe"
                                ? stripePendingMessage
                                : dashboardUiText.manualCredit}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button
                          type="button"
                          onClick={openRechargePaymentDialog}
                          className="rounded-2xl bg-white px-6 text-slate-950 hover:bg-slate-200"
                        >
                          {dashboardUiText.confirmPayment}
                        </Button>
                        {paypalReturnOrderId ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void capturePaypalOrder(paypalReturnOrderId)}
                            disabled={paypalCapturing}
                            className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {paypalCapturing ? dashboardUiText.confirming : dashboardUiText.confirmPaypal}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {rechargeMessage ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                      {rechargeMessage}
                    </div>
                  ) : null}
                  {paypalMessage ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                      {paypalMessage}
                    </div>
                  ) : null}
                  {stripeMessage ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                      {stripeMessage}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              {paymentDialogOpen ? (
                <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6">
                  <button
                    type="button"
                    aria-label="关闭支付弹窗"
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setPaymentDialogOpen(false)}
                  />
                  <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-cyan-300/20 bg-slate-950 p-6 text-white shadow-2xl shadow-black/40">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">确认支付</p>
                        <h3 className="mt-2 text-2xl font-black">{selectedRechargePaymentOption.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPaymentDialogOpen(false)}
                        className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white"
                        aria-label="关闭"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {selectedRechargePaymentMethod === "paypal" ? (
                      <form onSubmit={handleCreatePaypalOrder} className="mt-6 space-y-5">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-sm text-slate-400">PayPal 支付金额</p>
                            <p className="mt-2 text-2xl font-black text-white">${selectedPaypalAmount.toFixed(2)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-sm text-slate-400">预计到账人民币</p>
                            <p className="mt-2 text-2xl font-black text-cyan-100">￥{estimatedPaypalCny.toFixed(2)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-sm text-slate-400">汇率</p>
                            <p className="mt-2 text-sm font-semibold text-slate-200">
                              1 USD = {paypalExchangeRate.toFixed(2)} CNY
                            </p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-100">
                          PayPal 会创建订单并跳转到 PayPal 支付页。最终入账金额以服务端保存的订单金额和汇率为准。
                        </div>
                        <Button
                          type="submit"
                          disabled={paypalSubmitting || paypalCapturing}
                          className="w-full rounded-2xl bg-white px-6 text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {paypalSubmitting ? "创建中..." : "前往 PayPal 支付"}
                        </Button>
                        {paypalMessage ? (
                          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                            {paypalMessage}
                          </div>
                        ) : null}
                      </form>
                    ) : selectedRechargePaymentMethod === "stripe" ? (
                      <form onSubmit={handleCreateStripeCheckoutSession} className="mt-6 space-y-5">
                        <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                          {stripePendingMessage}
                        </div>
                        <Button
                          type="submit"
                          disabled
                          className="w-full rounded-2xl bg-white px-6 text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Stripe 审核中
                        </Button>
                        {stripeMessage ? (
                          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                            {stripeMessage}
                          </div>
                        ) : null}
                      </form>
                    ) : activeManualPaymentMethod && activeManualRechargeForm && activeManualRechargeOption ? (
                      <form
                        onSubmit={(event) => void handleCreateRechargeOrder(event, activeManualPaymentMethod)}
                        className="mt-6 space-y-5"
                      >
                        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                          <div className="rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-4">
                            <p className="text-sm font-semibold text-cyan-100">{activeManualRechargeOption.label}收款码</p>
                            <div className="mt-4 flex min-h-[240px] items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 p-4">
                              {manualQrStatus[activeManualPaymentMethod] === "missing" ? (
                                <span className="text-center text-sm text-slate-400">请管理员上传收款码</span>
                              ) : (
                                <Image
                                  src={activeManualRechargeOption.qrSrc}
                                  width={240}
                                  height={240}
                                  alt={`${activeManualRechargeOption.label}收款码`}
                                  onLoad={() =>
                                    setManualQrStatus((current) => ({
                                      ...current,
                                      [activeManualPaymentMethod]: "loaded",
                                    }))
                                  }
                                  onError={() =>
                                    setManualQrStatus((current) => ({
                                      ...current,
                                      [activeManualPaymentMethod]: "missing",
                                    }))
                                  }
                                  className="h-[240px] w-[240px] rounded-lg bg-white object-contain p-2"
                                />
                              )}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                              <p className="text-sm text-slate-400">转账金额</p>
                              <p className="mt-2 text-3xl font-black text-white">￥{selectedRechargeAmount.toFixed(2)}</p>
                              <p className="mt-3 text-sm leading-6 text-cyan-100">
                                {activeManualRechargeOption.label}：扫码转账后，请填写付款账号后四位并提交审核。
                              </p>
                              <p className="mt-1 text-sm text-slate-400">管理员审核通过后余额到账。</p>
                            </div>
                            <div>
                              <label className="text-sm text-slate-300">付款账号后四位 / 转账备注</label>
                              <input
                                value={activeManualRechargeForm.note}
                                onChange={(event) =>
                                  updateManualRechargeForm(activeManualPaymentMethod, {
                                    note: event.target.value,
                                  })
                                }
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                                placeholder="付款账号后四位 / 转账备注"
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          disabled={activeManualRechargeForm.submitting}
                          className="w-full rounded-2xl bg-white px-6 text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {activeManualRechargeForm.submitting ? "提交中..." : "我已付款，提交审核"}
                        </Button>
                        {activeManualRechargeForm.message ? (
                          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                            {activeManualRechargeForm.message}
                          </div>
                        ) : null}
                        {activeManualRechargeForm.createdOrder ? (
                          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm sm:grid-cols-3">
                            <div>
                              <p className="text-slate-400">订单号</p>
                              <p className="mt-2 break-all font-mono text-xs text-cyan-200">
                                {activeManualRechargeForm.createdOrder.id}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">到账金额</p>
                              <p className="mt-2 text-lg font-black text-white">
                                ￥{activeManualRechargeForm.createdOrder.amount.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">订单状态</p>
                              <div className="mt-2">
                                <OrderStatusBadge status={activeManualRechargeForm.createdOrder.status} />
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </form>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeDashboardTab === "orders" ? (
            <div id="orders" className="scroll-mt-28">
              <SectionTitle
                label={dashboardCopy.tabs.orders}
                title={dashboardCopy.tabs.orders}
                desc="View recharge order status and account balance update records."
              />
              <Card className="rounded-lg border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5 grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
                    <div>
                      <label className="text-sm text-slate-300">搜索订单</label>
                      <input
                        value={orderSearch}
                        onChange={(event) => setOrderSearch(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        placeholder="订单号 / 支付备注 / PayPal / Stripe ID"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">状态筛选</label>
                      <select
                        value={orderStatusFilter}
                        onChange={(event) => setOrderStatusFilter(event.target.value as DashboardOrderStatusFilter)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        <option value="all">全部状态</option>
                        <option value="pending">待支付</option>
                        <option value="submitted">待审核</option>
                        <option value="paid">已通过</option>
                        <option value="rejected">已拒绝</option>
                        <option value="failed">支付失败</option>
                        <option value="canceled">已取消</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">支付方式</label>
                      <select
                        value={orderPaymentFilter}
                        onChange={(event) => setOrderPaymentFilter(event.target.value as DashboardPaymentFilter)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                      >
                        <option value="all">全部方式</option>
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="alipay_manual">支付宝</option>
                        <option value="wechat_manual">微信</option>
                        <option value="manual">手动</option>
                      </select>
                    </div>
                  </div>
                  {orderMessage ? (
                    <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                      {orderMessage}
                    </div>
                  ) : null}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          {dashboardUiText.ordersHeaders.map((header, index) => (
                            <th
                              key={header}
                              className={`${index === dashboardUiText.ordersHeaders.length - 1 ? "w-[9%]" : ["w-[13%]", "w-[14%]", "w-[12%]", "w-[10%]", "w-[12%]", "w-[12%]", "w-[18%]"][index]} py-3 pr-3`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => {
                          const paymentMethod = order.paymentMethod || order.method;
                          const paymentLabel = formatOrderMethod(paymentMethod);
                          const reviewNote = order.reviewNote.trim();
                          const orderNote = order.note.trim();
                          const notes = [
                            reviewNote ? { label: dashboardUiText.reviewNote, value: reviewNote } : null,
                            orderNote ? { label: dashboardUiText.orderNote, value: orderNote } : null,
                          ].filter((item): item is { label: string; value: string } => Boolean(item));
                          const canSubmitManualPayment =
                            ["manual", "manual_transfer", "alipay_manual", "wechat_manual"].includes(paymentMethod) &&
                            order.status === "pending";

                          return (
                            <tr key={order.id} className="border-b border-white/5 align-top">
                              <td className="py-3 pr-3">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <span className="truncate font-mono text-xs text-cyan-300" title={order.id}>
                                    {formatCompactId(order.id, 8, 4)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void copy(order.id, dashboardUiText.copiedOrderId)}
                                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-500 transition hover:border-cyan-300/40 hover:text-cyan-200"
                                    aria-label={dashboardUiText.copyOrderId}
                                    title={dashboardUiText.copyOrderId}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                <div className="font-semibold text-white">
                                  {formatOrderCreditAmount(order.amount, paymentMethod, order.amountCny)}
                                </div>
                                {isUsdPaymentMethod(paymentMethod) ? (
                                  <div className="mt-1 truncate text-xs text-slate-500" title={formatExchangeRate(paymentMethod, order.exchangeRate)}>
                                    {formatOrderPaymentAmount(order.amount, paymentMethod, order.amountUsd)}
                                  </div>
                                ) : null}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                <span className="block truncate" title={paymentLabel}>
                                  {paymentLabel}
                                </span>
                              </td>
                              <td className="py-3 pr-3">
                                <OrderStatusBadge status={order.status} />
                              </td>
                              <td className="py-3 pr-3 text-xs text-slate-300">{order.time}</td>
                              <td className="py-3 pr-3 text-xs text-slate-300">{formatNullableDateTime(order.paidAt)}</td>
                              <td className="py-3 pr-3 text-slate-300">
                                {notes.length > 0 ? (
                                  <div className="space-y-1">
                                    {notes.map((note) => (
                                      <p key={note.label} className="truncate text-xs" title={note.value}>
                                        <span className="mr-1 text-slate-500">{note.label}</span>
                                        {note.value}
                                      </p>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-500">{dashboardUiText.none}</span>
                                )}
                              </td>
                              <td className="py-3">
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedOrder(order)}
                                    className="h-8 rounded-lg px-2 text-xs hover:bg-white/10 hover:text-white"
                                  >
                                    详情
                                  </Button>
                                {canSubmitManualPayment ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => void submitRechargePayment(order.id, "orders")}
                                    disabled={submittingPaymentOrderId === order.id}
                                    className="h-8 rounded-lg px-2 text-xs hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {submittingPaymentOrderId === order.id ? dashboardUiText.submitting : dashboardUiText.paidSubmit}
                                  </Button>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredOrders.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-400">
                        {orders.length === 0 ? dashboardUiText.noOrders : "暂无符合筛选条件的订单。"}
                      </div>
                    ) : null}
                  </div>
                  {selectedOrder ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-slate-950/75 p-5">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">订单详情</p>
                          <h3 className="mt-1 break-all font-mono text-sm text-cyan-200">{selectedOrder.id}</h3>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(null)}
                          className="hover:bg-white/10 hover:text-white"
                        >
                          关闭
                        </Button>
                      </div>
                      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">当前状态</p>
                          <div className="mt-2"><OrderStatusBadge status={selectedOrder.status} /></div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">支付方式</p>
                          <p className="mt-2 text-white">{formatOrderMethod(selectedOrder.paymentMethod || selectedOrder.method)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">支付金额</p>
                          <p className="mt-2 text-white">
                            {formatOrderPaymentAmount(selectedOrder.amount, selectedOrder.paymentMethod || selectedOrder.method, selectedOrder.amountUsd)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">到账金额</p>
                          <p className="mt-2 text-white">
                            {formatOrderCreditAmount(selectedOrder.amount, selectedOrder.paymentMethod || selectedOrder.method, selectedOrder.amountCny)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">创建时间</p>
                          <p className="mt-2 text-white">{selectedOrder.time}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">到账时间</p>
                          <p className="mt-2 text-white">{formatNullableDateTime(selectedOrder.paidAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">汇率</p>
                          <p className="mt-2 text-white">{formatExchangeRate(selectedOrder.paymentMethod || selectedOrder.method, selectedOrder.exchangeRate)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">支付渠道信息</p>
                          <p className="mt-2 break-all font-mono text-xs text-white">
                            {selectedOrder.stripeSessionId || selectedOrder.stripePaymentIntentId
                              ? `Stripe Session: ${selectedOrder.stripeSessionId ?? "无"} / PI: ${selectedOrder.stripePaymentIntentId ?? "无"}`
                              : selectedOrder.paypalOrderId || selectedOrder.paypalCaptureId
                                ? `PayPal Order: ${selectedOrder.paypalOrderId ?? "无"} / Capture: ${selectedOrder.paypalCaptureId ?? "无"}`
                              : "无"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-2">
                          <p className="text-slate-400">用户备注</p>
                          <p className="mt-2 whitespace-pre-wrap text-white">{selectedOrder.note || "无"}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-2">
                          <p className="text-slate-400">审核结果 / 管理员备注</p>
                          <p className="mt-2 whitespace-pre-wrap text-white">{selectedOrder.reviewNote || "无"}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeDashboardTab === "docs" ? (
            <div id="docs" className="scroll-mt-28">
              <SectionTitle
                label={dashboardCopy.tabs.docs}
                title={dashboardCopy.tabs.docs}
                desc="Copy the base URL, authorization format, and OpenAI-compatible request examples."
              />
              <Card className="rounded-lg border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">Base URL</p>
                      <p className="mt-2 break-all font-mono text-cyan-300">{apiBaseUrl}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">{dashboardUiText.modelName}</p>
                      <p className="mt-2 font-mono text-cyan-300">{selectedModelName}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-400">{dashboardUiText.endpoint}</p>
                      <p className="mt-2 font-mono text-cyan-300">/chat/completions</p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
                    {dashboardUiText.docsNotice}
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">{dashboardUiText.jsExample}</h3>
                    <Button onClick={() => copy(javascriptCode, dashboardUiText.copiedJs)} className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                      <Copy className="mr-2 h-4 w-4" />
                      {dashboardUiText.copy}
                    </Button>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-5 text-sm leading-7 text-slate-200">
                    <code>{javascriptCode}</code>
                  </pre>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">{dashboardUiText.pythonExample}</h3>
                    <Button onClick={() => copy(pythonCode, dashboardUiText.copiedPython)} className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                      <Copy className="mr-2 h-4 w-4" />
                      {dashboardUiText.copy}
                    </Button>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-5 text-sm leading-7 text-slate-200">
                    <code>{pythonCode}</code>
                  </pre>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                    <h3 className="text-lg font-bold">{dashboardUiText.errorCodes}</h3>
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
              <SectionTitle
                label={dashboardCopy.tabs.admin}
                title={dashboardCopy.tabs.admin}
                desc="Operational tools for administrators, including users, finance, suppliers, and review workflows."
              />
              <Card className="mb-6 rounded-lg border-white/10 bg-white/[0.06] text-white">
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
                        placeholder="人工调整 / 账户账单备注"
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
              <Card id="recharge-review" className="mb-6 scroll-mt-28 rounded-lg border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">充值审核</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        审核用户手动转账订单。通过后订单变为 paid 并给用户余额加款；拒绝后不会增加余额。
                      </p>
                    </div>
                    <div className="grid w-full gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto_auto] lg:items-end">
                      <div>
                        <label className="text-xs text-slate-400">订单号</label>
                        <input
                          value={adminRechargeOrderSearch}
                          onChange={(event) => setAdminRechargeOrderSearch(event.target.value)}
                          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-300"
                          placeholder="订单号 / PayPal / Stripe ID"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">邮箱</label>
                        <input
                          value={adminRechargeEmailSearch}
                          onChange={(event) => setAdminRechargeEmailSearch(event.target.value)}
                          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-300"
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">支付备注</label>
                        <input
                          value={adminRechargeNoteSearch}
                          onChange={(event) => setAdminRechargeNoteSearch(event.target.value)}
                          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-300"
                          placeholder="用户备注 / 审核备注"
                        />
                      </div>
                      <select
                        value={adminRechargeMethodFilter}
                        onChange={(event) => setAdminRechargeMethodFilter(event.target.value as AdminRechargePaymentFilter)}
                        className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-300"
                        aria-label="支付方式筛选"
                      >
                        {adminRechargePaymentFilters.map((filter) => (
                          <option key={filter.value} value={filter.value}>
                            {filter.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={adminRechargeStatusFilter}
                        onChange={(event) => setAdminRechargeStatusFilter(event.target.value as AdminRechargeStatusFilter)}
                        className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-300"
                        aria-label="订单状态筛选"
                      >
                        {adminRechargeStatusFilters.map((filter) => (
                          <option key={filter.value} value={filter.value}>
                            {filter.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        onClick={() => void loadAdminRechargeOrders()}
                        disabled={adminRechargeLoading}
                        variant="outline"
                        className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {adminRechargeLoading ? "刷新中..." : "刷新订单"}
                      </Button>
                    </div>
                  </div>

                  {adminRechargeMessage ? (
                    <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                      {adminRechargeMessage}
                    </div>
                  ) : null}

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed text-left text-xs">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          <th className="w-[11%] py-2 pr-2">订单号</th>
                          <th className="w-[14%] py-2 pr-2">用户</th>
                          <th className="w-[7%] py-2 pr-2">金额</th>
                          <th className="w-[9%] py-2 pr-2">方式</th>
                          <th className="w-[8%] py-2 pr-2">状态</th>
                          <th className="w-[12%] py-2 pr-2">渠道 ID</th>
                          <th className="w-[10%] py-2 pr-2">备注</th>
                          <th className="w-[13%] py-2 pr-2">审核备注</th>
                          <th className="w-[8%] py-2 pr-2">创建时间</th>
                          <th className="sticky right-0 z-10 w-[8%] bg-slate-950/95 py-2 pl-2 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminRechargeVisibleOrders.map((order) => {
                          const orderUser = order.user_email ?? order.user_id;
                          const paymentMethod = order.payment_method ?? order.method;
                          const paymentLabel = formatOrderMethod(paymentMethod);
                          const isReviewable = ["pending", "submitted"].includes(order.status) && paymentMethod !== "stripe";
                          const providerIds = [
                            { label: "O", copyLabel: "PayPal order ID", value: order.paypal_order_id },
                            { label: "C", copyLabel: "PayPal capture ID", value: order.paypal_capture_id },
                            { label: "S", copyLabel: "Stripe session ID", value: order.stripe_session_id },
                            { label: "PI", copyLabel: "Stripe payment intent ID", value: order.stripe_payment_intent_id },
                          ].filter(
                            (item): item is { label: string; copyLabel: string; value: string } => Boolean(item.value),
                          );

                          return (
                            <tr key={order.id} className="border-b border-white/5 align-top">
                              <td className="py-2 pr-2">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <span className="truncate font-mono text-[11px] text-cyan-300" title={order.id}>
                                    {formatCompactId(order.id, 6, 4)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void copy(order.id, "订单号已复制")}
                                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-500 transition hover:border-cyan-300/40 hover:text-cyan-200"
                                    aria-label="复制完整订单号"
                                    title="复制完整订单号"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-2 pr-2">
                                <span className="block truncate font-mono text-[11px] text-slate-300" title={orderUser}>
                                  {orderUser}
                                </span>
                              </td>
                              <td className="whitespace-nowrap py-2 pr-2 text-slate-300">¥{Number(order.amount ?? 0).toFixed(2)}</td>
                              <td className="py-2 pr-2 text-slate-300">
                                <span className="block truncate" title={paymentLabel}>
                                  {paymentLabel}
                                </span>
                              </td>
                              <td className="py-2 pr-2">
                                <OrderStatusBadge status={order.status} />
                              </td>
                              <td className="py-2 pr-2 text-slate-300">
                                {providerIds.length > 0 ? (
                                  <div className="space-y-1">
                                    {providerIds.map((item) => (
                                      <div key={item.label} className="flex min-w-0 items-center gap-1" title={item.value}>
                                        <span className="w-3 shrink-0 text-[10px] text-slate-500">{item.label}</span>
                                        <span className="truncate font-mono text-[11px] text-cyan-200">
                                          {formatCompactId(item.value, 4, 4)}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => void copy(item.value, `${item.copyLabel} 已复制`)}
                                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 text-slate-500 transition hover:border-cyan-300/40 hover:text-cyan-200"
                                          aria-label={`复制完整 ${item.copyLabel}`}
                                          title={`复制完整 ${item.copyLabel}`}
                                        >
                                          <Copy className="h-2.5 w-2.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-500">无</span>
                                )}
                              </td>
                              <td className="py-2 pr-2 text-slate-300">
                                <span className="block truncate" title={order.note ?? "无"}>
                                  {order.note ?? "无"}
                                </span>
                              </td>
                              <td className="py-2 pr-2">
                                {isReviewable ? (
                                  <input
                                    value={reviewNoteByOrderId[order.id] ?? ""}
                                    onChange={(event) =>
                                      setReviewNoteByOrderId((current) => ({
                                        ...current,
                                        [order.id]: event.target.value,
                                      }))
                                    }
                                    className="w-full max-w-[150px] rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300"
                                    placeholder="审核备注"
                                  />
                                ) : (
                                  <span className="block max-w-[150px] truncate text-slate-300" title={order.review_note ?? "无"}>
                                    {order.review_note ?? "无"}
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap py-2 pr-2 text-[11px] text-slate-300">{formatDateTime(order.created_at)}</td>
                              <td className="sticky right-0 z-10 bg-slate-950/95 py-2 pl-2">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedAdminRechargeOrder(order)}
                                    className="h-7 rounded-lg px-1.5 text-xs text-slate-200 hover:bg-white/10 hover:text-white"
                                  >
                                    详情
                                  </Button>
                                {isReviewable ? (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      disabled={reviewingRechargeOrderId === order.id}
                                      onClick={() => void reviewRechargeOrderAdmin(order, "approve")}
                                      className="h-7 rounded-lg px-1.5 text-xs text-emerald-200 hover:bg-emerald-300/10 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      通过
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      disabled={reviewingRechargeOrderId === order.id}
                                      onClick={() => void reviewRechargeOrderAdmin(order, "reject")}
                                      className="h-7 rounded-lg px-1.5 text-xs text-rose-200 hover:bg-rose-300/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      拒绝
                                    </Button>
                                  </>
                                ) : (
                                  <span className="block text-right text-slate-500">
                                    {paymentMethod === "stripe" && ["pending", "submitted"].includes(order.status)
                                      ? "等 webhook"
                                      : "已处理"}
                                  </span>
                                )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {adminRechargeVisibleOrders.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-400">
                        {adminRechargeLoading ? "正在读取充值订单..." : "暂无符合条件的充值订单。"}
                      </div>
                    ) : null}
                  </div>
                  {selectedAdminRechargeOrder ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-slate-950/75 p-5">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">审核详情</p>
                          <h4 className="mt-1 break-all font-mono text-sm text-cyan-200">
                            {selectedAdminRechargeOrder.id}
                          </h4>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedAdminRechargeOrder(null)}
                          className="hover:bg-white/10 hover:text-white"
                        >
                          关闭
                        </Button>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">用户</p>
                          <p className="mt-2 break-all font-mono text-xs text-cyan-100">
                            {selectedAdminRechargeOrder.user_email ?? selectedAdminRechargeOrder.user_id}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">支付方式</p>
                          <p className="mt-2 text-white">
                            {formatOrderMethod(selectedAdminRechargeOrder.payment_method ?? selectedAdminRechargeOrder.method)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">金额</p>
                          <p className="mt-2 text-white">
                            {formatOrderCreditAmount(
                              selectedAdminRechargeOrder.amount,
                              selectedAdminRechargeOrder.payment_method ?? selectedAdminRechargeOrder.method,
                              selectedAdminRechargeOrder.amount_cny
                            )}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">当前状态</p>
                          <div className="mt-2">
                            <OrderStatusBadge status={selectedAdminRechargeOrder.status} />
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">提交时间</p>
                          <p className="mt-2 text-white">{formatDateTime(selectedAdminRechargeOrder.created_at)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">到账时间</p>
                          <p className="mt-2 text-white">{formatNullableDateTime(selectedAdminRechargeOrder.paid_at)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">审核时间</p>
                          <p className="mt-2 text-white">{formatNullableDateTime(selectedAdminRechargeOrder.reviewed_at ?? null)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-slate-400">支付金额 / 汇率</p>
                          <p className="mt-2 text-white">
                            {formatOrderPaymentAmount(
                              selectedAdminRechargeOrder.amount,
                              selectedAdminRechargeOrder.payment_method ?? selectedAdminRechargeOrder.method,
                              selectedAdminRechargeOrder.amount_usd
                            )}
                            {" · "}
                            {formatExchangeRate(
                              selectedAdminRechargeOrder.payment_method ?? selectedAdminRechargeOrder.method,
                              selectedAdminRechargeOrder.exchange_rate
                            )}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 xl:col-span-2">
                          <p className="text-slate-400">支付渠道信息</p>
                          <p className="mt-2 break-all font-mono text-xs text-white">
                            {selectedAdminRechargeOrder.stripe_session_id || selectedAdminRechargeOrder.stripe_payment_intent_id
                              ? `Stripe Session: ${selectedAdminRechargeOrder.stripe_session_id ?? "无"} / PI: ${selectedAdminRechargeOrder.stripe_payment_intent_id ?? "无"}`
                              : `PayPal Order: ${selectedAdminRechargeOrder.paypal_order_id ?? "无"} / Capture: ${selectedAdminRechargeOrder.paypal_capture_id ?? "无"}`}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:col-span-2">
                          <p className="text-slate-400">用户填写的付款备注</p>
                          <p className="mt-2 whitespace-pre-wrap text-white">{selectedAdminRechargeOrder.note ?? "无"}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:col-span-2">
                          <p className="text-slate-400">管理员备注</p>
                          <textarea
                            value={reviewNoteByOrderId[selectedAdminRechargeOrder.id] ?? selectedAdminRechargeOrder.review_note ?? ""}
                            onChange={(event) =>
                              setReviewNoteByOrderId((current) => ({
                                ...current,
                                [selectedAdminRechargeOrder.id]: event.target.value,
                              }))
                            }
                            className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                            placeholder="填写审核备注，例如到账流水、拒绝原因等"
                          />
                        </div>
                      </div>
                      {["pending", "submitted"].includes(selectedAdminRechargeOrder.status) &&
                      (selectedAdminRechargeOrder.payment_method ?? selectedAdminRechargeOrder.method) !== "stripe" ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            disabled={reviewingRechargeOrderId === selectedAdminRechargeOrder.id}
                            onClick={() => void reviewRechargeOrderAdmin(selectedAdminRechargeOrder, "approve")}
                            className="rounded-2xl bg-emerald-200 text-emerald-950 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            审核通过
                          </Button>
                          <Button
                            type="button"
                            disabled={reviewingRechargeOrderId === selectedAdminRechargeOrder.id}
                            variant="outline"
                            onClick={() => void reviewRechargeOrderAdmin(selectedAdminRechargeOrder, "reject")}
                            className="rounded-2xl border-rose-300/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            审核拒绝
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              <Card id="users" className="mb-6 scroll-mt-28 rounded-lg border-white/10 bg-white/[0.06] text-white">
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

                      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {[
                          ["角色", selectedAdminUser.role],
                          ["余额", `¥${selectedAdminUser.balance.toFixed(4)}`],
                          ["API Key 数量", String(selectedAdminUser.apiKeyCount)],
                          ["累计充值", `¥${selectedAdminUser.totalRecharge.toFixed(2)}`],
                          ["累计消费", `¥${selectedAdminUser.totalSpend.toFixed(4)}`],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                          </div>
                        ))}
                      </div>

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
                          <table className="w-full min-w-[1080px] text-left text-sm">
                            <thead className="text-slate-400">
                              <tr className="border-b border-white/10">
                                <th className="py-3">时间</th>
                                <th className="py-3">订单号</th>
                                <th className="py-3">支付金额</th>
                                <th className="py-3">到账金额</th>
                                <th className="py-3">汇率</th>
                                <th className="py-3">方式</th>
                                <th className="py-3">状态</th>
                                <th className="py-3">备注</th>
                                <th className="py-3">审核备注</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminUserOrders.map((order) => (
                                <tr key={order.id} className="border-b border-white/5">
                                  <td className="py-3 text-slate-300">{formatDateTime(order.created_at)}</td>
                                  <td className="py-3 font-mono text-xs text-cyan-300">{order.id}</td>
                                  <td className="py-3 text-slate-300">
                                    {formatOrderPaymentAmount(order.amount, order.payment_method ?? order.method, order.amount_usd)}
                                  </td>
                                  <td className="py-3 text-slate-300">
                                    {formatOrderCreditAmount(order.amount, order.payment_method ?? order.method, order.amount_cny)}
                                  </td>
                                  <td className="py-3 text-slate-300">{formatExchangeRate(order.payment_method ?? order.method, order.exchange_rate)}</td>
                                  <td className="py-3 text-slate-300">{formatOrderMethod(order.payment_method ?? order.method)}</td>
                                  <td className="py-3">
                                    <OrderStatusBadge status={order.status ?? "pending"} />
                                  </td>
                                  <td className="py-3 text-slate-300">{order.note ?? "无"}</td>
                                  <td className="py-3 text-slate-300">{order.review_note ?? "无"}</td>
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
              <Card id="finance" className="mb-6 scroll-mt-28 rounded-lg border-white/10 bg-white/[0.06] text-white">
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
                        <option value="week">本周</option>
                        <option value="month">本月</option>
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
                        className="rounded-lg border border-white/10 bg-slate-950/60 p-4"
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

                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <h4 className="mb-4 text-lg font-bold">按支付方式统计</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-left text-sm">
                        <thead className="text-slate-400">
                          <tr className="border-b border-white/10">
                            <th className="py-3">支付方式</th>
                            <th className="py-3">充值金额</th>
                            <th className="py-3">订单数</th>
                            <th className="py-3">成功</th>
                            <th className="py-3">失败/拒绝</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentMethodFinanceRankings.map((item) => (
                            <tr key={`payment-${item.supplier_name ?? item.label}`} className="border-b border-white/5">
                              <td className="py-3 pr-3 text-cyan-300">{formatOrderMethod(item.supplier_name ?? item.label)}</td>
                              <td className="py-3 pr-3 text-slate-300">{formatMoney(item.total_amount, 2)}</td>
                              <td className="py-3 pr-3 text-slate-300">{formatNumber(item.order_count)}</td>
                              <td className="py-3 pr-3 text-emerald-300">{formatNumber(item.success_count)}</td>
                              <td className="py-3 pr-3 text-amber-300">{formatNumber(item.failed_count)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {paymentMethodFinanceRankings.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                          暂无支付方式统计数据。
                        </div>
                      ) : null}
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
                      <table className="w-full min-w-[1120px] text-left text-sm">
                        <thead className="text-slate-400">
                          <tr className="border-b border-white/10">
                            <th className="py-3">用户邮箱</th>
                            <th className="py-3">支付金额</th>
                            <th className="py-3">到账金额</th>
                            <th className="py-3">汇率</th>
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
                              <td className="py-3 pr-3 text-slate-300">
                                {formatOrderPaymentAmount(order.amount, order.payment_method ?? order.method, order.amount_usd)}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">
                                {formatOrderCreditAmount(order.amount, order.payment_method ?? order.method, order.amount_cny)}
                              </td>
                              <td className="py-3 pr-3 text-slate-300">{formatExchangeRate(order.payment_method ?? order.method, order.exchange_rate)}</td>
                              <td className="py-3 pr-3 text-slate-300">{formatOrderMethod(order.payment_method ?? order.method)}</td>
                              <td className="py-3 pr-3">
                                <OrderStatusBadge status={order.status ?? "pending"} />
                              </td>
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
              <Card id="errors" className="mb-6 scroll-mt-28 rounded-lg border-white/10 bg-white/[0.06] text-white">
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
                        className="rounded-lg border border-white/10 bg-slate-950/60 p-4"
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
              <Card id="suppliers" className="mb-6 scroll-mt-28 rounded-lg border-white/10 bg-white/[0.06] text-white">
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
              <Card id="model-pricing" className="mb-6 scroll-mt-28 rounded-lg border-white/10 bg-white/[0.06] text-white">
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
                  ["monitoring", "系统监控", "集中查看 QPS、延迟、可用率和供应商健康状态。"],
                ].map(([id, title, desc]) => (
                  <div
                    id={id}
                    key={id}
                    className="scroll-mt-28 rounded-lg border border-white/10 bg-white/[0.045] p-4 text-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                        <Settings className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold">{title}</h3>
                          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-xs text-amber-100">
                            运营能力
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

  return (
    <MarketingHome
      loginDialog={LoginDialog}
      onLogin={() => {
        setAuthMode("login");
        setAuthMessage("");
        setLoginOpen(true);
      }}
      onSignup={() => {
        setAuthMode("signup");
        setAuthMessage("");
        setLoginOpen(true);
      }}
      onOpenDashboard={openDashboard}
      onAskAi={requestAiChat}
    />
  );
}
