/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — 地狱魔渊 PVE 回合制肉鸽系统 (Demon Abyss Engine)
   ========================================================================== */
  /* ===================================================
     魔渊 (Demon Abyss) 回合制肉鸽 PVE 核心引擎
     =================================================== */
  const AbyssEngine = {
    selectedHeroId: 'papa', // 'papa' | 'pumpkin'
    isRunning: false,
    speed: 1, // 1 | 2
    isAuto: false,
    currentChapter: 1, // 1 ~ 5
    currentStage: 1, // 1 ~ 6 (Ch1-3) or 1 ~ 10 (Ch4-5)
    totalFloorIndex: 1, // 1 ~ 38
    isPlayerTurn: true,
    isProcessing: false,
    hero: null,
    monster: null,

    // 章节蓝图与领主特性
    chapters: [
      { id: 1, name: '枯骨幽穴', maxStage: 6, hasElite: false, bossName: '【幽冥骨魔】', bossAvatar: '💀', bossArch: 'tank', bossTrait: '💀 枯骨护体: 初始拥有 20% 最大生命护盾' },
      { id: 2, name: '剧毒蛛巢', maxStage: 6, hasElite: false, bossName: '【毒煞蛛皇】', bossAvatar: '🕷️', bossArch: 'toxic', bossTrait: '🕷️ 猛毒蛛丝: 攻击附带中毒且降低 20% 速度' },
      { id: 3, name: '熔岩炼狱', maxStage: 6, hasElite: false, bossName: '【炎狱巨兽】', bossAvatar: '🔥', bossArch: 'berserker', bossTrait: '🔥 熔火躯体: 反弹 15% 物理伤害并附带灼烧' },
      { id: 4, name: '虚空回廊', maxStage: 10, hasElite: true, eliteStage: 5, eliteName: '【虚空影侍】', eliteAvatar: '👁️', eliteArch: 'toxic', bossName: '【虚空领主】', bossAvatar: '🌌', bossArch: 'caster', bossTrait: '🌌 虚空闪烁: 拥有 15% 概率闪避攻击' },
      { id: 5, name: '魔渊终界', maxStage: 10, hasElite: true, eliteStage: 5, eliteName: '【混沌裁决者】', eliteAvatar: '⚖️', eliteArch: 'caster', bossName: '【魔渊终焉之神】', bossAvatar: '☬', bossArch: 'boss', bossTrait: '☬ 终焉狂暴: 低于 50% 生命进入神魔暴走 (+30% ATK/SPD)' }
    ],

    // 怪物五大流派原型与特色技能池
    monsterArchetypes: {
      berserker: {
        tag: '狂暴强攻',
        skills: [
          { id: 'shred_strike', name: '破甲重击', icon: '⚔️', mult: 1.25, shred: 20, desc: '造成 125% 物理重击并撕裂 20% 防御 (2回合)' },
          { id: 'slash_cleave', name: '顺劈狂斩', icon: '🪓', mult: 1.15, desc: '快速挥舞利刃造成 115% 物理伤害' }
        ],
        ult: { id: 'blood_fury', name: '血怒狂绝斩', icon: '💥', mult: 1.75, desc: '爆发 175% 狂暴巨额伤害并引发裂地巨颤' }
      },
      toxic: {
        tag: '剧毒暗袭',
        skills: [
          { id: 'poison_sting', name: '剧毒刺击', icon: '🗡️', mult: 0.85, poisonTurns: 2, poisonPct: 0.25, desc: '造成 85% 伤害并附加 2 回合剧毒 (每回合 25% 真实伤害)' },
          { id: 'bone_rend', name: '蚀骨撕裂', icon: '🩸', mult: 1.2, bonusPoison: 0.3, desc: '造成 120% 撕裂伤害 (若目标中毒伤害额外提高 30%)' }
        ],
        ult: { id: 'venom_burst', name: '万毒穿心煞', icon: '☠️', mult: 1.5, manaBurn: 20, desc: '造成 150% 毒煞伤害并燃烧 20 点法力/战意' }
      },
      caster: {
        tag: '元素奥法',
        skills: [
          { id: 'fire_blast', name: '烈焰天火', icon: '🔥', mult: 1.25, burnTurns: 2, burnPct: 0.25, desc: '造成 125% 烈焰法术伤害并附加 2 回合灼烧' },
          { id: 'frost_slow', name: '寒霜迟缓', icon: '❄️', mult: 0.9, slowPct: 30, slowTurns: 2, desc: '造成 90% 冰霜伤害并降低目标 30% 速度 (2回合)' }
        ],
        ult: { id: 'meteor_apocalypse', name: '湮灭天陨', icon: '☄️', mult: 1.9, desc: '吟唱召唤天外流星陨石造成 190% 毁灭打击' }
      },
      tank: {
        tag: '铁壁坚甲',
        skills: [
          { id: 'shield_bash', name: '重盾猛击', icon: '🛡️', mult: 0.95, desc: '造成 95% 重盾猛撞' },
          { id: 'stone_armor', name: '冥石固化', icon: '🧱', shieldPct: 0.2, desc: '凝聚地脉岩层为自身构筑相当于最大生命 20% 的坚固护盾' }
        ],
        ult: { id: 'titan_quake', name: '泰坦崩裂波', icon: '🌋', mult: 1.55, shieldBreak: true, desc: '造成 155% 崩裂重击并击碎目标所有护盾' }
      },
      boss: {
        tag: '深渊领主',
        skills: [
          { id: 'abyss_drain', name: '深渊汲取', icon: '🩸', mult: 1.1, lifesteal: 0.4, desc: '造成 110% 伤害并将 40% 转化为自身生命' },
          { id: 'lord_oppress', name: '领主威压', icon: '👑', mult: 1.2, debuffAtkPct: 15, turns: 2, desc: '造成 120% 伤害并压制乌龟 15% 力量 (2回合)' },
          { id: 'shadow_combo', name: '暗影狂澜', icon: '👤', mult: 1.35, desc: '挥洒 3 道暗影利刃造成 135% 连击伤害' }
        ],
        ult: { id: 'apocalypse_wrath', name: '诸神黄昏 · 终焉神罚', icon: '☬', mult: 2.1, desc: '引动深渊核心引发全屏终焉天罚！' }
      }
    },

    // 各章节小兵精准流派分配
    minionConfigs: {
      1: [
        { name: '骷髅斥候', avatar: '💀', archetype: 'berserker' },
        { name: '腐蚀泥怪', avatar: '🦠', archetype: 'tank' },
        { name: '暗影蝙蝠', avatar: '🦇', archetype: 'toxic' },
        { name: '幽魂游侠', avatar: '🏹', archetype: 'caster' },
        { name: '怨灵祭司', avatar: '🔮', archetype: 'caster' }
      ],
      2: [
        { name: '剧毒幼蛛', avatar: '🕷️', archetype: 'toxic' },
        { name: '蚀骨狼蛛', avatar: '🕸️', archetype: 'toxic' },
        { name: '幽暗潜伏者', avatar: '🥷', archetype: 'berserker' },
        { name: '毒囊飞蛾', avatar: '🦋', archetype: 'caster' },
        { name: '绿毒守卫', avatar: '🛡️', archetype: 'tank' }
      ],
      3: [
        { name: '熔岩魔犬', avatar: '🐕‍🦺', archetype: 'berserker' },
        { name: '爆裂幼龙', avatar: '🐉', archetype: 'caster' },
        { name: '灰烬魔人', avatar: '🗿', archetype: 'tank' },
        { name: '烈焰法师', avatar: '🧙‍♂️', archetype: 'caster' },
        { name: '熔铸傀儡', avatar: '🤖', archetype: 'berserker' }
      ],
      4: [
        { name: '虚空行者', avatar: '🌌', archetype: 'caster' },
        { name: '暗影裂片', avatar: '🌑', archetype: 'toxic' },
        { name: '蚀魂魔眼', avatar: '👁️', archetype: 'caster' },
        { name: '虚空狂信徒', avatar: '🦹', archetype: 'berserker' },
        { name: '暗影巨灵', avatar: '🗿', archetype: 'tank' },
        { name: '裂隙追猎者', avatar: '🐅', archetype: 'toxic' },
        { name: '湮灭幽灵', avatar: '👻', archetype: 'caster' },
        { name: '虚空巡者', avatar: '🪐', archetype: 'tank' }
      ],
      5: [
        { name: '混沌魔将', avatar: '👹', archetype: 'tank' },
        { name: '终焉血裔', avatar: '🩸', archetype: 'toxic' },
        { name: '灭世魔像', avatar: '🗿', archetype: 'berserker' },
        { name: '灾厄预言家', avatar: '📜', archetype: 'caster' },
        { name: '深渊龙仆', avatar: '🐲', archetype: 'berserker' },
        { name: '毁灭之触', avatar: '🐙', archetype: 'toxic' },
        { name: '终极魔影', avatar: '👤', archetype: 'caster' },
        { name: '混沌执政官', avatar: '⚖️', archetype: 'tank' }
      ]
    },

    // 技能与海克斯卡池
    augments: {
      fighterActives: [
        { id: 'whirlwind', name: '旋风斩', icon: '🌀', desc: '造成 160% 力量物理伤害，并撕裂护甲 25% (2回合)', cd: 2, curCd: 0, mpCost: 30, mult: 1.6, shred: 25 },
        { id: 'banner', name: '不屈战旗', icon: '🛡️', desc: '获得自身最大生命 35% 护盾，防御提升 30% (3回合)', cd: 3, curCd: 0, mpCost: 35, shieldPct: 0.35, defBuff: 30 },
        { id: 'smash', name: '巨力破甲震', icon: '💥', desc: '单体 240% 伤害，并有 60% 几率眩晕目标 1 回合', cd: 3, curCd: 0, mpCost: 40, mult: 2.4, stunChance: 0.6 },
        { id: 'earthquake', name: '天崩地裂', icon: '🌋', desc: '造成 300% 力量重击，降低敌方 40% 速度 (2回合)', cd: 4, curCd: 0, mpCost: 55, mult: 3.0, slowPct: 40 }
      ],
      mageActives: [
        { id: 'firestorm', name: '烈焰风暴', icon: '🔥', desc: '造成 180% 力量法术伤害，附加 3 回合灼烧 (每回合 35% 伤害)', cd: 2, curCd: 0, mpCost: 35, mult: 1.8, burnDot: 0.35 },
        { id: 'frostbite', name: '极寒冰封', icon: '❄️', desc: '造成 200% 力量法术伤害，60% 几率冻结目标 1 回合', cd: 3, curCd: 0, mpCost: 40, mult: 2.0, freezeChance: 0.6 },
        { id: 'missiles', name: '奥术弹幕', icon: '⚡', desc: '发射 4 枚奥术飞弹，每枚造成 65% 伤害 (共 260%)', cd: 2, curCd: 0, mpCost: 45, mult: 2.6 },
        { id: 'thunder', name: '引雷天罚', icon: '🌩️', desc: '召唤九天神雷造成 340% 爆发雷暴伤害', cd: 4, curCd: 0, mpCost: 60, mult: 3.4 }
      ],
      passives: [
        { id: 'bloodthirst', name: '嗜血战意', icon: '🩸', desc: '造成伤害的 25% 转化为自身生命恢复', rarity: 'rare' },
        { id: 'first_strike', name: '先发制人', icon: '🎯', desc: '战斗首回合必定先手且必定暴击', rarity: 'rare' },
        { id: 'fatal_tempo', name: '致命节奏', icon: '⚡', desc: '每次攻击永久提升 4 点速度与 3% 暴击率', rarity: 'rare' },
        { id: 'thorns', name: '荆棘反震', icon: '🌵', desc: '受到物理伤害时反弹 35% 的真实伤害给攻击者', rarity: 'rare' },
        { id: 'double_cast', name: '法术连击', icon: '✨', desc: '所有技能有 35% 概率立即无消耗再施放一次', rarity: 'mythic' },
        { id: 'iron_will', name: '钢铁意志', icon: '🛡️', desc: '受到致命伤害时保留 1 点生命并获得 50% 护盾 (每局一次)', rarity: 'mythic' },
        { id: 'divine_execute', name: '神圣斩杀', icon: '⚔️', desc: '攻击附加目标已损生命值 18% 的真实神圣伤害', rarity: 'mythic' },
        { id: 'titan_blood', name: '泰坦神血', icon: '👑', desc: '全四维属性永久额外提升 25%', rarity: 'mythic' }
      ]
    },

    // 奇遇抉择事件库
    eventsPool: [
      {
        id: 'altar',
        title: '神秘深渊祭坛',
        icon: '🏛️',
        desc: '在深渊幽暗的废墟深处，你发现了一座散发着古老微光的玄武祭坛，四周铭刻着封印神纹...',
        options: [
          {
            name: '🩸 献祭之血',
            desc: '割破指尖滴入精血，以 20% 当前生命换取远古战神之力',
            costText: '-20% HP',
            action: (h) => {
              const lost = Math.max(1, Math.round(h.hp * 0.2));
              h.hp = Math.max(1, h.hp - lost);
              h.atk += 15;
              state.heroCoins = (state.heroCoins || 0) + 60;
              return `献祭了 ${lost} 点生命，力量永久 +15，并获得 🪙 60 英雄币！`;
            }
          },
          {
            name: '🕯️ 虔诚祷告',
            desc: '在祭坛前盘坐凝神，汲取安宁的灵气',
            costText: '生命法力恢复',
            action: (h) => {
              const heal = Math.round((h.maxHp - h.hp) * 0.6);
              h.hp = Math.min(h.maxHp, h.hp + heal);
              h.mp = h.maxMp;
              return `祷告结束，回复了 ${heal} 点生命，战意/法力值已完全充满！`;
            }
          },
          {
            name: '🔨 破击祭坛',
            desc: '打碎祭坛封印强行攫取古魂，承担失控反噬风险',
            costText: '高风险高收益',
            action: (h) => {
              if (Math.random() < 0.7) {
                h.atk += 10;
                h.def += 10;
                h.spd += 6;
                return `成功吸纳古魂灵核！全四维属性提升（力量+10, 防御+10, 速度+6）！`;
              } else {
                h.hp = Math.max(1, h.hp - 35);
                return `古魂震怒爆发反噬！受到了 35 点真实伤害！`;
              }
            }
          }
        ]
      },
      {
        id: 'merchant',
        title: '地精黑市秘商',
        icon: '🧙‍♂️',
        desc: '一名背着沉重包裹的深渊地精悄悄靠近，向你展示各种稀奇古怪的秘宝...',
        options: [
          {
            name: '🧪 购买【秘法魔药】',
            desc: '饮用后大幅拓宽最大法力与怒气上限',
            costText: '-50 禅意',
            canAfford: () => (state.zen || 0) >= 50,
            action: (h) => {
              spendZen(50, '购买魔药');
              h.maxMp += 30;
              h.mp = h.maxMp;
              h.atk += 8;
              return `消耗 50 禅意购买了魔药，最大法力 +30，力量 +8！`;
            }
          },
          {
            name: '🪙 贪婪契约',
            desc: '与地精立下契约，用体魄换取丰厚英雄币',
            costText: '-25 HP',
            action: (h) => {
              h.hp = Math.max(1, h.hp - 25);
              state.heroCoins = (state.heroCoins || 0) + 90;
              return `扣除 25 点生命，地精支付了 🪙 90 英雄币给你！`;
            }
          },
          {
            name: '🚶 挥手告别',
            desc: '不作理会，静心调整呼吸继续前行',
            costText: '无消耗',
            action: (h) => {
              h.mp = Math.min(h.maxMp, h.mp + 20);
              return `休整片刻，恢复了 20 点法力/战意。`;
            }
          }
        ]
      },
      {
        id: 'cursed_chest',
        title: '被诅咒的远古宝箱',
        icon: '📦',
        desc: '一口缠绕着紫色锁链的宝箱横在路旁，散发着诱人而危险的秘宝灵光...',
        options: [
          {
            name: '🗡️ 暴力撬锁',
            desc: '用蛮力斩断锁链，强行开箱',
            costText: '博弈开箱',
            action: (h) => {
              if (Math.random() < 0.65) {
                h.atk += 18;
                h.def += 12;
                return `开箱大吉！获得上古神兵加护（力量+18, 防御+12）！`;
              } else {
                h.hp = Math.max(1, h.hp - 30);
                return `触发陷阱！毒雾爆发扣除 30 点生命！`;
              }
            }
          },
          {
            name: '🔮 法力净化',
            desc: '灌注法力平息诅咒，安全吸收箱内能量',
            costText: '-40 MP',
            canAfford: (h) => h.mp >= 40,
            action: (h) => {
              h.mp -= 40;
              h.maxHp += 40;
              h.hp += 40;
              return `消耗 40 点法力净化成功！最大生命 +40 并立即回复！`;
            }
          },
          {
            name: '🛡️ 稳妥绕行',
            desc: '谨慎避开危险宝箱，加固自身灵能护盾',
            costText: '稳健',
            action: (h) => {
              h.shield += 50;
              return `保持警惕，获得了 50 点护盾！`;
            }
          }
        ]
      },
      {
        id: 'spring',
        title: '地脉熔岩灵泉',
        icon: '♨️',
        desc: '前方地脉裂隙中汇聚出一眼散发温润白雾的地下灵泉，令人心旷神怡...',
        options: [
          {
            name: '💧 浸泡灵泉',
            desc: '全身浸入泉水中，全面修复伤势与耗竭的法力',
            costText: '全满恢复',
            action: (h) => {
              h.hp = h.maxHp;
              h.mp = h.maxMp;
              h.shield += 30;
              return `灵泉浸润全身，生命与法力完全回满，并获得 30 点护盾！`;
            }
          },
          {
            name: '🔥 淬炼熔火核心',
            desc: '将灵泉中的地热精魄吸收进外壳',
            costText: '爆发强化',
            action: (h) => {
              h.atk += 14;
              h.critRate += 0.06;
              return `熔火淬体，力量 +14，暴击率 +6%！`;
            }
          }
        ]
      }
    ],

    getHeroStats(heroId) {
      const petLvl = state.pets?.[heroId]?.level || 1;
      const b = (typeof MarketSystem !== 'undefined' && MarketSystem.getTotalMarketBonuses) 
        ? MarketSystem.getTotalMarketBonuses() 
        : { hp: 0, atk: 0, def: 0, spd: 0 };

      if (heroId === 'papa') {
        const maxHp = Math.round(260 + petLvl * 28) + b.hp;
        return {
          id: 'papa',
          name: '帕帕',
          className: '战士 · 铁甲玄武',
          avatar: '🐢',
          maxHp,
          hp: maxHp,
          maxMp: 100,
          mp: 60,
          atk: Math.round(36 + petLvl * 4.5) + b.atk,
          def: Math.round(24 + petLvl * 3.8) + b.def,
          spd: Math.round(12 + petLvl * 1.2) + b.spd,
          critRate: 0.08,
          critMult: 1.5,
          level: 1,
          exp: 0,
          expNeeded: 100,
          shield: 0,
          skills: [],
          passives: [],
          buffs: [],
          usedIronWill: false
        };
      } else {
        const maxHp = Math.round(180 + petLvl * 18) + b.hp;
        return {
          id: 'pumpkin',
          name: '小南瓜',
          className: '法师 · 灵火玄龟',
          avatar: '🐢',
          maxHp,
          hp: maxHp,
          maxMp: 120,
          mp: 80,
          atk: Math.round(52 + petLvl * 7.2) + b.atk,
          def: Math.round(14 + petLvl * 2.0) + b.def,
          spd: Math.round(18 + petLvl * 2.6) + b.spd,
          critRate: 0.12,
          critMult: 1.6,
          level: 1,
          exp: 0,
          expNeeded: 100,
          shield: 0,
          skills: [],
          passives: [],
          buffs: [],
          usedIronWill: false
        };
      }
    },

    initUI() {
      const papaCard = $('#pickPapaCard');
      const pumpkinCard = $('#pickPumpkinCard');
      if (papaCard) {
        papaCard.onclick = () => {
          AbyssEngine.selectedHeroId = 'papa';
          papaCard.classList.add('selected');
          pumpkinCard?.classList.remove('selected');
        };
      }
      if (pumpkinCard) {
        pumpkinCard.onclick = () => {
          AbyssEngine.selectedHeroId = 'pumpkin';
          pumpkinCard.classList.add('selected');
          papaCard?.classList.remove('selected');
        };
      }

      const startBtn = $('#startAbyssRunBtn');
      if (startBtn) {
        startBtn.onclick = (e) => {
          e.preventDefault();
          AbyssEngine.startRun();
        };
      }

      const speedBtn = $('#battleSpeedBtn');
      if (speedBtn) {
        speedBtn.onclick = () => {
          AbyssEngine.speed = AbyssEngine.speed === 1 ? 2 : 1;
          speedBtn.textContent = `⚡ ${AbyssEngine.speed}x 速`;
        };
      }

      const autoBtn = $('#battleAutoBtn');
      if (autoBtn) {
        autoBtn.onclick = () => {
          AbyssEngine.isAuto = !AbyssEngine.isAuto;
          autoBtn.textContent = `🤖 自动: ${AbyssEngine.isAuto ? '开' : '关'}`;
          autoBtn.style.borderColor = AbyssEngine.isAuto ? '#facc15' : '';
          if (AbyssEngine.isAuto && AbyssEngine.isPlayerTurn && !AbyssEngine.isProcessing) {
            AbyssEngine.autoPlayTurn();
          }
        };
      }

      const forfeitBtn = $('#battleForfeitBtn');
      if (forfeitBtn) {
        forfeitBtn.onclick = () => {
          if (confirm('确定要放弃本次魔渊挑战并返回大厅吗？')) {
            AbyssEngine.endRun(false);
          }
        };
      }

      const basicAtkBtn = $('#basicAtkBtn');
      if (basicAtkBtn) {
        basicAtkBtn.onclick = () => {
          if (!AbyssEngine.isPlayerTurn || AbyssEngine.isProcessing) return;
          AbyssEngine.playerAttack();
        };
      }

      const resultCloseBtn = $('#resultCloseBtn');
      if (resultCloseBtn) {
        resultCloseBtn.onclick = () => {
          $('#battleResultOverlay')?.classList.add('hidden');
          $('#abyssBattleView')?.classList.add('hidden');
          $('#abyssLobbyView')?.classList.remove('hidden');
          AbyssEngine.updateLobbyDisplay();
        };
      }

      const backGardenBtn = $('#abyssBackGardenBtn');
      if (backGardenBtn) {
        backGardenBtn.onclick = () => {
          switchWorldMode('garden');
        };
      }

      $$('.stat-choice-card').forEach(card => {
        card.onclick = () => {
          const statType = card.dataset.statType;
          AbyssEngine.applyStatChoice(statType);
        };
      });
    },

    updateLobbyDisplay() {
      const papaStats = AbyssEngine.getHeroStats('papa');
      const pumpkinStats = AbyssEngine.getHeroStats('pumpkin');

      if ($('#lobbyPapaLvl')) $('#lobbyPapaLvl').textContent = `Lv.${state.pets?.papa?.level || 1}`;
      if ($('#papaStatHp')) $('#papaStatHp').textContent = papaStats.maxHp;
      if ($('#papaStatAtk')) $('#papaStatAtk').textContent = papaStats.atk;
      if ($('#papaStatDef')) $('#papaStatDef').textContent = papaStats.def;
      if ($('#papaStatSpd')) $('#papaStatSpd').textContent = papaStats.spd;

      if ($('#lobbyPumpkinLvl')) $('#lobbyPumpkinLvl').textContent = `Lv.${state.pets?.pumpkin?.level || 1}`;
      if ($('#pumpkinStatHp')) $('#pumpkinStatHp').textContent = pumpkinStats.maxHp;
      if ($('#pumpkinStatAtk')) $('#pumpkinStatAtk').textContent = pumpkinStats.atk;
      if ($('#pumpkinStatDef')) $('#pumpkinStatDef').textContent = pumpkinStats.def;
      if ($('#pumpkinStatSpd')) $('#pumpkinStatSpd').textContent = pumpkinStats.spd;

      if ($('#lobbyZenBalance')) $('#lobbyZenBalance').textContent = (state.zen || 0).toLocaleString();
    },

    startRun() {
      if (typeof state.zen !== 'number' || isNaN(state.zen)) state.zen = 2480;

      if (!spendZen(100, '进入魔渊挑战')) {
        toast('禅意不足', `进入魔渊需要 100 禅意，当前拥有 ${state.zen} 点禅意。`);
        return;
      }

      persist();
      render();
      sync(true);

      AbyssEngine.hero = AbyssEngine.getHeroStats(AbyssEngine.selectedHeroId);
      const initialSkill = AbyssEngine.selectedHeroId === 'papa' 
        ? JSON.parse(JSON.stringify(AbyssEngine.augments.fighterActives[0]))
        : JSON.parse(JSON.stringify(AbyssEngine.augments.mageActives[0]));
      AbyssEngine.hero.skills = [initialSkill];

      AbyssEngine.currentChapter = 1;
      AbyssEngine.currentStage = 1;
      AbyssEngine.totalFloorIndex = 1;
      AbyssEngine.isRunning = true;
      AbyssEngine.isProcessing = false;

      $('#abyssLobbyView')?.classList.add('hidden');
      $('#abyssBattleView')?.classList.remove('hidden');

      toast('⚔️ 魔渊开启', `你率领【${AbyssEngine.hero.name}】踏入了第 1 章 · 枯骨幽穴！`);
      AbyssEngine.startStage();
    },

    applyBuff(targetEntity, buff) {
      if (!targetEntity) return;
      if (!Array.isArray(targetEntity.buffs)) targetEntity.buffs = [];
      const existing = targetEntity.buffs.find(b => b.id === buff.id);
      if (existing) {
        existing.turns = Math.max(existing.turns, buff.turns);
        if (buff.value) existing.value = buff.value;
      } else {
        targetEntity.buffs.push({ ...buff });
      }
    },

    processTurnBuffs(entity, entityType) {
      if (!entity || !Array.isArray(entity.buffs) || entity.buffs.length === 0) return { isStunned: false };
      let isStunned = false;

      for (let i = entity.buffs.length - 1; i >= 0; i--) {
        const b = entity.buffs[i];
        if (b.id === 'poison') {
          const dmg = b.value || 15;
          entity.hp -= dmg;
          AbyssEngine.showDmg(entityType, `🩸 中毒 -${dmg}`, 'normal');
          AbyssEngine.log(`【${entity.name}】受到剧毒侵蚀，损失 <b>${dmg}</b> 点真实生命！`);
        } else if (b.id === 'burn') {
          const dmg = b.value || 20;
          entity.hp -= dmg;
          AbyssEngine.showDmg(entityType, `🔥 灼烧 -${dmg}`, 'normal');
          AbyssEngine.log(`【${entity.name}】受到烈焰灼烧，损失 <b>${dmg}</b> 点伤害！`);
        } else if (b.id === 'freeze' || b.id === 'stun') {
          isStunned = true;
          AbyssEngine.showDmg(entityType, b.id === 'freeze' ? '❄️ 冰冻跳过!' : '💫 眩晕跳过!', 'block');
          AbyssEngine.log(`【${entity.name}】处于【${b.id === 'freeze' ? '极寒冰封' : '眩晕震慑'}】状态，本回合无法行动！`);
        }

        b.turns--;
        if (b.turns <= 0) {
          entity.buffs.splice(i, 1);
        }
      }

      return { isStunned };
    },

    planMonsterNextAction(m, h) {
      if (!m) return;
      if (m.rage >= 100) {
        const ult = m.archData?.ult || { name: '毁灭绝技', icon: '💥' };
        m.nextAction = { type: 'ult', data: ult };
        m.intentText = `💥 意图：【${ult.name}】绝技！`;
        return;
      }

      const skills = m.archData?.skills || [];
      if (skills.length > 0 && Math.random() < 0.65) {
        const picked = skills[Math.floor(Math.random() * skills.length)];
        m.nextAction = { type: 'skill', data: picked };
        m.intentText = `${picked.icon} 意图：${picked.name}`;
      } else {
        m.nextAction = { type: 'attack' };
        m.intentText = '⚔️ 意图：普通重击';
      }
    },

    startStage() {
      const ch = AbyssEngine.chapters[AbyssEngine.currentChapter - 1];
      const isBoss = AbyssEngine.currentStage === ch.maxStage;
      const isElite = ch.hasElite && AbyssEngine.currentStage === ch.eliteStage;

      let monsterName = '';
      let monsterAvatar = '💀';
      let archKey = 'berserker';

      const floor = AbyssEngine.totalFloorIndex;
      // 优化后的平滑成长四维基准
      const hpBase = Math.round((130 + floor * 26) * Math.pow(1.055, floor));
      const atkBase = Math.round((22 + floor * 3.4) * Math.pow(1.042, floor));
      const defBase = Math.round((9 + floor * 1.8) * Math.pow(1.032, floor));
      const spdBase = Math.round(9 + floor * 0.85);

      let mHp = hpBase;
      let mAtk = atkBase;
      let mDef = defBase;
      let mSpd = spdBase;

      if (isBoss) {
        monsterName = ch.bossName;
        monsterAvatar = ch.bossAvatar;
        archKey = ch.bossArch || 'boss';
        mHp = Math.round(mHp * 2.6);
        mAtk = Math.round(mAtk * 1.35);
        mDef = Math.round(mDef * 1.25);
        mSpd = Math.round(mSpd * 1.15);
      } else if (isElite) {
        monsterName = ch.eliteName;
        monsterAvatar = ch.eliteAvatar;
        archKey = ch.eliteArch || 'caster';
        mHp = Math.round(mHp * 1.85);
        mAtk = Math.round(mAtk * 1.2);
        mDef = Math.round(mDef * 1.15);
        mSpd = Math.round(mSpd * 1.1);
      } else {
        const pool = AbyssEngine.minionConfigs[AbyssEngine.currentChapter] || [
          { name: '深渊魔物', avatar: '👾', archetype: 'berserker' }
        ];
        const minion = pool[(AbyssEngine.currentStage - 1) % pool.length];
        monsterName = minion.name;
        monsterAvatar = minion.avatar;
        archKey = minion.archetype || 'berserker';

        // 根据流派微调四维倾向
        if (archKey === 'tank') {
          mHp = Math.round(mHp * 1.35);
          mDef = Math.round(mDef * 1.3);
          mAtk = Math.round(mAtk * 0.88);
          mSpd = Math.round(mSpd * 0.85);
        } else if (archKey === 'berserker') {
          mAtk = Math.round(mAtk * 1.22);
          mSpd = Math.round(mSpd * 1.05);
          mDef = Math.round(mDef * 0.9);
        } else if (archKey === 'caster') {
          mAtk = Math.round(mAtk * 1.2);
          mSpd = Math.round(mSpd * 1.1);
          mDef = Math.round(mDef * 0.8);
          mHp = Math.round(mHp * 0.92);
        } else if (archKey === 'toxic') {
          mSpd = Math.round(mSpd * 1.25);
          mDef = Math.round(mDef * 0.85);
          mHp = Math.round(mHp * 0.95);
        }
      }

      const archData = AbyssEngine.monsterArchetypes[archKey] || AbyssEngine.monsterArchetypes.berserker;
      const typeTag = isBoss ? `领主 BOSS · ${archData.tag}` : (isElite ? `精英 · ${archData.tag}` : archData.tag);

      AbyssEngine.monster = {
        name: monsterName,
        avatar: monsterAvatar,
        typeTag,
        archKey,
        archData,
        level: AbyssEngine.totalFloorIndex,
        maxHp: mHp,
        hp: mHp,
        atk: mAtk,
        def: mDef,
        spd: mSpd,
        shield: isBoss && ch.id === 1 ? Math.round(mHp * 0.2) : 0,
        rage: 0,
        maxRage: 100,
        buffs: [],
        isBoss,
        isElite,
        isBerserk: false,
        intentText: '⚔️ 意图：普通重击',
        nextAction: { type: 'attack' },
        trait: isBoss ? ch.bossTrait : (isElite ? '⚔️ 精英强韧: 拥有高额生命与坚固外壳' : '')
      };

      AbyssEngine.isProcessing = false;
      AbyssEngine.hero.skills.forEach(s => { s.curCd = 0; });
      AbyssEngine.planMonsterNextAction(AbyssEngine.monster, AbyssEngine.hero);

      $('#battleChapterBadge').textContent = `第 ${ch.id} 章 · ${ch.name}`;
      $('#battleStageName').textContent = `关卡 ${ch.id}-${AbyssEngine.currentStage} [${typeTag}]`;

      AbyssEngine.log(`进入第 ${ch.id} 章 关卡 ${ch.id}-${AbyssEngine.currentStage}，遭遇【${monsterName}】(${archData.tag})！${AbyssEngine.monster.trait ? `<br><small style="color:#fde047;">${AbyssEngine.monster.trait}</small>` : ''}`);

      // 先手判定 (考虑减速等状态)
      const firstStrike = AbyssEngine.hero.passives.some(p => p.id === 'first_strike');
      if (firstStrike || AbyssEngine.hero.spd >= AbyssEngine.monster.spd) {
        AbyssEngine.isPlayerTurn = true;
        $('#turnIndicator').textContent = '✦ 你的回合 ✦';
        $('#turnIndicator').style.color = '#fde047';
      } else {
        AbyssEngine.isPlayerTurn = false;
        $('#turnIndicator').textContent = '✦ 敌方先手 ✦';
        $('#turnIndicator').style.color = '#f87171';
        setTimeout(() => AbyssEngine.monsterTurn(), AbyssEngine.getDelay(600));
      }

      AbyssEngine.renderBattle();

      if (AbyssEngine.isAuto && AbyssEngine.isPlayerTurn) {
        setTimeout(() => AbyssEngine.autoPlayTurn(), AbyssEngine.getDelay(500));
      }
    },

    getDelay(baseMs) {
      return AbyssEngine.speed === 2 ? Math.round(baseMs / 2) : baseMs;
    },

    log(msg) {
      const box = $('#battleCombatLog');
      if (!box) return;
      const el = document.createElement('div');
      el.className = 'log-entry';
      el.innerHTML = msg;
      box.appendChild(el);
      box.scrollTop = box.scrollHeight;
    },

    renderBattle() {
      const h = AbyssEngine.hero;
      const m = AbyssEngine.monster;
      if (!h || !m) return;

      $('#heroBattleName').textContent = h.name;
      $('#heroDungeonLvl').textContent = `Lv.${h.level}`;
      $('#heroClassTag').textContent = h.id === 'papa' ? '战士 · 铁甲玄武' : '法师 · 灵火玄龟';
      $('#heroBattleAvatar').textContent = h.avatar;

      // 英雄血条与蓝条
      const heroHpPct = Math.max(0, Math.min(100, Math.round((h.hp / h.maxHp) * 100)));
      $('#heroHpFill').style.width = `${heroHpPct}%`;
      $('#heroHpText').textContent = `${Math.max(0, h.hp)} / ${h.maxHp}`;

      const heroMpPct = Math.max(0, Math.min(100, Math.round((h.mp / h.maxMp) * 100)));
      if ($('#heroMpFill')) $('#heroMpFill').style.width = `${heroMpPct}%`;
      if ($('#heroMpText')) $('#heroMpText').textContent = `${h.mp} / ${h.maxMp} ${h.id === 'papa' ? '战意' : 'MP'}`;

      if (h.shield > 0) {
        $('#heroShieldBar').style.display = 'block';
        $('#heroShieldFill').style.width = `${Math.min(100, Math.round((h.shield / h.maxHp) * 100))}%`;
        $('#heroShieldText').textContent = `🛡️ 护盾 ${h.shield}`;
      } else {
        $('#heroShieldBar').style.display = 'none';
      }

      // 英雄 Buff 徽章展示
      const heroBuffsContainer = $('#heroBuffs');
      if (heroBuffsContainer) {
        heroBuffsContainer.innerHTML = (h.buffs || []).map(b => {
          let icon = '✨';
          let cls = 'buff-badge';
          if (b.id === 'poison') { icon = '🩸'; cls += ' buff-poison'; }
          else if (b.id === 'burn') { icon = '🔥'; cls += ' buff-burn'; }
          else if (b.id === 'freeze') { icon = '❄️'; cls += ' buff-freeze'; }
          else if (b.id === 'stun') { icon = '💫'; cls += ' buff-stun'; }
          else if (b.id === 'shred') { icon = '🛡️'; cls += ' buff-shred'; }
          else if (b.id === 'slow') { icon = '⚡'; cls += ' buff-slow'; }
          return `<span class="${cls}">${icon} ${escapeHTML(b.name || b.id)}(${b.turns})</span>`;
        }).join('');
      }

      // 敌方血条、怒气大招条与护盾条
      $('#monsterBattleName').textContent = m.name;
      $('#monsterDungeonLvl').textContent = `Lv.${m.level}`;
      $('#monsterClassTag').textContent = m.typeTag;
      $('#monsterBattleAvatar').textContent = m.avatar;

      // 终焉古神狂暴形态检测
      if (m.isBoss && m.hp / m.maxHp < 0.5 && !m.isBerserk && AbyssEngine.currentChapter === 5) {
        m.isBerserk = true;
        m.atk = Math.round(m.atk * 1.3);
        m.spd = Math.round(m.spd * 1.25);
        AbyssEngine.applyBuff(m, { id: 'berserk', name: '神魔暴走', turns: 99 });
        AbyssEngine.log('🔥 <b>【魔渊终焉之神】进入【神魔暴走形态】！攻击力与身法大幅爆发！</b>');
        $('#monsterFighterCard')?.classList.add('is-berserk');
      }

      const mHpPct = Math.max(0, Math.min(100, Math.round((m.hp / m.maxHp) * 100)));
      $('#monsterHpFill').style.width = `${mHpPct}%`;
      $('#monsterHpText').textContent = `${Math.max(0, m.hp)} / ${m.maxHp}`;

      const mRagePct = Math.max(0, Math.min(100, Math.round((m.rage / m.maxRage) * 100)));
      if ($('#monsterRageFill')) {
        $('#monsterRageFill').style.width = `${mRagePct}%`;
        $('#monsterRageFill').classList.toggle('full-rage', m.rage >= 100);
      }
      if ($('#monsterRageText')) {
        $('#monsterRageText').textContent = m.rage >= 100 ? '🔥 绝技蓄力完毕！' : `⚡ 怒气 ${m.rage}%`;
      }

      // 敌方护盾条
      if ($('#monsterShieldBar')) {
        if (m.shield > 0) {
          $('#monsterShieldBar').style.display = 'block';
          $('#monsterShieldFill').style.width = `${Math.min(100, Math.round((m.shield / m.maxHp) * 100))}%`;
          $('#monsterShieldText').textContent = `🛡️ 护盾 ${m.shield}`;
        } else {
          $('#monsterShieldBar').style.display = 'none';
        }
      }

      if ($('#monsterIntent')) {
        $('#monsterIntent').textContent = m.intentText || '⚔️ 意图：普通重击';
        if (m.rage >= 100) {
          $('#monsterIntent').style.color = '#f87171';
        } else {
          $('#monsterIntent').style.color = '#fca5a5';
        }
      }

      // 怪物 Buff 徽章展示
      const monsterBuffsContainer = $('#monsterBuffs');
      if (monsterBuffsContainer) {
        monsterBuffsContainer.innerHTML = (m.buffs || []).map(b => {
          let icon = '✨';
          let cls = 'buff-badge';
          if (b.id === 'poison') { icon = '🩸'; cls += ' buff-poison'; }
          else if (b.id === 'burn') { icon = '🔥'; cls += ' buff-burn'; }
          else if (b.id === 'freeze') { icon = '❄️'; cls += ' buff-freeze'; }
          else if (b.id === 'stun') { icon = '💫'; cls += ' buff-stun'; }
          else if (b.id === 'shred') { icon = '🛡️'; cls += ' buff-shred'; }
          else if (b.id === 'slow') { icon = '⚡'; cls += ' buff-slow'; }
          else if (b.id === 'berserk') { icon = '🔥'; cls += ' buff-berserk'; }
          return `<span class="${cls}">${icon} ${escapeHTML(b.name || b.id)}${b.turns < 90 ? `(${b.turns})` : ''}</span>`;
        }).join('');
      }

      const passivesTray = $('#passivePerksTray');
      if (passivesTray) {
        passivesTray.innerHTML = h.passives.map(p => `
          <span class="passive-perk-icon" title="${p.name}: ${p.desc}">${p.icon} ${p.name}</span>
        `).join('');
      }

      const dynamicSlots = $('#dynamicSkillSlots');
      if (dynamicSlots) {
        dynamicSlots.innerHTML = h.skills.map((s, idx) => {
          const isCd = s.curCd > 0;
          const isNoMp = h.mp < s.mpCost;
          const isDisabled = isCd || isNoMp || !AbyssEngine.isPlayerTurn || AbyssEngine.isProcessing;
          return `
            <button class="skill-card-btn ${isCd ? 'on-cd' : (isNoMp ? 'no-mp' : 'ready')}" 
                    data-skill-idx="${idx}" 
                    title="${escapeHTML(s.name)} (消耗: ${s.mpCost} MP | 冷却: ${s.cd}回合): ${escapeHTML(s.desc)}" 
                    ${isDisabled ? 'disabled' : ''}>
              <span class="skill-icon">${s.icon}</span>
              <div class="skill-meta">
                <div class="skill-title-row">
                  <b>${escapeHTML(s.name)}</b>
                  <span class="skill-cost-badge ${isCd ? 'badge-cd' : (isNoMp ? 'badge-nomp' : 'badge-ready')}">
                    ${isCd ? `CD: ${s.curCd}` : `${s.mpCost} MP`}
                  </span>
                </div>
                <small>${escapeHTML(s.desc)}</small>
              </div>
            </button>
          `;
        }).join('');

        $$('button[data-skill-idx]', dynamicSlots).forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = Number(btn.dataset.skillIdx);
            AbyssEngine.playerCastSkill(idx);
          });
        });
      }

      if ($('#basicAtkBtn')) {
        $('#basicAtkBtn').disabled = !AbyssEngine.isPlayerTurn || AbyssEngine.isProcessing;
      }
    },

    showDmg(target, text, type = 'normal') {
      const box = $('#floatingDamageBox');
      if (!box) return;
      const el = document.createElement('div');
      el.className = `dmg-text dmg-${type}`;
      el.textContent = text;
      box.appendChild(el);
      setTimeout(() => el.remove(), 800);

      const card = target === 'hero' ? $('#heroFighterCard') : $('#monsterFighterCard');
      if (card) {
        card.classList.remove('hit-shake');
        void card.offsetWidth;
        card.classList.add('hit-shake');
      }
    },

    playFx(fxType) {
      const layer = $('#battleFxLayer');
      if (!layer) return;
      const el = document.createElement('div');
      el.className = `fx-${fxType}`;
      layer.appendChild(el);
      setTimeout(() => el.remove(), 700);
    },

    playerAttack() {
      if (!AbyssEngine.isPlayerTurn || AbyssEngine.isProcessing) return;
      AbyssEngine.isProcessing = true;

      const h = AbyssEngine.hero;
      const m = AbyssEngine.monster;

      // 虚空领主/影侍 闪避特性判定
      if (m.isBoss && AbyssEngine.currentChapter === 4 && Math.random() < 0.15) {
        AbyssEngine.showDmg('monster', '💨 虚空闪避!', 'block');
        AbyssEngine.log(`【${m.name}】进入虚空裂隙，闪避了【${h.name}】的普攻！`);
        AbyssEngine.renderBattle();
        AbyssEngine.checkBattleResult();
        return;
      }

      // 英雄突进斩击动作与金色刀光
      $('#heroFighterCard')?.classList.add('dash-strike');
      setTimeout(() => $('#heroFighterCard')?.classList.remove('dash-strike'), 400);
      AbyssEngine.playFx('slash-slash');

      const isCrit = Math.random() < h.critRate;
      let rawDmg = h.atk * (isCrit ? h.critMult : 1);

      const hasExecute = h.passives.some(p => p.id === 'divine_execute');
      if (hasExecute) {
        const lostHp = m.maxHp - m.hp;
        rawDmg += lostHp * 0.18;
      }

      let mDef = m.def;
      const shredBuff = (m.buffs || []).find(b => b.id === 'shred');
      if (shredBuff) {
        mDef = Math.max(0, mDef * (1 - (shredBuff.value || 25) / 100));
      }

      let finalDmg = Math.max(1, Math.round(rawDmg * (100 / (100 + mDef))));

      // 敌方护盾抵消
      if (m.shield > 0) {
        if (m.shield >= finalDmg) {
          m.shield -= finalDmg;
          AbyssEngine.showDmg('monster', `🛡️ 抵消 ${finalDmg}`, 'block');
          AbyssEngine.log(`【${h.name}】普通攻击被【${m.name}】护盾完全吸收！`);
          finalDmg = 0;
        } else {
          finalDmg -= m.shield;
          AbyssEngine.showDmg('monster', `🛡️ 碎盾 -${finalDmg}`, 'normal');
          m.shield = 0;
          m.hp -= finalDmg;
          AbyssEngine.log(`【${h.name}】击碎了【${m.name}】的护盾，并造成 <b>${finalDmg}</b> 点伤害！`);
        }
      } else {
        m.hp -= finalDmg;
        AbyssEngine.showDmg('monster', `-${finalDmg}${isCrit ? ' 💥暴击!' : ''}`, isCrit ? 'crit' : 'normal');
        AbyssEngine.log(`【${h.name}】冲锋普通攻击命中【${m.name}】，造成 <b>${finalDmg}</b> 点物理伤害！`);
      }

      // 普攻回蓝机制 (战士+25，法师+15)
      const mpGain = h.id === 'papa' ? 25 : 15;
      h.mp = Math.min(h.maxMp, h.mp + mpGain);
      AbyssEngine.showDmg('hero', `+${mpGain} MP`, 'heal');

      if (isCrit) {
        $('#abyssStage')?.classList.add('screen-shake-heavy');
        setTimeout(() => $('#abyssStage')?.classList.remove('screen-shake-heavy'), 500);
      }

      $('#monsterFighterCard')?.classList.add('hit-flash');
      setTimeout(() => $('#monsterFighterCard')?.classList.remove('hit-flash'), 350);

      // 炎狱巨兽反伤特性
      if (m.isBoss && AbyssEngine.currentChapter === 3 && finalDmg > 0) {
        const reflectDmg = Math.round(finalDmg * 0.15);
        h.hp = Math.max(1, h.hp - reflectDmg);
        AbyssEngine.showDmg('hero', `🔥 熔火反震 -${reflectDmg}`, 'normal');
        AbyssEngine.log(`【${m.name}】的熔火躯壳反震了 <b>${reflectDmg}</b> 点烈焰伤害给【${h.name}】！`);
      }

      // 毒煞蛛皇蛛网减速特性
      if (m.isBoss && AbyssEngine.currentChapter === 2 && Math.random() < 0.35) {
        AbyssEngine.applyBuff(h, { id: 'slow', name: '蛛网缠绕', turns: 2, value: 20 });
        AbyssEngine.log(`【${m.name}】喷吐猛毒蛛网，使【${h.name}】速度降低 20%！`);
      }

      if (h.passives.some(p => p.id === 'bloodthirst') && finalDmg > 0) {
        const heal = Math.round(finalDmg * 0.25);
        h.hp = Math.min(h.maxHp, h.hp + heal);
        AbyssEngine.showDmg('hero', `+${heal}`, 'heal');
      }

      if (h.passives.some(p => p.id === 'fatal_tempo')) {
        h.spd += 4;
        h.critRate += 0.03;
      }

      AbyssEngine.planMonsterNextAction(m, h);
      AbyssEngine.renderBattle();
      AbyssEngine.checkBattleResult();
    },

    playerCastSkill(skillIdx) {
      if (!AbyssEngine.isPlayerTurn || AbyssEngine.isProcessing) return;
      const s = AbyssEngine.hero.skills[skillIdx];
      if (!s || s.curCd > 0) return;

      const h = AbyssEngine.hero;
      const m = AbyssEngine.monster;

      if (h.mp < s.mpCost) {
        toast('法力不足', `需要 ${s.mpCost} 点${h.id === 'papa' ? '战意' : '法力'}，请通过普通攻击回复！`);
        return;
      }

      AbyssEngine.isProcessing = true;
      s.curCd = s.cd + 1;
      h.mp = Math.max(0, h.mp - s.mpCost);

      // 技能施法动作与全屏特效
      if (h.id === 'papa') {
        if (s.id === 'whirlwind') {
          $('#heroFighterCard')?.classList.add('spin-whirlwind');
          setTimeout(() => $('#heroFighterCard')?.classList.remove('spin-whirlwind'), 600);
          AbyssEngine.playFx('slash-slash');
        } else {
          $('#heroFighterCard')?.classList.add('dash-strike');
          setTimeout(() => $('#heroFighterCard')?.classList.remove('dash-strike'), 400);
          AbyssEngine.playFx('firestorm-blast');
        }
      } else {
        $('#heroFighterCard')?.classList.add('cast-spell');
        setTimeout(() => $('#heroFighterCard')?.classList.remove('cast-spell'), 500);
        if (s.id === 'firestorm') AbyssEngine.playFx('firestorm-blast');
        else if (s.id === 'frostbite') AbyssEngine.playFx('frost-freeze');
        else if (s.id === 'thunder') {
          AbyssEngine.playFx('thunder-strike');
          $('#abyssStage')?.classList.add('screen-shake-heavy');
          setTimeout(() => $('#abyssStage')?.classList.remove('screen-shake-heavy'), 500);
        } else AbyssEngine.playFx('slash-slash');
      }

      if (s.shieldPct) {
        const shieldVal = Math.round(h.maxHp * s.shieldPct);
        h.shield += shieldVal;
        h.def += Math.round(h.def * (s.defBuff / 100));
        AbyssEngine.showDmg('hero', `🛡️ +${shieldVal}`, 'block');
        AbyssEngine.log(`【${h.name}】施放【${s.name}】，消耗 ${s.mpCost} MP，获得 <b>${shieldVal}</b> 点坚韧护盾并提高防御！`);
      } else {
        const isCrit = Math.random() < h.critRate;
        let rawDmg = h.atk * s.mult * (isCrit ? h.critMult : 1);
        if (h.passives.some(p => p.id === 'divine_execute')) {
          rawDmg += (m.maxHp - m.hp) * 0.18;
        }

        let defVal = m.def;
        if (s.shred) {
          defVal = Math.max(0, defVal * (1 - s.shred / 100));
          AbyssEngine.applyBuff(m, { id: 'shred', name: '破甲', turns: 2, value: s.shred });
          AbyssEngine.log(`【${m.name}】护甲被撕裂 25%！`);
        }

        let finalDmg = Math.max(1, Math.round(rawDmg * (100 / (100 + defVal))));

        // 护盾吸收
        if (m.shield > 0) {
          if (m.shield >= finalDmg) {
            m.shield -= finalDmg;
            AbyssEngine.showDmg('monster', `🛡️ 抵消 ${finalDmg}`, 'block');
            finalDmg = 0;
          } else {
            finalDmg -= m.shield;
            m.shield = 0;
            m.hp -= finalDmg;
            AbyssEngine.showDmg('monster', `🛡️ 碎盾 -${finalDmg}`, 'normal');
          }
        } else {
          m.hp -= finalDmg;
          AbyssEngine.showDmg('monster', `-${finalDmg}${isCrit ? ' 💥暴击!' : ''}`, isCrit ? 'crit' : 'normal');
        }

        $('#monsterFighterCard')?.classList.add('hit-flash');
        setTimeout(() => $('#monsterFighterCard')?.classList.remove('hit-flash'), 350);

        AbyssEngine.log(`【${h.name}】施放奥义【${s.name}】(消耗 ${s.mpCost} MP)，对【${m.name}】造成 <b>${finalDmg}</b> 点毁灭伤害！`);

        // 附带状态判定 (冰冻、眩晕、灼烧、减速)
        if (s.freezeChance && Math.random() < s.freezeChance) {
          AbyssEngine.applyBuff(m, { id: 'freeze', name: '极寒冰封', turns: 1 });
          AbyssEngine.showDmg('monster', '❄️ 冰冻冻结!', 'block');
          AbyssEngine.log(`【${m.name}】被极寒奥义深度冻结，跳过下回合！`);
        }
        if (s.stunChance && Math.random() < s.stunChance) {
          AbyssEngine.applyBuff(m, { id: 'stun', name: '巨力眩晕', turns: 1 });
          AbyssEngine.showDmg('monster', '💫 眩晕倒地!', 'block');
          AbyssEngine.log(`【${m.name}】被巨力破甲震眩晕，打断蓄力！`);
        }
        if (s.burnDot) {
          const burnDmg = Math.max(1, Math.round(h.atk * s.burnDot));
          AbyssEngine.applyBuff(m, { id: 'burn', name: '灼烧', turns: 3, value: burnDmg });
          AbyssEngine.log(`【${m.name}】身中烈焰灼烧，每回合持续受到 <b>${burnDmg}</b> 点伤害！`);
        }
        if (s.slowPct) {
          AbyssEngine.applyBuff(m, { id: 'slow', name: '迟缓', turns: 2, value: s.slowPct });
          AbyssEngine.log(`【${m.name}】大地重压下速度降低 40%！`);
        }

        if (h.passives.some(p => p.id === 'bloodthirst') && finalDmg > 0) {
          const heal = Math.round(finalDmg * 0.25);
          h.hp = Math.min(h.maxHp, h.hp + heal);
          AbyssEngine.showDmg('hero', `+${heal}`, 'heal');
        }
      }

      AbyssEngine.planMonsterNextAction(m, h);
      AbyssEngine.renderBattle();
      AbyssEngine.checkBattleResult();
    },

    monsterTurn() {
      const h = AbyssEngine.hero;
      const m = AbyssEngine.monster;
      if (!h || !m || h.hp <= 0 || m.hp <= 0) return;

      $('#turnIndicator').textContent = '✦ 敌方行动 ✦';
      $('#turnIndicator').style.color = '#f87171';

      // 回合开始结算怪物身上的 DoT / 冰冻眩晕
      const buffStatus = AbyssEngine.processTurnBuffs(m, 'monster');
      AbyssEngine.renderBattle();

      if (m.hp <= 0) {
        AbyssEngine.checkBattleResult();
        return;
      }

      if (buffStatus.isStunned) {
        // 处于冰冻或眩晕中，跳过攻击
        setTimeout(() => {
          AbyssEngine.endMonsterTurn();
        }, AbyssEngine.getDelay(600));
        return;
      }

      $('#monsterFighterCard')?.classList.add('monster-lunge');
      setTimeout(() => $('#monsterFighterCard')?.classList.remove('monster-lunge'), 400);

      const action = m.nextAction || { type: 'attack' };
      let rawDmg = 0;
      let isUlt = action.type === 'ult';

      if (isUlt) {
        m.rage = 0;
        const ult = action.data || { mult: 1.75, name: '毁灭绝技' };
        rawDmg = m.atk * ult.mult;

        AbyssEngine.playFx('firestorm-blast');
        $('#abyssStage')?.classList.add('screen-shake-heavy');
        setTimeout(() => $('#abyssStage')?.classList.remove('screen-shake-heavy'), 600);

        if (ult.manaBurn) {
          h.mp = Math.max(0, h.mp - ult.manaBurn);
          AbyssEngine.showDmg('hero', `-${ult.manaBurn} MP`, 'normal');
          AbyssEngine.log(`【${m.name}】释放绝技附带法力燃烧，【${h.name}】损失了 ${ult.manaBurn} 点法力！`);
        }
        if (ult.shieldBreak && h.shield > 0) {
          h.shield = 0;
          AbyssEngine.showDmg('hero', `💥 护盾粉碎!`, 'normal');
          AbyssEngine.log(`【${m.name}】泰坦崩裂波瞬间震碎了【${h.name}】的所有护盾！`);
        }
      } else if (action.type === 'skill') {
        const sk = action.data;
        rawDmg = m.atk * (sk.mult || 1.1);

        if (sk.poisonPct) {
          const pDmg = Math.max(1, Math.round(m.atk * sk.poisonPct));
          AbyssEngine.applyBuff(h, { id: 'poison', name: '剧毒', turns: sk.poisonTurns || 2, value: pDmg });
          AbyssEngine.log(`【${m.name}】施展【${sk.name}】，令【${h.name}】深陷剧毒，每回合受到 <b>${pDmg}</b> 点真伤！`);
        }
        if (sk.burnPct) {
          const bDmg = Math.max(1, Math.round(m.atk * sk.burnPct));
          AbyssEngine.applyBuff(h, { id: 'burn', name: '灼烧', turns: sk.burnTurns || 2, value: bDmg });
          AbyssEngine.log(`【${m.name}】施展【${sk.name}】，令【${h.name}】陷入烈焰灼烧！`);
        }
        if (sk.slowPct) {
          AbyssEngine.applyBuff(h, { id: 'slow', name: '迟缓', turns: sk.slowTurns || 2, value: sk.slowPct });
          AbyssEngine.log(`【${m.name}】施展【${sk.name}】，降低了【${h.name}】30% 身法速度！`);
        }
        if (sk.shred) {
          AbyssEngine.applyBuff(h, { id: 'shred', name: '破甲', turns: 2, value: sk.shred });
          AbyssEngine.log(`【${m.name}】施展【${sk.name}】，撕裂了【${h.name}】20% 防御！`);
        }
        if (sk.shieldPct) {
          const sVal = Math.round(m.maxHp * sk.shieldPct);
          m.shield += sVal;
          AbyssEngine.showDmg('monster', `🧱 +${sVal}`, 'block');
          AbyssEngine.log(`【${m.name}】凝聚冥石外壳，获得 <b>${sVal}</b> 点坚固岩盾！`);
        }

        m.rage = Math.min(100, m.rage + 25);
      } else {
        rawDmg = m.atk * (0.9 + Math.random() * 0.2);
        m.rage = Math.min(100, m.rage + (m.isBoss ? 40 : 35));
      }

      let hDef = h.def;
      const heroShred = (h.buffs || []).find(b => b.id === 'shred');
      if (heroShred) hDef = Math.max(0, hDef * (1 - (heroShred.value || 20) / 100));

      let finalDmg = Math.max(1, Math.round(rawDmg * (100 / (100 + hDef))));

      $('#heroFighterCard')?.classList.add('hit-flash');
      setTimeout(() => $('#heroFighterCard')?.classList.remove('hit-flash'), 350);

      if (h.shield > 0) {
        if (h.shield >= finalDmg) {
          h.shield -= finalDmg;
          AbyssEngine.showDmg('hero', `🛡️ 抵消 ${finalDmg}`, 'block');
          AbyssEngine.log(`【${m.name}】${isUlt ? '💥绝技' : ''}攻击被护盾完全抵消！`);
          finalDmg = 0;
        } else {
          finalDmg -= h.shield;
          AbyssEngine.showDmg('hero', `🛡️ 碎盾 -${finalDmg}`, 'normal');
          h.shield = 0;
          h.hp -= finalDmg;
          AbyssEngine.log(`【${m.name}】击碎了护盾并对【${h.name}】造成 <b>${finalDmg}</b> 点伤害！`);
        }
      } else {
        h.hp -= finalDmg;
        AbyssEngine.showDmg('hero', `-${finalDmg}`, 'normal');
        AbyssEngine.log(`【${m.name}】${isUlt ? '🔥释放【' + (action.data?.name || '灭世绝技') + '】重创' : '猛烈攻击'}【${h.name}】，造成 <b>${finalDmg}</b> 点伤害！`);
      }

      // 生命汲取
      if (action.type === 'skill' && action.data?.lifesteal && finalDmg > 0) {
        const heal = Math.round(finalDmg * action.data.lifesteal);
        m.hp = Math.min(m.maxHp, m.hp + heal);
        AbyssEngine.showDmg('monster', `+${heal}`, 'heal');
        AbyssEngine.log(`【${m.name}】通过深渊汲取恢复了 <b>${heal}</b> 点生命！`);
      }

      // 乌龟受击回怒/回蓝
      const hitMpGain = h.id === 'papa' ? 15 : 8;
      h.mp = Math.min(h.maxMp, h.mp + hitMpGain);

      // 荆棘反震被动
      if (h.passives.some(p => p.id === 'thorns') && finalDmg > 0) {
        const reflectDmg = Math.round(finalDmg * 0.35);
        m.hp -= reflectDmg;
        AbyssEngine.showDmg('monster', `🌵 反弹 ${reflectDmg}`, 'normal');
        AbyssEngine.log(`【${h.name}】荆棘外壳反弹了 <b>${reflectDmg}</b> 点真实伤害给【${m.name}】！`);
      }

      // 钢铁意志神话被动保命
      if (h.hp <= 0 && h.passives.some(p => p.id === 'iron_will') && !h.usedIronWill) {
        h.usedIronWill = true;
        h.hp = 1;
        h.shield = Math.round(h.maxHp * 0.5);
        AbyssEngine.showDmg('hero', `👑 钢铁不屈!`, 'heal');
        AbyssEngine.log(`【${h.name}】触发【钢铁意志】，免疫死亡并获得 50% 绝境护盾！`);
      }

      AbyssEngine.renderBattle();

      if (h.hp <= 0) {
        setTimeout(() => AbyssEngine.endRun(false), AbyssEngine.getDelay(600));
        return;
      }
      if (m.hp <= 0) {
        AbyssEngine.checkBattleResult();
        return;
      }

      AbyssEngine.endMonsterTurn();
    },

    endMonsterTurn() {
      const h = AbyssEngine.hero;
      const m = AbyssEngine.monster;
      if (!h || !m) return;

      // 玩家回合开始前结算乌龟身上中毒/灼烧等 DoT
      AbyssEngine.processTurnBuffs(h, 'hero');
      AbyssEngine.renderBattle();

      if (h.hp <= 0) {
        setTimeout(() => AbyssEngine.endRun(false), AbyssEngine.getDelay(600));
        return;
      }

      // 回合结束技能 CD 缩减 & 玩家每回合开始自愈法力
      h.skills.forEach(s => { if (s.curCd > 0) s.curCd--; });
      const turnMpGain = h.id === 'papa' ? 10 : 25;
      h.mp = Math.min(h.maxMp, h.mp + turnMpGain);

      // 为下回合预热怪物意图
      AbyssEngine.planMonsterNextAction(m, h);

      AbyssEngine.isPlayerTurn = true;
      AbyssEngine.isProcessing = false;
      $('#turnIndicator').textContent = '✦ 你的回合 ✦';
      $('#turnIndicator').style.color = '#fde047';
      AbyssEngine.renderBattle();

      if (AbyssEngine.isAuto) {
        setTimeout(() => AbyssEngine.autoPlayTurn(), AbyssEngine.getDelay(400));
      }
    },

    autoPlayTurn() {
      if (!AbyssEngine.isPlayerTurn || AbyssEngine.isProcessing || !AbyssEngine.isRunning) return;
      const h = AbyssEngine.hero;
      const readyIdx = h.skills.findIndex(s => s.curCd === 0 && h.mp >= s.mpCost);
      if (readyIdx !== -1) {
        AbyssEngine.playerCastSkill(readyIdx);
      } else {
        AbyssEngine.playerAttack();
      }
    },

    checkBattleResult() {
      const h = AbyssEngine.hero;
      const m = AbyssEngine.monster;

      if (m.hp <= 0) {
        AbyssEngine.isProcessing = false;
        AbyssEngine.log(`🎉 击败了【${m.name}】！`);
        h.exp += 50 + AbyssEngine.totalFloorIndex * 15;
        if (h.exp >= h.expNeeded) {
          h.exp -= h.expNeeded;
          h.level += 1;
          h.expNeeded = Math.round(h.expNeeded * 1.4);
          h.maxHp += 30;
          h.hp = Math.min(h.maxHp, h.hp + 30);
          h.maxMp += 15;
          h.mp = h.maxMp;
          h.atk += 6;
          h.def += 4;
          h.spd += 2;
          toast('✨ 副本升级！', `【${h.name}】在魔渊中突破至 Lv.${h.level}，生命法力完全充盈！`);
        }

        const ch = AbyssEngine.chapters[AbyssEngine.currentChapter - 1];
        const isBoss = AbyssEngine.currentStage === ch.maxStage;
        const isElite = ch.hasElite && AbyssEngine.currentStage === ch.eliteStage;
        const isFinalBoss = AbyssEngine.currentChapter === 5 && isBoss;

        if (isFinalBoss) {
          setTimeout(() => AbyssEngine.endRun(true), AbyssEngine.getDelay(800));
          return;
        }

        if (isBoss || isElite) {
          setTimeout(() => AbyssEngine.showAugmentChoice(true), AbyssEngine.getDelay(500));
        } else {
          setTimeout(() => AbyssEngine.showStatChoice(), AbyssEngine.getDelay(500));
        }
      } else {
        AbyssEngine.isPlayerTurn = false;
        setTimeout(() => AbyssEngine.monsterTurn(), AbyssEngine.getDelay(600));
      }
    },

    showStatChoice() {
      AbyssEngine.isProcessing = false;
      $('#statChoiceOverlay')?.classList.remove('hidden');
    },

    applyStatChoice(statType) {
      $('#statChoiceOverlay')?.classList.add('hidden');
      const h = AbyssEngine.hero;
      if (!h) return;

      if (statType === 'hp') {
        h.maxHp += 50;
        const heal = Math.round((h.maxHp - h.hp) * 0.3) + 50;
        h.hp = Math.min(h.maxHp, h.hp + heal);
        toast('❤️ 生命突破', `最大生命 +50 HP，并恢复 ${heal} 点生命！`);
      } else if (statType === 'atk') {
        h.atk += 12;
        toast('⚔️ 力量突破', '力量 (ATK) +12，全技能伤害提升！');
      } else if (statType === 'def') {
        h.def += 10;
        toast('🛡️ 防御重铸', '防御 (DEF) +10，受到伤害比例降低！');
      } else if (statType === 'spd') {
        h.spd += 8;
        h.critRate += 0.05;
        toast('⚡ 速度突进', '速度 (SPD) +8，暴击率 +5%！');
      }

      AbyssEngine.isProcessing = false;
      AbyssEngine.advanceStage();
    },

    showAugmentChoice(isMythic = false) {
      AbyssEngine.isProcessing = false;
      const container = $('#augmentCardsContainer');
      if (!container) return;

      const h = AbyssEngine.hero;
      const isFighter = h.id === 'papa';
      const activePool = isFighter ? AbyssEngine.augments.fighterActives : AbyssEngine.augments.mageActives;
      const passivePool = AbyssEngine.augments.passives;

      const candidates = [];
      activePool.forEach(s => {
        if (!h.skills.some(owned => owned.id === s.id)) {
          candidates.push({ type: 'active', data: s });
        }
      });
      passivePool.forEach(p => {
        if (!h.passives.some(owned => owned.id === p.id)) {
          if (!isMythic || p.rarity === 'mythic') {
            candidates.push({ type: 'passive', data: p });
          }
        }
      });

      candidates.sort(() => Math.random() - 0.5);
      const chosen3 = candidates.slice(0, 3);

      container.innerHTML = chosen3.map((c, idx) => `
        <div class="augment-card ${c.data.rarity === 'mythic' ? 'rarity-mythic' : ''}" data-idx="${idx}">
          <span class="augment-icon">${c.data.icon}</span>
          <div class="augment-title">${c.data.name}</div>
          <div class="augment-desc">${c.data.desc}</div>
        </div>
      `).join('');

      $$('.augment-card', container).forEach((card, idx) => {
        card.addEventListener('click', () => {
          const picked = chosen3[idx];
          if (picked.type === 'active') {
            h.skills.push(JSON.parse(JSON.stringify(picked.data)));
            toast('✨ 习得主动技能', `装备了新技能【${picked.data.name}】！`);
          } else {
            h.passives.push(JSON.parse(JSON.stringify(picked.data)));
            if (picked.data.id === 'titan_blood') {
              h.maxHp = Math.round(h.maxHp * 1.25);
              h.hp = Math.round(h.hp * 1.25);
              h.atk = Math.round(h.atk * 1.25);
              h.def = Math.round(h.def * 1.25);
              h.spd = Math.round(h.spd * 1.25);
            }
            toast('👑 获得海克斯秘宝', `激活了神话被动【${picked.data.name}】！`);
          }
          $('#augmentChoiceOverlay')?.classList.add('hidden');
          AbyssEngine.isProcessing = false;
          AbyssEngine.advanceStage();
        });
      });

      $('#augmentChoiceBadge').textContent = isMythic ? '👑 神话级海克斯核心' : '✨ 海克斯秘宝三选一';
      $('#augmentChoiceTitle').textContent = isMythic ? '战胜领主！请选取核心质变强化' : '境界突破，选取新的技能或被动';
      $('#augmentChoiceOverlay')?.classList.remove('hidden');
    },

    showRandomEvent() {
      AbyssEngine.isProcessing = false;
      const overlay = $('#abyssEventOverlay');
      if (!overlay) {
        AbyssEngine.startStage();
        return;
      }

      const pool = AbyssEngine.eventsPool;
      const ev = pool[Math.floor(Math.random() * pool.length)];
      const h = AbyssEngine.hero;

      $('#eventBadge').textContent = '🔮 深渊奇遇 · 命运抉择';
      $('#eventTitle').textContent = ev.title;
      $('#eventIllustration').textContent = ev.icon;
      $('#eventDescription').textContent = ev.desc;

      const container = $('#eventOptionsContainer');
      container.innerHTML = ev.options.map((opt, idx) => {
        const affordable = opt.canAfford ? opt.canAfford(h) : true;
        return `
          <button class="event-opt-btn" data-opt-idx="${idx}" ${!affordable ? 'disabled' : ''}>
            <div class="event-opt-text">
              <b>${opt.name}</b>
              <small>${opt.desc}</small>
            </div>
            <span class="event-opt-cost">${opt.costText}</span>
          </button>
        `;
      }).join('');

      $$('.event-opt-btn', container).forEach((btn) => {
        btn.onclick = () => {
          const idx = Number(btn.dataset.optIdx);
          const opt = ev.options[idx];
          const resultMsg = opt.action(h);
          overlay.classList.add('hidden');
          toast('🔮 奇遇抉择', resultMsg);
          AbyssEngine.log(`🔮【深渊奇遇 · ${ev.title}】：${resultMsg}`);
          persist();
          render();
          AbyssEngine.isProcessing = false;
          setTimeout(() => AbyssEngine.startStage(), 400);
        };
      });

      overlay.classList.remove('hidden');
    },

    advanceStage() {
      const ch = AbyssEngine.chapters[AbyssEngine.currentChapter - 1];
      AbyssEngine.currentStage += 1;
      AbyssEngine.totalFloorIndex += 1;

      if (AbyssEngine.currentStage > ch.maxStage) {
        AbyssEngine.currentChapter += 1;
        AbyssEngine.currentStage = 1;
      }

      AbyssEngine.isProcessing = false;

      // 奇遇事件判定：在每章的第 2 关和第 4 关通关后触发深渊奇遇！
      const isEventStage = (AbyssEngine.currentStage === 2 || AbyssEngine.currentStage === 4);
      if (isEventStage && AbyssEngine.currentChapter <= 5) {
        setTimeout(() => AbyssEngine.showRandomEvent(), AbyssEngine.getDelay(400));
      } else {
        AbyssEngine.startStage();
      }
    },

    endRun(isVictory) {
      AbyssEngine.isRunning = false;
      AbyssEngine.isProcessing = false;

      const floorsCleared = AbyssEngine.totalFloorIndex;
      let earnedCoins = isVictory ? 600 : Math.max(20, floorsCleared * 12);

      if (typeof state.heroCoins !== 'number') state.heroCoins = 0;
      state.heroCoins += earnedCoins;
      persist();
      render();
      sync(true);

      $('#resultBanner').textContent = isVictory ? '🏆 勇闯魔渊 · 试炼大捷！' : '💀 试炼惜败 · 虽败犹荣';
      $('#resultDesc').textContent = isVictory 
        ? '你成功征服了全部 5 大章节 38 关深渊试炼！恭喜获得丰厚英雄币！' 
        : `止步于第 ${AbyssEngine.currentChapter} 章 关卡 ${AbyssEngine.currentStage}，根据探索进度已结算英雄币奖励。`;
      $('#resultHeroCoins').textContent = `+🪙 ${earnedCoins}`;
      $('#resultStageSummary').textContent = `${floorsCleared} / 38 关`;

      if (isVictory) {
        const cinematic = $('#victoryCinematic');
        if (cinematic) {
          if ($('#victoryAvatar')) $('#victoryAvatar').textContent = AbyssEngine.hero?.avatar || '🐢';
          cinematic.classList.remove('hidden');

          const closeCinematic = () => {
            cinematic.classList.add('hidden');
            $('#battleResultOverlay')?.classList.remove('hidden');
          };
          cinematic.onclick = closeCinematic;
          setTimeout(closeCinematic, 4000);
          return;
        }
      }

      $('#battleResultOverlay')?.classList.remove('hidden');
    }
  };

