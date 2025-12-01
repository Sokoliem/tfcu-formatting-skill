# Claude Vision Prompt Templates (v4.1)

Structured prompts for intelligent screenshot analysis in the TFCU Procedure Formatter.

---

## Screenshot Analysis Prompt

Use this prompt when analyzing a screenshot to extract OCR text, identify UI elements, determine placement, and provide preprocessing guidance.

```
Analyze this screenshot from a TFCU (Tongass Federal Credit Union) procedure document.

Context:
- Procedure: {procedure_name}
- Current Section: {section_name}
- Step Text: {step_text}

Analyze the image and return a JSON object with the following structure:

{
  "ocr_text": "All visible text extracted from the screenshot, preserving important labels and values",

  "screen_type": "login|form|dialog|confirmation|error|dashboard|menu|report",

  "suggested_crop": {
    "x": 0-100,
    "y": 0-100,
    "w": 0-100,
    "h": 0-100,
    "reason": "Why this crop region was chosen"
  },

  "recommended_width": 320,

  "ui_elements": [
    {
      "type": "button|field|dropdown|checkbox|menu|label|dialog|tab",
      "label": "Text on or near the element",
      "importance": "primary|secondary|contextual",
      "position": {
        "x": 0-100,
        "y": 0-100
      }
    }
  ],

  "suggested_section": "system-access|card-selection|pin-entry|verification|activation|troubleshooting|reports",

  "annotation_targets": [
    {
      "element_id": "unique_element_identifier",
      "element": "Description of the UI element to annotate",
      "annotation_type": "callout|arrow|highlight|circle|label",
      "position": {"x": 0-100, "y": 0-100},
      "suggested_color": "critical|info|warning|success|primary",
      "description_text": "Action description shown in legend (e.g., 'Click Submit to confirm card order')",
      "reason": "Why this element should be annotated"
    }
  ],

  "suggested_caption": "Figure X: Brief description of what the screenshot shows",

  "alt_text": "Detailed accessibility description for screen readers",

  "quality_assessment": {
    "legibility": 1-5,
    "relevance": 1-5,
    "include_in_procedure": true|false,
    "reason": "Explanation for inclusion/exclusion decision"
  }
}

IMPORTANT:
- suggested_crop: Percentage coordinates defining the relevant region to crop BEFORE annotation
- annotation_targets.description_text: Will appear in legend with MATCHING color as the marker
- Position coordinates are percentages (0-100) from the top-left corner
- All annotations are applied AFTER crop/resize to prevent distortion

Return ONLY the JSON object, no additional text.
```

---

## Suggested Crop Guidelines (v4.1)

The `suggested_crop` field tells the preprocessor how to trim the screenshot BEFORE annotation.

### Crop Decision Logic

| Screen Type | Crop Strategy | Typical Values |
|-------------|---------------|----------------|
| `form` | Focus on form fields and submit area | `{x: 5, y: 10, w: 90, h: 85}` |
| `dialog` | Tight crop around modal | `{x: 15, y: 20, w: 70, h: 60}` |
| `login` | Center on credentials area | `{x: 10, y: 15, w: 80, h: 70}` |
| `error` | Focus on error message | `{x: 10, y: 20, w: 80, h: 50}` |
| `dashboard` | Keep navigation context | `{x: 0, y: 0, w: 100, h: 100}` |
| `menu` | Include full menu structure | `{x: 0, y: 5, w: 50, h: 80}` |

### What to Exclude

- Browser chrome (address bar, tabs)
- Taskbar and system UI
- Irrelevant sidebar content
- Large empty/whitespace areas
- Sensitive data not relevant to the step

### Crop Examples

```json
// Example: Login screen - crop out browser chrome
{
  "suggested_crop": {
    "x": 5,
    "y": 12,
    "w": 90,
    "h": 78,
    "reason": "Removes browser navigation and focuses on login form"
  }
}

// Example: Error dialog - tight crop on modal
{
  "suggested_crop": {
    "x": 20,
    "y": 25,
    "w": 60,
    "h": 50,
    "reason": "Centers on error dialog, excludes grayed-out background"
  }
}
```

---

## Color-Matched Annotations (v4.1)

Annotation markers and their description text MUST use the same color for visual association.

### Color Palette

| Color Name | Hex | Use Case |
|------------|-----|----------|
| `critical` | #C00000 | Primary action, must-click buttons |
| `info` | #2E74B5 | Informational elements, data display |
| `warning` | #FFC000 | Caution areas, important notes |
| `success` | #548235 | Confirmation, correct state |
| `primary` | #154747 | Navigation, default annotations |

### Annotation Target with Color

```json
{
  "annotation_targets": [
    {
      "element_id": "btn_submit",
      "element": "Submit button",
      "annotation_type": "callout",
      "position": {"x": 75, "y": 85},
      "suggested_color": "critical",
      "description_text": "Click Submit to confirm the card order",
      "reason": "Primary action for completing the step"
    },
    {
      "element_id": "field_account",
      "element": "Account Number field",
      "annotation_type": "highlight",
      "position": {"x": 50, "y": 30},
      "suggested_color": "info",
      "description_text": "Enter the member account number",
      "reason": "Required input field for this step"
    }
  ]
}
```

