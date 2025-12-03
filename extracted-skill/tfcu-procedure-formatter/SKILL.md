---
name: tfcu-procedure-formatter
description: >
  Transforms legacy TFCU policies and procedures into standardized professional documents.
  Activate when user requests: (1) reformatting old policies/procedures into TFCU template,
  (2) converting informal documentation to standards, (3) restructuring for clarity/compliance,
  (4) adding flowcharts or visual aids, (5) applying adult learning best practices,
  (6) creating new procedures using the INTERACTIVE WIZARD (trigger words: "wizard",
  "interactive", "create procedure", "new procedure", "procedure wizard"), or
  (7) generating QUICK REFERENCE CARDS (trigger words: "quick reference", "cheat sheet",
  "job aid", "quick card", "reference card", "one pager", "desk reference").
  Enforces teal branding, hierarchical numbering, and revision tracking per TFCU template.
  CRITICAL: v5.0 anti-hallucination safeguards are MANDATORY - never infer TFCU-specific
  values (limits, contacts, policies, fees). Always ask or insert [SME INPUT REQUIRED] markers.
---

# TFCU Procedure Formatter v6.1.0

Transform legacy policies and procedures into professional, standardized documents using the official TFCU Procedure Template.

---

## How to Use This Skill

This skill transforms legacy TFCU procedures into standardized, branded documents. It also creates new procedures via a guided wizard and automatically generates training assessments and quick reference cards for every procedure.

### Ways to Use It

| If You Want To... | Say Something Like... |
|-------------------|----------------------|
| Convert an existing procedure | "Reformat this procedure to TFCU standards" / "Convert this document to the new template" (attach file) |
| Create a new procedure from scratch | "Start the procedure wizard" / "Help me create a new procedure for [topic]" |
| Generate a blank template | "Give me a blank TFCU procedure template" / "I need a starter template" |
| Create just a quick reference card | "Make a quick reference card for [procedure]" / "Create a cheat sheet for [topic]" |
| Create just a training assessment | "Generate quiz questions for this procedure" / "Create a competency assessment" |

### What You'll Get

- **Standard conversion/creation**: 4-file bundle (procedure, assessment, quick card, validation report)
- **Template request**: Single .docx with all sections and placeholder text
- **Quick card only**: Single-page landscape reference card
- **Assessment only**: Quiz with answer key

### What to Have Ready

- **For conversions**: Source document (Word, PDF, or paste text)
- **For new procedures**: Topic, target audience, and key steps (wizard will prompt for details)
- **For any TFCU-specific values** (limits, phone numbers, BINs): Have these on hand or expect `[SME INPUT REQUIRED]` markers

### Tips for Best Results

- Include screenshots if you have them—the skill annotates them with numbered callouts
- Specify the department (Card Services, Operations, Lending, etc.) for correct file naming
- If you're unsure about TFCU-specific values, say so—the skill will flag them for SME review rather than guess

### Interactive Wizard Quick-Start

Start the procedure wizard with any of these phrases:
- "Start the procedure wizard"
- "Create a new procedure"
- "Interactive mode"
- "Help me write a procedure for [topic]"

**Wizard Phase Summary:**

| Phase | What Happens |
|-------|--------------|
| 1. Intake | Choose mode (new/revise/quick), procedure type, audience, department |
| 2. Foundation | Set title, overview, prerequisites, quick reference values |
| 3. Step Construction | Build steps with real-time terminology checks and auto-inserted callouts |
| 3.5 Uncertainty Resolution | Resolve flagged TFCU-specific items (hard-stops) |
| 4. Quality Assurance | Review terminology compliance, sentence length, coverage analysis |
| 4.5 Section Validation | System validates structure against spec-config.js (automatic) |
| 5. Output | Generate 4-file bundle (procedure, assessment, quick card, validation report) |

**Quick Mode:** Say "quick format" to skip most questions. Provide title, department, and content—the wizard applies defaults and generates output in ~5 minutes.

**During the wizard you can say:**
- `go back` - return to previous question
- `skip` - use default value (where available)
- `help` - get guidance on current question
- `status` - see your progress
- `summary` - review all answers entered so far

**Output bundle (always generated):**
1. `{Dept}_{Procedure}_{YYYYMM}.docx` - Main procedure document
2. `{Procedure}_Assessment_{YYYYMM}.docx` - Training quiz with answer key
3. `{Procedure}_QuickCard_{YYYYMM}.docx` - Laminated desk reference
4. `{Procedure}_ValidationReport.txt` - Schema compliance report

---

## Mode Router

**MANDATORY: Determine mode BEFORE any other action. State mode to user before proceeding.**

| User Request Pattern | Mode | Output |
|---------------------|------|--------|
| Provides legacy doc/PDF/screenshot | **CONVERT** | 4-file bundle |
| "wizard", "create procedure", "new procedure" | **CREATE** | 4-file bundle via wizard phases |
| "template", "blank", "starter" | **TEMPLATE** | Single .docx with placeholders only |
| "quick reference", "cheat sheet", "job aid" | **QUICK_CARD** | Single quick card .docx only |
| "assessment", "quiz", "training questions" | **ASSESSMENT** | Single assessment .docx only |

**Execution Rule**: After determining mode, announce it:
> "Mode: **CONVERT** - I'll transform your document into the 4-file TFCU bundle."

---

## Critical Formatting Rules (Read Before Generating)

