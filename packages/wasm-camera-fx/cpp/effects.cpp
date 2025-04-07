#include <emscripten.h>
#include <cstdint> // For uint8_t
#include <vector>  // For temporary buffer in Sobel
#include <cmath>   // For math functions
#include <algorithm> // For std::min/max

// Helper structure for HSL color
struct HSL {
    double h, s, l;
};

// Helper: Convert RGB to HSL
HSL rgbToHsl(uint8_t r, uint8_t g, uint8_t b) {
    double rd = r / 255.0;
    double gd = g / 255.0;
    double bd = b / 255.0;
    double max = std::max({rd, gd, bd});
    double min = std::min({rd, gd, bd});
    double h = 0, s = 0, l = (max + min) / 2.0;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        double d = max - min;
        s = l > 0.5 ? d / (2.0 - max - min) : d / (max + min);
        if (max == rd) {
            h = (gd - bd) / d + (gd < bd ? 6.0 : 0.0);
        } else if (max == gd) {
            h = (bd - rd) / d + 2.0;
        } else { // max == bd
            h = (rd - gd) / d + 4.0;
        }
        h /= 6.0;
    }
    return {h * 360.0, s, l};
}

// Helper: Convert HSL to RGB
uint8_t hueToRgb(double p, double q, double t) {
    if (t < 0) t += 1.0;
    if (t > 1) t -= 1.0;
    if (t < 1.0/6.0) return static_cast<uint8_t>((p + (q - p) * 6.0 * t) * 255.0);
    if (t < 1.0/2.0) return static_cast<uint8_t>(q * 255.0);
    if (t < 2.0/3.0) return static_cast<uint8_t>((p + (q - p) * (2.0/3.0 - t) * 6.0) * 255.0);
    return static_cast<uint8_t>(p * 255.0);
}

void hslToRgb(HSL hsl, uint8_t& r, uint8_t& g, uint8_t& b) {
    double h = hsl.h / 360.0; // Normalize h to [0, 1]
    double s = hsl.s;
    double l = hsl.l;

    if (s == 0) {
        r = g = b = static_cast<uint8_t>(l * 255.0); // achromatic
    } else {
        double q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        double p = 2.0 * l - q;
        r = hueToRgb(p, q, h + 1.0/3.0);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1.0/3.0);
    }
}

// Helper: Bilinear Interpolation (accepts const pointer)
void sampleBilinear(const uint8_t* srcData, int width, int height, double u, double v, uint8_t& r, uint8_t& g, uint8_t& b, uint8_t& a) {
    // Clamp coordinates to be within bounds
    u = std::max(0.0, std::min((double)width - 1.001, u));
    v = std::max(0.0, std::min((double)height - 1.001, v));

    int x = static_cast<int>(u);
    int y = static_cast<int>(v);
    double u_ratio = u - x;
    double v_ratio = v - y;
    double u_opposite = 1.0 - u_ratio;
    double v_opposite = 1.0 - v_ratio;

    // Calculate indices based on width and pointer arithmetic
    const uint8_t* ptr1 = srcData + (y * width + x) * 4;
    const uint8_t* ptr2 = ptr1 + 4; // (y * width + (x + 1)) * 4
    const uint8_t* ptr3 = ptr1 + (width * 4); // ((y + 1) * width + x) * 4
    const uint8_t* ptr4 = ptr3 + 4; // ((y + 1) * width + (x + 1)) * 4

    // Basic bounds check (optional if input ptr and size are guaranteed correct)
    // const uint8_t* endPtr = srcData + width * height * 4;
    // if (ptr1 < srcData || ptr4 >= endPtr) { ... handle error ... }

    r = static_cast<uint8_t>((ptr1[0] * u_opposite + ptr2[0] * u_ratio) * v_opposite +
                              (ptr3[0] * u_opposite + ptr4[0] * u_ratio) * v_ratio);
    g = static_cast<uint8_t>((ptr1[1] * u_opposite + ptr2[1] * u_ratio) * v_opposite +
                              (ptr3[1] * u_opposite + ptr4[1] * u_ratio) * v_ratio);
    b = static_cast<uint8_t>((ptr1[2] * u_opposite + ptr2[2] * u_ratio) * v_opposite +
                              (ptr3[2] * u_opposite + ptr4[2] * u_ratio) * v_ratio);
    a = static_cast<uint8_t>((ptr1[3] * u_opposite + ptr2[3] * u_ratio) * v_opposite +
                              (ptr3[3] * u_opposite + ptr4[3] * u_ratio) * v_ratio);
}

