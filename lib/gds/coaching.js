/*
  coaching.js — نظام الإرشاد والسيناريوهات (المرحلة 9)
  + تكيف المرحلة 10 (جوه onCommandProcessed)
  + Free Mode المرحلة 12
  + إعادة كتابة المرحلة 14: تصحيح حقيقي للبيانات + أوضاع تدريب
    منفصلة + مسار مهام موجّه

  === إعادة كتابة المرحلة 14 — ملخص التغييرات ===

  1) تصحيح حقيقي (Real Grading): قبل كده onCommandProcessed كان بيقارن
     بس "نوع الأمر" (كود زي SS/NM) مع الخطوة المتوقعة، من غير أي فحص
     للبيانات الفعلية جوه الأمر — يعني حجز خط طيران غلط أو تسجيل اسم
     غلط كانا بيعدّوا "صح" طول ما الأمر من النوع الصح ونجح. دلوقتي أي
     خطوة سيناريو ممكن تحمل شروط expect* (زي expectLine, expectClass,
     expectLastName, expectFirstName, expectSeats) بتتقارن مع بيانات
     حقيقية مستخرجة من الأمر نفسه عبر extractParams(). لو النوع صح
     بس البيانات غلط، الخطوة متتقدمش وبتتسجل كـ"خطأ قرار بيانات"
     (SCENARIO_MISMATCH) — أخطر تصنيف عندنا، لأنه بالظبط المشكلة اللي
     اكتشفناها في مراجعة الكود قبل المرحلة 14 (تلميذ يقفل سيناريو كامل
     وهو بيتخانق قرارات غلط في الواقع).

  2) خطوات السيناريو بقت تقبل صيغتين: نص عادي زي "SS" (بيتحول تلقائيًا
     لـ {code:"SS"} في initCoaching، من غير أي شرط)، أو كائن كامل زي
     {code:"NM", expectLastName:"SAMIR", ...}. عشان كده سيناريوهات
     زي 1-6 و10 فضلت شغالة زي ما هي بالظبط من غير أي تغيير في data —
     التصحيح الحقيقي اتضاف بس لسيناريو 7 لحد دلوقتي (تفاصيل في
     scenarios.json وفي رسالة التسليم).

  3) 4 أوضاع تدريب بدل الـ2 boolean القدام (coachingEnabled/
     freeModeEnabled): LEARN (الافتراضي، زي القديم)، PRACTICE (صفر
     تلميحات تلقائية، بس أمر HINT جديد بيديك تلميحة عند الطلب — ده
     قرار تصميم مني عشان يحقق "تلميحة عند الطلب بس" المطلوبة في
     السبك، السبك ماحددش اسم أمر بعينه)، ASSESSMENT (= Free Mode
     القديم بالظبط، بس باسم جديد)، WORK_SIM (زي Assessment بس بتاخد
     تقرير أداء احترافي في الآخر بدل رسالة الاحتفال). الأوامر القديمة
     COACHINGON/OFF و FREEMODEON/OFF لسه شغالة كـAlias (تفاصيل تحت).

  4) recordStepResult/onScenarioFinished (كانوا معلّقين تمامًا من
     المرحلة 10) بقوا متصلين فعليًا هنا. onScenarioFinished بيتنادى
     في كل الأوضاع دلوقتي (مش Free Mode بس زي قبل كده) عشان يغذّي
     نظام الإتقان الجديد بشكل موحّد — بينما recordFreeModeScenario
     القديمة لسه بتتنادى بالظافة في وضع ASSESSMENT تحديدًا، محافظة
     على نفس فصل البيانات اللي كان موجود من المرحلة 12 من غير أي لمس.

  5) مسار مهام موجّه: أي سيناريو ممكن يحمل track/prerequisiteId/
     masteryRequired/exampleWalkthroughAr. لو عنده prerequisiteId،
     مبيتفتحش لحد ما السيناريو السابق يتحقق فيه معيار الإتقان
     (نجاح نظيف = صفر أخطاء + تلميحات في حدود المسموح، عدد مرات كافي)
     — القفل ده بيتحسب لايف من performance.js (getCleanRunCount)،
     مفيش أي تكرار لتخزين البيانات هنا. أول مرة تفتح سيناريو عنده
     exampleWalkthroughAr، بتشوف المثال المحلول الأول من غير ما
     تتحسب محاولة حقيقية؛ المرة اللي بعدها بتبدأ فعليًا.

  === تعليق مهم: النطاق اللي اتسيب زي ما هو عمدًا ===
  - parser.js وerrors.js وerrors.json: صفر لمس، بالظبط زي كل مرحلة
    قبل كده.
  - main.js: صفر لمس. الأوامر الجديدة كلها (LEARNMODE/PRACTICEMODE/
    ASSESSMENTMODE/WORKMODE/HINT) بتتلقط عبر isCoachingKeyword() اللي
    main.js أصلًا بيوجّهها لـhandleCoachingKeyword() — نفس النمط
    المعمول بيه من المرحلة 9 بالظبط، مفيش داعي لأي نقطة تكامل جديدة.
  - getAdaptiveTier/isCategoryWeak (تكيف المرحلة 10): اتوصلوا
    بالبيانات (عبر recordStepResult) بس ماتستخدموش لتغيير سلوك
    التلميحات في المرحلة دي — ده قرار نطاق واعي، مش نسيان. لو عايز
    نفعّلهم فعليًا (مثلاً: تلميحة تفصيلية أسرع لو الفئة ضعيفة)، ده
    محتاج نقاش منفصل زي ما كان متفق عليه في مراجعة المرحلة 12.
*/

