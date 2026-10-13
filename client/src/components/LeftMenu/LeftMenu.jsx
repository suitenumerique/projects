import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Select } from '@gouvfr-lasuite/cunningham-react';
import { Icon } from '@gouvfr-lasuite/ui-kit';

import usePopup from '../../lib/popup/use-popup';
import BoardListItemContainer from '../../containers/BoardListItemContainer';
import BoardCreateStep from '../../steps/BoardCreateStep';
import Tooltip from '../../ui/Tooltip/Tooltip';
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
    templateBoards,
    canEditProject,
    onProjectSettingsClick,
    onBoardAdd,
    onBoardDuplicate,
  }) => {
    const [t] = useTranslation();

    const BoardCreateStepPopover = usePopup(BoardCreateStep);

    const goToBoard = useCallback((boardId) => {
      store.dispatch(push(Paths.BOARDS.replace(':id', boardId)));
    }, []);

    const handleProjectSettingsClick = useCallback(() => {
      if (canEditProject) {
        onProjectSettingsClick();
      }
    }, [canEditProject, onProjectSettingsClick]);

    return (
      <div className={styles.wrapper}>
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
        {canEditProject && (
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
            <Button
              onClick={handleProjectSettingsClick}
              color="neutral"
              variant="tertiary"
              icon={<Icon name="settings" type="outlined" />}
              size="medium"
            />
          </div>
        )}
        <div className={styles.spaces}>
          <div className={styles.space}>
            <p className={styles.spaceTitle}>
              {t('common.internalBoardWorkspace')}
              <Tooltip placement="right" content={t('common.internalBoardWorkspaceDescription')}>
                <Icon name="info" type="outlined" size="small" className={styles.spaceTitleIcon} />
              </Tooltip>
            </p>
            {privateBoards.length === 0 ? (
              <p className={styles.emptySpace}>{t('common.noBoards')}</p>
            ) : (
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
              <Tooltip placement="right" content={t('common.sharedBoardWorkspaceDescription')}>
                <Icon name="info" type="outlined" size="small" className={styles.spaceTitleIcon} />
              </Tooltip>
            </p>
            {sharedBoards.length === 0 ? (
              <p className={styles.emptySpace}>{t('common.noBoards')}</p>
            ) : (
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
  templateBoards: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  canEditProject: PropTypes.bool.isRequired,
  onProjectSettingsClick: PropTypes.func.isRequired,
  onBoardAdd: PropTypes.func.isRequired,
  onBoardDuplicate: PropTypes.func.isRequired,
};

LeftMenu.defaultProps = {
  privateBoards: [],
  sharedBoards: [],
  currentBoardId: undefined,
};

export default LeftMenu;
