const express = require('express')
const router = express.Router()
const { uuidv4 } = require("./../helpers/uuidHelpers")
const { decodeToken } = require("./../helpers/authHelpers")
const pg = require('./../db/db.js')

// Get all feedback requests for a classroom (teacher only)
router.get('/classroom/:classroom_uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const classroomUuid = req.params.classroom_uuid

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: classroomUuid, user_uuid: userUuid, role: 'teacher' })
      .first()

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can view feedback requests" })
    }

    const requests = await pg.get()('feedback_requests')
      .join('users', 'feedback_requests.student_uuid', 'users.uuid')
      .where({ 'feedback_requests.classroom_uuid': classroomUuid })
      .select(
        'feedback_requests.*',
        'users.first_name as student_first_name',
        'users.last_name as student_last_name',
        'users.email as student_email'
      )
      .orderBy('feedback_requests.created_at', 'desc')

    res.status(200).send(requests)
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error fetching feedback requests" })
  }
})

// Get unresolved feedback request count for teacher
router.get('/count', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid

    // Get all classrooms where user is teacher
    const classrooms = await pg.get()('classroom_members')
      .where({ user_uuid: userUuid, role: 'teacher' })
      .select('classroom_uuid')

    const classroomUuids = classrooms.map(c => c.classroom_uuid)

    if (classroomUuids.length === 0) {
      return res.status(200).send({ count: 0 })
    }

    const count = await pg.get()('feedback_requests')
      .whereIn('classroom_uuid', classroomUuids)
      .where('resolved', false)
      .count('* as count')
      .first()

    res.status(200).send({ count: parseInt(count.count) })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error fetching request count" })
  }
})

// Create a feedback request (student only)
router.post('/', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const { classroom_uuid, message } = req.body

    if (!classroom_uuid) {
      return res.status(400).send({ message: "classroom_uuid required" })
    }

    // Check if user is student in classroom
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid, user_uuid: userUuid, role: 'student', active: true })
      .first()

    if (!membership) {
      return res.status(403).send({ message: "Only active students can request feedback" })
    }

    // Check if classroom is completed
    const classroom = await pg.get()('classrooms')
      .where({ uuid: classroom_uuid })
      .first()

    if (classroom.completed) {
      return res.status(403).send({ message: "Cannot request feedback in completed classroom" })
    }

    const requestData = {
      uuid: uuidv4(),
      classroom_uuid,
      student_uuid: userUuid,
      message: message || null,
      resolved: false
    }

    const [request] = await pg.get()('feedback_requests')
      .insert(requestData)
      .returning('*')

    res.status(200).send({ ...request, message: "Feedback request created" })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error creating feedback request" })
  }
})

// Mark feedback request as resolved (teacher only)
router.put('/:uuid/resolve', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const requestUuid = req.params.uuid

    const request = await pg.get()('feedback_requests')
      .where({ uuid: requestUuid })
      .first()

    if (!request) {
      return res.status(404).send({ message: "Feedback request not found" })
    }

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: request.classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first()

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can resolve feedback requests" })
    }

    const [updated] = await pg.get()('feedback_requests')
      .where({ uuid: requestUuid })
      .update({
        resolved: true,
        resolved_at: pg.get().fn.now()
      })
      .returning('*')

    res.status(200).send({ ...updated, message: "Feedback request resolved" })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error resolving feedback request" })
  }
})

// Delete a feedback request
router.delete('/:uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const requestUuid = req.params.uuid

    const request = await pg.get()('feedback_requests')
      .where({ uuid: requestUuid })
      .first()

    if (!request) {
      return res.status(404).send({ message: "Feedback request not found" })
    }

    // Students can delete their own requests, teachers can delete any
    const isStudent = request.student_uuid === userUuid
    const isTeacher = await pg.get()('classroom_members')
      .where({ classroom_uuid: request.classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first()

    if (!isStudent && !isTeacher) {
      return res.status(403).send({ message: "Not authorized to delete this request" })
    }

    await pg.get()('feedback_requests')
      .where({ uuid: requestUuid })
      .delete()

    res.status(200).send({ message: "Feedback request deleted" })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error deleting feedback request" })
  }
})

module.exports = router
