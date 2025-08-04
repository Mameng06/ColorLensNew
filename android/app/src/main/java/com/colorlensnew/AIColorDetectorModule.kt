package com.colorlensnew

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.util.Base64
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.*

class AIColorDetectorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private var interpreter: Interpreter? = null
    private val modelFile = "color_model.tflite"
    private val inputSize = 3 // HSV input size (H, S, V)
    private val colorLabels = arrayOf(
        "Red", "Green", "Blue", "Yellow", "Violet", "Pink", 
        "Orange", "Brown", "Black", "White", "Gray"
    )

    override fun getName(): String {
        return "AIColorDetectorModule"
    }

    @ReactMethod
    fun initializeModel(promise: Promise) {
        try {
            val modelPath = File(reactApplicationContext.filesDir, modelFile)
            
            // Check if model exists in assets, copy if needed
            if (!modelPath.exists()) {
                println("DEBUG: Model not found in files dir, copying from assets...")
                copyModelFromAssets()
            }
            
            println("DEBUG: Model path: ${modelPath.absolutePath}")
            println("DEBUG: Model exists: ${modelPath.exists()}")
            println("DEBUG: Model size: ${modelPath.length()} bytes")
            
            val options = Interpreter.Options()
            options.setNumThreads(4)
            
            interpreter = Interpreter(modelPath, options)
            println("DEBUG: AI Model initialized successfully!")
            
            // Print model details
            val inputDetails = interpreter?.getInputTensor(0)
            val outputDetails = interpreter?.getOutputTensor(0)
            println("DEBUG: Model input shape: ${inputDetails?.shape()?.contentToString()}")
            println("DEBUG: Model output shape: ${outputDetails?.shape()?.contentToString()}")
            println("DEBUG: Model input type: ${inputDetails?.dataType()}")
            println("DEBUG: Model output type: ${outputDetails?.dataType()}")
            
            promise.resolve(true)
        } catch (e: Exception) {
            println("DEBUG: Failed to initialize AI model: ${e.message}")
            e.printStackTrace()
            promise.reject("INIT_ERROR", "Failed to initialize AI model: ${e.message}", e)
        }
    }

    private fun copyModelFromAssets() {
        try {
            val inputStream = reactApplicationContext.assets.open(modelFile)
            val outputFile = File(reactApplicationContext.filesDir, modelFile)
            outputFile.outputStream().use { outputStream ->
                inputStream.copyTo(outputStream)
            }
            inputStream.close()
        } catch (e: Exception) {
            throw RuntimeException("Failed to copy model from assets: ${e.message}")
        }
    }

    @ReactMethod
    fun detectColorWithAI(base64Data: String, promise: Promise) {
        try {
            if (interpreter == null) {
                promise.reject("NOT_INITIALIZED", "AI model not initialized. Call initializeModel first.")
                return
            }

            val imageBytes = Base64.decode(base64Data, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
            
            if (bitmap == null) {
                promise.reject("DECODE_ERROR", "Failed to decode image")
                return
            }

            // Get average RGB from the bitmap
            val (avgR, avgG, avgB) = getAverageRGB(bitmap)

            // Use average RGB for hex color
            val red = avgR.roundToInt().coerceIn(0, 255)
            val green = avgG.roundToInt().coerceIn(0, 255)
            val blue = avgB.roundToInt().coerceIn(0, 255)

            // Use ONLY the AI model - no fallbacks
            var detectedColor = "Unknown"
            var confidence = 0.0
            
            // Declare normalized HSV variables outside try block
            var normalizedH = 0.0f
            var normalizedS = 0.0f
            var normalizedV = 0.0f
            
            try {
                // Convert RGB to HSV for AI model
                val hsv = FloatArray(3)
                Color.RGBToHSV(red, green, blue, hsv)
                
                // Normalize HSV values for AI model
                // Hue: 0-360 -> 0-1 (divide by 360)
                // Saturation: 0-1 (already normalized)
                // Value: 0-1 (already normalized)
                normalizedH = hsv[0] / 360.0f
                normalizedS = hsv[1]
                normalizedV = hsv[2]
                
                // Prepare input tensor [1, 3] as float32 with normalized HSV values
                val inputBuffer = ByteBuffer.allocateDirect(3 * 4).order(ByteOrder.nativeOrder())
                inputBuffer.putFloat(normalizedH)
                inputBuffer.putFloat(normalizedS)
                inputBuffer.putFloat(normalizedV)
                inputBuffer.rewind()

                // Prepare output buffer
                val outputBuffer = ByteBuffer.allocateDirect(colorLabels.size * 4).order(ByteOrder.nativeOrder())

                // Run inference
                interpreter?.run(inputBuffer, outputBuffer)
                outputBuffer.rewind()
                val predictions = FloatArray(colorLabels.size)
                outputBuffer.asFloatBuffer().get(predictions)

                val maxIndex = predictions.indices.maxByOrNull { predictions[it] } ?: 0
                confidence = predictions[maxIndex].toDouble()
                detectedColor = colorLabels[maxIndex]
                
                println("DEBUG: AI Model - RGB($red, $green, $blue) -> HSV(${hsv[0]}, ${hsv[1]}, ${hsv[2]}) -> Normalized(${normalizedH}, ${normalizedS}, ${normalizedV}) -> AI: $detectedColor (conf: $confidence)")
                println("DEBUG: All predictions: ${predictions.joinToString(", ")}")
            } catch (e: Exception) {
                println("DEBUG: AI Model failed: ${e.message}")
                e.printStackTrace()
                throw e // Re-throw to fail completely if AI doesn't work
            }

            // Use ONLY AI result - no fallbacks
            val finalColorName = detectedColor
            println("DEBUG: Using AI result: $finalColorName (confidence: $confidence)")

            // Debug logging for color detection
            println("DEBUG: Final Result - RGB($red, $green, $blue) -> Final: $finalColorName (AI conf: $confidence)")
            
            // Return the normalized HSV values that the AI model was trained on
            println("DEBUG: AI Model Input HSV - Normalized H: $normalizedH, S: $normalizedS, V: $normalizedV")
            
            val result = Arguments.createMap().apply {
                putString("colorName", finalColorName)
                putString("hex", String.format("#%02X%02X%02X", red, green, blue))
                putInt("red", red)
                putInt("green", green)
                putInt("blue", blue)
                putDouble("hue", (normalizedH * 360).toDouble()) // Convert back to 0-360 range for display
                putDouble("saturation", (normalizedS * 100).toDouble()) // Convert to percentage
                putDouble("value", (normalizedV * 100).toDouble()) // Convert to percentage
                putDouble("confidence", confidence)
                putString("method", "AI")
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("AI_DETECTION_ERROR", "AI detection failed: ${e.message}", e)
        }
    }

    // Helper function to compute average RGB from a bitmap
    private fun getAverageRGB(bitmap: Bitmap): Triple<Float, Float, Float> {
        var rSum = 0L
        var gSum = 0L
        var bSum = 0L
        val width = bitmap.width
        val height = bitmap.height
        val total = width * height

        for (x in 0 until width) {
            for (y in 0 until height) {
                val pixel = bitmap.getPixel(x, y)
                rSum += Color.red(pixel)
                gSum += Color.green(pixel)
                bSum += Color.blue(pixel)
            }
        }
        return Triple(rSum.toFloat() / total, gSum.toFloat() / total, bSum.toFloat() / total)
    }

    private fun preprocessImage(bitmap: Bitmap): TensorImage {
        // Resize image to model input size
        val imageProcessor = ImageProcessor.Builder()
            .add(ResizeOp(inputSize, inputSize, ResizeOp.ResizeMethod.BILINEAR))
            .build()
        
        val tensorImage = TensorImage.fromBitmap(bitmap)
        return imageProcessor.process(tensorImage)
    }

    @ReactMethod
    fun isModelLoaded(promise: Promise) {
        promise.resolve(interpreter != null)
    }

    @ReactMethod
    fun getModelInfo(promise: Promise) {
        try {
            val modelPath = File(reactApplicationContext.filesDir, modelFile)
            val result = Arguments.createMap().apply {
                putBoolean("exists", modelPath.exists())
                putString("path", modelPath.absolutePath)
                putInt("inputSize", inputSize)
                putArray("labels", Arguments.fromArray(colorLabels))
                putBoolean("interpreterLoaded", interpreter != null)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("INFO_ERROR", "Failed to get model info: ${e.message}", e)
        }
    }

    @ReactMethod
    fun testAIModel(promise: Promise) {
        try {
            if (interpreter == null) {
                promise.reject("NOT_INITIALIZED", "AI model not initialized")
                return
            }

            // Test with pure red HSV values
            val testH = 0.0f / 360.0f  // Red hue normalized
            val testS = 1.0f           // Full saturation
            val testV = 1.0f           // Full value

            val inputBuffer = ByteBuffer.allocateDirect(3 * 4).order(ByteOrder.nativeOrder())
            inputBuffer.putFloat(testH)
            inputBuffer.putFloat(testS)
            inputBuffer.putFloat(testV)
            inputBuffer.rewind()

            val outputBuffer = ByteBuffer.allocateDirect(colorLabels.size * 4).order(ByteOrder.nativeOrder())
            interpreter?.run(inputBuffer, outputBuffer)
            outputBuffer.rewind()
            
            val predictions = FloatArray(colorLabels.size)
            outputBuffer.asFloatBuffer().get(predictions)

            val maxIndex = predictions.indices.maxByOrNull { predictions[it] } ?: 0
            val confidence = predictions[maxIndex].toDouble()
            val detectedColor = colorLabels[maxIndex]

            val result = Arguments.createMap().apply {
                putString("testInput", "HSV(0.0, 1.0, 1.0) - Pure Red")
                putString("detectedColor", detectedColor)
                putDouble("confidence", confidence)
                putArray("allPredictions", Arguments.fromArray(predictions))
                putArray("labels", Arguments.fromArray(colorLabels))
            }
            
            println("DEBUG: AI Model Test - Input: HSV(0.0, 1.0, 1.0) -> Output: $detectedColor (conf: $confidence)")
            promise.resolve(result)
        } catch (e: Exception) {
            println("DEBUG: AI Model test failed: ${e.message}")
            e.printStackTrace()
            promise.reject("TEST_ERROR", "AI model test failed: ${e.message}", e)
        }
    }

    // AI-only color detection - no fallback methods
    // All color detection is handled by the trained AI model
} 