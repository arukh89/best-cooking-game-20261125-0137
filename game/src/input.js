// input.js — keyboard and mouse, including click-to-move.
// One job: turn raw events into game actions; never draw, never score.

import { INGREDIENT_ORDER, STATIONS } from './config.js';
import { stationAt, stationCenter } from './kitchen.js';

export function createInput() {
  return {
    keys: new Set(),
    click: null, // { x, y } consumed by the loop
    pressed: new Set(), // edge-triggered keys, consumed by the loop
  };
}

export function keyName(event) {
  return event.key.toLowerCase();
}

export function attachInput(input, canvas, handlers) {
  window.addEventListener('keydown', (event) => {
    const k = keyName(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      event.preventDefault();
    }
    if (!event.repeat) input.pressed.add(k);
    input.keys.add(k);
    if (handlers.onKey) handlers.onKey(k, event);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(keyName(event));
  });
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.click = { x, y };
    if (handlers.onClick) handlers.onClick(x, y);
  });
}

// A click on a station walks the chef there; a click on a pantry bin picks it.
export function handleClick(state, x, y) {
  const station = stationAt(x, y);
  if (!station) {
    state.chef.target = { x, y: Math.max(320, y) };
    return { type: 'walk' };
  }
  const c = stationCenter(station);
  state.chef.target = c;
  if (station === 'pantry') {
    // Which bin? Six bins across the pantry, left to right.
    const s = STATIONS.pantry;
    const bin = Math.floor(((x - s.x) / s.w) * INGREDIENT_ORDER.length);
    return { type: 'pantry-bin', index: Math.max(0, Math.min(5, bin)), station };
  }
  return { type: 'station', station };
}

export function consumePressed(input, key) {
  if (input.pressed.has(key)) {
    input.pressed.delete(key);
    return true;
  }
  return false;
}

export function clearPressed(input) {
  input.pressed.clear();
}