// Helper: Clamp value to 0-255
uint8_t clamp(double val) {
    return static_cast<uint8_t>(std::max(0.0, std::min(255.0, val)));
}

// Keep the function available after optimizations and declare it with C linkage
extern "C" {

// Grayscale: Modifies in-place
EMSCRIPTEN_KEEPALIVE
void grayscale(uint8_t* imageData, int width, int height) {
    int numPixels = width * height;
    // Each pixel has 4 channels: R, G, B, A
    for (int i = 0; i < numPixels * 4; i += 4) {
        uint8_t r = imageData[i];
        uint8_t g = imageData[i + 1];
        uint8_t b = imageData[i + 2];
        // Simple luminance calculation for grayscale
        uint8_t gray = static_cast<uint8_t>(0.299 * r + 0.587 * g + 0.114 * b);
        // Set R, G, and B channels to the grayscale value
        imageData[i] = gray;
        imageData[i + 1] = gray;
        imageData[i + 2] = gray;
        // Leave the Alpha channel (imageData[i + 3]) unchanged
    }
}

// Sobel: Reads from inputData, writes to outputData
EMSCRIPTEN_KEEPALIVE
void sobelEdgeDetection(const uint8_t* inputData, uint8_t* outputData, int width, int height) {
    // REMOVED: internal copy
    int gx[3][3] = {{-1, 0, 1}, {-2, 0, 2}, {-1, 0, 1}};
    int gy[3][3] = {{-1, -2, -1}, {0, 0, 0}, {1, 2, 1}};

    for (int y = 1; y < height - 1; ++y) {
        for (int x = 1; x < width - 1; ++x) {
            double sumX = 0;
            double sumY = 0;
            // Apply kernels
            for (int ky = -1; ky <= 1; ++ky) {
                for (int kx = -1; kx <= 1; ++kx) {
                    const uint8_t* pixelPtr = inputData + ((y + ky) * width + (x + kx)) * 4; // Use inputData
                    // Simple grayscale conversion for intensity
                    uint8_t intensity = static_cast<uint8_t>(
                        0.299 * pixelPtr[0] +
                        0.587 * pixelPtr[1] +
                        0.114 * pixelPtr[2]
                    );
                    sumX += gx[ky + 1][kx + 1] * intensity;
                    sumY += gy[ky + 1][kx + 1] * intensity;
                }
            }
            // Calculate magnitude and clamp
            double magnitude = std::sqrt(sumX * sumX + sumY * sumY);
            uint8_t edge = static_cast<uint8_t>(std::min(255.0, magnitude));

            // Write edge value to output (grayscale)
            uint8_t* outPtr = outputData + (y * width + x) * 4; // Use outputData
            outPtr[0] = edge;     // R
            outPtr[1] = edge; // G
            outPtr[2] = edge; // B
            outPtr[3] = inputData[(y*width+x)*4 + 3]; // Preserve original alpha from input
        }
    }

    // Handle borders (optional, setting to black here, write to outputData)
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            if (y == 0 || y == height - 1 || x == 0 || x == width - 1) {
                 uint8_t* borderPtr = outputData + (y * width + x) * 4;
                borderPtr[0] = 0;
                borderPtr[1] = 0;
                borderPtr[2] = 0;
                borderPtr[3] = 255; // Set alpha for border
            }
        }
    }
}

// HueRotate: Modifies in-place
EMSCRIPTEN_KEEPALIVE
void hueRotate(uint8_t* imageData, int width, int height, double angleDegrees) {
    int numPixels = width * height;
    for (int i = 0; i < numPixels * 4; i += 4) {
        uint8_t r = imageData[i];
        uint8_t g = imageData[i + 1];
        uint8_t b = imageData[i + 2];
        HSL hsl = rgbToHsl(r, g, b);
        // Rotate hue
        hsl.h += angleDegrees;
        while (hsl.h < 0) hsl.h += 360.0;
        hsl.h = fmod(hsl.h, 360.0);
        hslToRgb(hsl, r, g, b);
        imageData[i] = r;
        imageData[i + 1] = g;
        imageData[i + 2] = b;
        // Alpha unchanged
    }
}