import { classifyError } from './errors.js';
import {
  recordFreeModeScenario,
  recordStepResult,
  onScenarioFinished,
  getCleanRunCount,
  hasSeenExample,
  markExampleSeen
} from './performance.js';

const STALL_THRESHOLD_MS = 45000;

const THREE_LETTER_STEP_CODES = ['FQD', 'FXP', 'TTP', 'FXB', 'DAC', 'DNA', 'FQN', 'FQR'];

const HINTS_BY_CODE = {
  AN: {
    general: 'فكر: إيه أول حاجة لازم تعمليها عشان تشوف الرحلات المتاحة؟',
    specific: 'جرب أمر ⁦AN⁩ بصيغة: يوم(رقمين) + شهر(3 حروف) + مطار المغادرة + مطار الوصول، كله لصيق من غير مسافات.'
  },
  SS: {
    general: 'دلوقتي محتاج تحجزي مقعد من السطر اللي ظهرلك في التوفر.',
    specific: 'صيغة ⁦SS⁩: رقم السطر + حرف الكلاس + عدد المقاعد، مثلاً ⁦SS1Y1⁩.'
  },
  NM: {
    general: 'محتاج تسجل اسم الراكب دلوقتي.',
    specific: 'صيغة ⁦NM⁩: ⁦NM1⁩ يليها اسم العيلة سلاش الاسم الأول، مثلاً ⁦NM1AHMED/MOHAMED MR⁩.'
  },
  AP: {
    general: 'محتاج تسجل رقم تواصل مع الراكب.',
    specific: 'صيغة ⁦AP⁩: ⁦AP⁩ يليها مسافة، كود المدينة، مسافة، رقم التليفون.'
  },
  TK: {
    general: 'محتاج تأكد ترتيب التذكرة قبل ما تقفل الحجز.',
    specific: 'الأمر المطلوب هنا هو ⁦TKOK⁩ بالظبط.'
  },
  RF: {
    general: 'محتاج تسجل مين اللي طلب الحجز ده (Received From).',
    specific: 'صيغة ⁦RF⁩: ⁦RF⁩ يليها مسافة واسمك أو اسم اللي طلب الحجز.'
  },
  ER: {
    general: 'كل العناصر لازم تكون مسجلة قبل ما تقفل الحجز خالص.',
    specific: 'الأمر المطلوب هنا هو ⁦ER⁩ بالظبط، وهيرفض لو فيه عنصر إلزامي ناقص.'
  },
  HA: {
    general: 'العميل محتاج فندق — شوف التوفر الأول.',
    specific: 'صيغة ⁦HA⁩: كود المدينة (3 حروف) + يوم(رقمين) + شهر(3 حروف)، لصيق زي ⁦AN⁩.'
  },
  HS: {
    general: 'دلوقتي احجز الفندق من السطر اللي ظهرلك.',
    specific: 'صيغة ⁦HS⁩: رقم السطر + حرف ⁦N⁩ + عدد الليالي، مثلاً ⁦HS1N3⁩.'
  },
  CA: {
    general: 'العميل محتاج سيارة — شوف التوفر الأول.',
    specific: 'صيغة ⁦CA⁩: كود المدينة (3 حروف) + يوم(رقمين) + شهر(3 حروف)، لصيق زي ⁦AN⁩.'
  },
  CS: {
    general: 'دلوقتي احجز السيارة من السطر اللي ظهرلك.',
    specific: 'صيغة ⁦CS⁩: رقم السطر + حرف ⁦D⁩ + عدد الأيام، مثلاً ⁦CS1D3⁩.'
  },
  SR: {
    general: 'العميل عنده طلب خدمة خاصة لازم تتسجل.',
    specific: 'صيغة ⁦SR⁩: ⁦SR⁩ يليها كود الخدمة من 4 حروف، مثلاً ⁦SRVGML⁩ للوجبة النباتية.'
  },
  TI: {
    general: 'العميل عايز يعرف معلومات التأشيرة قبل الحجز.',
    specific: 'صيغة ⁦TI⁩: ⁦TI⁩ يليها كود مطار الوجهة (3 حروف)، مثلاً ⁦TIDXB⁩.'
  },
  FQD: {
    general: 'العميل عايز يعرف السعر قبل ما يوافق على الحجز.',
    specific: 'صيغة ⁦FQD⁩: مطار المغادرة (3 حروف) + مطار الوصول (3 حروف)، مثلاً ⁦FQDCAIDXB⁩.'
  },
  FXP: {
    general: 'سعّر الحجز اللي حجزته فعليًا بنفس الفئة المحجوزة.',
    specific: 'الأمر ⁦FXP⁩ لوحده من غير أي إضافة — بيسعّر آخر مقعد حجزته.'
  },
  SM: {
    general: 'قبل ما تختار مقعد، شوف خريطة المقاعد الأول.',
    specific: 'الأمر ⁦SM⁩ لوحده — بيعرضلك خريطة المقاعد لنوع الطائرة اللي حجزت عليها.'
  },
  ST: {
    general: 'اختار مقعد محدد للراكب من الخريطة اللي شفتها.',
    specific: 'صيغة ⁦ST⁩: رقم الصف + حرف المقعد، مثلاً ⁦ST12A⁩.'
  },
  TTP: {
    general: 'الوقت جه تصدر التذكرة فعليًا مش بس توعد بيها.',
    specific: 'الأمر ⁦TTP⁩ لوحده — هيرفض لو ⁦TK⁩ لسه مؤجل (⁦TL⁩) أو التذكرة اتصدرت قبل كده.'
  },
  RT: {
    general: 'محتاج تسترجع حجز مقفول قبل كده باستخدام كوده.',
    specific: 'صيغة ⁦RT⁩: ⁦RT⁩ يليها كود الحجز من 6 حروف مباشرة، مثلاً ⁦RTABCDEF⁩.'
  },
  XE: {
    general: 'محتاج تلغي عنصر واحد بس من الحجز المفتوح دلوقتي.',
    specific: 'صيغة ⁦XE⁩: ⁦XE⁩ يليها رقم العنصر زي ما ظهر في الشاشة، مثلاً ⁦XE5⁩.'
  },
  ET: {
    general: 'قفل الحجز بسرعة من غير ما تشوف شاشة الاسترجاع الكاملة.',
    specific: 'الأمر ⁦ET⁩ لوحده — زي ⁦ER⁩ بالظبط في الشروط، بس برسالة مختصرة.'
  },
  RM: {
    general: 'سجل ملاحظة حرة عن الحجز ده.',
    specific: 'صيغة ⁦RM⁩: ⁦RM⁩ يليها مسافة والنص اللي عايز تسجله.'
  },
  QE: {
    general: 'حط الحجز ده في طابور متابعة.',
    specific: 'صيغة ⁦QE⁩: ⁦QE⁩ يليها رقم الطابور، مثلاً ⁦QE5⁩.'
  },
  QT: {
    general: 'شوف جدول كل الطوابير الأول.',
    specific: 'الأمر ⁦QT⁩ لوحده — بيعرضلك عدد الحجوزات في كل طابور.'
  },
  QC: {
    general: 'اتأكد من عدد الحجوزات في طابور معين.',
    specific: 'صيغة ⁦QC⁩: ⁦QC⁩ يليها رقم الطابور، مثلاً ⁦QC5⁩.'
  },
  QD: {
    general: 'احذف الحجز من الطابور مباشرة من غير تصفح.',
    specific: 'صيغة ⁦QD⁩: رقم الطابور، سلاش، كود الحجز، مثلاً ⁦QD5/ABCDEF⁩.'
  },
  DAC: {
    general: 'العميل سأل عن اسم مطار من الكود بتاعه.',
    specific: 'صيغة ⁦DAC⁩: ⁦DAC⁩ يليها كود المطار من 3 حروف، مثلاً ⁦DACCAI⁩.'
  },
  DNA: {
    general: 'العميل سأل عن اسم شركة طيران من الكود بتاعها.',
    specific: 'صيغة ⁦DNA⁩: ⁦DNA⁩ يليها كود الشركة من حرفين، مثلاً ⁦DNAMS⁩.'
  },
  IG: {
    general: 'العميل مش عايز يكمل الحجز خالص من غير أي حفظ.',
    specific: 'الأمر ⁦IG⁩ لوحده — هيمسح كل حاجة كتبتها من غير ما يسجل أي كود حجز.'
  },
};

