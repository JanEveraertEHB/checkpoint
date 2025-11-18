const express = require('express')
const router = express.Router()
const { uuidv4 } = require("./../helpers/uuidHelpers")
const { decodeToken } = require("./../helpers/authHelpers")
const pg = require('./../db/db.js')

// Get all feedback demands for a student
router.get('/student', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid

    const demands = await pg.get()('feedback_demands')
      .join('users', 'feedback_demands.teacher_uuid', 'users.uuid')
      .join('classrooms', 'feedback_demands.classroom_uuid', 'classrooms.uuid')
      .where({ 'feedback_demands.student_uuid': userUuid })
      .select(
        'feedback_demands.*',
        'users.first_name as teacher_first_name',
        'users.last_name as teacher_last_name',
        'classrooms.name as classroom_name'
      )
      .orderBy('feedback_demands.created_at', 'desc')

    res.status(200).send(demands)
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error fetching feedback demands" })
  }
})

// Get unfulfilled feedback demand count for student
router.get('/count', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid

    const count = await pg.get()('feedback_demands')
      .where({ student_uuid: userUuid, fulfilled: false })
      .count('* as count')
      .first()

    res.status(200).send({ count: parseInt(count.count) })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error fetching demand count" })
  }
})

// Get all feedback demands for a classroom (teacher only)
router.get('/classroom/:classroom_uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const classroomUuid = req.params.classroom_uuid

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: classroomUuid, user_uuid: userUuid, role: 'teacher' })
      .first()

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can view feedback demands" })
    }

    const demands = await pg.get()('feedback_demands')
      .join('users', 'feedback_demands.student_uuid', 'users.uuid')
      .where({ 'feedback_demands.classroom_uuid': classroomUuid })
      .select(
        'feedback_demands.*',
        'users.first_name as student_first_name',
        'users.last_name as student_last_name',
        'users.email as student_email'
      )
      .orderBy('feedback_demands.created_at', 'desc')

    res.status(200).send(demands)
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error fetching feedback demands" })
  }
})

// Create a feedback demand (teacher only)
router.post('/', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const { classroom_uuid, student_uuid, message } = req.body

    if (!classroom_uuid || !student_uuid) {
      return res.status(400).send({ message: "classroom_uuid and student_uuid required" })
    }

    // Check if user is teacher in classroom
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first()

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can demand feedback" })
    }

    // Check if student is member of classroom
    const studentMembership = await pg.get()('classroom_members')
      .where({ classroom_uuid, user_uuid: student_uuid, role: 'student', active: true })
      .first()

    if (!studentMembership) {
      return res.status(400).send({ message: "Student is not an active member of this classroom" })
    }

    // Check if classroom is completed
    const classroom = await pg.get()('classrooms')
      .where({ uuid: classroom_uuid })
      .first()

    if (classroom.completed) {
      return res.status(403).send({ message: "Cannot demand feedback in completed classroom" })
    }

    const demandData = {
      uuid: uuidv4(),
      classroom_uuid,
      student_uuid,
      teacher_uuid: userUuid,
      message: message || null,
      fulfilled: false
    }

    const [demand] = await pg.get()('feedback_demands')
      .insert(demandData)
      .returning('*')

    res.status(200).send({ ...demand, message: "Feedback demand created" })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error creating feedback demand" })
  }
})

// Create feedback demands for all students in classroom (teacher only)
router.post('/classroom-wide', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const { classroom_uuid, message } = req.body

    if (!classroom_uuid) {
      return res.status(400).send({ message: "classroom_uuid required" })
    }

    // Check if user is teacher in classroom
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first()

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can demand feedback" })
    }

    // Check if classroom is completed
    const classroom = await pg.get()('classrooms')
      .where({ uuid: classroom_uuid })
      .first()

    if (classroom.completed) {
      return res.status(403).send({ message: "Cannot demand feedback in completed classroom" })
    }

    // Get all active students in classroom
    const students = await pg.get()('classroom_members')
      .where({ classroom_uuid, role: 'student', active: true })
      .select('user_uuid')

    if (students.length === 0) {
      return res.status(400).send({ message: "No active students in this classroom" })
    }

    // Create demands for all students
    const demands = students.map(student => ({
      uuid: uuidv4(),
      classroom_uuid,
      student_uuid: student.user_uuid,
      teacher_uuid: userUuid,
      message: message || null,
      fulfilled: false
    }))

    await pg.get()('feedback_demands').insert(demands)

    res.status(200).send({
      message: `Feedback demands created for ${students.length} students`,
      count: students.length
    })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error creating classroom-wide feedback demands" })
  }
})

// Mark feedback demand as fulfilled (student only)
router.put('/:uuid/fulfill', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const demandUuid = req.params.uuid

    const demand = await pg.get()('feedback_demands')
      .where({ uuid: demandUuid })
      .first()

    if (!demand) {
      return res.status(404).send({ message: "Feedback demand not found" })
    }

    // Check if user is the student
    if (demand.student_uuid !== userUuid) {
      return res.status(403).send({ message: "Only the student can fulfill this demand" })
    }

    const [updated] = await pg.get()('feedback_demands')
      .where({ uuid: demandUuid })
      .update({
        fulfilled: true,
        fulfilled_at: pg.get().fn.now()
      })
      .returning('*')

    res.status(200).send({ ...updated, message: "Feedback demand fulfilled" })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error fulfilling feedback demand" })
  }
})

// Delete a feedback demand
router.delete('/:uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid
    const demandUuid = req.params.uuid

    const demand = await pg.get()('feedback_demands')
      .where({ uuid: demandUuid })
      .first()

    if (!demand) {
      return res.status(404).send({ message: "Feedback demand not found" })
    }

    // Teachers can delete their own demands, students can delete demands for them
    const isTeacher = demand.teacher_uuid === userUuid
    const isStudent = demand.student_uuid === userUuid

    if (!isTeacher && !isStudent) {
      return res.status(403).send({ message: "Not authorized to delete this demand" })
    }

    await pg.get()('feedback_demands')
      .where({ uuid: demandUuid })
      .delete()

    res.status(200).send({ message: "Feedback demand deleted" })
  } catch (e) {
    console.log(e)
    res.status(500).send({ message: "Error deleting feedback demand" })
  }
})

module.exports = router
