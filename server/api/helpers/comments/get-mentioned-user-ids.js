module.exports = {
  inputs: {
    text: {
      type: 'string',
      allowNull: true,
    },
    boardId: {
      type: 'string',
      required: true,
    },
    exceptUserIds: {
      type: 'json',
      defaultsTo: [],
    },
  },

  async fn(inputs) {
    const userIds = _.difference(
      sails.helpers.comments.parseMentionedUserIds(inputs.text),
      inputs.exceptUserIds,
    );

    if (userIds.length === 0) {
      return [];
    }

    // Only board members can be mentioned
    const boardMemberships = await BoardMembership.find({
      boardId: inputs.boardId,
      userId: userIds,
    });

    return _.uniq(sails.helpers.utils.mapRecords(boardMemberships, 'userId'));
  },
};
