# TFCU Procedure Formatter Skill: Development Specification

## Purpose

This skill transforms legacy TFCU policies and procedures into standardized, professional Word documents. The output must be immediately usable by frontline credit union staff—scannable under pressure, printable without formatting issues, and visually consistent across all generated procedures.

---

## Brand Identity

| Element | Value |
|---------|-------|
| Primary accent color | #154747 (dark teal) |
| Light accent (backgrounds) | #E8F4F4 |
| Organization | Tongass Federal Credit Union |
| Document type | Operational procedures for frontline staff |

---

## Typography Requirements

### Font Stack

Use **Calibri** as the primary typeface for all body content. Reserve **Consolas** exclusively for literal values that benefit from monospace rendering: BINs, account numbers, phone numbers, system paths, URLs, and code snippets.

### Type Scale

| Element | Font | Size (pt) | Size (half-points) | Weight | Color/Style |
|---------|------|-----------|-------------------|--------|-------------|
| Document title | Calibri | 16 | 32 | Bold | White on #154747 |
| Section headers | Calibri | 14 | 28 | Bold | #154747, 1.5pt bottom border |
| Body text | Calibri | 11 | 22 | Regular | Black |
| Step text | Calibri | 11 | 22 | Regular | Black |
| Table body | Calibri | 10 | 20 | Regular | Black |
| Table headers | Calibri | 10 | 20 | Bold | White on #154747 |
| Quick Reference labels | Calibri | 10 | 20 | Bold | Black |
| Quick Reference values | Consolas | 10 | 20 | Regular | Black |
| Callout text | Calibri | 10 | 20 | Regular | Black (emoji prefix provides emphasis) |
| Inline TOC | Calibri | 10 | 20 | Regular | #154747, no underline |
| Footer | Calibri | 9 | 18 | Regular | #666666 |

### Header Styling

Section headers use sentence case (not ALL CAPS). Apply bold weight and #154747 text color. Add a bottom border at 1.5pt weight in #154747. This combination (bold + color + border) replaces the previous triple-emphasis pattern (bold + caps + underline) which created visual monotony.

---

## Page Layout

### Margins

| Edge | Measurement | DXA Value |
|------|-------------|-----------|
| Top | 0.5" | 720 |
| Bottom | 0.5" | 720 |
| Left | 0.75" | 1080 |
| Right | 0.75" | 1080 |

The wider horizontal margins improve print robustness (hole punches, misaligned printers) and reduce visual crowding in dense procedures.

### Page Size

Default to US Letter (8.5" × 11"). Accept A4 as alternate specification.

---

## Document Structure

Every generated procedure follows this sequence:

1. **Header table** — Title, department, effective date
2. **Quick Reference box** — Critical numbers, contacts, BINs (when applicable)
3. **Inline Table of Contents** — Hyperlinked to section bookmarks
4. **Prerequisites section** — What staff need before starting
5. **Procedure sections** — Numbered steps with screenshots where applicable
6. **Troubleshooting table** — Issue / Cause / Resolution format
7. **Reports section** — Related reports or documentation (when applicable)
8. **Revision History table** — At document end, not on separate page

---

## Header Table

Two-row structure with visual differentiation between rows.

### Row 1: Document Title
| Property | Value |
|----------|-------|
| Background | #154747 |
| Text color | White |
| Font | Calibri 16pt Bold |
| Alignment | Center |
| Row height | 0.5" (720 DXA) |

### Row 2: Metadata
| Property | Value |
|----------|-------|
| Background | #E8F4F4 (light teal) |
| Text color | #154747 |
| Font | Calibri 10pt Regular |
| Content | Department (left cell) / Effective Date (right cell) |
| Row height | 0.3" (432 DXA) |

The light teal second row creates visual separation from the dark title row while maintaining brand consistency.

---

## Inline Table of Contents

Single paragraph with hyperlinks to bookmarked sections. Separate section names with bullet characters (•) and spaces.

### Hyperlink Styling
| Property | Value |
|----------|-------|
| Color | #154747 |
| Underline | None |
| Font | Calibri 10pt |

Do not use default blue underlined hyperlinks—they clash with the teal brand palette.

---

## Footer

