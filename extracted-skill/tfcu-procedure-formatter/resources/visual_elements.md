# Visual Elements Guide

Implementation patterns for flowcharts, callout boxes, tables, and color-coding in TFCU procedures.

## Table of Contents (Clickable)

> **CRITICAL FORMAT RULE**: TOC must be a SINGLE INLINE PARAGRAPH - NEVER a table or vertical list.

For longer procedures, create a clickable TOC that links to section bookmarks.

**Correct format:** `Contents: Overview • Prerequisites • Main Steps • Troubleshooting`

**FORBIDDEN formats:**
- ❌ Table with "CONTENTS" header row
- ❌ Vertical bullet list
- ❌ Any bordered/shaded container

### Implementation

```javascript
const { Paragraph, TextRun, InternalHyperlink, Bookmark, BorderStyle } = require('docx');

// Spec: TOC links use teal (#154747) without underline
function createTableOfContents(sections) {
  // sections = [{ title: "System Access", anchor: "system-access" }, ...]
  const tocLinks = sections.map((s, i) => [
    new InternalHyperlink({
      anchor: s.anchor,
      children: [new TextRun({ text: s.title, color: "154747", font: "Calibri", size: 20 })]
    }),
    ...(i < sections.length - 1 ? [new TextRun({ text: "  •  ", size: 20, color: "999999", font: "Calibri" })] : [])
  ]).flat();

  return new Paragraph({
    spacing: { before: 80, after: 100 },
    children: [new TextRun({ text: "Contents: ", bold: true, size: 20, font: "Calibri" }), ...tocLinks]
  });
}

// Section headers: sentence case, 14pt bold, teal color, 1.5pt bottom border
// IMPORTANT: Do NOT use bookmark property on Paragraph - it doesn't work!
function createSectionHeader(text, bookmarkId, pageBreakBefore = false) {
  const children = bookmarkId
    ? [new Bookmark({ id: bookmarkId, children: [new TextRun({ text: text, bold: true, size: 28, font: "Calibri", color: "154747" })] })]
    : [new TextRun({ text: text, bold: true, size: 28, font: "Calibri", color: "154747" })];

  return new Paragraph({
    pageBreakBefore,
    spacing: { before: 180, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "154747" } },  // 1.5pt
    children
  });
}
```

### Usage

```javascript
// In document children array:
children: [
  // ... header, overview ...
  
  ...createTableOfContents([
    { title: "System Access", anchor: "system-access" },
    { title: "Card Selection", anchor: "card-selection" },
    { title: "Troubleshooting", anchor: "troubleshooting" }
  ]),
  
  // ... other content ...
  
  createSectionHeader("SYSTEM ACCESS", "system-access"),
  // ... section content ...
  
  createSectionHeader("CARD SELECTION", "card-selection"),
  // ... section content ...
]
```

### When to Include TOC

| Include TOC | Skip TOC |
|-------------|----------|
| 5+ major sections | 1-3 sections |
| Document > 3 pages | Document ≤ 2 pages |
| Training reference material | Quick reference cards |
| Complex multi-step procedures | Simple linear workflows |

---

## TFCU Brand Colors

> **Note**: These values mirror `validator/spec-config.js`. Update spec-config.js first, then sync here.

```javascript
const TFCU_COLORS = {
  // Primary branding
  PRIMARY_TEAL: "154747",     // Header backgrounds, section borders, TOC links
  LIGHT_TEAL: "E8F4F4",       // Header table row 2 background
  OVERVIEW_TEAL: "0F4761",    // Overview heading text

  // Neutrals
  WHITE: "FFFFFF",            // Text on teal, default background
  LIGHT_GRAY: "F2F2F2",       // Alternating table rows
  BLACK: "000000",            // Body text, borders
  GRAY_TEXT: "666666",        // Footer text

  // Callout boxes (spec-compliant v2.2)
  WARNING_BG: "FFF2CC",       WARNING_BORDER: "FFC000",   // Gold
  NOTE_BG: "D1ECF1",          NOTE_BORDER: "2E74B5",      // Blue
  CRITICAL_BG: "F8D7DA",      CRITICAL_BORDER: "C00000",  // Red
  TIP_BG: "E2F0D9",           TIP_BORDER: "548235",       // Green

  // Flowchart-specific
  ERROR_NODE: "DC3545",       // Red for error states
  SUCCESS_NODE: "28A745"      // Green for success states
};
```

---

## Callout Boxes

### Types and Usage

