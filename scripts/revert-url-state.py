#!/usr/bin/env python3
"""Revert useURLState back to useState across all calculator files."""

import re
import glob

pattern = re.compile(
    r'const\s+\[(\w+),\s*(set\w+)\]\s*=\s*useURLState\(["\']([^"\']+)["\'],\s*([^)]+)\)'
)

files = sorted(glob.glob('src/app/*/page-client.tsx') + glob.glob('src/app/*/*/page-client.tsx'))
total = 0

for f in files:
    with open(f) as fh:
        content = fh.read()

    if 'useURLState' not in content:
        continue

    matches = list(pattern.finditer(content))
    if not matches:
        continue

    for m in reversed(matches):
        var_name = m.group(1)
        setter = m.group(2)
        default = m.group(4)
        old = m.group(0)
        new = f'const [{var_name}, {setter}] = useState({default})'
        content = content.replace(old, new, 1)
        total += 1

    # Remove useURLState import line
    content = re.sub(
        r'import\s*\{[^}]*useURLState[^}]*\}\s*from\s*["\'][^"\']+["\']\s*;\s*\n',
        '', content
    )

    with open(f, 'w') as fh:
        fh.write(content)

print(f'Reverted {total} useURLState calls back to useState')
