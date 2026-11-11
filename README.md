# mini-games

浏览器小游戏合集：纯静态页面、零依赖、无构建，打开即玩。

在线地址：https://lyshr-1024.github.io/mini-games/

## 游戏

### 中国象棋（`web/xiangqi/`）

- 完整合法走法校验（蹩马腿、塞象眼、将帅照面、过河兵等），中文记谱
- 点击选子、高亮合法落点、走子动画、将军提示；执黑时棋盘自动翻转
- 右侧棋谱点击任意一手回退复盘，从历史续走自动分支；三次重复局面判和
- AI 在 Web Worker 里搜索不卡 UI，难度：入门 / 普通 / 较强（内置 JS 引擎：alpha-beta + 静态搜索 + 重复局面剪枝）/ 大师

"大师"难度用 `web/xiangqi/engine/` 里的 Fairy-Stockfish（WASM + Pikafish 团队训练的象棋 NNUE，GPL-3.0）。多线程 WASM 需要跨源隔离，静态托管设不了响应头，由 `coi-serviceworker.js` 补上；浏览器不支持或直接打开本地文件时自动退回内置 JS 引擎。

规则说明：长将/长捉按简化规则处理——同一局面第三次出现判和，与正式规则（长打一方判负）不同。

## 本地运行

```sh
python3 -m http.server -d web 8000   # 打开 http://localhost:8000
```

直接双击 `web/xiangqi/index.html` 也能玩，只是没有"大师"难度。

## 添加新游戏

1. 新建 `web/<game>/index.html`，页面里放一个 `<a href="../">← 全部游戏</a>` 返回链接
2. 在 `web/index.html` 的 `GAMES` 数组里加一项

推送到 `main` 后由 `.github/workflows/pages.yml` 自动部署 `web/`。

## 测试

象棋引擎的走法生成用 perft（走法数统计）校验，数据在 `tests/data/perft.json`：

```sh
node scripts/perft_js.mjs              # 默认到 depth 4
```

## License

MIT（Fairy-Stockfish 相关文件除外，见 `web/xiangqi/engine/Copying.txt`）
