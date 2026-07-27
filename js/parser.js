/*
  parser.js — محلل أوامر الطرفية (المرحلة 2: AN, SS, NM, AP, TK, RF, ER)

  تصحيح مهم عن الـ Spec (لازم ينتبه له Malik):
  قسم 5 من الـ Spec بيقول إن قايمة الأوامر المعروفة هي
  (AN, SS, NM, AP, TK, ER) — 6 أوامر بس، وناسي RF! لكن قسم 4 نفسه
  عنوانه "الأوامر السبعة" ومفصّل RF كأمر كامل (4.6)، ومعيار القبول
  (قسم 11) بيختبر RF MALIK صراحة. لو اتبعنا قسم 5 حرفيًا، RF كانت
  هترجع UNKNOWN COMMAND دايمًا وكل سيناريو ER كان هيفشل. اعتبرها
  سبق قلم في الـ Spec، وتم تصحيحها هنا بإضافة RF لقائمة الأوامر
  المعروفة (7 أوامر). لو حابب تسجلها في PROJECT.md أو الـ Spec
  نفسه كتصحيح رسمي، قولّي.

  === إضافة المرحلة 6 (الأسعار) ===
  ⚠ فرق مهم لازم Malik ياخد باله منه، بنفس روح ملحوظة RF فوق:
  سبك المرحلة 6 (قسم 5) بيقول "ضيف FQD و FXP في مصفوفة COMMAND_CODES"
  وكأنهم هيتحطوا جنب AN/SS/... في نفس المصفوفة الموجودة. ده مينفعش
  حرفيًا: parseCommand الفعلي بياخد code = cmd.slice(0, 2) — أول
  حرفين بس من الأمر. يعني "FQDCAIDXB".slice(0,2) === "FQ" مش "FQD"،
  ونفس الحاجة لـ "FXP".slice(0,2) === "FX". لو ضفت 'FQD'/'FXP' كسترنج
  في نفس مصفوفة الحرفين COMMAND_CODES، الشرط COMMAND_CODES.includes(code)
  هيفضل false دايمًا لأي أمر تسعير (لأن "FQ" != "FQD")، وهيرجع
  UNKNOWN COMMAND كل مرة — يعني الأمر هيبقى ميت فعليًا حتى لو الكود
  "شكله" مضاف صح.

  عشان كده عملت مصفوفة منفصلة للأوامر التلات حروف
  (THREE_LETTER_COMMAND_CODES) وفحص منفصل بياخد أول 3 حروف، بيتفحص
  الأول قبل منطق الحرفين الأصلي. الفحص ده إضافة قبل الكود الأصلي —
  مفيش سطر واحد من منطق الحرفين الأصلي أو من أي دالة handleAN/handleSS/
  handleNM/handleAP/handleTK/handleRF/handleER اتلمس أو اتغيّر.

  === إضافة المرحلة 7 (الخدمات الإضافية) ===
  كل أوامر المرحلة دي (HA, HS, CA, CS, SR, TI) حرفين بالظبط زي
  AN/SS/RF، فمفيش حاجة زي تعقيد FQD/FXP فوق — بس إضافة الستة أكواد
  دول لنفس مصفوفة COMMAND_CODES الموجودة، وست حالات (case) جديدة في
  نفس الـ switch، وست دوال handle جديدة في آخر الملف. مفيش أي لمس
  لمنطق الحرفين الأصلي أو لأي دالة handle قديمة.

  ⚠ ملحوظتين مهمّتين عن سبك المرحلة 7 (راجع تعليق ancillary.js
  للتفاصيل الكاملة والمصادر):
  1) سبك المرحلة افترض VC/VS للسيارات، لكن الكود الحقيقي (اتأكد من
     مصدرين مستقلين: بحثي في Amadeus Service Hub + بحث Malik بنفسه)
     هو CA (توفر) وCS (بيع) — مش VC/VS. الكود هنا وفي ancillary.js
     بيستخدم CA/CS. "/VC-" الحقيقي اللي Malik لقاه معناه حاجة تانية
     خالص (الناقل المعتمد للإصدار) ومالوش علاقة بالسيارات — تفاصيل
     كاملة في تعليق ancillary.js.
  2) ترتيب حقول HA/CA اتصحح لـ "مدينة ثم تاريخ" (HACAI15JUL) بدل
     ترتيب السبك الأصلي "تاريخ ثم مدينة"، عشان يطابق كل الأمثلة
     الحقيقية اللي لقيتها من Amadeus (تفاصيل كاملة في ancillary.js).

  === إضافة المرحلة 8 (إدارة الطوابير) ===
  أوامر المرحلة دي (QT, QC, QS, QN, QI, QE) كلها حرفين بالظبط، فمفيش
  تعقيد زي FQD/FXP — بس إضافة الستة أكواد لنفس مصفوفة COMMAND_CODES
  الموجودة، وست حالات (case) جديدة في نفس الـ switch، وست دوال handle
  جديدة في آخر الملف (نفس نمط المرحلة 7 بالظبط).

  ⚠ استثناء واحد بس لقاعدة "مفيش لمس لأي دالة handle موجودة" (موثّق
  بالتفصيل الكامل في تعليق queues.js): handleER() اتضاف لها التقاط
  لقطة بسيطة (اسم الراكب + Record Locator) قبل نداء endAndRetrieve()
  مباشرة، لأن الدالة دي بتصفّر الـ PNR تلقائيًا (resetPNR()) في آخرها
  بعد كل نجاح — من غير اللقطة دي، أمر QE (قسم 4.7 من سبك المرحلة 8)
  مش هيلاقي أي بيانات يحطها على الطابور فورًا بعد ER. اللقطة بتتاخد
  قبل النداء، وبتتخزن بعد النجاح بس؛ رسالة endAndRetrieve() ومنطقها
  الداخلي (الشيكات الخمسة، ترتيب السطور، إلخ) فضلوا زي ما هم بالظبط
  من غير أي تغيير — القيمة المُرجعة لـ handleER() نفسها متطابقة حرفيًا
  زي الأصل.
*/

