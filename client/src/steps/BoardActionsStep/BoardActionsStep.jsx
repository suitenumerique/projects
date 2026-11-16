import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Menu from '../../ui/Menu';
import MenuItem from '../../ui/Menu/MenuItem';
import { useSteps } from '../../hooks';
import BoardEditStep from '../BoardEditStep';
import DeleteStep from '../DeleteStep';

const StepTypes = {
  EDIT_NAME: 'EDIT_NAME',
  DELETE: 'DELETE',
  LEAVE: 'LEAVE',
};

const BoardActionsStep = React.memo(
  ({ defaultData, canDelete, canLeave, onUpdate, onDelete, onLeave, onExportCsv, onClose }) => {
    const { t } = useTranslation();

    const [step, openStep, handleBack] = useSteps();

    const handleEditNameClick = useCallback(() => {
      openStep(StepTypes.EDIT_NAME);
    }, [openStep]);

    const handleExportCsvClick = useCallback(() => {
      onExportCsv();
      onClose();
    }, [onExportCsv, onClose]);

    const handleDeleteClick = useCallback(() => {
      openStep(StepTypes.DELETE);
    }, [openStep]);

    const handleLeaveClick = useCallback(() => {
      openStep(StepTypes.LEAVE);
    }, [openStep]);

    if (step) {
      switch (step.type) {
        case StepTypes.EDIT_NAME:
          return (
            <BoardEditStep
              defaultData={defaultData}
              onUpdate={onUpdate}
              onBack={handleBack}
              onClose={onClose}
            />
          );
        case StepTypes.DELETE:
          return (
            <DeleteStep
              title="common.deleteBoard"
              content="common.areYouSureYouWantToDeleteThisBoard"
              buttonContent="action.deleteBoard"
              onConfirm={onDelete}
              onClose={onClose}
              onBack={handleBack}
            />
          );
        case StepTypes.LEAVE:
          return (
            <DeleteStep
              title="common.leaveBoard"
              content="common.areYouSureYouWantToLeaveBoard"
              buttonContent="action.leaveBoard"
              onConfirm={onLeave}
              onClose={onClose}
              onBack={handleBack}
            />
          );
        default:
          return null;
      }
    }

    return (
      <Menu>
        {canDelete && (
          <MenuItem icon="edit" onClick={handleEditNameClick}>
            {t('action.rename')}
          </MenuItem>
        )}
        {canLeave && (
          <MenuItem icon="logout" onClick={handleLeaveClick}>
            {t('action.leaveBoard')}
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem icon="delete" onClick={handleDeleteClick}>
            {t('action.remove')}
          </MenuItem>
        )}
        {onExportCsv && (
          <MenuItem icon="download" onClick={handleExportCsvClick}>
            {t('action.exportCsv')}
          </MenuItem>
        )}
      </Menu>
    );
  },
);

BoardActionsStep.propTypes = {
  defaultData: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  canDelete: PropTypes.bool.isRequired,
  canLeave: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onLeave: PropTypes.func.isRequired,
  onExportCsv: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

BoardActionsStep.defaultProps = {
  onExportCsv: undefined,
};

export default BoardActionsStep;
