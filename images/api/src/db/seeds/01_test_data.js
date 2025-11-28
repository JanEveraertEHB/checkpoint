const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/**
 * Main seed file to populate the database with test data
 * Creates users, classrooms, checkpoints, feedback, and engagement data
 */

// Helper function to hash passwords
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Helper function to generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate random content
const generateFeedbackContent = (type = 'normal') => {
  const contents = {
    minimal: [
      "Good work.",
      "Nice job.",
      "Keep it up.",
      "Well done.",
      "Great effort."
    ],
    normal: [
      "This is a solid attempt at the assignment. I can see you've put thought into the structure and organization. The main points are clear and well-supported with examples. Consider expanding on the conclusion to tie everything together more effectively.",
      "You've demonstrated good understanding of the core concepts here. The analysis shows critical thinking and your examples are relevant. I'd like to see more depth in the evaluation section - perhaps consider alternative perspectives or counterarguments.",
      "Strong work overall. Your approach is methodical and the execution is mostly successful. The areas for improvement are minor - mainly around refining your transitions between paragraphs and strengthening your thesis statement.",
      "This submission shows real progress. You've incorporated feedback from previous assignments well and it shows in the improved quality. The research is thorough and your arguments are compelling. Focus on making your citations more consistent next time.",
      "I'm impressed with the creativity shown here. You've taken a unique approach that demonstrates deep engagement with the material. The presentation could be more polished, but the content is excellent."
    ],
    detailed: [
      "This is an exceptional piece of work that demonstrates mastery of the subject matter. Your thesis is clear, well-argued, and supported by extensive evidence. The structure is logical, with each paragraph building upon the previous one to create a compelling narrative. Your use of primary sources is particularly impressive, and you've synthesized information from multiple perspectives effectively. The conclusion not only summarizes your main points but also suggests avenues for further research. Your writing style is sophisticated yet accessible, with varied sentence structures and precise vocabulary. Minor areas for improvement include: 1) Some transitions between sections could be smoother, 2) Consider addressing potential counterarguments more directly, and 3) The bibliography could benefit from more diverse source types. Overall, this represents work of high quality that shows significant effort and intellectual growth.",
      "You have produced a comprehensive analysis that goes beyond surface-level observations. Your introduction effectively establishes the context and significance of the topic, while your methodology section demonstrates rigorous approach. The data analysis is thorough, with appropriate use of statistical methods and clear visualization of results. I particularly appreciate how you've connected your findings to broader theoretical frameworks in the field. Your discussion section shows critical engagement with limitations of your study and suggests practical applications of your work. The writing is scholarly yet readable, with careful attention to detail in both content and formatting. To elevate this further: consider expanding your literature review to include more recent publications, and explore how your findings might apply to different demographic groups. This is thoughtful, well-executed work that contributes meaningfully to the field.",
      "This submission represents a significant achievement in both scope and depth. You've tackled a complex topic with nuance and sophistication, demonstrating advanced analytical skills and comprehensive research. The argument flows logically from evidence to conclusion, with each point building upon previous ones. Your use of interdisciplinary approaches adds richness to the analysis, and you've effectively integrated theoretical concepts with practical examples. The methodology is sound and well-documented, allowing for replication. Your engagement with potential criticisms shows intellectual maturity, and your suggestions for future research demonstrate forward-thinking. The presentation is professional, with careful attention to citation formatting and visual elements. Areas for enhancement include: 1) Some sections could benefit from more concise expression, 2) Consider incorporating more diverse voices in your literature review, and 3) The implications section could explore practical applications more thoroughly. Nevertheless, this is impressive work that reflects substantial effort and intellectual growth."
    ]
  };
  
  const typeContents = contents[type] || contents.normal;
  return typeContents[Math.floor(Math.random() * typeContents.length)];
};

