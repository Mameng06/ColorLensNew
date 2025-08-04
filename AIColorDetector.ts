import { NativeModules } from 'react-native';

const { AIColorDetectorModule } = NativeModules;

export interface AIColorResult {
  colorName: string;
  hex: string;
  red: number;
  green: number;
  blue: number;
  confidence: number;
  method: string;
  hue?: number;
  saturation?: number;
  value?: number;
}

export interface ModelInfo {
  exists: boolean;
  path: string;
  inputSize: number;
  labels: string[];
}

export class AIColorDetector {
  /**
   * Initialize the AI model
   */
  static async initializeModel(): Promise<boolean> {
    try {
      return await AIColorDetectorModule.initializeModel();
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
      throw error;
    }
  }

  /**
   * Detect color using AI model
   */
  static async detectColorWithAI(base64Image: string): Promise<AIColorResult> {
    try {
      return await AIColorDetectorModule.detectColorWithAI(base64Image);
    } catch (error) {
      console.error('AI color detection failed:', error);
      throw error;
    }
  }

  /**
   * Check if the AI model is loaded
   */
  static async isModelLoaded(): Promise<boolean> {
    try {
      return await AIColorDetectorModule.isModelLoaded();
    } catch (error) {
      console.error('Failed to check model status:', error);
      return false;
    }
  }

  /**
   * Get information about the AI model
   */
  static async getModelInfo(): Promise<ModelInfo> {
    try {
      return await AIColorDetectorModule.getModelInfo();
    } catch (error) {
      console.error('Failed to get model info:', error);
      throw error;
    }
  }
} 