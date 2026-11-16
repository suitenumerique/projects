import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from '@gouvfr-lasuite/cunningham-react';
import { ShareModal, ShareModalCopyLinkFooter, Icon } from '@gouvfr-lasuite/ui-kit';

import { useUsersSearch } from '../../hooks';
import { BoardMembershipRoles } from '../../constants/Enums';
import Badge from '../../ui/Badge';
import Filters from './Filters';
import BoardActionsStep from '../../steps/BoardActionsStep';
import usePopup from '../../lib/popup';
import exportCardsToCsv from '../../utils/export-cards-to-csv';
import styles from './BoardActions.module.scss';

const BoardActions = React.memo(
  ({
    currentUser,
    currentBoardId,
    currentBoardName,
    filterText,
    filterUsers,
    includeCardsWithoutMembers,
    boardLabels,
    filterLabels,
    includeCardsWithoutLabels,
    boardMemberships,
    canSeeMemberships,
    canEdit,
    canEditMemberships,
    isBoardPublic,
    searchedUsers,
    isSearchingUsers,
    cards,
    lists,
    onTextFilterUpdate,
    onUserToFilterAdd,
    onUserFromFilterRemove,
    onLabelToFilterAdd,
    onLabelFromFilterRemove,
    onLabelCreate,
    onLabelUpdate,
    onLabelMove,
    onLabelDelete,
    onMembershipCreate,
    onMembershipUpdate,
    onMembershipDelete,
    onBoardUpdate,
    onSearchUsers,
    onClearUserSearch,
  }) => {
    const [t] = useTranslation();

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const BoardActionsPopover = usePopup(BoardActionsStep);

    const handleUpdate = useCallback(
      (data) => {
        onBoardUpdate(currentBoardId, data);
      },
      [onBoardUpdate, currentBoardId],
    );

    const handleShareClick = useCallback(() => {
      setIsShareModalOpen(true);
    }, []);

    const handleExportCsv = useCallback(() => {
      exportCardsToCsv(cards, lists, currentBoardName, t);
    }, [cards, lists, currentBoardName, t]);

    const handleShareModalClose = useCallback(() => {
      setIsShareModalOpen(false);

      onClearUserSearch(); // Empty the search for a proper next modal opening
    }, [onClearUserSearch]);

    const userIdsToExclude = useMemo(
      () => boardMemberships.map((membership) => membership.userId),
      [boardMemberships],
    );
    const [debouncedHandleUsersQuery] = useUsersSearch(userIdsToExclude, onSearchUsers);

    const formattedSearchedUsers = useMemo(() => {
      return searchedUsers.map((user) => {
        return {
          id: user.id,
          full_name: user.name,
          email: user.email,
        };
      });
    }, [searchedUsers]);

    const modalMembers = useMemo(() => {
      return boardMemberships.map((membership) => {
        const isCurrentUserOwner =
          membership.user.id === currentUser?.id && membership.role === BoardMembershipRoles.OWNER;

        return {
          id: membership.id,
          role:
            // We have to virtually manage another role for the commenting option for viewers
            membership.role === BoardMembershipRoles.VIEWER && membership.canComment === true
              ? 'commenter'
              : membership.role,
          user: {
            id: membership.user.id,
            full_name: membership.user.name,
            email: membership.user.email,
          },
          // Prevent the current user from removing or changing their own owner membership
          can_delete: !isCurrentUserOwner,
        };
      });
    }, [boardMemberships, currentUser?.id]);

    const filterUsersRef = useRef(filterUsers);
    filterUsersRef.current = filterUsers;
    const filterLabelsRef = useRef(filterLabels);
    filterLabelsRef.current = filterLabels;

    // Read URL params into Redux when the board changes (handles shared filtered URLs)
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);

      const text = params.get('text');
      if (text) onTextFilterUpdate(text);

      const memberIds = params.get('members');
      if (memberIds)
        memberIds
          .split(',')
          .filter(Boolean)
          .filter((id) => !filterUsersRef.current.some((u) => u.id === id))
          .forEach((id) => onUserToFilterAdd(id));
      if (params.has('noMembers') && !includeCardsWithoutMembers) onUserToFilterAdd(null);

      const labelIds = params.get('labels');
      if (labelIds)
        labelIds
          .split(',')
          .filter(Boolean)
          .filter((id) => !filterLabelsRef.current.some((l) => l.id === id))
          .forEach((id) => onLabelToFilterAdd(id));
      if (params.has('noLabels') && !includeCardsWithoutLabels) onLabelToFilterAdd(null);
    }, [currentBoardId, onTextFilterUpdate, onUserToFilterAdd, onLabelToFilterAdd]); // eslint-disable-line react-hooks/exhaustive-deps

    // Write Redux filter state to URL so the current view is always shareable
    useEffect(() => {
      const params = new URLSearchParams();

      if (filterText) params.set('text', filterText);

      const memberIds = filterUsers.map((u) => u.id).filter(Boolean);
      if (memberIds.length > 0) params.set('members', memberIds.join(','));
      if (includeCardsWithoutMembers) params.set('noMembers', '1');

      const labelIds = filterLabels.map((l) => l.id).filter(Boolean);
      if (labelIds.length > 0) params.set('labels', labelIds.join(','));
      if (includeCardsWithoutLabels) params.set('noLabels', '1');

      const search = params.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${search ? `?${search}` : ''}`,
      );
    }, [
      filterText,
      filterUsers,
      includeCardsWithoutMembers,
      filterLabels,
      includeCardsWithoutLabels,
    ]);

    return (
      <div className={styles.wrapper}>
        <h4 className={styles.boardName}>{currentBoardName}</h4>
        <div className={styles.actions}>
          <div className={styles.action}>
            <Filters
              filterText={filterText}
              boardLabels={boardLabels}
              filterLabels={filterLabels}
              includeCardsWithoutLabels={includeCardsWithoutLabels}
              filterUsers={filterUsers}
              includeCardsWithoutMembers={includeCardsWithoutMembers}
              boardMemberships={boardMemberships}
              canEdit={canEdit}
              onTextFilterUpdate={onTextFilterUpdate}
              onUserAdd={onUserToFilterAdd}
              onUserRemove={onUserFromFilterRemove}
              onLabelAdd={onLabelToFilterAdd}
              onLabelRemove={onLabelFromFilterRemove}
              onLabelCreate={onLabelCreate}
              onLabelUpdate={onLabelUpdate}
              onLabelMove={onLabelMove}
              onLabelDelete={onLabelDelete}
            />
          </div>
          {canSeeMemberships && (
            <div className={styles.action}>
              {canEditMemberships &&
              boardMemberships.length === 1 &&
              boardMemberships.some(
                (boardMembership) => boardMembership.userId === currentUser.id,
              ) ? (
                <Button
                  title="Share board"
                  color="neutral"
                  variant="tertiary"
                  size="small"
                  className={styles.shareButton}
                  onClick={handleShareClick}
                >
                  {t('action.share')}
                </Button>
              ) : (
                <Badge style={{ cursor: 'pointer' }} onClick={handleShareClick}>
                  <Icon type="outlined" name="group" />
                  <span style={{ fontSize: '16px' }}>{boardMemberships.length}</span>
                </Badge>
              )}
            </div>
          )}
          <div className={styles.action}>
            <BoardActionsPopover
              defaultData={{ name: currentBoardName }}
              canEdit={false}
              canDelete={false}
              canLeave={false}
              onUpdate={() => {}}
              onDelete={() => {}}
              onLeave={() => {}}
              onExportCsv={handleExportCsv}
            >
              <Button
                color="brand"
                variant="tertiary"
                size="small"
                icon={<Icon name="more_horiz" type="outlined" size="small" />}
              />
            </BoardActionsPopover>
          </div>
        </div>

        <ShareModal
          key={isShareModalOpen ? 'open' : 'closed'} // [WORKAROUND] To avoid previous search input to appear again after opening the modal
          // TODO: should be adjusted to avoid letting inviting random email since it has no reality then (ref: https://github.com/suitenumerique/ui-kit/issues/151)
          // for now we are using `patch-package` to fix this
          isOpen={isShareModalOpen}
          onClose={handleShareModalClose}
          modalTitle={t('common.boardPermissions', {
            context: 'title',
          })}
          canUpdate={canEditMemberships}
          canView
          accesses={modalMembers}
          invitationRoles={[
            {
              label: t('common.editor'),
              value: BoardMembershipRoles.EDITOR,
            },
            {
              label: t('common.owner'),
              value: BoardMembershipRoles.OWNER,
            },
            {
              label: t('common.viewer'),
              value: BoardMembershipRoles.VIEWER,
            },
            {
              label: t('common.commenter'),
              value: 'commenter',
            },
          ]}
          onDeleteAccess={(e) => {
            onMembershipDelete(e.id);
          }}
          onDeleteInvitation={() => {}}
          onUpdateInvitation={() => {}}
          onUpdateAccess={(e, role) => {
            const membership = boardMemberships.find((m) => m.id === e.id);
            if (
              membership &&
              membership.user.id === currentUser.id &&
              membership.role === BoardMembershipRoles.OWNER
            ) {
              return;
            }

            onMembershipUpdate(
              e.id,
              // Replace the virtual commenter role if needed
              role === 'commenter'
                ? {
                    role: BoardMembershipRoles.VIEWER,
                    canComment: true,
                  }
                : {
                    role,
                    canComment: null,
                  },
            );
          }}
          onSearchUsers={debouncedHandleUsersQuery}
          loading={isSearchingUsers}
          hasNextMembers={false}
          hasNextInvitations={false}
          searchUsersResult={formattedSearchedUsers}
          onInviteUser={(users, role) => {
            users.forEach((user) => {
              if (boardMemberships.some((m) => m.userId === user.id)) {
                return;
              }
              onMembershipCreate({
                userId: user.id,
                ...// Replace the virtual commenter role if needed
                (role === 'commenter'
                  ? {
                      role: BoardMembershipRoles.VIEWER,
                      canComment: true,
                    }
                  : {
                      role,
                      canComment: null,
                    }),
              });
            });
          }}
          outsideSearchContent={
            <ShareModalCopyLinkFooter
              onCopyLink={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              onOk={() => {
                handleShareModalClose();
              }}
            />
          }
          linkSettings={canEditMemberships}
          linkReach={isBoardPublic ? 'public' : 'restricted'}
          linkReachChoices={[
            {
              value: 'public',
            },
            {
              value: 'restricted',
            },
          ]}
          onUpdateLinkReach={(value) => {
            handleUpdate({ isPublic: value === 'public' });
          }}
        />
      </div>
    );
  },
);

BoardActions.propTypes = {
  currentUser: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  currentBoardId: PropTypes.string.isRequired,
  currentBoardName: PropTypes.string.isRequired,
  filterText: PropTypes.string.isRequired,
  /* eslint-disable react/forbid-prop-types */
  filterUsers: PropTypes.array.isRequired,
  includeCardsWithoutMembers: PropTypes.bool.isRequired,
  boardLabels: PropTypes.array.isRequired,
  filterLabels: PropTypes.array.isRequired,
  includeCardsWithoutLabels: PropTypes.bool.isRequired,
  boardMemberships: PropTypes.array.isRequired,
  searchedUsers: PropTypes.array.isRequired,
  isSearchingUsers: PropTypes.bool.isRequired,
  /* eslint-enable react/forbid-prop-types */
  canEdit: PropTypes.bool.isRequired,
  canEditMemberships: PropTypes.bool.isRequired,
  canSeeMemberships: PropTypes.bool.isRequired,
  cards: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  lists: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  isBoardPublic: PropTypes.bool.isRequired,
  onTextFilterUpdate: PropTypes.func.isRequired,
  onUserToFilterAdd: PropTypes.func.isRequired,
  onUserFromFilterRemove: PropTypes.func.isRequired,
  onLabelToFilterAdd: PropTypes.func.isRequired,
  onLabelFromFilterRemove: PropTypes.func.isRequired,
  onLabelCreate: PropTypes.func.isRequired,
  onLabelUpdate: PropTypes.func.isRequired,
  onLabelMove: PropTypes.func.isRequired,
  onLabelDelete: PropTypes.func.isRequired,
  onMembershipCreate: PropTypes.func.isRequired,
  onMembershipUpdate: PropTypes.func.isRequired,
  onMembershipDelete: PropTypes.func.isRequired,
  onBoardUpdate: PropTypes.func.isRequired,
  onSearchUsers: PropTypes.func.isRequired,
  onClearUserSearch: PropTypes.func.isRequired,
};

export default BoardActions;
