/**
 * TFCU Procedure Formatter - Quick Card Template Generator
 *
 * Generates a comprehensive quick reference card template demonstrating
 * all sections, formatting, and features of the Quick Card Generator.
 *
 * Run: node generate_quickcard_template.js
 * Output: extracted-skill/tfcu-procedure-formatter/assets/QuickCard_Template.docx
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
  Footer,
  PageNumber,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ============================================================================
// BRAND CONSTANTS (from spec-config.js)
// ============================================================================
const TFCU_COLORS = {
  PRIMARY_TEAL: "154747",
  LIGHT_TEAL: "E8F4F4",
  WHITE: "FFFFFF",
  BLACK: "000000",
  GRAY: "666666",
  LIGHT_GRAY: "AAAAAA",

  // Intervention markers
  MARKER_RED: "C00000",
  MARKER_HIGHLIGHT: "FFFF00",

  // Callout colors
  CRITICAL_RED: "C00000",
  WARNING_GOLD: "FFC000",
  NOTE_BLUE: "2E74B5",
  TIP_GREEN: "548235",
};

const SKILL_VERSION = "v6.0.2";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates the Quick Card header bar
 */
function createQuickCardHeader(procedureName, department) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: {
              fill: TFCU_COLORS.PRIMARY_TEAL,
              type: ShadingType.CLEAR,
            },
            verticalAlign: VerticalAlign.CENTER,
            margins: {
              top: convertInchesToTwip(0.12),
              bottom: convertInchesToTwip(0.12),
              left: convertInchesToTwip(0.2),
              right: convertInchesToTwip(0.2),
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${procedureName.toUpperCase()} - QUICK REFERENCE`,
                    bold: true,
                    color: TFCU_COLORS.WHITE,
                    size: 26, // 13pt
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40 },
                children: [
                  new TextRun({
                    text: department,
                    color: TFCU_COLORS.WHITE,
                    size: 20, // 10pt
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates a section header for the quick card
 */
function createCardSectionHeader(icon, title) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: TFCU_COLORS.PRIMARY_TEAL,
      },
    },
    children: [
      new TextRun({
        text: `${icon} ${title}`,
        bold: true,
        color: TFCU_COLORS.PRIMARY_TEAL,
        size: 22, // 11pt
        font: "Calibri",
      }),
    ],
  });
}

/**
 * Creates a checkbox item for "Before You Start"
 */
function createCheckboxItem(text, helperNote = null) {
  const children = [
    new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({
          text: "☐ ",
          size: 20,
          font: "Calibri",
        }),
        new TextRun({
          text: text,
          size: 20,
          font: "Calibri",
        }),
      ],
    }),
  ];

  if (helperNote) {
    children.push(
      new Paragraph({
        spacing: { before: 20, after: 40 },
        indent: { left: convertInchesToTwip(0.25) },
        children: [
          new TextRun({
            text: helperNote,
            italics: true,
            size: 16,
            color: TFCU_COLORS.GRAY,
            font: "Calibri",
          }),
        ],
      }),
    );
  }

  return children;
}

/**
 * Creates a numbered step for "Key Steps"
 */
function createNumberedStep(number, text, helperNote = null) {
  const children = [
    new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({
          text: `${number}. `,
          bold: true,
          size: 20,
          font: "Calibri",
        }),
        new TextRun({
          text: text,
          size: 20,
          font: "Calibri",
        }),
      ],
    }),
  ];

  if (helperNote) {
    children.push(
      new Paragraph({
        spacing: { before: 20, after: 40 },
        indent: { left: convertInchesToTwip(0.25) },
        children: [
          new TextRun({
            text: helperNote,
            italics: true,
            size: 16,
            color: TFCU_COLORS.GRAY,
            font: "Calibri",
          }),
        ],
      }),
    );
  }

  return children;
}

/**
 * Creates a warning item with icon
 */
function createWarningItem(icon, text, type = "warning") {
  const color =
    type === "critical" ? TFCU_COLORS.CRITICAL_RED : TFCU_COLORS.WARNING_GOLD;
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({
        text: `${icon} `,
        size: 20,
        font: "Calibri",
      }),
      new TextRun({
        text: text,
        size: 20,
        font: "Calibri",
        color:
          type === "critical" ? TFCU_COLORS.CRITICAL_RED : TFCU_COLORS.BLACK,
      }),
    ],
  });
}

/**
 * Creates an escalation item
 */
function createEscalationItem(condition, action) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({
        text: "• ",
        size: 20,
        font: "Calibri",
      }),
      new TextRun({
        text: condition,
        size: 20,
        font: "Calibri",
      }),
      new TextRun({
        text: " → ",
        bold: true,
        color: TFCU_COLORS.PRIMARY_TEAL,
        size: 20,
        font: "Calibri",
      }),
      new TextRun({
        text: action,
        bold: true,
        size: 20,
        font: "Calibri",
      }),
    ],
  });
}

/**
 * Creates the quick contacts table
 */
function createQuickContactsTable(contacts) {
  const rows = contacts.map(
    (contact) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.PRIMARY_TEAL,
              },
              bottom: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.PRIMARY_TEAL,
              },
              left: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.PRIMARY_TEAL,
              },
              right: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.PRIMARY_TEAL,
              },
            },
            margins: {
              top: convertInchesToTwip(0.03),
              bottom: convertInchesToTwip(0.03),
              left: convertInchesToTwip(0.08),
              right: convertInchesToTwip(0.08),
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: contact.label,
                    size: 18,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.PRIMARY_TEAL,
              },
              bottom: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.PRIMARY_TEAL,
              },
              left: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.PRIMARY_TEAL,
              },
              right: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.PRIMARY_TEAL,
              },
            },
            margins: {
              top: convertInchesToTwip(0.03),
              bottom: convertInchesToTwip(0.03),
              left: convertInchesToTwip(0.08),
              right: convertInchesToTwip(0.08),
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: contact.value,
                    size: 18,
                    font: contact.isPhone ? "Consolas" : "Calibri",
                    bold: contact.isPhone,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows,
  });
}

/**
 * Creates an intervention marker
 */
function createMarker(type, text) {
  return new TextRun({
    text: ` [${type}: ${text}]`,
    bold: true,
    italics: true,
    color: TFCU_COLORS.MARKER_RED,
    highlight: "yellow",
    size: 18,
    font: "Calibri",
  });
}

/**
 * Creates a helper note box
 */
function createHelperBox(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
    children: [
      new TextRun({
        text: text,
        italics: true,
        size: 16,
        color: TFCU_COLORS.GRAY,
        font: "Calibri",
      }),
    ],
  });
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

async function generateQuickCardTemplate() {
  const procedureName = "Card Issuance";
  const department = "Operations";
  const dateStr = "December 2025";

  const doc = new Document({
    creator: "TFCU Procedure Formatter",
    title: "Quick Reference Card Template",
    description: "Comprehensive quick card template demonstrating all sections",
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 20,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: convertInchesToTwip(11),
              height: convertInchesToTwip(8.5),
            },
            margin: {
              top: convertInchesToTwip(0.4),
              bottom: convertInchesToTwip(0.4),
              left: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: TFCU_COLORS.LIGHT_GRAY,
                  },
                },
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: `${department} | ${procedureName} | ${dateStr} | ${SKILL_VERSION}`,
                    size: 16,
                    color: TFCU_COLORS.GRAY,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: "          For training use only",
                    size: 16,
                    color: TFCU_COLORS.LIGHT_GRAY,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Header
          createQuickCardHeader(procedureName, department),

          // Template guide note
          new Paragraph({ spacing: { before: 80 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: TFCU_COLORS.NOTE_BLUE,
              },
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: TFCU_COLORS.NOTE_BLUE,
              },
              left: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: TFCU_COLORS.NOTE_BLUE,
              },
              right: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: TFCU_COLORS.NOTE_BLUE,
              },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { fill: "DEEBF7", type: ShadingType.CLEAR },
                    margins: {
                      top: convertInchesToTwip(0.05),
                      bottom: convertInchesToTwip(0.05),
                      left: convertInchesToTwip(0.1),
                      right: convertInchesToTwip(0.1),
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "TEMPLATE GUIDE: ",
                            bold: true,
                            color: TFCU_COLORS.NOTE_BLUE,
                            size: 18,
                            font: "Calibri",
                          }),
                          new TextRun({
                            text: "This template demonstrates all quick card sections. Gray italic notes explain each element. Remove helper notes for actual cards. Designed for landscape 8.5x11, two-column layout, laminatable format.",
                            size: 18,
                            font: "Calibri",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Main two-column layout
          new Paragraph({ spacing: { before: 80 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  // ============================================================
                  // LEFT COLUMN
                  // ============================================================
                  new TableCell({
                    width: { size: 49, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    margins: {
                      right: convertInchesToTwip(0.15),
                    },
                    children: [
                      // BEFORE YOU START section
                      createCardSectionHeader("☐", "BEFORE YOU START"),
                      createHelperBox(
                        "Prerequisites from procedure. Max 4 items. Use checkbox format for print use.",
                      ),

                      ...createCheckboxItem(
                        "Verify member identity with two forms of ID",
                      ),
                      ...createCheckboxItem(
                        "Confirm account is active and in good standing",
                      ),
                      ...createCheckboxItem(
                        "Ensure card printer is online and loaded",
                      ),
                      ...createCheckboxItem("Log in to CardWizard Pro"),

                      // KEY STEPS section
                      createCardSectionHeader("#", "KEY STEPS"),
                      createHelperBox(
                        "Top 8 prioritized steps. Algorithm weights: Decision (30%), Verification (25%), Anchors (20%), Callout-attached (15%), Data entry (10%).",
                      ),

                      ...createNumberedStep(
                        1,
                        "Navigate to Tools > Card Services",
                      ),
                      ...createNumberedStep(
                        2,
                        "Select card type (Consumer Debit / Business Debit)",
                        "Decision point - weighted 30%",
                      ),
                      ...createNumberedStep(3, "Enter member account number"),
                      ...createNumberedStep(
                        4,
                        "Verify acct info matches member ID",
                        "Verification step - weighted 25%",
                      ),
                      ...createNumberedStep(
                        5,
                        "Have member enter PIN (privacy shield!)",
                      ),
                      ...createNumberedStep(
                        6,
                        "Select Print Card, wait ~30 seconds",
                      ),
                      ...createNumberedStep(
                        7,
                        "Activate card before handing to member",
                      ),
                      ...createNumberedStep(
                        8,
                        "Obtain member signature on log",
                      ),

                      // Intervention marker example in step
                      new Paragraph({
                        spacing: { before: 80, after: 40 },
                        shading: {
                          fill: TFCU_COLORS.LIGHT_TEAL,
                          type: ShadingType.CLEAR,
                        },
                        children: [
                          new TextRun({
                            text: "Example with marker: ",
                            italics: true,
                            size: 16,
                            color: TFCU_COLORS.GRAY,
                            font: "Calibri",
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 20, after: 40 },
                        children: [
                          new TextRun({
                            text: "9. Call CardWizard support",
                            size: 20,
                            font: "Calibri",
                          }),
                          createMarker("VERIFY", "current number"),
                        ],
                      }),
                    ],
                  }),

                  // ============================================================
                  // RIGHT COLUMN
                  // ============================================================
                  new TableCell({
                    width: { size: 49, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    margins: {
                      left: convertInchesToTwip(0.15),
                    },
                    children: [
                      // WATCH OUT FOR section
                      createCardSectionHeader("⚠", "WATCH OUT FOR"),
                      createHelperBox(
                        "CRITICAL (max 3) and WARNING (max 2) callouts from procedure. Icons indicate severity.",
                      ),

                      createWarningItem(
                        "⛔",
                        "Never leave printer unattended during card creation",
                        "critical",
                      ),
                      createWarningItem(
                        "⚠️",
                        "Always activate cards - even when reprinting",
                      ),
                      createWarningItem(
                        "⚠️",
                        "Verify BIN matches account type before proceeding",
                      ),
                      createWarningItem(
                        "⚠️",
                        "Privacy shield required during PIN entry",
                      ),

                      // Auto-generated warning example
                      new Paragraph({
                        spacing: { before: 80, after: 40 },
                        shading: {
                          fill: TFCU_COLORS.LIGHT_TEAL,
                          type: ShadingType.CLEAR,
                        },
                        children: [
                          new TextRun({
                            text: "Auto-generated when no callouts found:",
                            italics: true,
                            size: 16,
                            color: TFCU_COLORS.GRAY,
                            font: "Calibri",
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 20, after: 40 },
                        children: [
                          new TextRun({
                            text: "⚠️ Complete all steps before closing transaction",
                            size: 20,
                            font: "Calibri",
                          }),
                          createMarker("SUGGESTED", "auto-generated"),
                        ],
                      }),

                      // WHEN TO ESCALATE section
                      createCardSectionHeader("→", "WHEN TO ESCALATE"),
                      createHelperBox(
                        "Condition → Action pairs from escalation triggers in procedure. Max 3 items.",
                      ),

                      createEscalationItem(
                        "Error persists after retry",
                        "Contact IT Support",
                      ),
                      createEscalationItem(
                        "Account shows restriction",
                        "Contact Supervisor",
                      ),
                      createEscalationItem(
                        "Suspicious activity detected",
                        "Contact Compliance",
                      ),

                      // QUICK CONTACTS section
                      createCardSectionHeader("☎", "QUICK CONTACTS"),
                      createHelperBox(
                        "Contact info from procedure. Phone numbers use Consolas font. Max 4 entries.",
                      ),

                      createQuickContactsTable([
                        {
                          label: "IT Help Desk",
                          value: "ext. 4500",
                          isPhone: true,
                        },
                        {
                          label: "CardWizard Support",
                          value: "1-800-237-3387",
                          isPhone: true,
                        },
                        {
                          label: "Supervisor",
                          value: "[Fill in]",
                          isPhone: false,
                        },
                        {
                          label: "Member Services",
                          value: "907-790-5050",
                          isPhone: true,
                        },
                      ]),

                      // Marker propagation note
                      new Paragraph({ spacing: { before: 120 } }),
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                          top: {
                            style: BorderStyle.SINGLE,
                            size: 4,
                            color: TFCU_COLORS.WARNING_GOLD,
                          },
                          bottom: {
                            style: BorderStyle.SINGLE,
                            size: 4,
                            color: TFCU_COLORS.WARNING_GOLD,
                          },
                          left: {
                            style: BorderStyle.SINGLE,
                            size: 12,
                            color: TFCU_COLORS.WARNING_GOLD,
                          },
                          right: {
                            style: BorderStyle.SINGLE,
                            size: 4,
                            color: TFCU_COLORS.WARNING_GOLD,
                          },
                        },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({
                                width: {
                                  size: 100,
                                  type: WidthType.PERCENTAGE,
                                },
                                shading: {
                                  fill: "FFF2CC",
                                  type: ShadingType.CLEAR,
                                },
                                margins: {
                                  top: convertInchesToTwip(0.05),
                                  bottom: convertInchesToTwip(0.05),
                                  left: convertInchesToTwip(0.1),
                                  right: convertInchesToTwip(0.1),
                                },
                                children: [
                                  new Paragraph({
                                    children: [
                                      new TextRun({
                                        text: "MARKER PROPAGATION: ",
                                        bold: true,
                                        color: TFCU_COLORS.WARNING_GOLD,
                                        size: 16,
                                        font: "Calibri",
                                      }),
                                      new TextRun({
                                        text: "Intervention markers from source procedure are preserved in quick card content. Resolve all markers before laminating.",
                                        size: 16,
                                        font: "Calibri",
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Usage instructions
          new Paragraph({ spacing: { before: 120 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.TIP_GREEN,
              },
              bottom: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.TIP_GREEN,
              },
              left: {
                style: BorderStyle.SINGLE,
                size: 12,
                color: TFCU_COLORS.TIP_GREEN,
              },
              right: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: TFCU_COLORS.TIP_GREEN,
              },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { fill: "E2F0D9", type: ShadingType.CLEAR },
                    margins: {
                      top: convertInchesToTwip(0.05),
                      bottom: convertInchesToTwip(0.05),
                      left: convertInchesToTwip(0.1),
                      right: convertInchesToTwip(0.1),
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "RECOMMENDED USE: ",
                            bold: true,
                            color: TFCU_COLORS.TIP_GREEN,
                            size: 16,
                            font: "Calibri",
                          }),
                          new TextRun({
                            text: "1) Print on cardstock (landscape)  2) Laminate for durability  3) Post at workstation or keep in procedure binder  4) Update when procedure changes",
                            size: 16,
                            font: "Calibri",
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 40 },
                        children: [
                          new TextRun({
                            text: "NOTE: This quick reference supplements but does not replace the full procedure. Staff should complete full training before using this card.",
                            italics: true,
                            size: 16,
                            color: TFCU_COLORS.GRAY,
                            font: "Calibri",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  // Write the document
  const outputPath = path.join(
    __dirname,
    "extracted-skill/tfcu-procedure-formatter/assets/QuickCard_Template.docx",
  );

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  console.log("Quick Card template generated successfully!");
  console.log(`\nLocation: ${outputPath}`);
  console.log("\nTemplate includes:");
  console.log("  - Landscape orientation (8.5x11)");
  console.log("  - Two-column layout");
  console.log("  - Teal header bar with procedure name");
  console.log("  - LEFT COLUMN:");
  console.log("    - Before You Start (checkbox format, 4 items)");
  console.log("    - Key Steps (numbered, 8 prioritized steps)");
  console.log("  - RIGHT COLUMN:");
  console.log("    - Watch Out For (critical/warning with icons)");
  console.log("    - When to Escalate (condition → action pairs)");
  console.log("    - Quick Contacts (label/value table)");
  console.log("  - Intervention marker examples");
  console.log("  - Auto-generated content examples");
  console.log("  - Usage instructions");
  console.log("  - Footer with department, date, version");
}

generateQuickCardTemplate().catch(console.error);
