"""Read-only case recording and local publication. No paid project-media requests.

Run one stage at a time: prepare, voice, capture, record, render, publish, check.
"""
import argparse, asyncio, base64, hashlib, html, json, math, re, shutil, subprocess, sys, time, zipfile
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from PIL import Image, ImageDraw, ImageFont

SRC=Path(__file__).resolve().parent
ROOT=SRC.parents[2]
OUT=ROOT/'output/changan-cinematic-tutorial'
IMAGES=SRC/'images'
CASE=ROOT/'output/changan-replica-20261003/production'
PID='2106381114532110337'
BLUE='#195beb'; INK='#18315d'; PALE='#edf4ff'
VIDEO=OUT/'从Mini动画到电影感短剧-白蓝视频教学.mp4'
sys.stdout.reconfigure(encoding='utf-8')

def read(path):return json.loads(Path(path).read_text('utf-8-sig'))
def save(path,data):Path(path).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n','utf-8')
def sha(path):return hashlib.file_digest(Path(path).open('rb'),'sha256').hexdigest()
def run(args,log='production.log'):
 with (OUT/log).open('ab') as f:subprocess.run(args,check=True,stdout=f,stderr=f)
def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-show_chapters','-of','json',str(path)]))
def sections():
 return [{'id':f'{i:02d}','title':s.split('\n',1)[0].strip()[3:],'text':s.split('\n',1)[1].strip()} for i,s in enumerate(re.split(r'^## ',(SRC/'video-narration.md').read_text('utf-8'),flags=re.M)[1:])]
def font(size,bold=False):return ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc' if bold else 'C:/Windows/Fonts/msyh.ttc',size)
def capture_frame(source,t,dest):
 if not Path(dest).exists():run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(t),'-i',str(source),'-frames:v','1','-q:v','2',str(dest)])
def prepare():
 OUT.mkdir(exist_ok=True,parents=True);IMAGES.mkdir(exist_ok=True,parents=True)
 for folder in ['voice','raw','clips','frames','review']:(OUT/folder).mkdir(exist_ok=True)
 latest=read(CASE/'latest-deliverable.json');records=read(CASE/'refine-ui-shot009-v2/selected-48-videos.json')
 assert len(records)==48 and all(x['model']=='bytedance/seedance-2.5/reference-to-video' for x in records)
 for x in records:assert sha(x['file'])==x['fileSha256']
 raw=Path(latest['subtitledVideo'])
 capture_frame(raw,7.9,IMAGES/'01-film-banquet.jpg')
 capture_frame(raw,125.632,IMAGES/'02-film-butcher.jpg')
 capture_frame(records[39]['file'],4.5,IMAGES/'03-film-carriage.jpg')
 capture_frame(raw,7.9,IMAGES/'14-nameplate.jpg')
 old=CASE/'redo-25-20261004/changan-48shots-all25-character-cards-large-subtitles-720p.mp4'
 capture_frame(old,119.5,OUT/'shot9-old.jpg')
 capture_frame(raw,119.5,OUT/'shot9-new.jpg')
 canvas=Image.new('RGB',(1920,1080),'white');d=ImageDraw.Draw(canvas)
 d.rectangle((0,0,1920,12),fill=BLUE);d.text((64,52),'第9镜  ·  机位与空间修正',font=font(46,True),fill=INK)
 d.text((66,130),'旧版 / 门口机位',font=font(28),fill='#657897');d.text((996,130),'新版 / 铺内朝街',font=font(28),fill=BLUE)
 for name,x in [('shot9-old.jpg',64),('shot9-new.jpg',996)]:
  im=Image.open(OUT/name).resize((860,484),Image.Resampling.LANCZOS);canvas.paste(im,(x,188))
 d.text((64,716),'检查中央通道、两侧肉案、人物朝向与刀手间距',font=font(34,True),fill=INK)
 d.text((64,794),'只替换第9镜  ·  Seedance 2.5 / 720p  ·  旧视频保留',font=font(28),fill='#617591')
 d.text((64,992),'RUOYI DRAMA   /   参考 Rick《长安异闻录》· LibTV',font=font(22),fill=BLUE)
 canvas.save(IMAGES/'12-shot9-comparison.jpg',quality=95)
 shutil.copy2(CASE/'refine-ui-shot009-v2/vertical-nameplate-ui-v2.png',OUT/'nameplate.png')
 save(OUT/'case-evidence.json',{'projectId':PID,'sourceTitle':'Rick《长安异闻录》第一卷·算命','sourceUrl':'https://www.liblib.tv/detail/6bc8b8d159d04627a881c39bfa58a5fb','sceneCount':18,'generatedSegments':48,'allSelectedModels':'bytedance/seedance-2.5/reference-to-video','filmResolution':[1280,720],'filmDuration':latest['duration'],'filmSha256':sha(raw),'subtitleCues':206,'dialogueFontSize':46,'characterCardCount':6,'replacementShot':9,'replacementStartSeconds':118.56,'wholeFilmPacingApproved':False,'wholeFilmListeningApproved':False,'paidProjectMediaRegeneratedForTutorial':False})
 make_slides()
 print('Prepared existing film frames, before/after and 48-model evidence.',flush=True)

