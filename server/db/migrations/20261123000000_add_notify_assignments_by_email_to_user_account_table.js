// Assignments get their own email preference, split from subscribed cards. It
// starts from the subscribed cards one, which used to cover assignments.

module.exports.up = async (knex) => {
  await knex.schema.table('user_account', (table) => {
    table.boolean('notify_assignments_by_email').notNullable().defaultTo(true);
  });

  await knex('user_account').update({
    notify_assignments_by_email: knex.ref('notify_subscribed_cards_by_email'),
  });
};

module.exports.down = (knex) =>
  knex.schema.table('user_account', (table) => {
    table.dropColumn('notify_assignments_by_email');
  });
