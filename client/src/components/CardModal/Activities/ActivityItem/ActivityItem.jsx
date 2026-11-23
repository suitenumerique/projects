import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation, Trans } from 'react-i18next';
import { Icon } from '@gouvfr-lasuite/ui-kit';

import getDateFormat from '../../../../utils/get-date-format';
import { ActivityTypes } from '../../../../constants/Enums';
import CommentItem from '../CommentItem';

import styles from './ActivityItem.module.scss';

const ICONS_BY_TYPE = {
  [ActivityTypes.CREATE_CARD]: 'add',
  [ActivityTypes.MOVE_CARD]: 'arrow_forward',
  [ActivityTypes.ADD_MEMBER_TO_CARD]: 'person_add',
  [ActivityTypes.CHANGE_DUE_DATE]: 'event',
  [ActivityTypes.ADD_ATTACHMENT]: 'attach_file',
  [ActivityTypes.UPDATE_DESCRIPTION]: 'format_align_left',
};

// An automatic entry of the card thread, set apart from comments: no avatar nor
// bubble, small muted text, and neither editable nor deletable.
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
          <strong />
          <strong />
        </Trans>
      );

      break;
    case ActivityTypes.MOVE_CARD:
      contentNode = (
        <Trans
          i18nKey="common.userMovedThisCardFromListToList"
          values={{ user: user.name, fromList: data.fromList.name, toList: data.toList.name }}
        >
          <strong />
          <strong />
          <strong />
        </Trans>
      );

      break;
    case ActivityTypes.ADD_MEMBER_TO_CARD:
      contentNode =
        data.member.id === user.id ? (
          <Trans i18nKey="common.userAssignedThisCardToThemselves" values={{ user: user.name }}>
            <strong />
          </Trans>
        ) : (
          <Trans
            i18nKey="common.userAssignedThisCardToMember"
            values={{ user: user.name, member: data.member.name }}
          >
            <strong />
            <strong />
          </Trans>
        );

      break;
    case ActivityTypes.CHANGE_DUE_DATE:
      contentNode = (
        <Trans i18nKey="common.userChangedDueDateOfThisCard" values={{ user: user.name }}>
          <strong />
        </Trans>
      );

      break;
    case ActivityTypes.UPDATE_DESCRIPTION:
      contentNode = (
        <Trans i18nKey="common.userUpdatedDescriptionOfThisCard" values={{ user: user.name }}>
          <strong />
        </Trans>
      );

      break;
    case ActivityTypes.ADD_ATTACHMENT:
      contentNode = (
        <Trans i18nKey="common.userAddedAttachmentToThisCard" values={{ user: user.name }}>
          <strong />
        </Trans>
      );

      break;
    default:
      return null;
  }

  return (
    <div className={styles.wrapper}>
      <Icon name={ICONS_BY_TYPE[type]} type="outlined" size={16} className={styles.icon} />
      <p className={styles.content}>
        {contentNode}
        <span className={styles.date}>
          {' · '}
          {t(`format:${getDateFormat(createdAt)}`, {
            postProcess: 'formatDate',
            value: createdAt,
          })}
        </span>
      </p>
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
