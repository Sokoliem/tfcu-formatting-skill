#!/usr/bin/env python3
"""
TFCU Procedure Formatter - Report Generator v4.3

Generates HTML validation reports with visual color swatches showing
annotation color consistency between procedure text and images.

Usage:
    python report_generator.py --registry figure_registry.json --procedure source.md --output report.html
    python report_generator.py --validation-json validation_results.json --output report.html
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# Import sibling modules if available
try:
    from text_color_parser import COLOR_PALETTE, TextColorParser
except ImportError:
    # Standalone mode - define COLOR_PALETTE locally
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
    TextColorParser = None


# =============================================================================
# HTML TEMPLATE
# =============================================================================

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TFCU Color Consistency Report</title>
    <style>
        :root {{
            --tfcu-teal: #154747;
            --tfcu-light-teal: #E8F4F4;
            --success: #548235;
            --warning: #FFC000;
            --error: #C00000;
        }}
        * {{ box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', Calibri, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
        }}
        header {{
            background: var(--tfcu-teal);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
        }}
        header h1 {{
            margin: 0 0 5px 0;
            font-size: 24px;
        }}
        header .subtitle {{
            opacity: 0.8;
            font-size: 14px;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            padding: 20px;
            background: white;
            border-bottom: 1px solid #ddd;
        }}
        .stat-card {{
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            background: #f9f9f9;
        }}
        .stat-card.success {{ background: #E2F0D9; }}
        .stat-card.warning {{ background: #FFF2CC; }}
        .stat-card.error {{ background: #F8D7DA; }}
        .stat-value {{
            font-size: 32px;
            font-weight: bold;
            color: var(--tfcu-teal);
        }}
        .stat-label {{
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            margin-top: 5px;
        }}
        main {{
            background: white;
            padding: 20px;
            border-radius: 0 0 8px 8px;
        }}
        h2 {{
            color: var(--tfcu-teal);
            border-bottom: 2px solid var(--tfcu-light-teal);
            padding-bottom: 10px;
            margin-top: 30px;
        }}
        .figure-card {{
            border: 1px solid #ddd;
            border-radius: 8px;
            margin: 15px 0;
            overflow: hidden;
        }}
        .figure-header {{
            background: var(--tfcu-light-teal);
            padding: 10px 15px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .figure-body {{
            padding: 15px;
        }}
        .color-row {{
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }}
        .color-row:last-child {{
            border-bottom: none;
        }}
        .annotation-num {{
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            margin-right: 15px;
            font-size: 14px;
        }}
        .color-info {{
            flex: 1;
            display: flex;
            gap: 20px;
            align-items: center;
        }}
        .color-swatch {{
            width: 30px;
            height: 30px;
            border-radius: 4px;
            border: 1px solid #ccc;
        }}
        .color-label {{
            font-size: 13px;
            color: #666;
        }}
        .status-badge {{
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }}
        .status-match {{
            background: var(--success);
            color: white;
        }}
        .status-mismatch {{
            background: var(--error);
            color: white;
        }}
        .status-warning {{
            background: var(--warning);
            color: #333;
        }}
        .arrow {{
            margin: 0 10px;
            color: #999;
        }}
        .mismatch-detail {{
            background: #FFF2CC;
            border-left: 4px solid var(--warning);
            padding: 10px 15px;
            margin-top: 10px;
            font-size: 13px;
        }}
        .palette-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }}
        .palette-item {{
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
        }}
        .palette-item .color-swatch {{
            width: 24px;
            height: 24px;
        }}
        footer {{
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 30px;
            padding: 20px;
        }}
        .no-issues {{
            text-align: center;
            padding: 40px;
            color: var(--success);
        }}
        .no-issues svg {{
            width: 64px;
            height: 64px;
            margin-bottom: 15px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Color Consistency Report</h1>
            <div class="subtitle">TFCU Procedure Formatter v4.3 | Generated: {timestamp}</div>
        </header>

        <div class="summary">
            <div class="stat-card {total_class}">
                <div class="stat-value">{total_figures}</div>
                <div class="stat-label">Figures</div>
            </div>
            <div class="stat-card {annotations_class}">
                <div class="stat-value">{total_annotations}</div>
                <div class="stat-label">Annotations</div>
            </div>
            <div class="stat-card {matches_class}">
                <div class="stat-value">{color_matches}</div>
                <div class="stat-label">Color Matches</div>
            </div>
            <div class="stat-card {mismatches_class}">
                <div class="stat-value">{color_mismatches}</div>
                <div class="stat-label">Mismatches</div>
            </div>
        </div>

        <main>
            {content}

            <h2>Color Palette Reference</h2>
            <div class="palette-grid">
                {palette_html}
            </div>
        </main>

        <footer>
            TFCU Procedure Formatter Skill v4.3 | Color Consistency Validation
        </footer>
    </div>
</body>
</html>
"""

