/**
 * gestureConfig.js
 * Central configuration for all gesture detection thresholds.
 * Tune these values to adjust gesture sensitivity.
 */

export const GestureConfig = {
  // --- PINCH ---
  // Distance (normalized 0-1) between thumb tip (4) and index tip (8)
  // below which a pinch is detected
  PINCH_THRESHOLD: 0.06,

  // --- FIST ---
  // Max distance from fingertip to palm center for a finger to be considered "closed"
  FIST_FINGER_THRESHOLD: 0.12,
  // Number of fingers that must be closed to count as a fist
  FIST_FINGER_COUNT: 4,

  // --- PALM OPEN ---
  // Min distance from fingertip to palm center for a finger to be considered "extended"
  PALM_FINGER_THRESHOLD: 0.15,
  // Number of fingers that must be extended
  PALM_FINGER_COUNT: 4,

  // --- SWIPE ---
  // Minimum X velocity (normalized units per frame) to trigger swipe
  SWIPE_VELOCITY_THRESHOLD: 0.04,
  // Number of frames to track for velocity calculation
  SWIPE_HISTORY_FRAMES: 8,
  // Cooldown frames after a swipe is detected before another can fire
  SWIPE_COOLDOWN_FRAMES: 20,

  // --- CURSOR SMOOTHING ---
  // Lerp factor for cursor movement (0 = no movement, 1 = instant)
  CURSOR_LERP: 0.25,

  // --- MEDIAPIPE ---
  // Minimum detection confidence
  MIN_DETECTION_CONFIDENCE: 0.7,
  // Minimum tracking confidence
  MIN_TRACKING_CONFIDENCE: 0.5,
};