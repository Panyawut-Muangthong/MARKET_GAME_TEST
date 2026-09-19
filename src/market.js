const { ASSET_CATALOG } = require('../constants/assets');
const { PLANT_CATALOG } = require('../constants/plants');
function calculateBouncingPrice(currentVal, baseVal, minVal, maxVal, multiplier = 1.0) {
  const previous = currentVal || baseVal;
  
  const fluctuation = (Math.random() * 0.5 - 0.25) * baseVal;
  
  const rawPrice = (baseVal * 0.7 + previous * 0.3 + fluctuation) * multiplier;
  
  const next = Math.max(minVal, Math.min(maxVal, Math.round(rawPrice)));

  const pctChange = Math.round(((next - previous) / previous) * 100);
  return { price: next, pctChange };
}

function randomizeMarket(prevMarket = null, activeEvent = null) {
  const animal = {};
  const seeds = {};
  const produce = {};
  const deltas = { animal: {}, seeds: {}, produce: {} };
  const produceMult = activeEvent?.marketProduceMult || 1.0;

  // Livestock & Animal Produce
  ASSET_CATALOG.forEach(item => {
    const prevA = prevMarket?.animal?.[item.id];
    const prevP = prevMarket?.produce?.[item.produce];

    const resA = calculateBouncingPrice(prevA, item.basePrice, item.minPrice, item.maxPrice, 1.0);
    const resP = calculateBouncingPrice(prevP, item.produceBasePrice, item.prodMin, item.prodMax, produceMult);

    animal[item.id] = resA.price;
    deltas.animal[item.id] = resA.pctChange;

    produce[item.produce] = resP.price;
    deltas.produce[item.produce] = resP.pctChange;
  });

  // Seeds & Harvest Produce
  PLANT_CATALOG.forEach(item => {
    const prevS = prevMarket?.seeds?.[item.id];
    const prevP = prevMarket?.produce?.[item.produce];

    const resS = calculateBouncingPrice(prevS, item.seedPrice, item.minSeedPrice, item.maxSeedPrice, 1.0);
    const resP = calculateBouncingPrice(prevP, item.produceBasePrice, item.prodMin, item.prodMax, produceMult);

    seeds[item.id] = resS.price;
    deltas.seeds[item.id] = resS.pctChange;

    produce[item.produce] = resP.price;
    deltas.produce[item.produce] = resP.pctChange;
  });

  return { animal, seeds, produce, deltas };
}

module.exports = {
  calculateBouncingPrice,
  randomizeMarket
};