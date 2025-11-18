exports.up = function(knex) {
  return knex.schema.alterTable('notes', function(table) {
    table.uuid('student_uuid').nullable().references('uuid').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('notes', function(table) {
    table.dropColumn('student_uuid');
  });
};
