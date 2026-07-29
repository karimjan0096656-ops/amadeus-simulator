/*
  performance.js — قياس أداء المستخدم والتكيف (المرحلة 10)
  + إضافة المرحلة 12: تتبع منفصل لسيناريوهات Free Mode بس

  === إضافة المرحلة 12 (ملحوظة ضرورية) ===
  اكتشفنا وإحنا بنراجع الكود قبل المرحلة 12 إن recordStepResult()
  وonScenarioFinished() وgetAdaptiveTier() وisCategoryWeak() الموجودين
  هنا من المرحلة 10 مش متصلين فعليًا بأي حاجة — لا coaching.js ولا
  main.js كانوا بينادوهم. يعني تكيف مستوى التلميحات حسب الأداء
  (المذكور كمكتمل في PROJECT.md) مش شغال فعليًا في الكود الحالي؛ بس
  initPerformance() (تحميل الإحصائيات المحفوظة) اللي شغال. الملف ده
  في نسخته الحالية مش بيتلمس أو يتصلح جوه المرحلة 12 — ده قرار خارج
  نطاقها المتفق عليه ومحتاج قرار منفصل مع Malik. الإضافة الوحيدة هنا
  هي دالة جديدة معزولة (recordFreeModeScenario) بتخدم متطلب "الأداء في
  Free Mode بيتسجل بعلامة مختلفة" بس، من غير ما تلمس أو تفعّل أي حاجة
  من نظام المرحلة 10 غير الشغال.
*/

import { loadStats, saveStats } from './storage.js';

const RECENT_WINDOW = 10;
const MIN_SAMPLES_FOR_ADAPTATION = 5;
const STRONG_THRESHOLD = 0.85;
const STRUGGLING_THRESHOLD = 0.5;
const WEAK_CATEGORY_THRESHOLD = 5;
const SCENARIO_REPLAY_MISTAKE_THRESHOLD = 3;

const MAX_STEP_HISTORY = 30;
const MAX_SCENARIO_HISTORY = 20;

function defaultStats() {
  return {
    stepHistory: [],
    mistakesByCategory: {},
    scenarioHistory: [],
    scenariosCompleted: 0,
    totalStepsRecorded: 0,
    // === إضافة المرحلة 12 ===
    freeModeScenarioHistory: [],
    freeModeSessionsCompleted: 0
  };
}

let stats = defaultStats();

export function initPerformance() {
  const loaded = loadStats();
  stats = Object.assign(defaultStats(), loaded || {});
  if (!Array.isArray(stats.stepHistory)) stats.stepHistory = [];
  if (!Array.isArray(stats.scenarioHistory)) stats.scenarioHistory = [];
  if (typeof stats.mistakesByCategory !== 'object' || stats.mistakesByCategory === null) {
    stats.mistakesByCategory = {};
  }
  // === إضافة المرحلة 12: نفس أسلوب الحماية من بيانات محفوظة قديمة
  // ناقصة الحقل الجديد، بالظبط زي stepHistory/scenarioHistory فوق ===
  if (!Array.isArray(stats.freeModeScenarioHistory)) stats.freeModeScenarioHistory = [];
  if (typeof stats.freeModeSessionsCompleted !== 'number') stats.freeModeSessionsCompleted = 0;
}

function persist() {
  saveStats(stats);
}

export function recordStepResult(categoryCode, wasFirstTry) {
  stats.totalStepsRecorded += 1;
  stats.stepHistory.push({ firstTry: !!wasFirstTry, category: categoryCode || null });
  if (stats.stepHistory.length > MAX_STEP_HISTORY) {
    stats.stepHistory = stats.stepHistory.slice(-MAX_STEP_HISTORY);
  }
  if (!wasFirstTry && categoryCode) {
    stats.mistakesByCategory[categoryCode] = (stats.mistakesByCategory[categoryCode] || 0) + 1;
  }
  persist();
}

export function getAdaptiveTier() {
  const recent = stats.stepHistory.slice(-RECENT_WINDOW);
  if (recent.length < MIN_SAMPLES_FOR_ADAPTATION) return 'normal';

  const firstTryCount = recent.filter((r) => r.firstTry).length;
  const rate = firstTryCount / recent.length;

  if (rate >= STRONG_THRESHOLD) return 'reduced';
  if (rate < STRUGGLING_THRESHOLD) return 'increased';
  return 'normal';
}

export function isCategoryWeak(categoryCode) {
  if (!categoryCode) return false;
  return (stats.mistakesByCategory[categoryCode] || 0) >= WEAK_CATEGORY_THRESHOLD;
}

export function onScenarioFinished(scenarioId, { mistakes, completed }) {
  stats.scenarioHistory.push({ scenarioId, mistakes, completed: !!completed });
  if (stats.scenarioHistory.length > MAX_SCENARIO_HISTORY) {
    stats.scenarioHistory = stats.scenarioHistory.slice(-MAX_SCENARIO_HISTORY);
  }
  if (completed) stats.scenariosCompleted += 1;
  persist();

  if (mistakes >= SCENARIO_REPLAY_MISTAKE_THRESHOLD) {
    return { replaySuggested: true, scenarioId, mistakes };
  }
  return null;
}

// === إضافة المرحلة 12: تتبع منفصل بالكامل عن scenarioHistory
// العادية — مقصود عشان أداء "بدون مساعدة" ميتلخبطش مع تمرين عادي
// فيه تلميحات، بالظبط زي ما اتفقنا في نقاش نطاق المرحلة 12 ===
export function recordFreeModeScenario(scenarioId, { mistakes, completed }) {
  stats.freeModeScenarioHistory.push({ scenarioId, mistakes, completed: !!completed, at: Date.now() });
  if (stats.freeModeScenarioHistory.length > MAX_SCENARIO_HISTORY) {
    stats.freeModeScenarioHistory = stats.freeModeScenarioHistory.slice(-MAX_SCENARIO_HISTORY);
  }
  if (completed) stats.freeModeSessionsCompleted += 1;
  persist();
}
