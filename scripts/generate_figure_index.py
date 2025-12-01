#!/usr/bin/env python3
"""
Generate Figure Index appendix for TFCU procedures.
Outputs structured data for document appendix generation.

Part of TFCU Procedure Formatter Skill v4.3
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List


def generate_index(registry_path: Path) -> Dict:
    """
    Generate figure index from registry.

    Args:
        registry_path: Path to figure_registry.json

    Returns:
        dict with:
        - figures_by_section: {section_name: [figure_data]}
        - annotation_summary: {annotation_type: count}
        - total_figures: int
        - total_annotations: int
        - coverage_stats: {total, annotated, coverage_pct}
    """
    with open(registry_path, encoding="utf-8") as f:
        registry = json.load(f)

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

        figures_by_section[section].append(
            {
                "figure_number": fig["figure_number"],
                "source": Path(fig["source_image"]).name,
                "annotated": Path(fig["annotated_image"]).name,
                "annotation_count": len(fig["annotations"]),
                "annotation_types": [a["type"] for a in fig["annotations"]],
                "legend_items": fig.get("legend", []),
            }
        )

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

    return {
        "figures_by_section": figures_by_section,
        "annotation_summary": annotation_counts,
        "total_figures": total_figures,
        "total_annotations": sum(annotation_counts.values()),
        "coverage_stats": {
            "total": total_figures,
            "annotated": annotated_figures,
            "coverage_pct": round(coverage_pct, 1),
        },
    }


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Generate Figure Index appendix for TFCU procedures"
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

    # Save to output
    output_path = Path(args.output)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

    # Print summary
    print("=" * 60)
    print("Figure Index Generated")
    print("=" * 60)
    print(f"  Total figures: {index['total_figures']}")
    print(f"  Total annotations: {index['total_annotations']}")
    print(
        f"  Coverage: {index['coverage_stats']['annotated']}/{index['coverage_stats']['total']} ({index['coverage_stats']['coverage_pct']}%)"
    )
    print()
    print("Annotation breakdown:")
    for ann_type, count in index["annotation_summary"].items():
        if count > 0:
            print(f"  - {ann_type}: {count}")
    print()
    print(f"✓ Figure index saved to: {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