def make_slides():
 style='''*{box-sizing:border-box}body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#fff;color:#18315d;font-family:"Microsoft YaHei",sans-serif}.rule{height:12px;background:#195beb}.eyebrow{font:22px Consolas,monospace;letter-spacing:4px;color:#195beb}.shell{padding:66px 80px}.title{font:76px/1.32 SimSun,serif;margin:22px 0;font-weight:bold;letter-spacing:-2px}.lede{font-size:31px;line-height:1.8;color:#627591;max-width:760px}.grid{display:grid;grid-template-columns:820px 900px;gap:40px}.film{width:900px;display:block;margin-top:35px;border:1px solid #d9e5fa}.model{display:inline-block;padding:17px 24px;border:1px solid #195beb;color:#195beb;font-size:27px;margin-top:24px}.bottom{position:absolute;bottom:40px;left:80px;right:80px;display:flex;justify-content:space-between;border-top:1px solid #d8e4f6;padding-top:20px;font-size:20px;color:#6a7c98}.strip{display:flex;gap:30px;margin-top:36px}.stat{border-left:3px solid #195beb;padding-left:18px;color:#195beb;font-size:27px}.card-title{font:64px/1.4 SimSun,serif;margin:30px 0}.wide{width:1220px;display:block;margin:30px auto}.pairs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:42px}.note{border-top:2px solid #195beb;padding-top:24px;font-size:32px;line-height:1.8}.large-number{font:160px Consolas;color:#195beb}.profile{height:540px;object-fit:contain;display:block;margin:auto}.claims{font-size:35px;line-height:2;color:#466084}.row{display:flex;gap:70px;align-items:center}.small{font-size:23px;color:#6d7e94;line-height:1.7}'''
 footer='<div class="bottom"><span>RUOYI DRAMA / 电影感短剧制作教学</span><span>参考 Rick《长安异闻录》 · LibTV</span></div>'
 bodies={
 'intro':'<div class="grid"><div><div class="eyebrow">FROM MINI TO CINEMATIC</div><h1 class="title">简单动画之后，<br>电影感短剧<br>能不能做？</h1><p class="lede">可以。用现有《长安异闻录》项目，<br>看一次完整的古装写实制作流程。</p><div class="model">视频模型至少从 Seedance 2.5 起步</div><div class="strip"><div class="stat">18 场</div><div class="stat">48 段</div><div class="stat">720p 影片</div></div></div><div><img class="film" src="images/01-film-banquet.jpg"><img class="film" src="images/02-film-butcher.jpg" style="width:560px;margin-left:340px;margin-top:22px"></div></div>',
 'post':'<div class="eyebrow">09 / POST PRODUCTION</div><h1 class="card-title">让字幕好读，让人物好认。</h1><div class="row"><img src="images/14-nameplate.jpg" style="width:1120px;border:1px solid #d9e5fa"><div><div class="claims">206 条字幕<br>46 号对白字号<br>6 位人物题签</div><p class="small">莲瓣 / 卷草 / 铜钱<br>朱红绳结 / 小印章<br>姓名与身份另行准确排版</p><div class="model">第9镜替换后<br>字幕与题签前移 1.024 秒</div></div></div>',
 'review':'<div class="eyebrow">10 / WATCH & REVIEW</div><h1 class="card-title">画面做细，故事也要讲清。</h1><div class="pairs"><div><div class="large-number">2.5</div><div class="note">本案例的起步选择<br>Seedance 2.5 + 固定资产<br>连续导演稿 + 逐镜播放</div></div><div><div class="note">先做一场有来回的对话<br>核对人物决定、反应和因果<br>再继续整集制作</div><p class="lede" style="margin-top:42px;font-size:30px">这次实际反馈<br>「剧情太快，没看懂」<br>仍作为后续审片重点保留。</p></div></div>',
 'player':'<div class="eyebrow">CASE / ORIGINAL DIALOGUE</div><h1 class="card-title">现有成片片段</h1><video controls muted src="sample.mp4" style="width:1400px;display:block;margin:0 auto;height:787px;object-fit:contain;background:#15213b"></video>'}
 for name,body in bodies.items():
  (OUT/f'slide-{name}.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>'+style+'</style><body><div class="rule"></div><div class="shell">'+body+'</div>'+footer+'</body></html>','utf-8')
 shutil.copytree(IMAGES,OUT/'images',dirs_exist_ok=True)

async def voice_async():
 sys.path.insert(0,str(ROOT/'output/tutorial-video/vendor'))
 import edge_tts
 rows=sections()
 for row in rows:
  audio=OUT/'voice'/f"{row['id']}.mp3";events=audio.with_suffix('.json')
  norm=lambda t:re.sub(r'[\s，。！？；：、,.!?;]','',t).lower()
  cached=audio.exists() and events.exists() and norm(''.join(x['text'] for x in read(events)))==norm(row['text'])
  if not cached:
   if audio.exists() and events.exists():
    history=OUT/'voice-history';history.mkdir(exist_ok=True)
    stem=row['id']+'-'+sha(audio)[:12]
    shutil.copy2(audio,history/(stem+'.mp3'));shutil.copy2(events,history/(stem+'.json'))
   pending=audio.with_suffix('.pending.mp3')
   async def request():
    cues=[];comm=edge_tts.Communicate(row['text'],'zh-CN-YunxiNeural',rate='-3%',boundary='SentenceBoundary')
    with pending.open('wb') as f:
     async for chunk in comm.stream():
      if chunk['type']=='audio':f.write(chunk['data'])
      elif chunk['type'] in ['SentenceBoundary','WordBoundary']:cues.append({k:v for k,v in chunk.items() if k!='type'})
    assert cues and pending.stat().st_size>1024;return cues
   for attempt in range(3):
    try:cues=await asyncio.wait_for(request(),timeout=45);break
    except Exception:
     if attempt==2:raise
     print('TTS retry '+row['id']+' after incomplete free narration response',flush=True);await asyncio.sleep(1)
   pending.replace(audio);save(events,cues)
  row.update(audio=str(audio),duration=float(probe(audio)['format']['duration']))
  print(json.dumps({'chapter':row['id'],'title':row['title'],'seconds':round(row['duration'],2)},ensure_ascii=False),flush=True)
 save(OUT/'narration.json',rows)

def voice():asyncio.run(voice_async())

POINTER="""document.addEventListener('DOMContentLoaded',()=>{const c=document.createElement('div');c.style.cssText='position:fixed;width:28px;height:28px;border:2px solid #195beb;background:#195beb22;border-radius:50%;z-index:2147483647;pointer-events:none;left:-100px;top:-100px';document.body.appendChild(c);document.addEventListener('mousemove',e=>{c.style.left=(e.clientX-14)+'px';c.style.top=(e.clientY-14)+'px';});});"""
def browser_module():
 sys.path.insert(0,str(ROOT/'output/tutorial-video'));import browser_setup
 browser_setup.OUT=OUT;return browser_setup
