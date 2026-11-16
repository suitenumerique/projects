import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation, Trans } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Header, MainLayout, Spinner } from '@gouvfr-lasuite/ui-kit';

import styles from './Core.module.scss';

import Feedback from '../Feedback';
import { FeedbackWidget } from '../../ui/FeedbackWidget/index.tsx';
import { useTheme } from '../../hooks/use-theme';
import ModalTypes from '../../constants/ModalTypes';
import Paths from '../../constants/Paths';
import LeftMenuContainer from '../../containers/LeftMenuContainer';
import HeaderRightContainer from '../../containers/HeaderRightContainer';
import StaticContainer from '../../containers/StaticContainer';
import UserSettingsModalContainer from '../../containers/UserSettingsModalContainer';
import ProjectAddModalContainer from '../../containers/ProjectAddModalContainer';
import ProjectSettingsModalContainer from '../../containers/ProjectSettingsModalContainer';

const Core = React.memo(
  ({
    theme,
    isInitializing,
    isSocketDisconnected,
    currentUser,
    currentModal,
    currentProject,
    currentBoard,
  }) => {
    const { t, i18n } = useTranslation();
    const { colorScheme } = useTheme();

    const defaultTitle = useRef(document.title);
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);

    const { headerLogo, feedbackItems, feedbackWidget } = useMemo(() => {
      if (!theme) {
        return {
          headerLogo: undefined,
          feedbackItems: undefined,
          feedbackWidget: undefined,
        }; // Theme information has to be fetched from the server
      }

      const languageWithoutRegion = i18n.language.split(/[-_]/)[0];

      return {
        headerLogo: theme.header?.[languageWithoutRegion]?.logo ?? theme.header?.default.logo,
        feedbackItems:
          theme.feedback?.[languageWithoutRegion]?.items ?? theme.feedback?.default.items ?? [],
        feedbackWidget: theme.feedbackWidget,
      };
    }, [theme, i18n.language]);

    useEffect(() => {
      let title;
      if (currentProject) {
        title = currentProject.name;

        if (currentBoard) {
          title += ` | ${currentBoard.name}`;
        }
      } else {
        title = defaultTitle.current;
      }

      document.title = title;
    }, [currentProject, currentBoard]);

    const location = useLocation();

    useEffect(() => {
      // Since LaSuite has no knowledge of the menu content it doesn't know when to close
      // Assuming a nested menu action should change the location, and so, the menu can be considered as to close
      setLeftPanelOpen(false);
    }, [location]);

    const contentNode = () => {
      if (currentUser) {
        return (
          <MainLayout
            enableResize
            rightHeaderContent={<HeaderRightContainer />}
            leftPanelContent={currentProject && <LeftMenuContainer />}
            isLeftPanelOpen={leftPanelOpen}
            setIsLeftPanelOpen={setLeftPanelOpen}
            hideLeftPanelOnDesktop={!currentProject} // The left panel is managing metadata only when inside a project
            icon={
              <>
                <Link to={Paths.ROOT} className={styles.logoLink}>
                  <div className={styles.logoWrapper}>
                    {headerLogo ? (
                      <img
                        alt=""
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...headerLogo}
                      />
                    ) : (
                      <img alt="" src={`/oss/${colorScheme}/logo.svg`} />
                    )}
                  </div>
                </Link>
                <Feedback items={feedbackItems} />
                {feedbackWidget && (
                  <FeedbackWidget
                    apiUrl={feedbackWidget.apiUrl}
                    widgetPath={feedbackWidget.widgetPath}
                    channel={feedbackWidget.channel}
                  />
                )}
              </>
            }
          >
            <StaticContainer />

            <div
              className={`${styles.menuBackdrop} ${leftPanelOpen ? styles.menuBackdropVisible : ''}`}
              onClick={() => {
                setLeftPanelOpen(false);
              }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();

                  setLeftPanelOpen(false);
                }
              }}
              aria-label="close menu"
            />

            {currentModal === ModalTypes.USER_SETTINGS && <UserSettingsModalContainer />}
            {currentModal === ModalTypes.PROJECT_ADD && <ProjectAddModalContainer />}
            {currentModal === ModalTypes.PROJECT_SETTINGS && <ProjectSettingsModalContainer />}
          </MainLayout>
        );
      }

      return (
        <div className={styles.noAuthWrapper}>
          <div className={styles.noAuthHeader}>
            <Header
              leftIcon={
                <>
                  <Link to={Paths.ROOT} className={styles.logoLink}>
                    <div className={styles.logoWrapper}>
                      {headerLogo ? (
                        <img
                          alt=""
                          // eslint-disable-next-line react/jsx-props-no-spreading
                          {...headerLogo}
                        />
                      ) : (
                        <img alt="" src={`/oss/${colorScheme}/logo.svg`} />
                      )}
                    </div>
                  </Link>
                  <Feedback items={feedbackItems} />
                  {feedbackWidget && (
                    <FeedbackWidget
                      apiUrl={feedbackWidget.apiUrl}
                      widgetPath={feedbackWidget.widgetPath}
                      channel={feedbackWidget.channel}
                    />
                  )}
                </>
              }
              rightIcon={<HeaderRightContainer />}
            />
          </div>
          <div className={styles.noAuthContent}>
            <StaticContainer />
          </div>
        </div>
      );
    };

    return (
      <>
        {isInitializing ? (
          <div className={styles.loading}>
            <Spinner size="xl" />
          </div>
        ) : (
          contentNode()
        )}
        {isSocketDisconnected && (
          <div className={styles.message}>
            <div className={styles.messageHeader}>{t('common.noConnectionToServer')}</div>
            <div className={styles.messageContent}>
              <Trans i18nKey="common.allChangesWillBeAutomaticallySavedAfterConnectionRestored">
                All changes will be automatically saved
                <br />
                after connection restored
              </Trans>
            </div>
          </div>
        )}
      </>
    );
  },
);

Core.propTypes = {
  theme: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  isInitializing: PropTypes.bool.isRequired,
  isSocketDisconnected: PropTypes.bool.isRequired,
  /* eslint-disable react/forbid-prop-types */
  currentUser: PropTypes.object,
  /* eslint-enable react/forbid-prop-types */
  currentModal: PropTypes.oneOf(Object.values(ModalTypes)),
  /* eslint-disable react/forbid-prop-types */
  currentProject: PropTypes.object,
  currentBoard: PropTypes.object,
  /* eslint-enable react/forbid-prop-types */
};

Core.defaultProps = {
  currentUser: undefined,
  currentModal: undefined,
  currentProject: undefined,
  currentBoard: undefined,
};

export default Core;
