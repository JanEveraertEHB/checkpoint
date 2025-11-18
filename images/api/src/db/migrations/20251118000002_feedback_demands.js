exports.up = function(knex) {
  return knex.schema.createTable('feedback_demands', function(t) {
    t.increments('id').primary();
    t.uuid('uuid').notNullable().unique();
    t.uuid('classroom_uuid').notNullable();
    t.uuid('student_uuid').notNullable();
    t.uuid('teacher_uuid').notNullable();
    t.text('message').nullable();
    t.boolean('fulfilled').defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('fulfilled_at').nullable();

    t.foreign('classroom_uuid').references('classrooms.uuid').onDelete('CASCADE');
    t.foreign('student_uuid').references('users.uuid').onDelete('CASCADE');
    t.foreign('teacher_uuid').references('users.uuid').onDelete('CASCADE');
    t.index(['student_uuid', 'fulfilled']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('feedback_demands');
};
