// shots.js — deterministic staged states for the 4 screenshots.
// One job: put the game in a readable, complete state for ?shot=<name>.
// The cover must show, in one frame, the whole first criterion:
// kitchen + order board, ingredients on the counter, a dish mid-assembly,
// a timer, and a plate ready to serve.

import { RECIPES } from './config.js';
import { spawnOrder } from './state.js';

function setOrder(state, slot, recipeId, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const order = {
    id: ++state.orderSeq,
    recipeId: recipe.id,
    name: recipe.name,
    needs: [...recipe.needs],
    price: recipe.price,
    patience,
    maxPatience: 45,
  };
  state.orders[slot] = order;
  return order;
}

export function applyShot(state, shot) {
  state.screen = 'playing';
  state.orders = [];
  state.orderSeq = 0;
  state.plate = [];
  state.hand = null;
  state.job = null;
  state.plateReady = false;
  state.flash = null;
  state.popups = [];

  if (shot === 'cover') {
    // The money shot: 3 orders, one dish 2/3 assembled, one plate ready.
    state.timeLeft = 84; // 1:24 on the day timer
    state.score = 340;
    state.served = 3;
    state.combo = 3;
    setOrder(state, 0, 'nasi-goreng', 32);
    setOrder(state, 1, 'mie-ayam', 21);
    setOrder(state, 2, 'soto-ayam', 12);
    state.plate = ['rice', 'egg'];
    state.plateReady = false;
    state.hand = { id: 'chili', prepped: true };
    state.chef.x = 640;
    state.chef.y = 610;
    state.flash = { text: 'NASI GORENG — ONE MORE INGREDIENT!', until: 99 };
    return;
  }
  if (shot === 'chop') {
    state.timeLeft = 118;
    state.score = 120;
    state.served = 1;
    state.combo = 1;
    setOrder(state, 0, 'mie-ayam', 38);
    setOrder(state, 1, 'ayam-geprek', 30);
    state.job = { station: 'board', id: 'chicken', progress: 0.9, duration: 1.6, burnAfter: 0, burned: false };
    state.chef.x = 375;
    state.chef.y = 610;
    return;
  }
  if (shot === 'rush') {
    state.timeLeft = 55;
    state.score = 620;
    state.served = 6;
    state.combo = 6;
    state.rush = true;
    setOrder(state, 0, 'nasi-goreng', 9);
    setOrder(state, 1, 'mie-ayam', 7);
    setOrder(state, 2, 'sayur-tumis', 5);
    state.plate = ['noodle', 'chicken', 'greens'];
    state.plateReady = true;
    state.hand = null;
    state.chef.x = 1130;
    state.chef.y = 610;
    state.flash = { text: 'RUSH HOUR — MIE AYAM READY TO SERVE!', until: 99 };
    return;
  }
  if (shot === 'win') {
    state.screen = 'daydone';
    state.timeLeft = 0;
    state.score = 940;
    state.served = 9;
    state.combo = 0;
    state.bestCombo = 3;
    state.failed = 0;
    setOrder(state, 0, 'nasi-goreng', 20);
    return;
  }
  // Default: plain mid-play.
  state.timeLeft = 120;
  spawnOrder(state);
  spawnOrder(state);
  state.chef.x = 640;
  state.chef.y = 560;
}
