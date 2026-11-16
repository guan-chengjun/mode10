/**
 * 部件清单：共 31 个可点击部件（>= 25 的要求）
 * 每个部件包含：
 *  - id        场景内唯一标识，与 3D 模型节点 userData.partId 对应
 *  - stage     所属工序索引（0~8）
 *  - name      中文名称
 *  - func      功能说明
 *  - params    工艺参数示意值
 *  - model     可选：联网模型（glb）相对 /public 路径与下载地址；加载失败自动降级为程序化几何体
 *  - explode   爆炸视图位移方向（世界坐标偏移量）
 */
export const PARTS = [
  // ---------------- 0 原料场 ----------------
  {
    id: 'raw-yard',
    stage: 0,
    name: '综合原料场',
    func: '分区堆存铁矿石、焦炭、原煤与熔剂，是全厂原燃料的缓冲与混匀中心。',
    params: [['总储量', '约 80 万 t'], ['作业方式', '堆取料机+皮带'], ['库存周期', '30~45 天']],
    model: { url: 'models/raw_yard.glb', fallback: 'stockpile' },
    explode: [0, 2.5, -3]
  },
  {
    id: 'ore-pile',
    stage: 0,
    name: '铁矿石堆',
    func: '堆存来自矿山的块矿与粉矿，按品位分层堆取以稳定入炉品位。',
    params: [['堆高', '12 m'], ['单堆储量', '5 万 t'], ['平均品位 TFe', '62%']],
    model: { url: 'models/ore_pile.glb', fallback: 'cone' },
    explode: [-2, 2, -2]
  },
  {
    id: 'coal-pile',
    stage: 0,
    name: '焦炭/原煤堆',
    func: '储存炼焦煤与成品焦炭，焦炭作为高炉骨架与发热、还原剂。',
    params: [['灰分', '≤ 12.5%'], ['硫分', '≤ 0.7%'], ['水分', '≤ 6%']],
    model: { url: 'models/coal_pile.glb', fallback: 'cone' },
    explode: [2, 2, -2]
  },
  {
    id: 'belt-conveyor',
    stage: 0,
    name: '皮带输送廊道',
    func: '将混匀矿、焦炭等散料连续输送至烧结与高炉矿槽，实现密闭化清洁运输。',
    params: [['带宽', '1.6 m'], ['输送能力', '2000 t/h'], ['带速', '2.5 m/s']],
    model: { url: 'models/belt_conveyor.glb', fallback: 'conveyor' },
    explode: [0, 3, 2]
  },

  // ---------------- 1 烧结 ----------------
  {
    id: 'sinter-mixer',
    stage: 1,
    name: '圆筒混合机',
    func: '将粉矿、焦粉、石灰石与返矿加水混合制粒，改善料层透气性。',
    params: [['直径×长度', 'Φ4.5×24 m'], ['制粒时间', '约 5 min'], ['混合料水分', '7%±0.5%']],
    model: { url: 'models/mixer.glb', fallback: 'drum' },
    explode: [-2.5, 2.5, 0]
  },
  {
    id: 'sinter-machine',
    stage: 1,
    name: '带式烧结机',
    func: '混合料铺到台车上点火抽风烧结，连续产出块状烧结矿。',
    params: [['有效烧结面积', '360 m²'], ['台车宽度', '4 m'], ['利用系数', '1.35 t/(m²·h)']],
    model: { url: 'models/sinter_machine.glb', fallback: 'bed' },
    explode: [0, 2.5, -2.5]
  },
  {
    id: 'sinter-cooler',
    stage: 1,
    name: '环式冷却机',
    func: '对高温烧结矿鼓风冷却并回收余热，出料温度降至 150 ℃ 以下。',
    params: [['冷却面积', '415 m²'], ['进料温度', '约 750 ℃'], ['出料温度', '≤ 150 ℃']],
    model: { url: 'models/cooler.glb', fallback: 'ring' },
    explode: [2.5, 2.5, 0]
  },

  // ---------------- 2 高炉出铁 ----------------
  {
    id: 'hot-stove',
    stage: 2,
    name: '热风炉',
    func: '蓄热式加热鼓风，为高炉提供 1200 ℃ 以上高温热风，降低焦比。',
    params: [['拱顶温度', '1350 ℃'], ['风温', '1220 ℃'], ['送风制度', '两烧一送']],
    model: { url: 'models/hot_stove.glb', fallback: 'stove' },
    explode: [-3, 2, 2]
  },
  {
    id: 'blast-furnace-top',
    stage: 2,
    name: '高炉炉顶装料系统',
    func: '无料钟炉顶按料批将烧结矿、球团、焦炭均匀布入炉内，并回收煤气。',
    params: [['料罐容积', '60 m³'], ['顶压', '0.25 MPa'], ['布料方式', '多环布料']],
    model: { url: 'models/bf_top.glb', fallback: 'cylinder' },
    explode: [0, 4, 0]
  },
  {
    id: 'blast-furnace',
    stage: 2,
    name: '高炉本体',
    func: '炼铁核心反应器，铁矿石在下降过程中被 CO 与焦炭还原、熔化、渗碳形成铁水。',
    params: [['有效容积', '3200 m³'], ['炉缸直径', '12.6 m'], ['铁水温度', '约 1500 ℃'], ['利用系数', '2.3 t/(m³·d)']],
    model: { url: 'models/blast_furnace.glb', fallback: 'furnace' },
    explode: [0, 3, 0]
  },
  {
    id: 'tapping',
    stage: 2,
    name: '出铁场与铁口',
    func: '定时打开铁口，铁水经主沟、撇渣器分离炉渣后流入鱼雷罐/铁水包。',
    params: [['日出铁次数', '12~14 次'], ['单次出铁量', '约 550 t'], ['铁流速度', '6~8 t/min']],
    model: { url: 'models/tapping.glb', fallback: 'trough' },
    explode: [0, 2, 3.5]
  },
  {
    id: 'torpedo',
    stage: 2,
    name: '鱼雷罐车',
    func: '鱼雷形混铁罐车沿铁路转运铁水至炼钢区，兼有保温与混铁匀质作用。',
    params: [['公称容量', '320 t'], ['满载温降', '≤ 15 ℃/h'], ['周转时间', '约 4 h']],
    model: { url: 'models/torpedo.glb', fallback: 'torpedo' },
    explode: [3, 2, 2]
  },

  // ---------------- 3 转炉 ----------------
  {
    id: 'scrap-bucket',
    stage: 3,
    name: '废钢料槽与称量',
    func: '按废钢比向转炉加入清洁废钢，调节热平衡并降低铁水消耗。',
    params: [['废钢比', '10%~15%'], ['单槽重量', '约 25 t'], ['称量精度', '±0.5%']],
    model: { url: 'models/scrap.glb', fallback: 'bucket' },
    explode: [-3, 2, -1.5]
  },
  {
    id: 'converter',
    stage: 3,
    name: '氧气顶吹转炉',
    func: '可倾动的梨形炉体，氧枪高速射流脱碳造渣，将铁水冶炼成钢水。',
    params: [['公称容量', '150 t'], ['供氧流量', '32000 m³/h'], ['冶炼周期', '约 38 min'], ['炉龄', '≥ 12000 炉']],
    model: { url: 'models/converter.glb', fallback: 'converter' },
    explode: [0, 3.5, 0]
  },
  {
    id: 'oxygen-lance',
    stage: 3,
    name: '氧枪与副枪系统',
    func: '超音速拉瓦尔喷头向熔池吹氧，副枪测温定碳实现不倒炉出钢。',
    params: [['马赫数', 'Ma 2.0'], ['枪位', '1.4~2.2 m'], ['出口氧压', '0.9 MPa']],
    model: { url: 'models/lance.glb', fallback: 'lance' },
    explode: [0, 4.5, 0]
  },
  {
    id: 'ladle',
    stage: 3,
    name: '钢包（盛钢桶）',
    func: '承接转炉出钢钢水，带滑动水口与透气砖，承担精炼与连铸间的转运。',
    params: [['容量', '150 t'], ['耐材寿命', '≥ 80 次'], ['钢水温降', '≤ 1 ℃/min']],
    model: { url: 'models/ladle.glb', fallback: 'ladle' },
    explode: [3, 2, 1.5]
  },

  // ---------------- 4 精炼 ----------------
  {
    id: 'lf-furnace',
    stage: 4,
    name: 'LF 钢包精炼炉',
    func: '电弧加热造白渣，配合底吹氩搅拌进行脱硫、脱氧与成分微调。',
    params: [['变压器容量', '35 MVA'], ['升温速率', '4 ℃/min'], ['脱硫率', '≥ 70%']],
    model: { url: 'models/lf.glb', fallback: 'lf' },
    explode: [-2.5, 3, 0]
  },
  {
    id: 'rh-degasser',
    stage: 4,
    name: 'RH 真空脱气装置',
    func: '钢水循环进入真空室脱除氢、氮与夹杂物，生产汽车板等洁净钢。',
    params: [['真空度', '≤ 67 Pa'], ['处理周期', '30 min'], ['脱氢量', '≤ 1.5 ppm']],
    model: { url: 'models/rh.glb', fallback: 'rh' },
    explode: [2.5, 3, 0]
  },
  {
    id: 'alloy-station',
    stage: 4,
    name: '合金加料与喂丝站',
    func: '精确称量合金料并通过料仓/喂丝机加入钢包，微调 C、Mn、Si 等成分。',
    params: [['料仓数量', '12 个'], ['称量精度', '±0.2%'], ['喂丝速度', '1~6 m/s']],
    model: { url: 'models/alloy.glb', fallback: 'silos' },
    explode: [0, 2.5, -3]
  },

  // ---------------- 5 连铸 ----------------
  {
    id: 'tundish',
    stage: 5,
    name: '中间包',
    func: '接受钢包钢水并稳流分配到各流，挡渣墙促进夹杂物上浮。',
    params: [['公称容量', '45 t'], ['钢水过热度', '20~30 ℃'], ['液位', '850 mm']],
    model: { url: 'models/tundish.glb', fallback: 'trough' },
    explode: [0, 3, -2.5]
  },
  {
    id: 'mold',
    stage: 5,
    name: '结晶器',
    func: '铜板水冷结晶器使钢水在弯月面快速形成初生坯壳，是连铸的“心脏”。',
    params: [['断面', '230×1600 mm'], ['振动频率', '180 次/min'], ['冷却水流量', '320 m³/h']],
    model: { url: 'models/mold.glb', fallback: 'mold' },
    explode: [0, 2.5, 0]
  },
  {
    id: 'secondary-cooling',
    stage: 5,
    name: '二冷段与拉矫机',
    func: '气雾喷水继续凝固，扇形段夹持引导铸坯，拉矫机提供拉坯与矫直力。',
    params: [['冷却区', '9 个区'], ['比水量', '0.9 L/kg'], ['拉速', '1.4 m/min']],
    model: { url: 'models/secondary_cooling.glb', fallback: 'rollers' },
    explode: [0, 2, 2]
  },
  {
    id: 'torch-cutter',
    stage: 5,
    name: '火焰切割机',
    func: '随动夹紧铸坯，用乙炔/燃气火焰将连铸坯切成定尺板坯。',
    params: [['切割厚度', '230 mm'], ['定尺长度', '10.5 m'], ['切割速度', '0.4 m/min']],
    model: { url: 'models/cutter.glb', fallback: 'cutter' },
    explode: [0, 2, 4]
  },

  // ---------------- 6 加热炉 ----------------
  {
    id: 'reheat-furnace',
    stage: 6,
    name: '步进式加热炉',
    func: '活动梁与固定梁步进运送板坯，依次完成预热、加热与均热。',
    params: [['有效炉长', '48 m'], ['出炉温度', '1250 ℃'], ['温差', '≤ 25 ℃'], ['燃耗', '1.25 GJ/t']],
    model: { url: 'models/reheat_furnace.glb', fallback: 'furnace' },
    explode: [0, 3, 0]
  },
  {
    id: 'furnace-burner',
    stage: 6,
    name: '烧嘴与空燃比控制',
    func: '高炉/焦炉混合煤气经蓄热式烧嘴燃烧，双交叉限幅控制空燃比节能降氮。',
    params: [['烧嘴数量', '48 个'], ['空燃比', '约 2.1'], ['NOx 排放', '≤ 150 mg/m³']],
    model: { url: 'models/burner.glb', fallback: 'burner' },
    explode: [-2.5, 2.5, 0]
  },
  {
    id: 'heat-exchanger',
    stage: 6,
    name: '烟气余热换热器',
    func: '回收炉膛烟气余热预热助燃空气，降低煤气消耗并减少排烟热损失。',
    params: [['预热风温', '约 500 ℃'], ['换热效率', '≥ 65%'], ['排烟温度', '≤ 180 ℃']],
    model: { url: 'models/heat_exchanger.glb', fallback: 'exchanger' },
    explode: [2.5, 2.5, 0]
  },

  // ---------------- 7 热轧 ----------------
  {
    id: 'descaling',
    stage: 7,
    name: '高压水除鳞装置',
    func: '高压水射流击碎板坯表面氧化铁皮，保证带钢表面质量。',
    params: [['水压', '22 MPa'], ['喷嘴数量', '24 个'], ['除鳞率', '≥ 98%']],
    model: { url: 'models/descaling.glb', fallback: 'descale' },
    explode: [0, 2.5, -3]
  },
  {
    id: 'roughing-mill',
    stage: 7,
    name: '粗轧机组',
    func: '往复多道次大压下轧制，将 230 mm 板坯轧成 35~45 mm 中间坯。',
    params: [['机架数', '1 架可逆+2 架'], ['道次压下率', '≤ 45%'], ['轧制力', '最大 60 MN']],
    model: { url: 'models/roughing_mill.glb', fallback: 'mill' },
    explode: [-2.5, 2.5, 0]
  },
  {
    id: 'finishing-mill',
    stage: 7,
    name: '精轧机组（7 机架）',
    func: '七机架连续轧制至成品厚度，活套控制机架间张力，保证板形与厚度精度。',
    params: [['机架数', '7 架 F1~F7'], ['成品厚度', '1.8~19 mm'], ['轧制速度', '最高 15 m/s'], ['厚度公差', '±30 μm']],
    model: { url: 'models/finishing_mill.glb', fallback: 'mill' },
    explode: [0, 3, 0]
  },
  {
    id: 'runout-table',
    stage: 7,
    name: '层流冷却辊道',
    func: '带钢在辊道上经层流冷却水按冷却路径降温，控制相变与力学性能。',
    params: [['冷却段长度', '90 m'], ['终冷温度', '550~650 ℃'], ['冷却速率', '5~30 ℃/s']],
    model: { url: 'models/runout.glb', fallback: 'rollers' },
    explode: [0, 2, 3]
  },

  // ---------------- 8 卷取 ----------------
  {
    id: 'downcoiler',
    stage: 8,
    name: '地下卷取机',
    func: '夹送辊引导带钢头部进入助卷辊与卷筒，连续卷取成紧密钢卷。',
    params: [['卷筒直径', 'Φ762 mm'], ['卷取速度', '最高 15 m/s'], ['卷重', '最大 30 t']],
    model: { url: 'models/downcoiler.glb', fallback: 'coiler' },
    explode: [-2.5, 2.5, 0]
  },
  {
    id: 'coil-yard',
    stage: 8,
    name: '钢卷库与打捆称重',
    func: '钢卷卸卷后自动打捆、喷码、称重，由行车入库待发，是全流程成品端。',
    params: [['库容', '约 8 万 t'], ['打捆道次', '周向 3 道'], ['称重精度', '±2 kg']],
    model: { url: 'models/coil_yard.glb', fallback: 'coils' },
    explode: [2.5, 2.5, 0]
  }
]

/** 按 id 快速索引 */
export const PART_MAP = Object.fromEntries(PARTS.map((p) => [p.id, p]))

export const PART_COUNT = PARTS.length
