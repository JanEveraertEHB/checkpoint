const express = require('express')
const router = express.Router()
const { checkBodyFields } = require("./../helpers/bodyHelpers");
const { uuidv4 } = require("./../helpers/uuidHelpers");
const { decodeToken } = require("./../helpers/authHelpers")
const pg = require('./../db/db.js')

// Get all checkpoints for a classroom
router.get('/classroom/:classroom_uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const classroomUuid = req.params.classroom_uuid;

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: classroomUuid, user_uuid: userUuid })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Not a member of this classroom" });
    }

    const checkpoints = await pg.get()('checkpoints')
      .where({ classroom_uuid: classroomUuid })
      .orderBy('order_index', 'asc');

    res.status(200).send(checkpoints);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error fetching checkpoints" });
  }
});

// Check if any checkpoint in a classroom has been reached by any student
router.get('/classroom/:classroom_uuid/has-progress', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const classroomUuid = req.params.classroom_uuid;

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: classroomUuid, user_uuid: userUuid, role: 'teacher' })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can check checkpoint progress" });
    }

    const reachedCheckpoint = await pg.get()('student_checkpoints')
      .join('checkpoints', 'student_checkpoints.checkpoint_uuid', 'checkpoints.uuid')
      .where({ 'checkpoints.classroom_uuid': classroomUuid })
      .first();

    res.status(200).send({ has_progress: !!reachedCheckpoint });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error checking checkpoint progress" });
  }
});

// Create a new checkpoint (teacher only)
router.post('/', decodeToken, async (req, res) => {
  if (!req.body) {
    return res.status(401).send({ message: "No body" });
  }

  if (!checkBodyFields(req.body, ["classroom_uuid", "name"])) {
    return res.status(402).send({ fields: "no" });
  }

  try {
    const userUuid = req.user.uuid;
    const { classroom_uuid, name, description } = req.body;

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can create checkpoints" });
    }

    // Get next order index
    const maxOrder = await pg.get()('checkpoints')
      .where({ classroom_uuid })
      .max('order_index as max')
      .first();

    const orderIndex = (maxOrder.max || 0) + 1;

    const checkpointData = {
      uuid: uuidv4(),
      classroom_uuid,
      name,
      description: description || '',
      order_index: orderIndex
    };

    const [checkpoint] = await pg.get()('checkpoints')
      .insert(checkpointData)
      .returning('*');

    res.status(200).send({ ...checkpoint, message: "success" });
  } catch (e) {
    console.log(e);
    res.status(501).send({ message: "Error creating checkpoint" });
  }
});

// Update a checkpoint (teacher only)
router.put('/:uuid', decodeToken, async (req, res) => {
  if (!req.body) {
    return res.status(401).send({ message: "No body" });
  }

  try {
    const userUuid = req.user.uuid;
    const checkpointUuid = req.params.uuid;
    const { name, description } = req.body;

    const checkpoint = await pg.get()('checkpoints')
      .where({ uuid: checkpointUuid })
      .first();

    if (!checkpoint) {
      return res.status(404).send({ message: "Checkpoint not found" });
    }

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: checkpoint.classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can update checkpoints" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).send({ message: "No fields to update" });
    }

    const [updatedCheckpoint] = await pg.get()('checkpoints')
      .where({ uuid: checkpointUuid })
      .update(updateData)
      .returning('*');

    res.status(200).send({ ...updatedCheckpoint, message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error updating checkpoint" });
  }
});

// Delete a checkpoint (teacher only)
router.delete('/:uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const checkpointUuid = req.params.uuid;

    const checkpoint = await pg.get()('checkpoints')
      .where({ uuid: checkpointUuid })
      .first();

    if (!checkpoint) {
      return res.status(404).send({ message: "Checkpoint not found" });
    }

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: checkpoint.classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can delete checkpoints" });
    }

    // Delete student_checkpoints first (foreign key constraint)
    await pg.get()('student_checkpoints')
      .where({ checkpoint_uuid: checkpointUuid })
      .delete();

    // Delete the checkpoint
    await pg.get()('checkpoints')
      .where({ uuid: checkpointUuid })
      .delete();

    res.status(200).send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error deleting checkpoint" });
  }
});

