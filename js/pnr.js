/*
  pnr.js — إدارة حالة الـ PNR الحالي (المرحلة 2: المحرك الأساسي)

  يصدّر بالظبط الدوال المطلوبة في الـ Spec (قسم 6):
  sellSegment, addName, addContact, addTicketingArrangement,
  addReceivedFrom, endAndRetrieve, resetPNR

  كل دالة بترجع شكل موحّد: { success: boolean, message: string }

  ملحوظة تنفيذ واحدة عن sellSegment (مش موجودة حرفيًا في الـ Spec):
  الدالة بتاخد lineNumber (زي ما هو منصوص) + كائن الرحلة الكامل (flight)
  بدل ما تدور عليه بنفسها، لأن parser.js هو المسؤول عن قراءة flights.json
  والتحقق من رقم السطر مقابل آخر عرض AN (قسم 7 من الـ Spec: "بعد النجاح
  بتنادي الدالة المناسبة من pnr.js"). فصل المسؤوليات ده يخلي pnr.js
  مايحتاجش يوصل لبيانات مرجعية أصلاً، شغله بس إدارة حالة الحجز.

  ملحوظة تانية: تمت إضافة export لدالة getCurrentPNR() (مش في القائمة
  الأصلية) عشان parser.js يقدر يقرأ حالة الـ PNR الحالية (مثلاً: هل
  فيه اسم متسجل بالفعل؟ هل فيه Segment محجوز؟) قبل ما يستدعي دوال
  الإضافة، ده ضروري لتطبيق قيود "المرحلة دي بس" (اسم واحد، Segment واحد)
  المذكورة في قسم 4.2 و4.3.

  === إضافة المرحلة 7 (الخدمات الإضافية: فنادق/سيارات/SSR) ===
  ⚠ ملحوظة مهمة: من المرحلة 2 لحد المرحلة 6، القاعدة كانت "متلمسش
  pnr.js خالص" — كل المراحل اللي فاتت (leveltest, errors, pricing)
  كانت بس بتضيف ملفات جديدة بتنادي الدوال المُصدَّرة من هنا من غير
  ما تلمس الملف نفسه. المرحلة 7 مختلفة عمدًا (قرار موثّق في سبك
  المرحلة نفسه، قسم 4 "الخيار أ"): الفنادق والسيارات وSSR في أماديوس
  الحقيقي بتتحط جوه نفس الـ PNR بتاع الراكب (بتظهر في نفس شاشة
  استرجاع الحجز النهائية)، مش في مكان منفصل — فالتعديل هنا حقيقي
  ومقصود، مش مجرد إضافة ملف جديد بره.

  الالتزام اللي اتحافظ عليه بدقة: كل الشيكات الإلزامية الموجودة
  بالفعل في endAndRetrieve() (segments/name/contact/ticketing/
  receivedFrom) فضلت زي ما هي حرفيًا من غير أي تغيير — مفيش سطر
  واحد اتلغى أو اتعدّل من المنطق ده. الفنادق والسيارات وSSR عناصر
  اختيارية بالكامل (مفيش أي شيك إلزامي جديد ليها)، فبيتم عرضها بس
  (لو موجودة) بعد العناصر الخمسة الإلزامية، قبل خط الإغلاق مباشرة.
  تم تشغيل اختبار انحدار كامل على الأوامر السبعة الأصلية + FQD/FXP
  بعد التعديل ده للتأكد إن حاجة ماتبوظتش (تفاصيل الاختبار في تقرير
  التسليم).
*/

function emptyPNR() {
  return {
    segments: [],
    name: null,
    contact: null,
    ticketingArrangement: null,
    receivedFrom: null,
    recordLocator: null,
    // === إضافة المرحلة 7 — عناصر اختيارية، مفيش أي شيك إلزامي عليها ===
    hotels: [],
    cars: [],
    ssrs: []
  };
}

let pnr = emptyPNR();

