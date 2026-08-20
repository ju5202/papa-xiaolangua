/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — 庭院场景与乌龟 AI 漫步 (Garden & Turtle AI)
   ========================================================================== */
  function getTurtleSvg(petId, extraClass = '') {
    if (petId === 'papa') {
      return `<svg class="turtle-svg papa-svg ${extraClass}" viewBox="0 0 190 125" width="100%" height="100%">
  <defs>
    <linearGradient id="papaShellMain" x1="25%" y1="0%" x2="75%" y2="100%">
      <stop offset="0%" stop-color="#987e48"/>
      <stop offset="35%" stop-color="#846838"/>
      <stop offset="75%" stop-color="#6a5228"/>
      <stop offset="100%" stop-color="#4e3a1a"/>
    </linearGradient>
    <linearGradient id="papaRimMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f2ecd0"/>
      <stop offset="100%" stop-color="#ded092"/>
    </linearGradient>
    <linearGradient id="papaSkinMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bad0a2"/>
      <stop offset="55%" stop-color="#9eb882"/>
      <stop offset="100%" stop-color="#84a168"/>
    </linearGradient>
    <linearGradient id="papaBellyMain" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e8efba"/>
      <stop offset="100%" stop-color="#cdd892"/>
    </linearGradient>
  </defs>

  <!-- 1. Perky Cute Little Tail -->
  <path class="turtle-tail" d="M 150 71 C 164 66, 178 70, 182 74 C 182 77, 170 82, 150 78 Z" fill="url(#papaSkinMain)" stroke="#342010" stroke-width="3.2" stroke-linejoin="round"/>

  <!-- 2. Far Back Leg -->
  <g class="leg-back-far">
    <path d="M 124 82 C 126 92, 128 102, 136 106 C 142 107, 148 103, 144 92 C 142 85, 138 81, 132 80 Z" fill="#849e66" stroke="#342010" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 132 103 L 133 107" stroke="#342010" stroke-width="2" stroke-linecap="round"/>
    <path d="M 139 103 L 140 107" stroke="#342010" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- 3. Far Front Leg -->
  <g class="leg-front-far">
    <path d="M 54 80 C 51 90, 52 100, 60 105 C 66 107, 72 101, 70 90 C 68 83, 64 80, 58 80 Z" fill="#849e66" stroke="#342010" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 54 100 L 54 105" stroke="#342010" stroke-width="2" stroke-linecap="round"/>
    <path d="M 62 101 L 63 106" stroke="#342010" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- 4. Plastron / Belly -->
  <path d="M 56 80 C 72 90, 114 91, 138 81 C 132 90, 112 95, 66 93 C 56 90, 52 83, 56 80 Z" fill="url(#papaBellyMain)" stroke="#342010" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="M 80 84 C 84 90, 90 92, 92 92" stroke="#889650" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M 110 83 C 112 89, 118 91, 120 91" stroke="#889650" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- 5. Near Back Leg -->
  <g class="leg-back-near">
    <path d="M 110 80 C 108 90, 110 104, 118 110 C 126 113, 138 113, 144 104 C 148 95, 143 84, 134 78 Z" fill="url(#papaSkinMain)" stroke="#342010" stroke-width="3.4" stroke-linejoin="round"/>
    <path d="M 120 106 L 121 111" stroke="#342010" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 130 107 L 131 112" stroke="#342010" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 138 104 L 140 109" stroke="#342010" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="118" cy="90" r="2.2" fill="#7d965e"/>
    <circle cx="126" cy="94" r="1.8" fill="#7d965e"/>
  </g>

  <!-- 6. Near Front Leg -->
  <g class="leg-front-near">
    <path d="M 60 78 C 54 88, 56 102, 64 110 C 72 113, 84 113, 90 104 C 95 95, 92 82, 84 76 Z" fill="url(#papaSkinMain)" stroke="#342010" stroke-width="3.4" stroke-linejoin="round"/>
    <path d="M 66 106 L 66 112" stroke="#342010" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 75 107 L 76 113" stroke="#342010" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 83 104 L 85 110" stroke="#342010" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="72" cy="88" r="2.4" fill="#7d965e"/>
    <circle cx="80" cy="92" r="2" fill="#7d965e"/>
    <circle cx="68" cy="96" r="1.8" fill="#7d965e"/>
    <circle cx="77" cy="100" r="2.2" fill="#7d965e"/>
  </g>

  <!-- 7. Short Chubby Head & Neck (Snug against shell opening) -->
  <g class="head-group">
    <!-- Chubby neck & cute head -->
    <path d="M 58 54 C 48 46, 38 42, 32 42 C 20 42, 12 50, 12 62 C 12 74, 22 80, 36 80 C 46 80, 54 80, 62 80 C 64 72, 62 62, 58 54 Z" fill="url(#papaSkinMain)" stroke="#342010" stroke-width="3.6" stroke-linejoin="round"/>
    <path d="M 42 68 C 48 72, 54 72, 58 70" stroke="#7d965e" stroke-width="2.2" stroke-linecap="round" fill="none"/>

    <!-- Big Glossy Black Eye with Sparkles -->
    <circle cx="26" cy="60" r="5.2" fill="#181e14"/>
    <circle cx="28" cy="58" r="1.8" fill="#ffffff"/>
    <circle cx="24.5" cy="62.5" r="0.8" fill="#ffffff"/>

    <!-- Cute Smile -->
    <path d="M 14 66 C 17 70, 21 70, 24 66" stroke="#2c1e0e" stroke-width="2.6" stroke-linecap="round" fill="none"/>

    <!-- Soft Peach Cheek Blush -->
    <ellipse cx="32" cy="70" rx="5.5" ry="3.5" fill="#f0a594" opacity="0.88"/>
  </g>

  <!-- 8. Plump Round Carapace & Classic Diamond Scutes -->
  <g class="carapace">
    <!-- Plump Curved Dome Profile -->
    <path d="M 52 66 C 52 36, 82 20, 116 20 C 150 20, 172 40, 168 68 C 165 76, 156 78, 142 78 C 106 78, 64 76, 52 66 Z" fill="url(#papaShellMain)" stroke="#342010" stroke-width="3.6" stroke-linejoin="round"/>

    <!-- Vertebral Diamond Row (Top) -->
    <polygon points="60,46 80,30 102,36 94,54 68,56" fill="#8e743e" stroke="#342010" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="102,36 126,28 144,38 132,56 94,54" fill="#826834" stroke="#342010" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="144,38 162,46 160,62 132,56" fill="#765c2a" stroke="#342010" stroke-width="2.8" stroke-linejoin="round"/>

    <!-- Costal Diamond Row (Side) - Extended downward -->
    <polygon points="60,46 68,56 62,72 50,67" fill="#846a36" stroke="#342010" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="68,56 94,54 100,74 62,72" fill="#785e2b" stroke="#342010" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="94,54 132,56 136,75 100,74" fill="#6e5422" stroke="#342010" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="132,56 160,62 158,75 136,75" fill="#644a1a" stroke="#342010" stroke-width="2.8" stroke-linejoin="round"/>

    <!-- Golden Sand Speckles inside diamond plates -->
    <!-- Front Scute V1 -->
    <circle cx="78" cy="38" r="1.8" fill="#dfcb84" opacity="0.95"/>
    <circle cx="88" cy="36" r="2.2" fill="#ecdc95" opacity="0.95"/>
    <circle cx="74" cy="46" r="1.9" fill="#dfcb84" opacity="0.95"/>
    <circle cx="84" cy="48" r="2.4" fill="#f4e8a4" opacity="0.95"/>
    <circle cx="94" cy="46" r="1.8" fill="#dfcb84" opacity="0.95"/>

    <!-- Middle Scute V2 -->
    <circle cx="112" cy="37" r="1.8" fill="#dfcb84" opacity="0.95"/>
    <circle cx="122" cy="35" r="2.2" fill="#ecdc95" opacity="0.95"/>
    <circle cx="110" cy="46" r="2.4" fill="#f4e8a4" opacity="0.95"/>
    <circle cx="120" cy="47" r="2.2" fill="#ecdc95" opacity="0.95"/>
    <circle cx="130" cy="46" r="1.8" fill="#dfcb84" opacity="0.95"/>

    <!-- Rear Scute V3 -->
    <circle cx="146" cy="48" r="1.9" fill="#dfcb84" opacity="0.95"/>
    <circle cx="154" cy="52" r="2.2" fill="#ecdc95" opacity="0.95"/>
    <circle cx="146" cy="58" r="1.8" fill="#dfcb84" opacity="0.9"/>

    <!-- Side Scute C2 -->
    <circle cx="76" cy="62" r="2" fill="#dfcb84" opacity="0.95"/>
    <circle cx="86" cy="61" r="2.4" fill="#f4e8a4" opacity="0.95"/>
    <circle cx="78" cy="68" r="1.9" fill="#ecdc95" opacity="0.95"/>
    <circle cx="88" cy="68" r="2.2" fill="#dfcb84" opacity="0.95"/>

    <!-- Side Scute C3 -->
    <circle cx="110" cy="63" r="2" fill="#dfcb84" opacity="0.95"/>
    <circle cx="120" cy="64" r="2.4" fill="#f4e8a4" opacity="0.95"/>
    <circle cx="114" cy="70" r="2" fill="#ecdc95" opacity="0.95"/>
    <circle cx="124" cy="70" r="1.8" fill="#dfcb84" opacity="0.95"/>
  </g>

  <!-- 9. Slim & Natural Shell Rim (Narrow curved trim) -->
  <g class="shell-rim">
    <path d="M 50 69 C 64 72, 110 76, 160 74 C 165 76, 164 79, 156 80 C 120 82, 68 80, 48 75 C 46 72, 47 70, 50 69 Z" fill="url(#papaRimMain)" stroke="#342010" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M 74 72 L 73 78" stroke="#7a5e30" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
    <path d="M 98 74 L 97 80" stroke="#7a5e30" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
    <path d="M 122 75 L 121 81" stroke="#7a5e30" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
    <path d="M 144 75 L 143 79" stroke="#7a5e30" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
  </g>
</svg>`;
    } else {
      return `<svg class="turtle-svg pumpkin-svg ${extraClass}" viewBox="0 0 190 125" width="100%" height="100%">
  <defs>
    <linearGradient id="pumpkinShellMain" x1="25%" y1="0%" x2="75%" y2="100%">
      <stop offset="0%" stop-color="#8cd06e"/>
      <stop offset="35%" stop-color="#76b858"/>
      <stop offset="75%" stop-color="#589c3c"/>
      <stop offset="100%" stop-color="#407e28"/>
    </linearGradient>
    <linearGradient id="pumpkinRimMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faf6d4"/>
      <stop offset="100%" stop-color="#e8e2a6"/>
    </linearGradient>
    <linearGradient id="pumpkinSkinMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#daf8a6"/>
      <stop offset="55%" stop-color="#c2ea86"/>
      <stop offset="100%" stop-color="#a6d668"/>
    </linearGradient>
    <linearGradient id="pumpkinBellyMain" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f6fac8"/>
      <stop offset="100%" stop-color="#deeca4"/>
    </linearGradient>
  </defs>

  <!-- 1. Perky Cute Little Tail -->
  <path class="turtle-tail" d="M 150 71 C 164 66, 178 70, 182 74 C 182 77, 170 82, 150 78 Z" fill="url(#pumpkinSkinMain)" stroke="#223e16" stroke-width="3.2" stroke-linejoin="round"/>

  <!-- 2. Far Back Leg -->
  <g class="leg-back-far">
    <path d="M 124 82 C 126 92, 128 102, 136 106 C 142 107, 148 103, 144 92 C 142 85, 138 81, 132 80 Z" fill="#9ecc68" stroke="#223e16" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 132 103 L 133 107" stroke="#223e16" stroke-width="2" stroke-linecap="round"/>
    <path d="M 139 103 L 140 107" stroke="#223e16" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- 3. Far Front Leg -->
  <g class="leg-front-far">
    <path d="M 54 80 C 51 90, 52 100, 60 105 C 66 107, 72 101, 70 90 C 68 83, 64 80, 58 80 Z" fill="#9ecc68" stroke="#223e16" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 54 100 L 54 105" stroke="#223e16" stroke-width="2" stroke-linecap="round"/>
    <path d="M 62 101 L 63 106" stroke="#223e16" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- 4. Plastron / Belly -->
  <path d="M 56 80 C 72 90, 114 91, 138 81 C 132 90, 112 95, 66 93 C 56 90, 52 83, 56 80 Z" fill="url(#pumpkinBellyMain)" stroke="#223e16" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="M 80 84 C 84 90, 90 92, 92 92" stroke="#9bb854" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M 110 83 C 112 89, 118 91, 120 91" stroke="#9bb854" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- 5. Near Back Leg -->
  <g class="leg-back-near">
    <path d="M 110 80 C 108 90, 110 104, 118 110 C 126 113, 138 113, 144 104 C 148 95, 143 84, 134 78 Z" fill="url(#pumpkinSkinMain)" stroke="#223e16" stroke-width="3.4" stroke-linejoin="round"/>
    <path d="M 120 106 L 121 111" stroke="#223e16" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 130 107 L 131 112" stroke="#223e16" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 138 104 L 140 109" stroke="#223e16" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="118" cy="90" r="2.2" fill="#95c756"/>
    <circle cx="126" cy="94" r="1.8" fill="#95c756"/>
  </g>

  <!-- 6. Near Front Leg -->
  <g class="leg-front-near">
    <path d="M 60 78 C 54 88, 56 102, 64 110 C 72 113, 84 113, 90 104 C 95 95, 92 82, 84 76 Z" fill="url(#pumpkinSkinMain)" stroke="#223e16" stroke-width="3.4" stroke-linejoin="round"/>
    <path d="M 66 106 L 66 112" stroke="#223e16" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 75 107 L 76 113" stroke="#223e16" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 83 104 L 85 110" stroke="#223e16" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="72" cy="88" r="2.4" fill="#95c756"/>
    <circle cx="80" cy="92" r="2" fill="#95c756"/>
    <circle cx="68" cy="96" r="1.8" fill="#95c756"/>
    <circle cx="77" cy="100" r="2.2" fill="#95c756"/>
  </g>

  <!-- 7. Short Chubby Head & Neck -->
  <g class="head-group">
    <path d="M 58 54 C 48 46, 38 42, 32 42 C 20 42, 12 50, 12 62 C 12 74, 22 80, 36 80 C 46 80, 54 80, 62 80 C 64 72, 62 62, 58 54 Z" fill="url(#pumpkinSkinMain)" stroke="#223e16" stroke-width="3.6" stroke-linejoin="round"/>
    <path d="M 42 68 C 48 72, 54 72, 58 70" stroke="#95c756" stroke-width="2.2" stroke-linecap="round" fill="none"/>

    <!-- Big Glossy Black Eye with Sparkles -->
    <circle cx="26" cy="60" r="5.2" fill="#181e14"/>
    <circle cx="28" cy="58" r="1.8" fill="#ffffff"/>
    <circle cx="24.5" cy="62.5" r="0.8" fill="#ffffff"/>

    <!-- Cute Smile -->
    <path d="M 14 66 C 17 70, 21 70, 24 66" stroke="#203814" stroke-width="2.6" stroke-linecap="round" fill="none"/>

    <!-- Peach Cheek Blush -->
    <ellipse cx="32" cy="70" rx="5.5" ry="3.5" fill="#fca798" opacity="0.9"/>
  </g>

  <!-- 8. Plump Round Carapace & Classic Diamond Scutes -->
  <g class="carapace">
    <path d="M 52 66 C 52 36, 82 20, 116 20 C 150 20, 172 40, 168 68 C 165 76, 156 78, 142 78 C 106 78, 64 76, 52 66 Z" fill="url(#pumpkinShellMain)" stroke="#223e16" stroke-width="3.6" stroke-linejoin="round"/>

    <!-- Vertebral Diamond Row (Top) -->
    <polygon points="60,46 80,30 102,36 94,54 68,56" fill="#80c262" stroke="#223e16" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="102,36 126,28 144,38 132,56 94,54" fill="#72b554" stroke="#223e16" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="144,38 162,46 160,62 132,56" fill="#64a544" stroke="#223e16" stroke-width="2.8" stroke-linejoin="round"/>

    <!-- Costal Diamond Row (Side) -->
    <polygon points="60,46 68,56 62,72 50,67" fill="#76b956" stroke="#223e16" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="68,56 94,54 100,74 62,72" fill="#6aaf4a" stroke="#223e16" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="94,54 132,56 136,75 100,74" fill="#5ea33e" stroke="#223e16" stroke-width="2.8" stroke-linejoin="round"/>
    <polygon points="132,56 160,62 158,75 136,75" fill="#529532" stroke="#223e16" stroke-width="2.8" stroke-linejoin="round"/>

    <!-- Mint Speckles inside diamond plates -->
    <!-- Front Scute V1 -->
    <circle cx="78" cy="38" r="1.8" fill="#cbf2ac" opacity="0.95"/>
    <circle cx="88" cy="36" r="2.2" fill="#defac0" opacity="0.95"/>
    <circle cx="74" cy="46" r="1.9" fill="#cbf2ac" opacity="0.95"/>
    <circle cx="84" cy="48" r="2.4" fill="#ebfed0" opacity="0.95"/>
    <circle cx="94" cy="46" r="1.8" fill="#cbf2ac" opacity="0.95"/>

    <!-- Middle Scute V2 -->
    <circle cx="112" cy="37" r="1.8" fill="#cbf2ac" opacity="0.95"/>
    <circle cx="122" cy="35" r="2.2" fill="#defac0" opacity="0.95"/>
    <circle cx="110" cy="46" r="2.4" fill="#ebfed0" opacity="0.95"/>
    <circle cx="120" cy="47" r="2.2" fill="#defac0" opacity="0.95"/>
    <circle cx="130" cy="46" r="1.8" fill="#cbf2ac" opacity="0.95"/>

    <!-- Rear Scute V3 -->
    <circle cx="146" cy="48" r="1.9" fill="#cbf2ac" opacity="0.95"/>
    <circle cx="154" cy="52" r="2.2" fill="#defac0" opacity="0.95"/>
    <circle cx="146" cy="58" r="1.8" fill="#cbf2ac" opacity="0.9"/>

    <!-- Side Scute C2 -->
    <circle cx="76" cy="62" r="2" fill="#cbf2ac" opacity="0.95"/>
    <circle cx="86" cy="61" r="2.4" fill="#ebfed0" opacity="0.95"/>
    <circle cx="78" cy="68" r="1.9" fill="#defac0" opacity="0.95"/>
    <circle cx="88" cy="68" r="2.2" fill="#cbf2ac" opacity="0.95"/>

    <!-- Side Scute C3 -->
    <circle cx="110" cy="63" r="2" fill="#cbf2ac" opacity="0.95"/>
    <circle cx="120" cy="64" r="2.4" fill="#ebfed0" opacity="0.95"/>
    <circle cx="114" cy="70" r="2" fill="#defac0" opacity="0.95"/>
    <circle cx="124" cy="70" r="1.8" fill="#cbf2ac" opacity="0.95"/>
  </g>

  <!-- 9. Slim & Natural Shell Rim (Narrow curved trim) -->
  <g class="shell-rim">
    <path d="M 50 69 C 64 72, 110 76, 160 74 C 165 76, 164 79, 156 80 C 120 82, 68 80, 48 75 C 46 72, 47 70, 50 69 Z" fill="url(#pumpkinRimMain)" stroke="#223e16" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M 74 72 L 73 78" stroke="#5d823e" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
    <path d="M 98 74 L 97 80" stroke="#5d823e" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
    <path d="M 122 75 L 121 81" stroke="#5d823e" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
    <path d="M 144 75 L 143 79" stroke="#5d823e" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
  </g>
</svg>`;
    }
  }

  function turtleMarkup(pet, extra = '') {
    const isPond = (pet.x ?? 50) > 50;
    const modeClass = isPond ? 'swimming' : 'walking';
    const dir = typeof pet.dir === 'number' ? pet.dir : (pet.id === 'pumpkin' ? -1 : 1);
    const dirClass = dir === -1 ? 'face-left' : 'face-right';
    const flipStyle = dir === 1 ? 'transform: scaleX(-1);' : 'transform: scaleX(1);';
    const hatIcon = hatIcons[pet.equipment] || pet.equipment || '';
    const wearable = pet.equipment ? `<span class="wearable">${hatIcon}</span>` : '';
    const petClass = pet.id === 'papa' ? 'turtle-papa' : 'turtle-pumpkin';

    return `<div class="turtle ${petClass} ${modeClass} ${dirClass} ${extra}" data-pet="${pet.id}" data-dir="${dir}" style="left:${pet.x ?? 50}%;top:${pet.y ?? 65}%;--glow:${pet.glow};">
      <div class="aura"></div>
      <div class="turtle-sprite" style="${flipStyle}">
        ${getTurtleSvg(pet.id)}
        ${wearable}
      </div>
      <span class="nameplate">${pet.name} · Lv.${pet.level}</span>
    </div>`;
  }

  function miniTurtleMarkup(pet) {
    return `<div class="mini-turtle ${pet.id === 'papa' ? 'mini-papa' : 'mini-pumpkin'}">${getTurtleSvg(pet.id, 'mini-svg')}</div>`;
  }
  function decorationMarkup(decor) {
    const isPondItem = decor.type === 'reeds' || decor.type === 'lily';
    const zoneAttr = isPondItem ? 'pond' : 'land';
    if (decor.type === 'cottage') {
      const curStyleId = state.garden.houseStyle || 'cottage_lv1';
      const curStyle = HOUSE_STYLES.find(s => s.id === curStyleId) || HOUSE_STYLES[0];
      const houseClass = curStyle.class || 'cottage-style-lv1';
      const svgContent = typeof getHouseSvg === 'function' ? getHouseSvg(curStyleId) : '';

      const label = `<span class="tag cottage-tag">${curStyle.icon} Lv.${curStyle.level} ${curStyle.name} <em class="tag-hint">✎ 升级换装</em></span>`;
      return `<div class="decor cottage ${houseClass}" data-decor="${decor.id}" data-zone="${zoneAttr}" style="left:${decor.x}%;top:${decor.y}%;--layer:2" title="点击打开圣域府邸工坊，使用禅意升级或更换房屋">
        ${label}
        <div class="cottage-canvas">
          ${svgContent}
        </div>
      </div>`;
    }
    if (decor.type === 'tree') {
      const stage = decor.stage ?? 3;
      const stageClass = `stage-${stage}`;
      const isHarvestable = stage === 3 && !decor.harvested;
      const fruitBadge = isHarvestable ? '<i class="plant-fruit" style="top:6px;right:6px;font-style:normal;">🍊</i>' : '';
      const stageText = stage === 0 ? '🌱 树苗' : stage === 1 ? '🌿 小树' : stage === 2 ? '🌳 大树' : '🍊 结果 (点击采摘)';
      const label = `<span class="tag">${decor.label} · ${stageText}</span>`;
      return `<div class="decor tree ${stageClass} ${isHarvestable ? 'can-harvest' : ''}" data-decor="${decor.id}" data-zone="${zoneAttr}" style="left:${decor.x}%;top:${decor.y}%;--layer:1">${label}<i class="trunk"></i><i class="foliage"></i><i class="fruit"></i>${fruitBadge}</div>`;
    }
    if (decor.type === 'fountain') return `<div class="decor fountain" data-decor="${decor.id}" data-zone="${zoneAttr}" style="left:${decor.x}%;top:${decor.y}%;--layer:3"><span class="tag">${decor.label}</span><i class="water"></i><i class="base"></i></div>`;
    if (decor.type === 'manhole' || decor.type === 'sewer') return `<div class="decor manhole" data-decor="${decor.id}" data-zone="${zoneAttr}" style="left:${decor.x}%;top:${decor.y}%;--layer:3"><span class="tag">${decor.label}</span><i class="cover"></i><i class="ring"></i><i class="holes"></i></div>`;
    if (decor.type === 'seed') return `<div class="decor seedling" data-decor="${decor.id}" data-zone="${zoneAttr}" style="left:${decor.x}%;top:${decor.y}%;--layer:3"><span class="tag">${decor.label}</span><i class="seed"></i></div>`;

    const stage = decor.stage ?? (state.garden.plantStage || 3);
    const isHarvestable = stage === 3 && !decor.harvested;
    const fruit = isHarvestable ? '<i class="plant-fruit"></i>' : '';
    const stageText = stage === 0 ? '🌱 树苗' : stage === 1 ? '🌿 小树' : stage === 2 ? '🌳 大树' : '🍊 结果 (点击采摘)';
    const label = `<span class="tag">${decor.label} · ${stageText}</span>`;
    return `<div class="decor plant ${isHarvestable ? 'can-harvest' : ''}" data-decor="${decor.id}" data-zone="${zoneAttr}" data-plant="true" style="left:${decor.x}%;top:${decor.y}%;--layer:3">${label}<i class="soil"></i><i class="stem"></i><i class="leaf l1"></i><i class="leaf l2"></i><i class="leaf l3"></i>${fruit}</div>`;
  }
  function renderPetCards() {
    $('#petCards').innerHTML = Object.values(state.pets).map(pet => {
      const req = getXpRequired(pet.level);
      const pct = Math.min(100, Math.floor((pet.xp / req) * 100));
      return `
      <article class="pet-card ${state.selectedPet === pet.id ? 'selected' : ''}" data-pet-card="${pet.id}" style="--pet-color:${pet.glow}">
        ${miniTurtleMarkup(pet)}
        <div class="pet-info"><div class="pet-name"><b>${pet.name}</b><span>Lv.${pet.level}</span></div><small>${pet.title} · ${pet.xp}/${req} XP</small><div class="xp-track"><i style="width:${pct}%"></i></div></div>
      </article>`;
    }).join('');

    $$('.pet-card[data-pet-card]').forEach(card => {
      card.onclick = () => {
        const petId = card.dataset.petCard;
        if (petId && state.pets[petId]) {
          state.selectedPet = petId;
          petCelebrate(petId);
          renderPetCards();
          persist();
          sync();
        }
      };
    });
  }
  const STAGE_INTERVAL_MS = 15 * 60 * 1000; // 每 15 分钟进入下一个生长阶段 (900000ms)

  function updateTreeGrowth() {
    if (!state.garden || !Array.isArray(state.garden.decorations)) return;
    const now = Date.now();
    let updated = false;

    state.garden.decorations.forEach(decor => {
      if (decor.type === 'tree' || decor.type === 'plant') {
        if (typeof decor.stage !== 'number') decor.stage = 0;
        if (!decor.lastStageTime) decor.lastStageTime = now;

        if (decor.stage < 3) {
          const elapsed = now - decor.lastStageTime;
          if (elapsed >= STAGE_INTERVAL_MS) {
            const stagesGained = Math.floor(elapsed / STAGE_INTERVAL_MS);
            decor.stage = Math.min(3, decor.stage + stagesGained);
            decor.lastStageTime = decor.lastStageTime + (stagesGained * STAGE_INTERVAL_MS);
            if (decor.stage === 3) {
              decor.harvested = false;
              toast('🍊 果实成熟', `${decor.label || '树木'} 结出了金黄果实，快去采摘吧！`);
            }
            updated = true;
          }
        }
      }
    });

    if (updated) {
      persist();
      render();
      sync();
    }
  }

  function handleTreeClick(event, decorId) {
    if (isDecorEditMode) return;
    event.stopPropagation();
    const decor = state.garden.decorations.find(d => d.id === decorId);
    if (!decor) return;

    updateTreeGrowth();

    const stage = decor.stage ?? 0;
    const now = Date.now();
    if (!decor.lastStageTime) decor.lastStageTime = now;

    if (stage < 3) {
      const elapsed = now - decor.lastStageTime;
      const remainingMs = Math.max(0, STAGE_INTERVAL_MS - (elapsed % STAGE_INTERVAL_MS));
      const remainingMins = Math.ceil(remainingMs / 60000);
      const stageNames = ['🌱 树苗', '🌿 小树', '🌳 大树'];
      toast(stageNames[stage] || '树木成长中', `正在吸收水分与阳光，还需约 ${remainingMins} 分钟自动进入下一阶段（共4阶段）。`);
    } else if (stage === 3 && !decor.harvested) {
      decor.harvested = true;
      const zenEarned = 30;
      state.zen += zenEarned;
      recordContribution(zenEarned, 'treeHarvest');
      state.dailyCare = Math.min(5, state.dailyCare + 1);

      // 果树采摘为两只小龟平分滋养经验
      addPetXp('papa', 15);
      addPetXp('pumpkin', 15);

      showZen(zenEarned, decor.x, decor.y);
      toast('🍊 采摘成功', `成功采摘成熟果实，收下 ${zenEarned} 禅意值！帕帕与小南瓜均获得 +15 经验！`);

      // 采摘后重置为阶段0，重新开启 15 分钟/阶段的自动生长循环
      decor.stage = 0;
      decor.harvested = false;
      decor.lastStageTime = Date.now();

      persist(); render(); sync(true);
    } else if (stage === 3 && decor.harvested) {
      toast('🍊 已采摘', '果实已采摘，正在准备下一轮开花结果。');
    }
  }
  function renderGarden() {
    $('#decorLayer').innerHTML = state.garden.decorations.map(decorationMarkup).join('');
    const papa = state.pets.papa, pumpkin = state.pets.pumpkin;
    $('#turtleLayer').innerHTML = turtleMarkup(papa) + turtleMarkup(pumpkin);
    if ($('#widgetTurtles')) {
      $('#widgetTurtles').innerHTML = turtleMarkup(papa) + turtleMarkup(pumpkin);
      const pumpkinEl = $('#widgetTurtles .turtle[data-pet="pumpkin"]');
      const papaEl = $('#widgetTurtles .turtle[data-pet="papa"]');
      if (wingMode === 'left') {
        if (pumpkinEl) pumpkinEl.style.display = 'none';
        if (papaEl) papaEl.style.display = '';
      } else if (wingMode === 'right') {
        if (papaEl) papaEl.style.display = 'none';
        if (pumpkinEl) pumpkinEl.style.display = '';
      } else {
        // 统一/靠左模式：两只小乌龟同屏自由往返游弋
        if (papaEl) papaEl.style.display = '';
        if (pumpkinEl) pumpkinEl.style.display = '';
      }
      $$('#widgetTurtles .turtle').forEach(tEl => {
        tEl.onclick = (e) => {
          e.stopPropagation();
          petCelebrate(tEl.dataset.pet);
        };
      });
    }
    makeDraggable();
    $$('.decor[data-decor]').forEach(item => {
      const decorId = item.dataset.decor;
      const decor = state.garden.decorations.find(d => d.id === decorId);
      if (decor) {
        if (decor.type === 'tree' || decor.type === 'plant') {
          item.onclick = (e) => handleTreeClick(e, decorId);
        } else if (decor.type === 'cottage') {
          item.onclick = (e) => {
            if (isDecorEditMode) return;
            e.stopPropagation();
            if (typeof showHouseWorkshopModal === 'function') {
              showHouseWorkshopModal();
            }
          };
        }
      }
    });
  }

  function renderContributionSummary() {
    const list = Object.values(state.contributions || {});
    const myId = state.user.id;
    const me = list.find(u => u.id === myId) || { totalZen: 0, todayZen: 0, name: state.user.name, avatar: state.user.avatar };
    const partners = list.filter(u => u.id !== myId);
    const partnerTotal = partners.reduce((sum, u) => sum + (u.totalZen || 0), 0);
    const myTotal = me.totalZen || 0;
    const combinedTotal = myTotal + partnerTotal;

    let myPct = 50;
    let partnerPct = 50;
    if (combinedTotal > 0) {
      myPct = Math.max(8, Math.min(92, Math.round((myTotal / combinedTotal) * 100)));
      partnerPct = 100 - myPct;
    } else if (myTotal > 0 && partnerTotal === 0) {
      myPct = 100; partnerPct = 0;
    } else if (myTotal === 0 && partnerTotal === 0) {
      myPct = 50; partnerPct = 50;
    }

    if ($('#contribMeBar')) $('#contribMeBar').style.width = `${myPct}%`;
    if ($('#contribPartnerBar')) $('#contribPartnerBar').style.width = `${partnerPct}%`;
    if ($('#contribMeLabel')) $('#contribMeLabel').textContent = `${escapeHTML(state.user.avatar || '🐢')} 我: ${format(myTotal)} (${myPct}%)`;

    const partnerAvatar = partners[0]?.avatar || '🌙';
    const partnerName = partners[0]?.name ? (partners[0].name.length > 4 ? partners[0].name.slice(0, 4) + '..' : partners[0].name) : '伙伴';
    if ($('#contribPartnerLabel')) {
      $('#contribPartnerLabel').textContent = `${escapeHTML(partnerAvatar)} ${escapeHTML(partnerName)}: ${format(partnerTotal)} (${partnerPct}%)`;
    }

    if ($('#contribRankSummary')) {
      if (partners.length === 0) {
        $('#contribRankSummary').textContent = '两人共修中';
      } else if (myTotal > partnerTotal) {
        $('#contribRankSummary').textContent = '我领先修行 🥇';
      } else if (myTotal < partnerTotal) {
        $('#contribRankSummary').textContent = '伙伴领先修行 🌟';
      } else {
        $('#contribRankSummary').textContent = '并驾齐驱 ☯';
      }
    }

    if ($('#channelAvatars')) {
      $('#channelAvatars').innerHTML = `<span>${escapeHTML(state.user.avatar || '🐢')}</span><span>${escapeHTML(partnerAvatar)}</span>`;
    }
  }

  function render() {
    renderPetCards();
    renderGarden();
    renderContributionSummary();
    const isDay = state.theme === 'day';
    if ($('#sanctuary')) $('#sanctuary').classList.toggle('theme-day', isDay);
    if ($('#themeBtn')) $('#themeBtn').innerHTML = isDay ? '🌙 夜晚' : '☀️ 白天';
    $('#zenPoints').textContent = format(state.zen);
    $('#widgetZen').textContent = format(state.zen);
    if ($('#widgetKeystrokes')) $('#widgetKeystrokes').textContent = format(state.keystrokes || 0);
    $('#dailyProgress').textContent = `${state.dailyCare} / 5`;
    $('#dailyBar').style.width = `${Math.min(state.dailyCare * 20, 100)}%`;
    $('#channelId').textContent = `频道 · ${state.channel}`;
    $('#widgetMood').textContent = state.pets.papa.happiness > 85 ? '满心欢喜' : '想被抱抱';
    $('#mailPreview').textContent = state.letters.length ? `收到 ${state.letters.length} 封湖畔来信` : '给远方的 TA 写一封信';
    $('#chest').classList.toggle('opened', state.chestOpened);
    $('#chest').title = state.chestOpened ? '今日宝箱已开启，明天再来吧' : '打开今日探索宝箱';
    renderQuest();
    renderFocus();
  }
  function renderQuest() {
    const kZen = state.keyboardZen ?? 0;
    const kMax = 30;
    if ($('#questText')) {
      $('#questText').textContent = state.keyboardClaimed ? '今日修行已完成' : `键盘禅意 ${kZen} / ${kMax}`;
    }
    if ($('#questBar')) {
      const pct = Math.min(100, Math.floor((kZen / kMax) * 100));
      $('#questBar').style.width = `${pct}%`;
    }
    if ($('#claimQuest')) {
      if (state.keyboardClaimed) {
        $('#claimQuest').disabled = true;
        $('#claimQuest').textContent = '已领取 80 ZEN';
      } else {
        const canClaim = kZen >= kMax;
        $('#claimQuest').disabled = !canClaim;
        $('#claimQuest').textContent = canClaim ? '领取 80 ZEN' : '未完成';
      }
    }
  }
  function renderFocus() {
    const totalSecs = state.focus.totalSeconds || 1500;
    const curSecs = typeof state.focus.seconds === 'number' ? state.focus.seconds : totalSecs;
    const min = Math.floor(curSecs / 60).toString().padStart(2, '0');
    const sec = (curSecs % 60).toString().padStart(2, '0');

    if ($('#focusTime')) $('#focusTime').textContent = `${min}:${sec}`;
    if ($('#focusBtn')) {
      $('#focusBtn').innerHTML = state.focus.running ? '暂停专注 <span>Ⅱ</span>' : `${curSecs === totalSecs ? '开始专注' : '继续专注'} <span>→</span>`;
    }
    if ($('#widgetTimerText')) $('#widgetTimerText').textContent = state.focus.running ? `${min}:${sec}` : '专注';

    const totalMins = Math.round(totalSecs / 60);
    $$('.focus-chip').forEach(chip => {
      chip.classList.toggle('active', Number(chip.dataset.mins) === totalMins);
    });
  }
  function showWidgetHeartEffect(petId) {
    const container = $('#widgetTurtles');
    if (!container) return;
    const turtle = $(`#widgetTurtles .turtle[data-pet="${petId}"]`);
    const left = turtle && turtle.style.left ? turtle.style.left : (petId === 'pumpkin' ? '70%' : '30%');

    const heart = document.createElement('div');
    heart.className = 'widget-pet-heart';
    heart.innerHTML = '💖 <i>+2 XP</i> <span>✦+1</span>';
    heart.style.left = left;
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 950);
  }

  function petCelebrate(petId) {
    const pet = state.pets[petId];
    if (!pet) return;
    state.selectedPet = petId; // 抚摸哪只即刻切换主力焦点
    pet.happiness = Math.min(100, pet.happiness + 4);
    pet.clean = Math.min(100, pet.clean + 2);

    // 庭院与任务栏挂件同时执行跳跃欢呼
    const turtles = $$(`.turtle[data-pet="${petId}"]`);
    turtles.forEach(turtle => {
      turtle.classList.remove('jump');
      void turtle.offsetWidth;
      turtle.classList.add('jump');
      setTimeout(() => turtle.classList.remove('jump'), 700);
    });

    showWidgetHeartEffect(petId);

    state.zen += 1;
    recordContribution(1, 'petCare');
    addPetXp(petId, 2, 'love'); // 专属抚摸奖励该小龟 +2 经验并弹出爱心经验图标

    persist();
    $('#zenPoints').textContent = format(state.zen);
    $('#widgetZen').textContent = format(state.zen);
    renderPetCards();
    renderContributionSummary();
    showZen(1);
    toast('♡ 抚摸小龟', `${pet.name} 开心雀跃，获得 2 经验与 1 禅意！`);
    sync();
  }

  function chestReward() {
    if (state.chestOpened) { toast('明日再会', '今日探索宝箱已经被你开启过了。'); return; }
    const reward = 15 + Math.floor(Math.random() * 15);
    state.chestOpened = true;
    state.zen += reward;
    recordContribution(reward, 'chestReward');

    // 宝箱奖励给两只小龟共同获得经验
    const petXpGained = Math.ceil(reward / 2);
    addPetXp('papa', petXpGained);
    addPetXp('pumpkin', petXpGained);

    $('#chest').classList.add('open');
    setTimeout(() => $('#chest').classList.remove('open'), 800);
    render();
    showZen(reward, 69, 60);
    toast('✦ 探险宝箱', `获得 ${reward} 禅意值，帕帕与小南瓜均获得 +${petXpGained} 经验！`);
    sync(true);
  }

  function harvestPlant() {
    if (state.garden.plantStage < 3 || state.garden.harvested) { toast('还差一点', '这棵南瓜树正在努力成长。'); return; }
    state.garden.harvested = true;
    state.zen += 20;
    state.dailyCare = Math.min(5, state.dailyCare + 1);
    recordContribution(20, 'treeHarvest');

    addPetXp('papa', 10);
    addPetXp('pumpkin', 10);

    render();
    showZen(20, 79, 67);
    toast('🍊 收获成功', '采下成熟果实，获得 20 禅意值，帕帕与小南瓜各得 +10 经验！');
    sync(true);
  }
  function getDefaultSpawnPos(type) {
    const isWaterItem = type === 'lily' || type === 'reeds';
    if (isWaterItem) {
      return { x: 16 + Math.floor(Math.random() * 24), y: 58 + Math.floor(Math.random() * 18) };
    } else {
      // Land items (cottage, tree, plant, seed, fountain, manhole, sewer) strictly on land (x >= 52)
      return { x: 58 + Math.floor(Math.random() * 24), y: 50 + Math.floor(Math.random() * 20) };
    }
  }

  function makeDraggable() {
    const stageEl = $('#gardenStage');
    const items = isDecorEditMode ? [...$$('.decor'), ...$$('.turtle')] : $$('.turtle');
    items.forEach(item => {
      let isDragging = false;
      let hasMoved = false;
      let pointerOffset = { x: 0, y: 0 };
      let startPos = { x: 0, y: 0 };

      const onPointerDown = (event) => {
        if (event.button !== 0) return;
        if (item.dataset.decor && !isDecorEditMode) return;
        event.stopPropagation();
        isDragging = true;
        hasMoved = false;
        startPos = { x: event.clientX, y: event.clientY };
        item.classList.add('dragging');
        try { item.setPointerCapture(event.pointerId); } catch { }

        const rect = item.getBoundingClientRect();
        pointerOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };

        if (item.dataset.pet) {
          const pet = state.pets[item.dataset.pet];
          if (pet) pet.isBeingDragged = true;
        }
      };

      const onPointerMove = (event) => {
        if (!isDragging) return;
        const dist = Math.hypot(event.clientX - startPos.x, event.clientY - startPos.y);
        if (dist > 4) hasMoved = true;

        const stage = stageEl.getBoundingClientRect();
        const rawX = ((event.clientX - pointerOffset.x - stage.left) / stage.width) * 100;
        const rawY = ((event.clientY - pointerOffset.y - stage.top) / stage.height) * 100;
        const y = Math.max(10, Math.min(82, rawY));

        let x = Math.max(2, Math.min(92, rawX));
        if (item.dataset.decor) {
          const decor = state.garden.decorations.find(d => d.id === item.dataset.decor);
          if (decor) {
            const isStrictWaterOnly = decor.type === 'lily' || decor.type === 'reeds';
            if (isStrictWaterOnly) {
              x = Math.max(52, Math.min(90, rawX));
            } else if (decor.type === 'cottage') {
              x = Math.max(2, Math.min(68, rawX));
            } else {
              x = Math.max(3, Math.min(92, rawX));
            }
          }
        }

        item.style.left = `${x}%`;
        item.style.top = `${y}%`;

        if (item.dataset.pet) {
          const pet = state.pets[item.dataset.pet];
          if (pet) {
            if (rawX > pet.x + 0.3) pet.dir = 1;
            else if (rawX < pet.x - 0.3) pet.dir = -1;
            item.dataset.dir = pet.dir;
            item.classList.toggle('face-left', pet.dir === -1);
            item.classList.toggle('face-right', pet.dir === 1);
            pet.x = x;
            pet.y = y;
            const isWater = x > 50;
            item.classList.toggle('swimming', isWater);
            item.classList.toggle('walking', !isWater);
            const spriteEl = $('.turtle-sprite', item);
            if (spriteEl) {
              spriteEl.style.transform = pet.dir === 1 ? 'scaleX(-1)' : 'scaleX(1)';
            }
          }
        }
      };

      const onPointerUp = (event) => {
        if (!isDragging) return;
        isDragging = false;
        item.classList.remove('dragging');
        try { item.releasePointerCapture(event.pointerId); } catch { }

        const stage = stageEl.getBoundingClientRect();
        const rect = item.getBoundingClientRect();
        const rawX = ((rect.left - stage.left) / stage.width) * 100;
        const finalY = Math.max(10, Math.min(82, ((rect.top - stage.top) / stage.height) * 100));

        if (item.dataset.decor) {
          const decor = state.garden.decorations.find(d => d.id === item.dataset.decor);
          if (decor) {
            const isStrictWaterOnly = decor.type === 'lily' || decor.type === 'reeds';
            const finalX = isStrictWaterOnly ? Math.max(52, Math.min(90, rawX)) : Math.max(3, Math.min(92, rawX));
            decor.x = finalX;
            decor.y = finalY;
            item.style.left = `${finalX}%`;
            item.style.top = `${finalY}%`;
          }
          sync();
          setSyncText('庭院布局已更新');
        } else if (item.dataset.pet) {
          const pet = state.pets[item.dataset.pet];
          if (pet) {
            const finalX = Math.max(2, Math.min(90, rawX));
            const wasInWater = pet.isInWater || false;
            const nowInWater = finalX > 50;
            pet.isInWater = nowInWater;
            pet.x = finalX;
            pet.y = finalY;
            pet.isBeingDragged = false;
            pet.aiState = 'idle';
            pet.idleTimer = 30;

            if (nowInWater) {
              item.classList.add('enter-water');
              setTimeout(() => item.classList.remove('enter-water'), 650);
              toast('🌊 扑通入水', `${pet.name} 欢快地落入月光池塘。`);
              lakeRipple({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, target: stageEl });
            } else {
              if (wasInWater) {
                item.classList.add('exit-water');
                setTimeout(() => item.classList.remove('exit-water'), 650);
              }
              toast('♧ 漫步草坪', `${pet.name} 踩在了晨露草坪上。`);
            }
          }
          if (!hasMoved) petCelebrate(item.dataset.pet); else sync();
        }
      };

      item.onpointerdown = onPointerDown;
      item.onpointermove = onPointerMove;
      item.onpointerup = onPointerUp;
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  let wingMode = urlParams.get('wing') || 'unified'; // 'left' | 'right' | 'unified'

  function initTurtleAI() {
    Object.values(state.pets).forEach((pet, index) => {
      if (typeof pet.x !== 'number') pet.x = index === 0 ? 20 : 34;
      if (typeof pet.y !== 'number') pet.y = index === 0 ? 65 : 62;
      pet.targetX = pet.x;
      pet.targetY = pet.y;
      pet.dir = typeof pet.dir === 'number' ? pet.dir : (index === 0 ? 1 : -1);
      pet.aiState = 'idle';
      pet.isInWater = pet.x > 50;
      pet.idleTimer = 15 + Math.floor(Math.random() * 30);

      // 任务栏专属水道巡游坐标（范围 6% ~ 92%）
      pet.widgetX = index === 0 ? 18 : 78;
      pet.widgetTargetX = index === 0 ? (75 + Math.random() * 15) : (10 + Math.random() * 15);
      pet.widgetDir = index === 0 ? 1 : -1;
      pet.widgetTimer = 40 + Math.floor(Math.random() * 50);
      pet.isDiving = false;
    });

    setInterval(() => {
      Object.values(state.pets).forEach(pet => {
        // 1. 庭院主舞台 AI 巡逻
        if (!pet.isBeingDragged) {
          const turtleEl = $(`.garden-stage .turtle[data-pet="${pet.id}"]`);
          if (turtleEl) {
            if (pet.aiState === 'idle') {
              pet.idleTimer -= 1;
              if (pet.idleTimer <= 0) {
                let minX = 6, maxX = 46;
                if (currentHabitatFilter === 'pond') { minX = 54; maxX = 88; }
                else if (currentHabitatFilter === 'land') { minX = 6; maxX = 46; }
                else {
                  const goPond = Math.random() < 0.2;
                  minX = goPond ? 54 : 6;
                  maxX = goPond ? 88 : 46;
                }

                pet.targetX = minX + Math.random() * (maxX - minX);
                pet.targetY = 50 + Math.random() * 26;
                pet.dir = pet.targetX >= pet.x ? 1 : -1;
                pet.aiState = 'moving';
              }
            } else if (pet.aiState === 'moving') {
              const dx = pet.targetX - pet.x;
              const dy = pet.targetY - pet.y;
              const dist = Math.hypot(dx, dy);

              const wasInWater = pet.isInWater || false;
              const isPond = pet.x > 50;
              const speed = isPond ? 0.18 : 0.12;

              if (dist < 1.2) {
                pet.x = pet.targetX;
                pet.y = pet.targetY;
                pet.aiState = 'idle';
                pet.idleTimer = 40 + Math.floor(Math.random() * 80);
              } else {
                pet.x += (dx / dist) * speed;
                pet.y += (dy / dist) * speed;
                if (Math.abs(dx) > 0.05) {
                  pet.dir = dx >= 0 ? 1 : -1;
                }
              }

              const nowInWater = pet.x > 50;
              pet.isInWater = nowInWater;

              if (!wasInWater && nowInWater) {
                turtleEl.classList.add('enter-water');
                setTimeout(() => turtleEl.classList.remove('enter-water'), 650);
                toast('🌊 扑通入水', `${pet.name} 扑通一声欢快地游进池塘。`);
              } else if (wasInWater && !nowInWater) {
                turtleEl.classList.add('exit-water');
                setTimeout(() => turtleEl.classList.remove('exit-water'), 650);
                toast('♧ 爬上草坪', `${pet.name} 抖抖身上水珠，爬回露水草坪。`);
              }

              turtleEl.style.left = `${pet.x}%`;
              turtleEl.style.top = `${pet.y}%`;
              turtleEl.dataset.dir = pet.dir;
              turtleEl.classList.toggle('face-left', pet.dir === -1);
              turtleEl.classList.toggle('face-right', pet.dir === 1);
              turtleEl.classList.toggle('swimming', nowInWater);
              turtleEl.classList.toggle('walking', !nowInWater);
              const spriteEl = $('.turtle-sprite', turtleEl);
              if (spriteEl) {
                spriteEl.style.transform = pet.dir === 1 ? 'scaleX(-1)' : 'scaleX(1)';
              }
            }
          }
        }

        // 2. 任务栏自由往返游弋 AI（各自区域内自由往返，无需左右穿梭）
        const wEl = $(`#widgetTurtles .turtle[data-pet="${pet.id}"]`);
        if (wEl && wEl.style.display !== 'none') {
          if (typeof pet.widgetX !== 'number') pet.widgetX = (pet.id === 'papa' ? 18 : 78);
          if (typeof pet.widgetTargetX !== 'number') pet.widgetTargetX = (pet.widgetX < 50 ? 86 : 12);
          if (typeof pet.widgetDir !== 'number') pet.widgetDir = (pet.widgetTargetX >= pet.widgetX ? 1 : -1);

          pet.widgetTimer = (pet.widgetTimer || 20) - 1;

          // 到达边界或定时刷新方向
          if (pet.widgetX <= 7) {
            pet.widgetDir = 1;
            pet.widgetTargetX = 76 + Math.random() * 16;
            pet.widgetTimer = 60 + Math.floor(Math.random() * 60);
          } else if (pet.widgetX >= 91) {
            pet.widgetDir = -1;
            pet.widgetTargetX = 8 + Math.random() * 16;
            pet.widgetTimer = 60 + Math.floor(Math.random() * 60);
          } else if (pet.widgetTimer <= 0) {
            // 定时切换往返目标
            pet.widgetDir = pet.widgetDir === 1 ? -1 : 1;
            pet.widgetTargetX = pet.widgetDir === 1 ? (76 + Math.random() * 16) : (8 + Math.random() * 16);
            pet.widgetTimer = 80 + Math.floor(Math.random() * 80);
          }

          const wDist = pet.widgetTargetX - pet.widgetX;
          if (Math.abs(wDist) > 0.3) {
            const wSpeed = 0.24 + (pet.id === 'pumpkin' ? 0.04 : 0); // 悠闲轻快的往返游速
            pet.widgetX += Math.sign(wDist) * Math.min(Math.abs(wDist), wSpeed);
            pet.widgetDir = Math.sign(wDist);
          } else {
            // 到达一侧目标点，掉头游往对侧
            pet.widgetDir = pet.widgetX < 50 ? 1 : -1;
            pet.widgetTargetX = pet.widgetDir === 1 ? (76 + Math.random() * 16) : (8 + Math.random() * 16);
            pet.widgetTimer = 50 + Math.floor(Math.random() * 60);
          }

          // 始终保持在 6% ~ 92% 安全水域内
          pet.widgetX = Math.max(6, Math.min(92, pet.widgetX));

          wEl.style.left = `${pet.widgetX}%`;
          wEl.dataset.dir = pet.widgetDir;
          wEl.classList.toggle('face-left', pet.widgetDir === -1);
          wEl.classList.toggle('face-right', pet.widgetDir === 1);
          wEl.classList.add('swimming');
          wEl.classList.remove('walking', 'diving', 'surfacing');
          const wSprite = $('.turtle-sprite', wEl);
          if (wSprite) {
            wSprite.style.transform = pet.widgetDir === 1 ? 'scaleX(-1)' : 'scaleX(1)';
          }
        }
      });
    }, 50);
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
  let lastDomKeyTime = 0;

  function registerKeystroke(fromGlobal = false) {
    const now = Date.now();
    if (fromGlobal && (now - lastDomKeyTime < 40)) return;
    if (!fromGlobal) lastDomKeyTime = now;

    // 1. 统一登记击键次数（状态 + 贡献榜 details.keystrokes 一同增加）
    recordKeystroke(1);
    if ($('#widgetKeystrokes')) $('#widgetKeystrokes').textContent = format(state.keystrokes || 0);
    createSparkles();

    // 2. 每日键盘修行任务进度（0~30）
    if ((state.keyboardZen ?? 0) < 30) {
      state.keyboardZen = Math.min(30, (state.keyboardZen ?? 0) + 1);
      renderQuest();
    }

    // 3. 每敲击 10 次键盘，增加 1 禅意与双宠经验，并上报贡献
    if (state.keystrokes % 10 === 0) {
      gainZen(1, '键盘敲出一小片宁静', 'keyboardZen');
      const turtle = $(`.garden-stage .turtle[data-pet="${state.selectedPet}"]`);
      turtle?.classList.add('jump');
      setTimeout(() => turtle?.classList.remove('jump'), 700);
      window.sanctuaryDesktop?.sendSyncState({ zen: state.zen, keystrokes: state.keystrokes });
    }
  }

  function keyboardReward(event) {
    if (event.altKey && (event.key === 'w' || event.key === 'W')) {
      event.preventDefault();
      if (window.sanctuaryDesktop?.toggleBossKey) {
        window.sanctuaryDesktop.toggleBossKey();
      }
      return;
    }

    const isInput = event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable);
    if (isInput) {
      registerKeystroke(false);
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    // 当焦点不在输入框时按下空格或回车，阻止浏览器默认模拟点击已聚焦的按钮/卡片（杜绝空格触发抚摸）
    if (event.key === ' ' || event.code === 'Space' || event.key === 'Enter') {
      event.preventDefault();
      if (document.activeElement && document.activeElement !== document.body && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }

    registerKeystroke(false);
  }
  function showBubble() {
    const [title, body] = bubbleMessages[Math.floor(Math.random() * bubbleMessages.length)];
    $('#bubbleTitle').textContent = title; $('#bubbleBody').textContent = body; $('#bubbleNote').classList.add('show');
    clearTimeout(showBubble.timeout); showBubble.timeout = setTimeout(() => $('#bubbleNote').classList.remove('show'), 7000);
  }
  function createCelebrationSparkles() {
    const layer = $('#typingSparkles');
    if (!layer) return;
    for (let index = 0; index < 24; index++) {
      const spark = document.createElement('i');
      spark.className = 'spark';
      spark.textContent = index % 3 === 0 ? '💖' : index % 3 === 1 ? '✨' : '🍊';
      spark.style.left = `${15 + Math.random() * 70}%`;
      spark.style.top = `${30 + Math.random() * 45}%`;
      spark.style.setProperty('--x', `${(Math.random() - .5) * 120}px`);
      spark.style.setProperty('--y', `${-30 - Math.random() * 60}px`);
      spark.style.fontSize = `${14 + Math.random() * 8}px`;
      layer.append(spark);
      setTimeout(() => spark.remove(), 1200);
    }
  }

