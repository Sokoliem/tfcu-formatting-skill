#!/usr/bin/env python3
"""
TFCU Procedure Formatter - Skill Packager v5.0

Creates a .skill package (ZIP archive) with Linux-compatible line endings
for deployment in the Claude.ai sandbox environment.
"""

import os
import stat
import zipfile
from pathlib import Path

# Configuration
SKILL_NAME = "tfcu-procedure-formatter"
VERSION = "v6.1.0"
SOURCE_DIR = Path("extracted-skill/tfcu-procedure-formatter")
OUTPUT_FILE = f"{SKILL_NAME}-{VERSION}.skill"

# Files/directories to include
INCLUDE_FILES = [
    "SKILL.md",
    "REFERENCE.md",
    "CHANGELOG.md",
    "SPEC_COMPLIANCE.md",
    "FILES.md",
    "requirements.txt",
    "package.json",
    ".gitignore",
    "setup_workspace.py",
    "screenshot_processor.py",
]

INCLUDE_DIRS = [
    "resources",
    "scripts",
    "templates",
    "assets",
    "validator",
    "tests",
]

# File extensions that should have Unix line endings
TEXT_EXTENSIONS = {
    ".py",
    ".md",
    ".json",
    ".txt",
    ".js",
    ".html",
    ".css",
    ".sh",
    ".yml",
    ".yaml",
}


def convert_to_unix_line_endings(content: bytes) -> bytes:
    """Convert Windows line endings (CRLF) to Unix (LF)."""
    return content.replace(b"\r\n", b"\n")


def should_convert_line_endings(filename: str) -> bool:
    """Check if file should have line endings converted."""
    return Path(filename).suffix.lower() in TEXT_EXTENSIONS


def package_skill():
    """Create the .skill package with Linux-compatible files."""

    if not SOURCE_DIR.exists():
        print(f"Error: Source directory '{SOURCE_DIR}' not found!")
        return False

    print(f"Creating {OUTPUT_FILE}...")
    print(f"Source: {SOURCE_DIR.absolute()}")
    print()

    file_count = 0
    converted_count = 0

    with zipfile.ZipFile(OUTPUT_FILE, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add individual files
        for filename in INCLUDE_FILES:
            src_path = SOURCE_DIR / filename
            if src_path.exists():
                content = src_path.read_bytes()

                # Convert line endings for text files
                if should_convert_line_endings(filename):
                    original_len = len(content)
                    content = convert_to_unix_line_endings(content)
                    if len(content) != original_len:
                        converted_count += 1
                        print(f"  [LF] {filename}")
                    else:
                        print(f"  [OK] {filename}")
                else:
                    print(f"  [OK] {filename}")

                # Add to archive with Unix-style path
                arc_name = f"{SKILL_NAME}/{filename}"
                zf.writestr(arc_name, content)
                file_count += 1
            else:
                print(f"  [--] {filename} (not found, skipping)")

        # Add directories recursively
        for dirname in INCLUDE_DIRS:
            dir_path = SOURCE_DIR / dirname
            if dir_path.exists() and dir_path.is_dir():
                for root, dirs, files in os.walk(dir_path):
                    # Skip __pycache__ and .git directories
                    dirs[:] = [
                        d
                        for d in dirs
                        if d not in ("__pycache__", ".git", "node_modules")
                    ]

                    for filename in files:
                        if filename.endswith(".pyc") or filename.startswith("."):
                            continue

                        src_file = Path(root) / filename
                        rel_path = src_file.relative_to(SOURCE_DIR)
                        arc_name = f"{SKILL_NAME}/{rel_path.as_posix()}"

                        content = src_file.read_bytes()

                        # Convert line endings for text files
                        if should_convert_line_endings(filename):
                            original_len = len(content)
                            content = convert_to_unix_line_endings(content)
                            if len(content) != original_len:
                                converted_count += 1
                                print(f"  [LF] {rel_path.as_posix()}")
                            else:
                                print(f"  [OK] {rel_path.as_posix()}")
                        else:
                            print(f"  [OK] {rel_path.as_posix()}")

                        zf.writestr(arc_name, content)
                        file_count += 1
            else:
                print(f"  [--] {dirname}/ (not found, skipping)")

    # Get file size
    size_kb = os.path.getsize(OUTPUT_FILE) / 1024

    print()
    print("=" * 60)
    print(f"Package created: {OUTPUT_FILE}")
    print(f"  Files included: {file_count}")
    print(f"  Line endings converted: {converted_count}")
    print(f"  Package size: {size_kb:.1f} KB")
    print("=" * 60)
    print()
    print("The .skill file is ready for upload to Claude.ai")
    print("Linux sandbox compatibility: Ensured (Unix line endings)")

    return True


if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    package_skill()
