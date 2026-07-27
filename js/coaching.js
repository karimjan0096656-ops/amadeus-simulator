/*
  coaching.js — الإرشاد التدريجي وشخصيات العملاء (المرحلة 9)

  فكرة التصميم: الـ Coaching طبقة "جنب" المحرك مش "بدل" المحرك.
  أوامر السيناريو (AN, SS, NM...) بتتبعت لـ parseCommand() في
  parser.js زي أي أمر عادي وبتاخد نفس الرد الحقيقي بالظبط — الملف ده
  بس بيراقب وبيضيف تلميحات فوق الرد، من غير ما يلمس parser.js أو
  pnr.js أو errors.js خالص.

  مفيش localStorage هنا (زي errors.js بالظبط) — كل حالة السيناريو
  والتلميحات session-only، بترجع فاضية لو الصفحة اتعمل لها Refresh.
  ده قرار متعمد يطابق نفس منطق mistakeLog في errors.js، ومفيش
  storage.js في المشروع أصلًا يتبنى عليه حاجة تانية.

  الأوامر الجديدة اللي الملف ده بيتعرف عليها (بتتفحص في main.js
  قبل ما توصل لـ parseCommand، بنفس أسلوب LEVELTEST بالظبط):
    SCENARIOS       -> عرض قائمة السيناريوهات
    SCENARIO<رقم>   -> بدء سيناريو معين (مثلاً SCENARIO1)
    SCENARIOEXIT    -> الخروج من السيناريو الحالي
    COACHINGON      -> تفعيل التلميحات (الوضع الافتراضي)
    COACHINGOFF     -> تعطيل التلميحات مؤقتًا
*/

import { classifyError } from './errors.js';

const STALL_THRESHOLD_MS = 45000; // 45 ثانية توقف = "وقفة طويلة"

// تلميحات موحّدة لكل كود أمر — عامة الأول، وأدق لو الغلط اتكرر
const HINTS_BY_CODE = {
  AN: {
    general: 'فكر: إيه أول حاجة لازم تعمليها عشان تشوف الرحلات المتاحة؟',
    specific: 'جرب أمر AN بصيغة: يوم(رقمين) + شهر(3 حروف) + مطار المغادرة + مطار الوصول، كله لصيق من غير مسافات.'
  },
  SS: {
    general: 'دلوقتي محتاج تحجز مقعد من السطر اللي ظهرلك في التوفر.',
    specific: 'صيغة SS: رقم السطر + حرف الكلاس + عدد المقاعد، مثلاً SS1Y1.'
  },
  NM: {
    general: 'محتاج تسجل اسم الراكب دلوقتي.',
    specific: 'صيغة NM: NM1 يليها اسم العيلة سلاش الاسم الأول، مثلاً NM1AHMED/MOHAMED MR.'
  },
  AP: {
    general: 'محتاج تسجل رقم تواصل مع الراكب.',
    specific: 'صيغة AP: AP يليها مسافة، كود المدينة، مسافة، رقم التليفون.'
  },
  TK: {
    general: 'محتاج تأكد ترتيب التذكرة قبل ما تقفل الحجز.',
    specific: 'الأمر المطلوب هنا هو TKOK بالظبط.'
  },
  RF: {
    general: 'محتاج تسجل مين اللي طلب الحجز ده (Received From).',
    specific: 'صيغة RF: RF يليها مسافة واسمك أو اسم اللي طلب الحجز.'
  },
  ER: {
    general: 'كل العناصر لازم تكون مسجلة قبل ما تقفل الحجز خالص.',
    specific: 'الأمر المطلوب هنا هو ER بالظبط، وهيرفض لو فيه عنصر إلزامي ناقص.'
  },
  HA: {
    general: 'العميل محتاج فندق — شوف التوفر الأول.',
    specific: 'صيغة HA: كود المدينة (3 حروف) + يوم(رقمين) + شهر(3 حروف)، لصيق زي AN.'
  },
  HS: {
    general: 'دلوقتي احجز الفندق من السطر اللي ظهرلك.',
    specific: 'صيغة HS: رقم السطر + حرف N + عدد الليالي، مثلاً HS1N3.'
  },
  CA: {
    general: 'العميل محتاج سيارة — شوف التوفر الأول.',
    specific: 'صيغة CA: كود المدينة (3 حروف) + يوم(رقمين) + شهر(3 حروف)، لصيق زي AN.'
  },
  CS: {
    general: 'دلوقتي احجز السيارة من السطر اللي ظهرلك.',
    specific: 'صيغة CS: رقم السطر + حرف D + عدد الأيام، مثلاً CS1D3.'
  },
  SR: {
    general: 'العميل عنده طلب خدمة خاصة لازم تتسجل.',
    specific: 'صيغة SR: SR يليها كود الخدمة من 4 حروف، مثلاً SRVGML للوجبة النباتية.'
  },
  TI: {
    general: 'العميل عايز يعرف معلومات التأشيرة قبل الحجز.',
    specific: 'صيغة TI: TI يليها كود مطار الوجهة (3 حروف)، مثلاً TIDXB.'
  }
};

