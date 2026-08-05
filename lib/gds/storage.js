/*
  storage.js — طبقة التعامل مع localStorage (المرحلة 10)

  القرار: اتاخد مع Malik إن الأفضل إحصائيات الأداء تتحفظ بين
  الجلسات (Option 1) مش Session-only، لأن:
  - PROJECT.md قسم 3 أصلًا حدد localStorage كجزء من الـ Tech Stack،
    وقسم 4 حاجز مكان الملف ده من البداية.
  - هدف "التكيف مع الأداء" بيضعف لو الإحصائيات بتتصفر كل Refresh،
    لأن التمرين الحقيقي بيحصل على جلسات متفرقة مش قعدة واحدة.

  الغرض: تخزين إحصائيات أداء بسيطة فقط — أرقام وتصنيفات (عدد
  الأخطاء حسب النوع، عدد السيناريوهات المكتملة، تاريخ مختصر
  للسيناريوهات...). مفيش أي بيانات حساسة أو شخصية بتتخزن هنا خالص.

  الملف ده طبقة معزولة بالكامل عن باقي المشروع — أي ملف تاني (زي
  performance.js) بيتعامل معاه من غير ما يعرف تفاصيل localStorage
  نفسها. لو حبينا نغير مكان التخزين مستقبلًا هيبقى تغيير هنا بس.

  لو localStorage مش متاح لأي سبب (Private Mode، أو المتصفح رافض،
  أو القرص ممتلئ) — بيرجع لسلوك in-memory بصمت من غير ما يكسر أي
  حاجة في الواجهة. ده معناه إن الإحصائيات هتشتغل عادي جوه نفس
  الجلسة، وبس مش هتتحفظ بعد Refresh في الحالة دي.
*/

const STORAGE_KEY = 'amadeus-sim-performance-v1';

let memoryFallback = null;
let storageAvailable = false;

function detectStorageAvailability() {
  try {
    const testKey = '__amadeus_sim_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// بيتفحص مرة واحدة عند تحميل الملف. لو window أو localStorage مش
// موجودين أصلًا (بيئة اختبار مثلًا) بيرجع false بأمان.
storageAvailable = typeof window !== 'undefined' && detectStorageAvailability();

export function loadStats() {
  if (!storageAvailable) return memoryFallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return memoryFallback;
  }
}

export function saveStats(statsObject) {
  memoryFallback = statsObject; // نسخة احتياطية في الذاكرة دايمًا
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(statsObject));
  } catch (e) {
    // القرص ممتلئ أو المتصفح رفض الكتابة — نتجاهل بصمت، البيانات
    // بتفضل متاحة في الذاكرة لباقي الجلسة الحالية بس مش هتتحفظ.
  }
}

export function clearStats() {
  memoryFallback = null;
  if (!storageAvailable) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // تجاهل
  }
}
