import React, { useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Button } from '@gouvfr-lasuite/cunningham-react';
import { Icon, Spinner } from '@gouvfr-lasuite/ui-kit';

import PopoverHeader from '../../ui/Popover/PopoverHeader';

import styles from './CardMoveStep.module.scss';

const Views = {
  ROOT: 'ROOT',
  LISTS: 'LISTS',
  BOARDS: 'BOARDS',
  BOARD_LISTS: 'BOARD_LISTS',
};

const Row = React.memo(({ label, hint, isSelected, isDisabled, hasChevron, onClick }) => (
  <button
    type="button"
    className={classNames(styles.row, isSelected && styles.rowSelected)}
    disabled={isDisabled}
    onClick={onClick}
  >
    <span className={styles.rowText}>
      <span className={styles.rowLabel}>{label}</span>
      {hint && <span className={styles.rowHint}>{hint}</span>}
    </span>
    {hasChevron && <Icon name="chevron_right" type="outlined" className={styles.rowIcon} />}
    {!hasChevron && isSelected && <Icon name="check" className={styles.rowIcon} />}
  </button>
));

Row.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  isSelected: PropTypes.bool,
  isDisabled: PropTypes.bool,
  hasChevron: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

Row.defaultProps = {
  hint: undefined,
  isSelected: false,
  isDisabled: false,
  hasChevron: false,
};

const CardMoveStep = React.memo(
  ({ boards, defaultPath, onMove, onTransfer, onBoardFetch, onBack, onClose }) => {
    const [t] = useTranslation();
    const [view, setView] = useState(Views.ROOT);
    const [browsedBoardId, setBrowsedBoardId] = useState(null);
    const [target, setTarget] = useState({ boardId: null, listId: null });

    const currentBoard = useMemo(
      () => boards.find((board) => board.id === defaultPath.boardId) || null,
      [boards, defaultPath.boardId],
    );

    const otherBoards = useMemo(
      () => boards.filter((board) => board.id !== defaultPath.boardId),
      [boards, defaultPath.boardId],
    );

    const browsedBoard = useMemo(
      () => boards.find((board) => board.id === browsedBoardId) || null,
      [boards, browsedBoardId],
    );

    const targetBoard = useMemo(
      () => boards.find((board) => board.id === target.boardId) || null,
      [boards, target.boardId],
    );

    const targetList = useMemo(
      () => (targetBoard && targetBoard.lists.find((list) => list.id === target.listId)) || null,
      [targetBoard, target.listId],
    );

    const isTransfer = !!targetBoard && targetBoard.id !== defaultPath.boardId;
    const canSubmit = !!targetList && (isTransfer || targetList.id !== defaultPath.listId);

    const handleBoardOpen = useCallback(
      (board) => {
        if (board.isFetching === null) {
          onBoardFetch(board.id);
        }

        setBrowsedBoardId(board.id);
        setView(Views.BOARD_LISTS);
      },
      [onBoardFetch],
    );

    const handleListSelect = useCallback((boardId, listId) => {
      setTarget({ boardId, listId });
    }, []);

    const handleViewBack = useCallback(() => {
      setView((prevView) => (prevView === Views.BOARD_LISTS ? Views.BOARDS : Views.ROOT));
    }, []);

    const handleSubmit = useCallback(
      (event) => {
        event.preventDefault();

        if (!canSubmit) {
          return;
        }

        if (isTransfer) {
          onTransfer(targetBoard.id, targetList.id);
        } else {
          onMove(targetList.id);
        }

        onClose();
      },
      [canSubmit, isTransfer, onMove, onTransfer, onClose, targetBoard, targetList],
    );

    let title;
    let content;

    switch (view) {
      case Views.LISTS: {
        const lists = currentBoard ? currentBoard.lists : [];

        title = t('common.toAnotherList');
        content =
          lists.length === 0 ? (
            <div className={styles.empty}>{t('common.noLists')}</div>
          ) : (
            lists.map((list) => (
              <Row
                key={list.id}
                label={list.name}
                isSelected={target.listId === list.id}
                isDisabled={list.id === defaultPath.listId}
                onClick={() => handleListSelect(defaultPath.boardId, list.id)}
              />
            ))
          );

        break;
      }
      case Views.BOARDS:
        title = t('common.toAnotherBoard');
        content =
          otherBoards.length === 0 ? (
            <div className={styles.empty}>{t('common.noBoards')}</div>
          ) : (
            otherBoards.map((board) => (
              <Row
                key={board.id}
                label={board.name}
                hint={board.id === target.boardId && targetList ? targetList.name : undefined}
                isSelected={board.id === target.boardId}
                hasChevron
                onClick={() => handleBoardOpen(board)}
              />
            ))
          );

        break;
      case Views.BOARD_LISTS:
        title = browsedBoard ? browsedBoard.name : t('common.selectList');

        if (!browsedBoard || browsedBoard.isFetching !== false) {
          content = (
            <div className={styles.empty}>
              <Spinner size="md" />
            </div>
          );
        } else if (browsedBoard.lists.length === 0) {
          content = <div className={styles.empty}>{t('common.noLists')}</div>;
        } else {
          content = browsedBoard.lists.map((list) => (
            <Row
              key={list.id}
              label={list.name}
              isSelected={target.boardId === browsedBoard.id && target.listId === list.id}
              onClick={() => handleListSelect(browsedBoard.id, list.id)}
            />
          ));
        }

        break;
      default:
        title = t('common.moveCard', {
          context: 'title',
        });
        content = (
          <>
            <Row
              label={t('common.toAnotherList')}
              hint={targetList && !isTransfer ? targetList.name : undefined}
              isSelected={!!targetList && !isTransfer}
              hasChevron
              onClick={() => setView(Views.LISTS)}
            />
            <Row
              label={t('common.toAnotherBoard')}
              hint={
                targetList && isTransfer ? `${targetBoard.name} › ${targetList.name}` : undefined
              }
              isSelected={!!targetList && isTransfer}
              hasChevron
              onClick={() => setView(Views.BOARDS)}
            />
          </>
        );
    }

    return (
      <form className={styles.wrapper} onSubmit={handleSubmit}>
        <PopoverHeader
          title={title}
          onBack={view === Views.ROOT ? onBack : handleViewBack}
          onClose={onClose}
        />
        <div className={styles.rows}>{content}</div>
        <div className={styles.footer}>
          <Button type="submit" disabled={!canSubmit} color="brand" variant="primary" size="small">
            {t('action.submit')}
          </Button>
        </div>
      </form>
    );
  },
);

CardMoveStep.propTypes = {
  boards: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  defaultPath: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  onMove: PropTypes.func.isRequired,
  onTransfer: PropTypes.func.isRequired,
  onBoardFetch: PropTypes.func.isRequired,
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

CardMoveStep.defaultProps = {
  onBack: undefined,
};

export default CardMoveStep;
