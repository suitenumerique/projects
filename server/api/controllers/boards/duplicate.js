const Errors = {
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
  PROJECT_NOT_FOUND: {
    projectNotFound: 'Project not found',
  },
};

module.exports = {
  inputs: {
    boardId: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
    targetProjectId: {
      type: 'string',
      regex: /^[0-9]+$/,
    },
  },

  exits: {
    boardNotFound: {
      responseType: 'notFound',
    },
    projectNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const { board, project } = await sails.helpers.boards
      .getProjectPath(inputs.boardId)
      .intercept('pathNotFound', () => Errors.BOARD_NOT_FOUND);

    if (!board.isPublic) {
      const isBoardMember = await sails.helpers.users.isBoardMember(currentUser.id, board.id);
      const isProjectManager = await sails.helpers.users.isProjectManager(
        currentUser.id,
        project.id,
      );

      if (!isBoardMember && !isProjectManager) {
        throw Errors.BOARD_NOT_FOUND; // Forbidden
      }
    }

    let targetProject;
    if (sails.config.custom.organizationIdClaim) {
      if (!currentUser.organizationId) {
        throw Errors.PROJECT_NOT_FOUND;
      }
      targetProject = await Project.findOne({ organizationId: currentUser.organizationId });
    } else {
      targetProject = await Project.findOne(inputs.targetProjectId);
      if (targetProject) {
        const isTargetProjectManager = await sails.helpers.users.isProjectManager(
          currentUser.id,
          targetProject.id,
        );
        if (!isTargetProjectManager) {
          targetProject = null;
        }
      }
    }

    if (!targetProject) {
      throw Errors.PROJECT_NOT_FOUND;
    }

    const newBoard = await sails.helpers.boards.duplicateOne.with({
      board,
      targetProject,
      actorUser: currentUser,
      request: this.req,
    });

    return {
      item: newBoard,
    };
  },
};
