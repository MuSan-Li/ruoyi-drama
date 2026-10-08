"""Distribute reviewed skill text; no upstream scripts, APIs or media jobs run."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / 'skills/github-short-drama'

def files():
    entries = json.loads((PACK / 'catalog.json').read_text(encoding='utf-8'))
    for item in entries:
        source = PACK / 'catalog' / item['name']
        if hashlib.sha256((source / 'SKILL.md').read_bytes()).hexdigest() != item['bodySha256']:
            raise RuntimeError(f"分发正文已改变，请先核对并更新目录哈希：{item['name']}")
        for path in sorted(source.rglob('*')):
            if path.is_file():
                yield path, Path('skill-catalog') / item['name'] / path.relative_to(source)
    for path in sorted((PACK / 'default-methods').glob('*/SKILL.md')):
        text = path.read_text(encoding='utf-8')
        name = path.parent.name
        body = f'---\nname: {name}\ndescription: 按阶段复用经项目适配的 GitHub 短剧制作方法\n---\n\n{text}'
        yield body.encode('utf-8'), Path('skills') / name / 'SKILL.md'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend-root', type=Path, required=True)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    target = args.backend_root.resolve() / 'ruoyi-modules/ruoyi-chat/src/main/resources/short-drama'
    if not (args.backend_root / 'ruoyi-modules/ruoyi-chat/pom.xml').is_file():
        parser.error('目标不是 ruoyi-ai 后端工作区')
    pending=[]
    mismatches=[]
    for source, relative in files():
        data = source if isinstance(source, bytes) else source.read_bytes()
        path = target / relative
        if path.exists():
            if path.read_bytes() != data:
                mismatches.append(str(relative))
        else:
            pending.append((path,data))
    # Validate the entire pack before writing anything. Never replace an edit.
    if mismatches:
        raise RuntimeError('保留已有修改，分发内容不同：' + ', '.join(mismatches))
    if args.check and pending:
        raise RuntimeError('后端缺少分发文件：' + ', '.join(str(p.relative_to(target)) for p,_ in pending))
    if not args.check:
        for path,data in pending:
            path.parent.mkdir(parents=True,exist_ok=True)
            with path.open('xb') as handle:
                handle.write(data)
    print(json.dumps({'verified':True,'catalogSkills':15,'createdFiles':0 if args.check else len(pending)},ensure_ascii=False))

if __name__ == '__main__':
    main()
