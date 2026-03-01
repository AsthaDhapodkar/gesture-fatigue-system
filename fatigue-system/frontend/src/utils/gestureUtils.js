/**
 * Gesture Detection Utilities
 * Uses MediaPipe Hands for hand landmark detection
 */

// Calculate Euclidean distance between two points
export const calculateDistance = (point1, point2) => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = (point1.z || 0) - (point2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Calculate palm center from hand landmarks
export const getPalmCenter = (landmarks) => {
  // Average of key palm landmarks (wrist, base of fingers)
  const palmIndices = [0, 1, 5, 9, 13, 17]; // Wrist and finger bases
  
  let x = 0, y = 0, z = 0;
  palmIndices.forEach(idx => {
    x += landmarks[idx].x;
    y += landmarks[idx].y;
    z += landmarks[idx].z || 0;
  });
  
  return {
    x: x / palmIndices.length,
    y: y / palmIndices.length,
    z: z / palmIndices.length,
  };
};

// Detect pinch gesture (thumb tip close to index finger tip)
export const detectPinch = (landmarks, threshold = 0.08) => {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const distance = calculateDistance(thumbTip, indexTip);
  return distance < threshold;
};

// Detect fist gesture (all fingers folded)
export const detectFist = (landmarks) => {
  // Check if fingertips are close to palm
  const palmCenter = getPalmCenter(landmarks);
  const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips
  
  let foldedFingers = 0;
  fingerTips.forEach(tipIdx => {
    const distance = calculateDistance(landmarks[tipIdx], palmCenter);
    if (distance < 0.18) {
      foldedFingers++;
    }
  });
  
  return foldedFingers >= 4; // At least 4 fingers folded
};

// Detect open palm (all fingers extended)
export const detectOpenPalm = (landmarks) => {
  const palmCenter = getPalmCenter(landmarks);
  const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips (exclude thumb)
  
  let extendedFingers = 0;
  fingerTips.forEach(tipIdx => {
    const distance = calculateDistance(landmarks[tipIdx], palmCenter);
    if (distance > 0.12) {
      extendedFingers++;
    }
  });
  
  return extendedFingers >= 3; // At least 3 fingers extended
};

// Detect swipe gesture based on velocity
export const detectSwipe = (currentPos, previousPos, timeElapsed, threshold = 0.015) => {
  if (!previousPos || timeElapsed === 0) return null;
  
  const dx = currentPos.x - previousPos.x;
  const dy = currentPos.y - previousPos.y;
  const velocityX = dx / timeElapsed;
  const velocityY = dy / timeElapsed;
  
  // Determine swipe direction
  if (Math.abs(velocityX) > threshold && Math.abs(velocityX) > Math.abs(velocityY)) {
    return velocityX > 0 ? 'right' : 'left';
  } else if (Math.abs(velocityY) > threshold && Math.abs(velocityY) > Math.abs(velocityX)) {
    return velocityY > 0 ? 'down' : 'up';
  }
  
  return null;
};

// Moving average filter for smoothing
export class MovingAverage {
  constructor(windowSize = 5) {
    this.windowSize = windowSize;
    this.values = [];
  }
  
  add(value) {
    this.values.push(value);
    if (this.values.length > this.windowSize) {
      this.values.shift();
    }
  }
  
  get() {
    if (this.values.length === 0) return null;
    return this.values.reduce((sum, v) => sum + v, 0) / this.values.length;
  }
  
  reset() {
    this.values = [];
  }
}

// Position smoother for reducing jitter
export class PositionSmoother {
  constructor(windowSize = 3) {
    this.xFilter = new MovingAverage(windowSize);
    this.yFilter = new MovingAverage(windowSize);
  }
  
  smooth(position) {
    this.xFilter.add(position.x);
    this.yFilter.add(position.y);
    
    return {
      x: this.xFilter.get() || position.x,
      y: this.yFilter.get() || position.y,
    };
  }
  
  reset() {
    this.xFilter.reset();
    this.yFilter.reset();
  }
}

// Gesture cooldown timer to prevent rapid firing
export class GestureCooldown {
  constructor(cooldownMs = 500) {
    this.cooldownMs = cooldownMs;
    this.lastGestureTime = {};
  }
  
  canFire(gestureName) {
    const now = Date.now();
    const lastTime = this.lastGestureTime[gestureName] || 0;
    return (now - lastTime) >= this.cooldownMs;
  }
  
  fire(gestureName) {
    this.lastGestureTime[gestureName] = Date.now();
  }
  
  reset() {
    this.lastGestureTime = {};
  }
}

// Calculate landmark jitter (variance)
export const calculateJitter = (landmarks, previousLandmarks) => {
  if (!previousLandmarks) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < landmarks.length; i++) {
    totalDistance += calculateDistance(landmarks[i], previousLandmarks[i]);
  }
  
  return totalDistance / landmarks.length;
};

// Calculate hand speed
export const calculateHandSpeed = (palmCenter, previousPalmCenter, timeElapsed) => {
  if (!previousPalmCenter || timeElapsed === 0) return 0;
  
  const distance = calculateDistance(palmCenter, previousPalmCenter);
  return distance / timeElapsed;
};

export default {
  calculateDistance,
  getPalmCenter,
  detectPinch,
  detectFist,
  detectOpenPalm,
  detectSwipe,
  MovingAverage,
  PositionSmoother,
  GestureCooldown,
  calculateJitter,
  calculateHandSpeed,
};