ASSET_CACHE=None
def asset_cache():
 global ASSET_CACHE
 if ASSET_CACHE is not None:return ASSET_CACHE
 ASSET_CACHE={};proof=[]
 for item in read(CASE.parent/'asset-inventory.json'):
  f=Path(item['file']);assert sha(f)==item['sha256']
  ASSET_CACHE[item['sourceUrl']]=f
  proof.append({'file':str(f),'sha256':item['sha256'],'kind':'original source asset'})
 for meta in (CASE/'reference-cache').glob('*.json'):
  item=read(meta);f=Path(item['file'])
  if item.get('url') and f.exists():
   assert sha(f)==item['uploadSha256'];ASSET_CACHE[item['url']]=f
   proof.append({'file':str(f),'sha256':item['uploadSha256'],'kind':'existing upload transmission copy'})
 manual=read(CASE/'refine-ui-shot009-v2/reference-upload.json')
 if manual.get('url'):ASSET_CACHE[manual['url']]=CASE/'refine-ui-shot009-v2/reference-source-249.png'
 save(OUT/'browser-cache-evidence.json',{'purpose':'Serve same saved assets to browser for stable read-only recording; no mock project data','cachedImageUrlCount':len(ASSET_CACHE),'files':proof,'paidRegeneration':False})
 return ASSET_CACHE
def rest(p,n=1):p.wait_for_timeout(round(n*1000))
def point(p,loc):
 loc.scroll_into_view_if_needed();b=loc.bounding_box()
 if b:p.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=20)
 rest(p,.55)
def click(p,loc):point(p,loc);loc.click();rest(p,.55)
def step(p,title):click(p,p.locator('.step-item').filter(has_text=title))
def shot(p,n=9):step(p,'分镜确认');click(p,p.locator('.nav-shots button').filter(has_text=re.compile(r'镜 '+str(n)+r'\s')).first)
def close(p):
 loc=p.locator('.el-dialog:visible .el-dialog__headerbtn,.el-drawer:visible .el-drawer__close-btn').last
 if loc.count():click(p,loc)
def summary(p,title):click(p,p.locator('summary').filter(has_text=title).first)
def model_select(p):return p.locator('.el-form-item').filter(has_text=re.compile(r'^视频模型')).locator('.el-select__wrapper').first
def load(p,url):
 p.goto(url,wait_until='domcontentloaded',timeout=60000)
 try:p.wait_for_load_state('networkidle',timeout=25000)
 except Exception:
  p.locator('.step-item, .shell').first.wait_for(state='visible',timeout=20000)
 rest(p,1)
def ui(p,i,base):
 if i in [0,9,10]:load(p,base+'/output/changan-cinematic-tutorial/slide-'+{0:'intro',9:'post',10:'review'}[i]+'.html');return
 load(p,base+'/short-drama?projectId='+PID)
 if i==1:step(p,'剧本审阅')
 elif i in [2,3]:step(p,'资产配置');rest(p,1)
 else:shot(p,9)
def actions(p,i):
 if i==0:rest(p,6);p.mouse.move(550,755,steps=24);rest(p,8)
 elif i==1:
  point(p,p.get_by_label('风格 / 基调'));rest(p,5)
  point(p,p.get_by_label('剧本正文（纯文本固定格式）'));rest(p,7)
  point(p,p.get_by_role('button',name='打磨剧本',exact=True));rest(p,3)
 elif i==2:
  point(p,p.get_by_role('button',name='查看王大头角色档案').first);rest(p,3)
  click(p,p.get_by_role('button',name='查看王大头角色档案').first);rest(p,5)
  tabs=p.locator('.appearance-tabs .el-tabs__item:visible')
  if tabs.count()>1:click(p,tabs.nth(1));rest(p,6)
  close(p)
 elif i==3:
  click(p,p.get_by_role('tab',name=re.compile('场景')));rest(p,7)
  click(p,p.get_by_role('tab',name=re.compile('道具素材|道具与镜头资产')));rest(p,8)
 elif i==4:
  loc=model_select(p);point(p,loc);click(p,loc);rest(p,5);p.keyboard.press('Escape');rest(p,3)
  point(p,p.get_by_text('输出画质',exact=True));rest(p,5)
  point(p,p.get_by_text('视频秒数（可选）',exact=True));rest(p,5)
 elif i==5:
  point(p,p.get_by_label('视频提示词',exact=True));rest(p,9)
  point(p,p.locator('.storyboard-ref-images').first);rest(p,6)
 elif i==6:
  summary(p,'本镜发言人与声音');rest(p,6)
  point(p,p.locator('.storyboard-ref-images').first);rest(p,6)
  point(p,p.get_by_text('本镜起始帧（可选）',exact=True));rest(p,5)
 elif i==7:
  click(p,p.get_by_role('button',name='播放视频',exact=True));rest(p,1)
  v=p.locator('video:visible').first;v.wait_for(state='visible',timeout=30000);v.evaluate('(v)=>{v.muted=true;v.play().catch(()=>{});}');rest(p,13)
  close(p)
 elif i==8:
  point(p,p.get_by_text('成片合成',exact=True));rest(p,5)
  point(p,p.get_by_role('button',name=re.compile('合成所选')));rest(p,5)
  point(p,p.get_by_text('横屏 16:9',exact=True).first);rest(p,4)
 elif i==9:rest(p,12);p.mouse.move(1540,525,steps=24);rest(p,6)
 elif i==10:rest(p,10);p.mouse.move(1370,612,steps=24);rest(p,6)

def context(browser,record=False):
 b=browser_module();api,ctx=b.setup(browser,record);ctx.add_init_script(POINTER)
 blocked=[]
 assets=asset_cache()
 cached=read(CASE/'refine-ui-shot009-v2/videos/2106394660326273024.json')
 assert cached['predictionId']=='69f7acb59a5344968fa638690b350ea8' and sha(cached['file'])==cached['fileSha256']
 def guard(route):
  if route.request.method not in ['GET','HEAD','OPTIONS']:
   blocked.append({'method':route.request.method,'url':route.request.url.split('?')[0]});route.abort()
  else:
   parsed=urlparse(route.request.url);q=parse_qs(parsed.query)
   if route.request.url in assets:
    f=assets[route.request.url];mime={'.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png'}[f.suffix.lower()]
    route.fulfill(status=200,content_type=mime,path=str(f),headers={'Access-Control-Allow-Origin':'*'})
   elif parsed.path.endswith('/media/content') and q.get('predictionId')==[cached['predictionId']] and q.get('model')==[cached['model']]:
    route.fulfill(status=200,content_type='video/mp4',path=cached['file'])
   else:route.continue_()
 ctx.route('**/*',guard)
 page=ctx.new_page();page.set_default_timeout(18000)
 return b,api,ctx,page,blocked
