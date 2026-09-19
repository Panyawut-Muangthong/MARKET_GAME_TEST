const { ASSET_CATALOG, BASE_FEED_PRICE } = require('../constants/assets');
const { PLANT_CATALOG, BASE_FERTILIZER_PRICE, PESTICIDE_PRICE, DEFAULT_MAX_PLANT_SLOTS } = require('../constants/plants');
const { pickRandomEvent } = require('../constants/events');
const { randomizeMarket } = require('./market');

const rooms = {};
const disconnectTimers = new Map();
const roomTickers = new Map();

function checkWinCondition(room, player) {
  let totalAnimals = 0;
  ASSET_CATALOG.forEach(item => {
    totalAnimals += (player.inventory[item.id] || []).length;
  });

  const targetCash = Number(room.targetCash);
  const targetAnimals = Number(room.targetAnimalCount);
  const targetProduce = Number(room.targetProduceSold);

  const cashCondition = Number(player.cash) >= targetCash;
  const animalCondition = totalAnimals >= targetAnimals;
  const produceCondition = Number(player.totalProduceSold || 0) >= targetProduce;

  if (!room.winner && cashCondition && animalCondition && produceCondition) {
    room.winner = player.name;
    stopRoomTimer(room.roomId);
    return true;
  }
  return false;
}

function clearPlayerTimer(playerId) {
  if (disconnectTimers.has(playerId)) {
    clearTimeout(disconnectTimers.get(playerId));
    disconnectTimers.delete(playerId);
  }
}

