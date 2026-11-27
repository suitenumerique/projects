import { useEffect, useCallback } from 'react';
import { Modal, Button, Input } from '@gouvfr-lasuite/cunningham-react';
import PropTypes from 'prop-types';
import { useForm } from '../../../hooks';

function FolderEditModal({ initialData, isOpen, onClose, onSubmit }) {
  const [data, handleFieldChange, setData] = useForm({
    name: '',
    ...initialData,
  });

  useEffect(() => {
    if (isOpen) {
      // The modal stays mounted between openings, so reset the form each time it opens.
      setData({ name: '', ...initialData });
      setTimeout(() => {
        const input = document.querySelector('input[name="name"]');
        input?.focus();
      }, 50);
    }
    // Only reset on opening: initialData is a new object on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onSubmit(data);
      onClose();
    },
    [onSubmit, onClose, data],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="small"
      closeOnClickOutside
      rightActions={
        <>
          <Button color="brand" variant="tertiary" onClick={onClose}>
            Annuler
          </Button>
          <Button color="brand" variant="primary" type="submit" form="folder-create-modal-form">
            {data.id ? 'Renommer' : 'Créer'}
          </Button>
        </>
      }
      title={data.id ? 'Renommer le dossier' : 'Créer un dossier'}
    >
      <form id="folder-create-modal-form" onSubmit={handleSubmit}>
        <Input
          name="name"
          label={data.id ? 'Nom du dossier' : 'Nom du nouveau dossier'}
          value={data.name}
          required
          onChange={handleFieldChange}
        />
      </form>
    </Modal>
  );
}

FolderEditModal.propTypes = {
  initialData: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default FolderEditModal;
