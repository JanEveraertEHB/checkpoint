exports.up = function(knex) {
  return knex.schema.alterTable('feedback', function(t) {
    t.boolean('locked').notNullable().defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('feedback', function(t) {
    t.dropColumn('locked');
  });
};
