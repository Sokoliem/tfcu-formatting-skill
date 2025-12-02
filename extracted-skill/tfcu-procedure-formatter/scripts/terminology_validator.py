#!/usr/bin/env python3
"""
TFCU Cross-Procedure Terminology Validator

Validates procedure documents against TFCU terminology standards.
Ensures consistent language across all credit union procedures.

Usage:
    python terminology_validator.py --input procedure.docx
    python terminology_validator.py --input procedure.md --format json
    python terminology_validator.py --input ./procedures/ --batch
"""

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class Violation:
    """Represents a single terminology violation."""

    rule_id: str
    prohibited_term: str
    preferred_term: str
    severity: str
    line_number: int
    column: int
    context: str
    suggestion: str
    category: str


@dataclass
class ValidationResult:
    """Results from validating a single document."""

    file_path: str
    violations: list = field(default_factory=list)
    total_words: int = 0
    violation_count: int = 0
    error_count: int = 0
    warning_count: int = 0
    compliance_score: float = 100.0
    passive_voice_count: int = 0
    long_sentences: list = field(default_factory=list)
    undefined_acronyms: list = field(default_factory=list)

    def add_violation(self, violation: Violation):
        self.violations.append(violation)
        self.violation_count += 1
        if violation.severity == "error":
            self.error_count += 1
        else:
            self.warning_count += 1


