/*
  performance.js — قياس أداء المستخدم والتكيف (المرحلة 10)
  + إضافة المرحلة 12: تتبع منفصل لسيناريوهات Free Mode بس
  + إضافة المرحلة 14: تفعيل حقيقي لـ recordStepResult/onScenarioFinished
    (كانوا معلّقين من المرحلة 10) + دوال جديدة لحساب "الإتقان" اللي
    بيغذّي نظام مسار المهام الموجّه (Guided Mission Progression) في
    coaching.js.

  === إضافة المرحلة 14 (ملحوظات ضرورية) ===
  1) onScenarioFinished() بقت بتاخد باراميتر تالت اختياري: hintsUsed.
     ده مش تغيير كاسر — أي نداء قديم من غير الباراميتر ده هيفضل شغال
     بالظبط زي الأول (بيتسجل hintsUsed: 0 تلقائيًا). الإضافة دي
     ضرورية عشان "نجاح نظيف" (Clean Run) في نظام الإتقان الجديد
     يتحسب صح — مش بس "خلص من غير أخطاء"، لازم كمان "من غير ما ياخد
     تلميحات أكتر من الحد المسموح".

  2) getCleanRunCount(scenarioId, maxHintsAllowed) — دالة جديدة
     للقراءة بس، بتحسب عدد مرات النجاح "النظيف" (completed=true +
     mistakes=0 + hintsUsed <= الحد المسموح) لسيناريو معين من
     scenarioHistory المحفوظة بالفعل. دي اللي بتقرر فتح/قفل
     السيناريو التالي في coaching.js.

  3) hasSeenExample() / markExampleSeen() — تتبع بسيط لمعرفة هل
     المتدرب شاف "المثال المحلول" (exampleWalkthroughAr) بتاع سيناريو
     معين قبل كده ولا لأ، عشان يتعرض مرة واحدة بس قبل أول محاولة
     حقيقية. تخزين مستقل تمامًا عن stepHistory/scenarioHistory —
     مجرد قايمة IDs بسيطة.

  4) recordStepResult() نفسها من غير أي تغيير في السلوك أو التوقيع —
     بس دلوقتي فعليًا بتتنادى من coaching.js (قسم الشرح جوه الملف
     ده) بدل ما تفضل معلّقة زي من المرحلة 10 للمرحلة 13.
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
    freeModeSessionsCompleted: 0,
    // === إضافة المرحلة 14 ===
    exampleSeenScenarioIds: []
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
  // === إضافة المرحلة 14: نفس أسلوب الحماية بالظبط ===
  if (!Array.isArray(stats.exampleSeenScenarioIds)) stats.exampleSeenScenarioIds = [];
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

// === تعديل المرحلة 14: باراميتر تالت اختياري hintsUsed (افتراضيًا 0)
// — إضافة فقط، مفيش أي تغيير في السلوك القديم لو محدش بعت الباراميتر
// ده ===
export function onScenarioFinished(scenarioId, { mistakes, completed, hintsUsed = 0 }) {
  stats.scenarioHistory.push({ scenarioId, mistakes, completed: !!completed, hintsUsed });
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

// === إضافة المرحلة 14: عدد مرات "النجاح النظيف" لسيناريو معين —
// completed + صفر أخطاء + تلميحات في حدود المسموح. دي اللي بتقرر
// فتح السيناريو التالي في مسار المهام الموجّه (coaching.js) ===
export function getCleanRunCount(scenarioId, maxHintsAllowed) {
  const limit = typeof maxHintsAllowed === 'number' ? maxHintsAllowed : Infinity;
  return stats.scenarioHistory.filter(
    (entry) =>
      entry.scenarioId === scenarioId &&
      entry.completed &&
      entry.mistakes === 0 &&
      (entry.hintsUsed || 0) <= limit
  ).length;
}

// === إضافة المرحلة 14: هل المتدرب شاف المثال المحلول بتاع السيناريو
// ده قبل كده؟ ===
export function hasSeenExample(scenarioId) {
  return stats.exampleSeenScenarioIds.includes(scenarioId);
}

export function markExampleSeen(scenarioId) {
  if (!stats.exampleSeenScenarioIds.includes(scenarioId)) {
    stats.exampleSeenScenarioIds.push(scenarioId);
    persist();
  }
}