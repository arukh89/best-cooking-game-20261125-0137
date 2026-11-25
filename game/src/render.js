// render.js — every pixel the judge sees.
// One job: draw the kitchen, the order board, the chef and the screens.

import {
  CANVAS_W, CANVAS_H, STATIONS, INGREDIENTS, INGREDIENT_ORDER,
  RECIPES, RECIPE_BY_ID, COLORS, DAY_SECONDS,
} from './config.js';
import { comboMultiplier, tipFor } from './state.js';
import { stationCenter } from './kitchen.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color || COLORS.ink;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

export function drawIngredientIcon(ctx, id, x, y, r) {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = ing.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  text(ctx, ing.short.slice(0, 2), x, y + 1, Math.max(9, r * 0.7), '#2b2118', 'center', 'bold');
}

function drawFoodOnPlate(ctx, id, x, y, r) {
  drawIngredientIcon(ctx, id, x, y, r);
  ctx.beginPath();
  ctx.arc(x, y, r + 3, 0, Math.PI * 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function patienceColor(p, max) {
  const f = p / max;
  if (f > 0.5) return COLORS.green;
  if (f > 0.25) return '#e9a13b';
  return COLORS.red;
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = RECIPE_BY_ID[order.recipeId];
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#fff8ec';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = recipe.color;
  ctx.stroke();
  text(ctx, `#${order.id} ${order.name}`, x + 12, y + 22, 20, COLORS.ink, 'left', 'bold');
  text(ctx, `$${order.price} + tip $${tipFor(order)}`, x + w - 12, y + 22, 15, COLORS.muted, 'right');
  let ix = x + 18;
  for (const id of order.needs) {
    drawIngredientIcon(ctx, id, ix + 16, y + 58, 16);
    text(ctx, INGREDIENTS[id].name, ix + 36, y + 58, 14, COLORS.ink);
    ix += 108;
  }
  // Patience bar = the order's timer, readable at a glance.
  const bw = w - 24;
  roundRect(ctx, x + 12, y + h - 26, bw, 14, 7);
  ctx.fillStyle = '#e8dcc8';
  ctx.fill();
  roundRect(ctx, x + 12, y + h - 26, bw * Math.max(0, order.patience / order.maxPatience), 14, 7);
  ctx.fillStyle = patienceColor(order.patience, order.maxPatience);
  ctx.fill();
  text(ctx, `${Math.ceil(order.patience)}s`, x + w - 12, y + h - 19, 12, COLORS.ink, 'right');
  ctx.restore();
}

function drawOrderBoard(ctx, state) {
  text(ctx, 'ORDER BOARD', 40, 52, 22, '#fff', 'left', 'bold');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — first ticket is coming…', 40, 110, 16, '#ffe9c9', 'left');
    return;
  }
  let x = 40;
  for (const order of state.orders) {
    drawOrderTicket(ctx, order, x, 70, 340, 110);
    x += 360;
  }
}

function drawDayTimer(ctx, state) {
  const cx = 1218;
  const cy = 48;
  const frac = state.timeLeft / DAY_SECONDS;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#fff8ec';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.closePath();
  ctx.fillStyle = frac > 0.4 ? COLORS.green : COLORS.red;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#fff8ec';
  ctx.fill();
  const mm = Math.floor(state.timeLeft / 60);
  const ss = Math.floor(state.timeLeft % 60).toString().padStart(2, '0');
  text(ctx, `${mm}:${ss}`, cx, cy, 15, COLORS.ink, 'center', 'bold');
  text(ctx, 'DAY TIMER', cx, cy + 44, 11, '#fff', 'center');
  ctx.restore();
}

function drawHud(ctx, state) {
  // Top strip.
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(0, 0, CANVAS_W, 200);
  ctx.fillStyle = '#5d3413';
  ctx.fillRect(0, 196, CANVAS_W, 4);
  text(ctx, 'DAPUR KILAT', 40, 26, 24, '#ffd166', 'left', 'bold');
  text(ctx, 'RUSH KITCHEN — cook, chop, plate, serve!', 200, 26, 15, '#ffe9c9', 'left');
  drawOrderBoard(ctx, state);
  // Score block, right side.
  text(ctx, `SCORE ${state.score}`, 1010, 26, 20, '#fff', 'left', 'bold');
  text(ctx, `Served ${state.served}  •  Combo x${comboMultiplier(state)}`, 1010, 52, 13, '#ffe9c9', 'left');
  drawDayTimer(ctx, state);
}

function drawPantry(ctx, state) {
  const s = STATIONS.pantry;
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fillStyle = COLORS.counterTop;
  ctx.fill();
  ctx.strokeStyle = COLORS.counter;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, s.label, s.x + s.w / 2, s.y + 24, 16, '#fff', 'center', 'bold');
  text(ctx, 'click a bin or press 1-6', s.x + s.w / 2, s.y + 46, 12, '#ffe9c9', 'center');
  INGREDIENT_ORDER.forEach((id, i) => {
    const bx = s.x + 20 + (i % 2) * 88;
    const by = s.y + 70 + Math.floor(i / 2) * 82;
    roundRect(ctx, bx, by, 76, 68, 8);
    ctx.fillStyle = '#fff8ec';
    ctx.fill();
    drawIngredientIcon(ctx, id, bx + 38, by + 24, 17);
    text(ctx, INGREDIENTS[id].name, bx + 38, by + 54, 12, COLORS.ink, 'center');
    text(ctx, `${i + 1}`, bx + 8, by + 12, 11, COLORS.muted, 'left');
  });
}

