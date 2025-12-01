# TFCU Procedure Formatter - Changelog

## Summary

The TFCU Procedure Formatter skill provides professional document generation for credit union procedures. This changelog tracks all versions from the initial release through the current v4.3.2 release.

---

## v4.3.2 - Polish & Robustness (Dec 2025)

### Bug Fixes

- **Multi-format image support**: Screenshot processor now handles PNG, JPG, JPEG, and GIF (not just PNG)
- **Odd-item Quick Reference fix**: Tables with odd numbers of items now properly pad with empty cells
- **Aspect ratio from registry**: Screenshots now read actual dimensions from figure_registry.json when available
- **Font fallback improvement**: Better fallback chain including Pillow 10.1+ sized defaults

### Improvements

- **WMF/EMF warning**: Clear warning when legacy Windows Metafile images are found (with conversion instructions)
- **Pandoc check**: setup_workspace.py now checks for pandoc and shows installation instructions
- **Dependency install step**: Quick Start now includes pip/npm install commands
- **Annotations.json guidance**: SKILL.md includes example annotation format
- **EOF behavior fix**: Guided review mode now warns instead of silently approving in non-interactive mode
- **Version sync**: All version numbers synchronized across files

### Documentation

- Fixed spec-violating revision table example in visual_elements.md (no empty placeholder rows)
- Added .gitignore for cleaner repository management

---

## v4.3 - Cross-Platform Support & Color Consistency (Dec 2025)

### Highlights

- **Cross-platform support**: Works on Windows, macOS, and Linux
- **Color-matched annotations**: Text references like "(red callout 1)" now validated against actual annotation colors
- **Guided review workflow**: Interactive approval of annotations before applying
- **Lean SKILL.md**: Reduced from 66KB to <10KB, code moved to REFERENCE.md
- **Skills system compliance**: Proper dependency declarations, no hardcoded paths

### Part A: Platform Remediation

**Cross-Platform Workspace Setup**
- New `setup_workspace.py` replaces Linux-only shell commands
- Works with Python on Windows, macOS, and Linux
- Extracts .docx images using Python zipfile module
- Creates standardized workspace directory structure

**Dependency Declarations**
- New `requirements.txt` for Python dependencies (pillow>=10.0.0)
- New `package.json` for Node.js dependencies (docx, jszip, @xmldom/xmldom)
- `screenshot_processor.py` now checks for dependencies and shows clear install instructions

**Removed Hardcoded Paths**
- Eliminated `/mnt/skills/` references throughout
- Paths now relative or auto-detected
- Works in any installation directory

**Lean Documentation**
- SKILL.md reduced from 66KB to 7.6KB
- Code examples moved to new REFERENCE.md
- Faster skill loading, cleaner user experience

### Part B: Color-Matched Annotations

**FigureRegistry Color Tracking**
- `color_map` property tracks annotation colors per figure
- `COLOR_PALETTE` constant defines standard TFCU colors
- Color data exported to `figure_registry.json`

**Text Color Parser**
- New `scripts/text_color_parser.py`
- Parses procedure text for patterns like "(red callout 1)"
- Extracts expected color mappings for validation
- Supports parenthetical, inline, and circled number formats

**Color Consistency Validator**
- New `ColorConsistencyValidator` class in `validate_procedure.py`
- Compares expected colors from text with actual annotation colors
- Handles color equivalents (red == critical, blue == info)
- Reports mismatches as warnings (guided mode, not blocking)

**HTML Color Reports**
- New `scripts/report_generator.py`
- Generates visual HTML report with color swatches
- Shows matches and mismatches side-by-side
- Includes TFCU color palette reference

**Guided Review Workflow**
- New `--review` flag for `screenshot_processor.py`
- Shows annotation preview before applying
- User can approve, skip, or approve all remaining
- Prevents unintended annotations

### New CLI Options

```bash
# Guided review mode
python3 screenshot_processor.py --input images/raw --output images/annotated --annotations ann.json --review

# Generate HTML color report
python3 screenshot_processor.py --input images/raw --output images/annotated --report color_report.html

# Color validation with validate_procedure.py
python3 scripts/validate_procedure.py --doc validation.md --figures figure_index.json --registry figure_registry.json --verbose

# Parse procedure for color references
python3 scripts/text_color_parser.py --input procedure.md --summary

# Generate standalone color report
python3 scripts/report_generator.py --registry figure_registry.json --procedure source.md --output report.html
```

