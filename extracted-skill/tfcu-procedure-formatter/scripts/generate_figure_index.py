#!/usr/bin/env python3
"""
Generate Figure Index appendix for TFCU procedures.
Outputs structured data for document appendix generation.

Part of TFCU Procedure Formatter Skill v4.4

Enhanced to include:
- Figure titles and descriptions (required)
- Step references
- Markdown appendix output
- Comprehensive grouped index
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List


def generate_index(registry_path: Path) -> Dict:
    """
    Generate comprehensive figure index from registry.

    Args:
        registry_path: Path to figure_registry.json

    Returns:
        dict with:
        - figures: list of figure entries with title, description, section, step
        - by_section: {section_name: [figure_numbers]}
        - annotation_summary: {annotation_type: count}
        - total_figures: int
        - total_annotations: int
        - coverage_stats: {total, annotated, coverage_pct}
        - appendix_markdown: formatted markdown for document appendix
    """
    with open(registry_path, encoding="utf-8") as f:
        registry = json.load(f)

    figures_list = []
    figures_by_section = {}
    annotation_counts = {
        "callout": 0,
        "arrow": 0,
        "highlight": 0,
        "circle": 0,
        "label": 0,
    }

    for fig in registry["figures"]:
        section = fig.get("section", "Uncategorized")
        if section not in figures_by_section:
            figures_by_section[section] = []

        figure_entry = {
            "number": fig["figure_number"],
            "title": fig.get("title", f"Figure {fig['figure_number']}"),
            "description": fig.get("description", "Screenshot"),
            "section": section,
            "step": fig.get("step_reference", ""),
            "annotations_count": len(fig["annotations"]),
            "file": Path(fig["annotated_image"]).name,
            "source_file": Path(fig["source_image"]).name,
        }

        figures_list.append(figure_entry)
        figures_by_section[section].append(fig["figure_number"])

        # Count annotation types
        for ann in fig["annotations"]:
            ann_type = ann.get("type", "unknown")
            if ann_type in annotation_counts:
                annotation_counts[ann_type] += 1
            else:
                annotation_counts[ann_type] = 1

    # Calculate coverage stats
    total_figures = registry["total_count"]
    annotated_figures = sum(
        1 for fig in registry["figures"] if len(fig["annotations"]) > 0
    )
    coverage_pct = (annotated_figures / total_figures * 100) if total_figures > 0 else 0

    # Generate markdown appendix
    appendix_md = generate_markdown_appendix(figures_list, figures_by_section)

    return {
        "title": "Figure Index",
        "generated": datetime.now().isoformat(),
        "figures": figures_list,
        "by_section": figures_by_section,
        "annotation_summary": annotation_counts,
        "total_figures": total_figures,
        "total_annotations": sum(annotation_counts.values()),
        "coverage_stats": {
            "total": total_figures,
            "annotated": annotated_figures,
            "coverage_pct": round(coverage_pct, 1),
        },
        "appendix_markdown": appendix_md,
    }


def generate_markdown_appendix(figures: List[Dict], by_section: Dict) -> str:
    """
    Generate markdown-formatted figure index for document appendix.

    Args:
        figures: List of figure entries
        by_section: Dict mapping section names to figure numbers

    Returns:
        Markdown string for appendix
    """
    lines = [
        "## Figure Index",
        "",
        "| Fig # | Title | Description | Section | Step |",
        "|-------|-------|-------------|---------|------|",
    ]

    for fig in figures:
        step = fig.get("step", "") or "-"
        desc = fig.get("description", "")
        # Truncate long descriptions for table
        if len(desc) > 50:
            desc = desc[:47] + "..."

        lines.append(
            f"| {fig['number']} | {fig['title']} | {desc} | {fig['section']} | {step} |"
        )

    lines.append("")
    lines.append("### Figures by Section")
    lines.append("")

    for section, fig_nums in by_section.items():
        fig_list = ", ".join(str(n) for n in sorted(fig_nums))
        lines.append(f"- **{section}**: Figures {fig_list}")

    lines.append("")
    lines.append(f"*Total: {len(figures)} figures*")

    return "\n".join(lines)


def generate_docx_appendix_data(figures: List[Dict]) -> List[Dict]:
    """
    Generate structured data for DOCX figure index table.

    Args:
        figures: List of figure entries

    Returns:
        List of row data for table generation
    """
    rows = []
    for fig in figures:
        rows.append(
            {
                "figure_number": str(fig["number"]),
                "title": fig["title"],
                "description": fig["description"],
                "section": fig["section"],
                "step_reference": fig.get("step", ""),
            }
        )
    return rows


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Generate Figure Index appendix for TFCU procedures v4.4"
    )
    parser.add_argument(
        "--registry",
        required=True,
        help="Path to figure_registry.json",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Output path for figure_index.json",
    )
    parser.add_argument(
        "--markdown",
        help="Optional: Also output markdown file for appendix",
    )
    args = parser.parse_args()

    registry_path = Path(args.registry)

    # Validate registry exists
    if not registry_path.exists():
        print(f"ERROR: Figure registry not found: {registry_path}", file=sys.stderr)
        print(
            "  Run: python screenshot_processor.py --input images/raw --output images/annotated",
            file=sys.stderr,
        )
        sys.exit(1)

    # Generate index
    index = generate_index(registry_path)

    # Validate all figures have descriptions
    missing_desc = [f for f in index["figures"] if f["description"] == "Screenshot"]
    if missing_desc:
        print(
            "WARNING: The following figures are missing descriptions:", file=sys.stderr
        )
        for fig in missing_desc[:5]:
            print(f"  - Figure {fig['number']}: {fig['title']}", file=sys.stderr)
        if len(missing_desc) > 5:
            print(f"  ... and {len(missing_desc) - 5} more", file=sys.stderr)
        print("", file=sys.stderr)
        print(
            "Add 'description' field to annotations.json for each figure.",
            file=sys.stderr,
        )
        print("", file=sys.stderr)

    # Save JSON output
    output_path = Path(args.output)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

    # Save markdown output if requested
    if args.markdown:
        md_path = Path(args.markdown)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(index["appendix_markdown"])
        print(f"  Markdown appendix: {md_path}")

    # Print summary
    print("=" * 60)
    print("Figure Index Generated (v4.4)")
    print("=" * 60)
    print(f"  Total figures: {index['total_figures']}")
    print(f"  Total annotations: {index['total_annotations']}")
    print(
        f"  Coverage: {index['coverage_stats']['annotated']}/{index['coverage_stats']['total']} ({index['coverage_stats']['coverage_pct']}%)"
    )
    print()
    print("Figures by section:")
    for section, fig_nums in index["by_section"].items():
        print(f"  - {section}: {len(fig_nums)} figures")
    print()
    print("Annotation breakdown:")
    for ann_type, count in index["annotation_summary"].items():
        if count > 0:
            print(f"  - {ann_type}: {count}")
    print()
    print(f"JSON index: {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