function drawBoard(ctx, state) {
  const s = STATIONS.board;
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fillStyle = COLORS.board;
  ctx.fill();
  ctx.strokeStyle = COLORS.counter;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, s.label, s.x + s.w / 2, s.y + 24, 16, COLORS.ink, 'center', 'bold');
  text(ctx, 'chop: E / Space', s.x + s.w / 2, s.y + 46, 12, COLORS.muted, 'center');
  // Knife + board lines.
  ctx.strokeStyle = '#9c7a54';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(s.x + 30, s.y + 90 + i * 18);
    ctx.lineTo(s.x + s.w - 30, s.y + 90 + i * 18);
    ctx.stroke();
  }
  if (state.job && state.job.station === 'board') {
    const ing = INGREDIENTS[state.job.id];
    drawIngredientIcon(ctx, state.job.id, s.x + s.w / 2, s.y + 150, 30);
    text(ctx, `Chopping ${ing.name}…`, s.x + s.w / 2, s.y + 195, 15, COLORS.ink, 'center', 'bold');
    const pw = 150;
    roundRect(ctx, s.x + (s.w - pw) / 2, s.y + 215, pw, 14, 7);
    ctx.fillStyle = '#d8c3a5';
    ctx.fill();
    roundRect(ctx, s.x + (s.w - pw) / 2, s.y + 215, pw * (state.job.progress / state.job.duration), 14, 7);
    ctx.fillStyle = COLORS.green;
    ctx.fill();
  } else {
    text(ctx, '— empty —', s.x + s.w / 2, s.y + 150, 15, COLORS.muted, 'center');
  }
}

function drawStove(ctx, state) {
  const s = STATIONS.stove;
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fillStyle = COLORS.stoveTop;
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, s.label, s.x + s.w / 2, s.y + 24, 16, '#fff', 'center', 'bold');
  text(ctx, 'cook: E / Space — don\'t burn it!', s.x + s.w / 2, s.y + 46, 12, '#ffb3b3', 'center');
  // Two burners.
  for (const bx of [s.x + 55, s.x + s.w - 55]) {
    ctx.beginPath();
    ctx.arc(bx, s.y + 130, 38, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#666';
    ctx.stroke();
  }
  if (state.job && state.job.station === 'stove') {
    const ing = INGREDIENTS[state.job.id];
    const cx = s.x + 55;
    drawIngredientIcon(ctx, state.job.id, cx, s.y + 130, 26);
    const frac = state.job.progress / state.job.duration;
    text(ctx, state.job.burned ? 'BURNING! Take it off!' : `Cooking ${ing.name}…`, s.x + s.w / 2, s.y + 195, 15, state.job.burned ? '#ff6b6b' : '#fff', 'center', 'bold');
    const pw = 150;
    roundRect(ctx, s.x + (s.w - pw) / 2, s.y + 215, pw, 14, 7);
    ctx.fillStyle = '#555';
    ctx.fill();
    roundRect(ctx, s.x + (s.w - pw) / 2, s.y + 215, pw * Math.min(1, frac), 14, 7);
    ctx.fillStyle = state.job.burned ? COLORS.red : '#f7c948';
    ctx.fill();
  } else {
    text(ctx, '— pan empty —', s.x + s.w / 2, s.y + 195, 15, '#aaa', 'center');
  }
}

