import React from 'react';
import PropTypes from 'prop-types';
// import * as RadixPopover from '@radix-ui/react-popover';
import { Icon } from '@gouvfr-lasuite/ui-kit';
import styles from './PopoverHeader.module.scss';

function PopoverHeader({ title, onBack, onClose }) {
  // hideCloseButton
  return (
    <div className={styles.popoverHeader}>
      <div className={styles.popoverLeft}>
        {onBack && (
          <button type="button" className={styles.popoverBack} onClick={onBack}>
            <Icon name="chevron_left" type="outlined" size="small" />
          </button>
        )}
      </div>
      <span className={styles.popoverTitle}>{title}</span>
      <div className={styles.popoverRight}>
        {onClose && (
          <button type="button" className={styles.popoverClose} aria-label="Close" onClick={onClose}>
            <Icon name="close" size="small" />
          </button>
        )}
        {/* {!hideCloseButton && (
          <RadixPopover.Close className={styles.popoverClose} aria-label="Close">
            <Icon name="close" size="small" />
          </RadixPopover.Close>
        )} */}
      </div>
    </div>
  );
}

PopoverHeader.propTypes = {
  title: PropTypes.string.isRequired,
  // hideCloseButton: PropTypes.bool,
  onBack: PropTypes.func,
  onClose: PropTypes.func,
};

PopoverHeader.defaultProps = {
  onBack: undefined,
  onClose: undefined,
  // hideCloseButton: false,
};

export default React.memo(PopoverHeader);
