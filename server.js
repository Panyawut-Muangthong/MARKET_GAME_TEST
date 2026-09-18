const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const ASSET_CATALOG = [
  { id: 'chicken', name: 'Poultry Flock 🐔', basePrice: 100, feedCost: 1, produce: 'egg', produceName: 'Eggs 🥚', produceBasePrice: 15, yieldPerAnimal: 1, minPrice: 40, maxPrice: 200, prodMin: 6, prodMax: 35 },
  { id: 'apiary', name: 'Bee Hive 🐝', basePrice: 180, feedCost: 2, produce: 'honey', produceName: 'Raw Honey 🍯', produceBasePrice: 32, yieldPerAnimal: 1, minPrice: 80, maxPrice: 360, prodMin: 12, prodMax: 75 },
  { id: 'pig', name: 'Truffle Pig 🐷', basePrice: 250, feedCost: 2, produce: 'truffle', produceName: 'Truffles 🍄', produceBasePrice: 45, yieldPerAnimal: 1, minPrice: 110, maxPrice: 500, prodMin: 18, prodMax: 110 },
  { id: 'sheep', name: 'Angora Sheep 🐑', basePrice: 380, feedCost: 3, produce: 'wool', produceName: 'Fine Wool 🧶', produceBasePrice: 70, yieldPerAnimal: 1, minPrice: 160, maxPrice: 750, prodMin: 28, prodMax: 160 },
  { id: 'dairy_cow', name: 'Dairy Cow 🐮', basePrice: 500, feedCost: 4, produce: 'milk', produceName: 'Fresh Milk 🥛', produceBasePrice: 95, yieldPerAnimal: 1, minPrice: 220, maxPrice: 1000, prodMin: 40, prodMax: 220 },
  { id: 'golden_goose', name: 'Golden Goose 🪿', basePrice: 750, feedCost: 6, produce: 'golden_egg', produceName: 'Golden Egg ✨', produceBasePrice: 160, yieldPerAnimal: 1, minPrice: 300, maxPrice: 1600, prodMin: 65, prodMax: 400 },
  { id: 'thoroughbred', name: 'Race Horse 🐴', basePrice: 1000, feedCost: 8, produce: 'trophy', produceName: 'Trophies 🏆', produceBasePrice: 220, yieldPerAnimal: 1, minPrice: 450, maxPrice: 2200, prodMin: 90, prodMax: 550 }
];

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
    titleEn: '🦠 Severe Farm Flu Epidemic!',
    titleTh: '🦠 การระบาดของไข้หวัดสัตว์รุนแรง!',
    descEn: 'Produce yield drops by 50%! Animals without medicine may die overnight!',
    descTh: 'ผลผลิตลดลง 50%! สัตว์ที่ไม่ได้รับยาอาจล้มตายข้ามคืน!',
    duration: 2,
    produceMult: 0.5,
    feedPriceMult: 1.0,
    deathRisk: 0.35
  },
  {
    id: 'bumper_harvest',
    titleEn: '🌻 Golden Sunshine Festival!',
    titleTh: '🌻 เทศกาลแดดทอง ผลผลิตเบ่งบาน!',
    descEn: 'Healthy animals produce double yields today!',
    descTh: 'สัตว์ที่แข็งแรงและได้รับอาหารจะให้ผลผลิตเป็น 2 เท่าในวันนี้!',
    duration: 1,
    produceMult: 2.0,
    feedPriceMult: 1.0,
    deathRisk: 0
  },
  {
    id: 'feed_shortage',
    titleEn: '🌾 Global Feed Logistics Crisis!',
    titleTh: '🌾 วิกฤตการณ์ขาดแคลนอาหารสัตว์!',
    descEn: 'Feed prices have surged to $25 per bag due to drought and supply disruption!',
    descTh: 'ราคาอาหารสัตว์พุ่งขึ้นเป็นถุงละ $25 เนื่องจากวิกฤตภัยแล้งและการขนส่ง!',
    duration: 2,
    produceMult: 1.0,
    feedPriceMult: 2.5,
    deathRisk: 0
  },
  {
    id: 'gourmet_boom',
    titleEn: '🍾 Gourmet Restaurant Boom!',
    titleTh: '🍾 กระแสภัตตาคารหรูระดับโลก!',
    descEn: 'High-end delicacies in demand! Produce sells for +60% on the market!',
    descTh: 'ความต้องการวัตถุดิบพรีเมียมล้นหลาม! ขายผลผลิตในตลาดได้ราคาสูงขึ้น +60%!',
    duration: 2,
    produceMult: 1.0,
    feedPriceMult: 1.0,
    marketProduceMult: 1.6,
    deathRisk: 0
  }
];

