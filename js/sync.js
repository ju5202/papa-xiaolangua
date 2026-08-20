/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — 双模极速独立同步引擎 (Hybrid Local & WebRTC P2P Sync)
   1. 本地层：基于频道绑定的 BroadcastChannel + StorageEvent (同机/任务栏挂件 <0.1ms 内存总线)
   2. 远程层：基于 WebRTC DataChannel 的端到端加密 P2P 直连 (异地跨电脑远程联通，零中心服务器中转)
   3. 增量动作合并 (Delta Action) 与严格房间隔离，彻底杜绝数据串扰与相互覆盖
   ========================================================================== */

  let broadcast = null;
  let activePeer = null;
  let activeConnections = new Map();
  let isRoomHost = false;
  let p2pReconnectTimer = null;

  function getCleanChannelId(channel) {
    return String(channel || 'PAPA-0828').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16) || 'PAPA0828';
  }

  function getChannelTopic(channel) {
    const chan = String(channel || 'PAPA-0828').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) || 'PAPA-0828';
    return `papa_sanctuary_chan_${chan}`;
  }

  function openChannel() {
    closeChannel();
    const curChan = state.channel || 'PAPA-0828';
    const chanTopic = getChannelTopic(curChan);

    // 1. 初始化本地 BroadcastChannel 通道 (同机多窗口/伴侣悬浮窗)
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

    // 2. 跨窗口/跨页面 StorageEvent 监听
    window.removeEventListener('storage', handleStorageEvent);
    window.addEventListener('storage', handleStorageEvent);

    // 3. 开启远程跨电脑 WebRTC P2P 直连网络
    initRemoteP2P(curChan);

    setSyncText(`已连入独立共养频道 ${curChan}`);
    setTimeout(() => broadcastSyncPacket(), 150);
  }

  function closeChannel() {
    clearTimeout(p2pReconnectTimer);

    // 关闭本地广播通道
    if (broadcast) {
      try { broadcast.close(); } catch (e) { }
      broadcast = null;
    }
    window.removeEventListener('storage', handleStorageEvent);

    // 关闭全部远程 P2P WebRTC 连接
    activeConnections.forEach(conn => {
      try { conn.close(); } catch (e) { }
    });
    activeConnections.clear();

    if (activePeer) {
      try {
        activePeer.destroy();
      } catch (e) { }
      activePeer = null;
    }
    isRoomHost = false;
  }

  // -------------------------------------------------------------------------
  // WebRTC P2P 房间直连自组网算法 (Zero-Server P2P Mesh)
  // -------------------------------------------------------------------------
  function initRemoteP2P(channelId) {
    if (typeof Peer === 'undefined') {
      console.warn('[Sync] PeerJS 未加载，运行在纯本地广播模式。');
      return;
    }

    const cleanChan = getCleanChannelId(channelId);
    const hostPeerId = `papa_h_${cleanChan}`;
    const cleanUserId = String(state.user.id || clientId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const clientPeerId = `papa_c_${cleanChan}_${cleanUserId}_${Math.random().toString(36).slice(2, 6)}`;

    const peerConfig = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      },
      debug: 0
    };

    // 首先尝试作为该频道的 P2P 房主 (Host) 接入
    try {
      const hostPeer = new Peer(hostPeerId, peerConfig);

      hostPeer.on('open', (id) => {
        activePeer = hostPeer;
        isRoomHost = true;
        setSyncText(`P2P 空间就绪 · 等待伙伴连入`);

        // 作为房主，接受远方伙伴的连入连接
        hostPeer.on('connection', (conn) => {
          setupP2PConnection(conn, true);
        });
      });

      hostPeer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // 该频道的 Host 已存在，当前客户端作为 Client 连入 Host
          hostPeer.destroy();
          joinAsClientPeer(clientPeerId, hostPeerId, peerConfig);
        } else {
          console.warn('[Sync] P2P Host 连接提示:', err.type);
        }
      });
    } catch (err) {
      console.warn('[Sync] PeerJS 初始化异常:', err);
    }
  }

  function joinAsClientPeer(myPeerId, targetHostId, peerConfig) {
    try {
      const clientPeer = new Peer(myPeerId, peerConfig);
      clientPeer.on('open', () => {
        activePeer = clientPeer;
        isRoomHost = false;
        const conn = clientPeer.connect(targetHostId, {
          reliable: true,
          metadata: {
            userId: state.user.id,
            userName: state.user.name,
            userAvatar: state.user.avatar
          }
        });
        setupP2PConnection(conn, false);
      });

      clientPeer.on('error', (err) => {
        console.warn('[Sync] P2P 客户端连接提示:', err.type);
      });
    } catch (e) {
      console.warn('[Sync] 加入 P2P 房间异常:', e);
    }
  }

  function setupP2PConnection(conn, isHost) {
    conn.on('open', () => {
      activeConnections.set(conn.peer, conn);
      setSyncText(`✨ 远方伙伴已通过 WebRTC 直连`);
      toast('✦ 远程伙伴已直连', `已与远方的共养伙伴建立 P2P 加密直连信道！`);

      // 握手成功后立即互相同步当前最新庭院快照
      broadcastSyncPacket();
    });

    conn.on('data', (data) => {
      if (!data) return;
      handleIncomingMessage(data);

      // 如果当前是 Host，并且连接了多位伙伴，负责广播转发
      if (isHost && activeConnections.size > 1) {
        activeConnections.forEach((c, peerId) => {
          if (peerId !== conn.peer && c.open) {
            try { c.send(data); } catch (e) { }
          }
        });
      }
    });

    conn.on('close', () => {
      activeConnections.delete(conn.peer);
      if (activeConnections.size === 0) {
        setSyncText(`已连入独立共养频道 ${state.channel}`);
      }

      // 如果 Host 断开，当前 Client 尝试自动接任升级为 Host
      if (!isHost && !activePeer?.destroyed) {
        clearTimeout(p2pReconnectTimer);
        p2pReconnectTimer = setTimeout(() => {
          if (state.channel) initRemoteP2P(state.channel);
        }, 1200);
      }
    });

    conn.on('error', () => {
      activeConnections.delete(conn.peer);
    });
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

  // -------------------------------------------------------------------------
  // 核心消息分发与增量合并引擎 (Delta Action & Conflict-Free Merging)
  // -------------------------------------------------------------------------
  function handleIncomingMessage(data) {
    if (!data) return;
    // 严格校验频道：非当前频道的数据 100% 丢弃，绝不串扰
    if (data.channel && data.channel !== state.channel) return;
    // 过滤本地自身的回环广播
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

    // 2. 智能合并总禅意值 (单调递增取最大值，避免被旧快照覆写)
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

  // 统一分发包至本地 BroadcastChannel 与远程 WebRTC P2P 通道
  function sendUnifiedPacket(packet) {
    if (!packet) return;

    // 1. 本地多窗口/悬浮窗广播
    broadcast?.postMessage(packet);

    // 2. 远程 P2P WebRTC 通道广播
    if (activeConnections.size > 0) {
      activeConnections.forEach(conn => {
        if (conn && conn.open) {
          try {
            conn.send(packet);
          } catch (err) {
            console.warn('[Sync] P2P 发送失败:', err);
          }
        }
      });
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
    sendUnifiedPacket(packet);
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
    sendUnifiedPacket(packet);
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
    sendUnifiedPacket(packet);
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
    sendUnifiedPacket(packet);
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
    sendUnifiedPacket(packet);
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
    sendUnifiedPacket(packet);
  }

  function setSyncText(text) {
    const el = $('#syncText');
    if (!el) return;
    el.textContent = text;
    clearTimeout(setSyncText.timeout);
    setSyncText.timeout = setTimeout(() => {
      if ($('#syncText')) $('#syncText').textContent = '实时同步已开启';
    }, 2400);
  }
