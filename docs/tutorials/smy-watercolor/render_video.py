"""Edit recorded chapters, align narration and sentence-timed subtitles, and export MP4."""
import json,re,subprocess,sys
from pathlib import Path
OUT=Path(__file__).resolve().parent.parents[2]/'output/smy-tutorial-video'
ROWS=json.loads((OUT/'narration.json').read_text(encoding='utf-8'))
(OUT/'clips').mkdir(exist_ok=True)
sys.stdout.reconfigure(encoding='utf-8')

def stamp(t):
    ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
def subtitles(i):
    cues=json.loads((OUT/'voice'/f'{i:02d}.json').read_text(encoding='utf-8'))
    lines=[]
    for cue in cues:
        text=cue['text'];parts=[]
        for clause in re.findall(r'[^，。！？；：、]+[，。！？；：、]?',text):
            for a in range(0,len(clause),26):
                piece=clause[a:a+26]
                if parts and len(parts[-1])+len(piece)<=26:parts[-1]+=piece
                else:parts.append(piece)
        offset=cue['offset']/1e7;duration=cue['duration']/1e7;size=sum(map(len,parts)) or 1
        for part in parts:
            span=duration*len(part)/size
            lines.append((offset,offset+span,part));offset+=span
    return [(a,min(b,lines[n+1][0]) if n+1<len(lines) else b,txt) for n,(a,b,txt) in enumerate(lines)]

def run(args):
    subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=open(OUT/'render.log','a',encoding='utf-8'))

for i,row in enumerate(ROWS):
    meta=OUT/'raw'/f'{i:02d}.json'
    dest=OUT/'clips'/f'{i:02d}.mp4'
    if not meta.exists() or (dest.exists() and '--force' not in sys.argv):continue
    m=json.loads(meta.read_text(encoding='utf-8'))
    duration=row['duration']+1.0
    available=m['end']-m['start']
    srt=OUT/'clips'/f'{i:02d}.srt'
    srt.write_text(''.join(f'{n}\n{stamp(a)} --> {stamp(b)}\n{txt}\n\n' for n,(a,b,txt) in enumerate(subtitles(i),1)),encoding='utf-8')
    # The original full viewport is retained. Only pauses and clip timing change.
    relative=f'output/smy-tutorial-video/clips/{i:02d}.srt'
    vf=f"setpts={duration/available:.8f}*(PTS-STARTPTS),fps=30,subtitles=filename='{relative}':force_style='FontName=Microsoft YaHei,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BackColour=&H80000000,BorderStyle=3,Outline=0.5,Shadow=0,MarginV=9',format=yuv420p"
    run(['ffmpeg','-y','-v','warning','-ss',str(m['start']+.25),'-t',str(available),'-i',str(OUT/'raw'/f'{i:02d}.webm'),'-i',row['audio'],'-vf',vf,'-af','apad,loudnorm=I=-16:TP=-1.5:LRA=11','-t',str(duration),'-c:v','libx264','-preset','fast','-crf','18','-threads','4','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart',str(dest)])
    print('RENDERED '+row['id']+' '+row['title'],flush=True)

if '--final' in sys.argv:
    assert all((OUT/'clips'/f'{i:02d}.mp4').exists() for i in range(len(ROWS))),'Recording is incomplete'
    (OUT/'clips'/'concat.txt').write_text(''.join(f"file '{i:02d}.mp4'\n" for i in range(len(ROWS))),encoding='utf-8')
    cursor=0;chapters=[';FFMETADATA1'];globalcues=[]
    for i,row in enumerate(ROWS):
        length=row['duration']+1
        chapters.extend(['[CHAPTER]','TIMEBASE=1/1000',f'START={round(cursor*1000)}',f'END={round((cursor+length)*1000)}',f'title={row["title"]}'])
        globalcues.extend((a+cursor,b+cursor,txt) for a,b,txt in subtitles(i));cursor+=length
    (OUT/'chapters.txt').write_text('\n'.join(chapters)+'\n',encoding='utf-8')
    (OUT/'字幕.srt').write_text(''.join(f'{n}\n{stamp(a)} --> {stamp(b)}\n{txt}\n\n' for n,(a,b,txt) in enumerate(globalcues,1)),encoding='utf-8')
    target=OUT/'上美影水墨淡彩-操作教程.mp4'
    run(['ffmpeg','-y','-v','warning','-f','concat','-safe','0','-i',str(OUT/'clips'/'concat.txt'),'-i',str(OUT/'chapters.txt'),'-map_metadata','1','-map_chapters','1','-c','copy','-movflags','+faststart',str(target)])
    probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-show_streams','-show_chapters','-of','json',str(target)]))
    video=next(s for s in probe['streams'] if s['codec_type']=='video');audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
    assert (video['width'],video['height'])==(1920,1080)
    run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'])
    result={'file':str(target),'duration':float(probe['format']['duration']),'resolution':[1920,1080],'fps':video['r_frame_rate'],'videoCodec':video['codec_name'],'audioCodec':audio['codec_name'],'chapterCount':len(probe['chapters']),'fullDecodePassed':True,'capture':'Playwright actual browser UI video recording','voice':'zh-CN-YunxiNeural','subtitleTiming':'SentenceBoundary audio timestamps; clauses divided inside each sentence','paidProjectMediaRegenerated':False}
    (OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False),flush=True)
