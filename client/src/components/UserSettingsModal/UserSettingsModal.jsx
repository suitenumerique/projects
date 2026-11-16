import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Modal, ModalSize } from '@gouvfr-lasuite/cunningham-react';
import { HorizontalSeparator } from '@gouvfr-lasuite/ui-kit';

import AccountPane from './AccountPane';
import ApiTokensPane from './ApiTokensPane';
import User from '../../ui/User';

import styles from './UserSettingsModal.module.scss';

const UserSettingsModal = React.memo(
  ({
    email,
    name,
    avatarUrl,
    phone,
    organization,
    language,
    subscribeToOwnCards,
    defaultLanguage,
    supportedLanguages,
    onUpdate,
    onLanguageUpdate,
    onClose,
  }) => {
    const [t] = useTranslation();

    return (
      <Modal
        isOpen
        size={ModalSize.MEDIUM}
        title={
          <div className={styles.modalTitle}>
            <User name={name} avatarUrl={avatarUrl} size="medium" />
            <span>{t('common.userProfile')}</span>
          </div>
        }
        closeIcon
        onClose={onClose}
        closeOnClickOutside
      >
        <AccountPane
          email={email}
          name={name}
          phone={phone}
          organization={organization}
          language={language}
          subscribeToOwnCards={subscribeToOwnCards}
          defaultLanguage={defaultLanguage}
          supportedLanguages={supportedLanguages}
          onUpdate={onUpdate}
          onLanguageUpdate={onLanguageUpdate}
        />
        <HorizontalSeparator />
        <ApiTokensPane />
      </Modal>
    );
  },
);

UserSettingsModal.propTypes = {
  email: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  avatarUrl: PropTypes.string,
  phone: PropTypes.string,
  organization: PropTypes.string,
  language: PropTypes.string,
  subscribeToOwnCards: PropTypes.bool.isRequired,
  defaultLanguage: PropTypes.string,
  supportedLanguages: PropTypes.arrayOf(PropTypes.string),
  onUpdate: PropTypes.func.isRequired,
  onLanguageUpdate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

UserSettingsModal.defaultProps = {
  avatarUrl: undefined,
  phone: undefined,
  organization: undefined,
  language: undefined,
  defaultLanguage: undefined,
  supportedLanguages: undefined,
};

export default UserSettingsModal;
