/**
 * TFCU Procedure Template Generator - Comprehensive Reference
 * Generates a full-featured template demonstrating ALL skill capabilities
 *
 * Run: node generate_template.js
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  InternalHyperlink,
  Bookmark,
  PageNumber,
  Footer,
  Header,
  HeadingLevel,
  TabStopType,
  TabStopPosition,
} = require("docx");
const fs = require("fs");

// ============================================================================
// SPEC-CONFIG VALUES (Single Source of Truth)
// ============================================================================
const TFCU_COLORS = {
  PRIMARY_TEAL: "154747",
  LIGHT_TEAL: "E8F4F4",
  OVERVIEW_TEAL: "0F4761",
  WHITE: "FFFFFF",
  LIGHT_GRAY: "F2F2F2",
  BLACK: "000000",
  FOOTER_GRAY: "666666",
  TOC_SEPARATOR: "999999",
  TABLE_BORDER: "CCCCCC",
  // Callout colors
  CRITICAL_BG: "F8D7DA",
  CRITICAL_BORDER: "C00000",
  WARNING_BG: "FFF2CC",
  WARNING_BORDER: "FFC000",
  NOTE_BG: "D1ECF1",
  NOTE_BORDER: "2E74B5",
  TIP_BG: "E2F0D9",
  TIP_BORDER: "548235",
  // Intervention marker
  INTERVENTION_RED: "C00000",
  HIGHLIGHT_YELLOW: "FFFF00",
};

const FONT_SIZES = {
  documentTitle: 32, // 16pt
  sectionHeader: 28, // 14pt
  bodyText: 22, // 11pt
  tableBody: 20, // 10pt
  tocLink: 20, // 10pt
  calloutText: 20, // 10pt
  footer: 18, // 9pt
};

const SKILL_VERSION = "v6.0.2";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const tableBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: TFCU_COLORS.TABLE_BORDER,
};
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
                    size: FONT_SIZES.documentTitle,
                    font: "Calibri",
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
                    text: department,
                    color: TFCU_COLORS.PRIMARY_TEAL,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
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
                    text: date,
                    color: TFCU_COLORS.PRIMARY_TEAL,
                    size: FONT_SIZES.tableBody,
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

function createTableOfContents(sections) {
  const tocLinks = sections
    .map((s, i) => [
      new InternalHyperlink({
        anchor: s.anchor,
        children: [
          new TextRun({
            text: s.title,
            color: TFCU_COLORS.PRIMARY_TEAL,
            font: "Calibri",
            size: FONT_SIZES.tocLink,
          }),
        ],
      }),
      ...(i < sections.length - 1
        ? [
            new TextRun({
              text: "  •  ",
              size: FONT_SIZES.tocLink,
              color: TFCU_COLORS.TOC_SEPARATOR,
            }),
          ]
        : []),
    ])
    .flat();

  return new Paragraph({
    spacing: { before: 80, after: 100 },
    children: [
      new TextRun({
        text: "Contents: ",
        bold: true,
        size: FONT_SIZES.tocLink,
        font: "Calibri",
      }),
      ...tocLinks,
    ],
  });
}

function createSectionHeader(text, bookmarkId, pageBreakBefore = false) {
  const children = bookmarkId
    ? [
        new Bookmark({
          id: bookmarkId,
          children: [
            new TextRun({
              text: text,
              bold: true,
              size: FONT_SIZES.sectionHeader,
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
          size: FONT_SIZES.sectionHeader,
          font: "Calibri",
          color: TFCU_COLORS.PRIMARY_TEAL,
        }),
      ];

  return new Paragraph({
    pageBreakBefore,
    spacing: { before: 180, after: 60 },
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

function createOverviewParagraph(text) {
  return new Paragraph({
    spacing: { before: 120, after: 80 },
    children: [
      new TextRun({
        text: text,
        color: TFCU_COLORS.OVERVIEW_TEAL,
        size: 26,
        font: "Calibri",
        bold: true,
        italics: true,
      }),
    ],
  });
}

function createBodyParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: options.spacing || 120 },
    indent: options.indent ? { left: options.indent } : undefined,
    children: [
      new TextRun({
        text: text,
        size: FONT_SIZES.bodyText,
        font: "Calibri",
      }),
    ],
  });
}

function createNumberedStep(number, text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360, hanging: 360 },
    children: [
      new TextRun({
        text: `${number}. ${text}`,
        size: FONT_SIZES.bodyText,
        font: "Calibri",
      }),
    ],
  });
}

function createSubStep(letter, text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 720, hanging: 360 },
    children: [
      new TextRun({
        text: `${letter}. ${text}`,
        size: FONT_SIZES.tableBody,
        font: "Calibri",
      }),
    ],
  });
}

function createCalloutBox(type, title, content) {
  const colors = {
    CRITICAL: {
      bg: TFCU_COLORS.CRITICAL_BG,
      border: TFCU_COLORS.CRITICAL_BORDER,
      icon: "🚨",
    },
    WARNING: {
      bg: TFCU_COLORS.WARNING_BG,
      border: TFCU_COLORS.WARNING_BORDER,
      icon: "⚠️",
    },
    NOTE: {
      bg: TFCU_COLORS.NOTE_BG,
      border: TFCU_COLORS.NOTE_BORDER,
      icon: "ℹ️",
    },
    TIP: { bg: TFCU_COLORS.TIP_BG, border: TFCU_COLORS.TIP_BORDER, icon: "💡" },
  };
  const c = colors[type];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: c.bg, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: c.border },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: c.border },
              left: { style: BorderStyle.SINGLE, size: 32, color: c.border },
              right: { style: BorderStyle.SINGLE, size: 4, color: c.border },
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 40 },
                children: [
                  new TextRun({
                    text: `${c.icon} ${title}`,
                    bold: true,
                    size: FONT_SIZES.calloutText,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: content,
                    size: FONT_SIZES.calloutText,
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

function createInterventionMarker(type, text) {
  // Types: SME INPUT REQUIRED, VERIFY, CONFIRM, SUGGESTED, MISSING, CHECK
  return new TextRun({
    text: `[${type}: ${text}]`,
    bold: true,
    italics: true,
    color: TFCU_COLORS.INTERVENTION_RED,
    size: FONT_SIZES.tableBody,
    font: "Calibri",
    highlight: "yellow",
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
                  size: FONT_SIZES.tableBody,
                  font: "Calibri",
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
        rowChildren.push(
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: item.label,
                    bold: true,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: item.value,
                    size: FONT_SIZES.tableBody,
                    font: item.monospace ? "Consolas" : "Calibri",
                  }),
                ],
              }),
            ],
          }),
        );
      }
    }
    rows.push(new TableRow({ children: rowChildren }));
  }

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function createScreenshotPlaceholder(figureNumber, description, callouts = []) {
  const calloutText =
    callouts.length > 0
      ? `\nCallouts: ${callouts.map((c, i) => `(${i + 1}) ${c}`).join(", ")}`
      : "";

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR },
            borders: {
              top: {
                style: BorderStyle.DASHED,
                size: 8,
                color: TFCU_COLORS.TABLE_BORDER,
              },
              bottom: {
                style: BorderStyle.DASHED,
                size: 8,
                color: TFCU_COLORS.TABLE_BORDER,
              },
              left: {
                style: BorderStyle.DASHED,
                size: 8,
                color: TFCU_COLORS.TABLE_BORDER,
              },
              right: {
                style: BorderStyle.DASHED,
                size: 8,
                color: TFCU_COLORS.TABLE_BORDER,
              },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 100 },
                children: [
                  new TextRun({
                    text: `[SCREENSHOT PLACEHOLDER]`,
                    bold: true,
                    size: FONT_SIZES.bodyText,
                    font: "Calibri",
                    color: TFCU_COLORS.FOOTER_GRAY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: description,
                    italics: true,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                    color: TFCU_COLORS.FOOTER_GRAY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: `Figure ${figureNumber}${calloutText}`,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                    color: TFCU_COLORS.FOOTER_GRAY,
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

function createStepWithScreenshotPlaceholder(
  stepNumber,
  stepText,
  figureNumber,
  screenshotDesc,
  callouts = [],
) {
  const calloutText =
    callouts.length > 0
      ? callouts.map((c, i) => `(${i + 1}) ${c}`).join(", ")
      : "";

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          // Text column (55%)
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `${stepNumber}. ${stepText}`,
                    size: FONT_SIZES.bodyText,
                    font: "Calibri",
                  }),
                ],
              }),
              ...(callouts.length > 0
                ? [
                    new Paragraph({
                      spacing: { after: 60 },
                      indent: { left: 360 },
                      children: [
                        new TextRun({
                          text: `Callouts: ${calloutText}`,
                          size: FONT_SIZES.tableBody,
                          font: "Calibri",
                          italics: true,
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
          // Screenshot column (45%)
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                shading: {
                  fill: TFCU_COLORS.LIGHT_GRAY,
                  type: ShadingType.CLEAR,
                },
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({
                    text: `[SCREENSHOT: ${screenshotDesc}]`,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                    color: TFCU_COLORS.FOOTER_GRAY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `Figure ${figureNumber}`,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                    italics: true,
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

function createTroubleshootingTable(issues) {
  const headerBorder = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: TFCU_COLORS.PRIMARY_TEAL,
  };

  const rows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: {
            top: headerBorder,
            bottom: headerBorder,
            left: headerBorder,
            right: headerBorder,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Issue",
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: FONT_SIZES.tableBody,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: {
            top: headerBorder,
            bottom: headerBorder,
            left: headerBorder,
            right: headerBorder,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Cause",
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: FONT_SIZES.tableBody,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: {
            top: headerBorder,
            bottom: headerBorder,
            left: headerBorder,
            right: headerBorder,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Resolution",
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: FONT_SIZES.tableBody,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  issues.forEach((issue, i) => {
    const shade = i % 2 === 0 ? TFCU_COLORS.WHITE : TFCU_COLORS.LIGHT_GRAY;
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: issue.issue,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: issue.cause,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: issue.resolution,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function createGlossaryTable(terms) {
  const headerBorder = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: TFCU_COLORS.PRIMARY_TEAL,
  };

  const rows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: {
            top: headerBorder,
            bottom: headerBorder,
            left: headerBorder,
            right: headerBorder,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Term",
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: FONT_SIZES.tableBody,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: {
            top: headerBorder,
            bottom: headerBorder,
            left: headerBorder,
            right: headerBorder,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Definition",
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: FONT_SIZES.tableBody,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  terms.forEach((term, i) => {
    const shade = i % 2 === 0 ? TFCU_COLORS.WHITE : TFCU_COLORS.LIGHT_GRAY;
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: term.term,
                    bold: true,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: term.definition,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function createRevisionTable(revisions) {
  const headerBorder = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: TFCU_COLORS.PRIMARY_TEAL,
  };

  const rows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: {
            top: headerBorder,
            bottom: headerBorder,
            left: headerBorder,
            right: headerBorder,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Date",
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: FONT_SIZES.tableBody,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: {
            top: headerBorder,
            bottom: headerBorder,
            left: headerBorder,
            right: headerBorder,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Reviewer",
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: FONT_SIZES.tableBody,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: TFCU_COLORS.PRIMARY_TEAL, type: ShadingType.CLEAR },
          borders: {
            top: headerBorder,
            bottom: headerBorder,
            left: headerBorder,
            right: headerBorder,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Changes",
                  bold: true,
                  color: TFCU_COLORS.WHITE,
                  size: FONT_SIZES.tableBody,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  revisions.forEach((rev, i) => {
    const shade = i % 2 === 0 ? TFCU_COLORS.WHITE : TFCU_COLORS.LIGHT_GRAY;
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: rev.date,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: rev.reviewer,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: shade, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: rev.changes,
                    size: FONT_SIZES.tableBody,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function spacer(height = 100) {
  return new Paragraph({ spacing: { after: height }, children: [] });
}

// ============================================================================
// GENERATE COMPREHENSIVE TEMPLATE DOCUMENT
// ============================================================================

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: FONT_SIZES.bodyText },
      },
    },
  },
  sections: [
    {
      properties: {},
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Operations | Comprehensive Template Reference | Page ",
                  size: FONT_SIZES.footer,
                  color: TFCU_COLORS.FOOTER_GRAY,
                  font: "Calibri",
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: FONT_SIZES.footer,
                  color: TFCU_COLORS.FOOTER_GRAY,
                }),
                new TextRun({
                  text: " of ",
                  size: FONT_SIZES.footer,
                  color: TFCU_COLORS.FOOTER_GRAY,
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: FONT_SIZES.footer,
                  color: TFCU_COLORS.FOOTER_GRAY,
                }),
                new TextRun({
                  text: `  ·  ${SKILL_VERSION}`,
                  size: 16,
                  color: "AAAAAA",
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ========== HEADER TABLE ==========
        createHeaderTable(
          "Comprehensive Template Reference",
          "Operations",
          "December 2025",
        ),
        spacer(),

        // ========== TABLE OF CONTENTS (Inline - NOT a table!) ==========
        createTableOfContents([
          { title: "Overview", anchor: "overview" },
          { title: "Related", anchor: "related" },
          { title: "Quick Reference", anchor: "quick-reference" },
          { title: "Prerequisites", anchor: "prerequisites" },
          { title: "Main Procedure", anchor: "main-procedure" },
          { title: "Callout Examples", anchor: "callout-examples" },
          { title: "Troubleshooting", anchor: "troubleshooting" },
          { title: "Glossary", anchor: "glossary" },
          { title: "Revision History", anchor: "revision-history" },
        ]),

        // ========== OVERVIEW ==========
        createSectionHeader("OVERVIEW", "overview"),
        createOverviewParagraph(
          "This comprehensive template demonstrates all formatting capabilities of the TFCU Procedure Formatter skill. Use this as a visual reference for correct element styling, spacing, and layout.",
        ),

        // ========== RELATED ==========
        createSectionHeader("RELATED", "related"),
        createBodyParagraph(
          "Policies: Debit Card Policy, Member Authentication Policy",
        ),
        createBodyParagraph(
          "Procedures: Card Issuance Procedure, PIN Management Procedure",
        ),
        createBodyParagraph("Forms: Card Request Form, Limit Increase Request"),

        // ========== QUICK REFERENCE BOX ==========
        createSectionHeader("QUICK REFERENCE", "quick-reference"),
        createQuickReferenceBox([
          { label: "Support Line", value: "ext. 4500", monospace: true },
          { label: "Hours", value: "Mon-Fri 8am-5pm" },
          { label: "Consumer BIN", value: "41139300", monospace: true },
          { label: "Business BIN", value: "41139301", monospace: true },
          { label: "Daily Limit", value: "$2,500" },
          { label: "System", value: "CardWizard" },
        ]),
        spacer(),

        // ========== PREREQUISITES ==========
        createSectionHeader("PREREQUISITES", "prerequisites"),
        createBodyParagraph("Before beginning this procedure, ensure:"),
        createBodyParagraph(
          "• Member identity has been verified per authentication policy",
        ),
        createBodyParagraph("• You have access to CardWizard system"),
        createBodyParagraph(
          "• Card stock is available (if issuing instant card)",
        ),
        spacer(60),

        // ========== MAIN PROCEDURE WITH SCREENSHOTS ==========
        createSectionHeader("MAIN PROCEDURE", "main-procedure", true),

        // Step 1 with screenshot placeholder
        createStepWithScreenshotPlaceholder(
          1,
          "Navigate to the Card Management screen in CardWizard. Click Member Services > Card Management from the main menu.",
          1,
          "CardWizard main menu with Card Management highlighted",
          ["Main menu bar", "Card Management option"],
        ),
        spacer(60),

        // Step 2 with sub-steps
        createNumberedStep(2, "Search for the member's account:"),
        createSubStep("a", "Enter the member number in the search field"),
        createSubStep("b", "Click Search or press Enter"),
        createSubStep("c", "Verify the correct member is displayed"),
        spacer(60),

        // Step 3 with intervention marker example
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360, hanging: 360 },
          children: [
            new TextRun({
              text: "3. Verify the daily transaction limit is set to ",
              size: FONT_SIZES.bodyText,
              font: "Calibri",
            }),
            createInterventionMarker(
              "SME INPUT REQUIRED",
              "current daily limit amount",
            ),
            new TextRun({
              text: " for consumer accounts.",
              size: FONT_SIZES.bodyText,
              font: "Calibri",
            }),
          ],
        }),
        spacer(60),

        // Step 4 with VERIFY marker
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360, hanging: 360 },
          children: [
            new TextRun({
              text: "4. Confirm the card type matches the request: ",
              size: FONT_SIZES.bodyText,
              font: "Calibri",
            }),
            createInterventionMarker(
              "VERIFY",
              "card type from source document",
            ),
            new TextRun({
              text: ".",
              size: FONT_SIZES.bodyText,
              font: "Calibri",
            }),
          ],
        }),
        spacer(60),

        // Step 5 with standalone screenshot placeholder
        createNumberedStep(
          5,
          "Review the confirmation screen and verify all information is correct:",
        ),
        spacer(60),
        createScreenshotPlaceholder(
          2,
          "Card issuance confirmation screen showing member details and card information",
          [
            "Member name field",
            "Card type",
            "Expiration date",
            "Confirm button",
          ],
        ),
        spacer(60),

        // Step 6 with SUGGESTED marker
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360, hanging: 360 },
          children: [
            new TextRun({
              text: "6. ",
              size: FONT_SIZES.bodyText,
              font: "Calibri",
            }),
            createInterventionMarker(
              "SUGGESTED",
              "Document the transaction in the member's notes",
            ),
            new TextRun({
              text: " Include the card last 4 digits and issuance reason.",
              size: FONT_SIZES.bodyText,
              font: "Calibri",
            }),
          ],
        }),
        spacer(),

        // ========== CALLOUT EXAMPLES ==========
        createSectionHeader("CALLOUT EXAMPLES", "callout-examples", true),

        createBodyParagraph(
          "The following callout types are available for highlighting important information:",
        ),
        spacer(60),

        // CRITICAL callout
        createCalloutBox(
          "CRITICAL",
          "CRITICAL: Regulatory Requirement",
          "Members must verify their identity per Reg E before any card transaction limit changes. Failure to comply may result in regulatory violations.",
        ),
        spacer(),

        // WARNING callout
        createCalloutBox(
          "WARNING",
          "WARNING: System Limitation",
          "Do not close the browser window during card processing. This may result in duplicate card issuance or system errors that require supervisor intervention.",
        ),
        spacer(),

        // NOTE callout
        createCalloutBox(
          "NOTE",
          "NOTE: Processing Time",
          "Card activation typically takes 30-60 seconds. The system will display a confirmation message when complete. No action is needed during this time.",
        ),
        spacer(),

        // TIP callout
        createCalloutBox(
          "TIP",
          "TIP: Keyboard Shortcut",
          "Use Ctrl+M to quickly access the Member Search screen from anywhere in CardWizard. This saves 3-4 clicks compared to menu navigation.",
        ),
        spacer(),

        // ========== TROUBLESHOOTING ==========
        createSectionHeader("TROUBLESHOOTING", "troubleshooting", true),
        createTroubleshootingTable([
          {
            issue: "Card not activating",
            cause: "Network timeout or system delay",
            resolution:
              "Wait 60 seconds and retry. If issue persists, check system status page.",
          },
          {
            issue: '"Member Not Found" error',
            cause: "Incorrect member number or account closed",
            resolution:
              "Verify member number. Check if account is in closed status.",
          },
          {
            issue: "Daily limit exceeded message",
            cause: "Member has reached transaction limit",
            resolution:
              "Verify current usage. Process temporary limit increase if authorized.",
          },
          {
            issue: "Duplicate card warning",
            cause: "Active card already exists on account",
            resolution:
              "Confirm with member if replacement is needed. Cancel existing card first.",
          },
        ]),
        spacer(),

        // ========== GLOSSARY ==========
        createSectionHeader("GLOSSARY", "glossary", true),
        createGlossaryTable([
          {
            term: "BIN",
            definition:
              "Bank Identification Number - the first 6-8 digits of a card number identifying the issuing institution",
          },
          {
            term: "CVV",
            definition:
              "Card Verification Value - 3-digit security code on the back of the card",
          },
          {
            term: "Instant Issue",
            definition:
              "Card printed and activated on-site during the member's visit",
          },
          {
            term: "Hot Card",
            definition:
              "A card that has been reported lost/stolen and blocked from transactions",
          },
          {
            term: "PIN Offset",
            definition:
              "Encrypted value used to verify the member's PIN during transactions",
          },
        ]),
        spacer(),

        // ========== REVISION HISTORY ==========
        createSectionHeader("REVISION HISTORY", "revision-history", true),
        createRevisionTable([
          {
            date: "December 2025",
            reviewer: "Template Generator",
            changes:
              "Initial comprehensive template creation demonstrating all skill capabilities",
          },
          {
            date: "[Future Date]",
            reviewer: "[Reviewer Name]",
            changes: "[Description of changes made]",
          },
        ]),
      ],
    },
  ],
});

// Write to file
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(
    "extracted-skill/tfcu-procedure-formatter/assets/Procedure_Template.docx",
    buffer,
  );
  console.log("✓ Comprehensive template generated successfully!");
  console.log("");
  console.log(
    "Location: extracted-skill/tfcu-procedure-formatter/assets/Procedure_Template.docx",
  );
  console.log("");
  console.log("Template includes:");
  console.log("  ✓ Header table (correct 2-row layout)");
  console.log("  ✓ Inline TOC (NOT a table)");
  console.log("  ✓ Overview section (teal italic)");
  console.log("  ✓ Related section");
  console.log("  ✓ Quick Reference box (4-column grid)");
  console.log("  ✓ Prerequisites (bullet list)");
  console.log("  ✓ Numbered steps with sub-steps");
  console.log("  ✓ Step with screenshot layout (55%/45%)");
  console.log("  ✓ Screenshot placeholders with figure numbers");
  console.log(
    "  ✓ Intervention markers (SME INPUT REQUIRED, VERIFY, SUGGESTED)",
  );
  console.log("  ✓ All 4 callout types (CRITICAL, WARNING, NOTE, TIP)");
  console.log("  ✓ Troubleshooting table (Issue/Cause/Resolution)");
  console.log("  ✓ Glossary table (Term/Definition)");
  console.log("  ✓ Revision History table");
  console.log("  ✓ Footer with page numbers and version");
});
