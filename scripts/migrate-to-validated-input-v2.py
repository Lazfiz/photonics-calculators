#!/usr/bin/env python3
"""Migrate raw <input type="number"> to ValidatedNumberInput across all page-client.tsx files.
v2: Handles the actual pattern found in 217 files where input is on its own line inside label."""
import re, os, glob

def extract_var_name(expr):
    """Extract setter name from onChange={e => setVar(+e.target.value)}"""
    m = re.search(r'e\s*=>\s*(\w+)\s*\(', expr)
    return m.group(1) if m else None

def extract_var_name_alt(expr):
    """Extract setter from onChange={setVar} (no arrow function)"""
    m = re.search(r'onChange=\{(\w+)\}', expr)
    return m.group(1) if m else None

def migrate_file(filepath):
    content = open(filepath).read()
    if 'ValidatedNumberInput' not in content:
        has_import = False
    else:
        has_import = True
    
    changes = 0
    
    # Pattern: <label ...><span ...>Label</span>
    #   <input type="number" value={var} onChange={e => setVar(+e.target.value)} step="..." className="..." />
    # </label>
    # The input can be on the next line after the span closing tag
    label_input_pattern = re.compile(
        r'(<label\s+className="[^"]*"[^>]*>\s*'
        r'<span\s+className="[^"]*">([^<]*)</span>\s*)\n?'
        r'\s*<input\s+type="number"\s+'
        r'value=\{(\w+)\}\s+'
        r'(onChange=\{[^}]+\})\s+'
        r'([^>]*?)(/>)\s*'
        r'(</label>)',
        re.DOTALL
    )
    
    def replace_label_input(m):
        nonlocal changes
        label_open = m.group(1)  # <label...><span...>Label</span>
        label_text = m.group(2)  # Label text
        val_var = m.group(3)     # variable name
        onchange = m.group(4)    # onChange handler
        remaining = m.group(5)   # step, className etc
        self_close = m.group(6)  # />
        label_close = m.group(7) # </label>
        
        setter = extract_var_name(onchange) or extract_var_name_alt(onchange)
        
        if not val_var or not setter:
            return m.group(0)
        
        step_match = re.search(r'step="([^"]*)"', remaining)
        min_match = re.search(r'min=\{([^}]+)\}', remaining)
        max_match = re.search(r'max=\{([^}]+)\}', remaining)
        
        # Clean label text (remove HTML tags like <sub>)
        clean_label = re.sub(r'<[^>]+>', '', label_text).strip()
        
        props = [f'label="{clean_label}"', f'value={{{val_var}}}', f'onChange={{{setter}}}']
        if min_match:
            props.append(f'min={{{min_match.group(1)}}}')
        if max_match:
            props.append(f'max={{{max_match.group(1)}}}')
        if step_match:
            props.append(f'step="{step_match.group(1)}"')
        
        changes += 1
        return f'<ValidatedNumberInput {" ".join(props)} />'
    
    content = label_input_pattern.sub(replace_label_input, content)
    
    if changes > 0 and not has_import:
        # Compute correct relative import path
        rel_path = os.path.relpath(filepath, "src/app")
        dir_part = os.path.dirname(rel_path)
        depth = dir_part.count('/') + 2
        prefix = '../' * depth
        import_line = f'import ValidatedNumberInput from "{prefix}components/validated-number-input";'
        
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
            print(f"  {fp}: {ch} inputs migrated")
    except Exception as e:
        print(f"ERROR {fp}: {e}")

print(f"\nMigrated {total_changes} inputs in {total_files} files")
