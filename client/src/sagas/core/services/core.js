import { call, put, select } from 'redux-saga/effects';

import request from '../request';
import requests from '../requests';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';
import i18n from '../../../i18n';
import {
  removeAccessToken,
  getAccessToken,
  removeIdToken,
} from '../../../utils/access-token-storage';

export function* initializeCore() {
  const currentConfig = yield select(selectors.selectConfig); // TODO: add boolean selector?

  let config;
  if (!currentConfig) {
    ({ item: config } = yield call(api.getConfig)); // TODO: handle error

    yield put(actions.initializeCore.fetchConfig(config));
  }

  const accessToken = yield call(getAccessToken);

  if (!accessToken) {
    const resolvedConfig = yield select(selectors.selectConfig);

    if (resolvedConfig && resolvedConfig.defaultLanguage) {
      yield call(i18n.changeLanguage, resolvedConfig.defaultLanguage);
    }

    yield call(i18n.loadCoreLocale);

    yield put({ type: 'SET_INITIALIZING_FALSE' });
    return;
  }

  const {
    user,
    board,
    users,
    projects,
    projectManagers,
    boards,
    folders,
    userBoardPreferences,
    boardMemberships,
    labels,
    lists,
    cards,
    cardMemberships,
    cardLabels,
    tasks,
    attachments,
    activities,
    notifications,
  } = yield call(requests.fetchCore); // TODO: handle error

  const resolvedConfig = yield select(selectors.selectConfig);
  const language = user.language || (resolvedConfig && resolvedConfig.defaultLanguage) || null;
  yield call(i18n.changeLanguage, language);
  yield call(i18n.loadCoreLocale);

  yield put(
    actions.initializeCore(
      user,
      board,
      users,
      projects,
      projectManagers,
      boards,
      folders,
      userBoardPreferences,
      boardMemberships,
      labels,
      lists,
      cards,
      cardMemberships,
      cardLabels,
      tasks,
      attachments,
      activities,
      notifications,
    ),
  );
}

export function* changeCoreLanguage(language) {
  if (language === null) {
    yield call(i18n.detectLanguage);
    yield call(i18n.loadCoreLocale);
    yield call(i18n.changeLanguage, i18n.resolvedLanguage);
  } else {
    yield call(i18n.loadCoreLocale, language);
    yield call(i18n.changeLanguage, language);
  }
}

export function* logout(invalidateAccessToken = true) {
  yield call(removeAccessToken);
  yield call(removeIdToken);

  if (invalidateAccessToken) {
    yield put(actions.logout.invalidateAccessToken());

    try {
      yield call(request, api.deleteCurrentAccessToken);
    } catch (error) {} // eslint-disable-line no-empty
  }

  yield put(actions.logout()); // TODO: next url
}

export default {
  initializeCore,
  changeCoreLanguage,
  logout,
};
