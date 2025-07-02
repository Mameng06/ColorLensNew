interface ColorInfo {
  name: string;
  hex: string;
  rgb: {r: number, g: number, b: number};
  hsv?: {h: number, s: number, v: number};
}

// Simplified color definitions with HSV values
const COLOR_MAP: ColorInfo[] = [
  {name: 'Red', hex: '#FF0000', rgb: {r: 255, g: 0, b: 0}, hsv: {h: 0, s: 1, v: 1}},
  {name: 'Green', hex: '#00FF00', rgb: {r: 0, g: 255, b: 0}, hsv: {h: 120, s: 1, v: 1}},
  {name: 'Blue', hex: '#0000FF', rgb: {r: 0, g: 0, b: 255}, hsv: {h: 240, s: 1, v: 1}},
  {name: 'Yellow', hex: '#FFFF00', rgb: {r: 255, g: 255, b: 0}, hsv: {h: 60, s: 1, v: 1}},
  {name: 'Cyan', hex: '#00FFFF', rgb: {r: 0, g: 255, b: 255}, hsv: {h: 180, s: 1, v: 1}},
  {name: 'Magenta', hex: '#FF00FF', rgb: {r: 255, g: 0, b: 255}, hsv: {h: 300, s: 1, v: 1}},
  {name: 'White', hex: '#FFFFFF', rgb: {r: 255, g: 255, b: 255}, hsv: {h: 0, s: 0, v: 1}},
  {name: 'Black', hex: '#000000', rgb: {r: 0, g: 0, b: 0}, hsv: {h: 0, s: 0, v: 0}},
  {name: 'Gray', hex: '#808080', rgb: {r: 128, g: 128, b: 128}, hsv: {h: 0, s: 0, v: 0.5}},
  {name: 'Orange', hex: '#FFA500', rgb: {r: 255, g: 165, b: 0}, hsv: {h: 39, s: 1, v: 1}},
  {name: 'Purple', hex: '#800080', rgb: {r: 128, g: 0, b: 128}, hsv: {h: 300, s: 1, v: 0.5}},
  {name: 'Pink', hex: '#FFC0CB', rgb: {r: 255, g: 192, b: 203}, hsv: {h: 350, s: 0.25, v: 1}},
  {name: 'Brown', hex: '#A52A2A', rgb: {r: 165, g: 42, b: 42}, hsv: {h: 0, s: 0.75, v: 0.65}},
  {name: 'Lime', hex: '#00FF00', rgb: {r: 0, g: 255, b: 0}, hsv: {h: 120, s: 1, v: 1}},
  {name: 'Navy', hex: '#000080', rgb: {r: 0, g: 0, b: 128}, hsv: {h: 240, s: 1, v: 0.5}},
  {name: 'Teal', hex: '#008080', rgb: {r: 0, g: 128, b: 128}, hsv: {h: 180, s: 1, v: 0.5}},
  {name: 'Maroon', hex: '#800000', rgb: {r: 128, g: 0, b: 0}, hsv: {h: 0, s: 1, v: 0.5}},
  {name: 'Olive', hex: '#808000', rgb: {r: 128, g: 128, b: 0}, hsv: {h: 60, s: 1, v: 0.5}},
  {name: 'Light Gray', hex: '#D3D3D3', rgb: {r: 211, g: 211, b: 211}, hsv: {h: 0, s: 0, v: 0.83}},
  {name: 'Dark Gray', hex: '#404040', rgb: {r: 64, g: 64, b: 64}, hsv: {h: 0, s: 0, v: 0.25}},
];

