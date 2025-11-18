exports.up = function(knex) {
  return knex.schema.createTable('feedback_documents', function(t) {
    t.increments('id').primary();
    t.uuid('uuid').notNullable().unique();
    t.uuid('feedback_uuid').notNullable().references('uuid').inTable('feedback').onDelete('CASCADE');
    t.string('filename').notNullable();
    t.string('original_name').notNullable();
    t.string('mimetype').notNullable();
    t.integer('size').notNullable();
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('feedback_documents');
};
