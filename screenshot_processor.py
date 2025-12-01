#!/usr/bin/env python3
"""
TFCU Screenshot Processor - Intelligent Annotation Module v4.3.2

This module provides rich annotation capabilities for procedure screenshots:
- Numbered callouts (circled numbers)
- Curved arrows pointing to UI elements
- Highlight boxes with transparency
- Text labels with backgrounds
- Circle annotations for focus points

Dependencies:
    pip install pillow

Usage:
    from screenshot_processor import ScreenshotAnnotator

    annotator = ScreenshotAnnotator()
    annotated = annotator.process_image(
        image_path="screenshot.png",
        annotations=[
            {"type": "callout", "position": {"x": 50, "y": 30}, "number": 1},
            {"type": "arrow", "position": {"x": 20, "y": 20}, "end": {"x": 50, "y": 30}},
            {"type": "highlight", "bbox": {"x": 40, "y": 25, "w": 20, "h": 10}},
        ]
    )
    annotated.save("annotated_screenshot.png")
"""

import json
import math
import sys
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

from PIL import Image, ImageDraw, ImageFont

# =============================================================================
# TFCU BRAND COLORS
# =============================================================================

TFCU_COLORS = {
    "primary": "#154747",  # TFCU teal - default annotation color
    "light_teal": "#E8F4F4",  # Light teal for backgrounds
    "critical": "#C00000",  # Red - must-see elements
    "warning": "#FFC000",  # Gold - caution highlights
    "info": "#2E74B5",  # Blue - informational
    "success": "#548235",  # Green - correct actions
    "white": "#FFFFFF",
    "black": "#000000",
    "gray": "#666666",
}