FIGURE_CARD_TEMPLATE = """
<div class="figure-card">
    <div class="figure-header">
        <span>Figure {figure_num}</span>
        <span class="status-badge {status_class}">{status_text}</span>
    </div>
    <div class="figure-body">
        {rows}
    </div>
</div>
"""

COLOR_ROW_TEMPLATE = """
<div class="color-row">
    <div class="annotation-num" style="background: {actual_hex};">{num}</div>
    <div class="color-info">
        <div>
            <div class="color-label">Expected (Text)</div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="color-swatch" style="background: {expected_hex};"></div>
                <span>{expected_name}</span>
            </div>
        </div>
        <span class="arrow">→</span>
        <div>
            <div class="color-label">Actual (Image)</div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="color-swatch" style="background: {actual_hex};"></div>
                <span>{actual_name}</span>
            </div>
        </div>
    </div>
    <span class="status-badge {row_status_class}">{row_status}</span>
</div>
"""


# =============================================================================
# REPORT GENERATOR
# =============================================================================


class ReportGenerator:
    """Generates HTML color consistency reports."""

    def __init__(self):
        """Initialize report generator."""
        self.figures = []
        self.color_map = {}
        self.expected_colors = {}
        self.matches = []
        self.mismatches = []

    def load_registry(self, registry_path: Path) -> bool:
        """Load figure registry JSON file."""
        if not registry_path.exists():
            return False

        with open(registry_path, encoding="utf-8") as f:
            data = json.load(f)

        self.figures = data.get("figures", [])
        self.color_map = data.get("color_map", {})
        return True

    def parse_procedure(self, procedure_path: Path) -> bool:
        """Parse procedure text for expected colors."""
        if not procedure_path.exists():
            return False

        with open(procedure_path, encoding="utf-8") as f:
            content = f.read()

        if TextColorParser:
            parser = TextColorParser()
            parser.parse_text(content)
            self.expected_colors = parser.get_expected_colors()
        else:
            # Simple fallback parsing
            self.expected_colors = self._simple_parse(content)

        return True

    def _simple_parse(self, text: str) -> Dict[int, Dict[int, str]]:
        """Simple color reference parsing without full TextColorParser."""
        import re

        result = {}
        current_figure = None

        color_names = "|".join(COLOR_PALETTE.keys())
        pattern = re.compile(
            rf"\(({color_names})\s+(?:callout|arrow|highlight|circle)(?:\s+(\d+))?\)",
            re.IGNORECASE,
        )
        fig_pattern = re.compile(r"[Ff]igure\s+(\d+)")

        for line in text.split("\n"):
            fig_match = fig_pattern.search(line)
            if fig_match:
                current_figure = int(fig_match.group(1))

            for match in pattern.finditer(line):
                color = match.group(1).lower()
                num = int(match.group(2)) if match.group(2) else 1

                if current_figure:
                    if current_figure not in result:
                        result[current_figure] = {}
                    result[current_figure][num] = color

        return result

    def compare_colors(self):
        """Compare expected vs actual colors."""
        self.matches = []
        self.mismatches = []

        for fig_num, expected_anns in self.expected_colors.items():
            fig_str = str(fig_num)
            actual = self.color_map.get(fig_str, self.color_map.get(fig_num, {}))

            for ann_num, expected_color in expected_anns.items():
                ann_str = str(ann_num)
                actual_data = actual.get(ann_str, actual.get(ann_num))

                if actual_data:
                    actual_color = actual_data.get("color_name", "unknown")
                    actual_hex = actual_data.get("hex", "#888888")
                else:
                    actual_color = "not found"
                    actual_hex = "#888888"

                expected_hex = COLOR_PALETTE.get(expected_color, "#888888")

                item = {
                    "figure": fig_num,
                    "annotation": ann_num,
                    "expected_color": expected_color,
                    "expected_hex": expected_hex,
                    "actual_color": actual_color,
                    "actual_hex": actual_hex,
                }

                if self._colors_match(expected_color, actual_color):
                    self.matches.append(item)
                else:
                    self.mismatches.append(item)

    def _colors_match(self, expected: str, actual: str) -> bool:
        """Check if colors match (including equivalents)."""
        if expected.lower() == actual.lower():
            return True

        equivalents = {
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
        }

        expected_equiv = equivalents.get(expected.lower(), [expected.lower()])
        return actual.lower() in expected_equiv

    def generate_html(self) -> str:
        """Generate HTML report."""
        # Build figure cards
        figures_by_num = {}
        for item in self.matches + self.mismatches:
            fig_num = item["figure"]
            if fig_num not in figures_by_num:
                figures_by_num[fig_num] = {"matches": [], "mismatches": []}

            if item in self.matches:
                figures_by_num[fig_num]["matches"].append(item)
            else:
                figures_by_num[fig_num]["mismatches"].append(item)

        content_parts = []

        if self.mismatches:
            content_parts.append("<h2>Color Mismatches</h2>")
            for fig_num in sorted(figures_by_num.keys()):
                data = figures_by_num[fig_num]
                if data["mismatches"]:
                    content_parts.append(
                        self._render_figure_card(fig_num, data, show_mismatches=True)
                    )

        if self.matches:
            content_parts.append("<h2>Verified Matches</h2>")
            for fig_num in sorted(figures_by_num.keys()):
                data = figures_by_num[fig_num]
                if data["matches"] and not data["mismatches"]:
                    content_parts.append(
                        self._render_figure_card(fig_num, data, show_mismatches=False)
                    )

        if not self.matches and not self.mismatches:
            content_parts.append(
                '<div class="no-issues">'
                "<p>No color references found to validate.</p>"
                "<p>Add color references like <code>(red callout 1)</code> to your procedure text.</p>"
                "</div>"
            )

        # Build palette HTML
        palette_items = []
        for name, hex_val in sorted(set(COLOR_PALETTE.items()), key=lambda x: x[0]):
            if name in ["critical", "info", "warning", "success", "primary"]:
                continue  # Skip aliases
            palette_items.append(
                f'<div class="palette-item">'
                f'<div class="color-swatch" style="background: {hex_val};"></div>'
                f"<span>{name}</span>"
                f"</div>"
            )

        # Calculate stats
        total_annotations = sum(len(fig.get("annotations", [])) for fig in self.figures)

        return HTML_TEMPLATE.format(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
            total_figures=len(self.figures),
            total_annotations=total_annotations,
            color_matches=len(self.matches),
            color_mismatches=len(self.mismatches),
            total_class="" if self.figures else "warning",
            annotations_class="" if total_annotations else "warning",
            matches_class="success" if self.matches else "",
            mismatches_class="error" if self.mismatches else "success",
            content="\n".join(content_parts),
            palette_html="\n".join(palette_items),
        )

    def _render_figure_card(
        self, fig_num: int, data: Dict, show_mismatches: bool
    ) -> str:
        """Render a single figure card."""
        items = data["mismatches"] if show_mismatches else data["matches"]
        all_items = data["matches"] + data["mismatches"]

        if data["mismatches"]:
            status_class = "status-mismatch"
            status_text = f"{len(data['mismatches'])} mismatch(es)"
        else:
            status_class = "status-match"
            status_text = "All colors match"

        rows = []
        for item in all_items:
            is_match = item in data["matches"]
            rows.append(
                COLOR_ROW_TEMPLATE.format(
                    num=item["annotation"],
                    expected_hex=item["expected_hex"],
                    expected_name=item["expected_color"],
                    actual_hex=item["actual_hex"],
                    actual_name=item["actual_color"],
                    row_status_class="status-match" if is_match else "status-mismatch",
                    row_status="Match" if is_match else "Mismatch",
                )
            )

        return FIGURE_CARD_TEMPLATE.format(
            figure_num=fig_num,
            status_class=status_class,
            status_text=status_text,
            rows="\n".join(rows),
        )

    def save_html(self, output_path: Path):
        """Save HTML report to file."""
        html = self.generate_html()
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html)


