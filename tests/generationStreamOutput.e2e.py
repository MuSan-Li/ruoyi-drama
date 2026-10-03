"""Exercise the real workbench with a locally staged SSE response; no model/media calls."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output' / 'story-stream-20261003'
OUTPUT.mkdir(parents=True, exist_ok=True)
thinking_ready = threading.Event()
script_ready = threading.Event()
complete_ready = threading.Event()
completed = threading.Event()
SCRIPT = '《归伞》第一集：重逢\n\n一　巷口。雨夜。\n林舟把伞递给等在屋檐下的老人。\n老人：原来你还记得。\n\n第一集完。'


class StreamHandler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *_):
        pass

    def do_POST(self):
        self.rfile.read(int(self.headers.get('Content-Length', 0)))
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Transfer-Encoding', 'chunked')
        self.end_headers()

        def emit(name, data):
            payload = ('event: ' + name + '\r\ndata: ' + json.dumps(data, ensure_ascii=False) + '\r\n\r\n').encode()
            # Split inside UTF-8 and event lines, as a real network stream can do.
            for chunk in [payload[:21], payload[21:28], payload[28:]]:
                self.wfile.write(f'{len(chunk):x}\r\n'.encode() + chunk + b'\r\n')
                self.wfile.flush()

        emit('phase', {'phase': 'polish', 'status': 'running', 'message': '正在生成固定格式剧本...'})
        assert thinking_ready.wait(30)
        emit('stream', {'phase': 'thinking', 'text': '先建立归还雨伞的冲突，'})
        emit('stream', {'phase': 'thinking', 'text': '再让旧日善意得到回应。'})
        assert script_ready.wait(30)
        emit('stream', {'phase': 'script', 'text': SCRIPT[:30]})
        emit('stream', {'phase': 'script', 'text': SCRIPT[30:]})
        assert complete_ready.wait(30)
        emit('stream', {'phase': 'script', 'status': 'done'})
        completed.set()
        emit('complete', {'projectId': '2100000000000000010'})
        self.wfile.write(b'0\r\n\r\n')
        self.wfile.flush()


server = ThreadingHTTPServer(('127.0.0.1', 0), StreamHandler)
threading.Thread(target=server.serve_forever, daemon=True).start()
project = {'id': '2100000000000000010', 'projectName': '归伞', 'status': 'draft'}
detail = {'project': project, 'script': {'id': '2100000000000000011', 'projectId': project['id'], 'scriptName': '重逢', 'scriptText': SCRIPT, 'tone': '温暖现实', 'outlineText': '归还雨伞，回应旧日善意。'}, 'characters': [], 'locations': [], 'storyboards': []}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.add_init_script("localStorage.setItem('short-drama-user', JSON.stringify({token:'local-stream-test', userInfo:{nickName:'流式验证'}}));")

    def mock_api(route):
        url = urlparse(route.request.url)
        if url.path.endswith('/create-from-idea/stream'):
            route.continue_(url=f'http://127.0.0.1:{server.server_port}/stream')
            return
        if url.path.endswith('/modelList'):
            category = parse_qs(url.query).get('category', ['chat'])[0]
            data = [{'id': '1', 'category': category, 'providerCode': 'atlas', 'modelName': 'local-writing-test', 'modelDescribe': '本地测试模型'}] if category == 'chat' else []
        elif url.path.endswith('/projects'):
            data = [project] if completed.is_set() else []
        elif url.path.endswith('/skills'):
            data = []
        elif url.path.endswith('/' + project['id']):
            data = detail
        else:
            data = []
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'code': 200, 'data': data}, ensure_ascii=False))

    page.route('**/dev-api/**', mock_api)
    try:
        page.goto('http://127.0.0.1:5173/short-drama?fresh=1')
        page.wait_for_load_state('networkidle')
        page.get_by_role('textbox').first.fill('雨夜，一个年轻人归还十年前借来的伞。')
        expect(page.get_by_role('button', name='生成草稿剧本')).to_be_enabled()
        page.get_by_role('button', name='生成草稿剧本').click()
        expect(page.get_by_text('等待模型返回内容', exact=False)).to_be_visible()
        expect(page.get_by_text('已等待 1 秒', exact=False)).to_be_visible(timeout=5000)

        thinking_ready.set()
        expect(page.get_by_text('先建立归还雨伞的冲突，再让旧日善意得到回应。')).to_be_visible()
        expect(page.get_by_text('正在构思剧情，正文返回后会实时显示。')).to_be_visible()
        page.screenshot(path=str(OUTPUT / 'thinking-stream.png'), full_page=True)

        script_ready.set()
        expect(page.locator('.script-stream pre')).to_have_text(SCRIPT)
        expect(page.get_by_text('剧本正文 · 实时输出')).to_be_visible()
        expect(page.get_by_role('heading', name='AI 正在生成剧本...')).to_be_visible()
        assert not page.locator('.thinking-stream').evaluate('(element) => element.open')
        page.screenshot(path=str(OUTPUT / 'script-stream.png'), full_page=True)

        complete_ready.set()
        expect(page.get_by_role('heading', name='剧本审阅')).to_be_visible()
        expect(page.locator('.sse-progress-panel')).to_have_count(0)
        assert not errors, errors
        result = {'passed': True, 'checks': ['waiting-time', 'thinking-before-script', 'UTF-8-chunk-boundaries', 'CRLF-events', 'script-before-completion', 'thinking-collapses', 'completion-loads-review'], 'pageErrors': errors, 'paidRequests': 0}
        (OUTPUT / 'ui-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(result, ensure_ascii=False))
    finally:
        thinking_ready.set()
        script_ready.set()
        complete_ready.set()
        browser.close()
        server.shutdown()
