#!/usr/bin/env python3
"""
Merge new keys from an updated template.json into an existing translation file.

Behavior:
- Reads template.json and translation file (e.g. de.json).
- For each key in template.json (preserving template order) the script:
    - keeps the translation from the existing translation file if present
    - otherwise inserts the key with an empty string value ("")
- By default, keys that exist in the translation file but are NOT present in the template
  are preserved and appended after the template keys (so you don't lose translations).
- If --remove-obsolete is given, keys present in translation but not in template will be discarded.
- The original translation file is backed up to <translation>.bak (overwrites previous .bak).
- Writes the merged result back to the translation file (atomic write to avoid corruption).

Usage:
    python3 merge_translations.py --template template.json --translation de.json
    python3 merge_translations.py -t template.json -l de.json --remove-obsolete
"""

import argparse
import json
import os
import shutil
import sys
from tempfile import NamedTemporaryFile

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def backup_file(path):
    bak = path + ".bak"
    try:
        shutil.copy2(path, bak)
        print(f"Backup created: {bak}")
    except Exception as e:
        print(f"Warning: could not create backup {bak}: {e}")

def atomic_write_json(path, data):
    # write to temp file in same directory then replace
    dirn = os.path.dirname(os.path.abspath(path)) or "."
    with NamedTemporaryFile("w", encoding="utf-8", dir=dirn, delete=False) as tf:
        json.dump(data, tf, ensure_ascii=False, indent=2)
        tfname = tf.name
    os.replace(tfname, path)

def merge(template_path, translation_path, remove_obsolete=False):
    if not os.path.isfile(template_path):
        print(f"Error: template file not found: {template_path}", file=sys.stderr)
        sys.exit(2)
    if not os.path.isfile(translation_path):
        print(f"Error: translation file not found: {translation_path}", file=sys.stderr)
        sys.exit(2)

    template = load_json(template_path)
    translation = load_json(translation_path)

    # Make sure template is a mapping
    if not isinstance(template, dict) or not isinstance(translation, dict):
        print("Error: both files must be JSON objects (key -> translation).", file=sys.stderr)
        sys.exit(2)

    # Preserve insertion order of template keys
    merged = {}
    new_keys = []
    kept = 0
    for k in template.keys():
        if k in translation and isinstance(translation[k], str) and translation[k] != "":
            merged[k] = translation[k]
            kept += 1
        else:
            merged[k] = ""
            if k not in translation:
                new_keys.append(k)

    # Decide what to do with keys present in translation but not in template
    obsolete_keys = [k for k in translation.keys() if k not in template.keys()]

    if remove_obsolete:
        removed_count = len(obsolete_keys)
        # do nothing (they are not copied)
    else:
        # append obsolete keys preserving their original order
        for k in obsolete_keys:
            merged[k] = translation[k]

        removed_count = 0

    # Backup original translation
    backup_file(translation_path)

    # Atomic write merged result
    atomic_write_json(translation_path, merged)

    print(f"Merged into {translation_path}:")
    print(f"  template keys total: {len(template)}")
    print(f"  existing translations kept: {kept}")
    print(f"  new keys added (empty translation): {len(new_keys)}")
    if not remove_obsolete:
        print(f"  obsolete keys preserved: {len(obsolete_keys)} (appended at the end)")
    else:
        print(f"  obsolete keys removed: {len(obsolete_keys)}")
    if new_keys:
        print("New keys (first 20 shown):")
        for k in new_keys[:20]:
            print("  -", k)
    print("Done.")

def parse_args():
    p = argparse.ArgumentParser(description="Merge new template keys into an existing translation file.")
    p.add_argument("--template", "-t", required=True, help="Path to updated template.json")
    p.add_argument("--translation", "-l", required=True, help="Path to existing translation file (e.g. de.json)")
    p.add_argument("--remove-obsolete", action="store_true",
                   help="Remove keys from the translation that are not present in the template (default: preserve them)")
    return p.parse_args()

if __name__ == "__main__":
    args = parse_args()
    merge(args.template, args.translation, remove_obsolete=args.remove_obsolete)

