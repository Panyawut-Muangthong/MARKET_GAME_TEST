let currentLang = 'th';

const I18N = {
  en: {
    bgmOn: 'BGM: ON',
    bgmOff: 'BGM: OFF',
    toggleBtn: 'TH (ภาษาไทย)',
    leaveBtn: 'Leave Game',
    menuNews: 'News & Updates',
    howToPlayTitle: 'How to Play',
    newsTitle: 'Updates & Patch Notes',
    title: 'Market Tycoon: Capital Race',
    subtitle: 'Trade livestock, plant crops, manage feed & fertilizer, and hit goals to win!',
    joinTitle: 'Join Game',
    joinBtn: 'Enter Game',
    namePlaceholder: 'Your Name',
    roomPlaceholder: 'Room Code (e.g. RACE)',
    roomLabel: 'Room',
    startBtn: 'Start Match',
    waitingHost: 'Waiting for host to start...',
    dayLabel: 'Day',
    labelTimer: 'Time Left',
    labelCash: 'Balance / Target',
    labelAnimals: 'Animals / Goal',
    labelProdSold: 'Produce Sold / Goal',
    labelFeed: 'Feed (Stock / Need)',
    labelFertilizer: 'Fertilizer (Stock / Need)',
    labelPesticide: 'Pesticide',
    labelPlots: 'Garden Plots',
    labelMed: 'Medicine',
    labelNeed: 'Feed Need',
    bagsPerDay: 'bags / day',
    endDayBtn: 'Feed, Protect Crops & End Day',
    endDayBtnWaiting: 'Waiting for others...',
    marketTitle: 'Marketplace: Livestock, Seeds & Supplies',
    seedsMarketTitle: 'Seeds & Plantable Crops',
    animalsMarketTitle: 'Livestock Market',
    feedBagsName: 'Feed Bags',
    feedBagsDesc: 'Feed herds overnight to generate produce.',
    fertBagsName: 'Crop Fertilizer',
    fertBagsDesc: 'Nurture your crops overnight so they grow!',
    pesticideName: 'Pesticide Spray ($25 ea)',
    pesticideDesc: 'Shields 1 plant plot overnight against worm infestation!',
    medicineName: 'Animal Medicine ($35 ea)',
    medicineDesc: 'Protects 1 animal from dying during the Flu!',
    supplyPriceTag: '($${price} ea)',
    buyBtn: 'Buy',
    plantBtn: 'Plant',
    cantBuy: "Can't Buy",
    plotsFull: 'Plots Full',
    boughtBtn: 'Purchased!',
    soldBtn: 'Sold!',
    plantedBtn: 'Planted!',
    eatsText: 'Eats',
    feedPerDay: 'feed/day',
    fertPerDay: 'fert/day',
    marketPriceText: 'Market',
    barnTitle: 'Your Estate: Livestock, Garden & Harvest',
    holdingsTitle: 'Owned Livestock (Liquidate with - / +)',
    gardenTitle: 'Active Crop Slots (Auto-harvest on maturity)',
    noAnimals: 'No livestock owned. Buy from the market!',
    noPlants: 'No crops planted. Buy seeds to plant in your slots!',
    growthProgressText: 'Growth',
    daysText: 'days',
    avgCostText: 'Avg',
    needsText: 'Needs',
    profitText: 'P/L',
    sellActionText: 'Sell',
    forText: 'for',
    produceTitle: 'Raw Harvest Storage (Sell for Profit)',
    noProduce: 'Barn is empty. Harvest crops & feed livestock overnight!',
    marketUnitPrice: 'Market Price',
    eachText: 'ea',
    sellOne: 'Sell 1',
    sellAll: 'Sell All',
    plotLabel: 'Plot',
    daysLeftText: 'days remaining',
    statusReady: 'Ready',
    statusTending: 'Tending Farm',
    statusOffline: 'Offline',
    winnerAlert: 'VICTORY! {name} achieved all conditions: ${target} cash, at least {animals} animals, and {sold} units of produce sold!',
    reportFlu: 'Alert: {count} unmedicated animals died from the flu overnight!',
    reportWorms: 'Alert: {count} unprotected plant plots were devoured by pest worms overnight!',
    hostTitle: 'Host Game Rules',
    lblStartCash: 'Starting Cash ($)',
    lblTargetCash: 'Winning Target Cash ($)',
    lblTargetAnimals: 'Target Animals Owned',
    lblTargetProduce: 'Target Produce Sold (Total)',
    lblDuration: 'Day Duration (Seconds)',
    lblCooldown: 'Event Cooldown (Days)',
    barCashLbl: 'Cash',
    barGoalsLbl: 'Goals',
    clientGoalSummary: 'Goal: ${cash} | Need: {animals} Animals | Sell: {produce} Produce | Day: {duration}s',
    howToPlayBody: `
      <h4>Winning the Game</h4>
      <p>Reach all 3 goals simultaneously: Cash target, required animals, and total produce sold.</p>

      <h4>Livestock & Feed</h4>
      <ul>
        <li>Animals consume feed overnight and generate produce (eggs, milk, wool, etc.).</li>
        <li>If you lack feed, 50% of your livestock will starve overnight.</li>
        <li>Protect animals with <b>Medicine</b> during Flu epidemics.</li>
      </ul>

      <h4>Garden & Crops</h4>
      <ul>
        <li>Buy seeds to plant in active garden plots.</li>
        <li>Each plot consumes fertilizer daily to advance growth.</li>
        <li>When mature, crops auto-harvest into storage.</li>
        <li>Use <b>Pesticide Spray</b> during Worm Invasions to protect crops.</li>
      </ul>
    `,
    newsBody: `
      <h4>Version 1.2 — Garden & Pest Expansion</h4>
      <ul>
        <li>Added plantable crop seeds: Wheat, Carrots, and Strawberries.</li>
        <li>Added Crop Fertilizer system and automatic maturity harvesting.</li>
        <li>New Event: <b>Pest Worm Invasion</b> — protects your plots with Pesticide Spray!</li>
        <li>Market stabilization: Rebalanced crop earnings to prevent hyperinflation.</li>
      </ul>
    `,
    assets: {
      chicken: 'Poultry Flock 🐔',
      apiary: 'Bee Hive 🐝',
      pig: 'Truffle Pig 🐷',
      sheep: 'Angora Sheep 🐑',
      dairy_cow: 'Dairy Cow 🐮',
      golden_goose: 'Golden Goose 🪿',
      thoroughbred: 'Race Horse 🐴'
    },
    plants: {
      wheat_crop: 'Golden Wheat Seed 🌾',
      carrot_crop: 'Sweet Carrot Seed 🥕',
      strawberry_crop: 'Ruby Strawberry Seed 🍓'
    },
    produce: {
      egg: 'Eggs 🥚',
      honey: 'Raw Honey 🍯',
      truffle: 'Truffles 🍄',
      wool: 'Fine Wool 🧶',
      milk: 'Fresh Milk 🥛',
      golden_egg: 'Golden Egg ✨',
      trophy: 'Trophies 🏆',
      wheat_sheaf: 'Wheat Sheaves 🌾',
      carrot_bundle: 'Carrot Bundles 🥕',
      strawberry_crate: 'Strawberry Crates 🍓'
    }
  },
  th: {
    bgmOn: 'เพลงพื้นหลัง: เปิด',
    bgmOff: 'เพลงพื้นหลัง: ปิด',
    toggleBtn: 'EN (English)',
    leaveBtn: 'ออกจากห้อง',
    menuNews: 'ข่าวสาร & อัปเดต',
    howToPlayTitle: 'วิธีการเล่นเกม',
    newsTitle: 'ข่าวสารการอัปเดตแพตช์',
    title: 'เศรษฐีฟาร์ม: วิ่งแข่งสู่เงินล้าน',
    subtitle: 'ซื้อขายสัตว์ ปลูกพืช บริหารอาหารและปุ๋ย ทำเงื่อนไขชัยชนะทั้ง 3 ข้อให้ครบเพื่อเป็นผู้ชนะ!',
    joinTitle: 'เข้าสู่ห้องเล่นเกม',
    joinBtn: 'เข้าเล่นเกม',
    namePlaceholder: 'ชื่อของคุณ',
    roomPlaceholder: 'รหัสห้อง (เช่น RACE)',
    roomLabel: 'ห้อง',
    startBtn: 'เริ่มการแข่งขัน',
    waitingHost: 'กำลังรอหัวหน้าห้องเริ่มเกม...',
    dayLabel: 'วันที่',
    labelTimer: 'เวลาที่เหลือ',
    labelCash: 'เงินปัจจุบัน / เป้าหมาย',
    labelAnimals: 'จำนวนสัตว์ / เป้าหมาย',
    labelProdSold: 'ผลผลิตที่ขาย / เป้าหมาย',
    labelFeed: 'อาหารสัตว์ (มี / ต้องใช้)',
    labelFertilizer: 'ปุ๋ย (มี / ต้องใช้)',
    labelPesticide: 'สเปรย์กำจัดหนอน',
    labelPlots: 'แปลงปลูกพืช',
    labelMed: 'ยารักษาโรค',
    labelNeed: 'ต้องการอาหาร',
    bagsPerDay: 'ถุง / วัน',
    endDayBtn: 'ให้อาหารสัตว์ พ่นยา & จบวัน',
    endDayBtnWaiting: 'กำลังรอผู้เล่นคนอื่น...',
    marketTitle: 'ตลาดกลาง: สัตว์เลี้ยง, เมล็ดพันธุ์ และเสบียง',
    seedsMarketTitle: 'เมล็ดพันธุ์ & พืชเพาะปลูก',
    animalsMarketTitle: 'ตลาดซื้อขายสัตว์',
    feedBagsName: 'ถุงอาหารสัตว์',
    feedBagsDesc: 'ให้อาหารสัตว์ข้ามคืนเพื่อสร้างผลผลิต',
    fertBagsName: 'ปุ๋ยบำรุงพืช',
    fertBagsDesc: 'ใส่ปุ๋ยข้ามคืนเพื่อให้พืชในแปลงเติบโต!',
    pesticideName: 'สเปรย์กำจัดหนอน (กระป๋องละ $25)',
    pesticideDesc: 'ป้องกันแปลงผัก 1 แปลงไม่ให้หนอนกัดกินตายข้ามคืน!',
    medicineName: 'ยารักษาและวัคซีน (ขวดละ $35)',
    medicineDesc: 'ปกป้องสัตว์ 1 ตัวไม่ให้ล้มตายจากโรคระบาดข้ามคืน!',
    supplyPriceTag: '(ถุงละ ${price})',
    buyBtn: 'ซื้อ',
    plantBtn: 'ปลูก',
    cantBuy: 'เงินไม่พอ',
    plotsFull: 'แปลงเต็มแล้ว',
    boughtBtn: 'ซื้อแล้ว!',
    soldBtn: 'ขายแล้ว!',
    plantedBtn: 'ปลูกแล้ว!',
    eatsText: 'กิน',
    feedPerDay: 'อาหาร/วัน',
    fertPerDay: 'ปุ๋ย/วัน',
    marketPriceText: 'ราคาตลาด',
    barnTitle: 'ไร่นาของคุณ: สัตว์เลี้ยง, แปลงพืช & ผลผลิต',
    holdingsTitle: 'สัตว์เลี้ยงที่ครอบครอง (ขายออกโดยใช้ - / +)',
    gardenTitle: 'แปลงพืชที่กำลังโต (เก็บเกี่ยวอัตโนมัติเมื่อครบกำหนด)',
    noAnimals: 'คุณยังไม่มีสัตว์เลี้ยง ซื้อได้จากตลาดทางซ้าย!',
    noPlants: 'ยังไม่มีพืชในแปลง ซื้อเมล็ดพันธุ์มาปลูกได้เลย!',
    growthProgressText: 'ความคืบหน้า',
    daysText: 'วัน',
    avgCostText: 'ทุนเฉลี่ย',
    needsText: 'ต้องการ',
    profitText: 'กำไร',
    sellActionText: 'ขาย',
    forText: 'เป็นเงิน',
    produceTitle: 'คลังผลผลิตที่เก็บเกี่ยวได้ (ขายเพื่อกำไร)',
    noProduce: 'ไม่มีผลผลิต เลี้ยงสัตว์หรือปลูกพืชให้โตเพื่อเก็บเกี่ยว!',
    marketUnitPrice: 'ราคาตลาด',
    eachText: 'ชิ้น',
    sellOne: 'ขาย 1 ชิ้น',
    sellAll: 'ขายทั้งหมด',
    plotLabel: 'แปลงที่',
    daysLeftText: 'วันคงเหลือ',
    statusReady: 'พร้อมแล้ว',
    statusTending: 'กำลังดูแลฟาร์ม',
    statusOffline: 'ออฟไลน์',
    winnerAlert: 'ชัยชนะ! {name} ผ่านเงื่อนไขครบทั้ง 3 ข้อ: เงิน ${target}, สัตว์อย่างน้อย {animals} ตัว และขายผลผลิตครบ {sold} ชิ้น!',
    reportFlu: 'แจ้งเตือน: สัตว์ในฟาร์ม {count} ตัวติดเชื้อไข้หวัดล้มตายเนื่องจากไม่มียารักษา!',
    reportWorms: 'แจ้งเตือน: พืชในแปลง {count} แปลงถูกหนอนศัตรูพืชกัดกินเหี่ยวเฉาตาย เนื่องจากไม่มีสเปรย์ป้องกัน!',
    hostTitle: 'ตั้งค่ากฎการแข่งขัน (เฉพาะหัวหน้าห้อง)',
    lblStartCash: 'เงินทุนเริ่มต้น ($)',
    lblTargetCash: 'เป้าหมายเงิน ($)',
    lblTargetAnimals: 'เป้าหมายสัตว์ที่ต้องมี',
    lblTargetProduce: 'เป้าหมายผลผลิตที่ต้องขาย',
    lblDuration: 'เวลารอบวัน (วินาที)',
    lblCooldown: 'ระยะพักอีเวนต์ (วัน)',
    barCashLbl: 'เงิน',
    barGoalsLbl: 'เป้าหมาย',
    clientGoalSummary: 'เป้าหมาย: ${cash} | สัตว์ที่ต้องมี: {animals} ตัว | ขายผลผลิต: {produce} ชิ้น | เวลารอบวัน: {duration} วินาที',
    howToPlayBody: `
      <h4>เงื่อนไขชัยชนะ</h4>
      <p>ต้องบรรลุเป้าหมายครบทั้ง 3 ข้อพร้อมกัน: เงินสะสมตามเป้า, มีสัตว์เลี้ยงครบ และขายผลผลิตสะสมได้ตามกำหนด</p>

      <h4>การเลี้ยงสัตว์ & อาหารสัตว์</h4>
      <ul>
        <li>สัตว์จะกินอาหารข้ามคืนเพื่อสร้างผลผลิต (ไข่, นม, ขนแกะ ฯลฯ)</li>
        <li>หากอาหารสัตว์ไม่พอ สัตว์ในฟาร์ม 50% จะอดตาย</li>
        <li>เมื่อเกิดโรคระบาดไข้หวัด สัตว์ที่ไม่ได้รับยาจะล้มตาย</li>
      </ul>

      <h4>แปลงผัก & พืชพรรณ</h4>
      <ul>
        <li>ซื้อเมล็ดพันธุ์แล้วปลูกลงแปลงว่าง</li>
        <li>แต่ละแปลงต้องใช้ปุ๋ยทุกคืนเพื่อให้พืชโตขึ้น 1 วัน</li>
        <li>เมื่อโตเต็มที่จะเก็บเกี่ยวเข้าคลังผลผลิตโดยอัตโนมัติ</li>
        <li>หากมีฝูงหนอนบุก ต้องใช้ <b>สเปรย์กำจัดหนอน</b> ป้องกันแปลงผักข้ามคืน</li>
      </ul>
    `,
    newsBody: `
      <h4>เวอร์ชัน 1.2 — แปลงปลูกผัก & ภัยหนอนบุก</h4>
      <ul>
        <li>เพิ่มเมล็ดพันธุ์พืช: ข้าวสาลี, แครอทหวาน, และสตรอว์เบอร์รี</li>
        <li>เพิ่มระบบปุ๋ยบำรุงพืช และการเก็บเกี่ยวผลผลิตอัตโนมัติเมื่อครบกำหนด</li>
        <li>อีเวนต์ใหม่: <b>ฝูงหนอนศัตรูพืชบุก!</b> — ปกป้องแปลงผักด้วยสเปรย์กำจัดหนอน</li>
        <li>ปรับสมดุลราคาผลผลิต ไม่ให้ราคาพุ่งสูงเกินความจริง</li>
      </ul>
    `,
    assets: {
      chicken: 'ฝูงไก่ไข่ 🐔',
      apiary: 'รังผึ้งโพรง 🐝',
      pig: 'หมูดมเห็ดทรัฟเฟิล 🐷',
      sheep: 'แกะแองโกร่า 🐑',
      dairy_cow: 'โคนม 🐮',
      golden_goose: 'ห่านไข่ทองคำ 🪿',
      thoroughbred: 'ม้าแข่งพันธุ์ดี 🐴'
    },
    plants: {
      wheat_crop: 'เมล็ดข้าวสาลีทองคำ 🌾',
      carrot_crop: 'เมล็ดแครอทหวาน 🥕',
      strawberry_crop: 'เมล็ดสตรอว์เบอร์รี 🍓'
    },
    produce: {
      egg: 'ไข่ไก่ 🥚',
      honey: 'น้ำผึ้งแท้ 🍯',
      truffle: 'เห็ดทรัฟเฟิล 🍄',
      wool: 'ขนแกะเกรดพรีเมียม 🧶',
      milk: 'นมสด 🥛',
      golden_egg: 'ไข่ทองคำ ✨',
      trophy: 'ถ้วยรางวัล 🏆',
      wheat_sheaf: 'ฟ่อนข้าวสาลี 🌾',
      carrot_bundle: 'มัดแครอท 🥕',
      strawberry_crate: 'ลังสตรอว์เบอร์รี 🍓'
    }
  }
};

