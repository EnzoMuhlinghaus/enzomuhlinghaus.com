// Daniels/Gilbert VDOT model.

/** Oxygen cost (mL/kg/min) of running at a given velocity (m/min). */
export function vo2Cost(velocityMPerMin: number): number {
  return -4.6 + 0.182258 * velocityMPerMin + 0.000104 * velocityMPerMin * velocityMPerMin;
}

/** Fraction of VO2max sustainable for a race lasting `timeMin` minutes. */
export function pctVO2max(timeMin: number): number {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * timeMin) + 0.2989558 * Math.exp(-0.1932605 * timeMin);
}

export function vdotFromRace(distanceM: number, timeMin: number): number {
  const v = distanceM / timeMin;
  return vo2Cost(v) / pctVO2max(timeMin);
}

/** Velocity (m/min) at which vo2Cost(v) == vdot, i.e. speed at VO2max (MAS). */
export function velocityAtVO2max(vdot: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -(4.6 + vdot);
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

/** Race time (minutes) over `distanceM` for a given VDOT, by bisection. */
export function timeMinFromVdot(distanceM: number, vdot: number): number {
  let lo = 1;
  let hi = 600;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const v = distanceM / mid;
    const val = vo2Cost(v) / pctVO2max(mid);
    if (val > vdot) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Two-point Riegel fit: T = a * D^e. Times in seconds, distances in km. */
export function riegelFit(d1: number, t1: number, d2: number, t2: number): { e: number; lnA: number } {
  const e = (Math.log(t2) - Math.log(t1)) / (Math.log(d2) - Math.log(d1));
  const lnA = Math.log(t1) - e * Math.log(d1);
  return { e, lnA };
}
