from llm_handler import build_prompt, get_llm_response
from flask import Flask, request, jsonify
import os
import pandas as pd
import numpy as np
import json
from collections import defaultdict
from itertools import chain
from analyze import clean_data, cluster_data, compute_correlation_matrix, column_type_summary
from flask_cors import CORS
import traceback
from processor import process_file

app = Flask(__name__)
CORS(app)

# Try to import Gemini-powered chart suggestion logic
try:
    from llm_charts import get_chart_suggestions, get_conversation_history
    has_llm = True
except ImportError:
    has_llm = False

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, )):
            return int(obj)
        elif isinstance(obj, (np.floating, )):
            return float(obj)
        elif isinstance(obj, (np.ndarray, )):
            return obj.tolist()
        elif isinstance(obj, (pd.Timestamp, pd.Timedelta)):
            return str(obj)
        return super().default(obj)


@app.route("/process", methods=["POST"])
def process_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    filename = file.filename

    try:
        result = process_file(file, filename)
        return jsonify(result)
    except Exception as e:
        print("Error while processing:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/suggest-chart", methods=["POST"])
def suggest_chart():
    if not has_llm:
        return jsonify({"error": "LLM chart suggestion is not available"}), 501

    try:
        data = request.get_json()
        metadata = data.get("columns")
        sample_rows = data.get("sample")
        correlation_matrix = data.get("correlation_matrix")
        summary = data.get("summary", None)
        filename = os.path.splitext(data.get("filename", ""))[0]

        if not metadata or not sample_rows or not filename:
            return jsonify({"error": "Missing required metadata, sample, or filename"}), 400

        json_path = os.path.join(UPLOAD_FOLDER, filename + ".json")
        if not os.path.exists(json_path):
            return jsonify({"error": f"File '{filename}.json' not found"}), 404

        with open(json_path, "r") as f:
            full_data = json.load(f)

        raw_suggestions = get_chart_suggestions(metadata, sample_rows, correlation_matrix, summary)

        # If already a dict, skip json.loads()
        parsed = raw_suggestions

        if "charts" in parsed and "explanations" in parsed:
            charts = parsed["charts"]
            explanations = parsed["explanations"]
            for i in range(min(len(charts), len(explanations))):
                charts[i]["explanation"] = explanations[i]

            return jsonify({
                "charts": charts,
                "full_data": full_data,
            })

        return jsonify({
            "raw_response": raw_suggestions,
            "full_data": full_data,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    




@app.route("/ask-question", methods=["POST"])
def ask_question():
    if not has_llm:
        return jsonify({"error": "LLM is not available"}), 501

    try:
        data = request.get_json()
        question = data.get("question")
        summary = data.get("summary")
        columns = data.get("columns")
        correlation_matrix = data.get("correlation_matrix")
        full_data = data.get("full_data")

        if not question:
            return jsonify({"error": "Missing 'question' in request body"}), 400

        prompt, chat_history = build_prompt(question, summary, columns, correlation_matrix, full_data)
        response = get_llm_response(prompt)

        return jsonify({
            "question": question,
            "response": response,
            "chat_history": chat_history
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)











