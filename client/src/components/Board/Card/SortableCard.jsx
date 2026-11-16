import React, { useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { PointerActivationConstraints } from '@dnd-kit/dom';
import { KeyboardSensor, PointerSensor } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import classNames from 'classnames';

import CardContainer from '../../../containers/CardContainer';
import styles from '../Board.module.scss';

const CardPointerSensor = PointerSensor.configure({
  activationConstraints: (event) => {
    // on touch devices, require a long press so that swiping scrolls the lists instead of moving cards
    if (event.pointerType === 'touch') {
      return [
        new PointerActivationConstraints.Delay({
          value: 250,
          tolerance: 5,
        }),
      ];
    }

    return [
      new PointerActivationConstraints.Distance({
        value: 5,
      }),
    ];
  },
});

function SortableCard({ id, listId, canEdit, onSortableReady }) {
  const sortable = useSortable({
    id,
    index: 0, // initially it was a prop but it was lagging when dropping a card that was changing a lot of positions (= indexes), so now patching them with references
    group: listId,
    type: 'Card',
    accept: ['Card'],
    disabled: !canEdit,
    sensors: [KeyboardSensor, CardPointerSensor],
  });

  // register the Sortable instance with the parent List so it can update `sortable.index` imperatively
  // when card order changes without triggering a React re-render of this component
  const sortableInstance = sortable.sortable;

  // useLayoutEffect so this runs BEFORE the parent List's useLayoutEffect
  useLayoutEffect(() => {
    onSortableReady(id, sortableInstance);

    return () => onSortableReady(id, null);
  }, [id, sortableInstance, onSortableReady]);

  return (
    <div
      ref={(el) => {
        sortable.ref(el);
        sortable.handleRef(el);
      }}
      className={classNames(
        styles.card,
        canEdit && styles.draggable,
        sortable.isDragging && styles.dragging,
      )}
    >
      <CardContainer id={id} />
    </div>
  );
}

SortableCard.propTypes = {
  id: PropTypes.string.isRequired,
  listId: PropTypes.string.isRequired,
  canEdit: PropTypes.bool.isRequired,
  onSortableReady: PropTypes.func.isRequired,
};

export default React.memo(SortableCard);
