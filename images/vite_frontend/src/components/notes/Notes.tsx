import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import DOMPurify from 'dompurify'
import { Button, RichTextEditor } from '../common'
import { getNotes, createNote, updateNote, deleteNote } from '../../services/api'
import { formatDate, stripHtmlTags } from '../../utils'
import type { Note } from '../../types'
import './Notes.css'

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
      {error && <p className="notes-error">{error}</p>}

      <h4>{studentName ? `Notes: ${studentName}` : 'My Private Notes'}</h4>
      <p className="notes-description">
        {studentName
          ? `Private notes about ${studentName}. Only visible to you.`
          : 'These notes are private and only visible to you.'}
      </p>

      <form onSubmit={handleAddNote} className="notes-form">
        <label>Add New Note</label>
        <RichTextEditor value={newNoteContent} onChange={setNewNoteContent} />
        <Button type="submit" className="notes-form-button">
          Add Note
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="notes-empty">No notes yet. Add your first note above!</p>
      ) : (
        <div>
          {notes.map((note) => (
            <div key={note.uuid} className="note-item">
              {editingNoteUuid === note.uuid ? (
                <div>
                  <RichTextEditor value={editContent} onChange={setEditContent} />
                  <div className="note-edit-actions">
                    <Button onClick={handleSaveEdit}>Save</Button>
                    <Button onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className="note-content"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}
                  />
                  <div className="note-footer">
                    <small className="note-timestamp">
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at && ' (edited)'}
                    </small>
                    <div className="note-actions">
                      <Button size="small" onClick={() => startEdit(note)}>
                        Edit
                      </Button>
                      <Button size="small" variant="danger" onClick={() => handleDelete(note.uuid)}>
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
