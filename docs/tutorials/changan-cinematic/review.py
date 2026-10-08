"""Publication UI checks and representative encoded-frame inspection aids.

No project API access, project writes, media generation, or external publishing.
"""
import argparse, hashlib, json, re, subprocess, sys, zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

SRC=Path(__file__).resolve().parent
ROOT=SRC.parents[2]
OUT=ROOT/'output/changan-cinematic-tutorial'
REVIEW=OUT/'review'
REVIEW.mkdir(exist_ok=True)
sys.stdout.reconfigure(encoding='utf-8')

def save(name,data):
 (REVIEW/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n','utf-8')

def page_check(final=False):
 url='http://127.0.0.1:5173/output/changan-cinematic-tutorial/index.html'
 errors=[];results={}
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  context=browser.new_context(viewport={'width':1440,'height':1080},accept_downloads=True)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url,wait_until='networkidle');page.locator('#article img').last.wait_for()
  assert page.locator('#article img').count()==14
  assert page.locator('#article img').evaluate_all('(images)=>images.every(x=>x.complete&&x.naturalWidth>0)')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(REVIEW/'publication-desktop.jpg'),type='jpeg',quality=95)
  page.locator('#article').scroll_into_view_if_needed()
  page.screenshot(path=str(REVIEW/'article-desktop.jpg'),type='jpeg',quality=95)
  page.locator('#select').click()
  selection=page.evaluate('getSelection().toString()')
  assert '低成本的 Seedance 2.0 Mini' in selection and '至少从 Seedance 2.5 起步' in selection
  page.evaluate('getSelection().removeAllRanges()')
  with page.expect_download() as pending:page.locator('#export').click()
  download=pending.value;exported=REVIEW/'exported-article.html';download.save_as(str(exported))
  exported_text=exported.read_text('utf-8')
  assert exported_text.count('data:image/jpeg;base64,')==14
  assert '#195beb' in exported_text
  page.locator('#article img').first.click()
  assert page.locator('#viewer').evaluate('(x)=>x.open')
  page.locator('#closeViewer').click()
  assert not page.locator('#viewer').evaluate('(x)=>x.open')
  page.locator('#videoTab').click()
  assert page.locator('#lesson').is_visible() and not page.locator('#article').is_visible()
  assert page.locator('#chapters button').count()==12
  if final:
   page.locator('#lessonVideo').evaluate('v=>new Promise((resolve,reject)=>{if(v.readyState>=1)return resolve();v.addEventListener("loadedmetadata",resolve,{once:true});v.addEventListener("error",()=>reject(new Error("Video failed")),{once:true});})')
   meta=page.locator('#lessonVideo').evaluate('(v)=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,readyState:v.readyState,error:v.error&&v.error.message})')
   assert (meta['width'],meta['height'])==(1920,1080) and meta['duration']>350,meta
   page.locator('#chapters button').nth(4).click()
   page.wait_for_timeout(1000)
   actual_time=page.locator('#lessonVideo').evaluate('v=>{v.pause();return v.currentTime}')
   timeline=json.loads((OUT/'timeline.json').read_text('utf-8'))
   assert abs(actual_time-timeline[4]['start'])<3
   page.screenshot(path=str(REVIEW/'video-desktop.jpg'),type='jpeg',quality=95)
   results['videoMetadata']=meta
   results['modelChapterSeekSeconds']=actual_time
  page.locator('#articleTab').click()
  assert page.locator('#article').is_visible()
  results['desktop']={'viewport':[1440,1080],'noHorizontalOverflow':True,'imagesLoaded':14,'selectionPassed':True,'htmlExportPassed':True,'imageZoomPassed':True,'tabSwitchingPassed':True,'chapterButtons':12}
  mobile_context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,device_scale_factor=1)
  mobile=mobile_context.new_page();mobile.goto(url,wait_until='networkidle')
  assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
  mobile.screenshot(path=str(REVIEW/'publication-mobile.png'))
  mobile.locator('#article').scroll_into_view_if_needed()
  mobile.screenshot(path=str(REVIEW/'article-mobile.png'))
  mobile.locator('#videoTab').click()
  assert mobile.locator('#lesson').is_visible()
  assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
  results['mobile']={'viewport':[390,844],'noHorizontalOverflow':True,'articleAndVideoLayoutPassed':True}
  mobile_context.close();context.close();browser.close()
 assert not errors,errors
 results['javascriptErrors']=errors;results['finalVideoChecked']=final
 save('publication-ui-check.json',results)
 print(json.dumps(results,ensure_ascii=False))

