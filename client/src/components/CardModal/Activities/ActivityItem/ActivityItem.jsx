import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation, Trans } from 'react-i18next';

import getDateFormat from '../../../../utils/get-date-format';
import { ActivityTypes } from '../../../../constants/Enums';
import CommentItem from '../CommentItem';
import User from '../../../../ui/User';

import styles from './ActivityItem.module.scss';

const ActivityItem = React.memo(({ type, data, createdAt, user }) => {
  const [t] = useTranslation();

  let contentNode;

  switch (type) {
    case ActivityTypes.CREATE_CARD:
      contentNode = (
        <Trans
          i18nKey="common.userAddedThisCardToList"
          values={{ user: user.name, list: data.list.name }}
        >
          <span className={styles.author} />
          <span className={styles.text} />
        </Trans>
      );

      break;
    case ActivityTypes.MOVE_CARD:
      contentNode = (
        <Trans
          i18nKey="common.userMovedThisCardFromListToList"
          values={{ user: user.name, fromList: data.fromList.name, toList: data.toList.name }}
        >
          <span className={styles.author} />
          <span className={styles.text} />
          <span className={styles.text} />
        </Trans>
      );

      break;
    case ActivityTypes.ADD_MEMBER_TO_CARD:
      contentNode = (
        <Trans
          i18nKey="common.userAssignedMember"
          values={{ user: user.name, member: data.member.name }}
        >
          <span className={styles.author} />
          <span className={styles.text} />
        </Trans>
      );

      break;
    case ActivityTypes.CHANGE_DUE_DATE:
      contentNode = (
        <Trans i18nKey="common.userChangedDueDateOfThisCard" values={{ user: user.name }}>
          <span className={styles.author} />
        </Trans>
      );

      break;
    case ActivityTypes.ADD_ATTACHMENT:
      contentNode = (
        <Trans i18nKey="common.userAddedAttachmentToThisCard" values={{ user: user.name }}>
          <span className={styles.author} />
        </Trans>
      );

      break;
    default:
      contentNode = null;
  }

  return (
    <div>
      <span className={styles.user}>
        <User name={user.name} avatarUrl={user.avatarUrl} size="small" />
      </span>
      <div className={classNames(styles.content)}>
        <div>{contentNode}</div>
        <span className={styles.date}>
          {t(`format:${getDateFormat(createdAt)}`, {
            postProcess: 'formatDate',
            value: createdAt,
          })}
        </span>
      </div>
    </div>
  );
});

ActivityItem.Comment = CommentItem;

ActivityItem.propTypes = {
  type: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  createdAt: PropTypes.instanceOf(Date).isRequired,
  user: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

export default ActivityItem;
