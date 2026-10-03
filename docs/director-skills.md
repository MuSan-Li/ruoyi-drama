# 默认导演业务技能

后端 `ruoyi-chat/src/main/resources/short-drama/skills/` 是默认业务技能的维护源，按剧本、资产、分镜和视频提示词阶段加载。目录中的审美与导演技能由项目显式绑定；分类与绑定约定见[风格技能目录](style-skills.md)。

修改默认资源后需构建并重启后端，再回读实际应用版本。历史文档版本号不能证明运行服务已更新；缺失规范不能静默退回旧提示词。

## 制作与审阅

- [视频导演规范](video-prompt-direction.md)：首帧可选、连续动作与回应、对白声源、摄影声音和交镜承接；时长预算独立保存。
- [编剧方法](screenwriting-methods.md)：人物选择、对白行动、场景变化和分阶段修订。
- [情感与对白](emotional-directing.md)：人物意图、知情边界、时间容量和声音审阅。
- [连贯性工作流](continuity-workflow.md)：分阶段制作、断点恢复和跨镜状态。
- [视觉资产](visual-assets.md)：身份、场景和道具参照及候选保留。
- [角色声音](character-voices.md)：样音绑定与本镜实际发言人映射。

前端“本镜重点与承接”展示镜头意图、动作接点和起止状态。修订已制作分镜时保留已批准媒体、任务编号和连续性；字段检查与模型审阅不能替代真实成片的视觉和声音检查。

## 方法来源

项目规则按现有接口维护，来源登记不代表已接入对应平台。

- [huobao 分镜因果链](https://github.com/chatfire-AI/huobao-drama/blob/master/backend/workspace/skills/storyboard-breaker/SKILL.md)
- [huobao 视频动作描述](https://github.com/chatfire-AI/huobao-drama/blob/master/backend/workspace/skills/prompt-generator/video-prompt/SKILL.md)
- [DirectorSKILL 调度与构图](https://github.com/wuwangzhang1216/DirectorSKILL/blob/main/SKILL.md)
- [连续性台账](https://github.com/tuoxie0102/ai-director-skill/blob/main/references/storyboard-continuity.md)
- [LibTV 来源登记](../skills/cinematic-storyboard/references/libtv-sources.md)
