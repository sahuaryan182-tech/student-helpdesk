"""
Admin-only reporting endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends, Query

from app.models.collections import faqs_collection, chat_logs_collection
from app.middleware.auth_middleware import get_current_admin
from app.schemas.chat import ChatLogOut
from app.utils.serializers import serialize_list

router = APIRouter()


@router.get("/stats")
async def get_stats(admin=Depends(get_current_admin)):
    faqs = faqs_collection()
    logs = chat_logs_collection()

    total_faqs = await faqs.count_documents({})
    total_queries = await logs.count_documents({})
    resolved_queries = await logs.count_documents({"resolved": True})
    unresolved_queries = total_queries - resolved_queries

    pipeline = [
        {"$match": {"category": {"$ne": None}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_categories = [
        {"category": doc["_id"], "count": doc["count"]}
        async for doc in logs.aggregate(pipeline)
    ]

    return {
        "totalFaqs": total_faqs,
        "totalQueries": total_queries,
        "resolvedQueries": resolved_queries,
        "unresolvedQueries": unresolved_queries,
        "topCategories": top_categories,
    }


@router.get("/queries", response_model=List[ChatLogOut])
async def list_queries(limit: int = Query(50, ge=1, le=200), admin=Depends(get_current_admin)):
    docs = await chat_logs_collection().find().sort("createdAt", -1).to_list(length=limit)
    return serialize_list(docs)