| Type | Icon | Background | Border | Use When |
|------|------|------------|--------|----------|
| WARNING | ⚠️ | #FFF2CC | #FFC000 | Action could cause errors or data issues |
| NOTE | ℹ️ | #D1ECF1 | #2E74B5 | Helpful context, tips, additional info |
| CRITICAL | ⛔ | #F8D7DA | #C00000 | Compliance requirement, security, must-do |
| TIP | ✅ | #E2F0D9 | #548235 | Best practice, efficiency suggestion |

### docx-js Implementation

```javascript
const { Paragraph, TextRun, BorderStyle, ShadingType } = require('docx');

// Spec: 4pt left border (size: 32), 0.15" indents (216 DXA), 6pt spacing (120 twips)
function createCalloutBox(type, text) {
  const configs = {
    WARNING:  { bg: "FFF2CC", border: "FFC000", icon: "⚠️" },
    NOTE:     { bg: "D1ECF1", border: "2E74B5", icon: "ℹ️" },
    CRITICAL: { bg: "F8D7DA", border: "C00000", icon: "⛔" },
    TIP:      { bg: "E2F0D9", border: "548235", icon: "✅" }
  };

  const config = configs[type];

  return new Paragraph({
    shading: { fill: config.bg, type: ShadingType.CLEAR },
    border: {
      left: { style: BorderStyle.SINGLE, size: 32, color: config.border }  // 4pt
    },
    indent: { left: 216, right: 216 },  // 0.15"
    spacing: { before: 120, after: 120 },  // 6pt
    children: [
      new TextRun({ text: config.icon + " ", bold: true, size: 20, font: "Calibri" }),
      new TextRun({ text, size: 20, font: "Calibri" })
    ]
  });
}

// Usage
createCalloutBox("WARNING", "Do not enter the MICR account number."),
createCalloutBox("CRITICAL", "Always activate cards, even when reprinting.")
```

### Best Practices

**Do:**
- Place warnings BEFORE the step they apply to
- Keep callout text to 1-2 sentences
- Use one callout type per message (don't combine WARNING + CRITICAL)
- Reserve CRITICAL for true compliance/security issues

**Don't:**
- Use callouts for every piece of information
- Put multiple instructions inside a single callout
- Use WARNING for mere tips (use TIP instead)
- Stack multiple callouts consecutively

---

## Intervention Markers (Anti-Hallucination)

Intervention markers appear as **bold, red, italic text with yellow highlighting** to indicate content that requires human verification before the procedure can be approved. These markers prevent hallucination by making it explicit when the model was unsure or when TFCU-specific content needs confirmation.

### Marker Types

| Marker | Format | When Used |
|--------|--------|-----------|
| **VERIFY** | `[VERIFY: description]` | Pattern-extracted value needs confirmation |
| **CONFIRM** | `[CONFIRM: description]` | Auto-generated content needs validation |
| **SME INPUT** | `[SME INPUT REQUIRED: description]` | Missing TFCU-specific information |
| **MISSING** | `[MISSING: description]` | Required field was not provided |
| **CHECK** | `[CHECK: description]` | Inferred content with low confidence |
| **SUGGESTED** | `[SUGGESTED: description]` | Auto-generated content not from source (e.g., quick card warnings) |

### Styling Specification

```javascript
// Intervention marker style - bold, red, italic with yellow highlight for maximum visibility
const INTERVENTION_MARKER = {
  font: "Calibri",
  size: 20,        // 10pt
  color: "C00000", // Red
  italics: true,
  bold: true,
  highlight: "yellow"  // Yellow background highlight
};

// Example implementation
function createInterventionMarker(type, content) {
  const prefixes = {
    VERIFY: "[VERIFY: ",
    CONFIRM: "[CONFIRM: ",
    SME_INPUT: "[SME INPUT REQUIRED: ",
    MISSING: "[MISSING: ",
    CHECK: "[CHECK: ",
    SUGGESTED: "[SUGGESTED: "
  };

  return new TextRun({
    text: `${prefixes[type]}${content}]`,
    font: INTERVENTION_MARKER.font,
    size: INTERVENTION_MARKER.size,
    color: INTERVENTION_MARKER.color,
    italics: INTERVENTION_MARKER.italics,
    bold: INTERVENTION_MARKER.bold,
    highlight: INTERVENTION_MARKER.highlight
  });
}
```

### Visual Example

In the generated DOCX, markers appear inline with surrounding text:

```
Contact Card@Once support at [SME INPUT REQUIRED: phone number] if the
printer issue persists.
```

The bold, red, italic formatting with yellow highlight makes markers highly visible when reviewing the document:

