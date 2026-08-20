/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — 原生极速频道独立同步引擎 (Zero-Crosstalk Channel Sync)
   摒弃 MQTT，采用严格频道绑定的 BroadcastChannel + StorageEvent 双重广播通道
   100% 物理隔离不同频道数据，增量动作合并确保多用户操作不被覆盖
   ========================================================================== */

  let broadcast = null;

  function getChannelTopic(channel) {
    const chan = String(channel || 'PAPA-0828').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) || 'PAPA-0828';
    return `papa_sanctuary_chan_${chan}`;
  }

  function openChannel() {
    closeChannel();
    const curChan = state.channel || 'PAPA-0828';
    const chanTopic = getChannelTopic(curChan);

    if ('BroadcastChannel' in window) {
      try {
        broadcast = new BroadcastChannel(chanTopic);
        broadcast.onmessage = (event) => {
          if (!event || !event.data) return;
          handleIncomingMessage(event.data);
        };
      } catch (err) {
        console.warn('[Sync] BroadcastChannel init error:', err);
      }
    }

    // 跨窗口/跨页面/伴侣悬浮窗 StorageEvent 双重实时监听
    window.removeEventListener('storage', handleStorageEvent);
    window.addEventListener('storage', handleStorageEvent);

    setSyncText(`已连入独立共养频道 ${curChan}`);
    // 延迟广播握手包，告知同一频道的伙伴自己已就绪
    setTimeout(() => broadcastSyncPacket(), 120);
  }

  function closeChannel() {
    if (broadcast) {
      try {
        broadcast.close();
      } catch (e) { }
      broadcast = null;
    }
    window.removeEventListener('storage', handleStorageEvent);
  }

  function handleStorageEvent(event) {
    if (!state || !state.channel) return;
    const currentKey = getChannelStorageKey(state.channel);
    if (event.key !== currentKey || !event.newValue) return;
    try {
      const remote = JSON.parse(event.newValue);
      if (remote && remote.channel === state.channel && remote.user?.id !== state.user?.id) {
        mergeRemoteState(remote);
      }
    } catch (e) { }
  }

  function handleIncomingMessage(data) {
    if (!data) return;
    // 严格校验频道：非当前频道的数据 100% 丢弃，绝不串扰
    if (data.channel && data.channel !== state.channel) return;
    // 过滤本地回环
    if (data.senderId && data.senderId === state.user.id) return;

    // 1. 飞鸽传书/短信 送达确认回执 (Delivery Receipt ACK)
    if (data.type === 'letter_delivered') {
      if (typeof triggerTurtleDeliveryCelebration === 'function') {
        triggerTurtleDeliveryCelebration({
          isSenderAck: true,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar
        });
      }
      return;
    }

    // 2. 棋阁对弈动作实时同步
    if (data.type === 'game_action') {
      if (typeof GamesArena !== 'undefined') {
        GamesArena.handleRemoteAction(data.payload, data);
      }
      return;
    }

    // 3. 增量互动动作同步 (Pet Care Action - 保证双人抚摸/喂食/打扫不相互覆盖)
    if (data.type === 'pet_action') {
      const { petId, action, stats } = data;
      const pet = state.pets?.[petId];
      if (pet && stats) {
        if (stats.deltaHunger) pet.hunger = Math.min(100, (pet.hunger || 0) + stats.deltaHunger);
        if (stats.deltaHappiness) pet.happiness = Math.min(100, (pet.happiness || 0) + stats.deltaHappiness);
        if (stats.deltaClean) pet.clean = Math.min(100, (pet.clean || 0) + stats.deltaClean);
        if (stats.xp) addPetXp(petId, stats.xp, 'love');
        persist();
        render();
        toast('✨ 伙伴互动', `${data.senderAvatar || '💌'} ${data.senderName || '伙伴'} 照顾了【${pet.name}】！`);
      }
      return;
    }

    // 4. 增量禅意贡献同步 (Zen Gain - 保证双人禅意累加不回滚)
    if (data.type === 'zen_gain') {
      const { amount, category } = data;
      if (amount > 0) {
        state.zen = (state.zen || 0) + amount;
        recordContribution(amount, category || 'keyboardZen', {
          id: data.senderId,
          name: data.senderName,
          avatar: data.senderAvatar
        });
        persist();
        render();
        toast('✦ 伙伴贡献禅意', `${data.senderAvatar || '✨'} ${data.senderName || '伙伴'} 贡献了 +${amount} 禅意！`);
      }
      return;
    }

    // 5. 新信件增量到达 (New Letter)
    if (data.type === 'new_letter' && data.letter) {
      const inLet = data.letter;
      if (inLet.channel && inLet.channel !== state.channel) return;
      state.letters = state.letters || [];
      if (!state.letters.some(l => l.id === inLet.id)) {
        state.letters.push(inLet);
        if (state.letters.length > 50) state.letters.splice(0, state.letters.length - 50);
        persist();
        render();
        broadcastDeliveryAck(inLet.id, inLet.senderId, state.user.name, state.user.avatar);
        if (typeof triggerTurtleDeliveryCelebration === 'function') {
          triggerTurtleDeliveryCelebration({
            isSenderAck: false,
            senderName: inLet.senderName,
            senderAvatar: inLet.senderAvatar
          });
        } else {
          toast(`✉ 收到来自 ${inLet.senderAvatar} ${inLet.senderName} 的来信`, `“${escapeHTML(inLet.body)}”`);
        }
        if (currentModal && $('#letterInput')) {
          showMessenger();
        }
      }
      return;
    }

    // 6. 全量状态合并包 (Full State Reconciliation)
    if (data.type === 'state') {
      const incoming = data.payload;
      if (incoming) {
        mergeRemoteState(incoming);
      }
    }
  }

  function mergeRemoteState(incoming) {
    if (!incoming || incoming.channel !== state.channel) return;

    // 1. 增量合并贡献榜
    const incomingContributions = incoming.contributions || {};
    const mergedContributions = { ...(state.contributions || {}) };
    let remoteContributionDelta = 0;
    let remoteContributor = null;

    Object.entries(incomingContributions).forEach(([uid, remoteEntry]) => {
      if (!remoteEntry) return;
      if (uid === state.user.id) {
        if (mergedContributions[uid]) {
          mergedContributions[uid].totalZen = Math.max(mergedContributions[uid].totalZen || 0, remoteEntry.totalZen || 0);
          mergedContributions[uid].todayZen = Math.max(mergedContributions[uid].todayZen || 0, remoteEntry.todayZen || 0);
        } else {
          mergedContributions[uid] = remoteEntry;
        }
      } else {
        const prevTotal = mergedContributions[uid]?.totalZen || 0;
        if ((remoteEntry.totalZen || 0) > prevTotal) {
          remoteContributionDelta += ((remoteEntry.totalZen || 0) - prevTotal);
          remoteContributor = remoteEntry;
        }
        mergedContributions[uid] = {
          ...mergedContributions[uid],
          ...remoteEntry,
          details: {
            ...(mergedContributions[uid]?.details || {}),
            ...(remoteEntry.details || {}),
            keystrokes: Math.max(mergedContributions[uid]?.details?.keystrokes || 0, remoteEntry.details?.keystrokes || 0)
          }
        };
      }
    });

    // 2. 智能合并总禅意值 (取最大值避免回滚)
    const mergedZen = Math.max(state.zen || 0, incoming.zen || 0);
    const mergedHeroCoins = Math.max(state.heroCoins || 0, incoming.heroCoins || 0);
    const mergedMarketUnlocked = Array.from(new Set([
      ...(state.marketUnlocked || []),
      ...(incoming.marketUnlocked || [])
    ]));

    // 3. 智能合并乌龟状态 (双向高好感度与经验融合，绝不覆盖落后)
    const mergedPets = { ...state.pets };
    if (incoming.pets) {
      ['papa', 'pumpkin'].forEach(petId => {
        if (incoming.pets[petId]) {
          const inP = incoming.pets[petId];
          const localP = mergedPets[petId] || inP;

          const inCumXp = getCumulativeXp(inP.level, inP.xp);
          const localCumXp = getCumulativeXp(localP.level, localP.xp);
          const maxCumXp = Math.max(inCumXp, localCumXp);
          const resolved = resolveLevelAndXp(maxCumXp);
          const titleInfo = getPetTitleInfo(petId, resolved.level);

          mergedPets[petId] = {
            ...localP,
            ...inP,
            level: resolved.level,
            xp: resolved.xp,
            title: titleInfo.title,
            aura: titleInfo.aura,
            happiness: Math.max(localP.happiness || 0, inP.happiness || 0),
            hunger: Math.max(localP.hunger || 0, inP.hunger || 0),
            clean: Math.max(localP.clean || 0, inP.clean || 0),
            equipment: inP.equipment || localP.equipment || ''
          };
        }
      });
    }

    // 4. 智能合并信件（严格限制当前频道）
    const curChan = state.channel;
    const currentLetterIds = new Set((state.letters || []).map(l => l.id || `${l.senderId || ''}-${l.body}-${l.time}`));
    const incomingLetters = (Array.isArray(incoming.letters) ? incoming.letters : [])
      .filter(l => !l.channel || l.channel === curChan);
    let hasNewLetter = false;
    let newestLetter = null;

    incomingLetters.forEach(l => {
      const lid = l.id || `${l.senderId || ''}-${l.body}-${l.time}`;
      if (!currentLetterIds.has(lid) && l.senderId !== state.user.id) {
        hasNewLetter = true;
        newestLetter = l;
      }
    });

    const mergedLetters = [...(state.letters || [])];
    incomingLetters.forEach(inLet => {
      const inLid = inLet.id || `${inLet.senderId || ''}-${inLet.body}-${inLet.time}`;
      if (!mergedLetters.some(ex => (ex.id || `${ex.senderId || ''}-${ex.body}-${ex.time}`) === inLid)) {
        mergedLetters.push({ ...inLet, channel: curChan });
      }
    });
    if (mergedLetters.length > 50) {
      mergedLetters.splice(0, mergedLetters.length - 50);
    }

    // 5. 智能合并庭院建筑与摆件
    const mergedUnlockedHouses = Array.from(new Set([
      ...(state.garden.unlockedHouses || ['cottage_lv1']),
      ...(incoming.garden?.unlockedHouses || [])
    ]));
    const mergedHouseStyle = incoming.garden?.houseStyle || state.garden.houseStyle || 'cottage_lv1';

    let mergedDecorations = [...(state.garden.decorations || [])];
    if (incoming.garden && Array.isArray(incoming.garden.decorations)) {
      const localDecMap = new Map((state.garden.decorations || []).map(d => [d.id, d]));
      const incomingDecMap = new Map(incoming.garden.decorations.map(d => [d.id, d]));
      const allIds = Array.from(new Set([...localDecMap.keys(), ...incomingDecMap.keys()]));

      mergedDecorations = allIds.map(id => {
        const localDec = localDecMap.get(id);
        const inDec = incomingDecMap.get(id);
        if (!localDec) return inDec;
        if (!inDec) return localDec;
        return {
          ...localDec,
          ...inDec,
          stage: inDec.stage !== undefined ? inDec.stage : localDec.stage,
          harvested: inDec.harvested !== undefined ? inDec.harvested : localDec.harvested
        };
      });
    }

    state = {
      ...state,
      zen: mergedZen,
      keyboardZen: Math.max(state.keyboardZen || 0, incoming.keyboardZen || 0),
      heroCoins: mergedHeroCoins,
      marketUnlocked: mergedMarketUnlocked,
      contributions: mergedContributions,
      pets: mergedPets,
      garden: {
        ...state.garden,
        plantStage: Math.max(state.garden.plantStage || 0, incoming.garden?.plantStage || 0),
        harvested: incoming.garden?.harvested !== undefined ? incoming.garden.harvested : state.garden.harvested,
        houseStyle: mergedHouseStyle,
        unlockedHouses: mergedUnlockedHouses,
        decorations: mergedDecorations
      },
      letters: mergedLetters
    };

    persist();
    render();
    setSyncText('收到远程伙伴的庭院更新');

    if (hasNewLetter && newestLetter) {
      const senderName = escapeHTML(newestLetter.senderName || '共养伙伴');
      const senderAvatar = escapeHTML(newestLetter.senderAvatar || '💌');
      const preview = newestLetter.body.length > 22 ? newestLetter.body.slice(0, 22) + '...' : newestLetter.body;

      broadcastDeliveryAck(newestLetter.id, newestLetter.senderId, state.user.name, state.user.avatar);
      if (typeof triggerTurtleDeliveryCelebration === 'function') {
        triggerTurtleDeliveryCelebration({ isSenderAck: false, senderName, senderAvatar });
      } else {
        toast(`✉ 收到来自 ${senderAvatar} ${senderName} 的来信`, `“${escapeHTML(preview)}”`);
      }

      if (currentModal && $('#letterInput')) {
        showMessenger();
      }
    } else if (remoteContributionDelta > 0 && remoteContributor) {
      const senderName = escapeHTML(remoteContributor.name || '共养伙伴');
      const senderAvatar = escapeHTML(remoteContributor.avatar || '✨');
      toast(`✨ 伙伴贡献禅意`, `${senderAvatar} ${senderName} 刚刚贡献了 +${remoteContributionDelta} 禅意！`);
    }
  }

  let syncTimer = null;
  function sync(immediate = false) {
    persist();
    if (immediate) {
      clearTimeout(syncTimer);
      broadcastSyncPacket();
    } else {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(broadcastSyncPacket, 250);
    }
  }

  function broadcastSyncPacket() {
    const curChan = state.channel || 'PAPA-0828';
    const channelLetters = (state.letters || []).filter(l => !l.channel || l.channel === curChan);
    const packet = {
      type: 'state',
      channel: curChan,
      senderId: state.user.id,
      senderName: state.user.name,
      senderAvatar: state.user.avatar,
      timestamp: Date.now(),
      payload: {
        ...state,
        channel: curChan,
        letters: channelLetters
      }
    };
    broadcast?.postMessage(packet);
  }

  function broadcastDeliveryAck(letterId, recipientId, senderName, senderAvatar) {
    const curChan = state.channel || 'PAPA-0828';
    const packet = {
      type: 'letter_delivered',
      channel: curChan,
      letterId,
      recipientId,
      senderId: state.user.id,
      senderName: senderName || state.user.name,
      senderAvatar: senderAvatar || state.user.avatar,
      timestamp: Date.now()
    };
    broadcast?.postMessage(packet);
  }

  function broadcastGameAction(actionPayload) {
    const curChan = state.channel || 'PAPA-0828';
    const packet = {
      type: 'game_action',
      channel: curChan,
      senderId: state.user.id,
      senderName: state.user.name,
      senderAvatar: state.user.avatar,
      timestamp: Date.now(),
      payload: actionPayload
    };
    broadcast?.postMessage(packet);
  }

  function broadcastPetAction(petId, action, stats) {
    const curChan = state.channel || 'PAPA-0828';
    const packet = {
      type: 'pet_action',
      channel: curChan,
      petId,
      action,
      stats,
      senderId: state.user.id,
      senderName: state.user.name,
      senderAvatar: state.user.avatar,
      timestamp: Date.now()
    };
    broadcast?.postMessage(packet);
  }

  function broadcastZenGain(amount, category) {
    const curChan = state.channel || 'PAPA-0828';
    const packet = {
      type: 'zen_gain',
      channel: curChan,
      amount,
      category,
      senderId: state.user.id,
      senderName: state.user.name,
      senderAvatar: state.user.avatar,
      timestamp: Date.now()
    };
    broadcast?.postMessage(packet);
  }

  function broadcastLetter(letter) {
    const curChan = state.channel || 'PAPA-0828';
    const packet = {
      type: 'new_letter',
      channel: curChan,
      letter,
      senderId: state.user.id,
      senderName: state.user.name,
      senderAvatar: state.user.avatar,
      timestamp: Date.now()
    };
    broadcast?.postMessage(packet);
  }

  function setSyncText(text) {
    const el = $('#syncText');
    if (!el) return;
    el.textContent = text;
    clearTimeout(setSyncText.timeout);
    setSyncText.timeout = setTimeout(() => {
      if ($('#syncText')) $('#syncText').textContent = '实时同步已开启';
    }, 2200);
  }
