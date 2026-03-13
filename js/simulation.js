/**
 * simulation.js
 * Lotka-Volterra predator-prey simulation with external mortality parameter.
 * All math is pre-calculated on load; the UI simply scrubs through the results.
 */

export class Simulation {
  constructor(params = {}) {
    this.params = {
      alpha:    params.alpha    ?? 0.06,   // Elk intrinsic growth rate
      beta:     params.beta     ?? 0.0008, // Wolf predation rate
      delta:    params.delta    ?? 0.00012,// Wolf reproduction efficiency
      gamma:    params.gamma    ?? 0.08,   // Wolf natural mortality rate
      mu:       params.mu       ?? 0.02,   // External wolf mortality (harvest, disease)
      dt:       params.dt       ?? 0.05,   // Time step (Euler integration)
      stepsPerYear: params.stepsPerYear ?? 200
    };

    this.startYear  = 1995;
    this.endYear    = 2022;
    this.results    = [];   // Array of { year, elk, wolves }
  }

  run(initialElk = 16791, initialWolves = 21) {
    this.results = [];
    let elk    = initialElk;
    let wolves = initialWolves;
    const { alpha, beta, delta, gamma, mu, dt, stepsPerYear } = this.params;

    for (let year = this.startYear; year <= this.endYear; year++) {
      // Record at the start of each year
      this.results.push({ year, elk: Math.round(elk), wolves: Math.round(wolves) });

      // Run sub-year integration steps
      for (let step = 0; step < stepsPerYear; step++) {
        const dElk    = (alpha * elk - beta * elk * wolves) * dt;
        const dWolves = (delta * elk * wolves - gamma * wolves - mu * wolves) * dt;

        elk    = Math.max(0, elk + dElk);
        wolves = Math.max(0, wolves + dWolves);
      }
    }

    return this.results;
  }

  getAtYear(year) {
    return this.results.find(r => r.year === year) ?? null;
  }
}
