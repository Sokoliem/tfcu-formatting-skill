# TFCU Procedure Formatter - Verification Tests

Run these tests after any skill modification to verify functionality.

---

## Test 1: Mode Detection

Verify Claude correctly identifies the intended output mode based on user input.

| User Says | Expected Mode | Expected Output |
|-----------|---------------|-----------------|
| "Reformat this document" + attachment | CONVERT | 4-file bundle (procedure, assessment, quick card, validation report) |
| "Start the procedure wizard" | CREATE | Wizard phase 1 prompt (asks for topic/audience) |
| "Give me a blank template" | TEMPLATE | Single .docx with all sections and placeholder text |
| "Create a quick reference card for X" | QUICK_CARD | Single landscape .docx quick reference card |
| "Generate assessment questions for X" | ASSESSMENT | Single assessment .docx with answer key |

### Pass Criteria
- [ ] Each input triggers the correct mode
- [ ] No mode confusion between similar requests
- [ ] Error handling for ambiguous requests

---

## Test 2: Pre-Generation Scanning

Verify Claude correctly flags TFCU-specific content that requires SME review.

### Test Input
Provide this text and verify all items are flagged:

> Contact Card Services at ext. 4500 for assistance. Transactions over $500 require supervisor approval. Use cardwizard.tfcu.local to access the system. The Consumer Debit BIN is 41139300 per TFCU policy 4.2.1.

### Expected Flags (6 items)

| Item | Type | Expected Action |
|------|------|-----------------|
| `ext. 4500` | Contact info | Flag or ask user |
| `$500` | Dollar amount | Flag or ask user |
| `cardwizard.tfcu.local` | System URL | Flag or ask user |
| `supervisor approval` | Approval authority | Flag or ask user |
| `41139300` | BIN number | Flag or ask user |
| `policy 4.2.1` | Policy reference | Flag or ask user |

### Pass Criteria
- [ ] All 6 items identified in pre-generation scan
- [ ] Each flagged item either:
  - Prompts user for verification, OR
  - Inserts `[SME INPUT REQUIRED]` marker
- [ ] No TFCU-specific values fabricated or assumed

---

## Test 3: Helper Selection

Verify correct helper function selection based on context.

| Scenario | Expected Helper |
|----------|-----------------|
| Converting doc with existing screenshot | `createStepWithScreenshot()` |
| Wizard mode, no screenshot yet | `createStepWithScreenshotPlaceholder()` |
| Prerequisite step, no image needed | `createTextStep()` |
| Creating a glossary section | `createGlossaryTable()` |
| Adding comparison of options | `createComparisonTable()` |
| Adding a callout box | `createCalloutBox()` with appropriate type |

### Pass Criteria
- [ ] Helper selection matches scenario context
- [ ] No hardcoded formatting (all via validated-helpers.js)
- [ ] Screenshot placeholders include figure number assignment

---

## Test 4: Callout Selection

Verify correct callout type selection based on content.

| Content | Expected Callout Type | Border Color |
|---------|----------------------|--------------|
| "Members must verify identity per Reg E" | CRITICAL | #C00000 (red) |
| "Do not close browser during processing" | WARNING | #FFC000 (gold) |
| "Processing typically takes 30 seconds" | NOTE | #2E74B5 (blue) |
| "Use Ctrl+D to bookmark this page" | TIP | #548235 (green) |

### Pass Criteria
- [ ] Callout type matches content severity/nature
- [ ] Border and background colors from spec-config.js
- [ ] Icon emoji matches callout type

---

## Test 5: Post-Generation Validation

After generating any document, verify Claude performs these checks.

### Validation Checklist

| Check | Description | Expected |
|-------|-------------|----------|
| TOC anchor check | All TOC entries link to valid bookmarks | PASS/FAIL |
| Figure sequence check | Figures numbered sequentially (1, 2, 3...) | PASS/FAIL |
| Intervention marker count | Count of `[SME INPUT REQUIRED]` markers | X items |
| Revision history present | Document includes revision tracking table | PASS/FAIL |
| Spec compliance | All formatting matches spec-config.js | PASS/FAIL |

### Pass Criteria
- [ ] All 5 checks performed automatically
- [ ] Results reported in output message
- [ ] Validation report file generated for full bundles

---

## Test 6: Full Bundle Generation

Verify complete output bundle when converting a procedure.

### Test Input
Request: "Convert this procedure to TFCU standards" with a sample document

### Expected Output (4 files)

| File Pattern | Description | Check |
|--------------|-------------|-------|
| `{Dept}_{Name}_{YYYYMM}.docx` | Main procedure document | [ ] |
| `{Name}_Assessment_{YYYYMM}.docx` | Training assessment with answer key | [ ] |
| `{Name}_QuickCard_{YYYYMM}.docx` | Quick reference card (landscape) | [ ] |
| `{Name}_ValidationReport.txt` | Schema compliance report | [ ] |

### Filename Validation
- [ ] Department abbreviation from approved list
- [ ] Procedure name uses underscores (no spaces)
- [ ] Date suffix is current YYYYMM
- [ ] All 4 files use consistent naming

### Content Validation
- [ ] Main procedure has all required sections
- [ ] Assessment has 10+ questions with answer key
- [ ] Quick card fits single landscape page
- [ ] Validation report shows spec compliance

---

## Running Tests

### Manual Testing Procedure

1. **Load Skill**: Ensure tfcu-procedure-formatter skill is active
2. **Run Each Test**: Execute tests 1-6 in order
3. **Document Results**: Note pass/fail for each criterion
4. **Report Issues**: Log any failures with reproduction steps

### Test Environment
- Claude.ai, Claude Code, or Claude Desktop
- Skill version: v6.1.0
- Date tested: ____________
- Tester: ____________

### Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Mode Detection | ☐ Pass / ☐ Fail | |
| Test 2: Pre-Generation Scanning | ☐ Pass / ☐ Fail | |
| Test 3: Helper Selection | ☐ Pass / ☐ Fail | |
| Test 4: Callout Selection | ☐ Pass / ☐ Fail | |
| Test 5: Post-Generation Validation | ☐ Pass / ☐ Fail | |
| Test 6: Full Bundle Generation | ☐ Pass / ☐ Fail | |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v6.0 | Dec 2025 | Initial test plan creation |
