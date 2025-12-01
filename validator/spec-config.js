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
  // STRUCTURE REQUIREMENTS (8 requirements: ST01-ST08)
  // ============================================================
  structure: {
    requiredSections: [
      "header", // ST01: Header table always present
      "revisionHistory", // ST02: Revision history always at end
    ],
    optionalSections: [
      "quickReference", // ST03: Only if critical info exists
      "tableOfContents", // ST04: Only if >3 pages
      "prerequisites", // ST05: Only if applicable
      "troubleshooting", // ST06: Only if issues documented
      "reports", // ST07: Only if related reports exist
    ],
    rules: {
      noEmptyRevisionRows: true, // ST08: Never generate empty rows
      defaultRevisionEntry: {
        // When no history provided
        changes: "Initial version",
      },
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
