# 默认导演业务 skills

后端资源 `ruoyi-chat/src/main/resources/short-drama/skills/` 为规范来源，`ShortDramaDirectorSkills` 默认按阶段加载，无需用户手工选择工具或复制提示词。缺失规范会明确报错，不能静默退回旧提示词。修改资源后重新构建、重启后端；版本进入分镜规划缓存键。

| Skill | 默认应用阶段 |
| --- | --- |
| story-causality | 剧本、大纲、角色分析、分镜规划 |
| director-blocking | 分镜、摄影、表演、镜头细化、关键帧、最终视频提示词 |
| visual-world | 剧本、角色、场景、摄影、关键帧 |
| real-material | 剧本、分镜、细化、最终视频提示词 |
| director-review | 分镜规划、细化、关键帧提示词 |

人物设定图允许正面参考；剧情首帧按行为重新构图，不复制参考照的凝视方向。世界设定由项目正文和资产描述携带，2023和2000年后装修不是其他题材的全局默认值。

生成完成不等于通过视觉审阅。当前由人工查看实际关键帧，记录可观察结果；这些 skills 不等于已实现自动视觉验收。状态台账在 continuityJson 内承接。镜头修订只同步实际发生变化的关键帧；修正单镜构图时重新解析当前人物和场景参考，避免使用旧图绑定。

借鉴来源（规则为按本项目接口重新编写，未复制完整第三方 skill）：
- [huobao 分镜段落与因果链](https://github.com/chatfire-AI/huobao-drama/blob/master/backend/workspace/skills/storyboard-breaker/SKILL.md)
- [huobao 视频动作分段](https://github.com/chatfire-AI/huobao-drama/blob/master/backend/workspace/skills/prompt-generator/video-prompt/SKILL.md)
- [DirectorSKILL 先调度后构图](https://github.com/wuwangzhang1216/DirectorSKILL/blob/main/SKILL.md)
- [连续性台账](https://github.com/tuoxie0102/ai-director-skill/blob/main/references/storyboard-continuity.md)

《爸爸没说完的话》本轮：2023年末，2000年后维护正常的装修；7场43镜，488秒；只重做第一镜场景、陈念参考及首帧，第二镜只调整手机承接，其他素材保留待逐镜核对。视频生成仍未开始。

## 情感与对白更新

新增 `emotional-dialogue`，默认用于剧本、分镜规划、镜头细化、表演与最终视频提示词。规则要求人物有不同的目标、对白发生双向回应、转折有具体触发，并区分人物知情范围与创作资料。款项和道具转移要核对方向；理解别人不能自动抹去原有伤害。

规划输出 `performance_beats: [{name, acting}]`；常用快速流程按人物名映射到 `actingNotes`，并在 `continuityJson` 中保存，避免所有角色使用同一情绪模板。缺失时只保留原文与行动结果，不凭空补哭泣。继续采用并行分场与分批细化，不另加逐镜模型往返。

参考：[huobao 剧本改写](https://github.com/chatfire-AI/huobao-drama/blob/master/backend/workspace/skills/script-rewriter/SKILL.md)、[DirectorSKILL 声音与对白](https://github.com/wuwangzhang1216/DirectorSKILL/blob/main/references/sound-and-dialogue.md)、[WGA East 编剧访谈](https://www.wgaeast.org/onwriting/kenneth-lonergan-manchester-by-the-sea/)。规则只是审阅依据，不构成自动情感验收或观众反应保证。

实际运行兼容性：导演资源读取显式绑定应用类加载器，避免 Spring Boot 打包后异步线程上下文类加载器无法找到 skill。资产面板直接生成前先保存当前描述，确保编辑后实际使用新提示词。

分镜重试以文字设定签名识别版本，图片完成与选择不使已完成的文字规划失效。未通过场次保留草稿，下次从草稿修订。场次预算仍严格校验，错误显示可用整数范围；不靠拉长空镜通过检查。
