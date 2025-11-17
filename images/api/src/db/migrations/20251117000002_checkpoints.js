exports.up = function(knex) {
  return knex.schema
    .createTable('checkpoints', function(t) {
      t.increments('id').primary();
      t.uuid('uuid').notNullable().unique();
      t.uuid('classroom_uuid').notNullable().references('uuid').inTable('classrooms');
      t.string('name', 255).notNullable();
      t.text('description');
      t.integer('order_index').notNullable().defaultTo(0);
      t.timestamps(true, true);
    })
    .createTable('student_checkpoints', function(t) {
      t.increments('id').primary();
      t.uuid('checkpoint_uuid').notNullable().references('uuid').inTable('checkpoints');
      t.uuid('student_uuid').notNullable().references('uuid').inTable('users');
      t.timestamp('reached_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.unique(['checkpoint_uuid', 'student_uuid']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('student_checkpoints')
    .dropTableIfExists('checkpoints');
};
