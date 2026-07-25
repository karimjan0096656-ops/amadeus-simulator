/*
  leveltest.js — اختبار تحديد المستوى (المرحلة 3)

  بيشتغل فوق نفس محرك المرحلة 2 (AN/SS/NM/AP/TK/RF/ER) من غير ما يعدّل
  في parser.js أو pnr.js. الاختبار بيستدعي parseCommand من parser.js
  بنفس الطريقة اللي main.js بيستخدمها.

  ملحوظة تصميم مهمة عن التصحيح (grading):
  المحاولة الصح بس هي اللي بتتنفذ فعليًا على المحرك الحقيقي (وبالتالي
  بتغيّر حالة الـ PNR / آخر عرض توفر). المحاولات الغلط ما بتتبعتش
  لـ parseCommand أصلاً. السبب: أوامر زي SS وNM عندهم قيد "مرة واحدة
  بس لكل PNR" في pnr.js (مفيش أكتر من Segment واحد أو اسم واحد في
  المرحلة 2). لو محاولة غلط لكن متوافقة مع صيغة الأمر (format) اتنفذت
  فعليًا، ممكن تاكل الفرصة الوحيدة دي وتخلي المحاولة الصح اللي بعدها
  ترجع "MULTIPLE SEGMENTS/PASSENGERS NOT SUPPORTED" غلط. عشان كده
  التصحيح بيتم بمقارنة نصية مع expectedCommand الأول، ولو مطابق
  يتم التنفيذ الحقيقي وتظهر نتيجته الفعلية للمتدرب.
*/

import { parseCommand } from './parser.js';
import { resetPNR } from './pnr.js';

let tasks = [];

let testActive = false;
let currentTaskIndex = 0;
let currentStepIndex = 0;
let attemptsOnCurrentStep = 0;
let currentTaskFirstAttempt = true;
let taskResults = [];

export function initLevelTest(data) {
  tasks = Array.isArray(data) ? data : [];
}

export function isTestActive() {
  return testActive;
}

function getSteps(task) {
  return Array.isArray(task.expectedCommand) ? task.expectedCommand : [task.expectedCommand];
}

export function startLevelTest() {
  if (!tasks || tasks.length === 0) {
    return 'LEVEL TEST DATA NOT AVAILABLE - RELOAD AND TRY AGAIN';
  }

  testActive = true;
  currentTaskIndex = 0;
  currentStepIndex = 0;
  attemptsOnCurrentStep = 0;
  currentTaskFirstAttempt = true;
  taskResults = [];

  const firstTask = tasks[0];
  return [
    '=== اختبار تحديد المستوى — 5 مهام ===',
    '',
    `المهمة 1 من ${tasks.length}:`,
    firstTask.prompt
  ].join('\n');
}

export function handleLevelTestInput(normalizedCmd) {
  if (!testActive) {
    return 'LEVEL TEST NOT ACTIVE';
  }

  const task = tasks[currentTaskIndex];
  const steps = getSteps(task);
  const expected = steps[currentStepIndex];

  if (normalizedCmd === expected) {
    return handleCorrectAttempt(task, steps, normalizedCmd);
  }
  return handleWrongAttempt(task);
}

function handleCorrectAttempt(task, steps, normalizedCmd) {
  const engineOutput = parseCommand(normalizedCmd);

  currentStepIndex++;
  attemptsOnCurrentStep = 0;

  if (currentStepIndex < steps.length) {
    return [
      '✔ صح.',
      engineOutput,
      '',
      `(الخطوة ${currentStepIndex + 1} من ${steps.length})`
    ].join('\n');
  }

  taskResults.push({ id: task.id, correct: true, firstAttempt: currentTaskFirstAttempt });
  return advanceToNextTaskOrFinish(['✔ صح.', engineOutput], false);
}

function handleWrongAttempt(task) {
  attemptsOnCurrentStep++;
  currentTaskFirstAttempt = false;

  if (attemptsOnCurrentStep < 2) {
    return '✘ الأمر مش مطابق للمطلوب في المهمة دي. عندك محاولة واحدة كمان.';
  }

  taskResults.push({ id: task.id, correct: false, firstAttempt: false });
  return advanceToNextTaskOrFinish(['✘ خلصت المحاولتين. المهمة دي اتسجلت "فشل".'], true);
}

function advanceToNextTaskOrFinish(leadLines, isFailure) {
  currentTaskIndex++;
  currentStepIndex = 0;
  attemptsOnCurrentStep = 0;
  currentTaskFirstAttempt = true;

  if (currentTaskIndex < tasks.length) {
    const nextTask = tasks[currentTaskIndex];
    const lines = [...leadLines];
    if (isFailure) {
      lines[0] = `${lines[0]} ننتقل للمهمة اللي بعدها.`;
    }
    lines.push('', `المهمة ${currentTaskIndex + 1} من ${tasks.length}:`, nextTask.prompt);
    return lines.join('\n');
  }

  testActive = false;
  resetPNR();
  return [...leadLines, '', buildFinalReport()].join('\n');
}

function buildFinalReport() {
  const correctCount = taskResults.filter((r) => r.correct).length;
  const allFirstAttempt =
    taskResults.length === tasks.length && taskResults.every((r) => r.correct && r.firstAttempt);

  let level;
  if (correctCount === 5 && allFirstAttempt) {
    level = 'متقدم';
  } else if (correctCount >= 4) {
    level = 'متوسط';
  } else {
    level = 'مبتدئ';
  }

  return [
    '------ نتيجة اختبار تحديد المستوى ------',
    `المهام الصح: ${correctCount} من 5`,
    `المستوى: ${level}`,
    '-----------------------------------------'
  ].join('\n');
}
