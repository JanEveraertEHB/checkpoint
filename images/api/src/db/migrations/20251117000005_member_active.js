exports.up = function(knex) {
  return knex.schema.alterTable('classroom_members', function(t) {
    t.boolean('active').notNullable().defaultTo(true);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('classroom_members', function(t) {
    t.dropColumn('active');
  });
};