| Normal Text | Marker |
|-------------|--------|
| Black, roman | Red (#C00000), bold, italic |
| No highlight | Yellow highlight |
| Calibri 11pt | Calibri 10pt |
| Standard | Stands out for immediate review |

### When to Use Each Marker

**VERIFY**: Use when a value was detected by pattern matching but hasn't been confirmed by the user.
```
Wire cutoff time: 3:00 PM [VERIFY: confirm this is still current]
```

**SME INPUT REQUIRED**: Use when critical TFCU-specific information is missing and cannot be inferred.
```
Transactions over [SME INPUT REQUIRED: daily limit amount] require supervisor approval.
```

**CONFIRM**: Use when the model generated content that seems reasonable but needs user validation.
```
This procedure applies to [CONFIRM: all branch locations?]
```

**SUGGESTED**: Use in Quick Cards when auto-generating warnings or prerequisites not from the source procedure.
```
⚠️ Always verify account number before proceeding [SUGGESTED: not from source procedure]
```

### Best Practices

**Do:**
- Use markers for ALL TFCU-specific content that wasn't explicitly provided
- Include descriptive content in the marker (not just `[VERIFY]` alone)
- Show marker count summary in the output section
- Instruct users to search for red italic text before approving

**Don't:**
- Use markers for regulatory content (CTR $10,000, SAR requirements, etc.)
- Remove markers when generating - they should appear in the output
- Use markers for obvious/trivial items
- Stack multiple markers consecutively

---

## Tables

### Standard Data Table

```javascript
const { Table, TableRow, TableCell, Paragraph, TextRun, 
        BorderStyle, WidthType, ShadingType, AlignmentType } = require('docx');

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

function createDataTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(text =>
      new TableCell({
        shading: { fill: "154747", type: ShadingType.CLEAR },
        borders: cellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, color: "FFFFFF" })]
        })]
      })
    )
  });
  
  const dataRows = rows.map((row, rowIndex) =>
    new TableRow({
      children: row.map(text =>
        new TableCell({
          borders: cellBorders,
          shading: { 
            fill: rowIndex % 2 === 0 ? "FFFFFF" : "F2F2F2", 
            type: ShadingType.CLEAR 
          },
          children: [new Paragraph({ children: [new TextRun(text)] })]
        })
      )
    })
  );
  
  return new Table({
    columnWidths: headers.map(() => Math.floor(9360 / headers.length)),
    rows: [headerRow, ...dataRows]
  });
}

// Usage
createDataTable(
  ["Card Type", "BIN Number", "Activation Location"],
  [
    ["Consumer Debit", "41139300", "Card@Once"],
    ["Business Debit", "42616400", "Card@Once"],
    ["Consumer Credit", "41205400", "FIS Payment One"],
    ["Business Credit", "47444300", "FIS Payment One"]
  ]
)
```

### Quick Reference Box

Two-column table for at-a-glance information:

```javascript
function createQuickReferenceBox(items) {
  // items = [{ label: "Support Phone", value: "1-800-237-3387" }, ...]
  
  const headerRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { fill: "154747", type: ShadingType.CLEAR },
        borders: cellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "QUICK REFERENCE", bold: true, color: "FFFFFF" })]
        })]
      })
    ]
  });
  
  const dataRows = items.map((item, index) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 3500, type: WidthType.DXA },
          shading: { fill: index % 2 === 0 ? "FFFFFF" : "F2F2F2", type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: item.label, bold: true })] })]
        }),
        new TableCell({
          width: { size: 5860, type: WidthType.DXA },
          shading: { fill: index % 2 === 0 ? "FFFFFF" : "F2F2F2", type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun(item.value)] })]
        })
      ]
    })
  );
  
  return new Table({
    columnWidths: [3500, 5860],
    rows: [headerRow, ...dataRows]
  });
}
```

### Revision History Table

**Important:** Per spec, never generate empty placeholder rows. If no revision history exists, create a single row with the current date and "Initial version".

```javascript
function createRevisionTable(revisions = []) {
  const headers = ["Date Updated", "Reviewed By", "Changes Made"];
  const widths = [25, 25, 50]; // Percentage widths per spec

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((text, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        shading: { fill: "154747", type: ShadingType.CLEAR },
        borders: cellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20 })]
        })]
      })
    )
  });

  // Use provided revisions, or create default "Initial version" row
  const data = revisions.length > 0 ? revisions : [
    { date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      reviewer: "Author",
      changes: "Initial version" }
  ];

  const dataRows = data.map((rev, index) => {
    const shade = index % 2 === 1 ? { fill: "F2F2F2", type: ShadingType.CLEAR } : undefined;
    return new TableRow({
      children: [rev.date, rev.reviewer, rev.changes].map((text, i) =>
        new TableCell({
          width: { size: widths[i], type: WidthType.PERCENTAGE },
          borders: cellBorders,
          shading: shade,
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text, size: 20 })]
          })]
        })
      )
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows]
  });
}
```

---

## Flowcharts

### Mermaid to PNG Workflow

Flowcharts must be rendered as images since docx-js cannot embed Mermaid directly.

#### Step 1: Create Mermaid Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 
  'primaryColor': '#154747', 
  'primaryTextColor': '#fff', 
  'primaryBorderColor': '#154747', 
  'lineColor': '#154747', 
  'secondaryColor': '#ffffff'
}}}%%

