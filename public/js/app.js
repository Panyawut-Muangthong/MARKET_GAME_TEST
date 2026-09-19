const socket = io();

const ASSETS = [
  { id: 'chicken', basePrice: 100, feedCost: 1, produce: 'egg', produceBasePrice: 15 },
  { id: 'apiary', basePrice: 180, feedCost: 2, produce: 'honey', produceBasePrice: 32 },
  { id: 'pig', basePrice: 250, feedCost: 2, produce: 'truffle', produceBasePrice: 45 },
  { id: 'sheep', basePrice: 380, feedCost: 3, produce: 'wool', produceBasePrice: 70 },
  { id: 'dairy_cow', basePrice: 500, feedCost: 4, produce: 'milk', produceBasePrice: 95 },
  { id: 'golden_goose', basePrice: 750, feedCost: 6, produce: 'golden_egg', produceBasePrice: 160 },
  { id: 'thoroughbred', basePrice: 1000, feedCost: 8, produce: 'trophy', produceBasePrice: 220 }
];

const PLANTS = [
  { id: 'wheat_crop', seedPrice: 30, fertilizerCost: 1, growthDays: 1, produce: 'wheat_sheaf', produceBasePrice: 22 },
  { id: 'carrot_crop', seedPrice: 60, fertilizerCost: 1, growthDays: 2, produce: 'carrot_bundle', produceBasePrice: 48 },
  { id: 'strawberry_crop', seedPrice: 120, fertilizerCost: 2, growthDays: 3, produce: 'strawberry_crate', produceBasePrice: 110 }
];

let roomState = null;
let localPlayerId = sessionStorage.getItem('farm_player_id');
let savedRoomId = sessionStorage.getItem('farm_room_id');
let savedPlayerName = sessionStorage.getItem('farm_player_name');

let lastEventKey = null;
let hasReceivedFirstState = false;

let feedOrderCount = 5;
let fertOrderCount = 3;
let pestOrderCount = 1;
let medOrderCount = 1;
let buySteppers = {};
let sellSteppers = {};
const feedbackStates = {};
let lastHandledReportRound = 0;

ASSETS.forEach(a => {
  buySteppers[a.id] = 1;
  sellSteppers[a.id] = 1;
});

function setFeedback(key, text, type = 'bought') {
  feedbackStates[key] = { text, type, until: Date.now() + 900 };
  setTimeout(() => {
    if (feedbackStates[key] && Date.now() >= feedbackStates[key].until) {
      delete feedbackStates[key];
      renderUI();
    }
  }, 920);
  renderUI();
}

function renderDeltaBadge(pct) {
  if (typeof pct !== 'number' || pct === 0) return '';
  if (pct > 0) {
    return `<span class="ticker-up">▲ +${pct}%</span>`;
  }
  return `<span class="ticker-down">▼ ${pct}%</span>`;
}

function joinRoom() {
  ensureAudioUnlocked();
  const name = document.getElementById('join-name').value.trim() || savedPlayerName;
  const room = document.getElementById('join-room').value.trim() || savedRoomId;
  if (!room) return alert(currentLang === 'th' ? "กรุณาใส่รหัสห้อง!" : "Please enter a room code!");

  sessionStorage.setItem('farm_room_id', room);
  if (name) sessionStorage.setItem('farm_player_name', name);

  socket.emit('join_room', {
    roomId: room,
    playerName: name,
    playerId: localPlayerId
  });
}

function leaveRoom() {
  const confirmLeave = confirm(currentLang === 'th' ? "ต้องการออกจากเกมใช่หรือไม่?" : "Are you sure you want to leave the game?");
  if (!confirmLeave) return;

  socket.emit('leave_room');
  sessionStorage.removeItem('farm_room_id');
  resetToLobby();
}

function resetToLobby() {
  roomState = null;
  lastEventKey = null;
  hasReceivedFirstState = false;
  document.getElementById('screen-lobby').style.display = 'block';
  document.getElementById('screen-waiting').style.display = 'none';
  document.getElementById('screen-game').style.display = 'none';
  document.getElementById('mobile-bottom-bar').style.display = 'none';
  document.getElementById('btn-leave').style.display = 'none';
}

