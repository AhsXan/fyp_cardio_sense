"""
Seed Script - Add sample datasets for testing
Run this after starting the backend to add test datasets
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.dataset import Dataset, DatasetStatus

def seed_datasets():
    db = SessionLocal()
    
    try:
        # Check if datasets already exist
        existing = db.query(Dataset).count()
        if existing > 0:
            print(f"✅ {existing} datasets already exist in database")
            return
        
        # Create sample datasets
        datasets = [
            Dataset(
                name="Cardiac Sound Dataset 2024",
                description="Anonymized PCG recordings from 1000 patients with various cardiac conditions",
                status=DatasetStatus.AVAILABLE,
                total_samples=1000,
                file_path="/datasets/cardiac_sounds_2024.zip",
                requires_approval=1
            ),
            Dataset(
                name="ECG Analysis Dataset",
                description="ECG data with expert annotations and diagnostic labels",
                status=DatasetStatus.AVAILABLE,
                total_samples=500,
                file_path="/datasets/ecg_analysis.zip",
                requires_approval=1
            ),
            Dataset(
                name="Long-term Monitoring Dataset",
                description="24-hour continuous cardiac monitoring data from clinical studies",
                status=DatasetStatus.AVAILABLE,
                total_samples=200,
                file_path="/datasets/long_term_monitoring.zip",
                requires_approval=1
            ),
            Dataset(
                name="Pediatric Cardiac Sounds",
                description="Specialized dataset of heart sounds from pediatric patients",
                status=DatasetStatus.RESTRICTED,
                total_samples=300,
                file_path="/datasets/pediatric_cardiac.zip",
                requires_approval=1
            )
        ]
        
        for dataset in datasets:
            db.add(dataset)
        
        db.commit()
        print(f"\n✅ Successfully added {len(datasets)} sample datasets!")
        print("\nDatasets added:")
        for ds in datasets:
            print(f"  - {ds.name} ({ds.total_samples} samples, {ds.status.value})")
        
    except Exception as e:
        print(f"\n❌ Error seeding datasets: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("📊 SEEDING DATASETS")
    print("=" * 60 + "\n")
    seed_datasets()
    print("\n" + "=" * 60 + "\n")
