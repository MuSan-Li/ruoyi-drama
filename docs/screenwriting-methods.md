# 编剧方法在短剧系统中的接入

本项目从公开的 [screenwriting-skills](https://github.com/jtydhr88/screenwriting-skills) 中选取人物选择、对白行动、场景变化和分阶段修订的方法，按现有制作流程重新编写。不是整套技能安装，也不复制书籍引文或完整手册。公开项目的使用许可见 [MIT License](https://github.com/jtydhr88/screenwriting-skills/blob/main/LICENSE)。

## 系统如何使用

| 方法 | 应用内默认技能 | 具体作用 |
| --- | --- | --- |
| 压力下的选择呈现人物 | `story-causality` | 从眼前目标、阻力、代价和改变做法组织场景，配角保留自己的诉求 |
| 对白是对听者采取的行动 | `emotional-dialogue` | 写明争取、回避、拒绝或试探的对象，下一句受上一句影响，听者继续当前行动 |
| 场景以局面变化结束 | `story-causality`、`cinematic-storyboard` | 信息、信任、风险或行动机会发生变化后交镜，压缩无变化的重复工序 |
| 关注点变化引出摄影变化 | `cinematic-storyboard`、`video-prompt` | 完整拍清刺激、行动、接触、结果和反应，不机械一句话一个反打或罗列微表情 |
| 按问题所在阶段修订 | 现有剧本、大纲、分镜与版本记录 | 使用已有项目状态，不增加强制知识库文件、审批口令或独立工作流接口 |

默认技能维护源位于后端 `ruoyi-chat/src/main/resources/short-drama/skills/`。导演目录中的 `compact-short-drama` 同步维护上述方法及精简“媒体提示词”；部署后通过技能接口回读实际绑定与版本，不以文档中的历史版本号判断运行状态。

参考方法来自 [人物与冲突](https://github.com/jtydhr88/screenwriting-skills/blob/main/plugins/screenwriting/skills/sw-character-conflict/SKILL.md)、[对白](https://github.com/jtydhr88/screenwriting-skills/blob/main/plugins/screenwriting/skills/sw-dialogue/SKILL.md)、[场景](https://github.com/jtydhr88/screenwriting-skills/blob/main/plugins/screenwriting/skills/sw-scene-craft/SKILL.md) 与 [工作流](https://github.com/jtydhr88/screenwriting-skills/blob/main/plugins/screenwriting/skills/sw-workflow/SKILL.md)。具体类型与人物依当前项目决定，不要求所有故事固定三幕、每场翻转、争吵或暴力开场。

## 已制作项目的修订

只需要调整视频描述时，完整修订接口保留原视频任务、URL、状态与尾帧。已批准的图片、原对白、镜号、时长、连续性、演员及音色关联保留；风格与描述更新不能被标记成新片已生成。用户明确要求换画风时，在项目绑定、资产当前描述、剧本基调与世界观中同步新方向，旧素材与生成提示词保留为历史记录。

文本审阅分别核对原对白、行动顺序、空间轴线、持物与炮击后果；字段齐全与 ASR 对齐不能证明人物自然或动作流畅。具体视频制作仍遵循 [视频导演规范](video-prompt-direction.md)。
