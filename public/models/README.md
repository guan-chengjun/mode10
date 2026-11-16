# 模型目录（可选）

把替换用的 `.glb` 模型放到本目录，命名与 `src/data/parts.js` 中 `model.url` 对应即可，例如：

```
public/models/blast_furnace.glb
public/models/converter.glb
```

应用启动时优先加载本目录中的模型（完全离线可用）；
本地不存在时再尝试从 `src/three/modelLoader.js` 配置的在线地址下载；
两者都失败会自动切换为内置程序化几何体，不影响运行。
