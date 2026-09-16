const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const ASSET_CATALOG = [
  { id: 'chicken', name: 'Poultry Flock 🐔', basePrice: 100, feedCost: 1, produce: 'egg', produceName: 'Eggs 🥚', produceBasePrice: 15 },
  { id: 'pig', name: 'Truffle Pig 🐷', basePrice: 250, feedCost: 2, produce: 'truffle', produceName: 'Truffles 🍄', produceBasePrice: 45 },
  { id: 'dairy_cow', name: 'Dairy Cow 🐮', basePrice: 500, feedCost: 4, produce: 'milk', produceName: 'Milk 🥛', produceBasePrice: 95 },
  { id: 'thoroughbred', name: 'Race Horse 🐴', basePrice: 1000, feedCost: 8, produce: 'trophy', produceName: 'Trophies 🏆', produceBasePrice: 220 }
];

const FEED_BAG_PRICE = 10;

const QUEST_POOL = [
  { id: 'q_chickens_10', title: 'Flock Master', desc: 'Own at least 10 Chickens', type: 'OWN_ANIMAL', target: 'chicken', amount: 10, rewardVP: 25, rewardCash: 300 },
  { id: 'q_eggs_20', title: 'Egg Cartel', desc: 'Deliver 20 Eggs', type: 'DELIVER_PRODUCE', target: 'egg', amount: 20, rewardVP: 20, rewardCash: 400 },
  { id: 'q_pigs_4', title: 'Truffle Hunter', desc: 'Own at least 4 Truffle Pigs', type: 'OWN_ANIMAL', target: 'pig', amount: 4, rewardVP: 30, rewardCash: 500 },
  { id: 'q_truffles_10', title: 'Gourmet Feast', desc: 'Deliver 10 Truffles', type: 'DELIVER_PRODUCE', target: 'truffle', amount: 10, rewardVP: 35, rewardCash: 600 },
  { id: 'q_cows_3', title: 'Dairy Giant', desc: 'Own at least 3 Dairy Cows', type: 'OWN_ANIMAL', target: 'dairy_cow', amount: 3, rewardVP: 35, rewardCash: 700 }, // <-- Make sure this is 'dairy_cow'
  { id: 'q_milk_10', title: 'Milk Pipeline', desc: 'Deliver 10 Jugs of Milk', type: 'DELIVER_PRODUCE', target: 'milk', amount: 10, rewardVP: 40, rewardCash: 800 },
  { id: 'q_horse_2', title: 'Stable Baron', desc: 'Own at least 2 Race Horses', type: 'OWN_ANIMAL', target: 'thoroughbred', amount: 2, rewardVP: 45, rewardCash: 1000 },
  { id: 'q_trophies_5', title: 'Triple Crown', desc: 'Deliver 5 Trophies', type: 'DELIVER_PRODUCE', target: 'trophy', amount: 5, rewardVP: 50, rewardCash: 1200 }
];

const rooms = {};

function randomizeMarket() {
  const animal = {};
  const produce = {};
  ASSET_CATALOG.forEach(item => {
    const swingA = 0.75 + Math.random() * 0.65;
    const swingP = 0.70 + Math.random() * 0.75;
    animal[item.id] = Math.round(item.basePrice * swingA);
    produce[item.produce] = Math.round(item.produceBasePrice * swingP);
  });
  return { animal, produce };
}

