import { useState, useEffect, FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import DOMPurify from 'dompurify'
import { useAuth } from '../contexts/AuthContext'
import {
  getClassroom,
  getInviteCode,
  getFeedbackForStudent,
  getMyFeedback,
  createFeedback,
  updateFeedback,
  lockFeedback,
  uploadFeedbackImages,
  deleteFeedbackImage,
  getCheckpoints,
  createCheckpoint,
  deleteCheckpoint,
  getStudentProgress,
  markCheckpointReached,
  unmarkCheckpointReached
} from '../services/api'
import type { Classroom, Student, Feedback, Checkpoint, TimelineItem, FeedbackImage } from '../types'

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ],
}

export default function ClassroomDetail() {
  const { uuid } = useParams<{ uuid: string }>()
  const { user } = useAuth()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [newFeedback, setNewFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInviteCode, setShowInviteCode] = useState(false)

  // Checkpoint state
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [studentProgress, setStudentProgress] = useState<Checkpoint[]>([])
  const [nextCheckpoint, setNextCheckpoint] = useState<Checkpoint | null>(null)
  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false)
  const [newCheckpointName, setNewCheckpointName] = useState('')
  const [newCheckpointDescription, setNewCheckpointDescription] = useState('')

  // Edit feedback state
  const [editingFeedbackUuid, setEditingFeedbackUuid] = useState<string | null>(null)
  const [editFeedbackContent, setEditFeedbackContent] = useState('')

  // Image upload state
  const [uploadingImagesFeedbackUuid, setUploadingImagesFeedbackUuid] = useState<string | null>(null)

  useEffect(() => {
    if (uuid) {
      fetchClassroom()
    }
  }, [uuid])

  useEffect(() => {
    if (classroom && uuid) {
      fetchCheckpoints()
      if (classroom.role === 'student' && user) {
        fetchMyFeedback()
        fetchMyProgress()
      }
    }
  }, [classroom, user])

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

  const fetchCheckpoints = async () => {
    try {
      const response = await getCheckpoints(uuid!)
      setCheckpoints(response.data)
    } catch (err) {
      console.error('Error fetching checkpoints:', err)
    }
  }

  const fetchMyProgress = async () => {
    if (!user) return
    try {
      const response = await getStudentProgress(uuid!, user.uuid)
      setStudentProgress(response.data.checkpoints)
      setNextCheckpoint(response.data.next_checkpoint)
    } catch (err) {
      console.error('Error fetching progress:', err)
    }
  }

  const fetchStudentProgress = async (studentUuid: string) => {
    try {
      const response = await getStudentProgress(uuid!, studentUuid)
      setStudentProgress(response.data.checkpoints)
    } catch (err) {
      console.error('Error fetching student progress:', err)
    }
  }

  const fetchInviteCode = async () => {
    try {
      const response = await getInviteCode(uuid!)
      setInviteCode(response.data.invite_code)
      setShowInviteCode(true)
    } catch (err) {
      setError('Failed to get invite code')
    }
  }

  const fetchMyFeedback = async () => {
    try {
      const response = await getMyFeedback(uuid!)
      setFeedback(response.data)
    } catch (err) {
      console.error('Error fetching feedback:', err)
    }
  }

  const fetchStudentFeedback = async (studentUuid: string) => {
    try {
      const response = await getFeedbackForStudent(uuid!, studentUuid)
      setFeedback(response.data)
    } catch (err) {
      console.error('Error fetching student feedback:', err)
    }
  }

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    fetchStudentFeedback(student.uuid)
    fetchStudentProgress(student.uuid)
  }

  const handleAddFeedback = async (e: FormEvent) => {
    e.preventDefault()
    const strippedContent = newFeedback.replace(/<[^>]*>/g, '').trim()
    if (!strippedContent) return

    const studentUuid = classroom?.role === 'teacher' ? selectedStudent?.uuid : user?.uuid
    if (!studentUuid) return

    try {
      await createFeedback(uuid!, studentUuid, newFeedback)
      setNewFeedback('')
      if (classroom?.role === 'teacher' && selectedStudent) {
        fetchStudentFeedback(selectedStudent.uuid)
      } else {
        fetchMyFeedback()
      }
    } catch (err) {
      setError('Failed to add feedback')
    }
  }

  const handleAddCheckpoint = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCheckpointName.trim()) return

    try {
      await createCheckpoint(uuid!, newCheckpointName, newCheckpointDescription)
      setNewCheckpointName('')
      setNewCheckpointDescription('')
      setShowAddCheckpoint(false)
      fetchCheckpoints()
    } catch (err) {
      setError('Failed to create checkpoint')
    }
  }

  const handleToggleCheckpoint = async (checkpointUuid: string, reached: boolean) => {
    if (!selectedStudent) return

    try {
      if (reached) {
        await unmarkCheckpointReached(checkpointUuid, selectedStudent.uuid)
      } else {
        await markCheckpointReached(checkpointUuid, selectedStudent.uuid)
      }
      fetchStudentProgress(selectedStudent.uuid)
      fetchStudentFeedback(selectedStudent.uuid)
    } catch (err) {
      setError('Failed to update checkpoint')
    }
  }

  const handleDeleteCheckpoint = async (checkpointUuid: string) => {
    if (!confirm('Are you sure you want to delete this checkpoint? This will also remove all student progress for this checkpoint.')) {
      return
    }

    try {
      await deleteCheckpoint(checkpointUuid)
      fetchCheckpoints()
      if (selectedStudent) {
        fetchStudentProgress(selectedStudent.uuid)
      }
    } catch (err) {
      setError('Failed to delete checkpoint')
    }
  }

  const handleStartEditFeedback = (fb: Feedback) => {
    setEditingFeedbackUuid(fb.uuid)
    setEditFeedbackContent(fb.content)
  }

  const handleCancelEditFeedback = () => {
    setEditingFeedbackUuid(null)
    setEditFeedbackContent('')
  }

  const handleSaveEditFeedback = async () => {
    if (!editingFeedbackUuid) return

    const strippedContent = editFeedbackContent.replace(/<[^>]*>/g, '').trim()
    if (!strippedContent) return

    try {
      await updateFeedback(editingFeedbackUuid, editFeedbackContent)
      setEditingFeedbackUuid(null)
      setEditFeedbackContent('')
      if (classroom?.role === 'teacher' && selectedStudent) {
        fetchStudentFeedback(selectedStudent.uuid)
      } else {
        fetchMyFeedback()
      }
    } catch (err) {
      setError('Failed to update feedback')
    }
  }

  const handleToggleLockFeedback = async (feedbackUuid: string, currentLocked: boolean) => {
    try {
      await lockFeedback(feedbackUuid, !currentLocked)
      if (selectedStudent) {
        fetchStudentFeedback(selectedStudent.uuid)
      }
    } catch (err) {
      setError('Failed to lock/unlock feedback')
    }
  }

  const canEditFeedback = (fb: Feedback) => {
    if (!user) return false
    // Can only edit own feedback
    if (fb.created_by_uuid !== user.uuid) return false
    // Teachers can always edit their own
    if (classroom?.role === 'teacher') return true
    // Students can only edit if not locked
    return !fb.locked
  }

  const handleImageUpload = async (feedbackUuid: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    try {
      await uploadFeedbackImages(feedbackUuid, files)
      setUploadingImagesFeedbackUuid(null)
      if (classroom?.role === 'teacher' && selectedStudent) {
        fetchStudentFeedback(selectedStudent.uuid)
      } else {
        fetchMyFeedback()
      }
    } catch (err) {
      setError('Failed to upload images')
    }
  }

  const handleDeleteImage = async (imageUuid: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      await deleteFeedbackImage(imageUuid)
      if (classroom?.role === 'teacher' && selectedStudent) {
        fetchStudentFeedback(selectedStudent.uuid)
      } else {
        fetchMyFeedback()
      }
    } catch (err) {
      setError('Failed to delete image')
    }
  }

  const getImageUrl = (filename: string) => {
    return `/uploads/${filename}`
  }

  const canAddImagesToFeedback = (fb: Feedback) => {
    if (!user) return false
    // Can only add images to own feedback
    if (fb.created_by_uuid !== user.uuid) return false
    // Students can only add images if not locked
    if (classroom?.role === 'student' && fb.locked) return false
    return true
  }

  const renderFeedbackImages = (fb: Feedback) => {
    if (!fb.images || fb.images.length === 0) return null

    return (
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {fb.images.map((img) => (
            <div key={img.uuid} style={{ position: 'relative' }}>
              <img
                src={getImageUrl(img.filename)}
                alt={img.original_name}
                style={{
                  maxWidth: '200px',
                  maxHeight: '150px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => window.open(getImageUrl(img.filename), '_blank')}
                title="Click to view full size"
              />
              {canAddImagesToFeedback(fb) && (
                <button
                  onClick={() => handleDeleteImage(img.uuid)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title="Delete image"
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderImageUpload = (fb: Feedback) => {
    if (!canAddImagesToFeedback(fb)) return null

    return (
      <div style={{ marginTop: '10px' }}>
        {uploadingImagesFeedbackUuid === fb.uuid ? (
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(fb.uuid, e.target.files)}
              style={{ marginBottom: '5px' }}
            />
            <button
              onClick={() => setUploadingImagesFeedbackUuid(null)}
              style={{ fontSize: '0.8rem', padding: '2px 8px' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setUploadingImagesFeedbackUuid(fb.uuid)}
            style={{
              fontSize: '0.8rem',
              padding: '2px 8px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none'
            }}
          >
            Add Images
          </button>
        )}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Build timeline with both feedback and checkpoint achievements
  const buildTimeline = (): TimelineItem[] => {
    const items: TimelineItem[] = []

    // Add feedback items
    feedback.forEach(fb => {
      items.push({
        type: 'feedback',
        date: fb.created_at,
        data: fb
      })
    })

    // Add reached checkpoints
    studentProgress.forEach(cp => {
      if (cp.reached && cp.reached_at) {
        items.push({
          type: 'checkpoint',
          date: cp.reached_at,
          data: cp
        })
      }
    })

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return items
  }

  if (loading) {
    return <div className="container"><p>Loading...</p></div>
  }

  if (error && !classroom) {
    return <div className="container"><p style={{ color: 'red' }}>{error}</p></div>
  }

  if (!classroom) {
    return <div className="container"><p>Classroom not found</p></div>
  }

  const timeline = buildTimeline()

  return (
    <div className="container">
      <div className="row">
        <div className="twelve columns">
          <Link to="/home">Back to My Classrooms</Link>
          <h2>{classroom.name}</h2>
          <p>
            <strong>Academic Year:</strong> {classroom.academic_year}<br />
            <strong>Teacher:</strong> {classroom.teacher_first_name} {classroom.teacher_last_name}<br />
            <strong>Your Role:</strong> {classroom.role}
          </p>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {classroom.role === 'teacher' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <button onClick={fetchInviteCode} style={{ marginRight: '10px' }}>
                  {showInviteCode ? 'Refresh Invite Code' : 'Get Invite Link'}
                </button>
                <button onClick={() => setShowAddCheckpoint(!showAddCheckpoint)}>
                  {showAddCheckpoint ? 'Cancel' : 'Add Checkpoint'}
                </button>
                {showInviteCode && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
                    <strong>Invite Code:</strong> {inviteCode}<br />
                    <small>Share this code with students to join this classroom</small>
                  </div>
                )}
              </div>

              {showAddCheckpoint && (
                <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd' }}>
                  <h4>Add New Checkpoint</h4>
                  <form onSubmit={handleAddCheckpoint}>
                    <label htmlFor="checkpointName">Name</label>
                    <input
                      className="u-full-width"
                      type="text"
                      id="checkpointName"
                      value={newCheckpointName}
                      onChange={(e) => setNewCheckpointName(e.target.value)}
                      required
                    />
                    <label htmlFor="checkpointDescription">Description</label>
                    <textarea
                      className="u-full-width"
                      id="checkpointDescription"
                      value={newCheckpointDescription}
                      onChange={(e) => setNewCheckpointDescription(e.target.value)}
                      rows={3}
                    />
                    <button className="button-primary" type="submit">Create Checkpoint</button>
                  </form>
                </div>
              )}

              {checkpoints.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>Checkpoints</h4>
                  <ol>
                    {checkpoints.map((cp) => (
                      <li key={cp.uuid} style={{ marginBottom: '10px' }}>
                        <strong>{cp.name}</strong>
                        {cp.description && <span> - {cp.description}</span>}
                        <button
                          onClick={() => handleDeleteCheckpoint(cp.uuid)}
                          style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            fontSize: '0.8rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="row">
                <div className="four columns">
                  <h4>Students</h4>
                  {classroom.students && classroom.students.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {classroom.students.map((student) => (
                        <li
                          key={student.uuid}
                          style={{
                            padding: '10px',
                            marginBottom: '5px',
                            backgroundColor: selectedStudent?.uuid === student.uuid ? '#ddd' : '#f9f9f9',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSelectStudent(student)}
                        >
                          {student.first_name} {student.last_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No students yet. Share the invite code.</p>
                  )}
                </div>
                <div className="eight columns">
                  {selectedStudent ? (
                    <>
                      <h4>{selectedStudent.first_name} {selectedStudent.last_name}</h4>

                      {checkpoints.length > 0 && (
                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0' }}>
                          <h5>Checkpoint Progress</h5>
                          {studentProgress.map((cp) => (
                            <div key={cp.uuid} style={{ marginBottom: '5px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={cp.reached || false}
                                  onChange={() => handleToggleCheckpoint(cp.uuid, cp.reached || false)}
                                  style={{ marginRight: '10px' }}
                                />
                                <span style={{ textDecoration: cp.reached ? 'line-through' : 'none' }}>
                                  {cp.order_index}. {cp.name}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      <form onSubmit={handleAddFeedback} style={{ marginBottom: '20px' }}>
                        <label htmlFor="newFeedback">Add Feedback</label>
                        <div style={{ marginBottom: '10px' }}>
                          <ReactQuill
                            theme="snow"
                            value={newFeedback}
                            onChange={setNewFeedback}
                            modules={quillModules}
                            placeholder="Write your feedback here..."
                          />
                        </div>
                        <button className="button-primary" type="submit">Add Feedback</button>
                      </form>

                      <h5>Timeline</h5>
                      {timeline.length > 0 ? (
                        <div>
                          {timeline.map((item, index) => (
                            <div
                              key={index}
                              style={{
                                padding: '15px',
                                marginBottom: '10px',
                                borderLeft: item.type === 'checkpoint' ? '4px solid #4CAF50' : '4px solid #333',
                                backgroundColor: item.type === 'checkpoint' ? '#e8f5e9' : '#f9f9f9'
                              }}
                            >
                              {item.type === 'checkpoint' ? (
                                <>
                                  <p style={{ margin: 0, fontWeight: 'bold', color: '#4CAF50' }}>
                                    Checkpoint Reached: {(item.data as Checkpoint).name}
                                  </p>
                                  <small style={{ color: '#666' }}>
                                    {formatDate(item.date)}
                                  </small>
                                </>
                              ) : (
                                <>
                                  {editingFeedbackUuid === (item.data as Feedback).uuid ? (
                                    <div>
                                      <ReactQuill
                                        theme="snow"
                                        value={editFeedbackContent}
                                        onChange={setEditFeedbackContent}
                                        modules={quillModules}
                                      />
                                      <div style={{ marginTop: '10px' }}>
                                        <button className="button-primary" onClick={handleSaveEditFeedback}>Save</button>
                                        <button onClick={handleCancelEditFeedback} style={{ marginLeft: '10px' }}>Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div
                                        style={{ margin: 0 }}
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((item.data as Feedback).content) }}
                                      />
                                      {renderFeedbackImages(item.data as Feedback)}
                                      <small style={{ color: '#666' }}>
                                        By {(item.data as Feedback).created_by_first_name} {(item.data as Feedback).created_by_last_name} on {formatDate(item.date)}
                                        {(item.data as Feedback).locked && <span style={{ color: '#dc3545', marginLeft: '10px' }}>[Locked]</span>}
                                      </small>
                                      <div style={{ marginTop: '10px' }}>
                                        {canEditFeedback(item.data as Feedback) && (
                                          <button
                                            onClick={() => handleStartEditFeedback(item.data as Feedback)}
                                            style={{ fontSize: '0.8rem', padding: '2px 8px', marginRight: '5px' }}
                                          >
                                            Edit
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleToggleLockFeedback((item.data as Feedback).uuid, (item.data as Feedback).locked)}
                                          style={{
                                            fontSize: '0.8rem',
                                            padding: '2px 8px',
                                            backgroundColor: (item.data as Feedback).locked ? '#28a745' : '#ffc107',
                                            color: (item.data as Feedback).locked ? 'white' : 'black',
                                            border: 'none'
                                          }}
                                        >
                                          {(item.data as Feedback).locked ? 'Unlock' : 'Lock'}
                                        </button>
                                      </div>
                                      {renderImageUpload(item.data as Feedback)}
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No feedback or checkpoints yet for this student.</p>
                      )}
                    </>
                  ) : (
                    <p>Select a student to view and add feedback.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {classroom.role === 'student' && (
            <div>
              {nextCheckpoint && (
                <div style={{
                  marginBottom: '20px',
                  padding: '20px',
                  backgroundColor: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '5px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>Next Checkpoint</h4>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {nextCheckpoint.name}
                  </p>
                  {nextCheckpoint.description && (
                    <p style={{ margin: '10px 0 0 0', color: '#666' }}>
                      {nextCheckpoint.description}
                    </p>
                  )}
                </div>
              )}

              {studentProgress.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>Your Progress</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {studentProgress.map((cp) => (
                      <div
                        key={cp.uuid}
                        style={{
                          padding: '10px 15px',
                          backgroundColor: cp.reached ? '#4CAF50' : '#ddd',
                          color: cp.reached ? 'white' : '#666',
                          borderRadius: '20px',
                          fontSize: '0.9rem'
                        }}
                      >
                        {cp.order_index}. {cp.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h4>My Timeline</h4>
              <form onSubmit={handleAddFeedback} style={{ marginBottom: '20px' }}>
                <label htmlFor="newFeedback">Add Your Own Feedback</label>
                <div style={{ marginBottom: '10px' }}>
                  <ReactQuill
                    theme="snow"
                    value={newFeedback}
                    onChange={setNewFeedback}
                    modules={quillModules}
                    placeholder="Record feedback you received..."
                  />
                </div>
                <button className="button-primary" type="submit">Add Feedback</button>
              </form>

              {timeline.length > 0 ? (
                <div>
                  {timeline.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '15px',
                        marginBottom: '10px',
                        borderLeft: item.type === 'checkpoint' ? '4px solid #4CAF50' : '4px solid #333',
                        backgroundColor: item.type === 'checkpoint' ? '#e8f5e9' : '#f9f9f9'
                      }}
                    >
                      {item.type === 'checkpoint' ? (
                        <>
                          <p style={{ margin: 0, fontWeight: 'bold', color: '#4CAF50' }}>
                            Checkpoint Reached: {(item.data as Checkpoint).name}
                          </p>
                          <small style={{ color: '#666' }}>
                            {formatDate(item.date)}
                          </small>
                        </>
                      ) : (
                        <>
                          {editingFeedbackUuid === (item.data as Feedback).uuid ? (
                            <div>
                              <ReactQuill
                                theme="snow"
                                value={editFeedbackContent}
                                onChange={setEditFeedbackContent}
                                modules={quillModules}
                              />
                              <div style={{ marginTop: '10px' }}>
                                <button className="button-primary" onClick={handleSaveEditFeedback}>Save</button>
                                <button onClick={handleCancelEditFeedback} style={{ marginLeft: '10px' }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                style={{ margin: 0 }}
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((item.data as Feedback).content) }}
                              />
                              {renderFeedbackImages(item.data as Feedback)}
                              <small style={{ color: '#666' }}>
                                By {(item.data as Feedback).created_by_first_name} {(item.data as Feedback).created_by_last_name} on {formatDate(item.date)}
                                {(item.data as Feedback).locked && <span style={{ color: '#dc3545', marginLeft: '10px' }}>[Locked]</span>}
                              </small>
                              {canEditFeedback(item.data as Feedback) && (
                                <div style={{ marginTop: '10px' }}>
                                  <button
                                    onClick={() => handleStartEditFeedback(item.data as Feedback)}
                                    style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                              {renderImageUpload(item.data as Feedback)}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No feedback or checkpoints yet. Add your own feedback or wait for your teacher.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
