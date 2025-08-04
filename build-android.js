const { execSync } = require('child_process');

console.log('🚀 Building Android app...');

try {
  // Start Metro bundler
  console.log('📱 Starting Metro bundler...');
  execSync('npx react-native start', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 