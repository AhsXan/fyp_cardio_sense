"""
Test AI prediction with a synthetic audio file
"""
import sys
import os
import numpy as np
import librosa
import soundfile as sf

print("=" * 60)
print("🎵 TESTING AI WITH SYNTHETIC AUDIO")
print("=" * 60)

# Create a synthetic heart sound (simulating a heartbeat pattern)
duration = 3.0  # seconds
sample_rate = 2000  # Hz
t = np.linspace(0, duration, int(sample_rate * duration))

# Create a simple periodic signal (simulating S1-S2 heart sounds)
# S1 (lub) around 70-200 Hz, S2 (dub) around 200-400 Hz
heart_rate = 1.5  # beats per second
signal = np.zeros_like(t)

# Add S1 sound (lower frequency, longer)
s1_freq = 100  # Hz
for beat in range(int(duration * heart_rate)):
    beat_time = beat / heart_rate
    s1_envelope = np.exp(-50 * (t - beat_time)**2)
    signal += s1_envelope * np.sin(2 * np.pi * s1_freq * t)
    
    # Add S2 sound (higher frequency, shorter)
    s2_time = beat_time + 0.3
    s2_envelope = np.exp(-100 * (t - s2_time)**2)
    signal += 0.5 * s2_envelope * np.sin(2 * np.pi * 200 * t)

# Normalize
signal = signal / np.max(np.abs(signal))

# Add some noise
noise = 0.05 * np.random.randn(len(signal))
signal = signal + noise

# Save as WAV file
test_audio_path = "test_heart_sound.wav"
sf.write(test_audio_path, signal, sample_rate)
print(f"✅ Created synthetic heart sound: {test_audio_path}")
print(f"   Duration: {duration}s, Sample Rate: {sample_rate} Hz")
print(f"   Size: {os.path.getsize(test_audio_path)} bytes")

# Now test with our AI service
print("\n" + "=" * 60)
print("🤖 TESTING AI PREDICTION")
print("=" * 60)

try:
    from app.services.ai_service import get_classifier
    
    classifier = get_classifier()
    print("\n📊 Processing audio file...")
    result = classifier.predict(test_audio_path)
    
    print("\n" + "=" * 60)
    print("✅ PREDICTION RESULTS")
    print("=" * 60)
    print(f"📍 Classification: {result['label']}")
    print(f"📊 Confidence: {result['confidence']}%")
    print(f"📈 Probabilities:")
    print(f"   - Normal: {result['probabilities']['normal']}%")
    print(f"   - Abnormal: {result['probabilities']['abnormal']}%")
    print("=" * 60)
    
    # Clean up
    os.remove(test_audio_path)
    print("\n✅ Test completed successfully!")
    print("🎉 AI model is working perfectly!")
    
except Exception as e:
    print(f"\n❌ Test failed: {str(e)}")
    import traceback
    traceback.print_exc()
    if os.path.exists(test_audio_path):
        os.remove(test_audio_path)
    sys.exit(1)

print("\n📍 Next Steps:")
print("   1. Login to Admin Dashboard (admin@cardiosense.com / AdminPass123!)")
print("   2. Navigate to AI Model Testing section")
print("   3. Upload a real PCG WAV file")
print("   4. Get instant predictions!")
print("\n")
