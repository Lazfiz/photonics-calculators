#!/usr/bin/env python3
"""Migrate ALL raw <input type="number"> to ValidatedNumberInput.
Handles multiple patterns found across 214 files."""
import re, os, glob

def extract_var_name(onchange_str):
    """Extract setter from various onChange patterns:
       onChange={e => setVar(+e.target.value)}
       onChange={(e) => setVar(Number(e.target.value))}
       onChange={(e) => setVar(parseFloat(e.target.value))}
       onChange={setVar}
    """
    # Arrow function patterns
    m = re.search(r'=>\s*(\w+)\s*\(', onchange_str)
    if m:
        return m.group(1)
    # Direct setter
    m = re.search(r'onChange=\{(\w+)\}', onchange_str)
    if m:
        return m.group(1)
    return None

def extract_label_text(preceding_context):
    """Extract label text from context before the input."""
    # Pattern 1: <label ...><span ...>Text</span>
    m = re.search(r'<span\s+className="[^"]*text-gray[^"]*">([^<]*(?:<[^>]+>[^<]*)*)</span>', preceding_context)
    if m:
        return re.sub(r'<[^>]+>', '', m.group(1)).strip()
    # Pattern 2: <label ...>Text</label> (label closes after input)
    m = re.search(r'<label[^>]*>([^<]*)</label>', preceding_context)
    if m:
        return m.group(1).strip()
    # Pattern 3: <label ...>Text\n (label doesn't close before input)
    m = re.search(r'<label[^>]*>([^<]{2,60})\s*$', preceding_context)
    if m:
        text = m.group(1).strip()
        if text and not text.startswith('<'):
            return text
    return None

def migrate_file(filepath):
    content = open(filepath).read()
    original = content
    
    changes = 0
    
    # Find all input type="number" that are NOT inside ValidatedNumberInput
    # We process the file finding <input type="number" ... /> blocks
    
    # Pattern for multi-line input
    # <input\n  type="number"\n  value={var}\n  onChange={...}\n  .../>
    # Also single-line: <input type="number" value={var} onChange={...} ... />
    
    # Find each input block and its preceding context (label)
    input_pattern = re.compile(
        r'(<input\s+)(.*?)'
        r'(type="number"\s+)'
        r'(.*?)'
        r'(/>)',
        re.DOTALL
    )
    
    def replace_input(m):
        nonlocal changes
        
        input_open = m.group(1)
        before_type = m.group(2)
        type_attr = m.group(3)
        attrs = m.group(4)
        self_close = m.group(5)
        
        # Skip if this is already inside a ValidatedNumberInput context
        # (shouldn't happen but safety check)
        
        value_match = re.search(r'value=\{(\w+)\}', attrs)
        onchange_match = re.search(r'onChange=\{[^}]+\}', attrs)
        
        if not value_match or not onchange_match:
            return m.group(0)
        
        val_var = value_match.group(1)
        setter = extract_var_name(onchange_match.group(0))
        
        if not setter:
            return m.group(0)
        
        step_match = re.search(r'step="([^"]*)"', attrs)
        min_match = re.search(r'min=\{([^}]+)\}', attrs)
        max_match = re.search(r'max=\{([^}]+)\}', attrs)
        min_num = re.search(r'min="([^"]+)"', attrs)
        max_num = re.search(r'max="([^"]+)"', attrs)
        
        # Get label from preceding context (everything before this match)
        start = m.start()
        preceding = content[max(0, start - 300):start]
        label_text = extract_label_text(preceding)
        
        if not label_text:
            label_text = val_var  # fallback to variable name
        
        props = [f'label="{label_text}"', f'value={{{val_var}}}', f'onChange={{{setter}}}']
        if min_match:
            props.append(f'min={{{min_match.group(1)}}}')
        elif min_num:
            props.append(f'min={{{min_num.group(1)}}}')
        if max_match:
            props.append(f'max={{{max_match.group(1)}}}')
        elif max_num:
            props.append(f'max={{{max_num.group(1)}}}')
        if step_match:
            props.append(f'step="{step_match.group(1)}"')
        
        changes += 1
        return f'<ValidatedNumberInput {" ".join(props)} />'
    
    content = input_pattern.sub(replace_input, content)
    
    # Clean up orphaned <label> and </label> tags that wrapped the now-removed input
    # Pattern: <label className="..."><span ...>text</span>\n  (now empty)  </label>
    content = re.sub(
        r'<label\s+className="[^"]*">\s*<span[^>]*>[^<]*</span>\s*</label>',
        '', content
    )
    # Pattern: <label className="...">text</label> where text is short
    # (don't remove these - they might still be valid labels for ValidatedNumberInput)
    
    # Clean up empty label tags with only whitespace
    content = re.sub(r'<label\s+[^>]*>\s*</label>', '', content)
    
    if changes > 0:
        # Add import if needed
        if 'ValidatedNumberInput' not in original:
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
errors = []

for fp in sorted(glob.glob("src/app/**/page-client.tsx", recursive=True)):
    try:
        ch, new = migrate_file(fp)
        if ch > 0:
            with open(fp, 'w') as f:
                f.write(new)
            total_changes += ch
            total_files += 1
    except Exception as e:
        errors.append(f"{fp}: {e}")

print(f"Migrated {total_changes} inputs in {total_files} files")
if errors:
    print(f"Errors: {len(errors)}")
    for e in errors[:5]:
        print(f"  {e}")
