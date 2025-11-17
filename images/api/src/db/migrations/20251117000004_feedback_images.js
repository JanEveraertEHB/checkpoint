exports.up = function(knex) {
  return knex.schema.createTable('feedback_images', function(t) {
    t.increments('id').primary();
    t.uuid('uuid').notNullable().unique();
    t.uuid('feedback_uuid').notNullable().references('uuid').inTable('feedback');
    t.string('filename', 255).notNullable();
    t.string('original_name', 255).notNullable();
    t.string('mimetype', 100).notNullable();
    t.integer('size').notNullable();
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('feedback_images');
};
