function emptyPNR() {
  return {
    segments: [],
    name: null,
    contact: null,
    ticketingArrangement: null,
    receivedFrom: null,
    recordLocator: null,
    hotels: [],
    cars: [],
    ssrs: [],
    // === إضافة المرحلة 11 (دفعة 2) — عناصر اختيارية بالكامل، مفيش
    // أي شيك إلزامي جديد عليها (نفس فلسفة hotels/cars/ssrs بالظبط) ===
    mobileContact: null,   // APM
    emailContact: null,    // APE
    remarks: [],           // RM (نص حر)
    osi: [],               // OS (نص حر، Other Service Information)
    ticketNumber: null,   // === إضافة المرحلة 11 (دفعة 3) — TTP ===
    selectedSeat: null    // === إضافة المرحلة 11 (دفعة 6) — ST ===
  };
}

let pnr = emptyPNR();

// === إضافة المرحلة 11 (سد فجوة): تخزين PNRs المُنهاة (بعد ER/ET) في
// الذاكرة (Session-only، مفيش localStorage — نفس فلسفة errors.js
// وcoaching.js) عشان أمر RT يقدر يسترجعها لاحقًا بكودها. مفتاح
// التخزين هو Record Locator نفسه. ===
const pnrStore = new Map();

export function sellSegment(lineNumber, flight, bookingClass, seats, status = 'HK') {
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
    aircraftType: flight.aircraftType,
    seats,
    // === إضافة المرحلة 11 (دفعة 7): status بقى بارامتر بدل ما يكون
    // ثابت 'HK' دايمًا — أي استدعاء قديم من غير الباراميتر ده لسه
    // بيشتغل بالظبط زي الأول (القيمة الافتراضية 'HK')، من غير أي
    // تغيير في السلوك. ===
    status
  };

  pnr.segments.push(segment);

  const message =
    `${lineNumber}  ${flight.airlineCode} ${flight.flightNumber} ${bookingClass}  ` +
    `${flight.departureDate}  ${flight.origin} ${flight.destination}  ${status}${seats}  ` +
    `${flight.departureTime} ${flight.arrivalTime}`;

  return { success: true, message };
}

export function addName(lastName, firstName, title) {
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

// === إضافة المرحلة 11 (دفعة 2 — سد فجوة ❌ TKTL): نفس عنصر ترتيب
// التذكرة، بس بموعد تصدير مؤجل بدل الموافقة الفورية. بيستخدم نفس
// حقل ticketingArrangement (نفس شرط "!== null" في التحقق الإلزامي
// شغال عليه زي ما هو من غير أي تغيير)، بس بقيمة مختلفة (TL بدل OK)
// عشان الفرق يبان في العرض. ===
export function addTicketingTimeLimit(date) {
  pnr.ticketingArrangement = `TL${date}`;
  return { success: true, message: `3. TK TL${date}` };
}

// === إضافة المرحلة 11 (دفعة 2 — سد فجوة ❌ APM/APE): صيغ تواصل
// إضافية اختيارية، مبتحلش محل عنصر AP الإلزامي (pnr.contact)، بس
// بتتضاف جنبه لو موجودة. ===
export function addMobileContact(phone) {
  pnr.mobileContact = phone;
  return { success: true, message: `APM ${phone}` };
}

export function addEmailContact(email) {
  pnr.emailContact = email;
  return { success: true, message: `APE ${email}` };
}

// === إضافة المرحلة 11 (دفعة 2 — سد فجوة ❌ RM/OS): عناصر نصية حرة
// اختيارية بالكامل. ملحوظة تبسيط مقصودة: مش داخلة في ترقيم XE
// الديناميكي دلوقتي (زي SSR بالظبط) — تعديل ده مؤجل لدفعة لاحقة لو
// احتجناه، عشان منلمسش منطق cancelElement الحالي في نفس الدفعة اللي
// بنضيف فيها العناصر دي. ===
export function addRemark(text) {
  pnr.remarks.push(text);
  return { success: true, message: `RM ${text}` };
}

export function addOsi(text) {
  pnr.osi.push(text);
  return { success: true, message: `OSI ${text}` };
}

export function addReceivedFrom(name) {
  pnr.receivedFrom = name;
  return { success: true, message: `4. RF ${name}` };
}

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
  // === إضافة المرحلة 11: تجنّب تصادم كود مع PNR محفوظ بالفعل في
  // pnrStore (احتمال ضعيف جدًا بس ممكن نظريًا، وده أرخص من التعقيد). ===
  if (pnrStore.has(code)) return generateRecordLocator();
  return code;
}