function getRandomQuests(count = 4) {
  return [...QUEST_POOL].sort(() => 0.5 - Math.random()).slice(0, count);
}

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, playerName }) => {
    roomId = (roomId || '').trim().toUpperCase();
    if (!roomId) return;

    socket.join(roomId);
    socket.roomId = roomId;

    if (!rooms[roomId]) {
      rooms[roomId] = {
        roomId,
        hostId: socket.id,
        started: false,
        round: 1,
        targetVP: 100,
        market: randomizeMarket(),
        quests: getRandomQuests(4),
        players: {},
        logs: [`Room ${roomId} created.`]
      };
    }

    const room = rooms[roomId];
    if (room.started) {
      socket.emit('error_msg', 'Game is already running.');
      return;
    }

    room.players[socket.id] = {
      id: socket.id,
      name: playerName || `Player ${Object.keys(room.players).length + 1}`,
      cash: 1000,
      points: 0,
      feedBags: 15,
      inventory: { chicken: [], pig: [], dairy_cow: [], thoroughbred: [] },
      produce: { egg: 0, truffle: 0, milk: 0, trophy: 0 },
      completedQuests: [],
      ready: false
    };

    io.to(roomId).emit('room_update', sanitizeRoom(room));
  });

  socket.on('start_game', () => {
    const room = rooms[socket.roomId];
    if (!room || room.hostId !== socket.id) return;
    if (Object.keys(room.players).length < 2) {
      socket.emit('error_msg', 'Need at least 2 players to start.');
      return;
    }
    room.started = true;
    room.logs.unshift('Game started! Buy feed bags, breed livestock, and fulfill quests!');
    io.to(room.roomId).emit('room_update', sanitizeRoom(room));
  });

  // BUY FEED
  socket.on('buy_feed', ({ count }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started) return;
    const player = room.players[socket.id];
    if (!player || player.ready) return;

    const qty = Math.max(1, count || 1);
    const cost = qty * FEED_BAG_PRICE;
    if (player.cash >= cost) {
      player.cash -= cost;
      player.feedBags += qty;
      room.logs.unshift(`${player.name} bought ${qty}x Feed Bags for $${cost}.`);
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  // BUY ANIMALS
  socket.on('buy_animal', ({ itemId, count }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started) return;
    const player = room.players[socket.id];
    if (!player || player.ready) return;

    const marketAnimal = room.market?.animal || {};
    const price = marketAnimal[itemId] || 100;
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
      room.logs.unshift(`${player.name} bought ${qty}x ${itemId} for $${totalCost}.`);
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  // SELL ANIMALS
  socket.on('sell_animal', ({ itemId, count }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started) return;
    const player = room.players[socket.id];
    if (!player || player.ready) return;

    const units = player.inventory[itemId] || [];
    const qty = Math.min(units.length, Math.max(1, count || 1));

    if (qty > 0) {
      const currentPrice = room.market.animal[itemId] || 100;
      let totalBoughtAt = 0;
      for (let i = 0; i < qty; i++) {
        const sold = units.pop();
        totalBoughtAt += sold.boughtAt;
      }
      const totalRevenue = qty * currentPrice;
      const profit = totalRevenue - totalBoughtAt;
      player.cash += totalRevenue;
      room.logs.unshift(`${player.name} sold ${qty}x ${itemId} for $${totalRevenue} (P/L: ${profit >= 0 ? '+' : ''}$${profit}).`);
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  // SELL PRODUCE
  socket.on('sell_produce', ({ produceId, count }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started) return;
    const player = room.players[socket.id];
    if (!player || player.ready) return;

    const available = player.produce[produceId] || 0;
    const qty = Math.min(available, Math.max(1, count || 1));

    if (qty > 0) {
      const unitPrice = room.market.produce[produceId] || 15;
      const revenue = qty * unitPrice;
      player.produce[produceId] -= qty;
      player.cash += revenue;
      room.logs.unshift(`${player.name} sold ${qty}x ${produceId} for $${revenue}.`);
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  // COMPLETE QUEST (Strict Check)
  socket.on('claim_quest', ({ questId }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started) return;
    const player = room.players[socket.id];
    if (!player || player.ready) return;

    const quest = room.quests.find(q => q.id === questId);
    if (!quest || player.completedQuests.includes(questId)) return;

    const currentRound = Number(room.round);

    if (quest.type === 'OWN_ANIMAL') {
      const targetKey = quest.targetId || quest.target;
      const allAnimals = player.inventory[targetKey] || [];
      
      // Animals bought strictly before the current day count as settled
      const settledAnimals = allAnimals.filter(a => {
        const roundBought = typeof a.boughtRound === 'number' ? a.boughtRound : 1;
        return roundBought < currentRound;
      });

      if (settledAnimals.length < quest.amount) {
        socket.emit('error_msg', `Cannot claim yet! You have ${settledAnimals.length}/${quest.amount} settled animals. Newly bought animals must survive overnight!`);
        return;
      }
    } else if (quest.type === 'DELIVER_PRODUCE') {
      const have = player.produce[quest.target] || 0;
      if (have < quest.amount) {
        socket.emit('error_msg', `Need ${quest.amount}x ${quest.target}! You have ${have}.`);
        return;
      }
      player.produce[quest.target] -= quest.amount;
    }

    player.completedQuests.push(questId);
    player.points += quest.rewardVP;
    player.cash += quest.rewardCash;
    room.logs.unshift(`🎯 ${player.name} completed "${quest.title}"! (+${quest.rewardVP} VP, +$${quest.rewardCash})`);

    if (player.points >= room.targetVP) {
      room.winner = player.name;
    }

    io.to(room.roomId).emit('room_update', sanitizeRoom(room));
  });

  // READY / END DAY
  socket.on('toggle_ready', () => {
    const room = rooms[socket.roomId];
    if (!room || !room.started) return;
    const player = room.players[socket.id];
    if (!player) return;

    player.ready = true;
    const allReady = Object.values(room.players).every(p => p.ready);
    if (allReady) {
      advanceDay(room);
    } else {
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });

  socket.on('disconnect', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    delete room.players[socket.id];
    if (Object.keys(room.players).length === 0) {
      delete rooms[socket.roomId];
    } else {
      if (room.hostId === socket.id) room.hostId = Object.keys(room.players)[0];
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    }
  });
});

function advanceDay(room) {
  room.logs.unshift(`=== DAY ${room.round} ENDS: FEEDING & PRODUCTION ===`);

  for (const pid in room.players) {
    const p = room.players[pid];

    let neededFeed = 0;
    ASSET_CATALOG.forEach(item => {
      neededFeed += (p.inventory[item.id] || []).length * item.feedCost;
    });

    if (p.feedBags >= neededFeed) {
      p.feedBags -= neededFeed;
      room.logs.unshift(`${p.name} fed livestock using ${neededFeed} food bags.`);

      ASSET_CATALOG.forEach(item => {
        const count = (p.inventory[item.id] || []).length;
        if (count > 0) {
          p.produce[item.produce] = (p.produce[item.produce] || 0) + count;
          room.logs.unshift(`${p.name}'s animals produced +${count}x ${item.produceName}!`);
        }
      });
    } else {
      room.logs.unshift(`⚠️ ${p.name} had insufficient feed (${p.feedBags}/${neededFeed})! Livestock starved!`);
      p.feedBags = 0;

      ASSET_CATALOG.forEach(item => {
        const list = p.inventory[item.id] || [];
        const lost = Math.ceil(list.length * 0.5);
        for (let i = 0; i < lost; i++) list.pop();
        if (lost > 0) {
          room.logs.unshift(`${p.name} lost ${lost}x ${item.name} to hunger!`);
        }
      });
    }

    p.ready = false;
  }

  room.round++;
  room.market = randomizeMarket();

  if (room.round % 3 === 0) {
    room.quests = getRandomQuests(4);
    room.logs.unshift(`📜 The Agriculture Bureau posted new Quests!`);
  }

  room.logs.unshift(`☀️ Day ${room.round} begins!`);
  io.to(room.roomId).emit('room_update', sanitizeRoom(room));
}

function sanitizeRoom(room) {
  return {
    roomId: room.roomId,
    hostId: room.hostId,
    started: room.started,
    round: room.round,
    targetVP: room.targetVP,
    winner: room.winner || null,
    market: room.market,
    quests: room.quests,
    players: room.players,
    logs: room.logs
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));