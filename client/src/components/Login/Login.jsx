import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Hero,
  // Icon,
  MainLayout,
  ProConnectButton,
  HomeGutter,
  Footer,
} from '@gouvfr-lasuite/ui-kit';
import { useTranslation } from 'react-i18next';

import Feedback from '../Feedback';
import { FeedbackWidget } from '../../ui/FeedbackWidget/index.tsx';
import HeaderRightContainer from '../../containers/HeaderRightContainer';
import { useTheme } from '../../hooks/use-theme';
import styles from './Login.module.scss';

import illustration from '../../assets/images/illustration.jpg';
import Paths from '../../constants/Paths';

const { THEME_PREFIX } = window;

// const createMessage = (error) => {
//   if (!error) {
//     return error;
//   }

//   switch (error.message) {
//     case 'Invalid credentials':
//       return {
//         type: 'error',
//         content: 'common.invalidCredentials',
//       };
//     case 'Invalid email or username':
//       return {
//         type: 'error',
//         content: 'common.invalidEmailOrUsername',
//       };
//     case 'Invalid password':
//       return {
//         type: 'error',
//         content: 'common.invalidPassword',
//       };
//     case 'Use single sign-on':
//       return {
//         type: 'error',
//         content: 'common.useSingleSignOn',
//       };
//     case 'Email already in use':
//       return {
//         type: 'error',
//         content: 'common.emailAlreadyInUse',
//       };
//     case 'Username already in use':
//       return {
//         type: 'error',
//         content: 'common.usernameAlreadyInUse',
//       };
//     case 'Failed to fetch':
//       return {
//         type: 'warning',
//         content: 'common.noInternetConnection',
//       };
//     case 'Network request failed':
//       return {
//         type: 'warning',
//         content: 'common.serverConnectionFailed',
//       };
//     default:
//       return {
//         type: 'warning',
//         content: 'common.unknownError',
//       };
//   }
// };

const Login = React.memo(({ theme, onAuthenticateUsingOidc }) => {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useTheme();

  const isGovDeployment = THEME_PREFIX === 'dsfr';

  const localeTheme = useMemo(() => {
    const languageWithoutRegion = i18n.language.split(/[-_]/)[0];

    return {
      header: {
        logo: theme.header?.[languageWithoutRegion]?.logo ?? theme.header?.default.logo,
      },
      footer: {
        externalLinks:
          theme.footer?.[languageWithoutRegion]?.externalLinks ??
          theme.footer?.default.externalLinks,
        legalLinks:
          theme.footer?.[languageWithoutRegion]?.legalLinks ?? theme.footer?.default.legalLinks,
        license: theme.footer?.[languageWithoutRegion]?.license ?? theme.footer?.default.license,
        logo: theme.footer?.[languageWithoutRegion]?.logo ?? theme.footer?.default.logo,
      },
      feedback: {
        items:
          theme.feedback?.[languageWithoutRegion]?.items ?? theme.feedback?.default.items ?? [],
      },
    };
  }, [theme, i18n.language]);

  return (
    <div className="projets_login">
      <MainLayout
        hideLeftPanelOnDesktop
        icon={
          <>
            <Link to={Paths.ROOT} className={styles.logoLink}>
              {/* TODO: gov logo should be switchable as for Projects application logo with THEME environement variable, but for now it can be replaced with pixel in the public folder if needed (theme base not being "dsfr" or "anct" will hide it in the meantime) */}
              <img src="/logo-gouv.svg" alt="" className={styles.logoGouv} />
              <div className={styles.logoWrapper}>
                {localeTheme.header?.logo ? (
                  <img
                    alt=""
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...localeTheme.header.logo}
                  />
                ) : (
                  <img alt="" src={`/oss/${colorScheme}/logo.svg`} />
                )}
              </div>
            </Link>
            <Feedback items={localeTheme.feedback.items} />
            {theme.feedbackWidget && (
              <FeedbackWidget
                apiUrl={theme.feedbackWidget.apiUrl}
                widgetPath={theme.feedbackWidget.widgetPath}
                channel={theme.feedbackWidget.channel}
              />
            )}
          </>
        }
        rightHeaderContent={<HeaderRightContainer />}
      >
        <HomeGutter>
          <Hero
            banner={illustration}
            title={t('common.heroTitle')}
            subtitle={t('common.heroSubtitle')}
            mainButton={
              <div className="c__hero__buttons">
                <div>
                  <ProConnectButton onClick={onAuthenticateUsingOidc} />
                </div>
              </div>
            }
          />
        </HomeGutter>
        {isGovDeployment && (
          <Footer
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...localeTheme.footer}
          />
        )}
      </MainLayout>
    </div>
  );
});

Login.propTypes = {
  theme: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  onAuthenticateUsingOidc: PropTypes.func.isRequired,
  // onMessageDismiss: PropTypes.func.isRequired,
};

export default Login;