// === إضافة المرحلة 11: بناء نص عرض PNR كامل (مستخدم في نجاح
// ER/ET وفي استرجاع RT) — اتفصل في دالة واحدة عشان الاتنين (إنشاء
// واسترجاع) يعرضوا PNR بنفس الشكل بالظبط، بدل تكرار نفس منطق
// التنسيق مرتين. مفيش أي تغيير في شكل رسالة النجاح الأصلية بتاعة
// ER (نفس السطور بالظبط، بس اتحطت هنا بدل ما تتكرر جوه endAndRetrieve). ===
function formatPnrLines(pnrData, recordLocator, headerLabel) {
  const seg = pnrData.segments[0];
  const titlePart = pnrData.name.title ? ` ${pnrData.name.title}` : '';

  const nameLine = `1. ${pnrData.name.lastName}/${pnrData.name.firstName}${titlePart}`;
  const segLine =
    `2. ${seg.airlineCode} ${seg.flightNumber} ${seg.bookingClass} ${seg.departureDate} ` +
    // === تصحيح المرحلة 11 (دفعة 7): كان ثابت "HK" حتى لو الحالة
    // الحقيقية HL (قائمة انتظار) — بيعرض دلوقتي seg.status الحقيقية. ===
    `${seg.origin}${seg.destination} ${seg.status || 'HK'}${seg.seats} ${seg.departureTime} ${seg.arrivalTime}`;
  const apLine = `3. AP ${pnrData.contact.cityCode} ${pnrData.contact.phone}`;
  // === إضافة المرحلة 11 (دفعة 2): كان ثابت "TK OK" دايمًا حتى لو
  // القيمة الفعلية TL<تاريخ> — بيعرض دلوقتي القيمة الحقيقية. ===
  const tkLine = `4. TK ${pnrData.ticketingArrangement}`;
  const rfLine = `5. RF ${pnrData.receivedFrom}`;

  const hotelLines = pnrData.hotels.map(
    (h, idx) =>
      `${6 + idx}. HTL ${h.chainCode} ${h.hotelName}  ${h.roomType}  ` +
      `${h.checkInDate}-${h.checkOutDate}  HK1  TTL ${h.total} ${h.currency}`
  );
  const carLines = pnrData.cars.map(
    (c, idx) =>
      `${6 + hotelLines.length + idx}. CAR ${c.companyCode} ${c.companyName}  ${c.carType}  ` +
      `${c.pickupDate}-${c.dropoffDate}  HK1  TTL ${c.total} ${c.currency}`
  );
  const ssrLines = pnrData.ssrs.map((s) => `SSR ${s.code} HK1`);

  // === إضافة المرحلة 11 (دفعة 2) — عناصر اختيارية إضافية، بتتعرض
  // بس لو موجودة فعليًا، بعد كل حاجة تانية قبل خط الإغلاق مباشرة. ===
  const mobileLine = pnrData.mobileContact ? [`APM ${pnrData.mobileContact}`] : [];
  const emailLine = pnrData.emailContact ? [`APE ${pnrData.emailContact}`] : [];
  const remarkLines = pnrData.remarks.map((r) => `RM ${r}`);
  const osiLines = pnrData.osi.map((o) => `OSI ${o}`);
  // === إضافة المرحلة 11 (دفعة 3 و6) ===
  const ticketLine = pnrData.ticketNumber ? [`TKT ${pnrData.ticketNumber}`] : [];
  const seatLine = pnrData.selectedSeat ? [`ST ${pnrData.selectedSeat}`] : [];

  return [
    `----------- ${headerLabel} -----------`,
    `RECORD LOCATOR: ${recordLocator}`,
    nameLine,
    segLine,
    apLine,
    tkLine,
    rfLine,
    ...hotelLines,
    ...carLines,
    ...ssrLines,
    ...mobileLine,
    ...emailLine,
    ...remarkLines,
    ...osiLines,
    ...ticketLine,
    ...seatLine,
    '-'.repeat(headerLabel.length + 24)
  ].join('\n');
}

// === إضافة المرحلة 11: استخراج مشترك للشيكات الخمسة الإلزامية،
// عشان ER وET (وغير مباشر RT/XE) يستخدموا نفس المنطق بالظبط بدل
// تكرار الـ if/else خمس مرات في كل مكان. القيمة المرجّعة null يعني
// "كل حاجة تمام". ===
function validatePnrComplete(pnrData) {
  if (pnrData.segments.length === 0) return 'NO ITINERARY SEGMENTS';
  if (pnrData.name === null) return 'PNR EMPTY - NEED NAME';
  if (pnrData.contact === null) return 'NEED CONTACT ELEMENT AP';
  if (pnrData.ticketingArrangement === null) return 'NEED TICKETING ARRANGEMENT TK';
  if (pnrData.receivedFrom === null) return 'NEED RECEIVED FROM RF';
  return null;
}

