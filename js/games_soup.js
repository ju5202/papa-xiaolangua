/* ==========================================================================
   帕帕 · 小南瓜 | 游艺街机阁 — 《灵犀海龟汤 · 迷雾探案》超级智能主持人引擎 (Turtle Soup Engine v2.0)
   严谨智能主持人判定引擎、海量精选题库、语义事实图谱、多维线索树与沉浸式推理复盘
   ========================================================================== */

const TurtleSoupGame = (() => {
  let container = null;
  let currentSoupIdx = 0;
  let activeSoup = null;
  let questionCount = 0;
  let chatHistory = [];
  let isGameOver = false;

  // -------------------------------------------------------------------------
  // 1. 精选高品质海龟汤题库 (全方位事实图谱与多维自然语言语义库)
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
        {
          id: 'c1',
          title: '曾经经历过海难与荒岛绝境求生',
          matchKeywords: ['海难', '遇难', '翻船', '沉船', '海难事故', '荒岛', '被困', '求生', '漂流', '海上', '灾难', '失事', '孤岛', '生还', '幸存', '活下来', '经历', '过去'],
          hint: '男人在数年前曾经历过一场九死一生的极端海上浩劫。',
          unlocked: false
        },
        {
          id: 'c2',
          title: '以前在荒岛上喝过假的海龟汤',
          matchKeywords: ['以前喝过', '曾经喝过', '喝过', '第一次喝', '不是第一次', '不是海龟', '假海龟', '假汤', '味道不一样', '味道不同', '味道', '口感', '真正', '真正的海龟', '真的海龟', '尝出', '区别', '记忆里的味道'],
          hint: '这不是他记忆中“第一次”喝海龟汤的味道，真实的汤味唤醒了尘封的记忆。',
          unlocked: false
        },
        {
          id: 'c3',
          title: '当年荒岛求生时吃的其实是同伴的肉',
          matchKeywords: ['人肉', '同伴的肉', '同伴肉', '同伴死', '吃人', '吃同伴', '同伴牺牲', '朋友的肉', '牺牲', '同伴骗他', '骗他是海龟', '同伴的尸体', '吃同伴的肉', '同伴身体', '死去的同伴', '别人的肉', '人肉汤'],
          hint: '当年的同伴为了让他活下去，编造了善意却残酷无比的谎言。',
          unlocked: false
        },
        {
          id: 'c4',
          title: '得知真相后因极度愧疚绝望而自杀',
          matchKeywords: ['自杀', '愧疚', '自责', '受不了', '崩溃', '良心', '得知真相', '发现真相', '明白真相', '绝望', '痛哭', '痛苦', '自尽', '跳楼', '不能接受', '良心谴责'],
          hint: '真相揭开的瞬间，他的世界观与道德防线彻底瓦解。',
          unlocked: false
        }
      ],
      yesKeywords: [
        '海难', '荒岛', '海', '水手', '船员', '同伴', '骗', '谎言', '味道不同', '味道不一样', '自杀', '死',
        '自责', '愧疚', '人肉', '吃人', '以前喝过', '救他', '牺牲', '崩溃', '回忆', '绝望', '过去', '饥饿',
        '没有食物', '饿', '食物', '真的海龟', '同伴死了', '男人是幸存者', '有隐情', '善意的谎言'
      ],
      noKeywords: [
        '毒', '有毒', '下毒', '过敏', '难喝', '老板是凶手', '餐厅有仇', '海龟成精', '价格贵', '餐厅老板',
        '妻子出轨', '精神病', '谋杀', '被逼自杀', '生病', '绝症', '抢劫', '海龟死了', '是凶杀吗', '服务员害他',
        '汤变质了', '故意害他', '有毒药', '是真正的海龟吗'
      ],
      guidanceTopics: {
        death: '🟢 是的，他是自杀身亡。但关键在于他为何在喝下这碗汤后得知真相并绝望自尽！',
        poison: '🔴 不是，汤本身完全正常、新鲜且无毒。问题出在他记忆里的味道！',
        companion: '🟢 是的，他当年的同伴在荒岛上对他隐瞒了极其关键的残酷秘密！',
        past: '🟢 是的，这一切的根源都始于他数年前经历过的一场可怕海难！',
        food: '🟢 是的，核心焦点就在于当年他在荒岛上吃下的究竟是什么肉！'
      },
      suggestedInquiries: [
        '男人以前喝过海龟汤吗？',
        '他在荒岛绝境时吃下的肉是真正的海龟吗？',
        '他过去经历过严重的沉船海难吗？',
        '当年同伴对他隐瞒了什么善意的谎言？',
        '自杀是因为得知了残酷的真相吗？'
      ],
      hints: [
        '提示 1：关注他过去在海难荒岛上的绝境求生经历。',
        '提示 2：这碗海龟汤本身没有任何问题，问题出在他记忆里的味道与现实完全不同。',
        '提示 3：荒岛上在没有任何食物的极端情况下，同伴为了救他，究竟用什么熬成了“海龟汤”？'
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
        {
          id: 'c1',
          title: '敲击声来自隔壁旅客打呼噜',
          matchKeywords: ['呼噜', '打呼', '打鼾', '打鼾声', '鼾声', '呼吸声', '睡觉的声音', '打雷', '震动', '隔壁声音', '噪音', '熟睡', '生理现象'],
          hint: '隔壁发出的声音其实是一种常见的人体熟睡生理现象。',
          unlocked: false
        },
        {
          id: 'c2',
          title: '拨打的是隔壁房间的客房电话',
          matchKeywords: ['隔壁电话', '打给隔壁', '房间电话', '隔壁房', '邻居电话', '客房电话', '打通电话', '响铃', '铃声', '总机', '拨号', '打给隔壁'],
          hint: '男人拨打的号码距离他仅仅一墙之隔。',
          unlocked: false
        },
        {
          id: 'c3',
          title: '电话铃声把隔壁吵醒，打断了呼噜声',
          matchKeywords: ['吵醒', '叫醒', '弄醒', '醒了', '打断', '停下', '接电话', '停止呼噜', '不打了', '接听', '声音停了', '安静了'],
          hint: '接通电话的动作直接打断了隔壁的声音来源。',
          unlocked: false
        },
        {
          id: 'c4',
          title: '男人的目的纯粹为了自己能睡着',
          matchKeywords: ['为了睡觉', '为了睡着', '想睡觉', '安静', '睡不着', '失眠', '入睡', '吵', '解决噪音', '安心入睡'],
          hint: '男人的动机没有任何恶意或犯罪企图，只是想睡个好觉。',
          unlocked: false
        }
      ],
      yesKeywords: [
        '打呼噜', '呼噜', '打鼾', '隔壁', '邻居', '客房', '吵醒', '弄醒', '铃声', '接电话',
        '为了睡觉', '睡不着', '安静', '旅馆', '住客', '生理', '噪音', '一墙之隔', '停了', '电话', '号码'
      ],
      noKeywords: [
        '凶杀', '犯罪', '暗号', '密码', '闹鬼', '偷听', '出轨', '跟踪', '威胁', '死人',
        '敲门', '报警', '前台', '服务员', '电话诈骗', '黑客', '谋杀', '绑架', '是凶手吗'
      ],
      guidanceTopics: {
        crime: '🔴 不是，本案没有任何犯罪、凶杀或阴谋，纯粹是一个生活巧思！',
        sound: '🟢 是的，声音来自人体熟睡时的生理现象（打呼噜）！',
        call: '🟢 是的，男人把电话直接打给了隔壁房间，目的是让铃声吵醒对方！',
        sleep: '🟢 是的，男人所做的一切就是为了在声音停止后抓紧时间入睡！'
      },
      suggestedInquiries: [
        '隔壁发出的声音是人在打呼噜吗？',
        '男人拨打的电话是打给隔壁房间的吗？',
        '这通电话的目的是为了让隔壁的声音停下来吗？',
        '隔壁的人被电话铃声吵醒了吗？',
        '这是一起没有任何犯罪的趣味生活推理吗？'
      ],
      hints: [
        '提示 1：那规律的“敲击声”并不是工具敲打发出的，而是一种熟睡时的声音。',
        '提示 2：男人不需要说话，他需要的只是让隔壁房间的电话铃声响起来。'
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
        {
          id: 'c1',
          title: '死者是从空中高速坠落摔死的',
          matchKeywords: ['空中', '天上', '高空', '掉下来', '坠落', '摔下来', '飞机', '空难', '高处', '掉下', '砸下来', '从天而降', '摔死', '重力'],
          hint: '死者来到雪地中央的方式并非来自陆地，而是来自上方。',
          unlocked: false
        },
        {
          id: 'c2',
          title: '死者生前正在进行跳伞运动',
          matchKeywords: ['跳伞', '降落伞', '跳伞员', '飞行员', '极限运动', '运动员', '滑翔', '机组', '伞兵', '跳飞机'],
          hint: '死者生前正在进行一项高空飞行运动。',
          unlocked: false
        },
        {
          id: 'c3',
          title: '降落伞发生故障未能打开',
          matchKeywords: ['降落伞坏了', '伞没开', '降落伞没打开', '故障', '伞包', '未打开', '打不开', '伞绳', '事故', '失灵', '失误'],
          hint: '保护他生命的装备在最后关头失效了。',
          unlocked: false
        }
      ],
      yesKeywords: [
        '跳伞', '高空', '坠落', '摔死', '飞机', '降落伞', '天上', '飞行', '故障', '从天而降', '运动',
        '空中', '意外', '骨折', '重力', '伞没开', '极限运动', '掉下来', '未打开', '高空坠落'
      ],
      noKeywords: [
        '谋杀', '下雪盖住脚印', '融化', '雪崩', '被抛尸', '热气球', '外星人', '瞬移', '自杀', '投毒',
        '冻死', '车撞', '动物袭击', '枪杀', '他杀', '是凶手杀的吗'
      ],
      guidanceTopics: {
        sky: '🟢 是的！死者不是从地面走过来的，他是从高空直接坠落下来的！',
        parachute: '🟢 是的！他是一名跳伞者，核心原因在于降落伞故障没能打开！',
        murder: '🔴 不是他杀！这纯粹是一起令人惋惜的高空极限运动装备失灵事故！',
        footprint: '🟢 是的，之所以雪地上没有任何脚印，正是因为他是从天上直直掉下来的！'
      },
      suggestedInquiries: [
        '死者是从空中掉下来的吗？',
        '死者生前是在进行高空跳伞吗？',
        '他的降落伞故障没能打开吗？',
        '这是一起意外事故而非谋杀吗？'
      ],
      hints: [
        '提示 1：不要局限在地面二维空间思考，抬头看看天空。',
        '提示 2：死者身亡前所处的垂直高度远高于地面，地面没有任何痕迹是因为他直接从上方坠入雪地。'
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
        {
          id: 'c1',
          title: '昨夜守塔人擅自关掉了灯塔电源',
          matchKeywords: ['关灯', '昨晚关灯', '误关', '喝醉', '睡着关了', '灯塔熄灭', '没开灯', '熄灭', '失职', '疏忽', '酒醉', '关了灯', '失误', '关掉电源'],
          hint: '昨夜值班期间发生了一起致命的擅离职守或误关灯失误。',
          unlocked: false
        },
        {
          id: 'c2',
          title: '导致远洋客轮触礁沉没造成特大惨剧',
          matchKeywords: ['沉船', '撞船', '触礁', '翻船', '客轮', '很多人死', '海难', '伤亡', '事故', '大惨案', '撞礁', '船只遇难', '迷失方向', '船沉了'],
          hint: '报纸头条报道的是一起昨夜因失去航标指引导致的客轮沉没特大惨剧。',
          unlocked: false
        },
        {
          id: 'c3',
          title: '守塔人因极度愧疚绝望而跳崖谢罪',
          matchKeywords: ['内疚', '自责', '谢罪', '赎罪', '受不了良心', '得知惨剧', '自杀', '跳崖', '绝望', '良心谴责', '悔恨', '无法原谅自己'],
          hint: '他无法面对因自己的疏忽造成的巨大伤亡，选择跳崖谢罪。',
          unlocked: false
        }
      ],
      yesKeywords: [
        '关灯', '沉船', '触礁', '海难', '喝醉', '失职', '疏忽', '报纸', '内疚', '自责', '赎罪',
        '客轮', '船只', '航标', '方向', '跳崖', '自杀', '昨夜', '迷失方向', '暴风雨', '惨案'
      ],
      noKeywords: [
        '谋杀', '被威胁', '妻子去世', '鬼魂', '灯塔倒塌', '失业', '战争爆发', '外星人', '绝症',
        '被逼跳崖', '仇杀', '贪污', '抢劫'
      ],
      guidanceTopics: {
        ship: '🟢 是的！昨夜有船只因为没有灯塔的光芒指引，在暴风雨中触礁沉没了！',
        newspaper: '🟢 是的！报纸头条报道的正是昨晚那起伤亡惨重的特大海难！',
        mistake: '🟢 是的！守塔人昨晚犯下了致命的工作失误（把灯塔误关了）！',
        suicide: '🟢 是的！他跳崖完全是因为得知惨剧后极度的自责、愧疚与赎罪！'
      },
      suggestedInquiries: [
        '报纸上报道的新闻与他有直接关系吗？',
        '昨夜有客轮因为没有灯光指引而触礁沉没吗？',
        '他在昨夜值班时误关了灯塔电源吗？',
        '他跳崖是因为强烈的愧疚与赎罪吗？'
      ],
      hints: [
        '提示 1：灯塔的使命是为黑夜狂风巨浪中的船只指引安全航道。',
        '提示 2：昨夜的灯塔并没有履行它的使命，导致了灾难性的后果。'
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
        {
          id: 'c1',
          title: '草帽被夏风吹落到了湖水中',
          matchKeywords: ['被风吹', '掉进湖', '掉水里', '吹走', '掉落', '落水', '吹进水里', '风吹走', '风吹落'],
          hint: '草帽之所以会变湿，是因为一阵夏风导致的一次意外落水。',
          unlocked: false
        },
        {
          id: 'c2',
          title: '乌龟帕帕游进湖里将草帽打捞了回来',
          matchKeywords: ['帕帕捞', '乌龟捞', '游过去', '游水', '打捞', '捡回来', '顶在头上', '游回', '帮忙捡', '捡草帽'],
          hint: '湖畔圣域里水性最好的水灵神龟帕帕出手相助了。',
          unlocked: false
        },
        {
          id: 'c3',
          title: '湿草帽在酷暑中意外地非常凉快解暑',
          matchKeywords: ['凉快', '解暑', '降温', '防暑', '很凉爽', '避暑', '舒服', '凉爽', '防晒'],
          hint: '湿透的草帽在这个炎热的夏天带来了意想不到的凉爽与舒适。',
          unlocked: false
        }
      ],
      yesKeywords: [
        '风吹', '掉水里', '帕帕游泳', '捞上来', '凉快', '解暑', '夏天', '热', '防晒', '遮阳', '友情', '帮忙',
        '湿透', '草帽', '湖水', '湖边', '乘凉', '开心', '合作'
      ],
      noKeywords: [
        '死人', '凶杀', '沉尸', '丢弃', '毒药', '吵架', '偷窃', '灵异', '犯罪', '谋杀'
      ],
      guidanceTopics: {
        lake: '🟢 是的！草帽原本是被风吹进湖水里的！',
        papa: '🟢 是的！是水性最好的帕帕跳进湖里把草帽打捞上来的！',
        cool: '🟢 是的！湿漉漉的草帽戴在头上在酷夏反而格外凉爽解暑！'
      },
      suggestedInquiries: [
        '草帽是被风吹进湖水里的吗？',
        '是乌龟帕帕游进湖里把草帽打捞回来的吗？',
        '湿透的草帽能起到很好的防暑降温效果吗？',
        '这是一个温馨互助的夏日故事吗？'
      ],
      hints: [
        '提示 1：这是一个发生在湖畔圣域夏天的温馨友情故事。',
        '提示 2：湿漉漉的草帽戴在头上，在烈日骄阳下会有怎样的奇妙体验？'
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
        {
          id: 'c1',
          title: '天花板上有在黑暗中发光的夜光字迹',
          matchKeywords: ['夜光', '荧光', '发光', '字', '写了字', '留了话', '字迹', '关灯才能看见', '暗处发光', '荧光粉', '夜光颜料'],
          hint: '关灯后才能看见天花板上用特殊颜料留下的文字。',
          unlocked: false
        },
        {
          id: 'c2',
          title: '有陌生人或凶手趁他不在潜入了单身公寓',
          matchKeywords: ['有人进过', '潜入', '进小偷', '凶手', '有人来过', '陌生人', '被入侵', '潜伏', '外人', '独居', '潜入房间'],
          hint: '这间本该属于他一个人的房间被不速之客悄悄潜入了。',
          unlocked: false
        },
        {
          id: 'c3',
          title: '字迹提示有人此刻正藏在床底看着他',
          matchKeywords: ['床底', '躲在床下', '藏在房间', '床下有人', '正在看着他', '在床下', '趴在床底', '危险在身边', '床底藏人'],
          hint: '字迹上的内容预示着极度危险就在他身旁咫尺之间。',
          unlocked: false
        }
      ],
      yesKeywords: [
        '夜光', '荧光', '字', '潜入', '床底', '陌生人', '凶手', '有人', '害怕', '危险', '关灯才看见',
        '独居', '字迹', '看着他', '房间', '惊吓', '天花板', '逃跑'
      ],
      noKeywords: [
        '虫子', '蜘蛛', '幻觉', '做梦', '漏水', '天花板塌了', '妻子', '朋友恶作剧', '停电', '闹鬼', '怪物'
      ],
      guidanceTopics: {
        ceiling: '🟢 是的！关灯后天花板上显现出了原本看不见的夜光字迹！',
        intruder: '🟢 是的！在他不在家期间，有极度危险的陌生人悄悄潜入了房间！',
        bed: '🟢 是的！字迹内容写着凶手此刻正躲在他的床底下看着他！'
      },
      suggestedInquiries: [
        '天花板上的字迹只有在关灯后才能看到吗？',
        '是有人偷偷潜入了男人的房间吗？',
        '字迹内容提示有人正躲在床底下吗？',
        '男人逃跑是因为察觉到了生命危险吗？'
      ],
      hints: [
        '提示 1：有一种特殊的夜光颜料在开灯时完全看不见，只有关灯陷入黑暗时才会发亮。',
        '提示 2：男人是独居，这行刚写不久的字是谁留下的？字上的内容又指向哪里？'
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
          <input type="text" class="soup-text-input" id="soupQueryInput" placeholder="向帕帕主持人自由提问（例如：他以前经历过海难吗？自杀是因为汤有毒吗？）..." maxlength="100" />
          <button class="soup-send-btn" id="soupSendBtn">提问</button>
          <button class="soup-action-btn" id="soupHintBtn" title="获取主持人灵感锦囊">💡 锦囊</button>
          <button class="soup-action-btn solve" id="soupSolveBtn" title="提交最终推理并揭开汤底">🎯 揭晓汤底</button>
        </div>
      </div>
    `;

    // 初始欢迎消息
    appendHostMessage(
      `欢迎来到灵犀海龟汤！我是你的主持人 <b>🐢 帕帕</b>。<br>` +
      `请仔细阅读上方的【汤面】，向我提出你的推测或疑问。我会明确回答：<b>【🟢 是】</b>、<b>【🔴 不是】</b>或<b>【🌟 关键线索】</b>！`
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
  // 3. 超级智能主持人语义推导与精准判定引擎 (Smart Intent & Semantic Evaluator)
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

    // ① 优先比对关键线索节点 (Crucial Clues)
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

    // ② 语义主题导向分析 (Guidance Topics)
    if (soup.guidanceTopics) {
      if (q.includes('死') || q.includes('自杀') || q.includes('他杀') || q.includes('谋杀') || q.includes('凶手')) {
        if (soup.guidanceTopics.death) {
          return { verdict: 'yes', badgeText: '🟢 是 (YES)', text: soup.guidanceTopics.death };
        }
        if (soup.guidanceTopics.murder) {
          return { verdict: 'no', badgeText: '🔴 不是 (NO)', text: soup.guidanceTopics.murder };
        }
      }
      if (q.includes('毒') || q.includes('下毒') || q.includes('变质') || q.includes('过敏')) {
        if (soup.guidanceTopics.poison) {
          return { verdict: 'no', badgeText: '🔴 不是 (NO)', text: soup.guidanceTopics.poison };
        }
      }
      if (q.includes('同伴') || q.includes('朋友') || q.includes('谎言') || q.includes('隐瞒')) {
        if (soup.guidanceTopics.companion) {
          return { verdict: 'yes', badgeText: '🟢 是 (YES)', text: soup.guidanceTopics.companion };
        }
      }
      if (q.includes('天上') || q.includes('空中') || q.includes('跳伞') || q.includes('飞机') || q.includes('掉下')) {
        if (soup.guidanceTopics.sky) {
          return { verdict: 'yes', badgeText: '🟢 是 (YES)', text: soup.guidanceTopics.sky };
        }
      }
      if (q.includes('呼噜') || q.includes('声音') || q.includes('噪音') || q.includes('敲击')) {
        if (soup.guidanceTopics.sound) {
          return { verdict: 'yes', badgeText: '🟢 是 (YES)', text: soup.guidanceTopics.sound };
        }
      }
      if (q.includes('电话') || q.includes('隔壁') || q.includes('号码')) {
        if (soup.guidanceTopics.call) {
          return { verdict: 'yes', badgeText: '🟢 是 (YES)', text: soup.guidanceTopics.call };
        }
      }
      if (q.includes('船') || q.includes('触礁') || q.includes('沉没') || q.includes('海难')) {
        if (soup.guidanceTopics.ship) {
          return { verdict: 'yes', badgeText: '🟢 是 (YES)', text: soup.guidanceTopics.ship };
        }
      }
      if (q.includes('报纸') || q.includes('新闻') || q.includes('头条')) {
        if (soup.guidanceTopics.newspaper) {
          return { verdict: 'yes', badgeText: '🟢 是 (YES)', text: soup.guidanceTopics.newspaper };
        }
      }
      if (q.includes('天花板') || q.includes('夜光') || q.includes('字')) {
        if (soup.guidanceTopics.ceiling) {
          return { verdict: 'yes', badgeText: '🟢 是 (YES)', text: soup.guidanceTopics.ceiling };
        }
      }
      if (q.includes('床') || q.includes('藏') || q.includes('躲')) {
        if (soup.guidanceTopics.bed) {
          return { verdict: 'yes', badgeText: '🟢 是 (YES)', text: soup.guidanceTopics.bed };
        }
      }
    }

    // ③ 比对肯定词库 (YES)
    const hitYes = soup.yesKeywords.some(kw => q.includes(kw.toLowerCase()));
    if (hitYes) {
      return {
        verdict: 'yes',
        badgeText: '🟢 是 (YES)',
        text: '是的！你的推测非常敏锐，完全符合案情核心！'
      };
    }

    // ④ 比对否定词库 (NO)
    const hitNo = soup.noKeywords.some(kw => q.includes(kw.toLowerCase()));
    if (hitNo) {
      return {
        verdict: 'no',
        badgeText: '🔴 不是 (NO)',
        text: '不是！案情的发展方向并不是这样，可以换个角度探索。'
      };
    }

    // ⑤ 智能引导式回答 (不再生硬地回答“没有关系”)
    const unUnlockedClues = soup.clueNodes.filter(c => !c.unlocked);
    const leadClue = unUnlockedClues[0] || soup.clueNodes[0];

    return {
      verdict: 'guide',
      badgeText: '🟡 帕帕主持人的灵感提示',
      text: `这个问题偏离了主线。<b>帕帕提示：</b>你可以试着往<b>【${leadClue.title}】</b>的方向深入推测！`
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
