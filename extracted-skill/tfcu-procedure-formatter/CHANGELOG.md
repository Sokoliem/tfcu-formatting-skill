# TFCU Procedure Formatter - Changelog

## Summary

The TFCU Procedure Formatter skill provides professional document generation for credit union procedures. This changelog tracks all versions from the initial release through the current v6.1.0 release.

---

## v6.1.0 - Execution Hardening & Self-Validation (Dec 2025)

### Overview

Added comprehensive safeguards to prevent common execution failures: stale dates, missing figure index, skipped annotation pipeline, and scattered critical rules. Introduced self-validation block that fails document generation if violations are detected.

### Changes

- **Dynamic Date Enforcement**:
  - New `getCurrentDate()` helper returns "Month YYYY" format
  - New `getCurrentDateYYYYMM()` helper returns "YYYYMM" for filenames
  - All PROCEDURE config examples updated to use dynamic dates
  - Validation rejects dates with year < current year
  - Validation rejects hardcoded example date "December 2024"

- **Self-Validation Block**:
  - Pre-save validation that runs before document generation
  - Exits with error code 1 if critical violations detected
  - Checks: stale dates, missing Figure Index, unannotated raw images
  - Clear error messages for each violation type

- **MANDATORY PRE-FLIGHT Checklist**:
  - New 6-step technical checklist at top of Quick Start
  - Load spec-config.js, get current date, check screenshots
  - Run annotation pipeline, verify figure_registry.json
  - Plan Figure Index appendix inclusion

- **HARD STOPS Section**:
  - Consolidated critical rules in one prominent location
  - Dynamic date generation (no hardcoded dates)
  - Figure Index required when screenshots present
  - Screenshot annotation pipeline required
  - SME markers for TFCU-specific values

- **spec-config.js Updates**:
  - Added `conditionalRules.figureIndexRequired` (ST09)
  - Added `conditionalRules.annotationPipelineRequired` (ST10)
  - Added `dateValidation` configuration (ST11)

### Files Modified

- `SKILL.md` - Added PRE-FLIGHT checklist and HARD STOPS section
- `REFERENCE.md` - Added getCurrentDate() helpers, self-validation block
- `validator/spec-config.js` - Added conditional validation rules
- `package.json` - Version bump to 6.1.0
- `tests/VERIFICATION_TESTS.md` - Version bump to 6.1.0
- `FILES.md` - Version bump to 6.1.0
- `CHANGELOG.md` - Added v6.1.0 release notes

---

## v6.0.4 - Figure Index Appendix (Dec 2025)

### Overview

Added mandatory Figure Index appendix for procedures with screenshots. The Figure Index provides a complete reference of all figures in the document, listed in a table with titles, descriptions, sections, and step references.

### Changes

- **Figure Index Appendix (REQUIRED)**:
  - New appendix page after main content, before Revision History
  - Lists all screenshots in a 5-column table:
    - Fig # (10%) - Figure number
    - Title (20%) - Figure title
    - Description (35%) - Brief description (truncated at 60 chars)
    - Section (20%) - Which section the figure appears in
    - Step (15%) - Step reference (e.g., "Step 3")
  - Header uses standard teal styling
  - Summary paragraph shows figure count
  - Bookmark anchor for TOC linking (`figure-index`)
  - Alternating row shading for readability

- **spec-config.js Updates**:
  - Added `tableWidths.figureIndex` with column width specs (TW12-TW16)
  - Added `figureIndex` to `structure.requiredSections`

- **validated-helpers.js Updates**:
  - New `createFigureIndexAppendix(figures)` function
  - Validates figure data and applies spec-config formatting
  - Returns header, summary, and table configuration

- **REFERENCE.md Updates**:
  - Added Figure Index appendix to helper function mapping table
  - Full `createFigureIndexAppendix()` implementation with usage example

- **SKILL.md Updates**:
  - Added Figure Index to Required Elements table
  - Updated TOC format example to include Figure Index
  - Updated validation checklist

### Files Modified

- `validator/spec-config.js` - Added Figure Index table widths and structure requirement
- `validator/validated-helpers.js` - Added createFigureIndexAppendix function
- `REFERENCE.md` - Added Figure Index documentation and implementation
- `SKILL.md` - Updated requirements and validation checklist
- `package.json` - Version bump to 6.0.4
- `tests/VERIFICATION_TESTS.md` - Version bump to 6.0.4
- `CHANGELOG.md` - Added v6.0.4 release notes

