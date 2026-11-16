const valuesValidator = (value) => {
  if (!_.isPlainObject(value)) {
    return false;
  }

  if (!_.isPlainObject(value.card)) {
    return false;
  }

  if (!_.isPlainObject(value.user)) {
    return false;
  }

  return true;
};

module.exports = {
  inputs: {
    values: {
      type: 'ref',
      custom: valuesValidator,
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    board: {
      type: 'ref',
      required: true,
    },
    list: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const { values } = inputs;

    const action = await Action.create({
      ...values,
      cardId: values.card.id,
      userId: values.user.id,
    }).fetch();

    sails.sockets.broadcast(
      `board:${values.card.boardId}`,
      'actionCreate',
      {
        item: action,
      },
      inputs.request,
    );

    sails.helpers.utils.sendWebhooks.with({
      event: 'actionCreate',
      data: {
        item: action,
        included: {
          projects: [inputs.project],
          boards: [inputs.board],
          lists: [inputs.list],
          cards: [values.card],
        },
      },
      user: values.user,
    });

    if (action.type === Action.Types.ADD_MEMBER_TO_CARD) {
      if (action.data.member.id !== action.userId) {
        await sails.helpers.notifications.createOne.with({
          values: {
            userId: action.data.member.id,
            action,
          },
          project: inputs.project,
          board: inputs.board,
          list: inputs.list,
          card: values.card,
          actorUser: values.user,
        });
      }
    } else {
      const subscriptionUserIds = await sails.helpers.cards.getSubscriptionUserIds(
        action.cardId,
        action.userId,
      );

      await Promise.all(
        subscriptionUserIds.map(async (userId) =>
          sails.helpers.notifications.createOne.with({
            values: {
              userId,
              action,
            },
            project: inputs.project,
            board: inputs.board,
            list: inputs.list,
            card: values.card,
            actorUser: values.user,
          }),
        ),
      );
    }

    return action;
  },
};