import {
  sellSegment,
  addName,
  addContact,
  addTicketingArrangement,
  addReceivedFrom,
  endAndRetrieve,
  getCurrentPNR,
  addHotelSegment,
  addCarSegment,
  addSSR
} from './pnr.js';

import { getFareQuote, getFareForBookingClass } from './pricing.js';

import {
  findHotelsByCity,
  findCarsByCity,
  getSSRInfo,
  getTimaticInfo,
  addNightsToDate
} from './ancillary.js';

// === إضافة المرحلة 8 ===
import {
  getQueueTableDisplay,
  getQueueCountDisplay,
  startQueueBrowse,
  addPnrToQueue
} from './queues.js';

const COMMAND_CODES = [
  'AN', 'SS', 'NM', 'AP', 'TK', 'RF', 'ER',
  // === إضافة المرحلة 7 ===
  'HA', 'HS', 'CA', 'CS', 'SR', 'TI',
  // === إضافة المرحلة 8 ===
  'QT', 'QC', 'QS', 'QN', 'QI', 'QE'
];

const THREE_LETTER_COMMAND_CODES = ['FQD', 'FXP'];

let airportsData = [];
let airlinesData = [];
let flightsData = [];
let rbdCodes = [];

let lastAvailabilityDisplay = null;
let lastHotelAvailabilityDisplay = null;
let lastCarAvailabilityDisplay = null;

// === إضافة المرحلة 8: لقطة آخر PNR اتعمله ER بنجاح في الجلسة دي،
// عشان QE يقدر يستخدمها بعد ما pnr.js يكون صفّر الحالة الحقيقية.
// راجع تعليق أعلى الملف وتعليق queues.js للتفاصيل الكاملة. بتفضل
// موجودة (من غير مسح تلقائي) لحد ما ER تاني ينجح — يعني تقدر تحط نفس
// الـ PNR على أكتر من طابور بأكتر من QE لو حبيت، زي أماديوس الحقيقي. ===
let lastCompletedPnr = null;

export function initParser(data) {
  airportsData = data.airports || [];
  airlinesData = data.airlines || [];
  flightsData = data.flights || [];

  rbdCodes = extractRbdCodes(data.rbd);
  if (rbdCodes.length !== 10) {
    rbdCodes = ['F', 'A', 'J', 'C', 'D', 'Y', 'B', 'M', 'H', 'K'];
  }
}

