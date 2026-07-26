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
*/

import {
  sellSegment,
  addName,
  addContact,
  addTicketingArrangement,
  addReceivedFrom,
  endAndRetrieve,
  getCurrentPNR
} from './pnr.js';

import { getFareQuote, getFareForBookingClass } from './pricing.js';

const COMMAND_CODES = ['AN', 'SS', 'NM', 'AP', 'TK', 'RF', 'ER'];

// أوامر المرحلة 6 (التسعير) — كودها 3 حروف، فحص منفصل عن الحرفين
// (راجع الملحوظة فوق).
const THREE_LETTER_COMMAND_CODES = ['FQD', 'FXP'];

let airportsData = [];
let airlinesData = [];
let flightsData = [];
let rbdCodes = [];

// آخر عرض توفر (AN) ناجح — session state في الذاكرة، مش localStorage (قسم 4.1)
let lastAvailabilityDisplay = null; // { origin, destination, date, flights: [...] } أو null

export function initParser(data) {
  airportsData = data.airports || [];
  airlinesData = data.airlines || [];
  flightsData = data.flights || [];

  rbdCodes = extractRbdCodes(data.rbd);
  if (rbdCodes.length !== 10) {
    // خط دفاع احتياطي — الترتيب ده منصوص عليه حرفيًا في الـ Spec (قسم 3.1)
    rbdCodes = ['F', 'A', 'J', 'C', 'D', 'Y', 'B', 'M', 'H', 'K'];
  }
}

// استخراج أكواد RBD من rbd.json بشكل مرن (بيتحمّل أشكال بيانات مختلفة)
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
  // === إضافة المرحلة 6: فحص أوامر التسعير (3 حروف) قبل منطق الحرفين ===
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
  // === نهاية إضافة المرحلة 6 — كل اللي تحت ده هو الكود الأصلي زي ما هو ===

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
  const result = endAndRetrieve();
  return result.message;
}

/* ---------------- FQD (المرحلة 6) ---------------- */
// FQDCAIDXB — من غير أي مسافات (نفس فلسفة AN_REGEX بتاعة "لصيق من
// غير مسافة" — راجع ملحوظة errors.js رقم 3 عن نفس الموضوع في AN).
const FQD_REGEX = /^FQD([A-Z]{3})([A-Z]{3})$/;

function handleFQD(cmd) {
  const match = cmd.match(FQD_REGEX);
  if (!match) return 'FORMAT';

  const [, origin, destination] = match;

  // نفس منطق التحقق من كود المطار الموجود في handleAN بالظبط (من غير
  // ما نلمس handleAN نفسها) — عشان تجربة الخطأ تبقى متسقة (قسم 6 حالة 6).
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
// FXP من غير أي باراميترات إضافية — بتسعّر آخر Segment محجوز في الـ
// PNR الحالي (قسم 3 من السبك: getCurrentPNR() اللي أصلًا اتصدّرت من
// pnr.js في المرحلة 2 عشان بالظبط الاستخدامات زي دي).
function handleFXP(cmd) {
  if (cmd !== 'FXP') return 'FORMAT';

  const currentPnr = getCurrentPNR();
  if (currentPnr.segments.length === 0) {
    // نفس رسالة ER بالظبط لما مفيش Segment (pnr.js) — عشان errors.js
    // يصنّفها بنفس الفئة من غير ما نحتاج نضيف مفتاح جديد في errors.json.
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
