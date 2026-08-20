/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — 模态弹窗与交互系统 (Modals & Feature Panels)
   ========================================================================== */
  function setFocusDuration(mins) {
    const clampedMins = Math.max(1, Math.min(60, Number(mins) || 25));
    state.focus.totalSeconds = clampedMins * 60;
    state.focus.seconds = clampedMins * 60;
    state.focus.running = false;
    clearInterval(focusTimer);
    persist();
    renderFocus();
    toast('⏱️ 时长已更新', `番茄钟专注时长已设置为 ${clampedMins} 分钟（最多 60 分钟）。`);
  }

  function showFocusSettingsModal() {
    const currentMins = Math.max(1, Math.min(60, Math.round((state.focus.totalSeconds || 1500) / 60)));
    modal(`
      <button class="modal-close" data-close>×</button>
      <h2>番茄专注时长设置</h2>
      <p class="modal-subtitle">自定义每次专注时长（支持 1 ~ 60 分钟），完成后帕帕和小南瓜将根据时长送出成长奖励！</p>
      
      <div class="focus-modal-content">
        <div class="slider-val-box">
          <span class="val-num" id="modalFocusMins">${currentMins}</span>
          <span class="val-unit">分钟</span>
        </div>
        <input type="range" id="modalFocusSlider" min="1" max="60" value="${currentMins}" class="focus-range-slider"/>
        
        <div class="reward-preview-card" id="focusRewardPreview">
          <b>🎁 完成奖励预览：</b>
          <div class="reward-chips">
            <span>✦ <span id="prevZen">${Math.max(10, Math.round((currentMins / 25) * 35))}</span> 禅意</span>
            <span>💖 +<span id="prevLove">${Math.min(20, Math.max(4, Math.round((currentMins / 25) * 10)))}</span> 好感度</span>
            <span>✨ +<span id="prevXp">${Math.max(5, Math.round((currentMins / 25) * 20))}</span> 经验 (双龟共享)</span>
          </div>
        </div>

        <div class="modal-btn-group">
          <button class="modal-primary" id="saveFocusMins">确认保存并应用</button>
        </div>
      </div>
    `);

    const slider = $('#modalFocusSlider');
    const valText = $('#modalFocusMins');
    const zenText = $('#prevZen');
    const loveText = $('#prevLove');
    const xpText = $('#prevXp');

    slider.oninput = () => {
      const mins = Number(slider.value);
      valText.textContent = mins;
      zenText.textContent = Math.max(10, Math.round((mins / 25) * 35));
      loveText.textContent = Math.min(20, Math.max(4, Math.round((mins / 25) * 10)));
      xpText.textContent = Math.max(5, Math.round((mins / 25) * 20));
    };

    $('#saveFocusMins').onclick = () => {
      setFocusDuration(slider.value);
      closeModal();
    };
  }

  function startFocus() {
    state.focus.running = !state.focus.running;
    persist();
    renderFocus();

    if (state.focus.running) {
      const totalMins = Math.max(1, Math.round((state.focus.totalSeconds || 1500) / 60));
      focusTimer = setInterval(() => {
        state.focus.seconds -= 1;
        if (state.focus.seconds <= 0) {
          clearInterval(focusTimer);
          const finishedMins = Math.max(1, Math.round((state.focus.totalSeconds || 1500) / 60));
          state.focus.seconds = state.focus.totalSeconds || 1500;
          state.focus.running = false;

          // 按照专注时长动态计算奖励（受府邸被动加成）
          let zenBonusMult = 1.0;
          let xpBonusMult = 1.0;
          const curHStyle = state.garden?.houseStyle;
          if (curHStyle === 'cottage_lv3') zenBonusMult += 0.10;
          if (curHStyle === 'cottage_lv4') xpBonusMult += 0.15;
          if (curHStyle === 'cottage_lv5') { zenBonusMult += 0.20; xpBonusMult += 0.20; }

          const rewardZen = Math.round(Math.max(10, Math.round((finishedMins / 25) * 35)) * zenBonusMult);
          const rewardXp = Math.round(Math.max(5, Math.round((finishedMins / 25) * 20)) * xpBonusMult);
          const rewardHappiness = Math.min(20, Math.max(4, Math.round((finishedMins / 25) * 10)));

          state.zen += rewardZen;
          recordContribution(rewardZen, 'focusTimer');
          state.dailyCare = Math.min(5, state.dailyCare + 1);

          Object.values(state.pets).forEach(pet => {
            pet.happiness = Math.min(100, pet.happiness + rewardHappiness);
            pet.clean = Math.min(100, pet.clean + 4);
          });

          // 帕帕与小南瓜共同获得丰厚经验
          addPetXp('papa', rewardXp, 'xp');
          addPetXp('pumpkin', rewardXp, 'xp');

          // 两只小乌龟头顶升起爱心与好感度气泡
          showPetFloat('papa', `💖 好感 +${rewardHappiness}`, 'love');
          showPetFloat('pumpkin', `💖 好感 +${rewardHappiness}`, 'love');

          // 小乌龟欢快雀跃动画
          $$('.garden-stage .turtle').forEach(t => {
            t.classList.add('jump');
            setTimeout(() => t.classList.remove('jump'), 1400);
          });

          // 华丽庆祝微光
          createCelebrationSparkles();

          // 气泡表扬与鼓励
          const praiseList = [
            ['🐢 帕帕欢呼道', `“太棒啦！你专心致志地完成了 ${finishedMins} 分钟的专注，湖畔因你的静心变得更加明亮了～”`],
            ['🎃 小南瓜雀跃道', `“辛苦啦！帕帕和我为你摘来了最甜的果子，好好伸个懒腰休息一下吧～”`],
            ['🐢 帕帕 & 小南瓜', `“恭喜圆满完成专注修行！收下 ${rewardZen} 禅意与丰厚成长经验，我们会一直陪伴你～”`]
          ];
          const [pTitle, pBody] = praiseList[Math.floor(Math.random() * praiseList.length)];
          $('#bubbleTitle').textContent = pTitle;
          $('#bubbleBody').textContent = pBody;
          $('#bubbleNote').classList.add('show');
          clearTimeout(showBubble.timeout);
          showBubble.timeout = setTimeout(() => $('#bubbleNote').classList.remove('show'), 9000);

          toast('🍅 专注圆满达成！', `太棒了！已完成 ${finishedMins} 分钟静心专注，帕帕与小南瓜好感度 +${rewardHappiness} 并各获 +${rewardXp} 经验！`);

          sync(true);
          render();
          return;
        }
        persist();
        renderFocus();
      }, 1000);
      toast('🍅 专注开始', `${totalMins} 分钟里，湖畔会安静地守护并陪伴你。`);
    } else {
      clearInterval(focusTimer);
      toast('已暂停专注', '呼吸一下，随时可以点击继续。');
    }
  }
  function chooseChannel() {
    modal(`
      <button class="modal-close" data-close>×</button><h2>双人共养频道</h2><p class="modal-subtitle">两端输入相同频道 ID，即可在同一浏览器档案或支持 BroadcastChannel 的窗口间同步庭院状态。</p>
      <div class="letter-form"><input id="channelInput" maxlength="24" value="${escapeHTML(state.channel)}" placeholder="例如 PAPA-0828"/><button class="modal-primary" id="saveChannel">加入频道</button></div>
      <p class="modal-subtitle" style="margin-top:12px">当前同步范围：摆件位置、种植/收获、装备、禅意值和飞鸽传书。</p>`);
    $('#saveChannel').onclick = () => {
      const value = $('#channelInput').value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
      if (!value) return toast('频道 ID 不能为空', '请填写一个短 ID。');
      state.channel = value; openChannel(); sync(true); render(); closeModal(); toast('已连接湖畔', `正在频道 ${value} 中共养。`);
    };
  }
  const shopItems = [
    { name: '竹笋帽', icon: '🎋', cost: 30, category: '帽子', wearable: '🎋' },
    { name: '南瓜帽', icon: '🎃', cost: 40, category: '帽子', wearable: '🎃' },
    { name: '草莓帽', icon: '🍓', cost: 45, category: '帽子', wearable: '🍓' },
    { name: '金色王冠', icon: '👑', cost: 80, category: '帽子', wearable: '👑' },
    { name: '清凉荷叶', icon: '🍃', cost: 35, category: '帽子', wearable: '🍃' },
    { name: '粉嫩蝴蝶结', icon: '🎀', cost: 35, category: '帽子', wearable: '🎀' },
    { name: '向日葵花环', icon: '🌻', cost: 40, category: '帽子', wearable: '🌻' },
    { name: '萌萌小黄鸭', icon: '🐥', cost: 50, category: '帽子', wearable: '🐥' },
    { name: '幸运四叶草', icon: '🍀', cost: 35, category: '帽子', wearable: '🍀' },
    { name: '红白巫师菇', icon: '🍄', cost: 45, category: '帽子', wearable: '🍄' },
    { name: '闪耀独角兽角', icon: '🦄', cost: 85, category: '帽子', wearable: '🦄' },
    { name: '星空魔术礼帽', icon: '🎩', cost: 70, category: '帽子', wearable: '🎩' },
    { name: '天使光环', icon: '😇', cost: 90, category: '帽子', wearable: '😇' },
    { name: '海盗三角帽', icon: '🏴‍☠️', cost: 65, category: '帽子', wearable: '🏴‍☠️' },
    { name: '樱花发簪', icon: '🌸', cost: 40, category: '帽子', wearable: '🌸' },
    { name: '暖冬针织帽', icon: '🧶', cost: 45, category: '帽子', wearable: '🧶' },
    { name: '潜水探险镜', icon: '🤿', cost: 55, category: '帽子', wearable: '🤿' },
    { name: '飞行员护目镜', icon: '🕶️', cost: 60, category: '帽子', wearable: '🕶️' },
    { name: '翡翠龟壳', icon: '💚', cost: 90, category: '龟壳', shell: '#3ea08b', edge: '#23594d' },
    { name: '黄金龟壳', icon: '🌞', cost: 120, category: '龟壳', shell: '#d9a23f', edge: '#8e631c' },
    { name: '幽紫星壳', icon: '🔮', cost: 130, category: '龟壳', shell: '#7a52aa', edge: '#4a2f6b' },
    { name: '樱花粉壳', icon: '🌸', cost: 110, category: '龟壳', shell: '#e87ea1', edge: '#994762' },
    { name: '许愿树种子', icon: '🌱', cost: 40, type: 'tree', category: '树种' },
    { name: '南瓜树种子', icon: '🍊', cost: 50, type: 'plant', category: '树种' },
    { name: '月泉喷泉', icon: '⛲', cost: 150, type: 'fountain', category: '摆件' }
  ];

  function showShop() {
    const papa = state.pets.papa;
    const pumpkin = state.pets.pumpkin;

    const cardsHtml = shopItems.map(item => {
      const isTreeSeed = item.category === '树种' || item.type === 'tree' || item.type === 'plant';
      const isDecor = item.type === 'fountain' || item.category === '摆件';
      const isWearable = item.category === '帽子' || item.category === '龟壳';
      const owned = !isTreeSeed && state.owned.includes(item.name);

      let actionButtons = '';

      if (isTreeSeed || isDecor) {
        actionButtons = `<button data-buy="${item.name}" ${state.zen < item.cost ? 'disabled' : ''}>${isTreeSeed ? '🌱 购买种子' : '⛲ 购买摆件'} (${item.cost} ZEN)</button>`;
      } else if (isWearable) {
        if (!owned) {
          actionButtons = `<button data-buy="${item.name}" ${state.zen < item.cost ? 'disabled' : ''}>✦ 购买解锁 (${item.cost} ZEN)</button>`;
        } else {
          // 已解锁：支持分别给帕帕和小南瓜穿戴/卸下
          let papaActive = false;
          let pumpkinActive = false;

          if (item.category === '帽子') {
            papaActive = papa.equipment === item.name;
            pumpkinActive = pumpkin.equipment === item.name;
          } else if (item.category === '龟壳') {
            papaActive = papa.shell === item.shell;
            pumpkinActive = pumpkin.shell === item.shell;
          }

          actionButtons = `
            <div class="equip-targets">
              <button class="target-btn ${papaActive ? 'equipped' : ''}" data-equip="${item.name}" data-target="papa">
                🐢 帕帕: ${papaActive ? '已穿戴 ✕' : '穿戴'}
              </button>
              <button class="target-btn ${pumpkinActive ? 'equipped' : ''}" data-equip="${item.name}" data-target="pumpkin">
                🎃 小南瓜: ${pumpkinActive ? '已穿戴 ✕' : '穿戴'}
              </button>
            </div>
          `;
        }
      }

      return `
        <article class="shop-item ${owned ? 'item-owned' : ''}">
          <span class="item-icon">${item.icon}</span>
          <b>${item.name}</b>
          <small>${item.category} ${owned ? '· <span class="owned-tag">已拥有</span>' : `· ${item.cost} ZEN`}</small>
          ${actionButtons}
        </article>
      `;
    }).join('');

    modal(`
      <button class="modal-close" data-close>×</button>
      <div class="shop-modal-top-row" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:6px;">
        <h2 style="margin:0;">湖畔装扮铺</h2>
        <button class="shop-house-workshop-btn" id="openHouseWorkshopFromShop" style="padding:5px 12px;border-radius:8px;font-size:12px;font-weight:700;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(217,119,6,0.4);">🏡 房屋升级与换装 ↗</button>
      </div>
      <p class="modal-subtitle">消耗禅意值解锁服饰与装扮，支持自由指定给<b>帕帕</b>或<b>小南瓜</b>穿戴！当前禅意：✦ ${format(state.zen)}</p>
      <div class="modal-grid shop-grid">${cardsHtml}</div>
    `);

    if ($('#openHouseWorkshopFromShop')) {
      $('#openHouseWorkshopFromShop').onclick = () => {
        showHouseWorkshopModal();
      };
    }

    // 绑定购买事件
    $$('[data-buy]').forEach(btn => {
      btn.onclick = () => buyItem(btn.dataset.buy);
    });

    // 绑定指定乌龟穿戴/卸下事件
    $$('[data-equip]').forEach(btn => {
      btn.onclick = () => toggleEquip(btn.dataset.equip, btn.dataset.target);
    });
  }

  function toggleEquip(itemName, petId) {
    const item = shopItems.find(entry => entry.name === itemName);
    if (!item) return;
    const pet = state.pets[petId];
    if (!pet) return;

    if (item.category === '帽子') {
      if (pet.equipment === itemName) {
        pet.equipment = '';
        toast('✦ 已卸下装扮', `${pet.name} 卸下了 ${itemName}。`);
      } else {
        pet.equipment = itemName;
        toast('✦ 换装成功', `${pet.name} 戴上了 ${itemName}！`);
      }
    } else if (item.category === '龟壳') {
      if (item.shell && pet.shell === item.shell) {
        // 恢复默认壳色
        const def = defaultShells[petId] || defaultShells.papa;
        pet.shell = def.shell;
        pet.edge = def.edge;
        toast('✦ 恢复原本龟壳', `${pet.name} 换回了经典龟壳。`);
      } else if (item.shell) {
        pet.shell = item.shell;
        if (item.edge) pet.edge = item.edge;
        toast('✦ 换装成功', `${pet.name} 换上了华丽的 ${itemName}！`);
      }
    }

    persist();
    sync(true);
    render();
    showShop();
  }

  function buyItem(name) {
    const item = shopItems.find(entry => entry.name === name);
    if (!item) return;
    const isTreeSeed = item.category === '树种' || item.type === 'tree' || item.type === 'plant';
    const isDecor = item.type === 'fountain' || item.category === '摆件';
    const owned = state.owned.includes(name);

    if (!owned || isTreeSeed || isDecor) {
      if (!spendZen(item.cost, `购买${item.name}`)) {
        return toast('禅意不够', `购买 ${item.name} 需要 ${item.cost} 禅意值。`);
      }
      if (!isTreeSeed && !isDecor) {
        state.owned.push(name);
      }
    }

    if (isTreeSeed || isDecor) {
      const id = `${item.type}-${Date.now()}`;
      const pos = getDefaultSpawnPos(item.type);
      const isTree = isTreeSeed;
      state.garden.decorations.push({
        id,
        type: item.type,
        label: item.name.replace('种子', ''),
        stage: isTree ? 0 : 3,
        harvested: false,
        lastStageTime: Date.now(),
        updatedAt: Date.now(),
        x: pos.x,
        y: pos.y
      });
      persist();
      sync(true);
      render();
      closeModal();
      toggleDecorEditMode(true);
      if (isTree) {
        toast('🌱 成功种植', `${item.name} 已播下！每 15 分钟自动进入下一个生长阶段！`);
      } else {
        toast('已放入庭院', `${item.name} 已放置，现已开启【布置模式】，可随意调位。`);
      }
    } else {
      // 购买装扮后刷新商店，引导玩家选择给哪只乌龟穿戴
      persist();
      sync(true);
      render();
      showShop();
      toast('🎉 解锁成功', `成功解锁【${item.name}】！点击下方按钮即可给帕帕或小南瓜穿戴。`);
    }
  }

  function showCollection() {
    const papa = state.pets.papa;
    const pumpkin = state.pets.pumpkin;
    const papaTitleInfo = getPetTitleInfo('papa', papa.level);
    const pumpkinTitleInfo = getPetTitleInfo('pumpkin', pumpkin.level);

    // 1. 乌龟成长树 HTML
    const renderTitleTree = (petId, pet) => {
      const list = PET_TITLE_TIERS[petId] || [];
      return list.map(t => {
        const isCurrent = pet.level >= t.minLevel && pet.level <= t.maxLevel;
        const isUnlocked = pet.level >= t.minLevel;
        return `
          <div class="title-tree-item ${isCurrent ? 'current' : (isUnlocked ? 'unlocked' : 'locked')}">
            <div class="tier-badge">${t.icon} Lv.${t.minLevel}${t.maxLevel < 900 ? `~${t.maxLevel}` : '+'}</div>
            <div class="tier-info">
              <b>${t.title} <span class="tier-aura">✦ 气场: ${t.aura}</span> ${isCurrent ? '<span class="current-tag">当前佩戴</span>' : ''}</b>
              <p>${t.desc}</p>
            </div>
          </div>
        `;
      }).join('');
    };

    // 2. 乌龟海克斯主动技能与被动秘宝 HTML
    const fighterSkills = [
      { name: '旋风斩', icon: '🌀', type: '战士主动', cost: '30 MP | CD 2', desc: '造成 160% 力量物理伤害，并撕裂护甲 25% (持续 2 回合)' },
      { name: '不屈战旗', icon: '🛡️', type: '战士主动', cost: '35 MP | CD 3', desc: '获得自身最大生命 35% 坚韧护盾，防御提升 30% (持续 3 回合)' },
      { name: '巨力破甲震', icon: '💥', type: '战士主动', cost: '40 MP | CD 3', desc: '单体 240% 重击伤害，并有 60% 几率眩晕目标 1 回合打断蓄力' },
      { name: '天崩地裂', icon: '🌋', type: '战士主动', cost: '55 MP | CD 4', desc: '造成 300% 力量毁灭重击，大地崩裂降低敌方 40% 速度 (持续 2 回合)' }
    ];
    const mageSkills = [
      { name: '烈焰风暴', icon: '🔥', type: '法师主动', cost: '35 MP | CD 2', desc: '造成 180% 力量法术伤害，附加 3 回合灼烧 (每回合持续造成 35% 伤害)' },
      { name: '极寒冰封', icon: '❄️', type: '法师主动', cost: '40 MP | CD 3', desc: '造成 200% 力量法术伤害，60% 几率极寒冻结目标 1 回合' },
      { name: '奥术弹幕', icon: '⚡', type: '法师主动', cost: '45 MP | CD 2', desc: '发射 4 枚奥术飞弹，每枚造成 65% 伤害 (共计造成 260% 高频法术打击)' },
      { name: '引雷天罚', icon: '🌩️', type: '法师主动', cost: '60 MP | CD 4', desc: '引动九天太虚神雷，造成 340% 爆发雷暴毁灭打击' }
    ];
    const passivesList = [
      { name: '嗜血猎杀', icon: '🩸', type: '海克斯被动', rarity: 'epic', desc: '每次攻击或施法命中敌人，将造成伤害的 25% 转化为自身真实生命' },
      { name: '致命节奏', icon: '⚡', type: '海克斯被动', rarity: 'epic', desc: '每次攻击使自身身法速度 +4，暴击几率永久提升 +3% (战斗内可无限叠加)' },
      { name: '荆棘神甲', icon: '🌵', type: '海克斯被动', rarity: 'epic', desc: '受到物理伤害时，将受到伤害的 35% 作为真实反伤反弹给攻击者' },
      { name: '先发制人', icon: '⚔️', type: '海克斯被动', rarity: 'epic', desc: '洞察先机，进入任何关卡时必定获得第一回合先手行动权' },
      { name: '神圣斩杀', icon: '👑', type: '海克斯被动', rarity: 'epic', desc: '对敌方造成额外伤害，附加敌方已损失生命值 18% 的神圣真实伤害' },
      { name: '泰坦之血', icon: '💎', type: '神话秘宝', rarity: 'mythic', desc: '【神话核心】生命上限、力量、防御、身法全属性瞬间爆发提升 +25%！' },
      { name: '钢铁意志', icon: '🛡️', type: '神话秘宝', rarity: 'mythic', desc: '【神话核心】受到致命伤害时免疫死亡，血量锁定为 1 点并获得 50% 绝境护盾！' }
    ];

    // 3. 怪物图鉴 (5 大章节小兵、精英与 BOSS)
    const monsterBook = [
      {
        chapter: '第 1 章 · 枯骨幽穴',
        monsters: [
          { name: '骷髅斥候', avatar: '💀', tag: '狂暴强攻', desc: '深渊前哨探子，攻击迅猛带破甲' },
          { name: '腐蚀泥怪', avatar: '🦠', tag: '铁壁坚甲', desc: '深渊污泥凝聚，拥有坚韧外皮' },
          { name: '暗影蝙蝠', avatar: '🦇', tag: '剧毒暗袭', desc: '幽夜嗜血魔物，攻击附带真伤剧毒' },
          { name: '幽魂游侠', avatar: '🏹', tag: '元素奥法', desc: '游荡于幽穴的亡魂射手，法术穿透' },
          { name: '怨灵祭司', avatar: '🔮', tag: '元素奥法', desc: '吟唱深渊诅咒，附带烈焰灼烧' },
          { name: '【幽冥骨魔】', avatar: '💀', tag: '领主 BOSS', isBoss: true, trait: '💀 枯骨护体: 初始拥有自身 20% 最大生命护盾', desc: '枯骨幽穴终极领主，白骨重甲坚不可摧' }
        ]
      },
      {
        chapter: '第 2 章 · 剧毒蛛巢',
        monsters: [
          { name: '剧毒幼蛛', avatar: '🕷️', tag: '剧毒暗袭', desc: '巢穴中孵化的幼年毒蛛，带有猛烈神经毒素' },
          { name: '蚀骨狼蛛', avatar: '🕸️', tag: '剧毒暗袭', desc: '撕裂中毒猎物造成 30% 额外爆发伤害' },
          { name: '幽暗潜伏者', avatar: '🥷', tag: '狂暴强攻', desc: '潜伏于蛛网暗处伺机突袭' },
          { name: '毒囊飞蛾', avatar: '🦋', tag: '元素奥法', desc: '散播毒粉孢子，附带减速迟缓' },
          { name: '绿毒守卫', avatar: '🛡️', tag: '铁壁坚甲', desc: '分泌酸液凝成甲壳的坚固守卫' },
          { name: '【毒煞蛛皇】', avatar: '🕷️', tag: '领主 BOSS', isBoss: true, trait: '🕷️ 猛毒蛛丝: 攻击必带中毒，受击 35% 反弹蛛网减速', desc: '蛛巢主宰，毒液可腐蚀万物生灵' }
        ]
      },
      {
        chapter: '第 3 章 · 熔岩炼狱',
        monsters: [
          { name: '熔岩魔犬', avatar: '🐕‍🦺', tag: '狂暴强攻', desc: '在地火中奔腾的炎兽，嗜血狂暴' },
          { name: '爆裂幼龙', avatar: '🐉', tag: '元素奥法', desc: '喷吐烈焰爆弹，附带持续灼烧' },
          { name: '灰烬魔人', avatar: '🗿', tag: '铁壁坚甲', desc: '熔岩冷却后的黑曜石之躯' },
          { name: '烈焰法师', avatar: '🧙‍♂️', tag: '元素奥法', desc: '引动地心烈火，轰击大范围法爆' },
          { name: '熔铸傀儡', avatar: '🤖', tag: '狂暴强攻', desc: '以炽热铁水铸造的重甲魔傀' },
          { name: '【炎狱巨兽】', avatar: '🔥', tag: '领主 BOSS', isBoss: true, trait: '🔥 熔火躯体: 反弹 15% 物理伤害并附带烈焰真伤', desc: '地核深处诞生的熔岩泰坦，周身永燃不熄' }
        ]
      },
      {
        chapter: '第 4 章 · 虚空回廊',
        monsters: [
          { name: '虚空行者', avatar: '🌌', tag: '元素奥法', desc: '穿梭于虚空缝隙的奥秘使徒' },
          { name: '暗影裂片', avatar: '🌑', tag: '剧毒暗袭', desc: '虚空暗影具象化的高速刺客' },
          { name: '蚀魂魔眼', avatar: '👁️', tag: '元素奥法', desc: '凝视目标心神，施加迟缓诅咒' },
          { name: '虚空狂信徒', avatar: '🦹', tag: '狂暴强攻', desc: '献祭神智换取狂暴力量的信徒' },
          { name: '暗影巨灵', avatar: '🗿', tag: '铁壁坚甲', desc: '凝固的虚空暗物质壁垒' },
          { name: '裂隙追猎者', avatar: '🐅', tag: '剧毒暗袭', desc: '在时空裂隙中巡猎猎物的恶兽' },
          { name: '【虚空影侍】', avatar: '👁️', tag: '精英怪', isElite: true, trait: '⚔️ 精英强韧: 拥有高额生命与坚固外壳', desc: '领主座下护法影侍，身法诡秘' },
          { name: '【虚空领主】', avatar: '🌌', tag: '领主 BOSS', isBoss: true, trait: '🌌 虚空闪烁: 拥有 15% 概率完全闪避攻击', desc: '虚空维度的统治者，能扭曲空间折跃' }
        ]
      },
      {
        chapter: '第 5 章 · 魔渊终界',
        monsters: [
          { name: '混沌魔将', avatar: '👹', tag: '铁壁坚甲', desc: '镇守终界的混沌重甲先锋' },
          { name: '终焉血裔', avatar: '🩸', tag: '剧毒暗袭', desc: '流淌远古魔神之血的暗夜刺客' },
          { name: '灭世魔像', avatar: '🗿', tag: '狂暴强攻', desc: '以毁灭意志驱动的万丈石像' },
          { name: '灾厄预言家', avatar: '📜', tag: '元素奥法', desc: '吟诵末日诗篇引发湮灭天罚' },
          { name: '深渊龙仆', avatar: '🐲', tag: '狂暴强攻', desc: '终焉古神的近卫龙族仆从' },
          { name: '【混沌裁决者】', avatar: '⚖️', tag: '精英怪', isElite: true, trait: '⚔️ 精英强韧: 掌控混沌天平，裁决一切入侵者', desc: '终焉神殿前最后的混沌守门人' },
          { name: '【魔渊终焉之神】', avatar: '☬', tag: '终极 BOSS', isBoss: true, trait: '☬ 终焉狂暴: 低于 50% 生命爆发神魔狂暴 (+30% ATK/SPD)', desc: '深渊源头的创世魔神，掌管毁灭与诸神黄昏' }
        ]
      }
    ];

    // 4. 怪物技能与绝技库
    const monsterSkillsBook = [
      {
        archetype: '⚔️ 狂暴强攻型技能',
        skills: [
          { name: '破甲重击', icon: '⚔️', type: '常规技能', mult: '125% 伤害', desc: '造成 125% 物理重击并撕裂目标 20% 防御 (持续 2 回合)' },
          { name: '顺劈狂斩', icon: '🪓', type: '常规技能', mult: '115% 伤害', desc: '快速挥舞锋利刀刃，造成 115% 连续物理伤害' },
          { name: '血怒狂绝斩', icon: '💥', type: '怒气绝技 (满怒释放)', mult: '175% 爆发伤害', isUlt: true, desc: '消耗 100% 怒气，爆发 175% 狂暴巨额真伤并引发全屏剧烈震颤' }
        ]
      },
      {
        archetype: '☠️ 剧毒暗袭型技能',
        skills: [
          { name: '剧毒刺击', icon: '🗡️', type: '常规技能', mult: '85% 伤害', desc: '造成 85% 穿刺伤害并附加 2 回合剧毒 (每回合持续造成 25% 真实伤害)' },
          { name: '蚀骨撕裂', icon: '🩸', type: '常规技能', mult: '120% 伤害', desc: '造成 120% 撕裂伤害 (若目标已中毒，伤害额外提升 30%)' },
          { name: '万毒穿心煞', icon: '☠️', type: '怒气绝技 (满怒释放)', mult: '150% 爆发伤害', isUlt: true, desc: '消耗 100% 怒气，造成 150% 毒煞伤害并燃烧乌龟 20 点法力/战意！' }
        ]
      },
      {
        archetype: '🔮 元素奥法型技能',
        skills: [
          { name: '烈焰天火', icon: '🔥', type: '常规技能', mult: '125% 伤害', desc: '造成 125% 烈焰法术伤害并附加 2 回合灼烧持续伤害' },
          { name: '寒霜迟缓', icon: '❄️', type: '常规技能', mult: '90% 伤害', desc: '造成 90% 冰霜伤害并降低目标 30% 身法速度 (持续 2 回合)' },
          { name: '湮灭天陨', icon: '☄️', type: '怒气绝技 (满怒释放)', mult: '190% 毁灭打击', isUlt: true, desc: '消耗 100% 怒气，吟唱召唤天外巨大流星陨石造成 190% 毁灭打击！' }
        ]
      },
      {
        archetype: '🛡️ 铁壁坚甲型技能',
        skills: [
          { name: '重盾猛击', icon: '🛡️', type: '常规技能', mult: '95% 伤害', desc: '挥舞沉重巨盾猛烈撞击目标，造成 95% 钝击伤害' },
          { name: '冥石固化', icon: '🧱', type: '常规技能', mult: '构筑 20% 岩盾', desc: '凝聚地脉岩层为自身构筑相当于自身最大生命 20% 的坚固岩盾' },
          { name: '泰坦崩裂波', icon: '🌋', type: '怒气绝技 (满怒释放)', mult: '155% 伤害 + 碎盾', isUlt: true, desc: '消耗 100% 怒气，造成 155% 崩裂重击并瞬间震碎乌龟身上的所有护盾！' }
        ]
      },
      {
        archetype: '☬ 深渊领主专属神技',
        skills: [
          { name: '深渊汲取', icon: '🩸', type: '领主专属', mult: '110% 伤害 + 40% 吸血', desc: '造成 110% 伤害并将伤害的 40% 转化为自身真实生命' },
          { name: '领主威压', icon: '👑', type: '领主专属', mult: '120% 伤害 + 压制15%攻击', desc: '造成 120% 伤害并压制乌龟 15% 力量 (持续 2 回合)' },
          { name: '暗影狂澜', icon: '👤', type: '领主专属', mult: '135% 伤害', desc: '挥洒 3 道暗影利刃造成 135% 连击物理法术双重打击' },
          { name: '诸神黄昏 · 终焉神罚', icon: '☬', type: '终极领主绝技 (满怒释放)', mult: '210% 毁灭神罚', isUlt: true, desc: '引动深渊最深处的魔神核心，引发全屏终焉天罚，造成 210% 终极大绝杀！' }
        ]
      }
    ];

    modal(`
      <div class="compendium-modal-box">
        <button class="modal-close" data-close>×</button>
        <div class="compendium-header">
          <div>
            <h2>✦ 圣域与魔渊万象图鉴 ✦</h2>
            <small>收录湖畔乌龟成长境界、海克斯奥秘神技与魔渊领主魔物图谱</small>
          </div>
        </div>

        <div class="compendium-nav" role="tablist">
          <button class="comp-tab-btn active" data-tab="turtles">🐢 乌龟与等级成长</button>
          <button class="comp-tab-btn" data-tab="turtle-skills">⚔️ 乌龟海克斯技能</button>
          <button class="comp-tab-btn" data-tab="monsters">👾 魔渊深渊怪物</button>
          <button class="comp-tab-btn" data-tab="monster-skills">💥 怪物与领主绝技</button>
        </div>

        <div class="compendium-content">
          <!-- 1. 乌龟与成长图鉴 -->
          <div class="comp-pane active" id="pane-turtles">
            <div class="pet-hero-overview">
              <div class="hero-overview-card papa">
                <div class="hero-card-head">
                  <span class="hero-avatar">🐢</span>
                  <div>
                    <b>帕帕 · 草龟</b>
                    <span class="hero-role-badge warrior">战士 · 铁甲玄武</span>
                  </div>
                  <div class="hero-lvl-pill">Lv.${papa.level}</div>
                </div>
                <div class="hero-card-title">佩戴称号：<b style="color:#ffd285;">${papa.title}</b> (${papa.aura})</div>
                <div class="hero-card-stats">
                  <span>❤️ 饱食 ${papa.hunger}%</span>
                  <span>💖 心情 ${papa.happiness}%</span>
                  <span>🧼 清洁 ${papa.clean}%</span>
                  <span>✨ 经验 ${papa.xp}/${getXpRequired(papa.level)}</span>
                </div>
                <div class="title-progression-box">
                  <div class="progression-header">📈 帕帕 · 玄武成长称号进阶路线</div>
                  <div class="title-tree-list">${renderTitleTree('papa', papa)}</div>
                </div>
              </div>

              <div class="hero-overview-card pumpkin">
                <div class="hero-card-head">
                  <span class="hero-avatar">🎃</span>
                  <div>
                    <b>小南瓜 · 橘壳龟</b>
                    <span class="hero-role-badge mage">法师 · 灵火玄龟</span>
                  </div>
                  <div class="hero-lvl-pill">Lv.${pumpkin.level}</div>
                </div>
                <div class="hero-card-title">佩戴称号：<b style="color:#ffd285;">${pumpkin.title}</b> (${pumpkin.aura})</div>
                <div class="hero-card-stats">
                  <span>❤️ 饱食 ${pumpkin.hunger}%</span>
                  <span>💖 心情 ${pumpkin.happiness}%</span>
                  <span>🧼 清洁 ${pumpkin.clean}%</span>
                  <span>✨ 经验 ${pumpkin.xp}/${getXpRequired(pumpkin.level)}</span>
                </div>
                <div class="title-progression-box">
                  <div class="progression-header">📈 小南瓜 · 灵法成长称号进阶路线</div>
                  <div class="title-tree-list">${renderTitleTree('pumpkin', pumpkin)}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 乌龟海克斯技能图鉴 -->
          <div class="comp-pane" id="pane-turtle-skills">
            <h4 class="comp-section-title">🛡️ 战士专属技能池 (帕帕)</h4>
            <div class="skill-encyclopedia-grid">
              ${fighterSkills.map(s => `
                <div class="skill-encyc-card fighter">
                  <div class="skill-encyc-icon">${s.icon}</div>
                  <div class="skill-encyc-info">
                    <div class="skill-encyc-top">
                      <b>${s.name}</b>
                      <span class="skill-encyc-cost">${s.cost}</span>
                    </div>
                    <span class="skill-type-tag fighter">${s.type}</span>
                    <p>${s.desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <h4 class="comp-section-title" style="margin-top:20px;">🔮 法师专属技能池 (小南瓜)</h4>
            <div class="skill-encyclopedia-grid">
              ${mageSkills.map(s => `
                <div class="skill-encyc-card mage">
                  <div class="skill-encyc-icon">${s.icon}</div>
                  <div class="skill-encyc-info">
                    <div class="skill-encyc-top">
                      <b>${s.name}</b>
                      <span class="skill-encyc-cost">${s.cost}</span>
                    </div>
                    <span class="skill-type-tag mage">${s.type}</span>
                    <p>${s.desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <h4 class="comp-section-title" style="margin-top:20px;">👑 通用海克斯被动秘宝</h4>
            <div class="skill-encyclopedia-grid">
              ${passivesList.map(p => `
                <div class="skill-encyc-card passive ${p.rarity === 'mythic' ? 'mythic' : ''}">
                  <div class="skill-encyc-icon">${p.icon}</div>
                  <div class="skill-encyc-info">
                    <div class="skill-encyc-top">
                      <b>${p.name}</b>
                      <span class="skill-rarity-badge ${p.rarity}">${p.rarity === 'mythic' ? '👑 神话级' : '✨ 史诗级'}</span>
                    </div>
                    <span class="skill-type-tag passive">${p.type}</span>
                    <p>${p.desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 3. 魔渊怪物图鉴 -->
          <div class="comp-pane" id="pane-monsters">
            ${monsterBook.map(ch => `
              <div class="chapter-monsters-block">
                <div class="chapter-block-header">${ch.chapter}</div>
                <div class="monsters-encyclopedia-grid">
                  ${ch.monsters.map(m => `
                    <div class="monster-encyc-card ${m.isBoss ? 'boss-card' : (m.isElite ? 'elite-card' : '')}">
                      <div class="monster-encyc-avatar">${m.avatar}</div>
                      <div class="monster-encyc-info">
                        <div class="monster-encyc-top">
                          <b>${m.name}</b>
                          <span class="monster-arch-badge ${m.isBoss ? 'boss' : (m.isElite ? 'elite' : '')}">${m.tag}</span>
                        </div>
                        <p>${m.desc}</p>
                        ${m.trait ? `<div class="monster-trait-box">${m.trait}</div>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- 4. 怪物技能与绝技图鉴 -->
          <div class="comp-pane" id="pane-monster-skills">
            ${monsterSkillsBook.map(arch => `
              <div class="monster-skills-section">
                <div class="chapter-block-header">${arch.archetype}</div>
                <div class="monster-skills-grid">
                  ${arch.skills.map(sk => `
                    <div class="monster-skill-card ${sk.isUlt ? 'ult-card' : ''}">
                      <div class="monster-skill-icon">${sk.icon}</div>
                      <div class="monster-skill-info">
                        <div class="monster-skill-top">
                          <b>${sk.name}</b>
                          <span class="skill-dmg-pill ${sk.isUlt ? 'ult' : ''}">${sk.mult}</span>
                        </div>
                        <span class="monster-skill-type ${sk.isUlt ? 'ult' : ''}">${sk.type}</span>
                        <p>${sk.desc}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `);

    $('#modal')?.classList.add('modal-collection');

    $$('.comp-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        $$('.comp-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        $$('.comp-pane').forEach(p => p.classList.toggle('active', p.id === `pane-${tab}`));
      });
    });
  }

  function showContributionModal() {
    const list = Object.values(state.contributions || {});
    list.sort((a, b) => (b.totalZen || 0) - (a.totalZen || 0));
    const totalZenAll = list.reduce((sum, item) => sum + (item.totalZen || 0), 0);

    const rowsHtml = list.map((item, idx) => {
      const isMe = item.id === state.user.id;
      const rankBadge = idx === 0 ? '🥇 榜首' : idx === 1 ? '🥈 亚军' : idx === 2 ? '🥉 季军' : `第 ${idx + 1} 名`;
      const pct = totalZenAll > 0 ? Math.round(((item.totalZen || 0) / totalZenAll) * 100) : 0;
      const details = item.details || { petCare: 0, treeHarvest: 0, keyboardZen: 0, keystrokes: 0, focusTimer: 0, chestReward: 0 };
      const userKeystrokes = details.keystrokes || (isMe ? (state.keystrokes || 0) : 0) || 0;

      let bestCategory = '湖畔修士';
      const maxVal = Math.max(details.petCare || 0, details.treeHarvest || 0, details.keyboardZen || 0, details.focusTimer || 0, details.chestReward || 0);
      if (maxVal > 0) {
        if (maxVal === details.petCare) bestCategory = '💖 抚龟使者';
        else if (maxVal === details.treeHarvest) bestCategory = '🍊 丰收农夫';
        else if (maxVal === details.keyboardZen) bestCategory = '⌨️ 键盘行者';
        else if (maxVal === details.focusTimer) bestCategory = '🍅 专注大师';
        else if (maxVal === details.chestReward) bestCategory = '✦ 探险领袖';
      }

      return `
        <article class="contrib-row ${isMe ? 'contrib-me' : ''}">
          <div class="contrib-row-head">
            <div class="contrib-user-info">
              <span class="contrib-avatar">${escapeHTML(item.avatar || (isMe ? state.user.avatar : '🐢'))}</span>
              <div>
                <b>${escapeHTML(item.name || (isMe ? state.user.name : '共养伙伴'))} ${isMe ? '<small class="me-tag">我</small>' : ''}</b>
                <span class="contrib-honor">${bestCategory}</span>
              </div>
            </div>
            <div class="contrib-scores">
              <span class="contrib-rank">${rankBadge}</span>
              <b>✦ ${format(item.totalZen || 0)} <small>ZEN</small></b>
              <small class="today-sub">今日 +${format(item.todayZen || 0)} · 占比 ${pct}%</small>
            </div>
          </div>
          <div class="contrib-track-mini"><i style="width:${pct}%"></i></div>
          <div class="contrib-details-chips">
            <span title="抚摸互动贡献">💖 抚摸 ${format(item.details?.petCare || 0)}</span>
            <span title="果树采摘贡献">🍊 采摘 ${format(item.details?.treeHarvest || 0)}</span>
            <span title="键盘敲字修行总次数">⌨️ 敲击 ${format(userKeystrokes)} 次</span>
            <span title="番茄专注贡献">🍅 专注 ${format(item.details?.focusTimer || 0)}</span>
            <span title="宝箱探险贡献">✦ 宝箱 ${format(item.details?.chestReward || 0)}</span>
          </div>
        </article>
      `;
    }).join('');

    modal(`
      <button class="modal-close" data-close>×</button>
      <h2>湖畔禅意贡献榜</h2>
      <p class="modal-subtitle">频道 ${escapeHTML(state.channel)} · 记录每位共养者的付出与静心修行成果。</p>
      <div class="contrib-list">${rowsHtml}</div>
      <div class="contrib-actions">
        <button class="modal-primary" id="openProfileFromContrib">✏️ 设置我的昵称与头像</button>
      </div>
    `);

    $('#openProfileFromContrib').onclick = () => {
      showUserProfileModal();
    };
  }

  function showUserProfileModal() {
    let selectedAvatar = state.user.avatar || '🐢';

    modal(`
      <button class="modal-close" data-close>×</button>
      <h2>共养身份设置</h2>
      <p class="modal-subtitle">设置你的专属昵称与头像标识，让来信与禅意贡献清楚标注你的名字。</p>
      <div class="profile-form">
        <label class="form-label">选择头像标识：</label>
        <div class="avatar-picker" id="avatarPicker">
          ${avatarPresets.map(preset => `
            <button class="avatar-chip ${preset.emoji === selectedAvatar ? 'active' : ''}" data-avatar="${preset.emoji}">
              <span class="avatar-emoji">${preset.emoji}</span>
              <small>${preset.label}</small>
            </button>
          `).join('')}
        </div>
        <label class="form-label" style="margin-top:14px;">我的昵称：</label>
        <input id="profileNameInput" maxlength="12" value="${escapeHTML(state.user.name || '帕帕饲养员')}" placeholder="输入你的昵称 (最多12字)"/>
        <button class="modal-primary" id="saveProfileBtn" style="margin-top:16px;">保存身份设置</button>
      </div>
    `);

    $$('#avatarPicker .avatar-chip').forEach(btn => {
      btn.onclick = () => {
        $$('#avatarPicker .avatar-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAvatar = btn.dataset.avatar;
      };
    });

    $('#saveProfileBtn').onclick = () => {
      const nameInput = $('#profileNameInput');
      const newName = nameInput ? nameInput.value.trim() : '';
      if (!newName) {
        return toast('昵称不能为空', '请给自己起一个好听的昵称吧。');
      }

      state.user.name = newName;
      state.user.avatar = selectedAvatar;

      if (!state.contributions) state.contributions = {};
      if (!state.contributions[state.user.id]) {
        recordContribution(0, 'petCare');
      } else {
        state.contributions[state.user.id].name = newName;
        state.contributions[state.user.id].avatar = selectedAvatar;
      }

      persist();
      render();
      sync(true);
      closeModal();
      toast('✦ 身份已更新', `已更名为【${selectedAvatar} ${newName}】，信件与贡献榜已同步更新。`);
    };
  }

  function formatLetterDate(letter) {
    let d = null;
    if (letter.timestamp && !isNaN(Number(letter.timestamp))) {
      d = new Date(Number(letter.timestamp));
    } else if (letter.time) {
      const parsed = new Date(letter.time);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      }
    }

    if (!d) {
      return letter.time || '刚刚';
    }

    const now = new Date();
    const isSameYear = d.getFullYear() === now.getFullYear();
    const isToday = isSameYear && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = isSameYear && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
      return `今天 ${timeStr}`;
    } else if (isYesterday) {
      return `昨天 ${timeStr}`;
    } else if (isSameYear) {
      return `${d.getMonth() + 1}月${d.getDate()}日 ${timeStr}`;
    } else {
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${timeStr}`;
    }
  }

  function showMessenger() {
    const lettersList = Array.isArray(state.letters) ? state.letters : [];
    const mailItemsHtml = lettersList.slice().reverse().map(letter => {
      const isMe = letter.senderId === state.user.id || letter.from === '我';
      const senderAvatar = escapeHTML(letter.senderAvatar || (isMe ? state.user.avatar : '💌'));
      const senderName = escapeHTML(letter.senderName || (isMe ? (state.user.name + ' (我)') : (letter.from || '远方的共养者')));
      const badgeClass = isMe ? 'letter-me' : 'letter-partner';
      const dateDisplay = formatLetterDate(letter);
      const fullDateTitle = letter.timestamp ? new Date(letter.timestamp).toLocaleString('zh-CN') : (letter.time || '');

      return `
        <div class="chat-message-row ${isMe ? 'chat-me' : 'chat-partner'}">
          <div class="chat-avatar-box">
            <span class="chat-avatar">${senderAvatar}</span>
          </div>
          <div class="chat-content-wrap">
            <div class="chat-meta">
              <span class="chat-sender-name">${senderName}</span>
              <span class="chat-sender-badge">${isMe ? '我 🕊️' : '共养伙伴 💌'}</span>
              <small class="chat-time-badge" title="${escapeHTML(fullDateTitle)}">📅 ${escapeHTML(dateDisplay)}</small>
            </div>
            <div class="chat-bubble">
              <p>${escapeHTML(letter.body)}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    modal(`
      <button class="modal-close" data-close>×</button>
      <h2>飞鸽传书</h2>
      <p class="modal-subtitle">频道 ${escapeHTML(state.channel)} · 把一小片心意送到远方的湖畔。</p>
      <div class="mail-list">${mailItemsHtml}</div>
      <div class="messenger-sender-bar">
        <div class="current-sender-info">
          <span>当前发信身份：</span>
          <span class="sender-pill">
            <i>${escapeHTML(state.user.avatar || '🐢')}</i>
            <b>${escapeHTML(state.user.name || '帕帕饲养员')}</b>
          </span>
          <button class="edit-sender-btn" id="editMessengerProfile">修改</button>
        </div>
      </div>
      <div class="letter-form">
        <input id="letterInput" maxlength="80" placeholder="写下想说的话 (将以【${escapeHTML(state.user.name || '帕帕饲养员')}】的名义送达)…"/>
        <button class="modal-primary" id="sendLetter">寄出</button>
      </div>
    `);

    $('#editMessengerProfile').onclick = () => {
      showUserProfileModal();
    };

    $('#sendLetter').onclick = () => {
      const input = $('#letterInput');
      const body = input ? input.value.trim() : '';
      if (!body) return;

      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const fullDateStr = `${month}月${day}日 ${hours}:${minutes}`;

      const newLetter = {
        id: `msg_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
        senderId: state.user.id,
        senderName: state.user.name,
        senderAvatar: state.user.avatar,
        body,
        time: fullDateStr,
        timestamp: Date.now()
      };
      if (!Array.isArray(state.letters)) state.letters = [];
      state.letters.push(newLetter);
      if (state.letters.length > 50) {
        state.letters.splice(0, state.letters.length - 50);
      }
      sync(true);
      render();
      if (typeof mqttClient !== 'undefined' && mqttClient && mqttClient.connected) {
        toast('✉ 飞鸽已起飞', `以【${state.user.name}】的名义已寄往共养频道，远方即将收到。`);
      } else {
        toast('✉ 飞鸽已起飞', '信件已寄出，正在送往远方的湖畔...');
      }

      // 单机测试与离线送达保护（若 1.6 秒内网络回执未返回且未连接多个远端，自动给予视觉欢庆跳舞反馈）
      clearTimeout(window.__letterDeliverySimTimer);
      window.__letterDeliverySimTimer = setTimeout(() => {
        if (!mqttClient || !mqttClient.connected) {
          if (typeof triggerTurtleDeliveryCelebration === 'function') {
            triggerTurtleDeliveryCelebration({ isSenderAck: true });
          }
        }
      }, 1600);

      showMessenger();
    };
  }

  function showHouseWorkshopModal() {
    const currentStyleId = state.garden.houseStyle || 'cottage_lv1';
    const unlocked = Array.isArray(state.garden.unlockedHouses) ? state.garden.unlockedHouses : ['cottage_lv1'];

    const cardsHtml = HOUSE_STYLES.map(house => {
      const isEquipped = currentStyleId === house.id;
      const isUnlocked = unlocked.includes(house.id);
      const canAfford = state.zen >= house.price;

      let actionBtn = '';
      if (isEquipped) {
        actionBtn = `<button class="house-btn active-state" disabled>✓ 当前居住中</button>`;
      } else if (isUnlocked) {
        actionBtn = `<button class="house-btn apply-btn" data-equip-house="${house.id}">🏡 切换入住</button>`;
      } else {
        actionBtn = `<button class="house-btn upgrade-btn ${canAfford ? 'can-upgrade' : 'cant-upgrade'}" data-upgrade-house="${house.id}" data-cost="${house.price}" ${canAfford ? '' : 'disabled'}>
          ${canAfford ? `✨ 消耗 ${house.price} 禅意升级` : `🔒 需 ${house.price} 禅意 (不足)`}
        </button>`;
      }

      return `
        <div class="house-card ${isEquipped ? 'equipped' : ''} ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="house-card-header">
            <span class="house-lvl-pill">Lv.${house.level}</span>
            <span class="house-tag-pill">${house.tag}</span>
            ${isEquipped ? '<span class="house-live-tag">居住中</span>' : ''}
          </div>
          <div class="house-card-preview ${house.class}">
            ${typeof getHouseSvg === 'function' ? getHouseSvg(house.id, true) : `<div class="house-icon-large">${house.icon}</div>`}
          </div>
          <div class="house-card-body">
            <h3 class="house-name">${house.name}</h3>
            <p class="house-desc">${house.desc}</p>
            <div class="house-buff-tag">${house.buff}</div>
          </div>
          <div class="house-card-footer">
            ${actionBtn}
          </div>
        </div>
      `;
    }).join('');

    modal(`
      <button class="modal-close" data-close>×</button>
      <div class="house-modal-header">
        <h2>🏡 圣域营造 · 房屋工坊</h2>
        <div class="house-modal-zen-badge">
          <span>当前禅意储备：</span>
          <b>✦ ${format(state.zen)}</b>
        </div>
      </div>
      <p class="modal-subtitle">使用禅意值升级建造更气派的湖畔府邸，已解锁的房屋可随时自由切换装扮并享受专属庇护加成！</p>
      
      <div class="house-grid-container">
        ${cardsHtml}
      </div>
    `);

    // Attach button click events
    $$('[data-equip-house]', $('#modal')).forEach(btn => {
      btn.onclick = () => {
        const houseId = btn.dataset.equipHouse;
        state.garden.houseStyle = houseId;
        const targetHouse = HOUSE_STYLES.find(h => h.id === houseId);
        persist();
        render();
        sync(true);
        toast('🏡 府邸换装成功', `已将圣域居所切换为「${targetHouse?.name || '新府邸'}」！`);
        showHouseWorkshopModal();
      };
    });

    $$('[data-upgrade-house]', $('#modal')).forEach(btn => {
      btn.onclick = () => {
        const houseId = btn.dataset.upgradeHouse;
        const cost = parseInt(btn.dataset.cost, 10) || 0;
        if (!spendZen(cost, '升级圣域府邸')) {
          toast('⚠️ 禅意不足', `升级此府邸需要 ${cost} 禅意，继续陪伴小龟累积禅意吧！`);
          return;
        }

        if (!Array.isArray(state.garden.unlockedHouses)) {
          state.garden.unlockedHouses = ['cottage_lv1'];
        }
        if (!state.garden.unlockedHouses.includes(houseId)) {
          state.garden.unlockedHouses.push(houseId);
        }
        state.garden.houseStyle = houseId;

        persist();
        render();
        sync(true);

        // 升级特效与欢呼
        if (typeof createCelebrationSparkles === 'function') {
          createCelebrationSparkles();
        }
        $$('.garden-stage .turtle').forEach(t => {
          t.classList.add('jump');
          setTimeout(() => t.classList.remove('jump'), 1400);
        });

        const targetHouse = HOUSE_STYLES.find(h => h.id === houseId);
        toast('🎉 府邸大吉升级！', `恭喜成功耗费 ${cost} 禅意，将圣域府邸晋升为「${targetHouse?.name || '豪华新居'}」！`);
        showHouseWorkshopModal();
      };
    });
  }

  function showAmbientSoundModal() {
    if (typeof AmbientEngine === 'undefined') return;
    const tracks = AmbientEngine.getTracks();
    const curTrack = AmbientEngine.getCurrentTrack();
    const isPlaying = AmbientEngine.isPlaying();
    const curVol = state.ambientVolume !== undefined ? Math.round(state.ambientVolume * 100) : 60;

    const cardsHtml = tracks.map(track => {
      const isCur = track.id === curTrack.id;
      const isThisPlaying = isCur && isPlaying;

      return `
        <div class="ambient-card ${isCur ? 'active' : ''} ${isThisPlaying ? 'playing' : ''}" data-track-id="${track.id}" style="--track-color: ${track.color}">
          <div class="ambient-card-left">
            <div class="ambient-icon-wrapper" style="background: radial-gradient(circle, ${track.color}28, ${track.color}08); border-color: ${track.color}55;">
              <span class="ambient-icon">${track.icon}</span>
              ${isThisPlaying ? '<div class="ambient-eq-visualizer"><i></i><i></i><i></i><i></i></div>' : ''}
            </div>
            <div class="ambient-meta">
              <div class="ambient-title-row">
                <span class="ambient-title">${track.name}</span>
                <span class="ambient-tag-pill" style="color:${track.color}; border-color:${track.color}44; background:${track.color}15">${track.tag}</span>
              </div>
              <div class="ambient-sub">${track.sub}</div>
              <div class="ambient-desc">${track.desc}</div>
            </div>
          </div>
          <button class="ambient-play-btn ${isThisPlaying ? 'btn-playing' : ''}" data-action="toggle-track" data-track-id="${track.id}">
            ${isThisPlaying ? '⏸️ 暂停' : (isCur ? '▶️ 播放' : '🎵 切换')}
          </button>
        </div>
      `;
    }).join('');

    modal(`
      <button class="modal-close" data-close>×</button>
      <div class="ambient-modal-header">
        <div class="ambient-header-left">
          <span class="ambient-header-icon">📻</span>
          <div>
            <h3>圣域留声机 · 白噪音与环境音</h3>
            <p>6 款沉浸式自然音律，陪伴你在专注、助眠与冥想中找回内心的宁静。</p>
          </div>
        </div>
      </div>

      <!-- 全局音量控制栏 -->
      <div class="ambient-controls-bar">
        <div class="ambient-vol-group">
          <span class="vol-icon" id="volIcon">${curVol === 0 ? '🔇' : (curVol < 40 ? '🔉' : '🔊')}</span>
          <span class="vol-label">音量 <b id="volText">${curVol}%</b></span>
          <input type="range" class="ambient-vol-slider" id="ambientVolSlider" min="0" max="100" value="${curVol}">
        </div>
        <button class="ambient-master-btn ${isPlaying ? 'btn-stop' : 'btn-start'}" id="masterAmbientToggle">
          ${isPlaying ? '⏸️ 全部静音' : '▶️ 开启环境音'}
        </button>
      </div>

      <div class="ambient-grid-container">
        ${cardsHtml}
      </div>
    `);

    // 绑定音量调节
    const slider = $('#ambientVolSlider');
    if (slider) {
      slider.oninput = (e) => {
        const val = parseInt(e.target.value, 10);
        $('#volText').textContent = `${val}%`;
        $('#volIcon').textContent = val === 0 ? '🔇' : (val < 40 ? '🔉' : '🔊');
        AmbientEngine.setVolume(val / 100);
      };
    }

    // 绑定全局启停
    const masterBtn = $('#masterAmbientToggle');
    if (masterBtn) {
      masterBtn.onclick = () => {
        AmbientEngine.toggle();
        showAmbientSoundModal();
      };
    }

    // 绑定各音轨卡片与切换按钮
    $$('[data-action="toggle-track"]', $('#modal')).forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.trackId;
        if (trackId === curTrack.id && isPlaying) {
          AmbientEngine.stop();
        } else {
          AmbientEngine.play(trackId);
          const trk = tracks.find(t => t.id === trackId);
          toast(`🎵 切换环境音`, `正在聆听「${trk?.name || '自然音律'}」—— ${trk?.sub || ''}`);
        }
        showAmbientSoundModal();
      };
    });

    $$('.ambient-card', $('#modal')).forEach(card => {
      card.onclick = () => {
        const trackId = card.dataset.trackId;
        if (trackId !== curTrack.id || !isPlaying) {
          AmbientEngine.play(trackId);
          const trk = tracks.find(t => t.id === trackId);
          toast(`🎵 切换环境音`, `正在聆听「${trk?.name || '自然音律'}」—— ${trk?.sub || ''}`);
          showAmbientSoundModal();
        }
      };
    });
  }
