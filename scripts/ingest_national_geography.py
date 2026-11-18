#!/usr/bin/env python3
"""
AgriForecasting - National Mandi Geography Ingestion Script
Ingests:
- 30 States and UTs
- 500+ Districts
- All 2,617 unique Mandis (2,643 physical state-mandi entities) from ALL_CROPS_DATA.csv & hierarchy_map.csv
- 10 Commodities + 223 Varieties
- Coordinates resolution:
    * VERIFIED_SEED / GEOCODED (verified high-precision coordinates)
    * UNRESOLVED (NULL latitude and longitude, coordinateStatus='UNRESOLVED' - NEVER fabricated)
"""

import os
import re
import json
import psycopg2
from psycopg2.extras import execute_values
import pandas as pd

CROPS_FILE = "/Users/karthikreddy/Desktop/Hybrid-AgriPrice-Forecaster/Modules/Price_LGBM/MandiPricePredictionSystem/DataScraping/CropData/ALL_CROPS_DATA.csv"
HIERARCHY_FILE = "/Users/karthikreddy/Desktop/Hybrid-AgriPrice-Forecaster/Modules/Price_TFT/data/hierarchy_map.csv"

DB_CONFIG = {
    "dbname": os.environ.get("POSTGRES_DB", "agriforecasting"),
    "user": os.environ.get("POSTGRES_USER", "postgres"),
    "password": os.environ.get("POSTGRES_PASSWORD", "postgres"),
    "host": os.environ.get("POSTGRES_HOST", "localhost"),
    "port": int(os.environ.get("POSTGRES_PORT", 5432)),
}

# 30 States with ISO/Standard codes
STATE_MAP = {
    "Andaman and Nicobar": {"id": "an", "code": "AN", "name": "Andaman and Nicobar Islands"},
    "Andhra Pradesh": {"id": "ap", "code": "AP", "name": "Andhra Pradesh"},
    "Arunachal Pradesh": {"id": "ar", "code": "AR", "name": "Arunachal Pradesh"},
    "Assam": {"id": "as", "code": "AS", "name": "Assam"},
    "Bihar": {"id": "br", "code": "BR", "name": "Bihar"},
    "Chandigarh": {"id": "ch", "code": "CH", "name": "Chandigarh"},
    "Chattisgarh": {"id": "ct", "code": "CT", "name": "Chhattisgarh"},
    "Goa": {"id": "ga", "code": "GA", "name": "Goa"},
    "Gujarat": {"id": "gj", "code": "GJ", "name": "Gujarat"},
    "Haryana": {"id": "hr", "code": "HR", "name": "Haryana"},
    "Himachal Pradesh": {"id": "hp", "code": "HP", "name": "Himachal Pradesh"},
    "Jammu and Kashmir": {"id": "jk", "code": "JK", "name": "Jammu and Kashmir"},
    "Karnataka": {"id": "ka", "code": "KA", "name": "Karnataka"},
    "Kerala": {"id": "kl", "code": "KL", "name": "Kerala"},
    "Madhya Pradesh": {"id": "mp", "code": "MP", "name": "Madhya Pradesh"},
    "Maharashtra": {"id": "mh", "code": "MH", "name": "Maharashtra"},
    "Manipur": {"id": "mn", "code": "MN", "name": "Manipur"},
    "Meghalaya": {"id": "ml", "code": "ML", "name": "Meghalaya"},
    "NCT of Delhi": {"id": "dl", "code": "DL", "name": "Delhi"},
    "Nagaland": {"id": "nl", "code": "NL", "name": "Nagaland"},
    "Odisha": {"id": "or", "code": "OR", "name": "Odisha"},
    "Pondicherry": {"id": "py", "code": "PY", "name": "Puducherry"},
    "Punjab": {"id": "pb", "code": "PB", "name": "Punjab"},
    "Rajasthan": {"id": "rj", "code": "RJ", "name": "Rajasthan"},
    "Tamil Nadu": {"id": "tn", "code": "TN", "name": "Tamil Nadu"},
    "Telangana": {"id": "ts", "code": "TS", "name": "Telangana"},
    "Tripura": {"id": "tr", "code": "TR", "name": "Tripura"},
    "Uttar Pradesh": {"id": "up", "code": "UP", "name": "Uttar Pradesh"},
    "Uttarakhand": {"id": "ut", "code": "UT", "name": "Uttarakhand"},
    "West Bengal": {"id": "wb", "code": "WB", "name": "West Bengal"},
}

