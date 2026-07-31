import { classifyError } from './errors.js';
import { recordFreeModeScenario } from './performance.js';

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

let scenarios = [];
let activeScenario = null;
let currentStepIndex = 0;
let coachingEnabled = true;
let lastCommandTime = null;
let mistakeCountForStep = 0;

let freeModeEnabled = false;
let freeModeMistakeCount = 0;

export function initCoaching(scenariosData) {
  scenarios = (scenariosData && scenariosData.scenarios) || [];
}

export function isCoachingKeyword(normalized) {
  return (
    normalized === 'SCENARIOS' ||
    normalized === 'SCENARIOEXIT' ||
    /^SCENARIO\d{1,2}$/.test(normalized) ||
    /^COACHING(ON|OFF)$/.test(normalized) ||
    /^FREEMODE(ON|OFF)$/.test(normalized)
  );
}

export function handleCoachingKeyword(normalized) {
  if (normalized === 'SCENARIOS') {
    return renderScenarioList();
  }

  if (normalized === 'SCENARIOEXIT') {
    if (!activeScenario) return 'مفيش سيناريو شغال دلوقتي.';
    if (freeModeEnabled) {
      recordFreeModeScenario(activeScenario.id, { mistakes: freeModeMistakeCount, completed: false });
      freeModeMistakeCount = 0;
    }
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

  if (normalized === 'FREEMODEON') {
    freeModeEnabled = true;
    freeModeMistakeCount = 0;
    return 'Free Mode اتفعل — من دلوقتي مفيش أي تلميحات أو مساعدة لحد ما تقفله بـFREEMODEOFF. اتصرف زي ما هتتصرف في شغل حقيقي.';
  }

  if (normalized === 'FREEMODEOFF') {
    freeModeEnabled = false;
    return 'Free Mode اتقفل. التلميحات رجعت زي ما كانت.';
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
  lines.push(
    freeModeEnabled
      ? 'Free Mode شغال — هتشتغل من غير أي تلميحات. لو اتعطلت، ارجع لخبرتك بس.'
      : 'اكتب الأوامر اللي تحس إنها صح. لو اتعطلت، هوجّهك بتلميحات تدريجية.'
  );
  return lines.join('\n');
}

function extractCode(cmd) {
  const three = cmd.slice(0, 3);
  if (THREE_LETTER_STEP_CODES.includes(three)) return three;
  return cmd.slice(0, 2);
}

export function onCommandProcessed(normalized, rawResponse) {
  if (!activeScenario) return null;

  const now = Date.now();
  const stalled = !freeModeEnabled && lastCommandTime !== null && now - lastCommandTime > STALL_THRESHOLD_MS;
  lastCommandTime = now;

  const expectedCode = activeScenario.steps[currentStepIndex];
  if (!expectedCode) return null;

  const actualCode = extractCode(normalized);
  const errorCategory = classifyError(rawResponse);
  const isKnownFailure = errorCategory !== null || rawResponse === 'UNKNOWN COMMAND' || rawResponse === 'FORMAT';

  if (actualCode === expectedCode && !isKnownFailure) {
    currentStepIndex += 1;
    mistakeCountForStep = 0;

    if (currentStepIndex >= activeScenario.steps.length) {
      const doneTitle = activeScenario.titleAr;
      const scenarioId = activeScenario.id;
      const totalMistakes = freeModeMistakeCount;
      activeScenario = null;
      currentStepIndex = 0;

      if (freeModeEnabled) {
        recordFreeModeScenario(scenarioId, { mistakes: totalMistakes, completed: true });
        freeModeMistakeCount = 0;
      }

      return [
        '',
        `🎉 خلصت سيناريو "${doneTitle}" بنجاح!`,
        freeModeEnabled
          ? '(Free Mode) الأداء ده اتسجل كتقييم نهائي من غير أي مساعدة.'
          : 'اكتب SCENARIOS عشان تختار سيناريو تاني.'
      ];
    }

    return null;
  }

  if (freeModeEnabled) {
    freeModeMistakeCount += 1;
    return null;
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
