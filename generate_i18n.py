#!/usr/bin/env python3
"""
Scan directory recursively for calls to _(...) and collect the first argument
when it is a string literal. Produce a template.json suitable for translation:

{
    "Original text 1": "",
    "Original text 2": "",
    ...
}

Usage:
    python3 extract_translations.py /path/to/project --out template.json
"""

import os
import sys
import argparse
import json


def extract_strings_from_text(text):
    """
    Find occurrences of _(<string_literal>, ...) and return a list of
    unescaped string values in the order found. Supports ', " and ` quotes.
    """
    results = []
    i = 0
    n = len(text)
    while True:
        idx = text.find('_', i)
        if idx == -1:
            break
        j = idx + 1
        while j < n and text[j].isspace():
            j += 1
        if j >= n or text[j] != '(':
            i = idx + 1
            continue
        j += 1
        while j < n and text[j].isspace():
            j += 1
        if j >= n:
            break
        quote = text[j]
        if quote not in ("'", '"', "`"):
            i = idx + 1
            continue
        j += 1
        start = j
        buf = []
        escaped = False
        while j < n:
            ch = text[j]
            if escaped:
                buf.append('\\' + ch)
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                raw = ''.join(buf)
                try:
                    unescaped = bytes(raw, "utf-8").decode("unicode_escape")
                except Exception:
                    unescaped = raw
                results.append(unescaped)
                j += 1
                break
            else:
                buf.append(ch)
            j += 1
        i = j
    return results


def is_text_file(path):
    """Check if file is likely text (UTF-8 decodable)."""
    try:
        with open(path, "rb") as f:
            chunk = f.read(4096)
        chunk.decode("utf-8")
        return True
    except Exception:
        return False


def find_strings(root):
    """Recursively scan for _() string literals."""
    seen = set()
    ordered = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ('.git', '__pycache__')]
        for fname in filenames:
            path = os.path.join(dirpath, fname)
            try:
                if os.path.getsize(path) > 10 * 1024 * 1024:
                    continue
            except OSError:
                continue
            if not is_text_file(path):
                continue
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except Exception:
                continue
            for s in extract_strings_from_text(content):
                if s not in seen:
                    seen.add(s)
                    ordered.append(s)
    return ordered


def write_template(strings, out_path):
    """Write template.json sorted alphabetically if strings exist."""
    if not strings:
        print("No strings found — template.json not created.")
        return

    strings = sorted(strings, key=str.casefold)
    data = {s: "" for s in strings}
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(strings)} entries to {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Extract translation keys from calls to _()")
    parser.add_argument("root", nargs="?", default=".", help="Root folder to scan (default: current dir)")
    parser.add_argument("--out", "-o", default="template.json", help="Output JSON file (default: template.json)")
    args = parser.parse_args()

    root = args.root
    out = args.out

    if not os.path.isdir(root):
        print(f"Error: {root} is not a directory", file=sys.stderr)
        sys.exit(1)

    strings = find_strings(root)
    write_template(strings, out)


if __name__ == "__main__":
    main()

