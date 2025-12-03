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
  FilenameValidationError,
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

/**
 * Validated createTableOfContents
 * Enforces inline horizontal format with clickable hyperlinks
 *
 * @param {Array} sections - Array of {id, name} for section links
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} Paragraph configuration for docx-js
 */
function createTableOfContents(sections = [], ctx = new ValidationContext()) {
  ctx.enterElement("TableOfContents");

  // Validate we have sections
  if (!sections || sections.length === 0) {
    ctx.addWarning({
      rule: "structure",
      message: "Table of contents has no sections",
    });
    ctx.exitElement();
    return null;
  }

  const spec = SpecConfig;

  // Build inline horizontal TOC (not table/vertical format)
  const tocChildren = [
    {
      text: "Contents: ",
      bold: true,
      size: spec.fontSizes.body,
      font: spec.fonts.primary,
    },
  ];

  sections.forEach((section, idx) => {
    // Validate section has required fields
    if (!section.id || !section.name) {
      ctx.addWarning({
        rule: "structure",
        message: `Section at index ${idx} missing id or name`,
        section,
      });
    }

    // Add hyperlink
    tocChildren.push({
      text: section.name,
      hyperlink: `#${section.id}`,
      color: spec.colors.primaryTeal,
      underline: false, // Spec: no underline
      size: spec.fontSizes.body,
      font: spec.fonts.primary,
    });

    // Add separator except for last item
    if (idx < sections.length - 1) {
      tocChildren.push({
        text: " • ",
        size: spec.fontSizes.body,
        font: spec.fonts.primary,
      });
    }
  });

  const tocConfig = {
    spacing: {
      before: spec.spacing.sectionBefore,
      after: spec.spacing.sectionAfter,
    },
    children: tocChildren,
  };

  ctx.exitElement();
  return tocConfig;
}

/**
 * Validated createStepWithScreenshot
 * Enforces 55/45 column widths for step tables
 *
 * @param {Object} step - Step object {number, text, substeps}
 * @param {Object} screenshot - Screenshot object {path, figureNumber, annotations}
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} Table configuration for docx-js
 */
