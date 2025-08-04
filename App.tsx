/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Tts from 'react-native-tts';
import CameraComponent from './CameraComponent';
import { AIColorDetector } from './AIColorDetector';

function App(): React.JSX.Element {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [detectedColor, setDetectedColor] = useState('#FFFFFF');
  const [colorName, setColorName] = useState('White');
  const [hsvValues, setHsvValues] = useState({ hue: 0, saturation: 0, value: 0 });
  const [lastSpokenColor, setLastSpokenColor] = useState('');
  const [lastSpokenTime, setLastSpokenTime] = useState(0);

  useEffect(() => {
    // Initialize TTS
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);
    
    // Initialize AI Model
    const initializeAI = async () => {
      try {
        await AIColorDetector.initializeModel();
      } catch (error) {
        console.error('Failed to initialize AI model:', error);
      }
    };
    
    initializeAI();
    setHasPermission(true);
  }, []);

  const requestCameraPermission = () => {
    Alert.alert(
      'Camera Permission',
      'This app needs camera access to detect colors. Please grant camera permission.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => setHasPermission(true)},
      ]
    );
  };

  const toggleCamera = () => {
    if (!hasPermission) {
      requestCameraPermission();
      return;
    }
    setIsActive(!isActive);
  };

  const handleColorDetected = (color: string, name: string, hsv?: { hue: number, saturation: number, value: number }) => {
    setDetectedColor(color);
    setColorName(name);
    if (hsv) {
      setHsvValues(hsv);
    }
    
    // Speak the color name every 3 seconds if it's the same color
    const now = Date.now();
    const timeSinceLastSpoken = now - lastSpokenTime;
    const shouldSpeak = name.trim() !== '' && (
      name !== lastSpokenColor || 
      timeSinceLastSpoken > 3000
    );
    
    if (shouldSpeak) {
      Tts.speak(name);
      setLastSpokenColor(name);
      setLastSpokenTime(now);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.text}>No access to camera</Text>
          <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera Component */}
      <View style={styles.cameraContainer}>
        <CameraComponent 
          onColorDetected={handleColorDetected}
          isActive={isActive}
        />
      </View>

      {/* Color Display */}
      <View style={styles.colorDisplay}>
        <Text style={styles.colorText}>Detected Color: {colorName}</Text>
        <Text style={styles.colorName}>{detectedColor}</Text>
        <Text style={styles.hsvText}>
          AI HSV: H:{hsvValues.hue.toFixed(0)}° S:{hsvValues.saturation.toFixed(0)}% V:{hsvValues.value.toFixed(0)}%
        </Text>
        <Text style={styles.ttsStatus}>Voice Output: Active</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, isActive && styles.activeButton]} 
          onPress={toggleCamera}
        >
          <Text style={styles.buttonText}>
            {isActive ? 'Stop Camera' : 'Start Camera'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  colorDisplay: {
    backgroundColor: '#222',
    padding: 20,
    alignItems: 'center',
  },
  colorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  colorName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hsvText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
  },
  controls: {
    padding: 20,
    backgroundColor: '#111',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  ttsStatus: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default App;