function t(key) { return I18N[currentLang][key] || key; }

function toggleLanguage() {
  currentLang = (currentLang === 'en') ? 'th' : 'en';
  applyLanguageStatic();
  renderUI();
}

function applyLanguageStatic() {
  const bgmText = isBgmPlaying ? t('bgmOn') : t('bgmOff');
  const bgmBtn = document.getElementById('bgm-btn-text');
  if (bgmBtn) bgmBtn.innerText = bgmText;

  document.getElementById('lang-btn-text').innerText = t('toggleBtn');
  document.getElementById('ui-leave-btn').innerText = t('leaveBtn');
  document.getElementById('menu-item-news').innerText = t('menuNews');
  document.getElementById('modal-how-title').innerText = t('howToPlayTitle');
  document.getElementById('modal-how-body').innerHTML = t('howToPlayBody');
  document.getElementById('modal-news-title').innerText = t('newsTitle');
  document.getElementById('modal-news-body').innerHTML = t('newsBody');

  const lobbyHowTitle = document.getElementById('lobby-how-title');
  if (lobbyHowTitle) lobbyHowTitle.innerText = t('howToPlayTitle');
  const lobbyHowBody = document.getElementById('lobby-how-body');
  if (lobbyHowBody) lobbyHowBody.innerHTML = t('howToPlayBody');

  const waitingHowTitle = document.getElementById('waiting-how-title');
  if (waitingHowTitle) waitingHowTitle.innerText = t('howToPlayTitle');
  const waitingHowBody = document.getElementById('waiting-how-body');
  if (waitingHowBody) waitingHowBody.innerHTML = t('howToPlayBody');

  document.getElementById('ui-title').innerText = t('title');
  document.getElementById('ui-subtitle').innerText = t('subtitle');
  document.getElementById('ui-join-title').innerText = t('joinTitle');
  document.getElementById('ui-join-btn').innerText = t('joinBtn');
  document.getElementById('join-name').placeholder = t('namePlaceholder');
  document.getElementById('join-room').placeholder = t('roomPlaceholder');
  document.getElementById('ui-room-label').innerText = t('roomLabel');
  document.getElementById('btn-start').innerText = t('startBtn');
  document.getElementById('waiting-msg').innerText = t('waitingHost');

  document.getElementById('ui-host-title').innerText = t('hostTitle');
  document.getElementById('ui-lbl-startcash').innerText = t('lblStartCash');
  document.getElementById('ui-lbl-targetcash').innerText = t('lblTargetCash');
  document.getElementById('ui-lbl-targetanimals').innerText = t('lblTargetAnimals');
  document.getElementById('ui-lbl-targetproduce').innerText = t('lblTargetProduce');
  document.getElementById('ui-lbl-duration').innerText = t('lblDuration');
  document.getElementById('ui-lbl-cooldown').innerText = t('lblCooldown');

  document.getElementById('ui-day-label').innerText = t('dayLabel');
  document.getElementById('ui-label-timer').innerText = t('labelTimer');
  document.getElementById('ui-label-cash').innerText = t('labelCash');
  document.getElementById('ui-label-animals').innerText = t('labelAnimals');
  document.getElementById('ui-label-prodsold').innerText = t('labelProdSold');
  document.getElementById('ui-label-feed').innerText = t('labelFeed');
  document.getElementById('ui-label-fertilizer').innerText = t('labelFertilizer');
  document.getElementById('ui-label-pesticide').innerText = t('labelPesticide');
  document.getElementById('ui-label-plots').innerText = t('labelPlots');
  document.getElementById('ui-label-med').innerText = t('labelMed');
  const uiLabelNeed = document.getElementById('ui-label-need');
  if (uiLabelNeed) uiLabelNeed.innerText = t('labelNeed');

  document.getElementById('ui-market-title').innerText = t('marketTitle');
  const uiSeedsMarketTitle = document.getElementById('ui-seeds-market-title');
  if (uiSeedsMarketTitle) uiSeedsMarketTitle.innerText = t('seedsMarketTitle');
  const uiAnimalsMarketTitle = document.getElementById('ui-animals-market-title');
  if (uiAnimalsMarketTitle) uiAnimalsMarketTitle.innerText = t('animalsMarketTitle');

  document.getElementById('ui-feedbags-name').innerText = t('feedBagsName');
  document.getElementById('ui-feedbags-desc').innerText = t('feedBagsDesc');
  document.getElementById('ui-fertbags-name').innerText = t('fertBagsName');
  document.getElementById('ui-fertbags-desc').innerText = t('fertBagsDesc');
  document.getElementById('ui-pesticide-name').innerText = t('pesticideName');
  document.getElementById('ui-pesticide-desc').innerText = t('pesticideDesc');
  document.getElementById('ui-medicine-name').innerText = t('medicineName');
  document.getElementById('ui-medicine-desc').innerText = t('medicineDesc');

  document.getElementById('ui-barn-title').innerText = t('barnTitle');
  document.getElementById('ui-holdings-title').innerText = t('holdingsTitle');
  document.getElementById('ui-garden-title').innerText = t('gardenTitle');
  document.getElementById('ui-produce-title').innerText = t('produceTitle');

  document.getElementById('ui-bar-cash-lbl').innerText = t('barCashLbl');
  document.getElementById('ui-bar-goals-lbl').innerText = t('barGoalsLbl');
}