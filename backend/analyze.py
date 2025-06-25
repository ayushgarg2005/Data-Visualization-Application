import sys
import pandas as pd
import numpy as np
import json
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

# Maximum rows per chunk
MAX_ROWS = 10000

# Clean and enrich data, fill missing values, extract metadata
def clean_data(df):
    metadata = []

    for col in df.columns:
        col_data = df[col]
        col_type = str(col_data.dtype)
        null_count = col_data.isnull().sum()
        stats = {}

        if pd.api.types.is_numeric_dtype(col_data):
            fill_method = "mean"
            df[col] = col_data.fillna(col_data.mean())
            semantic = "metric"
            stats = {
                "min": col_data.min(),
                "max": col_data.max(),
                "mean": col_data.mean(),
                "std": col_data.std(),
                "histogram_bins": np.histogram(col_data.dropna(), bins=10)[0].tolist()
            }

        elif pd.api.types.is_datetime64_any_dtype(col_data) or "date" in col.lower():
            col_data = pd.to_datetime(col_data, errors='coerce')
            fill_method = "ffill"
            df[col] = col_data.ffill()
            semantic = "timestamp"
            stats = {
                "min_date": str(col_data.min()),
                "max_date": str(col_data.max()),
                "range_days": (col_data.max() - col_data.min()).days if col_data.notnull().any() else None
            }

        else:
            fill_method = "mode"
            value = col_data.mode()[0] if not col_data.mode().empty else "Unknown"
            df[col] = col_data.fillna(value)
            semantic = "category"
            stats = {
                "top_categories": col_data.value_counts().head(5).to_dict()
            }

        metadata.append({
            "name": col,
            "type": (
                "numerical" if pd.api.types.is_numeric_dtype(col_data)
                else "datetime" if pd.api.types.is_datetime64_any_dtype(col_data)
                else "categorical"
            ),
            "semantic": semantic,
            "null_count": int(null_count),
            "missing_filled_with": fill_method,
            "unique_count": int(col_data.nunique()),
            "sample_values": col_data.dropna().astype(str).unique().tolist()[:5],
            "statistics": stats
        })


    return df, metadata

# Perform KMeans clustering on numeric columns
def cluster_data(df):
    numeric_df = df.select_dtypes(include='number')
    if numeric_df.shape[1] == 0:
        return df, None

    scaler = StandardScaler()
    scaled = scaler.fit_transform(numeric_df)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init='auto')
    clusters = kmeans.fit_predict(scaled)

    df['cluster_label'] = clusters
    return df, clusters.tolist()

# Compute correlation matrix for numeric columns
def compute_correlation_matrix(df):
    numeric_df = df.select_dtypes(include='number')
    if numeric_df.shape[1] == 0:
        return {}

    corr = numeric_df.corr().round(4)
    corr_dict = corr.to_dict()

    return {
        col: {k: (None if pd.isna(v) else v) for k, v in sub.items()}
        for col, sub in corr_dict.items()
    }

# Generate column type summary
def column_type_summary(df):
    return {
        "total_columns": len(df.columns),
        "numeric_columns": len(df.select_dtypes(include='number').columns),
        "categorical_columns": len(df.select_dtypes(include='object').columns),
        "datetime_columns": len(df.select_dtypes(include='datetime64').columns)
    }


# ---------------------------------------------------------------------------------------------------------------------------------------------------------------
# ---------------------------------------------------------------------------------------------------------------------------------------------------------------
# Main logic
def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Please provide a CSV file path as argument"}))
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        chunk_iter = pd.read_csv(file_path, chunksize=MAX_ROWS)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    all_processed = []
    final_metadata = []
    final_correlation = {}
    summary = {}

    for i, chunk in enumerate(chunk_iter):
        chunk, metadata = clean_data(chunk)
        chunk, _ = cluster_data(chunk)
        corr = compute_correlation_matrix(chunk)
        summary = column_type_summary(chunk)

        final_metadata = metadata  # optionally merge if needed
        final_correlation.update(corr)
        all_processed.extend(chunk.replace({np.nan: None, pd.NaT: None}).to_dict(orient="records"))

    sample = all_processed[:10]

    result = {
        "sample": sample,
        "columns": final_metadata,
        "correlation_matrix": final_correlation,
        "summary": summary
    }

    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    main()















