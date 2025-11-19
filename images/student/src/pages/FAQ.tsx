import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is Checkpoint?",
    answer: "Checkpoint is a classroom management platform that allows teachers to track student progress through customizable checkpoints and provide feedback. It helps educators monitor learning milestones and give timely, constructive feedback to students."
  },
  {
    question: "How do I create a classroom?",
    answer: "After logging in, go to your home page and click 'Create Classroom'. Fill in the classroom name, academic year, and optionally set an email domain restriction for students joining. Once created, you'll receive an invite code to share with your students."
  },
  {
    question: "How do students join a classroom?",
    answer: "Students can join a classroom by clicking the 'Join Classroom' button on their home page and entering the invite code provided by their teacher. Alternatively, teachers can share a direct invite link that students can click to join automatically."
  },
  {
    question: "What are checkpoints?",
    answer: "Checkpoints are milestones that teachers create to track student progress. They represent key learning objectives or stages in a course. Teachers can mark when students have reached each checkpoint, providing a clear visual of each student's progress."
  },
  {
    question: "Can I reorder checkpoints after creating them?",
    answer: "Yes, teachers can reorder checkpoints using the up/down arrows next to each checkpoint. However, reordering is only possible before any student has reached any checkpoint in that classroom. This ensures consistency in progress tracking."
  },
  {
    question: "How does the feedback system work?",
    answer: "Teachers and students can add feedback entries that appear in a timeline view. Feedback can include rich text and images. Teachers can lock feedback to prevent further editing, and both parties can see the complete history of feedback for each student."
  },
  {
    question: "Can I restrict who joins my classroom?",
    answer: "Yes, when creating a classroom, you can set an 'Allowed Email Domain' restriction. Only users with email addresses from that domain (e.g., @student.school.edu) will be able to join your classroom."
  },
  {
    question: "What happens when I mark a classroom as completed?",
    answer: "When a classroom is marked as completed, no new feedback can be added. Students and teachers can still view all historical data, but the classroom becomes read-only. This is useful for archiving classes at the end of a semester."
  },
  {
    question: "How do I update my profile information?",
    answer: "Click on 'Profile' in the navigation bar. From there, you can update your name, email address, date of birth, and change your password. Make sure to save your changes after editing."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we take data security seriously. All passwords are hashed before storage, communications are encrypted via HTTPS, and we comply with GDPR regulations. Please refer to our Privacy Policy and GDPR pages for more detailed information."
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="container">
      <div className="row">
        <div className="ten columns offset-by-one">
          <h2>Frequently Asked Questions</h2>
          <p style={{ marginBottom: '30px' }}>
            Find answers to common questions about Checkpoint. Can't find what you're looking for?
            Feel free to <a href="/contact">contact us</a>.
          </p>

          <div>
            {faqData.map((faq, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <div
                  onClick={() => toggleFAQ(index)}
                  style={{
                    padding: '15px',
                    cursor: 'pointer',
                    backgroundColor: openIndex === index ? '#f0f0f0' : '#fff',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{faq.question}</span>
                  <span style={{ fontSize: '18px' }}>
                    {openIndex === index ? '−' : '+'}
                  </span>
                </div>
                {openIndex === index && (
                  <div style={{
                    padding: '15px',
                    borderTop: '1px solid #ddd',
                    backgroundColor: '#fafafa'
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
