# Quick Reference Card Generator (MANDATORY)

Transform full procedures into one-page "cheat sheets" for frontline staff. Designed for printing, laminating, and posting at workstations.

**Status:** Quick card generation is **MANDATORY** - always generated as part of the output bundle. No prompting required.

---

## Activation

Quick cards are generated automatically for every procedure. For standalone generation:

**Trigger words:** `quick reference`, `cheat sheet`, `job aid`, `quick card`, `reference card`, `one pager`, `desk reference`

**Example prompts:**
```
- "Create a quick reference card for the Wire Transfer procedure"
- "Generate a cheat sheet from this procedure"
- "Make a job aid I can laminate"
- "One pager for new teller training"
- "Desk reference for Card Issuance"
```

**Mandatory output:** Always generated as part of the 4-file output bundle (procedure, assessment, quick card, validation report).

---

## Output Format

| Property | Value |
|----------|-------|
| Orientation | Landscape |
| Page size | 8.5" x 11" (Letter) |
| Margins | 0.5" all sides |
| Columns | 2 (left: 50%, right: 50%) |
| Header | Teal branded bar with procedure title |
| Footer | Department, date, version, "For training use only" |

**Filename pattern:** `{ProcedureName}_QuickCard_{YYYYMM}.docx`

---

## Card Sections

### Left Column

#### 1. BEFORE YOU START (☐)
**Source:** Prerequisites section
**Format:** Checkbox list
**Max items:** 4

Extracts prerequisites from the procedure. If none found, offers common suggestions based on procedure type.

```
☐ Verify member identity with two forms of ID
☐ Confirm account is active and in good standing
☐ Ensure card printer is online and loaded
☐ Log in to CardWizard Pro
```

#### 2. KEY STEPS (#)
**Source:** Smart extraction algorithm
**Format:** Numbered list (condensed)
**Max items:** 8

Prioritizes steps by importance using weighted algorithm:

| Weight | Criteria | What it catches |
|--------|----------|-----------------|
| 30% | Decision points | if/when logic, selection choices |
| 25% | Verification | verify/confirm/check/ensure steps |
| 20% | Section anchors | First and last steps of each section |
| 15% | Callout-attached | Steps with WARNING/CRITICAL callouts |
| 10% | Data entry | enter/type/input steps |

```
1. Navigate to Tools > Card Services
2. Select card type from dropdown
3. Enter member account number
4. Verify account info matches member ID
5. Have member enter PIN (privacy shield!)
6. Select Print Card, wait ~30 seconds
7. Activate card before handing to member
8. Obtain member signature on log
```

### Right Column

#### 3. WATCH OUT FOR (⚠)
**Source:** CRITICAL and WARNING callouts
**Format:** Icon + text list
**Max items:** 4

```
⛔ Never leave printer unattended during card creation
⚠️ Always activate cards - even when reprinting
⚠️ Verify BIN matches account type before proceeding
⚠️ Privacy shield required during PIN entry
```

#### 4. WHEN TO ESCALATE (→)
**Source:** Escalation triggers detected in procedure
**Format:** Condition → Action pairs
**Max items:** 3

```
• Error persists after retry → Contact IT Support
• Account shows restriction → Contact Supervisor
• Suspicious activity detected → Contact Compliance
```

#### 5. QUICK CONTACTS (☎)
**Source:** Contact information from procedure
**Format:** Label/value grid
**Max items:** 4

```
┌─────────────────┬─────────────────┐
│ IT Help Desk    │ ext. 4500       │
│ CardWizard      │ 1-800-237-3387  │
│ Supervisor      │ [Fill in]       │
│ Member Services │ 907-790-5050    │
└─────────────────┴─────────────────┘
```

---

## Content Extraction Algorithm

### Always Include (Priority 1)
These items are extracted first and always appear on the card:

1. **CRITICAL callouts** (max 3) → Watch Out For section
2. **WARNING callouts** (max 2) → Watch Out For section
3. **Prerequisites** (max 4) → Before You Start section
4. **Escalation contacts** (max 4) → Quick Contacts section

### Smart Extract (Priority 2)
After required content, remaining space filled by priority:

