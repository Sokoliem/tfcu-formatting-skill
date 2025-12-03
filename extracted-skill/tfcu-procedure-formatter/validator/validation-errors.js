/**
 * TFCU Procedure Formatter - Validation Error Types
 *
 * Specialized error classes for different types of spec violations.
 * These provide structured error information for reporting and debugging.
 */

/**
 * Base validation error class
 */
class ValidationError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {string} rule - Rule identifier (e.g., 'font', 'color', 'size')
   * @param {any} actualValue - The value that was found
   * @param {any} expectedValue - The value that was expected
   * @param {string} severity - 'error' or 'warning'
   */
  constructor(message, rule, actualValue, expectedValue, severity = "error") {
    super(message);
    this.name = "ValidationError";
    this.rule = rule;
    this.actualValue = actualValue;
    this.expectedValue = expectedValue;
    this.severity = severity;
    this.location = null; // Set by ValidationContext
    this.timestamp = null; // Set by ValidationContext
    this.suggestion = null; // Optional fix suggestion
  }

  /**
   * Create a copy of this error with additional context
   * @param {Object} context - Additional context to add
   * @returns {ValidationError}
   */
  withContext(context) {
    const copy = new ValidationError(
      this.message,
      this.rule,
      this.actualValue,
      this.expectedValue,
      this.severity,
    );
    Object.assign(copy, context);
    return copy;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      rule: this.rule,
      actual: this.actualValue,
      expected: this.expectedValue,
      severity: this.severity,
      location: this.location,
      suggestion: this.suggestion,
    };
  }
}

/**
 * Font-related validation errors
 */
class FontValidationError extends ValidationError {
  /**
   * @param {string} element - Element where font violation occurred
   * @param {string} actual - Font that was found
   * @param {string} expected - Font that was expected
   */
  constructor(element, actual, expected) {
    super(
      `Font violation in ${element}: found "${actual}", expected "${expected}"`,
      "font",
      actual,
      expected,
    );
    this.name = "FontValidationError";
    this.element = element;
    this.suggestion = `Change font from "${actual}" to "${expected}"`;
  }
}

/**
 * Color-related validation errors
 */
class ColorValidationError extends ValidationError {
  /**
   * @param {string} element - Element where color violation occurred
   * @param {string} colorType - Type of color (fill, border, text)
   * @param {string} actual - Color that was found
   * @param {string} expected - Color that was expected
   */
  constructor(element, colorType, actual, expected) {
    super(
      `Color violation in ${element} ${colorType}: found "#${actual}", expected "#${expected}"`,
      "color",
      actual,
      expected,
    );
    this.name = "ColorValidationError";
    this.element = element;
    this.colorType = colorType;
    this.suggestion = `Update ${colorType} color from #${actual} to #${expected}`;
  }
}

/**
 * Size-related validation errors (font size, spacing, margins)
 */
class SizeValidationError extends ValidationError {
  /**
   * @param {string} element - Element where size violation occurred
   * @param {string} sizeType - Type of size (fontSize, margin, padding)
   * @param {number} actual - Size value that was found
   * @param {number} expected - Size value that was expected
   * @param {string} unit - Unit of measurement (pt, DXA, %)
   */
  constructor(element, sizeType, actual, expected, unit = "DXA") {
    super(
      `Size violation in ${element} ${sizeType}: found ${actual}${unit}, expected ${expected}${unit}`,
      "size",
      actual,
      expected,
    );
    this.name = "SizeValidationError";
    this.element = element;
    this.sizeType = sizeType;
    this.unit = unit;
    this.suggestion = `Adjust ${sizeType} from ${actual}${unit} to ${expected}${unit}`;
  }
}

/**
 * Document structure validation errors
 */
class StructureValidationError extends ValidationError {
  /**
   * @param {string} issue - Description of structural issue
   * @param {Object} details - Additional details about the issue
   */
  constructor(issue, details = {}) {
    super(`Structure violation: ${issue}`, "structure", details, null);
    this.name = "StructureValidationError";
    this.issue = issue;
    this.details = details;
  }
}

/**
 * Border-related validation errors
 */
class BorderValidationError extends ValidationError {
  /**
   * @param {string} element - Element where border violation occurred
   * @param {string} borderSide - Which border (left, right, top, bottom, all)
   * @param {Object} actual - Border properties found
   * @param {Object} expected - Border properties expected
   */
  constructor(element, borderSide, actual, expected) {
    const actualStr =
      typeof actual === "object"
        ? `${actual.style || "none"} ${actual.size || 0} #${actual.color || "none"}`
        : actual;
    const expectedStr =
      typeof expected === "object"
        ? `${expected.style || "none"} ${expected.size || 0} #${expected.color || "none"}`
        : expected;

    super(
      `Border violation in ${element} ${borderSide}: found "${actualStr}", expected "${expectedStr}"`,
      "border",
      actual,
      expected,
    );
    this.name = "BorderValidationError";
    this.element = element;
    this.borderSide = borderSide;
  }
}

/**
 * Spacing/alignment validation errors
 */
class SpacingValidationError extends ValidationError {
  /**
   * @param {string} element - Element where spacing violation occurred
   * @param {string} spacingType - Type (margin, padding, indent)
   * @param {number} actual - Spacing found
   * @param {number} expected - Spacing expected
   */
  constructor(element, spacingType, actual, expected) {
    super(
      `Spacing violation in ${element} ${spacingType}: found ${actual} DXA, expected ${expected} DXA`,
      "spacing",
      actual,
      expected,
    );
    this.name = "SpacingValidationError";
    this.element = element;
    this.spacingType = spacingType;
    this.suggestion = `Adjust ${spacingType} from ${actual} to ${expected} DXA`;
  }
}

