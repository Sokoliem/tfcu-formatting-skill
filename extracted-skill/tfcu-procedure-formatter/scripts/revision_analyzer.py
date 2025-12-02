#!/usr/bin/env python3
"""
TFCU Revision Analyzer

Analyzes legacy procedure documents for the Interactive Wizard revision mode.
Extracts structure, identifies issues, and preserves institutional knowledge.

Usage:
    python revision_analyzer.py --input procedure.docx
    python revision_analyzer.py --input procedure.docx --format json
"""

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional
from xml.etree import ElementTree as ET
from zipfile import ZipFile


@dataclass
class DocumentSection:
    """Represents a section in the document."""

    name: str
    content: str
    start_position: int
    word_count: int
    has_steps: bool = False
    step_count: int = 0


@dataclass
class Screenshot:
    """Represents a screenshot found in the document."""

    index: int
    filename: str
    position: int
    dimensions: Optional[tuple] = None
    has_caption: bool = False


@dataclass
class InstitutionalKnowledge:
    """Represents content flagged as institutional knowledge."""

    text: str
    position: int
    pattern_matched: str
    action: str  # preserve, review, verify


@dataclass
class AnalysisResult:
    """Complete analysis of a legacy document."""

    file_path: str
    title: str = ""
    word_count: int = 0
    sections: list = field(default_factory=list)
    screenshots: list = field(default_factory=list)
    terminology_violations: list = field(default_factory=list)
    institutional_knowledge: list = field(default_factory=list)
    missing_sections: list = field(default_factory=list)
    structure_issues: list = field(default_factory=list)
    recommendations: list = field(default_factory=list)


