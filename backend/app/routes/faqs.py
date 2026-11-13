"""
FAQ management routes. All require a logged-in admin.
"""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId
from bson.errors import InvalidId

from app.models.collections import faqs_collection
from app.schemas.faq import FaqCreate, FaqOut, FaqUpdate
from app.middleware.auth_middleware import get_current_admin
from app.utils.serializers import serialize_doc, serialize_list

router = APIRouter()


def _to_object_id(faq_id: str) -> ObjectId:
    try:
        return ObjectId(faq_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid FAQ id")


@router.get("", response_model=List[FaqOut])
async def list_faqs(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    admin=Depends(get_current_admin),
):
    query: dict = {}
    if category:
        query["category"] = category
    if search:
        query["$text"] = {"$search": search}

    docs = await faqs_collection().find(query).sort("createdAt", -1).to_list(length=500)
    return serialize_list(docs)


@router.post("", response_model=FaqOut, status_code=status.HTTP_201_CREATED)
async def create_faq(payload: FaqCreate, admin=Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    doc = payload.model_dump()
    doc["createdAt"] = now
    doc["updatedAt"] = now

    result = await faqs_collection().insert_one(doc)
    created = await faqs_collection().find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.put("/{faq_id}", response_model=FaqOut)
async def update_faq(faq_id: str, payload: FaqUpdate, admin=Depends(get_current_admin)):
    oid = _to_object_id(faq_id)

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided to update")
    updates["updatedAt"] = datetime.now(timezone.utc)

    result = await faqs_collection().update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found")

    updated = await faqs_collection().find_one({"_id": oid})
    return serialize_doc(updated)


@router.delete("/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(faq_id: str, admin=Depends(get_current_admin)):
    oid = _to_object_id(faq_id)
    result = await faqs_collection().delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found")
    return None
