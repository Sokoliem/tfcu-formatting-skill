# Writing Standards for TFCU Procedures

Concise guidelines for plain language and adult learning best practices.

---

## Quick Reference Card

### The 5 Rules

1. **Start with action verbs**: Select, Enter, Verify, Click, Navigate
2. **Keep sentences under 25 words** (absolute max: 35)
3. **One instruction per sentence**
4. **Warnings before steps** (not after)
5. **Examples for data entry**

### Consistent Terminology

| Always Use | Never Use |
|------------|-----------|
| select | click, choose, pick, press |
| member | customer, client, user |
| enter | type, key in, input |
| verify | check, confirm, ensure, validate |
| screen | page (unless print), window (unless popup) |

---

## Plain Language Principles

### Active Voice

| ❌ Passive | ✅ Active |
|-----------|----------|
| The card type should be selected | Select the card type |
| Verification must be performed | Verify the information |
| The account number needs to be entered | Enter the account number |
| The print button is to be clicked | Click Print |

### Action Verb Starters

**Navigation**: Select, Click, Open, Go to, Navigate, Access
**Data Entry**: Enter, Type, Input
**Verification**: Verify, Check, Confirm, Review
**Completion**: Submit, Save, Print, Complete, Finish
**Decision**: Determine, Choose, Identify

### Sentence Length

**Before (42 words):**
> When you are ready to print the card, you should first make sure that you have verified all of the information on the preview screen including the card holder name, the expiration date, and the card number before clicking the print button.

**After (split into steps):**
1. Review the preview screen
2. Verify the cardholder name
3. Confirm the expiration date matches GOLD
4. Check the card number
5. Click Print

---

## Adult Learning Principles

### Chunking

Group related steps under clear headers. Never present a wall of text.

**Before:**
> First you need to log in then select print a card then choose the card type which will be business debit if it's a business account or consumer debit if it's a personal account then enter the card information...

**After:**

**SYSTEM ACCESS**
1. Navigate to Card@Once website
2. Enter username and password
3. Click Login

**CARD SELECTION**
1. Select "Print a Card"
2. Choose the appropriate card type

### Front-Loading Critical Information

Put the most important information first:
- Warnings before the step
- Requirements before procedures
- Exceptions before standard process

**Before:**
> Enter the account number using the member's GOLD account number with leading zeros to make 10 digits total. Do not use the MICR number as this will cause activation errors.

**After:**
> ⚠️ **WARNING:** Do not use the MICR account number.
>
> Enter the GOLD account number with leading zeros (10 digits total).
> Example: Account 206411 becomes 0000206411

### Provide Context (The "Why")

When understanding "why" helps prevent errors:

**Without context:**
> Always select 'Activate Card' even when reprinting.

**With context:**
> Select 'Activate Card' even when reprinting. Each print job requires activation—skipping this step results in a non-functional card.

---

## Formatting for Scannability

### Visual Hierarchy

```
SECTION HEADER (All caps, bold)

Context paragraph if needed.

1. Major Step (Level 1)
   
   Supporting explanation.
   
   a. Sub-step (Level 2)
      
      Additional detail.
      
      1) Specific action (Level 3)
```

### When to Use Lists

| Use Numbered Lists | Use Bullet Points |
|-------------------|-------------------|
| Sequential steps | Items with no order |
| Multi-step processes | Feature lists |
| Procedures with checkpoints | Reference information |
| Instructions that must be followed in order | Options (any can be chosen) |

### Text Formatting

| Element | Format | Example |
|---------|--------|---------|
| System names | **Bold** | **Card@Once**, **GOLD** |
| Button/link text | "Quotes" | Click "Print" |
| Field names | *Italics* | Enter the *Account Number* |
| Codes/values | `Monospace` | BIN: `41139300` |
| Phone numbers | Plain | 1-800-290-7893 |
| URLs | Hyperlink | https://cardatonce.eftsource.com |

---

## Error Prevention

### Anticipate Mistakes

Include explicit "do not" instructions for common errors:

- ⛔ Do NOT enter the MICR account number
- ⛔ Do NOT skip activation even for reprints
- ⛔ Do NOT reuse passwords when resetting

### Provide Examples

