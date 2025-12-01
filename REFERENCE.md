# TFCU Procedure Formatter - Code Reference v4.3.2

Complete implementation reference for the TFCU Procedure Formatter skill. This file contains all helper functions, JavaScript implementations, and detailed technical specifications.

## Table of Contents

- [Layout Constants](#layout-constants)
- [Complete Implementation](#complete-implementation)
- [Helper Functions](#helper-functions)
- [Screenshot Processing Pipeline](#screenshot-processing-pipeline)
- [Content Matching Engine](#content-matching-engine)
- [Image Registry System](#image-registry-system)
- [Coverage Analysis](#coverage-analysis)

---

## Layout Constants

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

// Configuration
const PROCEDURE = {
  name: "Procedure Name",
  department: "Department Name",
  date: "Month Year",
  overview: "Brief 2-4 sentence description."
};

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

```javascript
function createTableOfContents(sections) {
  const tocLinks = sections.map((s, i) => [
    new InternalHyperlink({
      anchor: s.anchor,
      children: [new TextRun({ text: s.title, color: TFCU_COLORS.PRIMARY_TEAL, font: "Calibri", size: 20 })]
    }),
    ...(i < sections.length - 1 ? [new TextRun({ text: "  •  ", size: 20, color: "999999" })] : [])
  ]).flat();

  return new Paragraph({
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
    // Try to get actual dimensions from figure registry
    let aspectRatio = 0.65; // Default for standard UI screenshots
    if (figureNumber && typeof figureRegistry !== 'undefined') {
      const figData = figureRegistry.figures?.find(f => f.figure_number === figureNumber);
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

```javascript
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
        VerticalAlign, PageNumber, PageBreak, Bookmark } = require('docx');
const fs = require('fs');

// ============================================================================
// PROCEDURE CONFIGURATION - Customize for each document
// ============================================================================

const PROCEDURE = {
  name: "Instant Issue Card Procedure",
  department: "Operations",
  date: "December 2024",
  overview: "This procedure guides staff through the process of issuing instant debit and credit cards to members using the card printing system. It covers card selection, PIN assignment, activation, and troubleshooting common issues.",
  filename: "Operations_Instant_Issue_Card_202412.docx"
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
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "666666" })
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
      createTableOfContents([
        { title: "Overview", anchor: "overview" },
        { title: "Prerequisites", anchor: "prerequisites" },
        { title: "Card Issuance", anchor: "card-issuance" },
        { title: "Troubleshooting", anchor: "troubleshooting" },
        { title: "Revision History", anchor: "revision-history" }
      ]),

      // ========== OVERVIEW SECTION ==========
      createSectionHeader("OVERVIEW", "overview"),
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
      createSectionHeader("PREREQUISITES", "prerequisites"),
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
      createSectionHeader("TROUBLESHOOTING", "troubleshooting"),
      createTroubleshootingTable([
        { issue: "Card jam", cause: "Misaligned card stock", resolution: "Open printer, remove jammed card, realign stock, retry" },
        { issue: "PIN pad not responding", cause: "Connection issue", resolution: "Check USB connection, restart PIN pad if needed" },
        { issue: "Account not found", cause: "Incorrect account number", resolution: "Verify account number with member, check for typos" }
      ]),

      // ========== REVISION HISTORY (always on new page) ==========
      new Paragraph({ children: [new PageBreak()] }),
      createSectionHeader("REVISION HISTORY", "revision-history"),
      createRevisionTable([
        { date: "December 2024", reviewer: "J. Smith", changes: "Initial version" }
      ])
    ]
  }]
});

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
