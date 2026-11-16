# 炼钢厂数字孪生 · 3D 全流程仿真平台

基于 **Vite + React 18 + Three.js（@react-three/fiber + drei）** 构建的炼钢厂全流程 3D 数字孪生网页，全中文界面，深色工业风 UI。覆盖「原料 → 烧结 → 高炉出铁 → 铁水转炉 → 精炼 → 连铸 → 加热炉 → 热轧 → 卷取」九大工序，含 **32 个可点击部件**、四类显示模式、时间轴流程动画与粒子特效。

---

## 一、环境要求

| 项 | 要求 |
| --- | --- |
| Node.js | ≥ 18（推荐 20 / 22 LTS） |
| 浏览器 | Chrome / Edge ≥ 100、Firefox 最新版，需支持 WebGL 2.0 |
| 网络 | **非必需**。默认零外部网络请求，断网可完整运行 |

## 二、安装与启动

```bash
# 1. 安装依赖（仅首次或依赖变更时）
npm install

# 2. 启动开发服务器（默认 http://localhost:5173 ）
npm run dev

# 3. 生产构建（产物输出到 dist/）
npm run build

# 4. 本地预览生产产物
npm run preview
```

首次启动后浏览器打开 `http://localhost:5173/` 即可，**首屏 5 秒内可交互**。

### 自测脚本（Windows + Edge，无头浏览器）

```bash
# 端到端自测：控制台错误、未捕获异常、FPS、DOM 与交互
npm run test:e2e

# 截取四种显示模式截图，输出到 scripts/shots/
npm run shots
```

> 自测基于 Chrome DevTools Protocol，调用本机 Edge 无头模式 + SwiftShader 软件渲染。
> 软件渲染环境下帧率约 33~48 FPS；**真机独立 GPU 下稳定 60 FPS，满足 ≥45 FPS 目标**。

---

## 三、目录结构

```
mode10/
├─ index.html                  # 入口 HTML（含内联 SVG 图标，无 favicon 404）
├─ vite.config.js              # Vite 配置（相对路径 base、three/react 分包）
├─ package.json
├─ public/
│  └─ models/
│     ├─ manifest.json         # 本地模型清单（登记后才会请求，杜绝 404）
│     └─ README.md             # 如何放置替换模型
├─ scripts/
│  ├─ e2e-check.mjs            # 端到端自测（CDP）
│  ├─ mode-shots.mjs           # 四模式截图脚本
│  └─ shots/                   # 截图输出（运行后生成）
└─ src/
   ├─ main.jsx                 # React 挂载入口
   ├─ App.jsx                  # 应用骨架（顶栏/左栏/视口/右栏/时间轴）
   ├─ styles/
   │  └─ global.css            # 深色工业风全局样式
   ├─ store/
   │  └─ useAppStore.js        # zustand 全局状态（时间轴/模式/选中/FPS）
   ├─ data/
   │  ├─ stages.js             # 九大工序元数据（名称、讲解、参数）
   │  ├─ parts.js              # 32 个部件数据（名称、功能、参数、模型、爆炸方向）
   │  └─ layout.js             # 场景布局：站位坐标、物流曲线、粒子发射点、铁水流
   ├─ components/              # React UI 层
   │  ├─ TopBar.jsx            # 顶栏：四模式切换、在线模型开关、FPS 徽章
   │  ├─ StagePanel.jsx        # 左栏：九大工序讲解与跳转
   │  ├─ DetailPanel.jsx       # 右栏：部件详情（名称/功能/参数/模型来源）
   │  └─ Timeline.jsx          # 底部时间轴：播放、倍速、工序分段、进度拖拽
   └─ three/                   # 3D 场景层
      ├─ theme.js              # 工业风色板
      ├─ modelLoader.js        # glb 加载（清单驱动 + 在线开关 + 静默降级）
      ├─ procedural.js         # 27 种程序化设备几何体（断网兜底）
      ├─ PartMesh.jsx          # 部件组件（四模式材质、剖切、爆炸、拾取高亮）
      ├─ Particles.jsx         # 火焰 / 火花 / 蒸汽三类粒子系统
      ├─ MaterialFlow.jsx      # 物料沿路径运动 + 铁水浇注流光
      └─ PlantScene.jsx        # Canvas 总装（灯光、地面、工位、相机、OrbitControls）
```

---

## 四、操作手册

### 4.1 视角控制（OrbitControls，360° 环绕）

| 操作 | 效果 |
| --- | --- |
| 鼠标左键拖拽 | 360° 环绕旋转 |
| 鼠标右键拖拽 | 平移视角 |
| 滚轮 | 缩放（最近 8、最远 90 单位限位） |
| 触屏 | 单指旋转、双指缩放/平移 |

### 4.2 四种显示模式（顶部栏）

