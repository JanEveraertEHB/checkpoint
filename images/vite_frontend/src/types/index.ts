export interface User {
  id: number
  uuid: string
  email: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
  token?: string
}

export interface Classroom {
  id: number
  uuid: string
  name: string
  academic_year: string
  teacher_uuid: string
  invite_code: string
  created_at: string
  updated_at: string
  role: 'teacher' | 'student'
  teacher_first_name: string
  teacher_last_name: string
  students?: Student[]
  completed?: boolean
  completed_at?: string | null
  active?: boolean
  allowed_email_domain?: string | null
}

export interface Student {
  uuid: string
  first_name: string
  last_name: string
  email: string
  active?: boolean
}

export interface FeedbackImage {
  id: number
  uuid: string
  feedback_uuid: string
  filename: string
  original_name: string
  mimetype: string
  size: number
  created_at: string
  updated_at: string
}

export interface FeedbackDocument {
  id: number
  uuid: string
  feedback_uuid: string
  filename: string
  original_name: string
  mimetype: string
  size: number
  created_at: string
  updated_at: string
}

export interface Feedback {
  id: number
  uuid: string
  classroom_uuid: string
  student_uuid: string
  created_by_uuid: string
  content: string
  locked: boolean
  created_at: string
  updated_at: string
  created_by_first_name: string
  created_by_last_name: string
  images?: FeedbackImage[]
  documents?: FeedbackDocument[]
}

export interface Checkpoint {
  id: number
  uuid: string
  classroom_uuid: string
  name: string
  description: string
  order_index: number
  created_at: string
  updated_at: string
  reached?: boolean
  reached_at?: string | null
}

export interface StudentProgress {
  checkpoints: Checkpoint[]
  next_checkpoint: Checkpoint | null
}

export interface TimelineItem {
  type: 'feedback' | 'checkpoint'
  date: string
  data: Feedback | Checkpoint
}

export interface Note {
  id: number
  uuid: string
  classroom_uuid: string
  user_uuid: string
  student_uuid: string | null
  content: string
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (first_name: string, last_name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}
