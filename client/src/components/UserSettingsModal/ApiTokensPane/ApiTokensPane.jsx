import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select } from '@gouvfr-lasuite/cunningham-react';

import api from '../../../api';
import selectors from '../../../selectors';

import styles from './ApiTokensPane.module.scss';

const EXPIRATION_OPTIONS = ['30', '90', '365', 'never'];
const DEFAULT_EXPIRATION = '90';

const computeExpiresAt = (expiration) => {
  if (expiration === 'never') {
    return null;
  }

  const date = new Date();
  date.setDate(date.getDate() + parseInt(expiration, 10));

  return date.toISOString();
};

// Each user has at most one API token, and must revoke it to generate a new one.
// Three states: no token (generate form), token just generated (clear value with
// a copy button, shown only once), existing token (prefix, expiration, usage).
const ApiTokensPane = React.memo(() => {
  const [t, i18n] = useTranslation();
  const accessToken = useSelector(selectors.selectAccessToken);

  const [apiToken, setApiToken] = useState(null);
  const [expiration, setExpiration] = useState(DEFAULT_EXPIRATION);
  const [createdToken, setCreatedToken] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const headers = { Authorization: `Bearer ${accessToken}` };

  const formatDate = useCallback(
    (value) => new Date(value).toLocaleDateString(i18n.language),
    [i18n.language],
  );

  useEffect(() => {
    let isMounted = true;

    api
      .getApiTokens(headers)
      .then(({ items }) => {
        if (isMounted) {
          setApiToken(items[0] || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(t('common.apiTokensLoadError'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = useCallback(
    async (event) => {
      event.preventDefault();

      setIsSubmitting(true);
      setError(null);

      try {
        const { item, included } = await api.createApiToken(
          { expiresAt: computeExpiresAt(expiration) },
          headers,
        );

        setApiToken(item);
        setCreatedToken(included.token);
        setIsCopied(false);
      } catch {
        setError(t('common.apiTokenCreateError'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [expiration, accessToken], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleRevoke = useCallback(async () => {
    setError(null);

    try {
      await api.deleteApiToken(apiToken.id, headers);
      setApiToken(null);
      setCreatedToken(null);
    } catch {
      setError(t('common.apiTokenDeleteError'));
    }
  }, [apiToken, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(createdToken).then(() => setIsCopied(true));
  }, [createdToken]);

  let content;
  if (createdToken) {
    content = (
      <div className={styles.tokenField}>
        <Input
          label={t('common.apiToken')}
          value={createdToken}
          text={t('common.apiTokenCopyNow')}
          readOnly
          fullWidth
          onFocus={(event) => event.target.select()}
        />
        <Button color="secondary" onClick={handleCopy}>
          {isCopied ? t('common.copied') : t('action.copy')}
        </Button>
      </div>
    );
  } else if (apiToken) {
    content = (
      <div className={styles.item}>
        <div>
          <div>
            <code className={styles.itemName}>{apiToken.tokenPrefix}…</code>
            {' · '}
            {apiToken.expiresAt
              ? t('common.apiTokenExpiresOn', { date: formatDate(apiToken.expiresAt) })
              : t('common.apiTokenNeverExpires')}
          </div>
          <div className={styles.itemMeta}>
            {apiToken.lastUsedAt
              ? t('common.apiTokenLastUsedOn', { date: formatDate(apiToken.lastUsedAt) })
              : t('common.apiTokenNeverUsed')}
          </div>
        </div>
        <Button color="danger" size="small" onClick={handleRevoke}>
          {t('action.revoke')}
        </Button>
      </div>
    );
  } else {
    content = (
      <form className={styles.form} onSubmit={handleGenerate}>
        <Select
          label={t('common.apiTokenExpiration')}
          options={EXPIRATION_OPTIONS.map((value) => ({
            value,
            label:
              value === 'never'
                ? t('common.apiTokenNeverExpires')
                : t('common.apiTokenExpiresInDays', { count: parseInt(value, 10) }),
          }))}
          value={expiration}
          clearable={false}
          onChange={(event) => setExpiration(event.target.value)}
          fullWidth
        />
        <Button type="submit" disabled={isSubmitting}>
          {t('action.generateApiToken')}
        </Button>
      </form>
    );
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>{t('common.apiTokens')}</p>
      {content}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
});

export default ApiTokensPane;
