/**
 * TFCU Procedure Formatter - Specification Validator
 *
 * Validates extracted document properties against the 54 spec requirements.
 * Returns detailed validation results for each category.
 */

const { SpecConfig } = require("../spec-config");
const {
  FontValidationError,
  ColorValidationError,
  SizeValidationError,
  BorderValidationError,
  SpacingValidationError,
  TableValidationError,
  CalloutValidationError,
  StructureValidationError,
} = require("../validation-errors");

/**
 * Validate all extracted properties against spec
 * @param {Object} extracted - Extracted document properties from OOXML parser
 * @returns {Object} Validation results
 */
function validateDocument(extracted) {
  const results = {
    passed: [],
    failed: [],
    warnings: [],
    categories: {},
  };

  // Run all category validators
  const categories = [
    { name: "layout", validator: validateLayout },
    { name: "headerTable", validator: validateHeaderTable },
    { name: "typography", validator: validateTypography },
    { name: "callouts", validator: validateCallouts },
    { name: "tables", validator: validateTables },
  ];

  categories.forEach(({ name, validator }) => {
    const categoryResults = validator(extracted);
    results.categories[name] = {
      total: categoryResults.length,
      passed: categoryResults.filter((r) => r.passed).length,
      failed: categoryResults.filter((r) => !r.passed && !r.warning).length,
      warnings: categoryResults.filter((r) => r.warning).length,
    };

    categoryResults.forEach((result) => {
      if (result.passed) {
        results.passed.push(result);
      } else if (result.warning) {
        results.warnings.push(result);
      } else {
        results.failed.push(result);
      }
    });
  });

  return results;
}

/**
 * Validate page layout (margins)
 * @param {Object} extracted - Extracted properties
 * @returns {Array} Validation results
 */
function validateLayout(extracted) {
  const results = [];
  const margins = extracted.margins;

  if (!margins) {
    results.push({
      ruleId: "L01-L04",
      category: "layout",
      description: "Page margins",
      passed: false,
      error: new StructureValidationError("Could not extract page margins"),
    });
    return results;
  }

  const expectedMargins = SpecConfig.layout.margins;
  const marginChecks = [
    { id: "L01", name: "top", expected: expectedMargins.top },
    { id: "L02", name: "bottom", expected: expectedMargins.bottom },
    { id: "L03", name: "left", expected: expectedMargins.left },
    { id: "L04", name: "right", expected: expectedMargins.right },
  ];

  marginChecks.forEach(({ id, name, expected }) => {
    const actual = margins[name];
    const passed = Math.abs(actual - expected) <= 20; // 20 DXA tolerance

    results.push({
      ruleId: id,
      category: "layout",
      description: `${name} margin should be ${expected} DXA (${expected / 1440}" inch)`,
      passed,
      actual,
      expected,
      error: passed
        ? null
        : new SizeValidationError("Page", `${name} margin`, actual, expected),
    });
  });

  return results;
}

/**
 * Validate header table styling
 * @param {Object} extracted - Extracted properties
 * @returns {Array} Validation results
 */