// Update checkpoint order (teacher only)
router.put('/:uuid/reorder', decodeToken, async (req, res) => {
  if (!req.body || req.body.order_index === undefined) {
    return res.status(402).send({ message: "order_index required" });
  }

  try {
    const userUuid = req.user.uuid;
    const checkpointUuid = req.params.uuid;
    const newOrderIndex = req.body.order_index;

    const checkpoint = await pg.get()('checkpoints')
      .where({ uuid: checkpointUuid })
      .first();

    if (!checkpoint) {
      return res.status(404).send({ message: "Checkpoint not found" });
    }

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: checkpoint.classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can reorder checkpoints" });
    }

    // Check if any student has reached any checkpoint in this classroom
    const reachedCheckpoints = await pg.get()('student_checkpoints')
      .join('checkpoints', 'student_checkpoints.checkpoint_uuid', 'checkpoints.uuid')
      .where({ 'checkpoints.classroom_uuid': checkpoint.classroom_uuid })
      .first();

    if (reachedCheckpoints) {
      return res.status(403).send({ message: "Cannot reorder checkpoints after students have reached them" });
    }

    await pg.get()('checkpoints')
      .where({ uuid: checkpointUuid })
      .update({ order_index: newOrderIndex });

    res.status(200).send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error reordering checkpoint" });
  }
});

// Mark a checkpoint as reached for a student (teacher only)
router.post('/:checkpoint_uuid/students/:student_uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const checkpointUuid = req.params.checkpoint_uuid;
    const studentUuid = req.params.student_uuid;

    const checkpoint = await pg.get()('checkpoints')
      .where({ uuid: checkpointUuid })
      .first();

    if (!checkpoint) {
      return res.status(404).send({ message: "Checkpoint not found" });
    }

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: checkpoint.classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can mark checkpoints" });
    }

    // Check if student is member of classroom
    const studentMembership = await pg.get()('classroom_members')
      .where({ classroom_uuid: checkpoint.classroom_uuid, user_uuid: studentUuid, role: 'student' })
      .first();

    if (!studentMembership) {
      return res.status(400).send({ message: "Student is not a member of this classroom" });
    }

    // Check if already marked
    const existing = await pg.get()('student_checkpoints')
      .where({ checkpoint_uuid: checkpointUuid, student_uuid: studentUuid })
      .first();

    if (existing) {
      return res.status(400).send({ message: "Checkpoint already reached" });
    }

    const [studentCheckpoint] = await pg.get()('student_checkpoints')
      .insert({
        checkpoint_uuid: checkpointUuid,
        student_uuid: studentUuid
      })
      .returning('*');

    res.status(200).send({ ...studentCheckpoint, message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error marking checkpoint" });
  }
});

// Unmark a checkpoint for a student (teacher only)
router.delete('/:checkpoint_uuid/students/:student_uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const checkpointUuid = req.params.checkpoint_uuid;
    const studentUuid = req.params.student_uuid;

    const checkpoint = await pg.get()('checkpoints')
      .where({ uuid: checkpointUuid })
      .first();

    if (!checkpoint) {
      return res.status(404).send({ message: "Checkpoint not found" });
    }

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: checkpoint.classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can unmark checkpoints" });
    }

    await pg.get()('student_checkpoints')
      .where({ checkpoint_uuid: checkpointUuid, student_uuid: studentUuid })
      .delete();

    res.status(200).send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error unmarking checkpoint" });
  }
});

// Get student's checkpoint progress
router.get('/classroom/:classroom_uuid/student/:student_uuid/progress', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const classroomUuid = req.params.classroom_uuid;
    const studentUuid = req.params.student_uuid;

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: classroomUuid, user_uuid: userUuid })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Not a member of this classroom" });
    }

    // Students can only view their own progress
    if (membership.role === 'student' && studentUuid !== userUuid) {
      return res.status(403).send({ message: "Students can only view their own progress" });
    }

    const checkpoints = await pg.get()('checkpoints')
      .where({ classroom_uuid: classroomUuid })
      .orderBy('order_index', 'asc');

    const reachedCheckpoints = await pg.get()('student_checkpoints')
      .join('checkpoints', 'student_checkpoints.checkpoint_uuid', 'checkpoints.uuid')
      .where({
        'checkpoints.classroom_uuid': classroomUuid,
        'student_checkpoints.student_uuid': studentUuid
      })
      .select('student_checkpoints.*', 'checkpoints.name', 'checkpoints.description', 'checkpoints.order_index');

    const reachedMap = {};
    reachedCheckpoints.forEach(rc => {
      reachedMap[rc.checkpoint_uuid] = rc.reached_at;
    });

    const progress = checkpoints.map(cp => ({
      ...cp,
      reached: !!reachedMap[cp.uuid],
      reached_at: reachedMap[cp.uuid] || null
    }));

    // Find next checkpoint
    const nextCheckpoint = progress.find(cp => !cp.reached) || null;

    res.status(200).send({ checkpoints: progress, next_checkpoint: nextCheckpoint });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error fetching progress" });
  }
});

module.exports = router
