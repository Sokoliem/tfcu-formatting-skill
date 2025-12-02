/**
 * TFCU Procedure Formatter - Validated Helper Functions
 *
 * This module provides generation-time validated versions of the
 * document helper functions. Each function uses SpecConfig for all
 * hardcoded values and accepts an optional ValidationContext parameter
 * to collect errors/warnings.
 *
 * Usage:
 *   const { createHeaderTable, createCalloutBox } = require('./validator/validated-helpers');
 *   const { ValidationContext } = require('./validator/validation-context');
 *
 *   const ctx = new ValidationContext({ mode: 'lenient' });
 *   const header = createHeaderTable(name, dept, date, ctx);
 *   console.log(ctx.getReport());
 */

const { SpecConfig } = require("./spec-config");
const { ValidationContext } = require("./validation-context");
const {
  CalloutValidationError,
  InputValidationError,
  StructureValidationError,
} = require("./validation-errors");

// Re-export SpecConfig for convenience
module.exports.SpecConfig = SpecConfig;

/**
 * Validated createHeaderTable
 * Ensures Row 1 uses dark teal and Row 2 uses LIGHT teal (not dark)
 *
 * @param {string} name - Document title
 * @param {string} department - Department name
 * @param {string} date - Effective date
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} Table configuration for docx-js
 */
