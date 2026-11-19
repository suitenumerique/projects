// Favorite boards: a per-user flag on the board preference, set through PATCH /api/boards/:id.

const { expect } = require('chai');

const BASE_URL = 'http://localhost:1337';

describe('boards/update favorite', () => {
  const USER_ID = '4200001';
  const OTHER_USER_ID = '4200002';
  const USER_IDS = [USER_ID, OTHER_USER_ID];

  const PROJECT_ID = '4200010';
  const BOARD_ID = '4200011';
  const OTHER_BOARD_ID = '4200012';
  const BOARD_IDS = [BOARD_ID, OTHER_BOARD_ID];

  const FOLDER_ID = '4200020';

  const tokens = {};

  const updateBoard = (userId, boardId, body) =>
    fetch(`${BASE_URL}/api/boards/${boardId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokens[userId]}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

  const findPreference = (userId, boardId) => UserBoardPreference.findOne({ userId, boardId });

  before(async () => {
    await User.createEach(
      USER_IDS.map((id) => ({
        id,
        email: `boards-favorite-${id}@example.net`,
        password: 'favorite-password-1',
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

    await Project.create({ id: PROJECT_ID, name: 'Favorite Project' });
    await Board.createEach(
      BOARD_IDS.map((id) => ({
        id,
        projectId: PROJECT_ID,
        name: `Board ${id}`,
        position: 65535,
        isPublic: true,
      })),
    );
  });

  // Each test starts from the same preferences: the first board sits in a
  // folder, the other one has no preference yet.
  beforeEach(async () => {
    await UserBoardPreference.destroy({ boardId: BOARD_IDS });
    await UserBoardPreference.createEach([
      {
        id: '4200030',
        userId: USER_ID,
        boardId: BOARD_ID,
        folderId: FOLDER_ID,
        position: 131070,
      },
      {
        id: '4200031',
        userId: OTHER_USER_ID,
        boardId: BOARD_ID,
        position: 65535,
      },
    ]);
  });

  after(async () => {
    await Promise.all([
      User.destroy(USER_IDS),
      Session.destroy({ userId: USER_IDS }),
      Project.destroy(PROJECT_ID),
      Board.destroy(BOARD_IDS),
      UserBoardPreference.destroy({ boardId: BOARD_IDS }),
    ]);
  });

  it('adds and removes a favorite without touching folder and position', async () => {
    const response = await updateBoard(USER_ID, BOARD_ID, { isFavorite: true });
    expect(response.status).to.equal(200);

    const { included } = await response.json();
    expect(included.userBoardPreferences).to.have.lengthOf(1);
    expect(included.userBoardPreferences[0]).to.include({
      boardId: BOARD_ID,
      isFavorite: true,
      folderId: FOLDER_ID,
      position: 131070,
    });

    expect((await updateBoard(USER_ID, BOARD_ID, { isFavorite: false })).status).to.equal(200);
    expect(await findPreference(USER_ID, BOARD_ID)).to.include({
      isFavorite: false,
      folderId: FOLDER_ID,
      position: 131070,
    });
  });

  it('only changes the favorite of the current user', async () => {
    await updateBoard(USER_ID, BOARD_ID, { isFavorite: true });

    expect((await findPreference(OTHER_USER_ID, BOARD_ID)).isFavorite).to.equal(false);
  });

  it('creates the preference when the board has none yet', async () => {
    const response = await updateBoard(USER_ID, OTHER_BOARD_ID, { isFavorite: true });
    expect(response.status).to.equal(200);

    expect((await findPreference(USER_ID, OTHER_BOARD_ID)).isFavorite).to.equal(true);
  });

  it('keeps the favorite when moving the board to another folder', async () => {
    await updateBoard(USER_ID, BOARD_ID, { isFavorite: true });
    await updateBoard(USER_ID, BOARD_ID, { folderId: null, position: 0 });

    expect(await findPreference(USER_ID, BOARD_ID)).to.include({
      isFavorite: true,
      folderId: null,
    });
  });

  it('rejects a non-boolean favorite', async () => {
    expect((await updateBoard(USER_ID, BOARD_ID, { isFavorite: 'yes' })).status).to.equal(400);
  });
});
