/* ==========================================================================
   帕帕 · 小南瓜 | 游艺街机阁 — 《灵犀海龟汤 · 迷雾探案》核心引擎 (Turtle Soup Engine)
   严谨智能主持人判定引擎、海量精选题库、事实图谱关键线索树与沉浸式推理复盘
   ========================================================================== */

const TurtleSoupGame = (() => {
  let container = null;
  let currentSoupIdx = 0;
  let activeSoup = null;
  let questionCount = 0;
  let chatHistory = [];
  let isGameOver = false;

  // -------------------------------------------------------------------------
  // 1. 精选高品质海龟汤题库 (丰富题材 + 事实图谱多维词库)
  // -------------------------------------------------------------------------
  const SOUP_DATABASE = [
    {
      id: 'soup_01',
      title: '《海龟汤的原点》',
      category: '经典悬疑',
      tag: '🔥 殿堂级经典',
      difficulty: '⭐⭐⭐',
      surface: '一个男人走进海滨餐厅点了一碗海龟汤。他只喝了一小勺，便痛哭失声，随即走出餐厅自杀身亡。为什么？',
      truth: '男人在数年前曾与同伴遭遇特大海难，漂流在荒岛上濒临饿死。为了让他活下去，同伴用遇难同伴的人肉熬成汤骗他是“海龟肉”。男人靠这碗汤挺到了获救。\n\n多年后，他走进餐厅喝到了真正的海龟汤，发现味道与当年完全不同，刹那间明白当年吃下的竟是至亲同伴的肉，崩溃绝望之下选择了自尽。',
      clueNodes: [
        { id: 'c1', title: '曾经经历过海难荒岛', matchKeywords: ['海难', '遇难', '翻船', '沉船', '海难事故', '荒岛', '被困', '求生', '漂流'], hint: '男人过去曾经历过一场九死一生的极端灾难。', unlocked: false },
        { id: 'c2', title: '以前喝过假的海龟汤', matchKeywords: ['以前喝过', '曾经喝过', '喝过', '第一次喝', '不是第一次', '不是海龟', '假海龟', '味道不一样', '味道不同'], hint: '这不是他记忆中“第一次”喝海龟汤的味道。', unlocked: false },
        { id: 'c3', title: '当年吃的其实是人肉', matchKeywords: ['人肉', '同伴的肉', '吃了人', '同伴死', '吃人', '同伴牺牲', '朋友的肉', '同伴被吃'], hint: '当年的同伴为了让他活命，编造了善意却残酷的谎言。', unlocked: false },
        { id: 'c4', title: '自杀是由于极度愧疚绝望', matchKeywords: ['愧疚', '自责', '受不了', '崩溃', '良心', '得知真相', '发现真相'], hint: '真相揭开的瞬间，他的世界观与道德防线彻底瓦解。', unlocked: false }
      ],
      yesKeywords: [
        '海难', '荒岛', '海', '水手', '船员', '同伴', '骗', '谎言', '味道不同', '味道不一样',
        '自责', '愧疚', '人肉', '吃人', '以前喝过', '救他', '牺牲', '崩溃', '回忆'
      ],
      noKeywords: [
        '毒', '有毒', '下毒', '过敏', '难喝', '老板是凶手', '餐厅有仇', '海龟成精', '价格贵',
        '妻子出轨', '精神病', '谋杀', '被逼自杀', '生病', '绝症', '抢劫', '海龟死了'
      ],
      irrelevantKeywords: [
        '天气', '星期几', '衣服颜色', '服务员态度', '餐厅名字', '几点钟', '白天还是晚上', '年龄', '长相'
      ],
      suggestedInquiries: [
        '男人以前喝过海龟汤吗？',
        '他自杀是因为这碗汤有毒吗？',
        '他过去经历过严重的事故吗？',
        '当年同伴对他隐瞒了什么吗？',
        '他在荒岛上吃下的食物是真正的海龟吗？'
      ],
      hints: [
        '提示 1：关注他过去在海上的生存经历。',
        '提示 2：这碗海龟汤本身没有任何问题，问题出在他记忆里的味道。',
        '提示 3：荒岛求生时，在没有食物的绝境下，他赖以生存的肉究竟来自哪里？'
      ]
    },

    {
      id: 'soup_02',
      title: '《深夜的盲音》',
      category: '脑洞推理',
      tag: '💡 拍案叫绝',
      difficulty: '⭐⭐',
      surface: '男人深夜在旅馆被隔壁传来的规律敲击声吵醒。他拿起电话拨打了一个号码，电话接通后他一言不发便挂断，随后心满意足地安心入睡。为什么？',
      truth: '隔壁房间的旅客正在雷鸣般地大声打呼噜，震动穿透墙壁像有规律的敲击声，吵得男人无法入睡。\n\n男人通过旅馆总机拨打了隔壁房间的客房电话。电话铃声响了之后，隔壁旅客被吵醒伸手接听，呼噜声自然停止。男人趁对方被吵醒、呼噜声停歇的空档迅速入睡。',
      clueNodes: [
        { id: 'c1', title: '声音来自隔壁旅客打呼噜', matchKeywords: ['呼噜', '打呼', '打鼾', '呼噜声', '鼾声', '睡觉声音'], hint: '隔壁发出的声音其实是一种常见的人体生理现象。', unlocked: false },
        { id: 'c2', title: '拨打的是隔壁房间的电话', matchKeywords: ['隔壁电话', '打给隔壁', '房间电话', '隔壁房', '邻居电话', '客房电话'], hint: '男人拨打的号码距离他非常近。', unlocked: false },
        { id: 'c3', title: '电话铃声把隔壁吵醒了', matchKeywords: ['吵醒', '把对方叫醒', '弄醒', '醒了', '打断', '停下'], hint: '接通电话的动作直接打断了隔壁的声音来源。', unlocked: false },
        { id: 'c4', title: '目的纯粹为了睡觉', matchKeywords: ['为了睡觉', '为了睡着', '想睡觉', '安静', '睡不着'], hint: '男人的动机没有任何恶意或犯罪企图。', unlocked: false }
      ],
      yesKeywords: [
        '打呼噜', '呼噜', '打鼾', '隔壁', '邻居', '客房', '吵醒', '弄醒', '铃声',
        '为了睡觉', '睡不着', '安静', '旅馆', '住客', '生理', '噪音'
      ],
      noKeywords: [
        '凶杀', '犯罪', '暗号', '密码', '闹鬼', '偷听', '出轨', '跟踪', '威胁',
        '敲门', '报警', '前台', '服务员', '电话诈骗', '黑客'
      ],
      irrelevantKeywords: [
        '手机牌子', '男人名字', '电话费', '旅馆星级', '天气', '房间号是单数还是双数'
      ],
      suggestedInquiries: [
        '隔壁发出的声音是人为故意敲击的吗？',
        '男人拨打的电话是打给隔壁房间的吗？',
        '这通电话的目的是为了让声音停下来吗？',
        '隔壁的人是在睡觉吗？'
      ],
      hints: [
        '提示 1：那规律的“敲击声”并不是工具敲打发出的，而是一种熟睡时的声音。',
        '提示 2：男人不需要说话，他需要的只是让电话铃声响起来。'
      ]
    },

    {
      id: 'soup_03',
      title: '《没有脚印的雪地》',
      category: '逻辑密室',
      tag: '🔍 密室反转',
      difficulty: '⭐⭐⭐',
      surface: '广袤的雪地中央躺着一具男人的尸体。周围白雪皑皑，没有任何人的脚印、车辙或拖拽痕迹。法医鉴定死者死因为严重全身骨折与撞击身亡。他是怎么死的？',
      truth: '死者是一名高空跳伞运动员。在跳伞过程中主降落伞与备用伞均发生故障未能打开，他从数千米高空直接高速坠落到雪地中央坠亡，因此地面上没有任何走动过来的痕迹。',
      clueNodes: [
        { id: 'c1', title: '死者是从天上掉下来的', matchKeywords: ['空中', '天上', '高空', '掉下来', '坠落', '摔下来', '飞机', '空难'], hint: '死者来到雪地中央的方式并非来自陆地。', unlocked: false },
        { id: 'c2', title: '身份是跳伞员/飞行员', matchKeywords: ['跳伞', '降落伞', '跳伞员', '飞行员', '极限运动'], hint: '死者生前正在进行一项高空运动。', unlocked: false },
        { id: 'c3', title: '降落伞故障未能打开', matchKeywords: ['降落伞坏了', '伞没开', '降落伞没打开', '故障', '伞包'], hint: '保护他生命的装备在最后关头失效了。', unlocked: false }
      ],
      yesKeywords: [
        '跳伞', '高空', '坠落', '摔死', '飞机', '降落伞', '天上', '飞行', '故障', '从天而降', '运动'
      ],
      noKeywords: [
        '谋杀', '下雪盖住脚印', '融化', '雪崩', '被抛尸', '热气球', '外星人', '瞬移', '自杀', '投毒'
      ],
      irrelevantKeywords: [
        '雪有多厚', '气温是多少度', '死者穿什么颜色衣服', '几月份'
      ],
      suggestedInquiries: [
        '死者是从空中坠落的吗？',
        '脚印是被后来下的大雪覆盖了吗？',
        '死者身上携带着降落伞包吗？',
        '这是一起意外事故吗？'
      ],
      hints: [
        '提示 1：不要局限在地面二维空间思考，抬头看看天空。',
        '提示 2：死者身亡前所处的垂直高度远高于地面。'
      ]
    },

    {
      id: 'soup_04',
      title: '《熄灭的灯塔》',
      category: '悬疑悲剧',
      tag: '⚓ 命运悲歌',
      difficulty: '⭐⭐⭐⭐',
      surface: '一位孤独的守塔人在早晨看了当天的报纸头条后，脸色煞白。他缓缓走上楼顶关掉了灯塔的电灯，随后纵身跳下了万丈悬崖。为什么？',
      truth: '昨夜守塔人因为喝醉酒，在深夜误将指引航道方向的灯塔总电源关闭了。这直接导致一艘满载旅客的远洋客轮在暴风雨中迷失航向，触礁沉没、数百人丧生。\n\n早晨守塔人看到报纸头条的新闻惨案，才猛然意识到正是自己昨夜的失职酿成了人间地狱。无尽的愧疚与绝望让他选择了跳崖谢罪。',
      clueNodes: [
        { id: 'c1', title: '昨夜灯塔被守塔人误关了', matchKeywords: ['昨晚关灯', '误关', '喝醉', '睡着关了', '灯塔熄灭', '没开灯'], hint: '昨夜值班期间发生了一起致命的工作失误。', unlocked: false },
        { id: 'c2', title: '导致了严重的客轮触礁沉船惨剧', matchKeywords: ['沉船', '撞船', '触礁', '翻船', '客轮', '很多人死', '海难', '伤亡'], hint: '报纸头条报道的是一起与海上航行直接相关的特大灾难。', unlocked: false },
        { id: 'c3', title: '自杀是由于极度内疚与赎罪', matchKeywords: ['内疚', '自责', '谢罪', '赎罪', '受不了良心', '得知惨剧'], hint: '他无法面对因自己的疏忽造成的巨大伤亡。', unlocked: false }
      ],
      yesKeywords: [
        '关灯', '沉船', '触礁', '海难', '喝醉', '失职', '疏忽', '报纸', '内疚', '自责',
        '客轮', '船只', '航标', '方向', '赎罪'
      ],
      noKeywords: [
        '谋杀', '被威胁', '妻子去世', '鬼魂', '灯塔倒塌', '失业', '战争爆发', '外星人', '绝症'
      ],
      irrelevantKeywords: [
        '灯塔高度', '守塔人名字', '天气', '报纸价格', '几点钟跳崖'
      ],
      suggestedInquiries: [
        '报纸上报道的新闻与他有直接关系吗？',
        '昨夜有船只因为没有灯光而失事吗？',
        '他在昨夜值班时擅自离岗或关灯了吗？',
        '他跳崖是因为强烈的愧疚感吗？'
      ],
      hints: [
        '提示 1：灯塔的使命是为黑夜中的船只指引安全航道。',
        '提示 2：昨夜的灯塔并没有履行它的使命。'
      ]
    },

    {
      id: 'soup_05',
      title: '《湖畔的草帽》',
      category: '温馨治愈',
      tag: '🐢 湖畔专属',
      difficulty: '⭐',
      surface: '烈日炎炎的湖边有一顶湿透的漂亮草帽。乌龟帕帕和小南瓜看到草帽后，相视一笑，心满意足地在树荫下乘凉。为什么？',
      truth: '正午骄阳似火，一阵调皮的夏风将小南瓜心爱的草帽吹落到了湖中心。小南瓜在岸边急得团团转。\n\n水性极佳的乌龟帕帕立刻跃入清凉的圣泉湖水中，将草帽顶在龟壳上稳稳游回岸边。虽然草帽湿透了，但在炎炎夏日戴着湿漉漉的草帽反而格外凉爽解暑！伙伴们齐心协力解决了问题，开心地在树荫下避暑乘凉。',
      clueNodes: [
        { id: 'c1', title: '草帽原本是被风吹进湖里的', matchKeywords: ['被风吹', '掉进湖', '掉水里', '吹走', '掉落'], hint: '草帽之所以会变湿，是因为一次意外的落水。', unlocked: false },
        { id: 'c2', title: '乌龟帕帕下水打捞了上来', matchKeywords: ['帕帕捞的', '乌龟捞的', '游过去', '游水', '打捞', '救上来'], hint: '湖畔圣域里水性最好的居民出手相助了。', unlocked: false },
        { id: 'c3', title: '湿草帽在酷暑中意外地非常凉快解暑', matchKeywords: ['凉快', '解暑', '降温', '防暑', '很凉爽', '避暑'], hint: '湿透的草帽在这个炎热的季节带来了意想不到的舒适。', unlocked: false }
      ],
      yesKeywords: [
        '风吹', '掉水里', '帕帕游泳', '捞上来', '凉快', '解暑', '夏天', '热', '防晒', '遮阳', '友情', '帮忙'
      ],
      noKeywords: [
        '死人', '凶杀', '沉尸', '丢弃', '毒药', '吵架', '偷窃', '灵异'
      ],
      irrelevantKeywords: [
        '草帽什么颜色', '湖有多深', '树是什么树'
      ],
      suggestedInquiries: [
        '草帽是小南瓜不小心掉进湖里的吗？',
        '是乌龟帕帕游进水里帮它捡回来的吗？',
        '湿透的草帽能起到更好的防暑降温效果吗？'
      ],
      hints: [
        '提示 1：这是一个发生在湖畔圣域夏天的温馨故事。',
        '提示 2：湿漉漉的草帽戴在头上，在烈日下会有怎样的奇妙感觉？'
      ]
    },

    {
      id: 'soup_06',
      title: '《关灯的瞬间》',
      category: '微恐反转',
      tag: '👁️ 细思极恐',
      difficulty: '⭐⭐⭐',
      surface: '男人回到自己的单身公寓，像往常一样关掉房间的吊灯准备睡觉。但在关灯的瞬间，他看了一眼天花板，随后尖叫着夺门而逃。为什么？',
      truth: '关上电灯后，黑暗的房间里天花板上突然浮现出一行用夜光荧光颜料写下的字：“我就在你的床底下看着你”。\n\n男人是一个人独居，白天出门前天花板完全是空白的。字迹是在他离开期间有人潜入房间写下的，意味着此刻凶手极可能就躲在床下！惊恐万状的男人立刻逃出了房间。',
      clueNodes: [
        { id: 'c1', title: '天花板上有夜光字迹', matchKeywords: ['夜光', '荧光', '发光', '字', '写了字', '留了话'], hint: '关灯后才能看见天花板上的特殊物质。', unlocked: false },
        { id: 'c2', title: '有人趁他不在潜入了房间', matchKeywords: ['有人进过', '潜入', '进小偷', '凶手', '有人来过', '陌生人'], hint: '这间本该属于他一个人的房间被不速之客入侵了。', unlocked: false },
        { id: 'c3', title: '字迹提示有人正藏在床底', matchKeywords: ['床底', '躲在床下', '藏在房间', '床下有人', '正在看着他'], hint: '字迹上的内容预示着危险就在他身旁咫尺之间。', unlocked: false }
      ],
      yesKeywords: [
        '夜光', '荧光', '字', '潜入', '床底', '陌生人', '凶手', '有人', '害怕', '危险', '关灯才看见'
      ],
      noKeywords: [
        '虫子', '蜘蛛', '幻觉', '做梦', '漏水', '天花板塌了', '妻子', '朋友恶作剧', '停电'
      ],
      irrelevantKeywords: [
        '几点回家', '穿什么鞋', '公寓楼层'
      ],
      suggestedInquiries: [
        '天花板上的东西只有在关灯后才能看到吗？',
        '是有人偷偷潜入了男人的单身公寓吗？',
        '天花板上的字迹内容威胁到了他的生命安全吗？'
      ],
      hints: [
        '提示 1：有一种颜料在开灯时是透明看不见的，只有在黑暗中才会发光。',
        '提示 2：男人是一个人住，那么这行刚写不久的字是谁留下的？'
      ]
    }
  ];

  // -------------------------------------------------------------------------
  // 2. 核心初始化与渲染
  // -------------------------------------------------------------------------
  function init(containerEl, mode = 'solo', role = 1) {
    container = containerEl;
    currentSoupIdx = 0;
    activeSoup = JSON.parse(JSON.stringify(SOUP_DATABASE[0]));
    questionCount = 0;
    chatHistory = [];
    isGameOver = false;

    renderSoupLobby();
  }

  function renderSoupLobby() {
    if (!container) return;

    container.innerHTML = `
      <div class="soup-arena-wrapper">
        <div class="soup-top-header">
          <div class="soup-title-box">
            <span class="soup-tag-badge">${activeSoup.category}</span>
            <h3 id="soupStoryTitle">${activeSoup.title}</h3>
          </div>
          <div class="soup-progress-box">
            <span class="soup-progress-text">线索探明:</span>
            <div class="soup-progress-track">
              <div class="soup-progress-fill" id="soupProgressFill" style="width: 0%;"></div>
            </div>
            <b class="soup-progress-text" id="soupProgressText">0%</b>
          </div>
        </div>

        <!-- 汤面故事置顶卡片 -->
        <div class="soup-surface-card">
          <div class="soup-surface-label">
            <span>🍲 【汤面 · 悬疑谜题】</span>
            <small style="color: #94a3b8; font-weight: normal; margin-left: auto;">剧本难度: ${activeSoup.difficulty}</small>
          </div>
          <div class="soup-surface-text">${activeSoup.surface}</div>
        </div>

        <!-- 对话聊天流 -->
        <div class="soup-chat-stream" id="soupChatStream"></div>

        <!-- 灵感探针快捷建议栏 -->
        <div class="soup-suggest-bar" id="soupSuggestBar"></div>

        <!-- 底部输入与操作栏 -->
        <div class="soup-input-bar">
          <input type="text" class="soup-text-input" id="soupQueryInput" placeholder="向帕帕主持人自由提问（支持自然语言推断，例如：死因是意外吗？）..." maxlength="80" />
          <button class="soup-send-btn" id="soupSendBtn">提问</button>
          <button class="soup-action-btn" id="soupHintBtn" title="获取主持人灵感锦囊">💡 锦囊</button>
          <button class="soup-action-btn solve" id="soupSolveBtn" title="提交最终推理并揭开汤底">🎯 揭晓汤底</button>
        </div>
      </div>
    `;

    // 初始欢迎消息
    appendHostMessage(
      `欢迎来到灵犀海龟汤！我是你的主持人 <b>🐢 帕帕</b>。<br>` +
      `请仔细阅读上方的【汤面】，向我提出你的疑问。我会如实回答：<b>【是】</b>、<b>【不是】</b>、<b>【是也不是 / 与此无关】</b>，如果你触碰到了核心真相，我会给出<b>【🌟 关键线索】</b>！`
    );

    renderSuggestedChips();
    bindEvents();
  }

  function bindEvents() {
    const input = document.getElementById('soupQueryInput');
    const sendBtn = document.getElementById('soupSendBtn');
    const hintBtn = document.getElementById('soupHintBtn');
    const solveBtn = document.getElementById('soupSolveBtn');

    if (sendBtn && input) {
      sendBtn.onclick = handleUserSubmit;
      input.onkeydown = (e) => {
        if (e.key === 'Enter') handleUserSubmit();
      };
    }

    if (hintBtn) {
      hintBtn.onclick = handleUseHint;
    }

    if (solveBtn) {
      solveBtn.onclick = handleSolveAndReveal;
    }
  }

  function renderSuggestedChips() {
    const bar = document.getElementById('soupSuggestBar');
    if (!bar || !activeSoup) return;
    bar.innerHTML = '';

    activeSoup.suggestedInquiries.forEach(q => {
      const chip = document.createElement('div');
      chip.className = 'soup-suggest-chip';
      chip.textContent = `💬 ${q}`;
      chip.onclick = () => {
        const input = document.getElementById('soupQueryInput');
        if (input) {
          input.value = q;
          handleUserSubmit();
        }
      };
      bar.appendChild(chip);
    });
  }

  // -------------------------------------------------------------------------
  // 3. 智能问答精准判定引擎 (Accurate Semantic Evaluator)
  // -------------------------------------------------------------------------
  function handleUserSubmit() {
    const input = document.getElementById('soupQueryInput');
    if (!input || !activeSoup || isGameOver) return;
    const query = input.value.trim();
    if (!query) return;

    input.value = '';
    questionCount++;

    // 1. 添加用户消息到气泡流
    appendUserMessage(query);

    // 2. 智能评估器分析
    setTimeout(() => {
      const result = evaluateUserQuestion(activeSoup, query);
      appendHostVerdict(result, query);
      updateProgress();
    }, 280);
  }

  function evaluateUserQuestion(soup, userQuery) {
    const q = userQuery.toLowerCase().replace(/[？?。！!,，\s]/g, '');

    // ① 优先比对未解锁的关键线索节点 (Crucial Clues)
    for (let clue of soup.clueNodes) {
      if (!clue.unlocked) {
        const isMatch = clue.matchKeywords.some(kw => q.includes(kw.toLowerCase()));
        if (isMatch) {
          clue.unlocked = true;
          return {
            verdict: 'clue',
            badgeText: '🌟 关键线索！',
            text: `你触碰到了案件核心！<b>${clue.title}</b>。<br><span style="color:#fde047;">线索揭示：${clue.hint}</span>`,
            clueTitle: clue.title
          };
        }
      }
    }

    // ② 比对肯定词库 (YES)
    const hitYes = soup.yesKeywords.some(kw => q.includes(kw.toLowerCase()));
    if (hitYes) {
      return {
        verdict: 'yes',
        badgeText: '🟢 是 (YES)',
        text: '是的，你的推测完全符合事实真相！'
      };
    }

    // ③ 比对否定词库 (NO)
    const hitNo = soup.noKeywords.some(kw => q.includes(kw.toLowerCase()));
    if (hitNo) {
      return {
        verdict: 'no',
        badgeText: '🔴 不是 (NO)',
        text: '不是，案情发展的方向并不是这样。'
      };
    }

    // ④ 比对无关词库或兜底判断 (IRRELEVANT / NOT RELATED)
    return {
      verdict: 'irrelevant',
      badgeText: '🟡 是也不是 / 与此无关',
      text: '这个细节与真相没有直接因果关系，或者前提并不准确。'
    };
  }

  function handleUseHint() {
    if (isGameOver || !activeSoup) return;
    const unlockedCount = activeSoup.clueNodes.filter(c => c.unlocked).length;
    const nextHintIdx = Math.min(activeSoup.hints.length - 1, unlockedCount);
    const hintText = activeSoup.hints[nextHintIdx] || activeSoup.hints[0];

    appendHostMessage(`💡 <b>【灵感锦囊】</b>：${hintText}`);
  }

  function handleSolveAndReveal() {
    if (isGameOver || !activeSoup) return;
    isGameOver = true;

    const totalClues = activeSoup.clueNodes.length;
    const unlockedClues = activeSoup.clueNodes.filter(c => c.unlocked).length;
    const accuracyPct = Math.round((unlockedClues / totalClues) * 100);

    const zenGain = 40 + unlockedClues * 15;
    const coinGain = 10 + unlockedClues * 5;

    if (typeof state !== 'undefined') {
      state.zen = (state.zen || 0) + zenGain;
      state.heroCoins = (state.heroCoins || 0) + coinGain;
      if (typeof persist === 'function') persist();
      if (typeof render === 'function') render();
    }

    // 记录统计
    const stats = JSON.parse(localStorage.getItem('sanctuary_games_stats') || '{}');
    if (!stats.soup) stats.soup = { wins: 0, losses: 0, score: 0 };
    stats.soup.score = Math.max(stats.soup.score || 0, accuracyPct * 10);
    stats.soup.wins += 1;
    localStorage.setItem('sanctuary_games_stats', JSON.stringify(stats));

    // 弹出完整汤底大揭秘
    const arena = document.querySelector('.soup-arena-wrapper');
    if (!arena) return;

    const modal = document.createElement('div');
    modal.className = 'soup-reveal-modal';
    modal.innerHTML = `
      <div class="soup-reveal-card">
        <div class="soup-reveal-header">
          <h2>🍲 【汤底大揭秘 · 案情真相】</h2>
          <span class="soup-tag-badge">${activeSoup.category}</span>
        </div>

        <div class="soup-truth-box">
          ${activeSoup.truth.replace(/\n\n/g, '<br><br>')}
        </div>

        <div class="soup-reveal-stats">
          <div>提问次数: <b>${questionCount} 次</b></div>
          <div>线索解锁: <b>${unlockedClues} / ${totalClues}</b></div>
          <div>推理契合度: <b>${accuracyPct}%</b></div>
          <div>奖励: <b style="color:#fde047;">+${zenGain} 禅意 / +${coinGain} 英雄币</b></div>
        </div>

        <div class="soup-reveal-btns">
          <button class="game-scale-btn reset-btn" id="soupNextStoryBtn" style="padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: bold; background: #f59e0b; color: #000; border: none; cursor: pointer;">📖 下一个海龟汤</button>
          <button class="soup-action-btn" id="soupCloseRevealBtn">‹ 返回棋阁</button>
        </div>
      </div>
    `;

    arena.appendChild(modal);

    document.getElementById('soupNextStoryBtn').onclick = () => {
      currentSoupIdx = (currentSoupIdx + 1) % SOUP_DATABASE.length;
      activeSoup = JSON.parse(JSON.stringify(SOUP_DATABASE[currentSoupIdx]));
      questionCount = 0;
      isGameOver = false;
      modal.remove();
      renderSoupLobby();
    };

    document.getElementById('soupCloseRevealBtn').onclick = () => {
      modal.remove();
      if (typeof GamesArena !== 'undefined' && typeof GamesArena.showLobby === 'function') {
        GamesArena.showLobby();
      }
    };
  }

  // -------------------------------------------------------------------------
  // 4. 气泡消息与进度条维护
  // -------------------------------------------------------------------------
  function appendUserMessage(text) {
    const stream = document.getElementById('soupChatStream');
    if (!stream) return;

    const row = document.createElement('div');
    row.className = 'soup-msg-row user';
    row.innerHTML = `
      <div class="soup-msg-avatar">🧐</div>
      <div class="soup-msg-bubble">${escapeHtml(text)}</div>
    `;
    stream.appendChild(row);
    stream.scrollTop = stream.scrollHeight;
  }

  function appendHostVerdict(result, originalQuery) {
    const stream = document.getElementById('soupChatStream');
    if (!stream) return;

    const row = document.createElement('div');
    row.className = 'soup-msg-row dm';
    row.innerHTML = `
      <div class="soup-msg-avatar">🐢</div>
      <div class="soup-msg-bubble">
        <div class="soup-verdict-tag ${result.verdict}">${result.badgeText}</div>
        <div>${result.text}</div>
      </div>
    `;
    stream.appendChild(row);
    stream.scrollTop = stream.scrollHeight;
  }

  function appendHostMessage(htmlContent) {
    const stream = document.getElementById('soupChatStream');
    if (!stream) return;

    const row = document.createElement('div');
    row.className = 'soup-msg-row dm';
    row.innerHTML = `
      <div class="soup-msg-avatar">🐢</div>
      <div class="soup-msg-bubble">
        <div>${htmlContent}</div>
      </div>
    `;
    stream.appendChild(row);
    stream.scrollTop = stream.scrollHeight;
  }

  function updateProgress() {
    if (!activeSoup) return;
    const total = activeSoup.clueNodes.length;
    const unlocked = activeSoup.clueNodes.filter(c => c.unlocked).length;
    const pct = Math.round((unlocked / total) * 100);

    const fill = document.getElementById('soupProgressFill');
    const txt = document.getElementById('soupProgressText');
    if (fill) fill.style.width = `${pct}%`;
    if (txt) txt.textContent = `${pct}% (${unlocked}/${total})`;

    // 全部线索解锁提示
    if (pct === 100 && !isGameOver) {
      appendHostMessage('🌟 <b>【全线索贯通！】</b> 你已经集齐了本案的所有关键碎片，点击下方<b>【🎯 揭晓汤底】</b>提交你的完整推理吧！');
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function stop() {
    isGameOver = true;
  }

  return {
    init,
    stop,
    loadStory: (idx) => {
      currentSoupIdx = idx % SOUP_DATABASE.length;
      activeSoup = JSON.parse(JSON.stringify(SOUP_DATABASE[currentSoupIdx]));
      questionCount = 0;
      isGameOver = false;
      renderSoupLobby();
    }
  };
})();
