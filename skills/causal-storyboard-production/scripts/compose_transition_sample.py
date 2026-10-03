"""Small local edit rehearsal, not a generated-film quality certification.

Usage: python compose_transition_sample.py --first a.mp4 --second b.mp4
       --first-in 2 --first-duration 4 --second-in 0 --second-duration 5
       --overlap .3 --output rehearsal.mp4
Choose handles without dialogue: acrossfade overlaps real audio and must not
swallow speech. This helper is for temporal/atmospheric scene changes, not all cuts.
"""
import argparse,json,subprocess
from pathlib import Path

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--first',type=Path,required=True);p.add_argument('--second',type=Path,required=True)
 p.add_argument('--first-in',type=float,default=0);p.add_argument('--second-in',type=float,default=0)
 p.add_argument('--first-duration',type=float,required=True);p.add_argument('--second-duration',type=float,required=True)
 p.add_argument('--overlap',type=float,default=.3);p.add_argument('--output',type=Path,required=True)
 a=p.parse_args()
 if not (0<a.overlap<min(a.first_duration,a.second_duration)):p.error('Overlap must be shorter than both selected clips')
 if min(a.first_in,a.second_in)<0:p.error('Negative source in-point')
 for f in [a.first,a.second]:
  if not f.is_file():p.error(f'Missing input: {f}')
 if a.output.exists():p.error('Choose a new output path; existing edits are preserved')
 a.output.parent.mkdir(parents=True,exist_ok=True)
 graph=[]
 for i,(start,duration) in enumerate([(a.first_in,a.first_duration),(a.second_in,a.second_duration)]):
  graph.append(f'[{i}:v]trim=start={start}:duration={duration},setpts=PTS-STARTPTS,fps=24,scale=1280:720,setsar=1,format=yuv420p,settb=AVTB[v{i}]')
  graph.append(f'[{i}:a]atrim=start={start}:duration={duration},asetpts=PTS-STARTPTS,aresample=48000[a{i}]')
 graph.extend([f'[v0][v1]xfade=transition=fade:duration={a.overlap}:offset={a.first_duration-a.overlap}[v]',f'[a0][a1]acrossfade=d={a.overlap}:c1=tri:c2=tri[a]'])
 cmd=['ffmpeg','-hide_banner','-loglevel','error','-i',str(a.first),'-i',str(a.second),'-filter_complex',';'.join(graph),'-map','[v]','-map','[a]','-c:v','libx264','-crf','18','-preset','fast','-c:a','aac','-b:a','192k','-movflags','+faststart',str(a.output)]
 subprocess.run(cmd,check=True)
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(a.output)]))
 a.output.with_suffix('.json').write_text(json.dumps({'inputs':[str(a.first.resolve()),str(a.second.resolve())],'cut':vars(a),'expectedSeconds':a.first_duration+a.second_duration-a.overlap,'probe':info,'review':'Technical result only; view and listen to selected handles.'},ensure_ascii=False,default=str,indent=2),encoding='utf-8')
 print(a.output.resolve())
if __name__=='__main__':main()