export function endAndRetrieve() {
  const validationError = validatePnrComplete(pnr);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const recordLocator = generateRecordLocator();
  const message = formatPnrLines(pnr, recordLocator, 'PNR CREATED');

  // === إضافة المرحلة 11: تخزين نسخة كاملة من الـ PNR في pnrStore
  // قبل التصفير، عشان RT يقدر يرجّعها. نسخة عميقة بسيطة (JSON)
  // كافية هنا لأن الكائن كله بيانات بسيطة (strings/numbers/arrays)
  // من غير أي دوال أو مراجع دائرية. ===
  pnrStore.set(recordLocator, JSON.parse(JSON.stringify(pnr)));

  resetPNR();

  return { success: true, message, recordLocator };
}

// === إضافة المرحلة 11 (سد فجوة ❌ رقم 11 في التقرير): ET — إنهاء
// الحجز زي ER بالظبط (نفس الشيكات الخمسة، نفس التخزين في pnrStore،
// نفس التصفير)، لكن من غير عرض شاشة الاسترجاع الكاملة — بس تأكيد
// مختصر بكود الحجز. الفرق ده حقيقي في أماديوس: ET بيستخدم لما العميل
// عايز يقفل الحجز بسرعة من غير احتياج يشوف الشاشة كاملة تاني. ===
export function endTransact() {
  const validationError = validatePnrComplete(pnr);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const recordLocator = generateRecordLocator();
  pnrStore.set(recordLocator, JSON.parse(JSON.stringify(pnr)));
  resetPNR();

  return {
    success: true,
    message: `END OF TRANSACTION COMPLETE - RECORD LOCATOR: ${recordLocator}`,
    recordLocator
  };
}

// === إضافة المرحلة 11 (سد فجوة ❌ رقم 3 في التقرير): IG — تجاهل
// الحجز الحالي المفتوح من غير أي حفظ أو تحقق من اكتماله (بعكس
// ER/ET تمامًا، IG مايستخدمش validatePnrComplete خالص — ده بالظبط
// الفرق الوظيفي بينه وبين ER/ET في أماديوس الحقيقي: IG بيشتغل حتى
// لو الحجز ناقص عناصر إلزامية). لو أصلًا مفيش حاجة اتسجلت، بيرجع
// رسالة مختلفة بدل ما يوهم المستخدم إنه "ألغى" حاجة فعلية. ===
export function ignorePnr() {
  const isEmpty =
    pnr.segments.length === 0 &&
    pnr.name === null &&
    pnr.contact === null &&
    pnr.ticketingArrangement === null &&
    pnr.receivedFrom === null;

  if (isEmpty) {
    return { success: false, message: 'NO ACTIVE PNR TO IGNORE' };
  }

  resetPNR();
  return { success: true, message: 'PNR IGNORED - NO DATA SAVED' };
}

// === إضافة المرحلة 11 (سد فجوة ❌ رقم 1 في التقرير — أولوية عالية):
// RT — استرجاع PNR منتهي بكود الحجز من pnrStore، وتحميله كـ"الحجز
// الحالي" تاني عشان يتعرض ويتقدر يتعدّل (XE) أو يتقفل تاني (ER/ET).
// ملحوظة تصميم: لو فيه حجز مفتوح فعلًا (لسه ما اتقفلش) وقت عمل RT،
// بيتم استبداله بالمسترجع (زي ما بيحصل فعليًا في أماديوس الحقيقي —
// RT بتحل محل الـ Active PNR في السياق الحالي). ===
export function retrievePnr(recordLocator) {
  const stored = pnrStore.get(recordLocator);
  if (!stored) {
    return { success: false, message: 'RECORD LOCATOR NOT FOUND' };
  }

  pnr = JSON.parse(JSON.stringify(stored));
  pnr.recordLocator = recordLocator;

  const message = formatPnrLines(pnr, recordLocator, 'PNR RETRIEVED');
  return { success: true, message };
}

