exports.up = function(knex) {
  return knex.schema.alterTable('users', function(t) {
    t.date('date_of_birth').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(t) {
    t.dropColumn('date_of_birth');
  });
};
