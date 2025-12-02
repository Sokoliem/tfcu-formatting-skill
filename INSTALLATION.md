# TFCU Procedure Formatter v4.3.2 - Installation Guide

## Package Information

- **Version**: 4.3.2
- **Release Date**: December 2025
- **Package File**: `tfcu-procedure-formatter-v4.3.2.skill`
- **Package Size**: ~110 KB
- **Target Environment**: Claude.ai, Claude Code, Claude Desktop

## What's New in v4.2

### Mandatory Annotation Pipeline
Screenshot annotation is now **enforced as a mandatory pipeline step**, not optional documentation.

### New Features
- **FigureRegistry** class for global figure tracking
- **Batch processing** CLI with `--input`, `--output`, `--annotations` flags
- **Figure index generation** for document appendix
- **Validation enforcement** with exit codes for CI/CD
- **Auto-placeholder** annotations for undefined images

### New Files
- `scripts/generate_figure_index.py` - Generate figure index appendix
- `scripts/validate_procedure.py` - Enforce annotation requirements
- `templates/annotation_template.json` - Example configurations

## Installation

### Option 1: Claude Code (Recommended)

**Personal Installation (user-level):**
```bash
# Extract to personal skills directory
mkdir -p ~/.claude/skills/
unzip tfcu-procedure-formatter-v4.3.2.skill -d ~/.claude/skills/tfcu-procedure-formatter/
```

**Project Installation (repo-level, shareable via git):**
```bash
# Extract to project skills directory
mkdir -p .claude/skills/
unzip tfcu-procedure-formatter-v4.3.2.skill -d .claude/skills/tfcu-procedure-formatter/
```

### Option 2: Claude.ai / Claude Desktop

1. Go to **Settings > Capabilities**
2. Upload `tfcu-procedure-formatter-v4.3.2.skill`
3. The skill will be available in your conversations

### Option 3: Manual Installation (Linux/Container)

1. **Place the .skill file in your skills directory:**
   ```bash
   cp tfcu-procedure-formatter-v4.3.2.skill /mnt/skills/user/
   ```

2. **Extract the skill:**
   ```bash
   cd /mnt/skills/user/
   unzip tfcu-procedure-formatter-v4.3.2.skill -d tfcu-procedure-formatter/
   ```

3. **Verify installation:**
   ```bash
   ls -la /mnt/skills/user/tfcu-procedure-formatter/
   ```

   You should see:
   - SKILL.md
   - screenshot_processor.py
   - scripts/ (with generate_figure_index.py, validate_procedure.py)
   - templates/ (with annotation_template.json)
   - validator/
   - assets/
   - resources/

## Quick Start

The v4.2 workflow requires 7 mandatory steps:

```bash
# 1. Convert source document to markdown
pandoc source.docx -o source.md

# 2. Extract images from source
mkdir -p images/raw images/annotated
unzip -o source.docx -d docx_extract
cp docx_extract/word/media/* images/raw/

# 3. Read the docx skill for implementation details
cat /mnt/skills/public/docx/SKILL.md

# 4. MANDATORY: Process and annotate all screenshots
python3 screenshot_processor.py --input images/raw --output images/annotated --procedure source.md

# 5. Generate formatted procedure (uses annotated images)
node generate-procedure.js

# 6. Generate Figure Index appendix
python3 scripts/generate_figure_index.py --registry images/annotated/figure_registry.json --output figure_index.json

# 7. Validate output
pandoc output.docx -o validation.md
python3 scripts/validate_procedure.py --doc validation.md --figures figure_index.json
```

## Annotation Configuration

Create an `annotations.json` file mapping image stems to annotation arrays:

```json
{
  "login_screen": [
    {
      "type": "callout",
      "position": {"x": 30, "y": 20},
      "number": 1,
      "color": "critical",
      "description": "Click Login button"
    }
  ],
  "account_entry": [
    {
      "type": "highlight",
      "bbox": {"x": 10, "y": 40, "w": 30, "h": 10},
      "color": "warning",
      "description": "Enter account number"
    }
  ]
}
```

See `templates/annotation_template.json` for more examples.

## Annotation Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `callout` | Numbered circle | `position`, `number`, `color`, `description` |
| `arrow` | Curved arrow | `position` (start), `end`, `color` |
| `highlight` | Semi-transparent box | `bbox` (x, y, w, h), `color` |
| `circle` | Ring around element | `position`, `radius`, `color` |
| `label` | Text with background | `position`, `text`, `color`, `bg_color` |

## Color Options

- `primary` - TFCU teal (#154747) - default, navigation
- `critical` - Red (#C00000) - must-click elements
- `warning` - Gold (#FFC000) - caution areas
- `info` - Blue (#2E74B5) - informational
- `success` - Green (#548235) - confirmation

## Validation

The validation script checks:
- Figure registry exists
- Required sections present (OVERVIEW, RELATED, Revision History)
- All figures referenced in document
- Annotation coverage metrics

**Exit codes:**
- `0` - All validations passed
- `1` - Critical errors found

## Dependencies

### Python (for annotation)
```bash
pip install pillow>=10.0.0
```

### Node.js (for document generation)
```bash
npm install docx
```

## Troubleshooting

### "No .png images found"
- Ensure images are extracted to `images/raw/`
- Check file extensions are `.png` (lowercase)

### "Figure registry not found"
- Run step 4 (screenshot_processor.py) before step 6
- Check `images/annotated/figure_registry.json` exists

### "WARNING: No annotations defined"
- Create `annotations.json` file mapping image stems to annotation arrays
- Or accept auto-placeholder annotations (callout at center)

### "Missing figureNumber"
- Load figure registry JSON in your generate-procedure.js script
- Pass `figureNumber` to `createStepWithScreenshot()`

## File Structure After Installation

```
/mnt/skills/user/tfcu-procedure-formatter/
├── SKILL.md                        # Main skill documentation (v4.2)
├── CHANGELOG.md                    # Version history
├── screenshot_processor.py         # Annotation pipeline (v4.2)
├── scripts/
│   ├── generate_figure_index.py    # Figure index generator
│   └── validate_procedure.py       # Validation enforcer
├── templates/
│   └── annotation_template.json    # Example annotations
├── assets/
│   └── Procedure_Template.docx     # Reference template
├── resources/
│   ├── screenshot_handling.md      # Workflow guide
│   ├── vision_prompts.md           # Claude Vision templates
│   ├── visual_elements.md          # Design patterns
│   └── writing_standards.md        # Content guidelines
└── validator/
    └── [54-spec validation system]
```

## Migration from v4.1

1. **Annotation is now mandatory** - Update workflows to include step 4
2. **Create annotations.json** - Map image stems to annotation arrays
3. **Add validation** - Run step 7 to enforce requirements
4. **Update document generation** - Load figure registry, pass `figureNumber` to steps

## Support

For issues or questions:
- Review `SKILL.md` for complete documentation
- Check `CHANGELOG.md` for version-specific changes
- See `templates/annotation_template.json` for examples
- Consult `resources/screenshot_handling.md` for workflow details

## License

Proprietary - TFCU Internal Use Only
