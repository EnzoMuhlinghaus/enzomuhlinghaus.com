// English wording — the master dictionary. `fr.ts` must mirror this shape
// exactly (enforced by the Messages type), so adding/removing a key here
// without updating fr.ts is a build error.
import { formatTime } from '../lib/time';

export const en = {
  common: {
    half: 'Half',
    yourTime: 'YOUR TIME',
    formatHint: 'Format: mm:ss or h:mm:ss',
    editHint: 'Edit this to your own time',
  },

  footer: {
    sayHi: 'Say hi',
    resume: 'Résumé / CV',
  },

  home: {
    position: 'CURRENT POSITION: 49.28°N 123.12°W — VANCOUVER, BC',
    loadingWeather: 'loading weather…',
    headline1: "I'm Enzo. I work in tech,",
    headline2: 'and I run a lot.',
    blurb: 'Frenchman who likes anything with a finish line. I build small tools for my training and share them here.',
    photoCaption: 'fuel stop, somewhere in Paris',
    journalTitle: 'RACE JOURNAL',
    racesCount: (n: number) => `${n} races · scroll ↓`,
    training: 'TRAINING',
    prTitle: 'FOR THE RECORD',
    soon: 'soon…',
    prDistances: {
      '5K': '5K',
      '10K': '10K',
      Half: 'Half',
      Marathon: 'Marathon',
    },
  },

  // Tool cards: `name` is the Toolbox grid title, `homeName` the homepage card title.
  tools: {
    pace: { name: 'Pace Calculator', homeName: 'Pace calculator', desc: 'Splits & race pace.' },
    mas: { name: 'MAS / VO2max', homeName: 'VMA / VO₂max', desc: 'Measure the engine.' },
    predictor: { name: 'Race Predictor', homeName: 'Race predictor', desc: '5K → marathon times.' },
    namer: { name: 'Strava Namer', homeName: 'Strava namer', desc: 'Names & descriptions.' },
  },

  toolbox: {
    breadcrumb: 'TOOLBOX',
    title: 'The Toolbox',
    blurb: 'Small tools built for my own training, shared here.',
  },

  pace: {
    breadcrumb: 'TOOLBOX / PACE CALCULATOR',
    title: 'Pace Calculator',
    blurb: 'Any two, and the third follows.',
    disclaimer: 'Accepted formats: mm:ss or h:mm:ss for time and pace.',
    solveFor: 'SOLVE FOR',
    modes: {
      pace: 'Find Pace',
      time: 'Find Time',
      distance: 'Find Distance',
    },
    distanceLabel: 'DISTANCE',
    timeLabel: 'TIME',
    paceLabel: 'PACE',
    resultPace: '→ PACE',
    resultTime: '→ TIME',
    resultDistance: '→ DISTANCE',
  },

  mas: {
    breadcrumb: 'TOOLBOX / MAS · VO2MAX',
    title: 'MAS / VO2max Estimator',
    blurb: 'Measure the engine.',
    disclaimer: "Based on Jack Daniels' VDOT model. These are estimates only.",
    estimated: '→ ESTIMATED',
    masLabel: 'MAS',
    zonesTitle: 'TRAINING PACES',
    zones: {
      easy: 'Easy',
      marathon: 'Marathon',
      threshold: 'Threshold',
      vo2max: 'VO2max',
    },
  },

  predictor: {
    breadcrumb: 'TOOLBOX / RACE PREDICTOR',
    title: 'Race Predictor',
    blurb: 'Enter a recent race time and see what it predicts across other distances.',
    disclaimer: 'These are estimates only — real-world results vary with terrain, taper, and how much you wanted it.',
    predicted: '→ PREDICTED',
    addSecondRace: 'Add another recent race for a more personalized prediction',
    enterVo2: 'Have a VO2max or MAS estimate? Enter it directly',
    masMode: 'MAS',
    vo2Caveat: 'watch, lab, or track — any source works',
    vo2Placeholder: 'e.g. 52',
    masKmhPlaceholder: 'e.g. 18.5',
    masPacePlaceholder: 'e.g. 3:15',
    tagFromMas: 'FROM MAS',
    tagFromVo2: 'FROM VO2MAX',
    tagPersonalized: 'PERSONALIZED',
    tagDefault: 'DEFAULT',
    methodFromMas: 'From your MAS.',
    methodFromVo2: 'From your VO2max.',
    methodPersonalized: (d1: string, d2: string) => `Personalized (based on your ${d1} and ${d2} results).`,
    methodDefault: (d: string) => `Based on VDOT (from your ${d}).`,
    methodEmpty: 'Enter a time to get started.',
    vdotHint: "VDOT: Jack Daniels' fitness index, calculated from this race result.",
    vo2Hint: (masKmh: number | null) => {
      const intro =
        'VO2max: maximal oxygen uptake (mL/kg/min). MAS: maximal aerobic speed, the pace at which VO2max is reached — the two are linked through running economy.';
      const kmh = masKmh != null ? masKmh : 18;
      const paceStr = `${formatTime(3600 / kmh)}/km`;
      const meters = Math.round(kmh * 100);
      const example =
        masKmh != null
          ? ` A MAS of ${kmh.toFixed(1)} km/h means that you can hold ${paceStr} for ~6 minutes, or about ${meters} m.`
          : ` For example, a MAS of ${kmh} km/h means holding about ${paceStr} for ~6 minutes, or about ${meters} m.`;
      return intro + example;
    },
  },

  namer: {
    breadcrumb: 'TOOLBOX / STRAVA NAMER',
    title: 'Strava Namer',
    blurb: 'Because "Morning Run" wasn\'t cutting it.',
    disclaimer: 'Titles and descriptions only — connect your own Strava account to run this for real.',
    activityLabel: 'ACTIVITY',
    toneLabel: 'TONE',
    demoLabel: 'DEMO ACTIVITY',
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
