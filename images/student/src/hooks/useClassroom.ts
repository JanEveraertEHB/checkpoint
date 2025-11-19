import { useState, useEffect } from 'react'
import { getClassroom, getInviteCode } from '../services/api'
import type { Classroom } from '../types'

export function useClassroom(uuid: string | undefined) {
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showInviteCode, setShowInviteCode] = useState(false)

  useEffect(() => {
    if (uuid) {
      fetchClassroom()
    }
  }, [uuid])

  const fetchClassroom = async () => {
    try {
      const response = await getClassroom(uuid!)
      setClassroom(response.data)
    } catch (err) {
      setError('Failed to load classroom')
    } finally {
      setLoading(false)
    }
  }

  const fetchInviteCode = async () => {
    if (!uuid) return
    try {
      const response = await getInviteCode(uuid)
      setInviteCode(response.data.invite_code)
      setShowInviteCode(true)
    } catch (err) {
      setError('Failed to get invite code')
    }
  }

  return {
    classroom,
    loading,
    error,
    setError,
    inviteCode,
    showInviteCode,
    fetchInviteCode,
    refreshClassroom: fetchClassroom
  }
}
