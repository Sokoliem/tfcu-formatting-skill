#!/usr/bin/env python3
"""
TFCU Procedure Formatter - Text Color Parser v4.3

Parses procedure text to extract color references for annotation validation.
Finds patterns like "(red callout 1)", "(blue highlight)", "(teal arrow)" and
extracts the expected color-to-annotation mappings for consistency validation.

Usage:
    python text_color_parser.py --input procedure.md --output color_refs.json
    python text_color_parser.py --input procedure.md --figure 1 --verbose
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# =============================================================================
# COLOR REFERENCE PATTERNS
# =============================================================================

# Standard TFCU annotation color palette (must match FigureRegistry.COLOR_PALETTE)
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

# Annotation type keywords
ANNOTATION_TYPES = [
    "callout",
    "arrow",
    "highlight",
    "circle",
    "box",
    "label",
    "marker",
    "number",
    "indicator",
]

# Build color names for regex
COLOR_NAMES = "|".join(COLOR_PALETTE.keys())
ANNOTATION_TYPE_NAMES = "|".join(ANNOTATION_TYPES)


# =============================================================================
# REGEX PATTERNS
# =============================================================================

# Pattern: "(red callout 1)" or "(blue highlight)"
PARENTHETICAL_PATTERN = re.compile(
    rf"\(({COLOR_NAMES})\s+({ANNOTATION_TYPE_NAMES})(?:\s+(\d+))?\)",
    re.IGNORECASE,
)

# Pattern: "red callout 1" without parentheses (in context)
INLINE_PATTERN = re.compile(
    rf"(?:the|see|click|select)\s+({COLOR_NAMES})\s+({ANNOTATION_TYPE_NAMES})(?:\s+(\d+))?",
    re.IGNORECASE,
)

# Pattern: "callout 1 (red)" - number first
NUMBER_FIRST_PATTERN = re.compile(
    rf"({ANNOTATION_TYPE_NAMES})\s+(\d+)\s*\(({COLOR_NAMES})\)",
    re.IGNORECASE,
)

# Pattern: Figure reference "Figure 1" or "(Figure 1)"
FIGURE_REF_PATTERN = re.compile(r"(?:\()?[Ff]igure\s+(\d+)(?:\))?")

# Pattern: circled number references like "①" "②" etc.
CIRCLED_NUMBERS = {
    "①": 1,
    "②": 2,
    "③": 3,
    "④": 4,
    "⑤": 5,
    "⑥": 6,
    "⑦": 7,
    "⑧": 8,
    "⑨": 9,
    "⑩": 10,
}
CIRCLED_PATTERN = re.compile(r"([①②③④⑤⑥⑦⑧⑨⑩])")


# =============================================================================
# PARSER CLASS
# =============================================================================


class TextColorParser:
    """
    Parses procedure text to extract color references for annotations.

    Identifies patterns like:
    - "(red callout 1)" - parenthetical with number
    - "(blue highlight)" - parenthetical without number
    - "the red arrow" - inline reference
    - "callout 1 (red)" - number-first format
    """

    def __init__(self, verbose: bool = False):
        """Initialize parser with optional verbose output."""
        self.verbose = verbose
        self.references = []
        self.by_figure = {}  # {figure_num: [references]}
        self.current_figure = None

    def parse_file(self, file_path: Path) -> List[Dict]:
        """
        Parse a markdown/text file for color references.

        Args:
            file_path: Path to procedure markdown file

        Returns:
            List of color reference dicts
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        return self.parse_text(content)

    def parse_text(self, text: str) -> List[Dict]:
        """
        Parse text content for color references.

        Args:
            text: Procedure text content

        Returns:
            List of color reference dicts
        """
        self.references = []
        self.by_figure = {}
        self.current_figure = None

        lines = text.split("\n")
        for line_num, line in enumerate(lines, 1):
            self._parse_line(line, line_num)

        return self.references

    def _parse_line(self, line: str, line_num: int):
        """Parse a single line for color references and figure context."""
        # Check for figure context
        figure_match = FIGURE_REF_PATTERN.search(line)
        if figure_match:
            self.current_figure = int(figure_match.group(1))
            if self.verbose:
                print(f"  Line {line_num}: Found Figure {self.current_figure} context")

        # Find parenthetical patterns: "(red callout 1)"
        for match in PARENTHETICAL_PATTERN.finditer(line):
            self._add_reference(
                color=match.group(1),
                annotation_type=match.group(2),
                number=int(match.group(3)) if match.group(3) else None,
                line_num=line_num,
                pattern_type="parenthetical",
                context=line.strip(),
            )

        # Find inline patterns: "the red arrow"
        for match in INLINE_PATTERN.finditer(line):
            self._add_reference(
                color=match.group(1),
                annotation_type=match.group(2),
                number=int(match.group(3)) if match.group(3) else None,
                line_num=line_num,
                pattern_type="inline",
                context=line.strip(),
            )

        # Find number-first patterns: "callout 1 (red)"
        for match in NUMBER_FIRST_PATTERN.finditer(line):
            self._add_reference(
                color=match.group(3),
                annotation_type=match.group(1),
                number=int(match.group(2)),
                line_num=line_num,
                pattern_type="number_first",
                context=line.strip(),
            )

        # Find circled numbers with color context
        for match in CIRCLED_PATTERN.finditer(line):
            circled = match.group(1)
            num = CIRCLED_NUMBERS.get(circled)
            if num:
                # Check for color context before the circled number
                before = line[: match.start()]
                color_context = self._find_color_context(before)
                if color_context:
                    self._add_reference(
                        color=color_context,
                        annotation_type="callout",
                        number=num,
                        line_num=line_num,
                        pattern_type="circled",
                        context=line.strip(),
                    )

    def _find_color_context(self, text: str) -> Optional[str]:
        """Find color mentioned in text context."""
        for color in COLOR_PALETTE.keys():
            if re.search(rf"\b{color}\b", text, re.IGNORECASE):
                return color
        return None

    def _add_reference(
        self,
        color: str,
        annotation_type: str,
        number: Optional[int],
        line_num: int,
        pattern_type: str,
        context: str,
    ):
        """Add a color reference to results."""
        color_lower = color.lower()
        ref = {
            "color": color_lower,
            "hex": COLOR_PALETTE.get(color_lower, "#154747"),
            "annotation_type": annotation_type.lower(),
            "number": number,
            "line": line_num,
            "figure": self.current_figure,
            "pattern": pattern_type,
            "context": context[:100] + "..." if len(context) > 100 else context,
        }

        self.references.append(ref)

        # Index by figure
        if self.current_figure:
            if self.current_figure not in self.by_figure:
                self.by_figure[self.current_figure] = []
            self.by_figure[self.current_figure].append(ref)

        if self.verbose:
            num_str = f" {number}" if number else ""
            fig_str = f" (Figure {self.current_figure})" if self.current_figure else ""
            print(
                f"  Line {line_num}: Found {color} {annotation_type}{num_str}{fig_str}"
            )

    def get_expected_colors(self) -> Dict[int, Dict[int, str]]:
        """
        Get expected color mapping from text references.

        Returns:
            Dict mapping figure_num -> {annotation_num: color_name}
        """
        result = {}
        for ref in self.references:
            if ref["figure"] and ref["number"]:
                fig = ref["figure"]
                if fig not in result:
                    result[fig] = {}
                result[fig][ref["number"]] = ref["color"]
        return result

    def to_json(self) -> Dict:
        """Export all references as JSON-serializable dict."""
        return {
            "references": self.references,
            "by_figure": self.by_figure,
            "expected_colors": self.get_expected_colors(),
            "total_count": len(self.references),
            "figures_referenced": list(self.by_figure.keys()),
        }


