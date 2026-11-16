import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Provider, useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { ModalProvider } from '@gouvfr-lasuite/cunningham-react';
import { CunninghamProvider } from '@gouvfr-lasuite/ui-kit';
import { ReduxRouter } from '../lib/redux-router';
import i18n from '../i18n';

import Paths from '../constants/Paths';
import LoginWrapperContainer from '../containers/LoginWrapperContainer';
import CoreContainer from '../containers/CoreContainer';
import { ThemeProvider, useTheme } from '../hooks/use-theme';
import NotFound from './NotFound';

import '../assets/styles/reset.scss';
import '../assets/styles/globals.scss';

function ThemedApp({ children }) {
  const { resolvedTheme, colorScheme } = useTheme();
  const colors = useSelector((state) => state.root?.config?.theme?.colors);
  const fontFamily = useSelector((state) => state.root?.config?.theme?.fontFamily);
  const favicon = useSelector((state) => state.root?.config?.theme?.favicon);

  useEffect(() => {
    Object.entries(colors ?? {}).forEach(([name, value]) => {
      document.documentElement.style.setProperty(name, value);
    });
  }, [colors]);

  useEffect(() => {
    if (!fontFamily) {
      return;
    }

    document.documentElement.style.setProperty('--c--globals--font--families--base', fontFamily);
    document.documentElement.style.setProperty('--c--globals--font--families--accent', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    if (!favicon) {
      // No custom favicon configured: follow the app's resolved theme (like the logo),
      // instead of the OS-level prefers-color-scheme media query.
      const defaultSrc = `/oss/${colorScheme}/favicon.svg`;

      document.querySelectorAll('link[rel="icon"]').forEach((link) => {
        link.setAttribute('href', defaultSrc);
      });
      return;
    }

    const { src, darkSrc } = favicon;

    document.querySelectorAll('link[rel="icon"]').forEach((link) => {
      const isDark = link.getAttribute('media')?.includes('dark');
      link.setAttribute('href', isDark && darkSrc ? darkSrc : src);
    });
  }, [favicon, colorScheme]);

  return (
    <CunninghamProvider currentLocale={i18n.resolvedLanguage} theme={resolvedTheme}>
      {children}
    </CunninghamProvider>
  );
}

ThemedApp.propTypes = {
  children: PropTypes.node.isRequired,
};

function Root({ store, history }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ThemedApp>
          <ModalProvider>
            <ReduxRouter history={history}>
              <Routes>
                <Route path={Paths.LOGIN} element={<LoginWrapperContainer />} />
                <Route path={Paths.OIDC_CALLBACK} element={<LoginWrapperContainer />} />
                <Route path={Paths.ROOT} element={<CoreContainer />} />
                <Route path={Paths.PROJECTS} element={<CoreContainer />} />
                <Route path={Paths.BOARDS} element={<CoreContainer />} />
                <Route path={Paths.CARDS} element={<CoreContainer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ReduxRouter>
          </ModalProvider>
        </ThemedApp>
      </ThemeProvider>
    </Provider>
  );
}

Root.propTypes = {
  /* eslint-disable react/forbid-prop-types */
  store: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  /* eslint-enable react/forbid-prop-types */
};

export default Root;