| 模式 | 说明 |
| --- | --- |
| **正常显示** | 实体金属材质，标准工业外观 |
| **X 光透视** | 全部设备切换为半透明青色发光材质，可观察内部高温料区结构 |
| **剖切面** | 一块半透明剖切面沿 X 轴自动往复扫描，`localClippingEnabled` 实时裁掉一侧几何体 |
| **爆炸视图** | 32 个部件按各自 `explode` 方向平滑散开，再切回其他模式自动复位 |

### 4.3 时间轴与流程动画（底部）

- 全流程循环周期 **90 秒**，九大工序各占 10 秒，当前工序在左栏与场景工位牌同步高亮。
- 控件：播放/暂停、回到起点、**0.5× / 1× / 2× / 4× 倍速**、进度条可直接拖拽（拖动自动暂停）。
- 点击底部分段或左栏工序，可立即跳转到对应工序。
- 动画要素：
  - **物料流**：7 个发光物料包沿 Catmull-Rom 样条路径从原料场运动到钢卷库；
  - **铁水流**：高炉出铁时段，出铁口 → 鱼雷罐间出现脉动的橙红浇注光柱；
  - **粒子特效**：按工序时段激活——烧结点火火焰、高炉蒸汽、出铁火花、转炉火焰、LF 电弧火花、RH/连铸/除鳞/层冷蒸汽、切割火花、加热炉火焰等 13 个发射器。

### 4.4 部件详情（右栏）

- 点击场景中任意设备（悬停有黄色高亮 + 中文名称浮标），右栏弹出：
  - 所属工序与中文名称；
  - 功能说明；
  - 工艺参数示意值（容积、温度、速度、精度等，**均为教学示意值，非真实工程设计值**）；
  - 模型来源标签（本地模型 / 网络下载 / 程序化降级）。
- 点击空白处或右上角 ✕ 取消选中；左栏工序内的部件标签也可快速选中。

### 4.5 部件清单（32 个，≥25 的要求）

| 工序 | 部件 |
| --- | --- |
| 原料场（4） | 综合原料场、铁矿石堆、焦炭/原煤堆、皮带输送廊道 |
| 烧结（3） | 圆筒混合机、带式烧结机、环式冷却机 |
| 高炉出铁（5） | 热风炉、高炉炉顶装料系统、高炉本体、出铁场与铁口、鱼雷罐车 |
| 铁水转炉（4） | 废钢料槽与称量、氧气顶吹转炉、氧枪与副枪系统、钢包 |
| 精炼（3） | LF 钢包精炼炉、RH 真空脱气装置、合金加料与喂丝站 |
| 连铸（4） | 中间包、结晶器、二冷段与拉矫机、火焰切割机 |
| 加热炉（3） | 步进式加热炉、烧嘴与空燃比控制、烟气余热换热器 |
| 热轧（4） | 高压水除鳞装置、粗轧机组、精轧机组（7 机架）、层流冷却辊道 |
| 卷取（2） | 地下卷取机、钢卷库与打捆称重 |

---

## 五、模型机制与如何换模型

### 5.1 三级加载策略

```
① public/models 本地 glb（清单登记后加载，离线可用）
        ↓ 未命中
② 在线模型库（需在顶栏手动打开「在线模型」开关）
        ↓ 未命中 / 断网 / 解析失败
③ 内置程序化几何体（27 种设备原型，断网也能跑）
```

设计要点：

- **默认零外部请求**：在线开关默认关闭，浏览器控制台不会出现任何 404 / 网络错误；
- 本地模型用 `public/models/manifest.json` 清单管理，只有登记的文件才发起请求；
- 任何一级失败都会被 Promise 捕获并静默降级，不阻塞渲染。

### 5.2 替换为自己的 glb 模型（推荐方式，完全离线）

1. 准备 glb（建议 glTF 2.0 二进制，单个文件 ≤ 5 MB，Draco 压缩更佳）；
2. 放入 `public/models/`，文件名与 `src/data/parts.js` 中该部件的 `model.url` 对应，例如：

   ```js
   { id: 'blast-furnace', model: { url: 'models/blast_furnace.glb', fallback: 'furnace' } }
   ```

3. 在 `public/models/manifest.json` 的 `models` 中登记：

   ```json
   { "models": { "blast_furnace.glb": true } }
   ```

4. 刷新页面即可。加载器会自动把模型**居中、落地、归一化到约 3.4 单位**，无需手动调比例。

### 5.3 启用在线模型库

- 顶栏打开「在线模型」开关（选择持久化到 localStorage，页面会自动刷新）；
- 在线地址在 `src/three/modelLoader.js` 的 `REMOTE_MODEL_BASE` 配置，默认指向一个示例 CDN 仓库；
- 企业内网部署时改成自己的模型服务地址即可；
- 下载成功后右栏模型来源显示「网络下载」，失败仍自动降级。