const BASE_FEED_PRICE = 10;
const MEDICINE_PRICE = 35;
const DISCONNECT_GRACE_PERIOD = 60000;
const rooms = {};

const disconnectTimers = new Map();
const roomTickers = new Map();

function calculateBouncingPrice(currentVal, baseVal, minVal, maxVal, multiplier = 1.0) {
  const previous = currentVal || baseVal;
  const meanReversion = (baseVal - previous) * 0.15;
  const swing = 1 + (Math.random() * 0.8 - 0.35);
  let next = Math.round((previous * swing + meanReversion) * multiplier);
  next = Math.max(minVal, Math.min(maxVal * 2, next));

  const pctChange = Math.round(((next - previous) / previous) * 100);
  return { price: next, pctChange };
}

function randomizeMarket(prevMarket = null, activeEvent = null) {
  const animal = {};
  const produce = {};
  const deltas = { animal: {}, produce: {} };
  const produceMult = activeEvent?.marketProduceMult || 1.0;

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

  return { animal, produce, deltas };
}

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

  // If room is provided, respect cooldown strictly
  if (room) {
    if (room.currentCooldown > -1) {
      room.currentCooldown--;
      return null; // Enforce calm day
    }
  }

  // 35% chance when off cooldown
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

function checkWinCondition(room, player) {
  if (!room.winner && player.cash >= room.targetCash) {
    room.winner = player.name;
    stopRoomTimer(room.roomId);
  }
}

function clearPlayerTimer(playerId) {
  if (disconnectTimers.has(playerId)) {
    clearTimeout(disconnectTimers.get(playerId));
    disconnectTimers.delete(playerId);
  }
}

