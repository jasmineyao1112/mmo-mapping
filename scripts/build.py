from pathlib import Path
import json, re, shutil
root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
legacy = root / 'tests' / 'legacy-v1'
if not legacy.exists():
    legacy.mkdir(parents=True, exist_ok=True)
old = dist / 'AI_提取示例.json'
if old.exists():
    shutil.move(str(old), str(legacy / old.name))
docs = {'prompt': (dist/'PROMPT.md').read_text(), 'guide': (dist/'README.md').read_text()}
# Keep the embedded documents usable without fetch(), including file://.
(dist/'submission.js').write_text('window.submissionDocs='+json.dumps(docs,ensure_ascii=False).replace('</','<\\/')+';\n')
html = (dist/'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>'+(dist/'style.css').read_text()+'</style>')
for name in ['model.js','claims.js','extraction.js','insight.js','requirements.js','org.js','help.js','submission.js','insight-views.js','requirements-views.js','org-views.js','app.js']:
    script=(dist/name).read_text().replace('</script','<\\/script')
    html=html.replace('<script src="'+name+'"></script>','<script>'+script+'</script>')
assert not re.search(r'<script[^>]+src=',html)
assert 'href="style.css"' not in html
out=root/'MMO_Mapping_V3.4.0_独立演示.html'
out.write_text(html)
# GitHub Pages 入口：与独立演示 HTML 逐字节一致，部署后访问仓库根路径即可打开。
(root/'index.html').write_text(html)
print(str(out))
print('Standalone bytes:',out.stat().st_size)
