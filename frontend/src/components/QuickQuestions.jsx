const SAMPLE_QUESTIONS = [
  "How can I pay my semester fees?",
  "Where can I see my timetable?",
  "When is the exam schedule available?",
  "How do I check my result?",
]

export default function QuickQuestions({ onPick, disabled }) {
  return (
    <div className="quick-questions">
      {SAMPLE_QUESTIONS.map((q) => (
        <button key={q} className="quick-chip" onClick={() => onPick(q)} disabled={disabled}>
          {q}
        </button>
      ))}
    </div>
  )
}
