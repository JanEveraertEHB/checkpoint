exports.up = function(knex) {
  return knex.schema
    .createTable('actions', function(t) {
      t.increments('id').primary();
      t.uuid('uuid').notNullable();
      t.string('action', 255);
      t.json('payload');
      t.uuid('student_id');
      t.timestamps(true, true);
    })
    .createTable('classrooms', function(t) {
      t.increments('id').primary();
      t.uuid('uuid').notNullable().unique();
      t.string('name', 255).notNullable();
      t.string('academic_year', 50).notNullable();
      t.uuid('teacher_uuid').notNullable().references('uuid').inTable('users');
      t.string('invite_code', 50).notNullable().unique();
      t.timestamps(true, true);
    })
    .createTable('classroom_members', function(t) {
      t.increments('id').primary();
      t.uuid('classroom_uuid').notNullable().references('uuid').inTable('classrooms');
      t.uuid('user_uuid').notNullable().references('uuid').inTable('users');
      t.enu('role', ['teacher', 'student']).notNullable();
      t.timestamps(true, true);
      t.unique(['classroom_uuid', 'user_uuid']);
    })
    .createTable('feedback', function(t) {
      t.increments('id').primary();
      t.uuid('uuid').notNullable().unique();
      t.uuid('classroom_uuid').notNullable().references('uuid').inTable('classrooms');
      t.uuid('student_uuid').notNullable().references('uuid').inTable('users');
      t.uuid('created_by_uuid').notNullable().references('uuid').inTable('users');
      t.text('content').notNullable();
      t.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('feedback')
    .dropTableIfExists('classroom_members')
    .dropTableIfExists('classrooms')
    .dropTableIfExists('actions');
};
