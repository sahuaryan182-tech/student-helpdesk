"""
Converts MongoDB documents (with ObjectId _id) into plain JSON-safe dicts.
"""


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


def serialize_list(docs: list) -> list:
    return [serialize_doc(d) for d in docs]
