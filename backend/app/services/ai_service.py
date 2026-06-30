"""
Lightweight AI service fallback for EC2 deployment.

The real TensorFlow model code is kept below as commented reference. The active
service intentionally avoids tensorflow/librosa/scipy/numpy imports so a small
EC2 instance can install and run the backend without getting stuck on ML wheels.
"""
from typing import Dict


class HeartSoundClassifier:
    """
    Drop-in classifier used while TensorFlow inference is disabled.

    It returns the same response shape as the real model, so uploads, dashboards,
    result pages, and PDF reports keep working without special frontend handling.
    """

    FS_TARGET = 2000
    DURATION = 3.0
    ANALOG_LEN = 250
    MFCC_LEN = 38
    N_MFCC = 20
    MODEL_MODE = "fallback"

    def __init__(self, model_path: str = None):
        self.model_path = model_path

    def predict(self, file_path: str) -> Dict[str, object]:
        print(f"AI fallback active. Returning demo result for: {file_path}")
        return {
            "label": "NORMAL",
            "confidence": 100.0,
            "probabilities": {
                "normal": 100.0,
                "abnormal": 0.0,
            },
            "mode": self.MODEL_MODE,
        }


_classifier_instance = None


def get_classifier(model_path: str = None) -> HeartSoundClassifier:
    """
    Return the lightweight fallback classifier.

    To restore real model inference later, install the optional AI dependencies
    in requirements.txt and uncomment the TensorFlow reference implementation
    below.
    """
    global _classifier_instance

    if _classifier_instance is None:
        _classifier_instance = HeartSoundClassifier(model_path)

    return _classifier_instance