function extractRbdCodes(rbdData) {
  if (!Array.isArray(rbdData)) return [];
  return rbdData
    .map((item) => {
      if (typeof item === 'string') return item.toUpperCase();
      if (item && typeof item === 'object') {
        for (const key of Object.keys(item)) {
          const val = item[key];
          if (typeof val === 'string' && /^[A-Z]$/i.test(val)) {
            return val.toUpperCase();
          }
        }
      }
      return null;
    })
    .filter(Boolean);
}

export function normalizeInput(raw) {
  return String(raw).trim().toUpperCase();
}

export function parseCommand(cmd) {
  const threeCode = cmd.slice(0, 3);
  if (THREE_LETTER_COMMAND_CODES.includes(threeCode)) {
    switch (threeCode) {
      case 'FQD':
        return handleFQD(cmd);
      case 'FXP':
        return handleFXP(cmd);
      default:
        return 'UNKNOWN COMMAND';
    }
  }

  const code = cmd.slice(0, 2);

  if (!COMMAND_CODES.includes(code)) {
    return 'UNKNOWN COMMAND';
  }

  switch (code) {
    case 'AN':
      return handleAN(cmd);
    case 'SS':
      return handleSS(cmd);
    case 'NM':
      return handleNM(cmd);
    case 'AP':
      return handleAP(cmd);
    case 'TK':
      return handleTK(cmd);
    case 'RF':
      return handleRF(cmd);
    case 'ER':
      return handleER(cmd);
    case 'HA':
      return handleHA(cmd);
    case 'HS':
      return handleHS(cmd);
    case 'CA':
      return handleCA(cmd);
    case 'CS':
      return handleCS(cmd);
    case 'SR':
      return handleSR(cmd);
    case 'TI':
      return handleTI(cmd);
    // === إضافة المرحلة 8 ===
    case 'QT':
      return handleQT(cmd);
    case 'QC':
      return handleQC(cmd);
    case 'QS':
      return handleQS(cmd);
    case 'QN':
      return handleQN(cmd);
    case 'QI':
      return handleQI(cmd);
    case 'QE':
      return handleQE(cmd);
    default:
      return 'UNKNOWN COMMAND';
  }
}

/* ---------------- AN ---------------- */
const AN_REGEX = /^AN(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)([A-Z]{3})([A-Z]{3})$/;

function handleAN(cmd) {
  const match = cmd.match(AN_REGEX);
  if (!match) return 'FORMAT';

  const [, dayStr, month, origin, destination] = match;
  const day = parseInt(dayStr, 10);
  if (day < 1 || day > 31) return 'FORMAT';

  const date = dayStr + month;

  if (!airportsData.some((a) => a.iataCode === origin)) {
    return `UNKNOWN CITY/AIRPORT ${origin}`;
  }
  if (!airportsData.some((a) => a.iataCode === destination)) {
    return `UNKNOWN CITY/AIRPORT ${destination}`;
  }
  if (origin === destination) return 'INVALID CITY PAIR';

  const matches = flightsData.filter(
    (f) => f.origin === origin && f.destination === destination && f.departureDate === date
  );

  if (matches.length === 0) return 'NO FLIGHTS FOUND FOR CITY PAIR/DATE';

  lastAvailabilityDisplay = { origin, destination, date, flights: matches };

  const lines = [];
  lines.push(`** AVAILABILITY - AN **  ${origin}-${destination}  ${date}`);
  lines.push('');

  matches.forEach((f, idx) => {
    const lineNum = String(idx + 1).padStart(2, ' ');
    const rbdBlock = rbdCodes.map((code) => `${code}${f.availability[code] ?? 0}`).join(' ');
    const line =
      `${lineNum}  ${f.airlineCode} ${f.flightNumber.padEnd(4, ' ')}  ${rbdBlock}  ` +
      `${f.origin} ${f.destination}  ${f.departureTime} ${f.arrivalTime}  ${f.aircraftType}`;
    lines.push(line);
  });

  return lines.join('\n');
}

/* ---------------- SS ---------------- */
const SS_REGEX = /^SS(\d{1,2})([A-Z])(\d)$/;

