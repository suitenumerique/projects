import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

import styles from './AttachmentAddZone.module.scss';

const AttachmentAddZone = React.memo(({ children, onCreate }) => {
  const [t] = useTranslation();

  const submit = useCallback(
    (file) => {
      onCreate({
        file,
      });
    },
    [onCreate],
  );

  const handleDropAccepted = useCallback(
    (files) => {
      files.forEach((file) => {
        submit(file);
      });
    },
    [submit],
  );

  useEffect(() => {
    const handlePaste = (event) => {
      const { items } = event.clipboardData || {};
      if (!items) return;

      Array.from(items).forEach((item) => {
        if (!item.type.startsWith('image/')) return;
        const file = item.getAsFile();
        if (file) submit(file);
      });
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [submit]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDropAccepted: handleDropAccepted,
  });

  return (
    <>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <div {...getRootProps()}>
        {isDragActive && <div className={styles.dropzone}>{t('common.dropFileToUpload')}</div>}
        {children}
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <input {...getInputProps()} />
      </div>
    </>
  );
});

AttachmentAddZone.propTypes = {
  children: PropTypes.element.isRequired,
  onCreate: PropTypes.func.isRequired,
};

export default AttachmentAddZone;