### New Files

| File | Purpose |
|------|---------|
| `setup_workspace.py` | Cross-platform workspace setup |
| `requirements.txt` | Python dependencies |
| `package.json` | Node.js dependencies |
| `REFERENCE.md` | Complete implementation code reference |
| `scripts/text_color_parser.py` | Parse color references from procedure text |
| `scripts/report_generator.py` | Generate HTML color consistency reports |

### Enhanced Files

| File | Changes |
|------|---------|
| `screenshot_processor.py` | Color mapping, guided review, report generation |
| `scripts/validate_procedure.py` | ColorConsistencyValidator class |
| `SKILL.md` | Lean version with references to REFERENCE.md |
| `CHANGELOG.md` | Cross-platform workflow, upgrade instructions |

### Migration from v4.2

1. Install Python dependencies: `pip install -r requirements.txt`
2. Install Node.js dependencies: `npm install`
3. Replace shell commands with `setup_workspace.py`:
   ```bash
   # Old (v4.2):
   mkdir -p images/raw images/annotated
   unzip -o source.docx -d docx_extract
   cp docx_extract/word/media/* images/raw/

   # New (v4.3):
   python3 setup_workspace.py source.docx --workspace ./workspace
   ```
4. Add color references to procedure text for validation:
   - Example: "Click the Submit button (red callout 1)"
5. Use `--review` flag for interactive annotation approval

---

## v4.2 - Mandatory Annotation Pipeline (Nov 2025)

### Breaking Change: Annotation Now Required

Screenshot annotation is no longer optional documentation—it is now **enforced as a mandatory pipeline step** in the Quick Start workflow.

### New Features

**FigureRegistry Class**
- Global figure tracking across entire procedure document
- Auto-increment figure numbering (independent of step numbers)
- JSON export of all figure metadata
- Supports section grouping for organization

**Batch Processing CLI**
- `screenshot_processor.py` now supports directory batch processing
- `--input` and `--output` flags for raw/annotated image directories
- `--annotations` flag for JSON annotation configuration file
- Auto-placeholder for images without defined annotations
- Legacy `--stdin` mode preserved for backward compatibility

**Figure Index Generation**
- New `scripts/generate_figure_index.py` creates appendix data
- Groups figures by section
- Annotation type statistics (callout, arrow, highlight, circle, label)
- Coverage metrics (total, annotated, percentage)

**Validation Enforcement**
- New `scripts/validate_procedure.py` enforces annotation requirements
- Checks for figure registry existence
- Validates required sections (OVERVIEW, RELATED, Revision History)
- Verifies figure references in document text
- Exit codes: 0 (pass), 1 (fail) for CI/CD integration

**SKILL.md Updates**
- Quick Start now shows mandatory 7-step workflow
- Annotation pipeline required before document generation
- Validation checklist includes annotation coverage checks
- `createStepWithScreenshot()` warns on non-annotated images

### New Files

| File | Purpose |
|------|---------|
| `scripts/generate_figure_index.py` | Generate figure index appendix from registry |
| `scripts/validate_procedure.py` | Enforce annotation and figure requirements |
| `templates/annotation_template.json` | Example annotation configurations |

### Enhanced Files

| File | Changes |
|------|---------|
| `screenshot_processor.py` | Added FigureRegistry class, batch CLI, registry export |
| `SKILL.md` | Updated Quick Start, validation checklist, createStepWithScreenshot() |

### Mandatory Workflow

```bash
# 1. Setup workspace and extract images (cross-platform)
python3 setup_workspace.py source.docx --workspace ./workspace

# 2. Convert source document to markdown
pandoc source.docx -o workspace/source.md

# 3. Reference the public docx skill for OOXML implementation details

# 4. MANDATORY: Process and annotate all screenshots
python3 screenshot_processor.py --input workspace/images/raw --output workspace/images/annotated --procedure workspace/source.md

# 5. Generate formatted procedure (uses annotated images)
node generate-procedure.js

# 6. Generate Figure Index appendix
python3 scripts/generate_figure_index.py --registry workspace/images/annotated/figure_registry.json --output figure_index.json

# 7. Validate output
pandoc output.docx -o validation.md
python3 scripts/validate_procedure.py --doc validation.md --figures figure_index.json
```