// === إضافة المرحلة 14: تصنيف الخطورة (الأقل رقم = الأخطر) وتسمياته
// العربية لتقرير الأداء. SCENARIO_MISMATCH مش موجودة في errors.json
// (مش خطأ من محرك أماديوس، دي تصنيف داخلي من coaching.js نفسها لخطأ
// "قرار بيانات غلط"). باقي القيم متطابقة مع categoryCode الموجودة
// فعليًا في data/errors.json ===
const SEVERITY_RANK = {
  SCENARIO_MISMATCH: 1,
  MANDATORY_MISSING: 2,
  DUPLICATE_CONFLICT: 3,
  LOGICAL: 4,
  SEQUENCE: 5,
  DATA_REFERENCE: 6,
  AVAILABILITY: 7,
  FORMAT: 8,
  GENERAL: 9
};

const CATEGORY_LABELS_AR = {
  SCENARIO_MISMATCH: 'قرار بيانات غلط (نوع الأمر صح، البيانات مش المطلوبة)',
  MANDATORY_MISSING: 'عنصر إلزامي ناقص',
  DUPLICATE_CONFLICT: 'تكرار/تعارض',
  LOGICAL: 'خطأ منطقي',
  SEQUENCE: 'خطأ ترتيب/تسلسل',
  DATA_REFERENCE: 'خطأ بيانات',
  AVAILABILITY: 'خطأ توفر',
  FORMAT: 'خطأ صياغة',
  GENERAL: 'خطأ عام'
};

