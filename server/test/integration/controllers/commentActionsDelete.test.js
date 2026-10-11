// Guards who may delete a comment: board owners any comment, others only their own (with rights).

const { expect } = require('chai');

const BASE_URL = 'http://localhost:1337';

describe('comment-actions/delete authorization', () => {
  const OWNER_ID = '4000001';
  const EDITOR_ID = '4000002';
  const COMMENTER_ID = '4000003';
  const VIEWER_ID = '4000004';
  const USER_IDS = [OWNER_ID, EDITOR_ID, COMMENTER_ID, VIEWER_ID];

  const PROJECT_ID = '4000010';
  const BOARD_ID = '4000011';
  const LIST_ID = '4000012';
  const CARD_ID = '4000013';

  const tokens = {};
  let nextActionId = 4000100;

  const createComment = async (userId) => {
    nextActionId += 1;

    return Action.create({
      id: String(nextActionId),
      type: Action.Types.COMMENT_CARD,
      data: { text: 'Hello' },
      cardId: CARD_ID,
      userId,
    }).fetch();
  };

  const deleteComment = (commentId, userId) =>
    fetch(`${BASE_URL}/api/comment-actions/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokens[userId]}` },
    });

  before(async () => {
    await User.createEach(
      USER_IDS.map((id) => ({
        id,
        email: `comment-delete-${id}@example.net`,
        password: 'comment-password-1',
        name: `User ${id}`,
        isAdmin: false,
      })),
    );

    await Promise.all(
      USER_IDS.map(async (userId) => {
        const jwt = sails.helpers.utils.createJwtToken(userId);
        await Session.create({
          accessToken: jwt.token,
          httpOnlyToken: null,
          userId,
          remoteAddress: '127.0.0.1',
        });
        tokens[userId] = jwt.token;
      }),
    );

    // no project manager: mirrors org mode, where org projects are created without one
    await Project.create({ id: PROJECT_ID, name: 'Comment Project' });
    await Board.create({
      id: BOARD_ID,
      projectId: PROJECT_ID,
      name: 'Comment Board',
      position: 65535,
      isPublic: false,
    });
    await BoardMembership.createEach([
      { id: '4000020', boardId: BOARD_ID, userId: OWNER_ID, role: 'owner' },
      { id: '4000021', boardId: BOARD_ID, userId: EDITOR_ID, role: 'editor' },
      {
        id: '4000022',
        boardId: BOARD_ID,
        userId: COMMENTER_ID,
        role: 'viewer',
        canComment: true,
      },
      {
        id: '4000023',
        boardId: BOARD_ID,
        userId: VIEWER_ID,
        role: 'viewer',
        canComment: false,
      },
    ]);
    await List.create({ id: LIST_ID, boardId: BOARD_ID, name: 'List', position: 65535 });
    await Card.create({
      id: CARD_ID,
      boardId: BOARD_ID,
      listId: LIST_ID,
      name: 'Card',
      position: 65535,
    });
  });

  // The suite shares one lifted sails app: clean up everything this spec created.
  after(async () => {
    await Promise.all([
      User.destroy(USER_IDS),
      Session.destroy({ userId: USER_IDS }),
      Project.destroy(PROJECT_ID),
      Board.destroy(BOARD_ID),
      BoardMembership.destroy({ boardId: BOARD_ID }),
      List.destroy({ boardId: BOARD_ID }),
      Card.destroy({ boardId: BOARD_ID }),
      Action.destroy({ cardId: CARD_ID }),
    ]);
  });

  it("lets a board owner delete someone else's comment", async () => {
    const comment = await createComment(EDITOR_ID);

    const response = await deleteComment(comment.id, OWNER_ID);

    expect(response.status).to.equal(200);
    expect(await Action.findOne(comment.id)).to.equal(undefined);
  });

  it("refuses an editor deleting someone else's comment", async () => {
    const comment = await createComment(OWNER_ID);

    const response = await deleteComment(comment.id, EDITOR_ID);

    expect(response.status).to.equal(404);
    expect(await Action.findOne(comment.id)).to.not.equal(undefined);
  });

  it('lets a viewer who can comment delete their own comment', async () => {
    const comment = await createComment(COMMENTER_ID);

    const response = await deleteComment(comment.id, COMMENTER_ID);

    expect(response.status).to.equal(200);
  });

  it("refuses a viewer who can comment deleting someone else's comment", async () => {
    const comment = await createComment(EDITOR_ID);

    const response = await deleteComment(comment.id, COMMENTER_ID);

    expect(response.status).to.equal(404);
  });

  it('refuses a viewer who cannot comment deleting their own comment', async () => {
    const comment = await createComment(VIEWER_ID);

    const response = await deleteComment(comment.id, VIEWER_ID);

    expect(response.status).to.equal(403);
  });
});