### Registry JSON Format

```json
{
  "figures": [
    {
      "figure_number": 1,
      "source_image": "images/raw/screenshot1.png",
      "annotated_image": "images/annotated/figure_01_screenshot1.png",
      "annotations": [...],
      "legend": [...],
      "dimensions": {"width": 320, "height": 240},
      "section": "Login Process"
    }
  ],
  "total_count": 10,
  "generated_by": "TFCU Screenshot Annotation Pipeline v4.2"
}
```

### Migration from v4.1

1. Annotation is now **mandatory**, not optional
2. Update Quick Start workflow to include steps 4, 6, and 7
3. Create `annotations.json` mapping image stems to annotation arrays
4. Run annotation pipeline before document generation
5. Validate using new `validate_procedure.py` script

---

## v4.0 - Hybrid Compliance Validator (Nov 2025)

### New Feature: Automated Compliance Validation

Added comprehensive validation system that ensures all generated documents meet the 54 specification requirements.

**Dual Validation Approach:**
1. **Generation-Time Validation** - Prevents non-compliant documents from being created
2. **Post-Generation Auditing** - Validates any .docx file against spec requirements

### New Files

| File | Description |
|------|-------------|
| `validator/spec-config.js` | Single source of truth for all 54 spec requirements |
| `validator/validation-context.js` | Error/warning collection with 3 modes (strict, lenient, report-only) |
| `validator/validation-errors.js` | Specialized error types (Font, Color, Size, Border, Structure, etc.) |
| `validator/ooxml-parser.js` | JSZip + XML extraction for .docx auditing |
| `validator/validators/spec-validator.js` | Rule matchers for all spec categories |
| `validator/report-generator.js` | JSON, Markdown, and HTML report formats |
| `validator/validated-helpers.js` | Validated versions of helper functions |
| `validator/index.js` | CLI entry point |

### CLI Usage

```bash
# Validate a document
node validator/index.js audit CardAtOnce_Procedure.docx

# Generate JSON report for CI/CD
node validator/index.js audit procedure.docx --format=json --strict

# Generate HTML report
node validator/index.js audit procedure.docx --format=html --output=report.html
```

### Validation Categories

| Category | Checks | Examples |
|----------|--------|----------|
| Typography | 11 | Fonts (Calibri/Consolas), sizes, colors, weights |
| Layout | 4 | Page margins (0.5"/0.75") |
| Header Table | 8 | Row 1 dark teal, Row 2 LIGHT teal |
| Callout Boxes | 20 | 4 types with correct fills/borders/icons |
| Tables | 9 | Column widths, empty row detection |

### Key Validations

