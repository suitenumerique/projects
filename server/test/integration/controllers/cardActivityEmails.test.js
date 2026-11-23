// Emails sent to card subscribers when a card is moved or its description edited,
// and to assignees, each following its own preference.

const { expect } = require('chai');

const BASE_URL = 'http://localhost:1337';

describe('card activity emails', () => {
  const ACTOR_ID = '4200001';
  const SUBSCRIBER_ID = '4200002';
  const MEMBER_ID = '4200003';
  const USER_IDS = [ACTOR_ID, SUBSCRIBER_ID, MEMBER_ID];

  const PROJECT_ID = '4200010';
  const BOARD_ID = '4200011';
  const FROM_LIST_ID = '4200012';
  const TO_LIST_ID = '4200013';
  const CARD_ID = '4200014';

  const tokens = {};
  let sentEmails;

  const emailOf = (userId) => `card-activity-${userId}@example.net`;
  const emailTo = (userId) => sentEmails.find(({ to }) => to === emailOf(userId));

  const request = async (method, path, body) => {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${tokens[ACTOR_ID]}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    expect(response.status).to.equal(200);

    return response.json();
  };

  const updateCard = (values) => request('PATCH', `/api/cards/${CARD_ID}`, values);

  // Emails are sent without being awaited: wait until the expected ones are out,
  // then give stray ones time to (wrongly) go out.
  const settleEmails = async (count) => {
    for (let attempt = 0; attempt < 50 && sentEmails.length < count; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });

    return sentEmails;
  };

  // See commentMentions.test.js: give actions created through the API string ids.
  let originalActionBeforeCreate;
  let nextActionId = 4200100;

  let smtp;
  let originalIsActive;
  let originalGetTransporter;

  before(async () => {
    /* eslint-disable no-underscore-dangle */
    originalActionBeforeCreate = Action._callbacks.beforeCreate;
    Action._callbacks.beforeCreate = (values, proceed) => {
      if (!values.id) {
        nextActionId += 1;
        values.id = String(nextActionId); // eslint-disable-line no-param-reassign
      }

      return originalActionBeforeCreate ? originalActionBeforeCreate(values, proceed) : proceed();
    };
    /* eslint-enable no-underscore-dangle */

    await User.createEach(
      USER_IDS.map((id) => ({
        id,
        email: emailOf(id),
        password: 'card-activity-password-1',
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

    await Project.create({ id: PROJECT_ID, name: 'Activity Project' });
    await Board.create({
      id: BOARD_ID,
      projectId: PROJECT_ID,
      name: 'Activity Board',
      position: 65535,
      isPublic: false,
    });
    await BoardMembership.createEach([
      { id: '4200020', boardId: BOARD_ID, userId: ACTOR_ID, role: 'editor' },
      { id: '4200021', boardId: BOARD_ID, userId: SUBSCRIBER_ID, role: 'editor' },
      { id: '4200022', boardId: BOARD_ID, userId: MEMBER_ID, role: 'editor' },
    ]);
    await List.createEach([
      { id: FROM_LIST_ID, boardId: BOARD_ID, name: 'To do', position: 65535 },
      { id: TO_LIST_ID, boardId: BOARD_ID, name: 'Done', position: 131070 },
    ]);
  });

  beforeEach(async () => {
    sentEmails = [];
    ({ smtp } = sails.hooks);
    originalIsActive = smtp.isActive;
    originalGetTransporter = smtp.getTransporter;

    smtp.isActive = () => true;
    smtp.getTransporter = () => ({
      sendMail: async (email) => {
        sentEmails.push(email);
        return { messageId: 'test' };
      },
    });

    await Card.create({
      id: CARD_ID,
      boardId: BOARD_ID,
      listId: FROM_LIST_ID,
      name: 'Card',
      position: 65535,
      description: 'First version',
    });
    await CardSubscription.create({ id: '4200030', cardId: CARD_ID, userId: SUBSCRIBER_ID });
  });

  afterEach(async () => {
    smtp.isActive = originalIsActive;
    smtp.getTransporter = originalGetTransporter;

    await Promise.all([
      Card.destroy({ id: CARD_ID }),
      CardSubscription.destroy({ cardId: CARD_ID }),
      CardMembership.destroy({ cardId: CARD_ID }),
      Action.destroy({ cardId: CARD_ID }),
      Notification.destroy({ cardId: CARD_ID }),
      User.update({ id: USER_IDS }).set({
        notifyMentionsByEmail: true,
        notifyAssignmentsByEmail: true,
        notifySubscribedCardsByEmail: true,
      }),
    ]);
  });

  after(async () => {
    /* eslint-disable no-underscore-dangle */
    if (originalActionBeforeCreate) {
      Action._callbacks.beforeCreate = originalActionBeforeCreate;
    } else {
      delete Action._callbacks.beforeCreate;
    }
    /* eslint-enable no-underscore-dangle */

    await Promise.all([
      User.destroy(USER_IDS),
      Session.destroy({ userId: USER_IDS }),
      Project.destroy(PROJECT_ID),
      Board.destroy(BOARD_ID),
      BoardMembership.destroy({ boardId: BOARD_ID }),
      List.destroy({ boardId: BOARD_ID }),
    ]);
  });

  describe('moving a card to another list', () => {
    it('emails subscribers with both list names', async () => {
      await updateCard({ listId: TO_LIST_ID, position: 65535 });

      await settleEmails(1);

      expect(sentEmails).to.have.lengthOf(1);
      expect(emailTo(SUBSCRIBER_ID).subject).to.equal(`User ${ACTOR_ID} a déplacé « Card »`);
      expect(emailTo(SUBSCRIBER_ID).html).to.include('<strong>To do</strong>');
      expect(emailTo(SUBSCRIBER_ID).html).to.include('<strong>Done</strong>');
    });

    it('skips subscribers who turned subscribed cards emails off, keeping the notification', async () => {
      await User.updateOne({ id: SUBSCRIBER_ID }).set({ notifySubscribedCardsByEmail: false });

      await updateCard({ listId: TO_LIST_ID, position: 65535 });

      expect(await settleEmails(0)).to.have.lengthOf(0);
      expect(await Notification.count({ cardId: CARD_ID, userId: SUBSCRIBER_ID })).to.equal(1);
    });

    it('sends nothing when the card only changes position in its list', async () => {
      await updateCard({ position: 131070 });

      expect(await settleEmails(0)).to.have.lengthOf(0);
    });
  });

  describe('editing the description', () => {
    it('emails subscribers', async () => {
      await updateCard({ description: 'Second version' });

      await settleEmails(1);

      expect(sentEmails).to.have.lengthOf(1);
      expect(emailTo(SUBSCRIBER_ID).subject).to.equal(
        `User ${ACTOR_ID} a modifié la description de « Card »`,
      );
      expect(await Action.count({ cardId: CARD_ID, type: 'updateDescription' })).to.equal(1);
    });

    it('also counts clearing the description as a change', async () => {
      await updateCard({ description: null });

      expect(await settleEmails(1)).to.have.lengthOf(1);
    });

    it('records nothing when the description is unchanged', async () => {
      await updateCard({ description: 'First version' });

      expect(await settleEmails(0)).to.have.lengthOf(0);
      expect(await Action.count({ cardId: CARD_ID, type: 'updateDescription' })).to.equal(0);
    });

    it('skips subscribers who turned subscribed cards emails off', async () => {
      await User.updateOne({ id: SUBSCRIBER_ID }).set({ notifySubscribedCardsByEmail: false });

      await updateCard({ description: 'Second version' });

      expect(await settleEmails(0)).to.have.lengthOf(0);
    });
  });

  describe('assigning a card', () => {
    const assign = (userId) => request('POST', `/api/cards/${CARD_ID}/memberships`, { userId });

    it('emails the assignee', async () => {
      await assign(MEMBER_ID);

      await settleEmails(1);

      expect(sentEmails).to.have.lengthOf(1);
      expect(emailTo(MEMBER_ID).subject).to.equal(`User ${ACTOR_ID} vous a assigné « Card »`);
      expect(emailTo(MEMBER_ID).html).to.include('Voir la carte');
      expect(emailTo(MEMBER_ID).html).to.include(
        'Vous recevez cet e-mail car une carte vous a été assignée dans Projets.',
      );
    });

    it('shows the assignment in the card thread, among comments', async () => {
      await assign(MEMBER_ID);
      await settleEmails(1);

      const response = await fetch(`${BASE_URL}/api/cards/${CARD_ID}/actions`, {
        headers: { Authorization: `Bearer ${tokens[ACTOR_ID]}` },
      });
      const { items } = await response.json();

      expect(items.map(({ type }) => type)).to.deep.equal(['addMemberToCard']);
    });

    it('follows the assignments preference, not the subscribed cards one', async () => {
      await User.updateOne({ id: MEMBER_ID }).set({ notifySubscribedCardsByEmail: false });
      await assign(MEMBER_ID);
      await settleEmails(1);
      expect(sentEmails).to.have.lengthOf(1);

      await CardMembership.destroy({ cardId: CARD_ID });
      sentEmails = [];

      await User.updateOne({ id: MEMBER_ID }).set({
        notifySubscribedCardsByEmail: true,
        notifyAssignmentsByEmail: false,
      });
      await assign(MEMBER_ID);
      expect(await settleEmails(0)).to.have.lengthOf(0);
    });
  });
});
