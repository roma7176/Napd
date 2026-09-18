# ============================================
# Nabd - Basic RAG Function (Task 8)
# Query → Retrieved Context
# ============================================
"""
دالة الاسترجاع الأساسية (Retrieval) لنظام Nabd الطبي، مبنية فوق ChromaDB.

الإصلاحات اللي اتعملت في الكود ده مقارنة بالنسخة الأصلية:

1. الاتصال بالـ Chroma client والـ collection كان بيحصل على مستوى الموديول
   مباشرة من غير أي error handling — لو المسار غلط أو الـ collection
   مش موجودة، الكود كان هيوقع فورًا وقت الـ import، مش وقت الاستخدام.
   دلوقتي فيه دالة `connect_to_collection()` بترجع رسالة خطأ واضحة
   (مسار غير موجود / اسم Collection غلط) بدل traceback مبهم.

2. حساب `relevance_score = 1 - distance` كان بيفترض إن الـ distance metric
   هو cosine distance (نطاق تقريبًا 0-2). لو الـ Collection مبنية بمقياس
   تاني (زي L2 المربّع)، الرقم الناتج بيبقى مضلل (ممكن يطلع سالب أو أكبر
   من 1 من غير أي معنى). دلوقتي الكود بيقرأ `hnsw:space` من الـ metadata
   بتاعة الـ Collection ويحسب score مناسب لكل حالة، ولو مش متأكد بيرجّع
   الـ raw distance بدل رقم مضلل.

3. مفيش أي تحقق (validation) على المدخلات: query فاضي، top_k <= 0،
   أو condition_filter بمسافات زيادة. اتضافت validation بسيطة.

4. لو الـ metadata لأي chunk فاضية أو ناقصة، `meta.get(...)` كانت هترجع
   None بصمت من غير أي تنبيه؛ دلوقتي فيه قيم افتراضية واضحة
   ("Unknown source"/"Unknown condition") عشان تسهّل اكتشاف مشاكل
   الـ ingestion بدري.

5. الكود التنفيذي (الاتصال + test queries) كان بيشتغل تلقائيًا عند الـ
   import، وده مش عملي لو الملف ده هيتستورد كموديول جوه الـ AI Engine.
   دلوقتي كل حاجة اتلفت في دوال، والتنفيذ بس تحت `if __name__ == "__main__":`.

6. أضفت type hints ودوكيومنتيشن كاملة، ومعالجة استثناءات حوالين استعلام
   الـ Collection نفسه (query) عشان فشل شبكة/فهرسة ما يوقّفش الطبقة اللي
   فوقه (LLM engine).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.errors import ChromaError  # type: ignore[import-not-found]

logger = logging.getLogger("nabd_rag_retrieval")

# غيّري المسار ده حسب مكان الفولدر عندك (لوكال / كولاب)
CHROMA_DB_PATH = "./nabd_vector_store"
COLLECTION_NAME = "nabd_knowledge_base"


def connect_to_collection(
    db_path: str = CHROMA_DB_PATH, collection_name: str = COLLECTION_NAME
) -> "chromadb.api.models.Collection.Collection":
    """
    يتصل بالـ persistent Chroma client ويرجع الـ Collection المطلوبة.

    Raises:
        FileNotFoundError: لو مسار قاعدة البيانات مش موجود فعليًا.
        RuntimeError: لو الـ Collection غير موجودة بالاسم المُعطى.
    """
    try:
        client = chromadb.PersistentClient(path=db_path)
    except Exception as exc:  # مسار غير صالح أو ملف db تالف
        raise FileNotFoundError(
            f"تعذّر فتح Chroma DB في المسار: '{db_path}'. تأكدي إنه المسار صحيح "
            f"وإنه فيه ملف chroma.sqlite3. السبب الأصلي: {exc}"
        ) from exc

    try:
        collection = client.get_collection(name=collection_name)
    except Exception as exc:
        raise RuntimeError(
            f"الـ Collection باسم '{collection_name}' مش موجودة في '{db_path}'. "
            f"تأكدي من الاسم أو من إنك بنيتي الـ vector store قبل كده. "
            f"السبب الأصلي: {exc}"
        ) from exc

    logger.info("✅ Connected to '%s' — %d chunks found.", collection_name, collection.count())
    return collection


def _distance_to_score(distance: float, space: str) -> float:
    """
    يحوّل distance من Chroma لـ relevance score مفهوم (كل ما أعلى كل ما أقرب).

    - cosine: distance في المدى [0, 2] تقريبًا → score = 1 - distance
    - l2 / euclidean: مفيش تحويل ثابت معناه واضح → بنرجع 1 / (1 + distance)
      كتقريب رتيب (monotonic) بس مش نسبة مضمونة.
    - أي metric تاني غير معروف: بنرجع الـ distance الخام سالبة الإشارة
      (كل ما أقرب للصفر كل ما أحسن) بدل ما نختلق رقم غلط.
    """
    if space == "cosine":
        return round(1 - distance, 3)
    if space in ("l2", "euclidean"):
        return round(1 / (1 + distance), 3)
    return round(-distance, 3)


def retrieve_context(
    collection: "chromadb.api.models.Collection.Collection",
    query: str,
    top_k: int = 2,
    condition_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    دالة الاسترجاع الأساسية للـ RAG.

    Args:
        collection: الـ Chroma Collection المتصلة بيها (من connect_to_collection).
        query: السؤال أو النص اللي عايزين نلاقي معلومات طبية متعلقة بيه.
        top_k: عدد الـ chunks اللي هنرجعها (افتراضياً 2).
        condition_filter: (اختياري) لو عايزة تفلتري على حالة معينة، مثل
                           "Community-Acquired Pneumonia" أو
                           "Acute Myocardial Infarction". لازم تطابق القيمة
                           المخزّنة في الـ metadata بالحرف (case-sensitive).

    Returns:
        list of dicts فيها: document, source, condition, reference_id,
        relevance_score. لو مفيش نتائج، بترجع list فاضية.

    Raises:
        ValueError: لو query فاضي أو top_k <= 0.
    """
    if not query or not query.strip():
        raise ValueError("query لازم يكون نص غير فاضي.")
    if top_k <= 0:
        raise ValueError("top_k لازم يكون رقم أكبر من صفر.")

    where_clause = {"condition": condition_filter.strip()} if condition_filter else None

    try:
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where_clause,
        )
    except ChromaError as exc:
        logger.error("Chroma query failed for '%s': %s", query, exc)
        return []
    except Exception:
        logger.exception("Unexpected error while querying Chroma for '%s'.", query)
        return []

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    if not documents:
        return []

    space = (collection.metadata or {}).get("hnsw:space", "cosine") if hasattr(collection, "metadata") else "cosine"

    retrieved: List[Dict[str, Any]] = []
    for doc, meta, dist in zip(documents, metadatas, distances):
        meta = meta or {}
        retrieved.append(
            {
                "document": doc,
                "source": meta.get("source", "Unknown source"),
                "condition": meta.get("condition", "Unknown condition"),
                "reference_id": meta.get("reference_id", "N/A"),
                "relevance_score": _distance_to_score(dist, space),
            }
        )
    return retrieved


