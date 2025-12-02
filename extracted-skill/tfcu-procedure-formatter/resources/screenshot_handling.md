# Intelligent Screenshot Handling Guide (v4.1)

Automated screenshot analysis, preprocessing, annotation, and placement for TFCU procedures.

---

## Overview

The TFCU Procedure Formatter includes an intelligent screenshot processing system that:

1. **Analyzes** uploaded images using Claude Vision (OCR, UI detection, crop region)
2. **Preprocesses** images (crop → resize) BEFORE annotation to prevent distortion
3. **Registers** figures with global sequential numbering by document position
4. **Annotates** images with color-matched callouts, arrows, and legends
5. **Generates** step-context hybrid descriptions combining Vision + step text
6. **Warns** about missing screenshots (non-blocking)

---

## Quick Start

Upload screenshots and the skill will:
- Analyze the image content using Claude Vision
- Suggest optimal crop region and target width
- Preprocess (crop/resize) BEFORE applying annotations
- Assign global figure number based on document position
- Apply color-matched annotations with legend
- Generate hybrid captions from step context + Vision analysis

---

## Processing Pipeline (v4.1)

**Critical**: Images are preprocessed BEFORE annotation to prevent distortion.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCREENSHOT PROCESSING PIPELINE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. INPUT      → User uploads screenshot                            │
│  2. ANALYZE    → Claude Vision: OCR, UI detection, suggested crop   │
│  3. PREPROCESS → Crop → Resize → Enhance (LANCZOS) ◄── BEFORE ANN! │
│  4. REGISTER   → Add to ImageRegistry, assign figure number         │
│  5. ANNOTATE   → Apply at FINAL resolution (no distortion)          │
│  6. ADD LEGEND → Color-coded key at bottom of image                 │
│  7. EMBED      → Insert with figure caption + color-matched text    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Workflow

| Stage | Tool | Output |
|-------|------|--------|
| Upload | User provides | PNG/JPG screenshot |
| Analyze | Claude Vision | OCR, UI elements, suggested_crop, annotation_targets |
| Preprocess | Python PIL | Cropped/resized image (280-400px width) |
| Register | ImageRegistry | Global figure number, step mapping |
| Annotate | Python PIL | Color-matched callouts with legend |
| Caption | Hybrid Generator | Step-context combined description |
| Embed | docx-js | ImageRun with figure caption + alt text |

### User Instructions

You can provide specific annotation instructions:
- "Circle the Submit button"
- "Add numbered callouts to the form fields"
- "Highlight the error message area"
- "Add an arrow pointing to the dropdown menu"

---

## Image Preprocessing (v4.1)

**Critical**: All preprocessing happens BEFORE annotation to prevent distortion.

### Preprocessing Steps

1. **Smart Crop**: Remove irrelevant areas (browser chrome, taskbar, whitespace)
2. **Resize**: Scale to target width (280-400px) preserving aspect ratio
3. **Enhance**: Upscale low-resolution images using LANCZOS resampling

### Crop Decision Logic

| Screen Type | Crop Strategy |
|-------------|---------------|
| `form` | Focus on form fields and submit area |
| `dialog` | Tight crop around modal window |
| `login` | Center on credentials area |
| `error` | Focus on error message content |
| `dashboard` | Keep navigation context visible |
| `menu` | Include full menu structure |

### What to Exclude in Crop

- Browser chrome (address bar, tabs)
- Taskbar and system UI
- Irrelevant sidebar content
- Large empty/whitespace areas
- Sensitive data not relevant to step

---

## Global Figure Numbering (v4.1)

Figures are numbered sequentially by document position, NOT by step number.

### ImageRegistry Features

- **Sequential numbering**: Figure 1, 2, 3... based on document order
- **Step mapping**: Track which figures belong to which steps
- **Reordering support**: Recalculates numbers when figures move
- **Orphan detection**: Identifies unassigned figures

### Example

```javascript
// Figure numbers follow document position
Step 1.a → Figure 1 (login screen)
Step 2.b → Figure 2 (form entry)
Step 3   → Figure 3 (confirmation)
Step 4.c → Figure 4 (error handling)
```

---

## Color-Matched Annotations (v4.1)

Annotation markers and description text use the SAME color for visual association.

### Color Palette

| Color | Hex | Use Case |
|-------|-----|----------|
| Critical | #C00000 | Primary action, must-click buttons |
| Info | #2E74B5 | Informational elements, data display |
| Warning | #FFC000 | Caution areas, important notes |
| Success | #548235 | Confirmation, correct state |
| Primary | #154747 | Navigation, default annotations |

### Legend Format

Each annotated image includes a color-coded legend at the bottom:

```
Annotation Key:
① (red)   Click Submit to confirm the card order
② (blue)  Enter the member account number
③ (green) Verify the confirmation message
```

---

## Image Analysis

