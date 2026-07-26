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
*/

import { initParser, normalizeInput, parseCommand } from './parser.js';
import { initLevelTest, isTestActive, startLevelTest, handleLevelTestInput } from './leveltest.js';
import { initErrors, handleErrorFlow } from './errors.js';

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
    const [airports, airlines, rbd, flights, levelTestData, errorsData] = await Promise.all([
      fetchJSON('data/airports.json'),
      fetchJSON('data/airlines.json'),
      fetchJSON('data/rbd.json'),
      fetchJSON('data/flights.json'),
      fetchJSON('data/level-test.json'),
      fetchJSON('data/errors.json')
    ]);

    initParser({ airports, airlines, rbd, flights });
    initLevelTest(levelTestData);
    initErrors(errorsData);

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
