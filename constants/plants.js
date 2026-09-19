const PLANT_CATALOG = [
  {
    id: 'wheat_crop',
    name: 'Golden Wheat 🌾',
    seedPrice: 30,
    fertilizerCost: 1,
    growthDays: 1,
    produce: 'wheat_sheaf',
    produceName: 'Wheat Sheaf 🌾',
    produceBasePrice: 22,
    yieldPerHarvest: 2,
    minSeedPrice: 15,
    maxSeedPrice: 50,
    prodMin: 12,
    prodMax: 35
  },
  {
    id: 'carrot_crop',
    name: 'Sweet Carrot 🥕',
    seedPrice: 60,
    fertilizerCost: 1,
    growthDays: 2,
    produce: 'carrot_bundle',
    produceName: 'Carrot Bundle 🥕',
    produceBasePrice: 48,
    yieldPerHarvest: 2,
    minSeedPrice: 35,
    maxSeedPrice: 95,
    prodMin: 25,
    prodMax: 70
  },
  {
    id: 'strawberry_crop',
    name: 'Ruby Strawberry 🍓',
    seedPrice: 120,
    fertilizerCost: 2,
    growthDays: 3,
    produce: 'strawberry_crate',
    produceName: 'Strawberry Crate 🍓',
    produceBasePrice: 110,
    yieldPerHarvest: 2,
    minSeedPrice: 70,
    maxSeedPrice: 180,
    prodMin: 55,
    prodMax: 140
  }
];

const BASE_FERTILIZER_PRICE = 8;
const PESTICIDE_PRICE = 25;
const DEFAULT_MAX_PLANT_SLOTS = 6;

module.exports = {
  PLANT_CATALOG,
  BASE_FERTILIZER_PRICE,
  PESTICIDE_PRICE,
  DEFAULT_MAX_PLANT_SLOTS
};