import React, { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TextareaAutosize from 'react-textarea-autosize';

import User from '../../../../ui/User';
import { filterUsersByQuery, getMentionQueryAtCaret } from '../../../../utils/mentions';

import styles from './MentionTextarea.module.scss';

const MentionTextarea = React.forwardRef(
  ({ name, value, users, onChange, onKeyDown, onBlur, onMentionSelect, ...props }, ref) => {
    const [mention, setMention] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const textField = useRef(null);

    useImperativeHandle(ref, () => textField.current, []);

    const suggestions = useMemo(
      () => (mention ? filterUsersByQuery(users, mention.query) : []),
      [users, mention],
    );

    const isOpened = suggestions.length > 0;

    const updateMention = useCallback((text, caret) => {
      setMention(getMentionQueryAtCaret(text, caret));
      setActiveIndex(0);
    }, []);

    const handleChange = useCallback(
      (event) => {
        onChange(event);
        updateMention(event.target.value, event.target.selectionStart);
      },
      [onChange, updateMention],
    );

    const handleSelect = useCallback(
      (user) => {
        const caret = mention.start + mention.query.length + 1;
        const before = value.slice(0, mention.start);
        const after = value.slice(caret).replace(/^\s/, '');
        const inserted = `@${user.name} `;

        onChange(null, { name, value: `${before}${inserted}${after}` });
        setMention(null);

        if (onMentionSelect) {
          onMentionSelect(user);
        }

        const nextCaret = before.length + inserted.length;

        requestAnimationFrame(() => {
          if (textField.current) {
            textField.current.focus();
            textField.current.setSelectionRange(nextCaret, nextCaret);
          }
        });
      },
      [mention, value, name, onChange, onMentionSelect],
    );

    const handleKeyDown = useCallback(
      (event) => {
        if (isOpened) {
          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % suggestions.length);
              return;
            case 'ArrowUp':
              event.preventDefault();
              setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
              return;
            case 'Enter':
            case 'Tab':
              event.preventDefault();
              handleSelect(suggestions[activeIndex]);
              return;
            case 'Escape':
              event.preventDefault();
              event.stopPropagation();
              setMention(null);
              return;
            default:
          }
        }

        if (onKeyDown) {
          onKeyDown(event);
        }
      },
      [isOpened, suggestions, activeIndex, handleSelect, onKeyDown],
    );

    const handleCaretMove = useCallback(
      (event) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)) {
          return;
        }

        updateMention(event.target.value, event.target.selectionStart);
      },
      [updateMention],
    );

    const handleBlur = useCallback(
      (event) => {
        setMention(null);

        if (onBlur) {
          onBlur(event);
        }
      },
      [onBlur],
    );

    const handleSuggestionMouseDown = useCallback((event) => {
      // Keep the focus in the textarea so it is not blurred (CommentEdit submits on blur)
      event.preventDefault();
    }, []);

    return (
      <div className={styles.wrapper}>
        <TextareaAutosize
          {...props} // eslint-disable-line react/jsx-props-no-spreading
          ref={textField}
          name={name}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleCaretMove}
          onClick={handleCaretMove}
          onBlur={handleBlur}
          aria-autocomplete="list"
          aria-expanded={isOpened}
        />
        {isOpened && (
          <ul
            className={styles.suggestions}
            role="listbox"
            // Anchor to the textarea's bottom edge, ignoring its margin
            style={
              textField.current
                ? { top: textField.current.offsetTop + textField.current.offsetHeight + 2 }
                : undefined
            }
          >
            {suggestions.map((user, index) => (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={user.id}
                role="option"
                aria-selected={index === activeIndex}
                className={classNames(
                  styles.suggestion,
                  index === activeIndex && styles.suggestionActive,
                )}
                onMouseDown={handleSuggestionMouseDown}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(user)}
              >
                <User name={user.name} avatarUrl={user.avatarUrl} size="small" />
                <span className={styles.suggestionText}>
                  <span className={styles.suggestionName}>{user.name}</span>
                  {user.email && <span className={styles.suggestionEmail}>{user.email}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

MentionTextarea.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
  onBlur: PropTypes.func,
  onMentionSelect: PropTypes.func,
};

MentionTextarea.defaultProps = {
  onKeyDown: undefined,
  onBlur: undefined,
  onMentionSelect: undefined,
};

export default React.memo(MentionTextarea);
