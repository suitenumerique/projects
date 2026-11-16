import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Select } from '@gouvfr-lasuite/cunningham-react';
import { Icon } from '@gouvfr-lasuite/ui-kit';

import usePopup from '../../lib/popup/use-popup';
import BoardListItemContainer from '../../containers/BoardListItemContainer';
import BoardCreateStep from '../../steps/BoardCreateStep';
import BoardTree from '../BoardTree/BoardTree';
import FolderEditModal from './FolderEditModal';
import styles from './LeftMenu.module.scss';
import { push } from '../../lib/redux-router';
import Paths from '../../constants/Paths';
import store from '../../store';

const LeftMenu = React.memo(
  ({
    projects,
    currentProject,
    currentBoardId,
    privateBoards,
    sharedBoards,
    folders,
    userBoardPreferences,
    templateBoards,
    isOrgMode,
    canEditProject,
    onProjectSettingsClick,
    onBoardAdd,
    onBoardDuplicate,
    onBoardUpdate,
    onBoardDelete,
    onFolderAdd,
    onFolderUpdate,
    onFolderDelete,
  }) => {
    const [t] = useTranslation();
    const [folderModal, setFolderModal] = useState({
      isOpen: false,
      isPrivate: false,
      folder: null,
    });

    const BoardCreateStepPopover = usePopup(BoardCreateStep);

    const goToBoard = useCallback((boardId) => {
      store.dispatch(push(Paths.BOARDS.replace(':id', boardId)));
    }, []);

    const handleProjectSettingsClick = useCallback(() => {
      if (canEditProject) {
        onProjectSettingsClick();
      }
    }, [canEditProject, onProjectSettingsClick]);

    const handleFolderEdit = useCallback((folder) => {
      setFolderModal({ isOpen: true, isPrivate: folder.isPrivate, folder });
    }, []);

    const handleFolderModalSubmit = useCallback(
      (data) => {
        if (folderModal.folder) {
          onFolderUpdate(folderModal.folder.id, { name: data.name });
        } else {
          onFolderAdd({ ...data, isPrivate: folderModal.isPrivate });
        }
      },
      [folderModal, onFolderAdd, onFolderUpdate],
    );

    return (
      <div className={styles.wrapper}>
        {!isOrgMode && (
          <div className={styles.projects}>
            <Select
              label={t('common.project')}
              options={projects.map((project) => {
                return {
                  value: project.id,
                  label: `${project.name}${
                    project.notificationsTotal > 0
                      ? // Unfortunately the select cannot a accept elements for now, so having the fallback version (maybe not useful if notifications panel in the header?)
                        ` (${project.notificationsTotal})`
                      : // <>
                        //   {' '}
                        //   <span className={styles.notification}>{project.notificationsTotal}</span>
                        // </>
                        ''
                  }`,
                };
              })}
              defaultValue={currentProject.id}
              clearable={false}
              onChange={(event) => {
                const selectedItem = projects.find((item) => {
                  return item.id === event.target.value;
                });

                if (selectedItem) {
                  const to = selectedItem.firstBoardId
                    ? Paths.BOARDS.replace(':id', selectedItem.firstBoardId)
                    : Paths.PROJECTS.replace(':id', selectedItem.id);

                  store.dispatch(push(to));
                }
              }}
              className={styles.projectsSelect}
            />
          </div>
        )}
        <div className={styles.topBar}>
          <BoardCreateStepPopover
            onCreate={onBoardAdd}
            onCreateFromTemplate={onBoardDuplicate}
            templateBoards={templateBoards}
            hideCloseButton
          >
            <Button
              color="brand"
              variant="primary"
              className={styles.addBoardButton}
              icon={<Icon name="add" type="outlined" />}
              size="medium"
            >
              <span className={styles.addBoardButtonText}>{t('action.newBoard')}</span>
            </Button>
          </BoardCreateStepPopover>
          {canEditProject && !isOrgMode && (
            <Button
              onClick={handleProjectSettingsClick}
              color="neutral"
              variant="tertiary"
              icon={<Icon name="settings" type="outlined" />}
              size="medium"
            />
          )}
        </div>
        <div className={styles.spaces}>
          <div className={styles.space}>
            <p className={styles.spaceTitle}>
              {t('common.internalBoardWorkspace')}
              {isOrgMode && (
                <Button
                  color="neutral"
                  variant="tertiary"
                  size="nano"
                  icon={<Icon name="add" type="outlined" />}
                  className={styles.addFolderButton}
                  onClick={() => setFolderModal({ isOpen: true, isPrivate: true, folder: null })}
                />
              )}
            </p>
            {isOrgMode && (
              <BoardTree
                boards={privateBoards}
                folders={folders.filter((f) => f.isPrivate)}
                userBoardPreferences={userBoardPreferences}
                currentBoardId={currentBoardId}
                onBoardClick={goToBoard}
                onBoardUpdate={onBoardUpdate}
                onBoardDelete={onBoardDelete}
                onFolderEdit={handleFolderEdit}
                onFolderUpdate={onFolderUpdate}
                onFolderDelete={onFolderDelete}
                canEdit
              />
            )}
            {!isOrgMode && privateBoards.length === 0 && (
              <p className={styles.emptySpace}>{t('common.noBoards')}</p>
            )}
            {!isOrgMode && privateBoards.length > 0 && (
              <div className={styles.boards}>
                {privateBoards.map((board) => (
                  <BoardListItemContainer
                    key={board.id}
                    id={board.id}
                    showDescription={false}
                    editable
                    isActive={board.id === currentBoardId}
                    handleClick={() => goToBoard(board.id)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className={styles.space}>
            <p className={styles.spaceTitle}>
              {t('common.sharedBoardWorkspace')}
              {isOrgMode && (
                <Button
                  color="neutral"
                  variant="tertiary"
                  size="nano"
                  icon={<Icon name="add" type="outlined" />}
                  className={styles.addFolderButton}
                  onClick={() => setFolderModal({ isOpen: true, isPrivate: false, folder: null })}
                />
              )}
            </p>
            {isOrgMode && (
              <BoardTree
                boards={sharedBoards}
                folders={folders.filter((f) => !f.isPrivate)}
                userBoardPreferences={userBoardPreferences}
                currentBoardId={currentBoardId}
                onBoardClick={goToBoard}
                onBoardUpdate={onBoardUpdate}
                onBoardDelete={onBoardDelete}
                onFolderEdit={handleFolderEdit}
                onFolderUpdate={onFolderUpdate}
                onFolderDelete={onFolderDelete}
                canEdit
              />
            )}
            {!isOrgMode && sharedBoards.length === 0 && (
              <p className={styles.emptySpace}>{t('common.noBoards')}</p>
            )}
            {!isOrgMode && sharedBoards.length > 0 && (
              <div className={styles.boards}>
                {sharedBoards.map((board) => (
                  <BoardListItemContainer
                    key={board.id}
                    id={board.id}
                    showDescription={false}
                    editable
                    isActive={board.id === currentBoardId}
                    handleClick={() => goToBoard(board.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        {isOrgMode && (
          <FolderEditModal
            key={folderModal.folder ? folderModal.folder.id : 'new'}
            initialData={
              folderModal.folder
                ? { id: folderModal.folder.id, name: folderModal.folder.name }
                : { isPrivate: folderModal.isPrivate }
            }
            isOpen={folderModal.isOpen}
            onClose={() => setFolderModal((prev) => ({ ...prev, isOpen: false }))}
            onSubmit={handleFolderModalSubmit}
          />
        )}
      </div>
    );
  },
);

LeftMenu.propTypes = {
  projects: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  currentProject: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  currentBoardId: PropTypes.string,
  privateBoards: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  sharedBoards: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  folders: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  userBoardPreferences: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  templateBoards: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  isOrgMode: PropTypes.bool.isRequired,
  canEditProject: PropTypes.bool.isRequired,
  onProjectSettingsClick: PropTypes.func.isRequired,
  onBoardAdd: PropTypes.func.isRequired,
  onBoardDuplicate: PropTypes.func.isRequired,
  onBoardUpdate: PropTypes.func.isRequired,
  onBoardDelete: PropTypes.func.isRequired,
  onFolderAdd: PropTypes.func.isRequired,
  onFolderUpdate: PropTypes.func.isRequired,
  onFolderDelete: PropTypes.func.isRequired,
};

LeftMenu.defaultProps = {
  privateBoards: [],
  sharedBoards: [],
  folders: [],
  userBoardPreferences: [],
  currentBoardId: undefined,
};

export default LeftMenu;
