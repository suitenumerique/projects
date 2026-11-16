import React, { useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
// import { useTranslation } from 'react-i18next';

import { Spinner } from '@gouvfr-lasuite/ui-kit';
import { ActivityTypes } from '../../../constants/Enums';
import CommentCreate from './CommentCreate';
import ActivityItem from './ActivityItem';
import CommentItem from './CommentItem';

import styles from './Activities.module.scss';

const Activities = React.memo(
  ({
    items,
    boardMemberships,
    isFetching,
    isAllFetched,
    // isDetailsVisible,
    // isDetailsFetching,
    canEdit,
    canEditAllComments,
    onFetch,
    // onDetailsToggle,
    onCommentCreate,
    onCommentUpdate,
    onCommentDelete,
  }) => {
    // const [t] = useTranslation();

    const currentUserId = useMemo(
      () => boardMemberships.find((membership) => membership.user.isCurrent)?.user.id,
      [boardMemberships],
    );

    const mentionableUsers = useMemo(
      () =>
        boardMemberships
          .map((membership) => membership.user)
          .filter((user) => !user.isCurrent && !user.deletedAt),
      [boardMemberships],
    );

    // Fetch activities when component mounts
    useEffect(() => {
      if (!isFetching && !isAllFetched) {
        onFetch();
      }
    }, [onFetch, isFetching, isAllFetched]);

    // const handleToggleDetailsClick = useCallback(() => {
    //   onDetailsToggle(!isDetailsVisible);
    // }, [isDetailsVisible, onDetailsToggle]);

    const handleCommentUpdate = useCallback(
      (id, data) => {
        onCommentUpdate(id, data);
      },
      [onCommentUpdate],
    );

    const handleCommentDelete = useCallback(
      (id) => {
        onCommentDelete(id);
      },
      [onCommentDelete],
    );

    return (
      <div className={styles.activitiesWrapper}>
        {canEdit && (
          <CommentCreate mentionableUsers={mentionableUsers} onCreate={onCommentCreate} />
        )}
        <div className={styles.activitiesList}>
          {items.map((item) =>
            item.type === ActivityTypes.COMMENT_CARD ? (
              <CommentItem
                key={item.id}
                data={item.data}
                createdAt={item.createdAt}
                isPersisted={item.isPersisted}
                user={item.user}
                currentUserId={currentUserId}
                mentionableUsers={mentionableUsers}
                canEdit={item.user.isCurrent && canEdit}
                canDelete={(item.user.isCurrent && canEdit) || canEditAllComments}
                onUpdate={(data) => handleCommentUpdate(item.id, data)}
                onDelete={() => handleCommentDelete(item.id)}
              />
            ) : (
              <ActivityItem
                key={item.id}
                type={item.type}
                data={item.data}
                createdAt={item.createdAt}
                user={item.user}
              />
            ),
          )}
        </div>
        {isFetching ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : (
          !isAllFetched && (
            <button type="button" onClick={onFetch} className={styles.loadMore}>
              Load more
            </button>
          )
        )}
      </div>
    );
  },
);

Activities.propTypes = {
  items: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  boardMemberships: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  isFetching: PropTypes.bool.isRequired,
  isAllFetched: PropTypes.bool.isRequired,
  // isDetailsVisible: PropTypes.bool.isRequired,
  // isDetailsFetching: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canEditAllComments: PropTypes.bool.isRequired,
  onFetch: PropTypes.func.isRequired,
  // onDetailsToggle: PropTypes.func.isRequired,
  onCommentCreate: PropTypes.func.isRequired,
  onCommentUpdate: PropTypes.func.isRequired,
  onCommentDelete: PropTypes.func.isRequired,
};

export default Activities;
