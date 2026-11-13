// The six starter categories. `question` is a sample the student can click to
// ask; it only pre-fills a query, the answer always comes from the database.
export const TOPICS = [
  { category: 'Fees',         icon: 'fees',      question: 'How can I pay my semester fees?' },
  { category: 'Timetable',    icon: 'calendar',  question: 'Where can I see my timetable?' },
  { category: 'Examinations', icon: 'exam',      question: 'When is the exam schedule available?' },
  { category: 'Admissions',   icon: 'admission', question: 'What documents are required for admission?' },
  { category: 'Results',      icon: 'result',    question: 'How do I check my result?' },
  { category: 'Hostel',       icon: 'home',      question: 'What is the hostel allotment process?' },
]

export const TOPIC_CATEGORIES = TOPICS.map((t) => t.category)
