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
    },
    {
      id: 'cottage_pumpkin',
      level: 6,
      name: '万圣奇幻巨型南瓜屋',
      tag: '南瓜本命',
      price: 1880,
      icon: '🎃',
      desc: '为小南瓜专属打造的巨型金灿灿大南瓜童话树屋，瓜藤缠绕，暖光融融，充满万圣魔幻与童话温情！',
      buff: '🎃 南瓜亲和 · 小南瓜互动好感度飞升 +25%，每日清晨额外凝结 +30 禅意',
      class: 'cottage-style-pumpkin'
    }
  ];

  function getHouseSvg(styleId, isThumbnail = false) {
    if (styleId === 'cottage_pumpkin') {
      // 万圣奇幻巨型南瓜屋 (Giant Magic Pumpkin Cottage)
      return `
        <svg class="house-svg house-svg-pumpkin" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="pkGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fb923c" stop-opacity="0.45"/>
              <stop offset="100%" stop-color="#ea580c" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="pkBodyLobe1" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#fed7aa"/>
              <stop offset="35%" stop-color="#f97316"/>
              <stop offset="75%" stop-color="#ea580c"/>
              <stop offset="100%" stop-color="#9a3412"/>
            </radialGradient>
            <radialGradient id="pkBodyLobe2" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#ffedd5"/>
              <stop offset="40%" stop-color="#fb923c"/>
              <stop offset="80%" stop-color="#ea580c"/>
              <stop offset="100%" stop-color="#7c2d12"/>
            </radialGradient>
            <linearGradient id="pkStemGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#86efac"/>
              <stop offset="40%" stop-color="#22c55e"/>
              <stop offset="100%" stop-color="#14532d"/>
            </linearGradient>
            <linearGradient id="pkDoorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#92400e"/>
              <stop offset="100%" stop-color="#451a03"/>
            </linearGradient>
          </defs>

          <!-- 温暖魔幻金橙色地表光晕 -->
          <ellipse cx="160" cy="188" rx="145" ry="42" fill="url(#pkGlow)"/>

          <!-- 顶部卷曲南瓜瓜蒂与魔幻炊烟烟囱 -->
          <g class="svg-smoke-group">
            <circle cx="166" cy="30" r="6" fill="rgba(254, 240, 138, 0.75)" class="smoke-puff sp1"/>
            <circle cx="170" cy="16" r="9" fill="rgba(253, 224, 71, 0.55)" class="smoke-puff sp2"/>
            <circle cx="176" cy="2" r="12" fill="rgba(250, 204, 21, 0.35)" class="smoke-puff sp3"/>
          </g>
          <!-- 瓜蒂烟囱 -->
          <path d="M 148,68 C 148,42 165,30 178,35 C 188,40 182,55 168,58 L 165,70 Z" fill="url(#pkStemGrad)" stroke="#052e16" stroke-width="2.5"/>

          <!-- 巨型大南瓜主体瓣瓣立体瓣片 -->
          <ellipse cx="85" cy="138" rx="42" ry="58" fill="url(#pkBodyLobe1)" stroke="#7c2d12" stroke-width="2.5"/>
          <ellipse cx="235" cy="138" rx="42" ry="58" fill="url(#pkBodyLobe1)" stroke="#7c2d12" stroke-width="2.5"/>

          <ellipse cx="115" cy="135" rx="46" ry="64" fill="url(#pkBodyLobe2)" stroke="#7c2d12" stroke-width="2.5"/>
          <ellipse cx="205" cy="135" rx="46" ry="64" fill="url(#pkBodyLobe2)" stroke="#7c2d12" stroke-width="2.5"/>

          <!-- 正中央最饱满巨型南瓜主瓣 -->
          <ellipse cx="160" cy="132" rx="48" ry="68" fill="url(#pkBodyLobe2)" stroke="#7c2d12" stroke-width="3"/>

          <!-- 缠绕的翠绿瓜藤与金黄南瓜花 -->
          <path d="M 160,68 Q 120,70 100,95 Q 85,115 70,110" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
          <path d="M 160,68 Q 205,72 225,95 Q 240,112 255,108" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
          <path d="M 70,110 Q 55,105 60,95 Q 68,90 62,85" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>
          <path d="M 255,108 Q 270,105 265,95 Q 258,90 264,85" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>
          <text x="92" y="88" font-size="14">🌼</text>
          <text x="215" y="88" font-size="14">🍃</text>

          <!-- 雕花暖光双窗 -->
          <g class="svg-pumpkin-window">
            <ellipse cx="110" cy="120" rx="15" ry="18" fill="#fef08a" stroke="#7c2d12" stroke-width="2"/>
            <line x1="110" y1="102" x2="110" y2="138" stroke="#7c2d12" stroke-width="1.8"/>
            <line x1="95" y1="120" x2="125" y2="120" stroke="#7c2d12" stroke-width="1.8"/>
            <rect x="94" y="136" width="32" height="6" rx="2" fill="#78350f"/>
            <text x="96" y="136" font-size="9">🌸</text>
            <text x="106" y="136" font-size="9">🌿</text>
            <text x="116" y="136" font-size="9">🌼</text>
          </g>

          <g class="svg-pumpkin-window">
            <ellipse cx="210" cy="120" rx="15" ry="18" fill="#fef08a" stroke="#7c2d12" stroke-width="2"/>
            <line x1="210" y1="102" x2="210" y2="138" stroke="#7c2d12" stroke-width="1.8"/>
            <line x1="195" y1="120" x2="225" y2="120" stroke="#7c2d12" stroke-width="1.8"/>
            <rect x="194" y="136" width="32" height="6" rx="2" fill="#78350f"/>
            <text x="196" y="136" font-size="9">🌼</text>
            <text x="206" y="136" font-size="9">🌿</text>
            <text x="216" y="136" font-size="9">🌸</text>
          </g>

          <!-- 阁楼圆眼透气窗 -->
          <circle cx="160" cy="85" r="9" fill="#fde047" stroke="#7c2d12" stroke-width="2"/>
          <line x1="160" y1="76" x2="160" y2="94" stroke="#7c2d12" stroke-width="1.5"/>
          <line x1="151" y1="85" x2="169" y2="85" stroke="#7c2d12" stroke-width="1.5"/>

          <!-- 拱形橡木入户大门 -->
          <path d="M 140,195 L 140,140 Q 160,122 180,140 L 180,195 Z" fill="url(#pkDoorGrad)" stroke="#451a03" stroke-width="2.5"/>
          <line x1="153" y1="130" x2="153" y2="195" stroke="#78350f" stroke-width="1.5"/>
          <line x1="167" y1="130" x2="167" y2="195" stroke="#78350f" stroke-width="1.5"/>
          <circle cx="173" cy="165" r="3" fill="#fde047" stroke="#78350f" stroke-width="1"/>
          <!-- 门廊南瓜暖光灯 -->
          <circle cx="132" cy="148" r="6" fill="#fef08a" stroke="#7c2d12" stroke-width="1.5" class="svg-lantern-pulse"/>
          <circle cx="188" cy="148" r="6" fill="#fef08a" stroke="#7c2d12" stroke-width="1.5" class="svg-lantern-pulse"/>

          <!-- 门前石阶台阶与迎宾地垫 -->
          <rect x="125" y="195" width="70" height="9" rx="3" fill="#64748b" stroke="#334155" stroke-width="1.5"/>
          <rect x="135" y="192" width="50" height="4" rx="2" fill="#d97706"/>
          <text x="160" y="195" font-size="4.5" fill="#fff" font-weight="900" text-anchor="middle">PUMPKIN</text>

          <!-- 前景左右小南瓜与萤火虫 -->
          <text x="45" y="195" font-size="22">🎃</text>
          <text x="250" y="195" font-size="20">🎃</text>
          <text x="278" y="198" font-size="14">🍄</text>
          <text x="28" y="198" font-size="15">🍄</text>
          <text x="75" y="65" font-size="12">✨</text>
          <text x="245" y="65" font-size="12">✨</text>
        </svg>
      `;
    }

    if (styleId === 'cottage_lv2') {
      // 晴空风车庄园 (Windmill Homestead)
      return `
        <svg class="house-svg house-svg-lv2" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wmTowerGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#64748b"/>
              <stop offset="50%" stop-color="#94a3b8"/>
              <stop offset="100%" stop-color="#475569"/>
            </linearGradient>
            <linearGradient id="wmRoofGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#b45309"/>
              <stop offset="100%" stop-color="#78350f"/>
            </linearGradient>
            <linearGradient id="wmCottageWall" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fef3c7"/>
              <stop offset="100%" stop-color="#fde68a"/>
            </linearGradient>
          </defs>

          <ellipse cx="160" cy="185" rx="140" ry="42" fill="rgba(245, 158, 11, 0.15)"/>

          <!-- 右侧附属农庄屋舍 -->
          <polygon points="140,110 210,62 285,110" fill="url(#wmRoofGrad)" stroke="#451a03" stroke-width="2.5"/>
          <rect x="150" y="110" width="125" height="85" rx="4" fill="url(#wmCottageWall)" stroke="#78350f" stroke-width="2.5"/>
          <rect x="215" y="130" width="38" height="65" rx="3" fill="#b91c1c" stroke="#450a0a" stroke-width="2"/>
          <line x1="215" y1="130" x2="253" y2="195" stroke="#fca5a5" stroke-width="1.5"/>
          <line x1="253" y1="130" x2="215" y2="195" stroke="#fca5a5" stroke-width="1.5"/>
          <rect x="168" y="125" width="28" height="28" rx="3" fill="#fef08a" stroke="#78350f" stroke-width="2"/>
          <line x1="182" y1="125" x2="182" y2="153" stroke="#78350f" stroke-width="1.5"/>
          <line x1="168" y1="139" x2="196" y2="139" stroke="#78350f" stroke-width="1.5"/>

          <!-- 左侧八角石塔风车主楼 -->
          <polygon points="55,195 125,195 114,80 66,80" fill="url(#wmTowerGrad)" stroke="#334155" stroke-width="2.5"/>
          <path d="M 60,80 C 60,50 120,50 120,80 Z" fill="#991b1b" stroke="#450a0a" stroke-width="2.5"/>
          <rect x="82" y="95" width="16" height="20" rx="3" fill="#fef08a" stroke="#1e293b" stroke-width="1.5"/>
          <rect x="78" y="155" width="24" height="40" rx="4" fill="#451a03" stroke="#1e293b" stroke-width="2"/>
          <circle cx="96" cy="175" r="2" fill="#fbbf24"/>

          <!-- 动态旋转 4 叶风车机翼 -->
          <g class="svg-windmill-blades" style="transform-origin: 90px 68px;">
            <circle cx="90" cy="68" r="8" fill="#451a03" stroke="#fef3c7" stroke-width="2"/>
            <path d="M 88,68 L 84,10 L 96,10 L 92,68 Z" fill="rgba(254, 243, 199, 0.9)" stroke="#78350f" stroke-width="1.5"/>
            <path d="M 88,68 L 84,126 L 96,126 L 92,68 Z" fill="rgba(254, 243, 199, 0.9)" stroke="#78350f" stroke-width="1.5"/>
            <path d="M 90,66 L 32,62 L 32,74 L 90,70 Z" fill="rgba(254, 243, 199, 0.9)" stroke="#78350f" stroke-width="1.5"/>
            <path d="M 90,66 L 148,62 L 148,74 L 90,70 Z" fill="rgba(254, 243, 199, 0.9)" stroke="#78350f" stroke-width="1.5"/>
          </g>

          <g class="svg-wheat-bundles">
            <ellipse cx="265" cy="188" rx="14" ry="10" fill="#eab308" stroke="#78350f" stroke-width="1.5"/>
            <text x="135" y="195" font-size="16">🌻</text>
            <text x="35" y="198" font-size="16">🌾</text>
          </g>
        </svg>
      `;
    }

    if (styleId === 'cottage_lv3') {
      // 樱落和风茶庵 (Sakura Tea Pavilion)
      return `
        <svg class="house-svg house-svg-lv3" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="jpRoofGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#334155"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <linearGradient id="jpPillarGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#b91c1c"/>
              <stop offset="50%" stop-color="#ef4444"/>
              <stop offset="100%" stop-color="#991b1b"/>
            </linearGradient>
          </defs>

          <ellipse cx="160" cy="180" rx="135" ry="40" fill="rgba(244, 114, 182, 0.15)"/>

          <!-- 飞檐翘角双层大屋顶 -->
          <path d="M 105,75 Q 160,60 215,75 L 205,52 Q 160,42 115,52 Z" fill="url(#jpRoofGrad)" stroke="#1e293b" stroke-width="2"/>
          <path d="M 40,120 Q 160,95 280,120 L 260,82 Q 160,68 60,82 Z" fill="url(#jpRoofGrad)" stroke="#0f172a" stroke-width="2.5"/>
          <circle cx="40" cy="118" r="4" fill="#fbbf24"/>
          <circle cx="280" cy="118" r="4" fill="#fbbf24"/>

          <!-- 障子门墙体 -->
          <rect x="70" y="115" width="180" height="75" fill="#fef3c7" stroke="#78350f" stroke-width="2"/>
          <g stroke="#78350f" stroke-width="1.2" opacity="0.85">
            <line x1="115" y1="115" x2="115" y2="190"/>
            <line x1="160" y1="115" x2="160" y2="190"/>
            <line x1="205" y1="115" x2="205" y2="190"/>
            <line x1="70" y1="133" x2="250" y2="133"/>
            <line x1="70" y1="152" x2="250" y2="152"/>
            <line x1="70" y1="171" x2="250" y2="171"/>
          </g>

          <!-- 朱红立柱 -->
          <rect x="66" y="115" width="10" height="75" fill="url(#jpPillarGrad)" rx="2"/>
          <rect x="155" y="115" width="10" height="75" fill="url(#jpPillarGrad)" rx="2"/>
          <rect x="244" y="115" width="10" height="75" fill="url(#jpPillarGrad)" rx="2"/>

          <!-- 悬挂日式暖光提灯 -->
          <g class="svg-japanese-lantern">
            <line x1="88" y1="115" x2="88" y2="128" stroke="#78350f" stroke-width="2"/>
            <rect x="78" y="128" width="20" height="26" rx="8" fill="#dc2626" stroke="#450a0a" stroke-width="1.5"/>
            <rect x="83" y="132" width="10" height="18" rx="4" fill="#fef08a" opacity="0.85"/>
            <text x="88" y="145" font-size="9" fill="#7f1d1d" font-weight="900" text-anchor="middle">茶</text>
          </g>
          <g class="svg-japanese-lantern">
            <line x1="232" y1="115" x2="232" y2="128" stroke="#78350f" stroke-width="2"/>
            <rect x="222" y="128" width="20" height="26" rx="8" fill="#dc2626" stroke="#450a0a" stroke-width="1.5"/>
            <rect x="227" y="132" width="10" height="18" rx="4" fill="#fef08a" opacity="0.85"/>
            <text x="232" y="145" font-size="9" fill="#7f1d1d" font-weight="900" text-anchor="middle">禅</text>
          </g>

          <rect x="52" y="190" width="216" height="12" rx="3" fill="#854d0e" stroke="#451a03" stroke-width="2"/>
          <text x="35" y="200" font-size="18">🏮</text>
          <text x="255" y="200" font-size="18">🪴</text>

          <g class="svg-floating-sakura">
            <text x="45" y="60" font-size="13" class="sakura-petal sp1">🌸</text>
            <text x="140" y="38" font-size="11" class="sakura-petal sp2">🌸</text>
            <text x="255" y="68" font-size="14" class="sakura-petal sp3">🌸</text>
          </g>
        </svg>
      `;
    }

    if (styleId === 'cottage_lv4') {
      // 碧琉璃水上行宫 (Aqua Crystal Palace)
      return `
        <svg class="house-svg house-svg-lv4" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="crystalRoofGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#38bdf8"/>
              <stop offset="50%" stop-color="#0284c7"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <linearGradient id="crystalPillarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#bae6fd"/>
              <stop offset="50%" stop-color="#38bdf8"/>
              <stop offset="100%" stop-color="#0369a1"/>
            </linearGradient>
            <radialGradient id="waterOrbGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#e0f2fe"/>
              <stop offset="60%" stop-color="#38bdf8"/>
              <stop offset="100%" stop-color="#0284c7"/>
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="190" rx="145" ry="38" fill="rgba(56, 189, 248, 0.25)"/>

          <!-- 左右水晶副塔 -->
          <polygon points="45,185 80,185 80,90 62,55 45,90" fill="url(#crystalRoofGrad)" stroke="#bae6fd" stroke-width="2"/>
          <circle cx="62" cy="55" r="5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5"/>
          <polygon points="240,185 275,185 275,90 258,55 240,90" fill="url(#crystalRoofGrad)" stroke="#bae6fd" stroke-width="2"/>
          <circle cx="258" cy="55" r="5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5"/>

          <!-- 中央水晶大殿穹顶 -->
          <path d="M 80,115 Q 160,35 240,115 Z" fill="url(#crystalRoofGrad)" stroke="#bae6fd" stroke-width="2.5"/>
          <circle cx="160" cy="45" r="14" fill="url(#waterOrbGrad)" stroke="#fff" stroke-width="2" class="svg-pulse-orb"/>
          <text x="160" y="50" font-size="14" text-anchor="middle" fill="#fff">💎</text>

          <!-- 大殿水晶琉璃主墙体 -->
          <rect x="80" y="115" width="160" height="75" fill="rgba(14, 116, 144, 0.6)" stroke="#38bdf8" stroke-width="2"/>
          <rect x="90" y="115" width="12" height="75" rx="3" fill="url(#crystalPillarGrad)" stroke="#fff" stroke-width="1"/>
          <rect x="132" y="115" width="12" height="75" rx="3" fill="url(#crystalPillarGrad)" stroke="#fff" stroke-width="1"/>
          <rect x="176" y="115" width="12" height="75" rx="3" fill="url(#crystalPillarGrad)" stroke="#fff" stroke-width="1"/>
          <rect x="218" y="115" width="12" height="75" rx="3" fill="url(#crystalPillarGrad)" stroke="#fff" stroke-width="1"/>

          <!-- 中央碧水拱门 -->
          <path d="M 140,190 L 140,145 Q 160,130 180,145 L 180,190 Z" fill="#0c4a6e" stroke="#7dd3fc" stroke-width="2"/>
          <rect x="35" y="185" width="250" height="15" rx="5" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
          <text x="160" y="172" font-size="14" text-anchor="middle">🌊</text>
        </svg>
      `;
    }

    if (styleId === 'cottage_lv5') {
      // 蓬莱仙阁浮云殿 (Celestial Cloud Palace)
      return `
        <svg class="house-svg house-svg-lv5" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="goldRoofGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fef08a"/>
              <stop offset="50%" stop-color="#eab308"/>
              <stop offset="100%" stop-color="#78350f"/>
            </linearGradient>
            <linearGradient id="jadePillarGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#a7f3d0"/>
              <stop offset="50%" stop-color="#34d399"/>
              <stop offset="100%" stop-color="#059669"/>
            </linearGradient>
          </defs>

          <!-- 金色仙气圣光轮盘 -->
          <circle cx="160" cy="100" r="85" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="8,6" opacity="0.6" class="svg-halo-spin"/>

          <!-- 顶层宝顶 -->
          <polygon points="160,22 125,52 195,52" fill="url(#goldRoofGrad)" stroke="#451a03" stroke-width="2"/>
          <circle cx="160" cy="18" r="6" fill="#fde047" stroke="#b45309" stroke-width="1.5"/>

          <!-- 中层飞檐 -->
          <path d="M 90,82 Q 160,62 230,82 L 215,52 Q 160,42 105,52 Z" fill="url(#goldRoofGrad)" stroke="#451a03" stroke-width="2.5"/>
          <!-- 下层宏伟大殿顶 -->
          <path d="M 40,128 Q 160,98 280,128 L 255,82 Q 160,62 65,82 Z" fill="url(#goldRoofGrad)" stroke="#451a03" stroke-width="3"/>
          <circle cx="40" cy="126" r="4.5" fill="#fde047"/>
          <circle cx="280" cy="126" r="4.5" fill="#fde047"/>

          <!-- 仙阁主殿 -->
          <rect x="70" y="125" width="180" height="65" fill="#450a0a" stroke="#d97706" stroke-width="2"/>
          <rect x="76" y="125" width="12" height="65" rx="3" fill="url(#jadePillarGrad)" stroke="#fef08a" stroke-width="1.2"/>
          <rect x="122" y="125" width="12" height="65" rx="3" fill="url(#jadePillarGrad)" stroke="#fef08a" stroke-width="1.2"/>
          <rect x="186" y="125" width="12" height="65" rx="3" fill="url(#jadePillarGrad)" stroke="#fef08a" stroke-width="1.2"/>
          <rect x="232" y="125" width="12" height="65" rx="3" fill="url(#jadePillarGrad)" stroke="#fef08a" stroke-width="1.2"/>

          <!-- 牌匾 -->
          <rect x="135" y="132" width="50" height="16" rx="3" fill="#78350f" stroke="#fde047" stroke-width="1.5"/>
          <text x="160" y="144" font-size="9" fill="#fde047" font-weight="900" text-anchor="middle">蓬莱仙阙</text>

          <!-- 殿底缭绕九天祥云海 -->
          <g class="svg-celestial-clouds">
            <ellipse cx="65" cy="195" rx="35" ry="18" fill="rgba(255,255,255,0.85)"/>
            <ellipse cx="115" cy="198" rx="42" ry="20" fill="rgba(255,255,255,0.92)"/>
            <ellipse cx="160" cy="196" rx="45" ry="22" fill="#ffffff"/>
            <ellipse cx="205" cy="198" rx="42" ry="20" fill="rgba(255,255,255,0.92)"/>
            <ellipse cx="255" cy="195" rx="35" ry="18" fill="rgba(255,255,255,0.85)"/>
          </g>
          <text x="45" y="80" font-size="14">✨</text>
          <text x="265" y="70" font-size="14">✨</text>
        </svg>
      `;
    }

    // 默认 Lv.1 避风港原木屋 (Cozy Woodland Cottage)
    return `
      <svg class="house-svg house-svg-lv1" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lv1Roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#b45309"/>
            <stop offset="50%" stop-color="#92400e"/>
            <stop offset="100%" stop-color="#451a03"/>
          </linearGradient>
          <linearGradient id="lv1Wall" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#d97706"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
          <linearGradient id="lv1Chimney" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#475569"/>
            <stop offset="50%" stop-color="#64748b"/>
            <stop offset="100%" stop-color="#334155"/>
          </linearGradient>
        </defs>

        <ellipse cx="160" cy="190" rx="135" ry="38" fill="rgba(245, 158, 11, 0.2)"/>

        <!-- 右侧石砌烟囱与袅袅炊烟 -->
        <rect x="220" y="55" width="28" height="60" rx="3" fill="url(#lv1Chimney)" stroke="#1e293b" stroke-width="2"/>
        <rect x="216" y="50" width="36" height="8" rx="2" fill="#334155"/>
        <g class="svg-smoke-group">
          <circle cx="234" cy="40" r="7" fill="rgba(255,255,255,0.7)" class="smoke-puff sp1"/>
          <circle cx="238" cy="24" r="10" fill="rgba(255,255,255,0.5)" class="smoke-puff sp2"/>
          <circle cx="244" cy="8" r="13" fill="rgba(255,255,255,0.3)" class="smoke-puff sp3"/>
        </g>

        <!-- 双层暖色斜坡大屋顶 -->
        <polygon points="45,110 160,35 275,110" fill="url(#lv1Roof)" stroke="#451a03" stroke-width="3"/>
        <!-- 阁楼老虎窗 -->
        <polygon points="140,75 160,55 180,75" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
        <circle cx="160" cy="72" r="7" fill="#fef08a" stroke="#451a03" stroke-width="1.5"/>
        <line x1="160" y1="65" x2="160" y2="79" stroke="#78350f" stroke-width="1"/>
        <line x1="153" y1="72" x2="167" y2="72" stroke="#78350f" stroke-width="1"/>

        <!-- 原木屋体主立面 -->
        <rect x="70" y="108" width="180" height="82" rx="4" fill="url(#lv1Wall)" stroke="#78350f" stroke-width="2.5"/>
        <line x1="70" y1="124" x2="250" y2="124" stroke="#78350f" stroke-width="1.2" opacity="0.6"/>
        <line x1="70" y1="140" x2="250" y2="140" stroke="#78350f" stroke-width="1.2" opacity="0.6"/>
        <line x1="70" y1="156" x2="250" y2="156" stroke="#78350f" stroke-width="1.2" opacity="0.6"/>
        <line x1="70" y1="172" x2="250" y2="172" stroke="#78350f" stroke-width="1.2" opacity="0.6"/>

        <!-- 左侧拱形木门 -->
        <path d="M 88,190 L 88,135 Q 108,120 128,135 L 128,190 Z" fill="#78350f" stroke="#451a03" stroke-width="2"/>
        <circle cx="120" cy="162" r="2.5" fill="#fde047"/>
        <circle cx="108" cy="120" r="5" fill="#fef08a" stroke="#78350f" stroke-width="1.5" class="svg-lantern-pulse"/>

        <!-- 右侧双联格子窗 -->
        <rect x="150" y="125" width="34" height="34" rx="3" fill="#fef08a" stroke="#78350f" stroke-width="2"/>
        <rect x="194" y="125" width="34" height="34" rx="3" fill="#fef08a" stroke="#78350f" stroke-width="2"/>
        <line x1="167" y1="125" x2="167" y2="159" stroke="#78350f" stroke-width="1.5"/>
        <line x1="150" y1="142" x2="184" y2="142" stroke="#78350f" stroke-width="1.5"/>
        <line x1="211" y1="125" x2="211" y2="159" stroke="#78350f" stroke-width="1.5"/>
        <line x1="194" y1="142" x2="228" y2="142" stroke="#78350f" stroke-width="1.5"/>

        <!-- 窗下盛开鲜花 -->
        <rect x="145" y="159" width="88" height="8" rx="2" fill="#78350f"/>
        <text x="148" y="158" font-size="12">🌸</text>
        <text x="166" y="158" font-size="12">🌼</text>
        <text x="184" y="158" font-size="12">🌺</text>
        <text x="202" y="158" font-size="12">🌻</text>
        <text x="220" y="158" font-size="12">🌿</text>

        <!-- 正门石阶台阶与迎宾地垫 -->
        <rect x="60" y="190" width="200" height="10" rx="3" fill="#64748b" stroke="#334155" stroke-width="1.5"/>
        <rect x="84" y="187" width="48" height="5" rx="2" fill="#b45309"/>
        <text x="108" y="191" font-size="5" fill="#fff" font-weight="900" text-anchor="middle">WELCOME</text>
      </svg>
    `;
  }

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
    zenUpdatedAt: Date.now(),
    heroCoins: 0,
    marketUnlocked: [],
    channelLetters: {},
    channelContributions: {},
    letters: [
      { id: 'welcome-001', channel: 'PAPA-0828', senderId: 'system', senderName: '远方的共养者', senderAvatar: '💌', body: '欢迎来到湖畔！慢慢陪伴两只小龟长大吧。', time: '刚刚', timestamp: Date.now() }
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

  const CHANNEL_PREFIX = 'papa_channel_state_';
  const ACTIVE_CHANNEL_KEY = 'papa_active_channel';
  const USER_PROFILE_KEY = 'papa_user_profile';

  function getChannelStorageKey(channelId) {
    const chan = String(channelId || 'PAPA-0828').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) || 'PAPA-0828';
    return `${CHANNEL_PREFIX}${chan}`;
  }

  function loadUserProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(USER_PROFILE_KEY));
      if (saved && saved.id) {
        return {
          id: saved.id,
          name: saved.name || '帕帕饲养员',
          avatar: saved.avatar || '🐢'
        };
      }
    } catch {}
    return {
      id: clientId,
      name: '帕帕饲养员',
      avatar: '🐢'
    };
  }

  function saveUserProfile(profile) {
    if (!profile) return;
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch {}
  }

  function freshCopy(value) { return JSON.parse(JSON.stringify(value)); }

  function createFreshChannelState(channelId) {
    const curChan = String(channelId || 'PAPA-0828').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) || 'PAPA-0828';
    const user = loadUserProfile();
    const fallback = freshCopy(defaultState);
    fallback.channel = curChan;
    fallback.user = user;
    fallback.letters = [
      {
        id: `welcome-${curChan}`,
        channel: curChan,
        senderId: 'system',
        senderName: '远方的共养者',
        senderAvatar: '💌',
        body: `欢迎来到频道【${curChan}】！慢慢陪伴两只小龟长大吧。`,
        time: '刚刚',
        timestamp: Date.now()
      }
    ];
    fallback.contributions = {
      [user.id]: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        totalZen: 0,
        todayZen: 0,
        lastDay: dayKey,
        details: { petCare: 0, treeHarvest: 0, keyboardZen: 0, keystrokes: 0, focusTimer: 0, chestReward: 0 },
        lastActive: Date.now()
      }
    };
    return fallback;
  }

  function loadState(targetChannel) {
    try {
      const activeChan = String(targetChannel || localStorage.getItem(ACTIVE_CHANNEL_KEY) || defaultState.channel || 'PAPA-0828').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) || 'PAPA-0828';
      const storageKey = getChannelStorageKey(activeChan);
      let raw = localStorage.getItem(storageKey);

      // 兼容老版本数据平滑迁移（若老全局数据存在且新默认频道尚未建立独立存储）
      if (!raw && activeChan === 'PAPA-0828') {
        const legacy = localStorage.getItem(STORAGE_KEY);
        if (legacy) {
          raw = legacy;
        }
      }

      if (!raw) {
        const fresh = createFreshChannelState(activeChan);
        localStorage.setItem(storageKey, JSON.stringify(fresh));
        localStorage.setItem(ACTIVE_CHANNEL_KEY, activeChan);
        return fresh;
      }

      const saved = JSON.parse(raw);
      const user = loadUserProfile();
      const freshTemplate = createFreshChannelState(activeChan);
      const savedKeystrokes = Number(localStorage.getItem(`${STORAGE_KEY}-keystrokes`)) || 0;

      const stateObj = {
        ...freshTemplate,
        ...saved,
        channel: activeChan,
        user: { ...user, ...(saved.user || {}) },
        focus: { ...freshTemplate.focus, ...(saved.focus || {}) },
        contributions: { ...(saved.contributions || {}) },
        pets: { ...freshCopy(defaultState.pets), ...(saved.pets || {}) },
        garden: { ...freshCopy(defaultState.garden), ...(saved.garden || {}) },
        letters: Array.isArray(saved.letters) && saved.letters.length > 0
          ? saved.letters.filter(l => !l.channel || l.channel === activeChan)
          : freshTemplate.letters
      };

      stateObj.user.id = stateObj.user.id || user.id;
      stateObj.keystrokes = Math.max(stateObj.keystrokes || 0, savedKeystrokes);

      // 确保当前用户在当前频道的贡献记录
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

      localStorage.setItem(ACTIVE_CHANNEL_KEY, activeChan);
      return stateObj;
    } catch {
      return createFreshChannelState('PAPA-0828');
    }
  }

  function switchChannel(newChannelId) {
    const targetChan = String(newChannelId || 'PAPA-0828').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
    if (!targetChan) return;
    if (targetChan === state.channel) return;

    // 1. 立即持久化保存当前旧频道数据
    persist();

    // 2. 彻底断开旧频道的通信通道，防止旧频道消息残留在新信道
    if (typeof closeChannel === 'function') {
      closeChannel();
    }

    // 3. 立即从新频道的专属独立存储槽加载数据（100% 物理隔离）
    state = loadState(targetChan);

    // 4. 打开新频道的专属通信通道
    if (typeof openChannel === 'function') {
      openChannel();
    }

    // 5. 立即更新界面与广播
    if (typeof render === 'function') {
      render();
    }
    if (typeof sync === 'function') {
      sync(true);
    }
  }

  let state = loadState();
  let currentHabitatFilter = 'all';
  let isDecorEditMode = false;
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
    if (!state || !state.channel) return;
    const curChan = String(state.channel).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) || 'PAPA-0828';
    const storageKey = getChannelStorageKey(curChan);
    localStorage.setItem(storageKey, JSON.stringify(state));
    localStorage.setItem(ACTIVE_CHANNEL_KEY, curChan);
    if (state.user) {
      saveUserProfile(state.user);
    }
    window.sanctuaryDesktop?.sendSyncState(state);
  }
  function escapeHTML(text) { return String(text).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }
  function format(number) { return Number(number).toLocaleString('zh-CN'); }
  const hatIcons = {
    '竹笋帽': '🎋',
    '南瓜帽': '🎃',
    '草莓帽': '🍓',
    '金色王冠': '👑',
    '清凉荷叶': '🍃',
    '粉嫩蝴蝶结': '🎀',
    '向日葵花环': '🌻',
    '萌萌小黄鸭': '🐥',
    '幸运四叶草': '🍀',
    '红白巫师菇': '🍄',
    '闪耀独角兽角': '🦄',
    '星空魔术礼帽': '🎩',
    '天使光环': '😇',
    '海盗三角帽': '🏴‍☠️',
    '樱花发簪': '🌸',
    '暖冬针织帽': '🧶',
    '潜水探险镜': '🤿',
    '飞行员护目镜': '🕶️'
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
  function spendZen(amount, reason = '消费支出') {
    if (typeof amount !== 'number' || amount <= 0) return false;
    if (state.zen < amount) return false;
    state.zen -= amount;
    state.zenUpdatedAt = Date.now();
    state.lastActive = Date.now();
    persist();
    render();
    sync(true); // 消费支出立即强刷同步给远程共养者，杜绝脏读回滚
    return true;
  }

  function gainZen(amount, detail = '键盘禅意', category = 'keyboardZen') {
    state.zen += amount;
    state.zenUpdatedAt = Date.now();
    state.lastActive = Date.now();
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
    sync(true);
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

