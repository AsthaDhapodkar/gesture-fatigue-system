// ─────────────────────────────────────────────
// GESTURE ENGINE — Real MediaPipe Implementation
//
// This is the ONLY component that:
//  • Accesses the camera (navigator.mediaDevices)
//  • Uses MediaPipe (via CDN globals — NOT npm imports)
//  • Writes gesture state (via updateGesture)
//
// MediaPipe is loaded via <script> tags in index.html BEFORE React mounts.
// This means window.Hands and window.Camera are always available here.
//
// We intentionally do NOT use dynamic import("@mediapipe/hands") because
// Vite's static analyzer tries to resolve that path at build time and
// fails since @mediapipe/* is excluded from bundling (CDN-only strategy).
//
// Flow:
//  1. gesture.enabled = true (set by LoginPage after camera permission)
//     → read window.Hands + window.Camera (set by index.html CDN scripts)
//     → initialize MediaPipe → process frames → updateGesture()
//
//  2. gesture.enabled = false (camera denied / not yet granted)
//     → mouse fallback: move = palm, click = pinch
// ─────────────────────────────────────────────
import { useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import {
  detectPinch,
  detectFist,
  detectPalmOpen,
  detectSwipe,
  getPalmPosition,
} from "./gestureDetection";
import { GestureConfig } from "./gestureConfig";

function GestureEngine({ debug = false }) {
  const { gesture, updateGesture } = useApp();

  // ── MediaPipe refs (never React state — no re-renders needed) ─────
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const handsRef  = useRef(null);
  const cameraRef = useRef(null);

  // ── Cursor smoothing ───────────────────────────────────────────────
  const smoothPosRef = useRef({ x: 0.5, y: 0.5 });

  // ── Rising-edge pinch tracking ─────────────────────────────────────
  // We emit pinch=true for EXACTLY ONE frame per pinch gesture.
  const prevPinchRef = useRef(false);

  // ── Swipe: palm X history + cooldown ──────────────────────────────
  const palmXHistoryRef  = useRef([]);
  const swipeCooldownRef = useRef(0);

  // ── Mouse fallback: prevent repeated pinch on hold ─────────────────
  const mouseDownRef = useRef(false);

  // ─────────────────────────────────────────────
  // onResults — called by MediaPipe every frame
  // ─────────────────────────────────────────────
  const onResults = useCallback((results) => {
    // No hand detected → reset to idle
    if (!results.multiHandLandmarks?.length) {
      updateGesture({ mode: "idle", pinch: false, fist: false, swipe: null });
      prevPinchRef.current    = false;
      palmXHistoryRef.current = [];
      return;
    }

    const landmarks = results.multiHandLandmarks[0];

    // ── 1. Smoothed cursor position ──────────────────────────────────
    const rawPos = getPalmPosition(landmarks); // normalized, X mirrored
    const prev   = smoothPosRef.current;
    const α      = GestureConfig.CURSOR_LERP;
    const smoothed = {
      x: prev.x + α * (rawPos.x - prev.x),
      y: prev.y + α * (rawPos.y - prev.y),
    };
    smoothPosRef.current = smoothed;

    // ── 2. Gesture classification ────────────────────────────────────
    const isPinching = detectPinch(landmarks);
    const isFist     = detectFist(landmarks);
    const isPalmOpen = detectPalmOpen(landmarks);

    // ── 3. Mode ──────────────────────────────────────────────────────
    const mode = isFist ? "grab" : isPalmOpen ? "palm" : "idle";

    // ── 4. Rising-edge pinch ─────────────────────────────────────────
    // Emit pinch=true for EXACTLY ONE frame per pinch gesture.
    const pinchRisingEdge = isPinching && !prevPinchRef.current;
    prevPinchRef.current  = isPinching;

    // ── 5. Swipe detection ───────────────────────────────────────────
    palmXHistoryRef.current.push(rawPos.x);
    if (palmXHistoryRef.current.length > GestureConfig.SWIPE_HISTORY_FRAMES + 2) {
      palmXHistoryRef.current.shift();
    }

    let swipe = null;
    if (swipeCooldownRef.current > 0) {
      swipeCooldownRef.current--;
    } else {
      swipe = detectSwipe(palmXHistoryRef.current);
      if (swipe) {
        swipeCooldownRef.current  = GestureConfig.SWIPE_COOLDOWN_FRAMES;
        palmXHistoryRef.current   = [];
      }
    }

    // ── 6. Push to global state ──────────────────────────────────────
    updateGesture({
      position: smoothed,
      mode,
      pinch: pinchRisingEdge,  // true for ONE frame only
      fist:  isFist,
      swipe,                    // null or "left"/"right" for ONE frame
    });

    // ── 7. Optional debug canvas ─────────────────────────────────────
    if (debug && canvasRef.current && results.image) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width  = results.image.width;
      canvasRef.current.height = results.image.height;
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-results.image.width, 0);
      ctx.drawImage(results.image, 0, 0);
      ctx.restore();
      // window.drawConnectors / window.HAND_CONNECTIONS set by CDN drawing_utils
      if (window.drawConnectors && window.HAND_CONNECTIONS) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: "#9b6dff", lineWidth: 2 });
        window.drawLandmarks(ctx, landmarks, { color: "#f76a6a", lineWidth: 1, radius: 3 });
      }
    }
  }, [updateGesture, debug]);

  // ─────────────────────────────────────────────
  // initMediaPipe
  // Reads window.Hands + window.Camera globals set by CDN scripts in
  // index.html. No dynamic import() — Vite cannot statically resolve
  // @mediapipe/* since it is excluded from bundling.
  // ─────────────────────────────────────────────
  const initMediaPipe = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      // ── CDN globals set by index.html <script> tags ───────────────
      // @mediapipe/hands CDN script      → window.Hands
      // @mediapipe/camera_utils CDN script → window.Camera
      const HandsClass  = window.Hands;
      const CameraClass = window.Camera;

      if (!HandsClass || !CameraClass) {
        console.warn(
          "[GestureEngine] window.Hands or window.Camera not found.\n" +
          "Check that the MediaPipe <script> tags in index.html loaded.\n" +
          "Continuing with mouse fallback."
        );
        return;
      }

      // ── Configure MediaPipe Hands ─────────────────────────────────
      const hands = new HandsClass({
        // locateFile: tells MediaPipe where to fetch .wasm + .data files
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
      });

      hands.setOptions({
        maxNumHands:            1,
        modelComplexity:        1,
        minDetectionConfidence: GestureConfig.MIN_DETECTION_CONFIDENCE,
        minTrackingConfidence:  GestureConfig.MIN_TRACKING_CONFIDENCE,
      });

      hands.onResults(onResults);
      handsRef.current = hands;

      // ── Start camera ──────────────────────────────────────────────
      const camera = new CameraClass(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width:  640,
        height: 480,
      });

      cameraRef.current = camera;
      await camera.start();

    } catch (err) {
      console.error("[GestureEngine] MediaPipe init failed:", err);
      // App continues — mouse fallback useEffect handles interaction
    }
  }, [onResults]);

  // ─────────────────────────────────────────────
  // Effect: boot MediaPipe when gesture.enabled becomes true
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!gesture?.enabled) return;

    initMediaPipe();

    return () => {
      cameraRef.current?.stop();
      handsRef.current?.close();
      cameraRef.current = null;
      handsRef.current  = null;
    };
  }, [gesture?.enabled, initMediaPipe]);

  // ─────────────────────────────────────────────
  // Mouse fallback — active only when gesture.enabled is false.
  // Keeps the app fully usable with mouse when camera is unavailable.
  //
  //  mousemove → palm position (normalized 0–1)
  //  mousedown → pinch rising edge (true for ~60ms then resets)
  //  mouseup   → release
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (gesture?.enabled) return; // MediaPipe is active — skip fallback

    const onMove = (e) => {
      const position = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
      updateGesture({ position, mode: "palm", x: e.clientX, y: e.clientY });
    };

    const onDown = () => {
      if (mouseDownRef.current) return; // prevent hold-to-spam
      mouseDownRef.current = true;
      updateGesture({ pinch: true });
      setTimeout(() => updateGesture({ pinch: false }), 60);
    };

    const onUp = () => {
      mouseDownRef.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [gesture?.enabled, updateGesture]);

  // ─────────────────────────────────────────────
  // Render: hidden video + optional debug overlay
  // ─────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed",
      bottom: debug ? 16  : -9999,
      right:  debug ? 16  : -9999,
      width:  debug ? 240 : 1,
      height: debug ? 180 : 1,
      zIndex: 9998,
      borderRadius: debug ? 10 : 0,
      overflow: "hidden",
      border: debug ? "1px solid rgba(124,58,237,0.4)" : "none",
      background: "#000",
    }}>
      {/* Hidden video — MediaPipe reads frames from this */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        autoPlay
        playsInline
        muted
      />
      {/* Debug canvas — mirrored webcam with landmark overlays */}
      {debug && (
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}
        />
      )}
      {debug && (
        <div style={{
          position: "absolute", bottom: 4, left: 0, right: 0,
          textAlign: "center",
          fontFamily: "var(--mono)",
          fontSize: 9, letterSpacing: "0.1em",
          color: "rgba(124,58,237,0.7)",
        }}>
          GESTURE DEBUG · {gesture?.mode?.toUpperCase() ?? "IDLE"}
        </div>
      )}
    </div>
  );
}

export default GestureEngine;