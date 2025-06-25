# retriever.py

import os
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings

# Configuration
CORPUS_FILE = "charting_guidelines.txt"
CHROMA_DIR = "chroma_charting_store"

# ✅ Use Sentence Transformers embedding
def get_sentence_transformer_embedding():
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# ✅ Step 1: Build the Chroma vector store
def build_vector_store():
    if not os.path.exists(CORPUS_FILE):
        raise FileNotFoundError(f"Corpus file not found: {CORPUS_FILE}")

    loader = TextLoader(CORPUS_FILE)
    raw_docs = loader.load()

    splitter = CharacterTextSplitter(chunk_size=300, chunk_overlap=30)
    documents = splitter.split_documents(raw_docs)

    embeddings = get_sentence_transformer_embedding()

    # Build and persist Chroma store
    vector_store = Chroma.from_documents(documents, embeddings, persist_directory=CHROMA_DIR)
    vector_store.persist()

    print("✅ Chroma vector store saved at:", CHROMA_DIR)

# ✅ Step 2: Retrieve context
def retrieve_context(query, top_k=5):
    if not os.path.exists(CHROMA_DIR):
        raise FileNotFoundError("Chroma store not found. Please run build_vector_store() first.")

    embeddings = get_sentence_transformer_embedding()
    vector_store = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)

    results = vector_store.similarity_search(query, k=top_k)
    return "\n".join([doc.page_content for doc in results])
