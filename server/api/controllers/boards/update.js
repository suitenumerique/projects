const Errors = {
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
};

module.exports = {
  inputs: {
    id: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
    position: {
      type: 'number',
    },
    folderId: {
      type: 'json',
    },
    name: {
      type: 'string',
      isNotEmptyString: true,
    },
    isPublic: {
      type: 'boolean',
    },
  },

  exits: {
    boardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const path = await sails.helpers.boards
      .getProjectPath(inputs.id)
      .intercept('pathNotFound', () => Errors.BOARD_NOT_FOUND);

    let { board } = path;
    const { project } = path;

    if (!board) {
      throw Errors.BOARD_NOT_FOUND;
    }

    const isProjectManager = await sails.helpers.users.isProjectManager(currentUser.id, project.id);

    const boardValues = _.pick(inputs, ['name', 'isPublic']);
    const hasBoardUpdates = Object.keys(boardValues).length > 0;
    const hasPreferenceUpdates = !_.isUndefined(inputs.position) || !_.isUndefined(inputs.folderId);

    if (hasBoardUpdates) {
      const boardMembership = await BoardMembership.findOne({
        boardId: inputs.id,
        userId: currentUser.id,
      });

      const isBoardEditorOrOwner =
        boardMembership &&
        (boardMembership.role === BoardMembership.Roles.EDITOR ||
          boardMembership.role === BoardMembership.Roles.OWNER);

      if (!isProjectManager && !isBoardEditorOrOwner) {
        throw Errors.BOARD_NOT_FOUND; // Forbidden
      }

      board = await sails.helpers.boards.updateOne.with({
        values: boardValues,
        project,
        record: board,
        actorUser: currentUser,
        request: this.req,
      });

      if (!board) {
        throw Errors.BOARD_NOT_FOUND;
      }
    }

    let userBoardPreferences = [];

    if (hasPreferenceUpdates) {
      const preferenceValues = {};
      if (!_.isUndefined(inputs.position)) preferenceValues.position = inputs.position;
      if (!_.isUndefined(inputs.folderId)) preferenceValues.folderId = inputs.folderId;

      const preference = await sails.helpers.userBoardPreferences.upsertOne.with({
        userId: currentUser.id,
        boardId: inputs.id,
        values: preferenceValues,
        actorUser: currentUser,
        request: this.req,
      });

      if (preference) {
        userBoardPreferences = [preference];
      }
    }

    return {
      item: board,
      included: {
        userBoardPreferences,
      },
    };
  },
};
