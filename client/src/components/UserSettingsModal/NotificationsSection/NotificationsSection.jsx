import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Switch } from '@gouvfr-lasuite/cunningham-react';
import { Icon } from '@gouvfr-lasuite/ui-kit';

import SaveStatus from './SaveStatus';

import styles from './NotificationsSection.module.scss';

// The notification center always receives every notification: only emails can
// be turned off, per kind of event.
const NotificationsSection = React.memo(
  ({
    email,
    subscribeToOwnCards,
    notifyMentionsByEmail,
    notifyAssignmentsByEmail,
    notifySubscribedCardsByEmail,
    fieldUpdateStatuses,
    onUpdate,
  }) => {
    const [t] = useTranslation();

    // Only the last toggled setting shows its save status: a new click clears the
    // previous one, error included.
    const [statusField, setStatusField] = useState(null);

    const handleToggle = useCallback(
      (field, value) => {
        setStatusField(field);
        onUpdate({ [field]: !value });
      },
      [onUpdate],
    );

    const handleStatusHide = useCallback(() => setStatusField(null), []);

    const renderStatus = (field) => (
      <SaveStatus
        status={statusField === field ? fieldUpdateStatuses[field] : undefined}
        onHide={handleStatusHide}
      />
    );

    const emailRows = [
      {
        field: 'notifyMentionsByEmail',
        value: notifyMentionsByEmail,
        title: t('common.mentions'),
        description: t('common.mentionsNotificationsDescription'),
      },
      {
        field: 'notifyAssignmentsByEmail',
        value: notifyAssignmentsByEmail,
        title: t('common.assignments'),
        description: t('common.assignmentsNotificationsDescription'),
      },
      {
        field: 'notifySubscribedCardsByEmail',
        value: notifySubscribedCardsByEmail,
        title: t('common.subscribedCards'),
        description: t('common.subscribedCardsNotificationsDescription'),
      },
    ];

    return (
      <section className={styles.wrapper}>
        <div>
          <h3 className={styles.title}>{t('common.notifications')}</h3>
          <p className={styles.intro}>
            <Icon name="notifications" type="outlined" size={18} />
            <span>{t('common.notificationCenterReceivesEverything')}</span>
          </p>
        </div>
        <div className={styles.setting}>
          <div>
            <span className={styles.settingTitle}>
              {t('common.subscribeToMyOwnCardsByDefault')}
            </span>
            <span className={styles.settingDescription}>
              {t('common.subscribeToMyOwnCardsByDefaultDescription')}
            </span>
            {renderStatus('subscribeToOwnCards')}
          </div>
          <Switch
            aria-label={t('common.subscribeToMyOwnCardsByDefault')}
            checked={subscribeToOwnCards}
            onChange={() => handleToggle('subscribeToOwnCards', subscribeToOwnCards)}
          />
        </div>
        <div className={styles.emailGroup}>
          <div className={styles.groupHeader}>
            <h4 className={styles.groupTitle}>{t('common.alsoReceiveByEmail')}</h4>
            <span className={styles.groupSubtitle}>{t('common.toEmail', { email })}</span>
          </div>
          {emailRows.map(({ field, value, title, description }) => (
            <div key={field} className={styles.setting}>
              <div>
                <span className={styles.settingTitle}>{title}</span>
                <span className={styles.settingDescription}>{description}</span>
                {renderStatus(field)}
              </div>
              <Switch
                aria-label={`${title} – ${t('common.email')}`}
                checked={value}
                onChange={() => handleToggle(field, value)}
              />
            </div>
          ))}
        </div>
      </section>
    );
  },
);

NotificationsSection.propTypes = {
  email: PropTypes.string.isRequired,
  subscribeToOwnCards: PropTypes.bool.isRequired,
  notifyMentionsByEmail: PropTypes.bool.isRequired,
  notifyAssignmentsByEmail: PropTypes.bool.isRequired,
  notifySubscribedCardsByEmail: PropTypes.bool.isRequired,
  fieldUpdateStatuses: PropTypes.objectOf(PropTypes.string).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default NotificationsSection;
