// Placeholder for WASM Camera Effects module

import ModuleFactory from "../wasm/effects.js";

// Define the structure Emscripten generates for our module
interface EmscriptenModule {
  _malloc(size: number): number; // Returns a pointer (number)
  _free(ptr: number): void;
  HEAPU8: Uint8Array; // Direct access to the WASM memory as bytes
  cwrap: (
    ident: string,
    returnType: string | null,
    argTypes: string[],
  ) => (...args: any[]) => any;
  // Add our exported C++ function signatures (use number for pointers)
  _grayscale(imageDataPtr: number, width: number, height: number): void; // In-place
  _sobelEdgeDetection(
    inputPtr: number,
    outputPtr: number,
    width: number,
    height: number,
  ): void; // Input/Output
  _hueRotate(
    imageDataPtr: number,
    width: number,
    height: number,
    angle: number,
  ): void; // In-place
  _spiralDistortion(
    inputPtr: number,
    outputPtr: number,
    width: number,
    height: number,
    factor: number,
  ): void; // Input/Output
  _wormholeDistortion(
    inputPtr: number,
    outputPtr: number,
    width: number,
    height: number,
    pullFactor: number,
  ): void; // Input/Output
  _brightnessContrast(
    imageDataPtr: number,
    width: number,
    height: number,
    brightness: number,
    contrast: number,
  ): void; // In-place
  _gammaCorrection(
    imageDataPtr: number,
    width: number,
    height: number,
    gamma: number,
  ): void; // In-place
}

// Type for the wrapped grayscale function (In-place)
type GrayscaleFunc = (
  imageDataPtr: number,
  width: number,
  height: number,
) => void;

// Type for the wrapped Sobel function (Input/Output)
type SobelFunc = (
  inputPtr: number,
  outputPtr: number,
  width: number,
  height: number,
) => void;

// Type for the wrapped Hue Rotate function (In-place)
type HueRotateFunc = (
  imageDataPtr: number,
  width: number,
  height: number,
  angle: number,
) => void;

// Type for the wrapped Spiral Distortion function (Input/Output)
type SpiralDistortionFunc = (
  inputPtr: number,
  outputPtr: number,
  width: number,
  height: number,
  factor: number,
) => void;

// Type for the wrapped Wormhole Distortion function (Input/Output)
type WormholeDistortionFunc = (
  inputPtr: number,
  outputPtr: number,
  width: number,
  height: number,
  pullFactor: number,
) => void;

// Type for the wrapped Brightness/Contrast function (In-place)
type BrightnessContrastFunc = (
  imageDataPtr: number,
  width: number,
  height: number,
  brightness: number,
  contrast: number,
) => void;

// Type for the wrapped Gamma Correction function (In-place)
type GammaCorrectionFunc = (
  imageDataPtr: number,
  width: number,
  height: number,
  gamma: number,
) => void;

let moduleInstance: EmscriptenModule | null = null;
let wrappedGrayscale: GrayscaleFunc | null = null;
let wrappedSobel: SobelFunc | null = null;
let wrappedHueRotate: HueRotateFunc | null = null;
let wrappedSpiral: SpiralDistortionFunc | null = null;
let wrappedWormhole: WormholeDistortionFunc | null = null;
let wrappedBrightnessContrast: BrightnessContrastFunc | null = null;
let wrappedGamma: GammaCorrectionFunc | null = null;

