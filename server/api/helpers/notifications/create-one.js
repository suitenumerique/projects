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

// Why the user gets the email, shown in its footer.
const EmailReasons = {
  MENTION: 'vous avez été mentionné(e)',
  ASSIGNMENT: 'une carte vous a été assignée',
  SUBSCRIPTION: 'vous suivez cette carte',
};

const strong = (text) => `<strong>${_.escape(text)}</strong>`;

// The notification center always gets every notification, but emails follow the
// user's preferences: mentions, assignments, and activity on subscribed cards
// (comments, moves, description changes).
const buildAndSendEmail = async (
  board,
  card,
  action,
  actorUser,
  notifiableUser,
  isCardSubscriber,
) => {
  let subject;
  let heading;
  let body;
  let reason;

  const actorName = strong(actorUser.name);
  const quotedCardName = `« ${strong(card.name)} »`;
  const boardName = strong(board.name);
  const isSubscriptionEmail = isCardSubscriber && notifiableUser.notifySubscribedCardsByEmail;

  switch (action.type) {
    case Action.Types.COMMENT_CARD: {
      const isMentioned = sails.helpers.comments
        .parseMentionedUserIds(action.data.text)
        .includes(notifiableUser.id);

      if (isMentioned && notifiableUser.notifyMentionsByEmail) {
        subject = `${actorUser.name} vous a mentionné dans « ${card.name} »`;
        heading = 'Vous avez été mentionné(e)';
        body =
          `<p>${actorName} vous a mentionné dans ${quotedCardName} (tableau ${boardName}) :</p>` +
          `<p>« ${sails.helpers.comments.formatText(action.data.text)} »</p>`;
        reason = EmailReasons.MENTION;
      } else if (isSubscriptionEmail) {
        subject = `${actorUser.name} a commenté « ${card.name} »`;
        heading = 'Nouveau commentaire';
        body = `<p>${actorName} a commenté ${quotedCardName} dans le tableau ${boardName}.</p>`;
        reason = EmailReasons.SUBSCRIPTION;
      } else {
        return;
      }

      break;
    }
    case Action.Types.ADD_MEMBER_TO_CARD:
      if (notifiableUser.id !== action.data.member.id || !notifiableUser.notifyAssignmentsByEmail) {
        return;
      }

      subject = `${actorUser.name} vous a assigné « ${card.name} »`;
      heading = 'Nouvelle carte assignée';
      body = `<p>${actorName} vous a assigné ${quotedCardName} dans le tableau ${boardName}.</p>`;
      reason = EmailReasons.ASSIGNMENT;
      break;
    case Action.Types.MOVE_CARD:
      if (!isSubscriptionEmail) {
        return;
      }

      subject = `${actorUser.name} a déplacé « ${card.name} »`;
      heading = 'Carte déplacée';
      body =
        `<p>${actorName} a déplacé ${quotedCardName} ` +
        `de ${strong(action.data.fromList.name)} vers ${strong(action.data.toList.name)} ` +
        `dans le tableau ${boardName}.</p>`;
      reason = EmailReasons.SUBSCRIPTION;
      break;
    case Action.Types.UPDATE_DESCRIPTION:
      if (!isSubscriptionEmail) {
        return;
      }

      subject = `${actorUser.name} a modifié la description de « ${card.name} »`;
      heading = 'Description modifiée';
      body = `<p>${actorName} a modifié la description de ${quotedCardName} dans le tableau ${boardName}.</p>`;
      reason = EmailReasons.SUBSCRIPTION;
      break;
    default:
      return;
  }

  const html = sails.helpers.utils.buildEmailHtml.with({
    subject,
    heading,
    body,
    buttonUrl: cardUrl(card),
    buttonLabel: 'Voir la carte',
    footerReason: reason,
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
    // Whether the user is notified as a subscriber of the card, rather than only
    // because they are mentioned in a comment.
    isCardSubscriber: {
      type: 'boolean',
      defaultsTo: false,
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

      buildAndSendEmail(
        inputs.board,
        inputs.card,
        values.action,
        inputs.actorUser,
        notifiableUser,
        inputs.isCardSubscriber,
      );
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
