import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import selectors from '../selectors';
import entryActions from '../entry-actions';
import LeftMenu from '../components/LeftMenu';

const mapStateToProps = (state) => {
  const projects = selectors.selectProjectsForCurrentUser(state);
  const currentProject = selectors.selectCurrentProject(state);
  const { boardId } = selectors.selectPath(state);
  const privateBoards = selectors.selectPrivateBoardsForCurrentUser(state);
  const sharedBoards = selectors.selectSharedBoardsForCurrentUser(state);
  const isCurrentUserManager = selectors.selectIsCurrentUserManagerForCurrentProject(state);
  const folders = selectors.selectFoldersForCurrentUser(state);
  const userBoardPreferences = selectors.selectUserBoardPreferencesForCurrentUser(state);

  const config = selectors.selectConfig(state);

  const { templateBoards, isOrgMode } = config;

  return {
    projects,
    currentProject,
    currentBoardId: boardId,
    privateBoards,
    sharedBoards,
    folders,
    userBoardPreferences,
    templateBoards,
    isOrgMode,
    canEditProject: isCurrentUserManager,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onProjectSettingsClick: entryActions.openProjectSettingsModal,
      onBoardAdd: entryActions.createBoardInCurrentProject,
      onBoardUpdate: entryActions.updateBoard,
      onBoardDelete: entryActions.deleteBoard,
      onFolderAdd: entryActions.createFolder,
      onFolderUpdate: entryActions.updateFolder,
      onFolderDelete: entryActions.deleteFolder,
      onBoardDuplicate: entryActions.duplicateBoard,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(LeftMenu);