function syncSettings() {
  const baseMoney = document.getElementById('input-base-cash').value;
  const targetCash = document.getElementById('input-target-cash').value;
  const targetAnimalCount = document.getElementById('input-target-animals').value;
  const targetProduceSold = document.getElementById('input-target-produce').value;
  const dayDuration = document.getElementById('input-duration').value;
  const eventCooldown = document.getElementById('input-cooldown').value;

  socket.emit('update_room_settings', { 
    baseMoney, 
    targetCash, 
    targetAnimalCount, 
    targetProduceSold, 
    dayDuration, 
    eventCooldown 
  });
}

function startGame() { 
  ensureAudioUnlocked();
  socket.emit('start_game'); 
}

function stepFeed(delta) {
  feedOrderCount = Math.max(1, feedOrderCount + delta);
  document.getElementById('buy-feed-count').innerText = feedOrderCount;
  updateFeedBuyButton();
}

function stepFert(delta) {
  fertOrderCount = Math.max(1, fertOrderCount + delta);
  document.getElementById('buy-fert-count').innerText = fertOrderCount;
  updateFertBuyButton();
}

function stepPest(delta) {
  pestOrderCount = Math.max(1, pestOrderCount + delta);
  document.getElementById('buy-pest-count').innerText = pestOrderCount;
  updatePestBuyButton();
}

function stepMed(delta) {
  medOrderCount = Math.max(1, medOrderCount + delta);
  document.getElementById('buy-med-count').innerText = medOrderCount;
  updateMedBuyButton();
}

function updateFeedBuyButton() {
  const me = roomState?.players[localPlayerId];
  const btn = document.getElementById('ui-buy-feed-btn');
  if (!btn || !me) return;

  const fb = feedbackStates['feed'];
  if (fb && Date.now() < fb.until) {
    btn.innerText = fb.text;
    btn.className = 'btn btn-bought';
    btn.disabled = true;
    return;
  }

  const unitPrice = roomState.feedPrice || 10;
  const cost = feedOrderCount * unitPrice;
  const canAfford = me.cash >= cost;
  const isLocked = me.ready || Boolean(roomState.winner);

  btn.disabled = !canAfford || isLocked;
  btn.className = `btn ${canAfford ? 'btn-success' : 'btn-danger'}`;
  btn.innerText = canAfford ? `${t('buyBtn')} ($${cost})` : `${t('cantBuy')} ($${cost})`;
}

function updateFertBuyButton() {
  const me = roomState?.players[localPlayerId];
  const btn = document.getElementById('ui-buy-fert-btn');
  if (!btn || !me) return;

  const fb = feedbackStates['fert'];
  if (fb && Date.now() < fb.until) {
    btn.innerText = fb.text;
    btn.className = 'btn btn-bought';
    btn.disabled = true;
    return;
  }

  const unitPrice = roomState.fertilizerPrice || 8;
  const cost = fertOrderCount * unitPrice;
  const canAfford = me.cash >= cost;
  const isLocked = me.ready || Boolean(roomState.winner);

  btn.disabled = !canAfford || isLocked;
  btn.className = `btn ${canAfford ? 'btn-success' : 'btn-danger'}`;
  btn.innerText = canAfford ? `${t('buyBtn')} ($${cost})` : `${t('cantBuy')} ($${cost})`;
}

function updatePestBuyButton() {
  const me = roomState?.players[localPlayerId];
  const btn = document.getElementById('ui-buy-pest-btn');
  if (!btn || !me) return;

  const fb = feedbackStates['pest'];
  if (fb && Date.now() < fb.until) {
    btn.innerText = fb.text;
    btn.className = 'btn btn-bought';
    btn.disabled = true;
    return;
  }

  const cost = pestOrderCount * 25;
  const canAfford = me.cash >= cost;
  const isLocked = me.ready || Boolean(roomState.winner);

  btn.disabled = !canAfford || isLocked;
  btn.className = `btn ${canAfford ? 'btn-success' : 'btn-danger'}`;
  btn.innerText = canAfford ? `${t('buyBtn')} ($${cost})` : `${t('cantBuy')} ($${cost})`;
}

