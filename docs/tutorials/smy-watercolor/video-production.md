# 水墨淡彩录屏教程制作说明

本教程实际录制运行中的工作台，包含鼠标指示、菜单展开、步骤切换、角色档案、声音资料、分镜与合成区。开场和片尾介绍使用本地样片页面；完整样片在讲解后单独接入，保留原对白和水声。不是将教程截图做成幻灯片。

录制已有《小蝌蚪找妈妈》项目，生成、保存等生产按钮仅指示位置。浏览器拦截业务接口写请求，并在前后回读同一项目核对一致性。没有重做角色图片、镜头视频或角色样音。讲解使用单独制作的普通话合成声音 `zh-CN-YunxiNeural`，字幕按讲解音频时间戳对齐，完整样片不覆盖讲解字幕。

输出位于 `output/smy-tutorial-video/`：`raw/` 为章节原始浏览器录像与取段时间，`voice/` 为配音及句子时间戳，`clips/` 为带字幕章节，另有最终视频、字幕、网页播放器和发布 ZIP。播放器可按章节跳转。

本次交付为 5 分 52 秒、1920×1080、30 帧，含 10 个讲解章节与完整样片章节。75 条字幕已处理相邻时间戳重叠。最终文件完整解码、章节播放、手机页面排版与 ZIP 检查通过；原项目回读一致。推文发布页另提供教程入口，综合发布包内也已加入教程视频与字幕。

相关脚本保存在本目录，需 Python、Playwright Chromium、edge-tts、FFmpeg 和 ffprobe；录屏还依赖本机现有 `output/tutorial-video/browser_setup.py` 的已登录会话适配器，不在发布包内传播凭据。换机器需提供对应登录适配器。前端与后台须已经运行。命令在仓库根目录执行：

```bash
python docs/tutorials/smy-watercolor/narrate_video.py
python docs/tutorials/smy-watercolor/record_video.py
python docs/tutorials/smy-watercolor/render_video.py --final
python docs/tutorials/smy-watercolor/package_video.py
python docs/tutorials/smy-watercolor/build_publication.py
```

配音服务中断时可重跑第一条命令，已有完整音频保留；其他脚本也保留已完成章节，重新录制特定章前须备份后移走对应缓存。最终核对分辨率、时长、章节数、音频轨与完整解码，并检查章节画面、字幕和网页播放。技术验证不等于人工试听认可。
