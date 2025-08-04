module.exports = {
  project: {
    android: {
      sourceDir: './android',
      manifestPath: 'app/src/main/AndroidManifest.xml',
      // buildVariant: 'generalDebug' // Removed invalid property
    }
  },
  dependencies: {
    'react-native-camera': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-camera/android',
          packageImportPath: 'import org.reactnative.camera.RNCameraPackage;',
          packageInstance: 'new RNCameraPackage()'
        }
      }
    }
  }
}; 