const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { checkBodyFields } = require("./../helpers/bodyHelpers");
const { uuidv4 } = require("./../helpers/uuidHelpers");
const { decodeToken } = require("./../helpers/authHelpers")
const pg = require('./../db/db.js')

// Configure multer for image uploads
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const fileFilter = (req, file, cb) => {
  console.log(file.mimetype)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// Get feedback for a student in a classroom
router.get('/classroom/:classroom_uuid/student/:student_uuid', decodeToken, async (req, res) => {
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

    // Students can only view their own feedback
    if (membership.role === 'student' && studentUuid !== userUuid) {
      return res.status(403).send({ message: "Students can only view their own feedback" });
    }

    const feedback = await pg.get()('feedback')
      .join('users', 'feedback.created_by_uuid', 'users.uuid')
      .where({
        classroom_uuid: classroomUuid,
        student_uuid: studentUuid
      })
      .select(
        'feedback.*',
        'users.first_name as created_by_first_name',
        'users.last_name as created_by_last_name'
      )
      .orderBy('feedback.created_at', 'desc');

    // Get images and documents for each feedback
    for (let fb of feedback) {
      const images = await pg.get()('feedback_images')
        .where({ feedback_uuid: fb.uuid })
        .select('*');
      fb.images = images;

      const documents = await pg.get()('feedback_documents')
        .where({ feedback_uuid: fb.uuid })
        .select('*');
      fb.documents = documents;
    }

    res.status(200).send(feedback);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error fetching feedback" });
  }
});

// Get all feedback for current user (student) in a classroom
router.get('/classroom/:classroom_uuid/my-feedback', decodeToken, async (req, res) => {
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

    const feedback = await pg.get()('feedback')
      .join('users', 'feedback.created_by_uuid', 'users.uuid')
      .where({
        classroom_uuid: classroomUuid,
        student_uuid: userUuid
      })
      .select(
        'feedback.*',
        'users.first_name as created_by_first_name',
        'users.last_name as created_by_last_name'
      )
      .orderBy('feedback.created_at', 'desc');

    // Get images and documents for each feedback
    for (let fb of feedback) {
      const images = await pg.get()('feedback_images')
        .where({ feedback_uuid: fb.uuid })
        .select('*');
      fb.images = images;

      const documents = await pg.get()('feedback_documents')
        .where({ feedback_uuid: fb.uuid })
        .select('*');
      fb.documents = documents;
    }

    res.status(200).send(feedback);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error fetching feedback" });
  }
});

// Create feedback (teachers can give feedback to students, students can add their own)
router.post('/', decodeToken, async (req, res) => {
  if (!req.body) {
    return res.status(401).send({ message: "No body" });
  }

  if (!checkBodyFields(req.body, ["classroom_uuid", "student_uuid", "content"])) {
    return res.status(402).send({ fields: "no" });
  }

  try {
    const userUuid = req.user.uuid;
    const { classroom_uuid, student_uuid, content } = req.body;

    // Check if classroom is completed
    const classroom = await pg.get()('classrooms')
      .where({ uuid: classroom_uuid })
      .first();

    if (classroom && classroom.completed) {
      return res.status(403).send({ message: "Cannot add feedback to a completed classroom" });
    }

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid, user_uuid: userUuid })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Not a member of this classroom" });
    }

    // Students can only add feedback for themselves
    if (membership.role === 'student' && student_uuid !== userUuid) {
      return res.status(403).send({ message: "Students can only add feedback for themselves" });
    }

    // Check that the student is a member of the classroom
    const studentMembership = await pg.get()('classroom_members')
      .where({ classroom_uuid, user_uuid: student_uuid, role: 'student' })
      .first();

    if (!studentMembership) {
      return res.status(400).send({ message: "Student is not a member of this classroom" });
    }

    // Check if student is active (not left/removed)
    if (!studentMembership.active) {
      return res.status(403).send({ message: "Cannot add feedback for inactive student" });
    }

    const feedbackData = {
      uuid: uuidv4(),
      classroom_uuid,
      student_uuid,
      created_by_uuid: userUuid,
      content,
      locked: false
    };

    const [feedback] = await pg.get()('feedback')
      .insert(feedbackData)
      .returning('*');

    res.status(200).send({ ...feedback, message: "success" });
  } catch (e) {
    console.log(e);
    res.status(501).send({ message: "Error creating feedback" });
  }
});

// Update feedback content
router.put('/:uuid', decodeToken, async (req, res) => {
  if (!req.body || !req.body.content) {
    return res.status(402).send({ message: "content required" });
  }

  try {
    const userUuid = req.user.uuid;
    const feedbackUuid = req.params.uuid;
    const { content } = req.body;

    const feedback = await pg.get()('feedback')
      .where({ uuid: feedbackUuid })
      .first();

    if (!feedback) {
      return res.status(404).send({ message: "Feedback not found" });
    }

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: feedback.classroom_uuid, user_uuid: userUuid })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Not a member of this classroom" });
    }

    // Teachers can always edit their own feedback
    // Students can only edit their own feedback if not locked
    if (feedback.created_by_uuid !== userUuid) {
      return res.status(403).send({ message: "Can only edit your own feedback" });
    }

    if (membership.role === 'student' && feedback.locked) {
      return res.status(403).send({ message: "This feedback has been locked by the teacher" });
    }

    await pg.get()('feedback')
      .where({ uuid: feedbackUuid })
      .update({ content, updated_at: pg.get().fn.now() });

    const [updatedFeedback] = await pg.get()('feedback')
      .where({ uuid: feedbackUuid })
      .select('*');

    res.status(200).send({ ...updatedFeedback, message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error updating feedback" });
  }
});

