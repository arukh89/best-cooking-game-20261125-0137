// main.js — the game loop and screen machine.
// One job: wire state + kitchen + input + render together, nothing else.

import { CANVAS_W, CANVAS_H } from './config.js';
import { createGameState, tickState, spawnOrder } from './state.js';
import { moveChef, interact, tickJob, pickIngredient, resetChef } from './kitchen.js';
import { render } from './render.js';
import { createInput, attachInput, handleClick, consumePressed, clearPressed } from './input.js';
import {
  ensureAudio, playChop, playPick, playCookDone, playServe, playFail,
  playRush, playClick, toggleMute,
} from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const state = createGameState(seed);
const input = createInput();
window.__game = { state, startDay };

function startDay() {
  const fresh = createGameState(seed);
  Object.assign(state, fresh, { screen: 'playing' });
  spawnOrder(state);
  spawnOrder(state);
  ensureAudio();
}

function handleEvent(event) {
  if (!event) return;
  if (event.type === 'picked') playPick();
  if (event.type === 'job-start') playChop();
  if (event.type === 'job-done') playCookDone();
  if (event.type === 'served') playServe();
  if (event.type === 'order-failed' || event.type === 'burned' || event.type === 'job-lost') playFail();
  if (event.type === 'rush') {
    playRush();
    state.flash = { text: '⚠ RUSH HOUR — ORDERS COME FASTER!', until: 2.5 };
  }
  if (event.type === 'order') playClick();
}

attachInput(input, canvas, {
  onKey(k) {
    if (k === 'm') toggleMute();
    if (state.screen === 'menu' && (k === 'enter' || k === ' ')) startDay();
    if ((state.screen === 'daydone' || state.screen === 'gameover') && k === 'r') startDay();
  },
  onClick(x, y) {
    ensureAudio();
    if (state.screen === 'menu') {
      if (x >= 490 && x <= 790 && y >= 470 && y <= 534) startDay();
      return;
    }
    if (state.screen !== 'playing') return;
    const result = handleClick(state, x, y);
    if (result.type === 'pantry-bin') {
      const ev = pickIngredient(state, result.index);
      handleEvent(ev);
    }
  },
});

if (shot) {
  applyShot(state, shot);
  // Shot renders are frozen: no timers advance, so screenshots are stable.
} else {
  spawnOrder(state);
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shot && state.screen === 'playing') {
    moveChef(state, dt, input.keys);
    for (const ev of tickState(state, dt)) handleEvent(ev);
    for (const ev of tickJob(state, dt)) handleEvent(ev);
    if (consumePressed(input, 'e') || consumePressed(input, ' ')) {
      handleEvent(interact(state));
    }
    for (let i = 0; i < 6; i++) {
      if (consumePressed(input, String(i + 1))) {
        handleEvent(pickIngredient(state, i));
      }
    }
    clearPressed(input);
  } else {
    clearPressed(input);
  }
  render(ctx, state);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
