import asyncio, json, re, subprocess, sys
from pathlib import Path
OUT=Path(__file__).resolve().parent.parents[2]/'output/smy-tutorial-video'
sys.path.insert(0,str(OUT.parent/'tutorial-video/vendor'))
import edge_tts

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    source=Path(__file__).resolve().parent/'video-narration.md'
    if source.exists():(OUT/'讲解稿.md').write_text(source.read_text(encoding='utf-8'),encoding='utf-8')
    sections=re.split(r'^## ',(OUT/'讲解稿.md').read_text(encoding='utf-8'),flags=re.M)[1:]
    rows=[]
    for i,s in enumerate(sections):
        title,body=s.split('\n',1)
        text=body.strip().replace('RuoYi Drama','若依 Drama')
        rows.append({'id':f'{i:02d}','title':title,'text':text})
    (OUT/'voice').mkdir(exist_ok=True)
    for row in rows:
        stem=row['id']
        audio=OUT/'voice'/f'{stem}.mp3'
        events=OUT/'voice'/f'{stem}.json'
        if not audio.exists() or not events.exists():
            cues=[]
            communicate=edge_tts.Communicate(row['text'],'zh-CN-YunxiNeural',rate='+0%',boundary='SentenceBoundary')
            with audio.open('wb') as f:
                async for chunk in communicate.stream():
                    if chunk['type']=='audio': f.write(chunk['data'])
                    elif chunk['type'] in ('WordBoundary','SentenceBoundary'): cues.append({k:v for k,v in chunk.items() if k!='type'})
            events.write_text(json.dumps(cues,ensure_ascii=False,indent=2),encoding='utf-8')
        probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',str(audio)]))
        row['duration']=float(probe['format']['duration'])
        row['audio']=str(audio)
        print(json.dumps({'title':row['title'],'duration':row['duration']},ensure_ascii=False),flush=True)
    (OUT/'narration.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    asyncio.run(main())
