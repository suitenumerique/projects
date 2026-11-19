// Lets users choose which events send them an email. The notification center
// always receives every notification.

module.exports.up = (knex) =>
  knex.schema.table('user_account', (table) => {
    table.boolean('notify_mentions_by_email').notNullable().defaultTo(true);
    table.boolean('notify_subscribed_cards_by_email').notNullable().defaultTo(true);
  });

module.exports.down = (knex) =>
  knex.schema.table('user_account', (table) => {
    table.dropColumn('notify_mentions_by_email');
    table.dropColumn('notify_subscribed_cards_by_email');
  });
