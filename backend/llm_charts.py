import os
import json
import re
import sys
from dotenv import load_dotenv
import google.generativeai as genai
import json

# LangChain
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain_google_genai import ChatGoogleGenerativeAI

# RAG: FAISS retriever
from retriever import retrieve_context

# Load API key
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model_name = ""

# LangChain wrapper
llm = ChatGoogleGenerativeAI(model=model_name, temperature=0.7)
memory = ConversationBufferMemory()
chain = ConversationChain(llm=llm, memory=memory)


def get_conversation_history():
    return [
        {"role": msg.type.lower(), "content": msg.content}
        for msg in memory.chat_memory.messages
    ]


def extract_json_from_text(text):
    try:
        start = text.index("[")
        end = text.rindex("]") + 1
        json_str = text[start:end]
        return json.loads(json_str)
    except (ValueError, json.JSONDecodeError):
        return None



def build_dynamic_query(metadata, summary=None, correlation_matrix=None, chart_summary=None):
    categorical = [col['name'] for col in metadata if col['type'] == 'categorical']
    numerical = [col['name'] for col in metadata if col['type'] == 'numerical']
    datetime = [col['name'] for col in metadata if col['type'] == 'datetime']

    parts = []

    if categorical:
        parts.append(f"Categorical columns: {', '.join(categorical)}")
    if numerical:
        parts.append(f"Numerical columns: {', '.join(numerical)}")
    if datetime:
        parts.append(f"Datetime columns: {', '.join(datetime)}")

    query = "Recommend appropriate chart types based on the dataset:\n" + "\n".join(parts)

    if summary:
        query += "\n\n🧾 Column Type Summary:\n" + json.dumps(summary, indent=2)

    if correlation_matrix:
        query += "\n\n🔗 Correlation Matrix (numeric columns):\n"
        for col, correlations in correlation_matrix.items():
            top_corrs = sorted(correlations.items(), key=lambda x: abs(x[1]) if x[1] is not None else 0, reverse=True)
            query += f"- {col}: {', '.join([f'{k}({v})' for k, v in top_corrs if v is not None and abs(v) > 0.5]) or 'No strong correlations'}\n"

    if chart_summary:
        query += "\n\n📊 Charting Guide:\n" + chart_summary.strip()

    return query


def build_prompt(metadata, sample_rows, correlation_matrix=None, summary=None):
    """
    Builds an enhanced prompt for Gemini using RAG context and dataset insights.
    """

    # Step 1: Build dynamic query and retrieve relevant charting context
    retrieval_query = build_dynamic_query(metadata, summary, correlation_matrix)
    charting_context = retrieve_context(retrieval_query)

    # Step 2: Assemble the full prompt
    prompt = (
        "You are a professional data visualization expert and analyst.\n\n"

        "Your task is to:\n"
        "1. Analyze the dataset metadata, sample data, summary, and correlation matrix.\n"
        "2. Recommend a diverse and insightful set of up to 6 visualizations.\n"
        "3. Return your response as a JSON array of chart specs.\n"
        "4. After the JSON array, provide a short explanation for each chart.\n\n"

        "📌 Use the following charting guidelines as reference:\n"
        f"{charting_context}\n\n"

        "✅ Each chart spec must include:\n"
        "- title: A meaningful chart title\n"
        "- type: One of (bar, line, scatter, histogram, pie, box, area, heatmap, violin, treemap, radar, timeline, waterfall, sunburst, donut, candlestick, map, dual axis)\n"
        "- x: Column name for the x-axis\n"
        "- y: Column name for the y-axis (if applicable)\n"
        "- Optional: group, color, size, hierarchy, parents, etc.\n\n"

        "🧾 Example:\n"
        "[\n"
        "  {\n"
        "    \"title\": \"Sales by Category\",\n"
        "    \"type\": \"bar\",\n"
        "    \"x\": \"Category\",\n"
        "    \"y\": \"Sales\"\n"
        "  }\n"
        "]\n"
        "Explanation: This bar chart shows total sales per category to compare performance.\n\n"

        "📂 Dataset Metadata:\n"
        f"{json.dumps(metadata, indent=2)}\n\n"

        "📊 Sample Rows:\n"
        f"{json.dumps(sample_rows, indent=2)}\n"
    )

    if correlation_matrix:
        prompt += f"\n🔗 Correlation Matrix (numerical columns):\n{json.dumps(correlation_matrix, indent=2)}\n"

    if summary:
        prompt += f"\n📌 Column Type Summary:\n{json.dumps(summary, indent=2)}\n"

    prompt += (
        "\n✏️ Respond **only** with the JSON array of chart specifications, "
        "followed by brief explanations of why each chart was selected."
    )

    return prompt


def get_chart_suggestions(metadata, sample_rows, correlation_matrix=None, summary=None):
    try:
        prompt = build_prompt(metadata, sample_rows, correlation_matrix, summary)
        response = chain.predict(input=prompt)

        chart_data = extract_json_from_text(response)
        if chart_data:
            explanations_text = response[response.rindex("]") + 1:].strip()
            explanations = [line.strip() for line in explanations_text.split("\n") if line.strip()]
            return {
                "charts": chart_data,
                "explanations": explanations,
                "raw_response": response
            }
        else:
            return {"error": "Could not extract JSON from response.", "raw_response": response}
    except Exception as e:
        return {"error": str(e)}


def handle_follow_up():
    print("\nAsk follow-up questions (type 'exit' to quit):")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            print("Exiting.")
            break
        response = chain.predict(input=user_input)
        print(f"\nGemini: {response}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python llm_charts.py result.json")
        sys.exit(1)

    try:
        with open(sys.argv[1], "r") as f:
            data = json.load(f)

        metadata = data.get("columns")
        sample_rows = data.get("sample")
        correlation_matrix = data.get("correlation_matrix")
        summary = data.get("summary")

        suggestions = get_chart_suggestions(metadata, sample_rows, correlation_matrix, summary)

        if "error" in suggestions:
            print("\n❌ Error:", suggestions["error"])
            print("\nRaw Response:\n", suggestions.get("raw_response", ""))
        else:
            print("\n✅ Suggested Charts:\n")
            for chart, explanation in zip(suggestions["charts"], suggestions["explanations"]):
                print(json.dumps(chart, indent=2))
                print("Explanation:", explanation)
                print("-" * 50)

            handle_follow_up()

    except Exception as e:
        print("❌ Failed to run llm_charts.py:", e)