class TerminologyValidator:
    """Validates documents against TFCU terminology standards."""

    def __init__(self, rules_path: Optional[Path] = None):
        """Initialize validator with rules configuration."""
        if rules_path is None:
            rules_path = (
                Path(__file__).parent.parent / "resources" / "terminology_rules.json"
            )

        self.rules_path = rules_path
        self.rules = self._load_rules()

    def _load_rules(self) -> dict:
        """Load terminology rules from JSON configuration."""
        if not self.rules_path.exists():
            raise FileNotFoundError(f"Rules file not found: {self.rules_path}")

        with open(self.rules_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _extract_text_from_docx(self, file_path: Path) -> str:
        """Extract text content from a .docx file."""
        try:
            from xml.etree import ElementTree as ET
            from zipfile import ZipFile
        except ImportError as e:
            raise ImportError(f"Required module not available: {e}")

        text_parts = []

        with ZipFile(file_path, "r") as docx:
            # Read main document content
            if "word/document.xml" in docx.namelist():
                with docx.open("word/document.xml") as doc_xml:
                    tree = ET.parse(doc_xml)
                    root = tree.getroot()

                    # Define namespace
                    ns = {
                        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                    }

                    # Extract text from paragraphs
                    for para in root.findall(".//w:p", ns):
                        para_text = []
                        for text_elem in para.findall(".//w:t", ns):
                            if text_elem.text:
                                para_text.append(text_elem.text)
                        if para_text:
                            text_parts.append("".join(para_text))

        return "\n".join(text_parts)

    def _extract_text_from_md(self, file_path: Path) -> str:
        """Extract text content from a markdown file."""
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def _get_context(
        self, text: str, match_start: int, match_end: int, context_chars: int = 50
    ) -> str:
        """Get surrounding context for a match."""
        start = max(0, match_start - context_chars)
        end = min(len(text), match_end + context_chars)

        context = text[start:end]

        # Add ellipsis if truncated
        if start > 0:
            context = "..." + context
        if end < len(text):
            context = context + "..."

        return context.replace("\n", " ").strip()

    def _get_line_number(self, text: str, position: int) -> tuple:
        """Get line number and column for a position in text."""
        lines = text[:position].split("\n")
        line_num = len(lines)
        col = len(lines[-1]) + 1 if lines else 1
        return line_num, col

    def _is_exception(
        self, text: str, match_start: int, match_end: int, exceptions: list
    ) -> bool:
        """Check if match is within an exception context."""
        # Get wider context to check for exceptions
        context_start = max(0, match_start - 30)
        context_end = min(len(text), match_end + 30)
        context = text[context_start:context_end].lower()

        for exception in exceptions:
            if exception.lower() in context:
                return True
        return False

    def _check_passive_voice(self, text: str) -> list:
        """Check for passive voice patterns."""
        passive_matches = []
        patterns = self.rules.get("passive_voice_patterns", [])

        for pattern in patterns:
            for match in re.finditer(re.escape(pattern), text, re.IGNORECASE):
                line_num, col = self._get_line_number(text, match.start())
                context = self._get_context(text, match.start(), match.end())
                passive_matches.append(
                    {
                        "pattern": pattern,
                        "line": line_num,
                        "column": col,
                        "context": context,
                    }
                )

        return passive_matches

    def _check_sentence_length(self, text: str) -> list:
        """Check for sentences exceeding length limits."""
        long_sentences = []
        config = self.rules.get("sentence_length", {})
        target_max = config.get("target_max", 25)
        absolute_max = config.get("absolute_max", 35)

        # Split into sentences (basic approach)
        sentences = re.split(r"[.!?]+", text)

        line_num = 1
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            words = sentence.split()
            word_count = len(words)

            if word_count > target_max:
                severity = "error" if word_count > absolute_max else "warning"
                long_sentences.append(
                    {
                        "sentence": sentence[:100]
                        + ("..." if len(sentence) > 100 else ""),
                        "word_count": word_count,
                        "limit": target_max,
                        "severity": severity,
                    }
                )

            line_num += sentence.count("\n")

        return long_sentences

    def _check_undefined_acronyms(self, text: str) -> list:
        """Check for acronyms that should be defined on first use."""
        undefined = []
        required_definitions = self.rules.get("acronym_definitions_required", [])

        for acronym in required_definitions:
            # Check if acronym appears
            if re.search(r"\b" + re.escape(acronym) + r"\b", text):
                # Check if it's defined (look for pattern like "Term (ACRONYM)" or "ACRONYM (Term)")
                definition_pattern = rf"\([^)]*{re.escape(acronym)}[^)]*\)|{re.escape(acronym)}\s*\([^)]+\)"
                if not re.search(definition_pattern, text, re.IGNORECASE):
                    undefined.append(acronym)

        return undefined

    def validate(self, file_path: Path) -> ValidationResult:
        """Validate a single document against terminology standards."""
        result = ValidationResult(file_path=str(file_path))

        # Extract text based on file type
        suffix = file_path.suffix.lower()
        if suffix == ".docx":
            text = self._extract_text_from_docx(file_path)
        elif suffix in [".md", ".txt"]:
            text = self._extract_text_from_md(file_path)
        else:
            raise ValueError(f"Unsupported file type: {suffix}")

        result.total_words = len(text.split())

        # Check terminology rules
        for rule in self.rules.get("rules", []):
            preferred = rule["preferred"]
            prohibited_terms = rule["prohibited"]
            exceptions = rule.get("context_exceptions", [])

            for term in prohibited_terms:
                # Create word boundary pattern
                pattern = r"\b" + re.escape(term) + r"\b"

                for match in re.finditer(pattern, text, re.IGNORECASE):
                    # Skip if within exception context
                    if self._is_exception(text, match.start(), match.end(), exceptions):
                        continue

                    line_num, col = self._get_line_number(text, match.start())
                    context = self._get_context(text, match.start(), match.end())

                    # Create suggestion
                    matched_text = match.group()
                    if matched_text[0].isupper():
                        suggestion = preferred.capitalize()
                    else:
                        suggestion = preferred

                    violation = Violation(
                        rule_id=rule["id"],
                        prohibited_term=matched_text,
                        preferred_term=preferred,
                        severity=rule["severity"],
                        line_number=line_num,
                        column=col,
                        context=context,
                        suggestion=f"Replace '{matched_text}' with '{suggestion}'",
                        category=rule["category"],
                    )
                    result.add_violation(violation)

        # Check passive voice
        passive_matches = self._check_passive_voice(text)
        result.passive_voice_count = len(passive_matches)

        # Check sentence length
        result.long_sentences = self._check_sentence_length(text)

        # Check undefined acronyms
        result.undefined_acronyms = self._check_undefined_acronyms(text)

        # Calculate compliance score
        # Weight: errors = 2 points, warnings = 1 point
        penalty = (result.error_count * 2) + (result.warning_count * 1)
        # Also penalize for other issues
        penalty += len(result.long_sentences) * 0.5
        penalty += result.passive_voice_count * 0.25
        penalty += len(result.undefined_acronyms) * 0.5

        # Score based on document length (longer docs can have more issues)
        max_penalty = max(10, result.total_words / 50)  # At least 10, or 2% of words
        result.compliance_score = max(0, 100 - (penalty / max_penalty * 100))
        result.compliance_score = round(result.compliance_score, 1)

        return result

    def validate_batch(self, directory: Path, recursive: bool = True) -> list:
        """Validate all documents in a directory."""
        results = []

        patterns = ["*.docx", "*.md"]
        for pattern in patterns:
            if recursive:
                files = directory.rglob(pattern)
            else:
                files = directory.glob(pattern)

            for file_path in files:
                # Skip temp files
                if file_path.name.startswith("~"):
                    continue
                try:
                    result = self.validate(file_path)
                    results.append(result)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}", file=sys.stderr)

        return results


