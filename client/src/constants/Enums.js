export const BoardMembershipRoles = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const ListSortTypes = {
  NAME_ASC: 'name_asc',
  DUE_DATE_ASC: 'dueDate_asc',
  CREATED_AT_ASC: 'createdAt_asc',
  CREATED_AT_DESC: 'createdAt_desc',
};

export const ActivityTypes = {
  CREATE_CARD: 'createCard',
  MOVE_CARD: 'moveCard',
  COMMENT_CARD: 'commentCard',
  ADD_MEMBER_TO_CARD: 'addMemberToCard',
  CHANGE_DUE_DATE: 'changeDueDate',
  ADD_ATTACHMENT: 'addAttachment',
  UPDATE_DESCRIPTION: 'updateDescription',
};