---

## v6.0.3 - Full-Feature Template Suite (Dec 2025)

### Overview

Added comprehensive reference templates for Assessment and Quick Card outputs, with embedded contextual help and examples of all capabilities.

### Changes

- **Assessment Template** (`assets/Assessment_Template.docx`):
  - Portrait orientation with teal header
  - Instructions section with employee info fields
  - Section 1: Procedure Knowledge (7 example questions)
    - Multiple choice (ordering, recall, navigation)
    - True/False (from CRITICAL/WARNING callouts)
    - Fill-in-blank
  - Section 2: Scenario Applications (3 example questions)
    - Scenario-based decision questions
    - Application questions
  - Intervention marker examples ([VERIFY], [SME INPUT REQUIRED])
  - Answer Key on separate page with explanations
  - Scoring section (80% pass threshold, remediation guidance)
  - Disclaimers for various procedure types
  - Embedded helper notes explaining each element

- **Quick Card Template** (`assets/QuickCard_Template.docx`):
  - Landscape orientation (8.5x11) for lamination
  - Two-column layout
  - Teal header bar with procedure name and department
  - LEFT COLUMN:
    - Before You Start (checkbox format, 4 items)
    - Key Steps (numbered, 8 prioritized steps with weighting notes)
  - RIGHT COLUMN:
    - Watch Out For (critical/warning with severity icons)
    - When to Escalate (condition → action pairs)
    - Quick Contacts (label/value table with Consolas phone numbers)
  - Intervention marker examples
  - Auto-generated content examples with [SUGGESTED] markers
  - Marker propagation notes
  - Usage instructions
  - Footer with department, date, version, disclaimer

- **Template Generator Scripts** (in project root):
  - `generate_assessment_template.js` - Regenerate assessment template
  - `generate_quickcard_template.js` - Regenerate quick card template

### Files Added

- `assets/Assessment_Template.docx` - Comprehensive assessment template
- `assets/QuickCard_Template.docx` - Comprehensive quick card template
- `generate_assessment_template.js` - Assessment template generator
- `generate_quickcard_template.js` - Quick card template generator

### Files Modified

- `FILES.md` - Updated file inventory (41 files total)
- `CHANGELOG.md` - Added v6.0.3 release notes

---

## v6.0.2 - Comprehensive Template Replacement (Dec 2025)

### Problem Addressed

The embedded reference template (`assets/Procedure_Template.docx`) was outdated (v4.x era) and conflicting with current skill specifications. Issues included:
- Wrong header colors (primary teal in row 2 instead of light teal)
- Double borders on header table
- Wrong font sizes
- No inline TOC format demonstration
- Missing modern features (callout types, intervention markers, screenshot placeholders)

### Changes

