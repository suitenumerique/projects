import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Input, Select, Switch } from '@gouvfr-lasuite/cunningham-react';
import { HorizontalSeparator } from '@gouvfr-lasuite/ui-kit';

import { useTheme } from '../../../hooks/use-theme';
import { resolveLanguage } from '../../../i18n';
import locales from '../../../locales';

import styles from './AccountPane.module.scss';

const AccountPane = React.memo(
  ({
    email,
    name,
    phone,
    organization,
    language,
    subscribeToOwnCards,
    defaultLanguage,
    supportedLanguages,
    onUpdate,
    onLanguageUpdate,
  }) => {
    const [t] = useTranslation();
    const { theme, setTheme, disableDarkMode } = useTheme();

    const enabledLanguages = supportedLanguages
      ? supportedLanguages.map(resolveLanguage)
      : undefined;

    const filteredLocales = enabledLanguages
      ? locales.filter((locale) => enabledLanguages.includes(locale.language))
      : locales;

    const handleSubscribeToOwnCardsChange = useCallback(() => {
      onUpdate({
        subscribeToOwnCards: !subscribeToOwnCards,
      });
    }, [subscribeToOwnCards, onUpdate]);

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
        <Switch
          label={t('common.subscribeToMyOwnCardsByDefault')}
          checked={subscribeToOwnCards}
          onChange={handleSubscribeToOwnCardsChange}
        />
        <HorizontalSeparator />
        <div className={styles.preferences}>
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
            defaultValue={resolveLanguage(language || defaultLanguage) || 'auto'}
            clearable={false}
            onChange={(event) => {
              handleLanguageChange(event.target.value);
            }}
            fullWidth
          />
        </div>
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
