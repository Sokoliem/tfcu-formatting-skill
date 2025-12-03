# TFCU Procedure Formatter - Code Reference v6.1.0

Complete implementation reference for the TFCU Procedure Formatter skill. This file contains all helper functions, JavaScript implementations, and detailed technical specifications.

**Current Skill Version:** `v6.1.0` - Include this in document footers for traceability.

## Table of Contents

- [Layout Constants](#layout-constants)
- [Complete Implementation](#complete-implementation)
- [Helper Functions](#helper-functions)
- [Intervention Marker Helpers](#intervention-marker-helpers)
- [Assessment Section Helpers](#assessment-section-helpers)
- [Quick Card Helpers](#quick-card-helpers)
- [Screenshot Processing Pipeline](#screenshot-processing-pipeline)
- [Content Matching Engine](#content-matching-engine)
- [Image Registry System](#image-registry-system)
- [Coverage Analysis](#coverage-analysis)

---

## Layout Constants

### Skill Version

```javascript
// Current skill version - include in footer for traceability
// UPDATE THIS WITH EACH RELEASE
const SKILL_VERSION = "v6.0";

// ============================================================================
// CONSTANTS NOTE
// ============================================================================
// All color values, font sizes, and spacing defined below match spec-config.js.
// spec-config.js is the canonical source of truth for validation.
// These inline constants are for document generation convenience.
// If values conflict, spec-config.js wins.
// ============================================================================
```

### Column Widths & Margins

```javascript
// Use percentage-based widths for full-width tables
const LAYOUT = {
  FULL_WIDTH: { size: 100, type: WidthType.PERCENTAGE },
  HALF_WIDTH: { size: 50, type: WidthType.PERCENTAGE },
  TEXT_COLUMN: { size: 55, type: WidthType.PERCENTAGE },
  IMAGE_COLUMN: { size: 45, type: WidthType.PERCENTAGE }
};

// Page margins (DXA: 1440 = 1 inch)
const MARGINS = {
  COMPACT: 720,      // 0.5" - recommended for most procedures
  STANDARD: 1080,    // 0.75" - more breathing room
  WIDE: 1440         // 1.0" - traditional
};
```

### Spacing Constants

```javascript
// Spacing values (in twentieths of a point)
const SPACING = {
  // Section spacing
  SECTION_BEFORE: 180,    // Before section headers
  SECTION_AFTER: 60,      // After section headers

  // Step spacing
  STEP_AFTER: 30,         // After main step text
  SUBSTEP_AFTER: 20,      // After sub-steps (a., b.)

  // Callout spacing
  CALLOUT_BEFORE: 60,     // Before callout boxes
  CALLOUT_AFTER: 60,      // After callout boxes
  INLINE_CALLOUT_BEFORE: 40,  // Callouts inside step tables
  INLINE_CALLOUT_AFTER: 30,

  // Table cell padding
  CELL_PADDING: 20,       // Standard table cells
  HEADER_PADDING: 30,     // Table header cells

  // General spacing
  PARAGRAPH: 80,          // Between paragraphs
  AFTER_HEADER_TABLE: 100, // After main header
  AFTER_QUICK_REF: 80,    // After quick reference box
  SECTION_GAP: 60         // Between content sections
};
```

### Image Sizing

```javascript
const IMAGE_SIZES = {
  // In step tables (45% column)
  STANDARD: 280,          // Most screenshots
  LARGE: 320,             // Detailed UI, many fields
  SMALL: 180,             // Buttons, small dialogs

  // Comparison tables (centered)
  CARD_PREVIEW: 180,      // Card background samples
  SIDE_BY_SIDE: 160,      // 50/50 comparison images

  // Full-width (outside tables)
  DASHBOARD: 500,         // Full screen captures
  FLOWCHART: 550,         // Decision trees
  ERROR_MSG: 400          // Error dialogs
};
```

---

## Complete Implementation

### Document Setup

```javascript
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
        ShadingType, VerticalAlign, PageNumber, TabStopType, TabStopPosition,
        InternalHyperlink, ImageRun, Bookmark } = require('docx');
const fs = require('fs');

// Configuration - ALWAYS use getCurrentDate() for date, never hardcode!
const PROCEDURE = {
  name: "Procedure Name",
  department: "Department Name",
  date: getCurrentDate(),  // Dynamic - returns "December 2025" format
  overview: "Brief 2-4 sentence description.",
  filename: `${department}_${name.replace(/\s+/g, '_')}_${getCurrentDateYYYYMM()}.docx`
};

// ============================================================================
// COLOR CONSTANTS - Mirrors validator/spec-config.js (update there first)
// ============================================================================
const TFCU_COLORS = {
  PRIMARY_TEAL: "154747",
  LIGHT_TEAL: "E8F4F4",
  OVERVIEW_TEAL: "0F4761",
  WHITE: "FFFFFF",
  LIGHT_GRAY: "F2F2F2",
  BLACK: "000000"
};

const CALLOUT_COLORS = {
  WARNING_BG: "FFF2CC", WARNING_BORDER: "FFC000",
  NOTE_BG: "D1ECF1", NOTE_BORDER: "2E74B5",
  CRITICAL_BG: "F8D7DA", CRITICAL_BORDER: "C00000",
  TIP_BG: "E2F0D9", TIP_BORDER: "548235"
};

// Standard section anchors - use these constants to ensure TOC links work
const ANCHORS = {
  OVERVIEW: "overview",
  RELATED: "related",
  QUICK_REFERENCE: "quick-reference",
  PREREQUISITES: "prerequisites",
  TROUBLESHOOTING: "troubleshooting",
  GLOSSARY: "glossary",
  REVISION_HISTORY: "revision-history",
  ASSESSMENT: "assessment"
};
```

### Styles & Numbering

```javascript
const styles = {
  default: { document: { run: { font: "Calibri", size: 22 } } },
  paragraphStyles: [
    { id: "Overview", name: "Overview", basedOn: "Normal",
      run: { color: TFCU_COLORS.OVERVIEW_TEAL, size: 26, font: "Calibri", bold: true },
      paragraph: { spacing: { before: 120, after: 80 } } },
    { id: "SectionHeader", name: "Section Header", basedOn: "Normal",
      run: { bold: true, size: 28, font: "Calibri" },
      paragraph: { spacing: { before: 180, after: 60 } } }
  ]
};

const numbering = {
  config: [
    { reference: "procedure-list", levels: [
      { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 360 } } } },
      { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }
    ]},
    { reference: "bullet-list", levels: [
      { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 360 } } } }
    ]}
  ]
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
const noBorders = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE }
};
```

---

## Helper Functions

```javascript
// ============================================================================
// HELPER SELECTION GUIDE
// ============================================================================
// | Scenario                              | Helper                              |
// |---------------------------------------|-------------------------------------|
// | Step with existing screenshot         | createStepWithScreenshot()          |
// | Step needs screenshot, none exists    | createStepWithScreenshotPlaceholder() |
// | Text-only step, no screenshot needed  | createTextStep()                    |
// | Standalone warning before section     | createCalloutBox()                  |
// | Warning tied to specific step         | callout param in createStepWithScreenshot() |
// | Issue/Cause/Resolution table          | createTroubleshootingTable()        |
// | Figure Index appendix (REQUIRED)      | createFigureIndexAppendix()         |
// | Term/Definition list                  | createGlossaryTable()               |
// | Side-by-side comparison               | createComparisonTable()             |
// | Date/Reviewer/Changes history         | createRevisionTable()               |
// | Key values quick lookup               | createQuickReferenceBox()           |
// | Get current date (Month YYYY format)  | getCurrentDate()                    |
// | Get current date (YYYYMM format)      | getCurrentDateYYYYMM()              |
// ============================================================================
```

### getCurrentDate

**CRITICAL**: Always use these helpers for dates. Never hardcode dates like "December 2024".

```javascript
// Returns current date in "Month YYYY" format (e.g., "December 2025")
function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Returns current date in "YYYYMM" format for filenames (e.g., "202512")
function getCurrentDateYYYYMM() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}
```

### createHeaderTable

```javascript
function createHeaderTable(name, department, date) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [new TextRun({ text: name, bold: true, color: TFCU_COLORS.WHITE, size: 32 })]
          })]
        })
      ]}),
      new TableRow({ children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: department, color: TFCU_COLORS.PRIMARY_TEAL, size: 20 })]
          })]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: date, color: TFCU_COLORS.PRIMARY_TEAL, size: 20 })]
          })]
        })
      ]})
    ]
  });
}
```

### createSectionHeader

```javascript
function createSectionHeader(text, bookmarkId = null, pageBreakBefore = false) {
  const children = bookmarkId
    ? [new Bookmark({ id: bookmarkId, children: [new TextRun({ text: text, bold: true, size: 28, font: "Calibri", color: TFCU_COLORS.PRIMARY_TEAL })] })]
    : [new TextRun({ text: text, bold: true, size: 28, font: "Calibri", color: TFCU_COLORS.PRIMARY_TEAL })];

  return new Paragraph({
    pageBreakBefore,
    spacing: { before: 180, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TFCU_COLORS.PRIMARY_TEAL } },
    children
  });
}
```

### createTableOfContents

> **CRITICAL**: This function returns a SINGLE PARAGRAPH. The TOC must NEVER be in a table.

```javascript
// ============================================================================
// ANTI-PATTERN WARNING
// ============================================================================
// ❌ DO NOT create a Table for TOC
// ❌ DO NOT create a vertical bullet list
// ❌ DO NOT add a "CONTENTS" header cell
// ✅ DO use this function which returns an inline horizontal paragraph
// ============================================================================

function createTableOfContents(sections) {
  // Returns: "Contents: Section1 • Section2 • Section3"
  // This is a PARAGRAPH, not a table!

  const tocLinks = sections.map((s, i) => [
    new InternalHyperlink({
      anchor: s.anchor,
      children: [new TextRun({ text: s.title, color: TFCU_COLORS.PRIMARY_TEAL, font: "Calibri", size: 20 })]
    }),
    ...(i < sections.length - 1 ? [new TextRun({ text: "  •  ", size: 20, color: "999999" })] : [])
  ]).flat();

  return new Paragraph({  // ← Note: Paragraph, NOT Table
    spacing: { before: 80, after: 100 },
    children: [new TextRun({ text: "Contents: ", bold: true, size: 20 }), ...tocLinks]
  });
}
```

### createQuickReferenceBox

```javascript
function createQuickReferenceBox(items) {
  const rows = [
    new TableRow({ children: [
      new TableCell({
        columnSpan: 4,
        shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
        borders: cellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 30, after: 30 },
          children: [new TextRun({ text: "Quick Reference", bold: true, color: TFCU_COLORS.WHITE, size: 20 })]
        })]
      })
    ]})
  ];

  for (let i = 0; i < items.length; i += 2) {
    const rowChildren = [];
    const shade = Math.floor(i/2) % 2 === 0 ? TFCU_COLORS.WHITE : TFCU_COLORS.LIGHT_GRAY;

    for (let j = 0; j < 2; j++) {
      const item = items[i + j];
      if (item && item.label) {
        // Add label/value pair cells
        rowChildren.push(
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            margins: { top: 72, bottom: 72, left: 115, right: 115 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: item.label, bold: true, size: 20 })]
            })]
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            margins: { top: 72, bottom: 72, left: 115, right: 115 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: item.value, size: 20, font: "Consolas" })]
            })]
          })
        );
      } else {
        // Odd number of items - add empty cells to complete 4-column row
        rowChildren.push(
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [new Paragraph({ children: [] })]
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [new Paragraph({ children: [] })]
          })
        );
      }
    }
    if (rowChildren.length > 0) rows.push(new TableRow({ children: rowChildren }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}
```

### createCalloutBox

```javascript
function createCalloutBox(type, text) {
  const config = {
    WARNING:  { bg: CALLOUT_COLORS.WARNING_BG, border: CALLOUT_COLORS.WARNING_BORDER, icon: "⚠️" },
    NOTE:     { bg: CALLOUT_COLORS.NOTE_BG, border: CALLOUT_COLORS.NOTE_BORDER, icon: "ℹ️" },
    CRITICAL: { bg: CALLOUT_COLORS.CRITICAL_BG, border: CALLOUT_COLORS.CRITICAL_BORDER, icon: "⛔" },
    TIP:      { bg: CALLOUT_COLORS.TIP_BG, border: CALLOUT_COLORS.TIP_BORDER, icon: "✅" }
  };
  const c = config[type];
  return new Paragraph({
    shading: { fill: c.bg, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 32, color: c.border } },
    indent: { left: 216, right: 216 },
    spacing: { before: 120, after: 120 },
    children: [
      new TextRun({ text: c.icon + " ", bold: true, size: 20 }),
      new TextRun({ text, size: 20, font: "Calibri" })
    ]
  });
}
```

### createStepWithScreenshot

```javascript
function createStepWithScreenshot({
  stepNum,
  text,
  subSteps = [],
  imagePath,
  imageWidth = 280,
  callout = null,
  figureNumber = null
}) {
  // ENFORCEMENT: Validate annotated image path
  if (imagePath && !imagePath.includes('/annotated/')) {
    console.warn(`WARNING: Step ${stepNum} uses non-annotated image: ${imagePath}`);
  }

  if (!figureNumber) {
    console.warn(`WARNING: Step ${stepNum} missing figureNumber`);
  }

  const leftContent = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 30 },
      children: [
        new TextRun({ text: stepNum + " ", bold: true, size: 22, font: "Calibri" }),
        new TextRun({ text, size: 22, font: "Calibri" })
      ]
    })
  ];

  // Add sub-steps
  subSteps.forEach((sub, i) => {
    leftContent.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 20 },
      indent: { left: 300 },
      children: [
        new TextRun({ text: String.fromCharCode(97 + i) + ". ", bold: true, size: 20 }),
        new TextRun({ text: sub, size: 20, font: "Calibri" })
      ]
    }));
  });

  // Add inline callout if provided
  if (callout) {
    const cc = {
      WARNING: { bg: CALLOUT_COLORS.WARNING_BG, border: CALLOUT_COLORS.WARNING_BORDER, icon: "⚠️" },
      NOTE: { bg: CALLOUT_COLORS.NOTE_BG, border: CALLOUT_COLORS.NOTE_BORDER, icon: "ℹ️" },
      CRITICAL: { bg: CALLOUT_COLORS.CRITICAL_BG, border: CALLOUT_COLORS.CRITICAL_BORDER, icon: "⛔" },
      TIP: { bg: CALLOUT_COLORS.TIP_BG, border: CALLOUT_COLORS.TIP_BORDER, icon: "✅" }
    }[callout.type];
    leftContent.push(new Paragraph({
      shading: { fill: cc.bg, type: ShadingType.CLEAR },
      border: { left: { style: BorderStyle.SINGLE, size: 32, color: cc.border } },
      indent: { left: 216, right: 216 },
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({ text: cc.icon + " ", bold: true, size: 20 }),
        new TextRun({ text: callout.text, size: 20 })
      ]
    }));
  }

  // Right column: screenshot
  // Calculate aspect ratio from figure registry if available, else use 0.65 default
  let rightContent = [new Paragraph({ children: [] })];
  if (imagePath && fs.existsSync(imagePath)) {
    // Try to get actual dimensions from figure registry (defensive access)
    let aspectRatio = 0.65; // Default for standard UI screenshots
    if (figureNumber) {
      const figData = (typeof figureRegistry !== 'undefined' && figureRegistry?.figures)
        ? figureRegistry.figures.find(f => f.figure_number === figureNumber)
        : null;
      if (figData?.dimensions?.width && figData?.dimensions?.height) {
        aspectRatio = figData.dimensions.height / figData.dimensions.width;
      }
    }
    rightContent = [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new ImageRun({
        type: "png",
        data: fs.readFileSync(imagePath),
        transformation: { width: imageWidth, height: Math.round(imageWidth * aspectRatio) },
        altText: { title: `Figure ${figureNumber || ''}`, description: text, name: "screenshot" }
      })]
    })];
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: 55, type: WidthType.PERCENTAGE },
        borders: noBorders,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 72, bottom: 72, left: 144, right: 144 },
        children: leftContent
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        borders: noBorders,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 72, bottom: 72, left: 144, right: 144 },
        children: rightContent
      })
    ]})]
  });
}
```

### createStepWithScreenshotPlaceholder

Used in TEMPLATE and CREATE modes when no screenshot exists yet.

```javascript
function createStepWithScreenshotPlaceholder({
  stepNum,
  text,
  subSteps = [],
  screenshotHint = "Capture relevant UI screenshot",
  callout = null
}) {
  // Left column: step text and sub-steps (same pattern as createStepWithScreenshot)
  const leftContent = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 30 },
      children: [
        new TextRun({ text: stepNum + " ", bold: true, size: 22, font: "Calibri" }),
        new TextRun({ text, size: 22, font: "Calibri" })
      ]
    })
  ];

  // Add sub-steps
  subSteps.forEach((sub, i) => {
    leftContent.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 20 },
      indent: { left: 300 },
      children: [
        new TextRun({ text: String.fromCharCode(97 + i) + ". ", bold: true, size: 20 }),
        new TextRun({ text: sub, size: 20, font: "Calibri" })
      ]
    }));
  });

  // Add inline callout if provided
  if (callout) {
    const cc = {
      WARNING: { bg: CALLOUT_COLORS.WARNING_BG, border: CALLOUT_COLORS.WARNING_BORDER, icon: "⚠️" },
      NOTE: { bg: CALLOUT_COLORS.NOTE_BG, border: CALLOUT_COLORS.NOTE_BORDER, icon: "ℹ️" },
      CRITICAL: { bg: CALLOUT_COLORS.CRITICAL_BG, border: CALLOUT_COLORS.CRITICAL_BORDER, icon: "⛔" },
      TIP: { bg: CALLOUT_COLORS.TIP_BG, border: CALLOUT_COLORS.TIP_BORDER, icon: "✅" }
    }[callout.type];
    leftContent.push(new Paragraph({
      shading: { fill: cc.bg, type: ShadingType.CLEAR },
      border: { left: { style: BorderStyle.SINGLE, size: 32, color: cc.border } },
      indent: { left: 216, right: 216 },
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({ text: cc.icon + " ", bold: true, size: 20 }),
        new TextRun({ text: callout.text, size: 20 })
      ]
    }));
  }

  // Right column: gray placeholder box
  const rightContent = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR },
      border: {
        top: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" }
      },
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({ text: "[Screenshot Needed]", bold: true, size: 22, color: TFCU_COLORS.PRIMARY_TEAL })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR },
      spacing: { after: 60 },
      children: [
        new TextRun({ text: screenshotHint, italics: true, size: 18, color: "666666" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR },
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Replace with annotated image after capture.", size: 16, color: "999999" })
      ]
    })
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: 55, type: WidthType.PERCENTAGE },
        borders: noBorders,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 72, bottom: 72, left: 144, right: 144 },
        children: leftContent
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        borders: noBorders,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 72, bottom: 72, left: 144, right: 144 },
        children: rightContent
      })
    ]})]
  });
}
```

### Using callouts_for_text for Inline References (v4.6)

The `figure_registry.json` provides `callouts_for_text` with ready-to-use inline references for procedure text. Sub-steps can be generated directly from callout descriptions:

```javascript
// Read figure registry
const registry = JSON.parse(fs.readFileSync('workspace/images/annotated/figure_registry.json', 'utf-8'));

// Get callouts for a specific figure (defensive access)
function getCalloutsForFigure(figureNumber) {
  const figure = registry?.figures
    ? registry.figures.find(f => f.figure_number === figureNumber)
    : null;
  return figure?.callouts_for_text || [];
}

// Generate sub-steps with inline references
function generateSubStepsFromCallouts(figureNumber) {
  const callouts = getCalloutsForFigure(figureNumber);
  return callouts.map(c =>
    `${c.description} ${c.inline_reference}`
  );
}

// Example usage
createStepWithScreenshot({
  stepNum: "1.",
  text: "Access the Card Issuance screen.",
  subSteps: generateSubStepsFromCallouts(1),
  // Output: ["Navigate to Tools menu (callout 1)", "Select Card Services (callout 2)", ...]
  imagePath: "workspace/images/annotated/figure_01_card_issuance.png",
  figureNumber: 1
});
```

**callouts_for_text structure:**

```json
{
  "callouts_for_text": [
    {
      "number": 1,
      "color": "teal",
      "description": "Navigate to Tools menu",
      "inline_reference": "(callout 1)"
    },
    {
      "number": 2,
      "color": "red",
      "description": "Click Instant Issue",
      "inline_reference": "(callout 2)"
    }
  ]
}
```

**IMPORTANT (v4.6):** The `color` field determines the callout circle color ON THE SCREENSHOT. The `inline_reference` in text is always just "(callout N)" without color words - the reader sees the colored circle on the image.

### createTextStep

```javascript
function createTextStep(stepNum, text, subSteps = []) {
  const elements = [new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 72, after: 72 },
    indent: { left: 144 },
    children: [
      new TextRun({ text: stepNum + " ", bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text, size: 22, font: "Calibri" })
    ]
  })];
  subSteps.forEach((sub, i) => {
    elements.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      indent: { left: 544 },
      children: [
        new TextRun({ text: String.fromCharCode(97 + i) + ". ", size: 20 }),
        new TextRun({ text: sub, size: 20, font: "Calibri" })
      ]
    }));
  });
  return elements;
}
```

### createTroubleshootingTable

```javascript
function createTroubleshootingTable(rows) {
  const widths = [25, 30, 45];
  const tableRows = [
    new TableRow({ tableHeader: true, children: ["Issue", "Cause", "Resolution"].map((t, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
        borders: cellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 25, after: 25 },
          children: [new TextRun({ text: t, bold: true, color: TFCU_COLORS.WHITE, size: 20 })]
        })]
      })
    )})
  ];

  rows.forEach((row, index) => {
    const shade = index % 2 === 1 ? { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR } : undefined;
    tableRows.push(new TableRow({ children: [row.issue, row.cause, row.resolution].map((text, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: shade,
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text, size: 20 })]
        })]
      })
    )}));
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
}
```

### createRevisionTable

```javascript
function createRevisionTable(revisions = []) {
  const widths = [25, 25, 50];
  const tableRows = [
    new TableRow({ tableHeader: true, children: ["Date Updated", "Reviewed By", "Changes Made"].map((t, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
        borders: cellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 30, after: 30 },
          children: [new TextRun({ text: t, bold: true, color: TFCU_COLORS.WHITE, size: 20 })]
        })]
      })
    )})
  ];

  const data = revisions.length > 0 ? revisions : [
    { date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), reviewer: "Author", changes: "Initial version" }
  ];

  data.forEach((rev, index) => {
    const shade = index % 2 === 1 ? { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR } : undefined;
    tableRows.push(new TableRow({ children: [rev.date, rev.reviewer, rev.changes].map((text, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: shade,
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 30, after: 30 },
          children: [new TextRun({ text, size: 20 })]
        })]
      })
    )}));
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
}
```

### createFigureIndexAppendix

Creates a Figure Index appendix page listing all screenshots with their titles, descriptions, sections, and step references. **Required for all procedures with screenshots.**

```javascript
function createFigureIndexAppendix(figures) {
  // figures = Array from figure_registry.json:
  // [{ figure_number: 1, title: "Login Screen", description: "Shows the member login dialog",
  //    section: "Getting Started", step_reference: "Step 2" }, ...]

  const widths = [10, 20, 35, 20, 15]; // Fig #, Title, Description, Section, Step

  // Section header with page break
  const header = new Paragraph({
    pageBreakBefore: true,
    spacing: { before: 180, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TFCU_COLORS.PRIMARY_TEAL }},
    children: [
      new Bookmark({ id: "figure-index", children: [
        new TextRun({ text: "Figure Index", bold: true, size: 28, color: TFCU_COLORS.PRIMARY_TEAL })
      ]})
    ]
  });

  // Summary paragraph
  const summary = new Paragraph({
    spacing: { before: 60, after: 120 },
    children: [new TextRun({ text: `This procedure contains ${figures.length} figure${figures.length !== 1 ? 's' : ''}.`, size: 22, italics: true })]
  });

  // Table header row
  const tableRows = [
    new TableRow({ tableHeader: true, children: ["Fig #", "Title", "Description", "Section", "Step"].map((t, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
        borders: cellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 25, after: 25 },
          children: [new TextRun({ text: t, bold: true, color: TFCU_COLORS.WHITE, size: 20 })]
        })]
      })
    )})
  ];

  // Data rows
  figures.forEach((fig, index) => {
    const shade = index % 2 === 1 ? { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR } : undefined;
    const desc = fig.description?.length > 60 ? fig.description.substring(0, 57) + "..." : (fig.description || "Screenshot");

    tableRows.push(new TableRow({ children: [
      String(fig.figure_number || index + 1),
      fig.title || `Figure ${fig.figure_number || index + 1}`,
      desc,
      fig.section || "-",
      fig.step_reference || "-"
    ].map((text, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: shade,
        children: [new Paragraph({
          alignment: i === 0 || i === 4 ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text, size: 20, bold: i === 1 })]
        })]
      })
    )}));
  });

  const table = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });

  return [header, summary, table];
}
```

**Usage in document assembly:**
```javascript
// Load figure registry from workspace
const figureRegistry = JSON.parse(fs.readFileSync('workspace/images/annotated/figure_registry.json', 'utf8'));

// Add Figure Index appendix before Revision History
if (figureRegistry.figures && figureRegistry.figures.length > 0) {
  children.push(...createFigureIndexAppendix(figureRegistry.figures));
}
```

### createGlossaryTable

Creates a Term/Definition table for procedure glossaries.

```javascript
function createGlossaryTable(terms) {
  // terms = [{ term: "BIN", definition: "Bank Identification Number..." }, ...]
  const widths = [30, 70];
  const tableRows = [
    new TableRow({ tableHeader: true, children: ["Term/Acronym", "Definition"].map((t, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
        borders: cellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 30, after: 30 },
          children: [new TextRun({ text: t, bold: true, color: TFCU_COLORS.WHITE, size: 20 })]
        })]
      })
    )})
  ];

  terms.forEach((item, index) => {
    const shade = index % 2 === 1 ? { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR } : undefined;
    tableRows.push(new TableRow({ children: [
      new TableCell({
        width: { size: widths[0], type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: shade,
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 30, after: 30 },
          children: [new TextRun({ text: item.term, bold: true, size: 20, font: "Calibri" })]
        })]
      }),
      new TableCell({
        width: { size: widths[1], type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: shade,
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 30, after: 30 },
          children: [new TextRun({ text: item.definition, size: 20, font: "Calibri" })]
        })]
      })
    ]}));
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
}
```

### createComparisonTable

Creates a side-by-side comparison table (e.g., old vs. new process, card types).

```javascript
function createComparisonTable(title, columns, rows) {
  // title = "Card Type Comparison" (optional, null to omit)
  // columns = ["Feature", "Consumer Debit", "Business Debit"]
  // rows = [{ feature: "Daily Limit", values: ["$1,000", "$5,000"] }, ...]
  const columnCount = columns.length;
  const columnWidth = Math.floor(100 / columnCount);
  const tableRows = [];

  // Optional title row spanning all columns
  if (title) {
    tableRows.push(new TableRow({ children: [
      new TableCell({
        columnSpan: columnCount,
        shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
        borders: cellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text: title, bold: true, size: 24, color: TFCU_COLORS.PRIMARY_TEAL, font: "Calibri" })]
        })]
      })
    ]}));
  }

  // Header row with column labels
  tableRows.push(new TableRow({ tableHeader: true, children: columns.map(col =>
    new TableCell({
      width: { size: columnWidth, type: WidthType.PERCENTAGE },
      shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
      borders: cellBorders,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 30, after: 30 },
        children: [new TextRun({ text: col, bold: true, color: TFCU_COLORS.WHITE, size: 20 })]
      })]
    })
  )}));

  // Data rows
  rows.forEach((row, index) => {
    const shade = index % 2 === 1 ? { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR } : undefined;
    const cellData = [row.feature, ...row.values];
    tableRows.push(new TableRow({ children: cellData.map((text, i) =>
      new TableCell({
        width: { size: columnWidth, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: shade,
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 30, after: 30 },
          children: [new TextRun({
            text: text,
            bold: i === 0,  // First column (feature labels) are bold
            size: 20,
            font: "Calibri"
          })]
        })]
      })
    )}));
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
}
```

---

## Intervention Marker Helpers

Helper functions for creating anti-hallucination intervention markers in generated documents. Markers appear as **bold, red, italic text with yellow highlighting** to indicate content requiring human verification.

### Marker Constants

```javascript
// Intervention marker styles - bold, red, italic with yellow highlight for maximum visibility
const INTERVENTION_MARKER_STYLE = {
  font: "Calibri",
  size: 20,        // 10pt
  color: "C00000", // Red
  italics: true,
  bold: true,
  highlight: "yellow"  // Yellow background highlight
};

// Marker types and their formats
const MARKER_TYPES = {
  VERIFY: { prefix: "[VERIFY: ", suffix: "]", description: "Pattern-extracted value needs confirmation" },
  CONFIRM: { prefix: "[CONFIRM: ", suffix: "]", description: "Auto-generated content needs validation" },
  SME_INPUT: { prefix: "[SME INPUT REQUIRED: ", suffix: "]", description: "Missing TFCU-specific information" },
  MISSING: { prefix: "[MISSING: ", suffix: "]", description: "Required field not provided" },
  CHECK: { prefix: "[CHECK: ", suffix: "]", description: "Inferred content with low confidence" },
  SUGGESTED: { prefix: "[SUGGESTED: ", suffix: "]", description: "Auto-generated content not from source" }
};
```

### createInterventionMarker

Creates a styled TextRun for an intervention marker.

```javascript
/**
 * Creates a bold, red, italic, yellow-highlighted intervention marker TextRun
 * @param {string} type - Marker type: VERIFY, CONFIRM, SME_INPUT, MISSING, CHECK, SUGGESTED
 * @param {string} content - Description of what needs to be verified/provided
 * @returns {TextRun} Styled TextRun for the marker
 */
function createInterventionMarker(type, content) {
  const marker = MARKER_TYPES[type] || MARKER_TYPES.VERIFY;

  return new TextRun({
    text: `${marker.prefix}${content}${marker.suffix}`,
    font: INTERVENTION_MARKER_STYLE.font,
    size: INTERVENTION_MARKER_STYLE.size,
    color: INTERVENTION_MARKER_STYLE.color,
    italics: INTERVENTION_MARKER_STYLE.italics,
    bold: INTERVENTION_MARKER_STYLE.bold,
    highlight: INTERVENTION_MARKER_STYLE.highlight
  });
}
```

### createSMEMarker

Convenience function for creating SME Input Required markers (most common use case).

```javascript
/**
 * Creates an SME Input Required marker - the most common anti-hallucination marker
 * Use this when TFCU-specific information is missing from the source document
 * @param {string} description - What information is needed (e.g., "current phone number", "daily limit amount")
 * @returns {TextRun} Bold, red, italic, yellow-highlighted marker
 */
function createSMEMarker(description) {
  return new TextRun({
    text: `[SME INPUT REQUIRED: ${description}]`,
    bold: true,
    italics: true,
    color: "C00000",
    highlight: "yellow",
    size: 22
  });
}
```

**Usage Examples:**
```javascript
// Missing contact information
new Paragraph({
  children: [
    new TextRun({ text: "Contact Card Services at ", font: "Calibri", size: 22 }),
    createSMEMarker("Card Services phone extension"),
    new TextRun({ text: " for assistance.", font: "Calibri", size: 22 })
  ]
});

// Missing approval authority
new Paragraph({
  children: [
    new TextRun({ text: "Transactions over $5,000 require approval from ", font: "Calibri", size: 22 }),
    createSMEMarker("approval authority/role"),
    new TextRun({ text: ".", font: "Calibri", size: 22 })
  ]
});

// Missing policy reference
new Paragraph({
  children: [
    new TextRun({ text: "Refer to ", font: "Calibri", size: 22 }),
    createSMEMarker("related policy name"),
    new TextRun({ text: " for complete requirements.", font: "Calibri", size: 22 })
  ]
});
```

### createTextWithMarker

Creates a paragraph that includes both normal text and an intervention marker.

```javascript
/**
 * Creates a paragraph with inline intervention marker
 * @param {string} beforeText - Text before the marker
 * @param {string} markerType - Type of marker (VERIFY, CONFIRM, etc.)
 * @param {string} markerContent - Content description for the marker
 * @param {string} afterText - Text after the marker (optional)
 * @returns {Paragraph} Paragraph with embedded marker
 */
function createTextWithMarker(beforeText, markerType, markerContent, afterText = "") {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: beforeText, font: "Calibri", size: 22 }),
      createInterventionMarker(markerType, markerContent),
      new TextRun({ text: afterText, font: "Calibri", size: 22 })
    ]
  });
}
```

### createMarkerSummary

Creates a summary table showing all intervention markers in the document.

```javascript
/**
 * Creates a summary of intervention markers for the output section
 * @param {Object} markerCounts - Object with counts per marker type { VERIFY: 3, SME_INPUT: 1, ... }
 * @returns {Table} Summary table for the output
 */
function createMarkerSummary(markerCounts) {
  const rows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: { fill: "154747", type: ShadingType.CLEAR },
          children: [new Paragraph({
            children: [new TextRun({ text: "INTERVENTION MARKERS", bold: true, color: "FFFFFF", size: 20 })]
          })]
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          shading: { fill: "154747", type: ShadingType.CLEAR },
          children: [new Paragraph({
            children: [new TextRun({ text: "Action Required", bold: true, color: "FFFFFF", size: 20 })]
          })]
        })
      ]
    })
  ];

  // Add a row for each marker type with count > 0
  Object.entries(markerCounts).forEach(([type, count]) => {
    if (count > 0) {
      const marker = MARKER_TYPES[type];
      rows.push(new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [
                new TextRun({ text: `${count} `, size: 20 }),
                createInterventionMarker(type, "...")
              ]
            })]
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: marker.description, size: 20 })]
            })]
          })
        ]
      }));
    }
  });

  // Add instruction row
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { fill: "FFF2CC", type: ShadingType.CLEAR },
        children: [new Paragraph({
          children: [new TextRun({
            text: "Search for red italic text in the document to find all markers. All markers must be resolved before the procedure is approved.",
            size: 20,
            italics: true
          })]
        })]
      })
    ]
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows
  });
}
```

### Usage Example

```javascript
// Example: Creating a step with a marker for missing contact info
const stepWithMarker = new Paragraph({
  children: [
    new TextRun({ text: "1. Contact the Card@Once support team at ", font: "Calibri", size: 22 }),
    createInterventionMarker("SME_INPUT", "current phone number"),
    new TextRun({ text: " if the printer fails to respond.", font: "Calibri", size: 22 })
  ]
});

// Example: Quick Reference value needing verification
const qrValueMarker = createTextWithMarker(
  "Consumer Debit BIN: 41139300 ",
  "VERIFY",
  "confirm BIN is current",
  ""
);

// Example: Marker summary for output section
const markerCounts = { VERIFY: 3, SME_INPUT: 2, CONFIRM: 1, MISSING: 0, CHECK: 0, SUGGESTED: 0 };
const summaryTable = createMarkerSummary(markerCounts);
```

---

## Assessment Section Helpers

Helper functions for generating training assessments from procedure content.

### createAssessmentHeader

```javascript
function createAssessmentHeader() {
  return [
    new Paragraph({
      pageBreakBefore: true,
      children: [new Bookmark({
        id: "assessment",
        children: [new TextRun({ text: "PROCEDURE COMPETENCY ASSESSMENT", bold: true, size: 28, color: "154747", font: "Calibri" })]
      })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "154747" } },
      spacing: { after: 120 }
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Instructions: ", bold: true, size: 22, font: "Calibri" }),
        new TextRun({ text: "Complete this assessment after reviewing the procedure. A score of 80% or higher demonstrates proficiency.", size: 22, font: "Calibri" })
      ]
    })
  ];
}
```

### createMultipleChoiceQuestion

```javascript
function createMultipleChoiceQuestion(number, question, options) {
  // options = ["Option A", "Option B", "Option C", "Option D"]
  const optionLetters = ['a', 'b', 'c', 'd'];
  const children = [
    new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text: `${number}. ${question}`, bold: true, size: 22, font: "Calibri" })]
    })
  ];

  options.forEach((opt, i) => {
    children.push(new Paragraph({
      indent: { left: 360 },
      spacing: { after: 40 },
      children: [new TextRun({ text: `${optionLetters[i]}) ${opt}`, size: 22, font: "Calibri" })]
    }));
  });

  return children;
}
```

### createTrueFalseQuestion

```javascript
function createTrueFalseQuestion(number, statement) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({ text: `${number}. [True/False] `, bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text: statement, size: 22, font: "Calibri" })
    ]
  });
}
```

### createFillBlankQuestion

```javascript
function createFillBlankQuestion(number, question) {
  return [
    new Paragraph({
      spacing: { before: 160, after: 40 },
      children: [new TextRun({ text: `${number}. ${question}`, bold: true, size: 22, font: "Calibri" })]
    }),
    new Paragraph({
      indent: { left: 360 },
      spacing: { after: 80 },
      children: [new TextRun({ text: "_______________________________________________", size: 22, font: "Calibri" })]
    })
  ];
}
```

### createScenarioQuestion

```javascript
function createScenarioQuestion(number, scenario, options) {
  // For scenario-based multiple choice
  const optionLetters = ['a', 'b', 'c', 'd'];
  const children = [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: `${number}. `, bold: true, size: 22, font: "Calibri" })]
    }),
    new Paragraph({
      indent: { left: 360 },
      spacing: { after: 100 },
      children: [new TextRun({ text: scenario, italics: true, size: 22, font: "Calibri" })]
    }),
    new Paragraph({
      indent: { left: 360 },
      spacing: { after: 80 },
      children: [new TextRun({ text: "According to the procedure, what should you do?", size: 22, font: "Calibri" })]
    })
  ];

  options.forEach((opt, i) => {
    children.push(new Paragraph({
      indent: { left: 720 },
      spacing: { after: 40 },
      children: [new TextRun({ text: `${optionLetters[i]}) ${opt}`, size: 22, font: "Calibri" })]
    }));
  });

  return children;
}
```

### createAnswerKey

```javascript
function createAnswerKey(answers) {
  // answers = [{number: 1, answer: "D", explanation: "Verify member identity (Prerequisite step)"}, ...]
  const content = [
    new Paragraph({
      pageBreakBefore: true,
      children: [new TextRun({ text: "ANSWER KEY - SUPERVISOR USE ONLY", bold: true, size: 28, color: "154747", font: "Calibri" })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "154747" } },
      spacing: { after: 120 }
    }),
    new Paragraph({
      shading: { type: ShadingType.SOLID, color: "FFF2CC" },
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: "FFC000" }, bottom: { style: BorderStyle.SINGLE, size: 8, color: "FFC000" }, left: { style: BorderStyle.SINGLE, size: 8, color: "FFC000" }, right: { style: BorderStyle.SINGLE, size: 8, color: "FFC000" } },
      spacing: { before: 100, after: 200 },
      children: [new TextRun({ text: "⚠ DO NOT DISTRIBUTE TO STAFF BEFORE ASSESSMENT COMPLETION", bold: true, size: 20, font: "Calibri" })]
    })
  ];

  answers.forEach(a => {
    content.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `${a.number}. ${a.answer}`, bold: true, size: 22, font: "Calibri" }),
        new TextRun({ text: ` — ${a.explanation}`, size: 22, font: "Calibri" })
      ]
    }));
  });

  // Add scoring section
  content.push(new Paragraph({
    spacing: { before: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
    children: [new TextRun({ text: "SCORING", bold: true, size: 24, font: "Calibri" })]
  }));

  content.push(new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: `Score: ___/${answers.length} correct = ___%`, size: 22, font: "Calibri" })]
  }));

  content.push(new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: `Pass threshold: 80% (${Math.ceil(answers.length * 0.8)}/${answers.length} or higher)`, bold: true, size: 22, font: "Calibri" })]
  }));

  content.push(new Paragraph({
    spacing: { before: 100 },
    children: [new TextRun({ text: "Recommended actions for scores below 80%:", bold: true, size: 20, font: "Calibri" })]
  }));

  ["Review procedure with supervisor", "Shadow experienced staff member", "Retake assessment after additional training"].forEach(action => {
    content.push(new Paragraph({
      indent: { left: 360 },
      children: [new TextRun({ text: `• ${action}`, size: 20, font: "Calibri" })]
    }));
  });

  return content;
}
```

### Example Assessment Generation

```javascript
// Generate assessment section for a card issuance procedure
const assessmentSection = [
  ...createAssessmentHeader(),

  // Section 1: Procedure Knowledge
  new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: "SECTION 1: PROCEDURE KNOWLEDGE", bold: true, size: 24, color: "154747", font: "Calibri" })]
  }),

  ...createMultipleChoiceQuestion(1, "What is the FIRST step in the card issuance process?", [
    "Insert the card blank into the printer",
    "Log in to CardWizard Pro",
    "Have the member enter their PIN",
    "Verify member identity with two forms of ID"
  ]),

  createTrueFalseQuestion(2, "Cards can be issued without verifying member identity if the member is a long-standing account holder."),

  ...createFillBlankQuestion(3, "When entering the member's account number, what should you verify BEFORE proceeding to PIN entry?"),

  // Section 2: Scenario Applications
  new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: "SECTION 2: SCENARIO APPLICATIONS", bold: true, size: 24, color: "154747", font: "Calibri" })]
  }),

  ...createScenarioQuestion(4, "A member requests an instant-issue debit card. After entering their account number, the system displays an error message stating 'Account Restricted.'", [
    "Issue the card anyway since the member is present",
    "Clear the error and retry",
    "Refer to the Troubleshooting section and contact support if needed",
    "Ask the member to return tomorrow"
  ]),

  // Answer Key
  ...createAnswerKey([
    { number: 1, answer: "D", explanation: "Verify member identity is always the first step (Prerequisites)" },
    { number: 2, answer: "False", explanation: "Member verification is ALWAYS required per CRITICAL callout" },
    { number: 3, answer: "Account number displays correctly / matches member ID", explanation: "Step 2 verification requirement" },
    { number: 4, answer: "C", explanation: "Troubleshooting section specifies support contact for account restrictions" }
  ])
];
```

---

## Quick Card Helpers

Helper functions for generating one-page quick reference cards from procedures.

### Quick Card Layout Constants

```javascript
// Quick card specific constants
const QUICK_CARD_LAYOUT = {
  ORIENTATION: 'landscape',
  PAGE_WIDTH: 11,  // inches
  PAGE_HEIGHT: 8.5,  // inches
  MARGINS: 720,  // 0.5 inch in DXA
  HEADER_HEIGHT: 864,  // 0.6 inch in DXA
  COLUMN_GUTTER: 360,  // 0.25 inch
  SECTION_SPACING: 240,  // 12pt in twips
  ITEM_SPACING: 120  // 6pt in twips
};

// Section icons for quick card
const QUICK_CARD_ICONS = {
  before_you_start: "☐",
  key_steps: "#",
  watch_out_for: "⚠",
  when_to_escalate: "→",
  quick_contacts: "☎"
};
```

### createQuickCardHeader

```javascript
function createQuickCardHeader(procedureName, version, date) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        height: { value: 864, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
            borders: noBorders,
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: procedureName,
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: 32,
                  font: "Calibri"
                }),
                new TextRun({
                  text: " - QUICK REFERENCE",
                  color: TFCU_COLORS.WHITE,
                  size: 28,
                  font: "Calibri"
                })
              ]
            })]
          })
        ]
      })
    ]
  });
}
```

### createQuickCardSectionHeader

```javascript
function createQuickCardSectionHeader(title, icon) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: TFCU_COLORS.PRIMARY_TEAL
      }
    },
    children: [
      new TextRun({
        text: icon + " ",
        size: 24,
        font: "Calibri"
      }),
      new TextRun({
        text: title,
        bold: true,
        size: 24,
        color: TFCU_COLORS.PRIMARY_TEAL,
        font: "Calibri"
      })
    ]
  });
}
```

### createCheckboxList

```javascript
function createCheckboxList(items) {
  // For "Before You Start" section
  return items.map(item => new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: "☐ ", font: "Calibri", size: 20 }),
      new TextRun({ text: item, font: "Calibri", size: 20 })
    ]
  }));
}
```

### createCondensedSteps

```javascript
function createCondensedSteps(steps) {
  // For "Key Steps" section - max 8 steps, condensed text
  return steps.map((step, index) => new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: `${index + 1}. `,
        bold: true,
        font: "Calibri",
        size: 20
      }),
      new TextRun({
        text: step,
        font: "Calibri",
        size: 20
      })
    ]
  }));
}
```

### createCalloutList

```javascript
function createCalloutList(callouts) {
  // For "Watch Out For" section
  const iconMap = { CRITICAL: "⛔", WARNING: "⚠️", NOTE: "ℹ️", TIP: "✅" };
  return callouts.map(callout => new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: (iconMap[callout.type] || "⚠️") + " ",
        size: 20
      }),
      new TextRun({
        text: callout.text,
        font: "Calibri",
        size: 20
      })
    ]
  }));
}
```

### createEscalationList

```javascript
function createEscalationList(triggers) {
  // For "When to Escalate" section
  // triggers = [{condition: "Error persists", action: "Contact IT Support"}, ...]
  return triggers.map(trigger => new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: "• ", font: "Calibri", size: 20 }),
      new TextRun({
        text: trigger.condition,
        italics: true,
        font: "Calibri",
        size: 20
      }),
      new TextRun({ text: " → ", font: "Calibri", size: 20 }),
      new TextRun({
        text: trigger.action,
        bold: true,
        font: "Calibri",
        size: 20
      })
    ]
  }));
}
```

### createQuickContactGrid

```javascript
function createQuickContactGrid(contacts) {
  // contacts = [{label: "IT Help Desk", value: "ext. 4500"}, ...]
  const rows = contacts.map((contact, index) => {
    const shade = index % 2 === 0 ? TFCU_COLORS.WHITE : TFCU_COLORS.LIGHT_GRAY;
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: { fill: shade, type: ShadingType.CLEAR },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 72, right: 72 },
          children: [new Paragraph({
            children: [new TextRun({
              text: contact.label,
              bold: true,
              size: 18,
              font: "Calibri"
            })]
          })]
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          shading: { fill: shade, type: ShadingType.CLEAR },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 72, right: 72 },
          children: [new Paragraph({
            children: [new TextRun({
              text: contact.value,
              size: 18,
              font: "Consolas"
            })]
          })]
        })
      ]
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}
```

### createLandscapeQuickCard

```javascript
function createLandscapeQuickCard(config) {
  // config = {
  //   procedureName, department, date,
  //   beforeYouStart: [],  // prerequisites
  //   keySteps: [],        // condensed steps (max 8)
  //   watchOutFor: [],     // callouts [{type, text}]
  //   whenToEscalate: [],  // [{condition, action}]
  //   quickContacts: []    // [{label, value}]
  // }

  // Build left column content
  const leftContent = [
    createQuickCardSectionHeader("BEFORE YOU START", QUICK_CARD_ICONS.before_you_start),
    ...createCheckboxList(config.beforeYouStart),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
    createQuickCardSectionHeader("KEY STEPS", QUICK_CARD_ICONS.key_steps),
    ...createCondensedSteps(config.keySteps)
  ];

  // Build right column content
  const rightContent = [
    createQuickCardSectionHeader("WATCH OUT FOR", QUICK_CARD_ICONS.watch_out_for),
    ...createCalloutList(config.watchOutFor),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
    createQuickCardSectionHeader("WHEN TO ESCALATE", QUICK_CARD_ICONS.when_to_escalate),
    ...createEscalationList(config.whenToEscalate),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
    createQuickCardSectionHeader("QUICK CONTACTS", QUICK_CARD_ICONS.quick_contacts),
    createQuickContactGrid(config.quickContacts)
  ];

  // Two-column layout table
  const contentTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            margins: { top: 72, bottom: 72, left: 0, right: 180 },
            children: leftContent
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            margins: { top: 72, bottom: 72, left: 180, right: 0 },
            children: rightContent
          })
        ]
      })
    ]
  });

  // Footer paragraph
  const footer = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    children: [
      new TextRun({
        text: `${config.department} | ${config.procedureName} | ${config.date} | ${SKILL_VERSION}`,
        size: 16,
        color: "666666",
        font: "Calibri"
      }),
      new TextRun({
        text: "       For training use only",
        size: 16,
        color: "999999",
        italics: true,
        font: "Calibri"
      })
    ]
  });

  // Assemble complete document
  return new Document({
    styles,
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
            width: convertInchesToTwip(11),
            height: convertInchesToTwip(8.5)
          },
          margin: {
            top: 720,
            bottom: 720,
            left: 720,
            right: 720
          }
        }
      },
      children: [
        createQuickCardHeader(config.procedureName, SKILL_VERSION, config.date),
        new Paragraph({ spacing: { after: 120 }, children: [] }),
        contentTable,
        footer
      ]
    }]
  });
}
```

### Quick Card Generation Example

```javascript
// Example: Generate a quick card for Card Issuance procedure

const cardConfig = {
  procedureName: "Card Issuance Procedure",
  department: "Operations",
  date: "December 2025",

  beforeYouStart: [
    "Verify member identity with two forms of ID",
    "Confirm account is active and in good standing",
    "Ensure card printer is online and loaded",
    "Log in to CardWizard Pro"
  ],

  keySteps: [
    "Navigate to Tools > Card Services",
    "Select card type from dropdown",
    "Enter member account number",
    "Verify account info matches member ID",
    "Have member enter PIN (privacy shield!)",
    "Select Print Card, wait ~30 seconds",
    "Activate card before handing to member",
    "Obtain member signature on log"
  ],

  watchOutFor: [
    { type: "CRITICAL", text: "Never leave printer unattended during card creation" },
    { type: "WARNING", text: "Always activate cards - even when reprinting" },
    { type: "WARNING", text: "Verify BIN matches account type before proceeding" },
    { type: "WARNING", text: "Privacy shield required during PIN entry" }
  ],

  whenToEscalate: [
    { condition: "Card jam persists", action: "Contact Help Desk" },
    { condition: "Account shows restriction", action: "Contact Supervisor" },
    { condition: "Suspicious activity", action: "Contact Compliance" }
  ],

  quickContacts: [
    { label: "IT Help Desk", value: "ext. 4500" },
    { label: "CardWizard Support", value: "1-800-237-3387" },
    { label: "Supervisor", value: "[Fill in]" }
  ]
};

// Generate the quick card document
const quickCard = createLandscapeQuickCard(cardConfig);

// Save to file
Packer.toBuffer(quickCard).then(buffer => {
  fs.writeFileSync("Card_Issuance_QuickCard_202512.docx", buffer);
  console.log("Quick card generated successfully!");
});
```

---

## Screenshot Processing Pipeline

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  USER UPLOADS   │────▶│  CLAUDE VISION  │────▶│ IMAGE PREPROC   │
│  • Screenshots  │     │  ANALYSIS       │     │  • Smart crop   │
│  • Images       │     │  • OCR          │     │  • Resize       │
└─────────────────┘     │  • UI detection │     │  • Quality      │
                        │  • Crop region  │     └────────┬────────┘
                        └─────────────────┘              │
                                │                        ▼
                                │              ┌─────────────────┐
                                │              │  IMAGE REGISTRY │
                                │              │  • Figure #     │
                                │              │  • Step mapping │
                                │              └────────┬────────┘
                                │                       │
                                └───────────┬───────────┘
                                            ▼
                                ┌─────────────────────┐
                                │  PYTHON PIL         │
                                │  ANNOTATIONS        │
                                │  • Color-matched    │
                                │  • With legend      │
                                └─────────┬───────────┘
                                          ▼
                                ┌─────────────────────┐
                                │  DOCUMENT ASSEMBLY  │
                                │  docx-js ImageRun   │
                                │  + Hybrid captions  │
                                └─────────────────────┘
```

### Annotation Types Reference

| Type | JSON Structure | Use Case |
|------|---------------|----------|
| Numbered Callout | `{ type: "callout", position: {x, y}, number: 1 }` | Button clicks, numbered sequences |
| Arrow | `{ type: "arrow", position: {x, y}, end: {x, y} }` | Pointing to elements |
| Highlight Box | `{ type: "highlight", bbox: {x, y, w, h} }` | Input fields, data areas |
| Circle | `{ type: "circle", position: {x, y}, radius: 5 }` | Single focus point |
| Text Label | `{ type: "label", position: {x, y}, text: "Label" }` | Explanatory text |

### TFCU Brand Colors for Annotations

```javascript
const ANNOTATION_COLORS = {
  primary: '#154747',    // TFCU teal (default)
  critical: '#C00000',   // Red - must-see elements
  warning: '#FFC000',    // Gold - caution
  info: '#2E74B5',       // Blue - informational
  success: '#548235'     // Green - correct actions
};
```

---

## Content Matching Engine

### Configuration

```javascript
const MATCH_WEIGHTS = {
  TEXT_SIMILARITY: 0.35,
  UI_ELEMENT: 0.30,
  SECTION_MATCH: 0.20,
  SEQUENCE: 0.15
};

const CONFIDENCE_THRESHOLDS = {
  AUTO_ASSIGN: 0.60,
  REVIEW_FLAG: 0.40,
  REJECT: 0.20
};

const SECTION_KEYWORDS = {
  'system-access': ['login', 'sign in', 'username', 'password', 'welcome', 'dashboard'],
  'card-selection': ['card type', 'select card', 'debit', 'credit', 'BIN', 'instant issue'],
  'pin-entry': ['PIN', 'personal identification', '4-digit', 'PIN pad', 'offset'],
  'verification': ['preview', 'verify', 'confirm', 'review', 'before printing'],
  'activation': ['activate', 'activation', 'complete', 'finish', 'card ready'],
  'troubleshooting': ['error', 'failed', 'issue', 'problem', 'retry', 'warning'],
  'reports': ['report', 'history', 'log', 'summary', 'audit', 'transaction']
};

const ACTION_PATTERNS = {
  'click': { annotation: 'callout', target: 'button' },
  'select': { annotation: 'highlight', target: 'dropdown' },
  'enter': { annotation: 'highlight', target: 'textfield' },
  'verify': { annotation: 'highlight', target: 'area' },
  'navigate': { annotation: 'arrow', target: 'menu' },
  'check': { annotation: 'circle', target: 'checkbox' }
};
```

### Match Algorithm

```javascript
function matchScreenshotToStep(screenshot, steps) {
  const scores = steps.map(step => {
    const textScore = calculateTextSimilarity(
      screenshot.analysis.ocr_text,
      step.text
    );

    const action = parseStepAction(step.text);
    const uiScore = screenshot.analysis.ui_elements.some(el =>
      el.label.toLowerCase().includes(action.target?.toLowerCase() || '')
    ) ? 1.0 : 0.0;

    const sectionScore = screenshot.analysis.suggested_section === step.section ? 1.0 : 0.3;
    const sequenceScore = calculateSequenceScore(screenshot.position, step.order);

    const composite = (
      textScore * MATCH_WEIGHTS.TEXT_SIMILARITY +
      uiScore * MATCH_WEIGHTS.UI_ELEMENT +
      sectionScore * MATCH_WEIGHTS.SECTION_MATCH +
      sequenceScore * MATCH_WEIGHTS.SEQUENCE
    );

    return { step, composite, breakdown: { textScore, uiScore, sectionScore, sequenceScore } };
  });

  scores.sort((a, b) => b.composite - a.composite);

  return {
    bestMatch: scores[0],
    confidence: scores[0].composite,
    alternatives: scores.slice(1, 3),
    requiresReview: scores[0].composite < CONFIDENCE_THRESHOLDS.AUTO_ASSIGN
  };
}
```

---

## Image Registry System

```javascript
const imageRegistry = {
  figures: new Map(),
  figureOrder: [],
  stepToFigure: new Map(),
  colorManager: null,

  initialize() {
    this.figures.clear();
    this.figureOrder = [];
    this.stepToFigure.clear();
    this.colorManager = new AnnotationColorManager();
  },

  addFigure(data) {
    const id = `fig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const figureNumber = this.figureOrder.length + 1;

    this.figures.set(id, {
      ...data,
      id,
      figureNumber,
      caption: `Figure ${figureNumber}: ${data.description || 'Screenshot'}`,
      registeredAt: Date.now()
    });

    this.figureOrder.push(id);

    if (data.stepId) {
      if (!this.stepToFigure.has(data.stepId)) {
        this.stepToFigure.set(data.stepId, []);
      }
      this.stepToFigure.get(data.stepId).push(id);
    }

    return { id, figureNumber };
  },

  getSummary() {
    return {
      totalFigures: this.figures.size,
      assignedToSteps: [...this.stepToFigure.values()].flat().length,
      orphaned: [...this.figures.values()].filter(f => !f.assignedStep).length
    };
  }
};
```

### Annotation Color Manager

```javascript
class AnnotationColorManager {
  static PALETTE = [
    { name: "critical", hex: "#C00000", desc: "Primary action" },
    { name: "info", hex: "#2E74B5", desc: "Informational" },
    { name: "warning", hex: "#FFC000", desc: "Caution" },
    { name: "success", hex: "#548235", desc: "Confirmation" },
    { name: "primary", hex: "#154747", desc: "Navigation" },
    { name: "purple", hex: "#7030A0", desc: "Optional" },
    { name: "orange", hex: "#ED7D31", desc: "Alternative" }
  ];

  constructor() {
    this.assigned = new Map();
  }

  assign(elementId, suggestedColor = null, descriptionText = "") {
    if (this.assigned.has(elementId)) {
      const existing = this.assigned.get(elementId);
      if (descriptionText) existing.text = descriptionText;
      return existing;
    }

    let color = suggestedColor
      ? AnnotationColorManager.PALETTE.find(c => c.name === suggestedColor)
      : null;

    if (!color) {
      const usedCount = this.assigned.size;
      color = AnnotationColorManager.PALETTE[usedCount % AnnotationColorManager.PALETTE.length];
    }

    const entry = {
      ...color,
      number: this.assigned.size + 1,
      text: descriptionText || `Action ${this.assigned.size + 1}`
    };

    this.assigned.set(elementId, entry);
    return entry;
  }

  getLegendEntries() {
    return [...this.assigned.values()].sort((a, b) => a.number - b.number);
  }
}
```

---

## Coverage Analysis

```javascript
function analyzeCoverage(procedure, registry) {
  const criticalPatterns = /login|select.*type|enter.*account|verify|error/i;
  const warnings = [];

  procedure.steps.forEach(step => {
    const hasFigure = registry.stepToFigure.has(step.id);
    const isCritical = criticalPatterns.test(step.text);

    if (isCritical && !hasFigure) {
      warnings.push({
        severity: "warning",
        message: `Critical step ${step.number} has no screenshot`,
        step: step.id,
        suggestion: `Add screenshot showing: ${step.text}`
      });
    }
  });

  registry.figures.forEach((fig, id) => {
    if (!fig.assignedStep) {
      warnings.push({
        severity: "info",
        message: `Figure ${fig.figureNumber} not assigned to any step`,
        figure: id
      });
    }
  });

  const stepsWithFigures = procedure.steps.filter(s => registry.stepToFigure.has(s.id)).length;

  return {
    coverage: Math.round((stepsWithFigures / procedure.steps.length) * 100),
    warnings,
    canProceed: true,
    criticalCoverage: {
      total: procedure.steps.filter(s => criticalPatterns.test(s.text)).length,
      covered: procedure.steps.filter(s =>
        criticalPatterns.test(s.text) && registry.stepToFigure.has(s.id)
      ).length
    }
  };
}
```

---

## Complete Document Assembly Example

This is the full example showing how to assemble a complete TFCU procedure document. Claude should generate code similar to this inline for each procedure.

**IMPORTANT: Use validated-helpers for spec-compliant generation:**

```javascript
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
        VerticalAlign, PageNumber, PageBreak, Bookmark } = require('docx');
const fs = require('fs');

// MANDATORY: Import validated helpers for spec-compliant generation
const {
  createHeaderTable,
  createCalloutBox,
  createSectionHeader,
  createRevisionTable,
  createTableOfContents,
  createStepWithScreenshot,
  createQuickReferenceBox,
  createTroubleshootingTable,
  createValidationReport,
  getPageMargins,
  SpecConfig
} = require('./validator/validated-helpers');

const { ValidationContext } = require('./validator/validation-context');

// Create validation context for this document
const ctx = new ValidationContext({ mode: 'lenient' });

// ============================================================================
// PROCEDURE CONFIGURATION - Customize for each document
// ============================================================================

// CRITICAL: Always use getCurrentDate() - never hardcode dates!
const PROCEDURE = {
  name: "Instant Issue Card Procedure",
  department: "Operations",
  date: getCurrentDate(),  // Dynamic: returns current "Month YYYY" (e.g., "December 2025")
  overview: "This procedure guides staff through the process of issuing instant debit and credit cards to members using the card printing system. It covers card selection, PIN assignment, activation, and troubleshooting common issues.",
  filename: `Operations_Instant_Issue_Card_${getCurrentDateYYYYMM()}.docx`  // Dynamic: e.g., "202512"
};

// Load figure registry for image references
const figureRegistry = JSON.parse(fs.readFileSync('workspace/images/annotated/figure_registry.json', 'utf-8'));

// ============================================================================
// DOCUMENT ASSEMBLY
// ============================================================================

const doc = new Document({
  styles,      // From helper definitions above
  numbering,   // From helper definitions above
  sections: [{
    properties: {
      page: {
        margin: {
          top: 720,    // 0.5 inch
          right: 720,
          bottom: 720,
          left: 720
        }
      }
    },
    headers: {
      default: new Header({ children: [] })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `${PROCEDURE.department} | ${PROCEDURE.name} | Page `, size: 18, color: "666666" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "666666" }),
              new TextRun({ text: " of ", size: 18, color: "666666" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "666666" }),
              // Version watermark - subtle, inline with separator
              new TextRun({ text: `  ·  ${SKILL_VERSION}`, size: 16, color: "AAAAAA" })
            ]
          })
        ]
      })
    },
    children: [
      // ========== HEADER TABLE ==========
      createHeaderTable(PROCEDURE.name, PROCEDURE.department, PROCEDURE.date),
      new Paragraph({ spacing: { after: 100 }, children: [] }),

      // ========== TABLE OF CONTENTS (optional, for longer procedures) ==========
      // Use ANCHORS constants for standard sections to ensure TOC/bookmark match
      createTableOfContents([
        { title: "Overview", anchor: ANCHORS.OVERVIEW },
        { title: "Prerequisites", anchor: ANCHORS.PREREQUISITES },
        { title: "Card Issuance", anchor: "card-issuance" },  // Custom section, not in ANCHORS
        { title: "Troubleshooting", anchor: ANCHORS.TROUBLESHOOTING },
        { title: "Revision History", anchor: ANCHORS.REVISION_HISTORY }
      ]),

      // ========== OVERVIEW SECTION ==========
      createSectionHeader("OVERVIEW", ANCHORS.OVERVIEW),
      new Paragraph({
        style: "Overview",
        children: [new TextRun({ text: PROCEDURE.overview, color: "0F4761", size: 26 })]
      }),

      // ========== RELATED SECTION ==========
      createSectionHeader("RELATED"),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Policies: ", bold: true, size: 20 }),
          new TextRun({ text: "Card Services Policy, Member Authentication Policy", size: 20 })
        ]
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Procedures: ", bold: true, size: 20 }),
          new TextRun({ text: "PIN Reset Procedure, Card Replacement Procedure", size: 20 })
        ]
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "Forms: ", bold: true, size: 20 }),
          new TextRun({ text: "Card Issuance Log, Member Verification Checklist", size: 20 })
        ]
      }),

      // ========== QUICK REFERENCE BOX (optional) ==========
      createQuickReferenceBox([
        { label: "System", value: "CardWizard Pro" },
        { label: "Login URL", value: "cardwizard.tfcu.local" },
        { label: "Support", value: "ext. 4500" },
        { label: "Hours", value: "M-F 8am-6pm" }
      ]),
      new Paragraph({ spacing: { after: 80 }, children: [] }),

      // ========== PREREQUISITES SECTION ==========
      createSectionHeader("PREREQUISITES", ANCHORS.PREREQUISITES),
      ...createTextStep("1.", "Verify the member's identity using two forms of identification."),
      ...createTextStep("2.", "Confirm the member has an active account in good standing."),
      ...createTextStep("3.", "Ensure the card printer is online and has card stock loaded."),

      // ========== MAIN PROCEDURE SECTION ==========
      createSectionHeader("CARD ISSUANCE", "card-issuance"),

      // Step with screenshot
      createStepWithScreenshot({
        stepNum: "1.",
        text: "Log in to CardWizard Pro using your employee credentials.",
        subSteps: [
          "Enter your username in the User ID field",
          "Enter your password",
          "Select Login"
        ],
        imagePath: "workspace/images/annotated/login_screen.png",
        imageWidth: 300,
        figureNumber: 1
      }),

      // Step with callout
      createStepWithScreenshot({
        stepNum: "2.",
        text: "Select the card type from the dropdown menu.",
        subSteps: [
          "For debit cards, select 'TFCU Debit - Instant'",
          "For credit cards, select 'TFCU Visa - Instant'"
        ],
        imagePath: "workspace/images/annotated/card_selection.png",
        imageWidth: 300,
        callout: {
          type: "WARNING",
          text: "Verify the BIN number matches the member's account type before proceeding."
        },
        figureNumber: 2
      }),

      createStepWithScreenshot({
        stepNum: "3.",
        text: "Enter the member's account number and verify the information displayed.",
        imagePath: "workspace/images/annotated/account_entry.png",
        imageWidth: 300,
        figureNumber: 3
      }),

      // Critical callout (standalone)
      createCalloutBox("CRITICAL", "Never leave the card printer unattended while a card is being printed. Cards must be handed directly to the member."),

      createStepWithScreenshot({
        stepNum: "4.",
        text: "Have the member enter their PIN on the PIN pad.",
        subSteps: [
          "Ensure privacy shield is in place",
          "Member enters 4-digit PIN",
          "Member confirms PIN by entering it again"
        ],
        imagePath: "workspace/images/annotated/pin_entry.png",
        imageWidth: 300,
        figureNumber: 4
      }),

      createStepWithScreenshot({
        stepNum: "5.",
        text: "Select Print Card and wait for the card to be produced.",
        imagePath: "workspace/images/annotated/print_card.png",
        imageWidth: 300,
        callout: {
          type: "NOTE",
          text: "Card printing takes approximately 30 seconds. Do not cancel the print job."
        },
        figureNumber: 5
      }),

      ...createTextStep("6.", "Hand the card to the member and have them sign the card issuance log."),

      // ========== TROUBLESHOOTING SECTION ==========
      createSectionHeader("TROUBLESHOOTING", ANCHORS.TROUBLESHOOTING),
      createTroubleshootingTable([
        { issue: "Card jam", cause: "Misaligned card stock", resolution: "Open printer, remove jammed card, realign stock, retry" },
        { issue: "PIN pad not responding", cause: "Connection issue", resolution: "Check USB connection, restart PIN pad if needed" },
        { issue: "Account not found", cause: "Incorrect account number", resolution: "Verify account number with member, check for typos" }
      ]),

      // ========== REVISION HISTORY (always on new page) ==========
      new Paragraph({ children: [new PageBreak()] }),
      createSectionHeader("REVISION HISTORY", ANCHORS.REVISION_HISTORY),
      createRevisionTable([
        { date: getCurrentDate(), reviewer: "J. Smith", changes: "Initial version" }  // Dynamic date
      ])
    ]
  }]
});

// ============================================================================
// SELF-VALIDATION (runs before document save)
// ============================================================================
const validationErrors = [];
const validationWarnings = [];

// Check for stale/hardcoded dates (dynamic check)
const currentYear = new Date().getFullYear();
const dateYearMatch = PROCEDURE.date.match(/\d{4}/);
if (dateYearMatch) {
  const procedureYear = parseInt(dateYearMatch[0], 10);
  if (procedureYear < currentYear) {
    validationErrors.push(`Stale date detected (${PROCEDURE.date}) - use getCurrentDate() for current date`);
  }
}
// Also catch the specific hardcoded example
if (PROCEDURE.date === "December 2024") {
  validationErrors.push("Hardcoded example date 'December 2024' detected - use getCurrentDate() instead");
}

// Check for Figure Index when images exist
const imageCount = figureRegistry?.figures?.length || 0;
if (imageCount > 0) {
  // Check if Figure Index section is included in document children
  const docChildren = doc.sections?.[0]?.properties?.children || [];
  const hasFigureIndex = docChildren.some(child =>
    child?.properties?.tag === 'figure-index' ||
    (child?.constructor?.name === 'Paragraph' &&
     JSON.stringify(child).includes('Figure Index'))
  );
  if (!hasFigureIndex) {
    validationErrors.push(`Missing Figure Index - ${imageCount} images require figure index appendix`);
  }
}

// Check for raw images without annotation pipeline
const rawPath = 'workspace/images/raw';
const annotatedPath = 'workspace/images/annotated';
const imageExtRegex = /\.(png|jpg|jpeg|gif)$/i;

const rawImagesExist = fs.existsSync(rawPath) &&
  fs.readdirSync(rawPath).filter(f => imageExtRegex.test(f)).length > 0;
const annotatedImagesExist = fs.existsSync(annotatedPath) &&
  fs.readdirSync(annotatedPath).filter(f => imageExtRegex.test(f)).length > 0;

if (rawImagesExist && !annotatedImagesExist) {
  validationErrors.push("Raw images detected but annotation pipeline not run. Execute screenshot_processor.py first.");
}

// Fail generation if critical errors
if (validationErrors.length > 0) {
  console.error("\n========== VALIDATION FAILED ==========");
  validationErrors.forEach(err => console.error("ERROR:", err));
  if (validationWarnings.length > 0) {
    validationWarnings.forEach(warn => console.warn("WARNING:", warn));
  }
  console.error("=========================================\n");
  process.exit(1);
}

// Show warnings but continue
if (validationWarnings.length > 0) {
  console.warn("\n========== VALIDATION WARNINGS ==========");
  validationWarnings.forEach(warn => console.warn("WARNING:", warn));
  console.warn("==========================================\n");
}

console.log("Self-validation passed!");

// ============================================================================
// SAVE DOCUMENT
// ============================================================================

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(PROCEDURE.filename, buffer);
  console.log(`Document saved: ${PROCEDURE.filename}`);
});
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Black table cells | Using `ShadingType.SOLID` | Always use `ShadingType.CLEAR` |
| Invalid document | PageBreak not in Paragraph | Wrap: `new Paragraph({ children: [new PageBreak()] })` |
| TOC not clickable | `bookmark` property on Paragraph | Use `Bookmark` class as child element |
| Numbering resets | Same reference name | Use unique reference per independent list |
| Images not showing | Missing `type` parameter | Always specify `type: "png"` in ImageRun |
| Table borders missing | Borders on Table instead of cells | Apply borders to each TableCell |
| Tables not full width | Using DXA widths | Use `{ size: 100, type: WidthType.PERCENTAGE }` |
| Images misaligned | Missing alignment property | Add `alignment: AlignmentType.RIGHT` for screenshots |
| Aspect ratio wrong | Hardcoded 0.65 ratio | Read actual dimensions from figure_registry.json |
