import React, { useCallback, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Checkbox } from '@gouvfr-lasuite/cunningham-react';
import { Icon } from '@gouvfr-lasuite/ui-kit';
import usePopup from '../../lib/popup';

import { startStopwatch, stopStopwatch } from '../../utils/stopwatch';
import CardModalNameEdit from './CardModalNameEdit';
import CardModalDescription from './CardModalDescription';
import Tasks from './Tasks';
import Attachments from './Attachments';
import AttachmentAddZone from './AttachmentAddZone';
import Activities from './Activities';
import User from '../../ui/User';
import Label from '../../ui/Label';
import DueDate from '../../ui/DueDate';
import Stopwatch from '../../ui/Stopwatch';
import BoardMembershipsStep from '../../steps/BoardMembershipsStep';
import LabelsStep from '../../steps/LabelsStep';
import DueDateEditStep from '../../steps/DueDateEditStep/DueDateEditStep';
import StopwatchEditStep from '../../steps/StopwatchEditStep/StopwatchEditStep';
import CardMoveStep from '../../steps/CardMoveStep/CardMoveStep';
import CardModalActionsStep from '../../steps/CardModalActionsStep/CardModalActionsStep';

import styles from './CardModal.module.scss';

const CardModal = React.memo(
  ({
    name,
    description,
    dueDate,
    isDueDateCompleted,
    stopwatch,
    // isSubscribed,
    isActivitiesFetching,
    isAllActivitiesFetched,
    // isActivitiesDetailsVisible,
    // isActivitiesDetailsFetching,
    listId,
    boardId,
    projectId,
    boards,
    lists,
    users,
    labels,
    tasks,
    attachments,
    activities,
    allBoardMemberships,
    allLabels,
    canEdit,
    canEditCommentActivities,
    canEditAllCommentActivities,
    onUpdate,
    onMove,
    onTransfer,
    onDuplicate,
    onDelete,
    onUserAdd,
    onUserRemove,
    onBoardFetch,
    onLabelAdd,
    onLabelRemove,
    onLabelCreate,
    onLabelUpdate,
    onLabelMove,
    onLabelDelete,
    onTaskCreate,
    onTaskUpdate,
    onTaskMove,
    onTaskDelete,
    onAttachmentCreate,
    onAttachmentUpdate,
    onAttachmentDelete,
    onActivitiesFetch,
    // onActivitiesDetailsToggle,
    onCommentActivityCreate,
    onCommentActivityUpdate,
    onCommentActivityDelete,
    onClose,
  }) => {
    const [t] = useTranslation();
    const [currentListName, setCurrentListName] = useState();
    const [isLinkCopied, setIsLinkCopied] = useState(false);

    const userIds = users.map((user) => user.id);
    const labelIds = labels.map((label) => label.id);

    const isGalleryOpened = useRef(false);

    const LabelsPopover = usePopup(LabelsStep);
    const CardMovePopover = usePopup(CardMoveStep);
    const DueDateEditPopover = usePopup(DueDateEditStep);
    const BoardMembershipsPopover = usePopup(BoardMembershipsStep);
    const StopwatchEditPopover = usePopup(StopwatchEditStep);
    const CardModalActionsPopover = usePopup(CardModalActionsStep);

    useMemo(() => {
      setCurrentListName(lists.find((list) => list.id === listId)?.name || null);
    }, [lists, listId]);

    const handleCopyLinkClick = useCallback(() => {
      navigator.clipboard.writeText(window.location.href);
      setIsLinkCopied(true);
      setTimeout(() => {
        setIsLinkCopied(false);
      }, 3000);
    }, []);

    // const handleToggleSubscriptionClick = useCallback(() => {
    //   onUpdate({
    //     isSubscribed: !isSubscribed,
    //   });
    // }, [isSubscribed, onUpdate]);

    const handleClose = useCallback(() => {
      if (isGalleryOpened.current) {
        return;
      }
      onClose();
    }, [onClose]);

    const handleNameUpdate = useCallback(
      (newName) => {
        onUpdate({
          name: newName,
        });
      },
      [onUpdate],
    );

    const handleDueDateUpdate = useCallback(
      (newDueDate) => {
        onUpdate({
          dueDate: newDueDate,
        });
      },
      [onUpdate],
    );

    const handleDueDateCompletionChange = useCallback(() => {
      onUpdate({
        isDueDateCompleted: !isDueDateCompleted,
      });
    }, [isDueDateCompleted, onUpdate]);

    const handleStopwatchUpdate = useCallback(
      (newStopwatch) => {
        onUpdate({
          stopwatch: newStopwatch,
        });
      },
      [onUpdate],
    );

    const handleToggleStopwatchClick = useCallback(() => {
      onUpdate({
        stopwatch: stopwatch.startedAt ? stopStopwatch(stopwatch) : startStopwatch(stopwatch),
      });
    }, [stopwatch, onUpdate]);

    const handleDescriptionUpdate = useCallback(
      (newDescription) => {
        onUpdate({
          description: newDescription,
        });
      },
      [onUpdate],
    );

    const handleCoverUpdate = useCallback(
      (newCoverAttachmentId) => {
        onUpdate({
          coverAttachmentId: newCoverAttachmentId,
        });
      },
      [onUpdate],
    );

    const handleGalleryOpen = useCallback(() => {
      isGalleryOpened.current = true;
    }, []);

    const handleGalleryClose = useCallback(() => {
      isGalleryOpened.current = false;
    }, []);

    const contentNode = (
      <div className={styles.cardModalWrapper}>
        <div className={styles.cardModalHeader}>
          <div className={styles.cardModalHeaderLeft}>
            {canEdit ? (
              <CardMovePopover
                boards={boards}
                defaultPath={{
                  projectId,
                  boardId,
                  listId,
                }}
                onMove={onMove}
                onTransfer={onTransfer}
                onBoardFetch={onBoardFetch}
              >
                <Button size="small" color="brand" variant="secondary">
                  {currentListName}
                  <Icon
                    name="keyboard_arrow_down"
                    className={styles.boardSelectorIcon}
                    size="small"
                  />
                </Button>
              </CardMovePopover>
            ) : (
              <Button size="small" color="brand" variant="secondary">
                {currentListName}
              </Button>
            )}
          </div>
          <div className={styles.cardModalHeaderRight}>
            {window.isSecureContext && (
              <button type="button" className="modal-button" onClick={handleCopyLinkClick}>
                <Icon name={isLinkCopied ? 'check' : 'link'} size="medium" />
              </button>
            )}
            {canEdit && (
              <div className={styles.optionsButtonContainer}>
                <CardModalActionsPopover onDuplicate={onDuplicate} onDelete={onDelete}>
                  <button type="button" className="modal-button">
                    <Icon name="more_horiz" size="medium" />
                  </button>
                </CardModalActionsPopover>
              </div>
            )}

            <button type="button" onClick={handleClose} className="modal-button">
              <Icon name="close" size="medium" />
            </button>
          </div>
        </div>

        <div className={styles.cardModalContent}>
          <section className={classNames(styles.cardModalSection, styles.cardNameSection)}>
            <div className={styles.cardModalSectionLeft} />
            <div className={styles.cardModalSectionRight}>
              {canEdit ? (
                <CardModalNameEdit defaultValue={name} onUpdate={handleNameUpdate} />
              ) : (
                <div className={styles.cardName}>{name}</div>
              )}
            </div>
          </section>
          {canEdit && (
            <section className={classNames(styles.cardModalSection, styles.cardButtonsSection)}>
              <div className={styles.cardModalSectionLeft} />
              <div className={styles.cardModalSectionRight}>
                <LabelsPopover
                  items={allLabels}
                  currentIds={labelIds}
                  onSelect={onLabelAdd}
                  onDeselect={onLabelRemove}
                  onCreate={onLabelCreate}
                  onUpdate={onLabelUpdate}
                  onMove={onLabelMove}
                  onDelete={onLabelDelete}
                >
                  <Button
                    color="brand"
                    variant="bordered"
                    size="small"
                    icon={<Icon size="small" type="outlined" name="new_label" />}
                  >
                    {t('common.labels', {
                      context: 'title',
                    })}
                  </Button>
                </LabelsPopover>
                <BoardMembershipsPopover
                  items={allBoardMemberships}
                  currentUserIds={userIds}
                  onUserSelect={onUserAdd}
                  onUserDeselect={onUserRemove}
                >
                  <Button
                    color="brand"
                    variant="bordered"
                    size="small"
                    icon={<Icon size="small" type="outlined" name="person_add" />}
                  >
                    {t('common.members')}
                  </Button>
                </BoardMembershipsPopover>
                <DueDateEditPopover defaultValue={dueDate} onUpdate={handleDueDateUpdate}>
                  <Button
                    color="brand"
                    variant="bordered"
                    size="small"
                    icon={<Icon size="small" type="outlined" name="calendar_today" />}
                  >
                    {t('common.dueDate', {
                      context: 'title',
                    })}
                  </Button>
                </DueDateEditPopover>
                <StopwatchEditPopover defaultValue={stopwatch} onUpdate={handleStopwatchUpdate}>
                  <Button
                    color="brand"
                    variant="bordered"
                    size="small"
                    icon={<Icon size="small" type="outlined" name="schedule" />}
                  >
                    {t('common.stopwatch')}
                  </Button>
                </StopwatchEditPopover>
              </div>
            </section>
          )}
          {(users.length > 0 || labels.length > 0 || dueDate || stopwatch) && (
            <section className={classNames(styles.cardModalSection, styles.cardDetailsSection)}>
              <div className={styles.cardModalSectionLeft} />
              <div className={styles.cardModalSectionRight}>
                {labels.length > 0 && (
                  <div className={styles.detailsItem}>
                    <div className={styles.detailsItemTitle}>
                      {t('common.labels', {
                        context: 'title',
                      })}
                    </div>
                    <div className={styles.detailsItemContent}>
                      {labels.map((label) => (
                        <span key={label.id}>
                          {canEdit ? (
                            <LabelsPopover
                              key={label.id}
                              items={allLabels}
                              currentIds={labelIds}
                              onSelect={onLabelAdd}
                              onDeselect={onLabelRemove}
                              onCreate={onLabelCreate}
                              onUpdate={onLabelUpdate}
                              onMove={onLabelMove}
                              onDelete={onLabelDelete}
                            >
                              <button type="button" className="bare-button">
                                <Label name={label.name} color={label.color} size="medium" />
                              </button>
                            </LabelsPopover>
                          ) : (
                            <Label name={label.name} color={label.color} size="medium" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {users.length > 0 && (
                  <div className={styles.detailsItem}>
                    <div className={styles.detailsItemTitle}>
                      {t('common.members', {
                        context: 'title',
                      })}
                    </div>
                    <div className={styles.detailsItemContent}>
                      {users.map((user) => (
                        <span key={user.id}>
                          {canEdit ? (
                            <BoardMembershipsPopover
                              items={allBoardMemberships}
                              currentUserIds={userIds}
                              onUserSelect={onUserAdd}
                              onUserDeselect={onUserRemove}
                            >
                              <button type="button" className="bare-button">
                                <User name={user.name} size="medium" avatarUrl={user.avatarUrl} />
                              </button>
                            </BoardMembershipsPopover>
                          ) : (
                            <User name={user.name} size="medium" avatarUrl={user.avatarUrl} />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {dueDate && (
                  <div className={styles.detailsItem}>
                    <div className={styles.detailsItemTitle}>
                      {t('common.dueDate', {
                        context: 'title',
                      })}
                    </div>
                    <div className={classNames(styles.detailsItemContent, styles.dueDateContent)}>
                      {canEdit ? (
                        <>
                          <Checkbox
                            checked={isDueDateCompleted}
                            disabled={!canEdit}
                            onChange={handleDueDateCompletionChange}
                          />
                          <DueDateEditPopover defaultValue={dueDate} onUpdate={handleDueDateUpdate}>
                            <button type="button" className="bare-button">
                              <DueDate
                                size="medium"
                                withStatusIcon
                                value={dueDate}
                                isCompleted={isDueDateCompleted}
                                onClick={() => {}}
                              />
                            </button>
                          </DueDateEditPopover>
                        </>
                      ) : (
                        <DueDate
                          size="medium"
                          withStatusIcon
                          value={dueDate}
                          isCompleted={isDueDateCompleted}
                        />
                      )}
                    </div>
                  </div>
                )}
                {stopwatch && (
                  <div className={styles.detailsItem}>
                    <div className={styles.detailsItemTitle}>
                      {t('common.stopwatch', {
                        context: 'title',
                      })}
                    </div>
                    <div className={styles.detailsItemContent}>
                      {canEdit ? (
                        <StopwatchEditPopover
                          defaultValue={stopwatch}
                          onUpdate={handleStopwatchUpdate}
                        >
                          <button type="button" className="bare-button">
                            <Stopwatch
                              startedAt={stopwatch.startedAt}
                              total={stopwatch.total}
                              size="medium"
                            />
                          </button>
                        </StopwatchEditPopover>
                      ) : (
                        <Stopwatch
                          startedAt={stopwatch.startedAt}
                          total={stopwatch.total}
                          size="medium"
                        />
                      )}
                      {canEdit && (
                        <Button
                          type="button"
                          color="brand"
                          variant="bordered"
                          size="small"
                          className={styles.detailsItemAddButton}
                          onClick={handleToggleStopwatchClick}
                        >
                          <Icon name={stopwatch.startedAt ? 'pause' : 'play_arrow'} size="small" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
          {(canEdit || description) && (
            <section className={classNames(styles.cardModalSection, styles.cardDescriptionSection)}>
              <div className={styles.cardModalSectionLeft}>
                <Icon name="format_align_left" size="small" />
              </div>
              <div className={styles.cardModalSectionRight}>
                <div className={styles.sectionTitle}>{t('common.description')}</div>
                <div className={styles.detailsItemContent}>
                  <CardModalDescription
                    description={description}
                    canEdit={canEdit}
                    onUpdate={handleDescriptionUpdate}
                  />
                </div>
              </div>
            </section>
          )}
          {(canEdit || tasks.length > 0) && (
            <section className={classNames(styles.cardModalSection, styles.cardTasksSection)}>
              <div className={styles.cardModalSectionLeft}>
                <Icon name="check_box" type="outlined" size="small" />
              </div>
              <div className={styles.cardModalSectionRight}>
                <div className={styles.sectionTitle}>{t('common.tasks')}</div>
                <div className={styles.detailsItemContent}>
                  <Tasks
                    items={tasks}
                    canEdit={canEdit}
                    onCreate={onTaskCreate}
                    onUpdate={onTaskUpdate}
                    onMove={onTaskMove}
                    onDelete={onTaskDelete}
                  />
                </div>
              </div>
            </section>
          )}
          {(canEdit || attachments.length > 0) && (
            <section className={classNames(styles.cardModalSection, styles.cardAttachmentsSection)}>
              <div className={styles.cardModalSectionLeft}>
                <Icon name="attach_file" type="outlined" size="small" />
              </div>
              <div className={styles.cardModalSectionRight}>
                <div className={styles.sectionTitle}>{t('common.attachments')}</div>
                <div className={styles.detailsItemContent}>
                  <Attachments
                    items={attachments}
                    canEdit={canEdit}
                    onCreate={onAttachmentCreate}
                    onUpdate={onAttachmentUpdate}
                    onDelete={onAttachmentDelete}
                    onCoverUpdate={handleCoverUpdate}
                    onGalleryOpen={handleGalleryOpen}
                    onGalleryClose={handleGalleryClose}
                  />
                </div>
              </div>
            </section>
          )}
          <section className={classNames(styles.cardModalSection, styles.cardActivitiesSection)}>
            <div className={styles.cardModalSectionLeft}>
              <Icon name="comment" type="outlined" size="small" />
            </div>
            <div className={styles.cardModalSectionRight}>
              <div className={styles.sectionTitle}>{t('common.commentsAndActivities')}</div>
              <div className={styles.detailsItemContent}>
                <Activities
                  items={activities}
                  isFetching={isActivitiesFetching}
                  isAllFetched={isAllActivitiesFetched}
                  isDetailsVisible={false}
                  // isDetailsFetching={isActivitiesDetailsFetching}
                  canEdit={canEditCommentActivities}
                  canEditAllComments={canEditAllCommentActivities}
                  onFetch={onActivitiesFetch}
                  // onDetailsToggle={onActivitiesDetailsToggle}
                  onCommentCreate={onCommentActivityCreate}
                  onCommentUpdate={onCommentActivityUpdate}
                  onCommentDelete={onCommentActivityDelete}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    );

    return (
      <Modal isOpen closeIcon onClose={handleClose} hideCloseButton closeOnClickOutside>
        {canEdit ? (
          <AttachmentAddZone onCreate={onAttachmentCreate}>{contentNode}</AttachmentAddZone>
        ) : (
          contentNode
        )}
      </Modal>
    );
  },
);

CardModal.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  dueDate: PropTypes.instanceOf(Date),
  isDueDateCompleted: PropTypes.bool,
  stopwatch: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  // isSubscribed: PropTypes.bool.isRequired,
  isActivitiesFetching: PropTypes.bool.isRequired,
  isAllActivitiesFetched: PropTypes.bool.isRequired,
  // isActivitiesDetailsVisible: PropTypes.bool.isRequired,
  // isActivitiesDetailsFetching: PropTypes.bool.isRequired,
  listId: PropTypes.string.isRequired,
  boardId: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  /* eslint-disable react/forbid-prop-types */
  boards: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  lists: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  users: PropTypes.array.isRequired,
  labels: PropTypes.array.isRequired,
  tasks: PropTypes.array.isRequired,
  attachments: PropTypes.array.isRequired,
  activities: PropTypes.array.isRequired,
  allBoardMemberships: PropTypes.array.isRequired,
  allLabels: PropTypes.array.isRequired,
  /* eslint-enable react/forbid-prop-types */
  canEdit: PropTypes.bool.isRequired,
  canEditCommentActivities: PropTypes.bool.isRequired,
  canEditAllCommentActivities: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onTransfer: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUserAdd: PropTypes.func.isRequired,
  onUserRemove: PropTypes.func.isRequired,
  onBoardFetch: PropTypes.func.isRequired,
  onLabelAdd: PropTypes.func.isRequired,
  onLabelRemove: PropTypes.func.isRequired,
  onLabelCreate: PropTypes.func.isRequired,
  onLabelUpdate: PropTypes.func.isRequired,
  onLabelMove: PropTypes.func.isRequired,
  onLabelDelete: PropTypes.func.isRequired,
  onTaskCreate: PropTypes.func.isRequired,
  onTaskUpdate: PropTypes.func.isRequired,
  onTaskMove: PropTypes.func.isRequired,
  onTaskDelete: PropTypes.func.isRequired,
  onAttachmentCreate: PropTypes.func.isRequired,
  onAttachmentUpdate: PropTypes.func.isRequired,
  onAttachmentDelete: PropTypes.func.isRequired,
  onActivitiesFetch: PropTypes.func.isRequired,
  // onActivitiesDetailsToggle: PropTypes.func.isRequired,
  onCommentActivityCreate: PropTypes.func.isRequired,
  onCommentActivityUpdate: PropTypes.func.isRequired,
  onCommentActivityDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

CardModal.defaultProps = {
  description: undefined,
  dueDate: undefined,
  isDueDateCompleted: false,
  stopwatch: undefined,
};

export default CardModal;