**Step Prioritization Formula:**
```
score = (decision_weight * 0.30) +
        (verification_weight * 0.25) +
        (anchor_weight * 0.20) +
        (callout_weight * 0.15) +
        (data_entry_weight * 0.10)
```

Steps sorted by score, top 8 selected.

### Formatting Rules
- **Max 25 words per step** - Longer steps condensed
- **Checkbox format** for prerequisites
- **Abbreviations applied** automatically (MSR, Acct #, CTR, SAR, etc.)
- **Sub-steps condensed** into main step where possible

---

## User Interaction Flow

### Standalone Invocation

```
═══════════════════════════════════════════════════════════════════════════
QUICK REFERENCE CARD GENERATOR
═══════════════════════════════════════════════════════════════════════════

I'll analyze your procedure and extract the most critical information for
a one-page quick reference card.

ANALYZING PROCEDURE
───────────────────────────────────────────────────────────────────────────

Source: Card_Issuance_Procedure_202512.docx
Steps found: 12
Sections: 4

EXTRACTION PREVIEW
───────────────────────────────────────────────────────────────────────────

✓ BEFORE YOU START (4 prerequisites)
  ☐ Verify member identity with two forms of ID
  ☐ Confirm account is active and in good standing
  ☐ Ensure card printer is online
  ☐ Log in to CardWizard Pro

✓ KEY STEPS (8 of 12 steps selected - prioritized by importance)
  1. Navigate to Tools > Card Services
  2. Select card type (Consumer Debit / Business Debit)
  3. Enter member account number
  4. Verify account info matches member ID
  5. Have member enter PIN on privacy-shielded pad
  6. Select Print Card, wait ~30 seconds
  7. Activate card in CardWizard before handing to member
  8. Hand card to member, obtain signature on log

✓ WATCH OUT FOR (3 critical items)
  ⛔ Never leave printer unattended during card creation
  ⚠️ Always activate cards - even when reprinting
  ⚠️ Verify BIN matches account type before proceeding

✓ WHEN TO ESCALATE (2 triggers)
  • Card jam persists → Contact Help Desk
  • Account shows restriction → Contact Supervisor

✓ QUICK CONTACTS (3 entries)
  • CardWizard Support: 1-800-237-3387
  • IT Help Desk: ext. 4500
  • Supervisor: [From department directory]

OPTIONS
───────────────────────────────────────────────────────────────────────────
→ Generate card with these selections
→ Add/remove items from any section
→ Change key steps (currently 8, max 8)
→ Preview in different format
→ Cancel

═══════════════════════════════════════════════════════════════════════════
```

### Customization Flow

```
User: "Remove step 3 and add a reminder about PIN privacy"

UPDATED PREVIEW
───────────────────────────────────────────────────────────────────────────

✓ KEY STEPS (7 of 12 steps selected)
  1. Navigate to Tools > Card Services
  2. Select card type (Consumer Debit / Business Debit)
  3. Verify account info matches member ID           [was step 4]
  4. Have member enter PIN on privacy-shielded pad   [was step 5]
  5. Select Print Card, wait ~30 seconds             [was step 6]
  6. Activate card before handing to member          [was step 7]
  7. Hand card to member, obtain signature           [was step 8]

✓ WATCH OUT FOR (4 critical items)
  ⛔ Never leave printer unattended during card creation
  ⚠️ Always activate cards - even when reprinting
  ⚠️ Verify BIN matches account type before proceeding
  ⚠️ Ensure privacy shield is in place during PIN entry    [ADDED]

→ Generate card with these selections
→ Continue editing
```

---

## Wizard Integration (Phase 5)

After the assessment generator offer, automatically offer quick card generation:

```
═══════════════════════════════════════════════════════════════════════════
QUICK REFERENCE CARD GENERATOR
═══════════════════════════════════════════════════════════════════════════

I can create a one-page quick reference card for frontline staff.

CARD PREVIEW
───────────────────────────────────────────────────────────────────────────
Content identified:
  • 4 prerequisites for "Before You Start"
  • 8 key steps condensed from 12 procedure steps
  • 3 critical/warning callouts for "Watch Out For"
  • 2 escalation triggers with contact info
  • 4 quick reference values

Format: Landscape 8.5x11, two-column, laminatable

OPTIONS
───────────────────────────────────────────────────────────────────────────
→ Generate quick reference card
→ Customize content selection
→ Skip card generation
═══════════════════════════════════════════════════════════════════════════
```

**After generation:**

```
═══════════════════════════════════════════════════════════════════════════
QUICK REFERENCE CARD GENERATED
═══════════════════════════════════════════════════════════════════════════

✓ Card created successfully

OUTPUT
───────────────────────────────────────────────────────────────────────────
Card_Issuance_QuickCard_202512.docx

RECOMMENDED USE
───────────────────────────────────────────────────────────────────────────
1. Print on cardstock (landscape orientation)
2. Laminate for durability
3. Post at workstation or keep in procedure binder
4. Update when procedure changes

NOTE: This quick reference supplements but does not replace the full
procedure. Staff should complete full training before using this card.
═══════════════════════════════════════════════════════════════════════════
```

---

## Edge Case Handling

### Short Procedure (< 5 steps)

```
═══════════════════════════════════════════════════════════════════════════
QUICK REFERENCE CARD - SHORT PROCEDURE NOTICE
═══════════════════════════════════════════════════════════════════════════

This procedure has only 4 steps.

RECOMMENDATION: For very short procedures, a quick reference card may not
add significant value. The full procedure is already brief enough to serve
as a desk reference.

OPTIONS
───────────────────────────────────────────────────────────────────────────
→ Generate card anyway (all 4 steps will be included)
→ Skip card generation
═══════════════════════════════════════════════════════════════════════════
```

### No Callouts Present

```
═══════════════════════════════════════════════════════════════════════════
WATCH OUT FOR SECTION - NO CALLOUTS DETECTED
═══════════════════════════════════════════════════════════════════════════

Your procedure has no CRITICAL or WARNING callouts.

OPTIONS
───────────────────────────────────────────────────────────────────────────
→ Auto-generate warnings from common patterns
→ Add warnings manually
→ Skip "Watch Out For" section (not recommended)
═══════════════════════════════════════════════════════════════════════════
```

**Auto-generated suggestions (if selected):**

```
SUGGESTED WARNINGS (based on procedure content)
───────────────────────────────────────────────────────────────────────────

Based on the procedure content, I suggest these warnings:

☐ ⚠️ "Always verify account number before proceeding"
      (Source: data entry step detected)

☐ ⚠️ "Confirm member identity before revealing account details"
      (Source: member-facing procedure type)

☐ ⚠️ "Complete all steps before closing the transaction"
      (Source: multi-step workflow detected)

→ Accept all suggestions
→ Select individual suggestions
→ Add custom warnings instead
```

### No Escalation Contacts

```
═══════════════════════════════════════════════════════════════════════════
QUICK CONTACTS SECTION - NO CONTACTS DETECTED
═══════════════════════════════════════════════════════════════════════════

No escalation contacts were found in the procedure.

I can add standard TFCU contacts. Which apply to this procedure?

☐ IT Help Desk (ext. 4500)
☐ Supervisor (leave blank for user to fill in)
☐ Compliance Officer (for regulatory procedures)
☐ Member Services (907-790-5050)

→ Add selected contacts
→ Enter custom contacts
→ Skip contacts section
═══════════════════════════════════════════════════════════════════════════
```

### Long Procedure (> 25 steps)

```
═══════════════════════════════════════════════════════════════════════════
KEY STEPS SELECTION - LARGE PROCEDURE
═══════════════════════════════════════════════════════════════════════════

This procedure has 32 steps. A quick card can include a maximum of 8.

I've prioritized these 8 steps based on:
• Decision points (if/when logic)
• Verification requirements
• Steps with critical callouts
• First/last steps in each section

SELECTED STEPS (8 of 32)
───────────────────────────────────────────────────────────────────────────
  1. Log in to system using employee credentials (first step)
  2. Select transaction type from dropdown (decision point)
  3. Verify member identity (has WARNING callout)
  4. Enter transaction amount (data entry)
  5. Confirm details before submitting (verification)
  6. Wait for confirmation screen (critical step)
  7. Print receipt for member (verification)
  8. Log out when complete (last step)

OPTIONS
───────────────────────────────────────────────────────────────────────────
→ Accept these selections
→ Review and modify step selection
═══════════════════════════════════════════════════════════════════════════
```

### No Prerequisites Section

```
═══════════════════════════════════════════════════════════════════════════
BEFORE YOU START - NO PREREQUISITES DETECTED
═══════════════════════════════════════════════════════════════════════════

Your procedure has no PREREQUISITES section.

I can suggest common prerequisites based on procedure type (system):

☐ System access granted (login credentials active)
☐ Required training completed
☐ Appropriate permissions assigned

→ Add suggested prerequisites
→ Enter custom prerequisites
→ Skip "Before You Start" section
═══════════════════════════════════════════════════════════════════════════
```

---

## Visual Layout Reference

```
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  ████████████████████████████████████████████████████████████████████████████████ |
|  █                                                                              █ |
|  █   CARD ISSUANCE PROCEDURE - QUICK REFERENCE                                  █ |
|  █                                                                              █ |
|  ████████████████████████████████████████████████████████████████████████████████ |
|                                                                                   |
|  ┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐ |
|  │                                     │  │                                     │ |
|  │  ☐ BEFORE YOU START                 │  │  ⚠ WATCH OUT FOR                    │ |
|  │  ─────────────────────              │  │  ─────────────────────              │ |
|  │  ☐ Verify member identity           │  │  ⛔ Never leave printer unattended   │ |
|  │  ☐ Confirm account in good standing │  │  ⚠️ Always activate cards            │ |
|  │  ☐ Ensure printer is online         │  │  ⚠️ Verify BIN matches account type  │ |
|  │  ☐ Log in to CardWizard Pro         │  │                                     │ |
|  │                                     │  ├─────────────────────────────────────┤ |
|  │                                     │  │                                     │ |
|  │  # KEY STEPS                        │  │  → WHEN TO ESCALATE                 │ |
|  │  ─────────────────────              │  │  ─────────────────────              │ |
|  │  1. Navigate to Tools > Card Svcs   │  │  • Card jam → Help Desk             │ |
|  │  2. Select card type from dropdown  │  │  • Acct restricted → Supervisor     │ |
|  │  3. Enter member account number     │  │  • Suspicious → Compliance          │ |
|  │  4. Verify acct info matches ID     │  │                                     │ |
|  │  5. Member enters PIN (privacy!)    │  ├─────────────────────────────────────┤ |
|  │  6. Select Print Card, wait 30 sec  │  │                                     │ |
|  │  7. Activate card before handoff    │  │  ☎ QUICK CONTACTS                   │ |
|  │  8. Get member signature on log     │  │  ─────────────────────              │ |
|  │                                     │  │  IT Help Desk    │ ext. 4500        │ |
|  │                                     │  │  CardWizard      │ 1-800-237-3387   │ |
|  │                                     │  │  Supervisor      │ [Fill in]        │ |
|  │                                     │  │                                     │ |
|  └─────────────────────────────────────┘  └─────────────────────────────────────┘ |
|                                                                                   |
|  ─────────────────────────────────────────────────────────────────────────────── |
|  Operations | Card Issuance | December 2025 | v4.9          For training use only |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## Integration with Other Features

### Assessment Generator Connection
When both assessment and quick card are generated from the same procedure:
- Quick card serves as study aid for assessment
- Assessment validates knowledge from quick card content
- Recommended workflow: Train with procedure → Use quick card → Take assessment

### Terminology Validator
Quick card content passes through terminology validation:
- Abbreviations use approved terms from glossary
- Consistent verb usage maintained (select, not click)
- Member terminology enforced (member, not customer)

### Screenshot Annotations
Quick cards are text-only by design (for printing/laminating). If visual reference is needed:
- Full procedure with screenshots remains the training document
- Quick card references step numbers that map to full procedure figures

---

## Configuration Reference

All extraction rules and layout settings are defined in `quick_card_prompts.json`:
- `activation_triggers` - Words that invoke the feature
- `extraction_rules` - Priority and weight settings
- `card_sections` - Section configuration and ordering
- `layout` - Page dimensions and typography
- `edge_case_handling` - Thresholds and messages

See `quick_card_prompts.json` for complete configuration.
