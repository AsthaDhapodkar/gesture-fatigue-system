/**
 * gestureDetection.js
 * Pure functions for detecting gestures from MediaPipe 21-landmark arrays.
 *
 * MediaPipe Hand Landmark indices:
 *   0  = WRIST
 *   1-4  = THUMB  (1=CMC, 2=MCP, 3=IP, 4=TIP)
 *   5-8  = INDEX  (5=MCP, 6=PIP, 7=DIP, 8=TIP)
 *   9-12 = MIDDLE (9=MCP, 10=PIP, 11=DIP, 12=TIP)
 *  13-16 = RING   (13=MCP, 14=PIP, 15=DIP, 16=TIP)
 *  17-20 = PINKY  (17=MCP, 18=PIP, 19=DIP, 20=TIP)
 *
 * All landmarks are {x, y, z} normalized to [0,1] relative to image size.
 */

import { GestureConfig } from "./gestureConfig";

// ─────────────────────────────────────────────
// Utility: Euclidean distance between two landmarks
// ─────────────────────────────────────────────
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ─────────────────────────────────────────────
// Utility: Palm center approximated as midpoint
// of WRIST (0) and MIDDLE_MCP (9)
// ─────────────────────────────────────────────
function getPalmCenter(landmarks) {
  const wrist = landmarks[0];
  const middleMCP = landmarks[9];
  return {
    x: (wrist.x + middleMCP.x) / 2,
    y: (wrist.y + middleMCP.y) / 2,
  };
}

// ─────────────────────────────────────────────
// PINCH DETECTION
// Rule: Distance between THUMB_TIP (4) and INDEX_TIP (8) < threshold
// ─────────────────────────────────────────────
export function detectPinch(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const distance = dist(thumbTip, indexTip);

  return distance < GestureConfig.PINCH_THRESHOLD;
}

// ─────────────────────────────────────────────
// FIST DETECTION
// Rule: For each of the 4 fingers (index, middle, ring, pinky),
// the fingertip must be CLOSE to the palm center.
// Also the tip Y should be LOWER (higher value) than its PIP joint.
// ─────────────────────────────────────────────
export function detectFist(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  const palmCenter = getPalmCenter(landmarks);

  // [tip_idx, pip_idx] for index, middle, ring, pinky
  const fingers = [
    [8, 6],   // index:  tip=8, pip=6
    [12, 10], // middle: tip=12, pip=10
    [16, 14], // ring:   tip=16, pip=14
    [20, 18], // pinky:  tip=20, pip=18
  ];

  let closedCount = 0;

  for (const [tipIdx, pipIdx] of fingers) {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];

    // Fingertip close to palm center (curled in)
    const distToCenter = dist(tip, palmCenter);
    // Fingertip Y greater than PIP Y means tip is below PIP (curled down)
    const isCurledDown = tip.y > pip.y;

    if (distToCenter < GestureConfig.FIST_FINGER_THRESHOLD && isCurledDown) {
      closedCount++;
    }
  }

  return closedCount >= GestureConfig.FIST_FINGER_COUNT;
}

// ─────────────────────────────────────────────
// PALM OPEN DETECTION
// Rule: All 4 fingers have their tips FAR from palm center (extended).
// ─────────────────────────────────────────────
export function detectPalmOpen(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  const palmCenter = getPalmCenter(landmarks);

  // tip indices for index, middle, ring, pinky
  const fingerTips = [8, 12, 16, 20];

  let extendedCount = 0;

  for (const tipIdx of fingerTips) {
    const tip = landmarks[tipIdx];
    const distToCenter = dist(tip, palmCenter);

    if (distToCenter > GestureConfig.PALM_FINGER_THRESHOLD) {
      extendedCount++;
    }
  }

  return extendedCount >= GestureConfig.PALM_FINGER_COUNT;
}

// ─────────────────────────────────────────────
// SWIPE DETECTION
// Rule: Track palm X position over recent frames.
// Compute average velocity; if it exceeds threshold, emit swipe direction.
//
// @param history  - array of recent palm X positions (oldest first)
// @returns "left" | "right" | null
// ─────────────────────────────────────────────
export function detectSwipe(history) {
  if (!history || history.length < GestureConfig.SWIPE_HISTORY_FRAMES) {
    return null;
  }

  // Use the last N frames
  const recent = history.slice(-GestureConfig.SWIPE_HISTORY_FRAMES);
  // Velocity = total displacement divided by frame count
  const displacement = recent[recent.length - 1] - recent[0];
  const velocity = displacement / GestureConfig.SWIPE_HISTORY_FRAMES;

  if (velocity > GestureConfig.SWIPE_VELOCITY_THRESHOLD) {
    return "right";
  } else if (velocity < -GestureConfig.SWIPE_VELOCITY_THRESHOLD) {
    return "left";
  }

  return null;
}

// ─────────────────────────────────────────────
// Get normalized palm position (X, Y as 0-1)
// Uses wrist landmark (0) as a stable anchor
// ─────────────────────────────────────────────
export function getPalmPosition(landmarks) {
  if (!landmarks || landmarks.length < 1) return { x: 0.5, y: 0.5 };
  // Use wrist (0) for stability; mirror X since webcam is mirrored
  return {
    x: 1 - landmarks[0].x, // mirror horizontally
    y: landmarks[0].y,
  };
}