class RevisionAnalyzer:
    """Analyzes legacy documents for revision in the Interactive Wizard."""

    # Standard TFCU sections
    EXPECTED_SECTIONS = [
        "header",
        "overview",
        "quick reference",
        "prerequisites",
        "procedure",
        "troubleshooting",
        "revision history",
    ]

    # Patterns for detecting sections
    SECTION_PATTERNS = {
        "header": r"^[A-Z][A-Za-z\s]+(?:Procedure|Guide|Instructions|Process)",
        "overview": r"(?:overview|purpose|introduction|about)",
        "quick reference": r"(?:quick\s*reference|at.a.glance|key\s*info)",
        "prerequisites": r"(?:prerequisites?|before\s*(?:you\s*)?(?:begin|start)|requirements?)",
        "procedure": r"(?:procedure|steps?|instructions?|how\s*to)",
        "troubleshooting": r"(?:troubleshoot|common\s*(?:issues?|problems?)|error|faq)",
        "revision history": r"(?:revision|version|change|history|updated?)",
    }

    # Patterns for institutional knowledge
    KNOWLEDGE_PATTERNS = [
        {
            "pattern": r"\b(always|never|make sure|don't forget|remember to)\b.*\b(because|otherwise|or else)\b",
            "action": "preserve",
            "description": "Learned guidance with explanation",
        },
        {
            "pattern": r"\b(in my experience|we've found|historically|usually|typically)\b",
            "action": "review",
            "description": "Experiential knowledge",
        },
        {
            "pattern": r"\b(workaround|trick|tip from|learned the hard way)\b",
            "action": "preserve",
            "description": "Practical workaround",
        },
        {
            "pattern": r"(?:contact|call|ask)\s+\w+.*(?:if|when|for)",
            "action": "verify",
            "description": "Specific contact reference",
        },
        {
            "pattern": r"\b(note|important|warning|caution)\s*:?\s*.{20,}",
            "action": "preserve",
            "description": "Emphasized guidance",
        },
    ]

    # Terminology rules (simplified from terminology_validator)
    TERMINOLOGY_RULES = [
        {"prohibited": ["click", "choose", "pick", "press"], "preferred": "select"},
        {"prohibited": ["customer", "client", "user"], "preferred": "member"},
        {"prohibited": ["type", "key in", "input"], "preferred": "enter"},
        {"prohibited": ["check", "confirm", "ensure"], "preferred": "verify"},
        {"prohibited": ["page", "window"], "preferred": "screen"},
    ]

    def __init__(self):
        """Initialize the analyzer."""
        pass

    def extract_text_from_docx(self, file_path: Path) -> tuple:
        """Extract text and image info from a .docx file."""
        text_parts = []
        images = []

        with ZipFile(file_path, "r") as docx:
            # Extract main document text
            if "word/document.xml" in docx.namelist():
                with docx.open("word/document.xml") as doc_xml:
                    tree = ET.parse(doc_xml)
                    root = tree.getroot()

                    ns = {
                        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                    }

                    for para in root.findall(".//w:p", ns):
                        para_text = []
                        for text_elem in para.findall(".//w:t", ns):
                            if text_elem.text:
                                para_text.append(text_elem.text)
                        if para_text:
                            text_parts.append("".join(para_text))

            # Find images
            media_files = [f for f in docx.namelist() if f.startswith("word/media/")]
            for i, img_file in enumerate(media_files):
                images.append(
                    Screenshot(
                        index=i + 1,
                        filename=img_file.split("/")[-1],
                        position=i,
                        has_caption=False,
                    )
                )

        return "\n".join(text_parts), images

    def extract_text_from_md(self, file_path: Path) -> tuple:
        """Extract text from markdown file."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Find image references
        images = []
        img_pattern = r"!\[([^\]]*)\]\(([^)]+)\)"
        for i, match in enumerate(re.finditer(img_pattern, content)):
            images.append(
                Screenshot(
                    index=i + 1,
                    filename=match.group(2),
                    position=match.start(),
                    has_caption=bool(match.group(1)),
                )
            )

        return content, images

    def detect_title(self, text: str) -> str:
        """Detect the document title."""
        lines = text.split("\n")
        for line in lines[:10]:  # Check first 10 lines
            line = line.strip()
            if line and len(line) > 5 and len(line) < 100:
                # Skip lines that look like metadata
                if not re.match(r"^(date|department|version|author)", line, re.I):
                    return line
        return "Unknown Title"

    def detect_sections(self, text: str) -> list:
        """Detect and extract document sections."""
        sections = []
        lines = text.split("\n")
        current_section = None
        current_content = []
        current_start = 0

        for i, line in enumerate(lines):
            line_lower = line.lower().strip()

            # Check if this line is a section header
            is_header = False
            section_type = None

            for section_name, pattern in self.SECTION_PATTERNS.items():
                if re.search(pattern, line_lower, re.I):
                    is_header = True
                    section_type = section_name
                    break

            # Also detect ALL CAPS headers
            if (
                not is_header
                and line.strip()
                and line.strip().isupper()
                and len(line.strip()) > 3
            ):
                is_header = True
                section_type = line.strip().lower()

            if is_header:
                # Save previous section
                if current_section:
                    content = "\n".join(current_content)
                    sections.append(
                        DocumentSection(
                            name=current_section,
                            content=content,
                            start_position=current_start,
                            word_count=len(content.split()),
                            has_steps=bool(re.search(r"^\s*\d+\.", content, re.M)),
                            step_count=len(re.findall(r"^\s*\d+\.", content, re.M)),
                        )
                    )

                current_section = section_type or line.strip()
                current_content = []
                current_start = i
            else:
                current_content.append(line)

        # Save last section
        if current_section:
            content = "\n".join(current_content)
            sections.append(
                DocumentSection(
                    name=current_section,
                    content=content,
                    start_position=current_start,
                    word_count=len(content.split()),
                    has_steps=bool(re.search(r"^\s*\d+\.", content, re.M)),
                    step_count=len(re.findall(r"^\s*\d+\.", content, re.M)),
                )
            )

        return sections

    def check_terminology(self, text: str) -> list:
        """Check for terminology violations."""
        violations = []

        for rule in self.TERMINOLOGY_RULES:
            for prohibited in rule["prohibited"]:
                pattern = r"\b" + re.escape(prohibited) + r"\b"
                for match in re.finditer(pattern, text, re.I):
                    # Get context
                    start = max(0, match.start() - 30)
                    end = min(len(text), match.end() + 30)
                    context = text[start:end].replace("\n", " ")

                    violations.append(
                        {
                            "term": match.group(),
                            "preferred": rule["preferred"],
                            "context": f"...{context}...",
                            "position": match.start(),
                        }
                    )

        return violations

    def find_institutional_knowledge(self, text: str) -> list:
        """Find content that appears to be institutional knowledge."""
        knowledge_items = []

        for pattern_info in self.KNOWLEDGE_PATTERNS:
            pattern = pattern_info["pattern"]
            for match in re.finditer(pattern, text, re.I):
                # Get broader context
                start = max(0, match.start() - 20)
                end = min(len(text), match.end() + 50)
                context = text[start:end].replace("\n", " ").strip()

                # Find the full sentence
                sentence_start = text.rfind(".", 0, match.start()) + 1
                sentence_end = text.find(".", match.end())
                if sentence_end == -1:
                    sentence_end = min(len(text), match.end() + 100)

                full_text = text[sentence_start:sentence_end].strip()

                knowledge_items.append(
                    InstitutionalKnowledge(
                        text=full_text,
                        position=match.start(),
                        pattern_matched=pattern_info["description"],
                        action=pattern_info["action"],
                    )
                )

        return knowledge_items

    def identify_missing_sections(self, sections: list) -> list:
        """Identify sections that should be present but aren't."""
        found_sections = {s.name.lower() for s in sections}
        missing = []

        required_sections = ["header", "procedure", "revision history"]
        recommended_sections = ["overview", "troubleshooting"]

        for section in required_sections:
            if not any(section in found.lower() for found in found_sections):
                missing.append({"section": section, "severity": "required"})

        for section in recommended_sections:
            if not any(section in found.lower() for found in found_sections):
                missing.append({"section": section, "severity": "recommended"})

        return missing

    def identify_structure_issues(self, text: str, sections: list) -> list:
        """Identify structural issues in the document."""
        issues = []

        # Check for header table
        if not re.search(r"department|effective date|date updated", text, re.I):
            issues.append(
                {
                    "issue": "No formal header table detected",
                    "recommendation": "Add header table with title, department, and date",
                }
            )

        # Check for revision history
        if not re.search(r"revision|version|changes?\s*made", text, re.I):
            issues.append(
                {
                    "issue": "No revision history detected",
                    "recommendation": "Add revision history table",
                }
            )

        # Check for numbered steps
        step_count = len(re.findall(r"^\s*\d+\.", text, re.M))
        if step_count == 0:
            issues.append(
                {
                    "issue": "No numbered steps detected",
                    "recommendation": "Convert procedural content to numbered steps",
                }
            )

        # Check for very long paragraphs
        paragraphs = text.split("\n\n")
        for i, para in enumerate(paragraphs):
            word_count = len(para.split())
            if word_count > 100:
                issues.append(
                    {
                        "issue": f"Long paragraph detected ({word_count} words)",
                        "recommendation": "Break into smaller chunks or numbered steps",
                    }
                )

        return issues

    def generate_recommendations(self, result: AnalysisResult) -> list:
        """Generate recommendations based on analysis."""
        recommendations = []

        # Terminology recommendations
        if len(result.terminology_violations) > 10:
            recommendations.append(
                {
                    "priority": "high",
                    "category": "terminology",
                    "recommendation": f"Address {len(result.terminology_violations)} terminology violations for consistency",
                }
            )
        elif result.terminology_violations:
            recommendations.append(
                {
                    "priority": "medium",
                    "category": "terminology",
                    "recommendation": f"Fix {len(result.terminology_violations)} terminology inconsistencies",
                }
            )

        # Structure recommendations
        required_missing = [
            m for m in result.missing_sections if m["severity"] == "required"
        ]
        if required_missing:
            recommendations.append(
                {
                    "priority": "high",
                    "category": "structure",
                    "recommendation": f"Add missing required sections: {', '.join(m['section'] for m in required_missing)}",
                }
            )

        # Institutional knowledge recommendations
        preserve_count = len(
            [k for k in result.institutional_knowledge if k.action == "preserve"]
        )
        if preserve_count > 0:
            recommendations.append(
                {
                    "priority": "medium",
                    "category": "content",
                    "recommendation": f"Review {preserve_count} items flagged as institutional knowledge",
                }
            )

        # Screenshot recommendations
        if result.word_count > 500 and len(result.screenshots) < 3:
            recommendations.append(
                {
                    "priority": "medium",
                    "category": "visual",
                    "recommendation": "Consider adding screenshots for complex procedures",
                }
            )

        return recommendations

    def analyze(self, file_path: Path) -> AnalysisResult:
        """Perform complete analysis of a document."""
        result = AnalysisResult(file_path=str(file_path))

        # Extract content
        suffix = file_path.suffix.lower()
        if suffix == ".docx":
            text, images = self.extract_text_from_docx(file_path)
        elif suffix in [".md", ".txt"]:
            text, images = self.extract_text_from_md(file_path)
        else:
            raise ValueError(f"Unsupported file type: {suffix}")

        # Basic info
        result.word_count = len(text.split())
        result.title = self.detect_title(text)
        result.screenshots = images

        # Structure analysis
        result.sections = self.detect_sections(text)
        result.missing_sections = self.identify_missing_sections(result.sections)
        result.structure_issues = self.identify_structure_issues(text, result.sections)

        # Content analysis
        result.terminology_violations = self.check_terminology(text)
        result.institutional_knowledge = self.find_institutional_knowledge(text)

        # Generate recommendations
        result.recommendations = self.generate_recommendations(result)

        return result