function drawPlateStation(ctx, state) {
  const s = STATIONS.plate;
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fillStyle = '#e9dcc3';
  ctx.fill();
  ctx.strokeStyle = state.plateReady ? COLORS.green : COLORS.counter;
  ctx.lineWidth = state.plateReady ? 5 : 3;
  ctx.stroke();
  text(ctx, s.label, s.x + s.w / 2, s.y + 24, 16, COLORS.ink, 'center', 'bold');
  text(ctx, 'drop prepped food here', s.x + s.w / 2, s.y + 46, 12, COLORS.muted, 'center');
  // The plate itself.
  ctx.beginPath();
  ctx.ellipse(s.x + s.w / 2, s.y + 150, 78, 52, 0, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.plate;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#cbb98f';
  ctx.stroke();
  if (state.plate.length === 0) {
    text(ctx, '— empty plate —', s.x + s.w / 2, s.y + 150, 14, COLORS.muted, 'center');
  } else {
    state.plate.forEach((id, i) => {
      drawFoodOnPlate(ctx, id, s.x + 55 + i * 52, s.y + 150, 20);
    });
  }
  if (state.plateReady) {
    text(ctx, '✓ READY TO SERVE!', s.x + s.w / 2, s.y + 235, 17, COLORS.green, 'center', 'bold');
  } else if (state.plate.length > 0) {
    text(ctx, `${state.plate.length}/3 on the plate`, s.x + s.w / 2, s.y + 235, 15, COLORS.ink, 'center');
  }
  text(ctx, 'Dish mid-assembly', s.x + s.w / 2, s.y + 265, 12, COLORS.muted, 'center');
}

function drawServe(ctx, state) {
  const s = STATIONS.serve;
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fillStyle = '#2f6d3a';
  ctx.fill();
  ctx.strokeStyle = '#1e4d27';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, s.label, s.x + s.w / 2, s.y + 24, 16, '#fff', 'center', 'bold');
  text(ctx, 'serve a finished dish', s.x + s.w / 2, s.y + 46, 12, '#cdeccd', 'center');
  // Bell.
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 130, 42, Math.PI, 0);
  ctx.fillStyle = '#ffd166';
  ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 42, s.y + 128, 84, 10);
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 150, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd166';
  ctx.fill();
  const match = state.plateReady ? '✓ plate ready — serve now!' : 'waiting for a finished dish…';
  text(ctx, match, s.x + s.w / 2, s.y + 210, 15, '#fff', 'center', 'bold');
  text(ctx, 'E / Space at the counter', s.x + s.w / 2, s.y + 240, 13, '#cdeccd', 'center');
}

