"""
Test script to verify confidence calibration is working
Compares predictions with and without temperature scaling
"""
import numpy as np
import tensorflow as tf
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.ai_service import HeartSoundClassifier

def test_temperature_scaling():
    """Test that temperature scaling reduces confidence"""
    print("\n" + "="*70)
    print("🧪 TESTING CONFIDENCE CALIBRATION")
    print("="*70)
    
    # Create sample predictions (simulated overconfident model)
    overconfident_pred = np.array([[0.001, 0.999]])  # 99.9% confident
    
    print("\n📊 Simulated Overconfident Prediction:")
    print(f"   Raw: NORMAL={overconfident_pred[0][0]*100:.2f}%, ABNORMAL={overconfident_pred[0][1]*100:.2f}%")
    
    # Test different temperature values
    temperatures = [1.0, 2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 10.0]
    
    print(f"\n🌡️  Testing Different Temperature Values:\n")
    
    for temp in temperatures:
        # Convert to logits
        epsilon = 1e-7
        pred_clipped = np.clip(overconfident_pred, epsilon, 1 - epsilon)
        logits = np.log(pred_clipped)
        
        # Apply temperature scaling
        scaled_logits = logits / temp
        
        # Softmax
        exp_logits = np.exp(scaled_logits - np.max(scaled_logits))
        calibrated = exp_logits / np.sum(exp_logits)
        
        conf = np.max(calibrated) * 100
        normal_prob = calibrated[0][0] * 100
        abnormal_prob = calibrated[0][1] * 100
        
        indicator = "✅" if 75 <= conf <= 95 else "❌"
        print(f"   T={temp:.1f}: Confidence={conf:5.2f}% | NORMAL={normal_prob:5.2f}% ABNORMAL={abnormal_prob:5.2f}% {indicator}")
    
    print("\n" + "="*70)
    print("✅ Temperature T=2.5 provides ideal confidence range (75-95%)")
    print("="*70)

def test_model_if_available():
    """Test actual model if available"""
    model_path = os.path.join(os.path.dirname(__file__), "hybrid_cnn_lstm_heart_sound_final.h5")
    
    if os.path.exists(model_path):
        print("\n" + "="*70)
        print("🔬 TESTING ACTUAL MODEL")
        print("="*70)
        
        try:
            classifier = HeartSoundClassifier(model_path)
            print(f"✅ Model loaded successfully")
            print(f"🌡️  Temperature setting: {classifier.TEMPERATURE}")
            
            # Check if calibration is enabled
            if hasattr(classifier, 'TEMPERATURE') and classifier.TEMPERATURE > 1.0:
                print(f"✅ Confidence calibration ENABLED (T={classifier.TEMPERATURE})")
            else:
                print(f"⚠️  Confidence calibration NOT enabled - predictions may be overconfident")
                
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
    else:
        print(f"\n⚠️  Model file not found at: {model_path}")
        print("   Run training script first to generate the model")

if __name__ == "__main__":
    print("\n" + "🔬"*35)
    print("CONFIDENCE CALIBRATION TEST SUITE")
    print("🔬"*35)
    
    # Test 1: Temperature scaling math
    test_temperature_scaling()
    
    # Test 2: Actual model (if available)
    test_model_if_available()
    
    print("\n" + "="*70)
    print("📌 SUMMARY")
    print("="*70)
    print("""
The confidence calibration system works by:

1. Temperature Scaling (T=2.5):
   - Divides logits by temperature before softmax
   - T > 1 reduces confidence (makes predictions less extreme)
   - T = 2.5 gives ideal range of 75-95%

2. Label Smoothing (α=0.1):
   - Converts hard [0, 1] labels to [0.1, 0.9]
   - Prevents model from learning to be overconfident
   - Applied during training

3. Class Weight Balancing:
   - Balances training even with imbalanced data
   - Ensures model learns both NORMAL and ABNORMAL equally
   - Prevents single-class predictions

Expected Results:
✅ Confidence: 75-95% (not 100%)
✅ Both classes predicted (not just ABNORMAL)
✅ Realistic probability distributions
    """)
    print("="*70)
