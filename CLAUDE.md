# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TFCU Procedure Formatter is a Claude skill that transforms legacy TFCU policies and procedures into standardized professional Word documents. The skill is packaged as a `.skill` file (ZIP archive) for deployment to Claude.ai, Claude Code, or Claude Desktop.

**Current Version**: v6.1.0

## Build & Package Commands

```bash
# Package the skill for deployment
python package_skill_v5.py
# Output: tfcu-procedure-formatter-v6.1.0.skill

# Install dependencies (within extracted skill)
cd extracted-skill/tfcu-procedure-formatter
pip install -r requirements.txt   # Python: pillow
npm install                       # Node.js: docx, jszip, @xmldom/xmldom

# Run OOXML validation
npm run validate
# Or: node validator/index.js
```

## Architecture

### Directory Structure

```
TFCU-procedure-formatter/
├── package_skill_v5.py              # Packaging script - creates .skill files
├── extracted-skill/
│   └── tfcu-procedure-formatter/    # The actual skill content
│       ├── SKILL.md                 # Main skill documentation (Claude reads this)
│       ├── REFERENCE.md             # Implementation code examples
│       ├── validator/               # 54-spec validation system
│       │   ├── spec-config.js       # SINGLE SOURCE OF TRUTH for all formatting
│       │   ├── validated-helpers.js # Self-correcting document builders
│       │   ├── validation-context.js
│       │   └── validation-errors.js
│       ├── resources/               # Feature documentation
│       │   ├── interactive_wizard.md
│       │   ├── assessment_generator.md
│       │   ├── quick_card_generator.md
│       │   └── visual_elements.md
│       └── scripts/                 # Python utilities
│           ├── validate_procedure.py
│           └── generate_figure_index.py
```

### Key Concepts

**spec-config.js** is the immutable source of truth for all 54 formatting specifications (typography, colors, spacing, borders). All document generation must use these values.

**validated-helpers.js** provides self-correcting helper functions that automatically apply spec-config values. Use these instead of hardcoding values.

**crossDocumentFormatting** (in spec-config.js) ensures consistent formatting across all output documents (procedure, assessment, quick card, validation report).

### Output Bundle

Every procedure generation produces 4 mandatory files:
1. `{ProcedureName}_{YYYYMM}.docx` - Main procedure
2. `{ProcedureName}_Assessment_{YYYYMM}.docx` - Training assessment
3. `{ProcedureName}_QuickCard_{YYYYMM}.docx` - Quick reference card
4. `{ProcedureName}_ValidationReport.txt` - Schema compliance report

### Anti-Hallucination System

The skill has strict rules about TFCU-specific content:
- **HARD-STOP** on: dollar amounts, contacts, approval authorities, policy references, system URLs
- **AUTO-INSERT** with `[SUGGESTED]` markers for: verification steps, callouts, troubleshooting
- **Intervention markers** appear as: bold, red (#C00000), italic, yellow highlight

### Interactive Wizard Phases

1. Intake → 2. Foundation → 3. Step Construction → 3.5. Uncertainty Resolution → 4. QA → 4.5. Section Validation → 5. Output

## Formatting Rules

- **Primary Font**: Calibri
- **Monospace Font**: Consolas (BINs, phone numbers, account numbers)
- **Brand Color**: #154747 (dark teal)
- **Screenshot callouts**: Text references like "(Callout 1)" MUST match the annotation color on screenshots
