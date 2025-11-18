exports.up = function(knex) {
  return knex.schema.createTable('notes', function(t) {
    t.increments('id').primary();
    t.uuid('uuid').notNullable().unique();
    t.uuid('classroom_uuid').notNullable().references('uuid').inTable('classrooms').onDelete('CASCADE');
    t.uuid('user_uuid').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
    t.text('content').notNullable();
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notes');
};
