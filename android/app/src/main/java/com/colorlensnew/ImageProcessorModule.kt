package com.colorlensnew

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.util.Base64
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.ByteArrayOutputStream
import kotlin.math.*

class ImageProcessorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ImageProcessorModule"
    }

    @ReactMethod
    fun analyzeImageColor(base64Data: String, promise: Promise) {
        try {
            val imageBytes = Base64.decode(base64Data, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
            
            if (bitmap == null) {
                promise.reject("DECODE_ERROR", "Failed to decode image")
                return
            }
            
            val centerX = bitmap.width / 2
            val centerY = bitmap.height / 2
            
            // Simple 3x3 sampling around center for stability
            val samples = mutableListOf<Int>()
            val sampleSize = 3
            
            for (x in (centerX - sampleSize/2) until (centerX + sampleSize/2 + 1)) {
                for (y in (centerY - sampleSize/2) until (centerY + sampleSize/2 + 1)) {
                    if (x >= 0 && x < bitmap.width && y >= 0 && y < bitmap.height) {
                        val pixel = bitmap.getPixel(x, y)
                        samples.add(pixel)
                    }
                }
            }
            
            if (samples.isNotEmpty()) {
                val result = analyzeColorsSimple(samples)
                promise.resolve(result)
            } else {
                promise.reject("SAMPLE_ERROR", "No valid pixels sampled")
            }
            
        } catch (e: Exception) {
            promise.reject("PROCESSING_ERROR", e.message, e)
        }
    }

    private fun analyzeColorsSimple(samples: List<Int>): WritableMap {
        // Calculate simple average RGB values
        var totalRed = 0
        var totalGreen = 0
        var totalBlue = 0
        
        for (pixel in samples) {
            totalRed += Color.red(pixel)
            totalGreen += Color.green(pixel)
            totalBlue += Color.blue(pixel)
        }
        
        val avgRed = totalRed / samples.size
        val avgGreen = totalGreen / samples.size
        val avgBlue = totalBlue / samples.size
        
        // Convert to HSV
        val hsv = FloatArray(3)
        Color.RGBToHSV(avgRed, avgGreen, avgBlue, hsv)
        
        val result = Arguments.createMap().apply {
            putInt("red", avgRed)
            putInt("green", avgGreen)
            putInt("blue", avgBlue)
            putString("hex", String.format("#%02X%02X%02X", avgRed, avgGreen, avgBlue))
            putDouble("hue", hsv[0].toDouble())
            putDouble("saturation", hsv[1].toDouble())
            putDouble("value", hsv[2].toDouble())
            putInt("sampleCount", samples.size)
        }
        
        return result
    }

    @ReactMethod
    fun analyzeImageArea(base64Data: String, promise: Promise) {
        try {
            val imageBytes = Base64.decode(base64Data, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
            
            if (bitmap == null) {
                promise.reject("DECODE_ERROR", "Failed to decode image")
                return
            }
            
            val centerX = bitmap.width / 2
            val centerY = bitmap.height / 2
            val sampleSize = 5
            
            var totalRed = 0
            var totalGreen = 0
            var totalBlue = 0
            var sampleCount = 0
            
            for (x in (centerX - sampleSize/2) until (centerX + sampleSize/2)) {
                for (y in (centerY - sampleSize/2) until (centerY + sampleSize/2)) {
                    if (x >= 0 && x < bitmap.width && y >= 0 && y < bitmap.height) {
                        val pixel = bitmap.getPixel(x, y)
                        totalRed += Color.red(pixel)
                        totalGreen += Color.green(pixel)
                        totalBlue += Color.blue(pixel)
                        sampleCount++
                    }
                }
            }
            
            if (sampleCount > 0) {
                val avgRed = totalRed / sampleCount
                val avgGreen = totalGreen / sampleCount
                val avgBlue = totalBlue / sampleCount
                
                val result = Arguments.createMap().apply {
                    putInt("red", avgRed)
                    putInt("green", avgGreen)
                    putInt("blue", avgBlue)
                    putString("hex", String.format("#%02X%02X%02X", avgRed, avgGreen, avgBlue))
                }
                
                promise.resolve(result)
            } else {
                promise.reject("SAMPLE_ERROR", "No valid pixels sampled")
            }
            
        } catch (e: Exception) {
            promise.reject("PROCESSING_ERROR", e.message, e)
        }
    }
} 