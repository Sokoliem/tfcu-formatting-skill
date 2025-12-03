# Training Assessment Generator (MANDATORY)

Transform completed procedures into competency assessments with questions, answer keys, and scoring guidance.

**Status:** Assessment generation is **MANDATORY** - always generated as part of the output bundle. No prompting required.

---

## Activation

Assessments are generated automatically for every procedure. For standalone generation:

**Trigger words:** `generate assessment`, `create quiz`, `training questions`, `competency check`

**Mandatory output:** Always generated as part of the 4-file output bundle (procedure, assessment, quick card, validation report).

---

## Question Generation Rules

### Question Type Selection

| Procedure Element | Question Type | Example |
|-------------------|---------------|---------|
| Sequential steps (1-2-3) | Ordering MC | "What is the FIRST step after logging in?" |
| Data entry fields | Fill-in-blank or MC | "What information is required in the Account Number field?" |
| CRITICAL/WARNING callouts | True/False | "Transactions over $10,000 require CTR filing. T/F" |
| Decision points (if/then) | Scenario | "A member requests a wire transfer for $15,000. What documentation is required?" |
| Quick Reference values | Direct recall MC | "What is the Consumer Debit BIN number?" |
| Navigation paths | Sequence MC | "To access Card Services, navigate to: A) Tools > Card Services B) Member > Cards..." |
| Verification steps | Application | "Why must you verify the account number before proceeding?" |

### Question Difficulty Distribution

| Difficulty | Weight | Description |
|------------|--------|-------------|
| Recall | 60% | Can be answered directly from procedure text |
| Application | 30% | Requires understanding the "why" behind steps |
| Scenario | 10% | Requires judgment within procedure guidance |

### Question Count Guidelines

| Procedure Length | Question Count |
|------------------|----------------|
| Short (< 5 steps) | 3-5 questions |
| Medium (5-15 steps) | 6-8 questions |
| Long (> 15 steps) | 9-12 questions |

---

## Output Formats

### Option 1: Appended Section

Assessment added to end of procedure document with page break:
- Assessment questions (1-2 pages)
- Answer key on separate page (supervisor use)

### Option 2: Standalone Document

Separate file with naming convention:
```
{Procedure_Name}_Assessment_{YYYYMM}.docx
Example: Card_Issuance_Assessment_202512.docx
```

---

## Assessment Structure

```
═══════════════════════════════════════════════════════════════════════════
PROCEDURE COMPETENCY ASSESSMENT
═══════════════════════════════════════════════════════════════════════════

Instructions: Complete this assessment after reviewing the procedure.
A score of 80% or higher demonstrates proficiency.

SECTION 1: PROCEDURE KNOWLEDGE
───────────────────────────────────────────────────────────────────────────

1. What is the FIRST step in the [procedure name] process?
   a) [Option A]
   b) [Option B]
   c) [Option C]
   d) [Option D]

2. [True/False] [Statement from CRITICAL/WARNING callout]

3. When entering [field], what should you verify before proceeding?
   _______________________________________________

SECTION 2: SCENARIO APPLICATIONS
───────────────────────────────────────────────────────────────────────────

8. A member [scenario description]. According to the procedure,
   what should you do?

   a) [Option A]
   b) [Option B]
   c) [Option C]
   d) [Option D]

═══════════════════════════════════════════════════════════════════════════
[PAGE BREAK]
═══════════════════════════════════════════════════════════════════════════

ANSWER KEY - SUPERVISOR USE ONLY
───────────────────────────────────────────────────────────────────────────

1. D - [Explanation referencing procedure step]
2. True/False - [Explanation referencing callout]
3. [Expected answer with source reference]
...

SCORING
───────────────────────────────────────────────────────────────────────────
Score: ___/[total] correct = ___%
Pass threshold: 80% ([minimum]/[total] or higher)

Recommended actions for scores below 80%:
• Review procedure with supervisor
• Shadow experienced staff member
• Retake assessment after additional training
```

---

## Edge Cases

### Short Procedures (< 5 steps)
- Generate reduced assessment (3-5 questions)
- Add note: "This procedure is brief. Hands-on verification with a supervisor is recommended to confirm proficiency."

### Screenshot-Heavy Procedures
- Add disclaimer: "This assessment covers procedural knowledge. Visual recognition of screens should be verified through hands-on practice."

### Compliance Procedures
- Add disclaimer: "Passing this assessment demonstrates procedural knowledge but does not constitute compliance certification. Formal training programs may have additional requirements."

### No Decision Points
- Skip scenario questions
- Increase recall/application questions proportionally

### Sensitive Content
- Sanitize any specific member data examples from questions
- Use generic placeholders: "Account #XXXXXX", "Member Jane Doe"

---

## Integration with Wizard

### Phase 5 Extension Flow

```
GENERATING OUTPUT
═══════════════════════════════════════════════════════════════════════════

Creating your procedure package:

1. 📄 PROCEDURE DOCUMENT
   [Procedure Title].docx ✓ Generated

───────────────────────────────────────────────────────────────────────────

TRAINING ASSESSMENT GENERATOR
═══════════════════════════════════════════════════════════════════════════

I've analyzed your procedure and can generate a training assessment.

ASSESSMENT PREVIEW
───────────────────────────────────────────────────────────────────────────
Questions identified:
  • 6 recall questions (step sequence, data fields, values)
  • 2 application questions (why certain steps matter)
  • 1 scenario question (decision point in step 4)

Estimated completion time: 8-10 minutes

OPTIONS
───────────────────────────────────────────────────────────────────────────
→ Generate assessment (append to procedure)
→ Generate assessment (separate document)
→ Customize question count
→ Skip assessment generation
═══════════════════════════════════════════════════════════════════════════
```

---

## Distractor Generation

For multiple choice questions, generate plausible distractors:

1. **Step-based questions**: Use other steps from the same procedure
2. **Value-based questions**: Use similar values from other TFCU procedures
3. **Policy questions**: Use common misconceptions or similar-sounding policies
4. **Scenario questions**: Use reasonable but incorrect approaches

**Avoid:**
- Obviously wrong answers
- Trick questions
- Answers that could be argued as partially correct
- Negative phrasing ("Which is NOT...")
