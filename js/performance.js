/*
  performance.js — قياس أداء المستخدم والتكيف (المرحلة 10)

  فكرة التصميم: نفس منطق coaching.js — طبقة "جنب" مش "بدل". الملف
  ده معندوش أي نظام تصنيف أخطاء خاص بيه؛ بياخد categoryCode جاهز من
  classifyError() في errors.js زي ما هو (ممنوع تصريحًا في الـ spec
  إنشاء تصنيف موازي). دور performance.js الوحيد إنه يجمع ويلخص
  البيانات دي عبر الوقت، ويقرر بناءً عليها "مستوى التكيف" الحالي.

  ليه الدقة (accuracy) هي المعيار الأساسي للتكيف مش السرعة؟
  لأن PROJECT.md نفسه حاطط "الدقة أهم من السرعة" كمبدأ أساسي للمشروع
  كله (قسم القيود). لو التكيف اعتمد على السرعة كمعيار أساسي هيكون
  بيكافئ عكس المبدأ ده. السرعة (stalled) لسه بتتراقب في coaching.js
  زي ما هي، بس كإشارة منفصلة (وقفة طويلة) مش كجزء من حساب المستوى.

  التخزين: عبر storage.js بس — الملف ده معندوش أي فكرة عن
  localStorage مباشرة، ودايمًا بيشتغل حتى لو التخزين مش متاح
  (fallback في storage.js نفسه بيتكفل بده).
*/

import { loadStats, saveStats } from './storage.js';

const RECENT_WINDOW = 10;              // آخر كام خطوة بس بتتحسب في قرار التكيف
const MIN_SAMPLES_FOR_ADAPTATION = 5;  // أقل عدد عينات قبل ما نبدأ نكيف أصلًا (تفادي قرار متسرع)
const STRONG_THRESHOLD = 0.85;         // نسبة صح-من-أول-مرة عشان "أداء قوي"
const STRUGGLING_THRESHOLD = 0.5;      // نسبة صح-من-أول-مرة تحت كده = "محتاج توجيه أكبر"
const WEAK_CATEGORY_THRESHOLD = 5;     // عدد أخطاء متراكم لنفس الفئة عبر كل الوقت عشان تتعتبر "نقطة ضعف"
const SCENARIO_REPLAY_MISTAKE_THRESHOLD = 3; // عدد أخطاء في سيناريو واحد عشان نقترح إعادته

const MAX_STEP_HISTORY = 30;     // حد أقصى لحجم سجل الخطوات المحفوظ
const MAX_SCENARIO_HISTORY = 20; // حد أقصى لحجم سجل السيناريوهات المحفوظ

function defaultStats() {
  return {
    stepHistory: [],       // [{firstTry: bool, category: string|null}] — نافذة متحركة
    mistakesByCategory: {}, // {FORMAT: 3, SEQUENCE: 1, ...} — تراكمي، بدون حد أقصى (أنواع الفئات محدودة)
    scenarioHistory: [],   // [{scenarioId, mistakes, completed}] — نافذة متحركة
    scenariosCompleted: 0,
    totalStepsRecorded: 0
  };
}

let stats = defaultStats();

export function initPerformance() {
  const loaded = loadStats();
  // دمج بسيط مع القيم الافتراضية عشان لو شكل البيانات المحفوظة قديم
  // أو ناقص حقل، النظام ميقعش — بيكمل بقيم افتراضية آمنة بدالها.
  stats = Object.assign(defaultStats(), loaded || {});
  if (!Array.isArray(stats.stepHistory)) stats.stepHistory = [];
  if (!Array.isArray(stats.scenarioHistory)) stats.scenarioHistory = [];
  if (typeof stats.mistakesByCategory !== 'object' || stats.mistakesByCategory === null) {
    stats.mistakesByCategory = {};
  }
}

function persist() {
  saveStats(stats);
}

// بيتسجل مرة واحدة لكل تقييم خطوة (صح أو غلط) — نداء من coaching.js
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

// 'reduced' = قلل كثافة التلميحات | 'normal' = زي المرحلة 9 | 'increased' = زود التوجيه
export function getAdaptiveTier() {
  const recent = stats.stepHistory.slice(-RECENT_WINDOW);
  if (recent.length < MIN_SAMPLES_FOR_ADAPTATION) return 'normal';

  const firstTryCount = recent.filter((r) => r.firstTry).length;
  const rate = firstTryCount / recent.length;

  if (rate >= STRONG_THRESHOLD) return 'reduced';
  if (rate < STRUGGLING_THRESHOLD) return 'increased';
  return 'normal';
}

// نقطة ضعف متكررة عبر كل التاريخ (مش بس الجلسة الحالية زي
// checkRecurringPattern في errors.js) — بتتستخدم كملحوظة إضافية
export function isCategoryWeak(categoryCode) {
  if (!categoryCode) return false;
  return (stats.mistakesByCategory[categoryCode] || 0) >= WEAK_CATEGORY_THRESHOLD;
}

// بينده وقت انتهاء أو خروج من سيناريو — بيرجع اقتراح إعادة لو يستاهل
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
