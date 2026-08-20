/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — MQTT 远程同步系统 (Remote Sync & Channels)
   ========================================================================== */
  let mqttClient = null;

  function openChannel() {
    if (broadcast) broadcast.close();
    if ('BroadcastChannel' in window) {
      broadcast = new BroadcastChannel(`sanctuary-${state.channel}`);
      broadcast.onmessage = (event) => {
        if (event.data && event.data.senderId !== state.user.id) {
          handleIncomingMessage(event.data);
        }
      };
    }
    initMqttRemoteSync();
  }

  function initMqttRemoteSync() {
    if (mqttClient) {
      try { mqttClient.end(true); } catch (e) { }
    }
    if (!window.mqtt) return;
    const topic = `papa-pumpkin-sanctuary/channel/${state.channel}`;
    // 采用独立随机 MQTT ClientID，避免共养双方连入 EMQX 时相互踢线
    const mqttSessionId = `papa_${state.user.id || clientId}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      mqttClient = window.mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
        clientId: mqttSessionId,
        clean: true,
        connectTimeout: 8000,
        keepalive: 30,
        reconnectPeriod: 2500
      });

      mqttClient.on('connect', () => {
        setSyncText(`已连入公网共养频道 ${state.channel}`);
        mqttClient.subscribe(topic, { qos: 0 }, (err) => {
          if (!err) {
            // 连入成功后稍作延时发送初次同步包，确保双方上线即时感知
            setTimeout(() => broadcastSyncPacket(), 300);
          }
        });
      });

      mqttClient.on('message', (t, message) => {
        try {
          const payload = JSON.parse(message.toString());
          if (payload && payload.senderId !== state.user.id) {
            handleIncomingMessage(payload);
          }
        } catch (err) {
          console.error('[MQTT] 消息解析异常:', err);
        }
      });

      mqttClient.on('error', (err) => {
        console.warn('[MQTT] 连接提示:', err);
      });
    } catch (err) {
      console.error('[MQTT] 初始化失败:', err);
    }
  }

  function handleIncomingMessage(data) {
    if (!data) return;
    // 仅过滤来自本地自身的广播回环，正常接收远方伙伴的数据
    if (data.senderId && data.senderId === state.user.id) return;

    // 棋阁对弈动作实时同步
    if (data.type === 'game_action') {
      if (typeof GamesArena !== 'undefined') {
        GamesArena.handleRemoteAction(data.payload, data);
      }
      return;
    }

    if (data.type === 'state') {
      const incoming = data.payload;
      if (!incoming) return;

      // 1. 智能合并贡献账本 (Idempotent merge)
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

      // 2. 智能合并两只乌龟的经验、等级、装扮与龟壳状态
      const mergedPets = { ...state.pets };
      ['papa', 'pumpkin'].forEach(petId => {
        const localPet = mergedPets[petId] || defaultState.pets[petId];
        const remotePet = incoming.pets?.[petId];
        if (!remotePet) return;

        const localCumXp = getCumulativeXp(localPet.level, localPet.xp);
        const remoteCumXp = getCumulativeXp(remotePet.level, remotePet.xp);
        const bestCumXp = Math.max(localCumXp, remoteCumXp);
        const { level, xp } = resolveLevelAndXp(bestCumXp);

        localPet.level = level;
        localPet.xp = xp;
        localPet.hunger = Math.max(localPet.hunger || 0, remotePet.hunger || 0);
        localPet.happiness = Math.max(localPet.happiness || 0, remotePet.happiness || 0);
        localPet.clean = Math.max(localPet.clean || 0, remotePet.clean || 0);
        if (remotePet.equipment !== undefined) localPet.equipment = remotePet.equipment;
        if (remotePet.shell) localPet.shell = remotePet.shell;
        if (remotePet.edge) localPet.edge = remotePet.edge;

        const adv = localPet.level >= 15 ? ['神圣降世', '宇宙'] : localPet.level >= 10 ? ['星河守护者', '星芒'] : localPet.level >= 5 ? ['湖畔学徒', '晨露'] : ['萌新草龟', '微光'];
        localPet.title = adv[0];
        localPet.aura = adv[1];
      });

      // 3. 智能合并总禅意值与时间戳 (基于最新交易时间戳 LWW 仲裁，防止扣减被覆写回滚)
      let mergedZen = state.zen;
      let mergedZenUpdatedAt = state.zenUpdatedAt || 0;
      const incomingZenUpdatedAt = incoming.zenUpdatedAt || 0;

      if (incomingZenUpdatedAt > mergedZenUpdatedAt) {
        mergedZen = incoming.zen;
        mergedZenUpdatedAt = incomingZenUpdatedAt;
      } else if (incomingZenUpdatedAt === mergedZenUpdatedAt) {
        mergedZen = typeof incoming.zen === 'number' ? incoming.zen : state.zen;
      }

      // 4. 智能合并已购买道具库与英雄集市 (Owned & Market)
      const mergedOwned = Array.from(new Set([
        ...(state.owned || []),
        ...(incoming.owned || [])
      ]));
      const mergedHeroCoins = Math.max(state.heroCoins || 0, incoming.heroCoins || 0);
      const mergedMarketUnlocked = Array.from(new Set([
        ...(state.marketUnlocked || []),
        ...(incoming.marketUnlocked || [])
      ]));

      // 5. 智能合并信件列表并识别新信件
      const currentLetterIds = new Set((state.letters || []).map(l => l.id || `${l.senderId || ''}-${l.body}-${l.time}`));
      const incomingLetters = Array.isArray(incoming.letters) ? incoming.letters : [];
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
          mergedLetters.push(inLet);
        }
      });
      if (mergedLetters.length > 50) {
        mergedLetters.splice(0, mergedLetters.length - 50);
      }

      // 6. 智能合并庭院装饰与果树生命周期状态 (全集合并 + LWW 时间戳仲裁防重复采摘)
      const mergedUnlockedHouses = Array.from(new Set([
        ...(state.garden.unlockedHouses || ['cottage_lv1']),
        ...(incoming.garden?.unlockedHouses || [])
      ]));
      const incomingHouseStyle = incoming.garden?.houseStyle;
      const mergedHouseStyle = incomingHouseStyle || state.garden.houseStyle || 'cottage_lv1';

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

          if (isDecorEditMode) return localDec;

          if (inDec.type === 'tree' || inDec.type === 'plant') {
            const localTime = localDec.updatedAt || localDec.lastStageTime || 0;
            const inTime = inDec.updatedAt || inDec.lastStageTime || 0;
            if (inTime > localTime) {
              return { ...localDec, ...inDec };
            } else {
              return { ...inDec, ...localDec };
            }
          }

          return inDec;
        });
      }

      state = {
        ...state,
        zen: mergedZen,
        zenUpdatedAt: mergedZenUpdatedAt,
        keystrokes: Math.max(state.keystrokes || 0, incoming.keystrokes || 0, mergedContributions[state.user.id]?.details?.keystrokes || 0),
        user: state.user, // 保留本地用户身份配置
        focus: { ...state.focus, ...incoming.focus },
        pets: mergedPets,
        owned: mergedOwned,
        heroCoins: mergedHeroCoins,
        marketUnlocked: mergedMarketUnlocked,
        garden: {
          ...state.garden,
          houseStyle: mergedHouseStyle,
          unlockedHouses: mergedUnlockedHouses,
          decorations: mergedDecorations
        },
        contributions: mergedContributions,
        letters: mergedLetters
      };
      persist();
      render();
      setSyncText('收到远程伙伴的庭院更新');

      if (hasNewLetter && newestLetter) {
        const senderName = escapeHTML(newestLetter.senderName || '共养伙伴');
        const senderAvatar = escapeHTML(newestLetter.senderAvatar || '💌');
        const preview = newestLetter.body.length > 22 ? newestLetter.body.slice(0, 22) + '...' : newestLetter.body;
        toast(`✉ 收到来自 ${senderAvatar} ${senderName} 的来信`, `“${escapeHTML(preview)}”`);
        if (currentModal && $('#letterInput')) {
          showMessenger();
        }
      } else if (remoteContributionDelta > 0 && remoteContributor) {
        const senderName = escapeHTML(remoteContributor.name || '共养伙伴');
        const senderAvatar = escapeHTML(remoteContributor.avatar || '✨');
        toast(`✨ 伙伴贡献禅意`, `${senderAvatar} ${senderName} 刚刚贡献了 +${remoteContributionDelta} 禅意！`);
      } else {
        toast('✦ 共养同步', '远方的湖畔有了新变化。');
      }
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
      syncTimer = setTimeout(broadcastSyncPacket, 280);
    }
  }

  function broadcastSyncPacket() {
    const packet = {
      type: 'state',
      senderId: state.user.id,
      senderName: state.user.name,
      senderAvatar: state.user.avatar,
      timestamp: Date.now(),
      payload: state
    };
    broadcast?.postMessage(packet);
    if (mqttClient && mqttClient.connected) {
      const topic = `papa-pumpkin-sanctuary/channel/${state.channel}`;
      mqttClient.publish(topic, JSON.stringify(packet), { qos: 0 });
    }
  }

  function broadcastGameAction(actionPayload) {
    const packet = {
      type: 'game_action',
      senderId: state.user.id,
      senderName: state.user.name,
      senderAvatar: state.user.avatar,
      timestamp: Date.now(),
      payload: actionPayload
    };
    broadcast?.postMessage(packet);
    if (mqttClient && mqttClient.connected) {
      const topic = `papa-pumpkin-sanctuary/channel/${state.channel}`;
      mqttClient.publish(topic, JSON.stringify(packet), { qos: 0 });
    }
  }

  function setSyncText(text) {
    $('#syncText').textContent = text;
    clearTimeout(setSyncText.timeout);
    setSyncText.timeout = setTimeout(() => { $('#syncText').textContent = '实时同步已开启'; }, 2200);
  }