function createStepWithScreenshot(
  step,
  screenshot = null,
  ctx = new ValidationContext(),
) {
  ctx.enterElement(`StepWithScreenshot[${step?.number}]`);

  const spec = SpecConfig;
  const widths = spec.tableWidths.stepLayout;

  // Validate step
  if (!step || !step.text) {
    ctx.addError(
      new StructureValidationError("Step must have text content", { step }),
    );
  }

  // Validate screenshot if provided
  if (screenshot && !screenshot.path && !screenshot.placeholder) {
    ctx.addWarning({
      rule: "structure",
      message: "Screenshot provided without path or placeholder",
      figureNumber: screenshot.figureNumber,
    });
  }

  // Build step text cell
  const stepContent = [
    {
      text: `${step?.number || "N"}. `,
      bold: true,
      size: spec.fontSizes.body,
      font: spec.fonts.primary,
    },
    {
      text: step?.text || "",
      size: spec.fontSizes.body,
      font: spec.fonts.primary,
    },
  ];

  // Add substeps if present
  if (step?.substeps && Array.isArray(step.substeps)) {
    step.substeps.forEach((substep, idx) => {
      stepContent.push({
        text: `\n   ${String.fromCharCode(97 + idx)}. ${substep}`,
        size: spec.fontSizes.substeps,
        font: spec.fonts.primary,
      });
    });
  }

  // Build screenshot cell
  let screenshotContent;
  if (screenshot?.path) {
    screenshotContent = [
      {
        type: "image",
        src: screenshot.path,
        width: spec.layout.screenshotMaxWidth,
        alignment: "right",
      },
      {
        text: `Figure ${screenshot.figureNumber || "N"}`,
        italics: true,
        size: spec.fontSizes.footer,
        alignment: "center",
      },
    ];
  } else if (screenshot?.placeholder) {
    screenshotContent = [
      {
        text: "[Screenshot Needed]",
        bold: true,
        size: spec.fontSizes.body,
        font: spec.fonts.primary,
      },
      {
        text: `\nShow: ${screenshot.placeholder.show || ""}`,
        italics: true,
        size: spec.fontSizes.substeps,
      },
      {
        text: `\nFocus: ${screenshot.placeholder.focus || ""}`,
        italics: true,
        size: spec.fontSizes.substeps,
      },
    ];
  } else {
    // No screenshot - single column step
    ctx.exitElement();
    return {
      spacing: {
        before: spec.spacing.stepBefore,
        after: spec.spacing.stepAfter,
      },
      children: stepContent,
    };
  }

  const tableConfig = {
    width: { size: 100, type: "pct" },
    rows: [
      {
        children: [
          {
            width: { size: widths.text, type: "pct" }, // 55%
            verticalAlign: "top",
            children: [
              {
                alignment: "left",
                children: stepContent,
              },
            ],
          },
          {
            width: { size: widths.screenshot, type: "pct" }, // 45%
            verticalAlign: "top",
            children: [
              {
                alignment: "right",
                children: screenshotContent,
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
 * Validated createQuickReferenceBox
 * Enforces 4-column teal format
 *
 * @param {Array} items - Array of {label, value} pairs
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} Table configuration for docx-js
 */
function createQuickReferenceBox(items = [], ctx = new ValidationContext()) {
  ctx.enterElement("QuickReferenceBox");

  const spec = SpecConfig;
  const widths = spec.tableWidths.quickReference;

  // Validate items
  if (!items || items.length === 0) {
    ctx.addWarning({
      rule: "structure",
      message: "Quick Reference Box has no items",
    });
    ctx.exitElement();
    return null;
  }

  // Build 4-column layout (2 label-value pairs per row)
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    const item1 = items[i];
    const item2 = items[i + 1];

    rows.push({
      children: [
        {
          width: { size: widths.column, type: "pct" }, // 25%
          shading: { fill: spec.colors.lightTeal, type: "clear" },
          children: [
            {
              children: [
                {
                  text: item1?.label || "",
                  bold: true,
                  size: spec.fontSizes.tableBody,
                  font: spec.fonts.primary,
                  color: spec.colors.primaryTeal,
                },
              ],
            },
          ],
        },
        {
          width: { size: widths.column, type: "pct" }, // 25%
          shading: { fill: spec.colors.lightTeal, type: "clear" },
          children: [
            {
              children: [
                {
                  text: item1?.value || "",
                  size: spec.fontSizes.tableBody,
                  font: spec.fonts.primary,
                },
              ],
            },
          ],
        },
        {
          width: { size: widths.column, type: "pct" }, // 25%
          shading: { fill: spec.colors.lightTeal, type: "clear" },
          children: [
            {
              children: [
                {
                  text: item2?.label || "",
                  bold: true,
                  size: spec.fontSizes.tableBody,
                  font: spec.fonts.primary,
                  color: spec.colors.primaryTeal,
                },
              ],
            },
          ],
        },
        {
          width: { size: widths.column, type: "pct" }, // 25%
          shading: { fill: spec.colors.lightTeal, type: "clear" },
          children: [
            {
              children: [
                {
                  text: item2?.value || "",
                  size: spec.fontSizes.tableBody,
                  font: spec.fonts.primary,
                },
              ],
            },
          ],
        },
      ],
    });
  }

  const tableConfig = {
    width: { size: 100, type: "pct" },
    rows,
  };

  ctx.exitElement();
  return tableConfig;
}

/**
 * Validated createTroubleshootingTable
 * Enforces 25/30/45 column widths
 *
 * @param {Array} entries - Array of {issue, cause, resolution}
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} Table configuration for docx-js
 */
function createTroubleshootingTable(
  entries = [],
  ctx = new ValidationContext(),
) {
  ctx.enterElement("TroubleshootingTable");

  const spec = SpecConfig;
  const widths = spec.tableWidths.troubleshooting;

  // Validate entries
  if (!entries || entries.length === 0) {
    ctx.addWarning({
      rule: "structure",
      message: "Troubleshooting table has no entries",
    });
    ctx.exitElement();
    return null;
  }

  const tableConfig = {
    width: { size: 100, type: "pct" },
    rows: [
      // Header row
      {
        children: [
          {
            width: { size: widths.issue, type: "pct" }, // 25%
            shading: { fill: spec.colors.primaryTeal, type: "clear" },
            children: [
              {
                alignment: "center",
                children: [
                  {
                    text: "Issue",
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
            width: { size: widths.cause, type: "pct" }, // 30%
            shading: { fill: spec.colors.primaryTeal, type: "clear" },
            children: [
              {
                alignment: "center",
                children: [
                  {
                    text: "Possible Cause",
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
            width: { size: widths.resolution, type: "pct" }, // 45%
            shading: { fill: spec.colors.primaryTeal, type: "clear" },
            children: [
              {
                alignment: "center",
                children: [
                  {
                    text: "Resolution",
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
      ...entries.map((entry, idx) => ({
        children: [
          {
            width: { size: widths.issue, type: "pct" },
            shading: {
              fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
              type: "clear",
            },
            children: [
              {
                children: [
                  {
                    text: entry.issue || "",
                    size: spec.fontSizes.tableBody,
                    font: spec.fonts.primary,
                  },
                ],
              },
            ],
          },
          {
            width: { size: widths.cause, type: "pct" },
            shading: {
              fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
              type: "clear",
            },
            children: [
              {
                children: [
                  {
                    text: entry.cause || "",
                    size: spec.fontSizes.tableBody,
                    font: spec.fonts.primary,
                  },
                ],
              },
            ],
          },
          {
            width: { size: widths.resolution, type: "pct" },
            shading: {
              fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
              type: "clear",
            },
            children: [
              {
                children: [
                  {
                    text: entry.resolution || "",
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
 * Validated createFigureIndexAppendix
 * Creates Figure Index appendix page with all screenshots listed in a table
 *
 * @param {Array} figures - Array of figure objects from figure_registry.json
 *   Each figure: { figure_number, title, description, section, step_reference, annotated_image }
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} Section configuration with header and table for docx-js
 */
function createFigureIndexAppendix(
  figures = [],
  ctx = new ValidationContext(),
) {
  ctx.enterElement("FigureIndexAppendix");

  const spec = SpecConfig;
  const widths = spec.tableWidths.figureIndex;

  // If no figures, return null (skip appendix)
  if (!figures || figures.length === 0) {
    ctx.addWarning({
      rule: "structure",
      message:
        "No figures provided for Figure Index appendix - section skipped",
    });
    ctx.exitElement();
    return null;
  }

  // Build header row
  const headerCells = [
    { text: "Fig #", width: widths.figureNum },
    { text: "Title", width: widths.title },
    { text: "Description", width: widths.description },
    { text: "Section", width: widths.section },
    { text: "Step", width: widths.step },
  ].map((col) => ({
    width: { size: col.width, type: "pct" },
    shading: { fill: spec.colors.primaryTeal, type: "clear" },
    children: [
      {
        alignment: "center",
        children: [
          {
            text: col.text,
            bold: true,
            color: spec.colors.white,
            size: spec.fontSizes.tableHeader,
            font: spec.fonts.primary,
          },
        ],
      },
    ],
  }));

  // Build data rows
  const dataRows = figures.map((fig, idx) => {
    // Validate figure has required fields
    if (!fig.figure_number) {
      ctx.addWarning({
        rule: "structure",
        message: `Figure at index ${idx} missing figure_number`,
        figure: fig,
      });
    }

    const figNum = fig.figure_number || fig.number || idx + 1;
    const title = fig.title || `Figure ${figNum}`;
    const description = fig.description || "Screenshot";
    const section = fig.section || "-";
    const step = fig.step_reference || fig.step || "-";

    // Truncate long descriptions
    const truncDesc =
      description.length > 60
        ? description.substring(0, 57) + "..."
        : description;

    return {
      children: [
        {
          width: { size: widths.figureNum, type: "pct" },
          shading: {
            fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
            type: "clear",
          },
          children: [
            {
              alignment: "center",
              children: [
                {
                  text: String(figNum),
                  size: spec.fontSizes.tableBody,
                  font: spec.fonts.primary,
                },
              ],
            },
          ],
        },
        {
          width: { size: widths.title, type: "pct" },
          shading: {
            fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
            type: "clear",
          },
          children: [
            {
              children: [
                {
                  text: title,
                  bold: true,
                  size: spec.fontSizes.tableBody,
                  font: spec.fonts.primary,
                },
              ],
            },
          ],
        },
        {
          width: { size: widths.description, type: "pct" },
          shading: {
            fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
            type: "clear",
          },
          children: [
            {
              children: [
                {
                  text: truncDesc,
                  size: spec.fontSizes.tableBody,
                  font: spec.fonts.primary,
                },
              ],
            },
          ],
        },
        {
          width: { size: widths.section, type: "pct" },
          shading: {
            fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
            type: "clear",
          },
          children: [
            {
              children: [
                {
                  text: section,
                  size: spec.fontSizes.tableBody,
                  font: spec.fonts.primary,
                },
              ],
            },
          ],
        },
        {
          width: { size: widths.step, type: "pct" },
          shading: {
            fill: idx % 2 === 0 ? spec.colors.white : spec.colors.lightGray,
            type: "clear",
          },
          children: [
            {
              alignment: "center",
              children: [
                {
                  text: step,
                  size: spec.fontSizes.tableBody,
                  font: spec.fonts.primary,
                },
              ],
            },
          ],
        },
      ],
    };
  });

  // Return complete appendix section config
  const appendixConfig = {
    // Section header with page break before
    header: {
      pageBreakBefore: true,
      spacing: {
        before: spec.spacing.sectionBefore,
        after: spec.spacing.sectionAfter,
      },
      border: {
        bottom: {
          style: "single",
          size: spec.borders.sectionHeader,
          color: spec.colors.primaryTeal,
        },
      },
      children: [
        {
          text: "Figure Index",
          bold: true,
          size: spec.fontSizes.sectionHeader,
          font: spec.fonts.primary,
          color: spec.colors.primaryTeal,
          bookmark: "figure-index",
        },
      ],
    },
    // Summary paragraph
    summary: {
      spacing: { before: 60, after: 120 },
      children: [
        {
          text: `This procedure contains ${figures.length} figure${figures.length !== 1 ? "s" : ""}.`,
          size: spec.fontSizes.bodyText,
          font: spec.fonts.primary,
          italics: true,
        },
      ],
    },
    // Table configuration
    table: {
      width: { size: 100, type: "pct" },
      rows: [{ children: headerCells }, ...dataRows],
    },
    // Metadata for validation
    metadata: {
      totalFigures: figures.length,
      sectionsWithFigures: [
        ...new Set(figures.map((f) => f.section).filter(Boolean)),
      ],
    },
  };

  ctx.exitElement();
  return appendixConfig;
}

/**
 * Create validation report
 * Generates a text report of all validation findings
 *
 * @param {ValidationContext} ctx - Validation context with collected errors/warnings
 * @param {Object} coverage - Coverage analysis results
 * @param {Array} terminologyCorrections - List of terminology auto-corrections
 * @param {Object} markers - Remaining intervention markers by type
 * @returns {string} Validation report text
 */
function createValidationReport(
  ctx,
  coverage = {},
  terminologyCorrections = [],
  markers = {},
) {
  const report = [];
  const timestamp = new Date().toISOString();

  report.push(
    "═══════════════════════════════════════════════════════════════",
  );
  report.push("TFCU PROCEDURE VALIDATION REPORT");
  report.push(`Generated: ${timestamp}`);
  report.push(`Spec Version: ${SpecConfig.version || "6.0.4"}`);
  report.push(
    "═══════════════════════════════════════════════════════════════",
  );
  report.push("");

  // Schema compliance
  report.push("SCHEMA COMPLIANCE");
  report.push(
    "───────────────────────────────────────────────────────────────",
  );
  const errors = ctx.getErrors ? ctx.getErrors() : [];
  const warnings = ctx.getWarnings ? ctx.getWarnings() : [];
  report.push(`Errors: ${errors.length}`);
  report.push(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    report.push("");
    report.push("Errors:");
    errors.forEach((e) => report.push(`  ✗ ${e.message || e}`));
  }

  if (warnings.length > 0) {
    report.push("");
    report.push("Warnings:");
    warnings.forEach((w) => report.push(`  ⚠ ${w.message || w}`));
  }

  report.push("");

  // Coverage analysis
  report.push("COVERAGE ANALYSIS");
  report.push(
    "───────────────────────────────────────────────────────────────",
  );
  report.push(`Overall coverage: ${coverage.percentage || 0}%`);
  report.push(
    `Critical steps covered: ${coverage.criticalCovered || 0}/${coverage.criticalTotal || 0}`,
  );

  if (coverage.warnings && coverage.warnings.length > 0) {
    report.push("");
    report.push("Coverage warnings:");
    coverage.warnings.forEach((w) => report.push(`  ⚠ ${w}`));
  }

  report.push("");

  // Terminology corrections
  report.push("TERMINOLOGY CORRECTIONS");
  report.push(
    "───────────────────────────────────────────────────────────────",
  );
  report.push(`Auto-corrections applied: ${terminologyCorrections.length}`);

  if (terminologyCorrections.length > 0) {
    terminologyCorrections.forEach((c) =>
      report.push(`  ✓ "${c.original}" → "${c.corrected}"`),
    );
  }

  report.push("");

  // Remaining markers
  report.push("REMAINING MARKERS");
  report.push(
    "───────────────────────────────────────────────────────────────",
  );
  const markerTypes = Object.keys(markers);

  if (markerTypes.length === 0) {
    report.push("No intervention markers remaining.");
  } else {
    markerTypes.forEach((type) => {
      report.push(`  ${type}: ${markers[type]}`);
    });
    report.push("");
    report.push("Search for red italic text in documents to find all markers.");
  }

  report.push("");
  report.push(
    "═══════════════════════════════════════════════════════════════",
  );
  report.push("END OF REPORT");
  report.push(
    "═══════════════════════════════════════════════════════════════",
  );

  return report.join("\n");
}

// ============================================================
// FILENAME GENERATION & VALIDATION
// ============================================================

/**
 * Sanitize department name to match spec-config conventions
 * @param {string} dept - Raw department input
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} { sanitized: string, wasChanged: boolean, isValid: boolean }
 */
function sanitizeDepartment(dept, ctx = new ValidationContext()) {
  if (!dept || typeof dept !== "string") {
    ctx.addError(InputValidationError.missingRequired("department"));
    return { sanitized: "", wasChanged: false, isValid: false };
  }

  const config = SpecConfig.filenameConventions;
  const original = dept.trim();
  const lowerKey = original.toLowerCase().replace(/[^a-z]/g, "");

  // Check if it's already a valid department
  if (config.departments.includes(original)) {
    return { sanitized: original, wasChanged: false, isValid: true };
  }

  // Check aliases for auto-correction
  const alias = config.departmentAliases[original.toLowerCase()];
  if (alias) {
    ctx.addWarning(
      FilenameValidationError.departmentCorrected(original, alias),
    );
    return { sanitized: alias, wasChanged: true, isValid: true };
  }

  // Check aliases by normalized key
  const aliasKey = Object.keys(config.departmentAliases).find(
    (k) => k.replace(/[^a-z]/g, "") === lowerKey,
  );
  if (aliasKey) {
    const corrected = config.departmentAliases[aliasKey];
    ctx.addWarning(
      FilenameValidationError.departmentCorrected(original, corrected),
    );
    return { sanitized: corrected, wasChanged: true, isValid: true };
  }

  // Try to match partial department names
  const partialMatch = config.departments.find(
    (d) =>
      d.toLowerCase().replace(/_/g, "").includes(lowerKey) ||
      lowerKey.includes(d.toLowerCase().replace(/_/g, "")),
  );
  if (partialMatch) {
    ctx.addWarning(
      FilenameValidationError.departmentCorrected(original, partialMatch),
    );
    return { sanitized: partialMatch, wasChanged: true, isValid: true };
  }

  // Invalid department - can't auto-correct
  ctx.addError(
    FilenameValidationError.invalidDepartment(original, config.departments),
  );
  return {
    sanitized: original.replace(/\s+/g, "_"),
    wasChanged: true,
    isValid: false,
  };
}

/**
 * Sanitize procedure name to match spec-config conventions
 * @param {string} name - Raw procedure name
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} { sanitized: string, wasChanged: boolean }
 */
function sanitizeProcedureName(name, ctx = new ValidationContext()) {
  if (!name || typeof name !== "string") {
    ctx.addError(InputValidationError.missingRequired("procedureName"));
    return { sanitized: "", wasChanged: false };
  }

  const original = name.trim();
  const config = SpecConfig.filenameConventions.procedureNameRules;

  let sanitized = original
    .replace(/\s+/g, "_") // Spaces → underscores
    .replace(/-/g, "_") // Hyphens → underscores
    .replace(/[^A-Za-z0-9_]/g, "") // Remove special chars
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_|_$/g, ""); // Trim leading/trailing underscores

  // Apply title case
  if (config.titleCase) {
    sanitized = sanitized
      .split("_")
      .map((word) =>
        word.length > 0
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : "",
      )
      .filter((w) => w.length > 0)
      .join("_");
  }

  // Enforce max length
  if (sanitized.length > config.maxLength) {
    sanitized = sanitized.substring(0, config.maxLength);
    // Don't cut in the middle of a word
    const lastUnderscore = sanitized.lastIndexOf("_");
    if (lastUnderscore > config.maxLength * 0.7) {
      sanitized = sanitized.substring(0, lastUnderscore);
    }
  }

  const wasChanged = sanitized !== original;
  if (wasChanged) {
    ctx.addWarning(
      FilenameValidationError.procedureNameSanitized(original, sanitized),
    );
  }

  return { sanitized, wasChanged };
}

/**
 * Get current date in YYYYMM format
 * @returns {string} Date string in YYYYMM format
 */
function getCurrentDateYYYYMM() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

/**
 * Generate standardized filename for output file
 * @param {string} type - 'procedure' | 'assessment' | 'quickCard' | 'validationReport'
 * @param {string} department - Department name (will be validated and sanitized)
 * @param {string} procedureName - Procedure name (will be sanitized)
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} { filename: string, department: string, procedureName: string, date: string, isValid: boolean }
 */
function generateFilename(
  type,
  department,
  procedureName,
  ctx = new ValidationContext(),
) {
  ctx.enterElement(`Filename:${type}`);

  const config = SpecConfig.filenameConventions;

  // Validate type
  if (!config.patterns[type]) {
    ctx.addError(
      new InputValidationError(
        "type",
        `Invalid filename type. Must be one of: ${Object.keys(config.patterns).join(", ")}`,
        type,
      ),
    );
    return {
      filename: "",
      department: "",
      procedureName: "",
      date: "",
      isValid: false,
    };
  }

  // Sanitize inputs
  const deptResult = sanitizeDepartment(department, ctx);
  const nameResult = sanitizeProcedureName(procedureName, ctx);
  const dateStr = getCurrentDateYYYYMM();

  // Generate filename from pattern
  const pattern = config.patterns[type];
  const filename = pattern
    .replace("{Department}", deptResult.sanitized)
    .replace("{ProcedureName}", nameResult.sanitized)
    .replace("{YYYYMM}", dateStr);

  ctx.exitElement();

  return {
    filename,
    department: deptResult.sanitized,
    procedureName: nameResult.sanitized,
    date: dateStr,
    isValid: deptResult.isValid && nameResult.sanitized.length > 0,
  };
}

/**
 * Generate all filenames for the output bundle
 * @param {string} department - Department name
 * @param {string} procedureName - Procedure name
 * @param {ValidationContext} ctx - Optional validation context
 * @returns {Object} { procedure, assessment, quickCard, validationReport, isValid }
 */
function generateOutputBundle(
  department,
  procedureName,
  ctx = new ValidationContext(),
) {
  ctx.enterElement("OutputBundle");

  // Sanitize once and reuse
  const deptResult = sanitizeDepartment(department, ctx);
  const nameResult = sanitizeProcedureName(procedureName, ctx);
  const dateStr = getCurrentDateYYYYMM();

  const config = SpecConfig.filenameConventions;

  const bundle = {
    procedure: config.patterns.procedure
      .replace("{Department}", deptResult.sanitized)
      .replace("{ProcedureName}", nameResult.sanitized)
      .replace("{YYYYMM}", dateStr),
    assessment: config.patterns.assessment
      .replace("{ProcedureName}", nameResult.sanitized)
      .replace("{YYYYMM}", dateStr),
    quickCard: config.patterns.quickCard
      .replace("{ProcedureName}", nameResult.sanitized)
      .replace("{YYYYMM}", dateStr),
    validationReport: config.patterns.validationReport.replace(
      "{ProcedureName}",
      nameResult.sanitized,
    ),
    // Include sanitized values for reference
    department: deptResult.sanitized,
    procedureName: nameResult.sanitized,
    date: dateStr,
    isValid: deptResult.isValid && nameResult.sanitized.length > 0,
  };

  ctx.exitElement();

  return bundle;
}

/**
 * Get list of valid departments from spec-config
 * @returns {string[]} Array of valid department names
 */
function getValidDepartments() {
  return [...SpecConfig.filenameConventions.departments];
}

module.exports = {
  createHeaderTable,
  createCalloutBox,
  createSectionHeader,
  createRevisionTable,
  createTableOfContents,
  createStepWithScreenshot,
  createQuickReferenceBox,
  createTroubleshootingTable,
  createFigureIndexAppendix,
  createValidationReport,
  getPageMargins,
  getValidCalloutTypes,
  // Filename generation & validation
  sanitizeDepartment,
  sanitizeProcedureName,
  getCurrentDateYYYYMM,
  generateFilename,
  generateOutputBundle,
  getValidDepartments,
  SpecConfig,
};
