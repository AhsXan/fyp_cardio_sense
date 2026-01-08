"""
Test script to verify AI model loading and basic functionality
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("🧪 TESTING AI MODEL INTEGRATION")
print("=" * 60)

# Test 1: Check if model file exists
model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "AI", "hybrid_cnn_lstm_heart_sound_final.h5")
print(f"\n📁 Model Path: {model_path}")
print(f"✅ Model file exists: {os.path.exists(model_path)}")
print(f"📊 Model file size: {os.path.getsize(model_path) / 1024:.2f} KB")

# Test 2: Try importing dependencies
print("\n🔍 Checking dependencies...")
try:
    import numpy as np
    print("✅ NumPy imported successfully")
except Exception as e:
    print(f"❌ NumPy import failed: {e}")
    sys.exit(1)

try:
    import librosa
    print("✅ Librosa imported successfully")
except Exception as e:
    print(f"❌ Librosa import failed: {e}")
    sys.exit(1)

try:
    import scipy
    print("✅ SciPy imported successfully")
except Exception as e:
    print(f"❌ SciPy import failed: {e}")
    sys.exit(1)

try:
    import tensorflow as tf
    print(f"✅ TensorFlow imported successfully (version: {tf.__version__})")
except Exception as e:
    print(f"❌ TensorFlow import failed: {e}")
    print("\n⚠️  TensorFlow has DLL issues on your system.")
    print("This is a known issue with TensorFlow on Windows.")
    print("\nPossible solutions:")
    print("1. Install Visual C++ Redistributable: https://aka.ms/vs/16/release/vc_redist.x64.exe")
    print("2. Use TensorFlow-CPU version: pip install tensorflow-cpu")
    print("3. Try downgrading: pip install tensorflow==2.15.0")
    sys.exit(1)

# Test 3: Try loading the model
print("\n🤖 Testing model loading...")
try:
    from app.services.ai_service import HeartSoundClassifier
    
    classifier = HeartSoundClassifier(model_path)
    print("✅ Model loaded successfully!")
    print(f"   - Sampling Rate: {classifier.FS_TARGET} Hz")
    print(f"   - Duration: {classifier.DURATION} seconds")
    print(f"   - Analog Length: {classifier.ANALOG_LEN}")
    print(f"   - MFCC Length: {classifier.MFCC_LEN}")
    print(f"   - MFCC Coefficients: {classifier.N_MFCC}")
    
except Exception as e:
    print(f"❌ Model loading failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED!")
print("=" * 60)
print("\n🎉 AI Model is ready to use!")
print("📍 You can now test it through the Admin Dashboard")
print("📍 Or via API: POST http://localhost:8000/api/ai/test-predict")
print("\n")