- **Header Table Row 2**: Ensures light teal (#E8F4F4), NOT dark teal
- **Callout Types**: Validates CRITICAL/WARNING/NOTE/TIP with correct colors
- **Revision History**: Detects and flags empty rows (spec violation)
- **Section Headers**: Warns on ALL CAPS (spec requires sentence case)
- **Fonts**: Validates Calibri for body, Consolas for technical values only

### Validated Helper Functions

New `validator/validated-helpers.js` provides spec-enforced versions:
- `createHeaderTable()` - Enforces light teal row 2
- `createCalloutBox()` - Validates type, enforces correct colors
- `createSectionHeader()` - Warns on ALL CAPS
- `createRevisionTable()` - Filters empty rows automatically

### Exit Codes (with --strict)

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | One or more checks failed |
| 2 | File read/parse error |

### Dependencies

```javascript
// Already available (docx-js dependency)
"jszip": "^3.10.1"

// New (for OOXML parsing)
"@xmldom/xmldom": "^0.8.10"
```

---

## Breaking Changes

### Template Structure Clarified
- **Required elements** now clearly distinguished from **optional enhancements**
- Table of Contents, Quick Reference Box, Prerequisites, and Glossary marked as **optional**
- Core template: Header → Overview → Related → Body → Revision History

### Numbering Format Corrected
- **Old (incorrect)**: Level 3 was `1), 2), 3))` (double parenthesis typo)
- **New (correct)**: Level 3 is `1), 2), 3)` with proper docx-js `LevelFormat.DECIMAL` + `text: "%3)"`

---

## Critical Fixes

| Issue | v1.0 | v2.0 |
|-------|------|------|
| TOC implementation | Manual bookmark code (fragments) | Native `TableOfContents` or simple `HeadingLevel` approach |
| Header table | No working code | Complete `createHeaderTable()` function |
| Footer | Described but not implemented | Full `TabStopType` implementation |
| Callout boxes | OOXML snippets (unusable) | docx-js `Paragraph` with `shading` and `border` |
| Revision table | Described only | Complete `createRevisionTable()` function |
| Numbering config | Not provided | Full 3-level config: `1.` / `a.` / `1)` |

---

## New Sections Added

### Complete Working Implementation
- ~400 lines of production-ready JavaScript
- All helper functions included
- Copy-paste runnable

### Brand Constants Block
```javascript
const TFCU_COLORS = {
  PRIMARY_TEAL: "154747",
  OVERVIEW_TEAL: "0F4761",
  // ...
};
```

### Source Document Analysis
- Pandoc conversion commands
- Artifact cleanup patterns (`{.underline}`, `{.mark}`, etc.)
- Content mapping checklist

### Image Handling
- When to include vs. exclude
- Sizing guidelines by image type
- Complete `ImageRun` implementation with required `altText`

### Flowchart Workflow
- Mermaid → PNG conversion steps
- `mmdc` CLI commands
- Embedding with proper alt text

### Validation Commands
```bash
pandoc output.docx -o validation.md
grep -q "OVERVIEW" validation.md && echo "✓" || echo "✗"
```

### Troubleshooting Table
Common docx-js issues and solutions (black cells, invalid XML, etc.)

---

## Reference File Updates

### visual_elements.md
| v1.0 | v2.0 |
|------|------|
| OOXML patterns only | docx-js implementations |
| Mermaid examples (not usable) | Full render-and-embed workflow |
| No color constants | Complete `TFCU_COLORS` object |
| Basic table styling | Helper functions for all table types |

### writing_standards.md
| v1.0 | v2.0 |
|------|------|
| Long explanations | Quick reference card at top |
| Generic examples | TFCU-specific rewrites |
| Spread across sections | Consolidated quality checklist |
| No common rewrites | "Before → After" table for real content |

---

## Structural Improvements

### Better Organization
1. Quick Start section at top
2. Required vs. Optional table
3. Brand constants in one place
4. Complete implementation before helper details
5. Troubleshooting at end

### Clearer Documentation
- Code is runnable, not fragments
- All `require()` statements included
- Comments explain purpose
- Critical issues called out with `// REQUIRED` comments

### Removed Ambiguity
- Exact hex colors confirmed (no `#` prefix for docx-js)
- Page break rules explicitly stated
- Section order documented with reasoning

---

## Files in This Package

```
tfcu-procedure-formatter/
├── SKILL.md                              # Main skill file (v4.2)
├── CHANGELOG.md                          # This file
├── SPEC_COMPLIANCE.md                    # Specification compliance notes
├── screenshot_processor.py               # Python PIL annotation module (v4.2)
├── scripts/                              # NEW in v4.2
│   ├── generate_figure_index.py          # Figure index appendix generator
│   └── validate_procedure.py             # Annotation enforcement validator
├── templates/                            # NEW in v4.2
│   └── annotation_template.json          # Example annotation configurations
├── assets/
│   └── Procedure_Template.docx           # Reference template
├── references/
│   ├── visual_elements.md                # Flowcharts, callouts, tables
│   ├── writing_standards.md              # Plain language, formatting
│   ├── screenshot_handling.md            # Intelligent screenshot workflow (v4.1)
│   └── vision_prompts.md                 # Claude Vision prompt templates (v4.1)
└── validator/
    ├── index.js                          # CLI entry point
    ├── spec-config.js                    # 54 spec requirements
    ├── validation-context.js             # Error/warning collection
    ├── validation-errors.js              # Specialized error types
    ├── ooxml-parser.js                   # JSZip + XML extraction
    ├── report-generator.js               # JSON/Markdown/HTML reports
    ├── validated-helpers.js              # Spec-enforced helpers
    └── validators/
        └── spec-validator.js             # Rule matchers
```

---

## Migration Notes

### To upgrade an existing skill installation:

1. Backup your current tfcu-procedure-formatter skill directory
2. Replace `SKILL.md` with new version
3. Replace files in `references/` directory
4. Keep `assets/Procedure_Template.docx` (unchanged)
5. Run `pip install -r requirements.txt` to install Python dependencies
6. Run `npm install` to install Node.js dependencies

### For users of v1.0:

- Code snippets from v1.0 are incompatible
- Regenerate any procedures using new helper functions
- Review callout box implementations (OOXML → docx-js)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 4.2 | Nov 2025 | Mandatory Annotation Pipeline: FigureRegistry, batch CLI, figure index, validation enforcement |
| 4.1 | Nov 2025 | Screenshot Quality & Organization: Preprocessing pipeline, global figure numbering, color-matched annotations |
| 4.0 | Nov 2025 | Hybrid Compliance Validator: Generation-time + post-generation auditing |
| 3.1 | Nov 2025 | Unified workflow: Single user-upload mode, removed legacy extraction |
| 3.0 | Nov 2025 | Intelligent Screenshot Handling: Claude Vision analysis, auto-matching, rich annotations |
| 2.3 | Nov 2025 | Visual consistency: text-only step spacing matches table cells |
| 2.2 | Nov 2025 | Spec-compliant update: typography, colors, layout per design spec |
| 2.1 | Nov 2025 | Compact layout with polished spacing and alignment |
| 2.0 | Nov 2025 | Complete rewrite with working implementations |
| 1.0 | Original | Initial skill with documentation only |

---

## v4.1 - Screenshot Quality & Organization (Nov 2025)

### New Features

**Image Preprocessing Pipeline**
- Images are now cropped and resized BEFORE annotation to prevent distortion
- Smart crop removes irrelevant areas (browser chrome, taskbar, whitespace)
- LANCZOS resampling for high-quality resizing
- 300 DPI output quality maintained

**Global Figure Numbering**
- Figures numbered sequentially by document position (not step numbers)
- ImageRegistry tracks all figures with step mapping
- Supports reordering with automatic number recalculation
- Orphan detection for unassigned figures

**Color-Matched Annotations**
- Annotation markers and description text use matching colors
- 7-color palette: critical, info, warning, success, primary, purple, orange
- Annotation legend appears below each image
- Clear visual association between markers and text

**Step-Context Hybrid Descriptions**
- Captions combine Vision analysis with step instruction text
- Extracts action verbs (Click, Select, Enter, Verify) for context
- Falls back to screen type labels when action not detected
- Enhanced alt text generation for accessibility

**Coverage Analysis (Non-Blocking)**
- Warns about missing screenshots on critical steps
- Identifies orphaned figures not assigned to steps
- Reports coverage percentage
- Always allows document generation (warnings only)

### New Classes/Functions

| Component | Location | Purpose |
|-----------|----------|---------|
| `ImagePreprocessor` | screenshot_processor.py | Crop, resize, enhance images |
| `AnnotationColorManager` | screenshot_processor.py | Color assignment and tracking |
| `draw_legend()` | screenshot_processor.py | Render color-coded legend |
| `imageRegistry` | SKILL.md | Global figure tracking |
| `generateHybridCaption()` | SKILL.md | Step-context caption generation |
| `generateHybridAltText()` | SKILL.md | Enhanced accessibility text |

### Updated Files

| File | Changes |
|------|---------|
| `screenshot_processor.py` | Added ImagePreprocessor, AnnotationColorManager, draw_legend |
| `SKILL.md` | Updated to v4.1, added ImageRegistry, hybrid captions, coverage analysis |
| `references/vision_prompts.md` | Added suggested_crop, description_text, color matching |
| `references/screenshot_handling.md` | Updated pipeline, preprocessing, figure numbering docs |

### Processing Order (Critical)

```
1. Vision Analysis    → Get crop region, targets, descriptions
2. PREPROCESS         → Crop image, resize to target width
3. Register Figure    → Assign global figure number
4. ANNOTATE           → Apply callouts/arrows at FINAL size (no distortion)
5. Add Legend         → Color-coded key at bottom
6. Embed in Document  → With figure caption + color-matched text
```

### Key Principle

**Crop and resize images BEFORE annotation to prevent distortion.**

Previous versions applied annotations first, then resized, causing:
- Blurry annotation markers
- Distorted callout circles
- Illegible legend text

v4.1 ensures annotations are applied at final resolution.

---

## v3.1 - Unified Workflow (Nov 2025)

### Breaking Changes

**Single Workflow Mode**
- Removed dual-mode workflow (Legacy + New)
- Unified to single user-upload workflow only
- Legacy document extraction removed from scope

### Workflow

```
User Upload → Analyze → Suggest Placement → User Confirms → Annotate → Embed
```

### Why This Change

- Simplifies user experience with single consistent workflow
- Reduces confusion about which mode to use
- Better suited for Claude.ai skill environment
- User maintains control over screenshot placement

### Updated Files

| File | Change |
|------|--------|
| `SKILL.md` | Updated architecture to v3.1, single workflow |
| `references/screenshot_handling.md` | Removed Legacy Mode section, unified workflow |

---

## v3.0 - Intelligent Screenshot Handling (Nov 2025)

### New Features

**Claude Vision Integration**
- Automated OCR text extraction from screenshots
- UI element detection (buttons, fields, dropdowns, menus)
- Screen type classification (login, form, dialog, error, dashboard, etc.)
- Semantic understanding of screenshot content for intelligent placement

**Content-Aware Matching Engine**
- Multi-signal weighted algorithm for screenshot-to-step matching:
  | Signal | Weight | Description |
  |--------|--------|-------------|
  | Text Similarity | 35% | OCR text keywords match step instructions |
  | UI Element Match | 30% | Detected elements match step action verbs |
  | Section Match | 20% | Screen type aligns with procedure section |
  | Sequence Order | 15% | Extraction order matches workflow sequence |
- Confidence thresholds: ≥60% auto-assign, 40-59% review flag, <20% reject
- Automatic section classification based on keyword patterns

**Rich Annotation System (Python PIL)**
- Numbered callouts (①②③) for multi-step sequences
- Curved arrows with arrowheads for pointing to elements
- Semi-transparent highlight boxes for emphasizing regions
- Circle outlines for single focus points
- Text labels with background for explanations
- TFCU brand color palette support

**Accessibility Improvements**
- Automatic alt text generation for all screenshots
- Caption generation following TFCU figure numbering conventions
- Screen reader-friendly descriptions based on content analysis

**Coverage Analysis**
- Automatic gap detection for critical steps without screenshots
- Orphan screenshot identification (unmatched images)
- Coverage percentage reporting
- Suggestions for missing screenshot content

### New Files

| File | Description |
|------|-------------|
| `screenshot_processor.py` | Python PIL module for rich annotations (~500 lines) |
| `references/vision_prompts.md` | Claude Vision prompt templates for analysis |
| `references/screenshot_handling.md` | Complete guide for intelligent screenshot workflow |

### SKILL.md Updates

Added new section "Intelligent Screenshot Handling (v3.0)" with:
- `CONTENT_MATCHING_CONFIG` object for algorithm tuning
- `SECTION_KEYWORDS` classification patterns
- `analyzeScreenshot()` function using Claude Vision
- `applyAnnotations()` function bridging to Python PIL
- `createIntelligentStep()` async function for automatic processing
- `analyzeCoverage()` function for quality assurance

### Workflow Modes (Deprecated in v3.1)

> **Note**: v3.1 unified these modes into a single user-upload workflow.

**Legacy Mode** (Removed in v3.1): Extract screenshots from .docx → Analyze → Match to steps → Annotate → Embed
**New Mode** (Now the only mode in v3.1): Accept user uploads → Analyze → Suggest placement → User confirms → Annotate → Embed

### Technical Architecture

```
INPUT → CLAUDE VISION → PYTHON PIL → DOCX-JS → OUTPUT.DOCX
        (Analysis)      (Annotations)  (Assembly)
```

### Dependencies

**Python** (for annotation rendering):
```
pillow>=10.0.0      # Image manipulation
```

**Node.js** (existing):
```
docx                # Document generation
```

---

## v2.3 - Visual Consistency Update (Nov 2025)

### Text-Only Step Improvements

**Problem**: Text-only steps (without screenshots) had different spacing than table-wrapped steps, causing visual inconsistency when interspersed in procedures.

**Solution**: Updated `createTextStep()` function to match table cell padding:

| Property | Old Value | New Value |
|----------|-----------|-----------|
| Vertical spacing | `after: 25` | `before: 72, after: 72` (0.05") |
| Left indent | None | `left: 144` (0.1") |
| Sub-step indent | `left: 400` | `left: 544` (144 base + 400 relative) |

**Result**: Text-only steps now visually align with table-wrapped steps for a more consistent document appearance.

---

## v2.2 - Spec-Compliant Update (Nov 2025)

### Breaking Changes

**Typography**
- Font changed from Aptos to **Calibri** throughout
- Section headers now use **sentence case** instead of ALL CAPS
- Section header size increased from 11.5pt to **14pt**
- Body text size increased from 10pt to **11pt**
- Table text size increased from 8.5pt to **10pt**
- Footer text size increased from 8pt to **9pt**

**Layout**
- Left/right page margins increased from 0.5" to **0.75"** for print robustness
- Header table row 2 background changed from #154747 to **#E8F4F4** (light teal)
- Step/screenshot columns now both **vertically centered**
- Added consistent cell padding (0.1" horizontal, 0.05" vertical)

**Colors**
| Element | Old | New |
|---------|-----|-----|
| Warning fill | #FFF3CD | #FFF2CC |
| Warning border | #856404 | #FFC000 |
| Note border | #0C5460 | #2E74B5 |
| Critical border | #721C24 | #C00000 |
| Tip fill | #D4EDDA | #E2F0D9 |
| Tip border | #155724 | #548235 |

### Improvements

- **Section header border**: Increased from 0.75pt to **1.5pt** for visual weight
- **Callout borders**: Increased from ~3pt to **4pt** for visibility
- **Callout indents**: Increased from 100 to **216 DXA** (0.15")
- **Callout spacing**: Standardized to **6pt** before and after
- **TOC hyperlinks**: Changed from blue underlined to **teal (#154747) without underline**
- **Troubleshooting table**: Column widths fixed to **25%/30%/45%** per spec
- **Quick Reference**: Added proper cell padding (0.08" horizontal, 0.05" vertical)
- **Revision History**: Removed empty placeholder rows; generates "Initial version" if no data

### Technical Notes

- All changes align with `tfcu_procedure_formatter_spec.md` requirements
- DXA values validated against spec conversion table
- Border sizes use eighths-of-point units (4pt = 32)
- Font sizes use half-point units (11pt = 22)

---

## v2.1 - Compact Layout Update (Nov 2025)

### Layout Improvements
- **Two-column step tables**: Text LEFT (55%), screenshots RIGHT (45%)
- **Percentage-based widths**: All tables use `WidthType.PERCENTAGE` for full-width
- **Reduced margins**: 0.5" default for compact but readable layout
- **Inline TOC**: Horizontal with bullet separators instead of vertical list
- **4-column Quick Reference**: Label/value pairs side-by-side

### Alignment Rules
| Element | Alignment |
|---------|-----------|
| Step text | LEFT |
| Screenshots | RIGHT |
| Comparison images | CENTER |
| Table headers | CENTER |
| Table data | LEFT |

### Spacing Refinements
- Section headers: 180 before / 60 after
- Steps: 30 after main text, 20 after sub-steps
- Callouts: 60/60 (full-width), 40/30 (inline)
- Table cells: 20-25pt padding

### New Helper Functions
- `createComparisonTable()` - Side-by-side image comparisons
- `createTroubleshootingTable()` - Accepts array of `{issue, cause, resolution}`

### Page Break Strategy
- Only break before REVISION HISTORY
- Let all other content flow naturally
- 40% reduction in document length vs v2.0

### Bug Fixes
- Tables now properly full-width
- Screenshots right-aligned in step tables
- Consistent spacing throughout document
