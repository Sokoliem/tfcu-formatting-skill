/**
 * TFCU Procedure Formatter - OOXML Parser
 *
 * Extracts document properties from .docx files for compliance validation.
 * Uses JSZip to read the OOXML container and parses XML to extract:
 * - Typography (fonts, sizes, colors, weights)
 * - Layout (margins, spacing, alignment)
 * - Tables (structure, borders, widths)
 * - Callouts (background, borders)
 */

const JSZip = require("jszip");
const { DOMParser } = require("@xmldom/xmldom");

// OOXML namespace URIs
const NS = {
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
};

/**
 * Parse a .docx file and extract all properties
 * @param {Buffer|string} docxInput - File buffer or path
 * @returns {Promise<Object>} Extracted document properties
 */
async function parseDocument(docxInput) {
  // Load the ZIP container
  const zip = await JSZip.loadAsync(docxInput);

  // Extract and parse XML files
  const documentXml = await getXmlDoc(zip, "word/document.xml");
  const stylesXml = await getXmlDoc(zip, "word/styles.xml");

  if (!documentXml) {
    throw new Error("Invalid .docx file: missing word/document.xml");
  }

  return {
    margins: extractPageMargins(documentXml),
    typography: extractTypography(documentXml, stylesXml),
    tables: extractTables(documentXml),
    paragraphs: extractParagraphs(documentXml),
    callouts: detectCallouts(documentXml),
    headerTable: extractHeaderTable(documentXml),
    footer: await extractFooter(zip),
  };
}

/**
 * Get and parse an XML file from the ZIP
 * @param {JSZip} zip - ZIP file object
 * @param {string} path - Path within ZIP
 * @returns {Promise<Document|null>}
 */
async function getXmlDoc(zip, path) {
  const file = zip.file(path);
  if (!file) return null;

  const content = await file.async("string");
  const parser = new DOMParser();
  return parser.parseFromString(content, "text/xml");
}

/**
 * Extract page margins from document section properties
 * @param {Document} doc - Parsed document.xml
 * @returns {Object} Margin values in DXA
 */
function extractPageMargins(doc) {
  const sectPr = doc.getElementsByTagNameNS(NS.w, "sectPr")[0];
  if (!sectPr) return null;

  const pgMar = sectPr.getElementsByTagNameNS(NS.w, "pgMar")[0];
  if (!pgMar) return null;

  return {
    top: parseInt(pgMar.getAttributeNS(NS.w, "top") || "1440", 10),
    bottom: parseInt(pgMar.getAttributeNS(NS.w, "bottom") || "1440", 10),
    left: parseInt(pgMar.getAttributeNS(NS.w, "left") || "1440", 10),
    right: parseInt(pgMar.getAttributeNS(NS.w, "right") || "1440", 10),
  };
}

/**
 * Extract typography information from paragraphs and runs
 * @param {Document} doc - Parsed document.xml
 * @param {Document} styles - Parsed styles.xml
 * @returns {Object} Typography data
 */
function extractTypography(doc, styles) {
  const runs = doc.getElementsByTagNameNS(NS.w, "r");
  const typography = {
    fonts: new Set(),
    sizes: new Set(),
    colors: new Set(),
    samples: [],
  };

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const rPr = run.getElementsByTagNameNS(NS.w, "rPr")[0];
    if (!rPr) continue;

    const text = getRunText(run);
    if (!text) continue;

    const props = extractRunProperties(rPr);
    if (props.font) typography.fonts.add(props.font);
    if (props.size) typography.sizes.add(props.size);
    if (props.color) typography.colors.add(props.color);

    // Sample first few unique combinations
    if (typography.samples.length < 20) {
      typography.samples.push({
        text: text.substring(0, 50),
        ...props,
      });
    }
  }

  return {
    fonts: Array.from(typography.fonts),
    sizes: Array.from(typography.sizes),
    colors: Array.from(typography.colors),
    samples: typography.samples,
  };
}

/**
 * Extract properties from a run properties element
 * @param {Element} rPr - w:rPr element
 * @returns {Object} Run properties
 */
