"""Append approved sample with its original audio; package and verify tutorial."""
import json,subprocess,zipfile,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parents[2]
OUT=ROOT/'output/smy-tutorial-video'
rows=json.loads((OUT/'narration.json').read_text(encoding='utf-8'))
sample=ROOT/'output/smy-article/sample.mp4'
def run(args):subprocess.run(args,check=True)
def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-show_streams','-show_chapters','-of','json',str(path)]))
base=OUT/'上美影水墨淡彩-操作教程.mp4'
if not (OUT/'clips/sample.mp4').exists():
 run(['ffmpeg','-y','-v','error','-i',str(sample),'-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','fast','-crf','18','-threads','4','-c:a','aac','-b:a','192k','-ar','48000','-ac','2',str(OUT/'clips/sample.mp4')])
(OUT/'clips/final-concat.txt').write_text("file '../上美影水墨淡彩-操作教程.mp4'\nfile 'sample.mp4'\n",encoding='utf-8')
cursor=sum(r['duration']+1 for r in rows)
chapters=(OUT/'chapters.txt').read_text(encoding='utf-8')+f'[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(cursor*1000)}\nEND={round((cursor+57)*1000)}\ntitle=完整样片：原对白与水声\n'
(OUT/'final-chapters.txt').write_text(chapters,encoding='utf-8')
target=OUT/'上美影水墨淡彩-录屏教程与样片.mp4'
run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(OUT/'clips/final-concat.txt'),'-i',str(OUT/'final-chapters.txt'),'-map_metadata','1','-map_chapters','1','-c','copy','-movflags','+faststart',str(target)])
p=probe(target);v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio')
assert (v['width'],v['height'])==(1920,1080)
assert len(p['chapters'])==11
assert abs(float(p['format']['duration'])-cursor-57)<1
run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'])
run(['ffmpeg','-y','-v','error','-ss','18','-i',str(target),'-frames:v','1',str(OUT/'poster.jpg')])
timeline=[];t=0
for r in rows:timeline.append({'title':r['title'],'start':t});t+=r['duration']+1
timeline.append({'title':'完整样片：原对白与水声','start':t})
(OUT/'剪辑安排.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2),encoding='utf-8')
html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>上美影水墨淡彩录屏教程</title><style>*{box-sizing:border-box}body{background:#eeeee4;color:#2e4536;font:16px/1.8 "Microsoft YaHei",sans-serif;margin:0}main{max-width:1280px;padding:32px 24px;margin:auto}h1{font:36px/1.5 KaiTi,serif}video{width:100%;aspect-ratio:16/9;background:#151c16;border-radius:12px}a{color:#375c45}.chapters{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:22px 0}button{background:#fafaf5;border:1px solid #c4cebf;border-radius:8px;padding:12px;text-align:left;color:#35543d;cursor:pointer}span{margin-right:12px}p{color:#596b5d}</style><main><h1>把荷塘留白，把故事讲清</h1><p>实际工作台录屏 · 普通话合成讲解 · 中文字幕 · 1080p / 30 帧<br>讲解后播放现有57秒样片，保留原对白与水声。</p><p><a href="上美影水墨淡彩-录屏教程与样片.mp4" download>下载教程视频</a> · <a href="字幕.srt" download>下载字幕</a> · <a href="讲解稿.md">查看讲解稿</a></p><video id="video" src="上美影水墨淡彩-录屏教程与样片.mp4" poster="poster.jpg" controls preload="metadata"></video><div class="chapters" id="chapters"></div><p>展示已完成项目的查看、切换与审阅操作；生成、保存与下载按钮以指示演示，没有重新提交生产任务。讲解配音单独制作。原始录屏和项目前后核对记录保存在本地。</p></main><script>const chapters=CHAPTERS;const video=document.querySelector('#video');for(const c of chapters){const b=document.createElement('button');const t=document.createElement('span');t.textContent=String(Math.floor(c.start/60)).padStart(2,'0')+':'+String(Math.floor(c.start%60)).padStart(2,'0');b.append(t,document.createTextNode(c.title));b.onclick=()=>{video.currentTime=c.start;video.play()};document.querySelector('#chapters').append(b)}</script></html>'''
(OUT/'index.html').write_text(html.replace('CHAPTERS',json.dumps(timeline,ensure_ascii=False)),encoding='utf-8')
(OUT/'verification-final.json').write_text(json.dumps({'duration':float(p['format']['duration']),'resolution':[v['width'],v['height']],'fps':v['r_frame_rate'],'chapterCount':len(p['chapters']),'audioCodec':a['codec_name'],'fullDecodePassed':True,'capture':'actual browser recording','narration':'zh-CN-YunxiNeural synthetic narration','sampleAudio':'existing approved sample audio','productionMediaRegenerated':False},ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(OUT/'上美影水墨淡彩-视频教程发布包.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ('index.html',target.name,'字幕.srt','讲解稿.md','poster.jpg','剪辑安排.json'):z.write(OUT/name,name)
print(json.dumps({'video':str(target),'duration':p['format']['duration']},ensure_ascii=False))
