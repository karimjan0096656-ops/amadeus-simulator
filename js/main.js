/*
  main.js — نقطة البداية: تحميل ملفات JSON، تفعيل/تعطيل الإدخال،
  عرض الأوامر والردود على الشاشة. لا يحتوي على أي منطق تحليل أو
  تحقق — كل ده مسؤولية parser.js (قسم 7 من الـ Spec).

  المرحلة 3: إضافة أمر داخلي LEVELTEST بيوجّه الإدخال لـ leveltest.js
  بدل parser.js أثناء الاختبار، من غير ما يلمس parser.js أو pnr.js.

  المرحلة 5: إضافة محرك تصحيح الأخطاء (errors.js) في نقطتين بس:
  1) تحميل data/errors.json وتهيئة errors.js في loadData() (نفس نمط
     initParser/initLevelTest الموجود بالفعل).
  2) نقطة تكامل واحدة داخل handleSubmit() — بعد ما parseCommand()
     يرجع رده، بنستدعي handleErrorFlow() بس لو الرد جاي من مسار
     الأوامر العادية (isRegularCommand=true)، يعني أبدًا مش وقت
     LEVELTEST نشط ولا وقت بدء LEVELTEST. مفيش أي تغيير في مسار
     isTestActive()/startLevelTest() خالص.

  === إضافة المرحلة 6 (الأسعار) ===
  ⚠ فرق مهم عن سبك المرحلة 6 لازم Malik ياخد باله منه: قسم 5 من
  السبك قال "main.js مفيش أي تعديل متوقع فيه" لأن الأوامر الجديدة
  (FQD, FXP) بتمر من نفس مسار parseCommand() الموجود بالفعل — وده
  صح جزئيًا بس. لسه في تعديل واحد ضروري لازم يحصل هنا، وإلا محرك
  التسعير هيفضل من غير أي بيانات خالص:

  parser.js بيستورد getFareQuote/getFareForBookingClass من pricing.js،
  وpricing.js مالوش أي بيانات إلا لما حد ينادي initPricing(data) —
  بالظبط زي initParser/initLevelTest/initErrors. من غير إضافة تحميل
  data/fares.json هنا ونداء initPricing() بيه، هتفضل faresData في
  pricing.js فاضية للأبد، وأي أمر FQD أو FXP هيرجع "مفيش أسعار"
  (NO FARES FOUND FOR CITY PAIR) دايمًا حتى لو المسار موجود فعلًا
  في fares.json. ده مش تغيير في منطق التوجيه أو handleSubmit — بس
  إضافة سطرين في Promise.all وسطر initPricing واحد، بنفس نمط باقي
  الملفات اللي بتتحمّل بالفعل.

  === إضافة المرحلة 7 (الخدمات الإضافية) ===
  نفس النمط بالظبط اللي حصل مع initPricing في المرحلة اللي فاتت:
  ancillary.js (بيانات الفنادق/السيارات/SSR/Timatic) مالوش أي بيانات
  إلا لما initAncillary(data) تتنادى بيه. عشان كده اتضاف تحميل
  الأربع ملفات الجديدة (hotels.json, cars.json, ssr.json, timatic.json)
  في Promise.all، ونداء initAncillary() واحد بيهم مجمّعين. مفيش أي
  تغيير في handleSubmit() خالص هنا (بعكس errors.js في المرحلة 5) —
  أوامر المرحلة 7 كلها بتمر من نفس مسار parseCommand() → isRegularCommand
  = true → handleErrorFlow() الموجود بالفعل، من غير أي نقطة تكامل
  جديدة مطلوبة.
*/

import { initParser, normalizeInput, parseCommand } from './parser.js';
import { initLevelTest, isTestActive, startLevelTest, handleLevelTestInput } from './leveltest.js';
import { initErrors, handleErrorFlow } from './errors.js';
import { initPricing } from './pricing.js';
import { initAncillary } from './ancillary.js'; // إضافة المرحلة 7

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
      hotelsData, carsData, ssrData, timaticData // إضافة المرحلة 7
    ] = await Promise.all([
      fetchJSON('data/airports.json'),
      fetchJSON('data/airlines.json'),
      fetchJSON('data/rbd.json'),
      fetchJSON('data/flights.json'),
      fetchJSON('data/level-test.json'),
      fetchJSON('data/errors.json'),
      fetchJSON('data/fares.json'),
      fetchJSON('data/hotels.json'), // إضافة المرحلة 7
      fetchJSON('data/cars.json'), // إضافة المرحلة 7
      fetchJSON('data/ssr.json'), // إضافة المرحلة 7
      fetchJSON('data/timatic.json') // إضافة المرحلة 7
    ]);

    initParser({ airports, airlines, rbd, flights });
    initLevelTest(levelTestData);
    initErrors(errorsData);
    initPricing(faresData);
    initAncillary({ hotels: hotelsData, cars: carsData, ssr: ssrData, timatic: timaticData }); // إضافة المرحلة 7

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
