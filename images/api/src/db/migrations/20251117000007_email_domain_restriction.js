exports.up = function(knex) {
  return knex.schema.alterTable('classrooms', function(t) {
    t.string('allowed_email_domain').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('classrooms', function(t) {
    t.dropColumn('allowed_email_domain');
  });
};