function extractRunProperties(rPr) {
  const fonts = rPr.getElementsByTagNameNS(NS.w, "rFonts")[0];
  const sz = rPr.getElementsByTagNameNS(NS.w, "sz")[0];
  const szCs = rPr.getElementsByTagNameNS(NS.w, "szCs")[0];
  const color = rPr.getElementsByTagNameNS(NS.w, "color")[0];
  const bold = rPr.getElementsByTagNameNS(NS.w, "b")[0];
  const italic = rPr.getElementsByTagNameNS(NS.w, "i")[0];
  const underline = rPr.getElementsByTagNameNS(NS.w, "u")[0];

  return {
    font:
      fonts?.getAttributeNS(NS.w, "ascii") ||
      fonts?.getAttributeNS(NS.w, "hAnsi") ||
      null,
    size: sz ? parseInt(sz.getAttributeNS(NS.w, "val"), 10) : null,
    sizeCs: szCs ? parseInt(szCs.getAttributeNS(NS.w, "val"), 10) : null,
    color: color?.getAttributeNS(NS.w, "val") || null,
    bold: bold !== null,
    italic: italic !== null,
    underline: underline?.getAttributeNS(NS.w, "val") || null,
  };
}

/**
 * Get text content from a run
 * @param {Element} run - w:r element
 * @returns {string}
 */
function getRunText(run) {
  const textNodes = run.getElementsByTagNameNS(NS.w, "t");
  let text = "";
  for (let i = 0; i < textNodes.length; i++) {
    text += textNodes[i].textContent || "";
  }
  return text.trim();
}

/**
 * Extract all tables from document
 * @param {Document} doc - Parsed document.xml
 * @returns {Array} Table data
 */
function extractTables(doc) {
  const tables = doc.getElementsByTagNameNS(NS.w, "tbl");
  const result = [];

  for (let i = 0; i < tables.length; i++) {
    const tbl = tables[i];
    result.push(extractTable(tbl, i));
  }

  return result;
}

/**
 * Extract data from a single table
 * @param {Element} tbl - w:tbl element
 * @param {number} index - Table index
 * @returns {Object} Table data
 */
function extractTable(tbl, index) {
  const tblPr = tbl.getElementsByTagNameNS(NS.w, "tblPr")[0];
  const rows = tbl.getElementsByTagNameNS(NS.w, "tr");

  const tableData = {
    index,
    rowCount: rows.length,
    properties: extractTableProperties(tblPr),
    rows: [],
  };

  for (let i = 0; i < rows.length; i++) {
    tableData.rows.push(extractTableRow(rows[i], i));
  }

  return tableData;
}

/**
 * Extract table properties
 * @param {Element} tblPr - w:tblPr element
 * @returns {Object}
 */
function extractTableProperties(tblPr) {
  if (!tblPr) return {};

  const tblW = tblPr.getElementsByTagNameNS(NS.w, "tblW")[0];
  const tblBorders = tblPr.getElementsByTagNameNS(NS.w, "tblBorders")[0];

  return {
    width: tblW
      ? {
          value: parseInt(tblW.getAttributeNS(NS.w, "w") || "0", 10),
          type: tblW.getAttributeNS(NS.w, "type"),
        }
      : null,
    borders: extractBorders(tblBorders),
  };
}

/**
 * Extract table row data
 * @param {Element} tr - w:tr element
 * @param {number} rowIndex - Row index
 * @returns {Object}
 */
function extractTableRow(tr, rowIndex) {
  const cells = tr.getElementsByTagNameNS(NS.w, "tc");
  const rowData = {
    index: rowIndex,
    cellCount: cells.length,
    cells: [],
  };

  for (let i = 0; i < cells.length; i++) {
    rowData.cells.push(extractTableCell(cells[i], i));
  }

  return rowData;
}

/**
 * Extract table cell data
 * @param {Element} tc - w:tc element
 * @param {number} cellIndex - Cell index
 * @returns {Object}
 */
function extractTableCell(tc, cellIndex) {
  const tcPr = tc.getElementsByTagNameNS(NS.w, "tcPr")[0];

  return {
    index: cellIndex,
    properties: extractCellProperties(tcPr),
    text: getCellText(tc),
    runs: extractCellRuns(tc),
  };
}

/**
 * Extract cell properties
 * @param {Element} tcPr - w:tcPr element
 * @returns {Object}
 */
function extractCellProperties(tcPr) {
  if (!tcPr) return {};

  const shd = tcPr.getElementsByTagNameNS(NS.w, "shd")[0];
  const tcW = tcPr.getElementsByTagNameNS(NS.w, "tcW")[0];
  const vAlign = tcPr.getElementsByTagNameNS(NS.w, "vAlign")[0];
  const tcBorders = tcPr.getElementsByTagNameNS(NS.w, "tcBorders")[0];
  const tcMar = tcPr.getElementsByTagNameNS(NS.w, "tcMar")[0];

  return {
    shading: shd?.getAttributeNS(NS.w, "fill") || null,
    width: tcW
      ? {
          value: parseInt(tcW.getAttributeNS(NS.w, "w") || "0", 10),
          type: tcW.getAttributeNS(NS.w, "type"),
        }
      : null,
    verticalAlign: vAlign?.getAttributeNS(NS.w, "val") || null,
    borders: extractBorders(tcBorders),
    margins: extractCellMargins(tcMar),
  };
}

