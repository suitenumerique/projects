// Lets each user mark boards as favorites, listed at the top of the left menu.

module.exports.up = (knex) =>
  knex.schema.table('user_board_preference', (table) => {
    table.boolean('is_favorite').notNullable().defaultTo(false);
  });

module.exports.down = (knex) =>
  knex.schema.table('user_board_preference', (table) => {
    table.dropColumn('is_favorite');
  });
