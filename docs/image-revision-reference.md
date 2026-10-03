# 角色图片修订候选

`POST /short-drama/image/start` 保留既有 query 参数 `assetType`、`assetId`、`model`、`referenceImageUrl`。JSON body 可选：

```json
{
  "referencePurpose": "identity_revision",
  "revisionRequirements": "保留参考脸型、年龄与发际线；按项目三维动画材质重建皮肤与发束，纠正指定衣领为闭合圆领，其他配饰与左右标志保持。"
}
```

默认省略 body 或使用 `identity`，沿用已批准身份与服装连续性。`identity_revision` 仅支持 `assetType=appearance`，必须提供身份参考图和非空修订要求（最多4000字符）；只改变明确列出的材质、服装或结构。前端 API 的第五个参数接收此对象。国风三维材质优先于角色旧描述中的摄影肤质表述，仍保持身份比例和年龄。

角色和场景的同步、重生及异步入口共同读取所属项目最新已保存剧本的 `worldbuilding`，无需额外接口参数。世界观只约束年代、材料与发展阶段，本张资产描述决定当前可见物件与作物状态，不将未来计划、已设想装备或其他年代内容提前加入。场景按实际规模构图；贫困建设初期不自动放大为繁华都市，幼苗不提前成熟，前现代没有已引进依据时不添塑料棚顶、育苗盘或西式衬衫。国风三维要求可辨CG雕塑体块、受控色面和成组发束，仍需看实际图片验收；已批准衣物不因世界规则自动改变，有冲突须显式修订。

用返回的真实任务 ID 继续原查询和 `confirm-image` 流程，不再次启动生成。修订任务完成后，`confirm-image` 仅追加候选与本次提示词，不改变原 `referenceImageUrl` 和 `selectedImageIndex`。实际看图批准后，调用 `POST /short-drama/character-appearance/{id}/select-image?index={候选索引}`，再回读项目核对。普通任务保留原确认行为。

每次启动前在后端工作目录 `data/short-drama-image/prompt-evidence/attempts/` 保存脱敏最终提示词及原始最终提示词的 SHA-256；受理后增加 `predictions/` 下按模型和任务 ID 哈希关联的记录。记录只含制作参数、用途、资产与项目 ID、时间和任务 ID，参考图仅保存 SHA-256，不保存签名 URL、Base64、模型配置或凭据。日志输出 attemptId、资产 ID、用途与 hash，便于定位实际输入。旧任务无证据时兼容原确认流程；有记录时验证其资产和所属用户。

这份记录供制作审阅，不能替代实际图片验收，也不是自动重提机制。提交后的证据写入失败会报告 attemptId 与 predictionId，应核对既有任务，避免重复付费提交。
