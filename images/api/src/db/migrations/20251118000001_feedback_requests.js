exports.up = function(knex) {
  return knex.schema.createTable('feedback_requests', function(t) {
    t.increments('id').primary();
    t.uuid('uuid').notNullable().unique();
    t.uuid('classroom_uuid').notNullable();
    t.uuid('student_uuid').notNullable();
    t.text('message').nullable();
    t.boolean('resolved').defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('resolved_at').nullable();

    t.foreign('classroom_uuid').references('classrooms.uuid').onDelete('CASCADE');
    t.foreign('student_uuid').references('users.uuid').onDelete('CASCADE');
    t.index(['classroom_uuid', 'resolved']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('feedback_requests');
};