> **STOP** - These rules are frequently violated. Read them BEFORE generating any document.

### Header Table Layout (MANDATORY)
```
┌──────────────────────────────────────────────────────────────────┐
│              [Procedure Title - Centered, Bold, White]           │  ← Row 1: #154747 background
├─────────────────────────────────┬────────────────────────────────┤
│ [Department - Left]             │             [Date - Right]     │  ← Row 2: #E8F4F4 background
└─────────────────────────────────┴────────────────────────────────┘
```
- Row 1: Full width (columnSpan=2), teal (#154747) background, white text, 16pt bold, CENTERED
- Row 2: Two 50% cells, light teal (#E8F4F4) background, teal text 10pt
  - Left cell: Department name, LEFT aligned
  - Right cell: Date (Month Year), RIGHT aligned

### Table of Contents (MANDATORY FORMAT)
```
Contents: Overview • Section 1 • Section 2 • Section 3 • Figure Index • Revision History
```
- **SINGLE PARAGRAPH** - NOT a table, NOT a bulleted list
- `Contents:` in bold, followed by clickable hyperlinks
- Sections separated by bullets (•) with spaces
- ❌ NEVER put TOC in a table cell with "CONTENTS" header
- ❌ NEVER use vertical bullet list format

### Use Helper Functions
Always use these helpers from REFERENCE.md - never create custom implementations:
- `createHeaderTable(name, department, date)` → Header table
- `createTableOfContents(sections)` → Inline TOC
- `createSectionHeader(text, bookmarkId)` → Section headers with bookmarks

---

## Quick Start

### MANDATORY PRE-FLIGHT (Claude must complete before generating)

Before generating ANY document, complete these technical checks:

| # | Check | Command/Action | Failure Action |
|---|-------|----------------|----------------|
| 1 | Load spec-config.js | `require('./validator/spec-config.js')` | STOP - config required |
| 2 | Get current date | Use `getCurrentDate()` helper | STOP - no hardcoded dates |
| 3 | Check for screenshots | Look for images in source | If yes, continue to #4 |
| 4 | Run annotation pipeline | `python3 scripts/screenshot_processor.py` | STOP - raw images not allowed |
| 5 | Verify figure_registry.json | Check `workspace/images/annotated/` | STOP if images exist but registry missing |
| 6 | Plan Figure Index appendix | Add to document structure | STOP if images exist without Figure Index |

**CRITICAL**: Never skip these checks. The self-validation block will fail the build if violations are detected.

### HARD STOPS - Never Skip

These requirements will cause document generation to **FAIL** if violated:

#### 1. Dynamic Date Generation
- **Rule**: Always use `getCurrentDate()` helper
- **Never**: Hardcode dates like "December 2024"
- **Validation**: Build fails if date year < current year OR matches hardcoded example

#### 2. Figure Index Required When Screenshots Present
- **Rule**: If `imageCount > 0`, Figure Index appendix is MANDATORY
- **Location**: Before Revision History section
- **Validation**: Build fails if images exist without Figure Index

#### 3. Screenshot Annotation Pipeline Required
- **Rule**: Raw screenshots MUST be processed before document generation
- **Pipeline**: `screenshot_processor.py` → `figure_registry.json`
- **Validation**: Build fails if raw images exist without annotated versions

#### 4. SME Markers for TFCU-Specific Values
- **Rule**: Never invent dollar amounts, contacts, policy references, system URLs
- **Action**: Insert `[SME INPUT REQUIRED: ...]` marker
- **Style**: Bold, red (#C00000), italic, yellow highlight

---

```bash
# MANDATORY WORKFLOW - Claude executes these steps

# 0. RESOURCE LOADING (MANDATORY - before wizard or conversion)
# Claude MUST load these files before processing:
#
#   ALWAYS REQUIRED:
#   - validator/spec-config.js          → Formatting specs (54 requirements)
#   - resources/suggestion_triggers.json → Pattern matching, auto-insert rules
#
#   WIZARD MODE ONLY:
#   - resources/wizard_prompts.json     → Phase prompts, decision trees
#   - resources/interactive_wizard.md   → Phase execution details
#
#   OUTPUT GENERATION:
#   - resources/quick_card_prompts.json → Quick card extraction rules
#   - resources/assessment_prompts.json → Assessment question templates
#
# FALLBACK: If suggestion_triggers.json unavailable, use inline patterns
# from "Inline Pattern Reference" section below.

# 0.5 ANTI-HALLUCINATION SCAN (MANDATORY - before any generation)
# Claude MUST scan source document and flag TFCU-specific values:
#   - Contact info (phone, ext, email) → ASK or mark [SME INPUT REQUIRED]
#   - Policy/procedure/form names → ASK or mark [SME INPUT REQUIRED]
#   - Dollar amounts (non-regulatory) → ASK or mark [SME INPUT REQUIRED]
#   - System URLs/paths → ASK or mark [SME INPUT REQUIRED]
#   - Approval authorities → ASK or mark [SME INPUT REQUIRED]
# DO NOT PROCEED until scan is complete and gaps are addressed.

# 1. Install dependencies (one-time setup)
pip install -r requirements.txt   # Python: pillow
npm install                       # Node.js: docx, jszip, @xmldom/xmldom

# 2. Setup workspace (cross-platform)
python3 setup_workspace.py source.docx --workspace ./workspace

# 3. Convert to markdown for content analysis
pandoc source.docx -o workspace/source.md

# 4. Create annotations.json (see Annotation Format below)
# Map each image filename to its annotation instructions

# 5. Annotate screenshots (MANDATORY)
python3 screenshot_processor.py --input workspace/images/raw --output workspace/images/annotated --annotations workspace/annotations.json

# 6. Generate formatted procedure
# Claude generates JavaScript inline using REFERENCE.md helpers, executes with Node.js

# 7. Generate Figure Index
python3 scripts/generate_figure_index.py --registry workspace/images/annotated/figure_registry.json --output workspace/figure_index.json

# 8. Validate output
python3 scripts/validate_procedure.py --doc workspace/source.md --figures workspace/figure_index.json --registry workspace/images/annotated/figure_registry.json
```

### Pre-Generation Checklist (HARD STOP)

Before executing steps 1-8, Claude MUST complete these 6 scanning steps against the source content:

**1. Scan for phone patterns**
- Patterns: `ext. XXXX`, `XXX-XXXX`, `(XXX) XXX-XXXX`
- Action: Flag each with line number

**2. Scan for dollar amounts (non-federal)**
- Skip: $10,000 (CTR threshold - OK to use)
- Flag: All other dollar amounts
- Action: Flag each with line number

**3. Scan for internal URLs**
- Patterns: `*.tfcu.*`, `*.local`, intranet paths
- Action: Flag each with line number

**4. Scan for approval language**
- Patterns: "supervisor", "manager", "approval required", "must authorize"
- Action: Flag each with line number

**5. Scan for BIN patterns**
- Patterns: 6-8 digit numbers near "BIN", "card number", "card range"
- Action: Flag each with line number

**6. Scan for policy references**
- Patterns: "per policy", "TFCU policy", "policy ###", "procedure ###"
- Action: Flag each with line number

**Output Format:**
```
FLAGGED ITEMS REQUIRING VERIFICATION:
- Line 12: "ext. 4523" (phone pattern)
- Line 28: "$500 limit" (dollar amount)
- Line 45: "supervisor approval required" (approval language)
```

**Resolution:** Each flagged item becomes `[SME INPUT REQUIRED]` marker UNLESS user provides the value.

If ANY items are flagged, STOP and either:
1. Ask user for specific values, OR
2. Insert `[SME INPUT REQUIRED: description]` markers

**DO NOT invent, infer, or assume TFCU-specific values under any circumstances.**

See `REFERENCE.md` for complete implementation code and document assembly example.

### Inline Pattern Reference (Fallback)

If `resources/suggestion_triggers.json` fails to load, use these patterns directly for TFCU-specific content scanning:

#### Hard-Stop Patterns (ALWAYS ask or mark `[SME INPUT REQUIRED]`)

| Category | Pattern | Example Match | Action |
|----------|---------|---------------|--------|
| Dollar Limits | `\$[\d,]+(\.\d{2})?` (exclude CTR $10,000) | "$500 limit", "$1,500.00" | ASK for exact amount |
| Phone Numbers | `\d{3}[-.\s]?\d{3}[-.\s]?\d{4}` | "907-555-1234" | ASK to verify current |
| Extensions | `ext\.?\s*\d+` | "ext. 4500" | ASK to verify current |
| Approval | `(requires\|must have\|needs).*approval` | "requires supervisor approval" | ASK which role approves |
| Policy | `(per\|see\|refer to)\s*(tfcu\s*)?policy` | "per TFCU policy 3.2" | ASK for policy name/number |
| Internal URLs | `https?://.*\.(tfcu\|local\|internal)` | "intranet.tfcu.com" | ASK to confirm path |
| BIN Numbers | `\b\d{6,8}\b` (near "BIN", "card") | "BIN: 41139300" | ASK to verify current |

#### Regulatory Passthrough (CAN generate without asking)

| Regulation | Pattern | Standard Text | Source |
|------------|---------|---------------|--------|
| CTR | `\$10,?000\|ctr\|currency transaction` | "Transactions over $10,000 require CTR filing" | 31 CFR 1010.311 |
| SAR | `sar\|suspicious activity` | "Report suspicious activity per FinCEN requirements" | 31 CFR 1020.320 |
| BSA/AML | `bsa\|aml\|bank secrecy` | "Follow BSA/AML procedures" | Bank Secrecy Act |
| OFAC | `ofac\|sanction` | "Screen against OFAC sanctions list" | OFAC SDN List |
| Reg E | `reg\s*e\|error resolution\|provisional credit` | "Follow Regulation E timelines" | 12 CFR 1005 |

#### Terminology Auto-Correction (applied automatically)

| Incorrect | Correct | Pattern |
|-----------|---------|---------|
| click, choose, pick | select | `\b(click\|choose\|pick)\b` |
| customer, client, user | member | `\b(customer\|client\|user)\b` |
| type, key in, input | enter | `\b(type\|key in\|input)\b` |
| page, window | screen | `\b(page\|window)\b` (exclude popup/dialog) |
| check, confirm, ensure | verify | `\b(check\|confirm\|ensure)\b` |

#### Callout Pattern Triggers

| Pattern | Callout Type | Icon |
|---------|--------------|------|
| `\$10,?000\|ctr\|suspicious\|sar` | CRITICAL | ⛔ |
| `never\|do not\|prohibited\|must not` | CRITICAL | ⛔ |
| `deadline\|by close\|end of day\|time.?sensitive` | WARNING | ⚠️ |
| `irreversible\|cannot be undone\|permanent` | WARNING | ⚠️ |
| `tip\|best practice\|shortcut` | TIP | ✅ |
| `note\|remember\|fyi` | INFO | ℹ️ |

---

## CRITICAL: Anti-Hallucination Requirements

**These rules are MANDATORY for ALL procedure generation. Violation will produce inaccurate procedures.**

### NEVER Infer These Values (Always Ask or Mark)

| Category | Examples | Required Action |
|----------|----------|-----------------|
| **TFCU Limits** | Daily limits, transaction limits, approval thresholds | ASK: "What is the limit amount?" |
| **TFCU Contacts** | Phone numbers, extensions, email addresses | ASK: "What is the current contact?" |
| **TFCU Policies** | Policy numbers, internal requirements | ASK: "Which policy document?" |
| **TFCU Fees** | Fee amounts, waiver conditions | ASK: "What is the current fee?" |
| **TFCU Systems** | URLs, login paths, system names | ASK: "What is the system path?" |
| **Approval Authority** | Who approves, approval limits | ASK: "Which role can approve?" |

### CAN Generate Confidently (Federal Regulations)

These are fixed by law and apply to all financial institutions:
- CTR threshold: $10,000 (can state without asking)
- SAR requirements (can describe without asking)
- BSA/AML procedures (can describe without asking)
- OFAC screening requirements (can describe without asking)
- Reg E timelines (can state without asking)

### If User Doesn't Provide Required Value

Insert a bold, red, italic marker with yellow highlighting in the generated document:
```
Contact support at [SME INPUT REQUIRED: current phone number] for assistance.
Transactions over [SME INPUT REQUIRED: daily limit amount] require supervisor approval.
```

The model MUST NOT guess or infer TFCU-specific values under any circumstances.

---

## Interactive Procedure Wizard

**Trigger words:** `wizard`, `interactive`, `create procedure`, `new procedure`, `procedure wizard`

Use these trigger words to start the guided procedure creation wizard:

```
Example prompts:
- "Start the procedure wizard"
- "Interactive mode - I need to create a new procedure"
- "Create procedure for wire transfers"
- "New procedure wizard"
- "Help me write a procedure"
```

The wizard guides you through **7 phases**:
1. **Intake** - Mode selection, procedure type, audience, department
2. **Foundation** - Title, overview, prerequisites, quick reference
3. **Step Construction** - Build steps with real-time validation, auto-insert verification steps and callouts
4. **Phase 3.5: Uncertainty Resolution** - Resolve flagged TFCU-specific content (HARD-STOP items)
5. **Quality Assurance** - Terminology compliance, sentence length, passive voice detection, **coverage analysis**
6. **Phase 4.5: Section Validation** - Validate document structure against spec-config.js (self-correcting)
7. **Output** - Generate **mandatory output bundle** (4 files - no prompting):
   - Procedure document
   - Training assessment
   - Quick reference card
   - Validation report

See `resources/interactive_wizard.md` for complete wizard documentation.

---

## Anti-Hallucination Safeguards (v5.0)

**MANDATORY**: These safeguards are NOT optional. The model MUST apply them to ALL procedure generation.

### Enforcement Rules

**BEFORE generating any procedure content, the model MUST:**

1. **Scan for TFCU-specific patterns** - Check all user input against `suggestion_triggers.json` → `uncertainty_triggers` and `hard_stop_patterns`

2. **Hard-stop on critical items** - If any of these patterns are detected, STOP and ask the user BEFORE proceeding:
   - Dollar amounts (that aren't regulatory thresholds like $10,000 CTR)
   - Approval authorities ("supervisor approval", "manager must authorize")
   - Contact information (phone numbers, extensions, emails)
   - Internal policy references ("per TFCU policy", "must", "required")
   - System URLs or login paths

3. **Never infer TFCU-specific values** - If a value is not explicitly provided by the user and is not a federal regulation, the model MUST either:
   - Ask the user for the specific value, OR
   - Insert an intervention marker (e.g., `[SME INPUT REQUIRED: daily transaction limit]`)

4. **Include marker summary in output** - If ANY markers exist in the generated document, list them in the output summary

### What the Model CAN Confidently Generate

These have fixed requirements defined by federal regulators:
- **CTR threshold** - $10,000 (31 CFR 1010.311)
- **SAR requirements** - FinCEN rules
- **BSA/AML procedures** - Bank Secrecy Act
- **OFAC screening** - Federal sanctions
- **Reg E timelines** - Error resolution

### What the Model MUST Ask About

These vary by institution and could be hallucinated:
- **TFCU internal limits** - Daily transaction limits, approval thresholds
- **TFCU contacts** - Support numbers, department extensions
- **TFCU policies** - Internal policy references, approval authorities
- **TFCU systems** - URLs, login paths, system-specific steps
- **TFCU fees** - Fee amounts, waivers, exceptions

### Intervention Markers

When TFCU-specific content cannot be verified, it appears as **bold, red, italic text with yellow highlighting**:

| Marker | When Used |
|--------|-----------|
| `[VERIFY: ...]` | Pattern-extracted value needs confirmation |
| `[CONFIRM: ...]` | Auto-generated content needs validation |
| `[SME INPUT REQUIRED: ...]` | Missing TFCU-specific information |
| `[MISSING: ...]` | Required field not provided |
| `[CHECK: ...]` | Inferred content with low confidence |
| `[SUGGESTED: ...]` | Auto-generated content not from source |

### Workflow

1. During **Phase 3 (Step Construction)**, high-risk patterns trigger immediate clarification prompts
2. **Phase 3.5 (Uncertainty Resolution)** presents all flagged items for resolution
3. Unresolved items appear as bold, red, italic markers with yellow highlighting in the generated DOCX
4. **Phase 5 Output** includes a marker summary showing what needs review

See `resources/wizard_prompts.json` for uncertainty triggers and `resources/suggestion_triggers.json` for pattern definitions.

---

## Training Assessment Generator (MANDATORY)

**Status:** Assessment generation is **automatic** - always included in the output bundle.

**Trigger words (for standalone generation):** `generate assessment`, `create quiz`, `training questions`, `competency check`

Training assessments are automatically generated as part of every procedure output. No prompting - assessments are always created.

**Output includes:**
- 5-10 questions (multiple choice, true/false, fill-in-blank, scenario-based)
- Answer key on separate page (for supervisor use)
- Scoring guidance (80% pass threshold)
- Estimated completion time

**Question sources:**
| Procedure Element | Question Type |
|-------------------|---------------|
| Sequential steps | Ordering questions |
| CRITICAL/WARNING callouts | True/False questions |
| Decision points (if/then) | Scenario questions |
| Quick Reference values | Recall questions |
| Data entry with verification | Fill-in-blank questions |

**Output filename:** `{ProcedureName}_Assessment_{YYYYMM}.docx` (always generated)

See `resources/assessment_generator.md` for complete documentation.

---

## Quick Reference Card Generator (MANDATORY)

**Status:** Quick card generation is **automatic** - always included in the output bundle.

**Trigger words (for standalone generation):** `quick reference`, `cheat sheet`, `job aid`, `quick card`, `reference card`, `one pager`, `desk reference`

Quick reference cards are automatically generated as part of every procedure output. No prompting - cards are always created.

**Output format:**
- Single page, landscape orientation (8.5x11)
- TFCU branded (teal header, professional layout)
- Printable/laminatable
- Two-column layout

**Card sections:**
| Section | Content Source | Max Items |
|---------|----------------|-----------|
| Before You Start | Prerequisites | 4 |
| Key Steps | Top prioritized steps | 8 |
| Watch Out For | CRITICAL/WARNING callouts | 4 |
| When to Escalate | Escalation triggers | 3 |
| Quick Contacts | Support numbers, supervisors | 4 |

**Content extraction (automatic):**
- **Always includes:** CRITICAL/WARNING callouts, prerequisites, escalation contacts
- **Smart extracts:** Decision points (30%), verification steps (25%), section anchors (20%)
- **Condenses:** Max 25 words per step, abbreviation glossary applied
- **Auto-generates warnings** if no callouts detected (with `[SUGGESTED]` markers)

**Output filename:** `{ProcedureName}_QuickCard_{YYYYMM}.docx` (always generated)

See `resources/quick_card_generator.md` for complete documentation.

---

### MANDATORY: Screenshot Placeholder Table Format

**When generating NEW procedures (wizard mode), steps that recommend screenshots MUST use a two-column table format:**

| Step | Screenshot |
|------|------------|
| **1.** Navigate to Member Services > Account Maintenance | **[Screenshot Needed]**<br><br>*Show:* Navigation menu with Account Maintenance highlighted<br>*Focus:* Menu path<br>*Annotations:* Arrow showing navigation path<br><br>*Replace with actual screenshot after capture.* |

**DO NOT use inline text like** `[SCREENSHOT: description]` **- this format is incorrect.**

**Screenshot triggers that REQUIRE table format:**
- Login/authentication steps → HIGH priority
- Dropdown/selection steps → MEDIUM priority
- Navigation to menus/screens/tabs → MEDIUM priority
- Error/warning message handling → HIGH priority
- Form completion steps → HIGH priority
- Confirmation/success screens → MEDIUM priority

Steps WITHOUT screenshot recommendations use standard formatting (no table).

---

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

### Helper Selection Matrix

Use this matrix to select the correct helper function for each step:

| Condition | Helper Function |
|-----------|-----------------|
| Step has existing screenshot | `createStepWithScreenshot()` |
| Step needs screenshot but none exists (CREATE/TEMPLATE mode) | `createStepWithScreenshotPlaceholder()` |
| Step is text-only, no screenshot needed | `createTextStep()` |
| Standalone warning before a section | `createCalloutBox()` |
| Warning specific to one step | `callout` parameter in `createStepWithScreenshot()` |

**Decision Flow:**
1. Does the step have a screenshot attached? → `createStepWithScreenshot()`
2. Should the step have a screenshot (system navigation, form entry, error handling)? → `createStepWithScreenshotPlaceholder()`
3. Is it a simple text instruction (no visual needed)? → `createTextStep()`
4. Is there a warning that applies to multiple steps or a whole section? → `createCalloutBox()`
5. Is there a warning that only applies to this specific step? → Use `callout` parameter

### Date Handling

**CRITICAL**: Before generating any procedure document:
1. Check the current date using available system information or ask the user
2. Use the ACTUAL current date for:
   - Header table date field (e.g., "December 2025")
   - Revision history entries
   - Filename convention (YYYYMM suffix)
3. DO NOT assume or guess dates based on training data

If uncertain about the current date, ASK the user before proceeding.

### Post-Generation Validation Checklist

**MANDATORY: Execute this checklist AFTER generating, BEFORE presenting to user.**

| # | Check | Fix if Failed |
|---|-------|---------------|
| 1 | Every TOC anchor has matching Bookmark ID in document | Add missing bookmarks |
| 2 | All figure numbers are sequential with no gaps | Renumber figures |
| 3 | No raw `[Screenshot Needed]` text remains (CONVERT mode only) | Replace with actual screenshot or placeholder table |
| 4 | Count intervention markers | Report count to user |
| 5 | Revision History table has at least one row | Add initial revision row |
| 6 | Footer contains department, procedure name, page numbers | Correct footer formatting |

**Execution Flow:**
1. Generate document
2. Run all 6 checks
3. Fix any failures automatically
4. If markers exist, compile summary:
   > "Document contains **X items** requiring SME review. See markers in document."
5. Present output to user with marker summary (if applicable)

**Do NOT present output until all checks pass or are reported.**

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
| Figure Index | Yes* | Appendix listing all screenshots (*if procedure has figures) |
| Revision History | Yes | Table at document end |
| Footer | Yes | Department, procedure name, page number, version watermark (right-aligned) |
| Table of Contents | Optional | For procedures > 3 pages - **INLINE format with clickable links** |
| Quick Reference Box | Optional | For frequently-referenced values |
| Prerequisites | Optional | When setup steps are needed |
| Glossary | Optional | When acronyms need definition |
| Flowcharts | Optional | For complex decision trees |

### Optional Section Triggers

Use this matrix to determine when to include optional sections:

| Section | Include When |
|---------|--------------|
| **Table of Contents** | Document exceeds 3 pages OR has 5+ major sections |
| **Quick Reference Box** | Source contains ANY: system URL, phone/extension, BIN, hours of operation, login path |
| **Prerequisites** | Procedure requires setup, permissions, materials, or prior steps before starting |
| **Glossary** | Source uses 3+ acronyms or technical terms not universally known at TFCU |
| **Troubleshooting** | Source documents known issues OR procedure has identifiable failure points |
| **Flowcharts** | Decision tree has 3+ branches OR process has conditional paths |

**Decision Flow:**
1. Count major sections and pages → Include TOC if threshold met
2. Scan for reference values (URLs, phones, BINs) → Include Quick Reference if found
3. Check if procedure has dependencies → Include Prerequisites if yes
4. Count undefined acronyms/terms → Include Glossary if 3+ found
5. Check for documented issues or failure modes → Include Troubleshooting if present

### Mandatory Output Bundle

Every procedure generation produces **4 files** (no prompting - all automatic):

```
1. {Department}_{ProcedureName}_{YYYYMM}.docx     - Main procedure document
2. {ProcedureName}_Assessment_{YYYYMM}.docx       - Training competency assessment
3. {ProcedureName}_QuickCard_{YYYYMM}.docx        - Quick reference card (laminatable)
4. {ProcedureName}_ValidationReport.txt           - Schema compliance & coverage report
```

Example for "Wire Transfer" procedure in Operations department:
```
Operations_Wire_Transfer_202512.docx
Wire_Transfer_Assessment_202512.docx
Wire_Transfer_QuickCard_202512.docx
Wire_Transfer_ValidationReport.txt
```

**Marker Summary (if applicable):**

If any `[SME INPUT REQUIRED]` markers were inserted, the output message MUST include:
```
MARKERS REQUIRING SME INPUT:
- [SME INPUT REQUIRED: Card Services extension]
- [SME INPUT REQUIRED: Related policy names]
```

This ensures unresolved items are visible even if the user doesn't review the full document.

### Output Filename Convention (MANDATORY - Auto-Enforced)

All output filenames are **automatically generated and validated** using `spec-config.js → filenameConventions`. Manual filename input is sanitized to comply with standards.

**Validation Rules (enforced programmatically):**
- **Department must match approved list** (auto-corrected if close match found via aliases)
- **Spaces and hyphens converted to underscores** automatically
- **Special characters removed** automatically
- **Title case applied** automatically
- **Date suffix uses current YYYYMM** from system date (no variations allowed)

**Approved Departments:**
`Card_Services`, `Member_Services`, `Operations`, `Lending`, `Accounting`, `Compliance`, `IT`, `HR`, `Marketing`

**Auto-Correction Examples:**
- "card services" → `Card_Services`
- "ops" → `Operations`
- "Member-Services" → `Member_Services`

**Enforcement Behavior:**
- **If department is invalid:** Model prompts user to select from approved list
- **If procedure name has issues:** Auto-sanitized with notification to user
- **Filename preview shown in Phase 1** after collecting department/title

**Implementation:**
```javascript
const { generateOutputBundle } = require('./validator/validated-helpers');
const bundle = generateOutputBundle(department, procedureName, ctx);
// Returns: { procedure, assessment, quickCard, validationReport, isValid }
```

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

### Table of Contents Format

> **CRITICAL**: The TOC must be a SINGLE PARAGRAPH with inline links. NEVER create a table for the TOC.

**CORRECT - Inline horizontal with clickable links (MANDATORY FORMAT):**
```
Contents: Overview • Risk Assessment • Member Verification • Account Restrictions • Fraud Protocol
```
- Single paragraph, NOT a table
- `Contents:` label in bold 10pt, followed by clickable links
- Each section name is a clickable hyperlink (teal #154747, no underline)
- Sections separated by bullet (•) with gray (#999999) color
- Single line, horizontal layout

**FORBIDDEN FORMATS (will cause document rejection):**

❌ **DO NOT** create a table with "CONTENTS" header:
```
┌─────────────────────────────┐
│ CONTENTS                    │  ← WRONG - this is a table cell
├─────────────────────────────┤
│ • Overview                  │
│ • Section Name              │
└─────────────────────────────┘
```

❌ **DO NOT** create vertical bullet list:
```
Contents:
• Overview
• Section Name
• Another Section
```

❌ **DO NOT** add borders or shading to the TOC

**Use ONLY the `createTableOfContents()` helper function from REFERENCE.md**

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

### Callout Type Selection Criteria

**USE this type when content contains:**

| Type | USE WHEN content contains | DO NOT use for |
|------|---------------------------|----------------|
| **CRITICAL** | Regulatory cite, "must", "required by", compliance, security, member funds at risk | General tips, nice-to-know info |
| **WARNING** | "Do not", "never", "avoid", data loss risk, common mistakes, irreversible actions | Compliance requirements (use CRITICAL) |
| **NOTE** | "Note that", context, background info, FYI, explains why | Anything actionable |
| **TIP** | "Tip:", efficiency, shortcut, best practice, time-saver | Required actions |

**Decision Flow:**
1. Is there a regulatory requirement or member funds at risk? → **CRITICAL**
2. Could the action cause data loss, errors, or is irreversible? → **WARNING**
3. Does the content explain context or background (non-actionable)? → **NOTE**
4. Is it a helpful shortcut or efficiency suggestion? → **TIP**

---

## Screenshot Annotation Requirements

### Mandatory Pipeline

All screenshots MUST be processed through the annotation pipeline:
1. Extract images with `setup_workspace.py`
2. Annotate with `screenshot_processor.py`
3. Register in `figure_registry.json`
4. Validate with `validate_procedure.py`

### Accurate Callout Placement (v4.6 - CRITICAL)

Callouts MUST be placed precisely on the UI elements they reference. Use vision analysis:

**Placement Process:**
1. **Analyze the screenshot** - Identify exact pixel locations of UI elements
2. **Calculate percentage coordinates** - Convert pixel position to % of image dimensions
3. **Place callout at element center** - Callout circle should overlap the target element
4. **Verify visually** - The numbered circle must clearly indicate "click HERE"

**Coordinate Calculation:**
```
x_percent = (element_center_x / image_width) * 100
y_percent = (element_center_y / image_height) * 100
```

**Placement Rules:**
| Element Type | Callout Position |
|--------------|------------------|
| Button | Center of button |
| Menu item | Left side of menu text |
| Input field | Left edge of field |
| Checkbox/Radio | Center of checkbox |
| Icon | Center of icon |
| Tab | Center of tab label |

**Common Mistakes to Avoid:**
- Callout floating in empty space (not on any element)
- Callout obscuring important text
- Callout on wrong element (verify element matches step description)
- Generic center placement (x:50, y:50) without analysis

**Validation Checklist:**
- [ ] Each callout clearly indicates a specific, clickable UI element
- [ ] Callout number is visible and not cut off by image edge
- [ ] Multiple callouts don't overlap each other
- [ ] Callout placement matches the step description exactly

### Color Selection Rule

Choose callout colors based on action importance. The COLOR is only on the screenshot - text just says "(callout N)":

| Action Type | Color Name | Hex | When to Use |
|-------------|------------|-----|-------------|
| Primary action | critical | #C00000 | Main button to click, required action |
| Navigation | primary | #154747 | Menu navigation, tabs, links |
| Informational | info | #2E74B5 | Reference fields, read-only data |
| Caution | warning | #FFC000 | Fields requiring care, optional |
| Confirmation | success | #548235 | Success indicators, completion |
| Secondary | purple | #7030A0 | Alternative paths |
| Tertiary | orange | #ED7D31 | Additional options |

**Color Assignment Examples:**
- "Click Submit" → RED callout (primary action)
- "Navigate to Settings menu" → TEAL callout (navigation)
- "Note the account number shown" → BLUE callout (informational)
- "Enter amount carefully" → GOLD callout (requires attention)

### Annotation Types

| Type | Use Case |
|------|----------|
| Callout | Button clicks, numbered sequences |
| Arrow | Pointing to elements |
| Highlight | Input fields, data areas |
| Circle | Single focus point |
| Label | Explanatory text |

### Inline Callout References (v4.6)

Callout numbers in procedure text reference the **numbered circles on the screenshot**. The callout circle on the screenshot IS the color - do NOT include the color name in the text.

**Format:** `(callout N)` where N = the number shown on the screenshot callout

**Example step with callout references:**

```
1. Access the Card Issuance screen.

   a. Navigate to the Tools menu (callout 1)
   b. Select Card Services from the dropdown (callout 2)
   c. Click Instant Issue (callout 3) - this is the primary action
```

**Guidelines:**
- Text says "(callout N)" - the COLOR is only on the screenshot, not in words
- The numbered circle on the screenshot is colored (teal, red, etc.) - that IS the visual indicator
- Sub-steps map 1:1 with numbered callouts on the screenshot
- Critical actions get RED callouts on screenshot
- Navigation steps get TEAL callouts on screenshot
- Informational elements get BLUE callouts on screenshot

**Using figure_registry.json:**
The registry provides `callouts_for_text` with ready-to-use references:

```json
{
  "figure_number": 1,
  "callouts_for_text": [
    {"number": 1, "color": "teal", "description": "Navigate to Tools menu", "inline_reference": "(callout 1)"},
    {"number": 2, "color": "teal", "description": "Select Card Services", "inline_reference": "(callout 2)"},
    {"number": 3, "color": "red", "description": "Click Instant Issue", "inline_reference": "(callout 3)"}
  ]
}
```

**IMPORTANT:** The `color` field controls the callout circle color ON THE SCREENSHOT. The `inline_reference` in text is always just "(callout N)" without color words.

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

## Schema Validation (MANDATORY)

All documents are validated against `validator/spec-config.js` - the single source of truth for 54 spec requirements.

### Validation Infrastructure

| File | Purpose |
|------|---------|
| `validator/spec-config.js` | Frozen/immutable spec (typography, colors, layout, borders, spacing) |
| `validator/validated-helpers.js` | Self-correcting helper functions that use spec-config values |
| `validator/validation-context.js` | Error/warning collection (strict, lenient, report-only modes) |
| `validator/validation-errors.js` | Specialized error types (Font, Color, Size, Structure, etc.) |

### Self-Correcting Validation

The model generates documents programmatically using validated helpers. Validation is **self-correcting** - the model applies correct spec-config values during generation. No user intervention needed for formatting compliance.

### Validation Report Contents

The validation report (`{ProcedureName}_ValidationReport.txt`) includes:
- **Schema compliance status** - All 54 spec requirements checked
- **Coverage analysis** - Screenshot coverage % by procedure type
- **Terminology corrections** - Auto-corrections applied during generation
- **Remaining markers** - Any `[SUGGESTED]`, `[VERIFY]`, `[SME INPUT REQUIRED]` markers

### Coverage Analysis Thresholds (Soft Warnings)

| Procedure Type | Recommended Coverage | Warning Threshold |
|----------------|---------------------|-------------------|
| System | 80% | Below 80% |
| Operational | 60% | Below 60% |
| Compliance | 30% | Below 30% |

Coverage warnings are included in the validation report but do not block output.

### Cross-Document Formatting Consistency

All output documents (procedure, assessment, quick card, validation report) share consistent formatting defined in `spec-config.js → crossDocumentFormatting`:

| Element | All Documents |
|---------|---------------|
| **Primary Font** | Calibri |
| **Monospace Font** | Consolas (BINs, phone numbers, account numbers) |
| **Header Background** | #154747 (dark teal) |
| **Header Text** | #FFFFFF (white) |
| **Body Text** | #000000 (black) |
| **Footer Text** | #666666 (gray) |
| **Intervention Markers** | Bold, red (#C00000), italic, yellow highlight |

**Document-specific overrides** (where they differ):
- **Procedure**: Portrait, 11pt body, 0.75" margins
- **Assessment**: Portrait, 11pt body, 0.75" margins (same as procedure)
- **Quick Card**: Landscape, 10pt body, 0.5" margins (denser layout)
- **Validation Report**: Portrait, 10pt body, 0.75" margins

### Screenshot Callout Color Matching (MANDATORY)

When screenshots include numbered callout annotations (1), (2), (3), the text references in steps **MUST** match the callout color:

- Screenshot has teal `(1)` → Text "(Callout 1)" must be teal (#154747), bold
- Screenshot has red `(2)` → Text "(Callout 2)" must be red (#C00000), bold

See `resources/visual_elements.md` for full implementation details.

## Validation Checklist

Run `validate_procedure.py` to verify:
- All required sections present (Overview, Related, Figure Index, Revision History)
- Figure Index appendix included (if procedure has screenshots)
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
| `scripts/revision_analyzer.py` | Revision history analysis |
| `scripts/terminology_validator.py` | Cross-procedure terminology validation |
| `templates/annotation_template.json` | Example annotation configurations |
| `assets/Procedure_Template.docx` | TFCU template reference |
| `resources/interactive_wizard.md` | Interactive procedure creation wizard |
| `resources/assessment_generator.md` | Training assessment generation (MANDATORY) |
| `resources/assessment_prompts.json` | Assessment question templates and config |
| `resources/quick_card_generator.md` | Quick reference card generation (MANDATORY) |
| `resources/quick_card_prompts.json` | Quick card extraction rules and config |
| `resources/suggestion_triggers.json` | Auto-insert patterns and terminology rules |
| `resources/wizard_prompts.json` | Wizard phase prompts and validation |
| `resources/visual_elements.md` | Visual component specifications and styles |
| `resources/screenshot_handling.md` | Screenshot processing and annotation guidelines |
| `resources/vision_prompts.md` | Vision/image analysis prompts for Claude |
| `resources/writing_standards.md` | TFCU writing style guidelines |
| `resources/terminology_rules.json` | Terminology validation rules and mappings |
| `validator/spec-config.js` | 54 spec requirements (frozen, immutable) |
| `validator/validated-helpers.js` | Self-correcting helper functions |
| `validator/validation-context.js` | Error/warning collection with 3 modes |
| `validator/validation-errors.js` | Specialized error types for all violations |
| `validator/index.js` | Validation system entry point |
| `validator/ooxml-parser.js` | OOXML document structure parser |
| `validator/report-generator.js` | Validation report generation |
| `validator/spec-validator.js` | Spec compliance validation logic |
