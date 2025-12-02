/**
 * TFCU Procedure Formatter - Validation Context
 *
 * Manages error collection and reporting during document generation
 * and post-generation auditing. Supports three validation modes:
 * - strict: Throws on first error (for CI/CD pipelines)
 * - lenient: Collects all errors, continues processing (default)
 * - report-only: Only logs, never throws (for auditing)
 */

const { ValidationError } = require("./validation-errors");

class ValidationContext {
  /**
   * Create a new validation context
   * @param {Object} options - Configuration options
   * @param {string} options.mode - 'strict' | 'lenient' | 'report-only'
   * @param {boolean} options.includeWarnings - Include warnings in report
   */
  constructor(options = {}) {
    this.mode = options.mode || "lenient";
    this.includeWarnings = options.includeWarnings !== false;

    this.errors = [];
    this.warnings = [];
    this.elementStack = [];
    this.startTime = Date.now();
  }

  /**
   * Push element onto tracking stack (for location reporting)
   * @param {string} elementName - Name of element being processed
   */
  enterElement(elementName) {
    this.elementStack.push(elementName);
  }

  /**
   * Pop element from tracking stack
   */
  exitElement() {
    this.elementStack.pop();
  }

  /**
   * Get current location in document structure
   * @returns {string} Path to current element
   */
  get currentElement() {
    return this.elementStack.join(" > ") || "document";
  }

  /**
   * Add an error to the context
   * @param {ValidationError|Object} error - Error object or plain object
   */
  addError(error) {
    // Normalize to ValidationError if plain object
    if (!(error instanceof ValidationError)) {
      error = new ValidationError(
        error.message || `Validation error: ${error.rule}`,
        error.rule,
        error.actual,
        error.expected,
        "error",
      );
    }

    error.location = this.currentElement;
    error.timestamp = new Date().toISOString();
    this.errors.push(error);

    // In strict mode, throw immediately
    if (this.mode === "strict") {
      throw error;
    }
  }

  /**
   * Add a warning to the context
   * @param {ValidationError|Object} warning - Warning object
   */
  addWarning(warning) {
    if (!(warning instanceof ValidationError)) {
      warning = new ValidationError(
        warning.message || `Warning: ${warning.rule}`,
        warning.rule,
        warning.actual,
        warning.expected,
        "warning",
      );
    }

    warning.severity = "warning";
    warning.location = this.currentElement;
    warning.timestamp = new Date().toISOString();
    this.warnings.push(warning);
  }

  /**
   * Check if context has any errors
   * @returns {boolean}
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Check if context has any warnings
   * @returns {boolean}
   */
  hasWarnings() {
    return this.warnings.length > 0;
  }

  /**
   * Get total issue count
   * @returns {number}
   */
  get issueCount() {
    return this.errors.length + this.warnings.length;
  }

  /**
   * Generate structured validation report
   * @returns {Object} Validation report
   */
  getReport() {
    const endTime = Date.now();

    return {
      valid: !this.hasErrors(),
      summary: {
        errorCount: this.errors.length,
        warningCount: this.warnings.length,
        totalIssues: this.issueCount,
        validationTimeMs: endTime - this.startTime,
        mode: this.mode,
      },
      errors: this.errors.map((e) => this._formatIssue(e)),
      warnings: this.includeWarnings
        ? this.warnings.map((w) => this._formatIssue(w))
        : [],
    };
  }

  /**
   * Format an issue for the report
   * @param {ValidationError} issue
   * @returns {Object} Formatted issue
   */
  _formatIssue(issue) {
    return {
      message: issue.message,
      rule: issue.rule,
      severity: issue.severity,
      location: issue.location,
      actual: issue.actualValue,
      expected: issue.expectedValue,
      suggestion: issue.suggestion || this._generateSuggestion(issue),
      timestamp: issue.timestamp,
    };
  }

  /**
   * Generate a fix suggestion for common issues
   * @param {ValidationError} issue
   * @returns {string|null}
   */
  _generateSuggestion(issue) {
    const suggestions = {
      font: `Change font from "${issue.actualValue}" to "${issue.expectedValue}"`,
      color: `Update color from #${issue.actualValue} to #${issue.expectedValue}`,
      size: `Adjust size from ${issue.actualValue} to ${issue.expectedValue}`,
      "callout-type": `Use one of the valid callout types: ${issue.expectedValue}`,
      "empty-revision":
        "Remove empty rows or add content to the Changes column",
      structure: issue.message,
    };

    return suggestions[issue.rule] || null;
  }

  /**
   * Generate markdown-formatted report
   * @returns {string} Markdown report
   */
  toMarkdown() {
    const report = this.getReport();
    let md = "# TFCU Procedure Validation Report\n\n";

    // Summary
    md += "## Summary\n\n";
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Status | ${report.valid ? "PASSED" : "FAILED"} |\n`;
    md += `| Errors | ${report.summary.errorCount} |\n`;
    md += `| Warnings | ${report.summary.warningCount} |\n`;
    md += `| Validation Time | ${report.summary.validationTimeMs}ms |\n\n`;

    // Errors
    if (report.errors.length > 0) {
      md += "## Errors\n\n";
      report.errors.forEach((err, i) => {
        md += `### ${i + 1}. ${err.rule}\n\n`;
        md += `- **Location**: ${err.location}\n`;
        md += `- **Message**: ${err.message}\n`;
        if (err.actual !== undefined) {
          md += `- **Actual**: \`${err.actual}\`\n`;
        }
        if (err.expected !== undefined) {
          md += `- **Expected**: \`${err.expected}\`\n`;
        }
        if (err.suggestion) {
          md += `- **Fix**: ${err.suggestion}\n`;
        }
        md += "\n";
      });
    }

    // Warnings
    if (report.warnings.length > 0) {
      md += "## Warnings\n\n";
      report.warnings.forEach((warn, i) => {
        md += `${i + 1}. **${warn.rule}** at ${warn.location}: ${warn.message}\n`;
      });
    }

    return md;
  }

  /**
   * Reset context for reuse
   */
  reset() {
    this.errors = [];
    this.warnings = [];
    this.elementStack = [];
    this.startTime = Date.now();
  }

  /**
   * Create a child context for nested validation
   * @param {string} elementName - Name of element being validated
   * @returns {ValidationContext} Child context that shares error collection
   */
  createChild(elementName) {
    const child = new ValidationContext({ mode: this.mode });
    child.errors = this.errors;
    child.warnings = this.warnings;
    child.elementStack = [...this.elementStack, elementName];
    return child;
  }
}

module.exports = { ValidationContext };