let scenarios = [];
let activeScenario = null;
let currentStepIndex = 0;
let lastCommandTime = null;
let mistakeCountForStep = 0;

// === تعديل المرحلة 14: بدل الـ2 boolean (coachingEnabled/
// freeModeEnabled) بقى متغير وضع واحد بأربع قيم ممكنة ===
let trainingMode = 'LEARN'; // LEARN | PRACTICE | ASSESSMENT | WORK_SIM

// === إضافة المرحلة 14: عدادات جلسة السيناريو الحالي (بتتصفّر مع كل
// بداية/نهاية سيناريو) — تغذّي تقرير الأداء النهائي ===
let sessionMistakeCount = 0;
let sessionHintsUsed = 0;
let sessionWorstCategory = null;
let sessionStartTime = null;
let sessionFirstTrySteps = 0;

export function initCoaching(scenariosData) {
  const raw = (scenariosData && scenariosData.scenarios) || [];
  // === تعديل المرحلة 14: أي خطوة نص عادي بتتحول لكائن {code} بسيط
  // من غير أي شرط — عشان سيناريوهات المراحل اللي فاتت تفضل شغالة من
  // غير أي تغيير في data/scenarios.json بتاعها ===
  scenarios = raw.map((s) => ({
    ...s,
    steps: (s.steps || []).map((step) => (typeof step === 'string' ? { code: step } : step))
  }));
}

export function isCoachingKeyword(normalized) {
  return (
    normalized === 'SCENARIOS' ||
    normalized === 'SCENARIOEXIT' ||
    normalized === 'HINT' || // === إضافة المرحلة 14 ===
    /^SCENARIO\d{1,2}$/.test(normalized) ||
    /^COACHING(ON|OFF)$/.test(normalized) ||
    /^FREEMODE(ON|OFF)$/.test(normalized) ||
    /^(LEARN|PRACTICE|ASSESSMENT|WORK)MODE$/.test(normalized) // === إضافة المرحلة 14 ===
  );
}