def format_text_report(result: AnalysisResult) -> str:
    """Format analysis result as human-readable text."""
    lines = []
    lines.append("=" * 70)
    lines.append("REVISION MODE - DOCUMENT ANALYSIS")
    lines.append("=" * 70)
    lines.append("")
    lines.append(f"File: {result.file_path}")
    lines.append("")

    # Structure Analysis
    lines.append("STRUCTURE ANALYSIS")
    lines.append("-" * 70)
    lines.append(f"  Title identified: {result.title}")
    lines.append(f"  Sections found: {len(result.sections)}")
    for section in result.sections:
        step_info = f" ({section.step_count} steps)" if section.has_steps else ""
        lines.append(f"    - {section.name}{step_info}")

    if result.missing_sections:
        lines.append("")
        for missing in result.missing_sections:
            icon = "X" if missing["severity"] == "required" else "!"
            lines.append(f"  [{icon}] Missing: {missing['section']}")

    if result.structure_issues:
        lines.append("")
        for issue in result.structure_issues:
            lines.append(f"  [!] {issue['issue']}")

    lines.append("")

    # Content Analysis
    lines.append("CONTENT ANALYSIS")
    lines.append("-" * 70)
    lines.append(f"  Word count: {result.word_count}")
    total_steps = sum(s.step_count for s in result.sections)
    lines.append(f"  Steps identified: ~{total_steps}")
    lines.append(f"  Screenshots found: {len(result.screenshots)}")
    lines.append("")

    # Terminology
    lines.append("TERMINOLOGY SCAN")
    lines.append("-" * 70)
    if result.terminology_violations:
        lines.append(f"  {len(result.terminology_violations)} violations found:")
        # Group by term
        term_counts = {}
        for v in result.terminology_violations:
            key = f"'{v['term']}' -> '{v['preferred']}'"
            term_counts[key] = term_counts.get(key, 0) + 1
        for term, count in sorted(term_counts.items(), key=lambda x: -x[1])[:5]:
            lines.append(f"    - {term} ({count} instances)")
    else:
        lines.append("  No terminology violations found")
    lines.append("")

    # Institutional Knowledge
    if result.institutional_knowledge:
        lines.append("INSTITUTIONAL KNOWLEDGE DETECTED")
        lines.append("-" * 70)
        for item in result.institutional_knowledge[:5]:  # Show top 5
            icon = {"preserve": "!", "review": "?", "verify": "~"}.get(item.action, " ")
            lines.append(f"  [{icon}] {item.pattern_matched}")
            # Truncate long text
            text = item.text[:100] + "..." if len(item.text) > 100 else item.text
            lines.append(f'      "{text}"')
            lines.append("")
    lines.append("")

    # Recommendations
    if result.recommendations:
        lines.append("RECOMMENDATIONS")
        lines.append("-" * 70)
        for rec in result.recommendations:
            priority_icon = {"high": "!!!", "medium": "!!", "low": "!"}.get(
                rec["priority"], " "
            )
            lines.append(f"  [{priority_icon}] {rec['recommendation']}")
        lines.append("")

    lines.append("=" * 70)

    return "\n".join(lines)