// Asynchronously initialize the WASM module
export const initializeWasm = async (): Promise<void> => {
  if (moduleInstance) {
    return; // Already initialized
  }
  try {
    const factory = ModuleFactory as unknown as (
      options?: object,
    ) => Promise<EmscriptenModule>;
    moduleInstance = await factory({
      // Tell Emscripten where to find the .wasm file relative to the web server root
      locateFile: (path: string, scriptDirectory: string) => {
        // We expect the path to be 'effects.wasm'
        // We copied it to '/public/wasm/effects.wasm' which is served at '/wasm/effects.wasm'
        if (path.endsWith(".wasm")) {
          return "/wasm/effects.wasm";
        }
        // Fallback for other files (if any)
        return scriptDirectory + path;
      },
    });
    console.log("WASM module initialized.");

    // Wrap the C++ functions after the module is ready
    wrappedGrayscale = moduleInstance.cwrap("grayscale", null, [
      "number", // ptr
      "number", // width
      "number", // height
    ]) as GrayscaleFunc;

    wrappedSobel = moduleInstance.cwrap("sobelEdgeDetection", null, [
      "number", // inputPtr
      "number", // outputPtr
      "number", // width
      "number", // height
    ]) as SobelFunc;

    wrappedHueRotate = moduleInstance.cwrap("hueRotate", null, [
      "number", // ptr
      "number", // width
      "number", // height
      "number", // angle
    ]) as HueRotateFunc;

    wrappedSpiral = moduleInstance.cwrap("spiralDistortion", null, [
      "number", // inputPtr
      "number", // outputPtr
      "number", // width
      "number", // height
      "number", // factor
    ]) as SpiralDistortionFunc;

    wrappedWormhole = moduleInstance.cwrap("wormholeDistortion", null, [
      "number", // inputPtr
      "number", // outputPtr
      "number", // width
      "number", // height
      "number", // pullFactor
    ]) as WormholeDistortionFunc;

    // Check cwrap result directly
    const bcFunc = moduleInstance.cwrap("brightnessContrast", null, [
      "number",
      "number",
      "number",
      "number",
      "number",
    ]);
    console.log(
      "Direct cwrap result for _brightnessContrast:",
      typeof bcFunc,
      !!bcFunc,
    ); // New log
    wrappedBrightnessContrast = bcFunc as BrightnessContrastFunc;
    console.log(
      "Assigned wrappedBrightnessContrast:",
      typeof wrappedBrightnessContrast,
      !!wrappedBrightnessContrast,
    ); // New log

    const gammaFunc = moduleInstance.cwrap("gammaCorrection", null, [
      "number",
      "number",
      "number",
      "number",
    ]);
    console.log(
      "Direct cwrap result for _gammaCorrection:",
      typeof gammaFunc,
      !!gammaFunc,
    ); // New log
    wrappedGamma = gammaFunc as GammaCorrectionFunc;
    console.log("Assigned wrappedGamma:", typeof wrappedGamma, !!wrappedGamma); // New log

    console.log("WASM functions wrapped.");
  } catch (error) {
    console.error("Error initializing WASM module:", error);
    moduleInstance = null;
    wrappedGrayscale = null;
    wrappedSobel = null;
    wrappedHueRotate = null;
    wrappedSpiral = null;
    wrappedWormhole = null;
    wrappedBrightnessContrast = null;
    wrappedGamma = null;
    throw error; // Re-throw for upstream handling
  }
};

/**
 * Generic helper for applying WASM effects. Handles memory allocation/deallocation
 * and copying data between JS and WASM heap.
 * Distinguishes between in-place effects (1 ptr) and input/output effects (2 ptrs).
 */
