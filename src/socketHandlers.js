const { ASSET_CATALOG, BASE_FEED_PRICE, MEDICINE_PRICE, DISCONNECT_GRACE_PERIOD } = require('../constants/assets');
const { PLANT_CATALOG, BASE_FERTILIZER_PRICE, PESTICIDE_PRICE, DEFAULT_MAX_PLANT_SLOTS } = require('../constants/plants');
const { pickRandomEvent } = require('../constants/events');
const { randomizeMarket } = require('./market');
const {
  rooms,
  disconnectTimers,
  checkWinCondition,
  clearPlayerTimer,
  startRoomTimer,
  removePlayerFromRoom,
  advanceDay,
  sanitizeRoom
} = require('./roomManager');

function registerSocketHandlers(io) {
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
          targetAnimalCount: 10,
          targetProduceSold: 20,
          dayDuration: 60,
          eventCooldownSetting: 2,
          currentCooldown: 0,
          timeLeft: 60,
          event: null,
          feedPrice: BASE_FEED_PRICE,
          fertilizerPrice: BASE_FERTILIZER_PRICE,
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
        PLANT_CATALOG.forEach(p => {
          if (typeof existing.produce[p.produce] !== 'number') existing.produce[p.produce] = 0;
        });
        if (!existing.plots) existing.plots = [];
        if (typeof existing.fertilizer !== 'number') existing.fertilizer = 5;
        if (typeof existing.pesticide !== 'number') existing.pesticide = 0;
        if (typeof existing.totalProduceSold !== 'number') existing.totalProduceSold = 0;
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
        PLANT_CATALOG.forEach(p => {
          emptyProduce[p.produce] = 0;
        });

        room.players[pId] = {
          id: pId,
          socketId: socket.id,
          name: playerName || `Player ${Object.keys(room.players).length + 1}`,
          cash: room.baseMoney,
          feedBags: 15,
          fertilizer: 6,
          pesticide: 0,
          medicine: 0,
          maxPlots: DEFAULT_MAX_PLANT_SLOTS,
          plots: [],
          inventory: emptyInventory,
          produce: emptyProduce,
          totalProduceSold: 0,
          ready: false,
          connected: true,
          lastReport: null
        };
      }

      socket.emit('session_created', { playerId: pId, roomId });
      io.to(roomId).emit('room_update', sanitizeRoom(room));
    });

    socket.on('update_room_settings', ({ baseMoney, targetCash, targetAnimalCount, targetProduceSold, dayDuration, eventCooldown }) => {
      const room = rooms[socket.roomId];
      if (!room || room.hostId !== socket.playerId || room.started) return;

      const base = Math.max(100, parseInt(baseMoney, 10) || 1000);
      const goal = Math.max(base + 100, parseInt(targetCash, 10) || 5000);
      const targetAnimals = Math.max(1, parseInt(targetAnimalCount, 10) || 10);
      const targetProd = Math.max(1, parseInt(targetProduceSold, 10) || 20);
      const duration = Math.min(600, Math.max(10, parseInt(dayDuration, 10) || 60));
      const cd = Math.max(0, Math.min(10, parseInt(eventCooldown, 10) ?? 2));

      room.baseMoney = base;
      room.targetCash = goal;
      room.targetAnimalCount = targetAnimals;
      room.targetProduceSold = targetProd;
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
      room.fertilizerPrice = BASE_FERTILIZER_PRICE * (room.event?.feedPriceMult || 1.0);
      room.market = randomizeMarket(null, room.event);

      room.started = true;
      room.timeLeft = Number(room.dayDuration) || 60;

      startRoomTimer(room, io);
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

    socket.on('buy_fertilizer', ({ count }) => {
      const room = rooms[socket.roomId];
      if (!room || !room.started || room.winner) return;
      const player = room.players[socket.playerId];
      if (!player || player.ready) return;

      const qty = Math.max(1, count || 1);
      const currentFertPrice = room.fertilizerPrice || BASE_FERTILIZER_PRICE;
      const cost = qty * currentFertPrice;
      if (player.cash >= cost) {
        player.cash -= cost;
        player.fertilizer = (player.fertilizer || 0) + qty;
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

    socket.on('buy_pesticide', ({ count }) => {
      const room = rooms[socket.roomId];
      if (!room || !room.started || room.winner) return;
      const player = room.players[socket.playerId];
      if (!player || player.ready) return;

      const qty = Math.max(1, count || 1);
      const cost = qty * PESTICIDE_PRICE;
      if (player.cash >= cost) {
        player.cash -= cost;
        player.pesticide = (player.pesticide || 0) + qty;
        io.to(room.roomId).emit('room_update', sanitizeRoom(room));
      }
    });

    socket.on('plant_seed', ({ cropId }) => {
      const room = rooms[socket.roomId];
      if (!room || !room.started || room.winner) return;
      const player = room.players[socket.playerId];
      if (!player || player.ready) return;

      const crop = PLANT_CATALOG.find(c => c.id === cropId);
      if (!crop) return;

      const maxPlots = player.maxPlots || DEFAULT_MAX_PLANT_SLOTS;
      if ((player.plots || []).length >= maxPlots) {
        return socket.emit('error_msg', 'Your crop slots are full!');
      }

      const seedPrice = room.market?.seeds?.[cropId] || crop.seedPrice;
      if (player.cash >= seedPrice) {
        player.cash -= seedPrice;
        player.plots.push({
          cropId: crop.id,
          plantedRound: room.round,
          growthProgress: 0,
          requiredDays: crop.growthDays
        });
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
        checkWinCondition(room, player);
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

      const asset = ASSET_CATALOG.find(a => a.produce === produceId) ||
                    PLANT_CATALOG.find(p => p.produce === produceId);
      if (!asset) return;

      const available = player.produce[produceId] || 0;
      const qty = Math.min(available, Math.max(1, count || 1));

      if (qty > 0) {
        const unitPrice = room.market?.produce?.[produceId] || asset.produceBasePrice;
        player.produce[produceId] -= qty;
        player.cash += qty * unitPrice;
        player.totalProduceSold = (player.totalProduceSold || 0) + qty;
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
        advanceDay(room, io);
      } else {
        io.to(room.roomId).emit('room_update', sanitizeRoom(room));
      }
    });

    socket.on('leave_room', () => {
      const room = rooms[socket.roomId];
      if (!room || !socket.playerId) return;
      socket.leave(room.roomId);
      removePlayerFromRoom(room, socket.playerId, io);
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
        removePlayerFromRoom(room, socket.playerId, io);
      }, DISCONNECT_GRACE_PERIOD);

      disconnectTimers.set(socket.playerId, timer);
      io.to(room.roomId).emit('room_update', sanitizeRoom(room));
    });
  });
}

module.exports = {
  registerSocketHandlers
};