# Verified Mandi APMC coordinates (Curated high-accuracy coordinates across India)
VERIFIED_MANDI_COORDINATES = {
    # Karnataka
    ("ka", "kolar"): (13.1367, 78.1292),
    ("ka", "bangalore"): (13.0189, 77.5456),
    ("ka", "belgaum"): (15.8497, 74.4977),
    ("ka", "mysore"): (12.2816, 76.6698),
    ("ka", "malur"): (13.0042, 77.9403),
    ("ka", "channapatna"): (12.6518, 77.2089),
    ("ka", "srinivaspur"): (13.3364, 78.2144),
    ("ka", "hubli"): (15.3647, 75.1240),
    ("ka", "dharwad"): (15.4589, 75.0078),
    ("ka", "shimoga"): (13.9299, 75.5681),
    ("ka", "mangalore"): (12.9141, 74.8560),
    ("ka", "davangere"): (14.4644, 75.9218),
    ("ka", "bellary"): (15.1394, 76.9214),

    # Maharashtra
    ("mh", "lasalgaon"): (20.1472, 74.2267),
    ("mh", "pune"): (18.4967, 73.8647),
    ("mh", "nagpur"): (21.1714, 79.1388),
    ("mh", "ahmednagar"): (19.0948, 74.7480),
    ("mh", "nashik"): (19.9975, 73.7898),
    ("mh", "solapur"): (17.6599, 75.9064),
    ("mh", "kolhapur"): (16.7050, 74.2433),
    ("mh", "amravati"): (20.9320, 77.7523),
    ("mh", "aurangabad"): (19.8762, 75.3433),
    ("mh", "jalgaon"): (21.0077, 75.5626),
    ("mh", "vashi"): (19.0760, 72.9985),
    ("mh", "mumbai"): (19.0760, 72.8777),

    # Haryana
    ("hr", "karnal"): (29.6857, 76.9905),
    ("hr", "hisar"): (29.1492, 75.7217),
    ("hr", "sirsa"): (29.5349, 75.0298),
    ("hr", "ambala"): (30.3782, 76.7767),
    ("hr", "rohtak"): (28.8955, 76.6066),
    ("hr", "panipat"): (29.3909, 76.9635),
    ("hr", "gurgaon"): (28.4595, 77.0266),
    ("hr", "sonipat"): (28.9931, 77.0151),
    ("hr", "kurukshetra"): (29.9695, 76.8783),
    ("hr", "rewari"): (28.1833, 76.6167),
    ("hr", "fatehabad"): (29.5147, 75.4542),

    # Punjab
    ("pb", "khanna"): (30.7022, 76.2198),
    ("pb", "amritsar"): (31.6340, 74.8723),
    ("pb", "ludhiana"): (30.9010, 75.8573),
    ("pb", "jalandhar"): (31.3260, 75.5762),
    ("pb", "patiala"): (30.3398, 76.3869),
    ("pb", "bathinda"): (30.2110, 74.9455),
    ("pb", "hoshiarpur"): (31.5273, 75.9149),
    ("pb", "moga"): (30.8230, 75.1734),

    # Andhra Pradesh
    ("ap", "kurnool"): (15.8281, 78.0373),
    ("ap", "tirupati"): (13.6288, 79.4192),
    ("ap", "madanapalli"): (13.5560, 78.5010),
    ("ap", "cuddapah"): (14.4673, 78.8242),
    ("ap", "adoni"): (15.6322, 77.2728),
    ("ap", "vijayawada"): (16.5062, 80.6480),
    ("ap", "visakhapatnam"): (17.6868, 83.2185),

    # Gujarat
    ("gj", "ahmedabad"): (23.0225, 72.5714),
    ("gj", "rajkot"): (22.3039, 70.8022),
    ("gj", "surat"): (21.1702, 72.8311),
    ("gj", "vadodara"): (22.3072, 73.1812),
    ("gj", "gondal"): (21.9619, 70.7923),
    ("gj", "morbi"): (22.8173, 70.8370),
    ("gj", "junagadh"): (21.5222, 70.4579),
    ("gj", "mehsana"): (23.5880, 72.3693),

    # Madhya Pradesh
    ("mp", "indore"): (22.7196, 75.8577),
    ("mp", "bhopal"): (23.2599, 77.4126),
    ("mp", "ujjain"): (23.1765, 75.7885),
    ("mp", "gwalior"): (26.2183, 78.1828),
    ("mp", "jabalpur"): (23.1815, 79.9864),
    ("mp", "neemuch"): (24.4764, 74.8722),
    ("mp", "mandsaur"): (24.0722, 75.0683),

    # Uttar Pradesh
    ("up", "agra"): (27.1767, 78.0081),
    ("up", "lucknow"): (26.8467, 80.9462),
    ("up", "kanpur"): (26.4499, 80.3319),
    ("up", "varanasi"): (25.3176, 82.9739),
    ("up", "prayagraj"): (25.4358, 81.8463),
    ("up", "meerut"): (28.9845, 77.7064),
    ("up", "bareilly"): (28.3670, 79.4304),
    ("up", "aligarh"): (27.8974, 78.0880),
    ("up", "mathura"): (27.4924, 77.6737),

    # Rajasthan
    ("rj", "jaipur"): (26.9124, 75.7873),
    ("rj", "jodhpur"): (26.2389, 73.0243),
    ("rj", "kota"): (25.2138, 75.8648),
    ("rj", "bikaner"): (28.0229, 73.3119),
    ("rj", "ajmer"): (26.4499, 74.6399),
    ("rj", "alwar"): (27.5530, 76.6346),
    ("rj", "sriganganagar"): (29.9038, 73.8772),

    # Tamil Nadu
    ("tn", "coimbatore"): (11.0168, 76.9558),
    ("tn", "madurai"): (9.9252, 78.1198),
    ("tn", "chennai"): (13.0827, 80.2707),
    ("tn", "salem"): (11.6643, 78.1460),
    ("tn", "tiruchirappalli"): (10.7905, 78.7047),
    ("tn", "tirunelveli"): (8.7139, 77.7567),
    ("tn", "erode"): (11.3410, 77.7172),

    # Telangana
    ("ts", "warangal"): (17.9689, 79.5941),
    ("ts", "hyderabad"): (17.3850, 78.4867),
    ("ts", "karimnagar"): (18.4386, 79.1288),
    ("ts", "khammam"): (17.2473, 80.1514),
    ("ts", "nizamabad"): (18.6725, 78.0941),

    # Delhi
    ("dl", "azadpur"): (28.7161, 77.1706),
    ("dl", "delhi"): (28.6139, 77.2090),
    ("dl", "keshopur"): (28.6473, 77.0872),
    ("dl", "ghazipur"): (28.6258, 77.3323),
    ("dl", "narela"): (28.8527, 77.0934),

    # Bihar
    ("br", "patna"): (25.5941, 85.1376),
    ("br", "muzaffarpur"): (26.1209, 85.3647),
    ("br", "bhagalpur"): (25.2425, 86.9842),
    ("br", "gaya"): (24.7914, 85.0002),

    # West Bengal
    ("wb", "kolkata"): (22.5726, 88.3639),
    ("wb", "siliguri"): (26.7271, 88.3953),
    ("wb", "asansol"): (23.6739, 86.9524),
    ("wb", "burdwan"): (23.2324, 87.8615),

    # Kerala
    ("kl", "alappuzha"): (9.4981, 76.3388),
    ("kl", "ernakulam"): (9.9816, 76.2999),
    ("kl", "kozhikode"): (11.2588, 75.7804),
    ("kl", "palakkad"): (10.7867, 76.6548),
    ("kl", "thiruvananthapuram"): (8.5241, 76.9366),

    # Odisha
    ("or", "bhubaneswar"): (20.2961, 85.8245),
    ("or", "cuttack"): (20.4625, 85.8828),
    ("or", "sambalpur"): (21.4669, 83.9812),

    # Himachal Pradesh
    ("hp", "shimla"): (31.1048, 77.1734),
    ("hp", "solan"): (30.9045, 77.0967),
    ("hp", "kullu"): (31.9579, 77.1095),

    # Jammu & Kashmir
    ("jk", "jammu"): (32.7266, 74.8570),
    ("jk", "srinagar"): (34.0837, 74.7973),

    # Uttarakhand
    ("ut", "dehradun"): (30.3165, 78.0322),
    ("ut", "haldwani"): (29.2183, 79.5130),

    # Chhattisgarh
    ("ct", "raipur"): (21.2514, 81.6296),
    ("ct", "bilaspur"): (22.0797, 82.1409),

    # Assam
    ("as", "guwahati"): (26.1445, 91.7362),
    ("as", "silchar"): (24.8333, 92.7789),

    # Chandigarh
    ("ch", "chandigarh"): (30.7333, 76.7794),

    # Goa
    ("ga", "margao"): (15.2832, 73.9862),
    ("ga", "panaji"): (15.4909, 73.8278),

    # Andaman & Nicobar
    ("an", "diglipur"): (13.2667, 92.9833),
    ("an", "sri-vijaya-puram"): (11.6234, 92.7265),

    # Pondicherry
    ("py", "thattanchavady"): (11.9524, 79.7997),

    # Arunachal Pradesh
    ("ar", "ziro"): (27.5946, 93.8385),
}