# Default annotation styling
DEFAULT_STYLE = {
    "callout_radius": 18,
    "callout_font_size": 14,
    "arrow_width": 3,
    "arrow_head_size": 12,
    "highlight_opacity": 0.3,
    "border_width": 3,
    "label_font_size": 12,
    "label_padding": 6,
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def hex_to_rgba(hex_color: str, alpha: int = 255) -> Tuple[int, int, int, int]:
    """Convert hex color to RGBA tuple."""
    rgb = hex_to_rgb(hex_color)
    return (*rgb, alpha)


def percent_to_pixels(percent: float, dimension: int) -> int:
    """Convert percentage (0-100) to pixel position."""
    return int((percent / 100) * dimension)


def get_font(size: int) -> ImageFont.FreeTypeFont:
    """Get a font, falling back to default if custom fonts unavailable."""
    # Try common system fonts in order of preference
    font_paths = [
        # Windows
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        # Linux
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
        # macOS
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSText.ttf",
        "/Library/Fonts/Arial.ttf",
    ]

    for font_path in font_paths:
        if Path(font_path).exists():
            try:
                return ImageFont.truetype(font_path, size)
            except Exception:
                continue

    # Pillow 10+ has a better default font; try to use it at requested size
    try:
        # Pillow 10.1+ supports size parameter for load_default
        return ImageFont.load_default(size=size)
    except TypeError:
        # Older Pillow - fallback returns small bitmap font
        # Scale up the requested operations to compensate
        print(f"WARNING: No TrueType fonts found. Annotations may appear small.")
        print(f"         Install a font package or use Pillow 10.1+")
        return ImageFont.load_default()


# =============================================================================
# IMAGE PREPROCESSING (v4.1)
# =============================================================================


class ImagePreprocessor:
    """
    Preprocess images BEFORE annotation to prevent distortion.

    Critical: Crop and resize must happen before annotations are applied,
    otherwise annotations will be distorted when the final image is scaled.
    """

    def __init__(self, target_dpi: int = 300):
        self.target_dpi = target_dpi

    def preprocess(
        self,
        image: Image.Image,
        suggested_crop: Dict = None,
        target_width: int = 320,
        min_width: int = 280,
    ) -> Image.Image:
        """
        Preprocess image: crop, resize, and enhance quality.

        Args:
            image: Input PIL Image
            suggested_crop: {"x": %, "y": %, "w": %, "h": %} or None
            target_width: Target width in pixels
            min_width: Minimum acceptable width (will upscale if below)

        Returns:
            Preprocessed PIL Image ready for annotation
        """
        # 1. Convert to RGBA for consistency
        if image.mode != "RGBA":
            image = image.convert("RGBA")

        # 2. Apply smart crop if suggested
        if suggested_crop:
            image = self.smart_crop(image, suggested_crop)

        # 3. Resize to target width (preserving aspect ratio)
        image = self.resize_preserving_aspect(image, target_width)

        # 4. Upscale if below minimum (using LANCZOS for quality)
        if image.width < min_width:
            scale = min_width / image.width
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        return image

    def smart_crop(
        self,
        image: Image.Image,
        crop_box: Dict[str, float],
    ) -> Image.Image:
        """
        Crop image based on percentage coordinates.

        Args:
            image: Input PIL Image
            crop_box: {"x": left%, "y": top%, "w": width%, "h": height%}

        Returns:
            Cropped PIL Image
        """
        x = int((crop_box["x"] / 100) * image.width)
        y = int((crop_box["y"] / 100) * image.height)
        w = int((crop_box["w"] / 100) * image.width)
        h = int((crop_box["h"] / 100) * image.height)

        # Ensure bounds are valid
        x = max(0, min(x, image.width - 1))
        y = max(0, min(y, image.height - 1))
        right = min(x + w, image.width)
        bottom = min(y + h, image.height)

        return image.crop((x, y, right, bottom))

    def resize_preserving_aspect(
        self,
        image: Image.Image,
        target_width: int,
    ) -> Image.Image:
        """
        Resize image to target width while preserving aspect ratio.
        Uses LANCZOS resampling for high quality.
        """
        if image.width == target_width:
            return image

        aspect_ratio = image.height / image.width
        new_height = int(target_width * aspect_ratio)

        return image.resize((target_width, new_height), Image.Resampling.LANCZOS)

    def save_high_quality(
        self,
        image: Image.Image,
        output_format: str = "PNG",
    ) -> bytes:
        """
        Save image with maximum quality settings.

        Returns:
            Image as bytes
        """
        buffer = BytesIO()

        if output_format.upper() == "PNG":
            image.save(
                buffer,
                format="PNG",
                dpi=(self.target_dpi, self.target_dpi),
                compress_level=1,  # Minimal compression for quality
            )
        elif output_format.upper() in ("JPEG", "JPG"):
            # Convert to RGB for JPEG (no alpha)
            if image.mode == "RGBA":
                rgb_image = Image.new("RGB", image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[3])
                image = rgb_image
            image.save(
                buffer,
                format="JPEG",
                dpi=(self.target_dpi, self.target_dpi),
                quality=100,
                subsampling=0,  # 4:4:4 - no chroma subsampling
            )
        else:
            image.save(buffer, format=output_format)

        return buffer.getvalue()


# =============================================================================
# ANNOTATION COLOR MANAGER (v4.1)
# =============================================================================


class AnnotationColorManager:
    """
    Ensures consistent color matching between annotation markers and text.

    Each annotation element is assigned a color that persists through:
    - The visual marker on the image
    - The legend entry
    - The description text in the document
    """

    # Color palette with distinct, accessible colors
    PALETTE = [
        {
            "name": "critical",
            "hex": "#C00000",
            "rgb": (192, 0, 0),
            "desc": "Primary action",
        },
        {
            "name": "info",
            "hex": "#2E74B5",
            "rgb": (46, 116, 181),
            "desc": "Informational",
        },
        {"name": "warning", "hex": "#FFC000", "rgb": (255, 192, 0), "desc": "Caution"},
        {
            "name": "success",
            "hex": "#548235",
            "rgb": (84, 130, 53),
            "desc": "Confirmation",
        },
        {
            "name": "primary",
            "hex": "#154747",
            "rgb": (21, 71, 71),
            "desc": "Navigation",
        },
        {"name": "purple", "hex": "#7030A0", "rgb": (112, 48, 160), "desc": "Optional"},
        {
            "name": "orange",
            "hex": "#ED7D31",
            "rgb": (237, 125, 49),
            "desc": "Alternative",
        },
    ]

    def __init__(self):
        self.assigned = {}  # element_id -> color entry
        self.next_index = 0

    def assign(
        self,
        element_id: str,
        suggested_color: str = None,
        description_text: str = "",
    ) -> Dict:
        """
        Assign a color to an annotation element.

        Args:
            element_id: Unique identifier for the element
            suggested_color: Preferred color name (critical, info, etc.)
            description_text: Text to display in legend

        Returns:
            Color entry dict with hex, rgb, name
        """
        if element_id in self.assigned:
            return self.assigned[element_id]

        # Try to use suggested color
        color_entry = None
        if suggested_color:
            for entry in self.PALETTE:
                if entry["name"] == suggested_color:
                    color_entry = entry.copy()
                    break

        # Otherwise use next available
        if not color_entry:
            color_entry = self.PALETTE[self.next_index % len(self.PALETTE)].copy()
            self.next_index += 1

        # Add description text
        color_entry["text"] = description_text
        color_entry["element_id"] = element_id

        self.assigned[element_id] = color_entry
        return color_entry

    def get_color(self, element_id: str) -> Optional[Dict]:
        """Get the assigned color for an element."""
        return self.assigned.get(element_id)

    def get_legend_entries(self) -> List[Dict]:
        """
        Get all assigned colors as legend entries.

        Returns:
            List of {number, hex, rgb, name, text} for legend
        """
        entries = []
        for i, (element_id, color) in enumerate(self.assigned.items(), 1):
            entries.append(
                {
                    "number": i,
                    "element_id": element_id,
                    "hex": color["hex"],
                    "rgb": color["rgb"],
                    "name": color["name"],
                    "text": color.get("text", ""),
                }
            )
        return entries

    def reset(self):
        """Clear all assigned colors."""
        self.assigned = {}
        self.next_index = 0


# =============================================================================
# ANNOTATION LEGEND (v4.1)
# =============================================================================


def draw_legend(
    image: Image.Image,
    legend_entries: List[Dict],
    position: str = "bottom",
    style: Dict = None,
) -> Image.Image:
    """
    Draw a color-coded annotation legend.

    Args:
        image: Annotated PIL Image
        legend_entries: List of {number, hex, text} entries
        position: "bottom" or "right"
        style: Style overrides

    Returns:
        Image with legend added
    """
    if not legend_entries:
        return image

    style = {
        "legend_bg": "#FFFFFF",
        "legend_border": "#CCCCCC",
        "legend_padding": 12,
        "legend_row_height": 24,
        "legend_font_size": 11,
        "legend_title_size": 12,
        "legend_circle_radius": 9,
        **(style or {}),
    }

    padding = style["legend_padding"]
    row_height = style["legend_row_height"]
    circle_radius = style["legend_circle_radius"]

    # Calculate legend dimensions
    font = get_font(style["legend_font_size"])
    title_font = get_font(style["legend_title_size"])

    # Find max text width
    max_text_width = 0
    for entry in legend_entries:
        text_bbox = font.getbbox(entry.get("text", ""))
        text_width = text_bbox[2] - text_bbox[0] if text_bbox else 0
        max_text_width = max(max_text_width, text_width)

    legend_width = min(
        padding * 2 + circle_radius * 2 + 10 + max_text_width + 20, image.width - 20
    )
    legend_height = padding * 2 + row_height + len(legend_entries) * row_height  # Title

    if position == "bottom":
        # Create new canvas with legend space
        new_height = image.height + legend_height + 8
        canvas = Image.new("RGBA", (image.width, new_height), (255, 255, 255, 255))
        canvas.paste(image, (0, 0))

        # Legend position
        legend_x = (image.width - legend_width) // 2
        legend_y = image.height + 4

    elif position == "right":
        # Create new canvas with legend space
        new_width = image.width + legend_width + 8
        canvas = Image.new(
            "RGBA", (new_width, max(image.height, legend_height)), (255, 255, 255, 255)
        )
        canvas.paste(image, (0, 0))

        # Legend position
        legend_x = image.width + 4
        legend_y = 0
    else:
        canvas = image.copy()
        legend_x = 10
        legend_y = image.height - legend_height - 10

    draw = ImageDraw.Draw(canvas)

    # Draw legend background
    draw.rectangle(
        [legend_x, legend_y, legend_x + legend_width, legend_y + legend_height],
        fill=hex_to_rgb(style["legend_bg"]),
        outline=hex_to_rgb(style["legend_border"]),
        width=1,
    )

    # Draw title
    title_y = legend_y + padding
    draw.text(
        (legend_x + padding, title_y),
        "Annotation Key:",
        fill=hex_to_rgb(TFCU_COLORS["primary"]),
        font=title_font,
    )

    # Draw entries
    current_y = title_y + row_height

    for entry in legend_entries:
        # Circle with number
        circle_x = legend_x + padding + circle_radius
        circle_y = current_y + row_height // 2

        color_rgb = entry.get("rgb", hex_to_rgb(entry["hex"]))

        draw.ellipse(
            [
                circle_x - circle_radius,
                circle_y - circle_radius,
                circle_x + circle_radius,
                circle_y + circle_radius,
            ],
            fill=color_rgb,
            outline=(255, 255, 255),
            width=2,
        )

        # Number in circle
        number_text = str(entry["number"])
        num_font = get_font(style["legend_font_size"] - 1)
        num_bbox = draw.textbbox((0, 0), number_text, font=num_font)
        num_width = num_bbox[2] - num_bbox[0]
        num_height = num_bbox[3] - num_bbox[1]

        draw.text(
            (circle_x - num_width // 2, circle_y - num_height // 2 - 1),
            number_text,
            fill=(255, 255, 255),
            font=num_font,
        )

        # Description text (in MATCHING color)
        text_x = legend_x + padding + circle_radius * 2 + 12
        description = entry.get("text", "")

        draw.text(
            (text_x, circle_y - num_height // 2),
            description,
            fill=color_rgb,  # MATCHING COLOR
            font=font,
        )

        current_y += row_height

    return canvas


# =============================================================================
# ANNOTATION DRAWING FUNCTIONS
# =============================================================================


def draw_callout(
    draw: ImageDraw.ImageDraw,
    image: Image.Image,
    position: Dict[str, float],
    number: int,
    color: str = None,
    style: Dict = None,
) -> None:
    """
    Draw a numbered callout (circled number) at the specified position.

    Args:
        draw: ImageDraw object
        image: PIL Image for dimensions
        position: {"x": 0-100, "y": 0-100} percentage coordinates
        number: Number to display (1-99)
        color: Hex color for the callout circle
        style: Style overrides
    """
    style = {**DEFAULT_STYLE, **(style or {})}
    color = color or TFCU_COLORS["critical"]

    # Convert percentage to pixels
    x = percent_to_pixels(position["x"], image.width)
    y = percent_to_pixels(position["y"], image.height)

    radius = style["callout_radius"]

    # Draw filled circle
    bbox = [x - radius, y - radius, x + radius, y + radius]
    draw.ellipse(
        bbox, fill=hex_to_rgb(color), outline=hex_to_rgb(TFCU_COLORS["white"]), width=2
    )

    # Draw number
    font = get_font(style["callout_font_size"])
    text = str(number)

    # Get text bounding box for centering
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    text_x = x - text_width // 2
    text_y = y - text_height // 2 - 2  # Slight adjustment for visual centering

    draw.text((text_x, text_y), text, fill=hex_to_rgb(TFCU_COLORS["white"]), font=font)


def draw_arrow(
    draw: ImageDraw.ImageDraw,
    image: Image.Image,
    start: Dict[str, float],
    end: Dict[str, float],
    color: str = None,
    style: Dict = None,
    curved: bool = True,
) -> None:
    """
    Draw an arrow from start to end position.

    Args:
        draw: ImageDraw object
        image: PIL Image for dimensions
        start: {"x": 0-100, "y": 0-100} start position
        end: {"x": 0-100, "y": 0-100} end position (arrowhead location)
        color: Hex color for the arrow
        style: Style overrides
        curved: If True, draw a curved arrow; otherwise straight
    """
    style = {**DEFAULT_STYLE, **(style or {})}
    color = color or TFCU_COLORS["primary"]

    # Convert percentage to pixels
    x1 = percent_to_pixels(start["x"], image.width)
    y1 = percent_to_pixels(start["y"], image.height)
    x2 = percent_to_pixels(end["x"], image.width)
    y2 = percent_to_pixels(end["y"], image.height)

    rgb_color = hex_to_rgb(color)
    line_width = style["arrow_width"]
    head_size = style["arrow_head_size"]

    if curved:
        # Draw curved arrow using bezier approximation
        _draw_curved_arrow(draw, x1, y1, x2, y2, rgb_color, line_width, head_size)
    else:
        # Draw straight arrow
        draw.line([(x1, y1), (x2, y2)], fill=rgb_color, width=line_width)
        _draw_arrowhead(draw, x1, y1, x2, y2, rgb_color, head_size)


def _draw_curved_arrow(
    draw: ImageDraw.ImageDraw,
    x1: int,
    y1: int,
    x2: int,
    y2: int,
    color: Tuple[int, int, int],
    width: int,
    head_size: int,
) -> None:
    """Draw a curved arrow using quadratic bezier approximation."""
    # Calculate control point for curve (perpendicular offset)
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2

    # Perpendicular offset
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx * dx + dy * dy)

    if length == 0:
        return

    # Offset control point perpendicular to the line
    offset = length * 0.2  # 20% curve
    ctrl_x = mid_x - (dy / length) * offset
    ctrl_y = mid_y + (dx / length) * offset

    # Draw bezier curve as line segments
    points = []
    for t in [i / 20 for i in range(21)]:
        # Quadratic bezier formula
        px = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * ctrl_x + t**2 * x2
        py = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * ctrl_y + t**2 * y2
        points.append((px, py))

    # Draw the curve
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=color, width=width)

    # Draw arrowhead at the end
    # Calculate angle from second-to-last point to last point
    if len(points) >= 2:
        last_x, last_y = points[-1]
        prev_x, prev_y = points[-3] if len(points) >= 3 else points[-2]
        _draw_arrowhead(draw, prev_x, prev_y, last_x, last_y, color, head_size)


def _draw_arrowhead(
    draw: ImageDraw.ImageDraw,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    color: Tuple[int, int, int],
    size: int,
) -> None:
    """Draw an arrowhead at (x2, y2) pointing from (x1, y1)."""
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_angle = math.pi / 6  # 30 degrees

    # Calculate arrowhead points
    p1 = (
        x2 - size * math.cos(angle - arrow_angle),
        y2 - size * math.sin(angle - arrow_angle),
    )
    p2 = (
        x2 - size * math.cos(angle + arrow_angle),
        y2 - size * math.sin(angle + arrow_angle),
    )

    draw.polygon([(x2, y2), p1, p2], fill=color)


def draw_highlight(
    draw: ImageDraw.ImageDraw,
    image: Image.Image,
    bbox: Dict[str, float],
    color: str = None,
    style: Dict = None,
    overlay_image: Image.Image = None,
) -> Image.Image:
    """
    Draw a semi-transparent highlight box.

    Args:
        draw: ImageDraw object (not used for transparency, kept for consistency)
        image: PIL Image for dimensions
        bbox: {"x": 0-100, "y": 0-100, "w": width%, "h": height%}
        color: Hex color for the highlight
        style: Style overrides
        overlay_image: Image to composite highlight onto

    Returns:
        Modified image with highlight
    """
    style = {**DEFAULT_STYLE, **(style or {})}
    color = color or TFCU_COLORS["warning"]

    # Convert percentage to pixels
    x = percent_to_pixels(bbox["x"], image.width)
    y = percent_to_pixels(bbox["y"], image.height)
    w = percent_to_pixels(bbox["w"], image.width)
    h = percent_to_pixels(bbox["h"], image.height)

    # Create transparent overlay
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    # Calculate alpha from opacity
    alpha = int(255 * style["highlight_opacity"])
    fill_color = hex_to_rgba(color, alpha)
    border_color = hex_to_rgb(color)

    # Draw filled rectangle with transparency
    overlay_draw.rectangle(
        [(x, y), (x + w, y + h)],
        fill=fill_color,
        outline=border_color,
        width=style["border_width"],
    )

    # Composite overlay onto image
    if overlay_image is not None:
        return Image.alpha_composite(overlay_image.convert("RGBA"), overlay)
    else:
        return Image.alpha_composite(image.convert("RGBA"), overlay)


def draw_circle(
    draw: ImageDraw.ImageDraw,
    image: Image.Image,
    position: Dict[str, float],
    radius_percent: float = 5,
    color: str = None,
    style: Dict = None,
) -> None:
    """
    Draw a circle/ring around a UI element.

    Args:
        draw: ImageDraw object
        image: PIL Image for dimensions
        position: {"x": 0-100, "y": 0-100} center position
        radius_percent: Radius as percentage of image width
        color: Hex color for the circle
        style: Style overrides
    """
    style = {**DEFAULT_STYLE, **(style or {})}
    color = color or TFCU_COLORS["critical"]

    x = percent_to_pixels(position["x"], image.width)
    y = percent_to_pixels(position["y"], image.height)
    radius = percent_to_pixels(radius_percent, image.width)

    bbox = [x - radius, y - radius, x + radius, y + radius]
    draw.ellipse(bbox, outline=hex_to_rgb(color), width=style["border_width"])


def draw_label(
    draw: ImageDraw.ImageDraw,
    image: Image.Image,
    position: Dict[str, float],
    text: str,
    color: str = None,
    bg_color: str = None,
    style: Dict = None,
) -> None:
    """
    Draw a text label with background.

    Args:
        draw: ImageDraw object
        image: PIL Image for dimensions
        position: {"x": 0-100, "y": 0-100} top-left position
        text: Label text
        color: Text color (hex)
        bg_color: Background color (hex)
        style: Style overrides
    """
    style = {**DEFAULT_STYLE, **(style or {})}
    color = color or TFCU_COLORS["white"]
    bg_color = bg_color or TFCU_COLORS["primary"]

    x = percent_to_pixels(position["x"], image.width)
    y = percent_to_pixels(position["y"], image.height)

    font = get_font(style["label_font_size"])
    padding = style["label_padding"]

    # Get text size
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    # Draw background rectangle
    bg_bbox = [
        x - padding,
        y - padding,
        x + text_width + padding,
        y + text_height + padding,
    ]
    draw.rectangle(bg_bbox, fill=hex_to_rgb(bg_color))

    # Draw text
    draw.text((x, y), text, fill=hex_to_rgb(color), font=font)


# =============================================================================
# FIGURE REGISTRY (v4.3)
# =============================================================================


class FigureRegistry:
    """
    Track all figures globally across a procedure document.

    Manages global figure numbering, metadata, color mapping, and cross-referencing.
    Exports registry to JSON for use by document generation and validation.

    v4.3: Added color_map tracking for color-consistency validation.
    """

    # Standard TFCU annotation color palette
    COLOR_PALETTE = {
        "red": "#C00000",
        "critical": "#C00000",
        "blue": "#2E74B5",
        "info": "#2E74B5",
        "gold": "#FFC000",
        "warning": "#FFC000",
        "yellow": "#FFC000",
        "green": "#548235",
        "success": "#548235",
        "teal": "#154747",
        "primary": "#154747",
        "purple": "#7030A0",
        "orange": "#ED7D31",
    }

    def __init__(self):
        """Initialize empty figure registry."""
        self.figures = []
        self._next_number = 1
        self.color_map = {}  # {figure_number: {annotation_number: color_name}}

    def add_figure(
        self,
        source_path: Union[str, Path],
        annotated_path: Union[str, Path],
        annotations: List[Dict],
        legend_items: List[Dict] = None,
        dimensions: Dict[str, int] = None,
        section: str = None,
    ) -> int:
        """
        Register a processed figure.

        Args:
            source_path: Path to original raw image
            annotated_path: Path to annotated output image
            annotations: List of annotation dicts applied to image
            legend_items: Optional legend entries with {number, hex, text}
            dimensions: Optional {width, height} of final image
            section: Optional section name for grouping

        Returns:
            Assigned figure number
        """
        figure_num = self._next_number
        self._next_number += 1

        # Extract color mapping from annotations
        annotation_colors = {}
        for ann in annotations:
            if "number" in ann:
                color = ann.get("color", "teal")
                # Normalize color name
                color_name = self._normalize_color(color)
                annotation_colors[ann["number"]] = {
                    "color_name": color_name,
                    "hex": self.COLOR_PALETTE.get(color_name, color),
                    "type": ann.get("type", "callout"),
                }

        if annotation_colors:
            self.color_map[figure_num] = annotation_colors

        figure_data = {
            "figure_number": figure_num,
            "source_image": str(source_path),
            "annotated_image": str(annotated_path),
            "annotations": annotations,
            "legend": legend_items or [],
            "dimensions": dimensions or {},
            "section": section or "Uncategorized",
            "color_map": annotation_colors,  # v4.3: Include color mapping
        }

        self.figures.append(figure_data)
        return figure_num

    def _normalize_color(self, color: str) -> str:
        """Normalize color name to standard palette key."""
        if not color:
            return "teal"
        color_lower = color.lower().strip()
        # Handle hex colors
        if color_lower.startswith("#"):
            for name, hex_val in self.COLOR_PALETTE.items():
                if hex_val.lower() == color_lower:
                    return name
            return color_lower
        return color_lower if color_lower in self.COLOR_PALETTE else "teal"

    def get_figure(self, figure_num: int) -> Optional[Dict]:
        """Get figure metadata by figure number."""
        for fig in self.figures:
            if fig["figure_number"] == figure_num:
                return fig
        return None

    def get_figures_by_section(self, section: str) -> List[Dict]:
        """Get all figures for a specific section."""
        return [fig for fig in self.figures if fig["section"] == section]

    def to_json(self) -> Dict:
        """
        Export registry as JSON-serializable dict.

        Returns:
            Dict with figures list, count, color_map, and metadata
        """
        return {
            "figures": self.figures,
            "total_count": len(self.figures),
            "color_map": self.color_map,
            "color_palette": self.COLOR_PALETTE,
            "generated_by": "TFCU Screenshot Annotation Pipeline v4.3.2",
        }

    def save(self, output_path: Union[str, Path]):
        """Save registry to JSON file."""
        output_path = Path(output_path)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(self.to_json(), f, indent=2, ensure_ascii=False)

    def __len__(self) -> int:
        """Return number of registered figures."""
        return len(self.figures)

    def __repr__(self) -> str:
        """String representation of registry."""
        return f"<FigureRegistry: {len(self.figures)} figures>"


# =============================================================================
# MAIN ANNOTATOR CLASS
# =============================================================================


class ScreenshotAnnotator:
    """
    Main class for processing and annotating screenshots.

    Example:
        annotator = ScreenshotAnnotator()
        result = annotator.process_image(
            "input.png",
            [
                {"type": "callout", "position": {"x": 50, "y": 30}, "number": 1},
                {"type": "arrow", "position": {"x": 20, "y": 50}, "end": {"x": 50, "y": 30}},
            ]
        )
        result.save("output.png")
    """

    def __init__(self, style_overrides: Dict = None):
        """Initialize with optional style overrides."""
        self.style = {**DEFAULT_STYLE, **(style_overrides or {})}

    def process_image(
        self,
        image_input: Union[str, Path, bytes, Image.Image],
        annotations: List[Dict],
        output_format: str = "PNG",
    ) -> Image.Image:
        """
        Process an image with the given annotations.

        Args:
            image_input: Path to image, bytes, or PIL Image
            annotations: List of annotation dictionaries
            output_format: Output format (PNG recommended for transparency)

        Returns:
            Annotated PIL Image
        """
        # Load image
        if isinstance(image_input, Image.Image):
            image = image_input.copy()
        elif isinstance(image_input, bytes):
            image = Image.open(BytesIO(image_input))
        else:
            image = Image.open(image_input)

        # Convert to RGBA for transparency support
        image = image.convert("RGBA")

        # Create drawing context
        draw = ImageDraw.Draw(image)

        # Process each annotation
        for annotation in annotations:
            ann_type = annotation.get("type", "").lower()
            color = annotation.get("color")

            if ann_type == "callout":
                draw_callout(
                    draw,
                    image,
                    position=annotation["position"],
                    number=annotation.get("number", 1),
                    color=color,
                    style=self.style,
                )

            elif ann_type == "arrow":
                draw_arrow(
                    draw,
                    image,
                    start=annotation["position"],
                    end=annotation["end"],
                    color=color,
                    style=self.style,
                    curved=annotation.get("curved", True),
                )

            elif ann_type == "highlight":
                image = draw_highlight(
                    draw,
                    image,
                    bbox=annotation["bbox"],
                    color=color,
                    style=self.style,
                    overlay_image=image,
                )
                # Recreate draw context for modified image
                draw = ImageDraw.Draw(image)

            elif ann_type == "circle":
                draw_circle(
                    draw,
                    image,
                    position=annotation["position"],
                    radius_percent=annotation.get("radius", 5),
                    color=color,
                    style=self.style,
                )

            elif ann_type == "label":
                draw_label(
                    draw,
                    image,
                    position=annotation["position"],
                    text=annotation["text"],
                    color=color,
                    bg_color=annotation.get("bg_color"),
                    style=self.style,
                )

        return image

    def process_to_bytes(
        self,
        image_input: Union[str, Path, bytes, Image.Image],
        annotations: List[Dict],
        output_format: str = "PNG",
    ) -> bytes:
        """
        Process an image and return as bytes.

        Args:
            image_input: Path to image, bytes, or PIL Image
            annotations: List of annotation dictionaries
            output_format: Output format (PNG recommended)

        Returns:
            Annotated image as bytes
        """
        image = self.process_image(image_input, annotations, output_format)

        buffer = BytesIO()
        image.save(buffer, format=output_format)
        return buffer.getvalue()


# =============================================================================
# CLI INTERFACE
# =============================================================================


def process_from_stdin():
    """
    Process annotations from stdin JSON input (legacy mode).

    Expected JSON format:
    {
        "image_path": "path/to/image.png",  # OR "image_base64": "..."
        "annotations": [
            {"type": "callout", "position": {"x": 50, "y": 30}, "number": 1},
            ...
        ],
        "output_path": "path/to/output.png"  # Optional, outputs base64 if not provided
    }
    """
    import base64

    # Read JSON from stdin
    input_data = json.load(sys.stdin)

    # Load image
    if "image_path" in input_data:
        image_input = input_data["image_path"]
    elif "image_base64" in input_data:
        image_input = base64.b64decode(input_data["image_base64"])
    else:
        raise ValueError("Must provide either 'image_path' or 'image_base64'")

    # Process annotations
    annotator = ScreenshotAnnotator()
    result = annotator.process_image(image_input, input_data.get("annotations", []))

    # Output
    if "output_path" in input_data:
        result.save(input_data["output_path"])
        print(json.dumps({"success": True, "output_path": input_data["output_path"]}))
    else:
        # Return as base64
        buffer = BytesIO()
        result.save(buffer, format="PNG")
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        print(json.dumps({"success": True, "image_base64": b64}))


def process_directory(
    input_dir: Path,
    output_dir: Path,
    annotations_map: Dict[str, List[Dict]],
    registry: FigureRegistry,
    color_manager: AnnotationColorManager = None,
) -> None:
    """
    Process all images in a directory with batch annotation.

    Args:
        input_dir: Directory containing raw images
        output_dir: Directory for annotated outputs
        annotations_map: Dict mapping image stem to annotation list
        registry: FigureRegistry to track all figures
        color_manager: Optional shared color manager
    """
    if color_manager is None:
        color_manager = AnnotationColorManager()

    annotator = ScreenshotAnnotator()
    preprocessor = ImagePreprocessor()

    # Process images (multiple formats supported)
    supported_extensions = [
        "*.png",
        "*.jpg",
        "*.jpeg",
        "*.gif",
        "*.PNG",
        "*.JPG",
        "*.JPEG",
        "*.GIF",
    ]
    image_files = []
    for ext in supported_extensions:
        image_files.extend(input_dir.glob(ext))
    # Remove duplicates (case-insensitive filesystems) and sort by name
    seen = set()
    unique_files = []
    for f in sorted(image_files, key=lambda p: p.name.lower()):
        if f.name.lower() not in seen:
            seen.add(f.name.lower())
            unique_files.append(f)
    image_files = unique_files

    # Check for unsupported formats and warn
    wmf_emf_files = (
        list(input_dir.glob("*.wmf"))
        + list(input_dir.glob("*.emf"))
        + list(input_dir.glob("*.WMF"))
        + list(input_dir.glob("*.EMF"))
    )
    if wmf_emf_files:
        print(
            f"WARNING: Found {len(wmf_emf_files)} WMF/EMF files that cannot be processed."
        )
        print("         These legacy Windows Metafile formats require conversion.")
        print("         Consider converting to PNG using LibreOffice or ImageMagick:")
        print("         magick convert input.wmf output.png")
        for wmf in wmf_emf_files[:3]:  # Show first 3
            print(f"           - {wmf.name}")
        if len(wmf_emf_files) > 3:
            print(f"           ... and {len(wmf_emf_files) - 3} more")

    if not image_files:
        print(f"WARNING: No supported images found in {input_dir}")
        print(f"         Supported formats: PNG, JPG, JPEG, GIF")
        return

    print(f"Processing {len(image_files)} images from {input_dir}")

    for img_path in image_files:
        img_stem = img_path.stem
        annotations = annotations_map.get(img_stem, [])

        if not annotations:
            # Auto-generate placeholder annotation
            annotations = [
                {
                    "type": "callout",
                    "position": {"x": 50, "y": 50},
                    "number": 1,
                    "color": "primary",
                    "description": "Primary action",
                }
            ]
            print(
                f"  WARNING: No annotations defined for {img_path.name}, using placeholder"
            )

        # Load and preprocess image
        image = Image.open(img_path)
        # Note: preprocessing with crop/resize should be applied if needed
        # For now, using images as-is

        # Apply annotations
        annotated = annotator.process_image(image, annotations)

        # Extract legend items from callout annotations
        legend_items = []
        for ann in annotations:
            if ann.get("type") == "callout":
                num = ann.get("number", 1)
                desc = ann.get("description", f"Action {num}")
                color = ann.get("color", "primary")
                color_entry = color_manager.assign(f"{img_stem}_{num}", color, desc)
                legend_items.append(
                    {
                        "number": num,
                        "hex": color_entry["hex"],
                        "text": desc,
                    }
                )

        # Add legend if we have callouts
        if legend_items:
            annotated = draw_legend(annotated, legend_items, position="bottom")

        # Save annotated image
        output_path = output_dir / f"figure_{registry._next_number:02d}_{img_stem}.png"
        annotated.save(output_path, "PNG")

        # Register figure
        figure_num = registry.add_figure(
            source_path=img_path,
            annotated_path=output_path,
            annotations=annotations,
            legend_items=legend_items,
            dimensions={"width": annotated.width, "height": annotated.height},
        )

        print(f"  ✓ Figure {figure_num}: {img_path.name} -> {output_path.name}")


def check_dependencies():
    """Validate required dependencies are installed."""
    try:
        from PIL import Image
    except ImportError:
        print("=" * 60)
        print("ERROR: Pillow not installed")
        print("=" * 60)
        print("The TFCU Screenshot Processor requires Pillow for image annotation.")
        print("\nTo install:")
        print("  pip install -r requirements.txt")
        print("\nOr manually:")
        print("  pip install pillow>=10.0.0")
        print("=" * 60)
        sys.exit(1)


def main():
    """Main CLI entry point with batch processing support."""
    import argparse

    # Check dependencies first
    check_dependencies()

    parser = argparse.ArgumentParser(
        description="TFCU Screenshot Annotation Pipeline v4.3.2",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Batch process directory
  python screenshot_processor.py --input images/raw --output images/annotated

  # With annotation config
  python screenshot_processor.py --input images/raw --output images/annotated --annotations annotations.json

  # Legacy stdin mode
  python screenshot_processor.py --stdin < input.json
        """,
    )

    parser.add_argument(
        "--input",
        type=str,
        help="Input directory with raw images (*.png)",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output directory for annotated images",
    )
    parser.add_argument(
        "--annotations",
        type=str,
        help="JSON file with annotation instructions (maps image stem to annotation list)",
    )
    parser.add_argument(
        "--procedure",
        type=str,
        help="Procedure markdown file for context (optional)",
    )
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="Legacy mode: read single image from stdin JSON",
    )
    parser.add_argument(
        "--review",
        action="store_true",
        help="v4.3: Guided review mode - show annotation preview before applying",
    )
    parser.add_argument(
        "--report",
        type=str,
        help="v4.3: Generate HTML color consistency report to this file",
    )

    args = parser.parse_args()

    # Legacy stdin mode
    if args.stdin:
        process_from_stdin()
        return

    # Batch processing mode
    if not args.input or not args.output:
        parser.print_help()
        sys.exit(1)

    input_dir = Path(args.input)
    output_dir = Path(args.output)

    # Validate input directory
    if not input_dir.exists():
        print(f"ERROR: Input directory not found: {input_dir}")
        sys.exit(1)

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load annotation instructions
    annotations_map = {}
    if args.annotations:
        annotations_path = Path(args.annotations)
        if annotations_path.exists():
            with open(annotations_path, encoding="utf-8") as f:
                annotations_map = json.load(f)
            print(f"Loaded annotations for {len(annotations_map)} images")
        else:
            print(f"WARNING: Annotations file not found: {annotations_path}")

    # Initialize registry
    registry = FigureRegistry()

    # Process all images
    print("=" * 60)
    print("TFCU Screenshot Annotation Pipeline v4.3.2")
    if args.review:
        print("MODE: Guided Review (interactive confirmation)")
    print("=" * 60)

    # v4.3: Guided review workflow
    if args.review and annotations_map:
        approved_annotations = guided_review_workflow(annotations_map, input_dir)
        process_directory(input_dir, output_dir, approved_annotations, registry)
    else:
        process_directory(input_dir, output_dir, annotations_map, registry)

    # Save registry
    registry_path = output_dir / "figure_registry.json"
    registry.save(registry_path)

    # v4.3: Generate HTML report if requested
    if args.report:
        generate_color_report(registry, args.procedure, args.report)

    # Summary
    print("=" * 60)
    print(f"Processed {len(registry)} figures")
    print(f"Registry saved to: {registry_path}")
    if args.report:
        print(f"Color report saved to: {args.report}")
    print("=" * 60)


# =============================================================================
# GUIDED REVIEW WORKFLOW (v4.3)
# =============================================================================


def guided_review_workflow(annotations_map: Dict, input_dir: Path) -> Dict:
    """
    Interactive guided review of annotation plans.

    Shows each image's planned annotations and prompts for confirmation.
    User can approve, skip, or modify annotations.

    Args:
        annotations_map: {image_stem: [annotations]} mapping
        input_dir: Directory containing source images

    Returns:
        Approved annotations map (may be modified)
    """
    print("\n" + "=" * 60)
    print("GUIDED REVIEW: Annotation Preview")
    print("=" * 60)
    print("Review each image's annotations before applying.")
    print("Commands: [Y]es/approve, [N]o/skip, [A]ll/approve remaining, [Q]uit\n")

    approved = {}
    approve_all = False

    for i, (image_stem, annotations) in enumerate(annotations_map.items(), 1):
        # Find source image
        source_path = None
        for ext in [".png", ".jpg", ".jpeg", ".PNG", ".JPG"]:
            candidate = input_dir / f"{image_stem}{ext}"
            if candidate.exists():
                source_path = candidate
                break

        if not source_path:
            print(
                f"[{i}/{len(annotations_map)}] {image_stem}: Source not found, skipping"
            )
            continue

        # Display annotation summary
        print(f"\n[{i}/{len(annotations_map)}] {image_stem}")
        print("-" * 40)

        for j, ann in enumerate(annotations, 1):
            ann_type = ann.get("type", "unknown")
            color = ann.get("color", "teal")
            pos = ann.get("position", {})

            if ann_type == "callout":
                num = ann.get("number", "?")
                print(
                    f"  {j}. Callout #{num} ({color}) at ({pos.get('x', '?')}%, {pos.get('y', '?')}%)"
                )
            elif ann_type == "arrow":
                end = ann.get("end", {})
                print(
                    f"  {j}. Arrow ({color}) from ({pos.get('x')}%, {pos.get('y')}%) to ({end.get('x')}%, {end.get('y')}%)"
                )
            elif ann_type == "highlight":
                bbox = ann.get("bbox", {})
                print(
                    f"  {j}. Highlight ({color}) box at ({bbox.get('x')}%, {bbox.get('y')}%) size {bbox.get('w')}x{bbox.get('h')}%"
                )
            elif ann_type == "circle":
                print(f"  {j}. Circle ({color}) at ({pos.get('x')}%, {pos.get('y')}%)")
            elif ann_type == "label":
                text = ann.get("text", "")
                print(
                    f"  {j}. Label ({color}): \"{text}\" at ({pos.get('x')}%, {pos.get('y')}%)"
                )
            else:
                print(f"  {j}. {ann_type} ({color})")

        # Auto-approve if user chose "All"
        if approve_all:
            print("  -> Auto-approved (approve all mode)")
            approved[image_stem] = annotations
            continue

        # Prompt for confirmation
        while True:
            try:
                response = (
                    input("\n  Approve these annotations? [Y/n/a/q]: ").strip().lower()
                )
            except EOFError:
                # Non-interactive mode (e.g., CI/CD pipeline) - skip with warning
                print("\n  WARNING: Non-interactive mode detected (EOF on stdin)")
                print(
                    "           Skipping guided review. Use without --review flag for non-interactive use."
                )
                return (
                    approved  # Return what we have so far instead of auto-approving all
                )

            if response in ["", "y", "yes"]:
                approved[image_stem] = annotations
                print("  -> Approved")
                break
            elif response in ["n", "no"]:
                print("  -> Skipped")
                break
            elif response in ["a", "all"]:
                approve_all = True
                approved[image_stem] = annotations
                print("  -> Approved (and approving all remaining)")
                break
            elif response in ["q", "quit"]:
                print("\n  Review cancelled. Processing approved images only.")
                return approved
            else:
                print("  Invalid response. Enter Y/n/a/q")

    print(f"\n{len(approved)}/{len(annotations_map)} images approved for annotation")
    return approved


def generate_color_report(
    registry: "FigureRegistry", procedure_path: str, output_path: str
):
    """
    Generate HTML color consistency report.

    Args:
        registry: FigureRegistry with processed figures
        procedure_path: Path to procedure markdown (optional)
        output_path: Output HTML file path
    """
    try:
        # Try to import the report generator
        import sys

        scripts_dir = Path(__file__).parent / "scripts"
        if scripts_dir.exists():
            sys.path.insert(0, str(scripts_dir))

        from report_generator import ReportGenerator

        generator = ReportGenerator()
        generator.figures = registry.figures
        generator.color_map = registry.color_map

        if procedure_path:
            generator.parse_procedure(Path(procedure_path))

        generator.compare_colors()
        generator.save_html(Path(output_path))
        print(f"Generated color report: {output_path}")

    except ImportError:
        print(f"WARNING: Could not generate report - report_generator.py not found")
    except Exception as e:
        print(f"WARNING: Report generation failed: {e}")


if __name__ == "__main__":
    main()
