const express = require('express')
const router = express.Router()
const { checkBodyFields } = require("./../helpers/bodyHelpers");
const { uuidv4 } = require("./../helpers/uuidHelpers");
const { decodeToken } = require("./../helpers/authHelpers")
const pg = require('./../db/db.js')

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Get all classrooms for the current user (both as teacher and student)
router.get('/', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;

    const classrooms = await pg.get()('classroom_members')
      .join('classrooms', 'classroom_members.classroom_uuid', 'classrooms.uuid')
      .join('users', 'classrooms.teacher_uuid', 'users.uuid')
      .where('classroom_members.user_uuid', userUuid)
      .select(
        'classrooms.*',
        'classroom_members.role',
        'users.first_name as teacher_first_name',
        'users.last_name as teacher_last_name'
      );

    res.status(200).send(classrooms);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error fetching classrooms" });
  }
});

// Get classroom details by ID
router.get('/:uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const classroomUuid = req.params.uuid;

    // Check if user is a member
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: classroomUuid, user_uuid: userUuid })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Not a member of this classroom" });
    }

    const classroom = await pg.get()('classrooms')
      .join('users', 'classrooms.teacher_uuid', 'users.uuid')
      .where('classrooms.uuid', classroomUuid)
      .select(
        'classrooms.*',
        'users.first_name as teacher_first_name',
        'users.last_name as teacher_last_name'
      )
      .first();

    if (!classroom) {
      return res.status(404).send({ message: "Classroom not found" });
    }

    // Get all students if user is teacher
    let students = [];
    if (membership.role === 'teacher') {
      students = await pg.get()('classroom_members')
        .join('users', 'classroom_members.user_uuid', 'users.uuid')
        .where({
          classroom_uuid: classroomUuid,
          role: 'student'
        })
        .select(
          'users.uuid',
          'users.first_name',
          'users.last_name',
          'users.email'
        );
    }

    res.status(200).send({
      ...classroom,
      role: membership.role,
      students
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error fetching classroom" });
  }
});

// Create a new classroom
router.post('/', decodeToken, async (req, res) => {
  if (!req.body) {
    return res.status(401).send({ message: "No body" });
  }

  if (!checkBodyFields(req.body, ["name", "academic_year"])) {
    return res.status(402).send({ fields: "no" });
  }

  try {
    const classroomData = {
      uuid: uuidv4(),
      name: req.body.name,
      academic_year: req.body.academic_year,
      teacher_uuid: req.user.uuid,
      invite_code: generateInviteCode()
    };

    const [classroom] = await pg.get()('classrooms')
      .insert(classroomData)
      .returning('*');

    // Add teacher as a member
    await pg.get()('classroom_members').insert({
      classroom_uuid: classroom.uuid,
      user_uuid: req.user.uuid,
      role: 'teacher'
    });

    res.status(200).send({ ...classroom, message: "success" });
  } catch (e) {
    console.log(e);
    res.status(501).send({ message: "Error creating classroom" });
  }
});

// Join a classroom via invite code
router.post('/join/:invite_code', decodeToken, async (req, res) => {
  try {
    const inviteCode = req.params.invite_code;
    const userUuid = req.user.uuid;

    const classroom = await pg.get()('classrooms')
      .where({ invite_code: inviteCode })
      .first();

    if (!classroom) {
      return res.status(404).send({ message: "Invalid invite code" });
    }

    // Check if already a member
    const existingMember = await pg.get()('classroom_members')
      .where({ classroom_uuid: classroom.uuid, user_uuid: userUuid })
      .first();

    if (existingMember) {
      return res.status(400).send({ message: "Already a member of this classroom" });
    }

    // Add as student
    await pg.get()('classroom_members').insert({
      classroom_uuid: classroom.uuid,
      user_uuid: userUuid,
      role: 'student'
    });

    res.status(200).send({ ...classroom, role: 'student', message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error joining classroom" });
  }
});

// Get invite link for a classroom (teacher only)
router.get('/:uuid/invite', decodeToken, async (req, res) => {
  try {
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: classroomUuid, user_uuid: userUuid, role: 'teacher' })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can get invite links" });
    }

    const classroom = await pg.get()('classrooms')
      .where({ uuid: classroomUuid })
      .first();

    if (!classroom) {
      return res.status(404).send({ message: "Classroom not found" });
    }

    res.status(200).send({ invite_code: classroom.invite_code });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error getting invite code" });
  }
});

module.exports = router