# =============================================================================
# CLI INTERFACE
# =============================================================================


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Generate HTML color consistency report",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python report_generator.py --registry figure_registry.json --procedure source.md --output report.html
  python report_generator.py --registry figure_registry.json --output report.html
        """,
    )
    parser.add_argument(
        "--registry",
        "-r",
        required=True,
        type=Path,
        help="Path to figure_registry.json",
    )
    parser.add_argument(
        "--procedure",
        "-p",
        type=Path,
        help="Path to procedure markdown file (for expected colors)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("color_report.html"),
        help="Output HTML file (default: color_report.html)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print detailed info",
    )

    args = parser.parse_args()

    generator = ReportGenerator()

    # Load registry
    if not generator.load_registry(args.registry):
        print(f"ERROR: Could not load registry: {args.registry}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Loaded {len(generator.figures)} figures from registry")

    # Parse procedure if provided
    if args.procedure:
        if not generator.parse_procedure(args.procedure):
            print(
                f"WARNING: Could not load procedure: {args.procedure}", file=sys.stderr
            )
        elif args.verbose:
            print(
                f"Found {sum(len(v) for v in generator.expected_colors.values())} color references"
            )

    # Compare colors
    generator.compare_colors()

    if args.verbose:
        print(
            f"Matches: {len(generator.matches)}, Mismatches: {len(generator.mismatches)}"
        )

    # Generate report
    generator.save_html(args.output)
    print(f"Report saved to: {args.output}")


if __name__ == "__main__":
    main()
