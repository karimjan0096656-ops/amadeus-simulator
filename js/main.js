/*
  main.js — نقطة البداية: تحميل ملفات JSON، تفعيل/تعطيل الإدخال،
  عرض الأوامر والردود على الشاشة. لا يحتوي على أي منطق تحليل أو
  تحقق — كل ده مسؤولية parser.js (قسم 7 من الـ Spec).

  [... تعليقات المراحل 3/5/6/7 الأصلية كما هي بدون أي تغيير ...]

  === إضافة المرحلة 8 (إدارة الطوابير) ===
  إضافتين بس، بنفس نمط LEVELTEST بالظبط (مش بنفس نمط errors.js):

  1) تحميل data/queues.json في Promise.all ونداء initQueues() بيه —
     نفس نمط initPricing/initAncillary تمامًا.

  2) نقطة توجيه جديدة في handleSubmit(): وضع تصفح الطابور (بعد QS
     ناجح) لازم "يقاطع" مسار الإدخال العادي بالكامل، بالظبط زي
     LEVELTEST — أي حاجة المتدرب يكتبها وهو جوه الوضع ده المفروض
     تروح لـ handleQueueModeInput() في queues.js، مش لـ parseCommand()
     في parser.js. عشان كده الشرط الجديد (isQueueModeActive()) اتحط
     في نفس سلسلة الـ if/else if الموجودة بالفعل لـ isTestActive()،
     قبل المسار العادي مباشرة — إضافة شرط واحد بس، مفيش أي لمس للمسار
     العادي أو لمسار LEVELTEST.

     ملحوظة: أوامر الطوابير التانية (QT, QC, QS, QE) ماحتاجتش أي نقطة
     تكامل جديدة هنا خالص — بتمر من نفس مسار parseCommand() العادي
     زي أي أمر تاني (isRegularCommand = true)، فبتستفيد تلقائيًا من
     محرك تصحيح الأخطاء (errors.js) الموجود بالفعل من المرحلة 5.

  === إضافة المرحلة 10 (التكيف مع الأداء) ===
  إضافة واحدة بس هنا: نداء initPerformance() بعد initCoaching()
  مباشرة. الملف ده مش محتاج تحميل أي JSON جديد (على عكس المراحل
  اللي قبله) — performance.js بيحمّل إحصائياته المحفوظة بنفسه من
  storage.js داخليًا، فمفيش داعي لأي fetch إضافي هنا ولا أي تغيير
  في Promise.all. باقي التكامل كله (تسجيل النتائج، حساب مستوى
  التكيف) بيحصل جوه coaching.js زي ما هو موضح في تعليقات الملف ده.
*/

import { initParser, normalizeInput, parseCommand } from './parser.js';
import { initLevelTest, isTestActive, startLevelTest, handleLevelTestInput } from './leveltest.js';
import { initErrors, handleErrorFlow } from './errors.js';
import { initPricing } from './pricing.js';
import { initAncillary } from './ancillary.js';
import { initQueues, isQueueModeActive, handleQueueModeInput } from './queues.js'; // إضافة المرحلة 8
import { initCoaching, isCoachingKeyword, handleCoachingKeyword, onCommandProcessed } from './coaching.js'; // إضافة المرحلة 9
import { initPerformance } from './performance.js'; // إضافة المرحلة 10
const outputEl = document.getElementById('output');
const inputEl = document.getElementById('command-input');

function appendLine(text, className) {
  const div = document.createElement('div');
  if (className) div.className = className;
  div.textContent = text;
  outputEl.appendChild(div);
}

function appendBlock(text, className) {
  String(text)
    .split('\n')
    .forEach((line) => appendLine(line, className));
}

function scrollToBottom() {
  outputEl.scrollTop = outputEl.scrollHeight;
}

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`تعذر تحميل ${path}`);
  }
  return response.json();
}

async function loadData() {
  try {
    const [
      airports, airlines, rbd, flights, levelTestData, errorsData, faresData,
      hotelsData, carsData, ssrData, timaticData,
      queuesData, // إضافة المرحلة 8
      scenariosData // إضافة المرحلة 9
    ] = await Promise.all([
      fetchJSON('data/airports.json'),
      fetchJSON('data/airlines.json'),
      fetchJSON('data/rbd.json'),
      fetchJSON('data/flights.json'),
      fetchJSON('data/level-test.json'),
      fetchJSON('data/errors.json'),
      fetchJSON('data/fares.json'),
      fetchJSON('data/hotels.json'),
      fetchJSON('data/cars.json'),
      fetchJSON('data/ssr.json'),
      fetchJSON('data/timatic.json'),
      fetchJSON('data/queues.json'), // إضافة المرحلة 8
      fetchJSON('data/scenarios.json') // إضافة المرحلة 9
    ]);

    initParser({ airports, airlines, rbd, flights });
    initLevelTest(levelTestData);
    initErrors(errorsData);
    initPricing(faresData);
    initAncillary({ hotels: hotelsData, cars: carsData, ssr: ssrData, timatic: timaticData });
    initCoaching(scenariosData); // إضافة المرحلة 9
    initPerformance(); // إضافة المرحلة 10 — تحميل الإحصائيات المحفوظة (لو موجودة) عبر storage.js

    inputEl.disabled = false;
    inputEl.focus();
  } catch (err) {
    appendLine('DATA LOAD ERROR - CHECK CONNECTION AND RELOAD', 'response-line');
    scrollToBottom();
  }
}

function handleSubmit() {
  const raw = inputEl.value;
  if (!raw || !raw.trim()) return;

  const normalized = normalizeInput(raw);
  appendLine(normalized, 'command-line');

  let response;
  let isRegularCommand = false;

  if (isTestActive()) {
    response = handleLevelTestInput(normalized);
  } else if (normalized === 'LEVELTEST') {
    response = startLevelTest();
  } else if (isQueueModeActive()) {
    // === إضافة المرحلة 8 ===
    response = handleQueueModeInput(normalized);
  } else if (isCoachingKeyword(normalized)) {
    // === إضافة المرحلة 9 ===
    response = handleCoachingKeyword(normalized);
  } else {
    response = parseCommand(normalized);
    isRegularCommand = true;
  }

  appendBlock(response, 'response-line');

  if (isRegularCommand) {
    const errorFlow = handleErrorFlow(response, normalized);
    if (errorFlow) {
      errorFlow.forEach((line) => appendLine(line, 'error-flow-line'));
    }

    // === إضافة المرحلة 9 (+ تكيف المرحلة 10 جوه coaching.js) ===
    const coachingHint = onCommandProcessed(normalized, response);
    if (coachingHint) {
      coachingHint.forEach((line) => appendLine(line, 'coaching-line'));
    }
  }

  appendLine('', 'blank-line');

  inputEl.value = '';
  scrollToBottom();
}

inputEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleSubmit();
  }
});

loadData();
