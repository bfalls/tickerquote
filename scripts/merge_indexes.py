import pandas as pd
import hashlib
import json
from datetime import date
from pathlib import Path

def normalize(df, mapping, index_name):
    # Rename columns to match standard format
    df = df.rename(columns=mapping)

    if 'Symbol' not in df.columns:
        raise ValueError(f"'Symbol' column not found after renaming for index: {index_name}")
    df = df[df['Symbol'].notna()]

    for col in standard_cols:
        if col not in df.columns:
            df[col] = None

    df['indexes'] = [[index_name] for _ in range(len(df))]
    return df[standard_cols + ['indexes']]

# Standardized field list
standard_cols = [
    'Symbol', 'Security', 'GICS Sector', 'GICS Sub-Industry',
    'Headquarters Location', 'Date added', 'Founded'
]

# Index definitions
sources = [
    {
        "url": "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
        "mapping": {
            'Symbol': 'Symbol',
            'Security': 'Security',
            'GICS Sector': 'GICS Sector',
            'GICS Sub-Industry': 'GICS Sub-Industry',
            'Headquarters Location': 'Headquarters Location',
            'Date added': 'Date added',
            'Founded': 'Founded'
        },
        "table_index": 0,
        "index_name": "S&P 500"
    },
    {
        "url": "https://en.wikipedia.org/wiki/NASDAQ-100",
        "mapping": {
            'Ticker': 'Symbol',
            'Company': 'Security',
            'GICS Sector': 'GICS Sector',
            'GICS Sub-Industry': 'GICS Sub-Industry'
        },
        "table_index": 4,
        "index_name": "NASDAQ-100"
    },
    {
        "url": "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average",
        "mapping": {
            'Symbol': 'Symbol',
            'Company': 'Security',
            'Industry': 'GICS Sector',
            'Date added': 'Date added'
        },
        "table_index": 2,
        "index_name": "Dow Jones"
    }
]

# Merge logic
merged = {}
for source in sources:
    df = pd.read_html(source['url'])[source['table_index']]
    df = normalize(df, source['mapping'], source['index_name'])

    for _, row in df.iterrows():
        symbol = row['Symbol']
        if symbol not in merged:
            merged[symbol] = row.to_dict()
        else:
            for k, v in row.items():
                if k == 'indexes':
                    merged[symbol][k] = list(set(merged[symbol][k] + v))
                elif merged[symbol].get(k) in [None, ''] and v not in [None, '']:
                    merged[symbol][k] = v

# Define output directory and files
# output_dir = Path(__file__).parent.parent / "data"
output_dir = Path.cwd() / "data"
output_dir.mkdir(exist_ok=True)
print(f"Using output dir: {output_dir.resolve()}")

hash_file = output_dir / ".companyhash"
output_file = output_dir / "us_index_constituents.json"

# Sort companies by symbol and prepare data
companies = sorted(merged.values(), key=lambda x: x.get("Symbol") or "")

# Hash only the company data (stable ordering, no version)
company_string = json.dumps(companies, sort_keys=True).encode('utf-8')
data_hash = hashlib.sha256(company_string).hexdigest()

# Check for previous hash
previous_hash = hash_file.read_text().strip() if hash_file.exists() else ""

if data_hash != previous_hash:
    version = date.today().isoformat()
    output = {
        "version": version,
        "companies": companies
    }

    with output_file.open("w") as f:
        json.dump(output, f, indent=2)

    hash_file.write_text(data_hash)
    print(f"✅ Change detected — JSON written to {output_file.name} with version {version}")
else:
    print("✅ No changes detected — skipping write.")
