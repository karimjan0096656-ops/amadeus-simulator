/*
  pricing.js — محرك حساب الأسعار والضرائب وحد الأمتعة (المرحلة 6)

  فصل المسؤوليات بنفس روح pnr.js بالظبط: parser.js هو اللي بيتحقق من
  صياغة الأمر وكود المطارات ويستدعي الدوال هنا، والدوال هنا بترجع
  بيانات جاهزة (كائنات JS) مش نصوص معروضة على الشاشة — تنسيق الشاشة
  شغل parser.js زي ما هو بالظبط في handleAN (نفس النمط الموجود بالفعل
  في الكود، مفيش نمط جديد اتلخترع هنا).

  ⚠ ملحوظة مهمة لازم Malik ياخد باله منها (زي ملاحظات parser.js/pnr.js/
  errors.js في المراحل اللي فاتت):
  initPricing(data) المفروض تتنادى من main.js بعد تحميل data/fares.json.
  سبك المرحلة 6 (قسم 5) قال إن "main.js مفيش أي تعديل متوقع فيه" — ده
  مش دقيق: من غير إضافة fetch لـ data/fares.json ونداء initPricing()
  في main.js، هتفضل faresData هنا فاضية للأبد، وأي أمر FQD أو FXP هيرجع
  "مفيش أسعار" حتى لو المسار موجود فعلًا في fares.json. عشان كده اتعمل
  تعديل صغير وضروري في main.js (إضافة بس، مفيش حذف) — راجع main.js
  وشوف تعليق المرحلة 6 هناك.
*/

let faresData = [];

export function initPricing(data) {
  faresData = Array.isArray(data) ? data : [];
}

function findRoute(origin, destination) {
  return faresData.find((r) => r.origin === origin && r.destination === destination) || null;
}

function sumTaxes(taxes) {
  return taxes.reduce((sum, t) => sum + t.amount, 0);
}

// بترجع كل فئات الحجز على مسار معين، مرتبة من الأرخص للأغلى (Best Buy).
// بترجع null لو المسار مش موجود خالص في fares.json.
export function getFareQuote(origin, destination) {
  const route = findRoute(origin, destination);
  if (!route) return null;

  const sortedFares = [...route.fares].sort((a, b) => a.baseFare - b.baseFare);
  const totalTaxes = sumTaxes(route.taxes);

  return {
    origin: route.origin,
    destination: route.destination,
    currency: route.currency,
    fares: sortedFares,
    taxes: route.taxes,
    totalTaxes
  };
}

// بترجع سعر فئة حجز واحدة بالظبط على مسار معين (مستخدمة في FXP بعد
// ما يبقى فيه Segment محجوز فعلًا بفئة معينة). بترجع null لو المسار
// مش موجود، أو الفئة دي بالذات مش متسعّرة على المسار ده.
export function getFareForBookingClass(origin, destination, bookingClass) {
  const route = findRoute(origin, destination);
  if (!route) return null;

  const fare = route.fares.find((f) => f.bookingClass === bookingClass);
  if (!fare) return null;

  const totalTaxes = sumTaxes(route.taxes);

  return {
    bookingClass: fare.bookingClass,
    fareBasis: fare.fareBasis,
    baseFare: fare.baseFare,
    baggageAllowance: fare.baggageAllowance,
    currency: route.currency,
    taxes: route.taxes,
    totalTaxes,
    total: fare.baseFare + totalTaxes
  };
}
