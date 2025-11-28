const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/**
 * Engagement metrics test seed
 * Creates specific data to test student engagement calculations
 */

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

exports.seed = async function(knex) {
  console.log('🎯 Creating engagement metrics test data...');
  
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
    first_name: 'Engagement',
    last_name: 'Tester',
    email: 'engagement@test.com',
    password: await hashPassword('teacher123'),
    user_type: 'teacher',
    created_at: new Date(),
    updated_at: new Date()
  });
  
  // Create students with precise engagement characteristics
  const students = [
    // Perfect student (100 engagement score)
    {
      uuid: uuidv4(),
      first_name: 'Perfect',
      last_name: 'Student',
      email: 'perfect@test.com',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    // High reactivity, low dedication (70 engagement score)
    {
      uuid: uuidv4(),
      first_name: 'Fast',
      last_name: 'Responder',
      email: 'fast@test.com',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    // Low reactivity, high dedication (60 engagement score)
    {
      uuid: uuidv4(),
      first_name: 'Detailed',
      last_name: 'Writer',
      email: 'detailed@test.com',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    // No recent activity, good progress (40 engagement score)
    {
      uuid: uuidv4(),
      first_name: 'Inactive',
      last_name: 'Progress',
      email: 'inactive@test.com',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    // Minimal everything (20 engagement score)
    {
      uuid: uuidv4(),
      first_name: 'Minimal',
      last_name: 'Effort',
      email: 'minimal@test.com',
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
    name: 'Engagement Metrics Test Classroom',
    academic_year: '2024-2025',
    teacher_uuid: teacherUuid,
    invite_code: 'ENGAGE123',
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
  for (let i = 1; i <= 5; i++) {
    checkpoints.push({
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      name: `Engagement Test Checkpoint ${i}`,
      description: `Checkpoint ${i} for testing engagement metrics`,
      order_index: i,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  await knex('checkpoints').insert(checkpoints);
  
  // Create precise student progress
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  
  const studentProgress = [
    // Perfect student - all checkpoints, recent activity
    ...checkpoints.map((checkpoint, index) => ({
      checkpoint_uuid: checkpoint.uuid,
      student_uuid: students[0].uuid,
      reached_at: new Date(now.getTime() - (5 - index) * 24 * 60 * 60 * 1000), // Completed over last 5 days
      created_at: new Date(),
      updated_at: new Date()
    })),
    // Fast responder - all checkpoints, very fast responses
    ...checkpoints.slice(0, 3).map((checkpoint, index) => ({
      checkpoint_uuid: checkpoint.uuid,
      student_uuid: students[1].uuid,
      reached_at: new Date(now.getTime() - (3 - index) * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    })),
    // Detailed writer - 3 checkpoints, slow responses
    ...checkpoints.slice(0, 3).map((checkpoint, index) => ({
      checkpoint_uuid: checkpoint.uuid,
      student_uuid: students[2].uuid,
      reached_at: new Date(now.getTime() - (10 - index) * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    })),
    // Inactive progress - 2 checkpoints, old activity
    ...checkpoints.slice(0, 2).map((checkpoint, index) => ({
      checkpoint_uuid: checkpoint.uuid,
      student_uuid: students[3].uuid,
      reached_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      created_at: new Date(),
      updated_at: new Date()
    })),
    // Minimal effort - 1 checkpoint, very old activity
    {
      checkpoint_uuid: checkpoints[0].uuid,
      student_uuid: students[4].uuid,
      reached_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  await knex('student_checkpoints').insert(studentProgress);
  
  // Create feedback with precise characteristics
  const feedback = [
    // Perfect student - detailed feedback, recent
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[0].uuid,
      created_by_uuid: teacherUuid,
      content: "This is an exceptional submission that demonstrates complete mastery of the learning objectives. Your analysis is comprehensive and well-supported with specific evidence. The structure is logical and your arguments are compelling. I particularly appreciate how you've incorporated multiple perspectives and addressed potential counterarguments. Your writing is sophisticated yet accessible, with careful attention to detail. The conclusion effectively synthesizes your main points and suggests meaningful implications. This represents work of the highest quality that shows exceptional effort and intellectual growth.",
      created_at: threeDaysAgo,
      updated_at: new Date()
    },
    // Fast responder - minimal feedback, very recent
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[1].uuid,
      created_by_uuid: teacherUuid,
      content: "Good work.",
      created_at: oneDayAgo,
      updated_at: new Date()
    },
    // Detailed writer - very detailed feedback, slow response
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[2].uuid,
      created_by_uuid: teacherUuid,
      content: "This submission shows significant effort and attention to detail. You have thoroughly explored the topic from multiple angles and provided extensive analysis. Your research is comprehensive and your arguments are well-developed. The structure is sophisticated, with smooth transitions between sections. Your use of evidence is particularly impressive, and you've synthesized information from diverse sources effectively. The writing demonstrates advanced command of the subject matter. Areas for enhancement include: 1) Some sections could be more concise without losing depth, 2) Consider incorporating more recent scholarship, and 3) The conclusion could explore practical applications more thoroughly. Nevertheless, this is thoughtful, well-executed work that reflects substantial intellectual engagement.",
      created_at: twoWeeksAgo,
      updated_at: new Date()
    },
    // Inactive progress - normal feedback, old activity
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[3].uuid,
      created_by_uuid: teacherUuid,
      content: "This is solid work with good understanding of the main concepts. Your examples are relevant and your structure is clear. Consider developing your analysis in more depth and strengthening your conclusion.",
      created_at: oneMonthAgo,
      updated_at: new Date()
    },
    // Minimal effort - minimal feedback, very old activity
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[4].uuid,
      created_by_uuid: teacherUuid,
      content: "OK.",
      created_at: twoMonthsAgo,
      updated_at: new Date()
    }
  ];
  
  await knex('feedback').insert(feedback);
  
  // Create feedback requests with precise timing
  const requests = [
    // Perfect student - recent request, quick resolution
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[0].uuid,
      message: "Could you please review my latest project approach?",
      resolved: true,
      created_at: twoDaysAgo,
      resolved_at: oneDayAgo,
      created_at: new Date(),
      updated_at: new Date()
    },
    // Fast responder - very recent request, immediate resolution
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[1].uuid,
      message: "Quick question about the assignment.",
      resolved: true,
      created_at: sixHoursAgo,
      resolved_at: threeHoursAgo,
      created_at: new Date(),
      updated_at: new Date()
    },
    // Detailed writer - old request, slow resolution
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[2].uuid,
      message: "I need some guidance on my research direction.",
      resolved: true,
      created_at: oneWeekAgo,
      resolved_at: fiveDaysAgo,
      created_at: new Date(),
      updated_at: new Date()
    },
    // Inactive progress - old unresolved request
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[3].uuid,
      message: "Help with understanding the requirements.",
      resolved: false,
      created_at: twoWeeksAgo,
      resolved_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    // Minimal effort - no requests
    // (No request for this student to test zero reactivity)
  ];
  
  await knex('feedback_requests').insert(requests);
  
  // Create feedback demands
  const demands = [
    // Perfect student - recent demand, fulfilled
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[0].uuid,
      teacher_uuid: teacherUuid,
      message: "Please provide peer feedback on 3 classmates' work.",
      fulfilled: true,
      created_at: threeDaysAgo,
      fulfilled_at: oneDayAgo,
      created_at: new Date(),
      updated_at: new Date()
    },
    // Fast responder - recent demand, fulfilled
    {
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: students[1].uuid,
      teacher_uuid: teacherUuid,
      message: "Share your project progress with the class.",
      fulfilled: true,
      created_at: oneDayAgo,
      fulfilled_at: twelveHoursAgo,
      created_at: new Date(),
      updated_at: new Date()
    }
    // Other students - no demands (to test variety)
  ];
  
  await knex('feedback_demands').insert(demands);
  
  console.log('✅ Engagement metrics test data created!');
  console.log('');
  console.log('📊 Expected Engagement Scores:');
  console.log('   Perfect Student: ~95-100 (high activity + all checkpoints + detailed feedback + fast response)');
  console.log('   Fast Responder: ~70-79 (recent activity + most checkpoints + minimal feedback + very fast response)');
  console.log('   Detailed Writer: ~60-69 (some activity + some checkpoints + very detailed feedback + slow response)');
  console.log('   Inactive Progress: ~40-49 (no recent activity + some checkpoints + normal feedback + no response)');
  console.log('   Minimal Effort: ~20-29 (no recent activity + 1 checkpoint + minimal feedback + no response)');
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('   Teacher: engagement@test.com / teacher123');
  console.log('   Students: [student name]@test.com / student123');
  console.log('');
  console.log('🏫 Classroom Code: ENGAGE123');
};