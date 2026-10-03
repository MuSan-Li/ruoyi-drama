# 分场规划检查点与审阅恢复

这是制作恢复接口说明，不会自动发起模型或媒体任务。

`GET /short-drama/{projectId}/checkpoint-status?scriptId=...&model=...&minimumShotSeconds=4` 返回当前用户项目的只读证明。`validatedSceneCount` 计入当前原文、桥梁上下文、世界观、画风、画幅、写作模型、规划参数及实际引用角色/具体形象/场景描述匹配，且具有可用结构与绑定的场次。对白容量、预算与节奏建议继续供人工审阅，validated 不表示内容或成片已通过验收。图片URL、选择索引和更新时间不进入规划资产签名；无关资产的新增不使已有按场证明失效。

没有新元数据的旧缓存仅在完整指纹相同的原键下读取，不搜索或迁移其他旧指纹。单独导出的旧稿需要实际审阅。`sourceApproval=not_reviewed` 的原数组不能直接视为已批准。

已审阅部分场次可以调用 `POST /short-drama/{projectId}/import-reviewed-plan`（原 `/plan-storyboard/review` 仍可用）：

```json
{
  "scriptId": "当前剧本ID",
  "expectedScriptText": "实际GET回读的完整原正文",
  "model": "完整写作模型型号",
  "minimumShotSeconds": 4,
  "sceneNumbers": [6],
  "expectedAssetSignature": "刚读取的checkpoint-status.currentAssetSignature",
  "panels": ["仅此处指定场次的完整已审阅panel对象"]
}
```

`panels` 必须传对象数组，不是示意中的文字。项目须尚未落库分镜；接口核对owner、当前剧本、资产签名、原对白顺序与容量、场次预算和真实引用。选择场次以外的镜头会被拒绝。全组校验通过后才写所选场次检查点；返回镜头数表示已保存规划，尚未生成细化或媒体。

下面是正常API的PowerShell调用示例；登录令牌和客户端ID从当前登录环境取得，不在文件中保存。`scene-6-reviewed.json` 必须是已实际审阅的完整候选数组，不能用未批准的导出代替。

```powershell
$api = 'http://127.0.0.1:6038'
$headers = @{ Authorization = "Bearer $env:RUOYI_TOKEN"; clientid = $env:RUOYI_CLIENT_ID }
$projectId = '当前项目ID'
$model = 'bytedance/doubao-seed-2.1-pro-260628'
$detail = (Invoke-RestMethod -Headers $headers -Uri "$api/short-drama/$projectId").data
$scriptId = $detail.script.id
$query = "scriptId=$scriptId&model=$([Uri]::EscapeDataString($model))&minimumShotSeconds=4"
$status = (Invoke-RestMethod -Headers $headers -Uri "$api/short-drama/$projectId/checkpoint-status?$query").data
$panels = Get-Content -Raw -Encoding utf8 -LiteralPath '.\scene-6-reviewed.json' | ConvertFrom-Json
$body = @{ scriptId=$scriptId; expectedScriptText=$detail.script.scriptText; model=$model;
  minimumShotSeconds=4; sceneNumbers=@(6); expectedAssetSignature=$status.currentAssetSignature; panels=@($panels) }
$jsonBytes = [Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Depth 100))
Invoke-RestMethod -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' `
  -Uri "$api/short-drama/$projectId/import-reviewed-plan" -Body $jsonBytes
```

再GET检查点状态，确认所选场次 `state=validated` 和 `proofSource=reviewed_import`。其他场次仍由原生planner继续，不把成功导入部分场次表述为整集已完成。`minimumShotSeconds` 默认1，作为规划参数保存在检查点身份中；时长估算与实际模型限制分开。修订保留原对白、原声源及自然容量，可合并同空间并行动作，不拉长无事件的静默来填目标。

原计划已明确收到原生`error`并保存为`checkpoint_incomplete`，才可以创建新的正常planner请求。系列helper保留旧错误收据和新UUID：

```powershell
python logs/county_media_production_20261001.py plan-submit --episode E02 --project 当前项目ID `
  --request-id 新的完整UUID --model bytedance/doubao-seed-2.1-pro-260628 `
  --resume-checkpoint --minimum-shot-seconds 4 --timeout 7200 --idle-timeout 120
```

当本地完整素材指纹不同，helper先GET新状态验证兼容场次，把原请求UUID、状态哈希、当前签名及实际可复用场次保存进新收据，再POST。没有可证明场次则停止；在途或未知记录仍只能查询，不能凭缓存存在重复提交。分镜规划检查点不等于细化检查点，更不等于已生成视频或通过声音、视觉验收。
