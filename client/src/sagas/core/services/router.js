import { call, put, select, take } from 'redux-saga/effects';
import { push } from '../../../lib/redux-router';

import { logout } from './core';
import request from '../request';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';
import { getAccessToken } from '../../../utils/access-token-storage';
import ActionTypes from '../../../constants/ActionTypes';
import Paths from '../../../constants/Paths';

export function* goToRoot() {
  yield put(push(Paths.ROOT));
}

export function* goToProject(projectId) {
  yield put(push(Paths.PROJECTS.replace(':id', projectId)));
}

export function* goToBoard(boardId) {
  yield put(push(Paths.BOARDS.replace(':id', boardId)));
}

export function* goToCard(cardId) {
  yield put(push(Paths.CARDS.replace(':id', cardId)));
}

export function* handleLocationChange() {
  const accessToken = yield call(getAccessToken);
  const pathsMatch = yield select(selectors.selectPathsMatch);

  if (!pathsMatch) {
    return;
  }

  const isBoardPath = pathsMatch.pattern.path === Paths.BOARDS;

  if (!accessToken && !isBoardPath) {
    yield call(logout, false);
    return;
  }

  if (!accessToken && isBoardPath) {
    // Continue without authentication for public board access
  } else if (!accessToken) {
    yield call(logout, false);
    return;
  }

  switch (pathsMatch.pattern.path) {
    case Paths.LOGIN:
      yield call(goToRoot);
      return;
    case Paths.OIDC_CALLBACK:
      // OIDC callback should be handled by login saga, not core saga
      return;
    default:
  }

  const isInitializing = yield select(selectors.selectIsInitializing);

  if (isInitializing) {
    yield take([ActionTypes.CORE_INITIALIZE, 'SET_INITIALIZING_FALSE']);
  }

  if (pathsMatch.pattern.path === Paths.ROOT) {
    const config = yield select(selectors.selectConfig);
    if (config && config.isOrgMode) {
      const currentUser = yield select(selectors.selectCurrentUser);
      const allProjects = yield select(selectors.selectProjectsForCurrentUser);
      const defaultProject = allProjects.find(
        (p) => p.organizationId === currentUser.organizationId,
      );
      if (defaultProject) {
        yield call(goToProject, defaultProject.id);
        return;
      }
    }
  }

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

  switch (pathsMatch.pattern.path) {
    case Paths.BOARDS:
    case Paths.CARDS: {
      const currentBoard = yield select(selectors.selectCurrentBoard);
      let boardId = pathsMatch.params.id;

      if (pathsMatch.pattern.path === Paths.CARDS) {
        const path = yield select(selectors.selectPath);
        if (path.cardId) {
          boardId = path.boardId;
        } else {
          try {
            ({
              item: { boardId },
            } = yield call(request, api.getCard, boardId, true));
          } catch (error) {
            break;
          }
        }
      }

      const shouldFetchBoard =
        (currentBoard && currentBoard.isFetching === null) ||
        !currentBoard ||
        (boardId && currentBoard.id !== boardId);

      if (shouldFetchBoard) {
        yield put(actions.handleLocationChange.fetchBoard(boardId));

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
          } = yield call(request, api.getBoard, boardId, true));
        } catch (error) {
          // eslint-disable-line no-empty
        }
      }

      break;
    }
    default:
  }

  yield put(
    actions.handleLocationChange(
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

export default {
  goToRoot,
  goToProject,
  goToBoard,
  goToCard,
  handleLocationChange,
};
