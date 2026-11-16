import { dequal } from 'dequal';
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from '@gouvfr-lasuite/cunningham-react';

import { useForm } from '../../../../hooks';
import { focusEnd } from '../../../../utils/element-helpers';
import { getMentionedUsers, toDisplayText, toStorageText } from '../../../../utils/mentions';
import MentionTextarea from '../MentionTextarea';

import styles from './CommentEdit.module.scss';

const CommentEdit = React.forwardRef(
  ({ defaultData, mentionableUsers, onUpdate, text, actions }, ref) => {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [data, handleFieldChange, setData] = useForm(null);

    const textField = useRef(null);
    const pickedUsers = useRef([]);

    const open = useCallback(() => {
      setIsOpened(true);
      // Users already mentioned keep their id (homonyms, or users who left the board since)
      pickedUsers.current = getMentionedUsers(defaultData.text || '');
      setData({
        ...defaultData,
        text: toDisplayText(defaultData.text || ''),
      });
    }, [defaultData, setData]);

    const close = useCallback(() => {
      setIsOpened(false);
      setData(null);
    }, [setData]);

    const submit = useCallback(() => {
      const cleanData = {
        ...data,
        text: toStorageText(data.text.trim(), mentionableUsers, pickedUsers.current),
      };

      if (cleanData.text && !dequal(cleanData, defaultData)) {
        onUpdate(cleanData);
      }

      close();
    }, [defaultData, mentionableUsers, onUpdate, data, close]);

    const handleMentionSelect = useCallback((user) => {
      pickedUsers.current.push(user);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        open,
        close,
      }),
      [open, close],
    );

    const handleFieldKeyDown = useCallback(
      (event) => {
        if (event.ctrlKey && event.key === 'Enter') {
          submit();
        }
      },
      [submit],
    );

    const handleFieldBlur = useCallback(() => {
      submit();
    }, [submit]);

    const handleSubmit = useCallback(
      (event) => {
        event.preventDefault();
        submit();
      },
      [submit],
    );

    useEffect(() => {
      if (isOpened) {
        focusEnd(textField.current);
      }
    }, [isOpened]);

    if (!isOpened) {
      return (
        <>
          {actions}
          {text}
        </>
      );
    }

    return (
      <form onSubmit={handleSubmit}>
        <MentionTextarea
          ref={textField}
          name="text"
          value={data.text}
          users={mentionableUsers}
          minRows={3}
          spellCheck={false}
          className={styles.field}
          onKeyDown={handleFieldKeyDown}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          onMentionSelect={handleMentionSelect}
        />
        <div className={styles.controls}>
          <Button color="brand" variant="secondary" size="small">
            {t('action.save')}
          </Button>
        </div>
      </form>
    );
  },
);

CommentEdit.propTypes = {
  defaultData: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  mentionableUsers: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  onUpdate: PropTypes.func.isRequired,
  text: PropTypes.element.isRequired,
  actions: PropTypes.element.isRequired,
};

export default React.memo(CommentEdit);