// Lock/unlock feedback (teacher only)
router.put('/:uuid/lock', decodeToken, async (req, res) => {
  if (req.body.locked === undefined) {
    return res.status(402).send({ message: "locked field required" });
  }

  try {
    const userUuid = req.user.uuid;
    const feedbackUuid = req.params.uuid;
    const { locked } = req.body;

    const feedback = await pg.get()('feedback')
      .where({ uuid: feedbackUuid })
      .first();

    if (!feedback) {
      return res.status(404).send({ message: "Feedback not found" });
    }

    // Check if user is teacher
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: feedback.classroom_uuid, user_uuid: userUuid, role: 'teacher' })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Only teachers can lock/unlock feedback" });
    }

    await pg.get()('feedback')
      .where({ uuid: feedbackUuid })
      .update({ locked });

    res.status(200).send({ message: "success", locked });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error locking/unlocking feedback" });
  }
});

// Upload images for feedback
router.post('/:uuid/images', decodeToken, upload.array('images', 10), async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const feedbackUuid = req.params.uuid;

    const feedback = await pg.get()('feedback')
      .where({ uuid: feedbackUuid })
      .first();

    if (!feedback) {
      return res.status(404).send({ message: "Feedback not found" });
    }

    // Check if user created this feedback
    if (feedback.created_by_uuid !== userUuid) {
      return res.status(403).send({ message: "Can only add images to your own feedback" });
    }

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: feedback.classroom_uuid, user_uuid: userUuid })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Not a member of this classroom" });
    }

    // Students can't add images if feedback is locked
    if (membership.role === 'student' && feedback.locked) {
      return res.status(403).send({ message: "This feedback has been locked by the teacher" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ message: "No images uploaded" });
    }

    const imageRecords = [];
    for (const file of req.files) {
      const imageData = {
        uuid: uuidv4(),
        feedback_uuid: feedbackUuid,
        filename: file.filename,
        original_name: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      };

      const [image] = await pg.get()('feedback_images')
        .insert(imageData)
        .returning('*');

      imageRecords.push(image);
    }

    res.status(200).send({ images: imageRecords, message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error uploading images" });
  }
});

// Delete an image from feedback
router.delete('/images/:image_uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const imageUuid = req.params.image_uuid;

    const image = await pg.get()('feedback_images')
      .where({ uuid: imageUuid })
      .first();

    if (!image) {
      return res.status(404).send({ message: "Image not found" });
    }

    const feedback = await pg.get()('feedback')
      .where({ uuid: image.feedback_uuid })
      .first();

    if (!feedback) {
      return res.status(404).send({ message: "Feedback not found" });
    }

    // Check if user created this feedback
    if (feedback.created_by_uuid !== userUuid) {
      return res.status(403).send({ message: "Can only delete images from your own feedback" });
    }

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: feedback.classroom_uuid, user_uuid: userUuid })
      .first();

    if (membership.role === 'student' && feedback.locked) {
      return res.status(403).send({ message: "This feedback has been locked by the teacher" });
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pg.get()('feedback_images')
      .where({ uuid: imageUuid })
      .delete();

    res.status(200).send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error deleting image" });
  }
});

// Upload documents for feedback
router.post('/:uuid/documents', decodeToken, upload.array('documents', 10), async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const feedbackUuid = req.params.uuid;

    const feedback = await pg.get()('feedback')
      .where({ uuid: feedbackUuid })
      .first();

    if (!feedback) {
      return res.status(404).send({ message: "Feedback not found" });
    }

    // Check if user created this feedback
    if (feedback.created_by_uuid !== userUuid) {
      return res.status(403).send({ message: "Can only add documents to your own feedback" });
    }

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: feedback.classroom_uuid, user_uuid: userUuid })
      .first();

    if (!membership) {
      return res.status(403).send({ message: "Not a member of this classroom" });
    }

    // Students can't add documents if feedback is locked
    if (membership.role === 'student' && feedback.locked) {
      return res.status(403).send({ message: "This feedback has been locked by the teacher" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ message: "No documents uploaded" });
    }

    const documentRecords = [];
    for (const file of req.files) {
      const documentData = {
        uuid: uuidv4(),
        feedback_uuid: feedbackUuid,
        filename: file.filename,
        original_name: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      };

      const [document] = await pg.get()('feedback_documents')
        .insert(documentData)
        .returning('*');

      documentRecords.push(document);
    }

    res.status(200).send({ documents: documentRecords, message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error uploading documents" });
  }
});

// Delete a document from feedback
router.delete('/documents/:document_uuid', decodeToken, async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const documentUuid = req.params.document_uuid;

    const document = await pg.get()('feedback_documents')
      .where({ uuid: documentUuid })
      .first();

    if (!document) {
      return res.status(404).send({ message: "Document not found" });
    }

    const feedback = await pg.get()('feedback')
      .where({ uuid: document.feedback_uuid })
      .first();

    if (!feedback) {
      return res.status(404).send({ message: "Feedback not found" });
    }

    // Check if user created this feedback
    if (feedback.created_by_uuid !== userUuid) {
      return res.status(403).send({ message: "Can only delete documents from your own feedback" });
    }

    // Check membership
    const membership = await pg.get()('classroom_members')
      .where({ classroom_uuid: feedback.classroom_uuid, user_uuid: userUuid })
      .first();

    if (membership.role === 'student' && feedback.locked) {
      return res.status(403).send({ message: "This feedback has been locked by the teacher" });
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pg.get()('feedback_documents')
      .where({ uuid: documentUuid })
      .delete();

    res.status(200).send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error deleting document" });
  }
});

module.exports = router
