# TFCU Procedure Formatter Skill Enhancement

## Objective

Enhance the TFCU Procedure Formatter skill (`/mnt/skills/user/tfcu-procedure-formatter/SKILL.md`) to **enforce** screenshot annotation and figure management as mandatory pipeline steps, not optional documentation.

---

## Current State Analysis

The skill contains extensive **documentation** for:
- Vision analysis workflow (lines 973-1128)
- Content matching engine with weighted algorithms (lines 1060-1199)
- ImageRegistry for global figure numbering (lines 1376-1499)
- AnnotationColorManager for color-coded callouts (lines 1501-1557)
- Hybrid caption generation (lines 1560-1628)
- Annotation type reference table (lines 1630-1650)

**Critical Gap**: These are reference patterns only—not enforced in the Quick Start workflow or document generation pipeline. The actual `createStepWithScreenshot()` function (lines 442-522) accepts raw images without annotation processing.

---

## Available Dependencies

Installed and ready to use:

| Library | Version | Capability |
|---------|---------|------------|
| **Pillow** | 12.0.0 | `ImageDraw` - circles, rectangles, text, arrows; `ImageFont` for custom fonts |
| **OpenCV** | 4.11.0 | `cv2.circle`, `cv2.rectangle`, `cv2.arrowedLine`, `cv2.putText` - precise positioning |
| **pycairo** | 1.29.0 | Vector-quality anti-aliased shapes, professional rendering |
| **sharp** | 0.34.5 | Node.js compositing with SVG overlays |
| **ImageMagick** | 6.9.12 | CLI batch operations via `convert` |
| **Wand** | 0.6.13 | Python ImageMagick bindings |

**Recommendation**: Use **Pillow** as primary (simplest API, excellent text/shape support) with **OpenCV** fallback for complex element detection.

---

## Required Changes

### 1. Enforce Annotation in Quick Start

Update the Quick Start section (lines 10-27) to make annotation mandatory:

```bash
# MANDATORY WORKFLOW - All steps required
# 1. Convert source document to markdown
pandoc source.docx -o source.md

# 2. Extract images from source
mkdir -p images/raw images/annotated
unzip -o source.docx -d docx_extract
cp docx_extract/word/media/* images/raw/

# 3. Read the docx skill for implementation details
cat /mnt/skills/public/docx/SKILL.md

# 4. MANDATORY: Process and annotate all screenshots
python3 annotate_screenshots.py --input images/raw --output images/annotated --procedure source.md

# 5. Generate formatted procedure (uses annotated images)
node generate-procedure.js

# 6. Generate Figure Index appendix
python3 generate_figure_index.py --images images/annotated --output figure_index.json

# 7. Validate output
pandoc output.docx -o validation.md
python3 validate_procedure.py --doc validation.md --figures figure_index.json
```

### 2. Create `annotate_screenshots.py` Script

This script must be included in the skill as a **required artifact**. Implement using Pillow:

```python
#!/usr/bin/env python3
"""
TFCU Screenshot Annotation Pipeline
Enforced by TFCU Procedure Formatter Skill v5.0

Dependencies: Pillow, OpenCV (fallback)
"""

import argparse
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import base64

# TFCU Brand Colors
COLORS = {
    'primary': '#154747',      # Teal - navigation, default
    'critical': '#C00000',     # Red - must-click elements
    'warning': '#FFC000',      # Gold - caution areas
    'info': '#2E74B5',         # Blue - informational
    'success': '#548235',      # Green - confirmation
}

CALLOUT_RADIUS = 14
ARROW_HEAD_SIZE = 10
FONT_SIZE = 12

class ScreenshotAnnotator:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.figure_registry = []
        self.color_assignments = {}
        
    def annotate(self, image_path: Path, annotations: list, figure_num: int) -> dict:
        """
        Apply annotations to a screenshot.
        
        Args:
            image_path: Path to source image
            annotations: List of annotation dicts with keys:
                - type: 'callout' | 'arrow' | 'highlight' | 'circle' | 'label'
                - position: {x: 0-100, y: 0-100} (percentage coordinates)
                - number: int (for callouts)
                - text: str (for labels)
                - color: str (color name from COLORS)
                - end: {x, y} (for arrows)
                - bbox: {x, y, w, h} (for highlights)
            figure_num: Global figure number
            
        Returns:
            dict with annotated image path and metadata
        """
        img = Image.open(image_path).convert('RGBA')
        draw = ImageDraw.Draw(img)
        
        # Load font (fallback to default if custom not available)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", FONT_SIZE)
        except:
            font = ImageFont.load_default()
        
        legend_items = []
        
        for ann in annotations:
            color = COLORS.get(ann.get('color', 'primary'), COLORS['primary'])
            pos = ann['position']
            x = int(pos['x'] * img.width / 100)
            y = int(pos['y'] * img.height / 100)
            
            if ann['type'] == 'callout':
                # Numbered circle callout
                self._draw_callout(draw, x, y, ann.get('number', 1), color, font)
                legend_items.append({
                    'number': ann.get('number', 1),
                    'color': color,
                    'description': ann.get('description', f"Action {ann.get('number', 1)}")
                })
                
            elif ann['type'] == 'arrow':
                end = ann['end']
                ex = int(end['x'] * img.width / 100)
                ey = int(end['y'] * img.height / 100)
                self._draw_arrow(draw, x, y, ex, ey, color)
                
            elif ann['type'] == 'highlight':
                bbox = ann['bbox']
                bx = int(bbox['x'] * img.width / 100)
                by = int(bbox['y'] * img.height / 100)
                bw = int(bbox['w'] * img.width / 100)
                bh = int(bbox['h'] * img.height / 100)
                self._draw_highlight(draw, bx, by, bw, bh, color)
                
            elif ann['type'] == 'circle':
                radius = ann.get('radius', 20)
                self._draw_circle(draw, x, y, radius, color)
                
            elif ann['type'] == 'label':
                self._draw_label(draw, x, y, ann.get('text', ''), color, font)
        
        # Add legend if there are callouts
        if legend_items:
            img = self._add_legend(img, legend_items, font)
        
        # Save annotated image
        output_path = self.output_dir / f"figure_{figure_num:02d}_{image_path.stem}.png"
        img.save(output_path, 'PNG')
        
        # Register figure
        figure_data = {
            'figure_number': figure_num,
            'source_image': str(image_path),
            'annotated_image': str(output_path),
            'annotations': annotations,
            'legend': legend_items,
            'dimensions': {'width': img.width, 'height': img.height}
        }
        self.figure_registry.append(figure_data)
        
        return figure_data
    
    def _draw_callout(self, draw, x, y, number, color, font):
        """Draw numbered circle callout"""
        draw.ellipse(
            [x - CALLOUT_RADIUS, y - CALLOUT_RADIUS, 
             x + CALLOUT_RADIUS, y + CALLOUT_RADIUS],
            fill=color, outline='white', width=2
        )
        # Center the number
        text = str(number)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.text((x - tw/2, y - th/2 - 2), text, fill='white', font=font)
    
    def _draw_arrow(self, draw, x1, y1, x2, y2, color):
        """Draw arrow from (x1,y1) to (x2,y2)"""
        import math
        draw.line([(x1, y1), (x2, y2)], fill=color, width=3)
        
        # Arrowhead
        angle = math.atan2(y2 - y1, x2 - x1)
        ax1 = x2 - ARROW_HEAD_SIZE * math.cos(angle - math.pi/6)
        ay1 = y2 - ARROW_HEAD_SIZE * math.sin(angle - math.pi/6)
        ax2 = x2 - ARROW_HEAD_SIZE * math.cos(angle + math.pi/6)
        ay2 = y2 - ARROW_HEAD_SIZE * math.sin(angle + math.pi/6)
        draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)
    
    def _draw_highlight(self, draw, x, y, w, h, color):
        """Draw highlight rectangle"""
        draw.rectangle([x, y, x + w, y + h], outline=color, width=3)
    
    def _draw_circle(self, draw, x, y, radius, color):
        """Draw attention circle"""
        draw.ellipse(
            [x - radius, y - radius, x + radius, y + radius],
            outline=color, width=3
        )
    
    def _draw_label(self, draw, x, y, text, color, font):
        """Draw text label with background"""
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        padding = 4
        draw.rectangle(
            [x - padding, y - padding, x + tw + padding, y + th + padding],
            fill='white', outline=color, width=1
        )
        draw.text((x, y), text, fill=color, font=font)
    
    def _add_legend(self, img, legend_items, font):
        """Add color-coded legend at bottom of image"""
        legend_height = 30
        new_img = Image.new('RGBA', (img.width, img.height + legend_height), 'white')
        new_img.paste(img, (0, 0))
        
        draw = ImageDraw.Draw(new_img)
        x_offset = 10
        y_pos = img.height + 8
        
        for item in sorted(legend_items, key=lambda x: x['number']):
            # Draw mini callout
            draw.ellipse(
                [x_offset, y_pos, x_offset + 16, y_pos + 16],
                fill=item['color'], outline='white', width=1
            )
            draw.text((x_offset + 4, y_pos + 1), str(item['number']), fill='white', font=font)
            
            # Draw description
            x_offset += 22
            draw.text((x_offset, y_pos + 2), item['description'], fill='#333333', font=font)
            
            bbox = draw.textbbox((0, 0), item['description'], font=font)
            x_offset += bbox[2] - bbox[0] + 20
        
        return new_img
    
    def save_registry(self, output_path: Path):
        """Save figure registry to JSON"""
        with open(output_path, 'w') as f:
            json.dump({
                'figures': self.figure_registry,
                'total_count': len(self.figure_registry),
                'generated_at': str(Path.cwd())
            }, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description='TFCU Screenshot Annotation Pipeline')
    parser.add_argument('--input', required=True, help='Input directory with raw images')
    parser.add_argument('--output', required=True, help='Output directory for annotated images')
    parser.add_argument('--annotations', help='JSON file with annotation instructions')
    parser.add_argument('--procedure', help='Procedure markdown for context')
    args = parser.parse_args()
    
    input_dir = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    annotator = ScreenshotAnnotator(output_dir)
    
    # Load annotation instructions if provided
    annotations_map = {}
    if args.annotations and Path(args.annotations).exists():
        with open(args.annotations) as f:
            annotations_map = json.load(f)
    
    # Process all images
    figure_num = 1
    for img_path in sorted(input_dir.glob('*.png')):
        annotations = annotations_map.get(img_path.stem, [])
        
        if not annotations:
            # Auto-generate basic annotation placeholder
            annotations = [{
                'type': 'callout',
                'position': {'x': 50, 'y': 50},
                'number': 1,
                'color': 'primary',
                'description': 'Primary action'
            }]
            print(f"WARNING: No annotations defined for {img_path.name}, using placeholder")
        
        result = annotator.annotate(img_path, annotations, figure_num)
        print(f"Processed Figure {figure_num}: {img_path.name} -> {result['annotated_image']}")
        figure_num += 1
    
    # Save registry
    annotator.save_registry(output_dir / 'figure_registry.json')
    print(f"\nGenerated {len(annotator.figure_registry)} annotated figures")
    print(f"Registry saved to: {output_dir / 'figure_registry.json'}")


if __name__ == '__main__':
    main()
```

