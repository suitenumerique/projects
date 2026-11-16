const valuesValidator = (value) => {
  if (!_.isPlainObject(value)) {
    return false;
  }

  // Position is optional - only validate if it's provided
  if (!_.isUndefined(value.position) && !_.isFinite(value.position)) {
    return false;
  }

  return true;
};

module.exports = {
  inputs: {
    userId: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
    boardId: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
    values: {
      type: 'ref',
      custom: valuesValidator,
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const { values } = inputs;

    // Check if preference already exists
    const existingPreference = await UserBoardPreference.findOne({
      userId: inputs.userId,
      boardId: inputs.boardId,
    });

    const isCreating = !existingPreference;

    // Determine target folder for position calculation
    const targetFolderId = !_.isUndefined(values.folderId)
      ? values.folderId
      : (existingPreference && existingPreference.folderId) || null;

    // Get other boards in the same context (same folder or root) for this user
    const otherPreferences = await UserBoardPreference.find({
      userId: inputs.userId,
      folderId: targetFolderId || null,
      boardId: { '!=': inputs.boardId },
    }).sort('position ASC');

    // Handle position changes
    if (!_.isUndefined(values.position)) {
      const { position, repositions } = sails.helpers.utils.insertToPositionables(
        values.position,
        otherPreferences,
      );

      values.position = position;

      // Update positions of other preferences
      repositions.forEach(async ({ id, position: nextPosition }) => {
        await UserBoardPreference.updateOne({ id, userId: inputs.userId }).set({
          position: nextPosition,
        });
      });
    } else if (isCreating) {
      // If creating new and no position specified, add at the end
      const lastPreference = otherPreferences[otherPreferences.length - 1];
      values.position = lastPreference ? lastPreference.position + 65535 : 0;
    }

    let preference;
    if (isCreating) {
      // Create new preference
      preference = await UserBoardPreference.create({
        ...values,
        userId: inputs.userId,
        boardId: inputs.boardId,
      }).fetch();
    } else {
      // Update existing preference
      preference = await UserBoardPreference.updateOne({
        userId: inputs.userId,
        boardId: inputs.boardId,
      }).set({ ...values });
    }

    if (preference) {
      const eventName = isCreating ? 'userBoardPreferenceCreate' : 'userBoardPreferenceUpdate';

      sails.sockets.broadcast(
        `user:${inputs.userId}`,
        eventName,
        {
          item: preference,
        },
        inputs.request,
      );
    }

    return preference;
  },
};
