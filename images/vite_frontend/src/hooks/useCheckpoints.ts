import { useState, useCallback } from 'react'
import {
  getCheckpoints,
  createCheckpoint,
  deleteCheckpoint,
  updateCheckpoint,
  reorderCheckpoint as reorderCheckpointApi,
  checkHasProgress,
  getStudentProgress,
  markCheckpointReached,
  unmarkCheckpointReached
} from '../services/api'
import type { Checkpoint } from '../types'

export function useCheckpoints(classroomUuid: string | undefined) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [studentProgress, setStudentProgress] = useState<Checkpoint[]>([])
  const [nextCheckpoint, setNextCheckpoint] = useState<Checkpoint | null>(null)
  const [hasProgress, setHasProgress] = useState(false)
  const [error, setError] = useState('')

  const fetchCheckpoints = useCallback(async () => {
    if (!classroomUuid) return
    try {
      const response = await getCheckpoints(classroomUuid)
      setCheckpoints(response.data)
    } catch (err) {
      console.error('Error fetching checkpoints:', err)
    }
  }, [classroomUuid])

  const fetchHasProgress = useCallback(async () => {
    if (!classroomUuid) return
    try {
      const response = await checkHasProgress(classroomUuid)
      setHasProgress(response.data.has_progress)
    } catch (err) {
      console.error('Error checking progress:', err)
    }
  }, [classroomUuid])

  const fetchStudentProgress = useCallback(async (studentUuid: string) => {
    if (!classroomUuid) return
    try {
      const response = await getStudentProgress(classroomUuid, studentUuid)
      setStudentProgress(response.data.checkpoints)
      setNextCheckpoint(response.data.next_checkpoint)
    } catch (err) {
      console.error('Error fetching student progress:', err)
    }
  }, [classroomUuid])

  const addCheckpoint = useCallback(async (name: string, description: string) => {
    if (!classroomUuid) return
    try {
      await createCheckpoint(classroomUuid, name, description)
      await fetchCheckpoints()
    } catch (err) {
      setError('Failed to create checkpoint')
      throw err
    }
  }, [classroomUuid, fetchCheckpoints])

  const removeCheckpoint = useCallback(async (checkpointUuid: string) => {
    try {
      await deleteCheckpoint(checkpointUuid)
      await fetchCheckpoints()
    } catch (err) {
      setError('Failed to delete checkpoint')
      throw err
    }
  }, [fetchCheckpoints])

  const editCheckpoint = useCallback(async (checkpointUuid: string, name: string, description: string) => {
    try {
      await updateCheckpoint(checkpointUuid, name, description)
      await fetchCheckpoints()
    } catch (err) {
      setError('Failed to update checkpoint')
      throw err
    }
  }, [fetchCheckpoints])

  const reorderCheckpoint = useCallback(async (checkpointUuid: string, newOrderIndex: number) => {
    try {
      await reorderCheckpointApi(checkpointUuid, newOrderIndex)
      await fetchCheckpoints()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Failed to reorder checkpoint')
      throw err
    }
  }, [fetchCheckpoints])

  const toggleCheckpointReached = useCallback(async (checkpointUuid: string, studentUuid: string, reached: boolean) => {
    try {
      if (reached) {
        await unmarkCheckpointReached(checkpointUuid, studentUuid)
      } else {
        await markCheckpointReached(checkpointUuid, studentUuid)
      }
      await fetchStudentProgress(studentUuid)
    } catch (err) {
      setError('Failed to update checkpoint')
      throw err
    }
  }, [fetchStudentProgress])

  return {
    checkpoints,
    studentProgress,
    nextCheckpoint,
    hasProgress,
    error,
    setError,
    fetchCheckpoints,
    fetchHasProgress,
    fetchStudentProgress,
    addCheckpoint,
    removeCheckpoint,
    editCheckpoint,
    reorderCheckpoint,
    toggleCheckpointReached
  }
}