/**
 * Extract borders from a borders element
 * @param {Element} borders - w:tblBorders or w:tcBorders
 * @returns {Object}
 */
function extractBorders(borders) {
  if (!borders) return null;

  const result = {};
  const sides = ["top", "bottom", "left", "right"];

  sides.forEach((side) => {
    const border = borders.getElementsByTagNameNS(NS.w, side)[0];
    if (border) {
      result[side] = {
        style: border.getAttributeNS(NS.w, "val"),
        size: parseInt(border.getAttributeNS(NS.w, "sz") || "0", 10),
        color: border.getAttributeNS(NS.w, "color"),
      };
    }
  });

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Extract cell margins
 * @param {Element} tcMar - w:tcMar element
 * @returns {Object}
 */
function extractCellMargins(tcMar) {
  if (!tcMar) return null;

  const result = {};
  const sides = ["top", "bottom", "left", "right"];

  sides.forEach((side) => {
    const margin = tcMar.getElementsByTagNameNS(NS.w, side)[0];
    if (margin) {
      result[side] = parseInt(margin.getAttributeNS(NS.w, "w") || "0", 10);
    }
  });

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Get text content from a cell
 * @param {Element} tc - w:tc element
 * @returns {string}
 */
function getCellText(tc) {
  const paragraphs = tc.getElementsByTagNameNS(NS.w, "p");
  let text = "";

  for (let i = 0; i < paragraphs.length; i++) {
    const runs = paragraphs[i].getElementsByTagNameNS(NS.w, "r");
    for (let j = 0; j < runs.length; j++) {
      text += getRunText(runs[j]);
    }
    if (i < paragraphs.length - 1) text += "\n";
  }

  return text.trim();
}

/**
 * Extract run properties from cell
 * @param {Element} tc - w:tc element
 * @returns {Array}
 */
function extractCellRuns(tc) {
  const runs = tc.getElementsByTagNameNS(NS.w, "r");
  const result = [];

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const rPr = run.getElementsByTagNameNS(NS.w, "rPr")[0];
    result.push({
      text: getRunText(run),
      properties: rPr ? extractRunProperties(rPr) : {},
    });
  }

  return result;
}

/**
 * Extract all paragraphs
 * @param {Document} doc - Parsed document.xml
 * @returns {Array}
 */
function extractParagraphs(doc) {
  const paragraphs = doc.getElementsByTagNameNS(NS.w, "p");
  const result = [];

  for (let i = 0; i < paragraphs.length; i++) {
    result.push(extractParagraph(paragraphs[i], i));
  }

  return result;
}

/**
 * Extract paragraph data
 * @param {Element} p - w:p element
 * @param {number} index - Paragraph index
 * @returns {Object}
 */
function extractParagraph(p, index) {
  const pPr = p.getElementsByTagNameNS(NS.w, "pPr")[0];

  return {
    index,
    properties: extractParagraphProperties(pPr),
    text: getParagraphText(p),
    runs: extractParagraphRuns(p),
  };
}

/**
 * Extract paragraph properties
 * @param {Element} pPr - w:pPr element
 * @returns {Object}
 */
function extractParagraphProperties(pPr) {
  if (!pPr) return {};

  const spacing = pPr.getElementsByTagNameNS(NS.w, "spacing")[0];
  const ind = pPr.getElementsByTagNameNS(NS.w, "ind")[0];
  const jc = pPr.getElementsByTagNameNS(NS.w, "jc")[0];
  const pBdr = pPr.getElementsByTagNameNS(NS.w, "pBdr")[0];
  const shd = pPr.getElementsByTagNameNS(NS.w, "shd")[0];

  return {
    spacing: spacing
      ? {
          before: parseInt(spacing.getAttributeNS(NS.w, "before") || "0", 10),
          after: parseInt(spacing.getAttributeNS(NS.w, "after") || "0", 10),
          line: parseInt(spacing.getAttributeNS(NS.w, "line") || "240", 10),
        }
      : null,
    indent: ind
      ? {
          left: parseInt(ind.getAttributeNS(NS.w, "left") || "0", 10),
          right: parseInt(ind.getAttributeNS(NS.w, "right") || "0", 10),
          firstLine: parseInt(ind.getAttributeNS(NS.w, "firstLine") || "0", 10),
        }
      : null,
    alignment: jc?.getAttributeNS(NS.w, "val") || null,
    borders: extractBorders(pBdr),
    shading: shd?.getAttributeNS(NS.w, "fill") || null,
  };
}

/**
 * Get text from paragraph
 * @param {Element} p - w:p element
 * @returns {string}
 */
function getParagraphText(p) {
  const runs = p.getElementsByTagNameNS(NS.w, "r");
  let text = "";
  for (let i = 0; i < runs.length; i++) {
    text += getRunText(runs[i]);
  }
  return text.trim();
}

/**
 * Extract runs from paragraph
 * @param {Element} p - w:p element
 * @returns {Array}
 */
function extractParagraphRuns(p) {
  const runs = p.getElementsByTagNameNS(NS.w, "r");
  const result = [];

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const rPr = run.getElementsByTagNameNS(NS.w, "rPr")[0];
    result.push({
      text: getRunText(run),
      properties: rPr ? extractRunProperties(rPr) : {},
    });
  }

  return result;
}