def shot_top(p):p.locator('.step-panel').evaluate('(e)=>e.scrollTop=0')
def screenshot(p,name):
 rest(p,1);p.screenshot(path=str(IMAGES/name),type='jpeg',quality=95,full_page=False)
 print('SCREENSHOT '+name,flush=True)
def capture():
 from playwright.sync_api import sync_playwright
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True);b,api,ctx,p,blocked=context(browser)
  before=api.call('GET','/short-drama/'+PID);load(p,b.BASE+'/short-drama?projectId='+PID)
  step(p,'剧本审阅');screenshot(p,'04-script.jpg')
  print('SCRIPT LABELS '+json.dumps(p.locator('label').all_text_contents(),ensure_ascii=False),flush=True)
  step(p,'资产配置');screenshot(p,'05-characters.jpg')
  click(p,p.get_by_role('button',name='查看王大头角色档案').first);screenshot(p,'06-character-profile.jpg');close(p)
  click(p,p.get_by_role('tab',name=re.compile('场景')));screenshot(p,'07-locations.jpg')
  click(p,p.get_by_role('tab',name=re.compile('道具素材|道具与镜头资产')));screenshot(p,'08-props.jpg')
  shot(p,9);screenshot(p,'09-model.jpg')
  model=model_select(p);click(p,model)
  options=p.get_by_role('option').all_text_contents();p.keyboard.press('Escape')
  assert any('seedance-2.5/' in x for x in options)
  point(p,p.get_by_label('视频提示词',exact=True));screenshot(p,'10-direction.jpg')
  click(p,p.get_by_role('button',name='播放视频',exact=True));rest(p,1)
  v=p.locator('video:visible').first;v.wait_for(state='visible',timeout=30000);v.evaluate('(v)=>{v.muted=true;v.currentTime=4;v.pause();}');rest(p,2)
  screenshot(p,'11-playback.jpg');close(p)
  point(p,p.get_by_text('成片合成',exact=True));screenshot(p,'13-compose.jpg')
  after=api.call('GET','/short-drama/'+PID)
  unchanged=json.dumps(before,sort_keys=True)==json.dumps(after,sort_keys=True)
  save(OUT/'capture-preservation.json',{'projectId':PID,'projectUnchanged':unchanged,'blockedMutations':blocked,'modelOptions':options,'screenshotSize':[1920,1080],'videoPlaybackCache':'exact local downloaded original for same shot9 prediction; browser GET response only; production state unchanged'})
  assert unchanged and not blocked
  ctx.close();browser.close()
 shutil.copytree(IMAGES,OUT/'images',dirs_exist_ok=True);make_slides()

def record():
 from playwright.sync_api import sync_playwright
 rows=read(OUT/'narration.json');errors=[];blocked_all=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True);baseline=None;last_api=None
  for i,row in enumerate(rows):
   if (OUT/'raw'/f'{i:02d}.json').exists():continue
   b,api,ctx,p,blocked=context(browser,True);last_api=api
   if baseline is None:baseline=api.call('GET','/short-drama/'+PID)
   zero=time.monotonic();video=p.video
   try:
    ui(p,i,b.BASE);start=time.monotonic()-zero
    print('RECORDING '+row['id']+' '+row['title'],flush=True)
    actions(p,i);rest(p,max(0,row['duration']+1-(time.monotonic()-zero-start)))
    p.screenshot(path=str(OUT/'frames'/f'{i:02d}.png'));end=time.monotonic()-zero
    ctx.close();video.save_as(str(OUT/'raw'/f'{i:02d}.webm'))
    save(OUT/'raw'/f'{i:02d}.json',{'title':row['title'],'start':start,'end':end,'capture':'actual browser UI video','viewport':[1920,1080]})
    print('RECORDED '+row['id'],flush=True)
   except Exception as e:
    errors.append({'chapter':i,'error':str(e)[:500]});p.screenshot(path=str(OUT/f'error-{i}.png'));ctx.close();print(json.dumps(errors[-1],ensure_ascii=False),flush=True)
   blocked_all.extend(blocked)
  unchanged=True
  if baseline is not None:
   after=last_api.call('GET','/short-drama/'+PID);unchanged=json.dumps(baseline,sort_keys=True)==json.dumps(after,sort_keys=True)
  save(OUT/'recording-preservation.json',{'projectId':PID,'projectUnchanged':unchanged,'blockedMutations':blocked_all,'errors':errors,'newProjectMediaTasks':0,'videoPlaybackCache':'exact local downloaded original for same shot9 prediction; browser GET response only; production state unchanged'})
  browser.close();assert unchanged and not blocked_all and not errors

def stamp(t,ass=False):
 ms=round(t*(100 if ass else 1000));scale=100 if ass else 1000
 h,ms=divmod(ms,3600*scale);m,ms=divmod(ms,60*scale);s,ms=divmod(ms,scale)
 return f'{h}:{m:02d}:{s:02d}.{ms:02d}' if ass else f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
def cue_lines(i):
 result=[]
 for cue in read(OUT/'voice'/f'{i:02d}.json'):
  parts=[]
  for clause in re.findall(r'[^，。！？；：、]+[，。！？；：、]?',cue['text']):
   for n in range(0,len(clause),28):
    bit=clause[n:n+28]
    if parts and len(parts[-1])+len(bit)<=28:parts[-1]+=bit
    else:parts.append(bit)
  start=cue['offset']/1e7;duration=cue['duration']/1e7;size=sum(map(len,parts)) or 1
  for text in parts:
   span=duration*len(text)/size;result.append((start,start+span,text));start+=span
 return [(a,min(b,result[n+1][0]-.01) if n+1<len(result) else b,t) for n,(a,b,t) in enumerate(result)]
