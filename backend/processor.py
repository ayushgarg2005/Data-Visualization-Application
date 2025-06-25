import os
import json
import pandas as pd
import numpy as np
from collections import defaultdict
from itertools import chain
from analyze import clean_data, cluster_data, compute_correlation_matrix

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        elif isinstance(obj, (np.floating,)):
            return float(obj)
        elif isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        elif isinstance(obj, (pd.Timestamp, pd.Timedelta)):
            return str(obj)
        return super().default(obj)


def save_uploaded_file(file, filename):
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    return filepath


def initialize_aggregation():
    return {
        "processed_data": [],
        "metadata": {},
        "correlation": defaultdict(lambda: defaultdict(list)),
        "column_summary": {
            "numeric_columns": set(),
            "categorical_columns": set(),
            "datetime_columns": set(),
        }
    }


def update_metadata(aggregated, chunk_metadata, chunk):
    for col_meta in chunk_metadata:
        col = col_meta["name"]
        stats = col_meta["statistics"]

        if col not in aggregated:
            aggregated[col] = col_meta.copy()
            if "mean" in stats:
                aggregated[col]["_sum"] = stats["mean"] * stats.get("count", chunk[col].count())
                aggregated[col]["_count"] = stats.get("count", chunk[col].count())
        else:
            agg = aggregated[col]
            agg["null_count"] += col_meta["null_count"]
            agg["unique_count"] += col_meta["unique_count"]

            if agg["semantic"] == "metric":
                agg_stats = agg["statistics"]
                agg_stats["min"] = min(agg_stats["min"], stats["min"])
                agg_stats["max"] = max(agg_stats["max"], stats["max"])
                agg["_sum"] += stats["mean"] * stats.get("count", chunk[col].count())
                agg["_count"] += stats.get("count", chunk[col].count())

            elif agg["semantic"] == "timestamp":
                agg_stats = agg["statistics"]
                agg_stats["min_date"] = min(agg_stats["min_date"], stats["min_date"])
                agg_stats["max_date"] = max(agg_stats["max_date"], stats["max_date"])
                agg_stats["range_days"] = (
                    pd.to_datetime(agg_stats["max_date"]) - pd.to_datetime(agg_stats["min_date"])
                ).days

            elif agg["semantic"] == "category":
                top_cat = agg["statistics"].get("top_categories", {})
                for k, v in stats["top_categories"].items():
                    top_cat[k] = top_cat.get(k, 0) + v
                sorted_top = dict(sorted(top_cat.items(), key=lambda x: -x[1])[:5])
                agg["statistics"]["top_categories"] = sorted_top


def update_correlation(aggregated_corr, corr):
    for col1, sub in corr.items():
        for col2, val in sub.items():
            if val is not None:
                aggregated_corr[col1][col2].append(val)


def update_column_summary(summary, chunk):
    summary["numeric_columns"].update(chunk.select_dtypes(include="number").columns)
    summary["categorical_columns"].update(chunk.select_dtypes(include="object").columns)
    summary["datetime_columns"].update(chunk.select_dtypes(include="datetime64").columns)


def format_chunk_for_output(chunk):
    chunk = chunk.where(pd.notnull(chunk), None)
    for col in chunk.columns:
        if pd.api.types.is_datetime64_any_dtype(chunk[col]):
            chunk[col] = chunk[col].astype(str)
    return chunk.to_dict(orient="records")


def finalize_correlation_matrix(aggregated_corr):
    return {
        col1: {
            col2: round(sum(vals) / len(vals), 4) if vals else None
            for col2, vals in sub.items()
        }
        for col1, sub in aggregated_corr.items()
    }


def finalize_metadata(aggregated_metadata):
    for meta in aggregated_metadata.values():
        if meta.get("semantic") == "metric" and "_sum" in meta:
            total_sum = meta.pop("_sum")
            total_count = meta.pop("_count")
            meta["statistics"]["mean"] = round(total_sum / total_count, 4)
    return aggregated_metadata


def summarize_columns(column_summary):
    return {
        "total_columns": len(set(chain.from_iterable(column_summary.values()))),
        "numeric_columns": len(column_summary["numeric_columns"]),
        "categorical_columns": len(column_summary["categorical_columns"]),
        "datetime_columns": len(column_summary["datetime_columns"]),
    }


def process_file(file, filename):
    filepath = save_uploaded_file(file, filename)
    chunk_iter = pd.read_csv(filepath, chunksize=10000)

    agg = initialize_aggregation()

    for chunk in chunk_iter:
        chunk, metadata = clean_data(chunk)
        chunk, _ = cluster_data(chunk)
        corr = compute_correlation_matrix(chunk)

        update_metadata(agg["metadata"], metadata, chunk)
        update_correlation(agg["correlation"], corr)
        update_column_summary(agg["column_summary"], chunk)

        formatted_chunk = format_chunk_for_output(chunk)
        agg["processed_data"].extend(formatted_chunk)

    final_correlation = finalize_correlation_matrix(agg["correlation"])
    final_metadata = finalize_metadata(agg["metadata"])
    final_summary = summarize_columns(agg["column_summary"])
    sample = agg["processed_data"][:10]

    base_filename = os.path.splitext(filename)[0]
    json_path = os.path.join(UPLOAD_FOLDER, base_filename + ".json")
    with open(json_path, "w") as f:
        json.dump(agg["processed_data"], f, indent=2, cls=NpEncoder)

    response_data = {
        "sample": sample,
        "columns": list(final_metadata.values()),
        "correlation_matrix": final_correlation,
        "summary": final_summary,
        "filename": base_filename
    }

    return json.loads(json.dumps(response_data, cls=NpEncoder))






