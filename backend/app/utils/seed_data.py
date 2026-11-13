"""
Inserts sample FAQ data on startup, only if the faqs collection is empty.
"""
from datetime import datetime, timezone
from app.models.collections import faqs_collection

SAMPLE_FAQS = [
    {"category": "Fees", "question": "How can I pay semester fees?",
     "answer": "Semester fees can be paid via the student portal under Fee Payment. (Sample data — replace via admin panel.)",
     "keywords": ["fees", "payment", "semester", "pay"], "active": True},
    {"category": "Timetable", "question": "Where can I see my class timetable?",
     "answer": "Your timetable is available under Academics > Timetable on the student portal. (Sample data.)",
     "keywords": ["timetable", "schedule", "classes", "timing"], "active": True},
    {"category": "Examinations", "question": "When is the exam schedule released?",
     "answer": "Exam schedules and hall tickets are released on the university website before exams begin. (Sample data.)",
     "keywords": ["exam", "examination", "schedule", "hall", "ticket"], "active": True},
    {"category": "Admissions", "question": "What documents are required for admission?",
     "answer": "Check the Admissions section on the university website for the current document checklist. (Sample data.)",
     "keywords": ["admission", "documents", "apply", "eligibility"], "active": True},
    {"category": "Results", "question": "How do I check my result?",
     "answer": "Results are published under Academics > Results on the student portal. (Sample data.)",
     "keywords": ["result", "results", "marksheet", "grade", "cgpa"], "active": True},
    {"category": "Hostel", "question": "What is the hostel allotment process?",
     "answer": "Hostel allotment is handled by the Hostel Office after fee confirmation. (Sample data.)",
     "keywords": ["hostel", "room", "allotment", "accommodation"], "active": True},
]


async def seed_faqs_if_empty():
    col = faqs_collection()
    count = await col.count_documents({})
    if count > 0:
        return
    now = datetime.now(timezone.utc)
    docs = [{**faq, "createdAt": now, "updatedAt": now} for faq in SAMPLE_FAQS]
    await col.insert_many(docs)
    print(f"Seeded {len(docs)} sample FAQs (dev/testing data)")