### 3. Create Figure Index Generator

Add `generate_figure_index.py` that produces an appendix table for the document:

```python
#!/usr/bin/env python3
"""
Generate Figure Index appendix for TFCU procedures.
Outputs structured data for document appendix generation.
"""

import argparse
import json
from pathlib import Path

def generate_index(registry_path: Path) -> dict:
    """
    Generate figure index from registry.
    
    Returns dict with:
    - figures_by_section: {section_name: [figure_data]}
    - annotation_summary: {annotation_type: count}
    - coverage_stats: {total, annotated, coverage_pct}
    """
    with open(registry_path) as f:
        registry = json.load(f)
    
    figures_by_section = {}
    annotation_counts = {'callout': 0, 'arrow': 0, 'highlight': 0, 'circle': 0, 'label': 0}
    
    for fig in registry['figures']:
        section = fig.get('section', 'Uncategorized')
        if section not in figures_by_section:
            figures_by_section[section] = []
        
        figures_by_section[section].append({
            'figure_number': fig['figure_number'],
            'source': Path(fig['source_image']).name,
            'annotated': Path(fig['annotated_image']).name,
            'annotation_count': len(fig['annotations']),
            'annotation_types': [a['type'] for a in fig['annotations']],
            'legend_items': fig.get('legend', [])
        })
        
        for ann in fig['annotations']:
            annotation_counts[ann['type']] = annotation_counts.get(ann['type'], 0) + 1
    
    return {
        'figures_by_section': figures_by_section,
        'annotation_summary': annotation_counts,
        'total_figures': registry['total_count'],
        'total_annotations': sum(annotation_counts.values())
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--registry', required=True, help='Path to figure_registry.json')
    parser.add_argument('--output', required=True, help='Output path for figure_index.json')
    args = parser.parse_args()
    
    index = generate_index(Path(args.registry))
    
    with open(args.output, 'w') as f:
        json.dump(index, f, indent=2)
    
    print(f"Figure Index generated: {args.output}")
    print(f"  Total figures: {index['total_figures']}")
    print(f"  Total annotations: {index['total_annotations']}")
    for ann_type, count in index['annotation_summary'].items():
        if count > 0:
            print(f"    - {ann_type}: {count}")


if __name__ == '__main__':
    main()
```