// SpiralDistortion: Reads from inputData, writes to outputData
EMSCRIPTEN_KEEPALIVE
void spiralDistortion(const uint8_t* inputData, uint8_t* outputData, int width, int height, double spiralFactor) {
    // REMOVED: internal copy
    double centerX = width / 2.0;
    double centerY = height / 2.0;
    double maxRadius = std::sqrt(centerX * centerX + centerY * centerY); // Approx max radius

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            double dx = x - centerX;
            double dy = y - centerY;
            double radius = std::sqrt(dx * dx + dy * dy);
            double angle = atan2(dy, dx);

            // Apply spiral distortion to the angle
            double distortedAngle = angle + spiralFactor * (radius / maxRadius);

            // Calculate the source coordinates (u, v) to sample from
            double srcX = centerX + radius * cos(distortedAngle);
            double srcY = centerY + radius * sin(distortedAngle);

            // Sample the source image using bilinear interpolation
            uint8_t r, g, b, a;
            sampleBilinear(inputData, width, height, srcX, srcY, r, g, b, a); // Use inputData

            // Write the sampled pixel to the output image
            int outIndex = (y * width + x) * 4;
            outputData[outIndex] = r;
            outputData[outIndex + 1] = g;
            outputData[outIndex + 2] = b;
            outputData[outIndex + 3] = a;
        }
    }
}

// WormholeDistortion: Reads from inputData, writes to outputData
EMSCRIPTEN_KEEPALIVE
void wormholeDistortion(const uint8_t* inputData, uint8_t* outputData, int width, int height, double pullFactor) {
    // REMOVED: internal copy
    double centerX = width / 2.0;
    double centerY = height / 2.0;
    double maxRadius = std::sqrt(centerX * centerX + centerY * centerY);

    pullFactor = std::max(0.0, std::min(0.99, pullFactor));

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            double dx = x - centerX;
            double dy = y - centerY;
            double radius = std::sqrt(dx * dx + dy * dy);
            double angle = atan2(dy, dx);

            double normalizedRadius = (radius == 0) ? 0 : (radius / maxRadius);
            double distortedRadius = radius * (1.0 - pullFactor * normalizedRadius);
            distortedRadius = std::max(0.0, distortedRadius);

            double srcX = centerX + distortedRadius * cos(angle);
            double srcY = centerY + distortedRadius * sin(angle);

            uint8_t r, g, b, a;
            sampleBilinear(inputData, width, height, srcX, srcY, r, g, b, a); // Use inputData

            // Write the sampled pixel to the outputData
            int outIndex = (y * width + x) * 4;
            outputData[outIndex] = r;
            outputData[outIndex + 1] = g;
            outputData[outIndex + 2] = b;
            outputData[outIndex + 3] = a;
        }
    }
}

// Brightness/Contrast: Modifies in-place
EMSCRIPTEN_KEEPALIVE
void brightnessContrast(uint8_t* imageData, int width, int height, double brightness, double contrast) {
    int numPixels = width * height;
    // Adjust contrast factor (range often -1 to 1 maps to 0 to 2)
    double factor = (1.0 + contrast);
    // Center brightness adjustment around 128
    double brightnessAdjust = brightness * 255.0; 

    for (int i = 0; i < numPixels * 4; i += 4) {
        double r = imageData[i];
        double g = imageData[i + 1];
        double b = imageData[i + 2];

        // Apply contrast: scale distance from midpoint (128)
        r = 128.0 + factor * (r - 128.0);
        g = 128.0 + factor * (g - 128.0);
        b = 128.0 + factor * (b - 128.0);

        // Apply brightness
        r += brightnessAdjust;
        g += brightnessAdjust;
        b += brightnessAdjust;

        // Clamp and store
        imageData[i] = clamp(r);
        imageData[i + 1] = clamp(g);
        imageData[i + 2] = clamp(b);
        // Alpha unchanged
    }
}

// Gamma Correction: Modifies in-place
EMSCRIPTEN_KEEPALIVE
void gammaCorrection(uint8_t* imageData, int width, int height, double gamma) {
    int numPixels = width * height;
    // Ensure gamma is positive to avoid issues
    gamma = std::max(0.01, gamma); 
    double gammaInv = 1.0 / gamma;

    // REMOVED: Lookup table generation
    // uint8_t gammaTable[256];
    // for(int i = 0; i < 256; ++i) {
    //     gammaTable[i] = clamp(pow(i / 255.0, gammaInv) * 255.0);
    // }

    for (int i = 0; i < numPixels * 4; i += 4) {
        // Apply gamma correction directly
        imageData[i] = clamp(pow(imageData[i] / 255.0, gammaInv) * 255.0); // R
        imageData[i + 1] = clamp(pow(imageData[i + 1] / 255.0, gammaInv) * 255.0); // G
        imageData[i + 2] = clamp(pow(imageData[i + 2] / 255.0, gammaInv) * 255.0); // B
        // Alpha unchanged
    }
}

} // extern "C" 