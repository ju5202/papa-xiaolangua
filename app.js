(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const STORAGE_KEY = 'papa-pumpkin-sanctuary-v1';
  const dayKey = new Date().toISOString().slice(0, 10);
  const defaultState = {
    zen: 2480,
    dailyCare: 3,
    channel: 'PAPA-0828',
    selectedPet: 'papa',
    chestOpened: false,
    focus: { seconds: 1500, running: false },
    pets: {
      papa: { id: 'papa', name: '帕帕', kind: '草龟 · 湖畔巡游者', level: 12, xp: 73, hunger: 86, happiness: 92, clean: 78, title: '温柔旅人', aura: '微光', shell: '#5f9682', edge: '#325f60', skin: '#8abc96', glow: '#8ee5c5', equipment: '竹笋帽', stage: 1 },
      pumpkin: { id: 'pumpkin', name: '小南瓜', kind: '橘壳龟 · 月下采集者', level: 9, xp: 41, hunger: 76, happiness: 88, clean: 84, title: '月光萌新', aura: '星芒', shell: '#d68056', edge: '#854a4f', skin: '#a4b77b', glow: '#f5ba89', equipment: '南瓜帽', stage: 2 }
    },
    garden: {
      plantStage: 3,
      harvested: false,
      decorations: [
        { id: 'cottage-1', type: 'cottage', label: '避风港小屋', x: 10, y: 63 },
        { id: 'tree-1', type: 'tree', label: '许愿古树', x: 33, y: 50 },
        { id: 'fountain-1', type: 'fountain', label: '月泉喷泉', x: 58, y: 65 },
        { id: 'plant-1', type: 'plant', label: '南瓜树 · 果实成熟', x: 77, y: 59 }
      ]
    },
    letters: [
      { from: '远方的共养者', body: '我刚给小南瓜换上南瓜帽，记得来看呀。', time: '今天 17:20' }
    ],
    owned: ['竹笋帽', '南瓜帽']
  };

  function freshCopy(value) { return JSON.parse(JSON.stringify(value)); }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return freshCopy(defaultState);
      return {
        ...freshCopy(defaultState), ...saved,
        focus: { ...defaultState.focus, ...saved.focus },
        pets: { ...freshCopy(defaultState.pets), ...saved.pets },
        garden: { ...freshCopy(defaultState.garden), ...saved.garden }
      };
    } catch { return freshCopy(defaultState); }
  }
  let state = loadState();
  let broadcast;
  let focusTimer;
  let currentModal = '';
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

  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function openChannel() {
    if (broadcast) broadcast.close();
    if (!('BroadcastChannel' in window)) return;
    broadcast = new BroadcastChannel(`sanctuary-${state.channel}`);
    broadcast.onmessage = (event) => {
      if (!event.data || event.data.source === 'self') return;
      if (event.data.type === 'state') {
        const incoming = event.data.payload;
        state = { ...state, ...incoming, focus: { ...state.focus, ...incoming.focus }, pets: incoming.pets || state.pets, garden: incoming.garden || state.garden };
        persist(); render();
        setSyncText('收到伙伴的庭院更新');
        toast('✦ 共养同步', '远方的湖畔有了新变化。');
      }
    };
  }
  function sync() { persist(); broadcast?.postMessage({ type: 'state', source: 'self', payload: state }); }
  function setSyncText(text) {
    $('#syncText').textContent = text;
    clearTimeout(setSyncText.timeout);
    setSyncText.timeout = setTimeout(() => { $('#syncText').textContent = '实时同步已开启'; }, 2200);
  }

  function escapeHTML(text) { return String(text).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[char])); }
  function format(number) { return Number(number).toLocaleString('zh-CN'); }
  function turtleMarkup(pet, extra = '') {
    return `<div class="turtle walking ${extra}" data-pet="${pet.id}" style="--shell:${pet.shell};--edge:${pet.edge};--skin:${pet.skin};--glow:${pet.glow};">
      <div class="aura"></div><div class="tail"></div><div class="body-shell"></div><div class="head"></div><div class="leg a"></div><div class="leg b"></div><span class="nameplate">${pet.name} · Lv.${pet.level}</span>
    </div>`;
  }
  function miniTurtleMarkup(pet) {
    return `<div class="mini-turtle" style="--pet-shell:${pet.shell};--pet-edge:${pet.edge};--pet-skin:${pet.skin}"><i class="shell"></i><i class="head"></i><i class="leg l1"></i><i class="leg l2"></i></div>`;
  }
  function decorationMarkup(decor) {
    const label = `<span class="tag">${decor.label}</span>`;
    if (decor.type === 'cottage') return `<div class="decor cottage" data-decor="${decor.id}" style="left:${decor.x}%;top:${decor.y}%;--layer:2">${label}<i class="roof"></i><i class="house"></i><i class="door"></i><i class="window"></i></div>`;
    if (decor.type === 'tree') return `<div class="decor tree" data-decor="${decor.id}" style="left:${decor.x}%;top:${decor.y}%;--layer:1">${label}<i class="trunk"></i><i class="foliage"></i><i class="fruit"></i></div>`;
    if (decor.type === 'fountain') return `<div class="decor fountain" data-decor="${decor.id}" style="left:${decor.x}%;top:${decor.y}%;--layer:3">${label}<i class="water"></i><i class="base"></i></div>`;
    if (decor.type === 'seed') return `<div class="decor seedling" data-decor="${decor.id}" style="left:${decor.x}%;top:${decor.y}%;--layer:3">${label}<i class="seed"></i></div>`;
    const fruit = state.garden.plantStage === 3 && !state.garden.harvested ? '<i class="plant-fruit"></i>' : '';
    return `<div class="decor plant" data-decor="${decor.id}" data-plant="true" style="left:${decor.x}%;top:${decor.y}%;--layer:3">${label}<i class="soil"></i><i class="stem"></i><i class="leaf l1"></i><i class="leaf l2"></i><i class="leaf l3"></i>${fruit}</div>`;
  }
  function renderPetCards() {
    $('#petCards').innerHTML = Object.values(state.pets).map(pet => `
      <article class="pet-card ${state.selectedPet === pet.id ? 'selected' : ''}" data-pet-card="${pet.id}" style="--pet-color:${pet.glow}">
        ${miniTurtleMarkup(pet)}
        <div class="pet-info"><div class="pet-name"><b>${pet.name}</b><span>Lv.${pet.level}</span></div><small>${pet.title} · ${pet.aura}气场</small><div class="xp-track"><i style="width:${pet.xp}%"></i></div></div>
      </article>`).join('');
  }
  function renderGarden() {
    $('#decorLayer').innerHTML = state.garden.decorations.map(decorationMarkup).join('');
    const papa = state.pets.papa, pumpkin = state.pets.pumpkin;
    $('#turtleLayer').innerHTML = `${turtleMarkup(papa, 'turtle-papa')}<style>.turtle-papa{left:43%;top:63%;}.turtle-pumpkin{left:20%;top:70%;animation-delay:-1.8s;}</style>${turtleMarkup(pumpkin, 'turtle-pumpkin')}`;
    $('#widgetTurtles').innerHTML = turtleMarkup(papa) + turtleMarkup(pumpkin);
    makeDraggable();
    $$('.turtle').forEach(turtle => turtle.addEventListener('click', () => petCelebrate(turtle.dataset.pet)));
    $$('.decor[data-plant]').forEach(plant => plant.addEventListener('dblclick', harvestPlant));
  }
  function render() {
    renderPetCards();
    renderGarden();
    $('#zenPoints').textContent = format(state.zen);
    $('#widgetZen').textContent = format(state.zen);
    $('#dailyProgress').textContent = `${state.dailyCare} / 5`;
    $('#dailyBar').style.width = `${Math.min(state.dailyCare * 20, 100)}%`;
    $('#channelId').textContent = `频道 · ${state.channel}`;
    $('#widgetMood').textContent = state.pets.papa.happiness > 85 ? '满心欢喜' : '想被抱抱';
    $('#mailPreview').textContent = state.letters.length ? `收到 ${state.letters.length} 封湖畔来信` : '给远方的 TA 写一封信';
    $('#chest').classList.toggle('opened', state.chestOpened);
    $('#chest').title = state.chestOpened ? '今日宝箱已开启，明天再来吧' : '打开今日探索宝箱';
    renderFocus();
  }
  function renderFocus() {
    const min = Math.floor(state.focus.seconds / 60).toString().padStart(2, '0');
    const sec = (state.focus.seconds % 60).toString().padStart(2, '0');
    $('#focusTime').textContent = `${min}:${sec}`;
    $('#focusBtn').innerHTML = state.focus.running ? '暂停专注 <span>Ⅱ</span>' : `${state.focus.seconds === 1500 ? '开始专注' : '继续专注'} <span>→</span>`;
  }
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
  function gainZen(amount, detail = '键盘禅意') {
    state.zen += amount;
    const selected = state.pets[state.selectedPet];
    selected.xp += amount;
    if (selected.xp >= 100) {
      selected.xp -= 100; selected.level += 1;
      const advancement = selected.level >= 15 ? ['神圣降世', '宇宙'] : selected.level >= 11 ? ['星河守护者', '星芒'] : ['温柔旅人', '微光'];
      selected.title = advancement[0]; selected.aura = advancement[1];
      toast('✦ 等级提升', `${selected.name} 升至 Lv.${selected.level}，解锁 ${selected.aura} 气场。`);
    }
    persist(); render(); showZen(amount); if (detail) $('#statusText').textContent = detail;
  }
  function petCelebrate(petId) {
    const pet = state.pets[petId];
    pet.happiness = Math.min(100, pet.happiness + 3); pet.clean = Math.min(100, pet.clean + 1);
    const turtle = $(`.garden-stage .turtle[data-pet="${petId}"]`);
    turtle?.classList.add('jump'); setTimeout(() => turtle?.classList.remove('jump'), 700);
    gainZen(3, `${pet.name} 开心地跃起！`); toast('♡ 抚摸成功', `${pet.name} 的快乐度 +3。`); sync();
  }
  function carePets() {
    Object.values(state.pets).forEach(pet => { pet.hunger = Math.min(100, pet.hunger + 5); pet.happiness = Math.min(100, pet.happiness + 5); pet.clean = Math.min(100, pet.clean + 4); });
    state.dailyCare = Math.min(5, state.dailyCare + 1);
    gainZen(12, '完成温柔照料');
    toast('✦ 照料完成', '两只小龟状态都变得更好了。'); sync();
  }
  function chestReward() {
    if (state.chestOpened) { toast('明日再会', '今日探索宝箱已经被你开启过了。'); return; }
    const reward = 80 + Math.floor(Math.random() * 71);
    state.chestOpened = true; state.zen += reward;
    $('#chest').classList.add('open'); setTimeout(() => $('#chest').classList.remove('open'), 800);
    render(); showZen(reward, 69, 60); toast('✦ 探险宝箱', `获得 ${reward} 禅意值与 1 颗月泉种子。`); sync();
  }
  function harvestPlant() {
    if (state.garden.plantStage < 3 || state.garden.harvested) { toast('还差一点', '这棵南瓜树正在努力成长。'); return; }
    state.garden.harvested = true; state.zen += 60; state.dailyCare = Math.min(5, state.dailyCare + 1);
    render(); showZen(60, 79, 67); toast('🍊 收获成功', '采下成熟果实，获得 60 禅意值。'); sync();
  }
  function makeDraggable() {
    $$('.decor').forEach(item => {
      let dragging = false, pointerOffset;
      item.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        dragging = true; item.setPointerCapture(event.pointerId);
        const rect = item.getBoundingClientRect(); pointerOffset = { x:event.clientX - rect.left, y:event.clientY - rect.top };
      });
      item.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        const stage = $('#gardenStage').getBoundingClientRect();
        const x = Math.max(0, Math.min(92, ((event.clientX - pointerOffset.x - stage.left) / stage.width) * 100));
        const y = Math.max(9, Math.min(83, ((event.clientY - pointerOffset.y - stage.top) / stage.height) * 100));
        item.style.left = `${x}%`; item.style.top = `${y}%`;
      });
      item.addEventListener('pointerup', (event) => {
        if (!dragging) return;
        dragging = false; item.releasePointerCapture(event.pointerId);
        const stage = $('#gardenStage').getBoundingClientRect();
        const rect = item.getBoundingClientRect();
        const decor = state.garden.decorations.find(d => d.id === item.dataset.decor);
        decor.x = Math.max(0, Math.min(92, ((rect.left - stage.left) / stage.width) * 100));
        decor.y = Math.max(9, Math.min(83, ((rect.top - stage.top) / stage.height) * 100));
        sync(); setSyncText('庭院布局已同步');
      });
    });
  }
  function lakeRipple(event) {
    if (event.target.closest('.decor, .turtle, .chest, .bubble-note')) return;
    const stage = $('#gardenStage').getBoundingClientRect();
    const ripple = document.createElement('i'); ripple.className = 'click-ripple';
    ripple.style.left = `${event.clientX - stage.left}px`; ripple.style.top = `${event.clientY - stage.top}px`;
    $('#gardenStage').append(ripple); setTimeout(() => ripple.remove(), 900);
  }
  function createSparkles() {
    const layer = $('#typingSparkles');
    for (let index = 0; index < 4; index++) {
      const spark = document.createElement('i'); spark.className = 'spark'; spark.textContent = index % 2 ? '·' : '✦';
      spark.style.left = `${38 + Math.random() * 24}%`; spark.style.top = `${61 + Math.random() * 9}%`;
      spark.style.setProperty('--x', `${(Math.random() - .5) * 48}px`); spark.style.setProperty('--y', `${-16 - Math.random() * 30}px`);
      layer.append(spark); setTimeout(() => spark.remove(), 650);
    }
  }
  let typed = 0;
  function keyboardReward(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1 || event.target.matches('input, textarea')) return;
    typed += 1; createSparkles();
    if (typed % 5 === 0) {
      gainZen(1, '键盘敲出一小片宁静');
      const turtle = $(`.garden-stage .turtle[data-pet="${state.selectedPet}"]`);
      turtle?.classList.add('jump'); setTimeout(() => turtle?.classList.remove('jump'), 700);
    }
  }
  function showBubble() {
    const [title, body] = bubbleMessages[Math.floor(Math.random() * bubbleMessages.length)];
    $('#bubbleTitle').textContent = title; $('#bubbleBody').textContent = body; $('#bubbleNote').classList.add('show');
    clearTimeout(showBubble.timeout); showBubble.timeout = setTimeout(() => $('#bubbleNote').classList.remove('show'), 7000);
  }
  function startFocus() {
    state.focus.running = !state.focus.running; persist(); renderFocus();
    if (state.focus.running) {
      focusTimer = setInterval(() => {
        state.focus.seconds -= 1;
        if (state.focus.seconds <= 0) {
          clearInterval(focusTimer); state.focus.seconds = 1500; state.focus.running = false;
          state.zen += 150; Object.values(state.pets).forEach(pet => pet.happiness = Math.min(100, pet.happiness + 8));
          toast('🍅 专注完成', '收下 150 禅意值，两只小龟的好感度 +8。'); sync(); render(); return;
        }
        persist(); renderFocus();
      }, 1000);
      toast('专注开始', '25 分钟里，湖畔会安静地陪伴你。');
    } else { clearInterval(focusTimer); toast('已暂停', '呼吸一下，随时可以继续。'); }
  }
  function chooseChannel() {
    modal(`
      <button class="modal-close" data-close>×</button><h2>双人共养频道</h2><p class="modal-subtitle">两端输入相同频道 ID，即可在同一浏览器档案或支持 BroadcastChannel 的窗口间同步庭院状态。</p>
      <div class="letter-form"><input id="channelInput" maxlength="24" value="${escapeHTML(state.channel)}" placeholder="例如 PAPA-0828"/><button class="modal-primary" id="saveChannel">加入频道</button></div>
      <p class="modal-subtitle" style="margin-top:12px">当前同步范围：摆件位置、种植/收获、装备、禅意值和飞鸽传书。</p>`);
    $('#saveChannel').onclick = () => {
      const value = $('#channelInput').value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
      if (!value) return toast('频道 ID 不能为空', '请填写一个短 ID。');
      state.channel = value; openChannel(); sync(); render(); closeModal(); toast('已连接湖畔', `正在频道 ${value} 中共养。`);
    };
  }
  const shopItems = [
    { name:'竹笋帽', icon:'🎋', cost:160, pet:'papa', category:'帽子' },
    { name:'南瓜帽', icon:'🎃', cost:180, pet:'pumpkin', category:'帽子' },
    { name:'翡翠龟壳', icon:'💚', cost:360, pet:'papa', category:'龟壳', shell:'#3ea08b' },
    { name:'黄金龟壳', icon:'🌞', cost:420, pet:'pumpkin', category:'龟壳', shell:'#d9a23f' },
    { name:'月泉树种', icon:'🌱', cost:240, type:'tree', category:'种子' },
    { name:'星尘喷泉', icon:'⛲', cost:520, type:'fountain', category:'摆件' }
  ];
  function showShop() {
    modal(`<button class="modal-close" data-close>×</button><h2>湖畔装扮铺</h2><p class="modal-subtitle">消耗禅意值，给小龟与庭院添一件喜欢的礼物。当前：✦ ${format(state.zen)}</p><div class="modal-grid">${shopItems.map(item => {
      const owned = state.owned.includes(item.name);
      return `<article class="shop-item"><span class="item-icon">${item.icon}</span><b>${item.name}</b><small>${item.cost} ZEN · ${item.category}</small><button data-buy="${item.name}" ${owned ? '' : state.zen < item.cost ? 'disabled' : ''}>${owned ? '装备 / 放置' : '购买'}</button></article>`;
    }).join('')}</div>`);
    $$('[data-buy]').forEach(button => button.onclick = () => buyItem(button.dataset.buy));
  }
  function buyItem(name) {
    const item = shopItems.find(entry => entry.name === name); const owned = state.owned.includes(name);
    if (!owned) { if (state.zen < item.cost) return; state.zen -= item.cost; state.owned.push(name); }
    if (item.pet) {
      const pet = state.pets[item.pet]; pet.equipment = item.name;
      if (item.shell) pet.shell = item.shell;
      toast('已装备', `${pet.name} 换上了${item.name}。`);
    } else {
      const id = `${item.type}-${Date.now()}`;
      state.garden.decorations.push({ id, type:item.type, label:item.name, x:48 + Math.random()*8, y:57 + Math.random()*9 });
      toast('已放入庭院', `${item.name} 已出现在湖畔中央，可继续拖拽摆放。`);
    }
    sync(); render(); showShop();
  }
  function showBuild() {
    modal(`<button class="modal-close" data-close>×</button><h2>庭院建造</h2><p class="modal-subtitle">添加新的景观后，直接在庭院拖拽即可自由布景。</p><div class="build-list"><button class="build-chip" data-build="cottage">🏠 避风港小屋</button><button class="build-chip" data-build="tree">🌳 许愿古树</button><button class="build-chip" data-build="fountain">⛲ 月泉喷泉</button><button class="build-chip" data-build="plant">🌱 南瓜树</button></div><button class="modal-primary harvest-button" id="growPlant">${state.garden.plantStage < 3 ? '浇水催生（下一阶段）' : state.garden.harvested ? '播下下一颗种子' : '果实成熟，双击庭院南瓜树采摘'}</button>`);
    $$('[data-build]').forEach(button => button.onclick = () => {
      const type = button.dataset.build;
      const names = { cottage:'避风港小屋', tree:'许愿古树', fountain:'月泉喷泉', plant:'南瓜树' };
      state.garden.decorations.push({ id:`${type}-${Date.now()}`, type, label:names[type], x:47, y:56 }); sync(); render(); closeModal(); toast('建造完成', `${names[type]} 已放置在庭院中央。`);
    });
    $('#growPlant').onclick = () => {
      if (state.garden.harvested) { state.garden.harvested = false; state.garden.plantStage = 0; toast('新的循环', '种子已入土，等待下一次成长。'); }
      else if (state.garden.plantStage < 3) { state.garden.plantStage += 1; toast('成长了', `南瓜树进入第 ${state.garden.plantStage + 1} 阶段。`); }
      else { return; }
      sync(); render(); showBuild();
    };
  }
  function showCollection() {
    const stages = ['种子', '幼苗', '成株', '结果'];
    modal(`<button class="modal-close" data-close>×</button><h2>圣域图鉴</h2><p class="modal-subtitle">陪伴的每一天，都有一点新发现。</p>
      <div class="collection-row"><b>帕帕 · 草龟</b><span>Lv.${state.pets.papa.level} · ${state.pets.papa.aura}</span></div>
      <div class="collection-row"><b>小南瓜 · 橘壳龟</b><span>Lv.${state.pets.pumpkin.level} · ${state.pets.pumpkin.aura}</span></div>
      <div class="collection-row"><b>南瓜树成长</b><span>${stages[state.garden.plantStage]} ${state.garden.harvested ? '· 已采摘' : ''}</span></div>
      <div class="collection-row"><b>已拥有装扮</b><span>${state.owned.length} 件</span></div>`);
  }
  function showMessenger() {
    modal(`<button class="modal-close" data-close>×</button><h2>飞鸽传书</h2><p class="modal-subtitle">频道 ${escapeHTML(state.channel)} · 把一小片心意送到远方的湖畔。</p><div class="mail-list">${state.letters.slice().reverse().map(letter => `<article class="letter"><b>${escapeHTML(letter.from)}</b><p>${escapeHTML(letter.body)}</p><small>${escapeHTML(letter.time)}</small></article>`).join('')}</div><div class="letter-form"><input id="letterInput" maxlength="80" placeholder="写下想说的话…"/><button class="modal-primary" id="sendLetter">寄出</button></div>`);
    $('#sendLetter').onclick = () => {
      const body = $('#letterInput').value.trim(); if (!body) return;
      state.letters.push({ from:'我', body, time:'刚刚' }); sync(); render(); toast('✉ 飞鸽已起飞', '信件已送往共养频道。'); showMessenger();
    };
  }
  function modal(content) {
    currentModal = content; $('#modal').innerHTML = content; $('#overlay').classList.remove('hidden');
    $('[data-close]', $('#modal'))?.addEventListener('click', closeModal);
  }
  function closeModal() { $('#overlay').classList.add('hidden'); currentModal = ''; }
  function toggleMode(force) {
    const shell = $('#appShell');
    const enabled = typeof force === 'boolean' ? force : !shell.classList.contains('widget-mode');
    shell.classList.toggle('widget-mode', enabled);
    $('#modeBtn').innerHTML = enabled ? '<span>⌂</span> 打开圣域' : '<span>◫</span> 任务栏挂件';
    $('#widgetMessage').textContent = enabled ? '正在任务栏巡逻' : '庭院正在展开';
    window.sanctuaryDesktop?.toggleCompact(enabled);
  }
  function bind() {
    $('#careBtn').onclick = carePets;
    $('#chest').onclick = chestReward;
    $('#gardenStage').addEventListener('click', lakeRipple);
    $('#bubbleNote button').onclick = () => $('#bubbleNote').classList.remove('show');
    $('#modeBtn').onclick = () => toggleMode(); $('#expandWidget').onclick = () => toggleMode(false);
    $('#pinBtn').onclick = () => { const active = $('#pinBtn').classList.toggle('active'); window.sanctuaryDesktop?.setAlwaysOnTop(active); toast(active ? '已置顶' : '取消置顶', active ? '湖畔将安静地浮在桌面上。' : '窗口已恢复普通层级。'); };
    $('#soundBtn').onclick = () => { const active = $('#soundBtn').classList.toggle('active'); toast(active ? '环境音开启' : '环境音静音', active ? '你听见了轻柔的水声。' : '湖畔暂时安静下来。'); };
    $('#focusBtn').onclick = startFocus; $('#focusSettings').onclick = () => { state.focus.seconds = 10; state.focus.running = false; clearInterval(focusTimer); persist(); renderFocus(); toast('测试专注时长', '已设为 10 秒，方便体验完成奖励。'); };
    $('#copyChannel').onclick = async () => { try { await navigator.clipboard.writeText(state.channel); toast('已复制', `频道 ID：${state.channel}`); } catch { toast('频道 ID', state.channel); } };
    $('.channel-card').onclick = chooseChannel;
    $('#openMessenger').onclick = showMessenger;
    $$('.nav-item').forEach(item => item.onclick = () => {
      $$('.nav-item').forEach(nav => nav.classList.toggle('active', nav === item));
      const panel = item.dataset.panel;
      if (panel === 'shop') showShop(); else if (panel === 'collection') showCollection(); else if (panel === 'build') showBuild(); else toast('庭院', '点击湖水可泛起涟漪，拖拽摆件即可布景。');
    });
    $('#overlay').addEventListener('click', event => { if (event.target === $('#overlay')) closeModal(); });
    document.addEventListener('keydown', keyboardReward);
    window.sanctuaryDesktop?.onCompactChanged(value => {
      $('#appShell').classList.toggle('widget-mode', value);
      $('#modeBtn').innerHTML = value ? '<span>⌂</span> 打开圣域' : '<span>◫</span> 任务栏挂件';
    });
  }
  function updateClock() { $('#gameTime').textContent = new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()); }
  function init() {
    // A new real day brings back the discovery chest without overwriting other progress.
    if (localStorage.getItem(`${STORAGE_KEY}-chest-day`) !== dayKey) { state.chestOpened = false; localStorage.setItem(`${STORAGE_KEY}-chest-day`, dayKey); persist(); }
    openChannel(); render(); bind(); updateClock(); setInterval(updateClock, 30000);
    setTimeout(showBubble, 4500); setInterval(showBubble, 70000);
    setInterval(() => { $('#quoteText').textContent = quotes[Math.floor(Math.random()*quotes.length)]; }, 180000);
    if (state.focus.running) { state.focus.running = false; persist(); toast('番茄钟已暂停', '重新打开后请手动继续专注。'); }
  }
  init();
})();