export function sellSegment(lineNumber, flight, bookingClass, seats) {
  // خط دفاع احتياطي (parser.js المفروض يمنع الاستدعاء ده أصلاً لو فيه Segment موجود)
  if (pnr.segments.length > 0) {
    return {
      success: false,
      message: 'MULTIPLE SEGMENTS NOT SUPPORTED YET (PHASE 2 LIMIT)'
    };
  }

  const segment = {
    flightId: flight.flightId,
    airlineCode: flight.airlineCode,
    flightNumber: flight.flightNumber,
    bookingClass,
    origin: flight.origin,
    destination: flight.destination,
    departureDate: flight.departureDate,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    seats,
    status: 'HK'
  };

  pnr.segments.push(segment);

  const message =
    `${lineNumber}  ${flight.airlineCode} ${flight.flightNumber} ${bookingClass}  ` +
    `${flight.departureDate}  ${flight.origin} ${flight.destination}  HK${seats}  ` +
    `${flight.departureTime} ${flight.arrivalTime}`;

  return { success: true, message };
}

export function addName(lastName, firstName, title) {
  // خط دفاع احتياطي (parser.js المفروض يتحقق من ده الأول)
  if (pnr.name !== null) {
    return {
      success: false,
      message: 'MULTIPLE PASSENGERS NOT SUPPORTED YET (PHASE 2 LIMIT)'
    };
  }

  pnr.name = { lastName, firstName, title: title || '' };

  const titlePart = pnr.name.title ? ` ${pnr.name.title}` : '';
  return { success: true, message: `1. ${lastName}/${firstName}${titlePart}` };
}

export function addContact(cityCode, phone) {
  pnr.contact = { cityCode, phone };
  return { success: true, message: `2. AP ${cityCode} ${phone}` };
}

export function addTicketingArrangement() {
  pnr.ticketingArrangement = 'OK';
  return { success: true, message: '3. TK OK' };
}

export function addReceivedFrom(name) {
  pnr.receivedFrom = name;
  return { success: true, message: `4. RF ${name}` };
}

// === إضافة المرحلة 7: فنادق/سيارات/SSR ===
// الثلاثة دول بنفس نمط sellSegment/addName بالظبط: بترجع
// { success, message }، وبتخزن العنصر في مصفوفة مخصصة جوه الـ PNR.
// parser.js هو المسؤول عن بناء كائن hotel/car الجاهز بكل الحقول
// المطلوبة (زي ما هو مسؤول فعلاً عن قراءة flights.json والتحقق من
// رقم السطر في sellSegment) — نفس فصل المسؤوليات المذكور فوق تمامًا.

export function addHotelSegment(hotel) {
  pnr.hotels.push(hotel);

  const message =
    `HTL ${hotel.chainCode} ${hotel.hotelName}  ${hotel.roomType}  ` +
    `${hotel.checkInDate}-${hotel.checkOutDate}  HK1  ` +
    `TTL ${hotel.total} ${hotel.currency}`;

  return { success: true, message };
}

export function addCarSegment(car) {
  pnr.cars.push(car);

  const message =
    `CAR ${car.companyCode} ${car.companyName}  ${car.carType}  ` +
    `${car.pickupDate}-${car.dropoffDate}  HK1  ` +
    `TTL ${car.total} ${car.currency}`;

  return { success: true, message };
}

// بتاخد الكود بس (زي ما هو منصوص في سبك المرحلة 7 قسم 4) — مفيش
// حاجة تانية مطلوبة هنا لأن الـ PNR بيدعم راكب واحد بس (قيد المرحلة
// 2)، فمفيش داعي لباراميتر ربط بالراكب زي /P1 الحقيقي. الوصف
// بالعربي (لعرضه فورًا كرد على الأمر) بيتجاب من data/ssr.json في
// parser.js نفسه وقت التحقق من الكود، مش هنا — نفس أسلوب باقي
// الدوال هنا (بترجع رسالة بسيطة من غير ما تحتاج توصل لبيانات مرجعية).
export function addSSR(code) {
  pnr.ssrs.push({ code, status: 'HK' });
  return { success: true, message: `SSR ${code} HK1` };
}