### Legend Output

The `description_text` values appear in a color-coded legend below the image:
- ① (red circle) "Click Submit to confirm the card order" (in red text)
- ② (blue circle) "Enter the member account number" (in blue text)

---

## Screen Type Classification

| Screen Type | Indicators | Common Elements |
|-------------|------------|-----------------|
| `login` | Username/password fields, "Sign In" button | Authentication form |
| `form` | Multiple input fields, labels, submit button | Data entry screen |
| `dialog` | Modal window, OK/Cancel buttons | Pop-up confirmation |
| `confirmation` | Success message, checkmark, "Complete" | Process completion |
| `error` | Red text, error icon, retry button | Error message |
| `dashboard` | Multiple sections, navigation, summary | Main application view |
| `menu` | Navigation links, dropdown options | Menu/navigation screen |
| `report` | Tables, data columns, print option | Report/output view |

---

## Section Classification Keywords

Use these patterns to classify which procedure section a screenshot belongs to:

```javascript
const SECTION_KEYWORDS = {
  'system-access': [
    'login', 'sign in', 'username', 'password', 'authenticate',
    'welcome', 'home page', 'dashboard', 'main menu'
  ],

  'card-selection': [
    'card type', 'select card', 'debit', 'credit', 'business',
    'consumer', 'BIN', 'card design', 'instant issue'
  ],

  'pin-entry': [
    'PIN', 'personal identification', '4-digit', 'enter PIN',
    'PIN pad', 'offset', 'verify PIN'
  ],

  'verification': [
    'preview', 'verify', 'confirm', 'review', 'check',
    'before printing', 'card preview'
  ],

  'activation': [
    'activate', 'activation', 'complete', 'finish',
    'card ready', 'successful'
  ],

  'troubleshooting': [
    'error', 'failed', 'issue', 'problem', 'retry',
    'cannot', 'unable', 'warning'
  ],

  'reports': [
    'report', 'history', 'log', 'summary', 'audit',
    'transaction', 'activity'
  ]
};
```

---

## Annotation Recommendation Logic

When determining what to annotate, consider:

### Action Verb to Annotation Mapping

| Step Verb | Annotation Type | Target Element |
|-----------|-----------------|----------------|
| Click | callout | Button |
| Select | highlight | Dropdown/menu |
| Enter | highlight | Text field |
| Verify | highlight | Data display area |
| Navigate | arrow | Menu/link |
| Check | circle | Checkbox |
| Review | none | Full screen (caption only) |

### Annotation Priority Rules

1. **Primary Action**: Always annotate the main action element (button, field)
2. **Required Fields**: Highlight mandatory input fields
3. **Warning Areas**: Circle or highlight error-prone regions
4. **Sequential Steps**: Use numbered callouts for multi-step sequences

---

## Content Matching Prompt

Use this prompt to match an analyzed screenshot to procedure steps:

```
Given this screenshot analysis and list of procedure steps, determine the best match.

Screenshot Analysis:
{screenshot_analysis_json}

Procedure Steps:
{steps_array}

For each step, calculate a match score considering:
1. Text Similarity (35%): Does the OCR text contain keywords from the step?
2. UI Element Match (30%): Does the screenshot show elements mentioned in the step?
3. Section Match (20%): Does the screen type align with the step's section?
4. Sequence Match (15%): Does the screenshot's position match the step's order?

Return a JSON object:
{
  "best_match": {
    "step_id": "id of the best matching step",
    "confidence": 0.0-1.0,
    "reasoning": "Explanation of why this is the best match"
  },
  "alternative_matches": [
    {
      "step_id": "id",
      "confidence": 0.0-1.0
    }
  ],
  "unmatched": true|false,
  "suggested_action": "auto_assign|review_required|exclude"
}
```

---

## Alt Text Generation Guidelines

Alt text should be:
- **Descriptive**: Explain what the screenshot shows
- **Contextual**: Reference the procedure step
- **Accessible**: Useful for screen reader users

### Template

```
"{screen_type} showing {main_content}. {key_elements_description}. Used for {procedure_step_summary}."
```

### Examples

| Screenshot | Alt Text |
|------------|----------|
| Login screen | "Login form showing username and password fields with Sign In button. Card@Once authentication screen for system access." |
| Card type dropdown | "Dropdown menu expanded showing card type options: Consumer Debit, Business Debit, Credit Card. Selection step in card ordering process." |
| Error dialog | "Error dialog displaying 'Card not found' message with Retry and Cancel buttons. Troubleshooting reference for card lookup failures." |

---

## Caption Generation Templates

