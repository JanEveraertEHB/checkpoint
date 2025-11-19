exports.up = function(knex) {
  return knex.schema.createTable('pending_classroom_members', function(t) {
    t.increments('id').primary();
    t.uuid('classroom_uuid').notNullable();
    t.string('email', 100).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign key to classrooms
    t.foreign('classroom_uuid').references('uuid').inTable('classrooms').onDelete('CASCADE');

    // Unique constraint: one email can only be pending once per classroom
    t.unique(['classroom_uuid', 'email']);

    // Index on email for faster lookups during registration
    t.index('email');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('pending_classroom_members');
};