### 4. Update `createStepWithScreenshot()` Function

Modify the existing function (lines 442-522) to **require** annotated images:

```javascript
// ── Step with Screenshot (ANNOTATED REQUIRED) ──
// v5.0: Now requires pre-annotated images from annotation pipeline
function createStepWithScreenshot({ 
  stepNum, 
  text, 
  subSteps = [], 
  imagePath,          // MUST point to images/annotated/ directory
  imageWidth = 280, 
  callout = null,
  figureNumber = null // REQUIRED: from figure_registry.json
}) {
  // ENFORCEMENT: Validate annotated image path
  if (imagePath && !imagePath.includes('/annotated/')) {
    console.warn(`WARNING: Step ${stepNum} uses non-annotated image: ${imagePath}`);
    console.warn(`  Run: python3 annotate_screenshots.py --input images/raw --output images/annotated`);
  }
  
  if (!figureNumber) {
    console.warn(`WARNING: Step ${stepNum} missing figureNumber - run generate_figure_index.py`);
  }
  
  // ... rest of existing implementation
}
```

### 5. Add Figure Index Appendix Section

Add new helper function for generating the Figure Index appendix:

```javascript
// ── Figure Index Appendix (v5.0) ──
function createFigureIndexAppendix(figureIndex) {
  const sections = [];
  
  // Header
  sections.push(createSectionHeader("Figure Index", "figure-index", true));
  
  // Summary stats
  sections.push(new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [
      new TextRun({ text: `Total Figures: ${figureIndex.total_figures}`, size: 20, font: "Calibri" }),
      new TextRun({ text: `  |  `, size: 20, color: "999999" }),
      new TextRun({ text: `Total Annotations: ${figureIndex.total_annotations}`, size: 20, font: "Calibri" })
    ]
  }));
  
  // Build table for each section
  for (const [sectionName, figures] of Object.entries(figureIndex.figures_by_section)) {
    sections.push(new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [new TextRun({ text: sectionName, bold: true, size: 22, color: TFCU_COLORS.PRIMARY_TEAL })]
    }));
    
    const tableRows = [
      new TableRow({ tableHeader: true, children: [
        createHeaderCell("Figure #", 15),
        createHeaderCell("Source", 25),
        createHeaderCell("Annotations", 20),
        createHeaderCell("Description", 40)
      ]})
    ];
    
    figures.forEach((fig, i) => {
      const shade = i % 2 === 1 ? { fill: TFCU_COLORS.LIGHT_GRAY, type: ShadingType.CLEAR } : undefined;
      tableRows.push(new TableRow({ children: [
        createDataCell(`${fig.figure_number}`, 15, shade, AlignmentType.CENTER),
        createDataCell(fig.source, 25, shade),
        createDataCell(fig.annotation_types.join(', '), 20, shade),
        createDataCell(fig.legend_items.map(l => l.description).join('; '), 40, shade)
      ]}));
    });
    
    sections.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
  }
  
  return sections;
}
```

### 6. Add Validation Script

Create `validate_procedure.py` to enforce completeness:

```python
#!/usr/bin/env python3
"""
TFCU Procedure Validation
Enforces annotation and figure index requirements.
"""

import argparse
import json
import sys
from pathlib import Path

def validate(doc_path: Path, figures_path: Path) -> tuple[bool, list]:
    """
    Validate procedure document against requirements.
    
    Returns (is_valid, errors)
    """
    errors = []
    warnings = []
    
    # Load figure index
    if not figures_path.exists():
        errors.append(f"CRITICAL: Figure index not found: {figures_path}")
        errors.append("  Run: python3 generate_figure_index.py")
        return False, errors
    
    with open(figures_path) as f:
        fig_index = json.load(f)
    
    # Load document
    doc_content = doc_path.read_text()
    
    # Check required sections
    required_sections = ['OVERVIEW', 'RELATED', 'Revision History']
    for section in required_sections:
        if section not in doc_content:
            errors.append(f"MISSING SECTION: {section}")
    
    # Check figure references
    for section, figures in fig_index.get('figures_by_section', {}).items():
        for fig in figures:
            fig_ref = f"Figure {fig['figure_number']}"
            if fig_ref not in doc_content:
                warnings.append(f"Figure {fig['figure_number']} not referenced in document text")
    
    # Check annotation coverage
    total_figs = fig_index.get('total_figures', 0)
    total_anns = fig_index.get('total_annotations', 0)
    
    if total_figs == 0:
        errors.append("CRITICAL: No figures found - run annotation pipeline")
    elif total_anns == 0:
        errors.append("CRITICAL: No annotations applied - run annotation pipeline")
    elif total_anns < total_figs:
        warnings.append(f"Low annotation coverage: {total_anns} annotations for {total_figs} figures")
    
    # Print results
    print("=" * 60)
    print("TFCU Procedure Validation Results")
    print("=" * 60)
    
    if errors:
        print(f"\n❌ ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  {e}")
    
    if warnings:
        print(f"\n⚠️  WARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  {w}")
    
    if not errors and not warnings:
        print("\n✅ All validations passed")
    
    print(f"\nFigures: {total_figs}  |  Annotations: {total_anns}")
    print("=" * 60)
    
    return len(errors) == 0, errors + warnings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--doc', required=True, help='Path to validation.md')
    parser.add_argument('--figures', required=True, help='Path to figure_index.json')
    args = parser.parse_args()
    
    is_valid, issues = validate(Path(args.doc), Path(args.figures))
    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()
```

---

## Enforcement Checklist

Update the Validation Checklist section (lines 907-926) to include:

```bash
# MANDATORY VALIDATION - All must pass

echo "=== Annotation Pipeline ==="
[ -d "images/annotated" ] && echo "✓ Annotated images directory exists" || echo "✗ Missing annotated images"
[ -f "images/annotated/figure_registry.json" ] && echo "✓ Figure registry exists" || echo "✗ Missing figure registry"

echo "=== Figure Coverage ==="
python3 -c "import json; r=json.load(open('images/annotated/figure_registry.json')); print(f'  {r[\"total_count\"]} figures annotated')"

echo "=== Document Validation ==="
python3 validate_procedure.py --doc validation.md --figures figure_index.json

echo "=== Required Elements ==="
grep -q "OVERVIEW" validation.md && echo "✓ Overview" || echo "✗ Missing Overview"
grep -q "RELATED" validation.md && echo "✓ Related" || echo "✗ Missing Related"
grep -q "Figure Index" validation.md && echo "✓ Figure Index appendix" || echo "✗ Missing Figure Index"
grep -q "Revision History" validation.md && echo "✓ Revision History" || echo "✗ Missing Revision History"
```

---

## File Structure After Enhancement

```
/mnt/skills/user/tfcu-procedure-formatter/
├── SKILL.md                      # Main skill file (updated)
├── scripts/
│   ├── annotate_screenshots.py   # NEW: Annotation pipeline
│   ├── generate_figure_index.py  # NEW: Figure index generator
│   └── validate_procedure.py     # NEW: Validation enforcer
├── templates/
│   └── annotation_template.json  # NEW: Example annotation definitions
└── examples/
    └── card_once/
        ├── annotations.json      # Example annotation config
        └── expected_output/      # Reference output for testing
```

---

## Testing Requirements

After implementing changes, verify with the Card@Once procedure:

1. **Extract images**: `unzip CARD_Once_Guide.docx -d docx_extract`
2. **Create annotation config**: Define annotations for each image in `annotations.json`
3. **Run pipeline**: Execute full workflow from Quick Start
4. **Validate output**: All checks must pass
5. **Visual inspection**: Open .docx and verify:
   - All screenshots have visible annotations
   - Callout numbers are legible
   - Legend appears below annotated images
   - Figure Index appendix is present and accurate

---

## Success Criteria

- [ ] Quick Start workflow includes mandatory annotation step
- [ ] `annotate_screenshots.py` script is complete and tested
- [ ] `generate_figure_index.py` script produces valid JSON
- [ ] `validate_procedure.py` enforces all requirements
- [ ] `createStepWithScreenshot()` warns on non-annotated images
- [ ] Figure Index appendix generator is implemented
- [ ] Validation checklist updated with annotation checks
- [ ] Card@Once procedure successfully processed with annotations
