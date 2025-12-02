#!/usr/bin/env python3
"""
TFCU Procedure Validation v4.4
Enforces annotation, figure index, and color consistency requirements.

Part of TFCU Procedure Formatter Skill v4.4

Features:
- Pre-processing annotation validation (v4.4)
- Required section validation
- Figure reference checking
- Annotation coverage analysis
- Color consistency validation (v4.3)
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# =============================================================================
# COLOR CONSISTENCY VALIDATOR (v4.3)
# =============================================================================


class ColorConsistencyValidator:
    """
    Validates that annotation colors match text references.

    Compares expected colors from procedure text "(red callout 1)" with
    actual colors in figure_registry.json color_map.
    """

    # Standard TFCU annotation color palette
    COLOR_PALETTE = {
        "red": "#C00000",
        "critical": "#C00000",
        "blue": "#2E74B5",
        "info": "#2E74B5",
        "gold": "#FFC000",
        "warning": "#FFC000",
        "yellow": "#FFC000",
        "green": "#548235",
        "success": "#548235",
        "teal": "#154747",
        "primary": "#154747",
        "purple": "#7030A0",
        "orange": "#ED7D31",
    }

    # Equivalent color groups (colors that map to same hex)
    COLOR_EQUIVALENTS = {
        "red": ["red", "critical"],
        "critical": ["red", "critical"],
        "blue": ["blue", "info"],
        "info": ["blue", "info"],
        "gold": ["gold", "warning", "yellow"],
        "warning": ["gold", "warning", "yellow"],
        "yellow": ["gold", "warning", "yellow"],
        "green": ["green", "success"],
        "success": ["green", "success"],
        "teal": ["teal", "primary"],
        "primary": ["teal", "primary"],
        "purple": ["purple"],
        "orange": ["orange"],
    }

    def __init__(self, verbose: bool = False):
        """Initialize validator."""
        self.verbose = verbose
        self.mismatches = []
        self.matches = []
        self.warnings = []

    def validate(
        self,
        doc_content: str,
        registry_path: Path,
    ) -> Tuple[bool, List[str], List[str]]:
        """
        Validate color consistency between text and annotations.

        Args:
            doc_content: Procedure document text
            registry_path: Path to figure_registry.json

        Returns:
            (is_valid, errors, warnings)
        """
        self.mismatches = []
        self.matches = []
        self.warnings = []

        # Load registry
        if not registry_path.exists():
            return True, [], ["Color validation skipped - no registry found"]

        with open(registry_path, encoding="utf-8") as f:
            registry = json.load(f)

        color_map = registry.get("color_map", {})
        if not color_map:
            return True, [], ["Color validation skipped - no color_map in registry"]

        # Parse expected colors from document text
        expected = self._parse_expected_colors(doc_content)

        if not expected:
            self.warnings.append("No color references found in document text")
            return True, [], self.warnings

        # Compare expected vs actual
        errors = []
        for fig_num, annotations in expected.items():
            fig_str = str(fig_num)
            actual_colors = color_map.get(fig_str, color_map.get(fig_num, {}))

            for ann_num, expected_color in annotations.items():
                ann_str = str(ann_num)
                actual = actual_colors.get(ann_str, actual_colors.get(ann_num))

                if actual is None:
                    self.warnings.append(
                        f"Figure {fig_num} annotation {ann_num}: "
                        f"Expected {expected_color}, but annotation not found in registry"
                    )
                    continue

                actual_color = actual.get("color_name", "unknown")

                if self._colors_match(expected_color, actual_color):
                    self.matches.append(
                        {
                            "figure": fig_num,
                            "annotation": ann_num,
                            "expected": expected_color,
                            "actual": actual_color,
                        }
                    )
                    if self.verbose:
                        print(
                            f"  ✓ Figure {fig_num} #{ann_num}: {expected_color} matches"
                        )
                else:
                    mismatch = {
                        "figure": fig_num,
                        "annotation": ann_num,
                        "expected": expected_color,
                        "expected_hex": self.COLOR_PALETTE.get(expected_color, "?"),
                        "actual": actual_color,
                        "actual_hex": actual.get("hex", "?"),
                    }
                    self.mismatches.append(mismatch)
                    errors.append(
                        f"COLOR MISMATCH: Figure {fig_num} annotation {ann_num}: "
                        f"Text says '{expected_color}' but image has '{actual_color}'"
                    )

        is_valid = len(errors) == 0
        return is_valid, errors, self.warnings

    def _parse_expected_colors(self, text: str) -> Dict[int, Dict[int, str]]:
        """
        Parse expected colors from document text.

        Finds patterns like "(red callout 1)" in Figure context.

        Returns:
            {figure_num: {annotation_num: color_name}}
        """
        result = {}
        current_figure = None

        # Color and annotation type patterns
        color_names = "|".join(self.COLOR_PALETTE.keys())
        ann_types = "callout|arrow|highlight|circle|box|label|marker|number"

        # Pattern: "(red callout 1)"
        pattern = re.compile(
            rf"\(({color_names})\s+({ann_types})(?:\s+(\d+))?\)",
            re.IGNORECASE,
        )

        # Figure reference pattern
        fig_pattern = re.compile(r"[Ff]igure\s+(\d+)")

        for line in text.split("\n"):
            # Update figure context
            fig_match = fig_pattern.search(line)
            if fig_match:
                current_figure = int(fig_match.group(1))

            # Find color references
            for match in pattern.finditer(line):
                color = match.group(1).lower()
                ann_num = int(match.group(3)) if match.group(3) else 1

                if current_figure:
                    if current_figure not in result:
                        result[current_figure] = {}
                    result[current_figure][ann_num] = color

        return result

    def _colors_match(self, expected: str, actual: str) -> bool:
        """Check if two color names are equivalent."""
        expected_lower = expected.lower()
        actual_lower = actual.lower()

        # Direct match
        if expected_lower == actual_lower:
            return True

        # Equivalent colors (e.g., red == critical)
        expected_equiv = self.COLOR_EQUIVALENTS.get(expected_lower, [expected_lower])
        return actual_lower in expected_equiv

    def get_summary(self) -> Dict:
        """Get validation summary."""
        return {
            "total_checked": len(self.matches) + len(self.mismatches),
            "matches": len(self.matches),
            "mismatches": len(self.mismatches),
            "warnings": len(self.warnings),
            "is_valid": len(self.mismatches) == 0,
            "details": {
                "matches": self.matches,
                "mismatches": self.mismatches,
                "warnings": self.warnings,
            },
        }


# =============================================================================
# PRE-PROCESSING VALIDATION (v4.4)
# =============================================================================


def validate_annotations_preprocess(
    annotations_path: Path,
    images_dir: Optional[Path] = None,
) -> Tuple[bool, List[str], List[str]]:
    """
    Validate annotations.json before processing.

    Checks:
    - Required fields (description is mandatory)
    - Position bounds (0-100 for percentages)
    - Collision detection warnings

    Args:
        annotations_path: Path to annotations.json
        images_dir: Optional path to images directory for size-based validation

    Returns:
        (is_valid, errors, warnings)
    """
    import math

    errors = []
    warnings = []

    if not annotations_path.exists():
        errors.append(f"Annotations file not found: {annotations_path}")
        return False, errors, warnings

    with open(annotations_path, encoding="utf-8") as f:
        annotations = json.load(f)

    # Skip metadata keys
    meta_keys = ["_comment", "_schema", "_instructions", "_example_minimal"]

    for image_stem, ann_list in annotations.items():
        if image_stem in meta_keys:
            continue

        if not isinstance(ann_list, list):
            warnings.append(
                f"{image_stem}: Expected list of annotations, got {type(ann_list).__name__}"
            )
            continue

        positions = []  # For collision detection

        for i, ann in enumerate(ann_list):
            ann_type = ann.get("type", "unknown")
            ann_num = ann.get("number", i + 1)

            # Check required description field
            if not ann.get("description"):
                errors.append(
                    f"{image_stem}: Annotation #{ann_num} ({ann_type}) missing required 'description' field"
                )

            # Check position bounds
            if ann_type in ("callout", "circle", "label"):
                pos = ann.get("position", {})
                x, y = pos.get("x", 50), pos.get("y", 50)

                if not (0 <= x <= 100):
                    errors.append(
                        f"{image_stem}: Annotation #{ann_num} has invalid x position: {x} (must be 0-100)"
                    )
                if not (0 <= y <= 100):
                    errors.append(
                        f"{image_stem}: Annotation #{ann_num} has invalid y position: {y} (must be 0-100)"
                    )

                # Check for edge positions that might clip
                if x < 5 or x > 95:
                    warnings.append(
                        f"{image_stem}: Annotation #{ann_num} near horizontal edge (x={x}%) - may be clipped"
                    )
                if y < 5 or y > 95:
                    warnings.append(
                        f"{image_stem}: Annotation #{ann_num} near vertical edge (y={y}%) - may be clipped"
                    )

                # Track for collision detection
                positions.append((x, y, ann_num, ann_type))

            elif ann_type == "highlight":
                bbox = ann.get("bbox", {})
                x, y = bbox.get("x", 40), bbox.get("y", 40)
                w, h = bbox.get("w", 20), bbox.get("h", 20)

                if not (0 <= x <= 100) or not (0 <= y <= 100):
                    errors.append(
                        f"{image_stem}: Highlight has invalid position: x={x}, y={y}"
                    )
                if x + w > 100 or y + h > 100:
                    warnings.append(
                        f"{image_stem}: Highlight may extend beyond image bounds"
                    )

            elif ann_type == "arrow":
                start = ann.get("position", {})
                end = ann.get("end", {})

                for pos, name in [(start, "start"), (end, "end")]:
                    px, py = pos.get("x", 50), pos.get("y", 50)
                    if not (0 <= px <= 100) or not (0 <= py <= 100):
                        errors.append(
                            f"{image_stem}: Arrow {name} position invalid: x={px}, y={py}"
                        )

        # Check for potential collisions (annotations too close together)
        for i, (x1, y1, num1, type1) in enumerate(positions):
            for x2, y2, num2, type2 in positions[i + 1 :]:
                distance = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
                if distance < 10:  # Less than 10% apart
                    warnings.append(
                        f"{image_stem}: Annotations #{num1} and #{num2} may overlap (distance: {distance:.1f}%)"
                    )

    # Check for figure metadata
    images_with_metadata = 0
    for image_stem, ann_list in annotations.items():
        if image_stem in meta_keys:
            continue
        if isinstance(ann_list, list) and len(ann_list) > 0:
            first_ann = ann_list[0]
            if first_ann.get("figure_title") or first_ann.get("section"):
                images_with_metadata += 1

    total_images = len([k for k in annotations.keys() if k not in meta_keys])
    if images_with_metadata < total_images:
        warnings.append(
            f"Only {images_with_metadata}/{total_images} images have 'figure_title' or 'section' metadata"
        )

    return len(errors) == 0, errors, warnings


# =============================================================================
# MAIN VALIDATION
# =============================================================================


def validate(
    doc_path: Path,
    figures_path: Path,
    registry_path: Optional[Path] = None,
    check_colors: bool = True,
    verbose: bool = False,
) -> Tuple[bool, List[str]]:
    """
    Validate procedure document against requirements.

    Args:
        doc_path: Path to converted markdown validation file
        figures_path: Path to figure_index.json
        registry_path: Optional path to figure_registry.json for color validation
        check_colors: Whether to run color consistency validation (v4.3)
        verbose: Print detailed validation info

    Returns:
        (is_valid, errors_and_warnings)
    """
    errors = []
    warnings = []
    color_errors = []
    color_warnings = []

    # Load figure index
    if not figures_path.exists():
        errors.append(f"CRITICAL: Figure index not found: {figures_path}")
        errors.append(
            "  Run: python scripts/generate_figure_index.py --registry images/annotated/figure_registry.json --output figure_index.json"
        )
        return False, errors

    with open(figures_path, encoding="utf-8") as f:
        fig_index = json.load(f)

    # Load document
    if not doc_path.exists():
        errors.append(f"CRITICAL: Document not found: {doc_path}")
        return False, errors

    doc_content = doc_path.read_text(encoding="utf-8")

    # Check required sections
    required_sections = ["OVERVIEW", "RELATED", "Revision History"]
    for section in required_sections:
        if section not in doc_content:
            errors.append(f"MISSING SECTION: {section}")

    # Check figure references
    for section_name, figures in fig_index.get("figures_by_section", {}).items():
        for fig in figures:
            fig_num = fig["figure_number"]
            fig_ref_patterns = [
                f"Figure {fig_num}",
                f"figure {fig_num}",
                f"Fig. {fig_num}",
                f"fig. {fig_num}",
            ]

            referenced = any(pattern in doc_content for pattern in fig_ref_patterns)
            if not referenced:
                warnings.append(
                    f"Figure {fig_num} ({fig['source']}) not referenced in document text"
                )

    # Check annotation coverage
    total_figs = fig_index.get("total_figures", 0)
    total_anns = fig_index.get("total_annotations", 0)
    coverage_stats = fig_index.get("coverage_stats", {})

    if total_figs == 0:
        errors.append("CRITICAL: No figures found - run annotation pipeline")
        errors.append(
            "  Run: python screenshot_processor.py --input images/raw --output images/annotated"
        )
    elif total_anns == 0:
        errors.append("CRITICAL: No annotations applied - all figures need annotations")
        errors.append(
            "  Create annotations.json and run: python screenshot_processor.py --input images/raw --output images/annotated --annotations annotations.json"
        )
    elif coverage_stats.get("coverage_pct", 0) < 100:
        warnings.append(
            f"Low annotation coverage: {coverage_stats['annotated']}/{coverage_stats['total']} figures annotated ({coverage_stats['coverage_pct']}%)"
        )

    # Check for Date Updated field
    if "Date Updated:" not in doc_content and "Date updated:" not in doc_content:
        warnings.append("Missing 'Date Updated' field in header table")

    # Check for department field
    if "Department:" not in doc_content:
        warnings.append("Missing 'Department' field")

    # v4.3: Color consistency validation
    if check_colors and registry_path:
        color_validator = ColorConsistencyValidator(verbose=verbose)
        color_valid, color_errors, color_warnings = color_validator.validate(
            doc_content, registry_path
        )
        if not color_valid:
            # Color mismatches are warnings (guided mode), not blocking errors
            warnings.extend(color_errors)
        warnings.extend(color_warnings)

    # Print results
    print("=" * 60)
    print("TFCU Procedure Validation Results v4.3")
    print("=" * 60)

    if errors:
        print(f"\nERRORS ({len(errors)}):")
        for e in errors:
            print(f"  {e}")

    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  {w}")

    if not errors and not warnings:
        print("\nAll validations passed")

    print(f"\nFigures: {total_figs}  |  Annotations: {total_anns}")
    if coverage_stats:
        print(
            f"Coverage: {coverage_stats.get('annotated', 0)}/{coverage_stats.get('total', 0)} ({coverage_stats.get('coverage_pct', 0)}%)"
        )

    # v4.3: Color validation summary
    if check_colors and registry_path and registry_path.exists():
        color_summary = color_validator.get_summary()
        if color_summary["total_checked"] > 0:
            print(
                f"Color Consistency: {color_summary['matches']}/{color_summary['total_checked']} "
                f"({color_summary['mismatches']} mismatches)"
            )

    print("=" * 60)

    return len(errors) == 0, errors + warnings


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Validate TFCU procedure document, figures, and color consistency (v4.4)"
    )

    # Mode selection
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument(
        "--preprocess",
        metavar="ANNOTATIONS",
        help="Pre-process validation mode: validate annotations.json before processing",
    )

    # Post-processing validation options
    parser.add_argument(
        "--doc",
        help="Path to validation.md (converted document)",
    )
    parser.add_argument(
        "--figures",
        help="Path to figure_index.json",
    )
    parser.add_argument(
        "--registry",
        help="Path to figure_registry.json (for color validation)",
    )
    parser.add_argument(
        "--no-color-check",
        action="store_true",
        help="Skip color consistency validation",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print detailed validation info",
    )
    args = parser.parse_args()

    # Pre-process mode
    if args.preprocess:
        print("=" * 60)
        print("TFCU Pre-Processing Validation (v4.4)")
        print("=" * 60)

        is_valid, errors, warnings = validate_annotations_preprocess(
            Path(args.preprocess)
        )

        if errors:
            print(f"\n{len(errors)} ERROR(S):")
            for err in errors:
                print(f"  ✗ {err}")

        if warnings:
            print(f"\n{len(warnings)} WARNING(S):")
            for warn in warnings:
                print(f"  ⚠ {warn}")

        if is_valid and not warnings:
            print("\n✓ All annotations valid")
        elif is_valid:
            print(f"\n✓ Annotations valid with {len(warnings)} warnings")
        else:
            print(f"\n✗ Validation failed with {len(errors)} errors")

        print("=" * 60)
        sys.exit(0 if is_valid else 1)

    # Post-processing mode requires --doc and --figures
    if not args.doc or not args.figures:
        parser.error(
            "--doc and --figures are required (or use --preprocess for pre-processing mode)"
        )

    # Auto-detect registry path if not specified
    registry_path = None
    if args.registry:
        registry_path = Path(args.registry)
    else:
        # Try common locations
        common_paths = [
            Path("images/annotated/figure_registry.json"),
            Path("workspace/images/annotated/figure_registry.json"),
            Path(args.figures).parent / "figure_registry.json",
        ]
        for p in common_paths:
            if p.exists():
                registry_path = p
                if args.verbose:
                    print(f"Auto-detected registry: {registry_path}")
                break

    is_valid, issues = validate(
        Path(args.doc),
        Path(args.figures),
        registry_path=registry_path,
        check_colors=not args.no_color_check,
        verbose=args.verbose,
    )

    # Exit with appropriate code
    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()