function startRoomTimer(room) {
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
      advanceDay(room);
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

function removePlayerFromRoom(room, playerId) {
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
        advanceDay(room);
        return;
      }
    }

    io.to(room.roomId).emit('room_update', sanitizeRoom(room));
  }
}

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, playerName, playerId }) => {
    roomId = (roomId || '').trim().toUpperCase();
    if (!roomId) return;

    const pId = playerId || 'p_' + Math.random().toString(36).substring(2, 9);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerId = pId;

    if (!rooms[roomId]) {
      rooms[roomId] = {
        roomId,
        hostId: pId,
        started: false,
        round: 1,
        baseMoney: 1000,
        targetCash: 5000,
        dayDuration: 60,
        eventCooldownSetting: 2,
        currentCooldown: 0,
        timeLeft: 60,
        event: null,
        feedPrice: BASE_FEED_PRICE,
        market: randomizeMarket(),
        players: {}
      };
    }

    const room = rooms[roomId];

    if (room.players[pId]) {
      const existing = room.players[pId];
      existing.socketId = socket.id;
      existing.connected = true;
      clearPlayerTimer(pId);
      if (playerName) existing.name = playerName;

      ASSET_CATALOG.forEach(a => {
        if (!existing.inventory[a.id]) existing.inventory[a.id] = [];
        if (typeof existing.produce[a.produce] !== 'number') existing.produce[a.produce] = 0;
      });
    } else {
      if (room.started) {
        socket.emit('error_msg', 'Game is already running.');
        return;
      }

      const emptyInventory = {};
      const emptyProduce = {};

      ASSET_CATALOG.forEach(a => {
        emptyInventory[a.id] = [];
        emptyProduce[a.produce] = 0;
      });

      room.players[pId] = {
        id: pId,
        socketId: socket.id,
        name: playerName || `Player ${Object.keys(room.players).length + 1}`,
        cash: room.baseMoney,
        feedBags: 15,
        medicine: 0,
        inventory: emptyInventory,
        produce: emptyProduce,
        ready: false,
        connected: true,
        lastReport: null
      };
    }

    socket.emit('session_created', { playerId: pId, roomId });
    io.to(roomId).emit('room_update', sanitizeRoom(room));
  });

  socket.on('update_room_settings', ({ baseMoney, targetCash, dayDuration, eventCooldown }) => {
    const room = rooms[socket.roomId];
    if (!room || room.hostId !== socket.playerId || room.started) return;

    const base = Math.max(100, Number(baseMoney) || 1000);
    const goal = Math.max(base + 100, Number(targetCash) || 5000);
    const duration = Math.min(600, Math.max(10, Number(dayDuration) || 60));
    const cd = Math.max(0, Math.min(10, Number(eventCooldown) ?? 2));

    room.baseMoney = base;
    room.targetCash = goal;
    room.dayDuration = duration;
    room.timeLeft = duration;
    room.eventCooldownSetting = cd;

    Object.values(room.players).forEach(p => {
      p.cash = base;
    });

    io.to(room.roomId).emit('room_update', sanitizeRoom(room));
  });

  socket.on('start_game', () => {
    const room = rooms[socket.roomId];
    if (!room || room.hostId !== socket.playerId) return;
    if (Object.keys(room.players).length < 1) {
      socket.emit('error_msg', 'Need at least 1 player to start.');
      return;
    }

    room.event = pickRandomEvent(room, true);
    room.feedPrice = BASE_FEED_PRICE * (room.event?.feedPriceMult || 1.0);
    room.market = randomizeMarket(null, room.event);

    room.started = true;
    room.timeLeft = Number(room.dayDuration) || 60;
    
    startRoomTimer(room);
    io.to(room.roomId).emit('room_update', sanitizeRoom(room));
  });

  socket.on('buy_feed', ({ count }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started || room.winner) return;
    const player = room.players[socket.playerId];
    if (!player || player.ready) return;

    const qty = Math.max(1, count || 1);
    const currentFeedPrice = room.feedPrice || BASE_FEED_PRICE;
    const cost = qty * currentFeedPrice;
    if (player.cash >= cost) {
      player.cash -= cost;
      player.feedBags += qty;
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  socket.on('buy_medicine', ({ count }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started || room.winner) return;
    const player = room.players[socket.playerId];
    if (!player || player.ready) return;

    const qty = Math.max(1, count || 1);
    const cost = qty * MEDICINE_PRICE;
    if (player.cash >= cost) {
      player.cash -= cost;
      player.medicine = (player.medicine || 0) + qty;
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  socket.on('buy_animal', ({ itemId, count }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started || room.winner) return;
    const player = room.players[socket.playerId];
    if (!player || player.ready) return;

    const asset = ASSET_CATALOG.find(a => a.id === itemId);
    if (!asset) return;

    const price = room.market?.animal?.[itemId] || asset.basePrice;
    const qty = Math.max(1, count || 1);
    const totalCost = price * qty;

    if (player.cash >= totalCost) {
      player.cash -= totalCost;
      if (!player.inventory[itemId]) player.inventory[itemId] = [];

      const currentRound = Number(room.round);
      for (let i = 0; i < qty; i++) {
        player.inventory[itemId].push({
          boughtAt: price,
          boughtRound: currentRound
        });
      }
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  socket.on('sell_animal', ({ itemId, count }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started || room.winner) return;
    const player = room.players[socket.playerId];
    if (!player || player.ready) return;

    const asset = ASSET_CATALOG.find(a => a.id === itemId);
    if (!asset) return;

    const units = player.inventory[itemId] || [];
    const qty = Math.min(units.length, Math.max(1, count || 1));

    if (qty > 0) {
      const currentPrice = room.market?.animal?.[itemId] || asset.basePrice;
      for (let i = 0; i < qty; i++) {
        units.pop();
      }
      player.cash += qty * currentPrice;
      checkWinCondition(room, player);
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  socket.on('sell_produce', ({ produceId, count }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started || room.winner) return;
    const player = room.players[socket.playerId];
    if (!player || player.ready) return;

    const asset = ASSET_CATALOG.find(a => a.produce === produceId);
    if (!asset) return;

    const available = player.produce[produceId] || 0;
    const qty = Math.min(available, Math.max(1, count || 1));

    if (qty > 0) {
      const unitPrice = room.market?.produce?.[produceId] || asset.produceBasePrice;
      player.produce[produceId] -= qty;
      player.cash += qty * unitPrice;
      checkWinCondition(room, player);
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  socket.on('toggle_ready', () => {
    const room = rooms[socket.roomId];
    if (!room || !room.started || room.winner) return;
    const player = room.players[socket.playerId];
    if (!player) return;

    player.ready = true;
    const activePlayers = Object.values(room.players).filter(p => p.connected);
    const allReady = activePlayers.length > 0 && activePlayers.every(p => p.ready);

    if (allReady) {
      advanceDay(room);
    } else {
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  socket.on('leave_room', () => {
    const room = rooms[socket.roomId];
    if (!room || !socket.playerId) return;
    socket.leave(room.roomId);
    removePlayerFromRoom(room, socket.playerId);
    socket.roomId = null;
    socket.playerId = null;
    socket.emit('left_room_success');
  });

  socket.on('disconnect', () => {
    const room = rooms[socket.roomId];
    if (!room || !socket.playerId) return;

    const player = room.players[socket.playerId];
    if (!player || player.socketId !== socket.id) return;

    player.connected = false;

    clearPlayerTimer(socket.playerId);
    const timer = setTimeout(() => {
      removePlayerFromRoom(room, socket.playerId);
    }, DISCONNECT_GRACE_PERIOD);

    disconnectTimers.set(socket.playerId, timer);
    io.to(room.roomId).emit('room_update', sanitizeRoom(room));
  });
});

function advanceDay(room) {
  const currentEvent = room.event;
  const isFlu = currentEvent?.id === 'flu_epidemic';
  const produceYieldMult = currentEvent?.produceMult !== undefined ? currentEvent.produceMult : 1.0;

  for (const pid in room.players) {
    const p = room.players[pid];
    let deathsFromFlu = 0;
    let starvationLosses = 0;

    let neededFeed = 0;
    ASSET_CATALOG.forEach(item => {
      const count = (p.inventory[item.id] || []).length;
      neededFeed += count * item.feedCost;
    });

    let medicineStock = p.medicine || 0;

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

    p.lastReport = {
      round: room.round,
      fluDeaths: deathsFromFlu,
      starved: starvationLosses
    };

    p.ready = false;
  }

  if (room.event) {
    room.event.remainingDays--;
    if (room.event.remainingDays <= 0) {
      room.event = null;
      // Start cooldown: +1 buffer so the player gets the exact number of full peaceful days
      room.currentCooldown = Number(room.eventCooldownSetting ?? 2);
    }
  } else {
    // Only try to trigger a new event if there wasn't an event expiring this turn
    room.event = pickRandomEvent(room);
  }
  
  // ----------------------------------------

  room.feedPrice = BASE_FEED_PRICE * (room.event?.feedPriceMult || 1.0);

  room.round++;
  room.market = randomizeMarket(room.market, room.event);

  startRoomTimer(room);
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
      medicine: p.medicine || 0,
      inventory: p.inventory,
      produce: p.produce,
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
    dayDuration: Number(room.dayDuration) || 60,
    eventCooldownSetting: room.eventCooldownSetting ?? 2,
    currentCooldown: room.currentCooldown || 0,
    timeLeft: typeof room.timeLeft === 'number' ? room.timeLeft : (Number(room.dayDuration) || 60),
    winner: room.winner || null,
    event: room.event,
    feedPrice: room.feedPrice || BASE_FEED_PRICE,
    market: room.market,
    players: safePlayers
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Game server active on port ${PORT}`));