| Element | Position | Content |
|---------|----------|---------|
| Left | Tab stop 0" | Department name |
| Center | Tab stop 3.5" | Document title |
| Right | Tab stop 7" | "Page X" |

All footer text: Calibri 9pt, #666666 (gray).

---

## Step/Screenshot Layout

Procedures pair numbered steps with adjacent screenshots using a two-column borderless table.

### Table Properties

| Property | Value | DXA/Notes |
|----------|-------|-----------|
| Column 1 width | 55% | Step text |
| Column 2 width | 45% | Screenshot |
| Borders | None | All sides, internal |
| Vertical alignment | Center | Both columns |
| Horizontal cell padding | 0.1" | 144 DXA |
| Vertical cell padding | 0.05" | 72 DXA |

The borderless design differentiates layout tables from data tables. Center vertical alignment prevents screenshots from "floating" while text clusters at cell tops.

### Implementation Notes

When creating table cells in docx-js:

```javascript
new TableCell({
  verticalAlign: VerticalAlign.CENTER,
  margins: {
    top: 72,
    bottom: 72,
    left: 144,
    right: 144
  },
  borders: {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE }
  },
  children: [...]
})
```

---

## Callout Boxes

Four severity levels, each with distinct visual treatment. Implement as paragraphs with background shading and left border accent.

| Type | Icon | Background Fill | Left Border Color | Left Border Width |
|------|------|-----------------|-------------------|-------------------|
| Critical | ⛔ | #F8D7DA | #C00000 | 4pt (32 eighths) |
| Warning | ⚠️ | #FFF2CC | #FFC000 | 4pt (32 eighths) |
| Info | ℹ️ | #D1ECF1 | #2E74B5 | 4pt (32 eighths) |
| Tip | ✅ | #E2F0D9 | #548235 | 4pt (32 eighths) |

### Callout Paragraph Properties

| Property | Value | DXA/Notes |
|----------|-------|-----------|
| Left indent | 0.15" | 216 DXA |
| Right indent | 0.15" | 216 DXA |
| Space before | 6pt | 120 twips |
| Space after | 6pt | 120 twips |
| Left border | 4pt solid | Color per severity |
| Background shading | Per severity | Fill color |

The left border ensures callouts remain distinguishable in black-and-white printing. The emoji prefixes provide instant visual categorization without requiring bold text.

### Implementation Notes

```javascript
new Paragraph({
  indent: {
    left: 216,
    right: 216
  },
  spacing: {
    before: 120,
    after: 120
  },
  border: {
    left: {
      style: BorderStyle.SINGLE,
      size: 32, // 4pt = 32 eighths of a point
      color: "C00000" // Critical example
    }
  },
  shading: {
    fill: "F8D7DA" // Critical example
  },
  children: [
    new TextRun({
      text: "⛔ ",
      font: "Calibri",
      size: 20
    }),
    new TextRun({
      text: "Card MUST be built in GOLD before printing.",
      font: "Calibri",
      size: 20
    })
  ]
})
```

---

## Data Tables

### Quick Reference Table

Placed immediately after the header table, before the TOC. Contains at-a-glance critical information.

#### Structure

| Row | Content |
|-----|---------|
| Header row | "QUICK REFERENCE" spanning all columns, #154747 background, white bold text |
| Data rows | Label/value pairs, alternating or grouped logically |

#### Column Layout (4-column variant)

| Column | Width | Content Type |
|--------|-------|--------------|
| 1 | 25% | Label (Calibri Bold) |
| 2 | 25% | Value (Consolas) |
| 3 | 25% | Label (Calibri Bold) |
| 4 | 25% | Value (Consolas) |

#### Cell Properties

