# 上美影动画技能在 RuoYi Drama 中的使用

原项目：[liangdabiao/smy-seedance-storyboard](https://github.com/liangdabiao/smy-seedance-storyboard)。本目录是项目适配源，不是个人安装目录的别名；上游提交与文件SHA256见`source.json`，原文见`upstream/`。

后台分为两项：

| 类别 | 技能标识 | 用途 |
| --- | --- | --- |
| 审美 | smy-animation-aesthetics | 造型、单剧色盘、图片与视频媒介规则 |
| 导演 | smy-seedance-storyboard | 故事动作、反应、摄影声音、尾帧衔接 |

源文件分别为本目录和相邻`smy-animation-aesthetics`的`SKILL.md`、`manifest.json`及manifest列出的references。通过既有`POST /short-drama/skills`创建；维护用`PUT /short-drama/skills/{name}`并提交刚回读的expectedVersion。正文来自SKILL，附属文件来自manifest，artStyle留空，交给正文定义本项目自选子风格。复制源码不会自动改变已运行后台；部署和迁移须包含运行目录`data/short-drama-skills/`。

保存后用`GET /short-drama/skills/{name}`逐字核对正文、参考和内容版本，用`GET /short-drama/skills/market`核对实际市场。新项目绑定aestheticSkillName和directorSkillName后，回读`GET /short-drama/{projectId}`。不改全局默认、旧绑定或已批准媒体，不硬编码前端选项。模型输出继续使用默认业务生成与内容审阅；媒体只加载各正文“媒体提示词”段。

水墨淡彩与手绘平涂的无渐变约束不同，执行以项目适配正文和上游风格指南第九节为准。RuoYi正文采用连续导演描述，时间预算留在timing；首帧可选。具体差异见`references/project-adaptation.md`。

首次接入的源码/运行目录核对、真实项目绑定和媒体凭据保存于`output/tadpoles-smy-20261003/`，实例项目为《小蝌蚪找妈妈｜上美影水墨·15秒》。这个实例的固定色盘和镜数不是后续作品默认模板。

该项目随后按用户要求扩为《小蝌蚪找妈妈｜上美影水墨·一分钟对白样片》。新剧本保存在同项目的独立scriptId，旧剧本与15秒分镜、原片保留。新版制作记录在`output/tadpoles-smy-20261003/minute-v3/`：寻找误认、纠正指引、犹豫相认、解答团聚四个连续表演段；原生六个摄影候选经正常分镜保存和内容审阅整理。复用已批准蝌蚪、妈妈与荷塘，新增金鱼母版；角色固定样音及实际发言名单走项目声音接口。合成只选新版的四个storyboardId。时长以最终文件实测，样音选择、ASR及任务终态不代表人工试听通过。

对白、画外回应、群体数量与VAD漏句的实作边界见`references/dialogue-sample-lessons.md`。这是带失败证据的项目维护资料，未加入媒体提示词的长文本注入；不能据此宣称后续成片自动通过。

本次首版实帧曾出现荷叶揭示后蝌蚪从三只变成两只，虽然提示词有数量与否定约束，仍未通过视觉审阅。原片、抽帧和原任务保留在制作目录`history/v1/`；修订使用可持续跟踪的独立队形、空白水域和明确遮挡关系，只修改videoPrompt，保留资产、源文、时间预算与连续性。后续以新实帧复核，不能把加了约束或任务完成等同于问题已解决。对应可复用规则已加入本技能媒体执行段。
