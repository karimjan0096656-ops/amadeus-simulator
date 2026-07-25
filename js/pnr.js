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
*/

function emptyPNR() {
  return {
    segments: [],
    name: null,
    contact: null,
    ticketingArrangement: null,
    receivedFrom: null,
    recordLocator: null
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

function generateRecordLocator() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

export function endAndRetrieve() {
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

  const message = [
    '----------- PNR CREATED -----------',
    `RECORD LOCATOR: ${recordLocator}`,
    nameLine,
    segLine,
    apLine,
    tkLine,
    rfLine,
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
