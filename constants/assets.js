const ASSET_CATALOG = [
  { id: 'chicken', name: 'Poultry Flock 🐔', basePrice: 100, feedCost: 1, produce: 'egg', produceName: 'Eggs 🥚', produceBasePrice: 15, yieldPerAnimal: 1, minPrice: 40, maxPrice: 200, prodMin: 6, prodMax: 35 },
  { id: 'apiary', name: 'Bee Hive 🐝', basePrice: 180, feedCost: 2, produce: 'honey', produceName: 'Raw Honey 🍯', produceBasePrice: 32, yieldPerAnimal: 1, minPrice: 80, maxPrice: 360, prodMin: 12, prodMax: 75 },
  { id: 'pig', name: 'Truffle Pig 🐷', basePrice: 250, feedCost: 2, produce: 'truffle', produceName: 'Truffles 🍄', produceBasePrice: 45, yieldPerAnimal: 1, minPrice: 110, maxPrice: 500, prodMin: 18, prodMax: 110 },
  { id: 'sheep', name: 'Angora Sheep 🐑', basePrice: 380, feedCost: 3, produce: 'wool', produceName: 'Fine Wool 🧶', produceBasePrice: 70, yieldPerAnimal: 1, minPrice: 160, maxPrice: 750, prodMin: 28, prodMax: 160 },
  { id: 'dairy_cow', name: 'Dairy Cow 🐮', basePrice: 500, feedCost: 4, produce: 'milk', produceName: 'Fresh Milk 🥛', produceBasePrice: 95, yieldPerAnimal: 1, minPrice: 220, maxPrice: 1000, prodMin: 40, prodMax: 220 },
  { id: 'golden_goose', name: 'Golden Goose 🪿', basePrice: 750, feedCost: 6, produce: 'golden_egg', produceName: 'Golden Egg ✨', produceBasePrice: 160, yieldPerAnimal: 1, minPrice: 300, maxPrice: 1600, prodMin: 65, prodMax: 400 },
  { id: 'thoroughbred', name: 'Race Horse 🐴', basePrice: 1000, feedCost: 8, produce: 'trophy', produceName: 'Trophies 🏆', produceBasePrice: 220, yieldPerAnimal: 1, minPrice: 450, maxPrice: 2200, prodMin: 90, prodMax: 550 }
];

const BASE_FEED_PRICE = 10;
const MEDICINE_PRICE = 35;
const DISCONNECT_GRACE_PERIOD = 60000;

module.exports = {
  ASSET_CATALOG,
  BASE_FEED_PRICE,
  MEDICINE_PRICE,
  DISCONNECT_GRACE_PERIOD
};