function updateMedBuyButton() {
  const me = roomState?.players[localPlayerId];
  const btn = document.getElementById('ui-buy-med-btn');
  if (!btn || !me) return;

  const fb = feedbackStates['med'];
  if (fb && Date.now() < fb.until) {
    btn.innerText = fb.text;
    btn.className = 'btn btn-bought';
    btn.disabled = true;
    return;
  }

  const cost = medOrderCount * 35;
  const canAfford = me.cash >= cost;
  const isLocked = me.ready || Boolean(roomState.winner);

  btn.disabled = !canAfford || isLocked;
  btn.className = `btn ${canAfford ? 'btn-success' : 'btn-danger'}`;
  btn.innerText = canAfford ? `${t('buyBtn')} ($${cost})` : `${t('cantBuy')} ($${cost})`;
}

function buyFeed() {
  setFeedback('feed', t('boughtBtn'), 'bought');
  socket.emit('buy_feed', { count: feedOrderCount });
}

function buyFertilizer() {
  setFeedback('fert', t('boughtBtn'), 'bought');
  socket.emit('buy_fertilizer', { count: fertOrderCount });
}

function buyPesticide() {
  setFeedback('pest', t('boughtBtn'), 'bought');
  socket.emit('buy_pesticide', { count: pestOrderCount });
}

function buyMedicine() {
  setFeedback('med', t('boughtBtn'), 'bought');
  socket.emit('buy_medicine', { count: medOrderCount });
}

function plantSeed(cropId) {
  setFeedback(`plant_${cropId}`, t('plantedBtn'), 'bought');
  socket.emit('plant_seed', { cropId });
}

function stepBuy(id, delta) {
  buySteppers[id] = Math.max(1, (buySteppers[id] || 1) + delta);
  renderUI();
}

function buyAnimal(id) {
  setFeedback(`buy_${id}`, t('boughtBtn'), 'bought');
  const count = buySteppers[id] || 1;
  socket.emit('buy_animal', { itemId: id, count });
}

function stepSell(id, delta) {
  const me = roomState?.players[localPlayerId];
  const maxOwned = (me?.inventory[id] || []).length;
  sellSteppers[id] = Math.min(maxOwned, Math.max(1, (sellSteppers[id] || 1) + delta));
  renderUI();
}

function sellAnimal(id) {
  setFeedback(`sell_animal_${id}`, t('soldBtn'), 'sold');
  const count = sellSteppers[id] || 1;
  socket.emit('sell_animal', { itemId: id, count });
  sellSteppers[id] = 1;
}

function sellProduce(produceId, count = 1) {
  setFeedback(`sell_produce_${produceId}`, t('soldBtn'), 'sold');
  socket.emit('sell_produce', { produceId, count });
}

function toggleReady() {
  socket.emit('toggle_ready');
  const desk = document.getElementById('btn-ready-desktop');
  const mob = document.getElementById('btn-ready-mobile');
  desk.disabled = true;
  desk.innerText = t('endDayBtnWaiting');
  mob.disabled = true;
  mob.innerText = (currentLang === 'th' ? 'รอสักครู่...' : 'Waiting...');
}

function updateTimerDisplay(seconds) {
  const hudTimer = document.getElementById('hud-timer');
  const validSeconds = (typeof seconds === 'number' && !isNaN(seconds))
    ? seconds
    : (roomState?.dayDuration || 60);

  const text = `${validSeconds}s`;

  if (hudTimer) {
    hudTimer.innerText = text;
    hudTimer.style.color = validSeconds <= 10 ? 'var(--danger)' : '#38bdf8';
  }
}

socket.on('session_created', ({ playerId, roomId }) => {
  localPlayerId = playerId;
  sessionStorage.setItem('farm_player_id', playerId);
  sessionStorage.setItem('farm_room_id', roomId);
});

