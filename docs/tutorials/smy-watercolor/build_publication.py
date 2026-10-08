"""Build an offline article/tutorial package from reviewed Markdown and existing media.

python docs/tutorials/smy-watercolor/build_publication.py
No model calls, credentials, project writes or dependency installation.
"""
from pathlib import Path
import base64,html,json,re,shutil,zipfile

SOURCE=Path(__file__).resolve().parent
ROOT=SOURCE.parents[2]
OUT=ROOT/'output/smy-article'
OUT.mkdir(parents=True,exist_ok=True)

def inline(text):
 text=html.escape(text)
 text=re.sub(r'`([^`]+)`',r'<code style="background:#f1f0e9;padding:2px 5px;border-radius:3px;">\1</code>',text)
 def link(m):
  label,url=m.groups()
  if url in ('article.md','tutorial.md'):url='#'+url.split('.')[0]
  elif not re.match(r'https?://',url):
   resolved=(SOURCE/url).resolve()
   url='https://github.com/ageerle/ruoyi-drama/blob/main/'+resolved.relative_to(ROOT).as_posix()
  return f'<a href="{url}" style="color:#476b54;text-decoration:underline;">{label}</a>'
 return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,text)

def render(name):
 lines=(SOURCE/name).read_text(encoding='utf-8').splitlines()
 result=[];paragraph=[];code=None
 def flush():
  if paragraph:
   result.append('<p style="margin:19px 0;font-size:16px;line-height:1.95;color:#333a35;">'+inline(' '.join(paragraph))+'</p>');paragraph.clear()
 for line in lines:
  if line.startswith('```'):
   flush()
   if code is None:code=[]
   else:
    result.append('<pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f3ed;border:1px solid #e1e0d6;padding:20px;font-size:14px;line-height:1.85;">'+html.escape('\n'.join(code))+'</pre>');code=None
   continue
  if code is not None:code.append(line);continue
  image=re.fullmatch(r'!\[([^\]]*)\]\(([^)]+)\)',line)
  if image:
   flush();caption,file=image.groups();path=SOURCE/file
   data=base64.b64encode(path.read_bytes()).decode()
   result.append(f'<figure style="margin:30px 0;text-align:center;"><img src="data:image/jpeg;base64,{data}" alt="{html.escape(caption)}" style="width:100%;height:auto;display:block;border:1px solid #e0dfd5;"/><figcaption style="font-size:12px;color:#757b6f;line-height:1.7;margin:10px 0;">{html.escape(caption)}</figcaption></figure>');continue
  if line.startswith('# '):
   flush();result.append('<h1 style="font-size:32px;line-height:1.5;margin:8px 0 30px;color:#293f31;">'+inline(line[2:])+'</h1>');continue
  if line.startswith('## '):
   flush();result.append('<h2 style="font-size:24px;line-height:1.55;margin:44px 0 18px;padding-top:24px;border-top:1px solid #dedfd3;color:#355340;">'+inline(line[3:])+'</h2>');continue
  if line.startswith('- '):
   flush();result.append('<p style="font-size:15px;line-height:1.8;">· '+inline(line[2:])+'</p>');continue
  if not line.strip():flush()
  else:paragraph.append(line)
 flush()
 if code is not None:raise ValueError('Unclosed code block')
 return '\n'.join(result)

article,guide=render('article.md'),render('tutorial.md')
paper='<section style="max-width:1080px;margin:auto;padding:44px;background:white;font-family:PingFang SC,Microsoft YaHei,sans-serif;">'
for filename,body in [('推文正文.html',article),('教程正文.html',guide)]:
 (OUT/filename).write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+paper+body+'</section></html>',encoding='utf-8')
