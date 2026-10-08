"""Record existing project UI; never save or submit production requests."""
import sys,json,time,re,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parents[2]
OUT=ROOT/'output/smy-tutorial-video'
sys.path.insert(0,str(ROOT/'output/tutorial-video'))
import browser_setup
browser_setup.OUT=OUT
BASE=browser_setup.BASE
PID='2106316820411002880'
ROWS=json.loads((OUT/'narration.json').read_text(encoding='utf-8'))
(OUT/'raw').mkdir(exist_ok=True)
(OUT/'frames').mkdir(exist_ok=True)
sys.stdout.reconfigure(encoding='utf-8')
POINTER="""document.addEventListener('DOMContentLoaded',()=>{const c=document.createElement('div');c.style.cssText='position:fixed;width:28px;height:28px;border:2px solid #467959;background:#46795922;border-radius:50%;z-index:2147483647;pointer-events:none;left:-100px;top:-100px';document.body.appendChild(c);document.addEventListener('mousemove',e=>{c.style.left=(e.clientX-14)+'px';c.style.top=(e.clientY-14)+'px';});});"""
def rest(p,n=1):p.wait_for_timeout(int(n*1000))
def point(p,loc):
 loc.scroll_into_view_if_needed();b=loc.bounding_box()
 if b:p.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=18)
 rest(p,1)
def click(p,loc):point(p,loc);loc.click();rest(p,.7)
def step(p,name):click(p,p.locator('.step-item').filter(has_text=name))
def close(p):click(p,p.locator('.el-dialog:visible .el-dialog__headerbtn, .el-drawer:visible .el-drawer__close-btn').last)
def mother(p):click(p,p.get_by_role('button',name=re.compile('查看.*青蛙.*角色档案')).first)
def menu(p,name):click(p,p.locator('.account-button'));click(p,p.get_by_role('menuitem',name=name))
def actions(p,i):
 if i in (0,9):
  v=p.locator('video').first;v.evaluate('(v)=>{v.currentTime=32;v.pause();}');rest(p,4)
  p.mouse.wheel(0,360);rest(p,4);p.mouse.wheel(0,-360)
 elif i==1:
  menu(p,'Key 配置');point(p,p.locator('.el-dialog:visible input').first);rest(p,4)
  point(p,p.get_by_role('button',name='保存并应用'));rest(p,3)
 elif i==2:
  menu(p,'技能市场');click(p,p.get_by_role('tab',name=re.compile('审美风格')))
  click(p,p.locator('.market-list button').filter(has_text='上美影').first);rest(p,6)
  click(p,p.get_by_role('tab',name=re.compile('导演风格')))
  click(p,p.locator('.market-list button').filter(has_text='上美影').first);rest(p,6)
 elif i==3:
  step(p,'输入想法');point(p,p.locator('textarea').first);rest(p,5)
 elif i==4:
  step(p,'剧本审阅');point(p,p.get_by_label('风格 / 基调'));rest(p,3)
  point(p,p.get_by_label('剧本正文（纯文本固定格式）'));rest(p,7)
  point(p,p.get_by_role('button',name='打磨剧本',exact=True));rest(p,3)
 elif i==5:
  step(p,'资产配置');rest(p,3);mother(p);rest(p,6);close(p)
  click(p,p.get_by_role('tab',name=re.compile('场景')));rest(p,6)
 elif i==6:
  step(p,'资产配置');mother(p)
  s=p.locator('summary').filter(has_text='角色声音').first;click(p,s);point(p,s);p.locator('.el-drawer__body').evaluate('(e)=>e.scrollTop=e.scrollHeight');rest(p,7)
 elif i==7:
  step(p,'分镜确认');rest(p,3)
  point(p,p.get_by_text('视频提示词',exact=True));rest(p,7)
  point(p,p.locator('.storyboard-ref-images').first);rest(p,6)
 elif i==8:
  step(p,'分镜确认');rest(p,5)
  point(p,p.get_by_role('button',name='下载合成视频'));rest(p,5)
  p.mouse.wheel(0,300);rest(p,4);p.mouse.wheel(0,-300)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True)
 before=None;blocked=[];errors=[]
 for i,row in enumerate(ROWS):
  if len(sys.argv)>1 and sys.argv[1].isdigit() and i!=int(sys.argv[1]):continue
  if (OUT/'raw'/f'{i:02d}.json').exists():continue
  api,ctx=browser_setup.setup(browser,True)
  if before is None:before=api.call('GET','/short-drama/'+PID)
  ctx.add_init_script(POINTER)
  page=ctx.new_page();page.set_default_timeout(12000)
  def guard(route):
   if route.request.method not in ('GET','HEAD','OPTIONS'):
    blocked.append(route.request.url.split('?')[0]);route.abort()
   else:route.continue_()
  page.route('**/dev-api/**',guard)
  zero=time.monotonic();recording=page.video
  try:
   url=BASE+'/output/smy-article/index.html' if i in (0,9) else BASE if i in (1,2) else BASE+'/short-drama?projectId='+PID
   page.goto(url,wait_until='networkidle');rest(page,1)
   start=time.monotonic()-zero
   print('RECORDING '+row['title'],flush=True)
   actions(page,i)
   rest(page,max(0,row['duration']+1-(time.monotonic()-zero-start)))
   page.screenshot(path=str(OUT/'frames'/f'{i:02d}.png'))
   end=time.monotonic()-zero;ctx.close();recording.save_as(str(OUT/'raw'/f'{i:02d}.webm'))
   (OUT/'raw'/f'{i:02d}.json').write_text(json.dumps({'start':start,'end':end,'title':row['title']},ensure_ascii=False),encoding='utf-8')
   print('DONE '+str(i),flush=True)
  except Exception as exc:
   page.screenshot(path=str(OUT/f'error-{i}.png'));ctx.close();errors.append({'chapter':i,'error':str(exc)[:400]});print(errors[-1],flush=True)
 if before is not None:
  after=api.call('GET','/short-drama/'+PID)
  canon=lambda x:json.dumps(x,sort_keys=True,ensure_ascii=False)
  unchanged=canon(before)==canon(after)
  (OUT/'preservation.json').write_text(json.dumps({'projectId':PID,'unchanged':unchanged,'blockedMutations':blocked,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
  assert unchanged and not blocked,'Project changed or mutation attempted'
 browser.close()
 if errors:raise RuntimeError('Incomplete recording')
