---
name: tfcu-procedure-formatter
description: >
  Transforms legacy TFCU policies and procedures into standardized professional documents.
  Activate when user requests: (1) reformatting old policies/procedures into TFCU template,
  (2) converting informal documentation to standards, (3) restructuring for clarity/compliance,
  (4) adding flowcharts or visual aids, (5) applying adult learning best practices, or
  (6) creating new procedures from scratch. Enforces teal branding, hierarchical numbering,
  and revision tracking per TFCU template.
---

# TFCU Procedure Formatter v4.5

Transform legacy policies and procedures into professional, standardized documents using the official TFCU Procedure Template.

## Quick Start

```bash
# MANDATORY WORKFLOW - Claude executes these steps

# 0. Install dependencies (one-time setup)
pip install -r requirements.txt   # Python: pillow
npm install                       # Node.js: docx, jszip, @xmldom/xmldom

# 1. Setup workspace (cross-platform)
python3 setup_workspace.py source.docx --workspace ./workspace

# 2. Convert to markdown for content analysis
pandoc source.docx -o workspace/source.md

# 3. Create annotations.json (see Annotation Format below)
# Map each image filename to its annotation instructions

# 4. Annotate screenshots (MANDATORY)
python3 screenshot_processor.py --input workspace/images/raw --output workspace/images/annotated --annotations workspace/annotations.json

# 5. Generate formatted procedure
# Claude generates JavaScript inline using REFERENCE.md helpers, executes with Node.js

# 6. Generate Figure Index
python3 scripts/generate_figure_index.py --registry workspace/images/annotated/figure_registry.json --output workspace/figure_index.json

# 7. Validate output
python3 scripts/validate_procedure.py --doc workspace/source.md --figures workspace/figure_index.json --registry workspace/images/annotated/figure_registry.json
```

See `REFERENCE.md` for complete implementation code and document assembly example.

### Annotation Format

Create `workspace/annotations.json` mapping image filenames (without extension) to annotation arrays:

```json
{
  "image1": [
    {"type": "callout", "position": {"x": 50, "y": 30}, "number": 1, "color": "critical", "description": "Click Login button"},
    {"type": "highlight", "bbox": {"x": 20, "y": 40, "w": 30, "h": 10}, "color": "warning"}
  ],
  "image2": [
    {"type": "arrow", "position": {"x": 10, "y": 20}, "end": {"x": 40, "y": 30}, "color": "info"}
  ]
}
```

**Annotation types:** `callout` (numbered circle), `arrow`, `highlight` (box), `circle`, `label`
**Colors:** `critical` (red), `info` (blue), `warning` (gold), `success` (green), `primary` (teal)

---

## Workflow Execution

Claude orchestrates this skill by:

1. **Analyze** - Read user's source document, identify sections and screenshots
2. **Plan Annotations** - Create `annotations.json` mapping images to callouts/arrows/highlights
3. **Process Images** - Run `screenshot_processor.py` to annotate and register figures
4. **Generate Document** - Write inline JavaScript using REFERENCE.md helper functions
5. **Execute** - Run the generated script with `node -e "..."` or save and execute
6. **Validate** - Run validation to confirm all requirements met

**Important:** Do NOT look for a standalone `generate-procedure.js` file. Generate the document assembly code inline each time using the helpers from REFERENCE.md.

---

## Role

Act as TFCU's compliance and operations officer with expertise in:
- Financial institution regulatory documentation
- Adult learning and instructional design principles
- Process documentation and workflow optimization
- Visual communication (flowcharts, color-coding)

---

## Template Structure

### Required vs. Optional Elements

| Element | Required | Notes |
|---------|----------|-------|
| Header Table | Yes | Procedure name, department, date |
| OVERVIEW | Yes | 2-4 sentence summary |
| RELATED - links | Yes | Policies, Procedures, Forms |
| Body Sections | Yes | Numbered procedural content |
| Revision History | Yes | Table at document end |
| Footer | Yes | Department, procedure name, page number |
| Table of Contents | Optional | For procedures > 3 pages |
| Quick Reference Box | Optional | For frequently-referenced values |
| Prerequisites | Optional | When setup steps are needed |
| Glossary | Optional | When acronyms need definition |
| Flowcharts | Optional | For complex decision trees |

