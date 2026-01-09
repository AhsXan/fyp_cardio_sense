"""
Quick script to check class balance in training data
"""
import os

DATA_DIR = r"C:\Users\Raja\Desktop\Dataset"

if os.path.exists(DATA_DIR):
    print("\n" + "="*60)
    print("📊 CHECKING CLASS BALANCE IN TRAINING DATA")
    print("="*60)
    
    normal_count = 0
    abnormal_count = 0
    
    for label_folder in os.listdir(DATA_DIR):
        label_path = os.path.join(DATA_DIR, label_folder)
        if os.path.isdir(label_path):
            wav_files = [f for f in os.listdir(label_path) if f.lower().endswith('.wav')]
            count = len(wav_files)
            
            if label_folder.lower() == "normal":
                normal_count = count
                print(f"✅ NORMAL folder: {count} files")
            else:
                abnormal_count += count
                print(f"⚠️  {label_folder} folder: {count} files")
    
    print("\n" + "="*60)
    print(f"📊 TOTAL SAMPLES:")
    print(f"   NORMAL: {normal_count}")
    print(f"   ABNORMAL: {abnormal_count}")
    
    if normal_count == 0:
        print("\n❌ PROBLEM FOUND: NO NORMAL SAMPLES!")
        print("   This is why the model only predicts ABNORMAL.")
        print("   Solution: Add NORMAL samples to training data")
    elif abnormal_count == 0:
        print("\n❌ PROBLEM FOUND: NO ABNORMAL SAMPLES!")
    else:
        ratio = max(normal_count, abnormal_count) / min(normal_count, abnormal_count)
        print(f"\n⚖️  Imbalance Ratio: {ratio:.2f}:1")
        
        if ratio > 3.0:
            print("⚠️  SEVERE IMBALANCE DETECTED!")
            print("   The model will be biased towards the majority class.")
            print("   Solution: Retrain with class_weight balancing")
        elif ratio > 2.0:
            print("⚠️  MODERATE IMBALANCE")
            print("   Recommend retraining with class weights")
        else:
            print("✅ Classes are reasonably balanced")
    
    print("="*60)
else:
    print(f"\n❌ Data directory not found: {DATA_DIR}")
    print("   Please update DATA_DIR path in this script")
