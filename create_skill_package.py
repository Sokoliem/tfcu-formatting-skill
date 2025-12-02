#!/usr/bin/env python3
"""
Create .skill package with proper Unix-style paths for Claude.ai Desktop.
"""

import os
import zipfile
from pathlib import Path


def create_skill_package(source_dir, output_file):
    """Create a .skill package with forward-slash paths."""
    source_path = Path(source_dir)

    # Remove existing package if present
    if Path(output_file).exists():
        Path(output_file).unlink()

    with zipfile.ZipFile(output_file, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_path):
            # Skip certain directories
            dirs[:] = [
                d for d in dirs if d not in ["__pycache__", ".git", "node_modules"]
            ]

            for file in files:
                # Skip certain files
                if file.endswith((".pyc", ".pyo", ".DS_Store")):
                    continue

                file_path = Path(root) / file
                # Calculate relative path from source
                arcname = file_path.relative_to(source_path)
                # Convert to forward slashes for Unix compatibility
                arcname_str = str(arcname).replace("\\", "/")

                print(f"Adding: {arcname_str}")
                zipf.write(file_path, arcname_str)

    print(f"\n✓ Created: {output_file}")
    print(f"  Size: {Path(output_file).stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    source = r"C:\Users\emsok\Downloads\TFCU-procedure-formatter\extracted-skill\tfcu-procedure-formatter"
    output = r"C:\Users\emsok\Downloads\TFCU-procedure-formatter\tfcu-procedure-formatter-v4.3.1.skill"

    create_skill_package(source, output)