def frames():
 rows=json.loads((OUT/'timeline.json').read_text('utf-8'))
 video=OUT/'从Mini动画到电影感短剧-白蓝视频教学.mp4'
 font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',22)
 sheet=Image.new('RGB',(1920,1800),'#edf4ff');d=ImageDraw.Draw(sheet)
 samples=[]
 for i,row in enumerate(rows):
  offset=min(11,row['duration']/2)
  if i==7:offset=7  # while the original shot is playing
  at=row['start']+offset;dest=REVIEW/f'encoded-{i:02d}.jpg'
  subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(at),'-i',str(video),'-frames:v','1','-q:v','2',str(dest)],check=True)
  image=Image.open(dest);assert image.size==(1920,1080)
  x=(i%3)*640;y=(i//3)*450
  sheet.paste(image.resize((620,349),Image.Resampling.LANCZOS),(x+10,y+10))
  d.text((x+12,y+371),f'{i+1:02d}  {row["title"]}',font=font,fill='#18315d')
  d.text((x+12,y+407),f'{at:.3f}s',font=font,fill='#195beb')
  samples.append({'chapter':i,'title':row['title'],'seconds':at,'frame':str(dest)})
 sheet.save(REVIEW/'encoded-contact-sheet.jpg',quality=95)
 save('encoded-frame-samples.json',samples)
 print('Extracted 12 representative encoded frames.')

def narration():
 rows=json.loads((OUT/'narration.json').read_text('utf-8'));results=[]
 normalize=lambda x:re.sub(r'[^\w\u4e00-\u9fff]','',x)
 for row in rows:
  cues=json.loads((OUT/'voice'/f'{row["id"]}.json').read_text('utf-8'))
  text=''.join(c['text'] for c in cues)
  assert normalize(text)==normalize(row['text']),row['id']
  assert all(c['duration']>0 for c in cues)
  end=max((c['offset']+c['duration'])/1e7 for c in cues)
  assert end<=row['duration']+.1,(row['id'],end,row['duration'])
  results.append({'chapter':row['id'],'scriptCoverageExactAfterPunctuationNormalization':True,'boundaryCount':len(cues),'lastBoundaryEnd':end,'audioDuration':row['duration']})
 save('narration-coverage-check.json',{'chapters':results,'scope':'synthesis content and timing metadata; does not certify natural voice or listening approval'})
 print('All 11 narration chapters have complete text and valid boundary timing.')

def direction():
 import produce
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  b,api,ctx,page,blocked=produce.context(browser)
  before=api.call('GET','/short-drama/'+produce.PID)
  produce.ui(page,5,b.BASE)
  produce.point(page,page.get_by_label('视频提示词',exact=True))
  produce.screenshot(page,'10-direction.jpg')
  after=api.call('GET','/short-drama/'+produce.PID)
  unchanged=json.dumps(before,sort_keys=True)==json.dumps(after,sort_keys=True)
  assert unchanged and not blocked
  save('direction-capture-preservation.json',{'projectUnchanged':unchanged,'blockedMutations':blocked})
  ctx.close();browser.close()

def speech():
 from faster_whisper import WhisperModel
 import numpy as np
 model=WhisperModel('small',device='cpu',compute_type='int8',local_files_only=True,cpu_threads=4)
 results=[]
 for i in [0,4]:
  pcm=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(OUT/'voice'/f'{i:02d}.mp3'),'-f','f32le','-ar','16000','-ac','1','-'])
  audio=np.frombuffer(pcm,dtype=np.float32)
  segments,info=model.transcribe(audio,language='zh',vad_filter=True)
  segments=list(segments);text=''.join(s.text for s in segments)
  results.append({'chapter':i,'language':info.language,'languageProbability':info.language_probability,'text':text,'segments':[{'start':s.start,'end':s.end,'text':s.text} for s in segments]})
  print(json.dumps({'chapter':i,'text':text},ensure_ascii=False),flush=True)
 save('speech-content-sample.json',{'samples':results,'scope':'automatic transcription of opening and model chapter; content check only, not human listening or naturalness approval'})

