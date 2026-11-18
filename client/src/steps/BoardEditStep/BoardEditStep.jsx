import { dequal } from 'dequal';
import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@gouvfr-lasuite/cunningham-react';

import { useForm } from '../../hooks';
import PopoverHeader from '../../ui/Popover/PopoverHeader';

import styles from './BoardEditStep.module.scss';

const BoardEditStep = React.memo(({ defaultData, onUpdate, onBack, onClose }) => {
  const [t] = useTranslation();

  const [data, handleFieldChange] = useForm(() => ({
    name: '',
    ...defaultData,
  }));

  const nameField = useRef(null);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const cleanData = {
        ...data,
        name: data.name.trim(),
      };

      if (!cleanData.name) {
        nameField.current.select();
        return;
      }

      if (!dequal(cleanData, defaultData)) {
        onUpdate(cleanData);
      }

      onClose();
    },
    [defaultData, onUpdate, onClose, data],
  );

  useEffect(() => {
    nameField.current.select();
  }, []);

  return (
    <>
      <PopoverHeader onBack={onBack} title={t('common.editBoard', { context: 'title' })} />
      <form onSubmit={handleSubmit}>
        <Input
          ref={nameField}
          name="name"
          label={t('common.boardName')}
          value={data.name}
          onChange={handleFieldChange}
          className={styles.createInput}
        />

        <div className={styles.buttons}>
          <Button type="submit" color="brand" variant="primary" size="medium">
            {t('action.save')}
          </Button>
        </div>
      </form>
    </>
  );
});

BoardEditStep.propTypes = {
  defaultData: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  onUpdate: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BoardEditStep;
