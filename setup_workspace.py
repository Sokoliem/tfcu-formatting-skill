#!/usr/bin/env python3
"""
TFCU Procedure Formatter - Cross-Platform Workspace Setup v4.3.2

This script sets up a workspace for procedure formatting by:
1. Creating directory structure (images/raw, images/annotated)
2. Extracting images from source .docx file
3. Preparing for annotation pipeline

Works on Windows, macOS, and Linux.
"""

import argparse
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path


def check_pandoc():
    """Check if pandoc is installed and provide helpful error if not."""
    try:
        result = subprocess.run(
            ["pandoc", "--version"], capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            version = result.stdout.split("\n")[0] if result.stdout else "unknown"
            return True, version
        return False, None
    except FileNotFoundError:
        return False, None
    except subprocess.TimeoutExpired:
        return False, None
    except Exception:
        return False, None


def setup_workspace(source_docx: Path, workspace: Path = None, verbose: bool = True):
    """
    Extract images and setup workspace from .docx file (cross-platform).

    Args:
        source_docx: Path to source .docx file
        workspace: Path to workspace directory (defaults to current directory)
        verbose: Print progress messages

    Returns:
        dict with paths to created directories
    """
    if workspace is None:
        workspace = Path.cwd()

    if verbose:
        print("=" * 60)
        print("TFCU Workspace Setup v4.3.2")
        print("=" * 60)
        print(f"Source: {source_docx}")
        print(f"Workspace: {workspace}")
        print()

        # Check pandoc availability (used in step 2 of workflow)
        pandoc_ok, pandoc_version = check_pandoc()
        if pandoc_ok:
            print(f"[OK] {pandoc_version}")
        else:
            print("[WARNING] pandoc not found!")
            print(
                "         pandoc is required for step 2: converting .docx to markdown"
            )
            print("         Install from: https://pandoc.org/installing.html")
            print(
                "         Or: brew install pandoc (macOS), apt install pandoc (Linux)"
            )
            print("         Or: choco install pandoc (Windows)")
            print()

    # Validate source exists
    if not source_docx.exists():
        print(f"ERROR: Source file not found: {source_docx}")
        sys.exit(1)

    # Create directory structure
    raw_dir = workspace / "images" / "raw"
    annotated_dir = workspace / "images" / "annotated"
    raw_dir.mkdir(parents=True, exist_ok=True)
    annotated_dir.mkdir(parents=True, exist_ok=True)

    if verbose:
        print(f"✓ Created: {raw_dir}")
        print(f"✓ Created: {annotated_dir}")

    # Extract .docx (it's a ZIP file)
    extract_dir = workspace / "docx_extract"
    if verbose:
        print(f"\nExtracting .docx contents...")

    try:
        with zipfile.ZipFile(source_docx, "r") as zip_ref:
            zip_ref.extractall(extract_dir)
    except zipfile.BadZipFile:
        print(f"ERROR: {source_docx} is not a valid .docx file (not a ZIP archive)")
        sys.exit(1)

    if verbose:
        print(f"✓ Extracted to: {extract_dir}")

    # Copy images
    media_dir = extract_dir / "word" / "media"
    if media_dir.exists():
        image_count = 0
        for img_file in media_dir.iterdir():
            if img_file.is_file():
                shutil.copy(img_file, raw_dir / img_file.name)
                image_count += 1

        if verbose:
            print(f"\n✓ Copied {image_count} images to: {raw_dir}")
    else:
        if verbose:
            print(f"\n⚠️  No images found in {source_docx}")

    if verbose:
        print()
        print("=" * 60)
        print("Workspace Ready")
        print("=" * 60)
        print(f"Raw images: {len(list(raw_dir.iterdir()))} files")
        print()
        print("Next steps:")
        print("  1. Review images in images/raw/")
        print("  2. Create annotations.json (see templates/annotation_template.json)")
        print(
            "  3. Run: python3 screenshot_processor.py --input images/raw --output images/annotated"
        )
        print("=" * 60)

    return {
        "workspace": workspace,
        "raw_images": raw_dir,
        "annotated_images": annotated_dir,
        "docx_extract": extract_dir,
    }


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Setup workspace for TFCU procedure formatting (cross-platform)"
    )
    parser.add_argument(
        "source",
        type=str,
        help="Source .docx file to extract images from",
    )
    parser.add_argument(
        "--workspace",
        "-w",
        type=str,
        help="Workspace directory (default: current directory)",
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Suppress progress messages",
    )

    args = parser.parse_args()

    source_path = Path(args.source)
    workspace_path = Path(args.workspace) if args.workspace else None

    setup_workspace(source_path, workspace_path, verbose=not args.quiet)


if __name__ == "__main__":
    main()
