// recipes.js — matching a plate against the order board.
// One job: decide what a plate is, and whether it serves an order.

import { INGREDIENTS, RECIPE_BY_ID } from './config.js';

export function isPrepped(id, prepped) {
  return prepped === true;
}

// A component is ready for the plate when its prep is done:
// stove food must be cooked, board food must be chopped.
export function componentReady(hand) {
  return hand && hand.prepped === true;
}

export function plateMatchesRecipe(plate, recipeId) {
  const recipe = RECIPE_BY_ID[recipeId];
  if (!recipe || plate.length !== recipe.needs.length) return false;
  const sortedPlate = [...plate].sort();
  const sortedNeeds = [...recipe.needs].sort();
  return sortedPlate.every((id, i) => id === sortedNeeds[i]);
}

// The first open order this plate completes, or null.
export function findMatchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatchesRecipe(state.plate, order.recipeId)) return order;
  }
  return null;
}

// Human-readable list of what a plate still needs for a given recipe.
export function missingForPlate(plate, recipeId) {
  const recipe = RECIPE_BY_ID[recipeId];
  if (!recipe) return [];
  const have = [...plate];
  const missing = [];
  for (const id of recipe.needs) {
    const i = have.indexOf(id);
    if (i >= 0) have.splice(i, 1);
    else missing.push(id);
  }
  return missing;
}

export function ingredientLabel(id) {
  const ing = INGREDIENTS[id];
  return ing ? ing.name : id;
}

export function prepVerb(id) {
  const ing = INGREDIENTS[id];
  if (!ing) return 'prep';
  return ing.prep === 'stove' ? 'Cooking' : 'Chopping';
}