| Property | Value |
|----------|-------|
| Row height | Minimum 0.35" (504 DXA) |
| Vertical alignment | Center |
| Horizontal padding | 0.08" (115 DXA) |
| Data row background | White (#FFFFFF) |
| Border | 0.5pt #CCCCCC (subtle grid) |

### Troubleshooting Table

Three columns with unequal widths to accommodate typical content lengths.

| Column | Width | Header Text |
|--------|-------|-------------|
| Issue | 25% | "Issue" |
| Cause | 30% | "Cause" |
| Resolution | 45% | "Resolution" |

Header row: #154747 background, white bold Calibri 10pt.
Body rows: White background, Calibri 10pt regular.
Borders: 0.5pt #CCCCCC throughout.

### Revision History Table

Place at document end, following the final content section. Never place on a separate page.

| Column | Width | Header Text |
|--------|-------|-------------|
| Date Updated | 25% | "Date Updated" |
| Reviewed By | 25% | "Reviewed By" |
| Changes Made | 50% | "Changes Made" |

#### Row Generation Rules

- Generate only populated rows from input data
- If no revision history exists, include single row: current date / author name / "Initial version"
- Never generate empty placeholder rows

---

## Visual Elements to Preserve

These design decisions work well and must remain in the implementation:

- Quick Reference placement at document top
- Inline TOC with bookmark hyperlinks for digital navigation
- Teal accent color (#154747) as consistent brand element
- Troubleshooting table structure (Issue/Cause/Resolution)
- Footer with document title and page numbers
- Numbered steps with sub-steps (a, b, c)
- Emoji severity prefixes in callouts
- Screenshots embedded adjacent to relevant steps (not in appendix)
- Borderless step/screenshot layout tables

---

## Common Problems to Avoid

### Typography Failures
- Using monospace fonts (Consolas) for body text
- Section headers barely larger than body text
- Inconsistent font sizes across similar elements
- ALL CAPS headers creating visual monotony

### Layout Failures
- Equal-width columns in step/screenshot tables
- Visible borders on layout tables (makes them look like data)
- Top vertical alignment causing content to cluster at cell tops
- Tight margins causing print cutoff

### Visual Failures
- Callouts rendered as bold paragraphs without box treatment
- Blue underlined hyperlinks clashing with teal brand
- Empty placeholder rows in Revision History
- Near-empty final pages (consolidate content)
- Header table rows using identical styling (no differentiation)

---

## Validation Criteria

A correctly generated procedure must pass these checks:

| Check | Expected Result |
|-------|-----------------|
| Body text font | Calibri 11pt |
| Section header styling | Calibri 14pt Bold, #154747, 1.5pt bottom border |
| Step/screenshot table borders | None visible |
| Screenshot vertical alignment | Center (not top) |
| Callout Critical box | #F8D7DA fill, #C00000 4pt left border |
| Callout Warning box | #FFF2CC fill, #FFC000 4pt left border |
| Callout Info box | #D1ECF1 fill, #2E74B5 4pt left border |
| Callout Tip box | #E2F0D9 fill, #548235 4pt left border |
| TOC hyperlinks | #154747, no underline |
| Revision History | No empty rows |
| Header table row 2 | #E8F4F4 background (not #154747) |
| Quick Reference values | Consolas font |
| Print test | No margin crowding on Letter paper |

---

## Input Expectations

The skill accepts:

| Input | Required | Notes |
|-------|----------|-------|
| Procedure text | Yes | Legacy format, may lack structure |
| Document title | Yes | Used in header and footer |
| Department | Yes | Used in header and footer |
| Effective date | No | Defaults to current date |
| Screenshots | No | Base64 or file path references |
| Revision history | No | Array of {date, reviewer, changes} |
| Related links | No | Policies, procedures, forms |

The skill infers reasonable defaults when metadata is missing and structures content logically even when input lacks explicit section markers.

---

## Output

Generate a .docx file using docx-js. The output must open correctly in:
- Microsoft Word (2016+)
- Google Docs
- LibreOffice Writer

No formatting degradation should occur across these platforms.

---

## Appendix: DXA Reference

docx-js uses DXA (twentieths of a point) for most measurements. Common conversions:

| Measurement | DXA Value |
|-------------|-----------|
| 1 inch | 1440 |
| 0.75 inch | 1080 |
| 0.5 inch | 720 |
| 0.25 inch | 360 |
| 0.15 inch | 216 |
| 0.1 inch | 144 |
| 0.08 inch | 115 |
| 0.05 inch | 72 |
| 1 point | 20 |
| 12 points | 240 |

Border sizes use eighths of a point:
| Points | Eighths Value |
|--------|---------------|
| 0.5pt | 4 |
| 1pt | 8 |
| 1.5pt | 12 |
| 2pt | 16 |
| 4pt | 32 |