function drawChef(ctx, state) {
  const { x, y, dir } = state.chef;
  const bob = state.chef.moving ? Math.sin(state.elapsed * 14) * 3 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  // Shadow.
  ctx.beginPath();
  ctx.ellipse(0, 26, 26, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  // Body (apron) + head + chef hat.
  roundRect(ctx, -18, -14, 36, 38, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -26, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c9a0';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -40, 17, 9, 0, Math.PI, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillRect(-17, -44, 34, 8);
  // Eyes look in the walking direction.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(dir * 4 - 4, -27, 2, 0, Math.PI * 2);
  ctx.arc(dir * 4 + 5, -27, 2, 0, Math.PI * 2);
  ctx.fill();
  // What the chef carries, drawn above the head.
  if (state.hand) {
    const ing = INGREDIENTS[state.hand.id];
    drawIngredientIcon(ctx, state.hand.id, 0, -62, 15);
    text(ctx, ing.name + (state.hand.prepped ? ' ✓' : ''), 0, -84, 12, '#fff', 'center', 'bold');
  }
  ctx.restore();
}

function drawPopups(ctx, state) {
  for (const p of state.popups) {
    text(ctx, p.text, p.x, p.y - 20, 22, p.color, 'center', 'bold');
  }
  if (state.flash) {
    ctx.save();
    ctx.fillStyle = 'rgba(43,33,24,0.85)';
    roundRect(ctx, 340, 210, 600, 52, 12);
    ctx.fill();
    text(ctx, state.flash.text, 640, 236, 22, '#ffd166', 'center', 'bold');
    ctx.restore();
  }
}

function drawHintBar(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, 40, 668, 1200, 36, 10);
  ctx.fill();
  const hand = state.hand
    ? `Carrying: ${INGREDIENTS[state.hand.id].name}${state.hand.prepped ? ' (ready ✓)' : ' (raw — prep it first)'}`
    : 'Hands empty — pick an ingredient (click pantry or press 1-6)';
  text(ctx, `Move: WASD / arrows / click   •   Interact: E or Space   •   ${hand}   •   Failed ${state.failed}/3   •   M: mute`, 640, 686, 13, '#fff', 'center');
}

function drawMenu(ctx, state) {
  ctx.fillStyle = 'rgba(43,33,24,0.88)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'DAPUR KILAT', 640, 170, 64, '#ffd166', 'center', 'bold');
  text(ctx, 'RUSH KITCHEN', 640, 225, 28, '#fff', 'center', 'bold');
  text(ctx, 'Orders pile up on the board. Pick ingredients, chop them, cook them,', 640, 300, 20, '#ffe9c9', 'center');
  text(ctx, 'build each dish on the plate — then ring the bell and serve it fast.', 640, 330, 20, '#ffe9c9', 'center');
  text(ctx, 'Recipes: Nasi Goreng • Mie Ayam • Soto Ayam • Ayam Geprek • Sayur Tumis', 640, 380, 17, '#ffd166', 'center');
  text(ctx, 'Move with WASD / arrows or click  •  Interact with E or Space  •  1-6 picks ingredients', 640, 420, 16, '#fff', 'center');
  ctx.save();
  roundRect(ctx, 490, 470, 300, 64, 14);
  ctx.fillStyle = '#43aa5a';
  ctx.fill();
  text(ctx, '▶  START COOKING', 640, 502, 24, '#fff', 'center', 'bold');
  ctx.restore();
  text(ctx, 'Serve 3 dishes in a row to raise your combo. 3 failed orders ends the day.', 640, 580, 15, '#ffe9c9', 'center');
}

function drawEnd(ctx, state, won) {
  ctx.fillStyle = 'rgba(43,33,24,0.88)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, won ? 'DAY COMPLETE!' : 'DAY OVER', 640, 180, 56, won ? '#7ac74f' : '#ff8fa3', 'center', 'bold');
  const stars = state.served >= 12 ? '★★★' : state.served >= 8 ? '★★' : state.served >= 4 ? '★' : '—';
  text(ctx, stars, 640, 250, 48, '#ffd166', 'center');
  text(ctx, `Score ${state.score}   •   Dishes served ${state.served}   •   Best combo x${state.bestCombo}`, 640, 330, 22, '#fff', 'center', 'bold');
  text(ctx, `Orders failed ${state.failed}   •   Day ${won ? 'complete' : 'ended early'}`, 640, 370, 18, '#ffe9c9', 'center');
  text(ctx, 'Press R to cook another day', 640, 450, 20, '#ffd166', 'center', 'bold');
}

export function render(ctx, state) {
  // Floor.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 200, CANVAS_W, CANVAS_H - 200);
  ctx.fillStyle = COLORS.floorTile;
  for (let y = 210; y < CANVAS_H; y += 46) {
    for (let x = ((y / 46) % 2) * 46; x < CANVAS_W; x += 92) {
      ctx.fillRect(x, y, 88, 42);
    }
  }
  drawHud(ctx, state);
  if (state.screen === 'menu') {
    drawPantry(ctx, state);
    drawBoard(ctx, state);
    drawStove(ctx, state);
    drawPlateStation(ctx, state);
    drawServe(ctx, state);
    drawMenu(ctx, state);
    return;
  }
  drawPantry(ctx, state);
  drawBoard(ctx, state);
  drawStove(ctx, state);
  drawPlateStation(ctx, state);
  drawServe(ctx, state);
  drawChef(ctx, state);
  drawPopups(ctx, state);
  drawHintBar(ctx, state);
  if (state.screen === 'daydone') drawEnd(ctx, state, true);
  if (state.screen === 'gameover') drawEnd(ctx, state, false);
}
