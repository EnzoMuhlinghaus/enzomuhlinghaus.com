// Career log for the Work spread (entry 02). Static content — edit here, not in
// the page markup. Mirrors the `jobs` list in "Homepage v2: Field Journal".

export interface Job {
  years: string;
  role: string;
  place: string;
}

export const JOBS: Job[] = [
  { years: '2025 — 26', role: 'Engineering Manager (hands-on)', place: 'Brevo · Paris, France (remote)' },
  {
    years: '2024 — 25',
    role: 'Lead Software Engineer',
    place: 'Brevo · Captain Wallet acquisition · Paris, France (remote)',
  },
  { years: '2017 — 24', role: 'Senior Backend / Full Stack Engineer', place: 'Captain Wallet · startup · Paris, France' },
  { years: '2016 — 17', role: 'Junior Web Developer', place: 'Batiactu Groupe · Paris, France' },
];

/** The "in the toolbelt:" line under the career log. */
export const TOOLBELT = 'go · php · kafka · rabbitmq · kubernetes · elasticsearch · and more..';

// The pencil-sketch event pipeline on the Work right-hand page. Positions are
// percentages/px within the doodle canvas, matching the design's absolute layout.
export interface DoodleBox {
  id: string;
  title: string;
  sub: string;
  /** 'solid' | 'dashed' | 'blob' — the box's drawn outline. */
  shape: 'solid' | 'dashed' | 'blob';
  style: string;
}

export const DOODLE_BOXES: DoodleBox[] = [
  {
    id: 'gateway',
    title: 'api gateway',
    sub: 'auth · rate-limit',
    shape: 'solid',
    style: 'top:4px;left:0;width:158px;max-width:34%;border-radius:6px 10px 8px 6px;transform:rotate(-1.6deg)',
  },
  {
    id: 'topic',
    title: 'events topic',
    sub: 'append-only log',
    shape: 'dashed',
    style: 'top:12px;right:0;width:178px;max-width:40%;border-radius:8px;transform:rotate(1.2deg)',
  },
  {
    id: 'workers',
    title: 'workers ×n',
    sub: 'stateless · autoscale',
    shape: 'solid',
    style: 'top:180px;left:36%;width:196px;max-width:52%;border-radius:10px 6px 10px 8px;transform:rotate(-1deg)',
  },
  {
    id: 'read-models',
    title: 'read models',
    sub: 'cache + search',
    shape: 'blob',
    style: 'top:248px;left:0;width:140px;transform:rotate(-2deg);text-align:center',
  },
  {
    id: 'fanout',
    title: 'fan-out',
    sub: 'push · email · webhooks',
    shape: 'solid',
    style: 'top:330px;right:0;width:198px;max-width:48%;border-radius:6px 10px 6px 10px;transform:rotate(1.6deg)',
  },
];