flowchart TD
    A[Start Process] --> B{Decision Point?}
    B -->|Yes| C[Action A]
    B -->|No| D[Action B]
    C --> E[End]
    D --> E
    
    style A fill:#154747,color:#fff
    style E fill:#154747,color:#fff
    style B fill:#fff,stroke:#154747,stroke-width:2px
```

#### Step 2: Render to PNG

```bash
# Install mermaid-cli
npm install -g @mermaid-js/mermaid-cli

# Render with TFCU styling
npx mmdc -i diagram.mmd -o diagram.png -w 800 -H 600 -b white
```

#### Step 3: Embed in Document

```javascript
const { Paragraph, ImageRun, AlignmentType } = require('docx');
const fs = require('fs');

new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 200, after: 200 },
  children: [new ImageRun({
    type: "png",
    data: fs.readFileSync("diagram.png"),
    transformation: { width: 600, height: 450 },
    altText: {
      title: "Process Flowchart",
      description: "Shows decision flow for the procedure",
      name: "flowchart"
    }
  })]
})
```

### Flowchart Patterns

#### Basic Decision Flow
```mermaid
flowchart TD
    A[Start: Action] --> B{Condition?}
    B -->|Yes| C[Do This]
    B -->|No| D[Do That]
    C --> E[End]
    D --> E
```

#### Multi-Branch Decision
```mermaid
flowchart TD
    A[Identify Type] --> B{Which Type?}
    B -->|Type A| C[Action A]
    B -->|Type B| D[Action B]
    B -->|Type C| E[Action C]
    C --> F[Continue]
    D --> F
    E --> F
```

#### Error Handling
```mermaid
flowchart TD
    A[Attempt Action] --> B{Success?}
    B -->|Yes| C[Continue]
    B -->|No| D{Error Type?}
    D -->|Connection| E[Check Network]
    D -->|Hardware| F[Check Device]
    D -->|Unknown| G[Contact Support]
    E --> H{Resolved?}
    F --> H
    H -->|Yes| A
    H -->|No| G
    
    style G fill:#dc3545,color:#fff
```

### Flowchart Style Rules

| Element | Shape | Style |
|---------|-------|-------|
| Start/End | Rectangle | fill:#154747,color:#fff |
| Action | Rectangle | Default (white) |
| Decision | Diamond | fill:#fff,stroke:#154747,stroke-width:2px |
| Error/Stop | Rectangle | fill:#dc3545,color:#fff |
| Success | Rectangle | fill:#28a745,color:#fff |

**Text Guidelines:**
- Maximum 5 words per node
- Use action verbs (Select, Enter, Verify)
- Avoid articles (the, a, an)
- Branch labels: 2-3 words maximum

### When to Use Flowcharts

**Use flowcharts when:**
- Process has 3+ decision points
- Multiple paths lead to different outcomes
- Error handling has multiple branches
- Parallel processes exist
- New staff need quick visual overview

**Don't use flowcharts when:**
- Process is strictly linear (use numbered list)
- Fewer than 3 decision points
- Procedure is very short (under 5 steps)
- Adding visual would duplicate step content

---

## Images

### Sizing Guidelines

| Image Type | Width | Height | Notes |
|------------|-------|--------|-------|
| Full screenshot | 500-600px | Auto | Scale proportionally |
| Dialog/popup | 300-400px | Auto | Maintain aspect ratio |
| Button/icon | 100-150px | Auto | Can inline with text |
| Flowchart | 600-700px | 400-500px | Full width for clarity |
| Data table image | 500px | Auto | If too complex for docx table |

### Implementation

```javascript
const { Paragraph, ImageRun, AlignmentType } = require('docx');
const fs = require('fs');