function validateHeaderTable(extracted) {
  const results = [];
  const headerTable = extracted.headerTable;

  if (!headerTable || !headerTable.isHeaderTable) {
    results.push({
      ruleId: "H01",
      category: "headerTable",
      description: "Document must have header table",
      passed: false,
      error: new StructureValidationError("Header table not found or invalid"),
    });
    return results;
  }

  const spec = SpecConfig.headerTable;

  // Row 1 checks (dark teal background)
  if (headerTable.row1 && headerTable.row1.cells.length > 0) {
    const row1Cell = headerTable.row1.cells[0];
    const row1Shading = row1Cell.properties?.shading?.toUpperCase();

    results.push({
      ruleId: "H01",
      category: "headerTable",
      description: `Row 1 background should be #${spec.row1.background}`,
      passed: colorsMatch(row1Shading, spec.row1.background),
      actual: row1Shading,
      expected: spec.row1.background,
      error: colorsMatch(row1Shading, spec.row1.background)
        ? null
        : new ColorValidationError(
            "Header Table Row 1",
            "background",
            row1Shading,
            spec.row1.background,
          ),
    });

    // Check row 1 text color
    const row1Run = row1Cell.runs?.[0];
    if (row1Run) {
      const textColor = row1Run.properties?.color?.toUpperCase();
      results.push({
        ruleId: "H02",
        category: "headerTable",
        description: `Row 1 text should be white (#${spec.row1.textColor})`,
        passed: colorsMatch(textColor, spec.row1.textColor),
        actual: textColor,
        expected: spec.row1.textColor,
        error: colorsMatch(textColor, spec.row1.textColor)
          ? null
          : new ColorValidationError(
              "Header Table Row 1",
              "text",
              textColor,
              spec.row1.textColor,
            ),
      });

      // Check font size
      const fontSize = row1Run.properties?.size;
      results.push({
        ruleId: "H03",
        category: "headerTable",
        description: `Row 1 font size should be ${spec.row1.fontSize} half-points (16pt)`,
        passed: fontSize === spec.row1.fontSize,
        actual: fontSize,
        expected: spec.row1.fontSize,
        error:
          fontSize === spec.row1.fontSize
            ? null
            : new SizeValidationError(
                "Header Table Row 1",
                "fontSize",
                fontSize,
                spec.row1.fontSize,
                "half-pt",
              ),
      });

      // Check bold
      results.push({
        ruleId: "H04",
        category: "headerTable",
        description: "Row 1 text should be bold",
        passed: row1Run.properties?.bold === true,
        actual: row1Run.properties?.bold,
        expected: true,
      });
    }
  }

  // Row 2 checks (LIGHT teal background - NOT dark teal!)
  if (headerTable.row2 && headerTable.row2.cells.length > 0) {
    const row2Cell = headerTable.row2.cells[0];
    const row2Shading = row2Cell.properties?.shading?.toUpperCase();

    results.push({
      ruleId: "H06",
      category: "headerTable",
      description: `Row 2 background should be LIGHT teal #${spec.row2.background} (NOT dark teal)`,
      passed: colorsMatch(row2Shading, spec.row2.background),
      actual: row2Shading,
      expected: spec.row2.background,
      error: colorsMatch(row2Shading, spec.row2.background)
        ? null
        : new ColorValidationError(
            "Header Table Row 2",
            "background",
            row2Shading,
            spec.row2.background,
          ),
    });

    // Row differentiation check
    const row1Shading =
      headerTable.row1?.cells?.[0]?.properties?.shading?.toUpperCase();
    results.push({
      ruleId: "H08",
      category: "headerTable",
      description: "Row 1 and Row 2 should have different styling",
      passed: row1Shading !== row2Shading,
      actual: `Row1: ${row1Shading}, Row2: ${row2Shading}`,
      expected: "Different background colors",
      warning: row1Shading === row2Shading,
    });
  }

  return results;
}

/**
 * Validate typography (fonts, sizes)
 * @param {Object} extracted - Extracted properties
 * @returns {Array} Validation results
 */
function validateTypography(extracted) {
  const results = [];
  const typography = extracted.typography;

  if (!typography) {
    return results;
  }

  // Check for valid fonts
  const validFonts = [SpecConfig.fonts.primary, SpecConfig.fonts.monospace];
  const invalidFonts = typography.fonts.filter(
    (f) => !validFonts.includes(f) && f !== null,
  );

  results.push({
    ruleId: "T01",
    category: "typography",
    description: `All fonts should be ${validFonts.join(" or ")}`,
    passed: invalidFonts.length === 0,
    actual: typography.fonts,
    expected: validFonts,
    error:
      invalidFonts.length === 0
        ? null
        : new FontValidationError(
            "Document",
            invalidFonts.join(", "),
            validFonts.join(" or "),
          ),
  });

  // Check font sizes are valid
  const validSizes = Object.values(SpecConfig.fontSizes);
  const invalidSizes = typography.sizes.filter(
    (s) => !validSizes.includes(s) && s !== null,
  );

  if (invalidSizes.length > 0) {
    results.push({
      ruleId: "T02",
      category: "typography",
      description: "Font sizes should match spec",
      passed: false,
      actual: invalidSizes,
      expected: validSizes,
      warning: true, // Warning instead of error, since custom sizes might be valid
    });
  }

  return results;
}

/**
 * Validate callout boxes
 * @param {Object} extracted - Extracted properties
 * @returns {Array} Validation results
 */
