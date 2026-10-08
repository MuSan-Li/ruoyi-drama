# 角色声音与视频生成

在「资产配置 → 角色」展开角色卡中的「角色声音」，填写音高、年龄感、气质、方言和表演方式，再填写一句简短的样音正文。音色卡默认折叠，仅显示绑定状态；展开后显示编辑和试听，切换角色或项目时恢复折叠。点击「生成样音」后，后台使用已配置的 Atlas `bytedance/seed-audio-1.0` 生成候选。也可以上传已有样音。

试听后点击「选用此样音」完成角色绑定。声音绑定在角色主档身份上，各套衣装共用同一声音。再次生成候选会参考当前选用的样音；新候选不会覆盖已选用版本，也不会改动已有视频。

样音需要2—30秒、小于10MB，建议用2—4秒的干净单人台词，不加音乐。方言和表演描述只是生成要求，应实际试听核对。

在「分镜确认」展开「本镜发言人与声音」，核对实际发言人，画外对白也要包含。出镜但不说话的角色不用加入，无对白可保存空名单。新分镜按 `source_text` 中的 `角色名：「原句」` 自动识别；旧版连续叙述里不明确的归属需要手动核对。恢复自动识别会移除本镜的手动名单。

单镜生成、批量生成和重新生成均走同一后端提交入口。提交时从角色档案读取当前选用样音，按顺序加入 `reference_audios`，并附上角色名与音频编号的对应指令；样音正文不会作为本镜台词使用。一个项目开始设置角色声音后，实际发言人缺少选用样音或归属不明确会阻止提交，先补齐绑定再生成。未配置角色声音的旧项目保持兼容。

角色样音和按镜号上传的手动音频一起校验：Seedance 2.0每镜最多3条、总长15秒；Seedance 2.5最多10条、总长30秒。超限会提示拆镜、换用短样音或选择支持更多参考的已配置模型。Seedance 2.0需要至少一张角色或场景参考图；首帧仍可不传。视频秒数留空时不传，只有用户显式填写正整数或 `-1` 才提交该参数。

本接入使用固定样音作为角色声音身份。Seed Audio返回任务编号及音频结果，当前公开响应没有返回可复用的 `voiceId`，系统不会为供应商虚构音色ID。参考音频用于指导视频音色，不能代替成片对白、口型和音色的实际验收。[Atlas接口文档](https://www.atlascloud.ai/docs/more-models/bytedance/seed-audio-1.0/generateAudio)

Seedance 2.5有角色声音参考时必须使用 `bytedance/seedance-2.5/reference-to-video`；`text-to-video` 的公开请求字段不包含 `reference_audios`。供应商通过 `@Audio1`、`@Audio2` 按 `reference_audios` 的提交顺序识别音频，后端提交时将内部的 `@音频N`、`@audioN` 转为该语法，同时转换图片和视频引用；不改写已保存分镜及历史回执。仅音频参考也设置 `omni_reference_task_type: reference`，不要求额外首帧。[Seedance 2.5参考接口](https://www.atlascloud.ai/docs/zh/more-models/bytedance/seedance-2.5-reference-to-video/generateVideo)

`generate_audio: true` 表示让视频模型生成同步声音，不能作为固定演员音色的开关。当前公开视频接口没有 `voice_id` 或跨任务共享音色会话参数。固定样音仍是生成参考；若需要成片每镜采用同一配音，应先制作和试听对白录音，按镜切分后供画面与口型参考，合成时保留已确认的录音，并检查口型及环境声衔接。该流程需要另行制作，不能把样音绑定完成写成整段配音已经完成。

## 后端接口与保存

所有接口校验项目所属用户与角色/分镜所属项目。

| 接口 | 用途 |
| --- | --- |
| `GET /short-drama/{projectId}/characters/{characterId}/voice` | 声音设置、样音版本与生成任务 |
| `PUT .../voice` | 保存描述与样音正文 |
| `POST .../voice/generate` | 带UUID `requestId` 创建候选，重复同一请求返回原任务 |
| `GET .../voice/jobs/{id}` | 查询已提交任务并保存样音；重试保存不重新生成 |
| `POST .../voice/upload` | 上传2—30秒样音 |
| `POST .../voice/select` | 选择已有样音，不改动其他版本 |
| `GET .../voice/samples/{id}` | 鉴权试听本地MP3 |
| `GET /short-drama/{projectId}/voices/storyboards/{storyboardId}` | 查看本镜发言人、样音映射和未就绪原因，不提交视频 |
| `PUT /short-drama/{projectId}/voices/storyboards/{storyboardId}` | 只保存 `continuityJson.voice_speakers`，其他连续性字段保留 |

提交结果未知时保留原UUID和记录，先核对 Atlas 任务，不自动重复付费。明确失败后可创建新候选；并发额度满时等待其他任务完成。角色样音与任务保存在后端工作目录的 `data/short-drama-sounds/{projectId}/character-voices/`，需要FFmpeg和ffprobe；部署时挂载并备份此目录。视频请求绑定快照保存在 `data/short-drama-video/submissions/{storyboardId}/voices/`，记录角色ID、样音版本、文件SHA-256与实际参考音频URL。
