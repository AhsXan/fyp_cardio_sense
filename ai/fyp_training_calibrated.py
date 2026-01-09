"""
Improved CNN-LSTM Training with Confidence Calibration
Fixes:
1. Temperature scaling for softmax calibration
2. Label smoothing to prevent overconfidence
3. Class weight balancing
4. Proper evaluation of both classes
"""
import numpy as np
import tensorflow as tf
from tensorflow.keras.layers import (
    Input, Conv1D, MaxPooling1D, LSTM,
    Dense, Dropout, BatchNormalization, GlobalAveragePooling1D, Concatenate, Lambda
)
from tensorflow.keras.models import Model
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.utils.class_weight import compute_class_weight
import librosa
import scipy.signal as signal
from scipy.signal import resample
import os
import matplotlib.pyplot as plt
import seaborn as sns

# ================= CONFIG =================
FS_TARGET = 2000      # Sampling rate
DURATION = 3.0        # seconds
ANALOG_LEN = 250      # CNN input length
MFCC_LEN = 38         # LSTM input time steps
N_MFCC = 20           # Number of MFCC coefficients

# Temperature scaling parameter (T > 1 reduces confidence, T < 1 increases it)
TEMPERATURE = 2.5     # Start with 2.5 for calibration

# Label smoothing (prevents 100% confidence)
LABEL_SMOOTHING = 0.1  # Smooths labels from [0,1] to [0.1, 0.9]

DATA_DIR = r"E:\Final Year Project\Data Training"  # Change to your data folder

# ================= LOAD RAW WAV FILES AND PREPROCESS =================
def preprocess_file(file_path):
    """Preprocess audio file into CNN and LSTM inputs"""
    # Load audio
    audio, sr = librosa.load(file_path, sr=None)
    if sr != FS_TARGET:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=FS_TARGET)
    max_len = int(FS_TARGET * DURATION)
    audio = audio[:max_len] if len(audio) > max_len else np.pad(audio, (0, max_len - len(audio)))

    # ---- Analog (CNN) ----
    b, a = signal.butter(4, [20/(FS_TARGET/2), 400/(FS_TARGET/2)], btype='band')
    analog = signal.filtfilt(b, a, audio)
    analog = resample(analog, ANALOG_LEN).reshape(ANALOG_LEN, 1)

    # ---- MFCC (LSTM) ----
    mfcc = librosa.feature.mfcc(y=audio, sr=FS_TARGET, n_mfcc=N_MFCC).T
    if mfcc.shape[0] > MFCC_LEN:
        mfcc = mfcc[:MFCC_LEN]
    elif mfcc.shape[0] < MFCC_LEN:
        mfcc = np.pad(mfcc, ((0, MFCC_LEN - mfcc.shape[0]), (0, 0)))
    
    return analog, mfcc

# ================= LOAD ALL DATA =================
print("\n" + "="*60)
print("📂 LOADING DATA")
print("="*60)

X_analog_list = []
X_mfcc_list = []
y_list = []

for label_folder in os.listdir(DATA_DIR):
    label_path = os.path.join(DATA_DIR, label_folder)
    if os.path.isdir(label_path):
        label_index = 0 if label_folder.lower() == "normal" else 1
        label_name = "NORMAL" if label_index == 0 else "ABNORMAL"
        file_count = 0
        
        for file_name in os.listdir(label_path):
            if file_name.lower().endswith(".wav"):
                file_path = os.path.join(label_path, file_name)
                try:
                    analog, mfcc = preprocess_file(file_path)
                    X_analog_list.append(analog)
                    X_mfcc_list.append(mfcc)
                    y_list.append(label_index)
                    file_count += 1
                except Exception as e:
                    print(f"⚠️  Error processing {file_name}: {str(e)}")
        
        print(f"✅ {label_name}: {file_count} files")

X_analog = np.array(X_analog_list)
X_mfcc = np.array(X_mfcc_list)
y = np.array(y_list)

print(f"\n📊 Total samples: {len(y)}")
print(f"   NORMAL (0): {np.sum(y == 0)}")
print(f"   ABNORMAL (1): {np.sum(y == 1)}")

# Check class imbalance
class_counts = np.bincount(y)
class_ratio = class_counts[0] / class_counts[1] if class_counts[1] > 0 else 0
print(f"\n⚖️  Class imbalance ratio: {class_ratio:.2f}")

if class_ratio > 2.0 or class_ratio < 0.5:
    print("⚠️  WARNING: Significant class imbalance detected!")
    print("   Using class weights to balance training...")

# Compute class weights
class_weights = compute_class_weight(
    class_weight='balanced',
    classes=np.unique(y),
    y=y
)
class_weight_dict = {i: class_weights[i] for i in range(len(class_weights))}
print(f"   Class weights: {class_weight_dict}")

# One-hot encode labels with label smoothing
y_cat = to_categorical(y, num_classes=2)

# Apply label smoothing: [0, 1] -> [0.1, 0.9]
if LABEL_SMOOTHING > 0:
    y_cat = y_cat * (1 - LABEL_SMOOTHING) + (LABEL_SMOOTHING / 2)
    print(f"\n🎯 Label smoothing applied: {LABEL_SMOOTHING}")