def editorial():
 article=(SRC/'article.md').read_text('utf-8')
 plain=re.sub(r'!\[[^\]]*\]\([^)]*\)','',article)
 plain=re.sub(r'\[([^\]]*)\]\([^)]*\)',r'\1',plain)
 banned=['说白了','意味着什么','这意味着','本质上','换句话说','不可否认','综上所述','总的来说','值得注意的是','不难发现','让我们来看看','接下来让我们','在当今','随着','：','——','"','“','”','AI工具','某个模型','相关技术']
 hits=[x for x in banned if x in plain]
 assert not hits,hits
 assert not re.search(r'首先[\s\S]*其次[\s\S]*最后',plain)
 bullet_count=len(re.findall(r'^\s*[-*+] ',plain,flags=re.M));assert bullet_count==0
 headings=len(re.findall(r'^#+ ',plain,flags=re.M));assert headings==1
 expressions=[s for s in ['那如果','可以','先看','有个选择','我想','说清楚','你大概','比如','到底','这样','还有','所以','这次'] if s in plain]
 assert len(expressions)>=8
 facts={'forbiddenWordAndPunctuationHits':hits,'bulletParagraphCount':bullet_count,'headingCount':headings,'conversationalExpressions':expressions,'articleImages':len(re.findall(r'^!\[',article,flags=re.M)),'chineseCharacterCount':len(re.findall(r'[\u4e00-\u9fff]',article))}
 save('article-editorial-check.json',facts)
 report='''# 推文与视频教学质检报告

**L1 硬性规则通过**

- 禁用词、禁用标点、结构套话、空泛工具名零命中，修订后重新扫描。
- 正文只有一个文章标题，没有小标题或连续条目；模型、项目与后期工具采用具体名称。
- 推文配14张实际图片，公众号过滤内嵌图片时可按编号上传。

**L2 风格一致性通过**

- 开头从低成本Mini 2.0动画转向精细古装短剧，按用户指定问题展开。
- 长短段落交替，关键句独立成段，使用疑问句转向；按故事、角色、空间、镜头、审片、后期推进。
- 口语化表达超过8种，重复强调至少Seedance 2.5，坦承实际节奏反馈。口语化四项中的前三项通过，情绪符号没有刻意添加。
- 标点禁令二次扫描通过。

**L3 内容质量通过**

- 观点有当前任务回执、成片实帧、工作台截图和第9镜修正案例支撑。18场、48段、720p、206条字幕、6位题签和1.024秒调整均来自现有制作记录。
- 知识顺着实际制作经验展开，具体到角色衣装、道具持握、摄影机位、动作反应与声源。
- 文化升维与多个产品横向比较不适用于本次实操文章，没有附会历史或编造模型排行榜。
- 理解读者先从低成本动画试起的需求；至少2.5作为本案例制作选择，保留故事节奏仍需审阅的实际反馈。
- 类型专项通过，操作环节与失败后的局部修正都有可执行说明。工作台合成入口与实际FFmpeg后期明确区分。

**L4 叙述终审通过**

- 温度来自实际反馈与修正，不编造震撼体验、观众赞誉或本人身份。
- 第9镜的铺内朝街机位、字幕前移和古风题签修订体现本例的具体经历。
- 语气为制作经验交流，没有借原作者身份代言，也没有把电影感方向写成整片电影质量认证。
- 通读后故事与制作主线连贯，场景和人物名称一致，图文位置对应。

**总评**

四层推文编辑检查通过。以上是文章质量检查，与整部影片的动作、口型、自然声音和剧情节奏验收分别记录。

视频技术、发布页交互与抽帧检查见verification.json和review目录中的原始记录。教程普通话为合成声音；语音识别仅用于开头和模型章节的内容抽查，不作为自然声音或完整人工试听的结论。原影片的「剧情太快，没看懂」反馈仍保留。
'''
 (OUT/'质检报告.md').write_text(report,'utf-8')
 print(json.dumps(facts,ensure_ascii=False))