function handleSS(cmd) {
  const match = cmd.match(SS_REGEX);
  if (!match) return 'FORMAT';

  const [, lineNumStr, bookingClass, seatsStr] = match;

  if (!lastAvailabilityDisplay) return 'NEED AVAILABILITY DISPLAY FIRST';

  const lineNum = parseInt(lineNumStr, 10);
  const flightsShown = lastAvailabilityDisplay.flights;
  if (lineNum < 1 || lineNum > flightsShown.length) return 'INVALID LINE NUMBER';

  if (!rbdCodes.includes(bookingClass)) return 'INVALID CLASS';

  const flight = flightsShown[lineNum - 1];
  const available = flight.availability[bookingClass] ?? 0;
  if (available === 0) return 'CLASS NOT AVAILABLE';

  const seats = parseInt(seatsStr, 10);
  if (seats > available) return 'NOT ENOUGH SEATS AVAILABLE';

  if (getCurrentPNR().segments.length > 0) {
    return 'MULTIPLE SEGMENTS NOT SUPPORTED YET (PHASE 2 LIMIT)';
  }

  const result = sellSegment(lineNum, flight, bookingClass, seats);
  return result.message;
}

/* ---------------- NM ---------------- */
const NM_REGEX = /^NM1([A-Z]+)\/([A-Z]+)(?:\s(MR|MRS|MS|MSTR|MISS))?$/;

function handleNM(cmd) {
  const match = cmd.match(NM_REGEX);
  if (!match) return 'FORMAT';

  const [, lastName, firstName, title] = match;

  if (getCurrentPNR().name !== null) {
    return 'MULTIPLE PASSENGERS NOT SUPPORTED YET (PHASE 2 LIMIT)';
  }

  const result = addName(lastName, firstName, title);
  return result.message;
}

/* ---------------- AP ---------------- */
const AP_REGEX = /^AP\s([A-Z]{3})\s(\d{6,15})$/;

function handleAP(cmd) {
  const match = cmd.match(AP_REGEX);
  if (!match) return 'FORMAT';

  const [, cityCode, phone] = match;
  const result = addContact(cityCode, phone);
  return result.message;
}

/* ---------------- TK ---------------- */
function handleTK(cmd) {
  if (cmd !== 'TKOK') return 'FORMAT';
  const result = addTicketingArrangement();
  return result.message;
}

/* ---------------- RF ---------------- */
const RF_REGEX = /^RF\s([A-Z ]{2,20})$/;

function handleRF(cmd) {
  const match = cmd.match(RF_REGEX);
  if (!match) return 'FORMAT';

  const [, name] = match;
  const result = addReceivedFrom(name);
  return result.message;
}

/* ---------------- ER ---------------- */
function handleER(cmd) {
  if (cmd !== 'ER') return 'FORMAT';

  // === إضافة المرحلة 8 — راجع الشرح الكامل أعلى الملف وفي queues.js ===
  // لازم نلقط اسم الراكب قبل نداء endAndRetrieve() لأنها بتصفّر الـ
  // PNR (resetPNR()) في آخرها تلقائيًا بعد أي نجاح. اللقطة دي مالهاش
  // أي تأثير على منطق endAndRetrieve() ولا على القيمة المُرجعة هنا.
  const nameSnapshot = getCurrentPNR().name;

  const result = endAndRetrieve();

  if (result.success) {
    const locatorMatch = result.message.match(/RECORD LOCATOR:\s*([A-Z]{6})/);
    if (locatorMatch && nameSnapshot) {
      const titlePart = nameSnapshot.title ? ` ${nameSnapshot.title}` : '';
      lastCompletedPnr = {
        recordLocator: locatorMatch[1],
        passengerName: `${nameSnapshot.lastName}/${nameSnapshot.firstName}${titlePart}`
      };
    }
  }

  return result.message;
}

/* ---------------- FQD (المرحلة 6) ---------------- */
const FQD_REGEX = /^FQD([A-Z]{3})([A-Z]{3})$/;

