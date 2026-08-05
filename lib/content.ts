export type ModuleStatus = 'completed' | 'active' | 'locked'

export type CommandCard = {
  command: string
  label: string
  example: string
  explanation: string
}

export type TheoryBlock = {
  heading: string
  body: string
}

export type LessonModule = {
  id: string
  code: string
  title: string
  subtitle: string
  track: 'core' | 'advanced'
  status: ModuleStatus
  duration: string
  progress: number // 0-100
  intro: string
  theory: TheoryBlock[]
  commands: CommandCard[]
  starterCommand: string
}

export const modules: LessonModule[] = [
  {
    id: 'system-entry',
    code: 'CORE 01',
    title: 'System Entry',
    subtitle: 'Sign in & session basics',
    track: 'core',
    status: 'completed',
    duration: '12 min',
    progress: 100,
    intro:
      'Every Amadeus workflow begins with a clean session. Learn how the cryptic entry format works, how the GDS echoes your commands, and how to read a raw terminal response.',
    theory: [
      {
        heading: 'What is a GDS?',
        body: 'A Global Distribution System (GDS) is the real-time backbone that connects travel agents to airline inventory, fares, and ticketing. Amadeus is the largest GDS in the world and uses a compact, keyboard-driven command language instead of a graphical interface — speed over clicks.',
      },
      {
        heading: 'Reading the terminal',
        body: 'You type a cryptic entry, press enter, and the system returns a raw text response. There are no menus. Mastering the syntax is the difference between a 3-second booking and a frustrated customer.',
      },
    ],
    commands: [
      {
        command: 'JD',
        label: 'Encode a city',
        example: 'DAN CAI',
        explanation: 'Look up an airport or city code before you build an availability request.',
      },
    ],
    starterCommand: 'AN15JULCAIDXB',
  },
  {
    id: 'availability',
    code: 'CORE 02',
    title: 'Availability',
    subtitle: 'Search live flight inventory',
    track: 'core',
    status: 'active',
    duration: '18 min',
    progress: 45,
    intro:
      'The availability display (AN) is where every booking starts. You will read booking classes (RBD), seat counts, and flight times straight from a raw availability screen.',
    theory: [
      {
        heading: 'The AN entry',
        body: 'AN = Availability Neutral. The format is AN + date (DDMMM) + origin + destination. Example: AN15JULCAIDXB requests all Cairo→Dubai flights on 15 July. Each result line is numbered so you can sell directly from it.',
      },
      {
        heading: 'Booking classes (RBD)',
        body: 'Each letter/number pair such as Y9 or C4 is a Reservation Booking Designator and the number of seats still sellable in that class. Higher cabins (F/C/J) sit to the left; discounted economy (K/M/H) sits to the right. An "L" means waitlist only.',
      },
    ],
    commands: [
      {
        command: 'AN',
        label: 'Availability',
        example: 'AN15JULCAIDXB',
        explanation: 'Show all flights for a city pair on a given date, with live booking-class counts.',
      },
      {
        command: 'SN',
        label: 'Schedule',
        example: 'SN15JULCAIDXB',
        explanation: 'Show the timetable only (no seat availability) — useful for planning.',
      },
    ],
    starterCommand: 'AN15JULCAIDXB',
  },
  {
    id: 'pnr-creation',
    code: 'CORE 03',
    title: 'PNR Creation',
    subtitle: 'Build the passenger record',
    track: 'core',
    status: 'locked',
    duration: '25 min',
    progress: 0,
    intro:
      'A PNR (Passenger Name Record) is the container for a booking. Learn the five mandatory elements every valid PNR needs before it can be saved.',
    theory: [
      {
        heading: 'The 5 mandatory elements',
        body: 'A savable PNR needs: an itinerary segment (SS), a name (NM), a contact (AP), a ticketing arrangement (TK), and a received-from (RF). Miss one and the End Transaction will be rejected.',
      },
      {
        heading: 'Selling from availability',
        body: 'After an AN display, SS1Y1 means: sell from line 1, class Y, 1 seat. The segment is added to the PNR in status HK (holding confirmed) or HL (waitlisted).',
      },
    ],
    commands: [
      { command: 'SS', label: 'Sell segment', example: 'SS1Y1', explanation: 'Sell 1 seat in class Y from line 1 of the last availability display.' },
      { command: 'NM', label: 'Add name', example: 'NM1AHMED/MOHAMED MR', explanation: 'Add one passenger: lastname/firstname title.' },
      { command: 'AP', label: 'Contact', example: 'AP CAI 0121234567', explanation: 'Add an agency phone contact element.' },
      { command: 'TK', label: 'Ticketing', example: 'TKOK', explanation: 'Confirm the ticketing arrangement (OK = ticket now).' },
      { command: 'RF', label: 'Received from', example: 'RF MALIK', explanation: 'Record who requested the booking, then end with ER.' },
    ],
    starterCommand: 'AN15JULCAIDXB',
  },
  {
    id: 'fare-quote',
    code: 'CORE 04',
    title: 'Fare Quote',
    subtitle: 'Price the itinerary',
    track: 'core',
    status: 'locked',
    duration: '20 min',
    progress: 0,
    intro:
      'Before issuing a ticket you must know the price. Learn to display public fares (FQD) and to price the actual itinerary in the PNR (FXP).',
    theory: [
      {
        heading: 'FQD vs FXP',
        body: 'FQD shows the fare tariff for a city pair — the shop window. FXP prices the exact segments already sold in your PNR, applying the booked class and taxes. FXB finds the cheapest available class.',
      },
    ],
    commands: [
      { command: 'FQD', label: 'Fare display', example: 'FQDCAIDXB', explanation: 'Display published fares and tax breakdown for a city pair.' },
      { command: 'FXP', label: 'Price itinerary', example: 'FXP', explanation: 'Price the segments currently in the PNR and store a TST.' },
      { command: 'FXB', label: 'Best buy', example: 'FXB', explanation: 'Re-price for the lowest available fare, rebooking classes if needed.' },
    ],
    starterCommand: 'FQDCAIDXB',
  },
  {
    id: 'ticketing',
    code: 'ADV 01',
    title: 'Ticketing',
    subtitle: 'Issue the e-ticket',
    track: 'advanced',
    status: 'locked',
    duration: '22 min',
    progress: 0,
    intro:
      'Turning a priced PNR into a valid travel document. Learn the issuance flow and the time-limit rules that protect the booking.',
    theory: [
      {
        heading: 'From TST to TKT',
        body: 'Once FXP has stored a TST (Transitional Stored Ticket), TTP issues the e-ticket against it. The PNR must already contain a valid form of payment and ticketing arrangement.',
      },
    ],
    commands: [
      { command: 'TTP', label: 'Issue ticket', example: 'TTP', explanation: 'Issue the e-ticket from the stored TST.' },
      { command: 'TKTL', label: 'Time limit', example: 'TKTL20JUL', explanation: 'Set a ticketing time limit to hold the fare.' },
    ],
    starterCommand: 'FXP',
  },
  {
    id: 'reissue',
    code: 'ADV 02',
    title: 'Reissue',
    subtitle: 'Change an issued ticket',
    track: 'advanced',
    status: 'locked',
    duration: '28 min',
    progress: 0,
    intro:
      'When a passenger changes plans, the ticket must be reissued — recalculating fare differences and penalties.',
    theory: [
      {
        heading: 'Retrieve, change, re-price',
        body: 'Retrieve the PNR (RT), cancel the affected element (XE), sell the new segment, then re-price. The difference plus any change fee becomes the ADC (Additional Collection).',
      },
    ],
    commands: [
      { command: 'RT', label: 'Retrieve PNR', example: 'RTABCDEF', explanation: 'Retrieve an existing PNR by its 6-letter record locator.' },
      { command: 'XE', label: 'Cancel element', example: 'XE3', explanation: 'Cancel a specific element line from the PNR.' },
    ],
    starterCommand: 'RTABCDEF',
  },
  {
    id: 'refund',
    code: 'ADV 03',
    title: 'Refund',
    subtitle: 'Process a refund',
    track: 'advanced',
    status: 'locked',
    duration: '24 min',
    progress: 0,
    intro:
      'Refunds return value to the passenger while applying the fare rules and cancellation penalties correctly.',
    theory: [
      {
        heading: 'Fare rules first',
        body: 'Always check the fare rules (FQN) before quoting a refund. Non-refundable fares may still return unused taxes. The refund is processed against the original document.',
      },
    ],
    commands: [
      { command: 'FQN', label: 'Fare rules', example: 'FQN1', explanation: 'Display the detailed fare rule / penalty conditions for a fare line.' },
    ],
    starterCommand: 'FQDCAIDXB',
  },
  {
    id: 'ssr-osi',
    code: 'ADV 04',
    title: 'SSR / OSI',
    subtitle: 'Special & other service info',
    track: 'advanced',
    status: 'locked',
    duration: '16 min',
    progress: 0,
    intro:
      'Communicate passenger needs to the airline — special meals, wheelchairs, and free-text advisories.',
    theory: [
      {
        heading: 'SSR vs OSI',
        body: 'SSR (Special Service Request) uses standard IATA codes the airline must action, e.g. SRVGML for a vegetarian meal. OSI (Other Service Information) is a free-text note that needs no airline reply.',
      },
    ],
    commands: [
      { command: 'SR', label: 'Special service', example: 'SRVGML', explanation: 'Request a coded special service such as a vegetarian meal.' },
      { command: 'OS', label: 'Other service info', example: 'OS YY VIP PAX', explanation: 'Send a free-text advisory to the airline.' },
      { command: 'RM', label: 'Remark', example: 'RM CALL BACK 5PM', explanation: 'Add an internal agency remark (not sent to the airline).' },
    ],
    starterCommand: 'AN15JULCAIDXB',
  },
]

export const tracks = [
  {
    id: 'core' as const,
    name: 'Basic GDS Core',
    tagline: 'Foundations of reservations',
    moduleIds: ['system-entry', 'availability', 'pnr-creation', 'fare-quote'],
  },
  {
    id: 'advanced' as const,
    name: 'Advanced Operations',
    tagline: 'Ticketing, changes & servicing',
    moduleIds: ['ticketing', 'reissue', 'refund', 'ssr-osi'],
  },
]

export function getModule(id: string) {
  return modules.find((m) => m.id === id)
}

export const profile = {
  name: 'Nadia Karim',
  handle: 'Trainee Consultant',
  level: 'Core • Level 2',
  streak: 7,
  xp: 2480,
  nextLevelXp: 3000,
  rank: 'Cadet',
  completedModules: 1,
  totalModules: modules.length,
  accuracy: 92,
  ticketsIssued: 14,
}

export const dailyChallenge = {
  title: 'Daily Command Challenge',
  prompt: 'A customer wants to fly Cairo → Dubai on 15 July. Display availability.',
  answer: 'AN15JULCAIDXB',
  reward: '+120 XP',
}