const applyWasmEffect = async (
  imageData: ImageData,
  effectFunc: Function | null,
  // Function signature tells us if it's in-place or requires output buffer
  effectSignature: "in-place" | "input-output",
  ...args: any[] // Additional args for the effect function
): Promise<void> => {
  await initializeWasm(); // Ensure module is ready

  const funcType = typeof effectFunc;
  const funcName = effectFunc?.name || "N/A";
  console.log(
    `applyWasmEffect - Module ready: ${!!moduleInstance}, Effect func type: ${funcType}, name: ${funcName}, available: ${!!effectFunc}`,
  );

  if (!moduleInstance || funcType !== "function") {
    console.error("Problem detected in applyWasmEffect:", {
      moduleInstanceExists: !!moduleInstance,
      effectFuncExists: !!effectFunc,
      effectFuncType: funcType,
    });
    throw new Error(
      `WASM module not initialized or the specific effect function is not available/not a function. Type was: ${funcType}`,
    );
  }

  const { data, width, height } = imageData;
  const numBytes = data.length;
  let inputPtr: number | null = null;
  let outputPtr: number | null = null;

  try {
    // Allocate input buffer
    inputPtr = moduleInstance._malloc(numBytes);
    if (inputPtr === 0)
      throw new Error("Failed to allocate input memory in WASM.");
    moduleInstance.HEAPU8.set(data, inputPtr); // Copy input data to WASM heap

    if (effectSignature === "input-output") {
      // Allocate output buffer for effects that need it
      outputPtr = moduleInstance._malloc(numBytes);
      if (outputPtr === 0)
        throw new Error("Failed to allocate output memory in WASM.");
      // Call function with input and output pointers
      effectFunc?.(inputPtr, outputPtr, width, height, ...args);
      // Copy result from WASM output buffer back to JS ImageData
      const resultView = moduleInstance.HEAPU8.slice(
        outputPtr,
        outputPtr + numBytes,
      );
      data.set(resultView);
    } else {
      // For in-place effects, call with the single (input) pointer
      effectFunc?.(inputPtr, width, height, ...args);
      // Copy potentially modified data from WASM input buffer back to JS ImageData
      const resultView = moduleInstance.HEAPU8.slice(
        inputPtr,
        inputPtr + numBytes,
      );
      data.set(resultView);
    }
  } catch (error) {
    console.error(`Error applying WASM effect (${funcName}):`, error);
    throw error; // Re-throw error
  } finally {
    // Free memory
    if (inputPtr !== null && moduleInstance) moduleInstance._free(inputPtr);
    if (outputPtr !== null && moduleInstance) moduleInstance._free(outputPtr);
  }
};

/** Applies grayscale effect (in-place) */
export const applyGrayscale = async (imageData: ImageData): Promise<void> => {
  await applyWasmEffect(imageData, wrappedGrayscale, "in-place");
};

/** Applies Sobel edge detection effect (input/output) */
export const applySobelEdgeDetection = async (
  imageData: ImageData,
): Promise<void> => {
  await applyWasmEffect(imageData, wrappedSobel, "input-output");
};

/** Applies hue rotation effect (in-place) */
export const applyHueRotation = async (
  imageData: ImageData,
  angleDegrees: number,
): Promise<void> => {
  await applyWasmEffect(imageData, wrappedHueRotate, "in-place", angleDegrees);
};

/** Applies spiral distortion effect (input/output) */
export const applySpiralDistortion = async (
  imageData: ImageData,
  factor: number,
): Promise<void> => {
  await applyWasmEffect(imageData, wrappedSpiral, "input-output", factor);
};

/** Applies wormhole distortion effect (input/output) */
export const applyWormholeDistortion = async (
  imageData: ImageData,
  pullFactor: number,
): Promise<void> => {
  await applyWasmEffect(imageData, wrappedWormhole, "input-output", pullFactor);
};

/** Applies brightness and contrast adjustment (in-place) */
export const applyBrightnessContrast = async (
  imageData: ImageData,
  brightness: number, // Suggested range: -1 to 1
  contrast: number, // Suggested range: -1 to 1
): Promise<void> => {
  // Check state *before* calling applyWasmEffect
  console.log(
    "applyBrightnessContrast called. wrappedBrightnessContrast is:",
    typeof wrappedBrightnessContrast,
    !!wrappedBrightnessContrast,
  ); // New log
  await applyWasmEffect(
    imageData,
    wrappedBrightnessContrast,
    "in-place",
    brightness,
    contrast,
  );
};

/** Applies gamma correction (in-place) */
export const applyGammaCorrection = async (
  imageData: ImageData,
  gamma: number, // Suggested range: > 0, e.g., 0.1 to 5.0. 1.0 is no change.
): Promise<void> => {
  // Check state *before* calling applyWasmEffect
  console.log(
    "applyGammaCorrection called. wrappedGamma is:",
    typeof wrappedGamma,
    !!wrappedGamma,
  ); // New log
  // Ensure gamma is positive
  const safeGamma = Math.max(0.01, gamma); // Prevent division by zero or invalid pow
  await applyWasmEffect(imageData, wrappedGamma, "in-place", safeGamma);
};

// Optional: Export the initialization function if manual control is needed
// export { initializeWasm }; // Already exported
