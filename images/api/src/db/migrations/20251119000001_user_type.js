exports.up = function(knex) {
  return knex.schema.alterTable('users', function(t) {
    t.enum('user_type', ['student', 'teacher']).notNullable().defaultTo('student');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(t) {
    t.dropColumn('user_type');
  });
};
