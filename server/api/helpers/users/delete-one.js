module.exports = {
  inputs: {
    record: {
      type: 'ref',
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
    await IdentityProviderUser.destroy({
      userId: inputs.record.id,
    });

    await ProjectManager.destroy({
      userId: inputs.record.id,
    });

    await BoardMembership.destroy({
      userId: inputs.record.id,
    });

    await CardSubscription.destroy({
      userId: inputs.record.id,
    });

    await CardMembership.destroy({
      userId: inputs.record.id,
    });

    await ApiToken.destroy({
      userId: inputs.record.id,
    });

    const user = await User.updateOne({
      id: inputs.record.id,
      deletedAt: null,
    }).set({
      deletedAt: new Date().toISOString(),
    });

    if (user) {
      /* const projectIds = await sails.helpers.users.getManagerProjectIds(user.id);

      const userIds = _.union(
        [user.id],
        await sails.helpers.users.getAdminIds(),
        await sails.helpers.projects.getManagerAndBoardMemberUserIds(projectIds),
      ); */

      // Note: before any user removal was brodcasted to all users but since we want the discovery of users
      // to only apply if you have a link with them, we removed it. In case of user deletion it's fine to
      // admit it will remain in local stores where fetched until a full page reload (should have no impact)
      sails.helpers.utils.sendWebhooks.with({
        event: 'userDelete',
        data: {
          item: user,
        },
        user: inputs.actorUser,
      });
    }

    return user;
  },
};