def finalize():
 import produce
 read=lambda p:json.loads(p.read_text('utf-8'))
 proof=read(OUT/'verification.json');page=read(REVIEW/'publication-ui-check.json')
 coverage=read(REVIEW/'narration-coverage-check.json');editorial=read(REVIEW/'article-editorial-check.json')
 manual=read(REVIEW/'manual-frame-review.json')
 assert proof['sha256']==hashlib.file_digest(produce.VIDEO.open('rb'),'sha256').hexdigest()
 assert page['finalVideoChecked'] and not page['javascriptErrors']
 assert manual['representativeFramesReviewed']==12 and manual['frameLayoutPassed']
 assert len(coverage['chapters'])==11 and all(x['scriptCoverageExactAfterPunctuationNormalization'] for x in coverage['chapters'])
 assert not editorial['forbiddenWordAndPunctuationHits']
 proof.update({'publicationUiChecks':page,'narrationTextCoverageExact':True,'representativeFrameVisualReview':manual,'articleEditorialLevelsPassed':['L1','L2','L3','L4'],'visualReviewComplete':True,'visualReviewScope':'publication desktop/mobile layout and 12 representative encoded chapter frames, plus selected original-resolution frames','fullVideoHumanMotionReviewApproved':False,'subtitleCueCount':len(re.findall(r'^\d+$',(OUT/'字幕.srt').read_text('utf-8'),flags=re.M))})
 (OUT/'verification.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n','utf-8')
 report=OUT/'质检报告.md'
 report.write_text(report.read_text('utf-8')+f'\n技术验收结果\n\n最终教程{proof["duration"]:.3f}秒，1920×1080，30帧，12章，48kHz立体声AAC。完整声画解码通过，字幕{proof["subtitleCueCount"]}条。发布页桌面与手机交互、视频播放和章节定位通过。抽看12章编码实帧并重点查看模型、导演稿、题签和成片片段的原尺寸画面，未见布局遮挡或字幕截断。以上不代表整片运动、口型或完整人工试听通过。项目数据保持不变，本次教学未提交新的付费项目媒体任务。\n','utf-8')
 produce.package()
 archive=OUT/'推文与视频教学-白蓝发布包.zip'
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  assert not any('private' in x or x.endswith('.webm') or 'voice/' in x for x in z.namelist())
  members=len(z.namelist())
 result={'videoDurationSeconds':proof['duration'],'videoMegabytes':round(produce.VIDEO.stat().st_size/1024/1024,2),'zipMegabytes':round(archive.stat().st_size/1024/1024,2),'zipMembers':members,'zipIntegrityPassed':True,'videoSha256':proof['sha256']}
 save('final-delivery-check.json',result);print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('action',choices=['preview','final','frames','narration','direction','speech','editorial','finalize']);a=p.parse_args()
 if a.action in ['preview','final']:page_check(a.action=='final')
 elif a.action=='frames':frames()
 elif a.action=='direction':direction()
 elif a.action=='speech':speech()
 elif a.action=='editorial':editorial()
 elif a.action=='finalize':finalize()
 else:narration()