function handleFQD(cmd) {
  const match = cmd.match(FQD_REGEX);
  if (!match) return 'FORMAT';

  const [, origin, destination] = match;

  if (!airportsData.some((a) => a.iataCode === origin)) {
    return `UNKNOWN CITY/AIRPORT ${origin}`;
  }
  if (!airportsData.some((a) => a.iataCode === destination)) {
    return `UNKNOWN CITY/AIRPORT ${destination}`;
  }
  if (origin === destination) return 'INVALID CITY PAIR';

  const quote = getFareQuote(origin, destination);
  if (!quote) {
    return `NO FARES FOUND FOR CITY PAIR ${origin}${destination}`;
  }

  const lines = [];
  lines.push(`** FARE DISPLAY - FQD **  ${origin}-${destination}  (${quote.currency})`);
  lines.push('');

  quote.fares.forEach((f) => {
    const total = f.baseFare + quote.totalTaxes;
    lines.push(
      `${f.bookingClass}  ${f.fareBasis.padEnd(6, ' ')}  FARE ${String(f.baseFare).padStart(6, ' ')}  ` +
        `TAX ${String(quote.totalTaxes).padStart(5, ' ')}  TTL ${String(total).padStart(6, ' ')}  BAG ${f.baggageAllowance}`
    );
  });

  lines.push('');
  quote.taxes.forEach((t) => {
    lines.push(`${t.code}  ${t.amount}  ${t.descriptionAr}`);
  });

  return lines.join('\n');
}

/* ---------------- FXP (المرحلة 6) ---------------- */
function handleFXP(cmd) {
  if (cmd !== 'FXP') return 'FORMAT';

  const currentPnr = getCurrentPNR();
  if (currentPnr.segments.length === 0) {
    return 'NO ITINERARY SEGMENTS';
  }

  const seg = currentPnr.segments[0];
  const fareInfo = getFareForBookingClass(seg.origin, seg.destination, seg.bookingClass);
  if (!fareInfo) {
    return `NO FARES FOUND FOR CITY PAIR ${seg.origin}${seg.destination}`;
  }

  const lines = [];
  lines.push(`** ITINERARY PRICING - FXP **  ${seg.origin}-${seg.destination}  (${fareInfo.currency})`);
  lines.push('');
  lines.push(`${seg.airlineCode} ${seg.flightNumber}  CLASS ${seg.bookingClass}  FARE BASIS ${fareInfo.fareBasis}`);
  lines.push(`FARE   ${fareInfo.baseFare}`);
  fareInfo.taxes.forEach((t) => {
    lines.push(`TAX    ${t.amount}  ${t.code}  ${t.descriptionAr}`);
  });
  lines.push(`TOTAL  ${fareInfo.total}  ${fareInfo.currency}`);
  lines.push(`BAGGAGE ALLOWANCE  ${fareInfo.baggageAllowance}`);

  return lines.join('\n');
}

/* ================== المرحلة 7 — الخدمات الإضافية ================== */

