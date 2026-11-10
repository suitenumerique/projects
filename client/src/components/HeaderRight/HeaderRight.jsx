import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Button } from '@gouvfr-lasuite/cunningham-react';
import { DropdownMenu, Icon, LaGaufreV2 } from '@gouvfr-lasuite/ui-kit';
import { LagaufreButton } from '../../ui/LaGaufreButton/LaGaufreButton.tsx';

import NotificationsStep from '../../steps/NotificationsStep';
import usePopup from '../../lib/popup/use-popup';

import styles from './HeaderRight.module.scss';

const { THEME_PREFIX } = window;

// La Gaufre is part of the French government suite branding: only show it for
// the government themes (dsfr/dinum, anct), never for the default (neutral) theme.
const isGovTheme = THEME_PREFIX === 'dsfr' || THEME_PREFIX === 'anct';

const HeaderRight = React.memo(
  ({
    currentUser,
    notifications,
    gaufre,
    onNotificationMarkAsRead,
    onSettingsClick,
    onLogin,
    onLogout,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();

    const NotificationsPopover = usePopup(NotificationsStep);

    return (
      <>
        {currentUser ? (
          <>
            <NotificationsPopover
              items={notifications}
              onMarkAsRead={onNotificationMarkAsRead}
              side="bottom"
              align="center"
            >
              <Button
                variant="tertiary"
                icon={
                  <>
                    <Icon type="outlined" name="notifications" />
                    {notifications.length > 0 && (
                      <span className={styles.notification}>{notifications.length}</span>
                    )}
                  </>
                }
                className={styles.notificationButton}
              />
            </NotificationsPopover>

            <DropdownMenu
              options={[
                {
                  label: t('common.settings', {
                    context: 'title',
                  }),
                  icon: <Icon name="manage_accounts" type="outlined" />,
                  callback: onSettingsClick,
                },
                {
                  label: t('action.logOut_title'),
                  icon: <Icon name="logout" type="outlined" />,
                  callback: onLogout,
                },
              ]}
              isOpen={isOpen}
              onOpenChange={setIsOpen}
            >
              <Button
                className={styles.onlySm}
                variant="tertiary"
                icon={<Icon name="person" type="outlined" />}
                onClick={() => setIsOpen(!isOpen)}
              />
              <Button
                className={styles.overSm}
                variant="tertiary"
                onClick={() => setIsOpen(!isOpen)}
                icon={
                  <span className="material-icons">
                    {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                  </span>
                }
                iconPosition="right"
              >
                {t('common.myAccount')}
              </Button>
            </DropdownMenu>
          </>
        ) : (
          <Button color="brand" variant="tertiary" onClick={onLogin}>
            {t('action.logIn')}
          </Button>
        )}

        {isGovTheme && gaufre?.variant === 'dinum' && (
          <LaGaufreV2 widgetPath={gaufre.widgetPath} apiUrl={gaufre.apiUrl} />
        )}
        {isGovTheme && gaufre?.variant === 'anct' && (
          <LagaufreButton apiUrl={gaufre.apiUrl} widgetPath={gaufre.widgetPath} />
        )}
      </>
    );
  },
);

HeaderRight.propTypes = {
  currentUser: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  notifications: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  gaufre: PropTypes.shape({
    variant: PropTypes.oneOf(['dinum', 'anct']).isRequired,
    apiUrl: PropTypes.string.isRequired,
    widgetPath: PropTypes.string.isRequired,
  }),
  onSettingsClick: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onNotificationMarkAsRead: PropTypes.func.isRequired,
};

HeaderRight.defaultProps = {
  gaufre: undefined,
};

export default HeaderRight;
