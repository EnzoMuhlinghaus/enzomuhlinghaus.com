// French wording. Must mirror en.ts key for key — TypeScript enforces it.
//
// TODO(fr): the journal blocks below (`home`, `endurance`, `work`, `travel`)
// still hold the English copy — they were written for the v2 redesign and have
// not been translated. The workbench (`toolbox`, `pace`, `predictor`, `mas`,
// `namer`) IS translated.
//
// Nothing renders French today: v2 ships no language toggle, so this file is
// dormant. Translate these blocks before restoring a toggle — see the i18n
// bullet in CLAUDE.md.
import type { Messages } from './en';

export const fr: Messages = {
  common: {
    half: 'Semi',
    formatHint: 'Format : mm:ss ou h:mm:ss',
  },

  home: {
    volume: 'FIELD JOURNAL · VOL. I',
    position: 'current position: 49°16′N, 123°07′W',
    city: 'Vancouver, BC',
    loadingWeather: 'checking the sky…',
    tagline: 'curious about everything.',
    sayHi: 'say hi',
    meLabel: 'me',
    turnPage: 'turn the page ➝',
    back: '⟵ back',
    backHome: 'back home ➝',
    tabs: {
      home: 'home',
      endurance: 'endurance',
      work: 'work',
      travel: 'travel',
    },
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

  toolbox: {
    eyebrow: "L'ÉTABLI",
    title: 'Outils de Course',
    blurb: 'De petits outils construits pour mon entraînement, partagés ici.',
    unitsLabel: 'UNITÉS — TOUS LES OUTILS',
    builtBy: 'Fait par Enzo Muhlinghaus —',
    readJournal: 'venez lire mon journal',
    disclaimer:
      'estimations seulement · temps au format mm:ss ou h:mm:ss · basé sur le modèle VDOT de Jack Daniels',
  },

  pace: {
    title: "Calculateur d'Allure",
    blurb: 'Deux valeurs suffisent, la troisième suit.',
    help: "Renseignez deux valeurs parmi distance, temps et allure — la troisième se calcule. Les pastilles insèrent les distances courantes.",
    modes: {
      pace: 'ALLURE',
      time: 'TEMPS',
      distance: 'DISTANCE',
    },
    distanceLabel: 'DISTANCE',
    timeLabel: 'TEMPS',
    paceLabel: 'ALLURE',
    resultPace: '→ ALLURE',
    resultTime: '→ TEMPS',
    resultDistance: '→ DIST',
  },

  predictor: {
    title: 'Prédicteur de Course',
    blurb: "D'un résultat découlent les autres.",
    help: "Donnez un résultat de course (ou votre VMA) et l'outil projette les temps équivalents sur les autres distances, via le modèle VDOT de Jack Daniels.",
    predictFrom: 'PRÉDIRE À PARTIR DE',
    sourceRace: 'UNE COURSE',
    sourceMas: 'VMA',
    yourTimeFor: (d: string) => `VOTRE TEMPS SUR ${d.toUpperCase()}`,
    masFieldLabel: 'VOTRE VMA (KM/H)',
    predicted: '→ PRÉDIT',
    tagVdot: 'VDOT',
    tagMasVdot: 'VMA→VDOT',
    vdotHint:
      "Le VDOT est un indice de forme unique déduit de votre résultat, puis utilisé pour projeter les temps équivalents sur les autres distances (modèle de Jack Daniels).",
  },

  mas: {
    title: 'Estimateur VMA / VO₂max',
    blurb: 'Mesurer le moteur.',
    help: "Estimez votre Vitesse Maximale Aérobie et votre VO₂max à partir d'une course ou d'un test de terrain, puis lisez vos allures d'entraînement.",
    measureFrom: 'MESURER À PARTIR DE',
    sourceRace: 'UNE COURSE',
    sourceTest: 'TEST DE TERRAIN',
    yourTimeFor: (d: string) => `VOTRE TEMPS SUR ${d.toUpperCase()}`,
    whatsThis: "c'est quoi ? ↗",
    protocols: {
      demi: 'DEMI-COOPER 6 MIN',
      cooper: 'COOPER 12 MIN',
      leger: 'TEST LÉGER',
    },
    testLabels: {
      demi: 'DISTANCE EN 6 MIN (M)',
      cooper: 'DISTANCE EN 12 MIN (M)',
      leger: 'VITESSE DU DERNIER PALIER (KM/H)',
    },
    testHints: {
      demi: 'Courez le plus loin possible en 6 minutes ; entrez les mètres parcourus.',
      cooper: 'Courez le plus loin possible en 12 minutes ; entrez les mètres parcourus.',
      leger: 'Navette de 20 m au bip ; entrez la vitesse de votre dernier palier complet.',
    },
    vo2Label: 'VO₂MAX',
    vo2Info:
      "La quantité maximale d'oxygène que votre corps peut utiliser par minute et par kg. Plus le chiffre est élevé, plus le moteur aérobie est gros.",
    masLabel: 'VMA',
    masInfo:
      "Vitesse Maximale Aérobie — l'allure la plus lente à laquelle vous atteignez votre VO₂max. Toutes les allures ci-dessous en découlent.",
    zonesTitle: "ALLURES D'ENTRAÎNEMENT",
    zones: {
      easy: 'Facile',
      marathon: 'Marathon',
      threshold: 'Seuil',
      vo2max: 'VO₂max',
    },
    zoneInfo: {
      easy: "Effort où l'on peut discuter — l'essentiel du volume hebdomadaire. Construit la base aérobie sans fatigue.",
      marathon: 'Régulier, tenable pendant deux heures. En gros votre effort marathon visé.',
      threshold: "Confortablement dur, environ un effort d'une heure. Repousse l'allure tenable avant que le lactate ne s'accumule.",
      vo2max: 'Intervalles durs de 3 à 5 min près du maximum aérobie. Fait grossir le moteur lui-même.',
    },
  },

  namer: {
    title: 'Nommeur Strava',
    blurb: '« Course matinale », ça ne suffisait plus.',
    help: "Choisissez un type d'activité et un ton pour générer un titre et une description Strava. Relancez pour une autre version.",
    activityLabel: 'ACTIVITÉ',
    toneLabel: 'TON',
    copyTitle: 'Copier',
    shuffleTitle: 'Relancer',
    typeLabels: {
      Easy: 'Facile',
      Long: 'Longue',
      Tempo: 'Tempo',
      Race: 'Course',
    },
    toneLabels: {
      Deadpan: 'Pince-sans-rire',
      Punny: 'Jeux de mots',
      Poetic: 'Poétique',
    },
    names: {
      'Easy-Deadpan': [
        { title: 'Footing tranquille', desc: 'Fréquence cardiaque basse, effort encore plus bas.' },
        { title: 'Allure récup, paraît-il', desc: "Les jambes ont dit facile. La montre était d'accord. À peu près." },
      ],
      'Easy-Punny': [
        { title: 'Petit trot', desc: "Un trottinement doux, propulsé par les pâtes d'hier." },
        { title: 'Bas régime, gros volume', desc: "L'effort au calme, l'ambiance encore plus." },
      ],
      'Easy-Poetic': [
        { title: 'Kilomètres silencieux', desc: 'Rien à prouver, tout à remarquer.' },
        { title: 'Lumière douce, allure plus douce', desc: "Certaines sorties sont pour les jambes. Celle-ci était pour la tête." },
      ],
      'Long-Deadpan': [
        { title: 'Sortie longue', desc: 'Parti loin. Revenu. Tout mangé.' },
        { title: 'Kilomètres du dimanche', desc: 'Commencé fatigué, fini plus fatigué.' },
      ],
      'Long-Punny': [
        { title: 'Le kilomètre en trop', desc: 'Inscrit pour du long, resté pour du plus long.' },
        { title: 'Répétition générale', desc: "Générale avant le vrai jour, sans le public." },
      ],
      'Long-Poetic': [
        { title: "Les kilomètres s'additionnent", desc: 'Chaque kilomètre, une petite négociation avec le doute.' },
        { title: 'Le chemin le plus long', desc: "Certains jours, la destination n'est que plus de route." },
      ],
      'Tempo-Deadpan': [
        { title: 'Séance tempo', desc: 'Inconfortable exprès.' },
        { title: 'Seuil atteint', desc: 'La respiration est devenue bruyante vers le quatrième kilomètre.' },
      ],
      'Tempo-Punny': [
        { title: 'Caprice de tempo', desc: "Les jambes ont protesté. La montre s'en fichait." },
        { title: 'Coup de chaud', desc: 'Départ vite, milieu honnête, fin arrachée.' },
      ],
      'Tempo-Poetic': [
        { title: "Là où vit l'inconfort", desc: "Trouvé la limite et couru le long." },
        { title: "Allure tenue, de justesse", desc: 'La discipline se mesure en secondes au kilomètre.' },
      ],
      'Race-Deadpan': [
        { title: 'Jour de course', desc: "Couru plus vite que l'entraînement ne le suggérait." },
        { title: 'Record, de justesse', desc: "Une seconde sous l'ancien. Je prends." },
      ],
      'Race-Punny': [
        { title: 'Record personnel, chaos personnel', desc: "Bien fini. Tout remis en question avant." },
        { title: 'Objectifs pulvérisés', desc: 'Barrière cassée. Moi un peu aussi.' },
      ],
      'Race-Poetic': [
        { title: 'Chaque seconde comptait', desc: 'Des mois de matins silencieux, dépensés en dix-neuf minutes.' },
        { title: 'Ligne, enfin', desc: "Franchie, en sentant chacun des kilomètres derrière." },
      ],
    },
  },
};