// Centered image with caption
new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 60 },
  children: [new ImageRun({
    type: "png",  // REQUIRED: must specify type
    data: fs.readFileSync("screenshot.png"),
    transformation: { width: 450, height: 280 },
    altText: {
      title: "Card Type Selection Screen",      // REQUIRED
      description: "Dropdown menu showing card type options",  // REQUIRED
      name: "card-type-selection"               // REQUIRED
    }
  })]
}),
new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "Figure 1: Card Type Selection", italics: true, size: 20 })]
})
```

### Best Practices

**Include images that:**
- Show specific UI elements users need to locate
- Demonstrate correct data entry examples
- Display error messages for troubleshooting
- Clarify complex layouts

**Exclude images that:**
- Show generic/obvious home screens
- Duplicate information in written steps
- Are low resolution or illegible
- Are purely decorative

---

## Screenshot Annotation Callouts (MANDATORY Color Matching)

When screenshots include numbered callout annotations (1), (2), (3), the text references in procedure steps **MUST** match the callout color.

### Color Matching Rule

| Screenshot Callout Color | Text Reference Color |
|--------------------------|----------------------|
| Teal (#154747) | Teal (#154747) |
| Red (#C00000) | Red (#C00000) |
| Blue (#2E74B5) | Blue (#2E74B5) |
| Green (#548235) | Green (#548235) |
| Gold (#FFC000) | Gold (#FFC000) |

### Example

If a screenshot has a teal-colored `(1)` annotation pointing to a dropdown menu:

**Correct:**
```
Select the card type from the dropdown (Callout 1).
```
Where "(Callout 1)" is formatted in **teal (#154747), bold**.

**Incorrect:**
```
Select the card type from the dropdown (Callout 1).
```
Where "(Callout 1)" is plain black text.

### Implementation

```javascript
const { SpecConfig } = require('./validator/spec-config');

// Get callout color from spec config
const calloutColor = SpecConfig.screenshotCallouts.annotationColors.teal;

// Create callout reference with matching color
function createCalloutReference(calloutNumber, color = "154747") {
  return new TextRun({
    text: `(Callout ${calloutNumber})`,
    font: "Calibri",
    size: 22,  // 11pt - same as body text
    bold: true,
    color: color  // MUST match screenshot annotation color
  });
}

// Usage in step text
new Paragraph({
  children: [
    new TextRun({ text: "Select the card type from the dropdown ", size: 22 }),
    createCalloutReference(1, "154747"),  // Teal to match screenshot
    new TextRun({ text: ".", size: 22 })
  ]
})
```

### Available Callout Colors

| Color Name | Hex Code | Use Case |
|------------|----------|----------|
| Teal | #154747 | Primary - most callouts (matches TFCU branding) |
| Red | #C00000 | Critical actions, warnings, do-not-click areas |
| Blue | #2E74B5 | Informational, secondary actions |
| Green | #548235 | Success indicators, confirmation buttons |
| Gold | #FFC000 | Caution, attention-needed areas |

### Best Practices

**Do:**
- Use teal (#154747) as the default callout color for consistency
- Match EVERY callout reference to its screenshot annotation color
- Use bold formatting for callout references to improve visibility
- Number callouts sequentially within each screenshot

**Don't:**
- Use different colors for the same callout across text and screenshot
- Skip callout numbers (1, 2, 4 instead of 1, 2, 3)
- Use more than 5-6 callouts per screenshot
- Mix color schemes inconsistently within a procedure

---

## Headers and Footers

### Footer Implementation

Footer includes department, procedure name, page number, and **skill version watermark** (subtle gray, inline).

Format: `Card Services | Procedure Name | Page X of Y  ·  v6.0`

```javascript
const { Footer, Paragraph, TextRun, AlignmentType, PageNumber } = require('docx');

// Skill version - sync with SKILL.md and REFERENCE.md when bumping versions
const SKILL_VERSION = "v6.0";

const footer = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "Card Services | Card@Once Procedure | Page ", size: 18, color: "666666" }),
      new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "666666" }),
      new TextRun({ text: " of ", size: 18, color: "666666" }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "666666" }),
      // Version watermark - subtle, inline with separator
      new TextRun({ text: `  ·  ${SKILL_VERSION}`, size: 16, color: "AAAAAA" })
    ]
  })]
});

// Use in document section
sections: [{
  properties: { /* ... */ },
  footers: { default: footer },
  children: [ /* ... */ ]
}]
```

### Header with Logo (Optional)

```javascript
const { Header, Paragraph, ImageRun, AlignmentType } = require('docx');

const header = new Header({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new ImageRun({
      type: "png",
      data: fs.readFileSync("tfcu-logo.png"),
      transformation: { width: 100, height: 40 },
      altText: { title: "TFCU Logo", description: "Tongass Federal Credit Union", name: "logo" }
    })]
  })]
});
```
