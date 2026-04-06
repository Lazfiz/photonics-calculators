#!/usr/bin/env python3
"""Migrate useState(number) to useURLState("key", number) across all calculators.

Handles:
- const [varName, setVarName] = useState(NUMBER);
- const [varName, setVarName] = useState<number>(NUMBER);
- Trailing comments preserved
- Import auto-added

Skips:
- Boolean defaults
- String defaults
- UI state variables (is*, has*, show*, active*, etc.)
- Negative defaults
- Files already importing useURLState
"""

import re
import os
import glob
import sys

PATTERN = re.compile(
    r'const\s+\[(\w+),\s*(set\w+)\]\s*=\s*useState(?:<[^>]+>)?\s*\(\s*(-?\d+\.?\d*(?:e[+-]?\d+)?)\s*\)\s*;(\s*//.*)?'
)

UI_PREFIXES = (
    'is', 'has', 'show', 'active', 'selected', 'tab', 'open',
    'visible', 'mounted', 'loaded', 'ready', 'expanded', 'collapsed',
    'hovered', 'focused', 'checked', 'enabled', 'editing', 'dragging',
)

def should_skip(var_name):
    lower = var_name.lower()
    return any(lower.startswith(p) for p in UI_PREFIXES)

def get_import_path(filepath):
    parts = os.path.normpath(filepath).split(os.sep)
    # e.g. ['src', 'app', 'wave-optics', 'gaussian-beam', 'page-client.tsx']
    depth = len(parts) - 2  # subtract 'src' and filename
    return '../' * depth + 'hooks/use-url-state'

def add_import(content, filepath):
    rel = get_import_path(filepath)
    import_line = f'import {{ useURLState }} from "{rel}";'

    # Find last import line
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('import ') or stripped.startswith('import{'):
            last_import_idx = i

    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, import_line)
    else:
        # No imports found — add after "use client"
        for i, line in enumerate(lines):
            if '"use client"' in line:
                lines.insert(i + 1, import_line)
                break
        else:
            lines.insert(0, import_line)

    return '\n'.join(lines)

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'useURLState' in content:
        return False, 'already has useURLState'

    matches = list(PATTERN.finditer(content))
    if not matches:
        return False, 'no numeric useState found'

    conversions = []
    for m in matches:
        var_name = m.group(1)
        setter_name = m.group(2)
        default_val = m.group(3)
        comment = m.group(4) or ''

        if should_skip(var_name):
            continue
        try:
            if float(default_val) < 0:
                continue
        except ValueError:
            continue

        conversions.append((m, var_name, setter_name, default_val, comment))

    if not conversions:
        return False, 'all matches skipped (UI state or negative)'

    # Apply replacements in reverse order to preserve positions
    new_content = content
    for m, var_name, setter_name, default_val, comment in reversed(conversions):
        old = m.group(0)
        new = f'const [{var_name}, {setter_name}] = useURLState("{var_name}", {default_val});{comment}'
        new_content = new_content.replace(old, new, 1)

    # Add import
    new_content = add_import(new_content, filepath)

    with open(filepath, 'w') as f:
        f.write(new_content)

    return True, f'{len(conversions)} conversions'

def main():
    files = sorted(
        glob.glob('src/app/*/page-client.tsx') +
        glob.glob('src/app/*/*/page-client.tsx')
    )

    converted = 0
    skipped = 0
    errors = []

    for filepath in files:
        try:
            ok, reason = process_file(filepath)
            if ok:
                converted += 1
                print(f'  ✓ {filepath} ({reason})')
            else:
                skipped += 1
        except Exception as e:
            errors.append(f'  ✗ {filepath}: {e}')
            print(errors[-1])

    print(f'\nConverted: {converted}, Skipped: {skipped}, Errors: {len(errors)}')

if __name__ == '__main__':
    main()
