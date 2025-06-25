import json
from llm_charts import chain, get_conversation_history

def build_prompt(question, summary=None, columns=None, correlation_matrix=None, full_data=None):
    prompt_parts = [
        "You are a helpful data analysis assistant.",
        f"\nUser Question:\n{question}"
    ]

    if summary:
        prompt_parts.append(f"\nColumn Summary:\n{json.dumps(summary, indent=2)}")
    if columns:
        prompt_parts.append(f"\nColumn Types:\n{json.dumps(columns, indent=2)}")
    if correlation_matrix:
        prompt_parts.append(f"\nCorrelation Matrix:\n{json.dumps(correlation_matrix, indent=2)}")
    if full_data:
        prompt_parts.append(f"\nFull Data Sample (first 10 rows):\n{json.dumps(full_data[:10], indent=2)}")

    chat_history = get_conversation_history()

    if chat_history:
        prompt_parts.append("\nPrevious Chat History:")
    for i in range(0, len(chat_history) - 1, 2):
        user_msg = chat_history[i].get("content", "") if chat_history[i]["role"] == "user" else ""
        assistant_msg = chat_history[i+1].get("content", "") if chat_history[i+1]["role"] == "assistant" else ""
        prompt_parts.append(f"\n{i//2 + 1}. User: {user_msg}\n   Assistant: {assistant_msg}")

    prompt_parts.append("\nRespond clearly and concisely based on the provided data context.")
    return "\n".join(prompt_parts), chat_history

def get_llm_response(prompt):
    return chain.predict(input=prompt)
