"""Read-only project/detail review. Reports text issues, never grants media approval."""
import argparse, json, re
from collections import Counter
from pathlib import Path

def obj(value, default):
    if isinstance(value, str):
        try: return json.loads(value)
        except ValueError: return default
    return value if value is not None else default

def dialogue(text):
    result=[]
    for match in re.finditer(r'(?m)^\s*([\u4e00-\u9fffA-Za-z0-9（）()· ，,]{1,30})[:：]\s*([^\n]+)', text):
        speaker=re.sub(r'（[^）]*）|\([^)]*\)', '', match[1]).strip()
        if any(x in speaker for x in ['镜头','场景','画面','动作','字幕','当前空间']): continue
        result.append({'speaker':speaker, 'line':match[2].strip().strip('「」“”')})
    return result

def locate_line(text, line, start=0):
    """Allow original speech split around an action, while retaining text positions."""
    at=text.find(line,start)
    if at>=0:return at,at+len(line)
    stream=[];positions=[]
    for m in re.finditer(r'「([^」]+)」|“([^”]+)”',text[start:]):
        group=1 if m[1] is not None else 2
        stream.extend(m[group]);positions.extend(range(start+m.start(group),start+m.end(group)))
    at=''.join(stream).find(line)
    return (positions[at],positions[at+len(line)-1]+1) if at>=0 else (-1,-1)

def review(data):
    shots=sorted(data.get('storyboards',[]),key=lambda x:x['sceneNo'])
    expected=dialogue(data['script']['scriptText']);text='\n'.join(x.get('videoPrompt','') for x in shots);cursor=0;missing=[]
    for line in expected:
        at,end=locate_line(text,line['line'],cursor)
        if at<0: missing.append(line)
        else: cursor=end
    formats=[];bindings=[];candidates=[];scenes={};local_dialogue=[]
    expected_counts=Counter(x['line'] for x in expected)
    actual_quotes=Counter(m[1] or m[2] for m in re.finditer(r'「([^」]+)」|“([^”]+)”',text))
    duplicates=[{'line':line,'expected':count,'quotedOccurrences':actual_quotes[line]} for line,count in expected_counts.items() if actual_quotes[line]>count]
    cast={c['name']:c for c in data.get('characters',[])};locations={v['name'] for v in data.get('locations',[])}
    for shot in shots:
        n=shot['sceneNo'];prompt=shot.get('videoPrompt','');c=obj(shot.get('continuityJson'),{});issues=[]
        local_cursor=0
        for line in dialogue(shot.get('sourceText','')):
            at,end=locate_line(prompt,line['line'],local_cursor)
            if at<0: local_dialogue.append({'shot':n,**line,'issue':'missing or reordered original line'})
            else:
                if line['speaker'] not in prompt[local_cursor:at]: local_dialogue.append({'shot':n,**line,'issue':'speaker needs review'})
                local_cursor=end
        scenes.setdefault(str(c.get('scene_number','unknown')),[]).append(n)
        if not re.match(r'^【(?:起始构图|首帧实况)】\S',prompt.strip()): issues.append('missing opening state')
        headings=list(re.finditer(r'(?m)^镜头(\d+)\s*[:：]',prompt))
        if [int(m[1]) for m in headings]!=list(range(1,len(headings)+1)) or not headings: issues.append('shot numbering')
        if not re.search(r'\n\s*\n当前空间为',prompt): issues.append('missing closing paragraph')
        if any(m.start()>0 and not re.search(r'\n\s*\n$',prompt[:m.start()]) for m in headings): issues.append('missing blank lines')
        if '【首帧实况】' in prompt and c.get('video_use_start_frame') is False: issues.append('frame disabled')
        if re.search(r'(?m)^\s*\d+(?:\.\d+)?\s*[-—~至]\s*\d+(?:\.\d+)?\s*秒',prompt): issues.append('per-second prose')
        if issues: formats.append({'shot':n,'issues':issues})
        if shot.get('locationName') not in locations: bindings.append({'shot':n,'location':shot.get('locationName')})
        for ref in obj(shot.get('charactersJson'),[]):
            actor=cast.get(ref.get('name'));v=str(ref.get('appearance',''))
            matches=[] if actor is None else [a for a in actor.get('appearances',[]) if v in [str(a['appearanceIndex']),a.get('changeReason'),str(a['id'])]]
            if len(matches)!=1: bindings.append({'shot':n,'character':ref})
            elif re.search('候选|重设计',matches[0].get('changeReason','')): candidates.append({'shot':n,'character':ref})
    return {'projectId':data['project']['id'],'scriptId':data['script']['id'],'shots':len(shots),'sceneCoverage':scenes,'originalDialogueLines':len(expected),'dialogueMissingOrOutOfOrder':missing,'dialoguePerShotIssues':local_dialogue,'duplicateDialogueForReview':duplicates,'formatIssues':formats,'bindingIssues':bindings,'candidateBindingsRequireReview':candidates,'mediaVisualReview':False,'mediaAudioReview':False,'note':'Text checks support editorial review; they do not prove continuity, speaker performance or media quality.'}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('detail',type=Path);p.add_argument('--output',type=Path);a=p.parse_args()
    body=json.dumps(review(json.loads(a.detail.read_text('utf-8-sig'))),ensure_ascii=False,indent=2)
    if a.output: a.output.write_text(body+'\n',encoding='utf-8')
    print(body)
