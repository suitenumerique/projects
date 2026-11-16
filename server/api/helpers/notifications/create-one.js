const valuesValidator = (value) => {
  if (!_.isPlainObject(value)) {
    return false;
  }

  if (!_.isPlainObject(value.user) && !_.isString(value.userId)) {
    return false;
  }

  if (!_.isPlainObject(value.action)) {
    return false;
  }

  return true;
};

const cardUrl = (card) => `${process.env.BASE_URL}/cards/${card.id}`;

const buildAndSendEmail = async (board, card, action, actorUser, notifiableUser) => {
  let subject;
  let heading;
  let body;

  const actorName = `<strong>${actorUser.name} (${actorUser.email})</strong>`;
  const cardName = `<strong>${card.name}</strong>`;
  const boardName = `<strong>${board.name}</strong>`;

  switch (action.type) {
    case Action.Types.COMMENT_CARD:
      if (
        sails.helpers.comments.parseMentionedUserIds(action.data.text).includes(notifiableUser.id)
      ) {
        subject = `Vous avez été mentionné : ${card.name}`;
        heading = 'Vous avez été mentionné !';
        body =
          `<p>${actorName} vous a mentionné dans un commentaire de la carte ${cardName} ` +
          `dans le tableau ${boardName} :</p>` +
          `<blockquote style="margin: 16px 0; padding: 8px 16px; border-left: 3px solid #dddddd; color: #3a3a3a;">` +
          `${sails.helpers.comments.formatText(action.data.text)}</blockquote>`;
      } else {
        subject = `Nouveau commentaire : ${card.name}`;
        heading = 'Nouveau commentaire !';
        body =
          `<p>${actorName} a ajouté un commentaire dans la carte suivante : ${cardName} ` +
          `dans le tableau ${boardName}</p>`;
      }

      break;
    case Action.Types.ADD_MEMBER_TO_CARD:
      if (notifiableUser.id !== action.data.member.id) {
        return;
      }

      subject = `Nouvelle carte attribuée : ${card.name}`;
      heading = 'Nouvelle carte attribuée !';
      body = `<p>${actorName} vous a attribué la carte suivante : ${cardName} dans le tableau ${boardName}.</p>`;
      break;
    default:
      return;
  }

  const html = sails.helpers.utils.buildEmailHtml.with({
    subject,
    heading,
    body,
    buttonUrl: cardUrl(card),
    buttonLabel: 'Ouvrir la carte',
  });

  await sails.helpers.utils.sendEmail.with({
    to: notifiableUser.email,
    subject,
    html,
  });
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
    card: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    const { values } = inputs;

    if (values.user) {
      values.userId = values.user.id;
    }

    const notification = await Notification.create({
      ...values,
      actionId: values.action.id,
      cardId: values.action.cardId,
    }).fetch();

    sails.sockets.broadcast(`user:${notification.userId}`, 'notificationCreate', {
      item: notification,
    });

    if (sails.hooks.smtp.isActive()) {
      let notifiableUser;
      if (values.user) {
        notifiableUser = values.user;
      } else {
        notifiableUser = await sails.helpers.users.getOne(notification.userId);
      }

      buildAndSendEmail(inputs.board, inputs.card, values.action, inputs.actorUser, notifiableUser);
    }

    sails.helpers.utils.sendWebhooks.with({
      event: 'notificationCreate',
      data: {
        item: notification,
        included: {
          projects: [inputs.project],
          boards: [inputs.board],
          lists: [inputs.list],
          cards: [inputs.card],
          actions: [values.action],
        },
      },
      user: inputs.actorUser,
    });

    return notification;
  },
};
