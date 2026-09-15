// Guards the source-board authorization on duplicate (mirrors boards/show.js).

const { expect } = require('chai');

const BASE_URL = 'http://localhost:1337';

// The sails-disk test adapter ignores the declared string auto-increment pks
// and generates numeric ids, which breaks Waterline association validation
// inside the duplicate helper. Pre-assign unique string ids on create.
let shimCounter = 9000000;
const shimStringAutoIds = (...modelIdentities) => {
  modelIdentities.forEach((identity) => {
    const model = sails.models[identity];
    const originalCreate = model.create.bind(model);

    model.create = function patchedCreate(record, ...rest) {
      let patchedRecord = record;

      if (
        record &&
        typeof record === 'object' &&
        !Array.isArray(record) &&
        record.id === undefined
      ) {
        shimCounter += 1;
        patchedRecord = { ...record, id: String(shimCounter) };
      }

      return originalCreate(patchedRecord, ...rest);
    };
  });
};

describe('boards/duplicate authorization', () => {
  const ATTACKER_ID = '3000001';
  const VICTIM_ID = '3000002';
  const VICTIM_PROJECT_ID = '3000003';
  const VICTIM_BOARD_ID = '3000004';
  const VICTIM_LIST_ID = '3000005';
  const VICTIM_CARD_ID = '3000006';
  const ATTACKER_PROJECT_ID = '3000008';

  const SECRET_DESCRIPTION = 'ACQ-SECRET: buyout of Contoso at 42 EUR/share — Q4';

  let attackerToken;
  let victimToken;

  before(async () => {
    shimStringAutoIds(
      'board',
      'boardmembership',
      'label',
      'list',
      'card',
      'cardlabel',
      'task',
      'attachment',
      'userboardpreference',
    );

    await User.createEach([
      {
        id: ATTACKER_ID,
        email: 'attacker-pm@example.net',
        password: 'attacker-password-1',
        name: 'Attacker PM',
        isAdmin: false,
      },
      {
        id: VICTIM_ID,
        email: 'victim-owner@example.net',
        password: 'victim-password-1',
        name: 'Victim Owner',
        isAdmin: false,
      },
    ]);

    const attackerJwt = sails.helpers.utils.createJwtToken(ATTACKER_ID);
    await Session.create({
      accessToken: attackerJwt.token,
      httpOnlyToken: null,
      userId: ATTACKER_ID,
      remoteAddress: '127.0.0.1',
    });
    attackerToken = attackerJwt.token;

    const victimJwt = sails.helpers.utils.createJwtToken(VICTIM_ID);
    await Session.create({
      accessToken: victimJwt.token,
      httpOnlyToken: null,
      userId: VICTIM_ID,
      remoteAddress: '127.0.0.1',
    });
    victimToken = victimJwt.token;

    await Project.create({ id: VICTIM_PROJECT_ID, name: 'Victim Project' });
    await ProjectManager.create({
      id: '3000010',
      projectId: VICTIM_PROJECT_ID,
      userId: VICTIM_ID,
    });
    await Board.create({
      id: VICTIM_BOARD_ID,
      projectId: VICTIM_PROJECT_ID,
      name: 'Victim Private Board',
      position: 65535,
      isPublic: false,
    });
    await BoardMembership.create({
      id: '3000007',
      boardId: VICTIM_BOARD_ID,
      userId: VICTIM_ID,
      role: 'owner',
    });
    await List.create({
      id: VICTIM_LIST_ID,
      boardId: VICTIM_BOARD_ID,
      name: 'M&A Pipeline',
      position: 65535,
    });
    await Card.create({
      id: VICTIM_CARD_ID,
      boardId: VICTIM_BOARD_ID,
      listId: VICTIM_LIST_ID,
      name: 'Contoso acquisition',
      description: SECRET_DESCRIPTION,
      position: 65535,
    });

    await Project.create({ id: ATTACKER_PROJECT_ID, name: 'Attacker Project' });
    await ProjectManager.create({
      id: '3000009',
      projectId: ATTACKER_PROJECT_ID,
      userId: ATTACKER_ID,
    });
  });

  // The suite shares one lifted sails app: clean up everything this spec created.
  after(async () => {
    const boardIds = [VICTIM_BOARD_ID];
    const copiedBoards = await Board.find({
      projectId: VICTIM_PROJECT_ID,
      id: { '!=': VICTIM_BOARD_ID },
    });
    copiedBoards.forEach((board) => boardIds.push(board.id));

    await Promise.all([
      User.destroy([ATTACKER_ID, VICTIM_ID]),
      Session.destroy({ userId: [ATTACKER_ID, VICTIM_ID] }),
      Project.destroy([VICTIM_PROJECT_ID, ATTACKER_PROJECT_ID]),
      ProjectManager.destroy({ userId: [ATTACKER_ID, VICTIM_ID] }),
      Board.destroy(boardIds),
      BoardMembership.destroy({ boardId: boardIds }),
      List.destroy({ boardId: boardIds }),
      Card.destroy({ boardId: boardIds }),
    ]);
  });

  it('does not grant the attacker direct read access to the private board (control)', async () => {
    const response = await fetch(`${BASE_URL}/api/boards/${VICTIM_BOARD_ID}`, {
      headers: { Authorization: `Bearer ${attackerToken}` },
    });

    expect(response.status).to.equal(404);
  });

  it('refuses to duplicate a private board the caller has no access to', async () => {
    const boardsInAttackerProjectBefore = await Board.count({
      projectId: ATTACKER_PROJECT_ID,
    });

    const duplicate = await fetch(`${BASE_URL}/api/boards/${VICTIM_BOARD_ID}/duplicate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attackerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetProjectId: ATTACKER_PROJECT_ID }),
    });

    expect(duplicate.status).to.equal(404);

    const boardsInAttackerProjectAfter = await Board.count({
      projectId: ATTACKER_PROJECT_ID,
    });
    expect(boardsInAttackerProjectAfter).to.equal(boardsInAttackerProjectBefore);
  });

  it('lets a project manager duplicate their own board into their project', async () => {
    const duplicate = await fetch(`${BASE_URL}/api/boards/${VICTIM_BOARD_ID}/duplicate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${victimToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetProjectId: VICTIM_PROJECT_ID }),
    });

    expect(duplicate.status).to.equal(200);

    const { item: copy } = await duplicate.json();
    expect(copy.name).to.equal('Victim Private Board');

    const readBack = await fetch(`${BASE_URL}/api/boards/${copy.id}`, {
      headers: { Authorization: `Bearer ${victimToken}` },
    });

    expect(readBack.status).to.equal(200);

    const body = await readBack.json();

    const copiedCard = body.included.cards.find((card) => card.name === 'Contoso acquisition');

    expect(copiedCard).to.not.equal(undefined);
    expect(copiedCard.description).to.equal(SECRET_DESCRIPTION);
    expect(body.included.lists.map((list) => list.name)).to.include('M&A Pipeline');
  });
});