/**
 * Table structure validation errors
 */
class TableValidationError extends ValidationError {
  /**
   * @param {string} tableName - Name of the table (Quick Reference, Troubleshooting, etc.)
   * @param {string} issue - Description of the table issue
   * @param {Object} details - Additional details
   */
  constructor(tableName, issue, details = {}) {
    super(`Table violation in ${tableName}: ${issue}`, "table", details, null);
    this.name = "TableValidationError";
    this.tableName = tableName;
    this.issue = issue;
    this.details = details;
  }
}

/**
 * Callout box validation errors
 */
class CalloutValidationError extends ValidationError {
  /**
   * @param {string} calloutType - Type attempted (CRITICAL, WARNING, etc.)
   * @param {string} issue - Description of the callout issue
   * @param {Object} details - Additional details
   */
  constructor(calloutType, issue, details = {}) {
    super(
      `Callout violation for type "${calloutType}": ${issue}`,
      "callout",
      calloutType,
      details.expected || null,
    );
    this.name = "CalloutValidationError";
    this.calloutType = calloutType;
    this.issue = issue;
    this.details = details;
  }

  /**
   * Create error for invalid callout type
   * @param {string} invalidType - The invalid type provided
   * @param {string[]} validTypes - Array of valid types
   * @returns {CalloutValidationError}
   */
  static invalidType(invalidType, validTypes) {
    const err = new CalloutValidationError(
      invalidType,
      `Invalid callout type. Must be one of: ${validTypes.join(", ")}`,
      { expected: validTypes },
    );
    err.rule = "callout-type";
    err.suggestion = `Use one of the valid callout types: ${validTypes.join(", ")}`;
    return err;
  }
}

/**
 * Input validation errors (for procedure input data)
 */
class InputValidationError extends ValidationError {
  /**
   * @param {string} field - Field name that failed validation
   * @param {string} issue - Description of the issue
   * @param {any} value - Value that was provided
   */
  constructor(field, issue, value) {
    super(
      `Input validation failed for "${field}": ${issue}`,
      "input",
      value,
      null,
    );
    this.name = "InputValidationError";
    this.field = field;
    this.issue = issue;
  }

  /**
   * Create error for missing required field
   * @param {string} field - Name of missing field
   * @returns {InputValidationError}
   */
  static missingRequired(field) {
    const err = new InputValidationError(
      field,
      "This field is required",
      undefined,
    );
    err.suggestion = `Provide a value for the "${field}" field`;
    return err;
  }

  /**
   * Create error for invalid field type
   * @param {string} field - Field name
   * @param {string} expectedType - Expected type
   * @param {string} actualType - Actual type found
   * @returns {InputValidationError}
   */
  static invalidType(field, expectedType, actualType) {
    const err = new InputValidationError(
      field,
      `Expected ${expectedType}, got ${actualType}`,
      actualType,
    );
    err.expectedValue = expectedType;
    return err;
  }
}

/**
 * Filename validation errors
 */
class FilenameValidationError extends ValidationError {
  /**
   * @param {string} issue - Description of the filename issue
   * @param {Object} details - Additional details (input, sanitized, etc.)
   */
  constructor(issue, details = {}) {
    super(
      `Filename validation: ${issue}`,
      "filename",
      details.input || null,
      details.expected || null,
    );
    this.name = "FilenameValidationError";
    this.issue = issue;
    this.details = details;
    if (details.sanitized) {
      this.suggestion = `Auto-corrected to: "${details.sanitized}"`;
    }
  }

  /**
   * Create error for invalid department
   * @param {string} department - Invalid department provided
   * @param {string[]} validDepartments - List of valid departments
   * @returns {FilenameValidationError}
   */
  static invalidDepartment(department, validDepartments) {
    const err = new FilenameValidationError(
      `Invalid department "${department}"`,
      {
        input: department,
        expected: validDepartments,
      },
    );
    err.suggestion = `Select from: ${validDepartments.join(", ")}`;
    return err;
  }

  /**
   * Create error for procedure name that was sanitized
   * @param {string} original - Original procedure name
   * @param {string} sanitized - Sanitized procedure name
   * @returns {FilenameValidationError}
   */
  static procedureNameSanitized(original, sanitized) {
    const err = new FilenameValidationError(`Procedure name sanitized`, {
      input: original,
      sanitized: sanitized,
    });
    err.severity = "warning";
    return err;
  }

  /**
   * Create error for department that was auto-corrected
   * @param {string} original - Original department input
   * @param {string} corrected - Corrected department name
   * @returns {FilenameValidationError}
   */
  static departmentCorrected(original, corrected) {
    const err = new FilenameValidationError(
      `Department auto-corrected from "${original}" to "${corrected}"`,
      {
        input: original,
        sanitized: corrected,
      },
    );
    err.severity = "warning";
    return err;
  }
}

module.exports = {
  ValidationError,
  FontValidationError,
  ColorValidationError,
  SizeValidationError,
  StructureValidationError,
  BorderValidationError,
  SpacingValidationError,
  TableValidationError,
  CalloutValidationError,
  InputValidationError,
  FilenameValidationError,
};
