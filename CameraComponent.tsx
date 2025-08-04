import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {AIColorDetector} from './AIColorDetector';

interface CameraComponentProps {
  onColorDetected: (color: string, colorName: string, hsv?: { hue: number, saturation: number, value: number }) => void;
  isActive: boolean;
}

const CameraComponent: React.FC<CameraComponentProps> = ({
  onColorDetected,
  isActive,
}) => {
  const cameraRef = useRef<RNCamera>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentColor, setCurrentColor] = useState('White');
  const [cameraError, setCameraError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [aiModelLoaded, setAiModelLoaded] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Request camera permissions
  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to detect colors.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      } else {
        setHasPermission(true);
      }
    } catch (err) {
      setHasPermission(false);
    }
  };

  useEffect(() => {
    requestCameraPermission();
    initializeAIModel();
  }, []);

  // Initialize AI model
  const initializeAIModel = async () => {
    try {
      const isLoaded = await AIColorDetector.isModelLoaded();
      if (!isLoaded) {
        await AIColorDetector.initializeModel();
      }
      setAiModelLoaded(true);
    } catch (error) {
      setAiModelLoaded(false);
    }
  };

  // Function to capture frame and analyze color at center
  const captureAndAnalyzeColor = async () => {
    if (isProcessing) {
      return;
    }
    
    const now = Date.now();
    if (now - lastDetectionTime < 1000) {
      return;
    }
    
    if (cameraRef.current && cameraReady) {
      try {
        setIsProcessing(true);
        setLastDetectionTime(Date.now());
        
        const options = {
          quality: 0.3,
          base64: true,
          skipProcessing: true,
          width: 224,
          height: 224,
        };
        
        const data = await cameraRef.current.takePictureAsync(options);
        
        if (data.base64 && aiModelLoaded) {
          try {
            const aiResult = await AIColorDetector.detectColorWithAI(data.base64);
            setCurrentColor(aiResult.colorName);
            const colorDisplay = `${aiResult.colorName} (${aiResult.method})`;
            
            const hsv = aiResult.hue !== undefined && aiResult.saturation !== undefined && aiResult.value !== undefined
              ? { hue: aiResult.hue, saturation: aiResult.saturation, value: aiResult.value }
              : undefined;
            
            onColorDetected(colorDisplay, aiResult.colorName, hsv);
          } catch (aiError) {
            setCurrentColor('AI Error');
            onColorDetected('AI Error', 'AI Error');
          }
        } else {
          setCurrentColor('AI Not Ready');
          onColorDetected('AI Not Ready', 'AI Not Ready');
        }
      } catch (error) {
        setCurrentColor('Capture Error');
        onColorDetected('Capture Error', 'Capture Error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && hasPermission) {
      interval = setInterval(() => {
        captureAndAnalyzeColor();
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, hasPermission, onColorDetected, cameraReady]);

  const onCameraReady = () => {
    setCameraReady(true);
    setCameraError(false);
  };

  const onMountError = (error: any) => {
    setCameraError(true);
    setCameraReady(false);
  };

  const onPermissionError = (error: any) => {
    setHasPermission(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No access to camera</Text>
        <Text style={styles.placeholderSubtext}>Please grant camera permission in settings</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isActive) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Camera Inactive</Text>
        <Text style={styles.placeholderSubtext}>Tap "Start Camera" to begin</Text>
      </View>
    );
  }

  if (cameraError) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraText}>Camera Error</Text>
          <Text style={styles.cameraSubtext}>Failed to initialize camera</Text>
          <Text style={styles.errorText}>Please check camera permissions and try again</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
        onCameraReady={onCameraReady}
        onMountError={onMountError}
        captureAudio={false}
        playSoundOnCapture={false}
        defaultVideoQuality={RNCamera.Constants.VideoQuality['480p']}
      />
      
      {/* Center Crosshair */}
      <View style={styles.crosshairContainer}>
        <View style={styles.crosshairHorizontal} />
        <View style={styles.crosshairVertical} />
        <View style={styles.centerDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  cameraSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  crosshairContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 60,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  crosshairVertical: {
    position: 'absolute',
    width: 2,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#ff0000',
    borderRadius: 4,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraComponent; 