socket.on('timer_tick', ({ timeLeft }) => {
  if (roomState) roomState.timeLeft = timeLeft;
  updateTimerDisplay(timeLeft);
  if (roomState && roomState.started && !roomState.winner) {
    playClockTick(timeLeft);
  }
});

socket.on('left_room_success', () => {
  resetToLobby();
});

socket.on('room_update', (data) => {
  const currentEventKey = data.event 
    ? (data.event.instanceId || (data.event.id + '_r' + data.round)) 
    : null;

  if (data.started && !data.winner && hasReceivedFirstState) {
    const hadEvent = Boolean(lastEventKey);
    const hasEvent = Boolean(currentEventKey);

    if (hasEvent) {
      if (!hadEvent || lastEventKey !== currentEventKey) {
        playEventAlertSound();
      }
    } else if (hadEvent && !hasEvent) {
      playEventOverSound();
    }
  }

  lastEventKey = currentEventKey;
  hasReceivedFirstState = true;
  roomState = data;

  document.getElementById('btn-leave').style.display = 'inline-flex';

  if (data.winner) {
    alert(t('winnerAlert')
      .replace('{name}', data.winner)
      .replace('{target}', data.targetCash)
      .replace('{animals}', data.targetAnimalCount)
      .replace('{sold}', data.targetProduceSold));
  }

  const me = data.players[localPlayerId];
  if (me?.lastReport && me.lastReport.round !== lastHandledReportRound) {
    lastHandledReportRound = me.lastReport.round;
    if (me.lastReport.fluDeaths > 0) {
      alert(t('reportFlu').replace('{count}', me.lastReport.fluDeaths));
    }
    if (me.lastReport.wormLosses > 0) {
      alert(t('reportWorms').replace('{count}', me.lastReport.wormLosses));
    }
  }

  if (!data.started) {
    document.getElementById('screen-lobby').style.display = 'none';
    document.getElementById('screen-waiting').style.display = 'block';
    document.getElementById('screen-game').style.display = 'none';
    document.getElementById('mobile-bottom-bar').style.display = 'none';
    document.getElementById('waiting-room-code').innerText = data.roomId;

    document.getElementById('waiting-player-list').innerHTML = Object.values(data.players).map(p => `
      <div class="player-tag ${p.connected ? 'ready-tag' : 'offline-tag'}">${p.name} ($${p.cash})</div>
    `).join('');

    const isHost = data.hostId === localPlayerId;
    const hostPanel = document.getElementById('host-settings');
    const clientSettings = document.getElementById('client-settings-view');

    if (isHost) {
      hostPanel.style.display = 'block';
      clientSettings.style.display = 'none';
      document.getElementById('btn-start').style.display = 'inline-block';
      document.getElementById('waiting-msg').style.display = 'none';
    } else {
      hostPanel.style.display = 'none';
      clientSettings.style.display = 'block';
      clientSettings.innerText = t('clientGoalSummary')
        .replace('{cash}', data.targetCash)
        .replace('{animals}', data.targetAnimalCount)
        .replace('{produce}', data.targetProduceSold)
        .replace('{duration}', data.dayDuration);
      document.getElementById('btn-start').style.display = 'none';
      document.getElementById('waiting-msg').style.display = 'inline';
    }
  } else {
    document.getElementById('screen-lobby').style.display = 'none';
    document.getElementById('screen-waiting').style.display = 'none';
    document.getElementById('screen-game').style.display = 'block';
    document.getElementById('mobile-bottom-bar').style.display = 'flex';

    if (me && !me.ready && !data.winner) {
      const desk = document.getElementById('btn-ready-desktop');
      const mob = document.getElementById('btn-ready-mobile');
      desk.disabled = false;
      desk.innerText = t('endDayBtn');
      mob.disabled = false;
      mob.innerText = (currentLang === 'th' ? 'จบวัน' : 'End Day');
    }
    renderUI();
  }
});

socket.on('error_msg', (msg) => {
  alert(msg);
});