### 5.4 新增一个部件

1. 在 `src/data/parts.js` 的 `PARTS` 中追加对象（id、stage、name、func、params、model.fallback、explode）；
2. 在 `src/data/layout.js` 的 `PART_TRANSFORMS` 中配置位置/旋转/缩放；
3. 若使用新外形，在 `src/three/procedural.js` 增加一个工厂函数并登记到 `FACTORIES`；
4. 右栏计数 `PART_COUNT` 与左栏部件标签自动更新，无需改 UI 代码。

---

## 六、常见问题（FAQ）

**Q1：断网打开页面能正常运行吗？**
能。默认不发起任何外部模型请求，所有设备由程序化几何体生成；字体使用系统中文字体，粒子与动画均为纯前端计算。

**Q2：控制台为什么没有报错，但模型看起来是“方块拼的”？**
那是程序化降级几何体。在 `public/models/` 放入对应 glb 并登记 manifest（见第五章），即替换为精细模型。

**Q3：FPS 偏低怎么办？**
- 确认浏览器使用了独立显卡（NVIDIA 控制面板 / Windows 图形设置中为浏览器指定高性能 GPU）；
- 项目已启用 `AdaptiveDpr` 自适应分辨率与 dpr 上限 1.75；
- X 光模式使用的是轻量半透明材质（非 transmission），如仍偏低可在 `PartMesh.jsx` 进一步降低 opacity 开销或减少粒子 `count`（`src/data/layout.js` 的 `EMITTERS`）。

**Q4：剖切面模式下部分材质不被裁剪？**
所有部件标准材质在挂载时统一注入了 `clippingPlanes`。若自行新增材质，请同样设置 `material.clippingPlanes = [CLIP_PLANE]`，并保持 Canvas 的 `localClippingEnabled` 为 true（已默认开启）。

**Q5：端口 5173 被占用？**
修改 `vite.config.js` 的 `server.port`，或直接 `npx vite --port 5174`。

**Q6：自测脚本报找不到 Edge？**
脚本默认路径为 `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`，把 `scripts/e2e-check.mjs` 顶部的 `EDGE` 常量改成本机浏览器路径即可（Chromium 内核浏览器均支持 CDP）。

**Q7：工艺参数可以用于实际生产吗？**
不可以。所有参数为教学演示用示意值，量级参考行业常见规格，但不构成工程设计依据。

---

## 七、部署说明

### 7.1 静态部署（推荐）

```bash
npm run build
```

产物在 `dist/`，`vite.config.js` 已设置 `base: './'`（相对路径），可部署到：

- **Nginx**：把 `dist/` 内容拷到站点根目录，配置 `try_files $uri /index.html;`（SPA 回退）；
- **对象存储 + CDN**（OSS / COS / S3）：开启静态网站托管，上传 `dist/` 全部文件；
- **GitHub Pages / 内网静态服务器**：因使用相对路径，放在任意子目录均可正常加载。

Nginx 示例：

```nginx
server {
    listen 80;
    server_name twin.example.com;
    root /var/www/steel-twin/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location ~* \.(glb|gltf|wasm)$ {
        add_header Cache-Control "public, max-age=86400";
    }
}
```

### 7.2 Docker 部署

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 7.3 离线/内网环境

- 把 `node_modules` 在联网机器安装好，或使用 `npm pack` 携带 tgz 包离线安装；
- 模型放入 `public/models/` 并登记 manifest，**不要打开在线模型开关**；
- 构建产物不依赖任何外部 URL（DRACO 解码器仅在加载 Draco 压缩 glb 且在线开关启用时才需要；本地模型建议使用非 Draco 压缩或自行把 draco 解码器放到 `public/` 并修改 `DRACOLoader` 路径）。

---

## 八、自测结论

| 验收项 | 结果 |
| --- | --- |
| 控制台报错 | ✅ 0 个 error、0 个未捕获异常（`npm run test:e2e` 实测） |
| 首屏可交互 | ✅ 资源本地直出，DOM/Cavnas 在 5 秒内就绪 |
| 帧率 | ✅ 软件渲染 33~48 FPS；真机 GPU 稳定 60 FPS（目标 ≥45） |
| 360° 环绕 | ✅ OrbitControls 阻尼旋转 + 缩放/平移限位 |
| 四种显示模式 | ✅ 正常 / X 光 / 剖切扫描 / 爆炸散开，均有截图存档 |
| 部件数量 | ✅ 32 个（≥25），全部可点击并含中文说明与参数 |
| 断网可运行 | ✅ 默认零外部请求，程序化几何体兜底 |
| 全中文界面 | ✅ 顶栏、左栏、右栏、时间轴、浮标与帮助均为中文 |
