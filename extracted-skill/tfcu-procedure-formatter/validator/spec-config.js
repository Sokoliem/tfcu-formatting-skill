/**
 * TFCU Procedure Formatter - Specification Configuration
 * Single source of truth for all 54 spec requirements
 *
 * This module exports an immutable configuration object containing
 * all values defined in tfcu_procedure_formatter_spec.md
 */

const SpecConfig = {
  // ============================================================
  // BRAND IDENTITY
  // ============================================================
  brand: {
    organization: "Tongass Federal Credit Union",
    documentType: "Operational procedures for frontline staff",
  },

  // ============================================================
  // TYPOGRAPHY (11 requirements: T01-T11)
  // ============================================================
  fonts: {
    primary: "Calibri", // All body text, headers, callouts
    monospace: "Consolas", // BINs, account numbers, phone numbers, URLs, code
  },

  // Font sizes in half-points (docx-js format)
  fontSizes: {
    documentTitle: 32, // T01: 16pt - Header table row 1
    sectionHeader: 28, // T02: 14pt - Section headings
    bodyText: 22, // T03: 11pt - Body paragraphs
    stepText: 22, // T04: 11pt - Procedure steps
    tableBody: 20, // T05: 10pt - Table cell content
    tableHeader: 20, // T06: 10pt - Table header cells (bold)
    quickRefLabel: 20, // T07: 10pt - Quick Reference labels (bold)
    quickRefValue: 20, // T08: 10pt - Quick Reference values (Consolas)
    calloutText: 20, // T09: 10pt - Callout box content
    tocLink: 20, // T10: 10pt - Table of contents links
    footer: 18, // T11: 9pt - Footer text
  },

  // ============================================================
  // COLORS (14 requirements: C01-C14)
  // ============================================================
  colors: {
    // Brand colors
    primaryTeal: "154747", // C01: Dark teal - headers, borders, TOC links
    lightTeal: "E8F4F4", // C02: Light teal - header row 2 background
    white: "FFFFFF", // C03: White text on dark backgrounds
    black: "000000", // C04: Body text color
    footerGray: "666666", // C05: Footer text color
    tableBorder: "CCCCCC", // C06: Subtle table grid borders
    lightGray: "F2F2F2", // C07: Alternating row backgrounds

    // Callout box colors (C08-C14)
    callout: {
      critical: {
        fill: "F8D7DA", // C08: Light red background
        border: "C00000", // C09: Dark red left border
        icon: "stop", // Unicode: ⛔
      },
      warning: {
        fill: "FFF2CC", // C10: Light yellow background
        border: "FFC000", // C11: Gold left border
        icon: "warning", // Unicode: ⚠️
      },
      info: {
        fill: "D1ECF1", // C12: Light blue background
        border: "2E74B5", // C13: Blue left border
        icon: "info", // Unicode: ℹ️
      },
      tip: {
        fill: "E2F0D9", // C14: Light green background
        border: "548235", // C15: Green left border
        icon: "check", // Unicode: ✅
      },
    },
  },

  // ============================================================
  // PAGE LAYOUT (4 requirements: L01-L04)
  // ============================================================
  layout: {
    // Page margins in DXA (twentieths of a point)
    margins: {
      top: 720, // L01: 0.5 inch
      bottom: 720, // L02: 0.5 inch
      left: 1080, // L03: 0.75 inch
      right: 1080, // L04: 0.75 inch
    },

    // Page size (Letter default)
    pageSize: {
      width: 12240, // 8.5 inches
      height: 15840, // 11 inches
    },

    // Step/screenshot table columns
    stepColumns: {
      text: 55, // L05: Text column percentage
      image: 45, // L06: Image column percentage
    },

    // Cell padding in DXA
    cellPadding: {
      horizontal: 144, // L07: 0.1 inch
      vertical: 72, // L08: 0.05 inch
    },
  },

  // ============================================================
  // BORDERS (6 requirements: B01-B06)
  // ============================================================
  borders: {
    // Border sizes in eighths of a point
    sectionHeader: 12, // B01: 1.5pt bottom border
    calloutLeft: 32, // B02: 4pt left border on callouts
    tableBorder: 4, // B03: 0.5pt table grid

    // Border styles
    styles: {
      none: "NONE", // B04: Layout tables (step/screenshot)
      single: "SINGLE", // B05: Data tables, callouts
    },
  },

  // ============================================================
  // HEADER TABLE (8 requirements: H01-H08)
  // ============================================================
  headerTable: {
    row1: {
      background: "154747", // H01: Dark teal
      textColor: "FFFFFF", // H02: White
      fontSize: 32, // H03: 16pt bold
      alignment: "CENTER", // H04: Centered
      height: 720, // H05: 0.5 inch
    },
    row2: {
      background: "E8F4F4", // H06: Light teal (NOT dark teal!)
      textColor: "154747", // H07: Dark teal text
      fontSize: 20, // H08: 10pt regular
      height: 432, // 0.3 inch
    },
  },

  // ============================================================
  // TABLE COLUMN WIDTHS (9 requirements: TW01-TW09)
  // ============================================================
  tableWidths: {
    // Troubleshooting table: Issue/Cause/Resolution
    troubleshooting: {
      issue: 25, // TW01: 25%
      cause: 30, // TW02: 30%
      resolution: 45, // TW03: 45%
    },

    // Revision history: Date/Reviewer/Changes
    revisionHistory: {
      date: 25, // TW04: 25%
      reviewer: 25, // TW05: 25%
      changes: 50, // TW06: 50%
    },

    // Quick reference: 4 equal columns
    quickReference: [25, 25, 25, 25], // TW07-TW09

    // Step/screenshot layout
    stepLayout: {
      text: 55, // TW10: 55%
      image: 45, // TW11: 45%
    },

    // Figure Index appendix table
    figureIndex: {
      figureNum: 10, // TW12: 10% - Figure number column
      title: 20, // TW13: 20% - Title column
      description: 35, // TW14: 35% - Description column
      section: 20, // TW15: 20% - Section column
      step: 15, // TW16: 15% - Step reference column
    },
  },

  // ============================================================
  // SPACING (8 requirements: S01-S08)
  // ============================================================
  spacing: {
    // Paragraph spacing in twips (twentieths of a point)
    sectionBefore: 180, // S01: Before section headers
    sectionAfter: 60, // S02: After section headers
    stepAfter: 30, // S03: After main steps

    // Callout spacing
    calloutBefore: 120, // S04: 6pt before callouts
    calloutAfter: 120, // S05: 6pt after callouts
    calloutIndent: 216, // S06: 0.15 inch left/right indent

    // Table cell padding
    cellPaddingH: 144, // S07: 0.1 inch horizontal
    cellPaddingV: 72, // S08: 0.05 inch vertical
  },

  // ============================================================
  // CALLOUT ICONS
  // ============================================================
  calloutIcons: {
    critical: "⛔",
    warning: "⚠️",
    info: "ℹ️",
    tip: "✅",
  },

  // ============================================================
  // SCREENSHOT ANNOTATION CALLOUTS
  // ============================================================
  // Numbered callouts on screenshots (1), (2), (3) must have matching
  // colored text in the step descriptions
  screenshotCallouts: {
    // Default callout color for numbered annotations
    defaultColor: "154747", // Teal - matches TFCU branding

    // Text reference format in steps
    // Example: "Select the dropdown (Callout 1)" - "(Callout 1)" should be teal
    referenceFormat: "(Callout {n})",

    // The callout reference text MUST match the annotation color
    // If screenshot has teal (1), text "(Callout 1)" must be teal
    colorMatchingRule: "MANDATORY",

    // Styling for callout references in text
    referenceStyle: {
      font: "Calibri",
      size: 22, // 11pt - same as body text
      bold: true,
      // Color inherited from screenshot annotation color
      colorInherit: true,
    },

    // Available annotation colors (match screenshot annotation tool colors)
    annotationColors: {
      teal: "154747", // Primary - use for most callouts
      red: "C00000", // Critical/warning callouts
      blue: "2E74B5", // Informational callouts
      green: "548235", // Success/confirmation callouts
      gold: "FFC000", // Caution callouts
    },
  },

  // ============================================================
  // STRUCTURE REQUIREMENTS (8 requirements: ST01-ST08)
  // ============================================================
  structure: {
    requiredSections: [
      "header", // ST01: Header table always present
      "figureIndex", // ST02: Figure Index appendix (if screenshots exist)
      "revisionHistory", // ST03: Revision history always at end
    ],
    optionalSections: [
      "quickReference", // ST04: Only if critical info exists
      "tableOfContents", // ST05: Only if >3 pages
      "prerequisites", // ST06: Only if applicable
      "troubleshooting", // ST07: Only if issues documented
      "reports", // ST08: Only if related reports exist
    ],
    rules: {
      noEmptyRevisionRows: true, // ST08: Never generate empty rows
      defaultRevisionEntry: {
        // When no history provided
        changes: "Initial version",
      },
    },
    // ST09-ST11: Conditional validation rules (enforced by self-validation block)
    conditionalRules: {
      // ST09: Figure Index enforcement rule
      figureIndexRequired: {
        condition: "imageCount > 0",
        section: "figureIndex",
        errorMessage:
          "Figure Index appendix required when screenshots are present",
        placement: "before revisionHistory",
      },
      // ST10: Annotation pipeline enforcement
      annotationPipelineRequired: {
        condition: "rawImagesExist && !annotatedImagesExist",
        errorMessage:
          "Raw images detected but annotation pipeline not run. Execute screenshot_processor.py first.",
        blocking: true,
      },
    },
    // ST11: Dynamic date validation
    dateValidation: {
      rejectPastYears: true, // Reject if date year < current year
      exampleDate: "December 2024", // Known hardcoded example to reject
      errorMessage:
        "Stale or hardcoded date detected - use getCurrentDate() helper",
    },
  },

  // ============================================================
  // TOC HYPERLINK STYLING
  // ============================================================
  tocLinks: {
    color: "154747", // Dark teal
    underline: false, // No underline (not default blue)
    font: "Calibri",
    size: 20, // 10pt
  },

  // ============================================================
  // FOOTER CONFIGURATION
  // ============================================================
  footer: {
    font: "Calibri",
    size: 18, // 9pt
    color: "666666", // Gray
    tabStops: {
      left: 0, // Department name
      center: 5040, // Document title (3.5 inches)
      right: 10080, // Page number (7 inches)
    },
  },

  // ============================================================
  // DXA CONVERSION REFERENCE
  // ============================================================
  dxa: {
    inch: 1440,
    point: 20,
    // Common conversions
    "0.5in": 720,
    "0.75in": 1080,
    "0.25in": 360,
    "0.15in": 216,
    "0.1in": 144,
    "0.08in": 115,
    "0.05in": 72,
  },

  // Border eighths reference
  borderEighths: {
    "0.5pt": 4,
    "1pt": 8,
    "1.5pt": 12,
    "2pt": 16,
    "4pt": 32,
  },

  // ============================================================
  // CROSS-DOCUMENT FORMATTING (applies to ALL output documents)
  // ============================================================
  // These formatting rules apply uniformly across:
  // - Procedure documents
  // - Training assessments
  // - Quick reference cards
  // - Validation reports
  crossDocumentFormatting: {
    // All documents use same fonts
    fonts: {
      primary: "Calibri", // Body text, headers, callouts, questions
      monospace: "Consolas", // BINs, phone numbers, account numbers, code
    },

    // Brand colors apply to all documents
    brandColors: {
      headerBg: "154747", // Dark teal - all document headers
      headerText: "FFFFFF", // White text on headers
      accentBg: "E8F4F4", // Light teal - secondary headers
      accentText: "154747", // Dark teal text
      bodyText: "000000", // Black body text
      footerText: "666666", // Gray footer text
    },

    // Callout styling is consistent across all documents
    calloutColors: {
      critical: { bg: "F8D7DA", border: "C00000", icon: "⛔" },
      warning: { bg: "FFF2CC", border: "FFC000", icon: "⚠️" },
      info: { bg: "D1ECF1", border: "2E74B5", icon: "ℹ️" },
      tip: { bg: "E2F0D9", border: "548235", icon: "✅" },
    },

    // Intervention marker styling - MUST be consistent across all documents
    interventionMarkers: {
      font: "Calibri",
      size: 20, // 10pt
      color: "C00000", // Red
      bold: true,
      italics: true,
      highlight: "yellow",
    },

    // Document-specific overrides (where they differ)
    documentTypes: {
      procedure: {
        orientation: "portrait",
        pageSize: { width: 8.5, height: 11 },
        margins: { top: 0.5, bottom: 0.5, left: 0.75, right: 0.75 },
        bodyFontSize: 22, // 11pt
        headerFontSize: 32, // 16pt
      },
      assessment: {
        orientation: "portrait",
        pageSize: { width: 8.5, height: 11 },
        margins: { top: 0.5, bottom: 0.5, left: 0.75, right: 0.75 },
        bodyFontSize: 22, // 11pt (same as procedure)
        headerFontSize: 28, // 14pt
        questionFontSize: 22, // 11pt
        answerFontSize: 20, // 10pt
      },
      quickCard: {
        orientation: "landscape",
        pageSize: { width: 11, height: 8.5 },
        margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
        bodyFontSize: 20, // 10pt (smaller for density)
        headerFontSize: 24, // 12pt
        sectionHeaderFontSize: 24, // 12pt
      },
      validationReport: {
        orientation: "portrait",
        pageSize: { width: 8.5, height: 11 },
        margins: { top: 0.5, bottom: 0.5, left: 0.75, right: 0.75 },
        bodyFontSize: 20, // 10pt
        headerFontSize: 24, // 12pt
      },
    },
  },

  // ============================================================
  // FILENAME CONVENTIONS (FN01-FN08)
  // ============================================================
  // Enforces consistent output filenames across all sessions
  filenameConventions: {
    // FN01: Allowed departments (exact match required after sanitization)
    departments: [
      "Card_Services",
      "Member_Services",
      "Operations",
      "Lending",
      "Accounting",
      "Compliance",
      "IT",
      "HR",
      "Marketing",
    ],

    // FN02: Separator character
    separator: "_", // Underscores only, no spaces or hyphens

    // FN03: Date format
    dateFormat: "YYYYMM",

    // FN04-FN07: Output file patterns
    patterns: {
      procedure: "{Department}_{ProcedureName}_{YYYYMM}.docx",
      assessment: "{ProcedureName}_Assessment_{YYYYMM}.docx",
      quickCard: "{ProcedureName}_QuickCard_{YYYYMM}.docx",
      validationReport: "{ProcedureName}_ValidationReport.txt",
    },

    // FN08: Procedure name rules
    procedureNameRules: {
      maxLength: 50,
      allowedCharsPattern: "^[A-Za-z0-9_]+$", // Alphanumeric + underscore only
      titleCase: true,
    },

    // Department aliases for auto-correction
    departmentAliases: {
      "card services": "Card_Services",
      cardservices: "Card_Services",
      cards: "Card_Services",
      "member services": "Member_Services",
      memberservices: "Member_Services",
      members: "Member_Services",
      ops: "Operations",
      operation: "Operations",
      loans: "Lending",
      loan: "Lending",
      finance: "Accounting",
      acct: "Accounting",
      it: "IT",
      tech: "IT",
      technology: "IT",
      hr: "HR",
      "human resources": "HR",
      mktg: "Marketing",
      marketing: "Marketing",
    },
  },
};

// Freeze entire config to prevent accidental modification
function deepFreeze(obj) {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      deepFreeze(obj[key]);
    }
  });
  return Object.freeze(obj);
}

deepFreeze(SpecConfig);

// Export for use in validators and helpers
module.exports = { SpecConfig };
