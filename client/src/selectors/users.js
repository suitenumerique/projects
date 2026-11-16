import { createSelector } from 'redux-orm';

import orm from '../orm';
import { ActivityTypes, BoardMembershipRoles } from '../constants/Enums';
import { isLocalId } from '../utils/local-id';
import { getMentionedUserIds } from '../utils/mentions';

export const selectCurrentUserId = ({ auth: { userId } }) => userId;

export const selectUsers = createSelector(orm, ({ User }) =>
  User.getOrderedUndeletedQuerySet().toRefArray(),
);

export const selectUsersExceptCurrent = createSelector(
  orm,
  (state) => selectCurrentUserId(state),
  ({ User }, id) =>
    User.getOrderedUndeletedQuerySet()
      .exclude({
        id,
      })
      .toRefArray(),
);

export const selectCurrentUser = createSelector(
  orm,
  (state) => selectCurrentUserId(state),
  ({ User }, id) => {
    if (!id) {
      return id;
    }

    const userModel = User.withId(id);

    if (!userModel) {
      return userModel;
    }

    return userModel.ref;
  },
);

export const selectProjectsForCurrentUser = createSelector(
  orm,
  (state) => selectCurrentUserId(state),
  ({ User, Project }, id) => {
    if (!id) {
      return id;
    }

    const userModel = User.withId(id);

    if (!userModel) {
      return userModel;
    }

    const projectModels = userModel.getOrderedAvailableProjectsModelArray();

    if (userModel.organizationId) {
      const orgProject = Project.all()
        .toModelArray()
        .find((p) => p.organizationId === userModel.organizationId);
      if (orgProject && !projectModels.some((p) => p.id === orgProject.id)) {
        projectModels.push(orgProject);
      }
    }

    return projectModels.map((projectModel) => {
      const boardsModels = projectModel.getOrderedBoardsModelArrayAvailableForUser(userModel.id);

      let notificationsTotal = 0;
      boardsModels.forEach((boardModel) => {
        boardModel.cards.toModelArray().forEach((cardModel) => {
          notificationsTotal += cardModel.getUnreadNotificationsQuerySet().count();
        });
      });

      return {
        ...projectModel.ref,
        notificationsTotal,
        firstBoardId: boardsModels[0] && boardsModels[0].id,
      };
    });
  },
);

export const selectProjectsToListsForCurrentUser = createSelector(
  orm,
  (state) => selectCurrentUserId(state),
  ({ User }, id) => {
    if (!id) {
      return id;
    }

    const userModel = User.withId(id);

    if (!userModel) {
      return userModel;
    }

    return userModel.getOrderedAvailableProjectsModelArray().map((projectModel) => ({
      ...projectModel.ref,
      boards: projectModel.getOrderedBoardsModelArrayForUser(id).map((boardModel) => ({
        ...boardModel.ref,
        lists: boardModel.getOrderedListsQuerySet().toRefArray(),
      })),
    }));
  },
);

export const selectNotificationsForCurrentUser = createSelector(
  orm,
  (state) => selectCurrentUserId(state),
  ({ User }, id) => {
    if (!id) {
      return id;
    }

    const userModel = User.withId(id);

    if (!userModel) {
      return userModel;
    }

    return userModel
      .getOrderedUnreadNotificationsQuerySet()
      .toModelArray()
      .map((notificationModel) => ({
        ...notificationModel.ref,
        activity: notificationModel.activity && {
          ...notificationModel.activity.ref,
          user: notificationModel.activity.user.ref,
          isMention:
            notificationModel.activity.type === ActivityTypes.COMMENT_CARD &&
            getMentionedUserIds(notificationModel.activity.data.text).includes(id),
        },
        card: notificationModel.card && notificationModel.card.ref,
      }));
  },
);

export const selectUserDefaultProject = createSelector(
  orm,
  (state) => selectCurrentUserId(state),
  ({ Project, User }, id) => {
    const userModel = User.withId(id);

    if (!userModel) {
      return userModel;
    }

    const allProjects = Project.all().toRefArray();
    return allProjects.find((project) => project.organizationId === userModel.organizationId);
  },
);

export const selectEditableBoardsForCurrentUser = createSelector(
  orm,
  (state) => selectCurrentUserId(state),
  ({ Board }, currentUserId) => {
    return Board.all()
      .toModelArray()
      .filter((boardModel) => {
        const memberships = boardModel.getOrderedMembershipsModelArray();
        return (
          memberships.length > 0 &&
          memberships.some(
            (membership) =>
              membership.user.id === currentUserId &&
              (membership.role === BoardMembershipRoles.EDITOR ||
                membership.role === BoardMembershipRoles.OWNER),
          )
        );
      })
      .map((boardModel) => ({
        ...boardModel.ref,
        isPersisted: !isLocalId(boardModel.id),
        lists: boardModel
          .getOrderedListsQuerySet()
          .toRefArray()
          .map((list) => ({
            ...list,
            isPersisted: !isLocalId(list.id),
          })),
      }));
  },
);

export const selectSearchedUsers = (state) => state.core.searchedUsers;
export const selectIsSearchingUsers = (state) => state.core.isSearchingUsers;

export default {
  selectCurrentUserId,
  selectUsers,
  selectUsersExceptCurrent,
  selectCurrentUser,
  selectProjectsForCurrentUser,
  selectProjectsToListsForCurrentUser,
  selectNotificationsForCurrentUser,
  selectUserDefaultProject,
  selectEditableBoardsForCurrentUser,
  selectSearchedUsers,
  selectIsSearchingUsers,
};
