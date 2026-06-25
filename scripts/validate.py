import re
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(script_dir, '../download/placement_tracker.html'), encoding='utf-8') as f: s = f.read()

print('Has DOCTYPE:', s.startswith('<!DOCTYPE html>'))
print('Has </html>:', s.rstrip().endswith('</html>'))

opens = len(re.findall(r'<script', s))
closes = len(re.findall(r'</script>', s))
print(f'script open: {opens}, close: {closes}')

js = re.findall(r'<script[^>]*>(.*?)</script>', s, re.DOTALL)
js_all = '\n'.join(js)
braces_open = js_all.count('{')
braces_close = js_all.count('}')
parens_open = js_all.count('(')
parens_close = js_all.count(')')
print(f'braces: {braces_open} open, {braces_close} close, diff={braces_open-braces_close}')
print(f'parens: {parens_open} open, {parens_close} close, diff={parens_open-parens_close}')

features = [
    ('PATTERNS object', 'const PATTERNS = {'),
    ('Theme switcher fn', 'function setTheme'),
    ('Flip card class', 'flip-card'),
    ('Confetti fn', 'fireConfetti'),
    ('Streak fn', 'updateStreak'),
    ('Heatmap class', 'heatmap'),
    ('Pattern modal fn', 'openPattern'),
    ('Today pick class', 'pick-card'),
    ('Midnight theme', "'midnight'"),
    ('Forest theme', '"forest"'),
    ('Cyberpunk theme', '"cyberpunk"'),
    ('Aurora theme', '"aurora"'),
    ('Light theme', '"light"'),
]
for label, needle in features:
    print(f'  {label}: {"YES" if needle in s else "MISSING"}')

# Count patterns explained
pattern_count = len(re.findall(r'^  "[^"]+": \{\r?\n    "?title"?:', js_all, re.MULTILINE))
print(f'Patterns documented: {pattern_count}')

# Try parsing the JS in each script block with esprima if available
try:
    import esprima
    for i, block in enumerate(js):
        try:
            esprima.parseScript(block)
            print(f'  script[{i}]: valid JS')
        except Exception as e:
            print(f'  script[{i}]: ERROR -> {e}')
except ImportError:
    print('esprima not installed, skipping JS syntax check')
