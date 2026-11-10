module.exports.up = (knex) =>
  knex.schema.createTable('api_token', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('user_id').notNullable();

    table.text('token_hash').notNullable();
    table.text('token_prefix').notNullable();
    table.timestamp('last_used_at', true);
    table.timestamp('expires_at', true);

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.unique('token_hash');
    table.index('user_id');
  });

module.exports.down = (knex) => knex.schema.dropTable('api_token');