For complex data entry, always show examples:

**Funding/Account Number Format:**
| GOLD Account | Required Format |
|--------------|-----------------|
| 206411 | 0000206411 |
| 12345 | 0000012345 |
| 1234567 | 0001234567 |

### Include Verification Steps

After critical actions:

1. Enter the account number
2. **Verify** the account number displays correctly
3. Click Next Step

---

## Acronym Handling

### First Use

Spell out completely, then use acronym:

- Card@Once (instant issue card printing system)
- GOLD (core banking system)
- BIN (Bank Identification Number)
- PIN (Personal Identification Number)
- MICR (Magnetic Ink Character Recognition)

### Glossary Entry Format

| Term | Definition |
|------|------------|
| BIN | Bank Identification Number; the first 6-8 digits identifying card issuer |
| GOLD | Core banking system used by TFCU |
| MICR | Magnetic Ink Character Recognition; the account number on checks (do NOT use for card activation) |

---

## Document Structure Template

```
HEADER TABLE
[Procedure Name | Department | Date]

OVERVIEW
[2-4 sentences describing procedure purpose]

QUICK REFERENCE (optional)
[Key values, phone numbers, BINs]

RELATED - links
[Policies] [Procedures] [Forms]

PREREQUISITES (if needed)
[What must be true before starting]

SECTION 1 HEADER
[Context paragraph if needed]

1. First step
   a. Sub-step if needed
2. Second step

⚠️ WARNING: [If applicable]

SECTION 2 HEADER
[Continue pattern]

TROUBLESHOOTING
[Error | Cause | Resolution table]

GLOSSARY
[Term | Definition table]

REVISION HISTORY
[Date | Reviewer | Changes table]
```

---

## Quality Checklist

Before finalizing any procedure:

### Content
- [ ] Every step starts with an action verb
- [ ] No sentence exceeds 35 words
- [ ] Acronyms defined on first use
- [ ] Consistent terminology throughout
- [ ] Examples provided for data entry

### Structure
- [ ] Critical warnings precede related steps
- [ ] Verification steps after critical actions
- [ ] Logical section groupings
- [ ] Clear visual hierarchy

### Completeness
- [ ] Contact information for support
- [ ] Troubleshooting section (if technical)
- [ ] Glossary (if acronyms used)
- [ ] Related policies/procedures listed

---

## Common Rewrites

| Original | Improved |
|----------|----------|
| "The account number needs to be entered" | "Enter the account number" |
| "You will want to check the expiration date" | "Verify the expiration date" |
| "Make sure the printer is the correct one" | "Confirm the correct printer is selected" |
| "It'll ask the member on the PIN PAD to enter 4-digit #" | "The PIN pad prompts the member to enter a 4-digit PIN" |
| "If you see any eorror select Previous Step" | "If you notice any errors, click Previous Step to correct them" |
| "REMINDER: Business Debit Card & Credit Cards-Business Name **must reflect (same name)** what is says in GOLD" | "The business name must exactly match the name in GOLD" |

---

## Automated Terminology Validation

Use the terminology validator to check documents for compliance with these standards:

```bash
# Validate a single document
python scripts/terminology_validator.py --input procedure.docx

# Validate with detailed JSON output
python scripts/terminology_validator.py --input procedure.md --format json

# Batch validate all procedures in a directory
python scripts/terminology_validator.py --input ./procedures/ --batch

# Set custom pass threshold (default: 70%)
python scripts/terminology_validator.py --input doc.docx --threshold 85
```

### Validation Checks

| Check | Description |
|-------|-------------|
| **Terminology** | Flags prohibited terms and suggests preferred alternatives |
| **Passive Voice** | Identifies passive constructions that should be active |
| **Sentence Length** | Warns when sentences exceed 25 words (error at 35+) |
| **Acronyms** | Flags undefined acronyms that need first-use definitions |

### Compliance Scores

| Score | Status | Action |
|-------|--------|--------|
| 90%+ | PASS | Document meets standards |
| 70-89% | REVIEW | Minor corrections needed |
| <70% | FAIL | Significant revision required |

### Configuration

Rules are defined in `resources/terminology_rules.json` and can be customized for specific needs.
