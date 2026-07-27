/*
  queues.js — إدارة الطوابير (المرحلة 8، الخيار أ: طوابير وهمية مُجهّزة مسبقًا)

  نفس فلسفة pricing.js و ancillary.js بالظبط: ملف بيانات + منطق منفصل
  عن parser.js، بيتحمّل ببيانات data/queues.json عن طريق initQueues()
  اللي بتتنادى من main.js في loadData() (نفس نمط initPricing/initAncillary).

  المسؤوليات هنا:
  1) بيانات الطوابير نفسها (في الذاكرة بس — بتترجع لحالتها الأصلية
     بمجرد ما الصفحة تتعمل reload، زي أي حالة جلسة تانية في المشروع
     ده، مفيش localStorage هنا برضه).
  2) القراءة (QT/QC/QS) — بتتنادى من parser.js زي أي دالة بيانات تانية.
  3) وضع تصفح الطابور (QN/QI) — ده مختلف عن باقي المشروع: بيحتاج
     "يقاطع" مسار الإدخال العادي بالكامل (زي LEVELTEST بالظبط)، مش
     بس يرجع رسالة. عشان كده الحالة دي (browseState) وقفل التوجيه
     (isQueueModeActive) عايشين هنا في queues.js، ومنادَيين من main.js
     مباشرة بنفس نمط isTestActive/handleLevelTestInput الموجود بالفعل
     — قرار تصميمي موثّق في تعليق main.js كمان.

  === قرار مهم لازم Malik ياخده باله منه (تعارض داخلي في سبك المرحلة
  نفسه — قسم 0 من السبك بيقول "لو لقيت تعارض، الأولوية للكود الفعلي
  وأبلغ الفرق") ===
  قسم 4.7 من سبك المرحلة 8 افترض إن أمر QE بيتحقق من نفس شروط ER
  الخمسة (segments/name/contact/ticketing/receivedFrom) على "الـ PNR
  الحالي" مباشرة. لكن قسم 1 من نفس السبك (ملخص الحالة الحالية) بيقول
  حرفيًا إن pnr.js بينادي resetPNR() تلقائيًا جوه endAndRetrieve()
  بعد كل ER ناجح — يعني بعد ما المتدرب يعمل ER بنجاح، الـ PNR الحالي
  بيرجع فاضي فورًا، ومفيش أي بيانات "PNR مكتمل" تفضل موجودة نلحق
  نحطها على طابور في خطوة QE منفصلة بعد كده (السيناريو اللي قسم 4.7
  نفسه فضّله: ER الأول، وبعدين QE كخطوة تانية).

  الحل المُنفَّذ (تفاصيل كاملة في تعليق handleER المعدّل في parser.js):
  التقاط لقطة بسيطة (اسم الراكب + Record Locator) لحظة نجاح ER، قبل
  ما pnr.js يصفّر الحالة، وتخزينها في متغير جلسة جديد (lastCompletedPnr)
  جوه parser.js. أمر QE بيستخدم اللقطة دي لو موجودة؛ ولو مش موجودة
  (يعني لسه معملتش ER خالص) بيرجع لفحص الـ PNR الحالي بنفس شيكات ER
  الخمسة بالظبط — عشان اختبار القبول رقم 9 (QE قبل ER) يرجع نفس رسائل
  ER الموجودة فعلاً، زي ما قسم 4.7 نص عليه.

  هيدخل الجزء ده من التنفيذ في handleER() جوه parser.js (لقطة قبل
  النداء بس، من غير أي تغيير في منطق endAndRetrieve() نفسه أو في شكل
  رسالة النجاح) — ده الاستثناء الوحيد لقاعدة "مفيش لمس لأي دالة handle
  موجودة" المذكورة في قسم 5 من السبك، وسببه موثّق بالكامل هنا ومكرر
  هناك.
*/

let queuesData = [];
let browseState = null; // { queueNumber, category, position } أو null

export function initQueues(data) {
  queuesData = Array.isArray(data && data.queues) ? data.queues : [];
}

export function isQueueModeActive() {
  return browseState !== null;
}

function findQueue(queueNumber, category) {
  return queuesData.find(
    (q) => q.queueNumber === queueNumber && q.category === category
  );
}

