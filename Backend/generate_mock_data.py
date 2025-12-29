"""Generate realistic synthetic mock data for CX Anomaly Detector."""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

def generate_normal_interactions(n_samples, start_date):
    """Generate normal interaction records."""
    data = []
    current_date = start_date
    
    for i in range(n_samples):
        # Normal interactions have good metrics
        csat = np.random.normal(4.2, 0.5)  # Mean 4.2, std 0.5
        csat = np.clip(csat, 1.0, 5.0)
        
        ies = np.random.normal(78, 10)  # Mean 78, std 10
        ies = np.clip(ies, 0, 100)
        
        complaints = np.random.choice([0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 1)[0]  # 10% have 1 complaint
        
        aht_seconds = np.random.normal(320, 80)  # Mean 320s (~5 min), std 80s
        aht_seconds = max(120, aht_seconds)
        
        hold_time_seconds = np.random.normal(35, 20)  # Mean 35s, std 20s
        hold_time_seconds = max(0, hold_time_seconds)
        
        transfers = np.random.choice([0, 0, 0, 0, 0, 0, 0, 1], 1)[0]  # 12.5% have 1 transfer
        
        channel = np.random.choice(['voice', 'chat', 'email'], p=[0.6, 0.3, 0.1])
        language = np.random.choice(['en', 'es', 'fr', 'de'], p=[0.6, 0.2, 0.1, 0.1])
        queue = np.random.choice(['billing', 'support', 'sales'], p=[0.4, 0.5, 0.1])
        
        # Generate timestamp (business hours, weekdays)
        hour = np.random.randint(8, 18)
        minute = np.random.randint(0, 60)
        second = np.random.randint(0, 60)
        timestamp = current_date.replace(hour=hour, minute=minute, second=second)
        
        data.append({
            'timestamp': timestamp.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'interaction_id': f'int_{i+1:04d}',
            'csat': round(csat, 1),
            'ies': round(ies, 1),
            'complaints': int(complaints),
            'aht_seconds': int(aht_seconds),
            'hold_time_seconds': int(hold_time_seconds),
            'transfers': int(transfers),
            'channel': channel,
            'language': language,
            'queue': queue
        })
        
        # Advance date randomly
        if i % 50 == 0:
            current_date += timedelta(days=1)
    
    return data

def generate_anomalous_interactions(n_samples, start_date, start_id):
    """Generate anomalous interaction records."""
    data = []
    current_date = start_date
    
    for i in range(n_samples):
        # Anomalous interactions have poor metrics
        anomaly_type = np.random.choice(['poor_csat', 'high_aht', 'multiple_issues'])
        
        if anomaly_type == 'poor_csat':
            # Very low satisfaction
            csat = np.random.uniform(1.0, 2.5)
            ies = np.random.uniform(30, 55)
            complaints = np.random.choice([1, 2, 2, 3])
            aht_seconds = np.random.uniform(400, 650)
            hold_time_seconds = np.random.uniform(60, 150)
            transfers = np.random.choice([1, 1, 2, 2, 3])
            
        elif anomaly_type == 'high_aht':
            # Excessive handle time
            csat = np.random.uniform(2.5, 3.5)
            ies = np.random.uniform(40, 60)
            complaints = np.random.choice([1, 2])
            aht_seconds = np.random.uniform(600, 900)
            hold_time_seconds = np.random.uniform(100, 200)
            transfers = np.random.choice([2, 2, 3, 3, 4])
            
        else:  # multiple_issues
            # Combination of bad metrics
            csat = np.random.uniform(1.5, 2.8)
            ies = np.random.uniform(25, 50)
            complaints = np.random.choice([2, 2, 3, 3, 4])
            aht_seconds = np.random.uniform(550, 800)
            hold_time_seconds = np.random.uniform(120, 220)
            transfers = np.random.choice([2, 3, 3, 4])
        
        channel = np.random.choice(['voice', 'chat', 'email'], p=[0.7, 0.25, 0.05])
        language = np.random.choice(['en', 'es', 'fr', 'de'], p=[0.6, 0.2, 0.1, 0.1])
        queue = np.random.choice(['billing', 'support', 'sales'], p=[0.5, 0.45, 0.05])
        
        # Generate timestamp
        hour = np.random.randint(8, 18)
        minute = np.random.randint(0, 60)
        second = np.random.randint(0, 60)
        timestamp = current_date.replace(hour=hour, minute=minute, second=second)
        
        data.append({
            'timestamp': timestamp.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'interaction_id': f'int_{start_id + i:04d}',
            'csat': round(csat, 1),
            'ies': round(ies, 1),
            'complaints': int(complaints),
            'aht_seconds': int(aht_seconds),
            'hold_time_seconds': int(hold_time_seconds),
            'transfers': int(transfers),
            'channel': channel,
            'language': language,
            'queue': queue
        })
        
        if i % 3 == 0:
            current_date += timedelta(days=1)
    
    return data

def generate_dataset(total_samples, contamination_rate, dataset_name, start_date):
    """Generate a complete dataset with specified contamination rate."""
    n_anomalies = int(total_samples * contamination_rate)
    n_normal = total_samples - n_anomalies
    
    print(f"Generating {dataset_name}:")
    print(f"  Total samples: {total_samples}")
    print(f"  Normal: {n_normal} ({100*(1-contamination_rate):.1f}%)")
    print(f"  Anomalies: {n_anomalies} ({100*contamination_rate:.1f}%)")
    
    # Generate data
    normal_data = generate_normal_interactions(n_normal, start_date)
    anomaly_data = generate_anomalous_interactions(n_anomalies, start_date, n_normal + 1)
    
    # Combine and shuffle
    all_data = normal_data + anomaly_data
    df = pd.DataFrame(all_data)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Update interaction IDs to be sequential after shuffle
    df['interaction_id'] = [f'{dataset_name[:3]}_{i+1:04d}' for i in range(len(df))]
    
    return df

# Generate training data
print("="*60)
train_df = generate_dataset(
    total_samples=1000,
    contamination_rate=0.07,  # 7% contamination
    dataset_name='train',
    start_date=datetime(2025, 1, 1, 8, 0, 0)
)

# Save training data
train_path = 'data/input/mock_train.csv'
train_df.to_csv(train_path, index=False)
print(f"\nSaved to: {train_path}")
print(f"Shape: {train_df.shape}")
print(f"\nSample statistics:")
print(f"  CSAT: {train_df['csat'].mean():.2f} ± {train_df['csat'].std():.2f}")
print(f"  IES: {train_df['ies'].mean():.2f} ± {train_df['ies'].std():.2f}")
print(f"  AHT: {train_df['aht_seconds'].mean():.0f}s ± {train_df['aht_seconds'].std():.0f}s")

print("\n" + "="*60)

# Generate inference data
inference_df = generate_dataset(
    total_samples=1000,
    contamination_rate=0.05,  # 5% contamination
    dataset_name='inference',
    start_date=datetime(2025, 2, 1, 8, 0, 0)
)

# Save inference data
inference_path = 'data/input/mock_inference.csv'
inference_df.to_csv(inference_path, index=False)
print(f"\nSaved to: {inference_path}")
print(f"Shape: {inference_df.shape}")
print(f"\nSample statistics:")
print(f"  CSAT: {inference_df['csat'].mean():.2f} ± {inference_df['csat'].std():.2f}")
print(f"  IES: {inference_df['ies'].mean():.2f} ± {inference_df['ies'].std():.2f}")
print(f"  AHT: {inference_df['aht_seconds'].mean():.0f}s ± {inference_df['aht_seconds'].std():.0f}s")

print("\n" + "="*60)
print("Mock data generation complete!")
print("="*60)
