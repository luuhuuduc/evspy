#!/usr/bin/env python3
"""
Simple AI Skin Retouching Script using traditional computer vision
Usage: python test_simple_retouching.py <input_image> [output_image]

This script applies professional skin retouching using traditional image processing:
- Skin detection and segmentation
- Gaussian blur for smoothing
- Brightness/contrast adjustment
- Color correction for natural skin tone
"""

import sys
import os
import argparse
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import warnings
warnings.filterwarnings("ignore")

class SimpleSkincareProcessor:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    def detect_skin_areas(self, image):
        """Detect skin-colored areas using HSV color space"""
        # Convert PIL to OpenCV
        img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
        
        # Define skin color range in HSV
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        
        # Create mask for skin areas
        skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
        
        # Apply morphological operations to clean up the mask
        kernel = np.ones((3, 3), np.uint8)
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel)
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
        
        # Blur the mask for smooth transitions
        skin_mask = cv2.GaussianBlur(skin_mask, (5, 5), 0)
        
        return skin_mask
    
    def detect_face_region(self, image):
        """Detect face regions for focused retouching"""
        img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # Create face mask
        face_mask = np.zeros(gray.shape, dtype=np.uint8)
        
        for (x, y, w, h) in faces:
            # Expand face area
            padding = int(min(w, h) * 0.2)
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(img_cv.shape[1] - x, w + 2*padding)
            h = min(img_cv.shape[0] - y, h + 2*padding)
            
            # Create elliptical mask
            center = (x + w//2, y + h//2)
            axes = (w//2, h//2)
            cv2.ellipse(face_mask, center, axes, 0, 0, 360, 255, -1)
        
        # If no faces detected, use center area
        if len(faces) == 0:
            h, w = face_mask.shape
            center = (w//2, h//2)
            axes = (w//3, h//2)
            cv2.ellipse(face_mask, center, axes, 0, 0, 360, 255, -1)
            print("⚠️ No faces detected, using center area")
        else:
            print(f"✅ Detected {len(faces)} face(s)")
        
        return face_mask
    
    def apply_skin_smoothing(self, image, strength=0.3):
        """Apply intelligent skin smoothing"""
        # Convert to numpy array
        img_array = np.array(image)
        
        # Create smoothed version
        smoothed = cv2.bilateralFilter(img_array, 9, 80, 80)
        
        # Get skin mask
        skin_mask = self.detect_skin_areas(image)
        
        # Normalize mask to 0-1 range
        skin_mask = skin_mask.astype(float) / 255.0
        
        # Apply strength factor
        skin_mask *= strength
        
        # Expand mask dimensions to match image
        if len(img_array.shape) == 3:
            skin_mask = np.expand_dims(skin_mask, axis=2)
            skin_mask = np.repeat(skin_mask, 3, axis=2)
        
        # Blend original and smoothed images
        result = img_array * (1 - skin_mask) + smoothed * skin_mask
        result = result.astype(np.uint8)
        
        return Image.fromarray(result)
    
    def enhance_brightness_contrast(self, image, brightness=1.1, contrast=1.05):
        """Enhance brightness and contrast"""
        # Brightness
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(brightness)
        
        # Contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(contrast)
        
        return image
    
    def color_correction(self, image):
        """Apply subtle color correction for natural skin tone"""
        # Convert to numpy for processing
        img_array = np.array(image).astype(float)
        
        # Slight warm tone adjustment (reduce blue, enhance red/yellow)
        img_array[:, :, 0] *= 1.02  # Red
        img_array[:, :, 1] *= 1.01  # Green  
        img_array[:, :, 2] *= 0.98  # Blue
        
        # Clip values to valid range
        img_array = np.clip(img_array, 0, 255).astype(np.uint8)
        
        return Image.fromarray(img_array)
    
    def process_image(self, input_path, output_path=None, prompt="smoothen and brighten skin"):
        """Main processing function"""
        print(f"🎨 Processing: {input_path}")
        print(f"📝 Goal: {prompt}")
        
        # Load image
        try:
            image = Image.open(input_path).convert('RGB')
            print(f"✅ Loaded image: {image.size[0]}x{image.size[1]} pixels")
        except Exception as e:
            print(f"❌ Failed to load image: {e}")
            return False
        
        # Step 1: Skin smoothing
        print("🔄 Step 1: Applying skin smoothing...")
        image = self.apply_skin_smoothing(image, strength=0.4)
        
        # Step 2: Brightness and contrast enhancement
        print("🔄 Step 2: Enhancing brightness and contrast...")
        if "brighten" in prompt.lower():
            image = self.enhance_brightness_contrast(image, brightness=1.15, contrast=1.08)
        else:
            image = self.enhance_brightness_contrast(image, brightness=1.05, contrast=1.03)
        
        # Step 3: Color correction
        print("🔄 Step 3: Applying color correction...")
        image = self.color_correction(image)
        
        # Step 4: Final subtle enhancement
        print("🔄 Step 4: Final enhancement...")
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.1)  # Slight sharpening
        
        # Save result
        if output_path is None:
            name, ext = os.path.splitext(input_path)
            output_path = f"{name}_enhanced{ext}"
        
        try:
            image.save(output_path, quality=95)
            print(f"✅ Enhanced image saved: {output_path}")
            return True
        except Exception as e:
            print(f"❌ Failed to save image: {e}")
            return False

def main():
    parser = argparse.ArgumentParser(description="Simple AI-powered skin retouching")
    parser.add_argument("input_image", help="Path to input image")
    parser.add_argument("output_image", nargs='?', help="Path to output image (optional)")
    parser.add_argument("--prompt", default="smoothen and brighten skin", 
                       help="Retouching goal description")
    
    args = parser.parse_args()
    
    # Process image
    processor = SimpleSkincareProcessor()
    success = processor.process_image(args.input_image, args.output_image, args.prompt)
    
    if success:
        print("🎉 Skin retouching completed successfully!")
        print("💡 Tip: Compare with original to see the improvements!")
    else:
        print("❌ Skin retouching failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