def srt_text(cues):return ''.join(f'{n}\n{stamp(a)} --> {stamp(b)}\n{text}\n\n' for n,(a,b,text) in enumerate(cues,1))
def subtitle_ass(path,cues):
 header='''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Microsoft YaHei,36,&H005D3118,&H005D3118,&H00FFFFFF,&H00FFFFFF,0,0,0,0,100,100,0,0,1,0,0,2,80,80,18,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
 events=''.join(f'Dialogue: 0,{stamp(a,True)},{stamp(b,True)},Default,,0,0,0,,{text}\n' for a,b,text in cues)
 path.write_text(header+events,'utf-8-sig')
def render_fonts():
 folder=OUT/'render-fonts';folder.mkdir(exist_ok=True)
 for name in ['msyh.ttc','consola.ttf']:
  dest=folder/name
  if not dest.exists():shutil.copy2(Path('C:/Windows/Fonts')/name,dest)
 return [(folder/name).relative_to(ROOT).as_posix() for name in ['msyh.ttc','consola.ttf']]
def render():
 rows=read(OUT/'narration.json');all_ready=True;chinese_font,latin_font=render_fonts()
 for i,row in enumerate(rows):
  meta=OUT/'raw'/f'{i:02d}.json';dest=OUT/'clips'/f'{i:02d}.mp4'
  if dest.exists():continue
  if not meta.exists():all_ready=False;continue
  m=read(meta);duration=math.ceil((row['duration']+1)*30)/30;available=m['end']-m['start']-.2
  cues=cue_lines(i);subtitle_ass(OUT/'clips'/f'{i:02d}.ass',cues)
  (OUT/'clips'/f'{i:02d}.srt').write_text(srt_text(cues),'utf-8')
  title=OUT/'clips'/f'{i:02d}-title.txt';title.write_text(f'{i+1:02d} / 11    '+row['title'],'utf-8')
  rel=lambda p:p.relative_to(ROOT).as_posix()
  # Keep the complete recorded viewport; the white-blue frame adds chapter and subtitle space.
  vf=f"setpts={duration/available:.8f}*(PTS-STARTPTS),fps=30,scale=1706:960,pad=1920:1080:107:60:color=white,setsar=1,drawbox=x=0:y=0:w=iw:h=54:color=0x195beb:t=fill,drawtext=fontfile='{chinese_font}':textfile='{rel(title)}':fontcolor=white:fontsize=28:x=108:y=10,drawtext=fontfile='{latin_font}':text='RUOYI DRAMA':fontcolor=white:fontsize=24:x=1600:y=15,subtitles=filename='{rel(OUT/'clips'/f'{i:02d}.ass')}',tpad=stop_mode=clone:stop_duration=2,format=yuv420p"
  run(['ffmpeg','-nostdin','-y','-v','warning','-ss',str(m['start']+.2),'-t',str(available),'-i',str(OUT/'raw'/f'{i:02d}.webm'),'-i',row['audio'],'-vf',vf,'-af','apad,loudnorm=I=-16:TP=-1.5:LRA=11','-t',str(duration),'-c:v','libx264','-preset','fast','-crf','19','-threads','6','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart',str(dest)],'render.log')
  print('RENDERED '+row['id']+' '+row['title'],flush=True)
 if not all_ready or not all((OUT/'clips'/f'{i:02d}.mp4').exists() for i in range(len(rows))):return
 make_sample()
 filenames=[OUT/'clips'/f'{i:02d}.mp4' for i in range(len(rows))]+[OUT/'clips/sample.mp4']
 concat=OUT/'clips/concat.txt';concat.write_text(''.join("file '"+p.name+"'\n" for p in filenames),'utf-8')
 cursor=0;chapters=[';FFMETADATA1'];timeline=[];cues=[]
 for i,file in enumerate(filenames):
  dur=float(probe(file)['format']['duration']);title=rows[i]['title'] if i<len(rows) else '现有成片片段 · 原对白'
  timeline.append({'title':title,'start':round(cursor,6),'duration':dur,'file':str(file)})
  chapters.extend(['[CHAPTER]','TIMEBASE=1/1000',f'START={round(cursor*1000)}',f'END={round((cursor+dur)*1000)}',f'title={title}'])
  if i<len(rows):cues.extend((a+cursor,b+cursor,t) for a,b,t in cue_lines(i))
  cursor+=dur
 (OUT/'chapters.txt').write_text('\n'.join(chapters)+'\n','utf-8')
 (OUT/'字幕.srt').write_text(srt_text(cues),'utf-8')
 shutil.copy2(SRC/'video-narration.md',OUT/'讲解稿.md')
 run(['ffmpeg','-nostdin','-y','-v','warning','-f','concat','-safe','0','-i',str(concat),'-i',str(OUT/'chapters.txt'),'-map_metadata','1','-map_chapters','1','-c:v','copy','-bsf:v','h264_metadata=sample_aspect_ratio=1/1','-aspect','16:9','-c:a','aac','-af','aresample=async=1:first_pts=0','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart',str(VIDEO)],'render.log')
 save(OUT/'timeline.json',timeline);capture_frame(VIDEO,14,OUT/'poster.jpg')
 print(json.dumps({'video':str(VIDEO),'duration':float(probe(VIDEO)['format']['duration']),'chapters':len(timeline)},ensure_ascii=False),flush=True)

def make_sample():
 evidence=read(CASE/'latest-deliverable.json');film=Path(evidence['subtitledVideo']);chinese_font,_=render_fonts()
 samples=[]
 for i,(start,dur,label) in enumerate([(0,10.7,'喜宴与人物介绍'),(118.56,13.056,'第9镜 · 铺内朝街')]):
  dest=OUT/'clips'/f'sample-{i}.mp4';samples.append(dest)
  text=OUT/'clips'/f'sample-{i}-title.txt';text.write_text(label+'  /  现有720p成片 · 原对白','utf-8')
  if dest.exists():continue
  vf=f"fps=30,scale=1706:960,pad=1920:1080:107:60:color=white,setsar=1,drawbox=x=0:y=0:w=iw:h=54:color=0x195beb:t=fill,drawtext=fontfile='{chinese_font}':textfile='{text.relative_to(ROOT).as_posix()}':fontcolor=white:fontsize=28:x=108:y=10,format=yuv420p"
  run(['ffmpeg','-nostdin','-y','-v','warning','-ss',str(start),'-t',str(dur),'-i',str(film),'-vf',vf,'-af','loudnorm=I=-16:TP=-1.5:LRA=11','-c:v','libx264','-preset','fast','-crf','19','-threads','6','-c:a','aac','-b:a','192k','-ar','48000','-ac','2',str(dest)],'render.log')
 (OUT/'clips/sample-concat.txt').write_text(''.join("file '"+p.name+"'\n" for p in samples),'utf-8')
 run(['ffmpeg','-nostdin','-y','-v','error','-f','concat','-safe','0','-i',str(OUT/'clips/sample-concat.txt'),'-c:v','copy','-bsf:v','h264_metadata=sample_aspect_ratio=1/1','-aspect','16:9','-c:a','aac','-af','aresample=async=1:first_pts=0','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart',str(OUT/'clips/sample.mp4')])
 shutil.copy2(OUT/'clips/sample.mp4',OUT/'sample.mp4')
 save(OUT/'sample-edit.json',{'sourceFilm':str(film),'sourceSha256':sha(film),'clips':[{'start':0,'duration':10.7},{'start':118.56,'duration':13.056}],'sourceResolution':[1280,720],'tutorialResolution':[1920,1080],'audio':'original dialogue, normalized loudness; no replacement voices','paidProjectMediaTasks':0})

def inline(text):
 text=html.escape(text)
 text=re.sub(r'\*\*([^*]+)\*\*',r'<strong style="color:#195beb;">\1</strong>',text)
 text=re.sub(r'`([^`]+)`',r'<code>\1</code>',text)
 return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'<a href="\2" style="color:#195beb;text-decoration:underline">\1</a>',text)
def article_html(embed=True):
 result=[];paragraph=[]
 def flush():
  if paragraph:result.append('<p style="margin:21px 0;font-size:17px;line-height:1.95;color:#334766;">'+inline(' '.join(paragraph))+'</p>');paragraph.clear()
 for line in (SRC/'article.md').read_text('utf-8').splitlines():
  image=re.fullmatch(r'!\[([^\]]*)\]\(([^)]+)\)',line)
  if image:
   flush();caption,file=image.groups();path=SRC/file
   url='data:image/jpeg;base64,'+base64.b64encode(path.read_bytes()).decode() if embed else file
   result.append(f'<figure style="margin:32px 0;"><img src="{url}" alt="{html.escape(caption)}" style="width:100%;height:auto;display:block;border:1px solid #dbe6f7"><figcaption style="font-size:12px;line-height:1.7;color:#6c7f9c;margin:12px 0;text-align:center;">{html.escape(caption)}</figcaption></figure>')
  elif line.startswith('# '):flush();result.append('<h1 style="font-family:SimSun,serif;font-size:34px;line-height:1.55;color:#18315d;margin:10px 0 34px;">'+inline(line[2:])+'</h1>')
  elif not line.strip():flush()
  else:paragraph.append(line)
 flush();return '\n'.join(result)

def publish():
 if (OUT/'timeline.json').exists():timeline=read(OUT/'timeline.json')
 else:
  timeline=[];cursor=0
  for row in read(OUT/'narration.json'):
   timeline.append({'title':row['title'],'start':cursor});cursor+=row['duration']+1
  timeline.append({'title':'现有成片片段 · 原对白','start':cursor})
 shutil.copytree(IMAGES,OUT/'images',dirs_exist_ok=True)
 shutil.copy2(SRC/'article.md',OUT/'article.md')
 body=article_html(True)
 fragment='<section style="max-width:960px;margin:auto;background:white;padding:36px 24px;font-family:Microsoft YaHei,sans-serif;">'+body+'</section>'
 (OUT/'推文正文.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+fragment,'utf-8')
 css='''*{box-sizing:border-box}body{margin:0;background:#f3f7ff;color:#18315d;font-family:"Microsoft YaHei",sans-serif}button,a{touch-action:manipulation}a{color:#195beb}button{cursor:pointer;border:1px solid #bdcff5;background:white;color:#195beb;padding:12px 18px;font:14px "Microsoft YaHei";border-radius:3px}button:hover{background:#edf4ff}button.primary{background:#195beb;color:#fff;border-color:#195beb}.nav{position:sticky;top:0;z-index:4;display:flex;gap:20px;align-items:center;justify-content:space-between;padding:16px 4vw;background:#fffffff2;border-bottom:1px solid #d7e4fb;backdrop-filter:blur(12px)}.brand{font:18px Consolas,monospace;letter-spacing:2px;color:#195beb}.tools{display:flex;gap:9px;flex-wrap:wrap}.hero{max-width:1240px;margin:36px auto 0;padding:56px;background:white;border-top:7px solid #195beb;display:grid;grid-template-columns:1fr 1fr;gap:36px}.eyebrow{font:12px Consolas;letter-spacing:3px;color:#195beb}h1{font:52px/1.4 SimSun,serif;margin:22px 0}.hero p{font-size:17px;line-height:1.9;color:#637794}.hero figure{margin:0}.hero img{width:100%;display:block;border:1px solid #dbe6f7;margin-bottom:12px}.badge{display:inline-block;border:1px solid #195beb;padding:12px 15px;color:#195beb;font-weight:700;margin:14px 0}.stats{display:flex;gap:24px;margin-top:24px}.stats span{border-left:2px solid #195beb;padding-left:12px;line-height:1.9;font-size:13px;color:#647a99}.stats b{font:25px Consolas;color:#195beb}.main{max-width:1240px;margin:22px auto;padding:44px 56px;background:white;border:1px solid #dce7f9}.title-row{display:flex;align-items:center;gap:24px;justify-content:space-between;margin-bottom:28px}.title-row h2{font:30px SimSun;margin:0}.tiny{font-size:13px;color:#6980a2;line-height:1.8}.tabs{display:flex;gap:10px}.tabs button[aria-selected=true]{color:white;background:#195beb;border-color:#195beb}.content{max-width:960px;margin:auto}.content img{cursor:zoom-in}.content[hidden],.pane[hidden]{display:none}video{display:block;width:100%;aspect-ratio:16/9;background:#172b4d}.chapters{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:24px 0}.chapters button{text-align:left;font-size:13px;line-height:1.8}.chapters time{font:13px Consolas;margin-right:12px}.status{min-height:20px;margin:10px 0;font-size:13px;color:#195beb}dialog{padding:16px;border:0;max-width:98vw;max-height:96vh}dialog img{display:block;max-width:94vw;max-height:85vh;object-fit:contain}dialog::backdrop{background:#122951e8}dialog button{display:block;margin:0 0 12px auto}.footer{max-width:1240px;padding:12px 24px 40px;margin:auto;font-size:12px;color:#6d829f;line-height:1.8}.links{display:flex;gap:18px;flex-wrap:wrap;margin:18px 0;font-size:14px}@media(max-width:700px){.nav{padding:12px 16px;flex-direction:column;align-items:flex-start;gap:12px}.hero{display:block;margin:14px 12px 0;padding:28px 23px}.hero h1{font-size:36px}.hero figure{margin-top:24px}.main{margin:14px 12px;padding:26px 20px}.title-row{display:block}.tabs{margin-top:18px}.content h1{font-size:27px!important}.content p{font-size:16px!important}.chapters{grid-template-columns:1fr}.stats{gap:14px}.tools button{padding:9px 11px}.footer{padding:12px 24px}}@media print{.nav,.hero,.title-row,.pane,.footer{display:none}.main{border:0;margin:0;padding:0}.content{display:block!important}}'''
 shell='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>从Mini动画到电影感短剧｜RuoYi Drama白蓝制作教学</title><style>CSS</style></head><body><header class="nav"><span class="brand">RUOYI DRAMA / MAKING OF</span><div class="tools"><button class="primary" id="copy">复制推文富文本</button><button id="select">选中推文</button><button id="export">下载推文HTML</button></div></header><section class="hero"><div><div class="eyebrow">FROM MINI TO CINEMATIC</div><h1>简单动画之后，<br>电影感短剧<br>能不能做？</h1><p>可以。参考LibTV热剧《长安异闻录》，用现有项目讲清一次古装写实短剧的制作流程。</p><div class="badge">视频模型至少从 Seedance 2.5 起步</div><div class="stats"><span><b>18</b><br>场次</span><span><b>48</b><br>视频段落</span><span><b>720p</b><br>影片原片</span><span><b>1080p</b><br>教学录屏</span></div></div><figure><img src="images/01-film-banquet.jpg" alt="喜宴成片"><img src="images/02-film-butcher.jpg" alt="第9镜新版铺内机位"></figure></section><main class="main"><div class="title-row"><h2>从资产到镜头，走完一次制作。</h2><div class="tabs"><button id="articleTab" aria-selected="true">推文正文</button><button id="videoTab" aria-selected="false">视频教学</button></div></div><div class="status" id="status" aria-live="polite"></div><article class="content" id="article">ARTICLE</article><section class="pane" id="lesson" hidden><p class="tiny">真实工作台操作录屏＋白蓝章节＋普通话合成讲解＋中文字幕。末尾两段现有成片保留原对白。录像展示查看与审阅，生成和合成入口以指示演示。</p><video id="lessonVideo" controls preload="metadata" src="VIDEO" poster="poster.jpg"></video><div class="chapters" id="chapters"></div><div class="links"><a href="VIDEO" download>下载视频教学</a><a href="字幕.srt" download>下载字幕</a><a href="讲解稿.md">查看讲解稿</a><a href="推文与视频教学-白蓝发布包.zip" download>下载发布包</a></div><p class="tiny">电影感是本例的制作方向，人物关系和剧情节奏继续审阅。型号、分辨率与实际片段分别核对，录屏1080p不改变影片原片720p。</p></section></main><footer class="footer">参考作品与原始视觉资料来自 <a href="https://www.liblib.tv/detail/6bc8b8d159d04627a881c39bfa58a5fb">Rick《长安异闻录》第一卷·算命 / LibTV</a>。本页介绍RuoYi Drama复刻制作流程。<br>教学配音为 zh-CN-YunxiNeural 合成普通话；实际模型参数见 <a href="https://www.atlascloud.ai/docs/more-models/bytedance/seedance-2.5-reference-to-video/generateVideo">Atlas官方文档</a>。</footer><dialog id="viewer"><button id="closeViewer">关闭大图</button><img id="original" alt="原尺寸制作截图"></dialog><script>const timeline=TIMELINE;const article=document.querySelector('#article'),lesson=document.querySelector('#lesson'),status=document.querySelector('#status');function choose(which){const isArticle=which==='article';article.hidden=!isArticle;lesson.hidden=isArticle;document.querySelector('#articleTab').setAttribute('aria-selected',isArticle);document.querySelector('#videoTab').setAttribute('aria-selected',!isArticle)}document.querySelector('#articleTab').onclick=()=>choose('article');document.querySelector('#videoTab').onclick=()=>choose('video');function select(){choose('article');const r=document.createRange();r.selectNodeContents(article);const s=window.getSelection();s.removeAllRanges();s.addRange(r)}function rich(){return '<section style="font-family:Microsoft YaHei,sans-serif;background:white;">'+article.innerHTML+'</section>'}document.querySelector('#select').onclick=()=>{select();status.textContent='正文已选中，按Ctrl+C复制。'};document.querySelector('#copy').onclick=async()=>{choose('article');try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([rich()],{type:'text/html'}),'text/plain':new Blob([article.innerText],{type:'text/plain'})})]);status.textContent='已复制推文富文本。'}catch(e){select();const listener=e=>{e.clipboardData.setData('text/html',rich());e.clipboardData.setData('text/plain',article.innerText);e.preventDefault()};document.addEventListener('copy',listener);const ok=document.execCommand('copy');document.removeEventListener('copy',listener);status.textContent=ok?'已复制推文富文本。':'正文已选中，请按Ctrl+C复制。'}};document.querySelector('#export').onclick=()=>{const blob=new Blob(['<!doctype html><html lang="zh-CN"><meta charset="utf-8">'+rich()],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='电影感短剧-白蓝推文.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};document.querySelectorAll('#article img').forEach(x=>x.onclick=()=>{document.querySelector('#original').src=x.src;document.querySelector('#viewer').showModal()});document.querySelector('#closeViewer').onclick=()=>document.querySelector('#viewer').close();const video=document.querySelector('#lessonVideo');for(const c of timeline){const b=document.createElement('button');const t=document.createElement('time');t.textContent=String(Math.floor(c.start/60)).padStart(2,'0')+':'+String(Math.floor(c.start%60)).padStart(2,'0');b.append(t,document.createTextNode(c.title));b.onclick=()=>{video.currentTime=c.start;video.play()};document.querySelector('#chapters').append(b)}if(location.hash==='#video')choose('video');</script></body></html>'''
 (OUT/'index.html').write_text(shell.replace('CSS',css).replace('ARTICLE',body).replace('VIDEO',VIDEO.name).replace('TIMELINE',json.dumps(timeline,ensure_ascii=False)),'utf-8')
 (OUT/'使用说明.txt').write_text('打开index.html查看白蓝推文或视频教学，可复制推文富文本、下载推文HTML、播放与下载教程。\n推文正文.html为单独正文。若发布平台过滤内嵌图片，按images编号单独上传。\n教程为真实工作台查看、切换、滚动和播放的录制，带11章讲解和1章成片片段；生成、保存与合成按钮没有为录制重新执行。\n工作台原始录屏与截图1920×1080，教程1920×1080/30帧；影片原片1280×720，展示时等比放大，不宣称变成原生1080p。\n配音采用edge-tts的zh-CN-YunxiNeural，普通话合成声音；末尾片段使用现有影片对白，仅作响度统一。\n案例当前素材48段均为Seedance2.5。至少2.5是本教学的制作选择，不构成模型排名或整片电影质量保证。\n发布包不含API密钥、登录状态、原始接口回执和私有项目快照。\n','utf-8')
 save(OUT/'publication-status.json',{'videoReady':VIDEO.exists(),'timelineUsesMeasuredVideoChapters':(OUT/'timeline.json').exists(),'publicMediaTaskCalls':0})
 print('Built white-blue article page and video player.',flush=True)

def check():
 p=probe(VIDEO);v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio')
 assert (v['width'],v['height'])==(1920,1080) and v['sample_aspect_ratio']=='1:1' and v['r_frame_rate']=='30/1' and len(p['chapters'])==12
 assert a['sample_rate']=='48000' and a['channels']==2
 run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(VIDEO),'-map','0:v:0','-map','0:a:0','-f','null','-'],'decode-check.log')
 preservation=read(OUT/'recording-preservation.json');assert preservation['projectUnchanged'] and not preservation['blockedMutations'] and not preservation['errors']
 for file in IMAGES.glob('*.jpg'):
  if file.name not in ['01-film-banquet.jpg','02-film-butcher.jpg','03-film-carriage.jpg','14-nameplate.jpg']:
   assert Image.open(file).size==(1920,1080),(file,Image.open(file).size)
 article=(SRC/'article.md').read_text('utf-8');plain=re.sub(r'!\[[^\]]*\]\([^)]*\)|\[[^\]]*\]\([^)]*\)','',article)
 banned=[x for x in ['说白了','意味着什么','这意味着','本质上','换句话说','不可否认','综上所述','总的来说','值得注意的是','不难发现','让我们来看看','接下来让我们','在当今','随着','：','——','"'] if x in plain]
 assert not banned,banned
 body=OUT/'index.html';assert body.exists() and len(list(IMAGES.glob('*.jpg')))==14
 proof={'file':str(VIDEO),'sha256':sha(VIDEO),'duration':float(p['format']['duration']),'resolution':[1920,1080],'fps':v['r_frame_rate'],'chapterCount':12,'capture':'actual browser UI recording; 1920x1080 full viewport retained within white-blue layout','narration':'edge-tts zh-CN-YunxiNeural, rate -3%, synthetic Mandarin','subtitleTiming':'actual SentenceBoundary timestamps; proportional clause timing within each sentence','audio':'11 chapter narrations plus two existing-film excerpts with original dialogue, all normalized loudness','fullAudioVideoDecodePassed':True,'productionProjectUnchanged':True,'newPaidProjectMediaTasks':0,'filmResolution':[1280,720],'articleChineseCharacterCount':len(re.findall(r'[\u4e00-\u9fff]',article)),'articleRuleCheckZeroHits':True,'source':'Rick《长安异闻录》第一卷·算命 / LibTV','completeHumanListeningApproved':False,'wholeFilmCinemaQualityApproved':False,'visualReviewComplete':False}
 save(OUT/'verification.json',proof)
 package()
 print(json.dumps(proof,ensure_ascii=False),flush=True)

def package():
 # Explicit allowlist excludes credentials, signed media URLs and private project snapshots.
 with zipfile.ZipFile(OUT/'推文与视频教学-白蓝发布包.zip','w',zipfile.ZIP_DEFLATED) as z:
  for name in ['index.html','推文正文.html','article.md',VIDEO.name,'字幕.srt','讲解稿.md','poster.jpg','timeline.json','使用说明.txt','sample.mp4','verification.json','质检报告.md','case-evidence.json']:
   if (OUT/name).exists():z.write(OUT/name,name)
  for f in sorted((OUT/'images').glob('*.jpg')):z.write(f,'images/'+f.name)
  for name in ['publication-ui-check.json','narration-coverage-check.json','article-editorial-check.json','manual-frame-review.json']:
   file=OUT/'review'/name
   if file.exists():z.write(file,'review/'+name)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('action',choices=['prepare','voice','capture','record','render','publish','check']);a=p.parse_args();globals()[a.action]()
