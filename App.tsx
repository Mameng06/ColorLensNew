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
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Tts from 'react-native-tts';
import CameraComponent from './CameraComponent';

const {width, height} = Dimensions.get('window');

function App(): React.JSX.Element {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [detectedColor, setDetectedColor] = useState('#FFFFFF');
  const [colorName, setColorName] = useState('White');
  const [lastSpokenColor, setLastSpokenColor] = useState('');

  useEffect(() => {
    // Initialize TTS
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);
    
    // For now, we'll simulate camera permission
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

  const handleColorDetected = (color: string, name: string) => {
    setDetectedColor(color);
    setColorName(name);
    
    // Speak the color name if it's different from the last spoken color
    if (name !== lastSpokenColor) {
      Tts.speak(name);
      setLastSpokenColor(name);
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
        <Text style={styles.colorText}>Detected Color: {detectedColor}</Text>
        <Text style={styles.colorName}>{colorName}</Text>
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
