/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — 全局状态与基础工具 (State & Utility Functions)
   ========================================================================== */
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const STORAGE_KEY = 'papa-pumpkin-sanctuary-v3';
  const dayKey = new Date().toISOString().slice(0, 10);
  let persistentClientId = localStorage.getItem('papa_client_id');
  if (!persistentClientId) {
    persistentClientId = `papa_${Math.random().toString(16).slice(2, 8)}`;
    localStorage.setItem('papa_client_id', persistentClientId);
  }
  const clientId = persistentClientId;

  const HOUSE_STYLES = [
    {
      id: 'cottage_lv1',
      level: 1,
      name: '避风港原木屋',
      tag: '温润原木',
      price: 0,
      icon: '🏡',
      desc: '原木榫卯与暖色砖瓦，静候小乌龟归家的温馨小居。',
      buff: '🐢 基础庇护 · 小乌龟心情下降速度减缓 10%',
      class: 'cottage-style-lv1'
    },
    {
      id: 'cottage_lv2',
      level: 2,
      name: '晴空风车庄园',
      tag: '微风拂穗',
      price: 400,
      icon: '🌾',
      desc: '荷兰风情四叶风车缓缓旋转，麦浪翻滚，清风送爽。',
      buff: '🌾 丰收祝福 · 每日清晨额外收获 +20 禅意',
      class: 'cottage-style-lv2'
    },
    {
      id: 'cottage_lv3',
      level: 3,
      name: '樱落和风茶庵',
      tag: '落樱烹茶',
      price: 850,
      icon: '🌸',
      desc: '飞檐黛瓦，朱红立柱，常年有粉嫩樱花花瓣在微风中轻舞飘落。',
      buff: '⏱️ 静心禅意 · 专注修行时禅意获取提升 +10%',
      class: 'cottage-style-lv3'
    },
    {
      id: 'cottage_lv4',
      level: 4,
      name: '碧琉璃水上行宫',
      tag: '月泉映波',
      price: 1500,
      icon: '🌊',
      desc: '晶莹剔透的水晶琉璃宫阙，倒映在月泉波光之中，自带璀璨水波光晕。',
      buff: '✨ 灵泉滋养 · 帕帕与小南瓜互动经验获取 +15%',
      class: 'cottage-style-lv4'
    },
    {
      id: 'cottage_lv5',
      level: 5,
      name: '蓬莱仙阁浮云殿',
      tag: '云端仙阙',
      price: 2600,
      icon: '🏯',
      desc: '纯金飞阁，祥云缭绕，星光璀璨，圣域至尊的云顶仙境神殿。',
      buff: '🌟 圣域造化 · 全收益提升 +20% 并享金色仙气光环',
      class: 'cottage-style-lv5'
    }
  ];

  const defaultState = {
    zen: 0,
    dailyCare: 0,
    channel: 'PAPA-0828',
    selectedPet: 'papa',
    chestOpened: false,
    focus: { seconds: 1500, running: false },
    user: {
      id: clientId,
      name: '帕帕饲养员',
      avatar: '🐢'
    },
    contributions: {},
    pets: {
      papa: { id: 'papa', name: '帕帕', kind: '棕壳草龟 · 湖畔巡游者', level: 1, xp: 0, hunger: 80, happiness: 80, clean: 80, title: '憨厚帕帕', aura: '微光', shell: '#7e6338', edge: '#3c2a16', skin: '#9eb780', glow: '#dab777', equipment: '', stage: 1, x: 20, y: 65 },
      pumpkin: { id: 'pumpkin', name: '小南瓜', kind: '嫩绿小龟 · 月下采集者', level: 1, xp: 0, hunger: 80, happiness: 80, clean: 80, title: '软萌小南瓜', aura: '微光', shell: '#6fae55', edge: '#28441c', skin: '#bfe682', glow: '#a8ec7d', equipment: '', stage: 1, x: 34, y: 62 }
    },
    garden: {
      plantStage: 0,
      harvested: false,
      houseStyle: 'cottage_lv1',
      unlockedHouses: ['cottage_lv1'],
      decorations: [
        { id: 'cottage-1', type: 'cottage', label: '避风港小屋', x: 16, y: 52 },
        { id: 'tree-1', type: 'tree', label: '许愿古树', stage: 3, harvested: false, x: 32, y: 46 }
      ]
    },
    theme: 'night',
    keyboardZen: 0,
    keyboardClaimed: false,
    keystrokes: 0,
    heroCoins: 0,
    marketUnlocked: [],
    letters: [
      { id: 'welcome-001', senderId: 'system', senderName: '远方的共养者', senderAvatar: '💌', body: '欢迎来到湖畔！慢慢陪伴两只小龟长大吧。', time: '刚刚', timestamp: Date.now() }
    ],
    owned: []
  };

  function getXpRequired(level) {
    return 80 + (level - 1) * 40; // Step curve: Lv1 requires 80, Lv2 requires 120, Lv3 requires 160...
  }

  function getCumulativeXp(level, xp) {
    let total = xp || 0;
    for (let l = 1; l < (level || 1); l++) {
      total += getXpRequired(l);
    }
    return total;
  }

  function resolveLevelAndXp(cumulativeXp) {
    let level = 1;
    let remaining = Math.max(0, cumulativeXp || 0);
    while (true) {
      const req = getXpRequired(level);
      if (remaining >= req) {
        remaining -= req;
        level += 1;
      } else {
        break;
      }
    }
    return { level, xp: remaining };
  }

  function showPetFloat(petId, text, type = 'xp') {
    const pet = state.pets[petId];
    if (!pet) return;
    const stage = $('#gardenStage');
    if (!stage) return;

    const floatEl = document.createElement('div');
    floatEl.className = `pet-xp-float type-${type}`;

    let icon = type === 'love' ? '💖' : type === 'zen' ? '✦' : '✨';
    floatEl.innerHTML = `<i>${icon}</i> <span>${escapeHTML(text)}</span>`;

    // 对应小乌龟当前坐标头顶上方
    const x = pet.x ?? 50;
    const y = Math.max(5, (pet.y ?? 60) - 7);
    floatEl.style.left = `${x}%`;
    floatEl.style.top = `${y}%`;

    stage.appendChild(floatEl);

    setTimeout(() => {
      floatEl.remove();
    }, 1280);
  }

  const PET_TITLE_TIERS = {
    papa: [
      { minLevel: 1, maxLevel: 4, title: '萌新草龟', aura: '微光', icon: '🌱', desc: '初涉湖畔圣域的青涩草龟，坚实的外壳初显玄武雏形' },
      { minLevel: 5, maxLevel: 9, title: '湖畔巡游者', aura: '晨露', icon: '🌿', desc: '巡游水泽的健壮草龟，身法敏捷，深受湖畔灵气滋养' },
      { minLevel: 10, maxLevel: 14, title: '铁甲玄武卫', aura: '星芒', icon: '🛡️', desc: '披坚执锐的玄甲战卫，外壳坚不可摧，能抵御深渊风暴' },
      { minLevel: 15, maxLevel: 19, title: '不动明王龟', aura: '金阳', icon: '⛰️', desc: '撼地如山的守护宗师，战意狂飙，立于不败之地' },
      { minLevel: 20, maxLevel: 29, title: '极道镇海真君', aura: '神火', icon: '🌊', desc: '引动九幽地脉重力的盖世神龟，一击即可撼动魔渊' },
      { minLevel: 30, maxLevel: 999, title: '鸿蒙开天玄武神尊', aura: '太虚', icon: '☬', desc: '震慑诸天万界的上古混沌神兽，拥有灭世之威与不朽神躯' }
    ],
    pumpkin: [
      { minLevel: 1, maxLevel: 4, title: '月光小生', aura: '微光', icon: '🌙', desc: '伴随月华初生的灵动橘壳龟，天生亲和元素与星辉灵韵' },
      { minLevel: 5, maxLevel: 9, title: '星火魔导徒', aura: '晨露', icon: '✨', desc: '初窥天地元素奥秘的魔导学徒，周身环绕跃动的灵火' },
      { minLevel: 10, maxLevel: 14, title: '炽阳灵焰师', aura: '星芒', icon: '🔥', desc: '操纵纯阳天火与极寒奥术的灵龟法尊，弹指间冰火齐降' },
      { minLevel: 15, maxLevel: 19, title: '九天引雷真尊', aura: '金阳', icon: '⚡', desc: '掌控九天神雷与星辰奥秘的奥法领主，威震深渊魔物' },
      { minLevel: 20, maxLevel: 29, title: '星穹太虚圣尊', aura: '神火', icon: '🌌', desc: '洞悉虚空与时空真理的造化仙龟，法力澎湃无尽' },
      { minLevel: 30, maxLevel: 999, title: '万界混沌湮灭法皇', aura: '太虚', icon: '☄️', desc: '执掌混沌毁灭与重构的至高法神，念咒即可引动诸神黄昏' }
    ]
  };

  function getPetTitleInfo(petId, level) {
    const list = PET_TITLE_TIERS[petId] || PET_TITLE_TIERS.papa;
    const tier = list.find(t => level >= t.minLevel && level <= t.maxLevel) || list[list.length - 1];
    return tier;
  }

  function addPetXp(petId, amount, type = 'xp') {
    const pet = state.pets[petId];
    if (!pet || !amount || amount <= 0) return false;
    const oldLevel = pet.level;
    const oldTitle = pet.title;
    pet.xp += amount;
    let req = getXpRequired(pet.level);
    let leveledUp = false;
    while (pet.xp >= req) {
      pet.xp -= req;
      pet.level += 1;
      leveledUp = true;
      req = getXpRequired(pet.level);
    }
    const info = getPetTitleInfo(petId, pet.level);
    pet.title = info.title;
    pet.aura = info.aura;

    // 在对应乌龟头顶弹出专属浮动经验徽章
    showPetFloat(petId, `+${amount} XP`, type);

    if (leveledUp) {
      if (oldTitle !== pet.title) {
        toast('👑 称号晋升！', `【${pet.name}】突破至 Lv.${pet.level}，荣获全新专属称号【${pet.title}】！`);
      } else {
        toast('✦ 等级提升', `【${pet.name}】等级提升至 Lv.${pet.level}！`);
      }
    }
    return leveledUp;
  }

  function freshCopy(value) { return JSON.parse(JSON.stringify(value)); }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const fallback = freshCopy(defaultState);
      const savedKeystrokes = Number(localStorage.getItem(`${STORAGE_KEY}-keystrokes`)) || 0;
      if (!saved) {
        fallback.keystrokes = savedKeystrokes;
        fallback.contributions[clientId] = {
          id: clientId,
          name: fallback.user.name,
          avatar: fallback.user.avatar,
          totalZen: 0,
          todayZen: 0,
          lastDay: dayKey,
          details: { petCare: 0, treeHarvest: 0, keyboardZen: 0, keystrokes: savedKeystrokes, focusTimer: 0, chestReward: 0 },
          lastActive: Date.now()
        };
        return fallback;
      }
      const stateObj = {
        ...fallback, ...saved,
        focus: { ...defaultState.focus, ...saved.focus },
        user: { ...defaultState.user, ...(saved.user || {}) },
        contributions: { ...(saved.contributions || {}) },
        pets: { ...freshCopy(defaultState.pets), ...saved.pets },
        garden: { ...freshCopy(defaultState.garden), ...saved.garden },
        letters: Array.isArray(saved.letters) ? saved.letters : freshCopy(defaultState.letters)
      };
      stateObj.user.id = stateObj.user.id || clientId;
      stateObj.keystrokes = Math.max(stateObj.keystrokes || 0, savedKeystrokes);
      if (!stateObj.contributions[stateObj.user.id]) {
        stateObj.contributions[stateObj.user.id] = {
          id: stateObj.user.id,
          name: stateObj.user.name,
          avatar: stateObj.user.avatar,
          totalZen: stateObj.zen || 0,
          todayZen: 0,
          lastDay: dayKey,
          details: { petCare: 0, treeHarvest: 0, keyboardZen: 0, keystrokes: stateObj.keystrokes, focusTimer: 0, chestReward: 0 },
          lastActive: Date.now()
        };
      }
      Object.values(stateObj.contributions).forEach(entry => {
        if (!entry) return;
        if (!entry.details) {
          entry.details = { petCare: 0, treeHarvest: 0, keyboardZen: 0, keystrokes: 0, focusTimer: 0, chestReward: 0 };
        }
        if (typeof entry.details.keystrokes !== 'number') {
          entry.details.keystrokes = (entry.id === stateObj.user.id ? stateObj.keystrokes : 0);
        }
        if (entry.lastDay !== dayKey) {
          entry.todayZen = 0;
          entry.lastDay = dayKey;
        }
      });
      if (stateObj.garden) {
        if (!stateObj.garden.houseStyle) stateObj.garden.houseStyle = 'cottage_lv1';
        if (!Array.isArray(stateObj.garden.unlockedHouses)) stateObj.garden.unlockedHouses = ['cottage_lv1'];
        if (Array.isArray(stateObj.garden.decorations)) {
          stateObj.garden.decorations.forEach(decor => {
            if (typeof decor.x === 'number') decor.x = Math.max(2, Math.min(92, decor.x));
            if (typeof decor.y === 'number') decor.y = Math.max(10, Math.min(82, decor.y));
          });
        }
      }
      if (stateObj.pets) {
        if (stateObj.pets.papa) {
          const info = getPetTitleInfo('papa', stateObj.pets.papa.level || 1);
          stateObj.pets.papa.title = info.title;
          stateObj.pets.papa.aura = info.aura;
          if (stateObj.pets.papa.shell === '#5f9682' || !stateObj.pets.papa.shell) {
            stateObj.pets.papa.shell = '#7e6338';
            stateObj.pets.papa.edge = '#3c2a16';
            stateObj.pets.papa.skin = '#9eb780';
            stateObj.pets.papa.glow = '#dab777';
            stateObj.pets.papa.kind = '棕壳草龟 · 湖畔巡游者';
          }
        }
        if (stateObj.pets.pumpkin) {
          const info = getPetTitleInfo('pumpkin', stateObj.pets.pumpkin.level || 1);
          stateObj.pets.pumpkin.title = info.title;
          stateObj.pets.pumpkin.aura = info.aura;
          if (stateObj.pets.pumpkin.shell === '#d68056' || !stateObj.pets.pumpkin.shell) {
            stateObj.pets.pumpkin.shell = '#6fae55';
            stateObj.pets.pumpkin.edge = '#28441c';
            stateObj.pets.pumpkin.skin = '#bfe682';
            stateObj.pets.pumpkin.glow = '#a8ec7d';
            stateObj.pets.pumpkin.kind = '嫩绿小龟 · 月下采集者';
          }
        }
      }
      return stateObj;
    } catch { return freshCopy(defaultState); }
  }
  let state = loadState();
  let currentHabitatFilter = 'all';
  let isDecorEditMode = false;
  let broadcast;
  let focusTimer;
  let currentModal = '';

  function recordKeystroke(count = 1, customUser = null) {
    const u = customUser || state.user;
    if (!u || !u.id) return;
    state.keystrokes = (state.keystrokes || 0) + count;
    localStorage.setItem(`${STORAGE_KEY}-keystrokes`, state.keystrokes);

    if (!state.contributions) state.contributions = {};
    if (!state.contributions[u.id]) {
      state.contributions[u.id] = {
        id: u.id,
        name: u.name || '共养者',
        avatar: u.avatar || '🐢',
        totalZen: 0,
        todayZen: 0,
        lastDay: dayKey,
        details: { petCare: 0, treeHarvest: 0, keyboardZen: 0, keystrokes: 0, focusTimer: 0, chestReward: 0 },
        lastActive: Date.now()
      };
    }
    const entry = state.contributions[u.id];
    if (!entry.details) {
      entry.details = { petCare: 0, treeHarvest: 0, keyboardZen: 0, keystrokes: 0, focusTimer: 0, chestReward: 0 };
    }
    entry.details.keystrokes = Math.max(state.keystrokes, (entry.details.keystrokes || 0) + count);
    entry.lastActive = Date.now();
  }

  function recordContribution(amount, category = 'petCare', customUser = null) {
    if (!amount || amount <= 0) return;
    const u = customUser || state.user;
    if (!u || !u.id) return;
    if (!state.contributions) state.contributions = {};
    if (!state.contributions[u.id]) {
      state.contributions[u.id] = {
        id: u.id,
        name: u.name || '共养者',
        avatar: u.avatar || '🐢',
        totalZen: 0,
        todayZen: 0,
        lastDay: dayKey,
        details: { petCare: 0, treeHarvest: 0, keyboardZen: 0, keystrokes: 0, focusTimer: 0, chestReward: 0 },
        lastActive: Date.now()
      };
    }
    const entry = state.contributions[u.id];
    entry.name = u.name || entry.name || '共养者';
    entry.avatar = u.avatar || entry.avatar || '🐢';
    if (entry.lastDay !== dayKey) {
      entry.todayZen = 0;
      entry.lastDay = dayKey;
    }
    entry.totalZen = (entry.totalZen || 0) + amount;
    entry.todayZen = (entry.todayZen || 0) + amount;
    if (!entry.details) {
      entry.details = { petCare: 0, treeHarvest: 0, keyboardZen: 0, focusTimer: 0, chestReward: 0 };
    }
    entry.details[category] = (entry.details[category] || 0) + amount;
    entry.lastActive = Date.now();
  }

  function toggleDecorEditMode(active) {
    isDecorEditMode = typeof active === 'boolean' ? active : !isDecorEditMode;
    const stage = $('#gardenStage');
    const banner = $('#layoutBanner');
    const btn = $('#layoutBtn');

    stage?.classList.toggle('layout-edit-mode', isDecorEditMode);
    if (banner) banner.classList.toggle('hidden', !isDecorEditMode);
    if (btn) btn.classList.toggle('active', isDecorEditMode);

    makeDraggable();

    if (isDecorEditMode) {
      toast('🛠️ 布置模式已开启', '按住黄色虚线框高亮的摆件与植物自由拖拽调位。');
    } else {
      sync(true);
      toast('✦ 布局已保存', '摆件最终位置已确认并固定。');
    }
  }

  function toggleTheme(targetTheme) {
    state.theme = targetTheme || (state.theme === 'day' ? 'night' : 'day');
    const isDay = state.theme === 'day';
    const sanctuary = $('#sanctuary');
    const btn = $('#themeBtn');

    if (sanctuary) sanctuary.classList.toggle('theme-day', isDay);
    if (btn) btn.innerHTML = isDay ? '🌙 夜晚' : '☀️ 白天';

    persist();
    toast('✦ 昼夜切换', isDay ? '已进入阳光明媚的白昼湖畔。' : '已进入静谧美好的星空夜晚。');
    sync(true);
  }
  const quotes = [
    '“慢慢长大，也是一种抵达。”',
    '“心安处，便是自己的湖畔。”',
    '“别忘了，温柔也需要练习。”',
    '“把今天的光，留一点给自己。”'
  ];
  const bubbleMessages = [
    ['喝口水吧', '帕帕说：慢一点，也没关系。'],
    ['该伸个懒腰啦', '小南瓜正在练习慢慢呼吸。'],
    ['一句湖畔絮语', '今天的你，也已经很努力了。']
  ];

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.sanctuaryDesktop?.sendSyncState(state);
  }
  function escapeHTML(text) { return String(text).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }
  function format(number) { return Number(number).toLocaleString('zh-CN'); }
  const hatIcons = {
    '竹笋帽': '🎋',
    '南瓜帽': '🎃',
    '草莓帽': '🍓',
    '金色王冠': '👑',
    '清凉荷叶': '🍃'
  };

  const defaultShells = {
    papa: { shell: '#7e6338', edge: '#3c2a16' },
    pumpkin: { shell: '#6fae55', edge: '#28441c' }
  };

  function showZen(amount, x, y) {
    const float = $('#zenFloat');
    float.textContent = `+${amount} Zen`;
    float.style.left = `${x ?? 51}%`;
    float.style.top = `${y ?? 59}%`;
    float.classList.remove('show'); void float.offsetWidth; float.classList.add('show');
  }
  function toast(title, body) {
    const el = document.createElement('div');
    el.className = 'toast'; el.innerHTML = `<b>${escapeHTML(title)}</b><br>${escapeHTML(body)}`;
    $('#toastStack').append(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 250); }, 3600);
  }
  function gainZen(amount, detail = '键盘禅意', category = 'keyboardZen') {
    state.zen += amount;
    recordContribution(amount, category);

    // 主力看护小龟获得 100% 经验，陪伴的另一只小龟也同步获得 100% 经验（两只小龟一起成长）
    const primaryId = state.selectedPet || 'papa';
    const secondaryId = primaryId === 'papa' ? 'pumpkin' : 'papa';

    addPetXp(primaryId, amount);
    addPetXp(secondaryId, amount);

    persist();
    render();
    showZen(amount);
    if (detail) $('#statusText').textContent = detail;
    sync();
  }

  const avatarPresets = [
    { emoji: '🐢', label: '帕帕草龟' },
    { emoji: '🎃', label: '南瓜橘壳' },
    { emoji: '🎋', label: '竹林小隐' },
    { emoji: '🌟', label: '星河行者' },
    { emoji: '🌸', label: '湖畔晨曦' },
    { emoji: '🍵', label: '禅茶一味' },
    { emoji: '🌙', label: '幽夜月影' },
    { emoji: '🍊', label: '硕果丰收' }
  ];

  function modal(content) {
    currentModal = content;
    $('#modal').innerHTML = content;
    $('#overlay').classList.remove('hidden');
    $('[data-close]', $('#modal'))?.addEventListener('click', closeModal);

    const isWidget = $('#appShell').classList.contains('widget-mode') || document.body.classList.contains('widget-body');
    if (isWidget) {
      $('#appShell').classList.add('widget-modal-open');
      window.sanctuaryDesktop?.setModalActive(true);
    }
  }

  function closeModal() {
    $('#overlay').classList.add('hidden');
    currentModal = '';
    const modalEl = $('#modal');
    if (modalEl) modalEl.className = 'modal';
    if ($('#appShell').classList.contains('widget-modal-open')) {
      $('#appShell').classList.remove('widget-modal-open');
      window.sanctuaryDesktop?.setModalActive(false);
    }
  }

