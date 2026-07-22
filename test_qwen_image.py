#!/usr/bin/env python3
"""
Test CUDA and Qwen-VL setup
"""

import torch
import os
from PIL import Image

def test_cuda():
    """Test CUDA functionality"""
    print("="*50)
    print("CUDA TEST")
    print("="*50)
    
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"GPU name: {torch.cuda.get_device_name(0)}")
        print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        
        # Test GPU operations
        try:
            x = torch.randn(100, 100).cuda()
            y = torch.randn(100, 100).cuda() 
            z = torch.matmul(x, y)
            print("✅ GPU computation test: PASSED")
        except Exception as e:
            print(f"❌ GPU computation test: FAILED - {e}")
    else:
        print("❌ CUDA not available")

def test_qwen_imports():
    """Test if Qwen-VL can be imported"""
    print("\n" + "="*50)
    print("QWEN-VL IMPORT TEST")
    print("="*50)
    
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        print("✅ Transformers import: PASSED")
        
        # Try to load tokenizer only (faster test)
        tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen-VL-Chat", trust_remote_code=True)
        print("✅ Qwen-VL tokenizer load: PASSED")
        
    except Exception as e:
        print(f"❌ Qwen-VL import test: FAILED - {e}")

def test_image_loading():
    """Test image loading"""
    print("\n" + "="*50)
    print("IMAGE LOADING TEST")
    print("="*50)
    
    image_files = [f for f in os.listdir('.') if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if image_files:
        test_image = image_files[0]
        try:
            img = Image.open(test_image)
            print(f"✅ Image loading test: PASSED")
            print(f"   - File: {test_image}")
            print(f"   - Size: {img.size}")
            print(f"   - Mode: {img.mode}")
        except Exception as e:
            print(f"❌ Image loading test: FAILED - {e}")
    else:
        print("❌ No image files found for testing")

if __name__ == "__main__":
    print("Qwen-VL Setup Verification")
    test_cuda()
    test_qwen_imports()
    test_image_loading()
    print("\n" + "="*50)
    print("SETUP VERIFICATION COMPLETE")
    print("="*50)
