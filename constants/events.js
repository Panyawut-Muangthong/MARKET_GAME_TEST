const GOURMET_TIERS = [
  { bonusPct: 10, mult: 1.10, weight: 50 },
  { bonusPct: 30, mult: 1.30, weight: 25 },
  { bonusPct: 45, mult: 1.45, weight: 15 },
  { bonusPct: 60, mult: 1.60, weight: 10 }
];

function rollGourmetTier() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const tier of GOURMET_TIERS) {
    cumulative += tier.weight;
    if (roll < cumulative) return tier;
  }
  return GOURMET_TIERS[0];
}

const EVENTS = [
  {
    id: 'flu_epidemic',
    titleEn: 'Severe Farm Flu Epidemic!',
    titleTh: 'การระบาดของไข้หวัดสัตว์รุนแรง!',
    descEn: 'Produce yield drops by 50%! Animals without medicine may die overnight!',
    descTh: 'ผลผลิตลดลง 50%! สัตว์ที่ไม่ได้รับยาอาจล้มตายข้ามคืน!',
    duration: 2,
    produceMult: 0.5,
    feedPriceMult: 1.0,
    deathRisk: 0.35
  },
  {
    id: 'worm_infestation',
    titleEn: 'Voracious Pest Worm Invasion!',
    titleTh: 'ฝูงหนอนศัตรูพืชบุกทำลายแปลงผัก!',
    descEn: 'Worms attack your crops! Any plot without pesticide spray will be eaten and destroyed overnight!',
    descTh: 'หนอนบุกทำลายแปลงผัก! แปลงใดที่ไม่ฉีดยาฆ่าแมลง/ยากำจัดหนอนจะถูกกัดกินและเหี่ยวเฉาตายข้ามคืน!',
    duration: 2,
    produceMult: 1.0,
    feedPriceMult: 1.0,
    deathRisk: 0
  },
  {
    id: 'bumper_harvest',
    titleEn: 'Golden Sunshine Festival!',
    titleTh: 'เทศกาลแดดทอง ผลผลิตเบ่งบาน!',
    descEn: 'Healthy animals produce double yields today!',
    descTh: 'สัตว์ที่แข็งแรงและได้รับอาหารจะให้ผลผลิตเป็น 2 เท่าในวันนี้!',
    duration: 1,
    produceMult: 2.0,
    feedPriceMult: 1.0,
    deathRisk: 0
  },
  {
    id: 'feed_shortage',
    titleEn: 'Global Feed Logistics Crisis!',
    titleTh: 'วิกฤตการณ์ขาดแคลนอาหารสัตว์!',
    descEn: 'Feed prices have surged to $25 per bag due to drought and supply disruption!',
    descTh: 'ราคาอาหารสัตว์พุ่งขึ้นเป็นถุงละ $25 เนื่องจากวิกฤตภัยแล้งและการขนส่ง!',
    duration: 2,
    produceMult: 1.0,
    feedPriceMult: 2.5,
    deathRisk: 0
  },
  {
    id: 'gourmet_boom',
    titleEn: 'Gourmet Restaurant Boom!',
    titleTh: 'กระแสภัตตาคารหรูระดับโลก!',
    descEn: 'High-end delicacies in demand! Produce sells for +60% on the market!',
    descTh: 'ความต้องการวัตถุดิบพรีเมียมล้นหลาม! ขายผลผลิตในตลาดได้ราคาสูงขึ้น +60%!',
    duration: 2,
    produceMult: 1.0,
    feedPriceMult: 1.0,
    marketProduceMult: 1.6,
    deathRisk: 0
  }
];

function pickRandomEvent(room = null, force = false) {
  if (force) {
    const template = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const eventInstance = {
      ...template,
      instanceId: template.id + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      remainingDays: template.duration
    };

    if (eventInstance.id === 'gourmet_boom') {
      const tier = rollGourmetTier();
      eventInstance.marketProduceMult = tier.mult;
      eventInstance.descEn = `High-end delicacies in demand! Produce sells for +${tier.bonusPct}% on the market!`;
      eventInstance.descTh = `ความต้องการวัตถุดิบพรีเมียมล้นหลาม! ขายผลผลิตในตลาดได้ราคาสูงขึ้น +${tier.bonusPct}%!`;
    }

    return eventInstance;
  }

  if (room) {
    if (room.currentCooldown > -1) {
      room.currentCooldown--;
      return null;
    }
  }

  if (Math.random() < 0.35) {
    const template = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const eventInstance = {
      ...template,
      instanceId: template.id + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      remainingDays: template.duration
    };

    if (eventInstance.id === 'gourmet_boom') {
      const tier = rollGourmetTier();
      eventInstance.marketProduceMult = tier.mult;
      eventInstance.descEn = `High-end delicacies in demand! Produce sells for +${tier.bonusPct}% on the market!`;
      eventInstance.descTh = `ความต้องการวัตถุดิบพรีเมียมล้นหลาม! ขายผลผลิตในตลาดได้ราคาสูงขึ้น +${tier.bonusPct}%!`;
    }

    return eventInstance;
  }

  return null;
}

module.exports = {
  EVENTS,
  pickRandomEvent
};