export function handleCoachingKeyword(normalized) {
  if (normalized === 'SCENARIOS') {
    return renderScenarioList();
  }

  if (normalized === 'SCENARIOEXIT') {
    if (!activeScenario) return 'مفيش سيناريو شغال دلوقتي.';
    return finishScenario(false);
  }

  // === إضافة المرحلة 14: أوامر الأوضاع الأربعة + الأسماء القديمة
  // كـAlias (زي ما هو متفق عليه في السبك، عشان محدش يتفاجئ لو لسه
  // متعود عليها من جلسات قديمة) ===
  if (normalized === 'LEARNMODE' || normalized === 'COACHINGON') {
    trainingMode = 'LEARN';
    return 'وضع التعلّم (Learn) اتفعل — تلميحات عامة ومفصّلة زي ما إتعودت.';
  }

  if (normalized === 'PRACTICEMODE' || normalized === 'COACHINGOFF') {
    trainingMode = 'PRACTICE';
    return 'وضع التمرين (Practice) اتفعل — مفيش تلميحات تلقائية، بس تقدر تطلب تلميحة وقت ما تحتاجها بأمر HINT.';
  }

  if (normalized === 'ASSESSMENTMODE' || normalized === 'FREEMODEON') {
    trainingMode = 'ASSESSMENT';
    return 'وضع التقييم (Assessment) اتفعل — صفر تلميحات لحد ما تقفله. اتصرف زي ما هتتصرف في اختبار حقيقي.';
  }

  if (normalized === 'FREEMODEOFF') {
    // ملحوظة: السبك مربوط أوامر الـON بالأسماء التلاتة (Learn/
    // Practice/Assessment) بس FREEMODEOFF نفسها مالهاش هدف واحد
    // واضح بين الاتنين الباقيين — قرار مني: ترجعك لوضع التعلّم
    // الافتراضي، أقرب حاجة لسلوكها القديم ("رجعت التلميحات زي ما
    // كانت").
    trainingMode = 'LEARN';
    return 'وضع التقييم اتقفل. رجعت لوضع التعلّم (Learn) الافتراضي.';
  }

  if (normalized === 'WORKMODE') {
    trainingMode = 'WORK_SIM';
    return 'وضع محاكاة الشغل (Work Simulation) اتفعل — صفر تلميحات وصفر رسائل تعليمية، هتاخد تقرير أداء احترافي كامل في الآخر.';
  }

  if (normalized === 'HINT') {
    return getManualHint();
  }

  const match = normalized.match(/^SCENARIO(\d{1,2})$/);
  if (match) {
    const id = parseInt(match[1], 10);
    const found = scenarios.find((s) => s.id === id);
    if (!found) {
      return `مفيش سيناريو بالرقم ${id}. اكتب SCENARIOS عشان تشوف القائمة.`;
    }

    // === إضافة المرحلة 14: قفل المسار الموجّه ===
    if (!isScenarioUnlocked(found)) {
      return `السيناريو ده لسه مقفول 🔒. لازم تحقق معيار الإتقان في السيناريو ${found.prerequisiteId} الأول (اكتبه بـ SCENARIO${found.prerequisiteId}).`;
    }

    // === إضافة المرحلة 14: أول فتح لسيناريو عنده مثال محلول =
    // اعرض المثال بس، من غير ما تبدأ محاولة حقيقية ===
    if (
      found.masteryRequired &&
      found.masteryRequired.cleanRunsNeeded > 0 &&
      found.exampleWalkthroughAr &&
      !hasSeenExample(id)
    ) {
      markExampleSeen(id);
      return renderExampleWalkthrough(found);
    }

    activeScenario = found;
    currentStepIndex = 0;
    mistakeCountForStep = 0;
    lastCommandTime = null;
    sessionMistakeCount = 0;
    sessionHintsUsed = 0;
    sessionWorstCategory = null;
    sessionFirstTrySteps = 0;
    sessionStartTime = Date.now();
    return renderScenarioStart(found);
  }

  return null;
}

function renderScenarioList() {
  if (scenarios.length === 0) return 'مفيش سيناريوهات محملة دلوقتي.';
  const lines = ['** السيناريوهات المتاحة **', ''];
  scenarios.forEach((s) => {
    if (isScenarioUnlocked(s)) {
      lines.push(`${s.id}. ${s.titleAr}`);
    } else {
      // === إضافة المرحلة 14: يظهر بس مقفول، بدل ما يختفي خالص ===
      lines.push(`${s.id}. 🔒 [مقفول - كمّل السيناريو ${s.prerequisiteId} الأول]  ${s.titleAr}`);
    }
  });
  lines.push('');
  lines.push('اكتب SCENARIO يليها الرقم عشان تبدأ، مثلاً SCENARIO1.');
  return lines.join('\n');
}

