#!/usr/bin/env python3
"""Migrate raw <input type="number"> to ValidatedNumberInput across all page-client.tsx files."""
import re, os, glob

def extract_var_name(expr):
    m = re.search(r'e\s*=>\s*(\w+)\s*\(', expr)
    return m.group(1) if m else None

def migrate_file(filepath):
    content = open(filepath).read()
    if 'ValidatedNumberInput' in content:
        return 0, content
    
    changes = 0
    
    # Pattern: <label className="block rounded-lg..."><span className="text-sm text-gray-300">Label</span>
    # <input type="number" value={var} onChange={e => setVar(+e.target.value)} ... /></label>
    label_input_pattern = re.compile(
        r'<label\s+className="block\s+rounded-lg\s+border\s+border-gray-800\s+bg-gray-900\s+p-4"[^>]*>\s*'
        r'<span\s+className="text-sm\s+text-gray-300">([^<]*)</span>\s*'
        r'<input\s+type="number"\s+'
        r'(value=\{[^}]+\})\s*'
        r'(onChange=\{[^}]+\})\s*'
        r'([^>]*?)(/>)\s*'
        r'</label>',
        re.DOTALL
    )
    
    def replace_label_input(m):
        nonlocal changes
        label_text = m.group(1)
        value_attr = m.group(2)
        onchange_attr = m.group(3)
        remaining = m.group(4)
        
        val_match = re.search(r'value=\{(\w+)', value_attr)
        val_var = val_match.group(1) if val_match else None
        setter = extract_var_name(onchange_attr)
        
        if not val_var or not setter:
            return m.group(0)
        
        step_match = re.search(r'step="([^"]*)"', remaining)
        min_match = re.search(r'min[=}"{]+([^",}\s]*)', remaining)
        max_match = re.search(r'max[=}"{]+([^",}\s]*)', remaining)
        
        props = [f'label="{label_text}"', f'value={{{val_var}}}', f'onChange={{{setter}}}']
        if min_match and min_match.group(1) not in ('', '{'):
            props.append(f'min={{{min_match.group(1)}}}')
        if max_match and max_match.group(1) not in ('', '{'):
            props.append(f'max={{{max_match.group(1)}}}')
        if step_match:
            props.append(f'step="{step_match.group(1)}"')
        
        changes += 1
        return f'<ValidatedNumberInput {" ".join(props)} />'
    
    content = label_input_pattern.sub(replace_label_input, content)
    
    if changes > 0:
        # Compute correct relative import path
        # src/app/category/subcategory/page-client.tsx -> ../../../components/...
        rel_path = os.path.relpath(filepath, "src/app")
        dir_part = os.path.dirname(rel_path)
        depth = dir_part.count('/') + 2  # page-client.tsx is always ≥2 levels from src/
        prefix = '../' * depth
        import_line = f'import ValidatedNumberInput from "{prefix}components/validated-number-input";'
        
        # Add after last import
        import_matches = list(re.finditer(r'^import\s+.*?;\s*$', content, re.MULTILINE))
        if import_matches:
            pos = import_matches[-1].end()
            content = content[:pos] + import_line + '\n' + content[pos:]
        elif '"use client"' in content:
            content = content.replace('"use client"\n', '"use client"\n\n' + import_line + '\n', 1)
    
    return changes, content

total_changes = 0
total_files = 0

for fp in sorted(glob.glob("src/app/**/page-client.tsx", recursive=True)):
    try:
        ch, new = migrate_file(fp)
        if ch > 0:
            with open(fp, 'w') as f:
                f.write(new)
            total_changes += ch
            total_files += 1
    except Exception as e:
        print(f"ERROR {fp}: {e}")

print(f"Migrated {total_changes} inputs in {total_files} files")
