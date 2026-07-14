// French wording. Must mirror en.ts key for key — TypeScript enforces it.
import { formatTime } from '../lib/time';
import type { Messages } from './en';

export const fr: Messages = {
  common: {
    half: 'Semi',
    yourTime: 'VOTRE TEMPS',
    formatHint: 'Format : mm:ss ou h:mm:ss',
    editHint: 'Modifiez pour votre propre temps',
  },

  footer: {
    sayHi: 'Dites bonjour',
    resume: 'CV',
  },

  home: {
    position: 'POSITION ACTUELLE : 49.28°N 123.12°O — VANCOUVER, C.-B.',
    loadingWeather: 'météo…',
    headline1: "Je m'appelle Enzo. Je bosse dans la tech,",
    headline2: 'et je cours beaucoup.',
    blurb: "Français qui aime tout ce qui a une ligne d'arrivée. Je construis de petits outils pour mon entraînement et je les partage ici.",
    photoCaption: 'ravitaillement, quelque part à Paris',
    journalTitle: 'JOURNAL DE COURSE',
    racesCount: (n: number) => `${n} courses · scroll ↓`,
    training: 'EN PRÉPA',
    prTitle: 'POUR MÉMOIRE',
    soon: 'bientôt…',
    prDistances: {
      '5K': '5K',
      '10K': '10K',
      Half: 'Semi',
      Marathon: 'Marathon',
    },
  },

  tools: {
    pace: { name: "Calculateur d'Allure", homeName: "Calculateur d'allure", desc: 'Allures et temps de passage.' },
    mas: { name: 'VMA / VO2max', homeName: 'VMA / VO₂max', desc: 'Mesurer le moteur.' },
    predictor: { name: 'Prédicteur de Course', homeName: 'Prédicteur de course', desc: 'Du 5 km au marathon.' },
    namer: { name: 'Nommeur Strava', homeName: 'Nommeur Strava', desc: 'Titres et descriptions.' },
  },

  toolbox: {
    breadcrumb: 'BOÎTE À OUTILS',
    title: 'La Boîte à Outils',
    blurb: 'De petits outils construits pour mon entraînement, partagés ici.',
  },

  pace: {
    breadcrumb: 'BOÎTE À OUTILS / ALLURE',
    title: "Calculateur d'Allure",
    blurb: 'Deux valeurs suffisent, la troisième suit.',
    disclaimer: "Formats acceptés : mm:ss ou h:mm:ss pour le temps et l'allure.",
    solveFor: 'CALCULER',
    modes: {
      pace: "Trouver l'Allure",
      time: 'Trouver le Temps',
      distance: 'Trouver la Distance',
    },
    distanceLabel: 'DISTANCE',
    timeLabel: 'TEMPS',
    paceLabel: 'ALLURE',
    resultPace: '→ ALLURE',
    resultTime: '→ TEMPS',
    resultDistance: '→ DISTANCE',
  },

  mas: {
    breadcrumb: 'BOÎTE À OUTILS / VMA · VO2MAX',
    title: 'Estimateur VMA / VO2max',
    blurb: 'Mesurer le moteur.',
    disclaimer: 'Basé sur le modèle VDOT de Jack Daniels. Ce ne sont que des estimations.',
    estimated: '→ ESTIMÉ',
    masLabel: 'VMA',
    zonesTitle: "ALLURES D'ENTRAÎNEMENT",
    zones: {
      easy: 'Endurance',
      marathon: 'Marathon',
      threshold: 'Seuil',
      vo2max: 'VO2max',
    },
  },

  predictor: {
    breadcrumb: 'BOÎTE À OUTILS / PRÉDICTEUR',
    title: 'Prédicteur de course',
    blurb: "Entrez un temps de course récent et découvrez ce qu'il prédit sur d'autres distances.",
    disclaimer: "Ce ne sont que des estimations — les résultats réels varient selon le terrain, l'affûtage et l'envie du jour.",
    predicted: '→ PRÉDICTION',
    addSecondRace: 'Ajouter une autre course récente pour une prédiction plus personnalisée',
    enterVo2: 'Vous avez un VO2max ou une VMA ? Entrez-le directement',
    masMode: 'VMA',
    vo2Caveat: 'montre, labo ou piste — au choix',
    vo2Placeholder: 'ex. 52',
    masKmhPlaceholder: 'ex. 18.5',
    masPacePlaceholder: 'ex. 3:15',
    tagFromMas: 'VIA MAS',
    tagFromVo2: 'VIA VO2MAX',
    tagPersonalized: 'PERSONNALISÉ',
    tagDefault: 'ESTIMATION',
    methodFromMas: 'À partir de votre VMA.',
    methodFromVo2: 'À partir de votre VO2max.',
    methodPersonalized: (d1: string, d2: string) => `Personnalisé (à partir de vos résultats en ${d1} et ${d2}).`,
    methodDefault: (d: string) => `Basé sur le VDOT (à partir de votre ${d}).`,
    methodEmpty: 'Entrez un temps pour commencer.',
    vdotHint: "VDOT : l'indice de forme de Jack Daniels, calculé à partir de ce résultat de course.",
    vo2Hint: (masKmh: number | null) => {
      const intro =
        "VO2max : consommation maximale d'oxygène (mL/kg/min). VMA : vitesse maximale aérobie, la vitesse à laquelle le VO2max est atteint — les deux sont liés par l'économie de course.";
      const kmh = masKmh != null ? masKmh : 18;
      const paceStr = `${formatTime(3600 / kmh)}/km`;
      const meters = Math.round(kmh * 100);
      const example =
        masKmh != null
          ? ` Une VMA de ${kmh.toFixed(1)} km/h signifie que vous pouvez tenir ${paceStr} pendant ~6 minutes, soit environ ${meters} m.`
          : ` Par exemple, une VMA de ${kmh} km/h signifie tenir environ ${paceStr} pendant ~6 minutes, soit environ ${meters} m.`;
      return intro + example;
    },
  },

  namer: {
    breadcrumb: 'BOÎTE À OUTILS / NOMMEUR STRAVA',
    title: 'Nommeur Strava',
    blurb: 'Parce que « Course du matin » ne suffisait plus.',
    disclaimer: "Titres et descriptions seulement — connectez votre compte Strava pour l'utiliser en vrai.",
    activityLabel: "TYPE D'ACTIVITÉ",
    toneLabel: 'TON',
    demoLabel: 'ACTIVITÉ DÉMO',
    copyTitle: 'Copier',
    shuffleTitle: 'Un autre',
    typeLabels: {
      Easy: 'Footing',
      Long: 'Sortie longue',
      Tempo: 'Tempo',
      Race: 'Course',
    },
    toneLabels: {
      Deadpan: 'Flegmatique',
      Punny: 'Jeux de mots',
      Poetic: 'Poétique',
    },
    names: {
      'Easy-Deadpan': [
        { title: 'Footing Tranquille', desc: 'Rythme cardiaque bas, effort plus bas encore.' },
        { title: 'Récup, en Théorie', desc: 'Les jambes ont dit facile. La montre a validé. Presque.' },
      ],
      'Easy-Punny': [
        { title: 'Mode Pépère', desc: "Trottiné tranquille, alimenté aux pâtes d'hier." },
        { title: 'Zen et Kilométrage', desc: 'Effort cool, ambiance encore plus cool.' },
      ],
      'Easy-Poetic': [
        { title: 'Kilomètres Silencieux', desc: 'Rien à prouver, tout à observer.' },
        { title: 'Lumière Douce, Allure Plus Douce', desc: 'Certaines sorties sont pour les jambes. Celle-ci, pour la tête.' },
      ],
      'Long-Deadpan': [
        { title: 'Sortie Longue', desc: 'Parti loin. Revenu. Tout mangé.' },
        { title: 'Les Kilomètres du Dimanche', desc: 'Parti fatigué, arrivé plus fatigué encore.' },
      ],
      'Long-Punny': [
        { title: 'Les Kilomètres en Rab', desc: 'Inscrit pour long, resté pour plus long encore.' },
        { title: 'Répétition Marathon', desc: 'Répétition générale, sans le public.' },
      ],
      'Long-Poetic': [
        { title: "Les Kilomètres s'Accumulent", desc: 'Chaque kilomètre, une petite négociation avec le doute.' },
        { title: 'Le Chemin des Écoliers', desc: "Certains jours, la destination c'est juste plus de route." },
      ],
      'Tempo-Deadpan': [
        { title: 'Séance Tempo', desc: 'Inconfortable, volontairement.' },
        { title: 'Seuil Atteint', desc: "La respiration s'est faite entendre au quatrième kilomètre." },
      ],
      'Tempo-Punny': [
        { title: 'Crise de Tempo', desc: "Les jambes ont protesté. La montre s'en fichait." },
        { title: 'Allure en Dents de Scie', desc: "Départ rapide, milieu honnête, tenu bon jusqu'au bout." },
      ],
      'Tempo-Poetic': [
        { title: "Là où Vit l'Inconfort", desc: 'Trouvé la limite, couru le long.' },
        { title: 'Allure Tenue, à Peine', desc: 'La discipline se mesure en secondes par kilomètre.' },
      ],
      'Race-Deadpan': [
        { title: 'Jour de Course', desc: "Couru plus loin que ce que l'entraînement suggérait." },
        { title: 'Record, de Justesse', desc: "Une seconde sous l'ancien record. Je prends." },
      ],
      'Race-Punny': [
        { title: 'Record Perso, Chaos Perso', desc: "Ligne d'arrivée réussie. Tous les choix d'avant, remis en question." },
        { title: 'Objectif Sub Atteint', desc: 'Barrière franchie. Un peu de moi aussi, au passage.' },
      ],
      'Race-Poetic': [
        { title: 'Chaque Seconde a Compté', desc: 'Des mois de matins tranquilles, dépensés en dix-neuf minutes.' },
        { title: "Ligne d'Arrivée, Enfin", desc: "Franchie, en sentant chaque kilomètre qui l'a précédée." },
      ],
    },
  },
};