function renderScenarioStart(scenario) {
  const lines = [];
  lines.push(`** بدأت سيناريو: ${scenario.titleAr} **`);
  lines.push('');
  lines.push(`طلب العميل: ${scenario.customerRequestAr}`);
  if (scenario.notesAr) {
    lines.push('');
    lines.push(`ملحوظة: ${scenario.notesAr}`);
  }
  lines.push('');
  lines.push(modeStartNote());
  return lines.join('\n');
}

// === إضافة المرحلة 14 ===
function modeStartNote() {
  switch (trainingMode) {
    case 'ASSESSMENT':
      return 'Assessment شغال — هتشتغل من غير أي تلميحات. لو اتعطلت، ارجع لخبرتك بس.';
    case 'WORK_SIM':
      return 'Work Simulation شغال — صفر تلميحات وصفر رسائل تعليمية، هتاخد تقرير أداء احترافي كامل في الآخر.';
    case 'PRACTICE':
      return 'Practice شغال — مفيش تلميحات تلقائية، بس اكتب HINT وقت ما تحتاج.';
    default:
      return 'اكتب الأوامر اللي تحس إنها صح. لو اتعطلت، هوجّهك بتلميحات تدريجية.';
  }
}

// === إضافة المرحلة 14 ===
function renderExampleWalkthrough(scenario) {
  const lines = [];
  lines.push(`** مثال محلول: ${scenario.titleAr} **`);
  lines.push('');
  lines.push(scenario.exampleWalkthroughAr);
  lines.push('');
  lines.push(`لما تكون جاهز، اكتب SCENARIO${scenario.id} تاني عشان تبدأ التطبيق المستقل — المرة دي هتتحسب فعليًا كمحاولة حقيقية.`);
  return lines.join('\n');
}

// === إضافة المرحلة 14: هل السيناريو ده مفتوح؟ لو من غير
// prerequisiteId، مفتوح دايمًا. لو عنده، لازم السابق يحقق معيار
// الإتقان بتاعه هو (cleanRunsNeeded/maxHintsAllowed) ===
function isScenarioUnlocked(scenario) {
  if (!scenario.prerequisiteId) return true;
  const prereq = scenarios.find((s) => s.id === scenario.prerequisiteId);
  if (!prereq) return true; // بيانات ناقصة/prerequisiteId غلط - متمنعش الوصول عشان غلطة بيانات
  const required = (prereq.masteryRequired && prereq.masteryRequired.cleanRunsNeeded) || 1;
  const maxHints =
    prereq.masteryRequired && typeof prereq.masteryRequired.maxHintsAllowed === 'number'
      ? prereq.masteryRequired.maxHintsAllowed
      : Infinity;
  return getCleanRunCount(prereq.id, maxHints) >= required;
}

function extractCode(cmd) {
  const three = cmd.slice(0, 3);
  if (THREE_LETTER_STEP_CODES.includes(three)) return three;
  return cmd.slice(0, 2);
}

// === إضافة المرحلة 14: استخراج البيانات الفعلية من صيغة الأمر
// (مش بس نوعه) عشان تتقارن مع شروط expect* في خطوة السيناريو.
// نطاق أول نسخة: SS (رقم السطر/الكلاس/عدد المقاعد) وNM (اسم
// العيلة/الاسم الأول/اللقب) — دول اللي محتاجهم سيناريوهات 7/8/9.
// أي كود تاني بيرجّع كائن فاضي (يعني مفيش شروط expect* هتتفحص عليه). ===
function extractParams(cmd, code) {
  if (code === 'SS') {
    const shortMatch = cmd.match(/^SS(\d{1,2})([A-Z])(\d)$/);
    if (shortMatch) {
      return {
        line: parseInt(shortMatch[1], 10),
        class: shortMatch[2],
        seats: parseInt(shortMatch[3], 10)
      };
    }
    return {};
  }

  if (code === 'NM') {
    const nmMatch = cmd.match(/^NM1([A-Z]+)\/([A-Z]+)(?:\s(MR|MRS|MS|MSTR|MISS))?$/);
    if (nmMatch) {
      return {
        lastName: nmMatch[1],
        firstName: nmMatch[2],
        title: nmMatch[3] || null
      };
    }
    return {};
  }

  return {};
}