### What Claude Vision Detects

| Element | Detection | Use |
|---------|-----------|-----|
| **OCR Text** | All visible text | Step matching, search |
| **Screen Type** | login, form, dialog, error, etc. | Section classification |
| **UI Elements** | Buttons, fields, dropdowns | Annotation targeting |
| **Layout** | Position, hierarchy | Recommended sizing |

### Analysis Output Structure (v4.1)

```json
{
  "ocr_text": "Account Number: ____  Card Type: [Select]  Submit",
  "screen_type": "form",
  "suggested_crop": {
    "x": 5,
    "y": 10,
    "w": 90,
    "h": 85,
    "reason": "Focus on form fields, exclude browser chrome"
  },
  "recommended_width": 320,
  "ui_elements": [
    { "type": "field", "label": "Account Number", "importance": "primary", "position": {"x": 30, "y": 25} },
    { "type": "dropdown", "label": "Card Type", "importance": "primary", "position": {"x": 30, "y": 45} },
    { "type": "button", "label": "Submit", "importance": "primary", "position": {"x": 50, "y": 70} }
  ],
  "suggested_section": "card-selection",
  "annotation_targets": [
    {
      "element_id": "btn_submit",
      "element": "Submit button",
      "annotation_type": "callout",
      "position": {"x": 50, "y": 70},
      "suggested_color": "critical",
      "description_text": "Click Submit to confirm the card order"
    },
    {
      "element_id": "field_account",
      "element": "Account Number field",
      "annotation_type": "highlight",
      "position": {"x": 30, "y": 25},
      "suggested_color": "info",
      "description_text": "Enter the member account number"
    }
  ],
  "suggested_caption": "Figure 3: Card information entry form",
  "alt_text": "Form showing Account Number field, Card Type dropdown, and Submit button",
  "quality_assessment": {
    "legibility": 5,
    "relevance": 5,
    "include_in_procedure": true
  }
}
```

---

## Content Matching

### Matching Algorithm

Screenshots are matched to steps using a weighted multi-signal algorithm:

| Signal | Weight | How It Works |
|--------|--------|--------------|
| **Text Similarity** | 35% | OCR text keywords match step instructions |
| **UI Element Match** | 30% | Detected elements match step action (e.g., "Click Submit" → Submit button detected) |
| **Section Match** | 20% | Screen type aligns with step's section |
| **Sequence Order** | 15% | Image extraction order matches step sequence |

### Confidence Thresholds

| Confidence | Action |
|------------|--------|
| ≥60% | Auto-assign to step |
| 40-59% | Suggest assignment, flag for review |
| 20-39% | Low confidence, requires manual assignment |
| <20% | Mark as orphan, suggest removal |

### Section Classification Keywords

| Section | Keywords |
|---------|----------|
| system-access | login, sign in, username, password, dashboard |
| card-selection | card type, debit, credit, BIN, instant issue |
| pin-entry | PIN, 4-digit, PIN pad, offset |
| verification | preview, verify, confirm, review |
| activation | activate, complete, finish, card ready |
| troubleshooting | error, failed, issue, problem, retry |
| reports | report, history, log, summary, audit |

---

## Annotations

### Available Annotation Types

| Type | Visual | Use Case | Example |
|------|--------|----------|---------|
| **Callout** | Numbered circle (①②③) | Button clicks, sequences | `{"type": "callout", "position": {"x": 50, "y": 70}, "number": 1}` |
| **Arrow** | Curved line with head | Point to elements | `{"type": "arrow", "position": {"x": 20, "y": 30}, "end": {"x": 50, "y": 50}}` |
| **Highlight** | Semi-transparent box | Input fields, areas | `{"type": "highlight", "bbox": {"x": 20, "y": 40, "w": 30, "h": 10}}` |
| **Circle** | Ring outline | Focus on element | `{"type": "circle", "position": {"x": 50, "y": 50}, "radius": 8}` |
| **Label** | Text with background | Explanatory text | `{"type": "label", "position": {"x": 60, "y": 30}, "text": "Click here"}` |

### TFCU Brand Colors

```python
ANNOTATION_COLORS = {
    'primary': '#154747',    # TFCU teal (default)
    'critical': '#C00000',   # Red - must-see, compliance
    'warning': '#FFC000',    # Gold - caution, attention
    'info': '#2E74B5',       # Blue - informational
    'success': '#548235',    # Green - correct action
}
```

### Annotation Decision Logic

| Step Action | Annotation Type | Target |
|-------------|-----------------|--------|
| Click [button] | Callout | Button element |
| Select [option] | Highlight | Dropdown menu |
| Enter [value] | Highlight | Input field |
| Verify [info] | Highlight | Data display area |
| Navigate to | Arrow | Menu/link |
| Check [box] | Circle | Checkbox |

---

## Python PIL Processor

### Installation

