#!/usr/bin/env python3
"""
AgriForecasting - Historical Price Observations Batch Ingestion Script
Streams and ingests 1,171,101 historical price records into PostgreSQL table price_observations.
Deduplicates on (mandi_id, commodity_id, variety_id, observation_date).
Uses PostgreSQL COPY expert for sub-10s high performance ingestion.
"""

import os
import sys
import re
import io
import time
import json
import psycopg2
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.ingest_national_geography import STATE_MAP, slugify

CROPS_FILE = "/Users/karthikreddy/Desktop/Hybrid-AgriPrice-Forecaster/Modules/Price_LGBM/MandiPricePredictionSystem/DataScraping/CropData/ALL_CROPS_DATA.csv"

DB_CONFIG = {
    "dbname": os.environ.get("POSTGRES_DB", "agriforecasting"),
    "user": os.environ.get("POSTGRES_USER", "postgres"),
    "password": os.environ.get("POSTGRES_PASSWORD", "postgres"),
    "host": os.environ.get("POSTGRES_HOST", "localhost"),
    "port": int(os.environ.get("POSTGRES_PORT", 5432)),
}

def main():
    print("=== AgriForecasting Historical Prices Ingestion ===")
    t_start = time.time()
    
    print(f"Connecting to PostgreSQL {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # 1. Fetch Mandi lookup
    print("Fetching Mandi lookup from DB...")
    cur.execute("SELECT id, state_id, name FROM mandis;")
    mandi_rows = cur.fetchall()
    mandi_map = {}
    for mid, sid, mname in mandi_rows:
        clean_n = re.sub(r'\s+', ' ', mname).strip().lower()
        mandi_map[(sid, clean_n)] = mid
    print(f"Loaded {len(mandi_map)} mandis into lookup map.")

    # 2. Read ALL_CROPS_DATA.csv
    print(f"Reading {CROPS_FILE}...")
    df = pd.read_csv(
        CROPS_FILE,
        usecols=['date', 'Commodity', 'State', 'Mandi', 'Variety', 'ModalPrice', 'MinPrice', 'MaxPrice', 'Arrivals']
    )
    total_source_rows = len(df)
    print(f"Total source rows read: {total_source_rows}")

    # 3. Transform & Map
    print("Mapping canonical IDs...")
    df['State_Clean'] = df['State'].astype(str).apply(lambda s: re.sub(r'\s+', ' ', s).strip())
    df['Mandi_Clean'] = df['Mandi'].astype(str).apply(lambda s: re.sub(r'\s+', ' ', s).strip().lower())
    df['sid'] = df['State_Clean'].apply(lambda s: STATE_MAP[s]['id'] if s in STATE_MAP else slugify(s)[:3])
    
    # Fast vectorized map
    keys = list(zip(df['sid'], df['Mandi_Clean']))
    df['mandi_id'] = [mandi_map[k] for k in keys]
    
    df['commodity_id'] = df['Commodity'].astype(str).apply(slugify)
    df['variety_id'] = df['commodity_id'] + '-' + df['Variety'].astype(str).apply(slugify)
    df['observation_date'] = df['date']
    df['min_price'] = pd.to_numeric(df['MinPrice'], errors='coerce').fillna(0.0)
    df['max_price'] = pd.to_numeric(df['MaxPrice'], errors='coerce').fillna(0.0)
    df['modal_price'] = pd.to_numeric(df['ModalPrice'], errors='coerce').fillna(0.0)
    df['arrivals'] = pd.to_numeric(df['Arrivals'], errors='coerce').fillna(0.0)

    # 4. Deduplicate
    print("Deduplicating duplicate transaction records...")
    df_dedup = df.drop_duplicates(
        subset=['mandi_id', 'commodity_id', 'variety_id', 'observation_date'],
        keep='last'
    )
    unique_rows = len(df_dedup)
    duplicates_dropped = total_source_rows - unique_rows
    print(f"Unique records to insert: {unique_rows}")
    print(f"Duplicate records dropped: {duplicates_dropped}")

    # Prepare export dataframe
    export_df = df_dedup[[
        'mandi_id', 'commodity_id', 'variety_id', 'observation_date',
        'min_price', 'max_price', 'modal_price', 'arrivals'
    ]]

    # 5. Drop indexes for ultra-fast COPY
    print("Dropping existing indexes on price_observations for fast bulk load...")
    cur.execute("DROP INDEX IF EXISTS idx_obs_mandi_commodity;")
    cur.execute("DROP INDEX IF EXISTS idx_obs_mandi_comm_var_date;")
    cur.execute("DROP INDEX IF EXISTS idx_obs_date;")
    cur.execute("TRUNCATE TABLE price_observations;")
    conn.commit()

    # 6. Stream COPY via TSV
    print("Streaming records into PostgreSQL via COPY expert...")
    t_copy_start = time.time()
    
    # Convert dataframe to in-memory TSV buffer
    buffer = io.StringIO()
    export_df.to_csv(buffer, sep='\t', index=False, header=False)
    buffer.seek(0)
    
    copy_sql = """
        COPY price_observations (
            mandi_id, commodity_id, variety_id, observation_date,
            min_price, max_price, modal_price, arrivals
        ) FROM STDIN WITH (FORMAT csv, DELIMITER E'\t');
    """
    cur.copy_expert(sql=copy_sql, file=buffer)
    conn.commit()
    t_copy_end = time.time()
    print(f"COPY completed in {t_copy_end - t_copy_start:.2f} seconds!")

    # 7. Re-create indexes
    print("Re-creating indexes on price_observations...")
    t_idx_start = time.time()
    cur.execute("CREATE INDEX idx_obs_mandi_commodity ON price_observations(mandi_id, commodity_id, observation_date);")
    cur.execute("CREATE INDEX idx_obs_mandi_comm_var_date ON price_observations(mandi_id, commodity_id, variety_id, observation_date);")
    cur.execute("CREATE INDEX idx_obs_date ON price_observations(observation_date);")
    conn.commit()
    t_idx_end = time.time()
    print(f"Indexes created in {t_idx_end - t_idx_start:.2f} seconds.")

    # 8. Verification & Stats
    cur.execute("SELECT COUNT(*) FROM price_observations;")
    inserted_count = cur.fetchone()[0]
    cur.execute("SELECT MIN(observation_date), MAX(observation_date) FROM price_observations;")
    min_date, max_date = cur.fetchone()
    cur.execute("SELECT COUNT(DISTINCT mandi_id) FROM price_observations;")
    mandis_with_prices = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT commodity_id) FROM price_observations;")
    commodities_with_prices = cur.fetchone()[0]

    t_total = time.time() - t_start
    print("\n--- Price Observations Ingestion Summary ---")
    print(f"Total Source Rows:       {total_source_rows}")
    print(f"Duplicates Deduplicated: {duplicates_dropped}")
    print(f"Total Inserted Rows:     {inserted_count}")
    print(f"Date Range:              {min_date} to {max_date}")
    print(f"Mandis with Prices:      {mandis_with_prices}")
    print(f"Commodities with Prices: {commodities_with_prices}")
    print(f"Total Execution Time:    {t_total:.2f} seconds")

    recon = {
        "total_source_rows": total_source_rows,
        "duplicates_dropped": duplicates_dropped,
        "total_inserted_rows": inserted_count,
        "min_observation_date": str(min_date),
        "max_observation_date": str(max_date),
        "mandis_with_prices": mandis_with_prices,
        "commodities_with_prices": commodities_with_prices,
        "execution_time_seconds": round(t_total, 2)
    }
    with open("/Users/karthikreddy/Desktop/Agri/scripts/price_reconciliation.json", "w") as f:
        json.dump(recon, f, indent=2)
    print("Reconciliation report saved to scripts/price_reconciliation.json")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