- **Replaced embedded template** with comprehensive full-feature demonstration:
  - Correct 2-row header table layout (#154747 row 1, #E8F4F4 row 2)
  - Inline horizontal TOC format (`Contents: Section1 • Section2 • Section3`)
  - All 4 callout types (CRITICAL, WARNING, NOTE, TIP) with correct colors
  - All 6 intervention marker types ([SME INPUT REQUIRED], [VERIFY], [SUGGESTED], etc.)
  - Quick Reference box (4-column teal grid)
  - Screenshot placeholder with 55%/45% layout
  - Step with screenshot layout demonstration
  - Troubleshooting table (Issue/Cause/Resolution)
  - Glossary table (Term/Definition)
  - Revision History table with correct formatting
  - Footer with page numbers and version watermark

- **Added template generator script**: `generate_template.js`
  - Produces consistent, reproducible templates
  - Documents all skill capabilities through working code
  - Can regenerate template if specifications change

### Files Modified

- `assets/Procedure_Template.docx` - Replaced with comprehensive demonstration template
- `CHANGELOG.md` - Added v6.0.2 release notes

### Files Added

- `generate_template.js` - Template generation script (can be run with `node generate_template.js`)

---

## v6.0.1 - TOC Format Enforcement Hotfix (Dec 2025)

### Problem Addressed

Generated documents were using incorrect Table of Contents format (table-based vertical list) instead of the required inline horizontal paragraph format.

### Changes

- **Added "Critical Formatting Rules" section** to SKILL.md (before Quick Start)
  - Visual diagram of correct header table layout
  - Explicit TOC format requirements with forbidden patterns
  - Reference to required helper functions

- **Strengthened TOC format documentation**:
  - Added visual examples of FORBIDDEN formats (table-based, vertical list)
  - Added "CRITICAL" callout boxes in SKILL.md, REFERENCE.md, visual_elements.md
  - Added anti-pattern warnings in createTableOfContents() function

- **Updated REFERENCE.md createTableOfContents()**:
  - Added prominent anti-pattern warning block
  - Added inline comments emphasizing PARAGRAPH (not Table) return type

### Files Modified

- `SKILL.md` - Added Critical Formatting Rules section, expanded TOC format guidance
- `REFERENCE.md` - Added anti-pattern warnings to createTableOfContents()
- `resources/visual_elements.md` - Added CRITICAL FORMAT RULE callout for TOC

---

## v6.0 - Production Readiness Release (Dec 2025)

### Overview

This release focuses on documentation completeness, cross-file validation, and production readiness. No new features - all changes improve consistency, discoverability, and maintainability.

### Changes

- **Comprehensive FILES.md Inventory**:
  - Created complete file inventory documenting all 38 skill files
  - Status indicators for each file (complete, needs review)
  - Grouped by directory (validator, resources, scripts, templates, assets)

- **tests/VERIFICATION_TESTS.md Test Plan**:
  - Created manual verification test plan with 6 test scenarios
  - Mode detection tests (convert, create, template, quick card, assessment)
  - Pre-generation scanning tests (6 flag item scenarios)
  - Helper selection and callout selection decision matrices
  - Post-generation validation checklist
  - Full bundle generation verification

- **Documentation of Orphaned Resources**:
  - Added 4 resource files to SKILL.md Files Reference section:
    - `resources/screenshot_handling.md` - Screenshot processing guidelines
    - `resources/vision_prompts.md` - Vision/image analysis prompts
    - `resources/writing_standards.md` - TFCU writing style guidelines
    - `resources/terminology_rules.json` - Terminology validation rules

- **Documentation of Undocumented Scripts**:
  - Added 4 Python scripts to SKILL.md Files Reference section:
    - `scripts/revision_analyzer.py` - Revision history analysis
    - `scripts/report_generator.py` - HTML report generation
    - `scripts/terminology_validator.py` - Cross-procedure terminology validation
    - `scripts/text_color_parser.py` - DOCX text color extraction

- **Version Synchronization Fix**:
  - Fixed visual_elements.md version (was v4.8, now v6.0)
  - Added mirror comments to duplicate constants in REFERENCE.md and visual_elements.md
  - All version references now consistent across SKILL.md, REFERENCE.md, visual_elements.md

### Files Modified

- `SKILL.md` - Version bump to v6.0, expanded Files Reference section
- `REFERENCE.md` - Version bump to v6.0, added mirror comments
- `resources/visual_elements.md` - Version bump v4.8 → v6.0, added mirror comments
- `CHANGELOG.md` - Added v6.0 release notes

### Files Created

- `FILES.md` - Complete file inventory
- `tests/VERIFICATION_TESTS.md` - Manual verification test plan

### Acceptance Criteria

- [ ] Version "v6.0" consistent in SKILL.md, REFERENCE.md, visual_elements.md
- [ ] All 38 files documented in FILES.md with status indicators
- [ ] VERIFICATION_TESTS.md contains 6 test scenarios
- [ ] 8 previously undocumented files added to SKILL.md Files Reference
- [ ] No broken file references remain in SKILL.md

---

## v5.3 - Anti-Hallucination Workflow Integration (Dec 2025)

### Problem Addressed

Anti-hallucination requirements were documented in SKILL.md but physically separated from the Quick Start workflow. This made it easy to bypass safeguards during actual document processing, resulting in:
- Fabricated contact information (e.g., invented phone extensions)
- Inferred policy/procedure/form names not present in source documents

### Changes

- **New Step 0 in Quick Start Workflow**:
  - Added mandatory "ANTI-HALLUCINATION SCAN" as Step 0 before all other steps
  - Requires scanning source document for 5 categories of TFCU-specific values:
    - Contact info (phone, ext, email)
    - Policy/procedure/form names
    - Dollar amounts (non-regulatory)
    - System URLs/paths
    - Approval authorities
  - Explicit "DO NOT PROCEED" instruction until scan is complete
  - Renumbered existing steps 0-7 → 1-8

- **Pre-Generation Checklist (HARD STOP)**:
  - Added checkbox-format scannable checklist after Quick Start section
  - 5 verification items with clear completion criteria
  - Two-option resolution: Ask user OR insert `[SME INPUT REQUIRED]` markers
  - Bold warning: "DO NOT invent, infer, or assume TFCU-specific values"

- **Marker Summary Requirement**:
  - Added to "Mandatory Output Bundle" section
  - Output message MUST list all `[SME INPUT REQUIRED]` markers
  - Ensures unresolved items are visible even without full document review

- **New `createSMEMarker()` Helper Function** (REFERENCE.md):
  - Convenience function for the most common marker type
  - Bold, red (#C00000), italic, yellow highlight styling
  - Three practical usage examples included

### Files Modified

- `SKILL.md` - Added Step 0, Pre-Generation Checklist, marker summary requirement
- `REFERENCE.md` - Added `createSMEMarker()` helper function with examples

### Acceptance Criteria

- Quick Start workflow explicitly includes anti-hallucination scan as Step 0
- Pre-generation checklist is visually prominent and uses checkbox format
- Marker summary requirement documented in output bundle section
- `createSMEMarker()` helper exists in REFERENCE.md
- Original safeguard rules remain unchanged (just better integrated into workflow)

---

## v5.2 - Standardized Filename Enforcement (Dec 2025)

### Major Changes

- **Filename Convention Enforcement (MANDATORY)**:
  - All output filenames now generated programmatically via `generateFilename()` and `generateOutputBundle()`
  - No manual filename override possible - enforced by design
  - Department validation with auto-correction from aliases
  - Procedure name sanitization (spaces→underscores, special chars removed, title case)
  - Date suffix always uses current YYYYMM from system date

- **New spec-config.js Section**:
  - Added `filenameConventions` section (FN01-FN08)
  - 9 approved departments with alias mapping
  - Filename patterns for all 4 output files
  - Procedure name rules (max length, allowed chars, title case)

- **New Validation Infrastructure**:
  - `FilenameValidationError` class in validation-errors.js
  - Static methods: `invalidDepartment()`, `procedureNameSanitized()`, `departmentCorrected()`
  - Integrated with ValidationContext for reporting

- **New Helper Functions** in validated-helpers.js:
  - `generateFilename(type, department, procedureName, ctx)` - Single file
  - `generateOutputBundle(department, procedureName, ctx)` - All 4 files
  - `sanitizeDepartment(dept, ctx)` - Department validation with auto-correction
  - `sanitizeProcedureName(name, ctx)` - Name sanitization
  - `getCurrentDateYYYYMM()` - System date in YYYYMM format
  - `getValidDepartments()` - Get approved department list

- **Wizard Enhancement**:
  - Filename preview shown in Phase 1 after collecting department/title
  - Invalid department triggers selection prompt
  - Sanitized procedure name shows notification

### Files Modified

- `validator/spec-config.js` - Added `filenameConventions` section
- `validator/validation-errors.js` - Added `FilenameValidationError` class
- `validator/validated-helpers.js` - Added 6 filename functions
- `resources/wizard_prompts.json` - Added `filename_generation` config
- `resources/interactive_wizard.md` - Added filename preview section to Phase 1
- `SKILL.md` - Updated to v5.2, added "(MANDATORY - Auto-Enforced)" to filename section

### Department Aliases

The following aliases are auto-corrected:
- `card services`, `cardservices`, `cards` → `Card_Services`
- `member services`, `memberservices`, `members` → `Member_Services`
- `ops`, `operation` → `Operations`
- `loans`, `loan` → `Lending`
- `finance`, `acct` → `Accounting`
- `it`, `tech`, `technology` → `IT`
- `hr`, `human resources` → `HR`
- `mktg` → `Marketing`

---

## v5.1 - Mandatory Feature Enforcement & Schema Validation (Dec 2025)

### Major Changes

- **All Optional Features Now Mandatory**: No more prompting - features execute automatically
  - Training Assessment Generator: Always generates `{ProcedureName}_Assessment_{YYYYMM}.docx`
  - Quick Reference Card Generator: Always generates `{ProcedureName}_QuickCard_{YYYYMM}.docx`
  - Validation Report: Always generates `{ProcedureName}_ValidationReport.txt`
  - Every procedure now produces a **4-file output bundle**

- **Auto-Insert with [SUGGESTED] Markers**: Non-blocking auto-population
  - Verification steps auto-inserted after data entry/transaction patterns
  - Callouts auto-inserted for all detected patterns (CRITICAL, WARNING, TIP, INFO)
  - Troubleshooting entries auto-inserted for error patterns
  - Documents generate with markers - user reviews post-output

- **Two-Tier Enforcement**:
  - **HARD-STOP (requires user input)**: TFCU-specific content only (amounts, contacts, authorities, policies, URLs)
  - **AUTO-INSERT (proceeds with markers)**: All other content

- **Self-Correcting Schema Validation**:
  - Model applies spec-config.js values programmatically during generation
  - Terminology auto-correction (click→select, customer→member, etc.)
  - Coverage analysis with soft warnings (not blocking)
  - Validation report includes schema compliance, coverage %, corrections, remaining markers

- **Enhanced Intervention Marker Styling**:
  - All flags (`[SME INPUT REQUIRED]`, `[VERIFY]`, `[SUGGESTED]`, etc.) now display as:
    - **Bold** + **Red** (#C00000) + **Italic** + **Yellow highlight**
  - Maximum visibility for human review requirements
  - Updated INTERVENTION_MARKER_STYLE in all documentation

- **New Validated Helpers**: Extended `validator/validated-helpers.js` with:
  - `createTableOfContents()` - Inline horizontal format enforcement
  - `createStepWithScreenshot()` - 55/45 column width enforcement
  - `createQuickReferenceBox()` - 4-column teal format enforcement
  - `createTroubleshootingTable()` - 25/30/45 column width enforcement
  - `createValidationReport()` - Generates validation report text

- **Added Phase 4.5 (Section Validation)**: Validates document structure before output

- **Cross-Document Formatting Consistency**:
  - Added `crossDocumentFormatting` section to `spec-config.js`
  - All output documents (procedure, assessment, quick card, validation report) share:
    - Same fonts (Calibri primary, Consolas monospace)
    - Same brand colors (teal headers, white header text, black body, gray footer)
    - Same intervention marker styling (bold, red, italic, yellow highlight)
  - Document-specific overrides for orientation, margins, font sizes
  - Added layout sections to `assessment_prompts.json` and updated `quick_card_prompts.json`

- **Screenshot Callout Color Matching (MANDATORY)**:
  - Added `screenshotCallouts` section to `spec-config.js`
  - Text references like "(Callout 1)" MUST match the annotation color on screenshots
  - Default callout color: teal (#154747) to match TFCU branding
  - Available colors: teal, red, blue, green, gold
  - Documented in `resources/visual_elements.md` with implementation examples

### Files Modified

- `SKILL.md` - v5.1, mandatory output bundle, validation infrastructure section, 7 wizard phases
- `REFERENCE.md` - v5.1, imports validated-helpers with ValidationContext
- `resources/interactive_wizard.md` - Phase 4.5, coverage analysis, auto-insert rules, mandatory bundle
- `resources/suggestion_triggers.json` - v2.0 with auto_insert actions, terminology auto-correction
- `resources/wizard_prompts.json` - v2.0 with Phase 4.5, mandatory deliverables
- `resources/quick_card_generator.md` - Marked as MANDATORY
- `resources/assessment_generator.md` - Marked as MANDATORY
- `validator/validated-helpers.js` - Added 5 new validators + createValidationReport

### Configuration Updates

- `suggestion_triggers.json`:
  - Added `terminology_auto_correction` section with 5 auto-correct rules
  - Added `auto_insert_config` section
  - All triggers now have `action: "auto_insert"` and `enforce: true`

- `wizard_prompts.json`:
  - Added `section_validation` phase (4.5)
  - Updated `output` phase with `mandatory_bundle: true` and 4 deliverables

---

## v5.0.1 - Anti-Hallucination Enforcement (Dec 2025)

### Changes

- **Added MANDATORY enforcement language** to ensure anti-hallucination checks are automatically applied
  - Updated SKILL.md frontmatter with CRITICAL enforcement note
  - Added "CRITICAL: Anti-Hallucination Requirements" section to SKILL.md (prominent position)
  - Added "MANDATORY: Anti-Hallucination Enforcement" section to interactive_wizard.md
  - Enforcement rules now explicitly state the model MUST scan for patterns and ASK before proceeding

- **Clarified enforcement workflow**:
  1. Model MUST scan all user input against `uncertainty_triggers` patterns
  2. Model MUST hard-stop on TFCU-specific content and ASK for values
  3. Model MUST insert markers if user skips providing required values
  4. Model MUST NOT infer or guess TFCU-specific values under any circumstances

### Files Modified

- `SKILL.md` - Added CRITICAL enforcement section, updated frontmatter
- `resources/interactive_wizard.md` - Added MANDATORY enforcement section at top

---

## v5.0 - Anti-Hallucination Safeguards (Dec 2025)

### New Features

- **Anti-Hallucination Safeguards**: Prevents the model from fabricating TFCU-specific content
  - Distinguishes between regulatory requirements (model CAN generate) and TFCU-specific content (model MUST ask)
  - Hard-stop questioning for critical items: internal limits, approval authorities, contacts
  - Red italic intervention markers in generated DOCX for unverified content

- **New Phase 3.5: Uncertainty Resolution**: Added to wizard workflow
  - Presents all flagged uncertainties after step construction
  - Separates CRITICAL (must resolve) from VERIFICATION (can flag)
  - User chooses: resolve all, resolve critical only, or proceed with markers

- **Intervention Markers**: Six marker types for different uncertainty levels:
  | Marker | When Used |
  |--------|-----------|
  | `[VERIFY: ...]` | Pattern-extracted value needs confirmation |
  | `[CONFIRM: ...]` | Auto-generated content needs validation |
  | `[SME INPUT REQUIRED: ...]` | Missing TFCU-specific information |
  | `[MISSING: ...]` | Required field not provided |
  | `[CHECK: ...]` | Inferred content with low confidence |
  | `[SUGGESTED: ...]` | Auto-generated content not from source |

- **Regulatory Passthrough**: Model confidently generates these without asking:
  - CTR threshold ($10,000) - 31 CFR 1010.311
  - SAR requirements - FinCEN rules
  - BSA/AML procedures - Bank Secrecy Act
  - OFAC screening - Federal sanctions
  - Reg E timelines - Error resolution

- **Assessment Distractor Verification**: Prevents auto-generating wrong answers for compliance content

- **Quick Card Marker Propagation**: Markers from source procedure propagate to extracted card content

### Files Modified

- `SKILL.md` - Updated to v5.0, added "Anti-Hallucination Safeguards" section
- `REFERENCE.md` - Updated to v5.0, added Intervention Marker Helpers section:
  - `createInterventionMarker()` - Red italic marker TextRun
  - `createTextWithMarker()` - Paragraph with inline marker
  - `createMarkerSummary()` - Summary table for output section
- `resources/wizard_prompts.json` - Added:
  - `uncertainty_prompts` - Hard-stop question templates for TFCU-specific content
  - `regulatory_passthrough` - Patterns model CAN generate
  - `intervention_markers` - Marker format definitions
- `resources/suggestion_triggers.json` - Added:
  - `uncertainty_triggers` - Patterns requiring user confirmation
  - `hard_stop_patterns` - Patterns that ALWAYS require input
  - `regulatory_passthrough` - Federal requirements the model can generate
  - `confidence_thresholds` - Action thresholds by confidence level
- `resources/interactive_wizard.md` - Added:
  - Phase 3.5: Uncertainty Resolution
  - Marker summary in Phase 5 output
  - Quick Card marker integration
- `resources/visual_elements.md` - Added Intervention Markers section with styling specs
- `resources/assessment_prompts.json` - Added:
  - `distractor_verification` - Safeguards for wrong answer generation
  - `question_generation_rules` - Which questions can be auto-generated
  - `content_with_markers` - How to handle flagged content in assessments
- `resources/quick_card_prompts.json` - Added:
  - `marker_propagation` - Preserve markers in extracted content

---

## v4.9 - Quick Reference Card Generator (Dec 2025)

### New Features

- **Quick Reference Card Generator**: Creates one-page "cheat sheets" from full procedures for frontline staff
  - Automatically offered at end of wizard Phase 5 (after assessment offer)
  - Landscape orientation (8.5x11), two-column layout, laminatable format
  - Smart content extraction prioritizing decision points and critical steps
  - TFCU branded with teal header and professional styling

- **Card triggers**: "quick reference", "cheat sheet", "job aid", "quick card", "reference card", "one pager", "desk reference"

- **Card sections automatically generated**:
  | Section | Content Source | Max Items |
  |---------|----------------|-----------|
  | Before You Start | Prerequisites | 4 |
  | Key Steps | Top prioritized steps | 8 |
  | Watch Out For | CRITICAL/WARNING callouts | 4 |
  | When to Escalate | Escalation triggers | 3 |
  | Quick Contacts | Support numbers, supervisors | 4 |

- **Smart extraction algorithm** (step prioritization):
  | Weight | Criteria | What It Catches |
  |--------|----------|-----------------|
  | 30% | Decision points | if/when logic, selection choices |
  | 25% | Verification steps | verify/confirm/check/ensure |
  | 20% | Section anchors | First and last steps of each section |
  | 15% | Callout-attached | Steps with WARNING/CRITICAL callouts |
  | 10% | Data entry | enter/type/input steps |

- **Edge case handling**: Short procedures, missing callouts, no contacts, large procedures (>25 steps)

- **Abbreviation glossary**: Auto-applies common abbreviations (MSR, Acct #, CTR, SAR, etc.)

### Files Added

- `resources/quick_card_generator.md` - Complete feature documentation with user interaction flows
- `resources/quick_card_prompts.json` - Extraction rules, triggers, layout config, edge case handling

### Files Modified

- `SKILL.md` - Added triggers to frontmatter, new "Quick Reference Card Generator" section, updated Files Reference
- `REFERENCE.md` - Added 8 new helper functions for landscape card layout:
  - `createQuickCardHeader()` - Teal branded header bar
  - `createQuickCardSectionHeader()` - Section headers with icons
  - `createCheckboxList()` - Before You Start items
  - `createCondensedSteps()` - Key Steps numbered list
  - `createCalloutList()` - Watch Out For with icons
  - `createEscalationList()` - When to Escalate condition/action pairs
  - `createQuickContactGrid()` - Contact label/value table
  - `createLandscapeQuickCard()` - Complete card document assembly
- `resources/interactive_wizard.md` - Added Phase 5 extension for quick card auto-offer

### Documentation

- Updated version numbers to v4.9 across all files
- Added Quick Card Helpers section to REFERENCE.md Table of Contents
- Added edge case handling dialogs to interactive_wizard.md

---

## v4.8 - Training Assessment Generator (Dec 2025)

### New Features

- **Training Assessment Generator**: Transforms completed procedures into competency assessments
  - Automatically offered at end of wizard Phase 5
  - Generates 5-10 questions from procedure content
  - Question types: multiple choice, true/false, fill-in-blank, scenario-based
  - Answer key on separate page (for supervisor use)
  - 80% pass threshold with remediation guidance
  - Output as appended section or standalone document

- **Assessment triggers**: "generate assessment", "create quiz", "training questions", "competency check"

- **Question generation logic based on procedure elements**:
  - Sequential steps → ordering questions (60% recall)
  - CRITICAL/WARNING callouts → true/false questions
  - Decision points → scenario questions (10% scenario)
  - Quick Reference values → recall questions
  - Data entry with verification → fill-in-blank questions (30% application)

### Files Added

- `resources/assessment_generator.md` - Assessment generation rules, templates, and examples
- `resources/assessment_prompts.json` - Question templates, triggers, difficulty weights, scoring config

### Documentation

- Added "Training Assessment Generator" section to SKILL.md
- Added "Phase 5 Extension: Training Assessment Generator" to interactive_wizard.md
- Added "Assessment Section Helpers" with 6 helper functions to REFERENCE.md

---

## v4.7.3 - Footer Layout Fix (Dec 2025)

### Bug Fixes

- **Balanced footer layout**: Fixed version watermark pushing footer content off-center
  - Old: `Dept | Procedure | Page X of Y                    v4.7.2` (unbalanced)
  - New: `Dept | Procedure | Page X of Y  ·  v4.7.3` (centered, inline)
  - Version now uses middle-dot separator (·) and lighter gray (#AAAAAA)
  - Footer remains fully centered with version as natural suffix

---

## v4.7.2 - Date Verification & Version Watermark (Dec 2025)

### New Features

- **Date verification requirement**: Skill now explicitly instructs Claude to verify the current date before generating documents
  - Prevents date assumptions based on training data cutoffs
  - Applies to header table date, revision history, and filename convention

- **Version watermark in footer**: Generated documents now include subtle skill version in footer
  - Format: `Department | Procedure Name | Page X of Y          v4.7.2`
  - Version appears right-aligned in small gray text (#999999)
  - Enables traceability of which skill version generated each document

### Documentation

- Added "Date Handling" section to SKILL.md Workflow Execution
- Added `SKILL_VERSION` constant to REFERENCE.md Layout Constants
- Updated footer implementation in REFERENCE.md and visual_elements.md

---

## v4.7.1 - Output Format Enforcement (Dec 2025)

### Bug Fixes

- **Screenshot format enforcement**: Added explicit "MANDATORY" section requiring two-column table format for screenshot steps
  - Skill was generating inline `[SCREENSHOT: description]` text instead of tables
  - Now clearly prohibits inline format and mandates table layout

- **TOC format enforcement**: Added explicit format requirements for Table of Contents
  - Must be inline horizontal: `Contents: Section1 • Section2 • Section3`
  - Must use clickable hyperlinks (teal, no underline)
  - Explicitly prohibits table or vertical list formats

### Documentation

- Added "MANDATORY: Screenshot Placeholder Table Format" section to SKILL.md
- Added "Table of Contents Format" section with correct/incorrect examples
- Added "MANDATORY Output Format Rules" section to Phase 5 in interactive_wizard.md

---

## v4.7 - Wizard Discoverability & Screenshot Placeholders (Dec 2025)

### New Features

- **Explicit wizard activation**: Added "wizard", "interactive", and "interactive mode" as trigger words
  - Previously only worked with phrases like "create procedure"
  - Now users can simply say "wizard" or "interactive mode" to start

- **Screenshot placeholder tables for novel procedures**: When generating new procedures (not reformatting existing ones), steps matching screenshot patterns now automatically include two-column tables with placeholder descriptions:
  - Login/authentication steps (HIGH priority)
  - Dropdown/selection steps (MEDIUM priority)
  - Navigation to menus/screens/tabs (MEDIUM priority)
  - Error/warning message handling (HIGH priority)
  - Form completion steps (HIGH priority)
  - Confirmation/success screens (MEDIUM priority)

- **Manual screenshot override**: Include `[screenshot]` in step text to force a placeholder even if no pattern match

- **End-of-wizard screenshot summary**: Shows how many steps have placeholders with option to add more

### Documentation

- Added prominent "Interactive Procedure Wizard" section to SKILL.md with trigger words and example prompts
- Updated frontmatter description to explicitly mention wizard trigger words
- Added comprehensive "Screenshot Placeholder Tables for Novel Procedures" section to interactive_wizard.md
- Added `placeholder_template` fields to all screenshot triggers in suggestion_triggers.json

### Files Modified

- `SKILL.md`: Updated frontmatter description; added wizard quick reference section; version bump to 4.7
- `resources/interactive_wizard.md`: Added new triggers; added screenshot placeholder documentation
- `resources/wizard_prompts.json`: Added "wizard", "interactive", "interactive mode" to activation_triggers
- `resources/suggestion_triggers.json`: Added placeholder_template to each screenshot recommendation

---

## v4.6 - Callout Format & Placement Accuracy (Dec 2025)

### Breaking Changes

- **Inline reference format changed**: Text now uses `(callout N)` instead of `(color callout N)`
  - Old: "Click the button (teal callout 1)"
  - New: "Click the button (callout 1)"
  - The COLOR is only visible on the screenshot callout circle, not in the text

### Improvements

- **Accurate callout placement guidance**: New section in SKILL.md with:
  - Step-by-step placement process using vision analysis
  - Coordinate calculation formula
  - Placement rules by element type (buttons, menus, fields, etc.)
  - Common mistakes to avoid checklist
  - Validation checklist for quality assurance

- **Color selection by action type**: New table mapping action importance to callout colors:
  - Primary actions → RED (critical)
  - Navigation → TEAL (primary)
  - Informational → BLUE (info)
  - Caution → GOLD (warning)

### Technical Changes

- `screenshot_processor.py`: `inline_reference` now generates `(callout N)` format
- `figure_registry.json`: `callouts_for_text[].inline_reference` no longer includes color name
- `annotation_template.json`: Added `_placement_guidance` section with vision analysis instructions

### Migration

Update any code that parses `inline_reference` to expect `(callout N)` format instead of `(color callout N)`.

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
├── resources/
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
3. Replace files in `resources/` directory
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
| `resources/vision_prompts.md` | Added suggested_crop, description_text, color matching |
| `resources/screenshot_handling.md` | Updated pipeline, preprocessing, figure numbering docs |

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
| `resources/screenshot_handling.md` | Removed Legacy Mode section, unified workflow |

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
| `resources/vision_prompts.md` | Claude Vision prompt templates for analysis |
| `resources/screenshot_handling.md` | Complete guide for intelligent screenshot workflow |

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
