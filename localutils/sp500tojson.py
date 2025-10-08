import pandas as pd

def normalize(df, mapping, index_name):
    df = df.rename(columns=mapping)
    for col in standard_cols:
        if col not in df.columns:
            df[col] = None
    df['indexes'] = [[index_name] for _ in range(len(df))]

    df = df[df['Symbol'].notna()]  # <- this line removes empty/bad rows
    return df[standard_cols + ['indexes']]


# Define the standard format
standard_cols = ['Symbol', 'Security', 'GICS Sector', 'GICS Sub-Industry', 'Headquarters Location', 'Date added', 'Founded']

# URLs and column mappings
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
            'Industry': 'GICS Sector'
        },
        "table_index": 1,
        "index_name": "Dow Jones"
    }
]

# Load and normalize all data
merged = {}
for source in sources:
    df = pd.read_html(source['url'])[source['table_index']]
    df = normalize(df, source['mapping'], source['index_name'])

    for _, row in df.iterrows():
        symbol = row['Symbol']
        if symbol not in merged:
            merged[symbol] = row.to_dict()
        else:
            # Merge non-empty values and extend indexes list
            for k, v in row.items():
                if k == 'indexes':
                    merged[symbol][k] = list(set(merged[symbol][k] + v))
                elif merged[symbol].get(k) in [None, ''] and v not in [None, '']:
                    merged[symbol][k] = v

# Write to JSON
df_merged = pd.DataFrame(merged.values())
df_merged.to_json("us_index_constituents.json", orient="records", indent=2)
print("Merged index data saved to us_index_constituents.json")
