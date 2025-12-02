#!/usr/bin/env node
/**
 * TFCU Procedure Formatter - Example Document Generator
 * Generates a sample "Instant Issue Card Procedure" to demonstrate the template.
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageNumber,
  PageBreak,
  Bookmark,
  LevelFormat,
} = require("docx");
const fs = require("fs");

// ============================================================================
// BRAND CONSTANTS
// ============================================================================

const TFCU_COLORS = {
  PRIMARY_TEAL: "154747",
  LIGHT_TEAL: "E8F4F4",
  OVERVIEW_TEAL: "0F4761",
  WHITE: "FFFFFF",
  LIGHT_GRAY: "F2F2F2",
  BLACK: "000000",
};

const CALLOUT_COLORS = {
  WARNING_BG: "FFF2CC",
  WARNING_BORDER: "FFC000",
  NOTE_BG: "D1ECF1",
  NOTE_BORDER: "2E74B5",
  CRITICAL_BG: "F8D7DA",
  CRITICAL_BORDER: "C00000",
  TIP_BG: "E2F0D9",
  TIP_BORDER: "548235",
};

// ============================================================================
// STYLES & BORDERS
// ============================================================================

const styles = {
  default: {
    document: {
      run: { font: "Calibri", size: 22 },
    },
  },
  paragraphStyles: [
    {
      id: "Overview",
      name: "Overview",
      basedOn: "Normal",
      run: {
        color: TFCU_COLORS.OVERVIEW_TEAL,
        size: 26,
        font: "Calibri",
        bold: true,
      },
      paragraph: { spacing: { before: 120, after: 80 } },
    },
  ],
};

const numbering = {
  config: [
    {
      reference: "procedure-list",
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 360 } } },
        },
        {
          level: 1,
          format: LevelFormat.LOWER_LETTER,
          text: "%2.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    },
  ],
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder,
};
const noBorders = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createHeaderTable(name, department, date) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            shading: {
              fill: TFCU_COLORS.PRIMARY_TEAL,
              type: ShadingType.CLEAR,
            },
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: name,
                    bold: true,
                    color: TFCU_COLORS.WHITE,
                    size: 32,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: `Department: ${department}`,
                    color: TFCU_COLORS.PRIMARY_TEAL,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: `Date: ${date}`,
                    color: TFCU_COLORS.PRIMARY_TEAL,
                    size: 20,
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

function createSectionHeader(text, bookmarkId = null) {
  const children = bookmarkId
    ? [
        new Bookmark({
          id: bookmarkId,
          children: [
            new TextRun({
              text: text,
              bold: true,
              size: 28,
              font: "Calibri",
              color: TFCU_COLORS.PRIMARY_TEAL,
            }),
          ],
        }),
      ]
    : [
        new TextRun({
          text: text,
          bold: true,
          size: 28,
          font: "Calibri",
          color: TFCU_COLORS.PRIMARY_TEAL,
        }),
      ];

  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 12,
        color: TFCU_COLORS.PRIMARY_TEAL,
      },
    },
    children,
  });
}

function createTableOfContents(sections) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [
      new TextRun({
        text: "Contents: ",
        bold: true,
        size: 20,
        color: TFCU_COLORS.PRIMARY_TEAL,
      }),
      ...sections
        .map((s, i) => [
          new TextRun({
            text: s.title,
            size: 20,
            color: TFCU_COLORS.PRIMARY_TEAL,
          }),
          ...(i < sections.length - 1
            ? [new TextRun({ text: "  |  ", size: 20, color: "999999" })]
            : []),
        ])
        .flat(),
    ],
  });
}

function createQuickReferenceBox(items) {
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
              children: [
                new TextRun({
                  text: "Quick Reference",
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: 20,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  for (let i = 0; i < items.length; i += 2) {
    const rowChildren = [];
    const shade =
      Math.floor(i / 2) % 2 === 0 ? TFCU_COLORS.WHITE : TFCU_COLORS.LIGHT_GRAY;

    for (let j = 0; j < 2; j++) {
      const item = items[i + j];
      if (item) {
        // Add label cell
        rowChildren.push(
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: item.label, bold: true, size: 20 }),
                ],
              }),
            ],
          }),
        );
        // Add value cell
        rowChildren.push(
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 40, after: 40 },
                children: [new TextRun({ text: item.value, size: 20 })],
              }),
            ],
          }),
        );
      } else {
        // Odd number of items - add empty cells to complete the row
        rowChildren.push(
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [new Paragraph({ children: [] })],
          }),
        );
      }
    }
    if (rowChildren.length > 0) {
      rows.push(new TableRow({ children: rowChildren }));
    }
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function createCalloutBox(type, text) {
  const config = {
    WARNING: {
      bg: CALLOUT_COLORS.WARNING_BG,
      border: CALLOUT_COLORS.WARNING_BORDER,
      label: "WARNING",
    },
    NOTE: {
      bg: CALLOUT_COLORS.NOTE_BG,
      border: CALLOUT_COLORS.NOTE_BORDER,
      label: "NOTE",
    },
    CRITICAL: {
      bg: CALLOUT_COLORS.CRITICAL_BG,
      border: CALLOUT_COLORS.CRITICAL_BORDER,
      label: "CRITICAL",
    },
    TIP: {
      bg: CALLOUT_COLORS.TIP_BG,
      border: CALLOUT_COLORS.TIP_BORDER,
      label: "TIP",
    },
  };
  const c = config[type];
  return new Paragraph({
    shading: { fill: c.bg, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: c.border } },
    indent: { left: 144, right: 144 },
    spacing: { before: 120, after: 120 },
    children: [
      new TextRun({
        text: `${c.label}: `,
        bold: true,
        size: 20,
        color: c.border,
      }),
      new TextRun({ text, size: 20, font: "Calibri" }),
    ],
  });
}

function createStepRow(
  stepNum,
  text,
  subSteps = [],
  callout = null,
  hasScreenshot = true,
) {
  const leftContent = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: stepNum + " ",
          bold: true,
          size: 22,
          font: "Calibri",
        }),
        new TextRun({ text, size: 22, font: "Calibri" }),
      ],
    }),
  ];

  subSteps.forEach((sub, i) => {
    leftContent.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
        indent: { left: 360 },
        children: [
          new TextRun({
            text: String.fromCharCode(97 + i) + ". ",
            bold: true,
            size: 20,
          }),
          new TextRun({ text: sub, size: 20, font: "Calibri" }),
        ],
      }),
    );
  });

  if (callout) {
    const cc = {
      WARNING: {
        bg: CALLOUT_COLORS.WARNING_BG,
        border: CALLOUT_COLORS.WARNING_BORDER,
        label: "WARNING",
      },
      NOTE: {
        bg: CALLOUT_COLORS.NOTE_BG,
        border: CALLOUT_COLORS.NOTE_BORDER,
        label: "NOTE",
      },
      CRITICAL: {
        bg: CALLOUT_COLORS.CRITICAL_BG,
        border: CALLOUT_COLORS.CRITICAL_BORDER,
        label: "CRITICAL",
      },
      TIP: {
        bg: CALLOUT_COLORS.TIP_BG,
        border: CALLOUT_COLORS.TIP_BORDER,
        label: "TIP",
      },
    }[callout.type];
    leftContent.push(
      new Paragraph({
        shading: { fill: cc.bg, type: ShadingType.CLEAR },
        border: {
          left: { style: BorderStyle.SINGLE, size: 24, color: cc.border },
        },
        indent: { left: 144, right: 72 },
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: `${cc.label}: `,
            bold: true,
            size: 18,
            color: cc.border,
          }),
          new TextRun({ text: callout.text, size: 18 }),
        ],
      }),
    );
  }

  // Right column placeholder for screenshot
  const rightContent = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
      shading: { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR },
      children: hasScreenshot
        ? [
            new TextRun({
              text: "[Screenshot]",
              size: 20,
              color: "666666",
              italics: true,
            }),
          ]
        : [],
    }),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: noBorders,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 72, bottom: 72, left: 72, right: 72 },
            children: leftContent,
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: noBorders,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 72, bottom: 72, left: 72, right: 72 },
            children: rightContent,
          }),
        ],
      }),
    ],
  });
}

function createTextStep(stepNum, text, subSteps = []) {
  const elements = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 60, after: 60 },
      indent: { left: 144 },
      children: [
        new TextRun({
          text: stepNum + " ",
          bold: true,
          size: 22,
          font: "Calibri",
        }),
        new TextRun({ text, size: 22, font: "Calibri" }),
      ],
    }),
  ];
  subSteps.forEach((sub, i) => {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
        indent: { left: 504 },
        children: [
          new TextRun({ text: String.fromCharCode(97 + i) + ". ", size: 20 }),
          new TextRun({ text: sub, size: 20, font: "Calibri" }),
        ],
      }),
    );
  });
  return elements;
}

function createTroubleshootingTable(rows) {
  const widths = [25, 30, 45];
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: ["Issue", "Cause", "Resolution"].map(
        (t, i) =>
          new TableCell({
            width: { size: widths[i], type: WidthType.PERCENTAGE },
            shading: {
              fill: TFCU_COLORS.PRIMARY_TEAL,
              type: ShadingType.CLEAR,
            },
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: t,
                    bold: true,
                    color: TFCU_COLORS.WHITE,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
      ),
    }),
  ];

  rows.forEach((row, index) => {
    const shade =
      index % 2 === 1
        ? { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR }
        : undefined;
    tableRows.push(
      new TableRow({
        children: [row.issue, row.cause, row.resolution].map(
          (text, i) =>
            new TableCell({
              width: { size: widths[i], type: WidthType.PERCENTAGE },
              borders: cellBorders,
              shading: shade,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 40, after: 40 },
                  children: [new TextRun({ text, size: 20 })],
                }),
              ],
            }),
        ),
      }),
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

function createRevisionTable(revisions) {
  const widths = [25, 25, 50];
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: ["Date Updated", "Reviewed By", "Changes Made"].map(
        (t, i) =>
          new TableCell({
            width: { size: widths[i], type: WidthType.PERCENTAGE },
            shading: {
              fill: TFCU_COLORS.PRIMARY_TEAL,
              type: ShadingType.CLEAR,
            },
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: t,
                    bold: true,
                    color: TFCU_COLORS.WHITE,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
      ),
    }),
  ];

  revisions.forEach((rev, index) => {
    const shade =
      index % 2 === 1
        ? { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR }
        : undefined;
    tableRows.push(
      new TableRow({
        children: [rev.date, rev.reviewer, rev.changes].map(
          (text, i) =>
            new TableCell({
              width: { size: widths[i], type: WidthType.PERCENTAGE },
              borders: cellBorders,
              shading: shade,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 40, after: 40 },
                  children: [new TextRun({ text, size: 20 })],
                }),
              ],
            }),
        ),
      }),
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

// ============================================================================
// PROCEDURE CONFIGURATION
// ============================================================================

const PROCEDURE = {
  name: "Instant Issue Card Procedure",
  department: "Operations",
  date: "December 2024",
  overview:
    "This procedure guides staff through the process of issuing instant debit and credit cards to members using the card printing system. It covers card selection, PIN assignment, activation, and troubleshooting common issues.",
  filename: "Operations_Instant_Issue_Card_202412.docx",
};

// ============================================================================
// DOCUMENT ASSEMBLY
// ============================================================================

const doc = new Document({
  styles,
  numbering,
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      headers: { default: new Header({ children: [] }) },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${PROCEDURE.department} | ${PROCEDURE.name} | Page `,
                  size: 18,
                  color: "666666",
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  color: "666666",
                }),
                new TextRun({ text: " of ", size: 18, color: "666666" }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: 18,
                  color: "666666",
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // HEADER
        createHeaderTable(PROCEDURE.name, PROCEDURE.department, PROCEDURE.date),
        new Paragraph({ spacing: { after: 120 }, children: [] }),

        // TABLE OF CONTENTS
        createTableOfContents([
          { title: "Overview" },
          { title: "Prerequisites" },
          { title: "Card Issuance" },
          { title: "Troubleshooting" },
          { title: "Revision History" },
        ]),

        // OVERVIEW
        createSectionHeader("OVERVIEW", "overview"),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: PROCEDURE.overview,
              color: TFCU_COLORS.OVERVIEW_TEAL,
              size: 24,
            }),
          ],
        }),

        // RELATED
        createSectionHeader("RELATED"),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Policies: ", bold: true, size: 20 }),
            new TextRun({
              text: "Card Services Policy, Member Authentication Policy",
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Procedures: ", bold: true, size: 20 }),
            new TextRun({
              text: "PIN Reset Procedure, Card Replacement Procedure",
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Forms: ", bold: true, size: 20 }),
            new TextRun({
              text: "Card Issuance Log, Member Verification Checklist",
              size: 20,
            }),
          ],
        }),

        // QUICK REFERENCE
        createQuickReferenceBox([
          { label: "System", value: "CardWizard Pro" },
          { label: "Login URL", value: "cardwizard.tfcu.local" },
          { label: "Support", value: "ext. 4500" },
          { label: "Hours", value: "M-F 8am-6pm" },
        ]),
        new Paragraph({ spacing: { after: 100 }, children: [] }),

        // PREREQUISITES
        createSectionHeader("PREREQUISITES", "prerequisites"),
        ...createTextStep(
          "1.",
          "Verify the member's identity using two forms of identification.",
        ),
        ...createTextStep(
          "2.",
          "Confirm the member has an active account in good standing.",
        ),
        ...createTextStep(
          "3.",
          "Ensure the card printer is online and has card stock loaded.",
        ),

        // CARD ISSUANCE
        createSectionHeader("CARD ISSUANCE", "card-issuance"),

        createStepRow(
          "1.",
          "Log in to CardWizard Pro using your employee credentials.",
          [
            "Enter your username in the User ID field",
            "Enter your password",
            "Select Login",
          ],
        ),

        createStepRow(
          "2.",
          "Select the card type from the dropdown menu.",
          [
            "For debit cards, select 'TFCU Debit - Instant'",
            "For credit cards, select 'TFCU Visa - Instant'",
          ],
          {
            type: "WARNING",
            text: "Verify the BIN number matches the member's account type before proceeding.",
          },
        ),

        createStepRow(
          "3.",
          "Enter the member's account number and verify the information displayed.",
        ),

        createCalloutBox(
          "CRITICAL",
          "Never leave the card printer unattended while a card is being printed. Cards must be handed directly to the member.",
        ),

        createStepRow("4.", "Have the member enter their PIN on the PIN pad.", [
          "Ensure privacy shield is in place",
          "Member enters 4-digit PIN",
          "Member confirms PIN by entering it again",
        ]),

        createStepRow(
          "5.",
          "Select Print Card and wait for the card to be produced.",
          [],
          {
            type: "NOTE",
            text: "Card printing takes approximately 30 seconds. Do not cancel the print job.",
          },
        ),

        ...createTextStep(
          "6.",
          "Hand the card to the member and have them sign the card issuance log.",
        ),

        // TROUBLESHOOTING
        createSectionHeader("TROUBLESHOOTING", "troubleshooting"),
        createTroubleshootingTable([
          {
            issue: "Card jam",
            cause: "Misaligned card stock",
            resolution:
              "Open printer, remove jammed card, realign stock, retry",
          },
          {
            issue: "PIN pad not responding",
            cause: "Connection issue",
            resolution: "Check USB connection, restart PIN pad if needed",
          },
          {
            issue: "Account not found",
            cause: "Incorrect account number",
            resolution: "Verify account number with member, check for typos",
          },
        ]),

        // REVISION HISTORY (new page)
        new Paragraph({ children: [new PageBreak()] }),
        createSectionHeader("REVISION HISTORY", "revision-history"),
        createRevisionTable([
          {
            date: "December 2024",
            reviewer: "J. Smith",
            changes: "Initial version",
          },
        ]),
      ],
    },
  ],
});

// ============================================================================
// SAVE DOCUMENT
// ============================================================================

Packer.toBuffer(doc)
  .then((buffer) => {
    fs.writeFileSync(PROCEDURE.filename, buffer);
    console.log(`Document saved: ${PROCEDURE.filename}`);
    console.log(`Location: ${process.cwd()}/${PROCEDURE.filename}`);
  })
  .catch((err) => {
    console.error("Error generating document:", err);
  });
