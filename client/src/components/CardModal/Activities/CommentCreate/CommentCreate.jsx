import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useDidUpdate, useToggle } from '../../../../lib/hooks';

import { useForm } from '../../../../hooks';
import { toStorageText } from '../../../../utils/mentions';
import MentionTextarea from '../MentionTextarea';

import styles from './CommentCreate.module.scss';

const DEFAULT_DATA = {
  text: '',
};

const CommentCreate = React.memo(({ mentionableUsers, onCreate }) => {
  const [t] = useTranslation();
  const [data, handleFieldChange, setData] = useForm(DEFAULT_DATA);
  const [selectTextFieldState, selectTextField] = useToggle();

  const textField = useRef(null);
  const pickedUsers = useRef([]);

  const submit = useCallback(() => {
    const cleanData = {
      ...data,
      text: data.text.trim(),
    };

    if (!cleanData.text) {
      textField.current?.select();
      return;
    }

    onCreate({
      ...cleanData,
      text: toStorageText(cleanData.text, mentionableUsers, pickedUsers.current),
    });

    pickedUsers.current = [];
    setData(DEFAULT_DATA);
    selectTextField();
  }, [onCreate, data, setData, selectTextField, mentionableUsers]);

  const handleFieldKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    },
    [submit],
  );

  const handleMentionSelect = useCallback((user) => {
    pickedUsers.current.push(user);
  }, []);

  useDidUpdate(() => {
    textField.current?.focus();
  }, [selectTextFieldState]);

  return (
    <MentionTextarea
      ref={textField}
      name="text"
      value={data.text}
      users={mentionableUsers}
      placeholder={t('common.writeComment')}
      minRows={3}
      spellCheck={false}
      className={styles.field}
      onKeyDown={handleFieldKeyDown}
      onChange={handleFieldChange}
      onMentionSelect={handleMentionSelect}
    />
  );
});

CommentCreate.propTypes = {
  mentionableUsers: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  onCreate: PropTypes.func.isRequired,
};

export default CommentCreate;