# ============================================================================
# TensorFlow implementation reference
# ============================================================================
# Kept here intentionally so the real model path can be restored later.
# This block is commented out for small EC2 deployments.
#
# import numpy as np
# import librosa
# import scipy.signal as signal
# from scipy.signal import resample
# import os
# import tensorflow as tf
# from typing import Tuple, Dict
#
#
# class TensorFlowHeartSoundClassifier:
#     """
#     Heart Sound Classification Service using Hybrid CNN+LSTM Model
#     WITH CONFIDENCE CALIBRATION via Temperature Scaling
#     """
#
#     FS_TARGET = 2000       # Sampling rate
#     DURATION = 3.0         # seconds
#     ANALOG_LEN = 250       # CNN input length
#     MFCC_LEN = 38          # LSTM input length (time frames)
#     N_MFCC = 20            # Number of MFCC coefficients
#     TEMPERATURE = 5.0      # Higher T = more conservative confidence
#
#     def __init__(self, model_path: str):
#         if not os.path.exists(model_path):
#             raise FileNotFoundError(f"Model file not found: {model_path}")
#
#         print(f"Loading AI model from: {model_path}")
#         print("Building model architecture...")
#         self.model = self._build_model()
#
#         try:
#             print("Loading model weights...")
#             self.model.load_weights(model_path)
#             print("Model weights loaded successfully!")
#         except Exception as e:
#             print(f"Failed to load weights: {str(e)}")
#             raise Exception(f"Model weight loading failed: {str(e)}")
#
#     def _build_model(self):
#         from tensorflow.keras.layers import (
#             Input, Conv1D, MaxPooling1D, LSTM,
#             Dense, Dropout, BatchNormalization,
#             GlobalAveragePooling1D, Concatenate
#         )
#         from tensorflow.keras.models import Model
#
#         analog_input = Input(shape=(self.ANALOG_LEN, 1), name='analog_input')
#         x = Conv1D(64, 5, activation='relu', padding='same')(analog_input)
#         x = BatchNormalization()(x)
#         x = MaxPooling1D(2)(x)
#         x = Conv1D(128, 3, activation='relu', padding='same')(x)
#         x = BatchNormalization()(x)
#         x = MaxPooling1D(2)(x)
#         x = GlobalAveragePooling1D()(x)
#         x = Dense(64, activation='relu')(x)
#         x = BatchNormalization()(x)
#         x = Dropout(0.3)(x)
#
#         digital_input = Input(shape=(self.MFCC_LEN, self.N_MFCC), name='digital_input')
#         y_l = LSTM(64)(digital_input)
#         y_l = Dense(64, activation='relu')(y_l)
#         y_l = BatchNormalization()(y_l)
#
#         combined = Concatenate()([x, y_l])
#         z = Dense(64, activation='relu')(combined)
#         z = Dropout(0.4)(z)
#         output = Dense(2, activation='softmax')(z)
#
#         model = Model([analog_input, digital_input], output)
#         model.compile(
#             optimizer=tf.keras.optimizers.Adam(0.001),
#             loss='categorical_crossentropy',
#             metrics=['accuracy']
#         )
#         return model
#
#     def preprocess_heart_sound(self, file_path: str):
#         audio, sr = librosa.load(file_path, sr=None)
#
#         if sr != self.FS_TARGET:
#             audio = librosa.resample(audio, orig_sr=sr, target_sr=self.FS_TARGET)
#
#         max_len = int(self.FS_TARGET * self.DURATION)
#         if len(audio) > max_len:
#             audio = audio[:max_len]
#         else:
#             audio = np.pad(audio, (0, max_len - len(audio)))
#
#         b, a = signal.butter(4, [20/(self.FS_TARGET/2), 400/(self.FS_TARGET/2)], btype='band')
#         analog = signal.filtfilt(b, a, audio)
#         analog = resample(analog, self.ANALOG_LEN).reshape(1, self.ANALOG_LEN, 1)
#
#         mfcc = librosa.feature.mfcc(y=audio, sr=self.FS_TARGET, n_mfcc=self.N_MFCC).T
#         if mfcc.shape[0] > self.MFCC_LEN:
#             mfcc = mfcc[:self.MFCC_LEN]
#         elif mfcc.shape[0] < self.MFCC_LEN:
#             mfcc = np.pad(mfcc, ((0, self.MFCC_LEN - mfcc.shape[0]), (0, 0)))
#
#         mfcc = mfcc.reshape(1, self.MFCC_LEN, self.N_MFCC)
#         return analog, mfcc
#
#     def predict(self, file_path: str):
#         try:
#             analog, mfcc = self.preprocess_heart_sound(file_path)
#             raw_prediction = self.model.predict([analog, mfcc], verbose=0)
#
#             epsilon = 1e-7
#             raw_prediction = np.clip(raw_prediction, epsilon, 1 - epsilon)
#             logits = np.log(raw_prediction)
#             scaled_logits = logits / self.TEMPERATURE
#             exp_logits = np.exp(scaled_logits - np.max(scaled_logits, axis=1, keepdims=True))
#             calibrated_pred = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
#             calibrated_pred = calibrated_pred[0]
#
#             cls = int(np.argmax(calibrated_pred))
#             confidence = float(calibrated_pred[cls]) * 100
#             prob_normal = float(calibrated_pred[0]) * 100
#             prob_abnormal = float(calibrated_pred[1]) * 100
#             label = "NORMAL" if cls == 0 else "ABNORMAL"
#
#             return {
#                 "label": label,
#                 "confidence": round(confidence, 2),
#                 "probabilities": {
#                     "normal": round(prob_normal, 2),
#                     "abnormal": round(prob_abnormal, 2)
#                 }
#             }
#         except Exception as e:
#             raise Exception(f"Failed to process audio file: {str(e)}")
#
#
# def get_tensorflow_classifier(model_path: str = None):
#     global _classifier_instance
#
#     if _classifier_instance is None:
#         if model_path is None:
#             model_path = os.path.join(
#                 os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
#                 "AI",
#                 "hybrid_cnn_lstm_heart_sound_final.h5"
#             )
#         _classifier_instance = TensorFlowHeartSoundClassifier(model_path)
#
#     return _classifier_instance