function formatPnrDisplay(pnr) {
  return [
    '----------- PNR RETRIEVED FROM QUEUE -----------',
    `RECORD LOCATOR: ${pnr.recordLocator}`,
    `1. ${pnr.passengerName}`,
    `2. ${pnr.segmentSummary}`,
    `NOTE: ${pnr.note}`,
    '--------------------------------------------------'
  ].join('\n');
}

/* ---------------- QT (Queue Table / count summary) ---------------- */
export function getQueueTableDisplay() {
  if (queuesData.length === 0) return 'NO ACTIVE QUEUES';

  const lines = [];
  lines.push('** QUEUE COUNT - QT **');
  lines.push('');
  lines.push('Q   CAT  DESCRIPTION                COUNT');

  queuesData.forEach((q) => {
    const qCol = String(q.queueNumber).padEnd(3, ' ');
    const catCol = String(q.category).padEnd(4, ' ');
    const descCol = String(q.nameEn).padEnd(26, ' ');
    lines.push(`${qCol} ${catCol} ${descCol} ${q.pnrs.length}`);
  });

  return lines.join('\n');
}

/* ---------------- QC (Queue Count) ---------------- */
export function getQueueCountDisplay(queueNumber, category) {
  const matches =
    category === null
      ? queuesData.filter((q) => q.queueNumber === queueNumber)
      : queuesData.filter(
          (q) => q.queueNumber === queueNumber && q.category === category
        );

  if (matches.length === 0) return 'QUEUE NOT FOUND';

  const total = matches.reduce((sum, q) => sum + q.pnrs.length, 0);
  const label = category === null ? `Q${queueNumber}` : `Q${queueNumber} C${category}`;

  return `${label}  ${total} PNR${total === 1 ? '' : 'S'}`;
}

/* ---------------- QS (Queue Start / browse) ---------------- */
export function startQueueBrowse(queueNumber, category) {
  const queue = findQueue(queueNumber, category);
  if (!queue) return 'QUEUE NOT FOUND';
  if (queue.pnrs.length === 0) return 'QUEUE EMPTY';

  browseState = { queueNumber, category, position: 0 };
  return formatPnrDisplay(queue.pnrs[0]);
}

/* ---------------- QN (Queue Next) و QI (Queue Ignore) ----------------
   بيتنادوا بس من main.js وقت ما isQueueModeActive() === true (زي
   handleLevelTestInput بالظبط) — مش عن طريق parser.js/COMMAND_CODES. */
export function handleQueueModeInput(normalized) {
  if (normalized === 'QN') return advanceQueue();
  if (normalized === 'QI') return ignoreQueue();
  return 'QUEUE MODE ACTIVE - USE QN OR QI';
}

function advanceQueue() {
  const queue = findQueue(browseState.queueNumber, browseState.category);
  if (!queue) {
    browseState = null;
    return 'END OF QUEUE';
  }

  queue.pnrs.splice(browseState.position, 1);

  if (browseState.position >= queue.pnrs.length) {
    browseState = null;
    return 'END OF QUEUE';
  }

  return formatPnrDisplay(queue.pnrs[browseState.position]);
}

function ignoreQueue() {
  browseState = null;
  return 'QUEUE IGNORED';
}

/* ---------------- QE (Queue Entry) ----------------
   بتتنادى من parser.js بعد ما handleQE بتاعتها تتأكد إن فيه PNR
   مكتمل (لقطة lastCompletedPnr أو فحص شيكات ER الخمسة — راجع تعليق
   أعلى الملف). هنا بس مسؤولية التخزين في الطابور المطلوب. لو رقم
   الطابور مش موجود أصلًا في queues.json، بيتعمل طابور جديد بفئة 0
   (زي أماديوس الحقيقي فعليًا — تقدر تحط PNR على أي رقم طابور حتى لو
   كان فاضي قبل كده). */
export function addPnrToQueue(queueNumber, pnrInfo) {
  let queue = queuesData.find((q) => q.queueNumber === queueNumber);

  if (!queue) {
    queue = {
      queueNumber,
      category: 0,
      nameAr: 'طابور مُنشأ يدويًا',
      nameEn: 'MANUAL QUEUE',
      pnrs: []
    };
    queuesData.push(queue);
  }

  queue.pnrs.push({
    recordLocator: pnrInfo.recordLocator,
    passengerName: pnrInfo.passengerName,
    segmentSummary: 'N/A',
    note: 'PLACED BY AGENT (QE)'
  });
}
