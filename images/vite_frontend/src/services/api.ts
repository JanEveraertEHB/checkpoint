import axios from 'axios'
import MD5 from 'crypto-js/md5'
import type { User, Classroom, Feedback, Checkpoint, StudentProgress } from '../types'

// Use /api prefix for Vite proxy, or direct URL for development
const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Hash password with MD5 before sending
const hashPassword = (password: string): string => {
  return MD5(password).toString()
}

// Auth APIs
export const loginUser = (email: string, password: string) =>
  api.post<User & { token: string }>('/users/login', { email, password: hashPassword(password) })

export const registerUser = (first_name: string, last_name: string, email: string, password: string) =>
  api.post<User & { token: string }>('/users/register', { first_name, last_name, email, password: hashPassword(password) })

export const validateToken = () =>
  api.get<User>('/users/validate_token')

// Classroom APIs
export const getClassrooms = () =>
  api.get<Classroom[]>('/classrooms')

export const getClassroom = (uuid: string) =>
  api.get<Classroom>(`/classrooms/${uuid}`)

export const createClassroom = (name: string, academic_year: string, allowed_email_domain?: string) =>
  api.post<Classroom>('/classrooms', { name, academic_year, allowed_email_domain: allowed_email_domain || null })

export const joinClassroom = (invite_code: string) =>
  api.post<Classroom>(`/classrooms/join/${invite_code}`)

export const getInviteCode = (uuid: string) =>
  api.get<{ invite_code: string }>(`/classrooms/${uuid}/invite`)

export const removeStudentFromClassroom = (classroom_uuid: string, student_uuid: string) =>
  api.delete(`/classrooms/${classroom_uuid}/students/${student_uuid}`)

export const leaveClassroom = (classroom_uuid: string) =>
  api.post(`/classrooms/${classroom_uuid}/leave`)

export const rejoinClassroom = (classroom_uuid: string) =>
  api.post(`/classrooms/${classroom_uuid}/rejoin`)

export const completeClassroom = (classroom_uuid: string) =>
  api.post(`/classrooms/${classroom_uuid}/complete`)

// Feedback APIs
export const getFeedbackForStudent = (classroom_uuid: string, student_uuid: string) =>
  api.get<Feedback[]>(`/feedback/classroom/${classroom_uuid}/student/${student_uuid}`)

export const getMyFeedback = (classroom_uuid: string) =>
  api.get<Feedback[]>(`/feedback/classroom/${classroom_uuid}/my-feedback`)

export const createFeedback = (classroom_uuid: string, student_uuid: string, content: string) =>
  api.post<Feedback>('/feedback', { classroom_uuid, student_uuid, content })

export const updateFeedback = (feedback_uuid: string, content: string) =>
  api.put<Feedback>(`/feedback/${feedback_uuid}`, { content })

export const lockFeedback = (feedback_uuid: string, locked: boolean) =>
  api.put(`/feedback/${feedback_uuid}/lock`, { locked })

export const uploadFeedbackImages = (feedback_uuid: string, files: FileList) => {
  const formData = new FormData()
  Array.from(files).forEach(file => {
    formData.append('images', file)
  })
  return api.post(`/feedback/${feedback_uuid}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const deleteFeedbackImage = (image_uuid: string) =>
  api.delete(`/feedback/images/${image_uuid}`)

// Checkpoint APIs
export const getCheckpoints = (classroom_uuid: string) =>
  api.get<Checkpoint[]>(`/checkpoints/classroom/${classroom_uuid}`)

export const createCheckpoint = (classroom_uuid: string, name: string, description: string) =>
  api.post<Checkpoint>('/checkpoints', { classroom_uuid, name, description })

export const deleteCheckpoint = (checkpoint_uuid: string) =>
  api.delete(`/checkpoints/${checkpoint_uuid}`)

export const getStudentProgress = (classroom_uuid: string, student_uuid: string) =>
  api.get<StudentProgress>(`/checkpoints/classroom/${classroom_uuid}/student/${student_uuid}/progress`)

export const markCheckpointReached = (checkpoint_uuid: string, student_uuid: string) =>
  api.post(`/checkpoints/${checkpoint_uuid}/students/${student_uuid}`)

export const unmarkCheckpointReached = (checkpoint_uuid: string, student_uuid: string) =>
  api.delete(`/checkpoints/${checkpoint_uuid}/students/${student_uuid}`)

export default api
