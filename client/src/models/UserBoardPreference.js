import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'UserBoardPreference';

  static fields = {
    id: attr(),
    position: attr(),
    userId: fk({
      to: 'User',
      as: 'user',
      relatedName: 'userBoardPreferences',
    }),
    boardId: fk({
      to: 'Board',
      as: 'board',
      relatedName: 'userBoardPreferences',
    }),
    folderId: fk({
      to: 'Folder',
      as: 'folder',
      relatedName: 'userBoardPreferences',
    }),
  };

  static reducer({ type, payload }, UserBoardPreference) {
    switch (type) {
      case ActionTypes.CORE_INITIALIZE:
        if (payload.userBoardPreferences) {
          payload.userBoardPreferences.forEach((preference) => {
            UserBoardPreference.upsert(preference);
          });
        }
        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        UserBoardPreference.all().delete();

        if (payload.userBoardPreferences) {
          payload.userBoardPreferences.forEach((preference) => {
            UserBoardPreference.upsert(preference);
          });
        }
        break;
      case ActionTypes.USER_BOARD_PREFERENCE_CREATE_HANDLE:
      case ActionTypes.USER_BOARD_PREFERENCE_UPDATE_HANDLE:
        UserBoardPreference.upsert(payload.userBoardPreference);
        break;
      case ActionTypes.FOLDER_DELETE: {
        UserBoardPreference.all()
          .toModelArray()
          .filter((p) => p.folderId === payload.id)
          .forEach((p) => {
            p.update({ folderId: null });
          });
        break;
      }
      case ActionTypes.FOLDER_DELETE__SUCCESS:
      case ActionTypes.FOLDER_DELETE_HANDLE:
        // Update all user preferences that reference this folder to have folderId: null
        // This ensures they appear at the root level instead of disappearing
        UserBoardPreference.all()
          .toModelArray()
          .filter((p) => p.folderId === payload.folder.id)
          .forEach((p) => {
            p.update({ folderId: null });
          });
        break;
      case ActionTypes.USER_BOARD_PREFERENCE_DELETE_HANDLE: {
        const { userBoardPreference } = payload;

        // Delete by id first if it exists
        const preferenceModel = UserBoardPreference.withId(userBoardPreference.id);
        if (preferenceModel) {
          preferenceModel.delete();
        }

        // Also delete any matching entries by userId and boardId
        // (handles optimistic entries and duplicates)
        if (userBoardPreference.userId && userBoardPreference.boardId) {
          UserBoardPreference.all()
            .toModelArray()
            .filter(
              (p) =>
                // eslint-disable-next-line eqeqeq
                p.userId == userBoardPreference.userId && p.boardId == userBoardPreference.boardId,
            )
            .forEach((p) => p.delete());
        }

        break;
      }
      default:
    }
  }
}
