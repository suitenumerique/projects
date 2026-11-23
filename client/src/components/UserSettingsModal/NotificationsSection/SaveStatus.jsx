import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Icon } from '@gouvfr-lasuite/ui-kit';

import styles from './SaveStatus.module.scss';

const SUCCESS_DISPLAY_DURATION = 2000;
// Saving is often instant: show it long enough to be read.
const MIN_PENDING_DURATION = 600;

// Save status of a setting: shown while saving, for a moment once saved, and
// until hidden by the parent on error. The live region stays mounted so screen
// readers announce each change.
const SaveStatus = React.memo(({ status, onHide }) => {
  const [t] = useTranslation();

  // The status shown, which lags behind `status` to keep 'pending' on screen for
  // at least MIN_PENDING_DURATION.
  const [displayedStatus, setDisplayedStatus] = useState(status);
  const pendingSinceRef = useRef(null);

  useEffect(() => {
    if (status === 'pending') {
      pendingSinceRef.current = Date.now();
      setDisplayedStatus(status);

      return undefined;
    }

    if (!status || pendingSinceRef.current === null) {
      setDisplayedStatus(status);

      return undefined;
    }

    const remaining = MIN_PENDING_DURATION - (Date.now() - pendingSinceRef.current);
    const timeout = setTimeout(
      () => {
        pendingSinceRef.current = null;
        setDisplayedStatus(status);
      },
      Math.max(remaining, 0),
    );

    return () => clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    if (displayedStatus !== 'success') {
      return undefined;
    }

    const timeout = setTimeout(onHide, SUCCESS_DISPLAY_DURATION);

    return () => clearTimeout(timeout);
  }, [displayedStatus, onHide]);

  let content = null;
  switch (displayedStatus) {
    case 'pending':
      content = t('common.saving');

      break;
    case 'success':
      content = (
        <>
          <Icon name="check" size={16} />
          {t('common.saved')}
        </>
      );

      break;
    case 'error':
      content = t('common.unableToSaveTryAgain');

      break;
    default:
  }

  return (
    <span
      role="status"
      className={classNames(styles.wrapper, displayedStatus && styles[displayedStatus])}
    >
      {content}
    </span>
  );
});

SaveStatus.propTypes = {
  status: PropTypes.oneOf(['pending', 'success', 'error']),
  onHide: PropTypes.func.isRequired,
};

SaveStatus.defaultProps = {
  status: undefined,
};

export default SaveStatus;