function startRoomTimer(room, io) {
  stopRoomTimer(room.roomId);
  room.timeLeft = room.dayDuration;

  const ticker = setInterval(() => {
    if (!room.started || room.winner) {
      stopRoomTimer(room.roomId);
      return;
    }

    room.timeLeft--;
    io.to(room.roomId).emit('timer_tick', { timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      advanceDay(room, io);
    }
  }, 1000);

  roomTickers.set(room.roomId, ticker);
}

function stopRoomTimer(roomId) {
  if (roomTickers.has(roomId)) {
    clearInterval(roomTickers.get(roomId));
    roomTickers.delete(roomId);
  }
}

function removePlayerFromRoom(room, playerId, io) {
  clearPlayerTimer(playerId);
  const player = room.players[playerId];
  if (!player) return;

  delete room.players[playerId];

  if (Object.keys(room.players).length === 0) {
    stopRoomTimer(room.roomId);
    delete rooms[room.roomId];
  } else {
    if (room.hostId === playerId) {
      room.hostId = Object.keys(room.players)[0];
    }

    if (room.started && !room.winner) {
      const activePlayers = Object.values(room.players).filter(p => p.connected);
      if (activePlayers.length > 0 && activePlayers.every(p => p.ready)) {
        advanceDay(room, io);
        return;
      }
    }

    io.to(room.roomId).emit('room_update', sanitizeRoom(room));
  }
}

function advanceDay(room, io) {
  const currentEvent = room.event;
  const isFlu = currentEvent?.id === 'flu_epidemic';
  const isWorms = currentEvent?.id === 'worm_infestation';
  const produceYieldMult = currentEvent?.produceMult !== undefined ? currentEvent.produceMult : 1.0;

  for (const pid in room.players) {
    const p = room.players[pid];
    let deathsFromFlu = 0;
    let starvationLosses = 0;
    let wormCropLosses = 0;
    let harvestedCount = 0;

    // --- Livestock Feed & Produce ---
    let neededFeed = 0;
    ASSET_CATALOG.forEach(item => {
      const count = (p.inventory[item.id] || []).length;
      neededFeed += count * item.feedCost;
    });

    let medicineStock = p.medicine || 0;
    let pesticideStock = p.pesticide || 0;
    let fertilizerStock = p.fertilizer || 0;

    if (p.feedBags >= neededFeed) {
      p.feedBags -= neededFeed;
      
      ASSET_CATALOG.forEach(item => {
        const count = (p.inventory[item.id] || []).length;
        if (count > 0) {
          const baseYield = item.yieldPerAnimal || 1;
          const totalProduced = Math.max(1, Math.round(count * baseYield * produceYieldMult));
          p.produce[item.produce] = (p.produce[item.produce] || 0) + totalProduced;
        }
      });
    } else {
      p.feedBags = 0;
      ASSET_CATALOG.forEach(item => {
        const list = p.inventory[item.id] || [];
        const lost = Math.ceil(list.length * 0.5);
        starvationLosses += lost;
        for (let i = 0; i < lost; i++) list.pop();
      });
    }

    if (isFlu && currentEvent.deathRisk > 0) {
      ASSET_CATALOG.forEach(item => {
        const list = p.inventory[item.id] || [];
        const surviving = [];
        list.forEach(animal => {
          if (medicineStock > 0) {
            medicineStock--;
            surviving.push(animal);
          } else if (Math.random() > currentEvent.deathRisk) {
            surviving.push(animal);
          } else {
            deathsFromFlu++;
          }
        });
        p.inventory[item.id] = surviving;
      });
      p.medicine = medicineStock;
    }

    // --- Plant Growth, Fertilizer, Worms & Auto-Harvest ---
    const survivingPlots = [];
    (p.plots || []).forEach(plot => {
      const cropDef = PLANT_CATALOG.find(c => c.id === plot.cropId);
      if (!cropDef) return;

      // Worm Check: If worm infestation is active, 1 pesticide defends 1 plot
      if (isWorms) {
        if (pesticideStock > 0) {
          pesticideStock--;
        } else {
          // Unprotected plot eaten by worms
          wormCropLosses++;
          return;
        }
      }

      // Fertilizer & Growth
      if (fertilizerStock >= cropDef.fertilizerCost) {
        fertilizerStock -= cropDef.fertilizerCost;
        plot.growthProgress += 1;
      }

      // Auto Harvest check
      if (plot.growthProgress >= cropDef.growthDays) {
        const yieldQty = Math.max(1, Math.round(cropDef.yieldPerHarvest * produceYieldMult));
        p.produce[cropDef.produce] = (p.produce[cropDef.produce] || 0) + yieldQty;
        harvestedCount += yieldQty;
      } else {
        survivingPlots.push(plot);
      }
    });

    p.fertilizer = fertilizerStock;
    p.pesticide = pesticideStock;
    p.plots = survivingPlots;

    p.lastReport = {
      round: room.round,
      fluDeaths: deathsFromFlu,
      starved: starvationLosses,
      wormLosses: wormCropLosses,
      harvested: harvestedCount
    };

    p.ready = false;

    if (checkWinCondition(room, p)) {
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
      return;
    }
  }

  if (room.event) {
    room.event.remainingDays--;
    if (room.event.remainingDays <= 0) {
      room.event = null;
      room.currentCooldown = Number(room.eventCooldownSetting ?? 2);
    }
  } else {
    room.event = pickRandomEvent(room);
  }

  room.feedPrice = BASE_FEED_PRICE * (room.event?.feedPriceMult || 1.0);
  room.fertilizerPrice = BASE_FERTILIZER_PRICE * (room.event?.feedPriceMult || 1.0);
  room.round++;
  room.market = randomizeMarket(room.market, room.event);

  startRoomTimer(room, io);
  io.to(room.roomId).emit('room_update', sanitizeRoom(room));
}

function sanitizeRoom(room) {
  const safePlayers = {};
  for (const id in room.players) {
    const p = room.players[id];
    safePlayers[id] = {
      id: p.id,
      name: p.name,
      cash: p.cash,
      feedBags: p.feedBags,
      fertilizer: p.fertilizer || 0,
      pesticide: p.pesticide || 0,
      medicine: p.medicine || 0,
      maxPlots: p.maxPlots || DEFAULT_MAX_PLANT_SLOTS,
      plots: p.plots || [],
      inventory: p.inventory,
      produce: p.produce,
      totalProduceSold: p.totalProduceSold || 0,
      ready: p.ready,
      connected: p.connected,
      lastReport: p.lastReport
    };
  }

  return {
    roomId: room.roomId,
    hostId: room.hostId,
    started: room.started,
    round: room.round,
    baseMoney: room.baseMoney,
    targetCash: room.targetCash,
    targetAnimalCount: room.targetAnimalCount ?? 10,
    targetProduceSold: room.targetProduceSold ?? 20,
    dayDuration: Number(room.dayDuration) || 60,
    eventCooldownSetting: room.eventCooldownSetting ?? 2,
    currentCooldown: room.currentCooldown || 0,
    timeLeft: typeof room.timeLeft === 'number' ? room.timeLeft : (Number(room.dayDuration) || 60),
    winner: room.winner || null,
    event: room.event,
    feedPrice: room.feedPrice || BASE_FEED_PRICE,
    fertilizerPrice: room.fertilizerPrice || BASE_FERTILIZER_PRICE,
    market: room.market,
    players: safePlayers
  };
}

module.exports = {
  rooms,
  disconnectTimers,
  roomTickers,
  checkWinCondition,
  clearPlayerTimer,
  startRoomTimer,
  stopRoomTimer,
  removePlayerFromRoom,
  advanceDay,
  sanitizeRoom
};