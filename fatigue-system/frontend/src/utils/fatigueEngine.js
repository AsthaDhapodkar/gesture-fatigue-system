/**
 * Fatigue Detection Engine
 * Monitors user interaction patterns to detect fatigue levels
 */

export class FatigueEngine {
  constructor() {
    // Configuration
    this.windowSize = 30; // Number of samples to consider
    this.updateInterval = 2000; // Update every 2 seconds
    
    // Metrics storage
    this.speedHistory = [];
    this.jitterHistory = [];
    this.failedGestures = [];
    this.hoverTimes = [];
    
    // Current state
    this.fatigueScore = 0;
    this.fatigueLevel = 'low';
    this.mode = 'automatic'; // 'automatic' or 'manual'
    this.manualLevel = null;
    
    // Timing
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Record hand speed sample
   */
  recordSpeed(speed) {
    this.speedHistory.push(speed);
    if (this.speedHistory.length > this.windowSize) {
      this.speedHistory.shift();
    }
  }
  
  /**
   * Record jitter sample
   */
  recordJitter(jitter) {
    this.jitterHistory.push(jitter);
    if (this.jitterHistory.length > this.windowSize) {
      this.jitterHistory.shift();
    }
  }
  
  /**
   * Record failed gesture
   */
  recordFailedGesture(timestamp = Date.now()) {
    this.failedGestures.push(timestamp);
    // Keep only recent failures (last 30 seconds)
    this.failedGestures = this.failedGestures.filter(
      time => timestamp - time < 30000
    );
  }
  
  /**
   * Record hover stabilization time
   */
  recordHoverTime(milliseconds) {
    this.hoverTimes.push(milliseconds);
    if (this.hoverTimes.length > this.windowSize) {
      this.hoverTimes.shift();
    }
  }
  
  /**
   * Calculate average from array
   */
  _average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
  
  /**
   * Calculate variance from array
   */
  _variance(arr) {
    if (arr.length === 0) return 0;
    const avg = this._average(arr);
    const squaredDiffs = arr.map(val => Math.pow(val - avg, 2));
    return this._average(squaredDiffs);
  }
  
  /**
   * Update fatigue score based on collected metrics
   */
  update() {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return; // Don't update too frequently
    }
    
    this.lastUpdateTime = now;
    
    // If in manual mode, don't recalculate
    if (this.mode === 'manual') {
      return;
    }
    
    // Calculate component scores (0-100 each)
    
    // 1. Speed degradation (slower movement over time)
    const avgSpeed = this._average(this.speedHistory);
    const speedScore = Math.max(0, (0.05 - avgSpeed) / 0.05 * 100);
    
    // 2. Jitter increase (less stable hand)
    const jitterVariance = this._variance(this.jitterHistory);
    const jitterScore = Math.min(100, jitterVariance * 10000);
    
    // 3. Failed gestures (more errors)
    const recentFailures = this.failedGestures.length;
    const failureScore = Math.min(100, recentFailures * 10);
    
    // 4. Hover time increase (takes longer to stabilize)
    const avgHoverTime = this._average(this.hoverTimes);
    const hoverScore = Math.min(100, (avgHoverTime - 300) / 10);
    
    // Weighted combination
    const weights = {
      speed: 0.3,
      jitter: 0.25,
      failures: 0.25,
      hover: 0.2,
    };
    
    this.fatigueScore = Math.round(
      speedScore * weights.speed +
      jitterScore * weights.jitter +
      failureScore * weights.failures +
      hoverScore * weights.hover
    );
    
    // Clamp to 0-100
    this.fatigueScore = Math.max(0, Math.min(100, this.fatigueScore));
    
    // Classify fatigue level
    if (this.fatigueScore < 30) {
      this.fatigueLevel = 'low';
    } else if (this.fatigueScore < 60) {
      this.fatigueLevel = 'medium';
    } else {
      this.fatigueLevel = 'high';
    }
  }
  
  /**
   * Get current fatigue state
   */
  getState() {
    return {
      score: this.fatigueScore,
      level: this.mode === 'manual' && this.manualLevel ? this.manualLevel : this.fatigueLevel,
      mode: this.mode,
    };
  }
  
  /**
   * Set manual fatigue level
   */
  setManualLevel(level) {
    this.mode = 'manual';
    this.manualLevel = level;
  }
  
  /**
   * Switch to automatic mode
   */
  setAutomaticMode() {
    this.mode = 'automatic';
    this.manualLevel = null;
  }
  
  /**
   * Get adaptive UI parameters based on fatigue level
   */
  getAdaptiveParams() {
    const level = this.mode === 'manual' && this.manualLevel ? this.manualLevel : this.fatigueLevel;
    
    const params = {
      low: {
        buttonSizeMultiplier: 1.0,
        hoverDelayMs: 400,
        jitterTolerance: 0.02,
        swipeThreshold: 0.015,
        snapDistance: 30,
      },
      medium: {
        buttonSizeMultiplier: 1.2,
        hoverDelayMs: 300,
        jitterTolerance: 0.04,
        swipeThreshold: 0.012,
        snapDistance: 50,
      },
      high: {
        buttonSizeMultiplier: 1.5,
        hoverDelayMs: 200,
        jitterTolerance: 0.06,
        swipeThreshold: 0.010,
        snapDistance: 80,
      },
    };
    
    return params[level] || params.low;
  }
  
  /**
   * Reset all metrics
   */
  reset() {
    this.speedHistory = [];
    this.jitterHistory = [];
    this.failedGestures = [];
    this.hoverTimes = [];
    this.fatigueScore = 0;
    this.fatigueLevel = 'low';
  }
}

export default FatigueEngine;
