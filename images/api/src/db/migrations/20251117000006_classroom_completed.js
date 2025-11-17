exports.up = function(knex) {
  return knex.schema.alterTable('classrooms', function(t) {
    t.boolean('completed').notNullable().defaultTo(false);
    t.timestamp('completed_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('classrooms', function(t) {
    t.dropColumn('completed');
    t.dropColumn('completed_at');
  });
};