# =============================================================================
# CLI INTERFACE
# =============================================================================


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Parse procedure text for color references",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python text_color_parser.py --input procedure.md --output color_refs.json
  python text_color_parser.py --input procedure.md --verbose
  python text_color_parser.py --input procedure.md --figure 1
        """,
    )
    parser.add_argument(
        "--input",
        "-i",
        required=True,
        type=Path,
        help="Input procedure markdown file",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Output JSON file (optional, prints to stdout if not specified)",
    )
    parser.add_argument(
        "--figure",
        "-f",
        type=int,
        help="Filter results to specific figure number",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print detailed parsing information",
    )
    parser.add_argument(
        "--summary",
        "-s",
        action="store_true",
        help="Print summary only",
    )

    args = parser.parse_args()

    # Parse file
    if args.verbose:
        print(f"Parsing: {args.input}")

    try:
        text_parser = TextColorParser(verbose=args.verbose)
        text_parser.parse_file(args.input)
    except FileNotFoundError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    # Filter by figure if specified
    if args.figure:
        refs = text_parser.by_figure.get(args.figure, [])
        result = {
            "figure": args.figure,
            "references": refs,
            "count": len(refs),
        }
    else:
        result = text_parser.to_json()

    # Output
    if args.summary:
        print(f"\nColor Reference Summary")
        print(f"=" * 40)
        print(f"Total references: {len(text_parser.references)}")
        print(f"Figures with references: {len(text_parser.by_figure)}")
        for fig_num, refs in sorted(text_parser.by_figure.items()):
            print(f"  Figure {fig_num}: {len(refs)} color references")
            for ref in refs:
                num_str = f" {ref['number']}" if ref["number"] else ""
                print(f"    - {ref['color']} {ref['annotation_type']}{num_str}")
    elif args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Saved to: {args.output}")
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
