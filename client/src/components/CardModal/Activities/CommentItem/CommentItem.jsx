import React, { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Button } from '@gouvfr-lasuite/cunningham-react';
import { Icon } from '@gouvfr-lasuite/ui-kit';
import getDateFormat from '../../../../utils/get-date-format';
import { splitMentions } from '../../../../utils/mentions';
import CommentEdit from '../CommentEdit';
import User from '../../../../ui/User';
import CommentActionsStep from '../../../../steps/CommentActionsStep';
import usePopup from '../../../../lib/popup';

import styles from './CommentItem.module.scss';

const URL_REGEX = /https?:\/\/[^\s]+/g;

function renderLinks(text, keyPrefix) {
  const parts = [];
  let lastIndex = 0;
  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={`${keyPrefix}-${match.index}`}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
      >
        {match[0]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function renderText(text, currentUserId) {
  return splitMentions(text).flatMap((part, index) => {
    if (typeof part === 'string') {
      return renderLinks(part, index);
    }

    return (
      <span
        // eslint-disable-next-line react/no-array-index-key
        key={`mention-${index}`}
        className={classNames(styles.mention, part.userId === currentUserId && styles.mentionMe)}
      >
        @{part.name}
      </span>
    );
  });
}

const CommentItem = React.memo(
  ({
    data,
    createdAt,
    isPersisted,
    user,
    currentUserId,
    mentionableUsers,
    canEdit,
    canDelete,
    onUpdate,
    onDelete,
  }) => {
    const [t] = useTranslation();
    const [isCommentActionsPopoverOpen, setIsCommentActionsPopoverOpen] = useState(false);

    const CommentActionsPopover = usePopup(CommentActionsStep);

    const commentEdit = useRef(null);

    const handleEditClick = useCallback(() => {
      commentEdit.current.open();
    }, []);

    return (
      <div
        className={classNames(
          styles.itemComment,
          isCommentActionsPopoverOpen && styles.popoverOpened,
        )}
      >
        <span className={styles.user}>
          <User name={user.name} size="small" avatarUrl={user.avatarUrl} />
        </span>
        <div className={classNames(styles.content)}>
          <CommentEdit
            ref={commentEdit}
            defaultData={data}
            mentionableUsers={mentionableUsers}
            onUpdate={onUpdate}
            text={<div className={styles.text}>{renderText(data.text, currentUserId)}</div>}
            actions={
              <div className={styles.header}>
                <div className={styles.title}>
                  <span>
                    <span className={styles.author}>{user.name}</span>
                    <span className={styles.date}>
                      {t(`format:${getDateFormat(createdAt)}`, {
                        postProcess: 'formatDate',
                        value: createdAt,
                      })}
                    </span>
                  </span>
                </div>
                <div className={styles.actions}>
                  {(canEdit || canDelete) && isPersisted && (
                    <CommentActionsPopover
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEdit={handleEditClick}
                      onDelete={onDelete}
                      onOpenChange={setIsCommentActionsPopoverOpen}
                    >
                      <Button
                        className={styles.commentActionsButton}
                        color="neutral"
                        variant="tertiary"
                        size="small"
                        icon={<Icon name="more_horiz" type="outlined" size="small" />}
                      />
                    </CommentActionsPopover>
                  )}
                </div>
              </div>
            }
          />
        </div>
      </div>
    );
  },
);

CommentItem.propTypes = {
  data: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  createdAt: PropTypes.instanceOf(Date).isRequired,
  isPersisted: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  currentUserId: PropTypes.string,
  mentionableUsers: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  canEdit: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

CommentItem.defaultProps = {
  currentUserId: undefined,
};

export default CommentItem;