function renderUI() {
  if (!roomState || !localPlayerId) return;
  const me = roomState.players[localPlayerId];
  if (!me) return;

  const isLocked = me.ready || Boolean(roomState.winner);

  let totalAnimals = 0;
  let neededFeed = 0;
  ASSETS.forEach(item => {
    const count = (me.inventory[item.id] || []).length;
    totalAnimals += count;
    neededFeed += count * item.feedCost;
  });

  let neededFert = 0;
  (me.plots || []).forEach(plot => {
    const cropDef = PLANTS.find(c => c.id === plot.cropId);
    if (cropDef) {
      neededFert += cropDef.fertilizerCost;
    }
  });

  const soldCount = me.totalProduceSold || 0;
  const occupiedPlots = (me.plots || []).length;
  const maxPlots = me.maxPlots || 6;

  document.getElementById('hud-round').innerText = roomState.round;
  
  const hudCash = document.getElementById('hud-cash');
  hudCash.innerText = `$${me.cash} / $${roomState.targetCash}`;
  hudCash.style.color = me.cash >= roomState.targetCash ? 'var(--success)' : '#f87171';

  const hudAnimals = document.getElementById('hud-animals');
  hudAnimals.innerText = `${totalAnimals} / ${roomState.targetAnimalCount}`;
  hudAnimals.style.color = totalAnimals >= roomState.targetAnimalCount ? 'var(--success)' : '#fbbf24';

  const hudProdSold = document.getElementById('hud-prodsold');
  hudProdSold.innerText = `${soldCount} / ${roomState.targetProduceSold}`;
  hudProdSold.style.color = soldCount >= roomState.targetProduceSold ? 'var(--success)' : '#34d399';

  const hudFeed = document.getElementById('hud-feed');
  if (hudFeed) {
    hudFeed.innerText = `${me.feedBags} / ${neededFeed}`;
    hudFeed.style.color = (me.feedBags >= neededFeed) ? 'var(--success)' : 'var(--danger)';
  }

  const hudFert = document.getElementById('hud-fertilizer');
  if (hudFert) {
    hudFert.innerText = `${me.fertilizer || 0} / ${neededFert}`;
    hudFert.style.color = ((me.fertilizer || 0) >= neededFert) ? 'var(--success)' : 'var(--danger)';
  }

  document.getElementById('hud-pesticide').innerText = me.pesticide || 0;
  document.getElementById('hud-plots').innerText = `${occupiedPlots} / ${maxPlots}`;
  document.getElementById('hud-medicine').innerText = me.medicine || 0;
  updateTimerDisplay(typeof roomState.timeLeft === 'number' ? roomState.timeLeft : roomState.dayDuration);

  const eventBox = document.getElementById('event-banner-box');
  if (roomState.event) {
    eventBox.style.display = 'block';
    document.getElementById('event-title').innerText = currentLang === 'th' ? roomState.event.titleTh : roomState.event.titleEn;
    document.getElementById('event-desc').innerText = currentLang === 'th' ? roomState.event.descTh : roomState.event.descEn;
    document.getElementById('event-days').innerText = `${roomState.event.remainingDays} ${t('daysLeftText')}`;
  } else {
    eventBox.style.display = 'none';
  }

  const currentFeedPrice = roomState.feedPrice || 10;
  const feedTag = t('supplyPriceTag').replace('{price}', currentFeedPrice);
  document.getElementById('ui-feedbags-name').innerText = `${t('feedBagsName')} ${feedTag}`;

  const currentFertPrice = roomState.fertilizerPrice || 8;
  const fertTag = t('supplyPriceTag').replace('{price}', currentFertPrice);
  document.getElementById('ui-fertbags-name').innerText = `${t('fertBagsName')} ${fertTag}`;

  document.getElementById('bar-cash').innerText = `$${me.cash} / $${roomState.targetCash}`;
  document.getElementById('bar-animals').innerText = `${totalAnimals}/${roomState.targetAnimalCount}`;
  document.getElementById('bar-animals').style.color = totalAnimals >= roomState.targetAnimalCount ? 'var(--success)' : '#fbbf24';
  document.getElementById('bar-prod').innerText = `${soldCount}/${roomState.targetProduceSold}`;
  document.getElementById('bar-prod').style.color = soldCount >= roomState.targetProduceSold ? 'var(--success)' : '#34d399';

  document.getElementById('ready-status-container').innerHTML = Object.values(roomState.players).map(p => {
    let tagClass = 'waiting-tag';
    let status = t('statusTending');
    if (!p.connected) {
      tagClass = 'offline-tag';
      status = t('statusOffline');
    } else if (p.ready) {
      tagClass = 'ready-tag';
      status = t('statusReady');
    }
    return `<span class="player-tag ${tagClass}">${p.name}: $${p.cash} (${status})</span>`;
  }).join('');

  const mDiv = document.getElementById('market-animals-list');
  if (mDiv) {
    mDiv.innerHTML = '';
    ASSETS.forEach(item => {
      const marketAnimal = roomState?.market?.animal || {};
      const deltas = roomState?.market?.deltas?.animal || {};
      const price = marketAnimal[item.id] !== undefined ? marketAnimal[item.id] : item.basePrice;
      const deltaBadge = renderDeltaBadge(deltas[item.id]);

      const count = buySteppers[item.id] || 1;
      const total = price * count;
      const animalName = I18N[currentLang].assets[item.id] || item.id;
      const canAfford = me.cash >= total;

      const fbKey = `buy_${item.id}`;
      const isFeedback = feedbackStates[fbKey] && Date.now() < feedbackStates[fbKey].until;

      let btnText = canAfford ? `${t('buyBtn')} ($${total})` : `${t('cantBuy')} ($${total})`;
      let btnClass = canAfford ? 'btn-success' : 'btn-danger';

      if (isFeedback) {
        btnText = feedbackStates[fbKey].text;
        btnClass = 'btn-bought';
      }

      const row = document.createElement('div');
      row.className = 'item-row';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.marginTop = '8px';

      row.innerHTML = `
        <div>
          <strong style="font-size: 1rem;">${animalName}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
            ${t('eatsText')}: <b>${item.feedCost} ${t('feedPerDay')}</b> | ${t('marketPriceText')}: <b style="color:var(--primary);">$${price}</b> ${deltaBadge}
          </div>
        </div>
        <div class="stepper-wrap">
          <button class="btn btn-stepper" onclick="stepBuy('${item.id}', -1)" ${isLocked ? 'disabled' : ''}>-</button>
          <span style="font-weight:bold; min-width:22px; text-align:center;">${count}</span>
          <button class="btn btn-stepper" onclick="stepBuy('${item.id}', 1)" ${isLocked ? 'disabled' : ''}>+</button>
          <button class="btn ${btnClass}" 
                  onclick="buyAnimal('${item.id}')" 
                  ${(!canAfford || isLocked || isFeedback) ? 'disabled' : ''}>
            ${btnText}
          </button>
        </div>
      `;
      mDiv.appendChild(row);
    });
  }

  const sDiv = document.getElementById('market-seeds-list');
  if (sDiv) {
    sDiv.innerHTML = '';
    const hasFreePlot = occupiedPlots < maxPlots;
    PLANTS.forEach(item => {
      const marketSeeds = roomState?.market?.seeds || {};
      const deltas = roomState?.market?.deltas?.seeds || {};
      const price = marketSeeds[item.id] !== undefined ? marketSeeds[item.id] : item.seedPrice;
      const deltaBadge = renderDeltaBadge(deltas[item.id]);

      const seedName = I18N[currentLang].plants[item.id] || item.id;
      const canAfford = me.cash >= price;
      const fbKey = `plant_${item.id}`;
      const isFeedback = feedbackStates[fbKey] && Date.now() < feedbackStates[fbKey].until;

      let btnText = canAfford ? `${t('plantBtn')} ($${price})` : `${t('cantBuy')} ($${price})`;
      let btnClass = canAfford ? 'btn-success' : 'btn-danger';

      if (isFeedback) {
        btnText = feedbackStates[fbKey].text;
        btnClass = 'btn-bought';
      }

      const row = document.createElement('div');
      row.className = 'item-row';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.marginTop = '8px';

      row.innerHTML = `
        <div>
          <strong style="font-size: 1rem;">${seedName}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
            <b>${item.growthDays} ${t('daysText')}</b> | <b>${item.fertilizerCost} ${t('fertPerDay')}</b> | ${t('marketPriceText')}: <b style="color:var(--primary);">$${price}</b> ${deltaBadge}
          </div>
        </div>
        <div>
          <button class="btn ${btnClass}" 
                  onclick="plantSeed('${item.id}')" 
                  ${(!canAfford || !hasFreePlot || isLocked || isFeedback) ? 'disabled' : ''}>
            ${!hasFreePlot ? t('plotsFull') : btnText}
          </button>
        </div>
      `;
      sDiv.appendChild(row);
    });
  }

  updateFeedBuyButton();
  updateFertBuyButton();
  updatePestBuyButton();
  updateMedBuyButton();

  const aDiv = document.getElementById('inventory-animals-list');
  aDiv.innerHTML = '';
  let hasAnimals = false;
  ASSETS.forEach(item => {
    const units = me.inventory[item.id] || [];
    const owned = units.length;
    if (owned > 0) {
      hasAnimals = true;
      const marketAnimal = roomState?.market?.animal || {};
      const currentPrice = marketAnimal[item.id] !== undefined ? marketAnimal[item.id] : item.basePrice;
      const totalCost = units.reduce((acc, u) => acc + (u.boughtAt || currentPrice), 0);
      const avg = Math.round(totalCost / owned);
      const profit = (owned * currentPrice) - totalCost;

      const toSell = Math.min(owned, sellSteppers[item.id] || 1);
      const sellTotal = toSell * currentPrice;
      const animalName = I18N[currentLang].assets[item.id] || item.id;

      const fbKey = `sell_animal_${item.id}`;
      const isFeedback = feedbackStates[fbKey] && Date.now() < feedbackStates[fbKey].until;
      const btnText = isFeedback ? feedbackStates[fbKey].text : `${t('sellActionText')} ${toSell} ${t('forText')} $${sellTotal}`;
      const btnClass = isFeedback ? 'btn-sold' : 'btn-danger';

      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
          <strong>${animalName} (x${owned})</strong>
          <span class="${profit >= 0 ? 'profit-pos' : 'profit-neg'}">${t('profitText')}: ${profit >= 0 ? '+' : ''}$${profit}</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); display:flex; justify-content:space-between; margin:4px 0;">
          <span>${t('avgCostText')}: $${avg} | ${t('marketPriceText')}: $${currentPrice}</span>
          <span>${t('needsText')}: ${item.feedCost * owned} ${t('feedPerDay')}</span>
        </div>
        <div style="display:flex; justify-content:flex-end; align-items:center; gap:8px; margin-top:6px;">
          <div class="stepper-wrap">
            <button class="btn btn-stepper" onclick="stepSell('${item.id}', -1)" ${isLocked ? 'disabled' : ''}>-</button>
            <span style="font-weight:bold; min-width:20px; text-align:center;">${toSell}</span>
            <button class="btn btn-stepper" onclick="stepSell('${item.id}', 1)" ${toSell >= owned || isLocked ? 'disabled' : ''}>+</button>
          </div>
          <button class="btn ${btnClass}" onclick="sellAnimal('${item.id}')" ${isLocked || isFeedback ? 'disabled' : ''}>
            ${btnText}
          </button>
        </div>
      `;
      aDiv.appendChild(row);
    }
  });
  if (!hasAnimals) {
    aDiv.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">${t('noAnimals')}</p>`;
  }

  const gDiv = document.getElementById('garden-plots-list');
  gDiv.innerHTML = '';
  if (me.plots && me.plots.length > 0) {
    me.plots.forEach((plot, index) => {
      const plantDef = PLANTS.find(p => p.id === plot.cropId);
      const cropName = I18N[currentLang].plants[plot.cropId] || plot.cropId;
      const progressPct = Math.min(100, Math.round((plot.growthProgress / plot.requiredDays) * 100));

      const row = document.createElement('div');
      row.className = 'item-row';
      row.style.marginBottom = '6px';
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <strong>${t('plotLabel')} #${index + 1}: ${cropName}</strong>
          <span style="font-size:0.8rem; color:var(--primary); font-weight:bold;">${plot.growthProgress} / ${plot.requiredDays} ${t('daysText')}</span>
        </div>
        <div style="background:#090e19; border-radius:4px; height:8px; overflow:hidden; border:1px solid var(--border);">
          <div style="background:var(--success); width:${progressPct}%; height:100%;"></div>
        </div>
      `;
      gDiv.appendChild(row);
    });
  } else {
    gDiv.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">${t('noPlants')}</p>`;
  }

  const pDiv = document.getElementById('produce-list');
  pDiv.innerHTML = '';
  let hasProduce = false;
  const allProduceItems = [...ASSETS, ...PLANTS];

  allProduceItems.forEach(item => {
    const amount = me.produce[item.produce] || 0;
    const marketProduce = roomState?.market?.produce || {};
    const deltasP = roomState?.market?.deltas?.produce || {};
    const unitPrice = marketProduce[item.produce] !== undefined ? marketProduce[item.produce] : item.produceBasePrice;
    const deltaBadge = renderDeltaBadge(deltasP[item.produce]);

    if (amount > 0) {
      hasProduce = true;
      const produceName = I18N[currentLang].produce[item.produce] || item.produce;

      const fbKey = `sell_produce_${item.produce}`;
      const isFeedback = feedbackStates[fbKey] && Date.now() < feedbackStates[fbKey].until;

      const row = document.createElement('div');
      row.className = 'item-row';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.innerHTML = `
        <div>
          <strong>${produceName}: ${amount} ${t('eachText')}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">${t('marketUnitPrice')}: $${unitPrice} / ${t('eachText')} ${deltaBadge}</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn ${isFeedback ? 'btn-sold' : 'btn-success'}" onclick="sellProduce('${item.produce}', 1)" ${isLocked || isFeedback ? 'disabled' : ''}>
            ${isFeedback ? feedbackStates[fbKey].text : `${t('sellOne')} ($${unitPrice})`}
          </button>
          <button class="btn ${isFeedback ? 'btn-sold' : 'btn-success'}" onclick="sellProduce('${item.produce}', ${amount})" ${isLocked || isFeedback ? 'disabled' : ''}>
            ${isFeedback ? feedbackStates[fbKey].text : `${t('sellAll')} ($${amount * unitPrice})`}
          </button>
        </div>
      `;
      pDiv.appendChild(row);
    }
  });
  if (!hasProduce) {
    pDiv.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">${t('noProduce')}</p>`;
  }
}

applyLanguageStatic();

function tryAutoReconnect() {
  const currentSavedRoom = sessionStorage.getItem('farm_room_id');
  const currentSavedId = sessionStorage.getItem('farm_player_id');
  const currentSavedName = sessionStorage.getItem('farm_player_name');

  if (currentSavedRoom && currentSavedId) {
    socket.emit('join_room', {
      roomId: currentSavedRoom,
      playerName: currentSavedName,
      playerId: currentSavedId
    });
  }
}

function toggleMenu(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('menu-dropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

window.addEventListener('click', () => {
  const dropdown = document.getElementById('menu-dropdown');
  if (dropdown && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  }
});

function openModal(id) {
  const dropdown = document.getElementById('menu-dropdown');
  if (dropdown) dropdown.classList.remove('show');

  const modal = document.getElementById(id);
  if (modal) modal.classList.add('show');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('show');
}

function closeModalOnOverlay(event, id) {
  if (event.target.id === id) {
    closeModal(id);
  }
}

socket.on('connect', () => {
  tryAutoReconnect();
});

if (socket.connected) {
  tryAutoReconnect();
}