def format_json_report(result: AnalysisResult) -> str:
    """Format analysis result as JSON."""
    output = {
        "file_path": result.file_path,
        "title": result.title,
        "word_count": result.word_count,
        "summary": {
            "sections_found": len(result.sections),
            "screenshots_found": len(result.screenshots),
            "terminology_violations": len(result.terminology_violations),
            "institutional_knowledge_items": len(result.institutional_knowledge),
            "missing_sections": len(result.missing_sections),
            "structure_issues": len(result.structure_issues),
        },
        "sections": [asdict(s) for s in result.sections],
        "screenshots": [asdict(s) for s in result.screenshots],
        "terminology_violations": result.terminology_violations,
        "institutional_knowledge": [asdict(k) for k in result.institutional_knowledge],
        "missing_sections": result.missing_sections,
        "structure_issues": result.structure_issues,
        "recommendations": result.recommendations,
    }
    return json.dumps(output, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description="TFCU Revision Analyzer - Analyze legacy documents for revision",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Analyze a document:
    python revision_analyzer.py --input procedure.docx

  Get JSON output:
    python revision_analyzer.py --input procedure.docx --format json

  Save to file:
    python revision_analyzer.py --input procedure.docx --output analysis.txt
        """,
    )

    parser.add_argument(
        "--input", "-i", required=True, help="Input document to analyze"
    )
    parser.add_argument(
        "--format",
        "-f",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    parser.add_argument("--output", "-o", help="Output file (default: stdout)")

    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: {input_path} does not exist", file=sys.stderr)
        sys.exit(1)

    analyzer = RevisionAnalyzer()
    result = analyzer.analyze(input_path)

    if args.format == "json":
        output = format_json_report(result)
    else:
        output = format_text_report(result)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"Analysis written to: {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()
