import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Switch } from '@gouvfr-lasuite/cunningham-react';
import { Icon } from '@gouvfr-lasuite/ui-kit';

import styles from './NotificationsSection.module.scss';

// The notification center always receives every notification: only emails can
// be turned off, per kind of event.
const NotificationsSection = React.memo(
  ({ subscribeToOwnCards, notifyMentionsByEmail, notifySubscribedCardsByEmail, onUpdate }) => {
    const [t] = useTranslation();

    const handleToggle = useCallback((field, value) => onUpdate({ [field]: !value }), [onUpdate]);

    const rows = [
      {
        field: 'notifyMentionsByEmail',
        value: notifyMentionsByEmail,
        title: t('common.mentions'),
        description: t('common.mentionsNotificationsDescription'),
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
        <h3 className={styles.title}>{t('common.notifications')}</h3>
        <div className={styles.setting}>
          <div>
            <span className={styles.settingTitle}>
              {t('common.subscribeToMyOwnCardsByDefault')}
            </span>
            <span className={styles.settingDescription}>
              {t('common.subscribeToMyOwnCardsByDefaultDescription')}
            </span>
          </div>
          <Switch
            aria-label={t('common.subscribeToMyOwnCardsByDefault')}
            checked={subscribeToOwnCards}
            onChange={() => handleToggle('subscribeToOwnCards', subscribeToOwnCards)}
          />
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.headerLabel}>
                {t('common.notifyMe')}
              </th>
              <th scope="col" className={styles.headerChannel}>
                <Icon name="notifications" type="outlined" size={18} />
                <span>{t('common.notificationCenter')}</span>
              </th>
              <th scope="col" className={styles.headerChannel}>
                <Icon name="mail" type="outlined" size={18} />
                <span>{t('common.email')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ field, value, title, description }) => (
              <tr key={field}>
                <th scope="row" className={styles.rowLabel}>
                  <span className={styles.settingTitle}>{title}</span>
                  <span className={styles.settingDescription}>{description}</span>
                </th>
                <td className={styles.cell}>
                  <span className={styles.lockedSwitch}>
                    <Switch
                      aria-label={`${title} – ${t('common.notificationCenter')}`}
                      checked
                      disabled
                      readOnly
                    />
                  </span>
                </td>
                <td className={styles.cell}>
                  <Switch
                    aria-label={`${title} – ${t('common.email')}`}
                    checked={value}
                    onChange={() => handleToggle(field, value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.footnote}>
          <Icon name="lock" type="outlined" size={16} />
          {t('common.notificationCenterAlwaysEnabled')}
        </p>
      </section>
    );
  },
);

NotificationsSection.propTypes = {
  subscribeToOwnCards: PropTypes.bool.isRequired,
  notifyMentionsByEmail: PropTypes.bool.isRequired,
  notifySubscribedCardsByEmail: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default NotificationsSection;
