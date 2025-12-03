/**
 * TFCU Procedure Formatter - Assessment Template Generator
 *
 * Generates a comprehensive training assessment template demonstrating
 * all question types, formatting, and features of the Assessment Generator.
 *
 * Run: node generate_assessment_template.js
 * Output: extracted-skill/tfcu-procedure-formatter/assets/Assessment_Template.docx
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
  PageBreak,
  HeadingLevel,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
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

  // Intervention markers
  MARKER_RED: "C00000",
  MARKER_HIGHLIGHT: "FFFF00",

  // Callout colors (for reference in questions)
  CRITICAL_BG: "FCE4E4",
  CRITICAL_BORDER: "C00000",
  WARNING_BG: "FFF2CC",
  WARNING_BORDER: "FFC000",
  NOTE_BG: "DEEBF7",
  NOTE_BORDER: "2E74B5",
  TIP_BG: "E2F0D9",
  TIP_BORDER: "548235",
};

const SKILL_VERSION = "v6.0.2";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates the assessment header with teal background
 */
function createAssessmentHeader(procedureName) {
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
              top: convertInchesToTwip(0.15),
              bottom: convertInchesToTwip(0.15),
              left: convertInchesToTwip(0.2),
              right: convertInchesToTwip(0.2),
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "PROCEDURE COMPETENCY ASSESSMENT",
                    bold: true,
                    color: TFCU_COLORS.WHITE,
                    size: 28, // 14pt
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: procedureName,
                    color: TFCU_COLORS.WHITE,
                    size: 24, // 12pt
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
 * Creates a section header with teal underline
 */
function createSectionHeader(text) {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 12, // 1.5pt
        color: TFCU_COLORS.PRIMARY_TEAL,
      },
    },
    children: [
      new TextRun({
        text: text,
        bold: true,
        color: TFCU_COLORS.PRIMARY_TEAL,
        size: 24, // 12pt
        font: "Calibri",
      }),
    ],
  });
}

/**
 * Creates an intervention marker
 */
function createInterventionMarker(type, text) {
  return new TextRun({
    text: `[${type}: ${text}]`,
    bold: true,
    italics: true,
    color: TFCU_COLORS.MARKER_RED,
    highlight: "yellow",
    size: 20, // 10pt
    font: "Calibri",
  });
}

/**
 * Creates a multiple choice question
 */