let scenarios = [];
let activeScenario = null;
let currentStepIndex = 0;
let coachingEnabled = true;
let lastCommandTime = null;
let mistakeCountForStep = 0;

export function initCoaching(scenariosData) {
  scenarios = (scenariosData && scenariosData.scenarios) || [];
}

export function isCoachingKeyword(normalized) {
  return (
    normalized === 'SCENARIOS' ||
    normalized === 'SCENARIOEXIT' ||
    /^SCENARIO\d{1,2}$/.test(normalized) ||
    /^COACHING(ON|OFF)$/.test(normalized)
  );
}

export function handleCoachingKeyword(normalized) {
  if (normalized === 'SCENARIOS') {
    return renderScenarioList();
  }

  if (normalized === 'SCENARIOEXIT') {
    if (!activeScenario) return 'مفيش سيناريو شغال دلوقتي.';
    activeScenario = null;
    currentStepIndex = 0;
    mistakeCountForStep = 0;
    return 'خرجت من السيناريو. اكتب SCENARIOS عشان تختار واحد جديد.';
  }

  if (normalized === 'COACHINGON') {
    coachingEnabled = true;
    return 'تلميحات الإرشاد اتفعلت.';
  }

  if (normalized === 'COACHINGOFF') {
    coachingEnabled = false;
    return 'تلميحات الإرشاد اتوقفت مؤقتًا.';
  }

  const match = normalized.match(/^SCENARIO(\d{1,2})$/);
  if (match) {
    const id = parseInt(match[1], 10);
    const found = scenarios.find((s) => s.id === id);
    if (!found) {
      return `مفيش سيناريو بالرقم ${id}. اكتب SCENARIOS عشان تشوف القائمة.`;
    }
    activeScenario = found;
    currentStepIndex = 0;
    mistakeCountForStep = 0;
    lastCommandTime = null;
    return renderScenarioStart(found);
  }

  return null;
}

function renderScenarioList() {
  if (scenarios.length === 0) return 'مفيش سيناريوهات محملة دلوقتي.';
  const lines = ['** السيناريوهات المتاحة **', ''];
  scenarios.forEach((s) => {
    lines.push(`${s.id}. ${s.titleAr}`);
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
  lines.push('اكتب الأوامر اللي تحس إنها صح. لو اتعطلت، هوجّهك بتلميحات تدريجية.');
  return lines.join('\n');
}

function extractCode(cmd) {
  const three = cmd.slice(0, 3);
  if (three === 'FQD' || three === 'FXP') return three;
  return cmd.slice(0, 2);
}

// نقطة الاستدعاء الوحيدة من main.js بعد أي أمر عادي (isRegularCommand)
export function onCommandProcessed(normalized, rawResponse) {
  if (!activeScenario) return null;

  const now = Date.now();
  const stalled = lastCommandTime !== null && now - lastCommandTime > STALL_THRESHOLD_MS;
  lastCommandTime = now;

  const expectedCode = activeScenario.steps[currentStepIndex];
  if (!expectedCode) return null; // السيناريو خلص بالفعل

  const actualCode = extractCode(normalized);
  const errorCategory = classifyError(rawResponse);
  const isKnownFailure = errorCategory !== null || rawResponse === 'UNKNOWN COMMAND' || rawResponse === 'FORMAT';

  if (actualCode === expectedCode && !isKnownFailure) {
    currentStepIndex += 1;
    mistakeCountForStep = 0;

    if (currentStepIndex >= activeScenario.steps.length) {
      const doneTitle = activeScenario.titleAr;
      activeScenario = null;
      currentStepIndex = 0;
      return [
        '',
        `🎉 خلصت سيناريو "${doneTitle}" بنجاح!`,
        'اكتب SCENARIOS عشان تختار سيناريو تاني.'
      ];
    }

    return null; // خطوة صح، من غير تلميح — يكمل عادي
  }

  if (!coachingEnabled) return null;

  mistakeCountForStep += 1;
  const hints = HINTS_BY_CODE[expectedCode];
  if (!hints) return null;

  const lines = [''];
  if (stalled) {
    lines.push('⏳ لاحظت وقفة طويلة — خد وقتك بس لو محتاج مساعدة، دي تلميحة:');
  } else {
    lines.push('💡 تلميحة:');
  }

  lines.push(mistakeCountForStep >= 2 ? `🎯 ${hints.specific}` : hints.general);

  return lines;
}
