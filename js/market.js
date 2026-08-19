/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — 英雄集市系统 (Hero Market System)
   ========================================================================== */
  /* ===================================================
     英雄集市 / 商城 (Hero Market) 系统
     =================================================== */
  const MarketSystem = {
    items: [
      { id: 'm_lantern', type: 'decor', name: '琉璃莲花灯', price: 200, icon: '🪷', desc: '湖畔夜间散发七彩流光的仙家莲花灯', statBonus: { spd: 3 }, statDesc: '⚡ 速度 +3', decorType: 'manhole', label: '琉璃莲花灯' },
      { id: 'm_maple', type: 'decor', name: '聚灵古枫树', price: 350, icon: '🍁', desc: '古朴高雅的赤金古枫，为庭院聚集灵气', statBonus: { def: 5 }, statDesc: '🛡️ 防御 +5', decorType: 'tree', label: '聚灵古枫树' },
      { id: 'm_mushroom', type: 'decor', name: '暗夜荧光菇', price: 180, icon: '🍄', desc: '夜间散发幽蓝微光的奇幻蘑菇', statBonus: { hp: 30 }, statDesc: '❤️ 生命 +30', decorType: 'plant', label: '暗夜荧光菇' },
      { id: 'm_fountain', type: 'decor', name: '圣泉微缩雕像', price: 450, icon: '⛲', desc: '纯白玉石雕琢而成的圣域涌泉', statBonus: { atk: 6 }, statDesc: '⚔️ 力量 +6', decorType: 'cottage', label: '圣泉雕像' },
      { id: 'm_papa_armor', type: 'skin', name: '帕帕 · 龙鳞重铠', price: 600, icon: '🛡️', desc: '以魔渊龙鳞铸造的黄金重铠，大幅强化外壳质感', statBonus: { hp: 60, def: 8 }, statDesc: '❤️ 生命 +60 | 🛡️ 防御 +8' },
      { id: 'm_pumpkin_robe', type: 'skin', name: '小南瓜 · 星辉法袍', price: 600, icon: '🔮', desc: '以璀璨星辉织就的魔导法袍，周身附带星光流萤', statBonus: { atk: 10, spd: 4 }, statDesc: '⚔️ 力量 +10 | ⚡ 速度 +4' },
      { id: 'm_elixir_str', type: 'elixir', name: '九转霸力丸', price: 160, icon: '💊', desc: '提炼深渊赤阳精魄制成，永久突破力量潜能', statBonus: { atk: 3 }, statDesc: '⚔️ 力量 +3 (可多次服用)' },
      { id: 'm_elixir_def', type: 'elixir', name: '玄武金刚丹', price: 160, icon: '💎', desc: '淬炼上古灵岩制成，永久强化玄武坚甲', statBonus: { def: 3 }, statDesc: '🛡️ 防御 +3 (可多次服用)' },
      { id: 'm_elixir_hp', type: 'elixir', name: '地脉长生露', price: 160, icon: '🍶', desc: '采摘灵泉玉露熬制，永久增加最大气血上限', statBonus: { hp: 35 }, statDesc: '❤️ 生命 +35 (可多次服用)' },
      { id: 'm_elixir_spd', type: 'elixir', name: '追风神行散', price: 160, icon: '🍃', desc: '融合疾风之羽研磨而成，永久提升身法速度', statBonus: { spd: 3 }, statDesc: '⚡ 速度 +3 (可多次服用)' },
      { id: 'm_holywater', type: 'potion', name: '极品经验圣水', price: 120, icon: '🧪', desc: '立即为帕帕和小南瓜各增加 +150 培养经验', statDesc: '✨ 经验 +150 (可多次购买)' }
    ],

    getTotalMarketBonuses() {
      if (!state.heroMarketBonuses) {
        state.heroMarketBonuses = { hp: 0, atk: 0, def: 0, spd: 0 };
      }
      const total = {
        hp: state.heroMarketBonuses.hp || 0,
        atk: state.heroMarketBonuses.atk || 0,
        def: state.heroMarketBonuses.def || 0,
        spd: state.heroMarketBonuses.spd || 0
      };
      if (Array.isArray(state.marketUnlocked)) {
        state.marketUnlocked.forEach(itemId => {
          const it = MarketSystem.items.find(i => i.id === itemId);
          if (it && it.statBonus) {
            if (it.statBonus.hp) total.hp += it.statBonus.hp;
            if (it.statBonus.atk) total.atk += it.statBonus.atk;
            if (it.statBonus.def) total.def += it.statBonus.def;
            if (it.statBonus.spd) total.spd += it.statBonus.spd;
          }
        });
      }
      return total;
    },

    showModal() {
      if (typeof state.heroCoins !== 'number') state.heroCoins = 0;
      if (!Array.isArray(state.marketUnlocked)) state.marketUnlocked = [];

      const b = MarketSystem.getTotalMarketBonuses();
      const summaryHtml = `
        <div class="market-bonus-summary">
          <span>📈 累计神物加成：</span>
          <span>❤️ 生命<b>+${b.hp}</b></span>
          <span>⚔️ 力量<b>+${b.atk}</b></span>
          <span>🛡️ 防御<b>+${b.def}</b></span>
          <span>⚡ 速度<b>+${b.spd}</b></span>
        </div>
      `;

      const itemsHtml = MarketSystem.items.map(item => {
        const isBought = item.type !== 'elixir' && item.type !== 'potion' && state.marketUnlocked.includes(item.id);
        const canAfford = state.heroCoins >= item.price;
        return `
          <div class="market-item-card">
            <div class="market-item-icon">${item.icon}</div>
            <div class="market-item-info">
              <b>${escapeHTML(item.name)}</b>
              <p>${escapeHTML(item.desc)}</p>
              ${item.statDesc ? `<span class="market-stat-badge">✨ 永久属性：${item.statDesc}</span>` : ''}
              <div class="market-buy-row">
                <span class="market-price">🪙 ${item.price}</span>
                <button class="market-buy-btn" data-item-id="${item.id}" ${isBought || !canAfford ? 'disabled' : ''}>
                  ${isBought ? '已拥有' : (canAfford ? '兑换' : '英雄币不足')}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      modal(`
        <div class="market-modal-box">
          <button class="modal-close" data-close>×</button>
          <div class="market-head">
            <div>
              <h3>🛍️ 英雄集市</h3>
              <small>消耗通关魔渊获得的英雄币，兑换神物灵药永久提升四维属性</small>
            </div>
            <div class="hero-coins-badge">🪙 英雄币: <b id="marketCoinsVal">${state.heroCoins}</b></div>
          </div>
          ${summaryHtml}
          <div class="market-grid">${itemsHtml}</div>
        </div>
      `);
      $('#modal')?.classList.add('modal-market');

      $$('.market-buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const itemId = btn.dataset.itemId;
          MarketSystem.buyItem(itemId);
        });
      });
    },

    buyItem(itemId) {
      const item = MarketSystem.items.find(i => i.id === itemId);
      if (!item) return;
      if (state.heroCoins < item.price) {
        toast('英雄币不足', '请前往【魔渊】通关地下城赚取更多英雄币！');
        return;
      }

      state.heroCoins -= item.price;

      if (item.type === 'elixir') {
        if (!state.heroMarketBonuses) state.heroMarketBonuses = { hp: 0, atk: 0, def: 0, spd: 0 };
        if (item.statBonus.hp) state.heroMarketBonuses.hp = (state.heroMarketBonuses.hp || 0) + item.statBonus.hp;
        if (item.statBonus.atk) state.heroMarketBonuses.atk = (state.heroMarketBonuses.atk || 0) + item.statBonus.atk;
        if (item.statBonus.def) state.heroMarketBonuses.def = (state.heroMarketBonuses.def || 0) + item.statBonus.def;
        if (item.statBonus.spd) state.heroMarketBonuses.spd = (state.heroMarketBonuses.spd || 0) + item.statBonus.spd;
        toast('💊 灵药生效', `成功服用【${item.name}】！永久获得属性加成：${item.statDesc}`);
      } else if (item.type === 'decor') {
        if (!Array.isArray(state.marketUnlocked)) state.marketUnlocked = [];
        state.marketUnlocked.push(item.id);
        if (!state.garden.decorations) state.garden.decorations = [];
        state.garden.decorations.push({
          id: `decor-${Date.now()}`,
          type: item.decorType,
          label: item.label,
          x: 40 + Math.floor(Math.random() * 20),
          y: 50 + Math.floor(Math.random() * 15)
        });
        toast('🎉 兑换成功', `已将【${item.name}】放置于庭院中！永久获得：${item.statDesc || '属性提升'}`);
      } else if (item.type === 'skin') {
        if (!Array.isArray(state.marketUnlocked)) state.marketUnlocked = [];
        state.marketUnlocked.push(item.id);
        if (item.id === 'm_papa_armor') {
          state.pets.papa.glow = '#fde047';
          state.pets.papa.title = '龙鳞统帅';
        } else if (item.id === 'm_pumpkin_robe') {
          state.pets.pumpkin.glow = '#c084fc';
          state.pets.pumpkin.title = '星辉大魔导';
        }
        toast('🛡️ 专属神装生效', `已穿上【${item.name}】！永久获得：${item.statDesc}`);
      } else if (item.type === 'potion') {
        addPetXp('papa', 150);
        addPetXp('pumpkin', 150);
        toast('🧪 圣水生效', '帕帕与小南瓜各自获得了 +150 点成长经验！');
      }

      AbyssEngine.updateLobbyDisplay();
      persist();
      render();
      sync(true);
      MarketSystem.showModal();
    }
  };