/**
 * Detect callout boxes by their characteristic styling
 * @param {Document} doc - Parsed document.xml
 * @returns {Array} Detected callouts
 */
function detectCallouts(doc) {
  const paragraphs = doc.getElementsByTagNameNS(NS.w, "p");
  const callouts = [];

  // Callout colors for detection
  const calloutColors = {
    F8D7DA: { type: "critical", border: "C00000" },
    FFF2CC: { type: "warning", border: "FFC000" },
    D1ECF1: { type: "info", border: "2E74B5" },
    E2F0D9: { type: "tip", border: "548235" },
  };

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const pPr = p.getElementsByTagNameNS(NS.w, "pPr")[0];
    if (!pPr) continue;

    const shd = pPr.getElementsByTagNameNS(NS.w, "shd")[0];
    const pBdr = pPr.getElementsByTagNameNS(NS.w, "pBdr")[0];

    if (shd && pBdr) {
      const fill = shd.getAttributeNS(NS.w, "fill")?.toUpperCase();
      const leftBorder = pBdr.getElementsByTagNameNS(NS.w, "left")[0];

      if (fill && calloutColors[fill]) {
        callouts.push({
          index: i,
          detectedType: calloutColors[fill].type,
          fill,
          leftBorder: leftBorder
            ? {
                color: leftBorder.getAttributeNS(NS.w, "color"),
                size: parseInt(
                  leftBorder.getAttributeNS(NS.w, "sz") || "0",
                  10,
                ),
                style: leftBorder.getAttributeNS(NS.w, "val"),
              }
            : null,
          text: getParagraphText(p),
          properties: extractParagraphProperties(pPr),
        });
      }
    }
  }

  return callouts;
}

/**
 * Extract header table (first table in document)
 * @param {Document} doc - Parsed document.xml
 * @returns {Object|null}
 */
function extractHeaderTable(doc) {
  const tables = doc.getElementsByTagNameNS(NS.w, "tbl");
  if (tables.length === 0) return null;

  const firstTable = tables[0];
  const tableData = extractTable(firstTable, 0);

  // Check if this looks like a header table (2 rows, specific styling)
  if (tableData.rowCount === 2) {
    return {
      isHeaderTable: true,
      row1: tableData.rows[0],
      row2: tableData.rows[1],
      raw: tableData,
    };
  }

  return null;
}

/**
 * Extract footer content
 * @param {JSZip} zip - ZIP file object
 * @returns {Promise<Object|null>}
 */
async function extractFooter(zip) {
  const footerXml = await getXmlDoc(zip, "word/footer1.xml");
  if (!footerXml) return null;

  const paragraphs = footerXml.getElementsByTagNameNS(NS.w, "p");
  const content = [];

  for (let i = 0; i < paragraphs.length; i++) {
    content.push({
      text: getParagraphText(paragraphs[i]),
      properties: extractParagraphProperties(
        paragraphs[i].getElementsByTagNameNS(NS.w, "pPr")[0],
      ),
    });
  }

  return { content };
}

module.exports = {
  parseDocument,
  extractPageMargins,
  extractTypography,
  extractTables,
  extractParagraphs,
  detectCallouts,
  extractHeaderTable,
  extractFooter,
};