def format_text_report(result: ValidationResult) -> str:
    """Format validation result as human-readable text."""
    lines = []
    lines.append("=" * 70)
    lines.append(f"TFCU Terminology Validation Report")
    lines.append(f"File: {result.file_path}")
    lines.append("=" * 70)
    lines.append("")

    # Summary
    lines.append(f"Compliance Score: {result.compliance_score}%")
    lines.append(f"Total Words: {result.total_words}")
    lines.append(
        f"Violations: {result.violation_count} ({result.error_count} errors, {result.warning_count} warnings)"
    )
    lines.append(f"Passive Voice: {result.passive_voice_count} instances")
    lines.append(f"Long Sentences: {len(result.long_sentences)}")
    lines.append(f"Undefined Acronyms: {len(result.undefined_acronyms)}")
    lines.append("")

    # Terminology Violations
    if result.violations:
        lines.append("-" * 70)
        lines.append("TERMINOLOGY VIOLATIONS")
        lines.append("-" * 70)

        for v in result.violations:
            severity_icon = "X" if v.severity == "error" else "!"
            lines.append(f"[{severity_icon}] Line {v.line_number}: {v.suggestion}")
            lines.append(f"    Context: {v.context}")
            lines.append(f"    Rule: {v.rule_id} ({v.category})")
            lines.append("")

    # Long Sentences
    if result.long_sentences:
        lines.append("-" * 70)
        lines.append("LONG SENTENCES")
        lines.append("-" * 70)

        for s in result.long_sentences:
            icon = "X" if s["severity"] == "error" else "!"
            lines.append(f"[{icon}] {s['word_count']} words (limit: {s['limit']})")
            lines.append(f"    {s['sentence']}")
            lines.append("")

    # Undefined Acronyms
    if result.undefined_acronyms:
        lines.append("-" * 70)
        lines.append("UNDEFINED ACRONYMS")
        lines.append("-" * 70)
        lines.append(f"The following acronyms should be defined on first use:")
        for acronym in result.undefined_acronyms:
            lines.append(f"  - {acronym}")
        lines.append("")

    # Footer
    lines.append("=" * 70)
    if result.compliance_score >= 90:
        lines.append("PASS - Document meets terminology standards")
    elif result.compliance_score >= 70:
        lines.append("REVIEW - Document needs minor corrections")
    else:
        lines.append("FAIL - Document requires significant revision")
    lines.append("=" * 70)

    return "\n".join(lines)


def format_json_report(result: ValidationResult) -> str:
    """Format validation result as JSON."""
    output = {
        "file_path": result.file_path,
        "compliance_score": result.compliance_score,
        "summary": {
            "total_words": result.total_words,
            "violation_count": result.violation_count,
            "error_count": result.error_count,
            "warning_count": result.warning_count,
            "passive_voice_count": result.passive_voice_count,
            "long_sentence_count": len(result.long_sentences),
            "undefined_acronym_count": len(result.undefined_acronyms),
        },
        "violations": [asdict(v) for v in result.violations],
        "long_sentences": result.long_sentences,
        "undefined_acronyms": result.undefined_acronyms,
        "status": (
            "PASS"
            if result.compliance_score >= 90
            else "REVIEW" if result.compliance_score >= 70 else "FAIL"
        ),
    }
    return json.dumps(output, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description="TFCU Cross-Procedure Terminology Validator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Validate a single document:
    python terminology_validator.py --input procedure.docx

  Validate with JSON output:
    python terminology_validator.py --input procedure.md --format json

  Batch validate a directory:
    python terminology_validator.py --input ./procedures/ --batch

  Use custom rules file:
    python terminology_validator.py --input doc.docx --rules custom_rules.json
        """,
    )

    parser.add_argument(
        "--input", "-i", required=True, help="Input file or directory to validate"
    )
    parser.add_argument(
        "--format",
        "-f",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    parser.add_argument(
        "--batch", "-b", action="store_true", help="Validate all documents in directory"
    )
    parser.add_argument("--rules", "-r", help="Path to custom rules JSON file")
    parser.add_argument("--output", "-o", help="Output file (default: stdout)")
    parser.add_argument(
        "--threshold",
        "-t",
        type=float,
        default=70.0,
        help="Minimum compliance score to pass (default: 70)",
    )

    args = parser.parse_args()

    # Initialize validator
    rules_path = Path(args.rules) if args.rules else None
    validator = TerminologyValidator(rules_path)

    input_path = Path(args.input)

    # Validate
    if args.batch:
        if not input_path.is_dir():
            print(f"Error: {input_path} is not a directory", file=sys.stderr)
            sys.exit(1)
        results = validator.validate_batch(input_path)
    else:
        if not input_path.exists():
            print(f"Error: {input_path} does not exist", file=sys.stderr)
            sys.exit(1)
        results = [validator.validate(input_path)]

    # Format output
    output_lines = []
    all_passed = True

    for result in results:
        if args.format == "json":
            output_lines.append(format_json_report(result))
        else:
            output_lines.append(format_text_report(result))

        if result.compliance_score < args.threshold:
            all_passed = False

    output_text = "\n\n".join(output_lines)

    # Write output
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_text)
        print(f"Report written to: {args.output}")
    else:
        print(output_text)

    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
