"""
Face zone detector using OpenCV face detection + geometric zone division.

Divides the detected face bounding box into 5 anatomical zones aligned
with the acne face map:
  - hairline_temples : hair products / cosmetics  (top strip + side edges)
  - t_zone           : oily skin                  (forehead centre + nose column)
  - cheeks           : friction / environmental   (left & right mid-face)
  - jawline_chin     : hormonal changes           (bottom quarter)
  - nose             : oily skin / blackheads     (centre mid-face)

No external model files required — uses OpenCV Haar cascade bundled
with the opencv package.
"""

import numpy as np
import cv2
import os
from dataclasses import dataclass, field
from typing import Optional

# Haar cascade shipped with OpenCV
_CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
_FACE_CASCADE = cv2.CascadeClassifier(_CASCADE_PATH)

# Cause associated with each zone (from face map)
ZONE_CAUSE_MAP: dict[str, str] = {
    "hairline_temples": "products",
    "t_zone":           "oily_skin",
    "cheeks":           "friction",
    "jawline_chin":     "hormonal",
    "nose":             "oily_skin",
}


@dataclass
class ZoneResult:
    zone: str
    cause: str
    bbox: tuple          # (x1, y1, x2, y2) absolute pixel coords in original image
    affected: bool = False
    confidence: float = 0.0


def _geometric_zones(fx: int, fy: int, fw: int, fh: int) -> dict[str, tuple]:
    """
    Given a face bounding box, return zone bboxes using facial proportion rules.

    Vertical splits (from top of face bbox):
      0%  – 18% : hairline strip
      18% – 42% : forehead / T-zone top
      42% – 62% : nose / mid-face
      62% – 80% : cheek / lower-mid
      80% – 100%: jaw / chin

    Horizontal splits:
      outer 20% on each side = temples
      centre 30% = nose / T-zone column
      remaining sides = cheeks
    """
    x, y, w, h = fx, fy, fw, fh

    # Row boundaries
    r0 = y
    r1 = y + int(h * 0.18)   # hairline bottom
    r2 = y + int(h * 0.42)   # forehead bottom / nose top
    r3 = y + int(h * 0.62)   # nose bottom / cheek bottom
    r4 = y + int(h * 0.80)   # jaw top
    r5 = y + h                # chin bottom

    # Column boundaries
    c0 = x
    c1 = x + int(w * 0.20)   # temple right edge (left side)
    c2 = x + int(w * 0.35)   # T-zone / nose left edge
    c3 = x + int(w * 0.65)   # T-zone / nose right edge
    c4 = x + int(w * 0.80)   # temple left edge (right side)
    c5 = x + w

    return {
        # top strip full width + side strips
        "hairline_temples": (c0, r0, c5, r1),
        # centre column forehead → nose
        "t_zone":           (c2, r1, c3, r3),
        # left + right sides, mid-face rows (merged bbox)
        "cheeks":           (c0, r2, c5, r4),
        # bottom quarter, full width
        "jawline_chin":     (c0, r4, c5, r5),
        # centre column, nose rows
        "nose":             (c2, r2, c3, r3),
    }


def detect_zones(image_rgb: np.ndarray) -> Optional[list[ZoneResult]]:
    """
    Detect face with OpenCV Haar cascade and return per-zone bounding boxes.
    Returns None if no face is detected.
    """
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    h_img, w_img = image_rgb.shape[:2]

    faces = _FACE_CASCADE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(60, 60),
    )

    if len(faces) == 0:
        return []

    # Use the largest detected face
    fx, fy, fw, fh = max(faces, key=lambda r: r[2] * r[3])

    zones = _geometric_zones(fx, fy, fw, fh)
    results: list[ZoneResult] = []

    for zone_name, (x1, y1, x2, y2) in zones.items():
        # Clamp to image bounds
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w_img, x2), min(h_img, y2)
        results.append(ZoneResult(
            zone=zone_name,
            cause=ZONE_CAUSE_MAP[zone_name],
            bbox=(int(x1), int(y1), int(x2), int(y2)),
        ))

    return results


def mark_zones_affected(
    zone_results: list[ZoneResult],
    image_rgb: np.ndarray,
    model,
    preprocess_fn,
    acne_classes: set[str],
    class_names: list[str],
) -> list[ZoneResult]:
    """
    Crop each zone, run the model, mark zone as affected if an acne class wins.
    """
    for zr in zone_results:
        x1, y1, x2, y2 = zr.bbox
        if x2 - x1 < 20 or y2 - y1 < 20:
            continue
        crop = image_rgb[y1:y2, x1:x2]
        tensor = preprocess_fn(crop)
        probs = model.predict(tensor, verbose=0)[0]
        pred_class = class_names[int(np.argmax(probs))]
        acne_prob = sum(
            probs[class_names.index(c)] for c in acne_classes if c in class_names
        )
        zr.affected = pred_class in acne_classes
        zr.confidence = float(acne_prob)

    return zone_results