```bash
pip install pillow
```

### Usage

```python
from screenshot_processor import ScreenshotAnnotator

annotator = ScreenshotAnnotator()

# Process with annotations
result = annotator.process_image(
    image_path="screenshot.png",
    annotations=[
        {"type": "callout", "position": {"x": 50, "y": 70}, "number": 1, "color": "#C00000"},
        {"type": "arrow", "position": {"x": 20, "y": 40}, "end": {"x": 50, "y": 70}},
        {"type": "highlight", "bbox": {"x": 10, "y": 30, "w": 40, "h": 15}}
    ]
)

result.save("annotated_screenshot.png")
```

### CLI Usage

```bash
# Process from JSON input
echo '{"image_path": "input.png", "annotations": [...]}' | python screenshot_processor.py --stdin
```

### Supported Input Formats

- File path (string)
- Bytes (base64 encoded for CLI)
- PIL Image object

---

## Image Sizing Standards

| Screen Type | Recommended Width | Use Case |
|-------------|-------------------|----------|
| fullscreen | 500-550px | Full application views |
| form | 320-400px | Data entry screens |
| dialog | 280-350px | Pop-up windows |
| card-preview | 180-200px | Card samples |
| icon | 80-100px | Small UI elements |
| flowchart | 550-600px | Process diagrams |

---

## Alt Text Guidelines

### Structure

```
"{screen_type} showing {main_content}. {key_elements}. {context}."
```

### Examples

| Screenshot | Alt Text |
|------------|----------|
| Login screen | "Login form showing username and password fields with Sign In button. Card@Once authentication for system access." |
| Card type selection | "Dropdown menu displaying card options: Consumer Debit, Business Debit, Credit. Selection step in card ordering." |
| Error dialog | "Error message displaying 'Card not found' with Retry and Cancel buttons. Troubleshooting reference." |

### Caption Templates

| Context | Template |
|---------|----------|
| Button click | "Figure {n}: {button_name} button" |
| Field entry | "Figure {n}: {field_name} input field" |
| Selection | "Figure {n}: {menu_name} selection" |
| Preview | "Figure {n}: {item} preview screen" |
| Error | "Figure {n}: {error_type} message" |

---

## Coverage Analysis

### Automatic Gap Detection

The system identifies:

1. **Critical steps without screenshots** - Login, verification, error handling
2. **Orphan screenshots** - Images that couldn't be matched to steps
3. **Low-confidence matches** - Assignments that need review

### Coverage Report

```javascript
{
  totalSteps: 15,
  stepsWithScreenshots: 12,
  coveragePercent: 80,
  criticalCoverage: {
    total: 5,
    covered: 4
  },
  gaps: [
    { stepNumber: "3", stepText: "Verify account information", suggestedScreenshot: "Account verification screen" }
  ],
  orphanScreenshots: []
}
```

### Critical Step Patterns

These step types should always have screenshots:
- Login/authentication
- Card type selection
- Account/data entry
- Verification/preview
- Error conditions

---

## Integration with SKILL.md

### Basic Usage

```javascript
// For steps with screenshots
createStepWithScreenshot({
  stepNum: "1.",
  text: "Click the Submit button to proceed.",
  imagePath: "./media/image1.png",
  imageWidth: 280
});
```

### Intelligent Processing

```javascript
// For automatic analysis and annotation
await createIntelligentStep({
  stepNum: "1.",
  text: "Click the Submit button to proceed.",
  imageBuffer: fs.readFileSync("./media/image1.png"),
  procedureContext: {
    name: "Card@Once Procedure",
    currentSection: "card-selection"
  },
  autoAnnotate: true
});
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Low match confidence | OCR didn't capture key text | Ensure screenshot shows relevant UI clearly |
| Wrong annotation position | Percentage coordinates off | Adjust position values (0-100 scale) |
| Annotation not visible | Wrong color on similar background | Use contrasting color from palette |
| PIL processing fails | Missing dependency | Run `pip install pillow` |
| Image quality poor | Source resolution too low | Use higher quality screenshots |

---

## Best Practices

### Screenshot Capture

1. **Capture at native resolution** - Don't scale down before processing
2. **Include relevant context** - Show enough UI to understand the action
3. **Highlight the action area** - Focus on what the step describes
4. **Avoid sensitive data** - Blur or mask account numbers, names

### Annotation Strategy

1. **One primary annotation per screenshot** - Don't over-annotate
2. **Use callouts for sequences** - Number related actions
3. **Use highlights for fields** - Draw attention to input areas
4. **Use arrows for navigation** - Show where to click/go

### Quality Checklist

- [ ] Screenshot clearly shows the step action
- [ ] Annotation draws attention to correct element
- [ ] Alt text describes image for accessibility
- [ ] Caption follows figure numbering convention
- [ ] Image sized appropriately for document layout
