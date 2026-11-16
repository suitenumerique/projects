import React from 'react';
import PropTypes from 'prop-types';

import BoardListItemContainer from '../../../containers/BoardListItemContainer';
import FolderListItem from '../FolderListItem';

const BoardTreeItem = React.memo(
  ({
    item,
    isExpanded,
    isActive,
    isDropTarget,
    canEdit,
    onToggle,
    onClick,
    onEdit,
    onDelete,
    disableHover,
  }) => {
    if (item.type === 'board') {
      return (
        <BoardListItemContainer
          id={item.data.id}
          showDescription={false}
          editable
          isActive={isActive}
          handleClick={onClick}
          disableHover={disableHover}
        />
      );
    }

    return (
      <FolderListItem
        folder={item.data}
        isDropTarget={isDropTarget}
        disableHover={disableHover}
        onToggle={onToggle}
        isExpanded={isExpanded}
        canEdit={canEdit}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  },
);

BoardTreeItem.propTypes = {
  item: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  isExpanded: PropTypes.bool,
  isActive: PropTypes.bool,
  isDropTarget: PropTypes.bool,
  canEdit: PropTypes.bool.isRequired,
  onToggle: PropTypes.func,
  onClick: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  disableHover: PropTypes.bool,
};

BoardTreeItem.defaultProps = {
  isExpanded: false,
  isActive: false,
  isDropTarget: false,
  disableHover: false,
  onToggle: null,
  onClick: null,
};

export default BoardTreeItem;