# Train-test split (stratified to maintain class balance)
Xa_tr, Xa_te, Xd_tr, Xd_te, y_tr, y_te, y_tr_orig, y_te_orig = train_test_split(
    X_analog, X_mfcc, y_cat, y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

print(f"\n📈 Training set: {len(y_tr)}")
print(f"📉 Test set: {len(y_te)}")

# ================= BUILD HYBRID MODEL WITH TEMPERATURE SCALING =================
print("\n" + "="*60)
print("🏗️  BUILDING MODEL")
print("="*60)

# CNN Branch
analog_input = Input(shape=(ANALOG_LEN, 1))
x = Conv1D(64, 5, activation='relu', padding='same')(analog_input)
x = BatchNormalization()(x)
x = MaxPooling1D(2)(x)
x = Conv1D(128, 3, activation='relu', padding='same')(x)
x = BatchNormalization()(x)
x = MaxPooling1D(2)(x)
x = GlobalAveragePooling1D()(x)
x = Dense(64, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.3)(x)

# LSTM Branch
digital_input = Input(shape=(MFCC_LEN, N_MFCC))
y_l = LSTM(64)(digital_input)
y_l = Dense(64, activation='relu')(y_l)
y_l = BatchNormalization()(y_l)

# Fusion
combined = Concatenate()([x, y_l])
z = Dense(64, activation='relu')(combined)
z = Dropout(0.4)(z)

# Output with temperature scaling
# Instead of direct softmax, we'll divide logits by temperature
logits = Dense(2, activation='linear')(z)  # Linear activation for logits

# Temperature scaling layer
def temperature_scale(logits, temperature=TEMPERATURE):
    """Apply temperature scaling to logits before softmax"""
    return tf.nn.softmax(logits / temperature)

output = Lambda(lambda x: temperature_scale(x, TEMPERATURE))(logits)

model = Model([analog_input, digital_input], output)

# ================= COMPILE =================
model.compile(
    optimizer=tf.keras.optimizers.Adam(0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("\n✅ Model architecture:")
model.summary()

# ================= TRAIN =================
print("\n" + "="*60)
print("🎓 TRAINING MODEL")
print("="*60)

history = model.fit(
    [Xa_tr, Xd_tr], y_tr,
    epochs=50,
    batch_size=32,
    validation_split=0.15,
    class_weight=class_weight_dict,  # Apply class weights
    callbacks=[
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=7,
            restore_best_weights=True,
            verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            verbose=1
        )
    ],
    verbose=1
)

# ================= EVALUATE =================
print("\n" + "="*60)
print("📊 EVALUATION")
print("="*60)

# Make predictions
pred = model.predict([Xa_te, Xd_te], verbose=0)
pred_cls = np.argmax(pred, axis=1)
true_cls = y_te_orig  # Use original labels, not smoothed

print("\n📋 Classification Report:")
print(classification_report(
    true_cls, pred_cls,
    target_names=['NORMAL', 'ABNORMAL'],
    digits=4
))

# Confusion matrix
cm = confusion_matrix(true_cls, pred_cls)
print("\n🔢 Confusion Matrix:")
print(f"              Predicted")
print(f"              NORMAL  ABNORMAL")
print(f"Actual NORMAL    {cm[0][0]:4d}    {cm[0][1]:4d}")
print(f"       ABNORMAL  {cm[1][0]:4d}    {cm[1][1]:4d}")

# Confidence analysis
print("\n🎯 Confidence Analysis:")
confidences = np.max(pred, axis=1) * 100
print(f"   Average confidence: {np.mean(confidences):.2f}%")
print(f"   Min confidence: {np.min(confidences):.2f}%")
print(f"   Max confidence: {np.max(confidences):.2f}%")
print(f"   Std confidence: {np.std(confidences):.2f}%")

# Per-class confidence
normal_mask = true_cls == 0
abnormal_mask = true_cls == 1
print(f"\n   NORMAL predictions:")
print(f"      Mean confidence: {np.mean(confidences[normal_mask]):.2f}%")
print(f"   ABNORMAL predictions:")
print(f"      Mean confidence: {np.mean(confidences[abnormal_mask]):.2f}%")

# Check if model predicts both classes
unique_preds = np.unique(pred_cls)
print(f"\n✅ Model predicts {len(unique_preds)} classes: {unique_preds}")
if len(unique_preds) < 2:
    print("⚠️  WARNING: Model only predicts one class! Check training data or model architecture.")

# ================= SAVE MODEL =================
print("\n" + "="*60)
print("💾 SAVING MODEL")
print("="*60)

model_filename = "hybrid_cnn_lstm_heart_sound_calibrated.h5"
model.save(model_filename)
print(f"✅ Model saved as: {model_filename}")

# Save temperature parameter
np.save("temperature_value.npy", TEMPERATURE)
print(f"✅ Temperature value saved: {TEMPERATURE}")

# Save training history
np.save("training_history.npy", history.history)
print("✅ Training history saved")

print("\n" + "="*60)
print("🎉 TRAINING COMPLETE!")
print("="*60)
print(f"""
📌 Key Improvements Applied:
   ✅ Temperature Scaling: T={TEMPERATURE} (reduces overconfidence)
   ✅ Label Smoothing: {LABEL_SMOOTHING} (prevents 100% confidence)
   ✅ Class Weights: Balanced training
   ✅ Early Stopping: Prevents overfitting
   ✅ Learning Rate Reduction: Adaptive learning

🔍 Next Steps:
   1. Use 'hybrid_cnn_lstm_heart_sound_calibrated.h5' for inference
   2. Apply temperature={TEMPERATURE} during prediction
   3. Expected confidence range: 75-95%
""")
