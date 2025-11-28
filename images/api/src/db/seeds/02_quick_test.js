const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/**
 * Quick seed file for basic testing
 * Creates minimal test data quickly
 */

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

exports.seed = async function(knex) {
  console.log('🌱 Quick seeding database...');
  
  // Clean existing data
  await knex('feedback_demands').del();
  await knex('feedback_requests').del();
  await knex('student_checkpoints').del();
  await knex('feedback').del();
  await knex('checkpoints').del();
  await knex('pending_classroom_members').del();
  await knex('classroom_members').del();
  await knex('classrooms').del();
  await knex('users').del();
  
  
  // Create teacher
  const teacherUuid = uuidv4();
  await knex('users').insert({
    uuid: teacherUuid,
    first_name: 'Test',
    last_name: 'Teacher',
    email: 'teacher@test.com',
    password: await hashPassword('teacher123'),
    user_type: 'teacher',
    created_at: new Date(),
    updated_at: new Date()
  });
  
  // Create students with different engagement levels
  const students = [
    {
      uuid: uuidv4(),
      first_name: 'High',
      last_name: 'Engagement',
      email: 'high@test.com',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Medium',
      last_name: 'Engagement',
      email: 'medium@test.com',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Low',
      last_name: 'Engagement',
      email: 'low@test.com',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  await knex('users').insert(students);
  
  // Create classroom
  const classroomUuid = uuidv4();
  await knex('classrooms').insert({
    uuid: classroomUuid,
    name: 'Test Classroom',
    academic_year: '2024-2025',
    teacher_uuid: teacherUuid,
    invite_code: 'TEST123',
    created_at: new Date(),
    updated_at: new Date()
  });
  
  // Enroll students and teacher
  const members = [
    {
      classroom_uuid: classroomUuid,
      user_uuid: teacherUuid,
      role: 'teacher',
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    ...students.map(student => ({
      classroom_uuid: classroomUuid,
      user_uuid: student.uuid,
      role: 'student',
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    }))
  ];
  
  await knex('classroom_members').insert(members);
  
  // Create checkpoints
  const checkpoints = [];
  for (let i = 1; i <= 3; i++) {
    checkpoints.push({
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      name: `Checkpoint ${i}`,
      description: `Description for checkpoint ${i}`,
      order_index: i,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  await knex('checkpoints').insert(checkpoints);
  
  // Create student progress (different levels)
  const progress = [
    // High engagement student - all checkpoints
    ...checkpoints.map((checkpoint, index) => ({
      checkpoint_uuid: checkpoint.uuid,
      student_uuid: students[0].uuid,
      reached_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    })),
    // Medium engagement student - 2 checkpoints
    ...checkpoints.slice(0, 2).map(checkpoint => ({
      checkpoint_uuid: checkpoint.uuid,
      student_uuid: students[1].uuid,
      reached_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    })),
    // Low engagement student - 1 checkpoint
    {
      checkpoint_uuid: checkpoints[0].uuid,
      student_uuid: students[2].uuid,
      reached_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  await knex('student_checkpoints').insert(progress);
  
  // Create feedback (varying detail levels)
  const feedback = [
    // High engagement - detailed feedback
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[0].uuid,
      created_by_uuid: teacherUuid,
      content: "This is an exceptional piece of work that demonstrates mastery of the subject matter. Your analysis is thorough and well-supported with evidence. The structure is logical and your arguments are compelling. I particularly appreciate how you've incorporated multiple perspectives and addressed potential counterarguments. Your writing is clear and sophisticated, with careful attention to detail. To elevate this further, consider expanding your conclusion to explore broader implications and perhaps incorporate more recent research in your literature review. Overall, this represents work of high quality that shows significant effort and intellectual growth.",
      created_at: new Date(),
      updated_at: new Date()
    },
    // Medium engagement - normal feedback
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[1].uuid,
      created_by_uuid: teacherUuid,
      content: "Good work on this assignment. You've demonstrated understanding of the main concepts and your examples are relevant. The structure is clear and your arguments are generally well-supported. Areas for improvement include: 1) Strengthen your thesis statement to be more specific, 2) Develop your analysis in more depth in the body paragraphs, and 3) Ensure your conclusion effectively summarizes your main points. Overall, this is solid work that shows good effort.",
      created_at: new Date(),
      updated_at: new Date()
    },
    // Low engagement - minimal feedback
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[2].uuid,
      created_by_uuid: teacherUuid,
      content: "Nice job.",
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  await knex('feedback').insert(feedback);
  
  // Create feedback requests (varying recency)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const requests = [
    // High engagement - recent resolved request
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[0].uuid,
      message: "Could you please review my latest submission?",
      resolved: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      created_at: new Date(),
      updated_at: new Date()
    },
    // Medium engagement - older resolved request
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[1].uuid,
      message: "Feedback needed",
      resolved: true,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      resolved_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      created_at: new Date(),
      updated_at: new Date()
    },
    // Low engagement - old unresolved request
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[2].uuid,
      message: "Help",
      resolved: false,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      resolved_at: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  await knex('feedback_requests').insert(requests);
  
  console.log('✅ Quick seed completed!');
  console.log('');
  console.log('Login Credentials:');
  console.log('  Teacher: teacher@test.com / teacher123');
  console.log('  Students:');
  students.forEach(student => {
    console.log(`    ${student.first_name}: ${student.email} / student123`);
  });
  console.log('');
  console.log('Classroom Invite Code: TEST123');
};