const express = require('express')
const router = express.Router()
const { uuidv4 } = require('./../helpers/uuidHelpers')
const { decodeToken } = require('./../helpers/authHelpers')
const pg = require('./../db/db.js')

// Get all notes for current user in a classroom
router.get('/classroom/:classroom_uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const classroomUuid = req.params.classroom_uuid

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: classroomUuid, user_uuid: userUuid })
      .first()

    if (!membership) {
      return res.status(403).send({ message: "Not a member of this classroom" })
    }

    // Get notes for this user in this classroom
    const notes = await pg.get()('notes')
      .where({
        classroom_uuid: classroomUuid,
        user_uuid: userUuid
      })
      .orderBy('created_at', 'desc')

    res.status(200).send(notes)
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error fetching notes" })
  }
})

// Create a new note
router.post('/', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const { classroom_uuid, content } = req.body

    if (!classroom_uuid || !content) {
      return res.status(400).send({ message: "classroom_uuid and content are required" })
    }

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid, user_uuid: userUuid })
      .first()

    if (!membership) {
      return res.status(403).send({ message: "Not a member of this classroom" })
    }

    const noteData = {
      uuid: uuidv4(),
      classroom_uuid,
      user_uuid: userUuid,
      content
    }

    const [note] = await pg.get()('notes')
      .insert(noteData)
      .returning('*')

    res.status(200).send(note)
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error creating note" })
  }
})

// Update a note
router.put('/:uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const noteUuid = req.params.uuid
    const { content } = req.body

    if (!content) {
      return res.status(400).send({ message: "content is required" })
    }

    const note = await pg.get()('notes')
      .where({ uuid: noteUuid })
      .first()

    if (!note) {
      return res.status(404).send({ message: "Note not found" })
    }

    // Check if user owns this note
    if (note.user_uuid !== userUuid) {
      return res.status(403).send({ message: "Can only edit your own notes" })
    }

    await pg.get()('notes')
      .where({ uuid: noteUuid })
      .update({ content, updated_at: new Date() })

    const updatedNote = await pg.get()('notes')
      .where({ uuid: noteUuid })
      .first()

    res.status(200).send(updatedNote)
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error updating note" })
  }
})

// Delete a note
router.delete('/:uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const noteUuid = req.params.uuid

    const note = await pg.get()('notes')
      .where({ uuid: noteUuid })
      .first()

    if (!note) {
      return res.status(404).send({ message: "Note not found" })
    }

    // Check if user owns this note
    if (note.user_uuid !== userUuid) {
      return res.status(403).send({ message: "Can only delete your own notes" })
    }

    await pg.get()('notes')
      .where({ uuid: noteUuid })
      .delete()

    res.status(200).send({ message: "success" })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error deleting note" })
  }
})

module.exports = router
