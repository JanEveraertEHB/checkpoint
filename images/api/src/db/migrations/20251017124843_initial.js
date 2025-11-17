
exports.up = function(knex) {
  return knex.schema.hasTable('users').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('users', function(t) {
        t.increments('id').primary();
        t.uuid('uuid').notNullable().unique();
        t.string('first_name', 100);
        t.string('last_name', 100);
        t.string('email', 100);
        t.string('password');
        t.timestamps(true, true);
      });
    }
  })
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