// === إضافة المرحلة 11 (سد فجوة ❌ رقم 2 في التقرير — أولوية عالية):
// XE<رقم السطر> — إلغاء عنصر واحد من الحجز المفتوح حاليًا (سواء
// لسه في مرحلة البناء قبل ER، أو بعد استرجاعه بـRT). الترقيم هنا
// بيطابق نفس ترقيم formatPnrLines بالظبط (1=الاسم، 2=الرحلة،
// 3=AP، 4=TK، 5=RF، وبعدين الفنادق/السيارات بالترتيب لو موجودة) —
// عشان المتدرب يشوف نفس الرقم اللي شافه في الشاشة ويستخدمه هنا
// بالظبط، من غير لخبطة بين "رقم العرض" و"رقم داخلي مختلف". ===
export function cancelElement(lineNumber) {
  // بناء نفس خريطة الترقيم المعروضة، عشان نعرف السطر رقم كام بيمثل
  // عنصر إيه فعليًا، من غير افتراض ثابت (لأن الفنادق/السيارات/SSR
  // اختيارية وبتزود الترقيم ديناميكيًا زي formatPnrLines بالظبط).
  const dynamicItems = [
    { key: 'name', present: pnr.name !== null },
    { key: 'segment', present: pnr.segments.length > 0 },
    { key: 'contact', present: pnr.contact !== null },
    { key: 'ticketing', present: pnr.ticketingArrangement !== null },
    { key: 'receivedFrom', present: pnr.receivedFrom !== null }
  ];

  const presentItems = dynamicItems.filter((i) => i.present);
  const hotelCount = pnr.hotels.length;
  const carCount = pnr.cars.length;

  const totalNumberedLines = presentItems.length + hotelCount + carCount;

  if (pnr.segments.length === 0 && pnr.name === null && pnr.contact === null &&
      pnr.ticketingArrangement === null && pnr.receivedFrom === null) {
    return { success: false, message: 'NO ACTIVE PNR' };
  }

  if (lineNumber < 1 || lineNumber > totalNumberedLines) {
    return { success: false, message: 'INVALID ELEMENT NUMBER' };
  }

  if (lineNumber <= presentItems.length) {
    const item = presentItems[lineNumber - 1];
    switch (item.key) {
      case 'name':
        pnr.name = null;
        break;
      case 'segment':
        pnr.segments = [];
        break;
      case 'contact':
        pnr.contact = null;
        break;
      case 'ticketing':
        pnr.ticketingArrangement = null;
        break;
      case 'receivedFrom':
        pnr.receivedFrom = null;
        break;
      default:
        break;
    }
    return { success: true, message: `${lineNumber} CANCELLED` };
  }

  const hotelIndex = lineNumber - presentItems.length - 1;
  if (hotelIndex < hotelCount) {
    pnr.hotels.splice(hotelIndex, 1);
    return { success: true, message: `${lineNumber} CANCELLED` };
  }

  const carIndex = lineNumber - presentItems.length - hotelCount - 1;
  pnr.cars.splice(carIndex, 1);
  return { success: true, message: `${lineNumber} CANCELLED` };
}

// === إضافة المرحلة 11 (دفعة 3 — سد فجوة ❌ TTP): إصدار تذكرة فعلي،
// مفهوم مختلف عن عنصر ترتيب التذكرة (TK) الموجود من المرحلة 2. TK
// بس "وعد" بإصدار التذكرة (فوري OK أو مؤجل TL)، أما TTP فهو الفعل
// الحقيقي اللي بيولّد رقم تذكرة فعلي. الشرط: لازم TK يكون "OK" بالظبط
// (مش TL — لأن TL معناه "لسه معندناش إذن نصدر"، ده نفس المنطق اللي
// أماديوس الحقيقي بيمشي بيه). رقم التذكرة هنا بادئة 077 (كود
// EgyptAir الرقمي الدولي IATA) + 10 أرقام عشوائية، زي شكل رقم
// التذكرة الإلكترونية الحقيقي (077-XXXXXXXXXX). ===
export function issueTicket() {
  const validationError = validatePnrComplete(pnr);
  if (validationError) {
    return { success: false, message: validationError };
  }

  if (pnr.ticketingArrangement !== 'OK') {
    return { success: false, message: 'CANNOT ISSUE - TICKETING ARRANGEMENT IS TL (DEFERRED)' };
  }

  if (pnr.ticketNumber !== null) {
    return { success: false, message: `TICKET ALREADY ISSUED: ${pnr.ticketNumber}` };
  }

  let digits = '';
  for (let i = 0; i < 10; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  const ticketNumber = `077-${digits}`;
  pnr.ticketNumber = ticketNumber;

  return { success: true, message: `TICKET ISSUED: ${ticketNumber}` };
}

// === إضافة المرحلة 11 (دفعة 6 — سد فجوة ❌ ST): تسجيل المقعد
// المختار (اختياري بالكامل، مفيش شيك إلزامي جديد — نفس فلسفة
// hotels/cars/ssrs). التحقق الفعلي من توفر المقعد بيحصل في
// seatmaps.js قبل ما الدالة دي تتنادى. ===
export function setSelectedSeat(seatLabel) {
  pnr.selectedSeat = seatLabel;
  return { success: true, message: `ST ${seatLabel} CONFIRMED` };
}

export function resetPNR() {
  pnr = emptyPNR();
  return { success: true, message: '' };
}

export function getCurrentPNR() {
  return pnr;
    }