function createMultipleChoiceQuestion(
  number,
  question,
  options,
  helperNote = null,
) {
  const children = [
    // Question
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: `${number}. `,
          bold: true,
          size: 22, // 11pt
          font: "Calibri",
        }),
        new TextRun({
          text: question,
          size: 22,
          font: "Calibri",
        }),
      ],
    }),
  ];

  // Options
  options.forEach((option, index) => {
    const letter = String.fromCharCode(97 + index); // a, b, c, d
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        indent: { left: convertInchesToTwip(0.35) },
        children: [
          new TextRun({
            text: `${letter}) ${option}`,
            size: 20, // 10pt
            font: "Calibri",
          }),
        ],
      }),
    );
  });

  // Helper note (if provided)
  if (helperNote) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 60 },
        indent: { left: convertInchesToTwip(0.35) },
        shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
        children: [
          new TextRun({
            text: helperNote,
            italics: true,
            size: 18, // 9pt
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
 * Creates a true/false question
 */
function createTrueFalseQuestion(number, statement, helperNote = null) {
  const children = [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: `${number}. `,
          bold: true,
          size: 22,
          font: "Calibri",
        }),
        new TextRun({
          text: "[True/False] ",
          bold: true,
          size: 22,
          font: "Calibri",
        }),
        new TextRun({
          text: statement,
          size: 22,
          font: "Calibri",
        }),
      ],
    }),
  ];

  if (helperNote) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 60 },
        indent: { left: convertInchesToTwip(0.35) },
        shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
        children: [
          new TextRun({
            text: helperNote,
            italics: true,
            size: 18,
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
 * Creates a fill-in-the-blank question
 */
function createFillBlankQuestion(number, question, helperNote = null) {
  const children = [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: `${number}. `,
          bold: true,
          size: 22,
          font: "Calibri",
        }),
        new TextRun({
          text: question,
          size: 22,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      indent: { left: convertInchesToTwip(0.35) },
      children: [
        new TextRun({
          text: "_______________________________________________",
          size: 22,
          font: "Calibri",
        }),
      ],
    }),
  ];

  if (helperNote) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 60 },
        indent: { left: convertInchesToTwip(0.35) },
        shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
        children: [
          new TextRun({
            text: helperNote,
            italics: true,
            size: 18,
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
 * Creates a scenario question
 */
function createScenarioQuestion(
  number,
  scenario,
  question,
  options,
  helperNote = null,
) {
  const children = [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: `${number}. `,
          bold: true,
          size: 22,
          font: "Calibri",
        }),
        new TextRun({
          text: scenario + " ",
          italics: true,
          size: 22,
          font: "Calibri",
        }),
        new TextRun({
          text: question,
          size: 22,
          font: "Calibri",
        }),
      ],
    }),
  ];

  // Options
  options.forEach((option, index) => {
    const letter = String.fromCharCode(97 + index);
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        indent: { left: convertInchesToTwip(0.35) },
        children: [
          new TextRun({
            text: `${letter}) ${option}`,
            size: 20,
            font: "Calibri",
          }),
        ],
      }),
    );
  });

  if (helperNote) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 60 },
        indent: { left: convertInchesToTwip(0.35) },
        shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
        children: [
          new TextRun({
            text: helperNote,
            italics: true,
            size: 18,
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
 * Creates the answer key section
 */
function createAnswerKeyEntry(number, answer, explanation) {
  return new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [
      new TextRun({
        text: `${number}. `,
        bold: true,
        size: 20,
        font: "Calibri",
      }),
      new TextRun({
        text: `${answer} `,
        bold: true,
        color: TFCU_COLORS.PRIMARY_TEAL,
        size: 20,
        font: "Calibri",
      }),
      new TextRun({
        text: `- ${explanation}`,
        size: 20,
        font: "Calibri",
      }),
    ],
  });
}

/**
 * Creates the scoring box
 */
function createScoringBox() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: TFCU_COLORS.PRIMARY_TEAL,
      },
      bottom: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: TFCU_COLORS.PRIMARY_TEAL,
      },
      left: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: TFCU_COLORS.PRIMARY_TEAL,
      },
      right: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: TFCU_COLORS.PRIMARY_TEAL,
      },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
            margins: {
              top: convertInchesToTwip(0.1),
              bottom: convertInchesToTwip(0.1),
              left: convertInchesToTwip(0.15),
              right: convertInchesToTwip(0.15),
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "SCORING",
                    bold: true,
                    color: TFCU_COLORS.PRIMARY_TEAL,
                    size: 24,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 120 },
                children: [
                  new TextRun({
                    text: "Score: _____ / 10 correct = _____%",
                    size: 22,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: "Pass threshold: ",
                    size: 22,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: "80% (8/10 or higher)",
                    bold: true,
                    size: 22,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 160 },
                children: [
                  new TextRun({
                    text: "Recommended actions for scores below 80%:",
                    bold: true,
                    size: 20,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 60 },
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: "Review procedure with supervisor",
                    size: 20,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: "Shadow experienced staff member",
                    size: 20,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: "Retake assessment after additional training",
                    size: 20,
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
 * Creates an instruction callout box
 */
function createInstructionBox(title, content) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: TFCU_COLORS.NOTE_BORDER,
      },
      bottom: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: TFCU_COLORS.NOTE_BORDER,
      },
      left: {
        style: BorderStyle.SINGLE,
        size: 24,
        color: TFCU_COLORS.NOTE_BORDER,
      },
      right: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: TFCU_COLORS.NOTE_BORDER,
      },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: TFCU_COLORS.NOTE_BG, type: ShadingType.CLEAR },
            margins: {
              top: convertInchesToTwip(0.1),
              bottom: convertInchesToTwip(0.1),
              left: convertInchesToTwip(0.15),
              right: convertInchesToTwip(0.15),
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    color: TFCU_COLORS.NOTE_BORDER,
                    size: 22,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: content,
                    size: 20,
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

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

async function generateAssessmentTemplate() {
  const procedureName = "Sample Procedure Name";

  const doc = new Document({
    creator: "TFCU Procedure Formatter",
    title: "Assessment Template",
    description:
      "Comprehensive assessment template demonstrating all question types",
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Assessment for ${procedureName} | Page `,
                    size: 18,
                    color: TFCU_COLORS.GRAY,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: TFCU_COLORS.GRAY,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: " of ",
                    size: 18,
                    color: TFCU_COLORS.GRAY,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: TFCU_COLORS.GRAY,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: `  |  ${SKILL_VERSION}`,
                    size: 18,
                    color: "#AAAAAA",
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Header
          createAssessmentHeader(procedureName),

          // Helper note about this template
          new Paragraph({ spacing: { before: 200 } }),
          createInstructionBox(
            "TEMPLATE GUIDE",
            "This template demonstrates all assessment capabilities. Teal-highlighted notes explain each element. Remove helper notes when generating actual assessments.",
          ),

          // Instructions section
          new Paragraph({ spacing: { before: 200 } }),
          new Paragraph({
            shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: "Instructions: ",
                bold: true,
                size: 22,
                font: "Calibri",
              }),
              new TextRun({
                text: "Complete this assessment after reviewing the procedure. A score of 80% or higher demonstrates proficiency. You may refer to the procedure while completing this assessment.",
                italics: true,
                size: 22,
                font: "Calibri",
              }),
            ],
          }),

          // Employee info
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: "Employee Name: ___________________________ ",
                size: 22,
                font: "Calibri",
              }),
              new TextRun({
                text: "Date: _______________",
                size: 22,
                font: "Calibri",
              }),
            ],
          }),

          // ================================================================
          // SECTION 1: PROCEDURE KNOWLEDGE
          // ================================================================
          createSectionHeader("SECTION 1: PROCEDURE KNOWLEDGE (70%)"),

          new Paragraph({
            spacing: { before: 60, after: 120 },
            shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: "This section tests recall of specific procedure steps, values, and requirements. Questions are auto-generated from procedure content.",
                italics: true,
                size: 18,
                color: TFCU_COLORS.GRAY,
                font: "Calibri",
              }),
            ],
          }),

          // Question 1: Ordering (Multiple Choice)
          ...createMultipleChoiceQuestion(
            1,
            "What is the FIRST step in the Card Issuance process?",
            [
              "Print the card",
              "Verify member identity with two forms of ID",
              "Have member enter PIN",
              "Log in to CardWizard Pro",
            ],
            "ORDERING QUESTION: Tests sequence knowledge. Distractors are other steps from the same procedure.",
          ),

          // Question 2: True/False from CRITICAL callout
          ...createTrueFalseQuestion(
            2,
            "Cards must always be activated before handing to the member, even when reprinting a replacement card.",
            "TRUE/FALSE QUESTION: Derived from CRITICAL callout. Prefer true answers (60% true, 40% false).",
          ),

          // Question 3: Recall (Quick Reference value)
          ...createMultipleChoiceQuestion(
            3,
            "What is the Consumer Debit BIN number according to the Quick Reference?",
            ["400012", "400015", "400018", "400021"],
            "RECALL QUESTION: Tests specific values from Quick Reference box. Use similar but incorrect numbers as distractors.",
          ),

          // Question 4: Fill-in-blank
          ...createFillBlankQuestion(
            4,
            "What must you verify BEFORE proceeding with card printing?",
            "FILL-IN-BLANK QUESTION: Tests application knowledge. Answer should be directly extractable from procedure.",
          ),

          // Question 5: Navigation
          ...createMultipleChoiceQuestion(
            5,
            "To access Card Services, navigate to:",
            [
              "Tools > Card Services",
              "Member > Cards > Services",
              "Administration > Card Management",
              "Services > Card Issuance",
            ],
            "NAVIGATION QUESTION: Tests system navigation paths from procedure steps.",
          ),

          // Question 6: True/False from WARNING
          ...createTrueFalseQuestion(
            6,
            "It is acceptable to leave the card printer unattended during card creation if you step away briefly.",
            "TRUE/FALSE QUESTION: Derived from WARNING callout. This is a FALSE statement testing prohibited actions.",
          ),

          // Question 7: Recall with intervention marker example
          new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: "7. ",
                bold: true,
                size: 22,
                font: "Calibri",
              }),
              new TextRun({
                text: "What is the CardWizard support phone number? ",
                size: 22,
                font: "Calibri",
              }),
              createInterventionMarker("VERIFY", "confirm current number"),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            children: [
              new TextRun({
                text: "a) 1-800-237-3387",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            children: [
              new TextRun({
                text: "b) 1-800-555-1234",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            children: [
              new TextRun({
                text: "c) 1-888-237-3387",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            children: [
              new TextRun({
                text: "d) 1-800-CARDPRO",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 80, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: "INTERVENTION MARKER: [VERIFY] indicates the value needs confirmation. Do not generate questions about unverified values in production.",
                italics: true,
                size: 18,
                color: TFCU_COLORS.GRAY,
                font: "Calibri",
              }),
            ],
          }),

          // ================================================================
          // SECTION 2: SCENARIO APPLICATIONS
          // ================================================================
          createSectionHeader("SECTION 2: SCENARIO APPLICATIONS (30%)"),

          new Paragraph({
            spacing: { before: 60, after: 120 },
            shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: "Scenario questions test decision-making and application of procedure knowledge. These may require SME review to ensure scenarios are realistic.",
                italics: true,
                size: 18,
                color: TFCU_COLORS.GRAY,
                font: "Calibri",
              }),
            ],
          }),

          // Question 8: Scenario
          ...createScenarioQuestion(
            8,
            "A member requests a replacement debit card because their current card is damaged. When you look up the account, you notice it shows a 'Restricted' status.",
            "According to the procedure, what should you do?",
            [
              "Issue the replacement card anyway since the member has ID",
              "Contact your supervisor before proceeding",
              "Tell the member they cannot have a card",
              "Remove the restriction and issue the card",
            ],
            "SCENARIO QUESTION: Tests decision-making at procedure decision points. Requires clear correct answer from procedure.",
          ),

          // Question 9: Scenario with marker
          new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: "9. ",
                bold: true,
                size: 22,
                font: "Calibri",
              }),
              new TextRun({
                text: "You are processing a card issuance when the card printer displays an error and jams. After clearing the jam and retrying, the error persists. ",
                italics: true,
                size: 22,
                font: "Calibri",
              }),
              new TextRun({
                text: "What is the correct next step? ",
                size: 22,
                font: "Calibri",
              }),
              createInterventionMarker(
                "SME INPUT REQUIRED",
                "verify escalation path",
              ),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            children: [
              new TextRun({
                text: "a) Keep trying until it works",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            children: [
              new TextRun({
                text: "b) Contact IT Help Desk",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            children: [
              new TextRun({
                text: "c) Ask a colleague to use their printer",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            children: [
              new TextRun({
                text: "d) Tell the member to come back later",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 80, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: "[SME INPUT REQUIRED] marker indicates this scenario needs SME verification before use in production assessment.",
                italics: true,
                size: 18,
                color: TFCU_COLORS.GRAY,
                font: "Calibri",
              }),
            ],
          }),

          // Question 10: Application
          ...createFillBlankQuestion(
            10,
            "Why is it important to verify the account number matches the member's ID before proceeding with card issuance?",
            "APPLICATION QUESTION: Tests understanding of 'why' behind procedure steps. Answer should be derivable from procedure context.",
          ),

          // ================================================================
          // PAGE BREAK - ANSWER KEY
          // ================================================================
          new Paragraph({
            children: [new PageBreak()],
          }),

          // Answer Key Header
          new Table({
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
                      top: convertInchesToTwip(0.1),
                      bottom: convertInchesToTwip(0.1),
                      left: convertInchesToTwip(0.2),
                      right: convertInchesToTwip(0.2),
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: "ANSWER KEY - SUPERVISOR USE ONLY",
                            bold: true,
                            color: TFCU_COLORS.WHITE,
                            size: 28,
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

          new Paragraph({
            spacing: { before: 120, after: 60 },
            shading: { fill: TFCU_COLORS.LIGHT_TEAL, type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: "Each answer includes the source reference (step number, callout, or section) for verification.",
                italics: true,
                size: 18,
                color: TFCU_COLORS.GRAY,
                font: "Calibri",
              }),
            ],
          }),

          createSectionHeader("SECTION 1 ANSWERS"),

          createAnswerKeyEntry(
            1,
            "B",
            "Verify member identity with two forms of ID (Step 1 - first step in procedure)",
          ),
          createAnswerKeyEntry(
            2,
            "True",
            "CRITICAL callout states cards must always be activated before handing to member",
          ),
          createAnswerKeyEntry(
            3,
            "A",
            "400012 is the Consumer Debit BIN (Quick Reference box)",
          ),
          createAnswerKeyEntry(
            4,
            "Account information matches member ID",
            "Step 4 requires verification before proceeding",
          ),
          createAnswerKeyEntry(
            5,
            "A",
            "Tools > Card Services (Step 2 navigation path)",
          ),
          createAnswerKeyEntry(
            6,
            "False",
            "WARNING callout prohibits leaving printer unattended",
          ),
          createAnswerKeyEntry(
            7,
            "A",
            "1-800-237-3387 (Quick Contacts section)",
          ),

          createSectionHeader("SECTION 2 ANSWERS"),

          createAnswerKeyEntry(
            8,
            "B",
            "Contact supervisor for restricted accounts (Troubleshooting section)",
          ),
          createAnswerKeyEntry(
            9,
            "B",
            "Contact IT Help Desk for persistent errors (Escalation procedure)",
          ),
          createAnswerKeyEntry(
            10,
            "To prevent issuing cards to unauthorized individuals / fraud prevention",
            "Security requirement from procedure overview",
          ),

          // Scoring box
          new Paragraph({ spacing: { before: 300 } }),
          createScoringBox(),

          // Disclaimers
          new Paragraph({ spacing: { before: 200 } }),
          new Paragraph({
            spacing: { before: 120 },
            children: [
              new TextRun({
                text: "DISCLAIMERS",
                bold: true,
                color: TFCU_COLORS.PRIMARY_TEAL,
                size: 22,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: "This assessment covers procedural knowledge. Visual recognition of screens should be verified through hands-on practice.",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: "Passing this assessment demonstrates procedural knowledge but does not replace hands-on training or supervisor verification.",
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: "For compliance procedures: This assessment does not constitute compliance certification. Formal training programs may have additional requirements.",
                size: 20,
                font: "Calibri",
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
    "extracted-skill/tfcu-procedure-formatter/assets/Assessment_Template.docx",
  );

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  console.log("Assessment template generated successfully!");
  console.log(`\nLocation: ${outputPath}`);
  console.log("\nTemplate includes:");
  console.log("  - Header with procedure name");
  console.log("  - Instructions section with employee info");
  console.log("  - Section 1: Procedure Knowledge (7 questions)");
  console.log("    - Multiple choice (ordering, recall, navigation)");
  console.log("    - True/False (from callouts)");
  console.log("    - Fill-in-blank");
  console.log("  - Section 2: Scenario Applications (3 questions)");
  console.log("    - Scenario-based decision questions");
  console.log("    - Application questions");
  console.log("  - Intervention markers ([VERIFY], [SME INPUT REQUIRED])");
  console.log("  - Answer Key (separate page)");
  console.log("  - Scoring section with pass threshold");
  console.log("  - Disclaimers");
  console.log("  - Helper notes explaining each element");
}

generateAssessmentTemplate().catch(console.error);