function generateRecordLocator() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

export function endAndRetrieve() {
  // === بداية المنطق الإلزامي الأصلي (المرحلة 2) — زي ما هو بالظبط، غير متلموس ===
  if (pnr.segments.length === 0) {
    return { success: false, message: 'NO ITINERARY SEGMENTS' };
  }
  if (pnr.name === null) {
    return { success: false, message: 'PNR EMPTY - NEED NAME' };
  }
  if (pnr.contact === null) {
    return { success: false, message: 'NEED CONTACT ELEMENT AP' };
  }
  if (pnr.ticketingArrangement === null) {
    return { success: false, message: 'NEED TICKETING ARRANGEMENT TK' };
  }
  if (pnr.receivedFrom === null) {
    return { success: false, message: 'NEED RECEIVED FROM RF' };
  }

  const recordLocator = generateRecordLocator();
  const seg = pnr.segments[0];
  const titlePart = pnr.name.title ? ` ${pnr.name.title}` : '';

  const nameLine = `1. ${pnr.name.lastName}/${pnr.name.firstName}${titlePart}`;
  const segLine =
    `2. ${seg.airlineCode} ${seg.flightNumber} ${seg.bookingClass} ${seg.departureDate} ` +
    `${seg.origin}${seg.destination} HK${seg.seats} ${seg.departureTime} ${seg.arrivalTime}`;
  const apLine = `3. AP ${pnr.contact.cityCode} ${pnr.contact.phone}`;
  const tkLine = `4. TK OK`;
  const rfLine = `5. RF ${pnr.receivedFrom}`;
  // === نهاية المنطق الإلزامي الأصلي ===

  // === إضافة المرحلة 7: عرض العناصر الاختيارية (فنادق/سيارات/SSR) ===
  // دي مش عناصر إلزامية — مفيش أي شيك جديد اتضاف فوق في المنطق
  // الإلزامي، بس لو العناصر دي موجودة فعلًا بيتم عرضها هنا كسطور
  // إضافية بعد الخمسة سطور الإلزامية، مرقّمة بالتتابع زي عناصر PNR
  // حقيقية (الفنادق والسيارات Segments زي رحلة الطيران فبترقيمها
  // بيكمل من 6، أما SSR فبيظهر من غير رقم تسلسلي زي أغلب عروض SSR
  // الحقيقية في PNR فعلي).
  const hotelLines = pnr.hotels.map(
    (h, idx) =>
      `${6 + idx}. HTL ${h.chainCode} ${h.hotelName}  ${h.roomType}  ` +
      `${h.checkInDate}-${h.checkOutDate}  HK1  TTL ${h.total} ${h.currency}`
  );
  const carLines = pnr.cars.map(
    (c, idx) =>
      `${6 + hotelLines.length + idx}. CAR ${c.companyCode} ${c.companyName}  ${c.carType}  ` +
      `${c.pickupDate}-${c.dropoffDate}  HK1  TTL ${c.total} ${c.currency}`
  );
  const ssrLines = pnr.ssrs.map((s) => `SSR ${s.code} HK1`);

  const message = [
    '----------- PNR CREATED -----------',
    `RECORD LOCATOR: ${recordLocator}`,
    nameLine,
    segLine,
    apLine,
    tkLine,
    rfLine,
    ...hotelLines,
    ...carLines,
    ...ssrLines,
    '------------------------------------'
  ].join('\n');

  resetPNR();

  return { success: true, message };
}

export function resetPNR() {
  pnr = emptyPNR();
  return { success: true, message: '' };
}

export function getCurrentPNR() {
  return pnr;
}
