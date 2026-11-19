import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import selectors from '../selectors';
import entryActions from '../entry-actions';
import { BoardMembershipRoles } from '../constants/Enums';
import BoardListItem from '../components/BoardListItem/BoardListItem';

const makeMapStateToProps = () => {
  const selectBoardById = selectors.makeSelectBoardById();
  const selectCurrentUserMembershipForBoard =
    selectors.makeSelectCurrentUserMembershipForBoardById();
  const selectOwnerCountForBoard = selectors.makeSelectOwnerCountForBoardById();

  return (state, { id }) => {
    const board = selectBoardById(state, id);
    const currentUserMembership = selectCurrentUserMembershipForBoard(state, id);
    const isOwner =
      !!currentUserMembership && currentUserMembership.role === BoardMembershipRoles.OWNER;
    const isCurrentUserEditor =
      !!currentUserMembership &&
      (currentUserMembership.role === BoardMembershipRoles.EDITOR || isOwner);
    const ownerCount = selectOwnerCountForBoard(state, id);
    const canLeave = !!currentUserMembership && (!isOwner || ownerCount > 1);
    const preference = selectors.selectUserBoardPreference(state, id);

    return {
      id,
      board,
      canEdit: isCurrentUserEditor,
      canDelete: isOwner,
      canLeave,
      isFavorite: !!preference && !!preference.isFavorite,
      currentUserMembershipId: currentUserMembership ? currentUserMembership.id : null,
    };
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onBoardUpdate: entryActions.updateBoard,
      onBoardDelete: entryActions.deleteBoard,
      onBoardLeave: entryActions.deleteBoardMembership,
    },
    dispatch,
  );

export default connect(makeMapStateToProps, mapDispatchToProps)(BoardListItem);
