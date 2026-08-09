// English wording — the master dictionary. `fr.ts` must mirror this shape
// exactly (enforced by the Messages type), so adding/removing a key here
// without updating fr.ts is a build error.
//
// Scope note: this holds UI chrome only. The v2 journal's long-form content
// (entry blurbs, travel captions, the career log) lives in src/data/* — it is
// content, not interface, and is authored in one language for now.

export const en = {
  common: {
    half: 'Half',
    formatHint: 'Format: mm:ss or h:mm:ss',
  },

  // ---- the journal book ----
  home: {
    volume: 'FIELD JOURNAL · VOL. I',
    position: 'current position: 49°16′N, 123°07′W',
    city: 'Vancouver, BC',
    loadingWeather: 'checking the sky…',
    tagline: 'curious about everything.',
    sayHi: 'say hi',
    meLabel: 'me',
    // The dismissible notice shown only in the stacked layout — see .pocket.
    pocketLabel: 'POCKET EDITION',
    pocketNote:
      'The full journal opens as a two-page spread on a wider screen.',
    pocketDismiss: 'Dismiss',
    turnPage: 'turn the page ➝',
    back: '⟵ back',
    backHome: 'back home ➝',
    tabs: {
      home: 'home',
      endurance: 'endurance',
      work: 'work',
      travel: 'travel',
    },
    // Open-Meteo weather_code buckets, matching the five hand-drawn icons.
    weather: {
      clear: 'clear skies',
      partly: 'partly cloudy',
      overcast: 'overcast',
      fog: 'foggy',
      rain: 'rain',
      snow: 'snowing',
      storm: 'thunderstorm',
    },
  },

  endurance: {
    eyebrow: 'ENTRY 01',
    kicker: 'run · tri · ride',
    title: 'Endurance',
    blurb: 'Runner, among other things.',
    kmSuffix: (year: string) => `run so far in ${year}`,
    pbTitle: 'PERSONAL BESTS',
    soon: 'soon…',
    journalTitle: 'RACE JOURNAL',
    racesCount: (n: number) => `${n} races · scroll ↓`,
    upNext: 'UP NEXT',
    workbenchTitle: 'THE WORKBENCH · RUNNING TOOLS',
    firstHalfIron: 'My first IRONMAN 70.3!',
    prDistances: {
      '5K': '5K',
      '10K': '10K',
      Half: 'Half Marathon',
      Marathon: 'Marathon',
    },
  },

  work: {
    eyebrow: 'ENTRY 02',
    kicker: 'senior software engineer',
    title: 'Work',
    blurb:
      '9+ years of experience designing and operating high-scale distributed systems in enterprise SaaS environments',
    resumeTitle: 'THE RÉSUMÉ / CV',
    resumeBlurb: 'grab the full copy, one page, PDF',
    careerTitle: 'CAREER LOG',
    toolbeltLabel: 'in the toolbelt:',
    fieldNotes: 'FIELD NOTES',
    photoCaption: 'the Captain Wallet loft, Paris 2019 - startup years',
  },

  travel: {
    eyebrow: 'ENTRY 03',
    kicker: 'home is a moving target',
    title: 'Travel',
    blurb: 'Born in France, currently parked in Vancouver',
    subBlurb: 'the places that left a mark on me.',
  },

  // ---- the workbench ----
  toolbox: {
    eyebrow: 'THE WORKBENCH',
    title: 'Running Tools',
    blurb: 'Small tools built for my own training, shared here.',
    unitsLabel: 'UNITS — ALL TOOLS',
    builtBy: 'Built by Enzo Muhlinghaus —',
    // The arrow is markup, not copy — see `.arrow-ne` in global.css.
    readJournal: 'come read my journal',
    // The design's line ends "· Strava Namer is a demo — connect your account
    // to run it live"; dropped while that tool is off the bench.
    disclaimer: 'estimates only · times accept mm:ss or h:mm:ss · Based on Jack Daniels’ VDOT model',
  },

  pace: {
    title: 'Pace Calculator',
    blurb: 'Any two, and the third follows.',
    help: 'Enter any two of distance, time, or pace — it solves the third. Quick chips drop in common race distances.',
    modes: {
      pace: 'PACE',
      time: 'TIME',
      distance: 'DISTANCE',
    },
    distanceLabel: 'DISTANCE',
    timeLabel: 'TIME',
    paceLabel: 'PACE',
    resultPace: '→ PACE',
    resultTime: '→ TIME',
    resultDistance: '→ DIST',
  },

  predictor: {
    title: 'Race Predictor',
    blurb: 'From one result, the rest follow.',
    help: 'Give one race result (or your MAS) and it projects equivalent times across the other distances, via Jack Daniels’ VDOT model.',
    predictFrom: 'PREDICT FROM',
    sourceRace: 'A RACE',
    sourceMas: 'MAS',
    yourTimeFor: (d: string) => `YOUR ${d.toUpperCase()} TIME`,
    masFieldLabel: 'YOUR MAS (KM/H)',
    predicted: '→ PREDICTED',
    tagVdot: 'VDOT',
    tagMasVdot: 'MAS→VDOT',
    vdotHint:
      'VDOT is a single fitness score read from your result, then used to project equivalent times at the other distances (Jack Daniels’ model).',
  },

  mas: {
    title: 'MAS / VO₂max Estimator',
    blurb: 'Measure the engine.',
    help: 'Estimate Maximal Aerobic Speed & VO₂max from a race result or a field test, then read your training paces off it.',
    measureFrom: 'MEASURE FROM',
    sourceRace: 'A RACE',
    sourceTest: 'FIELD TEST',
    yourTimeFor: (d: string) => `YOUR ${d.toUpperCase()} TIME`,
    whatsThis: 'what’s this? ↗',
    protocols: {
      demi: '6-MIN ½-COOPER',
      cooper: '12-MIN COOPER',
      leger: 'BEEP TEST',
    },
    testLabels: {
      demi: 'DISTANCE IN 6 MIN (M)',
      cooper: 'DISTANCE IN 12 MIN (M)',
      leger: 'FINAL STAGE SPEED (KM/H)',
    },
    testHints: {
      demi: 'Run as far as you can in 6 minutes; enter the metres covered.',
      cooper: 'Run as far as you can in 12 minutes; enter the metres covered.',
      leger: '20 m shuttle to the beeps; enter the speed of your last full stage.',
    },
    vo2Label: 'VO₂MAX',
    vo2Info:
      'The most oxygen your body can use per minute, per kg of bodyweight. A bigger number means a bigger aerobic engine.',
    masLabel: 'MAS',
    masInfo:
      'Maximal Aerobic Speed — the slowest pace at which you reach VO₂max. Every training pace below is derived from it.',
    zonesTitle: 'TRAINING PACES',
    zones: {
      easy: 'Easy',
      marathon: 'Marathon',
      threshold: 'Threshold',
      vo2max: 'VO₂max',
    },
    zoneInfo: {
      easy: 'Conversational effort — the bulk of your weekly mileage. Builds aerobic base with little fatigue.',
      marathon: 'Steady, sustainable for a couple of hours. Roughly your goal marathon effort.',
      threshold: 'Comfortably hard, about a 1-hour race effort. Lifts the pace you can hold before lactate piles up.',
      vo2max: 'Hard 3–5 min intervals near your aerobic max. Grows the size of the engine itself.',
    },
  },

  nutrition: {
    title: 'Fuel Planner',
    blurb: 'Race-day fuel, planned to the sachet.',
    help: 'Tell it your session — length, intensity, weight, heat — and it works out how many carbs you need, then picks Maurten gels and drink mix to cover it: a per-30-minute schedule and the estimated cost. Race day is not for experiments — practice the plan in training.',
    durationLabel: 'SESSION LENGTH',
    intensityLabel: 'INTENSITY',
    weightLabel: 'BODY WEIGHT',
    tempLabel: 'TEMPERATURE',
    caffeineLabel: 'CAFFEINE',
    formatLabel: 'FORMAT',
    preloadLabel: 'PRE-RACE PRELOAD',
    minSuffix: 'MIN',
    kgSuffix: 'KG',
    cSuffix: '°C',
    intensities: {
      easy: 'EASY',
      moderate: 'MODERATE',
      hard: 'HARD',
      race: 'RACE',
    },
    intensityHints: {
      easy: 'conversational pace, Z1–Z2 (~RPE 3–4)',
      moderate: 'steady, Z3 (~RPE 5–6)',
      hard: 'threshold/VO₂max work, Z4–Z5 (~RPE 7–9)',
      race: 'goal pace on race day',
    },
    carbsRate: (n: number) => `${n} g carbs/hour`,
    caffeine: { no: 'NO', yes: 'YES' },
    formats: { auto: 'AUTO', gels: 'GELS', drink: 'DRINK', mixed: 'MIXED' },
    preload: { off: 'OFF', on: 'ON' },
    preloadHint: '1 × Drink Mix 320, 90 min before start',
    cta: 'work out my fuel',
    ctaNote: 'estimates only — practice in training',
    resultLabel: '→ YOUR PLAN',
    priceSub: (units: number, carbs: number, ctx: string) =>
      `${units} UNITS · ${carbs} G CARBS · ${ctx}`,
    whatToBuy: 'WHAT TO BUY',
    scheduleTitle: 'INTAKE SCHEDULE',
    carbsDelivered: 'delivered',
    carbsTarget: 'target',
    carbsNote: '— whole servings only, always shown transparently',
    whyThisPlan: 'WHY THIS PLAN',
    beforeStart: 'before start',
    preloadShort: 'Preload',
    caffeineTag: 'CAFFEINE',
    adjust: 'adjust my inputs',
    emptyTitle: 'Nothing planned yet',
    emptySub:
      'Fill in your session and press “work out my fuel” — your plan lands here.',
    emptyMono: 'EST. TOTAL · PRODUCTS · SCHEDULE',
    loadingTitle: 'working it out',
    loadingSub: 'Matching carbs to Maurten products…',
    loadingMono: 'DETERMINISTIC RULES · NO NETWORK',
    errorTitle: 'Couldn’t work that out',
    errorDetail: (n: number) =>
      `${n} field(s) failed validation — fix the highlighted fields and try again.`,
    tryAgain: 'try again',
    checkThese: 'CHECK THESE',
    noFuelTitle: 'No fuel needed for this session',
    noFuelSub: 'Drink water to thirst — nothing to buy.',
    errDurationRequired: 'enter a length in minutes',
    errDurationRange: (v: string) => `must be 5–720 minutes (got “${v}”)`,
    errWeightRange: 'must be 30–200 kg',
    errTempRange: 'must be −20–50 °C',
    errIntensity: 'choose one of EASY / MODERATE / HARD / RACE',
  },

  namer: {
    title: 'Strava Namer',
    blurb: 'Because “Morning Run” wasn’t cutting it.',
    help: 'Pick an activity type and a tone to generate a Strava title & description. Hit shuffle for another take.',
    activityLabel: 'ACTIVITY',
    toneLabel: 'TONE',
    copyTitle: 'Copy',
    shuffleTitle: 'Shuffle',
    typeLabels: {
      Easy: 'Easy',
      Long: 'Long',
      Tempo: 'Tempo',
      Race: 'Race',
    },
    toneLabels: {
      Deadpan: 'Deadpan',
      Punny: 'Punny',
      Poetic: 'Poetic',
    },
    names: {
      'Easy-Deadpan': [
        { title: 'Easy Run', desc: 'Kept the heart rate low and the effort lower.' },
        { title: 'Recovery Pace, Allegedly', desc: 'Legs said easy. Watch agreed. Mostly.' },
      ],
      'Easy-Punny': [
        { title: 'Jog On', desc: "A gentle plod, powered by yesterday's pasta." },
        { title: 'Low Key, High Mileage', desc: 'Kept the effort chill and the vibes chiller.' },
      ],
      'Easy-Poetic': [
        { title: 'Quiet Miles', desc: 'Nothing to prove, everything to notice.' },
        { title: 'Soft Light, Softer Pace', desc: 'Some runs are for legs. This one was for the mind.' },
      ],
      'Long-Deadpan': [
        { title: 'Long Run', desc: 'Went far. Came back. Ate everything.' },
        { title: 'Sunday Miles', desc: 'Started tired, finished tireder.' },
      ],
      'Long-Punny': [
        { title: 'Going the Extra Klicks', desc: 'Signed up for long, stayed for longer.' },
        { title: 'Marathon Rehearsal', desc: 'Dress rehearsal for the real thing, minus the crowd.' },
      ],
      'Long-Poetic': [
        { title: 'Miles Add Up Quietly', desc: 'Each kilometer a small negotiation with doubt.' },
        { title: 'The Long Way Round', desc: 'Some days the destination is just more road.' },
      ],
      'Tempo-Deadpan': [
        { title: 'Tempo Run', desc: 'Uncomfortable on purpose.' },
        { title: 'Threshold, Reached', desc: 'Breathing got loud around kilometer four.' },
      ],
      'Tempo-Punny': [
        { title: 'Tempo Tantrum', desc: "Legs protested. Watch didn't care." },
        { title: 'Speed Wobbles', desc: 'Fast start, honest middle, hung on at the end.' },
      ],
      'Tempo-Poetic': [
        { title: 'Where Discomfort Lives', desc: 'Found the edge and ran along it.' },
        { title: 'Held Pace, Barely', desc: 'Discipline measured in seconds per kilometer.' },
      ],
      'Race-Deadpan': [
        { title: 'Race Day', desc: 'Ran further than training suggested I should.' },
        { title: 'PB, Barely', desc: "One second under the old best. I'll take it." },
      ],
      'Race-Punny': [
        { title: 'Personal Best, Personal Mess', desc: 'Nailed the finish. Questioned every choice before it.' },
        { title: 'Sub Goals Achieved', desc: 'Broke the barrier. Broke a little of myself too.' },
      ],
      'Race-Poetic': [
        { title: 'Every Second Counted', desc: 'Months of quiet mornings, spent in nineteen minutes.' },
        { title: 'Finish Line, Finally', desc: 'Crossed it and felt every one of the kilometers behind it.' },
      ],
    },
  },
};

export type Messages = typeof en;
