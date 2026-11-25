// config.js — Dapur Kilat: recipes, ingredients, prep rules and tuning.
// One job: every number the rest of the game reads lives here.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const DAY_SECONDS = 150;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 45;
export const ORDER_SPAWN_EVERY = 12;
export const RUSH_AT_SECONDS_LEFT = 60;
export const MAX_FAILED_ORDERS = 3;

// An ingredient is raw until it is prepped. Prep station per ingredient:
//   board = chopping board (chop time), stove = pan (cook time, burns if left).
export const INGREDIENTS = {
  rice:    { name: 'Rice',    short: 'RICE',   color: '#f5f0dc', prep: 'stove', prepTime: 3.0, burnAfter: 7.0, chop: false },
  noodle:  { name: 'Noodle',  short: 'NOODLE', color: '#f7c948', prep: 'stove', prepTime: 3.0, burnAfter: 7.0, chop: false },
  egg:     { name: 'Egg',     short: 'EGG',    color: '#fff3b0', prep: 'board', prepTime: 1.2, burnAfter: 0,   chop: true },
  chicken: { name: 'Chicken', short: 'CHICKEN',color: '#e8a87c', prep: 'board', prepTime: 1.6, burnAfter: 0,   chop: true },
  chili:   { name: 'Chili',   short: 'CHILI',  color: '#e63946', prep: 'board', prepTime: 1.0, burnAfter: 0,   chop: true },
  greens:  { name: 'Greens',  short: 'GREENS', color: '#7ac74f', prep: 'board', prepTime: 1.0, burnAfter: 0,   chop: true },
};

export const INGREDIENT_ORDER = ['rice', 'noodle', 'egg', 'chicken', 'chili', 'greens'];

// A recipe is three prepped components. Order on the plate does not matter,
// the set does — so the player plans a route, not a memorised sequence.
export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', needs: ['rice', 'egg', 'chili'],   price: 100, color: '#f4a261' },
  { id: 'mie-ayam',    name: 'Mie Ayam',    needs: ['noodle', 'chicken', 'greens'], price: 110, color: '#f7c948' },
  { id: 'soto-ayam',   name: 'Soto Ayam',   needs: ['noodle', 'chicken', 'egg'], price: 120, color: '#f2c14e' },
  { id: 'ayam-geprek', name: 'Ayam Geprek', needs: ['rice', 'chicken', 'chili'], price: 115, color: '#e76f51' },
  { id: 'sayur-tumis', name: 'Sayur Tumis', needs: ['greens', 'chili', 'egg'],  price: 90,  color: '#7ac74f' },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Kitchen stations, in canvas pixels. The chef walks between them.
export const STATIONS = {
  pantry: { x: 40,  y: 300, w: 190, h: 330, label: 'PANTRY', sub: 'pick ingredients 1-6' },
  board:  { x: 270, y: 300, w: 210, h: 330, label: 'CHOPPING BOARD', sub: 'chop: E / Space' },
  stove:  { x: 520, y: 300, w: 210, h: 330, label: 'STOVE', sub: 'cook: E / Space' },
  plate:  { x: 770, y: 300, w: 210, h: 330, label: 'ASSEMBLY PLATE', sub: 'drop prepped food' },
  serve:  { x: 1020, y: 300, w: 220, h: 330, label: 'SERVE COUNTER', sub: 'serve: E / Space' },
};

export const CHEF_SPEED = 340; // px per second
export const CHEF_START = { x: 640, y: 560 };

export const SCORE = {
  basePerDish: 100,
  maxTip: 50,
  comboStep: 3,      // every 3 serves in a row raises the multiplier
  maxCombo: 3,
  failPenalty: 40,
};

export const COLORS = {
  floor: '#c98f5f',
  floorTile: '#b57a4e',
  wall: '#f7ead7',
  counter: '#8b5e34',
  counterTop: '#a4713f',
  board: '#e8c39e',
  stoveTop: '#3d3d3d',
  plate: '#ffffff',
  ink: '#2b2118',
  muted: '#6b5a49',
  gold: '#f7c948',
  red: '#e63946',
  green: '#43aa5a',
};
