/*
  main.js — نقطة البداية: تحميل ملفات JSON، تفعيل/تعطيل الإدخال،
  عرض الأوامر والردود على الشاشة. لا يحتوي على أي منطق تحليل أو
  تحقق — كل ده مسؤولية parser.js (قسم 7 من الـ Spec).
*/

import { initParser, normalizeInput, parseCommand } from './parser.js';

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
    const [airports, airlines, rbd, flights] = await Promise.all([
      fetchJSON('data/airports.json'),
      fetchJSON('data/airlines.json'),
      fetchJSON('data/rbd.json'),
      fetchJSON('data/flights.json')
    ]);

    initParser({ airports, airlines, rbd, flights });

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

  const response = parseCommand(normalized);
  appendBlock(response, 'response-line');

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