shell='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>纸白与墨色 · 上美影水墨动画制作</title>
<style>*{box-sizing:border-box}body{margin:0;background:#eeece3;color:#303e33;font-family:PingFang SC,Microsoft YaHei,sans-serif}.bar{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 5vw;background:#f8f7efed;border-bottom:1px solid #d7d8ca;backdrop-filter:blur(12px)}button{padding:10px 16px;background:#fffef8;border:1px solid #cbd0bf;border-radius:7px;color:#35543d;cursor:pointer;font-size:14px}button.primary{background:#35543d;color:#fff}.buttons{display:flex;gap:8px;flex-wrap:wrap}.intro,.content{max-width:1080px;margin:30px auto;background:#fffdf7;padding:42px 56px;border:1px solid #dedfcf}.eyebrow{font-size:12px;letter-spacing:3px;color:#817757}.intro h1{font-family:STKaiti,KaiTi,serif;font-weight:400;font-size:48px;margin:20px 0}.intro p{line-height:1.9;color:#667060}.palette{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0}.chip{flex:1;min-width:120px;font-size:12px;color:#5b6557}.chip i{display:block;height:26px;margin-bottom:8px;border:1px solid #d4d5c9}video{width:100%;aspect-ratio:16/9;background:#ede9dd;display:block}.caption{font-size:12px;line-height:1.8;color:#6c7568}.tabs{display:flex;gap:10px;margin:28px 0 12px}.tabs button[aria-selected=true]{background:#35543d;color:white}.content{background:white}.content[hidden]{display:none}.content img{cursor:zoom-in}.status{font-size:13px;color:#476b54;min-height:20px;line-height:1.6}dialog{border:0;padding:18px;background:#faf9f3;max-width:98vw;max-height:96vh}dialog::backdrop{background:#142519dd}dialog img{display:block;max-width:94vw;max-height:86vh;object-fit:contain}dialog button{display:block;margin:0 0 12px auto}@media(max-width:700px){.bar{align-items:flex-start;flex-direction:column;padding:12px 16px}.intro,.content{margin:16px 10px;padding:24px 20px}.intro h1{font-size:34px}.content h1{font-size:27px!important}.chip{min-width:80px}}@media print{.bar,.intro,dialog{display:none}.content{border:0;margin:0;padding:0}}</style></head><body>
<header class="bar"><strong>上美影水墨动画 · 推文与教程</strong><div class="buttons"><button class="primary" id="copy">复制当前富文本</button><button id="select">选中正文</button><button id="export">下载当前正文</button></div></header>
<section class="intro"><div class="eyebrow">RUOYI DRAMA / 制作记录</div><h1>把荷塘留白，把故事讲清</h1><p>《小蝌蚪找妈妈》 · 上美影水墨淡彩 · 57 秒对白样片<br>从一段样片，走到可继续编辑的项目。下面是审美观察和完整工作台教程。</p>
<video controls preload="metadata" poster="images/16-荷叶上的妈妈.jpg" src="sample.mp4"></video><p class="caption">现有成片。导出 1080p / 30 帧，生成原片 720p / 24 帧，合成规格不增加原生细节。部分画面保留生成的小红印章。</p>
<div class="palette"><div class="chip"><i style="background:#252824"></i>墨黑</div><div class="chip"><i style="background:#889085"></i>淡墨</div><div class="chip"><i style="background:#748772"></i>荷叶绿</div><div class="chip"><i style="background:#eeeade"></i>宣纸白</div><div class="chip"><i style="background:#c39068"></i>浅赭</div></div><p class="caption">色块是本剧色盘的阅读示意，不是逐像素采样值。水墨分支保留浓淡变化。</p>
<div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-tab="article">推文 · 审美与制作</button><button role="tab" aria-selected="false" data-tab="tutorial">教程 · 完整操作流程</button></div><p class="caption">点击正文图片查看原图。复制只包含当前正文，不带工具栏、播放器和配色示意；平台过滤图片时，用发布包中的编号原图补上。</p><div class="status" id="status" role="status"></div></section>
<article class="content" id="article">ARTICLE_BODY</article><article class="content" id="tutorial" hidden>GUIDE_BODY</article>
<dialog id="viewer"><button id="closeViewer">关闭原图</button><img id="original" alt="原图预览"></dialog>
<script>let current='article';const status=document.querySelector('#status');function active(){return document.getElementById(current)}function choose(id){current=id;document.querySelectorAll('.content').forEach(x=>x.hidden=x.id!==id);document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-selected',x.dataset.tab===id));status.textContent=''}document.querySelectorAll('[data-tab]').forEach(x=>x.onclick=()=>choose(x.dataset.tab));document.querySelectorAll('a[href="#article"],a[href="#tutorial"]').forEach(x=>x.onclick=e=>{e.preventDefault();choose(x.hash.slice(1));active().scrollIntoView()});function select(){const r=document.createRange();r.selectNodeContents(active());const s=window.getSelection();s.removeAllRanges();s.addRange(r)}function rich(){return '<section style="font-family:PingFang SC,Microsoft YaHei,sans-serif;background:white;color:#333a35;">'+active().innerHTML+'</section>'}document.querySelector('#select').onclick=()=>{select();status.textContent='正文已选中，按 Ctrl+C / Command+C 复制。'};document.querySelector('#copy').onclick=async()=>{try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([rich()],{type:'text/html'}),'text/plain':new Blob([active().innerText],{type:'text/plain'})})]);status.textContent='已复制当前富文本。'}catch(e){select();const listener=e=>{e.clipboardData.setData('text/html',rich());e.clipboardData.setData('text/plain',active().innerText);e.preventDefault()};document.addEventListener('copy',listener);let ok=false;try{ok=document.execCommand('copy')}catch(e){}document.removeEventListener('copy',listener);status.textContent=ok?'已复制当前富文本。':'正文已选中，请按 Ctrl+C / Command+C 复制。'}};document.querySelector('#export').onclick=()=>{const blob=new Blob(['<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+rich()+'</html>'],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=current==='article'?'上美影水墨-推文正文.html':'上美影水墨-教程正文.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};document.querySelectorAll('.content img').forEach(x=>x.onclick=()=>{document.querySelector('#original').src=x.src;document.querySelector('#viewer').showModal()});document.querySelector('#closeViewer').onclick=()=>document.querySelector('#viewer').close();</script></body></html>'''
video_dir=ROOT/'output/smy-tutorial-video'
recorded=video_dir/'上美影水墨淡彩-录屏教程与样片.mp4'
if recorded.exists():
 shell=shell.replace('<div class="palette">','<p><a href="video-tutorial.html" style="color:#35543d;font-weight:bold">观看完整录屏教程 · 普通话讲解与字幕</a></p><div class="palette">',1)
 shutil.copy2(recorded,OUT/'tutorial-video.mp4')
 for src,dest in [('字幕.srt','tutorial-subtitles.srt'),('讲解稿.md','video-narration.md'),('poster.jpg','tutorial-poster.jpg')]:
  shutil.copy2(video_dir/src,OUT/dest)
 player=(video_dir/'index.html').read_text(encoding='utf-8').replace(recorded.name,'tutorial-video.mp4').replace('字幕.srt','tutorial-subtitles.srt').replace('讲解稿.md','video-narration.md').replace('poster.jpg','tutorial-poster.jpg')
 (OUT/'video-tutorial.html').write_text(player,encoding='utf-8')
(OUT/'index.html').write_text(shell.replace('ARTICLE_BODY',article).replace('GUIDE_BODY',guide),encoding='utf-8')
shutil.copytree(SOURCE/'images',OUT/'images',dirs_exist_ok=True)
for name in ('article.md','tutorial.md'):shutil.copy2(SOURCE/name,OUT/name)
sample=ROOT/'output/tadpoles-smy-20261003/minute-v3/小蝌蚪找妈妈-上美影水墨-一分钟对白样片.mp4'
if sample.exists():shutil.copy2(sample,OUT/'sample.mp4')
(OUT/'使用说明.txt').write_text('打开 index.html，切换推文/教程，可复制富文本、下载正文、点击图片看原图。\n主页播放器为已生成的57秒样片，复制正文不包含播放器。\n如已构建录屏教程，通过主页的观看完整录屏教程链接进入 video-tutorial.html。\n若发布平台过滤内嵌图片，按 images 中编号补传。\n所有工作台截图均为1920×1080完整页面；成片实帧导出尺寸同为1920×1080，来自720p原片合成。\n源码正文和构建器在 docs/tutorials/smy-watercolor/，本包不含密钥、原始接口回执和运行数据。\n',encoding='utf-8')
with zipfile.ZipFile(OUT/'上美影水墨动画-推文与教程发布包.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ('index.html','推文正文.html','教程正文.html','article.md','tutorial.md','使用说明.txt','sample.mp4','video-tutorial.html','tutorial-video.mp4','tutorial-subtitles.srt','tutorial-poster.jpg','video-narration.md'):
  if (OUT/name).exists():z.write(OUT/name,name)
 for file in sorted((OUT/'images').glob('*.jpg')):z.write(file,'images/'+file.name)
print(json.dumps({'html':str(OUT/'index.html'),'images':len(list((OUT/'images').glob('*.jpg'))),'package':str(OUT/'上美影水墨动画-推文与教程发布包.zip')},ensure_ascii=False))