exports.seed = async function(knex) {
  console.log('🌱 Starting database seeding...');
  
  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await knex('feedback_demands').del();
  await knex('feedback_requests').del();
  await knex('student_checkpoints').del();
  await knex('feedback').del();
  await knex('checkpoints').del();
  await knex('pending_classroom_members').del();
  await knex('classroom_members').del();
  await knex('classrooms').del();
  await knex('users').del();
  
  console.log('👥 Creating users...');
  
  // Create teachers
  const teachers = [
    {
      uuid: uuidv4(),
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@school.edu',
      password: await hashPassword('teacher123'),
      user_type: 'teacher',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@school.edu',
      password: await hashPassword('teacher123'),
      user_type: 'teacher',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Emily',
      last_name: 'Rodriguez',
      email: 'emily.rodriguez@school.edu',
      password: await hashPassword('teacher123'),
      user_type: 'teacher',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  await knex('users').insert(teachers);
  
  // Create students with varying engagement levels
  const students = [
    // High engagement students
    {
      uuid: uuidv4(),
      first_name: 'Alex',
      last_name: 'Thompson',
      email: 'alex.thompson@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Maya',
      last_name: 'Patel',
      email: 'maya.patel@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'James',
      last_name: 'Wilson',
      email: 'james.wilson@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    // Medium engagement students
    {
      uuid: uuidv4(),
      first_name: 'Sophia',
      last_name: 'Lee',
      email: 'sophia.lee@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Oliver',
      last_name: 'Brown',
      email: 'oliver.brown@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Isabella',
      last_name: 'Garcia',
      email: 'isabella.garcia@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    // Low engagement students
    {
      uuid: uuidv4(),
      first_name: 'Ethan',
      last_name: 'Martinez',
      email: 'ethan.martinez@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Ava',
      last_name: 'Taylor',
      email: 'ava.taylor@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Noah',
      last_name: 'Anderson',
      email: 'noah.anderson@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    // Additional students for larger datasets
    {
      uuid: uuidv4(),
      first_name: 'Emma',
      last_name: 'Thomas',
      email: 'emma.thomas@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Lucas',
      last_name: 'Jackson',
      email: 'lucas.jackson@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Zoe',
      last_name: 'White',
      email: 'zoe.white@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      first_name: 'Mason',
      last_name: 'Harris',
      email: 'mason.harris@student.edu',
      password: await hashPassword('student123'),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  await knex('users').insert(students);
  
  console.log(`✅ Created ${teachers.length} teachers and ${students.length} students`);
  
  // Create classrooms
  console.log('🏫 Creating classrooms...');
  const classrooms = [
    {
      uuid: uuidv4(),
      name: 'Introduction to Computer Science',
      academic_year: '2024-2025',
      teacher_uuid: teachers[0].uuid, // Sarah Johnson
      invite_code: 'CS101FALL',
      allowed_email_domain: 'student.edu',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      name: 'Advanced Mathematics',
      academic_year: '2024-2025',
      teacher_uuid: teachers[1].uuid, // Michael Chen
      invite_code: 'MATH301SPR',
      allowed_email_domain: 'student.edu',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      uuid: uuidv4(),
      name: 'Creative Writing Workshop',
      academic_year: '2024-2025',
      teacher_uuid: teachers[2].uuid, // Emily Rodriguez
      invite_code: 'ENG200FALL',
      allowed_email_domain: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  await knex('classrooms').insert(classrooms);
  
  console.log(`✅ Created ${classrooms.length} classrooms`);
  
  // Enroll students in classrooms
  console.log('📚 Enrolling students in classrooms...');
  const classroomMembers = [];
  
  // Enroll students in Sarah's CS class (mixed engagement)
  const csClassStudents = students.slice(0, 8);
  csClassStudents.forEach((student, index) => {
    classroomMembers.push({
      classroom_uuid: classrooms[0].uuid,
      user_uuid: student.uuid,
      role: 'student',
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  });
  
  // Enroll students in Michael's Math class (some overlap)
  const mathClassStudents = students.slice(3, 10);
  mathClassStudents.forEach(student => {
    classroomMembers.push({
      classroom_uuid: classrooms[1].uuid,
      user_uuid: student.uuid,
      role: 'student',
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  });
  
  // Enroll students in Emily's Writing class (different group)
  const writingClassStudents = students.slice(6, 12);
  writingClassStudents.forEach(student => {
    classroomMembers.push({
      classroom_uuid: classrooms[2].uuid,
      user_uuid: student.uuid,
      role: 'student',
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  });
  
  // Add teachers as members of their own classrooms
  teachers.forEach((teacher, index) => {
    classroomMembers.push({
      classroom_uuid: classrooms[index].uuid,
      user_uuid: teacher.uuid,
      role: 'teacher',
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  });
  
  await knex('classroom_members').insert(classroomMembers);
  
  console.log(`✅ Created ${classroomMembers.length} classroom memberships`);
  
  // Create checkpoints for each classroom
  console.log('🎯 Creating checkpoints...');
  const checkpoints = [];
  
  // CS Class checkpoints
  for (let i = 1; i <= 6; i++) {
    checkpoints.push({
      uuid: uuidv4(),
      classroom_uuid: classrooms[0].uuid,
      name: `Module ${i}: ${['Setup & Environment', 'Variables & Data Types', 'Control Structures', 'Functions & Methods', 'Object-Oriented Programming', 'Final Project'][i-1]}`,
      description: `Complete the learning objectives for Module ${i} of the Introduction to Computer Science course.`,
      order_index: i,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  // Math Class checkpoints
  for (let i = 1; i <= 5; i++) {
    checkpoints.push({
      uuid: uuidv4(),
      classroom_uuid: classrooms[1].uuid,
      name: `Chapter ${i}: ${['Linear Algebra', 'Calculus Foundations', 'Differential Equations', 'Probability Theory', 'Advanced Applications'][i-1]}`,
      description: `Master the concepts and complete all problems for Chapter ${i} of Advanced Mathematics.`,
      order_index: i,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  // Writing Class checkpoints
  for (let i = 1; i <= 4; i++) {
    checkpoints.push({
      uuid: uuidv4(),
      classroom_uuid: classrooms[2].uuid,
      name: `Workshop ${i}: ${['Character Development', 'Dialogue & Voice', 'Plot & Structure', 'Revision & Polishing'][i-1]}`,
      description: `Complete writing exercises and peer reviews for Workshop ${i} of Creative Writing.`,
      order_index: i,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  await knex('checkpoints').insert(checkpoints);
  
  console.log(`✅ Created ${checkpoints.length} checkpoints`);
  
  // Create student progress (checkpoint completions)
  console.log('📈 Creating student progress...');
  const studentCheckpoints = [];
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  // High engagement students - most checkpoints completed
  const highEngagementStudents = [students[0], students[1], students[2]]; // Alex, Maya, James
  highEngagementStudents.forEach(student => {
    // Complete most checkpoints for CS class
    for (let i = 1; i <= 5; i++) {
      studentCheckpoints.push({
        checkpoint_uuid: checkpoints[i-1].uuid, // CS checkpoints
        student_uuid: student.uuid,
        reached_at: randomDate(threeMonthsAgo, new Date()),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  });
  
  // Medium engagement students - some checkpoints completed
  const mediumEngagementStudents = [students[3], students[4], students[5]]; // Sophia, Oliver, Isabella
  mediumEngagementStudents.forEach((student, index) => {
    // Complete some checkpoints
    const completedCount = 2 + Math.floor(Math.random() * 2); // 2-3 checkpoints
    for (let i = 1; i <= completedCount; i++) {
      studentCheckpoints.push({
        checkpoint_uuid: checkpoints[i-1].uuid,
        student_uuid: student.uuid,
        reached_at: randomDate(threeMonthsAgo, new Date()),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  });
  
  // Low engagement students - few or no checkpoints completed
  const lowEngagementStudents = [students[6], students[7], students[8]]; // Ethan, Ava, Noah
  lowEngagementStudents.forEach((student, index) => {
    // Complete 0-1 checkpoints
    if (Math.random() > 0.3) { // 70% chance of completing at least one
      studentCheckpoints.push({
        checkpoint_uuid: checkpoints[0].uuid, // First checkpoint only
        student_uuid: student.uuid,
        reached_at: randomDate(threeMonthsAgo, new Date()),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  });
  
  await knex('student_checkpoints').insert(studentCheckpoints);
  
  console.log(`✅ Created ${studentCheckpoints.length} student checkpoint completions`);
  
  console.log('💬 Creating feedback and engagement data...');
  
  // Create feedback with varying levels of detail
  const feedback = [];
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  csClassStudents.forEach((student, studentIndex) => {
    const engagementLevel = studentIndex < 3 ? 'high' : studentIndex < 6 ? 'medium' : 'low';
    const feedbackCount = engagementLevel === 'high' ? 4 : engagementLevel === 'medium' ? 2 : 1;
    
    for (let i = 0; i < feedbackCount; i++) {
      const contentLevel = engagementLevel === 'high' ? 'detailed' : 
                        engagementLevel === 'medium' ? 'normal' : 'minimal';
      
      feedback.push({
        uuid: uuidv4(),
        classroom_uuid: classrooms[0].uuid,
        student_uuid: student.uuid,
        created_by_uuid: teachers[0].uuid, // Sarah Johnson
        content: generateFeedbackContent(contentLevel),
        created_at: randomDate(twoWeeksAgo, new Date()),
        updated_at: new Date()
      });
    }
  });
  
  await knex('feedback').insert(feedback);
  
  console.log(`✅ Created ${feedback.length} feedback entries`);
  
  // Create feedback requests and responses
  console.log('📞 Creating feedback requests...');
  const feedbackRequests = [];
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  // High engagement students - recent requests
  highEngagementStudents.forEach(student => {
    feedbackRequests.push({
      uuid: uuidv4(),
      classroom_uuid: classrooms[0].uuid,
      student_uuid: student.uuid,
      message: "Could you please review my latest assignment and provide feedback on my approach?",
      resolved: true,
      created_at: randomDate(oneWeekAgo, new Date()),
      resolved_at: randomDate(oneWeekAgo, new Date()),
      created_at: new Date(),
      updated_at: new Date()
    });
  });
  
  // Medium engagement students - some requests
  mediumEngagementStudents.slice(0, 2).forEach(student => {
    feedbackRequests.push({
      uuid: uuidv4(),
      classroom_uuid: classrooms[0].uuid,
      student_uuid: student.uuid,
      message: "I'd like some feedback on my progress so far.",
      resolved: Math.random() > 0.3, // 70% chance of being resolved
      created_at: randomDate(oneWeekAgo, new Date()),
      resolved_at: Math.random() > 0.3 ? randomDate(oneWeekAgo, new Date()) : null,
      created_at: new Date(),
      updated_at: new Date()
    });
  });
  
  // Low engagement students - few or no recent requests
  lowEngagementStudents.slice(0, 1).forEach(student => {
    if (Math.random() > 0.7) { // 30% chance of making a request
      feedbackRequests.push({
        uuid: uuidv4(),
        classroom_uuid: classrooms[0].uuid,
        student_uuid: student.uuid,
        message: "Help needed",
        resolved: false, // Unresolved to show low engagement
        created_at: randomDate(oneWeekAgo, new Date()),
        resolved_at: null,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  });
  
  await knex('feedback_requests').insert(feedbackRequests);
  
  console.log(`✅ Created ${feedbackRequests.length} feedback requests`);
  
  // Create feedback demands (teachers requesting feedback from students)
  console.log('📢 Creating feedback demands...');
  const feedbackDemands = [];
  
  // Create demands for various students
  csClassStudents.forEach((student, index) => {
    if (Math.random() > 0.4) { // 60% chance of having a demand
      feedbackDemands.push({
        uuid: uuidv4(),
        classroom_uuid: classrooms[0].uuid,
        student_uuid: student.uuid,
        teacher_uuid: teachers[0].uuid,
        message: "Please provide peer feedback on at least 2 classmates' projects",
        fulfilled: index < 4, // High engagement students more likely to fulfill
        created_at: randomDate(oneWeekAgo, new Date()),
        fulfilled_at: index < 4 ? randomDate(oneWeekAgo, new Date()) : null,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  });
  
  await knex('feedback_demands').insert(feedbackDemands);
  
  console.log(`✅ Created ${feedbackDemands.length} feedback demands`);
  
  // Create some pending members for testing
  console.log('⏳ Creating pending members...');
  const pendingMembers = [
    {
      classroom_uuid: classrooms[0].uuid,
      email: 'new.student1@student.edu',
      created_at: new Date()
    },
    {
      classroom_uuid: classrooms[0].uuid,
      email: 'new.student2@student.edu',
      created_at: new Date()
    },
    {
      classroom_uuid: classrooms[1].uuid,
      email: 'math.student@student.edu',
      created_at: new Date()
    }
  ];
  
  await knex('pending_classroom_members').insert(pendingMembers);
  
  console.log(`✅ Created ${pendingMembers.length} pending members`);
  
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Teachers: ${teachers.length}`);
  console.log(`   Students: ${students.length}`);
  console.log(`   Classrooms: ${classrooms.length}`);
  console.log(`   Checkpoints: ${checkpoints.length}`);
  console.log(`   Student Progress: ${studentCheckpoints.length}`);
  console.log(`   Feedback: ${feedback.length}`);
  console.log(`   Feedback Requests: ${feedbackRequests.length}`);
  console.log(`   Feedback Demands: ${feedbackDemands.length}`);
  console.log(`   Pending Members: ${pendingMembers.length}`);
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('   Teachers (password: teacher123):');
  teachers.forEach(teacher => {
    console.log(`   - ${teacher.first_name} ${teacher.last_name}: ${teacher.email}`);
  });
  console.log('   Students (password: student123):');
  students.forEach(student => {
    console.log(`   - ${student.first_name} ${student.last_name}: ${student.email}`);
  });
  console.log('');
  console.log('🏫 Classroom Invite Codes:');
  classrooms.forEach(classroom => {
    const teacher = teachers.find(t => t.uuid === classroom.teacher_uuid);
    console.log(`   ${classroom.name} (${teacher.first_name} ${teacher.last_name}): ${classroom.invite_code}`);
  });
};