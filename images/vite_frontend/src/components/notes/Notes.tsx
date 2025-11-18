import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import DOMPurify from 'dompurify'
import { Button, RichTextEditor } from '../common'
import { getNotes, createNote, updateNote, deleteNote } from '../../services/api'
import { formatDate, stripHtmlTags } from '../../utils'
import type { Note } from '../../types'

interface NotesProps {
  classroomUuid: string
  studentUuid?: string
  studentName?: string
}

export default function Notes({ classroomUuid, studentUuid, studentName }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteUuid, setEditingNoteUuid] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [classroomUuid, studentUuid])

  const fetchNotes = async () => {
    try {
      const response = await getNotes(classroomUuid, studentUuid)
      setNotes(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError('Failed to load notes')
      setLoading(false)
    }
  }

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripHtmlTags(newNoteContent)) return

    try {
      await createNote(classroomUuid, newNoteContent, studentUuid)
      setNewNoteContent('')
      fetchNotes()
    } catch (err) {
      setError('Failed to add note')
    }
  }

  const startEdit = (note: Note) => {
    setEditingNoteUuid(note.uuid)
    setEditContent(note.content)
  }

  const cancelEdit = () => {
    setEditingNoteUuid(null)
    setEditContent('')
  }

  const handleSaveEdit = async () => {
    if (!editingNoteUuid || !stripHtmlTags(editContent)) return

    try {
      await updateNote(editingNoteUuid, editContent)
      setEditingNoteUuid(null)
      setEditContent('')
      fetchNotes()
    } catch (err) {
      setError('Failed to update note')
    }
  }

  const handleDelete = async (noteUuid: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await deleteNote(noteUuid)
      fetchNotes()
    } catch (err) {
      setError('Failed to delete note')
    }
  }

  if (loading) {
    return <p>Loading notes...</p>
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h4>{studentName ? `Notes: ${studentName}` : 'My Private Notes'}</h4>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
        {studentName
          ? `Private notes about ${studentName}. Only visible to you.`
          : 'These notes are private and only visible to you.'}
      </p>

      <form onSubmit={handleAddNote} style={{ marginBottom: '30px' }}>
        <label>Add New Note</label>
        <RichTextEditor value={newNoteContent} onChange={setNewNoteContent} />
        <Button type="submit" style={{ marginTop: '10px' }}>
          Add Note
        </Button>
      </form>

      {notes.length === 0 ? (
        <p style={{ color: '#666' }}>No notes yet. Add your first note above!</p>
      ) : (
        <div>
          {notes.map((note) => (
            <div
              key={note.uuid}
              style={{
                marginBottom: '20px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}
            >
              {editingNoteUuid === note.uuid ? (
                <div>
                  <RichTextEditor value={editContent} onChange={setEditContent} />
                  <div style={{ marginTop: '10px' }}>
                    <Button onClick={handleSaveEdit} style={{ marginRight: '5px' }}>
                      Save
                    </Button>
                    <Button onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{ marginBottom: '10px' }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid #ddd'
                    }}
                  >
                    <small style={{ color: '#666' }}>
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at && ' (edited)'}
                    </small>
                    <div>
                      <Button
                        size="small"
                        onClick={() => startEdit(note)}
                        style={{ marginRight: '5px' }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleDelete(note.uuid)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
