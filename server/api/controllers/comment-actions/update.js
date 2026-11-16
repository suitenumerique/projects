const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  COMMENT_ACTION_NOT_FOUND: {
    commentActionNotFound: 'Comment action not found',
  },
};

module.exports = {
  inputs: {
    id: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
    text: {
      type: 'string',
      isNotEmptyString: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    commentActionNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const path = await sails.helpers.actions
      .getProjectPath({
        id: inputs.id,
        type: Action.Types.COMMENT_CARD,
      })
      .intercept('pathNotFound', () => Errors.COMMENT_ACTION_NOT_FOUND);

    let { action } = path;
    const { card, list, board, project } = path;

    const isProjectManager = await sails.helpers.users.isProjectManager(currentUser.id, project.id);

    if (!isProjectManager) {
      if (action.userId !== currentUser.id) {
        throw Errors.COMMENT_ACTION_NOT_FOUND; // Forbidden
      }

      const boardMembership = await BoardMembership.findOne({
        boardId: board.id,
        userId: currentUser.id,
      });

      if (!boardMembership) {
        throw Errors.COMMENT_ACTION_NOT_FOUND; // Forbidden
      }

      if (
        ![BoardMembership.Roles.EDITOR, BoardMembership.Roles.OWNER].includes(
          boardMembership.role,
        ) &&
        !boardMembership.canComment
      ) {
        throw Errors.NOT_ENOUGH_RIGHTS;
      }
    }

    const values = {
      data: _.pick(inputs, ['text']),
    };

    const previouslyMentionedUserIds = sails.helpers.comments.parseMentionedUserIds(
      action.data.text,
    );

    action = await sails.helpers.actions.updateOne.with({
      values,
      project,
      board,
      list,
      card,
      record: action,
      actorUser: currentUser,
      request: this.req,
    });

    if (!action) {
      throw Errors.COMMENT_ACTION_NOT_FOUND;
    }

    // Only notify users who were not already mentioned before this edit
    const newlyMentionedUserIds = await sails.helpers.comments.getMentionedUserIds.with({
      text: action.data.text,
      boardId: board.id,
      exceptUserIds: [currentUser.id, action.userId, ...previouslyMentionedUserIds],
    });

    await Promise.all(
      newlyMentionedUserIds.map((userId) =>
        sails.helpers.notifications.createOne.with({
          values: {
            userId,
            action,
          },
          project,
          board,
          list,
          card,
          actorUser: currentUser,
        }),
      ),
    );

    return {
      item: action,
    };
  },
};
