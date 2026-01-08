"""
Test specific WAV files and compare with expected results
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 80)
print("🧪 TESTING SPECIFIC WAV FILES")
print("=" * 80)

# Expected results from heart_sound_results.xls
expected_results = {
    "a0007.wav": {"label": "NORMAL", "confidence": 87.36},
    "a0008.wav": {"label": "ABNORMAL", "confidence": 76.80},
    "a0009.wav": {"label": "NORMAL", "confidence": 84.91},
    "a0010.wav": {"label": "ABNORMAL", "confidence": 85.94},
    "a0011.wav": {"label": "ABNORMAL", "confidence": 85.05},
    "a0012.wav": {"label": "ABNORMAL", "confidence": 81.61},
    "a0013.wav": {"label": "NORMAL", "confidence": 71.85},
    "a0014.wav": {"label": "ABNORMAL", "confidence": 70.94},
}

# Try to load AI service
try:
    from app.services.ai_service import get_classifier
    classifier = get_classifier()
    print("\u2705 AI model loaded successfully\n")
except Exception as e:
    print(f"\u274c Failed to load AI model: {str(e)}")
    sys.exit(1)

# Ask user for file path
print("Please provide the path to your test WAV files directory")
print("Example: E:\\Final Year Project\\Data Training\\test_files\\")
test_dir = input("\nTest directory path: ").strip()

if not os.path.exists(test_dir):
    print(f"\u274c Directory not found: {test_dir}")
    sys.exit(1)

print("\n" + "=" * 80)
print("TESTING FILES")
print("=" * 80)

results_match = 0
results_differ = 0
files_not_found = 0

for filename, expected in expected_results.items():
    file_path = os.path.join(test_dir, filename)
    
    if not os.path.exists(file_path):
        print(f"\n\u26a0\ufe0f  {filename}: FILE NOT FOUND")
        files_not_found += 1
        continue
    
    try:
        # Get prediction
        result = classifier.predict(file_path)
        
        # Compare results
        label_match = result['label'] == expected['label']
        confidence_diff = abs(result['confidence'] - expected['confidence'])
        
        print(f"\n\ud83d\udcc1 {filename}:")
        print(f"   Expected:  {expected['label']:8s} @ {expected['confidence']:5.2f}%")
        print(f"   Predicted: {result['label']:8s} @ {result['confidence']:5.2f}%")
        
        if label_match:
            if confidence_diff < 5.0:
                print(f"   \u2705 MATCH (confidence diff: {confidence_diff:.2f}%)")
                results_match += 1
            else:
                print(f"   \u26a0\ufe0f  LABEL MATCH but confidence differs by {confidence_diff:.2f}%")
                results_match += 1
        else:
            print(f"   \u274c MISMATCH - Different classification!")
            results_differ += 1
            
    except Exception as e:
        print(f"\n\u274c {filename}: Prediction failed - {str(e)}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"\u2705 Matches: {results_match}")
print(f"\u274c Mismatches: {results_differ}")
print(f"\u26a0\ufe0f  Files not found: {files_not_found}")

if results_differ > 0:
    print("\n\ud83d\udca1 Note: Different predictions might be due to:")
    print("   1. Different model weights (different training run)")
    print("   2. Different TensorFlow/Keras versions")
    print("   3. Different random initialization")
    print("\n   This is normal if the model was retrained.")
print("\n")