// === إضافة المرحلة 14: بتقارن كل مفتاح expectXxx في خطوة السيناريو
// مع القيمة المستخرجة المقابلة من الأمر. الاسم بيتحول تلقائيًا:
// expectLine -> line, expectLastName -> lastName، إلخ — عشان أي
// شرط expect* جديد يتضاف في scenarios.json من غير أي تعديل كود هنا. ===
function conditionsMatch(step, params) {
  for (const key of Object.keys(step)) {
    if (!key.startsWith('expect')) continue;
    const paramKey = key.charAt(6).toLowerCase() + key.slice(7);
    if (String(params[paramKey]) !== String(step[key])) {
      return false;
    }
  }
  return true;
}

// === إضافة المرحلة 14 ===
function updateWorstCategory(category) {
  if (!category || !(category in SEVERITY_RANK)) return;
  if (!sessionWorstCategory || SEVERITY_RANK[category] < SEVERITY_RANK[sessionWorstCategory]) {
    sessionWorstCategory = category;
  }
}

// === إضافة المرحلة 14 ===
function getManualHint() {
  if (trainingMode !== 'PRACTICE') {
    return 'التلميحات بالطلب متاحة في وضع التمرين (Practice) بس. اكتب PRACTICEMODE لو عايز تفعّلها.';
  }
  if (!activeScenario) {
    return 'مفيش سيناريو شغال دلوقتي عشان أديك تلميحة عليه.';
  }
  const expectedStep = activeScenario.steps[currentStepIndex];
  if (!expectedStep) return null;
  const hints = HINTS_BY_CODE[expectedStep.code];
  if (!hints) return 'مفيش تلميحة متاحة للخطوة دي.';
  sessionHintsUsed += 1;
  return mistakeCountForStep >= 2 ? `🎯 ${hints.specific}` : hints.general;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// === إضافة المرحلة 14: تقرير Work Simulation الاحترافي ===
function buildWorkSimReport(titleAr, accuracyPct, mistakes, worstCategory, elapsedMs) {
  const worstLabel = worstCategory ? CATEGORY_LABELS_AR[worstCategory] || worstCategory : 'مفيش';
  return [
    '',
    '------ تقرير الأداء (Work Simulation) ------',
    `المهمة: ${titleAr}`,
    `نسبة الدقة: ${accuracyPct}% من أول محاولة`,
    `عدد الأخطاء الكلي: ${mistakes}`,
    `أخطر خطأ: ${worstLabel}`,
    `الوقت المستغرق: ${formatDuration(elapsedMs)}`,
    '---------------------------------------------'
  ];
}

// === إضافة المرحلة 14: نقطة نهاية موحّدة لأي سيناريو بيخلص —
// سواء بالاكتمال الطبيعي أو بـSCENARIOEXIT. بتغذّي performance.js
// وبترجع رسالة مناسبة لوضع التدريب الحالي ===
function finishScenario(completed) {
  const scenario = activeScenario;
  const mode = trainingMode;
  const mistakes = sessionMistakeCount;
  const hintsUsed = sessionHintsUsed;
  const elapsedMs = sessionStartTime ? Date.now() - sessionStartTime : 0;
  const worstCategory = sessionWorstCategory;
  const totalSteps = scenario.steps.length;
  const firstTrySteps = sessionFirstTrySteps;
  const accuracyPct = totalSteps > 0 ? Math.round((firstTrySteps / totalSteps) * 100) : 0;

  onScenarioFinished(scenario.id, { mistakes, completed, hintsUsed });
  if (mode === 'ASSESSMENT') {
    // === نفس نداء المرحلة 12 بالظبط، بس دلوقتي بيتنادى من الوضع
    // الجديد ASSESSMENT بدل freeModeEnabled — صفر تغيير في سلوك
    // performance.js نفسها ===
    recordFreeModeScenario(scenario.id, { mistakes, completed });
  }

  activeScenario = null;
  currentStepIndex = 0;
  mistakeCountForStep = 0;
  sessionMistakeCount = 0;
  sessionHintsUsed = 0;
  sessionWorstCategory = null;
  sessionStartTime = null;
  sessionFirstTrySteps = 0;

  if (mode === 'WORK_SIM') {
    return buildWorkSimReport(scenario.titleAr, accuracyPct, mistakes, worstCategory, elapsedMs);
  }

  if (mode === 'ASSESSMENT') {
    return [
      '',
      completed
        ? `🎉 خلصت سيناريو "${scenario.titleAr}"! (Assessment)`
        : `خرجت من سيناريو "${scenario.titleAr}" قبل الاكتمال. (Assessment)`,
      `نسبة الدقة: ${accuracyPct}% من أول محاولة`,
      'الأداء ده اتسجل كتقييم نهائي من غير أي مساعدة.'
    ];
  }

  if (mode === 'PRACTICE' && completed) {
    return [
      '',
      `🎉 خلصت سيناريو "${scenario.titleAr}" بنجاح!`,
      `ملخص: ${accuracyPct}% من أول محاولة، ${mistakes} خطأ إجمالاً.`,
      'اكتب SCENARIOS عشان تختار سيناريو تاني.'
    ];
  }

  // LEARN (الافتراضي)، أو خروج مبكر في PRACTICE
  return [
    '',
    completed ? `🎉 خلصت سيناريو "${scenario.titleAr}" بنجاح!` : `خرجت من سيناريو "${scenario.titleAr}".`,
    completed ? 'اكتب SCENARIOS عشان تختار سيناريو تاني.' : ''
  ].filter(Boolean);
}

export function onCommandProcessed(normalized, rawResponse) {
  if (!activeScenario) return null;

  const now = Date.now();
  const stalled =
    trainingMode === 'LEARN' && lastCommandTime !== null && now - lastCommandTime > STALL_THRESHOLD_MS;
  lastCommandTime = now;

  const expectedStep = activeScenario.steps[currentStepIndex];
  if (!expectedStep) return null;

  const actualCode = extractCode(normalized);
  const errorCategory = classifyError(rawResponse);
  const isKnownFailure = errorCategory !== null || rawResponse === 'UNKNOWN COMMAND' || rawResponse === 'FORMAT';

  const codeMatches = actualCode === expectedStep.code && !isKnownFailure;
  // === إضافة المرحلة 14: التصحيح الحقيقي — نوع الأمر لوحده مش كفاية ===
  const conditionsOk = codeMatches ? conditionsMatch(expectedStep, extractParams(normalized, actualCode)) : false;

  if (codeMatches && conditionsOk) {
    const wasFirstTry = mistakeCountForStep === 0;
    if (wasFirstTry) sessionFirstTrySteps += 1;
    recordStepResult(null, wasFirstTry); // === إضافة المرحلة 14: تفعيل حقيقي ===

    currentStepIndex += 1;
    mistakeCountForStep = 0;

    if (currentStepIndex >= activeScenario.steps.length) {
      return finishScenario(true);
    }
    return null;
  }

  // === فشل: إما نوع الأمر غلط/النظام رفضه برسالة خطأ معروفة، أو
  // نوع الأمر صح بس البيانات مش المطلوبة (SCENARIO_MISMATCH) ===
  sessionMistakeCount += 1;
  mistakeCountForStep += 1;

  const failureCategory = codeMatches
    ? 'SCENARIO_MISMATCH'
    : errorCategory || (rawResponse === 'UNKNOWN COMMAND' ? 'GENERAL' : rawResponse === 'FORMAT' ? 'FORMAT' : null);

  if (failureCategory) {
    recordStepResult(failureCategory, false); // === إضافة المرحلة 14: تفعيل حقيقي ===
    updateWorstCategory(failureCategory);
  }

  // === إضافة المرحلة 14: صفر تلميحات تلقائية في ASSESSMENT وWORK_SIM ===
  if (trainingMode === 'ASSESSMENT' || trainingMode === 'WORK_SIM') {
    return null;
  }

  // === إضافة المرحلة 14: صمت تلقائي في PRACTICE — التلميحة بس عبر HINT ===
  if (trainingMode === 'PRACTICE') {
    return null;
  }

  // LEARN: تلميحة تلقائية زي القديم، مع تلميحة مخصصة لو الخطأ كان
  // "قرار بيانات غلط" ومحدد لها mismatchHintAr في السيناريو
  const lines = [''];
  if (stalled) {
    lines.push('⏳ لاحظت وقفة طويلة — خد وقتك بس لو محتاج مساعدة، دي تلميحة:');
  } else {
    lines.push('💡 تلميحة:');
  }

  if (codeMatches && !conditionsOk && expectedStep.mismatchHintAr) {
    lines.push(`🎯 ${expectedStep.mismatchHintAr}`);
    sessionHintsUsed += 1;
    return lines;
  }

  const hints = HINTS_BY_CODE[expectedStep.code];
  if (!hints) return null;

  lines.push(mistakeCountForStep >= 2 ? `🎯 ${hints.specific}` : hints.general);
  sessionHintsUsed += 1;
  return lines;
}