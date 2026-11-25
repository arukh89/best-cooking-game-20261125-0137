// kitchen.js — the chef, the stations, and every interaction.
// One job: move the chef and turn a key press / click into a kitchen action.

import {
  STATIONS, INGREDIENTS, INGREDIENT_ORDER, CHEF_SPEED,
  CHEF_START,
} from './config.js';
import { componentReady, findMatchingOrder } from './recipes.js';
import { serveOrder, addPopup, setFlash } from './state.js';

export function stationAt(x, y) {
  for (const [key, s] of Object.entries(STATIONS)) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return key;
  }
  return null;
}

export function stationCenter(key) {
  const s = STATIONS[key];
  return { x: s.x + s.w / 2, y: s.y + s.h + 26 };
}

export function chefNearStation(state, key) {
  const c = stationCenter(key);
  const dx = state.chef.x - c.x;
  const dy = state.chef.y - c.y;
  return Math.hypot(dx, dy) < 130;
}

export function nearestStation(state) {
  let best = null;
  let bestD = Infinity;
  for (const key of Object.keys(STATIONS)) {
    const c = stationCenter(key);
    const d = Math.hypot(state.chef.x - c.x, state.chef.y - c.y);
    if (d < bestD) { bestD = d; best = key; }
  }
  return bestD < 130 ? best : null;
}

export function moveChef(state, dt, keys) {
  const chef = state.chef;
  let vx = 0;
  let vy = 0;
  if (keys.has('arrowleft') || keys.has('a')) vx -= 1;
  if (keys.has('arrowright') || keys.has('d')) vx += 1;
  if (keys.has('arrowup') || keys.has('w')) vy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) vy += 1;
  if (vx || vy) {
    chef.target = null;
    const len = Math.hypot(vx, vy);
    chef.x += (vx / len) * CHEF_SPEED * dt;
    chef.y += (vy / len) * CHEF_SPEED * dt;
    chef.dir = vx !== 0 ? Math.sign(vx) : chef.dir;
    chef.moving = true;
  } else if (chef.target) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      chef.target = null;
      chef.moving = false;
    } else {
      chef.x += (dx / d) * CHEF_SPEED * dt;
      chef.y += (dy / d) * CHEF_SPEED * dt;
      chef.dir = dx !== 0 ? Math.sign(dx) : chef.dir;
      chef.moving = true;
    }
  } else {
    chef.moving = false;
  }
  chef.x = Math.max(30, Math.min(1250, chef.x));
  chef.y = Math.max(300, Math.min(690, chef.y));
}

// Pick an ingredient straight from the pantry with keys 1-6.
export function pickIngredient(state, index) {
  const id = INGREDIENT_ORDER[index];
  if (!id) return null;
  if (state.hand) return { type: 'hands-full' };
  if (state.job) return { type: 'busy' };
  state.hand = { id, prepped: false };
  return { type: 'picked', id };
}

function startJob(state, station, id) {
  const ing = INGREDIENTS[id];
  state.job = {
    station,
    id,
    progress: 0,
    duration: ing.prepTime,
    burnAfter: ing.burnAfter,
    burned: false,
  };
  state.hand = null;
  return { type: 'job-start', id, station };
}

// Interact with the station the chef stands at. Returns an event for sound/popups.
export function interact(state) {
  const key = nearestStation(state);
  if (!key) return { type: 'none' };
  if (state.job) return { type: 'busy' };

  if (key === 'pantry') {
    // Pantry needs a choice: cycle to the next ingredient.
    const idx = state.hand ? INGREDIENT_ORDER.indexOf(state.hand.id) : -1;
    return pickIngredient(state, (idx + 1) % INGREDIENT_ORDER.length);
  }
  if (key === 'board' || key === 'stove') {
    if (!state.hand) return { type: 'empty-hands' };
    const ing = INGREDIENTS[state.hand.id];
    if (ing.prep === 'board' && key !== 'board') return { type: 'wrong-station', want: 'board' };
    if (ing.prep === 'stove' && key !== 'stove') return { type: 'wrong-station', want: 'stove' };
    if (state.hand.prepped) return { type: 'already-prepped' };
    return startJob(state, key, state.hand.id);
  }
  if (key === 'plate') {
    if (!componentReady(state.hand)) {
      return state.hand ? { type: 'not-prepped' } : { type: 'empty-hands' };
    }
    if (state.plate.length >= 3) return { type: 'plate-full' };
    state.plate.push(state.hand.id);
    state.hand = null;
    const match = findMatchingOrder(state);
    state.plateReady = !!match;
    if (match) setFlash(state, `${match.name.toUpperCase()} READY — SERVE IT!`);
    return { type: 'plated', match: match ? match.id : null };
  }
  if (key === 'serve') {
    const match = findMatchingOrder(state);
    if (!match) {
      if (state.plate.length === 0) return { type: 'empty-hands' };
      return { type: 'no-order', plate: [...state.plate] };
    }
    const gained = serveOrder(state, match);
    state.plate = [];
    state.plateReady = false;
    addPopup(state, 1130, 330, `+${gained}`, '#43aa5a');
    return { type: 'served', gained, name: match.name };
  }
  return { type: 'none' };
}

// Advance the active chop/cook job. Returns events for sound/popups.
export function tickJob(state, dt) {
  if (!state.job) return [];
  const events = [];
  const job = state.job;
  job.progress += dt;
  if (job.burnAfter > 0 && job.progress >= job.burnAfter && !job.burned) {
    job.burned = true;
    events.push({ type: 'burned', id: job.id });
  }
  if (job.progress >= job.duration && !job.burned) {
    state.hand = { id: job.id, prepped: true };
    state.job = null;
    events.push({ type: 'job-done', id: job.id });
  } else if (job.burned && job.progress >= job.burnAfter + 1.5) {
    // Burnt food is lost; the pan is free again.
    state.job = null;
    events.push({ type: 'job-lost', id: job.id });
  }
  return events;
}

export function resetChef(state) {
  state.chef.x = CHEF_START.x;
  state.chef.y = CHEF_START.y;
  state.chef.target = null;
}
