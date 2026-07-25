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

const COMMAND_CODES = ['AN', 'SS', 'NM', 'AP', 'TK', 'RF', 'ER'];

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
