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

let moduleInstance: EmscriptenModule | null = null;
let wrappedGrayscale: GrayscaleFunc | null = null;
let wrappedSobel: SobelFunc | null = null;
let wrappedHueRotate: HueRotateFunc | null = null;
let wrappedSpiral: SpiralDistortionFunc | null = null;
let wrappedWormhole: WormholeDistortionFunc | null = null;

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

    console.log("WASM functions wrapped.");
  } catch (error) {
    console.error("Error initializing WASM module:", error);
    moduleInstance = null;
    wrappedGrayscale = null;
    wrappedSobel = null;
    wrappedHueRotate = null;
    wrappedSpiral = null;
    wrappedWormhole = null;
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

  if (!moduleInstance || !effectFunc) {
    throw new Error(
      "WASM module not initialized or the specific effect function is not available.",
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
      effectFunc(inputPtr, outputPtr, width, height, ...args);
      // Copy result from WASM output buffer back to JS ImageData
      const resultView = moduleInstance.HEAPU8.slice(
        outputPtr,
        outputPtr + numBytes,
      );
      data.set(resultView);
    } else {
      // For in-place effects, call with the single (input) pointer
      effectFunc(inputPtr, width, height, ...args);
      // Copy potentially modified data from WASM input buffer back to JS ImageData
      const resultView = moduleInstance.HEAPU8.slice(
        inputPtr,
        inputPtr + numBytes,
      );
      data.set(resultView);
    }
  } catch (error) {
    const funcName = effectFunc?.name || "unknown function";
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

// Optional: Export the initialization function if manual control is needed
// export { initializeWasm }; // Already exported