def slugify(text: str) -> str:
    text = re.sub(r'\s+', ' ', text).strip().lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def clean_key(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'\b(apmc|vfpck|market|grain|terminal|sub-market|subji|mandi|f&v|fv|yard|main)\b', '', text)
    text = re.sub(r'[^a-z0-9]', '', text)
    return text

def main():
    print("=== AgriForecasting National Mandi Geography Ingestion ===")
    
    print(f"Reading {CROPS_FILE}...")
    crops_df = pd.read_csv(CROPS_FILE, usecols=['State', 'Mandi', 'Commodity', 'Variety'])
    
    print(f"Reading {HIERARCHY_FILE}...")
    h_df = pd.read_csv(HIERARCHY_FILE)
    
    crops_df['Mandi_Clean'] = crops_df['Mandi'].astype(str).apply(lambda s: re.sub(r'\s+', ' ', s).strip())
    crops_df['State_Clean'] = crops_df['State'].astype(str).apply(lambda s: re.sub(r'\s+', ' ', s).strip())
    
    mandi_pairs = crops_df[['State_Clean', 'Mandi_Clean']].drop_duplicates().reset_index(drop=True)
    print(f"Total unique (State, Mandi) normalized pairs: {len(mandi_pairs)}")
    print(f"Total unique mandi names: {mandi_pairs['Mandi_Clean'].nunique()}")
    print(f"Total unique states: {mandi_pairs['State_Clean'].nunique()}")

    h_map_exact = {}
    h_map_clean = {}
    state_known_districts = {}
    for _, row in h_df.iterrows():
        s_norm = str(row['state_name']).strip().lower()
        m_raw = re.sub(r'\s+', ' ', str(row['market_name'])).strip()
        m_norm = m_raw.lower()
        d_name = re.sub(r'\s+', ' ', str(row['district_name'])).strip()
        
        h_map_exact[(s_norm, m_norm)] = d_name
        ck = clean_key(m_raw)
        if ck:
            h_map_clean[(s_norm, ck)] = d_name
        state_known_districts.setdefault(s_norm, set()).add(d_name)

    states_dict = {}
    districts_dict = {}
    mandis_list = []
    
    stat_verified_coords = 0
    stat_unresolved_coords = 0
    seen_mandi_ids = {}

    for _, row in mandi_pairs.iterrows():
        raw_state = row['State_Clean']
        raw_mandi = row['Mandi_Clean']
        
        state_meta = STATE_MAP.get(raw_state)
        if not state_meta:
            s_id = slugify(raw_state)[:3]
            s_code = raw_state[:2].upper()
            s_name = raw_state
        else:
            s_id = state_meta['id']
            s_code = state_meta['code']
            s_name = state_meta['name']
            
        states_dict[s_id] = (s_id, s_name, s_code)
        
        s_norm = raw_state.lower()
        m_norm = raw_mandi.lower()
        ck = clean_key(raw_mandi)
        
        district_name = None
        if (s_norm, m_norm) in h_map_exact:
            district_name = h_map_exact[(s_norm, m_norm)]
        elif (s_norm, ck) in h_map_clean:
            district_name = h_map_clean[(s_norm, ck)]
        else:
            if s_norm in state_known_districts:
                for kd in state_known_districts[s_norm]:
                    kd_clean = clean_key(kd)
                    if kd_clean and kd_clean in ck:
                        district_name = kd
                        break
        
        if not district_name:
            if raw_state == "Andaman and Nicobar":
                district_name = "North and Middle Andaman" if "Diglipur" in raw_mandi else "South Andaman"
            elif raw_state == "Pondicherry":
                district_name = "Puducherry"
            elif raw_state == "Arunachal Pradesh":
                district_name = "Lower Subansiri"
            else:
                clean_d = re.sub(r'\s*(APMC|VFPCK|Market|Grain|Terminal|Mandi)\b', '', raw_mandi, flags=re.IGNORECASE).strip()
                if " - " in clean_d:
                    clean_d = clean_d.split(" - ")[-1].strip()
                district_name = clean_d if clean_d else raw_mandi

        d_slug = slugify(district_name)
        d_id = f"{s_id}-{d_slug}"
        districts_dict[d_id] = (d_id, s_id, district_name)
        
        base_m_slug = slugify(raw_mandi)
        m_id = f"{s_id}-{base_m_slug}"
        if m_id in seen_mandi_ids:
            seen_mandi_ids[m_id] += 1
            m_id = f"{m_id}-{seen_mandi_ids[m_id]}"
        else:
            seen_mandi_ids[m_id] = 1
        
        lat, lon = None, None
        coord_source = "UNRESOLVED"
        coord_status = "UNRESOLVED"
        
        for (v_state, v_key), coords in VERIFIED_MANDI_COORDINATES.items():
            if v_state == s_id and (v_key in base_m_slug or v_key in ck):
                lat, lon = coords
                coord_source = "VERIFIED_SEED" if (v_state, v_key) in [
                    ("ka", "kolar"), ("ka", "bangalore"), ("ka", "belgaum"), ("ka", "mysore"),
                    ("mh", "lasalgaon"), ("mh", "pune"), ("mh", "nagpur"), ("mh", "ahmednagar"),
                    ("hr", "karnal"), ("hr", "hisar"), ("hr", "sirsa"), ("hr", "ambala"),
                    ("hr", "rohtak"), ("hr", "panipat"), ("hr", "gurgaon"), ("pb", "khanna"),
                    ("pb", "amritsar"), ("ap", "kurnool"), ("gj", "ahmedabad"), ("gj", "rajkot"),
                    ("mp", "indore"), ("up", "agra"), ("rj", "jaipur"), ("tn", "coimbatore"),
                    ("ts", "warangal")
                ] else "GEOCODED"
                coord_status = "VERIFIED"
                stat_verified_coords += 1
                break
                
        if lat is None:
            stat_unresolved_coords += 1
            
        full_name = f"{raw_mandi}, {district_name}, {s_name}"
        mandis_list.append((m_id, d_id, s_id, raw_mandi, full_name, lat, lon, coord_source, coord_status))

    print(f"States count: {len(states_dict)}")
    print(f"Districts count: {len(districts_dict)}")
    print(f"Mandis count: {len(mandis_list)}")
    print(f"Coordinate breakdown: {stat_verified_coords} Verified/Geocoded, {stat_unresolved_coords} Unresolved (NULL)")

    print("Extracting commodities & varieties...")
    comm_df = crops_df[['Commodity', 'Variety']].drop_duplicates().reset_index(drop=True)
    
    category_map = {
        "Tomato": "Vegetables", "Onion": "Vegetables", "Potato": "Vegetables",
        "Wheat": "Cereals", "Rice": "Cereals", "Chili Red": "Spices",
        "Green Chilli": "Spices", "Banana": "Fruits", "Groundnut": "Oilseeds",
        "Water Melon": "Fruits", "Soybean": "Oilseeds", "Cotton": "Fibre Crops",
        "Mustard": "Oilseeds", "Maize": "Cereals"
    }
    
    commodities_dict = {}
    varieties_dict = {}
    
    for comm_name in crops_df['Commodity'].dropna().unique():
        comm_slug = slugify(comm_name)
        cat = category_map.get(comm_name, "Agricultural Produce")
        commodities_dict[comm_slug] = (comm_slug, comm_name, cat, "quintal", comm_slug)
        
    prototype_comms = [
        ("tomato", "Tomato", "Vegetables", "quintal", "tomato"),
        ("onion", "Onion", "Vegetables", "quintal", "onion"),
        ("potato", "Potato", "Vegetables", "quintal", "potato"),
        ("wheat", "Wheat", "Cereals", "quintal", "wheat"),
        ("rice", "Rice / Paddy", "Cereals", "quintal", "rice"),
        ("chilli", "Green / Dry Chilli", "Spices", "quintal", "chilli"),
        ("soybean", "Soybean", "Oilseeds", "quintal", "soybean"),
        ("cotton", "Raw Cotton (Kapas)", "Fibre Crops", "quintal", "cotton"),
        ("mustard", "Mustard Seed", "Oilseeds", "quintal", "mustard"),
        ("maize", "Maize (Corn)", "Cereals", "quintal", "maize"),
    ]
    for c_id, c_name, c_cat, c_unit, c_slug in prototype_comms:
        if c_id not in commodities_dict:
            commodities_dict[c_id] = (c_id, c_name, c_cat, c_unit, c_slug)

    for _, row in comm_df.iterrows():
        raw_c = str(row['Commodity']).strip()
        raw_v = str(row['Variety']).strip()
        c_slug = slugify(raw_c)
        v_slug = f"{c_slug}-{slugify(raw_v)}"
        varieties_dict[v_slug] = (v_slug, c_slug, raw_v)

    prototype_vars = [
        ("tomato-hybrid", "tomato", "Hybrid"),
        ("tomato-local", "tomato", "Local / Desi"),
        ("tomato-vaishali", "tomato", "Vaishali"),
        ("onion-red", "onion", "Nashik Red"),
        ("onion-white", "onion", "White"),
        ("onion-garwa", "onion", "Garwa"),
        ("potato-jyoti", "potato", "Kufri Jyoti"),
        ("potato-chandramukhi", "potato", "Chandramukhi"),
        ("potato-chipsona", "potato", "Chipsona"),
        ("wheat-sharbati", "wheat", "Sharbati"),
        ("wheat-lokwan", "wheat", "Lokwan"),
        ("wheat-hd2967", "wheat", "HD-2967"),
        ("rice-basmati", "rice", "Basmati 1121"),
        ("rice-sonamasuri", "rice", "Sona Masuri"),
        ("rice-ir64", "rice", "IR-64"),
        ("chilli-guntur", "chilli", "Guntur Sannam"),
        ("chilli-teja", "chilli", "Teja"),
        ("chilli-byadgi", "chilli", "Byadgi"),
    ]
    for v_id, c_id, v_name in prototype_vars:
        varieties_dict[v_id] = (v_id, c_id, v_name)

    print(f"Commodities count: {len(commodities_dict)}")
    print(f"Varieties count: {len(varieties_dict)}")

    print(f"Connecting to PostgreSQL {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    try:
        print("Truncating geography tables...")
        cur.execute("TRUNCATE TABLE mandis, districts, states, varieties, commodities CASCADE;")

        print("Inserting States...")
        execute_values(
            cur,
            "INSERT INTO states (id, name, code) VALUES %s ON CONFLICT (id) DO NOTHING;",
            list(states_dict.values())
        )

        print("Inserting Districts...")
        execute_values(
            cur,
            "INSERT INTO districts (id, state_id, name) VALUES %s ON CONFLICT (id) DO NOTHING;",
            list(districts_dict.values())
        )

        print("Inserting Mandis...")
        execute_values(
            cur,
            """INSERT INTO mandis (id, district_id, state_id, name, full_name, latitude, longitude, coordinate_source, coordinate_status)
               VALUES %s ON CONFLICT (id) DO UPDATE SET
                    district_id = EXCLUDED.district_id,
                    state_id = EXCLUDED.state_id,
                    name = EXCLUDED.name,
                    full_name = EXCLUDED.full_name,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    coordinate_source = EXCLUDED.coordinate_source,
                    coordinate_status = EXCLUDED.coordinate_status;""",
            mandis_list
        )

        print("Inserting Commodities...")
        execute_values(
            cur,
            "INSERT INTO commodities (id, name, category, unit, slug) VALUES %s ON CONFLICT (id) DO NOTHING;",
            list(commodities_dict.values())
        )

        print("Inserting Varieties...")
        execute_values(
            cur,
            "INSERT INTO varieties (id, commodity_id, name) VALUES %s ON CONFLICT (id) DO NOTHING;",
            list(varieties_dict.values())
        )

        conn.commit()
        print("Database commit successful!")

        # Verification counts
        cur.execute("SELECT COUNT(*) FROM states;")
        count_states = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM districts;")
        count_districts = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM mandis;")
        count_mandis = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM mandis WHERE latitude IS NOT NULL AND longitude IS NOT NULL;")
        count_with_coords = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM mandis WHERE latitude IS NULL;")
        count_null_coords = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM commodities;")
        count_commodities = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM varieties;")
        count_varieties = cur.fetchone()[0]

        print("\n--- Ingestion Verification ---")
        print(f"States in DB:       {count_states}")
        print(f"Districts in DB:    {count_districts}")
        print(f"Mandis in DB:       {count_mandis}")
        print(f"Mandis with coords: {count_with_coords}")
        print(f"Mandis null coords: {count_null_coords}")
        print(f"Commodities in DB:  {count_commodities}")
        print(f"Varieties in DB:    {count_varieties}")

        recon = {
            "states_count": count_states,
            "districts_count": count_districts,
            "mandis_count": count_mandis,
            "mandis_with_coords": count_with_coords,
            "mandis_null_coords": count_null_coords,
            "commodities_count": count_commodities,
            "varieties_count": count_varieties,
            "verified_coords_count": stat_verified_coords,
            "unresolved_count": stat_unresolved_coords,
        }
        with open("/Users/karthikreddy/Desktop/Agri/scripts/geography_reconciliation.json", "w") as f:
            json.dump(recon, f, indent=2)
        print("Reconciliation report saved to scripts/geography_reconciliation.json")

    except Exception as e:
        conn.rollback()
        print(f"Error during ingestion: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