def format_context_for_llm(retrieved_chunks: List[Dict[str, Any]]) -> str:
    """
    تجهيز الـ context بصيغة نص واحد جاهز يتحط في الـ Prompt بتاع الـ LLM
    (ده اللي هيستخدموه في الـ AI Engine).
    """
    if not retrieved_chunks:
        return "No relevant medical context found."

    context_parts = [
        f"[Reference {i} - {chunk.get('source', 'Unknown source')}]\n{chunk['document']}"
        for i, chunk in enumerate(retrieved_chunks, 1)
    ]
    return "\n\n".join(context_parts)


# ============================================
# اختبار سريع (Test)
# ============================================
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    try:
        kb_collection = connect_to_collection()
    except (FileNotFoundError, RuntimeError) as exc:
        logger.error("❌ %s", exc)
        raise SystemExit(1)

    test_queries = [
        "ما هي أعراض الالتهاب الرئوي؟",
        "chest pain radiating to left arm with elevated troponin",
        "abdominal pain migrating to right lower quadrant",
    ]

    for q in test_queries:
        print(f"\n🔍 Query: {q}")
        chunks = retrieve_context(kb_collection, q, top_k=2)
        if not chunks:
            print("  (no results found)")
        for c in chunks:
            print(f"  → [{c['condition']}] (score: {c['relevance_score']}) {c['document'][:80]}...")
        print("\n--- Context جاهز للـ LLM ---")
        print(format_context_for_llm(chunks))
