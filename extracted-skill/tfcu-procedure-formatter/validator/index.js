#!/usr/bin/env node

/**
 * TFCU Procedure Formatter - Compliance Validator CLI
 *
 * Usage:
 *   node validator/index.js audit <path-to-docx> [options]
 *
 * Options:
 *   --format=json|markdown|html  Output format (default: markdown)
 *   --output=<path>              Write report to file (default: stdout)
 *   --strict                     Exit with code 1 on any failure
 *   --verbose                    Include all passed checks in output
 */

const fs = require("fs");
const path = require("path");

const { parseDocument } = require("./ooxml-parser");
const { validateDocument } = require("./validators/spec-validator");
const { generateReport } = require("./report-generator");
const { ValidationContext } = require("./validation-context");
const { SpecConfig } = require("./spec-config");

/**
 * Parse command line arguments
 * @param {string[]} args - Process arguments
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
  const options = {
    command: null,
    docxPath: null,
    format: "markdown",
    output: null,
    strict: false,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "audit" || arg === "validate") {
      options.command = "audit";
      // Next arg should be the file path
      if (args[i + 1] && !args[i + 1].startsWith("-")) {
        options.docxPath = args[i + 1];
        i++;
      }
    } else if (arg === "help" || arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("--format=")) {
      options.format = arg.split("=")[1];
    } else if (arg.startsWith("--output=")) {
      options.output = arg.split("=")[1];
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--verbose") {
      options.verbose = true;
    } else if (!arg.startsWith("-") && !options.docxPath) {
      options.docxPath = arg;
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
TFCU Procedure Formatter - Compliance Validator

USAGE:
  node validator/index.js audit <path-to-docx> [options]
  node validator/index.js help

COMMANDS:
  audit <file>    Validate a .docx file against TFCU spec requirements
  help            Show this help message

OPTIONS:
  --format=<fmt>  Output format: json, markdown, html (default: markdown)
  --output=<path> Write report to file instead of stdout
  --strict        Exit with code 1 if any checks fail (for CI/CD)
  --verbose       Include all passed checks in markdown/html output

EXAMPLES:
  # Validate a document and print markdown report
  node validator/index.js audit CardAtOnce_Procedure.docx

  # Generate JSON report for CI/CD
  node validator/index.js audit procedure.docx --format=json --strict

  # Generate HTML report and save to file
  node validator/index.js audit procedure.docx --format=html --output=report.html

SPEC REQUIREMENTS:
  The validator checks against ${Object.keys(SpecConfig).length} categories:
  - Typography (fonts, sizes, colors)
  - Layout (margins, spacing)
  - Header Table (row colors, text styling)
  - Callout Boxes (backgrounds, borders)
  - Tables (structure, empty rows)

EXIT CODES:
  0  All checks passed (or --strict not used)
  1  One or more checks failed (with --strict)
  2  Error reading or parsing file
`);
}

/**
 * Main audit function
 * @param {string} docxPath - Path to .docx file
 * @param {Object} options - CLI options
 */
async function runAudit(docxPath, options) {
  // Check file exists
  if (!fs.existsSync(docxPath)) {
    console.error(`Error: File not found: ${docxPath}`);
    process.exit(2);
  }

  // Read file
  const fileBuffer = fs.readFileSync(docxPath);

  console.error(`Validating: ${path.basename(docxPath)}`);
  console.error("");

  try {
    // Parse document
    const extracted = await parseDocument(fileBuffer);

    // Validate against spec
    const results = validateDocument(extracted);

    // Generate report
    const report = generateReport(results, {
      format: options.format,
      documentPath: path.basename(docxPath),
      specVersion: "2.3",
    });

    // Output report
    if (options.format === "json") {
      const output = JSON.stringify(report, null, 2);
      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.error(`Report saved to: ${options.output}`);
      } else {
        console.log(output);
      }
    } else {
      if (options.output) {
        fs.writeFileSync(options.output, report);
        console.error(`Report saved to: ${options.output}`);
      } else {
        console.log(report);
      }
    }

    // Summary to stderr
    const summary =
      options.format === "json" ? report.summary : calculateSummary(results);
    console.error("");
    console.error(
      `Results: ${summary.passed} passed, ${summary.failed} failed, ${summary.warnings} warnings`,
    );
    console.error(`Compliance: ${summary.compliancePercentage}%`);

    // Exit code for strict mode
    if (options.strict && summary.failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error parsing document: ${err.message}`);
    if (options.verbose) {
      console.error(err.stack);
    }
    process.exit(2);
  }
}

/**
 * Calculate summary from results (for non-JSON formats)
 */
function calculateSummary(results) {
  const totalChecks =
    results.passed.length + results.failed.length + results.warnings.length;
  return {
    totalChecks,
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    compliancePercentage:
      totalChecks > 0
        ? Math.round(
            (results.passed.length /
              (results.passed.length + results.failed.length)) *
              100 *
              10,
          ) / 10
        : 100,
  };
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  if (options.command === "audit") {
    if (!options.docxPath) {
      console.error("Error: No document path provided");
      console.error("Usage: node validator/index.js audit <path-to-docx>");
      process.exit(2);
    }
    await runAudit(options.docxPath, options);
  } else {
    console.error(`Unknown command. Use 'help' for usage information.`);
    process.exit(2);
  }
}

// Export for programmatic use
module.exports = {
  parseDocument,
  validateDocument,
  generateReport,
  ValidationContext,
  SpecConfig,
};

// Run if called directly
if (require.main === module) {
  main().catch((err) => {
    console.error("Unexpected error:", err.message);
    process.exit(2);
  });
}
