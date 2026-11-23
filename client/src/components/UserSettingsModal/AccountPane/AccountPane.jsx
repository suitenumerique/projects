import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Input, Select } from '@gouvfr-lasuite/cunningham-react';
import { HorizontalSeparator } from '@gouvfr-lasuite/ui-kit';

import { useTheme } from '../../../hooks/use-theme';
import locales from '../../../locales';
import NotificationsSection from '../NotificationsSection';

import styles from './AccountPane.module.scss';

const AccountPane = React.memo(
  ({
    email,
    name,
    phone,
    organization,
    language,
    subscribeToOwnCards,
    notifyMentionsByEmail,
    notifyAssignmentsByEmail,
    notifySubscribedCardsByEmail,
    fieldUpdateStatuses,
    defaultLanguage,
    supportedLanguages,
    onUpdate,
    onLanguageUpdate,
  }) => {
    const [t] = useTranslation();
    const { theme, setTheme, disableDarkMode } = useTheme();

    const filteredLocales = supportedLanguages
      ? locales.filter((locale) => supportedLanguages.includes(locale.language))
      : locales;

    const handleLanguageChange = useCallback(
      (localeValue) => {
        onLanguageUpdate(localeValue === 'auto' ? null : localeValue);
      },
      [onLanguageUpdate],
    );

    return (
      <div className={styles.wrapper}>
        <div className={styles.info}>
          <Input name="email" label={t('common.email')} value={email} disabled fullWidth />
          <Input name="name" label={t('common.name')} value={name} disabled fullWidth />
          {!!phone && (
            <Input name="phone" label={t('common.phone')} value={phone} disabled fullWidth />
          )}
          {!!organization && (
            <Input
              name="organization"
              label={t('common.organization')}
              value={organization}
              disabled
              fullWidth
            />
          )}
        </div>
        <HorizontalSeparator />
        <NotificationsSection
          email={email}
          subscribeToOwnCards={subscribeToOwnCards}
          notifyMentionsByEmail={notifyMentionsByEmail}
          notifyAssignmentsByEmail={notifyAssignmentsByEmail}
          notifySubscribedCardsByEmail={notifySubscribedCardsByEmail}
          fieldUpdateStatuses={fieldUpdateStatuses}
          onUpdate={onUpdate}
        />
        <HorizontalSeparator />
        <section className={styles.preferences}>
          <h3 className={styles.sectionTitle}>{t('common.preferences')}</h3>
          {!disableDarkMode && (
            <Select
              label={t('common.theme')}
              options={[
                {
                  value: 'system',
                  label: t('common.detectAutomatically'),
                },
                {
                  value: 'light',
                  label: t('common.themeLight'),
                },
                {
                  value: 'dark',
                  label: t('common.themeDark'),
                },
              ]}
              defaultValue={theme}
              clearable={false}
              onChange={(event) => {
                setTheme(event.target.value);
              }}
              fullWidth
            />
          )}
          <Select
            label={t('common.language', {
              context: 'title',
            })}
            options={[
              {
                value: 'auto',
                label: t('common.detectAutomatically'),
              },
              ...filteredLocales.map((locale) => ({
                value: locale.language,
                label: locale.name,
              })),
            ]}
            defaultValue={language || defaultLanguage || 'auto'}
            clearable={false}
            onChange={(event) => {
              handleLanguageChange(event.target.value);
            }}
            fullWidth
          />
        </section>
      </div>
    );
  },
);

AccountPane.propTypes = {
  email: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  phone: PropTypes.string,
  organization: PropTypes.string,
  language: PropTypes.string,
  subscribeToOwnCards: PropTypes.bool.isRequired,
  notifyMentionsByEmail: PropTypes.bool.isRequired,
  notifyAssignmentsByEmail: PropTypes.bool.isRequired,
  notifySubscribedCardsByEmail: PropTypes.bool.isRequired,
  fieldUpdateStatuses: PropTypes.objectOf(PropTypes.string).isRequired,
  defaultLanguage: PropTypes.string,
  supportedLanguages: PropTypes.arrayOf(PropTypes.string),
  onUpdate: PropTypes.func.isRequired,
  onLanguageUpdate: PropTypes.func.isRequired,
};

AccountPane.defaultProps = {
  phone: undefined,
  organization: undefined,
  language: undefined,
  defaultLanguage: undefined,
  supportedLanguages: undefined,
};

export default AccountPane;
