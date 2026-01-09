"""
AI Service for Heart Sound Classification with Confidence Calibration
Handles PCG audio file processing and prediction using the trained model with temperature scaling
"""
import numpy as np
import librosa
import scipy.signal as signal
from scipy.signal import resample
import os
import tensorflow as tf
from typing import Tuple, Dict

class HeartSoundClassifierCalibrated:
    """
    Heart Sound Classification Service with Confidence Calibration
    Uses Temperature Scaling to prevent overconfident predictions
    """
    
    # Model Configuration
    FS_TARGET = 2000       # Sampling rate
    DURATION = 3.0         # seconds
    ANALOG_LEN = 250       # CNN input length
    MFCC_LEN = 38          # LSTM input length (time frames)
    N_MFCC = 20            # Number of MFCC coefficients
    
    # Calibration parameters
    TEMPERATURE = 2.5      # Temperature for softmax scaling (reduces overconfidence)
    
    def __init__(self, model_path: str, temperature: float = None):
        """
        Initialize the classifier with a trained model
        
        Args:
            model_path: Path to the trained .h5 model file
            temperature: Temperature scaling factor (default: 2.5)
        """
        if temperature is not None:
            self.TEMPERATURE = temperature
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        print(f"Loading AI model from: {model_path}")
        print(f"Temperature scaling: {self.TEMPERATURE}")
        
        # Build model architecture first
        print("Building model architecture...")
        self.model = self._build_model()
        
        # Load weights from the H5 file
        try:
            print("Loading model weights...")
            self.model.load_weights(model_path)
            print("✅ Model weights loaded successfully!")
            print(f"🌡️  Confidence calibration enabled (T={self.TEMPERATURE})")
            
        except Exception as e:
            print(f"❌ Failed to load weights: {str(e)}")
            raise Exception(f"Model weight loading failed: {str(e)}")
    
    def _build_model(self) -> tf.keras.Model:
        """
        Build the Hybrid CNN+LSTM model architecture with temperature scaling
        
        Returns:
            Compiled Keras model
        """
        from tensorflow.keras.layers import (
            Input, Conv1D, MaxPooling1D, LSTM,
            Dense, Dropout, BatchNormalization, 
            GlobalAveragePooling1D, Concatenate, Lambda
        )
        from tensorflow.keras.models import Model
        
        # CNN Branch (Analog Input)
        analog_input = Input(shape=(self.ANALOG_LEN, 1), name='analog_input')
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
        
        # LSTM Branch (MFCC Input)
        digital_input = Input(shape=(self.MFCC_LEN, self.N_MFCC), name='digital_input')
        y_l = LSTM(64)(digital_input)
        y_l = Dense(64, activation='relu')(y_l)
        y_l = BatchNormalization()(y_l)
        
        # Fusion
        combined = Concatenate()([x, y_l])
        z = Dense(64, activation='relu')(combined)
        z = Dropout(0.4)(z)
        
        # Output layer - get logits first
        logits = Dense(2, activation='linear')(z)
        
        # Apply temperature scaling during inference
        # This will be applied in the predict method
        output = Lambda(lambda x: tf.nn.softmax(x))(logits)
        
        # Create model
        model = Model([analog_input, digital_input], output)
        
        # Compile
        model.compile(
            optimizer=tf.keras.optimizers.Adam(0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def preprocess_heart_sound(self, file_path: str) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess audio file for model input
        
        Args:
            file_path: Path to the WAV audio file
            
        Returns:
            Tuple of (analog_features, mfcc_features)
        """
        # Load audio
        audio, sr = librosa.load(file_path, sr=None)
        
        # Resample if needed
        if sr != self.FS_TARGET:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=self.FS_TARGET)
        
        # Pad or trim to fixed duration
        max_len = int(self.FS_TARGET * self.DURATION)
        if len(audio) > max_len:
            audio = audio[:max_len]
        else:
            audio = np.pad(audio, (0, max_len - len(audio)))
        
        # ==================== Analog Branch (CNN Input) ====================
        # Apply bandpass filter (20-400 Hz)
        b, a = signal.butter(4, [20/(self.FS_TARGET/2), 400/(self.FS_TARGET/2)], btype='band')
        analog = signal.filtfilt(b, a, audio)
        
        # Resample to ANALOG_LEN and reshape for CNN
        analog = resample(analog, self.ANALOG_LEN).reshape(1, self.ANALOG_LEN, 1)
        
        # ==================== MFCC Branch (LSTM Input) ====================
        # Extract MFCC features
        mfcc = librosa.feature.mfcc(y=audio, sr=self.FS_TARGET, n_mfcc=self.N_MFCC).T
        
        # Pad or trim to MFCC_LEN
        if mfcc.shape[0] > self.MFCC_LEN:
            mfcc = mfcc[:self.MFCC_LEN]
        elif mfcc.shape[0] < self.MFCC_LEN:
            mfcc = np.pad(mfcc, ((0, self.MFCC_LEN - mfcc.shape[0]), (0, 0)))
        
        mfcc = mfcc.reshape(1, self.MFCC_LEN, self.N_MFCC)
        
        return analog, mfcc
    
    def _apply_temperature_scaling(self, logits: np.ndarray) -> np.ndarray:
        """
        Apply temperature scaling to logits to calibrate confidence
        
        Args:
            logits: Raw model outputs before softmax
            
        Returns:
            Calibrated probabilities
        """
        # Scale logits by temperature
        scaled_logits = logits / self.TEMPERATURE
        
        # Apply softmax
        exp_logits = np.exp(scaled_logits - np.max(scaled_logits, axis=1, keepdims=True))
        probabilities = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
        
        return probabilities
    
    def predict(self, file_path: str) -> Dict[str, any]:
        """
        Predict heart sound classification with calibrated confidence
        
        Args:
            file_path: Path to the WAV audio file
            
        Returns:
            Dictionary with prediction results:
            {
                "label": "NORMAL" or "ABNORMAL",
                "confidence": float (0-100),
                "probabilities": {
                    "normal": float,
                    "abnormal": float
                },
                "calibrated": True
            }
        """
        try:
            # Preprocess audio
            analog, mfcc = self.preprocess_heart_sound(file_path)
            
            # Get model predictions (these are already softmax outputs)
            raw_prediction = self.model.predict([analog, mfcc], verbose=0)
            
            # Convert softmax back to logits for temperature scaling
            # logit(p) = log(p / (1-p)) for binary case, or use log(p) directly
            epsilon = 1e-7  # Prevent log(0)
            raw_prediction = np.clip(raw_prediction, epsilon, 1 - epsilon)
            logits = np.log(raw_prediction)
            
            # Apply temperature scaling
            calibrated_pred = self._apply_temperature_scaling(logits)
            
            # Get class and confidence
            cls = int(np.argmax(calibrated_pred[0]))
            confidence = float(calibrated_pred[0][cls]) * 100
            
            # Get probabilities for both classes
            prob_normal = float(calibrated_pred[0][0]) * 100
            prob_abnormal = float(calibrated_pred[0][1]) * 100
            
            label = "NORMAL" if cls == 0 else "ABNORMAL"
            
            result = {
                "label": label,
                "confidence": round(confidence, 2),
                "probabilities": {
                    "normal": round(prob_normal, 2),
                    "abnormal": round(prob_abnormal, 2)
                },
                "calibrated": True,
                "temperature": self.TEMPERATURE
            }
            
            print(f"🔬 Prediction: {label} (Confidence: {confidence:.2f}%)")
            print(f"   📊 NORMAL: {prob_normal:.2f}% | ABNORMAL: {prob_abnormal:.2f}%")
            
            return result
            
        except Exception as e:
            print(f"❌ Prediction error: {str(e)}")
            raise Exception(f"Failed to process audio file: {str(e)}")


# Singleton instance
_classifier_instance = None

def get_classifier_calibrated(model_path: str = None, temperature: float = 2.5) -> HeartSoundClassifierCalibrated:
    """
    Get or create the calibrated classifier instance
    
    Args:
        model_path: Path to the model file (only needed on first call)
        temperature: Temperature scaling factor (default: 2.5)
        
    Returns:
        HeartSoundClassifierCalibrated instance
    """
    global _classifier_instance
    
    if _classifier_instance is None:
        if model_path is None:
            # Default model path
            model_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                "ai",
                "hybrid_cnn_lstm_heart_sound_final.h5"
            )
        _classifier_instance = HeartSoundClassifierCalibrated(model_path, temperature)
    
    return _classifier_instance
