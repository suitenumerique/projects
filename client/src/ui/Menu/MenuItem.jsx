import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

import { Icon } from '@gouvfr-lasuite/ui-kit';
import classNames from 'classnames';
import styles from './MenuItem.module.scss';

function MenuItem({ onClick, children, icon, isIconActive }) {
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick();
      }
    },
    [onClick],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={styles.menuItem}
    >
      {icon && (
        <Icon
          name={icon}
          className={classNames(styles.icon, isIconActive && styles.iconActive)}
          type={isIconActive ? 'filled' : 'outlined'}
        />
      )}
      {children}
    </button>
  );
}

MenuItem.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node,
  icon: PropTypes.string,
  isIconActive: PropTypes.bool,
};

MenuItem.defaultProps = {
  onClick: () => {},
  children: undefined,
  icon: undefined,
  isIconActive: false,
};

export default React.memo(MenuItem);
