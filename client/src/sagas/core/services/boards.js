import { all, call, put, select } from 'redux-saga/effects';

import { goToBoard, goToRoot } from './router';
import request from '../request';
import selectors from '../../../selectors';
import actions from '../../../actions';
import entryActions from '../../../entry-actions';
import api from '../../../api';
import { createLocalId } from '../../../utils/local-id';

export function* createBoard(projectId, { import: boardImport, ...data }) {
  const nextData = {
    ...data,
  };

  const localId = yield call(createLocalId);

  yield put(
    actions.createBoard({
      ...nextData,
      projectId,
      id: localId,
    }),
  );

  let board;
  let boardMemberships;

  try {
    ({
      item: board,
      included: { boardMemberships },
    } = yield boardImport
      ? call(
          request,
          api.createBoardWithImport,
          projectId,
          {
            ...nextData,
            importType: boardImport.type,
            importFile: boardImport.file,
          },
          localId,
        )
      : call(request, api.createBoard, projectId, nextData));
  } catch (error) {
    yield put(actions.createBoard.failure(localId, error));
    return;
  }

  yield put(actions.createBoard.success(localId, board, boardMemberships));
  yield call(goToBoard, board.id);
}

export function* createBoardInCurrentProject(data) {
  const currentProject = yield select(selectors.selectUserDefaultProject);
  yield call(createBoard, currentProject.id, data);
}

export function* handleBoardCreate(board, requestId) {
  const isExists = yield select(selectors.selectIsBoardWithIdExists, requestId);

  if (!isExists) {
    yield put(actions.handleBoardCreate(board));
  }
}

export function* duplicateBoard(boardId) {
  const currentProject = yield select(selectors.selectUserDefaultProject);
  yield put(actions.duplicateBoard(boardId, currentProject.id));

  let board;
  try {
    ({ item: board } = yield call(request, api.duplicateBoard, boardId, currentProject.id));
  } catch (error) {
    yield put(actions.duplicateBoard.failure(boardId, error));
    return;
  }

  yield put(actions.duplicateBoard.success(board));
  yield call(goToBoard, board.id);
}

export function* handleBoardDuplicate(board) {
  yield put(actions.handleBoardDuplicate(board));
}

export function* fetchBoard(id) {
  yield put(actions.fetchBoard(id));

  let board;
  let users;
  let projects;
  let boardMemberships;
  let labels;
  let lists;
  let cards;
  let cardMemberships;
  let cardLabels;
  let tasks;
  let attachments;

  try {
    ({
      item: board,
      included: {
        users,
        projects,
        boardMemberships,
        labels,
        lists,
        cards,
        cardMemberships,
        cardLabels,
        tasks,
        attachments,
      },
    } = yield call(request, api.getBoard, id, true));
  } catch (error) {
    yield put(actions.fetchBoard.failure(id, error));
    return;
  }

  yield put(
    actions.fetchBoard.success(
      board,
      users,
      projects,
      boardMemberships,
      labels,
      lists,
      cards,
      cardMemberships,
      cardLabels,
      tasks,
      attachments,
    ),
  );
}

export function* updateBoard(id, data) {
  // Separate board properties from user preference properties
  // Position, folderId and isFavorite are user-specific preferences, not board properties
  const { position, folderId, isFavorite, ...boardData } = data;

  // Only optimistically update board properties (not user preferences)
  if (Object.keys(boardData).length > 0) {
    yield put(actions.updateBoard(id, boardData));
  }

  // Optimistically update the user board preference
  if (position !== undefined || folderId !== undefined || isFavorite !== undefined) {
    const currentUserId = yield select(selectors.selectCurrentUserId);
    const existingPreference = yield select(selectors.selectUserBoardPreference, id);

    if (currentUserId) {
      // Create optimistic preference update
      const optimisticPreference = {
        ...(existingPreference || {}),
        userId: currentUserId,
        boardId: id,
        ...(position !== undefined && { position }),
        ...(folderId !== undefined && { folderId }),
        ...(isFavorite !== undefined && { isFavorite }),
      };

      // Use update handle since the reducer handles both create and update via upsert
      yield put(entryActions.handleUserBoardPreferenceUpdate(optimisticPreference));
    }
  }

  let board;
  let userBoardPreferences;

  try {
    const response = yield call(request, api.updateBoard, id, data);
    board = response.item;
    userBoardPreferences = (response.included && response.included.userBoardPreferences) || [];
  } catch (error) {
    yield put(actions.updateBoard.failure(id, error));
    return;
  }

  yield put(actions.updateBoard.success(board));

  // Handle included user board preferences
  if (userBoardPreferences && userBoardPreferences.length > 0) {
    yield all(
      userBoardPreferences.map((preference) =>
        // The server returns the preference after upsert, so we need to determine
        // if it's a create or update. Since the server uses upsert, we'll check
        // if we already have this preference in the store, but for simplicity,
        // we'll use update handle (the reducer handles both create and update via upsert)
        put(entryActions.handleUserBoardPreferenceUpdate(preference)),
      ),
    );
  }

  // When setting a board public status changes, if only 1 member remains,
  // the server deletes the user preference (folder assignment).
  // We must do the same here because socket events exclude the sender.
  if (typeof data.isPublic === 'boolean') {
    const { boardId } = yield select(selectors.selectPath);

    if (id === boardId) {
      const memberships = yield select(selectors.selectMembershipsForCurrentBoard);

      if (memberships && memberships.length === 1) {
        const allPreferences = yield select(selectors.selectUserBoardPreferencesForCurrentUser);
        // eslint-disable-next-line eqeqeq
        const existingPreference = allPreferences.find((p) => p.boardId == id);

        if (existingPreference && existingPreference.folderId) {
          yield put(entryActions.handleUserBoardPreferenceDelete(existingPreference));
        }
      }
    }
  }
}

export function* handleBoardUpdate(board) {
  yield put(actions.handleBoardUpdate(board));
}

export function* moveBoard(id) {
  // Position is now handled via user preferences
  // This function may need to be updated to work with user preferences
  // For now, we'll keep it but it won't work correctly without user preference position calculation
  yield call(updateBoard, id, {
    // Position will be calculated on the backend based on user preferences
  });
}

export function* deleteBoard(id) {
  const { boardId } = yield select(selectors.selectPath);
  const isCurrentBoard = id === boardId;

  yield put(actions.deleteBoard(id));

  let board;
  try {
    ({ item: board } = yield call(request, api.deleteBoard, id));
  } catch (error) {
    yield put(actions.deleteBoard.failure(id, error));
    return;
  }

  yield put(actions.deleteBoard.success(board));

  if (isCurrentBoard) {
    // yield call(goToProject, projectId);
    yield call(goToRoot);
  }
}

export function* handleBoardDelete(board) {
  const { boardId } = yield select(selectors.selectPath);
  const isCurrentBoard = board.id === boardId;

  yield put(actions.handleBoardDelete(board));

  if (isCurrentBoard) {
    // yield call(goToProject, projectId);
    yield call(goToRoot);
  }
}

export default {
  createBoard,
  createBoardInCurrentProject,
  handleBoardCreate,
  duplicateBoard,
  handleBoardDuplicate,
  fetchBoard,
  updateBoard,
  handleBoardUpdate,
  moveBoard,
  deleteBoard,
  handleBoardDelete,
};
