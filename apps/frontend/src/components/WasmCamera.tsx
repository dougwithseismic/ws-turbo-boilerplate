"use client";
import React, { useRef, useEffect, useState } from "react";
import {
  initializeWasm,
  applyGrayscale,
  applySobelEdgeDetection,
  applyHueRotation,
  applySpiralDistortion,
  applyWormholeDistortion,
  applyBrightnessContrast,
  applyGammaCorrection,
} from "@zer0/wasm-camera-fx";

type EffectType =
  | "none"
  | "grayscale"
  | "sobel"
  | "hue"
  | "spiral"
  | "wormhole"
  | "brightnessContrast"
  | "gamma";

const WasmCamera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWasmReady, setIsWasmReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEffect, setCurrentEffect] = useState<EffectType>("none");
  const animationFrameId = useRef<number | null>(null);
  const hueAngle = useRef<number>(0);
  const spiralFactor = useRef<number>(0);
  const spiralDirection = useRef<number>(1);
  const wormholeFactor = useRef<number>(0);
  const wormholeDirection = useRef<number>(1);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [gamma, setGamma] = useState<number>(1);

  // Initialize camera and trigger WASM loading
  useEffect(() => {
    let stream: MediaStream | null = null;
    let didUnmount = false;

    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch((err: unknown) => {
            console.error("Error playing video:", err);
            if (!didUnmount) setError("Could not play video stream.");
          });
          console.log("Video playing");
        }
        // Initialize WASM
        initializeWasm()
          .then(() => {
            if (!didUnmount) setIsWasmReady(true);
          })
          .catch((err: unknown) => {
            console.error("WASM Initialization failed:", err);
            if (!didUnmount) {
              setError("Failed to initialize WASM module.");
              setIsWasmReady(false);
            }
          });
      } catch (err: unknown) {
        console.error("Error accessing camera:", err);
        if (!didUnmount) {
          setError(
            "Could not access camera. Please ensure permissions are granted.",
          );
        }
      }
    };

    setupCamera();

    return () => {
      didUnmount = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Effect for continuous processing loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Stop loop if dependencies aren't ready
    if (!video || !canvas || !isWasmReady) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      setError("Could not get canvas context.");
      return;
    }

    const isProcessingFrame = false;

    const loop = async () => {
      // Ensure loop stops if component is unmounted or video stops
      if (
        !videoRef.current ||
        !canvasRef.current ||
        video.paused ||
        video.ended
      ) {
        if (animationFrameId.current)
          cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        return;
      }

      // Prevent concurrent processing if an effect takes too long
      // if (isProcessingFrame) { // Temporarily removed for smoother slider updates
      //   animationFrameId.current = requestAnimationFrame(loop);
      //   return;
      // }

      // isProcessingFrame = true; // Temporarily removed

      // Ensure canvas size matches video
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);
      }

      // Draw current video frame onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply effect ONLY if not 'none'
      if (currentEffect !== "none") {
        try {
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );

          // Apply the selected effect
          switch (currentEffect) {
            case "grayscale":
              await applyGrayscale(imageData);
              break;
            case "sobel":
              await applySobelEdgeDetection(imageData);
              break;
            case "hue":
              hueAngle.current = (hueAngle.current + 1) % 360; // Cycle angle
              await applyHueRotation(imageData, hueAngle.current);
              break;
            case "spiral":
              spiralFactor.current += spiralDirection.current * 0.1;
              if (spiralFactor.current > 10 || spiralFactor.current < -10) {
                spiralDirection.current *= -1;
                spiralFactor.current += spiralDirection.current * 0.1;
              }
              await applySpiralDistortion(imageData, spiralFactor.current);
              break;
            case "wormhole":
              wormholeFactor.current += wormholeDirection.current * 0.01;
              if (wormholeFactor.current > 0.9 || wormholeFactor.current < 0) {
                wormholeDirection.current *= -1;
                wormholeFactor.current += wormholeDirection.current * 0.01;
              }
              await applyWormholeDistortion(imageData, wormholeFactor.current);
              break;
            case "brightnessContrast":
              await applyBrightnessContrast(imageData, brightness, contrast);
              break;
            case "gamma":
              await applyGammaCorrection(imageData, gamma);
              break;
          }

          // Put the modified data back onto the canvas
          context.putImageData(imageData, 0, 0);
        } catch (err: unknown) {
          console.error(`Error applying ${currentEffect} effect in loop:`, err);
          setError(
            `Processing error: ${err instanceof Error ? err.message : String(err)}`,
          );
          // Stop the loop on error by not requesting the next frame
          // isProcessingFrame = false; // Temporarily removed
          return; // Exit loop
        }
      }
      // If effect is 'none', the canvas already has the original frame drawn.

      // isProcessingFrame = false; // Temporarily removed
      animationFrameId.current = requestAnimationFrame(loop);
    };

    // Start the loop
    animationFrameId.current = requestAnimationFrame(loop);

    // Cleanup function for this effect
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isWasmReady, currentEffect, brightness, contrast, gamma]); // Re-run loop setup if WASM ready or effect changes

  return (
    <div>
      <h2>WASM Camera Effects</h2>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div>
          <h3>Original Video</h3>
          <video
            ref={videoRef}
            style={{
              width: "320px",
              height: "240px",
              border: "1px solid black",
            }}
            playsInline
            muted
          />
        </div>
        <div>
          <h3>Processed Canvas</h3>
          <canvas
            ref={canvasRef}
            style={{
              width: "320px",
              height: "240px",
              border: "1px solid black",
            }}
          />
        </div>
      </div>
      <div style={{ marginTop: "10px" }}>
        Select Effect:{" "}
        <button
          onClick={() => setCurrentEffect("none")}
          disabled={!isWasmReady || currentEffect === "none"}
        >
          Original
        </button>{" "}
        <button
          onClick={() => setCurrentEffect("grayscale")}
          disabled={!isWasmReady || currentEffect === "grayscale"}
        >
          Grayscale
        </button>{" "}
        <button
          onClick={() => setCurrentEffect("sobel")}
          disabled={!isWasmReady || currentEffect === "sobel"}
        >
          Edge Detect
        </button>{" "}
        <button
          onClick={() => setCurrentEffect("hue")}
          disabled={!isWasmReady || currentEffect === "hue"}
        >
          Psychedelic Hue
        </button>{" "}
        <button
          onClick={() => setCurrentEffect("spiral")}
          disabled={!isWasmReady || currentEffect === "spiral"}
        >
          Spiral
        </button>{" "}
        <button
          onClick={() => setCurrentEffect("wormhole")}
          disabled={!isWasmReady || currentEffect === "wormhole"}
        >
          Wormhole
        </button>{" "}
        <button
          onClick={() => setCurrentEffect("brightnessContrast")}
          disabled={!isWasmReady || currentEffect === "brightnessContrast"}
        >
          Brightness/Contrast
        </button>{" "}
        <button
          onClick={() => setCurrentEffect("gamma")}
          disabled={!isWasmReady || currentEffect === "gamma"}
        >
          Gamma
        </button>
      </div>
      {currentEffect === "brightnessContrast" && (
        <div style={{ marginTop: "10px" }}>
          <label>
            Brightness ({brightness.toFixed(2)}):
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
              disabled={!isWasmReady}
            />
          </label>
          <br />
          <label>
            Contrast ({contrast.toFixed(2)}):
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
              disabled={!isWasmReady}
            />
          </label>
        </div>
      )}
      {currentEffect === "gamma" && (
        <div style={{ marginTop: "10px" }}>
          <label>
            Gamma ({gamma.toFixed(2)}):
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={gamma}
              onChange={(e) => setGamma(parseFloat(e.target.value))}
              disabled={!isWasmReady}
            />
          </label>
        </div>
      )}
      {!isWasmReady && !error && <p>Loading WASM module...</p>}
      {isWasmReady && <p>WASM module ready. Current effect: {currentEffect}</p>}
    </div>
  );
};

export default WasmCamera;