```javascript
const CAPTION_TEMPLATES = {
  // Button actions
  button_click: "Figure {n}: {target} button",

  // Field interactions
  field_entry: "Figure {n}: {field_name} input field",
  field_display: "Figure {n}: {field_name} displaying {value_type}",

  // Selection actions
  dropdown_select: "Figure {n}: {dropdown_name} selection menu",
  menu_navigate: "Figure {n}: {menu_name} navigation",

  // Verification screens
  preview_screen: "Figure {n}: {item} preview",
  confirmation: "Figure {n}: {action} confirmation",

  // Error/status
  error_display: "Figure {n}: {error_type} error message",
  success_message: "Figure {n}: {action} successful",

  // General
  overview: "Figure {n}: {screen_name} overview",
  form_section: "Figure {n}: {form_name} form"
};
```

---

## Quality Assessment Criteria

### Legibility Score (1-5)

| Score | Criteria |
|-------|----------|
| 5 | Crystal clear, all text readable, high resolution |
| 4 | Clear, most text readable, good resolution |
| 3 | Acceptable, key elements visible, some blur |
| 2 | Poor, difficult to read, low resolution |
| 1 | Unusable, text illegible, very low quality |

### Relevance Score (1-5)

| Score | Criteria |
|-------|----------|
| 5 | Directly shows the step action, essential |
| 4 | Shows relevant context, helpful |
| 3 | Related to procedure, somewhat useful |
| 2 | Tangentially related, limited value |
| 1 | Unrelated or redundant |

### Include/Exclude Decision

**Include if:**
- Shows a key UI interaction (button click, form entry)
- Displays critical information (account numbers, BINs)
- Helps clarify a complex step
- Shows an error or warning condition

**Exclude if:**
- Duplicate of another screenshot
- Shows generic/unchanged UI state
- Too small or decorative (icons, logos)
- Poor quality (blurry, cut off)
- Contains sensitive information

---

## Response Parsing

### JavaScript Parser (v4.1)

```javascript
async function parseVisionResponse(response) {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    if (response.includes('```json')) {
      jsonStr = response.split('```json')[1].split('```')[0];
    } else if (response.includes('```')) {
      jsonStr = response.split('```')[1].split('```')[0];
    }

    const analysis = JSON.parse(jsonStr.trim());

    // Validate required fields
    const required = ['ocr_text', 'screen_type', 'ui_elements', 'suggested_section'];
    for (const field of required) {
      if (!(field in analysis)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Normalize positions to 0-100 range
    if (analysis.ui_elements) {
      analysis.ui_elements = analysis.ui_elements.map(el => ({
        ...el,
        position: {
          x: Math.max(0, Math.min(100, el.position?.x || 50)),
          y: Math.max(0, Math.min(100, el.position?.y || 50))
        }
      }));
    }

    // v4.1: Normalize suggested_crop coordinates
    if (analysis.suggested_crop) {
      analysis.suggested_crop = {
        x: Math.max(0, Math.min(100, analysis.suggested_crop.x || 0)),
        y: Math.max(0, Math.min(100, analysis.suggested_crop.y || 0)),
        w: Math.max(1, Math.min(100, analysis.suggested_crop.w || 100)),
        h: Math.max(1, Math.min(100, analysis.suggested_crop.h || 100)),
        reason: analysis.suggested_crop.reason || ''
      };
    }

    // v4.1: Normalize annotation_targets with new fields
    if (analysis.annotation_targets) {
      const validColors = ['critical', 'info', 'warning', 'success', 'primary'];
      analysis.annotation_targets = analysis.annotation_targets.map((target, idx) => ({
        ...target,
        element_id: target.element_id || `element_${idx + 1}`,
        position: {
          x: Math.max(0, Math.min(100, target.position?.x || 50)),
          y: Math.max(0, Math.min(100, target.position?.y || 50))
        },
        suggested_color: validColors.includes(target.suggested_color)
          ? target.suggested_color
          : 'primary',
        description_text: target.description_text || target.element || ''
      }));
    }

    return { success: true, analysis };
  } catch (error) {
    return { success: false, error: error.message, raw: response };
  }
}
```

---

## Error Handling

If Claude Vision cannot analyze the image:

```json
{
  "ocr_text": "",
  "screen_type": "unknown",
  "ui_elements": [],
  "suggested_section": "unknown",
  "annotation_targets": [],
  "suggested_caption": "Figure X: Screenshot",
  "alt_text": "Screenshot from procedure document",
  "quality_assessment": {
    "legibility": 1,
    "relevance": 1,
    "include_in_procedure": false,
    "reason": "Unable to analyze image content"
  },
  "recommended_width": 280
}
```

---

## Usage in Skill

```javascript
// In SKILL.md implementation
async function analyzeScreenshot(imageBuffer, context) {
  const prompt = ANALYSIS_PROMPT
    .replace('{procedure_name}', context.procedureName)
    .replace('{section_name}', context.sectionName)
    .replace('{step_text}', context.stepText);

  // Claude will analyze the image with this prompt
  // Return structured analysis for content matching and annotation
  return await claudeVisionAnalyze(imageBuffer, prompt);
}
```
