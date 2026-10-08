# 写作模型与音乐创作

模型配置在已运行的 ruoyi-ai 后端中保存，前端无需放 API Key。使用 Atlas Cloud 的现有模型提供商，配置各自的真实模型名称：

| 用途 | 分类 | 模型名称 |
| --- | --- | --- |
| 剧本、资产分析、分镜规划、音乐文案 | chat | `deepseek-ai/deepseek-v4.1-flash` |
| 可选的世界观与长稿写作 | chat | `bytedance/doubao-seed-2.1-pro-260628` |
| 纯器乐 BGM、主题曲、片尾曲 | audio | `suno/chirp-v6` |
| 角色固定样音、参考音色配音 | audio | `bytedance/seed-audio-1.0` |

有对白的角色可提前生成并绑定固定样音，视频按实际发言人自动携带，详见[角色声音与视频生成](character-voices.md)。它使用语音接口的 `text/references`，不复用 Suno 歌曲请求。

Doubao Seed Evolving 与 Seed 2.1 Pro 是不同模型，请按真实型号配置。Suno 家族页面当前展示 V6；使用已退役的 v5 示例无法代表 V6 的能力和参数。

自动生成和重写剧本统一排版：剧名、场次标题、动作段落和每句对白各自分段，段落间空一行。生成中的正文与保存后的正文共用阅读样式，可切换到编辑；后端在同步、流式生成、重写和保存时统一整理换行，保持原对白和剧情时间。

只有用户本轮明确指定目标时长时才按该值写作。未指定时，剧本名、大纲和正文不预填总分钟数、场次秒数或预计预算，不继承旧样片的目标片长。故事中的年份、季节和时间跳转保留。续写从已制作片尾的实际状态开始，已制作内容与允许修订的穿帮片段分别留档；视频秒数仍仅由用户明确设置。

## 使用流程

1. 前端自动查询 AtlasCloud 厂商模型，按用途分类和后台默认优先级选用，不展示模型名称或下拉选择。剧本、资产和分镜默认 DeepSeek V4.1 Flash，关闭思考模式，图片默认 GPT Image 2.5，视频默认 Seedance 2.0 Mini、720p。后台“模型管理”修改默认优先级，数值越小越优先，同值按ID排序。刷新工作台后采用最新配置。头像菜单中的“Key 配置”批量更新 AtlasCloud 全部分类的模型密钥。
2. 在“分镜确认”点击“展开顶部工具”，进入“音乐创作”，选择 BGM、主题曲或片尾曲。填写曲名、音乐风格、目标时长，歌曲另填写歌词和演唱声线。
3. 可使用“用当前写作模型起草”，根据本项目已保存剧本和创作要求生成原创文案。先审阅并编辑，再提交音乐任务。
4. 每次音乐任务通常返回两版音轨。任务编号、参数、音轨实际时长及本地 MP3 均保存到项目，刷新页面后继续查询未完成任务。
5. 试听后填写实际镜号、音量和素材起点，再“选用此版”。同任务的另一版本移出混音；不同音乐任务可按不同镜号使用。片尾歌曲不会自动增加影片长度，需要已有片尾镜头承载或另行制作片尾。
6. “移出混音”保留候选素材，仍可试听。参考音频面板会显示候选音乐和已选用音乐。合成沿用现有按镜号淡入淡出和对白压低音乐流程。

## 接入约定

- POST `/short-drama/{projectId}/music`：带客户端 UUID `requestId`；同一参数、同一 UUID 重试返回原任务，不重复提交付费任务。
- GET `/short-drama/{projectId}/music`：读取项目任务。
- GET `/short-drama/{projectId}/music/{id}`：查询 Atlas 异步状态，并保存所有返回音轨。
- POST `/short-drama/{projectId}/music/write`：当前写作模型起草音乐文案，返回 `title/style/prompt`，不修改剧本。
- POST `/short-drama/{projectId}/music/{id}/use`：选用或移除指定版本，校验项目所属人和实际镜号。
- Suno 请求使用 `custom=true`、`prompt`、`style`、`title`、`duration`；BGM 为 `instrumental=true`，歌曲为 `instrumental=false`、`auto_lyrics=false`，保留用户歌词。不能使用 TTS 的 `text` 字段代替音乐参数。
- 目标时长 10–360 秒；歌词／描述最多 3000 字符。目标时长不等于实际返回长度，保存后以 ffprobe 实测值显示。
- 风格最多1000字符：2026-10-01实测上游将`style`映射为`tags`，超限时查询可能返回HTTP 500，但任务明确为failed。后端识别同一任务ID的失败终态；普通网络错误继续保留原任务供查询。写作起草对风格长度作保护，并移除歌词段落标签之前的制作解说，仍需人工审阅文字。
- 豆包2.1 Pro实测音乐文案请求约175–205秒；世界观整理与详细导演稿也可能是长请求。前端世界观和音乐文案等待10分钟，Atlas写作客户端等待6分钟，同步调用关闭自动重试；长稿响应仍须检查是否完整后再保存。
- 歌曲声线取 `Male`／`Female`；结果音轨取 `outputs`，封面 `thumbnail` 不作为音频。音乐模型从对白语音模型列表中分离。
- 提交结果未知时不会自动再次付费提交；先在 Atlas 中核对。下载暂时失败可继续查询原任务重试保存，不会重新生成。
- 文件保存在后台运行目录 `data/short-drama-sounds/{projectId}`，任务位于 `music-jobs` 子目录。部署迁移需同步这份持久数据及模型数据库。

官方规格：[Doubao](https://www.atlascloud.ai/zh/models/doubao)、[Suno Chirp V6](https://www.atlascloud.ai/zh/models/suno/chirp-v6)、[音频 API](https://www.atlascloud.ai/docs/zh/models/audio)。价格、型号和权限以供应商当前页面及账户为准。
