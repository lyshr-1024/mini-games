# mini-games

浏览器小游戏合集：纯静态页面、零依赖、无构建，打开即玩。

在线地址：https://lyshr-1024.github.io/mini-games/

## 游戏

### 中国象棋（`web/xiangqi/`）

- 三种模式：执红对 AI / 执黑对 AI / 双人对弈；支持悔棋
- 完整合法走法校验（蹩马腿、塞象眼、将帅照面、过河兵等），中文记谱
- 点击选子、高亮合法落点、走子动画、将军提示；执黑时棋盘自动翻转
- 右侧棋谱点击任意一手回退复盘，从历史续走自动分支；三次重复局面判和
- AI 在 Web Worker 里搜索不卡 UI，难度：入门 / 普通 / 较强（内置 JS 引擎：alpha-beta + 静态搜索 + 重复局面剪枝）/ 大师

"大师"难度用 `web/xiangqi/engine/` 里的 Fairy-Stockfish（WASM + Pikafish 团队训练的象棋 NNUE，GPL-3.0）。多线程 WASM 需要跨源隔离，静态托管设不了响应头，由 `coi-serviceworker.js` 补上；浏览器不支持或直接打开本地文件时自动退回内置 JS 引擎。

规则说明：长将/长捉按简化规则处理——同一局面第三次出现判和，与正式规则（长打一方判负）不同。

### 四川麻将（`web/mahjong/`）

- 血战到底 + 换三张 + 定缺，108 张，手机横屏为主；竖屏提示横过来
- 掷骰定庄、开牌、定换牌方向；碰 / 直杠 / 暗杠 / 补杠，抢杠胡、杠上花、杠上炮（呼叫转移）、一炮多响、过手胡
- 番型：平胡、对对胡、清一色、七对（龙七对）、带幺九、金钩钓、将对、根，自摸加番；封顶可设 2–5 番或不封顶
- 流局查花猪、查大叫；结算页给出每家番型拆解与分数流水，累计分自动存档，刷新可继续
- 听牌提示（含剩余张数）、出牌预览、能胡高亮；三家 AI 可分别设入门 / 普通 / 较强 / 大师（决定化蒙特卡洛），在 Web Worker 里运行

## 开发

### 本地预览

```sh
python3 -m http.server -d web 8000   # 打开 http://localhost:8000
```

需要起 HTTP 服务：直接双击打开（`file://`）时 service worker 注册不了，象棋"大师"难度会退回内置 JS 引擎。

### 添加新游戏

1. 新建 `web/<game>/index.html`，页面里放一个 `<a href="../">← 全部游戏</a>` 返回链接
2. 在 `web/index.html` 的 `GAMES` 数组里加一项：`href`（如 `"<game>/"`）、`name`、`desc`、`glyph`（卡片上的大字图标）、`background`（卡片背景 CSS）

推送到 `main` 后由 `.github/workflows/pages.yml` 自动部署 `web/`。

### 测试

象棋引擎的走法生成用 perft（走法数统计）校验，数据在 `tests/data/perft.json`：

```sh
node scripts/perft_js.mjs              # 默认到 depth 4，--max-depth N 可调
node --test scripts/mahjong_test.mjs   # 麻将：胡牌/番型/收钱/状态机/AI
```

CI（`.github/workflows/ci.yml`）在每次 push / PR 上跑这两条命令。

## License

MIT（Fairy-Stockfish 相关文件除外，见 `web/xiangqi/engine/Copying.txt`）。`web/mahjong/tiles.js` 内嵌了霞鹜文楷（LXGW WenKai）的 10 字子集，遵循 SIL Open Font License 1.1。
