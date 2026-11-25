// state.js — the game's state: orders, timers, score, combo, day clock.
// One job: hold the truth; never draw, never read input.

import {
  DAY_SECONDS, MAX_ORDERS, ORDER_PATIENCE, ORDER_SPAWN_EVERY,
  RUSH_AT_SECONDS_LEFT, MAX_FAILED_ORDERS, RECIPES, SCORE, CHEF_START,
} from './config.js';

export function createGameState(seed) {
  return {
    seed: seed || 1,
    screen: 'menu', // menu | playing | daydone | gameover
    timeLeft: DAY_SECONDS,
    elapsed: 0,
    score: 0,
    served: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    spawnTimer: 4,
    orders: [],
    orderSeq: 0,
    // What the chef carries: null or { id, prepped }.
    hand: null,
    // What sits on the assembly plate: array of prepped ingredient ids.
    plate: [],
    plateReady: false,
    // Board / stove jobs: { station, id, progress, duration, burn }
    job: null,
    chef: { x: CHEF_START.x, y: CHEF_START.y, dir: 1, moving: false, target: null },
    rush: false,
    rushAnnounced: false,
    flash: null, // { text, until }
    popups: [], // { x, y, text, color, until }
    servedLog: [],
    rngState: (seed || 1) * 2654435761 >>> 0,
  };
}

// Small deterministic RNG so ?shot= states and playtests reproduce.
export function rngNext(state) {
  state.rngState = (state.rngState * 1664525 + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

export function pickRecipe(state) {
  const i = Math.floor(rngNext(state) * RECIPES.length);
  return RECIPES[i];
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const recipe = pickRecipe(state);
  const order = {
    id: ++state.orderSeq,
    recipeId: recipe.id,
    name: recipe.name,
    needs: [...recipe.needs],
    price: recipe.price,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
  };
  state.orders.push(order);
  return order;
}

export function orderById(state, id) {
  return state.orders.find((o) => o.id === id) || null;
}

export function comboMultiplier(state) {
  return Math.min(1 + Math.floor(state.combo / SCORE.comboStep), SCORE.maxCombo);
}

export function tipFor(order) {
  return Math.round((order.patience / order.maxPatience) * SCORE.maxTip);
}

export function serveOrder(state, order) {
  const tip = tipFor(order);
  const mult = comboMultiplier(state);
  const gained = (order.price + tip) * mult;
  state.score += gained;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.servedLog.push({ name: order.name, gained, at: state.elapsed });
  return gained;
}

export function failOrder(state, order) {
  state.score = Math.max(0, state.score - SCORE.failPenalty);
  state.failed += 1;
  state.combo = 0;
  state.orders = state.orders.filter((o) => o.id !== order.id);
}

// Advance clocks by dt seconds. Returns events the loop turns into sound/popups.
export function tickState(state, dt) {
  const events = [];
  if (state.screen !== 'playing') return events;
  state.elapsed += dt;
  state.timeLeft -= dt;
  if (!state.rush && state.timeLeft <= RUSH_AT_SECONDS_LEFT) {
    state.rush = true;
    events.push({ type: 'rush' });
  }
  state.spawnTimer -= dt;
  const spawnEvery = state.rush ? ORDER_SPAWN_EVERY * 0.7 : ORDER_SPAWN_EVERY;
  if (state.spawnTimer <= 0) {
    state.spawnTimer = spawnEvery;
    if (spawnOrder(state)) events.push({ type: 'order' });
  }
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      failOrder(state, order);
      events.push({ type: 'order-failed', name: order.name });
    }
  }
  for (const p of state.popups) p.until -= dt;
  state.popups = state.popups.filter((p) => p.until > 0);
  if (state.flash) {
    state.flash.until -= dt;
    if (state.flash.until <= 0) state.flash = null;
  }
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = state.failed >= MAX_FAILED_ORDERS ? 'gameover' : 'daydone';
    events.push({ type: 'day-end' });
  }
  if (state.failed >= MAX_FAILED_ORDERS && state.screen === 'playing') {
    state.screen = 'gameover';
    events.push({ type: 'day-end' });
  }
  return events;
}

export function addPopup(state, x, y, text, color) {
  state.popups.push({ x, y, text, color: color || '#2b2118', until: 1.4 });
}

export function setFlash(state, text) {
  state.flash = { text, until: 1.8 };
}