const HA_REGEX = /^HA([A-Z]{3})(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/;

function handleHA(cmd) {
  const match = cmd.match(HA_REGEX);
  if (!match) return 'FORMAT';

  const [, cityCode, dayStr, month] = match;
  const day = parseInt(dayStr, 10);
  if (day < 1 || day > 31) return 'FORMAT';

  if (!airportsData.some((a) => a.iataCode === cityCode)) {
    return `UNKNOWN CITY/AIRPORT ${cityCode}`;
  }

  const checkInDate = dayStr + month;
  const hotels = findHotelsByCity(cityCode);

  if (hotels.length === 0) return 'NO HOTELS FOUND FOR CITY';

  lastHotelAvailabilityDisplay = { cityCode, checkInDate, hotels };

  const lines = [];
  lines.push(`** HOTEL AVAILABILITY - HA **  ${cityCode}  ${checkInDate}`);
  lines.push('');

  hotels.forEach((h, idx) => {
    const lineNum = String(idx + 1).padStart(2, ' ');
    const stars = '*'.repeat(h.category);
    lines.push(
      `${lineNum}  ${h.chainCode}  ${h.hotelName.padEnd(38, ' ')}  ${stars.padEnd(5, ' ')}  ` +
        `${h.roomType}  ${String(h.nightlyRate).padStart(5, ' ')} ${h.currency}/NGT`
    );
  });

  return lines.join('\n');
}

const HS_REGEX = /^HS(\d{1,2})N(\d{1,2})$/;

function handleHS(cmd) {
  const match = cmd.match(HS_REGEX);
  if (!match) return 'FORMAT';

  const [, lineNumStr, nightsStr] = match;

  if (!lastHotelAvailabilityDisplay) return 'NEED HOTEL AVAILABILITY DISPLAY FIRST';

  const lineNum = parseInt(lineNumStr, 10);
  const hotelsShown = lastHotelAvailabilityDisplay.hotels;
  if (lineNum < 1 || lineNum > hotelsShown.length) return 'INVALID LINE NUMBER';

  const nights = parseInt(nightsStr, 10);
  if (nights < 1 || nights > 30) return 'FORMAT';

  const hotel = hotelsShown[lineNum - 1];
  const { checkInDate } = lastHotelAvailabilityDisplay;
  const checkOutDate = addNightsToDate(checkInDate, nights);

  const bookedHotel = {
    hotelId: hotel.hotelId,
    chainCode: hotel.chainCode,
    hotelName: hotel.hotelName,
    roomType: hotel.roomType,
    nightlyRate: hotel.nightlyRate,
    nights,
    total: hotel.nightlyRate * nights,
    currency: hotel.currency,
    checkInDate,
    checkOutDate
  };

  const result = addHotelSegment(bookedHotel);
  return result.message;
}

const CA_REGEX = /^CA([A-Z]{3})(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/;

function handleCA(cmd) {
  const match = cmd.match(CA_REGEX);
  if (!match) return 'FORMAT';

  const [, cityCode, dayStr, month] = match;
  const day = parseInt(dayStr, 10);
  if (day < 1 || day > 31) return 'FORMAT';

  if (!airportsData.some((a) => a.iataCode === cityCode)) {
    return `UNKNOWN CITY/AIRPORT ${cityCode}`;
  }

  const pickupDate = dayStr + month;
  const cars = findCarsByCity(cityCode);

  if (cars.length === 0) return 'NO VEHICLES FOUND FOR CITY';

  lastCarAvailabilityDisplay = { cityCode, pickupDate, cars };

  const lines = [];
  lines.push(`** CAR AVAILABILITY - CA **  ${cityCode}  ${pickupDate}`);
  lines.push('');

  cars.forEach((c, idx) => {
    const lineNum = String(idx + 1).padStart(2, ' ');
    lines.push(
      `${lineNum}  ${c.companyCode}  ${c.companyName.padEnd(12, ' ')}  ${c.carType}  ` +
        `${String(c.dailyRate).padStart(5, ' ')} ${c.currency}/DAY`
    );
  });

  return lines.join('\n');
}

const CS_REGEX = /^CS(\d{1,2})D(\d{1,2})$/;

function handleCS(cmd) {
  const match = cmd.match(CS_REGEX);
  if (!match) return 'FORMAT';

  const [, lineNumStr, daysStr] = match;

  if (!lastCarAvailabilityDisplay) return 'NEED CAR AVAILABILITY DISPLAY FIRST';

  const lineNum = parseInt(lineNumStr, 10);
  const carsShown = lastCarAvailabilityDisplay.cars;
  if (lineNum < 1 || lineNum > carsShown.length) return 'INVALID LINE NUMBER';

  const days = parseInt(daysStr, 10);
  if (days < 1 || days > 30) return 'FORMAT';

  const car = carsShown[lineNum - 1];
  const { pickupDate } = lastCarAvailabilityDisplay;
  const dropoffDate = addNightsToDate(pickupDate, days);

  const bookedCar = {
    carId: car.carId,
    companyCode: car.companyCode,
    companyName: car.companyName,
    carType: car.carType,
    dailyRate: car.dailyRate,
    days,
    total: car.dailyRate * days,
    currency: car.currency,
    pickupDate,
    dropoffDate
  };

  const result = addCarSegment(bookedCar);
  return result.message;
}

const SR_REGEX = /^SR([A-Z]{4})$/;

function handleSR(cmd) {
  const match = cmd.match(SR_REGEX);
  if (!match) return 'FORMAT';

  const [, code] = match;

  const ssrInfo = getSSRInfo(code);
  if (!ssrInfo) return 'INVALID SSR CODE';

  if (getCurrentPNR().name === null) {
    return 'PNR EMPTY - NEED NAME';
  }

  const result = addSSR(code);
  return result.message;
}

const TI_REGEX = /^TI([A-Z]{3})$/;

function handleTI(cmd) {
  const match = cmd.match(TI_REGEX);
  if (!match) return 'FORMAT';

  const [, destination] = match;

  if (!airportsData.some((a) => a.iataCode === destination)) {
    return `UNKNOWN CITY/AIRPORT ${destination}`;
  }

  const info = getTimaticInfo(destination);
  if (!info) return 'NO TIMATIC DATA FOR DESTINATION';

  const lines = [];
  lines.push(`** TIMATIC - TI **  ${destination}  (جواز سفر مصري)`);
  lines.push('');
  lines.push(`VISA:   ${info.visaAr}`);
  lines.push(`STAY:   ${info.maxStayAr}`);
  lines.push(`HEALTH: ${info.healthNoteAr}`);

  return lines.join('\n');
}

/* ================== المرحلة 8 — إدارة الطوابير ================== */

/* ---------------- QT (Queue Table) ---------------- */
function handleQT(cmd) {
  if (cmd !== 'QT') return 'FORMAT';
  return getQueueTableDisplay();
}

/* ---------------- QC (Queue Count) ----------------
   QC + رقم طابور (بدون فئة، يجمع كل الفئات) أو QC + رقم + C + فئة
   (فئة محددة)، زي QC8 أو QC1C2. */
const QC_REGEX = /^QC(\d{1,2})(?:C(\d{1,2}))?$/;

function handleQC(cmd) {
  const match = cmd.match(QC_REGEX);
  if (!match) return 'FORMAT';

  const [, queueNumStr, categoryStr] = match;
  const queueNumber = parseInt(queueNumStr, 10);
  const category = categoryStr !== undefined ? parseInt(categoryStr, 10) : null;

  return getQueueCountDisplay(queueNumber, category);
}

/* ---------------- QS (Queue Start / browse) ----------------
   القسم إلزامي هنا (بعكس QC) — QS1C0 مثلًا. */
const QS_REGEX = /^QS(\d{1,2})C(\d{1,2})$/;

function handleQS(cmd) {
  const match = cmd.match(QS_REGEX);
  if (!match) return 'FORMAT';

  const [, queueNumStr, categoryStr] = match;
  const queueNumber = parseInt(queueNumStr, 10);
  const category = parseInt(categoryStr, 10);

  return startQueueBrowse(queueNumber, category);
}

/* ---------------- QN و QI ----------------
   لو وصلنا للدالتين دول أصلًا، فده معناه إننا مش جوه وضع تصفح طابور
   (main.js بيوجّه لـ handleQueueModeInput في queues.js مباشرة وقت ما
   الوضع نشط، قبل ما نوصل لـ parseCommand() خالص — راجع تعليق main.js).
   يعني وصولنا هنا معناه أكيد إن مفيش تصفح نشط، فالرد ثابت دايمًا. */
function handleQN(cmd) {
  if (cmd !== 'QN') return 'FORMAT';
  return 'NOT IN QUEUE MODE';
}

function handleQI(cmd) {
  if (cmd !== 'QI') return 'FORMAT';
  return 'NOT IN QUEUE MODE';
}

/* ---------------- QE (Queue Entry) ---------------- */
const QE_REGEX = /^QE(\d{1,2})$/;

function handleQE(cmd) {
  const match = cmd.match(QE_REGEX);
  if (!match) return 'FORMAT';

  const [, queueNumStr] = match;
  const queueNumber = parseInt(queueNumStr, 10);

  // راجع الشرح الكامل أعلى الملف: لو فيه لقطة PNR اتعمله ER بنجاح،
  // نستخدمها. لو لأ، نرجع لفحص الـ PNR الحالي بنفس شيكات ER الخمسة.
  if (!lastCompletedPnr) {
    const currentPnr = getCurrentPNR();
    if (currentPnr.segments.length === 0) return 'NO ITINERARY SEGMENTS';
    if (currentPnr.name === null) return 'PNR EMPTY - NEED NAME';
    if (currentPnr.contact === null) return 'NEED CONTACT ELEMENT AP';
    if (currentPnr.ticketingArrangement === null) return 'NEED TICKETING ARRANGEMENT TK';
    if (currentPnr.receivedFrom === null) return 'NEED RECEIVED FROM RF';
    return 'PNR NOT ENDED YET - USE ER FIRST';
  }

  addPnrToQueue(queueNumber, lastCompletedPnr);
  return `QUEUED TO Q${queueNumber}`;
}
