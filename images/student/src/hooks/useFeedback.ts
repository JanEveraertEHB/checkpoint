import { useState, useCallback } from 'react'
import {
  getFeedbackForStudent,
  getMyFeedback,
  createFeedback,
  updateFeedback,
  lockFeedback,
  uploadFeedbackImages,
  deleteFeedbackImage,
  uploadFeedbackDocuments,
  deleteFeedbackDocument
} from '../services/api'
import type { Feedback, User, Classroom } from '../types'

export function useFeedback(classroomUuid: string | undefined) {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [editingFeedbackUuid, setEditingFeedbackUuid] = useState<string | null>(null)
  const [editFeedbackContent, setEditFeedbackContent] = useState('')
  const [uploadingImagesFeedbackUuid, setUploadingImagesFeedbackUuid] = useState<string | null>(null)
  const [uploadingDocumentsFeedbackUuid, setUploadingDocumentsFeedbackUuid] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchMyFeedback = useCallback(async () => {
    if (!classroomUuid) return
    try {
      const response = await getMyFeedback(classroomUuid)
      setFeedback(response.data)
    } catch (err) {
      console.error('Error fetching feedback:', err)
    }
  }, [classroomUuid])

  const fetchStudentFeedback = useCallback(async (studentUuid: string) => {
    if (!classroomUuid) return
    try {
      const response = await getFeedbackForStudent(classroomUuid, studentUuid)
      setFeedback(response.data)
    } catch (err) {
      console.error('Error fetching student feedback:', err)
    }
  }, [classroomUuid])

  const addFeedback = useCallback(async (studentUuid: string, content: string) => {
    if (!classroomUuid) return
    try {
      await createFeedback(classroomUuid, studentUuid, content)
    } catch (err) {
      setError('Failed to add feedback')
      throw err
    }
  }, [classroomUuid])

  const saveFeedbackEdit = useCallback(async () => {
    if (!editingFeedbackUuid) return
    try {
      await updateFeedback(editingFeedbackUuid, editFeedbackContent)
      setEditingFeedbackUuid(null)
      setEditFeedbackContent('')
    } catch (err) {
      setError('Failed to update feedback')
      throw err
    }
  }, [editingFeedbackUuid, editFeedbackContent])

  const toggleFeedbackLock = useCallback(async (feedbackUuid: string, currentLocked: boolean) => {
    try {
      await lockFeedback(feedbackUuid, !currentLocked)
    } catch (err) {
      setError('Failed to lock/unlock feedback')
      throw err
    }
  }, [])

  const uploadImages = useCallback(async (feedbackUuid: string, files: FileList) => {
    try {
      await uploadFeedbackImages(feedbackUuid, files)
      setUploadingImagesFeedbackUuid(null)
    } catch (err) {
      setError('Failed to upload images')
      throw err
    }
  }, [])

  const deleteImage = useCallback(async (imageUuid: string) => {
    try {
      await deleteFeedbackImage(imageUuid)
    } catch (err) {
      setError('Failed to delete image')
      throw err
    }
  }, [])

  const uploadDocuments = useCallback(async (feedbackUuid: string, files: FileList) => {
    try {
      await uploadFeedbackDocuments(feedbackUuid, files)
      setUploadingDocumentsFeedbackUuid(null)
    } catch (err) {
      setError('Failed to upload documents')
      throw err
    }
  }, [])

  const deleteDocument = useCallback(async (documentUuid: string) => {
    try {
      await deleteFeedbackDocument(documentUuid)
    } catch (err) {
      setError('Failed to delete document')
      throw err
    }
  }, [])

  const startEditFeedback = useCallback((fb: Feedback) => {
    setEditingFeedbackUuid(fb.uuid)
    setEditFeedbackContent(fb.content)
  }, [])

  const cancelEditFeedback = useCallback(() => {
    setEditingFeedbackUuid(null)
    setEditFeedbackContent('')
  }, [])

  const canEditFeedback = useCallback((fb: Feedback, user: User | null, classroom: Classroom | null) => {
    if (!user) return false
    if (fb.created_by_uuid !== user.uuid) return false
    if (classroom?.role === 'teacher') return true
    return !fb.locked
  }, [])

  const canAddImagesToFeedback = useCallback((fb: Feedback, user: User | null, classroom: Classroom | null) => {
    if (!user) return false
    if (fb.created_by_uuid !== user.uuid) return false
    if (classroom?.role === 'student' && fb.locked) return false
    return true
  }, [])

  const canAddDocumentsToFeedback = useCallback((fb: Feedback, user: User | null, classroom: Classroom | null) => {
    if (!user) return false
    if (fb.created_by_uuid !== user.uuid) return false
    if (classroom?.role === 'student' && fb.locked) return false
    return true
  }, [])

  return {
    feedback,
    editingFeedbackUuid,
    editFeedbackContent,
    uploadingImagesFeedbackUuid,
    uploadingDocumentsFeedbackUuid,
    error,
    setError,
    setEditFeedbackContent,
    setUploadingImagesFeedbackUuid,
    setUploadingDocumentsFeedbackUuid,
    fetchMyFeedback,
    fetchStudentFeedback,
    addFeedback,
    saveFeedbackEdit,
    toggleFeedbackLock,
    uploadImages,
    deleteImage,
    uploadDocuments,
    deleteDocument,
    startEditFeedback,
    cancelEditFeedback,
    canEditFeedback,
    canAddImagesToFeedback,
    canAddDocumentsToFeedback
  }
}