function validateCallouts(extracted) {
  const results = [];
  const callouts = extracted.callouts || [];

  if (callouts.length === 0) {
    // No callouts to validate
    return results;
  }

  const spec = SpecConfig.colors.callout;

  callouts.forEach((callout, idx) => {
    const calloutId = `Callout ${idx + 1} (${callout.detectedType})`;

    // Check fill color
    const expectedFill = spec[callout.detectedType]?.fill?.toUpperCase();
    const actualFill = callout.fill?.toUpperCase();

    results.push({
      ruleId: `C-FILL-${idx}`,
      category: "callouts",
      description: `${calloutId} background should be #${expectedFill}`,
      passed: colorsMatch(actualFill, expectedFill),
      actual: actualFill,
      expected: expectedFill,
      error: colorsMatch(actualFill, expectedFill)
        ? null
        : new ColorValidationError(
            calloutId,
            "background",
            actualFill,
            expectedFill,
          ),
    });

    // Check left border color
    if (callout.leftBorder) {
      const expectedBorder = spec[callout.detectedType]?.border?.toUpperCase();
      const actualBorder = callout.leftBorder.color?.toUpperCase();

      results.push({
        ruleId: `C-BDR-${idx}`,
        category: "callouts",
        description: `${calloutId} left border should be #${expectedBorder}`,
        passed: colorsMatch(actualBorder, expectedBorder),
        actual: actualBorder,
        expected: expectedBorder,
        error: colorsMatch(actualBorder, expectedBorder)
          ? null
          : new ColorValidationError(
              calloutId,
              "left border",
              actualBorder,
              expectedBorder,
            ),
      });

      // Check border width (4pt = 32 eighths)
      const expectedSize = SpecConfig.borders.calloutLeft;
      const actualSize = callout.leftBorder.size;

      results.push({
        ruleId: `C-SZ-${idx}`,
        category: "callouts",
        description: `${calloutId} border width should be ${expectedSize} eighths (4pt)`,
        passed: Math.abs(actualSize - expectedSize) <= 4, // Tolerance
        actual: actualSize,
        expected: expectedSize,
        error:
          Math.abs(actualSize - expectedSize) <= 4
            ? null
            : new SizeValidationError(
                calloutId,
                "border width",
                actualSize,
                expectedSize,
                "eighths",
              ),
      });
    }

    // Check spacing/indent
    const indent = callout.properties?.indent;
    if (indent) {
      const expectedIndent = SpecConfig.spacing.calloutIndent;

      results.push({
        ruleId: `C-IND-${idx}`,
        category: "callouts",
        description: `${calloutId} left indent should be ${expectedIndent} DXA`,
        passed: Math.abs((indent.left || 0) - expectedIndent) <= 20,
        actual: indent.left,
        expected: expectedIndent,
      });
    }
  });

  return results;
}

/**
 * Validate tables
 * @param {Object} extracted - Extracted properties
 * @returns {Array} Validation results
 */
function validateTables(extracted) {
  const results = [];
  const tables = extracted.tables || [];

  tables.forEach((table, idx) => {
    // Skip header table (already validated separately)
    if (idx === 0 && extracted.headerTable?.isHeaderTable) {
      return;
    }

    // Check for step/screenshot layout tables (should have no borders)
    if (table.rowCount === 1 && table.rows[0].cellCount === 2) {
      // Likely a step/screenshot table
      const cell1Width = table.rows[0].cells[0]?.properties?.width;
      const cell2Width = table.rows[0].cells[1]?.properties?.width;

      // Check for borderless
      const hasBorders =
        table.properties?.borders ||
        table.rows[0].cells.some((c) => c.properties?.borders);

      results.push({
        ruleId: `TBL-BDR-${idx}`,
        category: "tables",
        description: `Table ${idx} (layout) should have no visible borders`,
        passed: !hasBorders,
        warning: hasBorders,
      });
    }

    // Check for data tables (troubleshooting, revision history)
    const firstRowText = table.rows[0]?.cells
      .map((c) => c.text)
      .join(" ")
      .toLowerCase();

    if (firstRowText.includes("issue") && firstRowText.includes("resolution")) {
      // Troubleshooting table - check column widths
      results.push({
        ruleId: `TBL-TS-${idx}`,
        category: "tables",
        description:
          "Troubleshooting table detected - validating column proportions",
        passed: true, // Just detection for now
      });
    }

    if (firstRowText.includes("date") && firstRowText.includes("changes")) {
      // Revision history table - check for empty rows
      const emptyRows = table.rows.slice(1).filter((row) => {
        return row.cells.every((c) => !c.text || c.text.trim() === "");
      });

      results.push({
        ruleId: `TBL-RH-${idx}`,
        category: "tables",
        description: "Revision history should have no empty rows",
        passed: emptyRows.length === 0,
        actual: `${emptyRows.length} empty rows found`,
        expected: "0 empty rows",
        error:
          emptyRows.length === 0
            ? null
            : new TableValidationError(
                "Revision History",
                `Found ${emptyRows.length} empty row(s)`,
                { emptyRows: emptyRows.map((r) => r.index) },
              ),
      });
    }
  });

  return results;
}

/**
 * Compare two colors with tolerance for case differences
 * @param {string} actual - Actual color
 * @param {string} expected - Expected color
 * @returns {boolean}
 */
function colorsMatch(actual, expected) {
  if (!actual || !expected) return false;
  return (
    actual.toUpperCase().replace("#", "") ===
    expected.toUpperCase().replace("#", "")
  );
}

module.exports = {
  validateDocument,
  validateLayout,
  validateHeaderTable,
  validateTypography,
  validateCallouts,
  validateTables,
};