function createHeaderTable(
  name,
  department,
  date,
  ctx = new ValidationContext(),
) {
  ctx.enterElement("HeaderTable");

  // Validate required inputs
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    ctx.addError(InputValidationError.missingRequired("name"));
  }
  if (!department || typeof department !== "string") {
    ctx.addError(InputValidationError.missingRequired("department"));
  }
  if (!date || typeof date !== "string") {
    ctx.addWarning({
      rule: "input",
      message: "Date not provided, using current month/year",
    });
    date = new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  const spec = SpecConfig.headerTable;
  const colors = SpecConfig.colors;

  // Build table configuration using SpecConfig values
  const tableConfig = {
    width: { size: 100, type: "pct" },
    rows: [
      // Row 1: Dark teal background (spec.row1.background)
      {
        children: [
          {
            columnSpan: 2,
            shading: { fill: spec.row1.background, type: "clear" },
            children: [
              {
                alignment: "center",
                spacing: { before: 80, after: 80 },
                children: [
                  {
                    text: name,
                    bold: true,
                    color: spec.row1.textColor, // White
                    size: spec.row1.fontSize, // 32 half-points (16pt)
                    font: SpecConfig.fonts.primary,
                  },
                ],
              },
            ],
          },
        ],
      },
      // Row 2: LIGHT teal background (NOT dark teal!)
      {
        children: [
          {
            width: { size: 50, type: "pct" },
            shading: { fill: spec.row2.background, type: "clear" }, // E8F4F4
            children: [
              {
                alignment: "left",
                spacing: { before: 40, after: 40 },
                children: [
                  {
                    text: department,
                    color: spec.row2.textColor, // 154747
                    size: spec.row2.fontSize, // 20 half-points (10pt)
                    font: SpecConfig.fonts.primary,
                  },
                ],
              },
            ],
          },
          {
            width: { size: 50, type: "pct" },
            shading: { fill: spec.row2.background, type: "clear" }, // E8F4F4
            children: [
              {
                alignment: "right",
                spacing: { before: 40, after: 40 },
                children: [
                  {
                    text: date,
                    color: spec.row2.textColor,
                    size: spec.row2.fontSize,
                    font: SpecConfig.fonts.primary,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  ctx.exitElement();
  return tableConfig;
}

/**
 * Validated createCalloutBox
 * Validates callout type and enforces spec colors
 *
 * @param {string} type - Callout type: CRITICAL, WARNING, NOTE/INFO, TIP
 * @param {string} text - Callout text content
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} Paragraph configuration for docx-js
 */
function createCalloutBox(type, text, ctx = new ValidationContext()) {
  ctx.enterElement(`CalloutBox[${type}]`);

  // Normalize and validate type
  const validTypes = ["CRITICAL", "WARNING", "NOTE", "INFO", "TIP"];
  const normalizedType = (type || "").toUpperCase();

  if (!validTypes.includes(normalizedType)) {
    ctx.addError(CalloutValidationError.invalidType(type, validTypes));
    ctx.exitElement();
    return null;
  }

  // Map INFO to NOTE (same styling)
  const mappedType =
    normalizedType === "INFO" ? "info" : normalizedType.toLowerCase();

  // Validate text
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    ctx.addError(
      new StructureValidationError("Callout must have text content", {
        type: normalizedType,
      }),
    );
  }

  // Get spec-enforced colors (cannot be overridden)
  const colors = SpecConfig.colors.callout[mappedType];
  const icon = SpecConfig.calloutIcons[mappedType];
  const spacing = SpecConfig.spacing;
  const borders = SpecConfig.borders;

  const calloutConfig = {
    shading: { fill: colors.fill, type: "clear" },
    border: {
      left: {
        style: "single",
        size: borders.calloutLeft, // 32 eighths = 4pt
        color: colors.border,
      },
    },
    indent: {
      left: spacing.calloutIndent, // 216 DXA = 0.15"
      right: spacing.calloutIndent,
    },
    spacing: {
      before: spacing.calloutBefore, // 120 twips = 6pt
      after: spacing.calloutAfter,
    },
    children: [
      {
        text: icon + " ",
        bold: true,
        size: SpecConfig.fontSizes.calloutText, // 20 half-points = 10pt
        font: SpecConfig.fonts.primary,
      },
      {
        text: text,
        size: SpecConfig.fontSizes.calloutText,
        font: SpecConfig.fonts.primary,
      },
    ],
  };

  ctx.exitElement();
  return calloutConfig;
}

/**
 * Validated createSectionHeader
 * Enforces sentence case warning and 1.5pt border
 *
 * @param {string} text - Section header text
 * @param {string} bookmarkId - Optional bookmark ID for TOC linking
 * @param {boolean} pageBreakBefore - Add page break before header
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} Paragraph configuration for docx-js
 */
function createSectionHeader(
  text,
  bookmarkId = null,
  pageBreakBefore = false,
  ctx = new ValidationContext(),
) {
  ctx.enterElement(`SectionHeader[${text}]`);

  // Validate text
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    ctx.addError(
      new StructureValidationError("Section header must have text", {
        bookmarkId,
      }),
    );
  }

  // Warn on ALL CAPS (spec says use sentence case)
  if (text && text === text.toUpperCase() && text.length > 3) {
    ctx.addWarning({
      rule: "typography-style",
      message: "Section headers should use sentence case, not ALL CAPS",
      actual: text,
      expected: "Sentence Case",
    });
  }

  const spec = SpecConfig;

  const headerConfig = {
    pageBreakBefore,
    spacing: {
      before: spec.spacing.sectionBefore, // 180 twips
      after: spec.spacing.sectionAfter, // 60 twips
    },
    border: {
      bottom: {
        style: "single",
        size: spec.borders.sectionHeader, // 12 eighths = 1.5pt
        color: spec.colors.primaryTeal,
      },
    },
    children: [
      {
        text: text,
        bold: true,
        size: spec.fontSizes.sectionHeader, // 28 half-points = 14pt
        font: spec.fonts.primary,
        color: spec.colors.primaryTeal,
        bookmark: bookmarkId,
      },
    ],
  };

  ctx.exitElement();
  return headerConfig;
}

/**
 * Validated createRevisionTable
 * Filters empty rows (spec requirement) and ensures minimum content
 *
 * @param {Array} revisions - Array of {date, reviewer, changes}
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} Table configuration for docx-js
 */
function createRevisionTable(revisions = [], ctx = new ValidationContext()) {
  ctx.enterElement("RevisionTable");

  const spec = SpecConfig;
  const widths = spec.tableWidths.revisionHistory;

  // CRITICAL: Filter out empty rows (spec requirement)
  const validRevisions = revisions.filter((rev) => {
    const hasContent =
      (rev.date && rev.date.trim()) ||
      (rev.reviewer && rev.reviewer.trim()) ||
      (rev.changes && rev.changes.trim());

    if (!hasContent) {
      ctx.addWarning({
        rule: "empty-revision",
        message: "Empty revision row detected and removed",
      });
      return false;
    }

    // Validate changes field is not empty
    if (!rev.changes || !rev.changes.trim()) {
      ctx.addError(
        new StructureValidationError("Revision row has empty Changes field", {
          revision: rev,
        }),
      );
    }

    return true;
  });

  // If no valid revisions, add default "Initial version" row
  if (validRevisions.length === 0) {
    validRevisions.push({
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      reviewer: "Author",
      changes: spec.structure.rules.defaultRevisionEntry.changes,
    });
  }

  const tableConfig = {
    width: { size: 100, type: "pct" },
    rows: [
      // Header row
      {
        children: [
          {
            width: { size: widths.date, type: "pct" },
            shading: { fill: spec.colors.primaryTeal, type: "clear" },
            children: [
              {
                alignment: "center",
                children: [
                  {
                    text: "Date Updated",
                    bold: true,
                    color: spec.colors.white,
                    size: spec.fontSizes.tableHeader,
                    font: spec.fonts.primary,
                  },
                ],
              },
            ],
          },
          {
            width: { size: widths.reviewer, type: "pct" },
            shading: { fill: spec.colors.primaryTeal, type: "clear" },
            children: [
              {
                alignment: "center",
                children: [
                  {
                    text: "Reviewed By",
                    bold: true,
                    color: spec.colors.white,
                    size: spec.fontSizes.tableHeader,
                    font: spec.fonts.primary,
                  },
                ],
              },
            ],
          },
          {
            width: { size: widths.changes, type: "pct" },
            shading: { fill: spec.colors.primaryTeal, type: "clear" },
            children: [
              {
                alignment: "center",
                children: [
                  {
                    text: "Changes Made",
                    bold: true,
                    color: spec.colors.white,
                    size: spec.fontSizes.tableHeader,
                    font: spec.fonts.primary,
                  },
                ],
              },
            ],
          },
        ],
      },
      // Data rows
      ...validRevisions.map((rev, idx) => ({
        children: [
          {
            width: { size: widths.date, type: "pct" },
            shading: {
              fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
              type: "clear",
            },
            children: [
              {
                children: [
                  {
                    text: rev.date || "",
                    size: spec.fontSizes.tableBody,
                    font: spec.fonts.primary,
                  },
                ],
              },
            ],
          },
          {
            width: { size: widths.reviewer, type: "pct" },
            shading: {
              fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
              type: "clear",
            },
            children: [
              {
                children: [
                  {
                    text: rev.reviewer || "",
                    size: spec.fontSizes.tableBody,
                    font: spec.fonts.primary,
                  },
                ],
              },
            ],
          },
          {
            width: { size: widths.changes, type: "pct" },
            shading: {
              fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
              type: "clear",
            },
            children: [
              {
                children: [
                  {
                    text: rev.changes || "",
                    size: spec.fontSizes.tableBody,
                    font: spec.fonts.primary,
                  },
                ],
              },
            ],
          },
        ],
      })),
    ],
  };

  ctx.exitElement();
  return tableConfig;
}

/**
 * Validated page margins
 * Returns spec-compliant margin values
 *
 * @returns {Object} Margin configuration for docx-js
 */
function getPageMargins() {
  return { ...SpecConfig.layout.margins };
}

/**
 * Get valid callout types
 * @returns {string[]} Array of valid types
 */
function getValidCalloutTypes() {
  return ["CRITICAL", "WARNING", "NOTE", "INFO", "TIP"];
}

module.exports = {
  createHeaderTable,
  createCalloutBox,
  createSectionHeader,
  createRevisionTable,
  getPageMargins,
  getValidCalloutTypes,
  SpecConfig,
};