### Output Filename Convention

Generated files follow this pattern:
```
{Department}_{ProcedureName}_{YYYYMM}.docx
```

Example: `Operations_Instant_Issue_Card_202412.docx`

All spaces replaced with underscores, title case preserved.

### Layout Rules

Use **two-column table layout** for steps with screenshots:
- **Left column (55%)**: Step text left-aligned, numbered instructions
- **Right column (45%)**: Screenshot right-aligned, 260-320px width

| Element | Alignment |
|---------|-----------|
| Procedure step text | LEFT |
| Sub-steps (a., b., c.) | LEFT with indent |
| Screenshots in step tables | RIGHT |
| Card/comparison images | CENTER |
| Table headers | CENTER |
| Callout box text | LEFT |
| Header table title | CENTER |

---

## Brand Constants

### Colors

| Use | Hex | Name |
|-----|-----|------|
| Header backgrounds | #154747 | Primary Teal |
| Header row 2 | #E8F4F4 | Light Teal |
| Overview heading | #0F4761 | Overview Teal |
| Text on teal | #FFFFFF | White |
| Alternating rows | #F2F2F2 | Light Gray |
| Body text | #000000 | Black |

### Callout Colors

| Type | Background | Border | Icon |
|------|------------|--------|------|
| WARNING | #FFF2CC | #FFC000 | Warning |
| NOTE | #D1ECF1 | #2E74B5 | Info |
| CRITICAL | #F8D7DA | #C00000 | Stop |
| TIP | #E2F0D9 | #548235 | Check |

### Annotation Colors

| Name | Hex | Use |
|------|-----|-----|
| critical | #C00000 | Primary action, must-see |
| info | #2E74B5 | Informational |
| warning | #FFC000 | Caution |
| success | #548235 | Confirmation |
| primary | #154747 | Navigation (default) |

### Font Sizes (half-points)

| Element | Size |
|---------|------|
| Header title | 32 (16pt) |
| Section headers | 28 (14pt) |
| Body text | 22 (11pt) |
| Sub-steps | 20 (10pt) |
| Table cells | 20 (10pt) |
| Footer | 18 (9pt) |

---

## Callout Box Guidelines

| Type | Use For |
|------|---------|
| WARNING | Actions that could cause errors; common mistakes |
| NOTE | Helpful context; tips; additional information |
| CRITICAL | Compliance requirements; security; must-do items |
| TIP | Best practices; efficiency suggestions |

**Placement:**
- Full-width callouts for critical standalone warnings
- Inline callouts (in step tables) for step-specific warnings
- Place warnings BEFORE the step they apply to
- Limit to 2-3 callouts per section; consolidate related warnings into single callout if source has more

---

## Screenshot Annotation Requirements

### Mandatory Pipeline

All screenshots MUST be processed through the annotation pipeline:
1. Extract images with `setup_workspace.py`
2. Annotate with `screenshot_processor.py`
3. Register in `figure_registry.json`
4. Validate with `validate_procedure.py`

### Color-Matching Rule

Annotation colors MUST match procedure text references. Use this mapping:

| Text Pattern | Color Name | Hex |
|--------------|------------|-----|
| "red" or "critical" | critical | #C00000 |
| "blue" or "info" | info | #2E74B5 |
| "gold", "yellow", or "warning" | warning | #FFC000 |
| "green" or "success" | success | #548235 |
| "teal" or "primary" | primary | #154747 |
| "purple" | purple | #7030A0 |
| "orange" | orange | #ED7D31 |

**Examples:**
- "(red callout 1)" or "(critical callout 1)" = #C00000 annotation
- "(blue highlight)" or "(info highlight)" = #2E74B5 highlight box
- "(teal arrow)" or "(primary arrow)" = #154747 arrow

### Annotation Types

| Type | Use Case |
|------|----------|
| Callout | Button clicks, numbered sequences |
| Arrow | Pointing to elements |
| Highlight | Input fields, data areas |
| Circle | Single focus point |
| Label | Explanatory text |