export class ColorDetector {
  /**
   * Convert RGB to HSV
   */
  private static rgbToHsv(r: number, g: number, b: number): {h: number, s: number, v: number} {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;

    let h = 0;
    const s = max === 0 ? 0 : diff / max;
    const v = max;

    if (diff !== 0) {
      switch (max) {
        case r:
          h = (g - b) / diff + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h *= 60;
    }

    return {h, s, v};
  }

  /**
   * Calculate the distance between two HSV colors
   */
  private static hsvDistance(hsv1: {h: number, s: number, v: number}, hsv2: {h: number, s: number, v: number}): number {
    const hDiff = Math.min(Math.abs(hsv1.h - hsv2.h), 360 - Math.abs(hsv1.h - hsv2.h)) / 180;
    const sDiff = Math.abs(hsv1.s - hsv2.s);
    const vDiff = Math.abs(hsv1.v - hsv2.v);
    
    return Math.sqrt(hDiff * hDiff * 2 + sDiff * sDiff + vDiff * vDiff);
  }

  /**
   * Convert RGB values to hex string
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Detect the closest color name for given RGB values using simple HSV detection
   */
  static detectColor(r: number, g: number, b: number): ColorInfo {
    const inputHsv = this.rgbToHsv(r, g, b);
    
    // Special handling for very dark colors (black)
    if (inputHsv.v < 0.1) {
      return {
        name: 'Black',
        hex: this.rgbToHex(r, g, b),
        rgb: {r, g, b},
        hsv: inputHsv
      };
    }

    // Special handling for very light colors (white)
    if (inputHsv.v > 0.9 && inputHsv.s < 0.1) {
      return {
        name: 'White',
        hex: this.rgbToHex(r, g, b),
        rgb: {r, g, b},
        hsv: inputHsv
      };
    }

    // Special handling for gray colors
    if (inputHsv.s < 0.15) {
      if (inputHsv.v < 0.3) {
        return {
          name: 'Dark Gray',
          hex: this.rgbToHex(r, g, b),
          rgb: {r, g, b},
          hsv: inputHsv
        };
      } else if (inputHsv.v > 0.7) {
        return {
          name: 'Light Gray',
          hex: this.rgbToHex(r, g, b),
          rgb: {r, g, b},
          hsv: inputHsv
        };
      } else {
        return {
          name: 'Gray',
          hex: this.rgbToHex(r, g, b),
          rgb: {r, g, b},
          hsv: inputHsv
        };
      }
    }

    // Find closest color using HSV distance
    let closestColor = COLOR_MAP[0];
    let minDistance = this.hsvDistance(inputHsv, closestColor.hsv!);

    for (const color of COLOR_MAP) {
      const distance = this.hsvDistance(inputHsv, color.hsv!);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }

    return {
      name: closestColor.name,
      hex: this.rgbToHex(r, g, b),
      rgb: {r, g, b},
      hsv: inputHsv
    };
  }

  /**
   * Detect color using HSV values directly (from native module)
   */
  static detectColorFromHsv(h: number, s: number, v: number): ColorInfo {
    const inputHsv = {h, s, v};
    
    // Special handling for very dark colors (black)
    if (v < 0.1) {
      return {
        name: 'Black',
        hex: '#000000',
        rgb: {r: 0, g: 0, b: 0},
        hsv: inputHsv
      };
    }

    // Special handling for very light colors (white)
    if (v > 0.9 && s < 0.1) {
      return {
        name: 'White',
        hex: '#FFFFFF',
        rgb: {r: 255, g: 255, b: 255},
        hsv: inputHsv
      };
    }

    // Special handling for gray colors
    if (s < 0.15) {
      if (v < 0.3) {
        return {
          name: 'Dark Gray',
          hex: '#404040',
          rgb: {r: 64, g: 64, b: 64},
          hsv: inputHsv
        };
      } else if (v > 0.7) {
        return {
          name: 'Light Gray',
          hex: '#D3D3D3',
          rgb: {r: 211, g: 211, b: 211},
          hsv: inputHsv
        };
      } else {
        return {
          name: 'Gray',
          hex: '#808080',
          rgb: {r: 128, g: 128, b: 128},
          hsv: inputHsv
        };
      }
    }

    // Find closest color
    let closestColor = COLOR_MAP[0];
    let minDistance = this.hsvDistance(inputHsv, closestColor.hsv!);

    for (const color of COLOR_MAP) {
      const distance = this.hsvDistance(inputHsv, color.hsv!);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }

    // Convert HSV back to RGB for hex
    const rgb = this.hsvToRgb(h, s, v);
    return {
      name: closestColor.name,
      hex: this.rgbToHex(rgb.r, rgb.g, rgb.b),
      rgb: rgb,
      hsv: inputHsv
    };
  }

  /**
   * Convert HSV to RGB
   */
  private static hsvToRgb(h: number, s: number, v: number): {r: number, g: number, b: number} {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  /**
   * Generate a random color for testing
   */
  static getRandomColor(): ColorInfo {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return this.detectColor(r, g, b);
  }

  /**
   * Get all available color names
   */
  static getAvailableColors(): string[] {
    return COLOR_MAP.map(color => color.name);
  }
} 