### Inline Callout References (v4.5)

Annotation callouts are referenced directly in procedure step text using **inline parenthetical references**. The legend is NOT placed on the screenshot image.

**Format:** `(color callout N)` where:
- `color` = red, blue, gold, green, teal, purple, orange
- `N` = the callout number on the screenshot

**Example step with callout references:**

```
1. Access the Card Issuance screen.

   a. Navigate to the Tools menu (teal callout 1)
   b. Select Card Services from the dropdown (teal callout 2)
   c. Click Instant Issue (red callout 3) - this is the primary action
```

**Guidelines:**
- Place the callout reference after the action it describes
- Use the user-friendly color name (red, not critical)
- Sub-steps often map 1:1 with numbered callouts
- Critical/primary actions use red callouts
- Navigation steps use teal callouts
- Informational elements use blue callouts

**Using figure_registry.json:**
The registry provides `callouts_for_text` with ready-to-use references:

```json
{
  "figure_number": 1,
  "callouts_for_text": [
    {"number": 1, "color": "teal", "description": "Navigate to Tools menu", "inline_reference": "(teal callout 1)"},
    {"number": 2, "color": "teal", "description": "Select Card Services", "inline_reference": "(teal callout 2)"},
    {"number": 3, "color": "red", "description": "Click Instant Issue", "inline_reference": "(red callout 3)"}
  ]
}
```

---

## Writing Standards

### Do
- Start every step with an action verb (Select, Enter, Verify, Click)
- Keep sentences under 25 words
- Define acronyms on first use
- Use "you" to address the reader
- Put warnings BEFORE the step they apply to
- Provide examples for data entry formats

### Don't
- Use passive voice ("The card should be selected")
- Mix terminology (select/click/choose - pick one)
- Exceed 35 words per sentence
- Bury critical information in paragraphs

### Consistent Terminology

| Use | Instead Of |
|-----|------------|
| select | click, choose, pick |
| member | customer, client, user |
| enter | type, key in, input |
| screen | page, window (unless popup) |
| verify | check, confirm, ensure |

---

## Default Values

When source document lacks information, use these defaults:

| Missing Element | Default Value |
|-----------------|---------------|
| Department | "Operations" |
| Date | Current month and year (e.g., "December 2024") |
| Revision History | Single row: current date, "Author", "Initial version" |
| Overview | Extract first paragraph, or "[Overview to be added]" |
| Related Links | "None specified" (section still required) |
| Prerequisites | Omit section entirely if none needed |
| Screenshots | Proceed with text-only steps (valid but not preferred) |

---

## Page Break Strategy

Only break before:
- **REVISION HISTORY** - Always on its own page
- **Major workflow transitions** - Only if content exceeds a page

Never break before:
- OVERVIEW, RELATED, QUICK REFERENCE, TOC
- PREREQUISITES
- TROUBLESHOOTING

---

## Validation Checklist

Run `validate_procedure.py` to verify:
- All required sections present (Overview, Related, Revision History)
- Figure registry exists with all images annotated
- Color references match annotation colors
- No orphaned images (all registered in figure_registry.json)
- Numbered steps use consistent format

---

## Dependencies

**Python:** `pip install -r requirements.txt`
- pillow>=10.0.0

**Node.js:** `npm install`
- docx ^8.0.0
- jszip ^3.10.1
- @xmldom/xmldom ^0.8.10

**System:** pandoc (for markdown conversion)
- Install from: https://pandoc.org/installing.html

---

## Files Reference

| File | Purpose |
|------|---------|
| `SKILL.md` | This file - skill overview and constants |
| `REFERENCE.md` | Complete implementation code and document assembly |
| `screenshot_processor.py` | Image annotation with PIL |
| `setup_workspace.py` | Cross-platform workspace setup |
| `scripts/generate_figure_index.py` | Figure index generation |
| `scripts/validate_procedure.py` | Document and color validation |
| `scripts/text_color_parser.py` | Parse color references from text |
| `scripts/report_generator.py` | HTML color consistency reports |
| `templates/annotation_template.json` | Example annotation configurations |
| `assets/Procedure_Template.docx` | TFCU template reference |
