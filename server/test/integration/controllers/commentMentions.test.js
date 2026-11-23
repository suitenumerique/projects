// Comment mentions (`@[Name](userId)`): who gets notified on create and edit, and the email sent.

const { expect } = require('chai');

const BASE_URL = 'http://localhost:1337';

describe('comment mentions', () => {
  const AUTHOR_ID = '4100001';
  const MEMBER_ID = '4100002';
  const SUBSCRIBER_ID = '4100003';
  const OTHER_MEMBER_ID = '4100004';
  const OUTSIDER_ID = '4100005';
  const USER_IDS = [AUTHOR_ID, MEMBER_ID, SUBSCRIBER_ID, OTHER_MEMBER_ID, OUTSIDER_ID];

  const PROJECT_ID = '4100010';
  const BOARD_ID = '4100011';
  const LIST_ID = '4100012';
  const CARD_ID = '4100013';

  const tokens = {};

  const mention = (userId) => `@[User ${userId}](${userId})`;

  const request = (method, path, userId, body) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${tokens[userId]}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

  const createComment = async (text) => {
    const response = await request('POST', `/api/cards/${CARD_ID}/comment-actions`, AUTHOR_ID, {
      text,
    });
    expect(response.status).to.equal(200);

    return (await response.json()).item;
  };

  const updateComment = async (id, text) => {
    const response = await request('PATCH', `/api/comment-actions/${id}`, AUTHOR_ID, { text });
    expect(response.status).to.equal(200);

    return (await response.json()).item;
  };

  const notifiedUserIds = async (actionId) =>
    (await Notification.find({ actionId })).map(({ userId }) => userId).sort();

  // sails-disk auto-increments numeric ids where Postgres gives string ids, which
  // `Notification.actionId` rejects: give actions created through the API string ids.
  let originalActionBeforeCreate;
  let nextActionId = 4100100;

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
        email: `comment-mentions-${id}@example.net`,
        password: 'mention-password-1',
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

    await Project.create({ id: PROJECT_ID, name: 'Mention Project' });
    await Board.create({
      id: BOARD_ID,
      projectId: PROJECT_ID,
      name: 'Mention Board',
      position: 65535,
      isPublic: false,
    });
    // OUTSIDER_ID is deliberately not a member of the board
    await BoardMembership.createEach([
      { id: '4100020', boardId: BOARD_ID, userId: AUTHOR_ID, role: 'editor' },
      { id: '4100021', boardId: BOARD_ID, userId: MEMBER_ID, role: 'editor' },
      { id: '4100022', boardId: BOARD_ID, userId: SUBSCRIBER_ID, role: 'editor' },
      {
        id: '4100023',
        boardId: BOARD_ID,
        userId: OTHER_MEMBER_ID,
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
    await CardSubscription.create({ id: '4100030', cardId: CARD_ID, userId: SUBSCRIBER_ID });
  });

  afterEach(async () => {
    await Notification.destroy({ cardId: CARD_ID });
  });

  // The suite shares one lifted sails app: clean up everything this spec created.
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
      Card.destroy({ boardId: BOARD_ID }),
      CardSubscription.destroy({ cardId: CARD_ID }),
      Action.destroy({ cardId: CARD_ID }),
      Notification.destroy({ cardId: CARD_ID }),
    ]);
  });

  describe('on create', () => {
    it('notifies mentioned board members on top of card subscribers', async () => {
      const comment = await createComment(`Hi ${mention(MEMBER_ID)}`);

      expect(await notifiedUserIds(comment.id)).to.deep.equal([MEMBER_ID, SUBSCRIBER_ID]);
    });

    it('notifies a mentioned member even without the right to comment', async () => {
      const comment = await createComment(`FYI ${mention(OTHER_MEMBER_ID)}`);

      expect(await notifiedUserIds(comment.id)).to.deep.equal([SUBSCRIBER_ID, OTHER_MEMBER_ID]);
    });

    it('sends a single notification to a mentioned subscriber', async () => {
      const comment = await createComment(
        `${mention(SUBSCRIBER_ID)} and again ${mention(SUBSCRIBER_ID)}`,
      );

      expect(await notifiedUserIds(comment.id)).to.deep.equal([SUBSCRIBER_ID]);
    });

    it('ignores the author mentioning themselves', async () => {
      const comment = await createComment(`Note to self ${mention(AUTHOR_ID)}`);

      expect(await notifiedUserIds(comment.id)).to.deep.equal([SUBSCRIBER_ID]);
    });

    it('ignores mentions of users who are not board members', async () => {
      const comment = await createComment(`Hey ${mention(OUTSIDER_ID)} and @[Ghost](4199999)`);

      expect(await notifiedUserIds(comment.id)).to.deep.equal([SUBSCRIBER_ID]);
    });
  });

  describe('on edit', () => {
    it('notifies only users who were not mentioned before', async () => {
      const comment = await createComment(`Hi ${mention(MEMBER_ID)}`);
      await Notification.destroy({ actionId: comment.id });

      await updateComment(comment.id, `Hi ${mention(MEMBER_ID)} and ${mention(OTHER_MEMBER_ID)}`);

      expect(await notifiedUserIds(comment.id)).to.deep.equal([OTHER_MEMBER_ID]);
    });

    it('notifies nobody when no mention is added', async () => {
      const comment = await createComment(`Hi ${mention(MEMBER_ID)}`);
      await Notification.destroy({ actionId: comment.id });

      await updateComment(comment.id, `Hello ${mention(MEMBER_ID)}, typo fixed`);

      expect(await notifiedUserIds(comment.id)).to.deep.equal([]);
    });

    it('ignores the author and non-members added on edit', async () => {
      const comment = await createComment('Hi');
      await Notification.destroy({ actionId: comment.id });

      await updateComment(comment.id, `Hi ${mention(AUTHOR_ID)} ${mention(OUTSIDER_ID)}`);

      expect(await notifiedUserIds(comment.id)).to.deep.equal([]);
    });
  });

  describe('emails', () => {
    let smtp;
    let originalIsActive;
    let originalGetTransporter;
    let sentEmails;

    // Emails are sent without being awaited: wait until the expected ones are out.
    const waitForEmails = async (count) => {
      for (let attempt = 0; attempt < 50 && sentEmails.length < count; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });
      }

      return sentEmails;
    };

    const emailTo = (userId) =>
      sentEmails.find(({ to }) => to === `comment-mentions-${userId}@example.net`);

    beforeEach(() => {
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
    });

    // Emails that should not be sent: give them time to (wrongly) go out.
    const waitForStrayEmails = () =>
      new Promise((resolve) => {
        setTimeout(resolve, 200);
      });

    const setPreferences = (userId, values) => User.updateOne({ id: userId }).set(values);

    afterEach(async () => {
      smtp.isActive = originalIsActive;
      smtp.getTransporter = originalGetTransporter;

      await User.update({ id: USER_IDS }).set({
        notifyMentionsByEmail: true,
        notifySubscribedCardsByEmail: true,
      });
    });

    it('sends a mention email quoting the escaped comment, and a plain one to subscribers', async () => {
      await createComment(`Look <b>here</b> ${mention(MEMBER_ID)}\nthanks`);

      await waitForEmails(2);

      const mentionEmail = emailTo(MEMBER_ID);
      expect(mentionEmail.subject).to.equal(`User ${AUTHOR_ID} vous a mentionné dans « Card »`);
      expect(mentionEmail.html).to.include(
        `Look &lt;b&gt;here&lt;/b&gt; @User ${MEMBER_ID}<br>thanks`,
      );
      expect(mentionEmail.html).to.not.include('<b>here</b>');
      expect(mentionEmail.html).to.not.include(`(${MEMBER_ID})`);

      expect(emailTo(SUBSCRIBER_ID).subject).to.equal(`User ${AUTHOR_ID} a commenté « Card »`);
    });

    it('explains in the footer why each email was sent, with a link to the settings', async () => {
      await createComment(`Hi ${mention(MEMBER_ID)}`);

      await waitForEmails(2);

      expect(emailTo(MEMBER_ID).html).to.include(
        'Vous recevez cet e-mail car vous avez été mentionné(e) dans Projets.',
      );
      expect(emailTo(SUBSCRIBER_ID).html).to.include(
        'Vous recevez cet e-mail car vous suivez cette carte dans Projets.',
      );
      expect(emailTo(MEMBER_ID).html).to.include('/?modal=user-settings');
      expect(emailTo(MEMBER_ID).html).to.include('Gérer mes notifications par e-mail');
    });

    it('skips mention emails for users who turned them off, keeping subscriber emails', async () => {
      await setPreferences(MEMBER_ID, { notifyMentionsByEmail: false });
      await setPreferences(SUBSCRIBER_ID, { notifyMentionsByEmail: false });

      const comment = await createComment(`${mention(MEMBER_ID)} ${mention(SUBSCRIBER_ID)}`);

      await waitForEmails(1);
      await waitForStrayEmails();

      // A mentioned subscriber still gets the subscribed cards email.
      expect(sentEmails).to.have.lengthOf(1);
      expect(emailTo(SUBSCRIBER_ID).subject).to.equal(`User ${AUTHOR_ID} a commenté « Card »`);

      // The notification center is always notified.
      expect(await notifiedUserIds(comment.id)).to.deep.equal([MEMBER_ID, SUBSCRIBER_ID]);
    });

    it('skips subscribed cards emails for users who turned them off', async () => {
      await setPreferences(SUBSCRIBER_ID, { notifySubscribedCardsByEmail: false });

      const comment = await createComment(`Hello ${mention(MEMBER_ID)}`);

      await waitForEmails(1);
      await waitForStrayEmails();

      expect(sentEmails).to.have.lengthOf(1);
      expect(emailTo(MEMBER_ID).subject).to.equal(
        `User ${AUTHOR_ID} vous a mentionné dans « Card »`,
      );

      expect(await notifiedUserIds(comment.id)).to.deep.equal([MEMBER_ID, SUBSCRIBER_ID]);
    });

    it('does not email a mention added on edit to a user who turned mention emails off', async () => {
      await setPreferences(SUBSCRIBER_ID, { notifyMentionsByEmail: false });

      const comment = await createComment('First version');
      await waitForEmails(1);
      sentEmails = [];

      await updateComment(comment.id, `Edited ${mention(SUBSCRIBER_ID)} ${mention(MEMBER_ID)}`);

      await waitForEmails(1);
      await waitForStrayEmails();

      expect(sentEmails).to.have.lengthOf(1);
      expect(emailTo(MEMBER_ID).subject).to.equal(
        `User ${AUTHOR_ID} vous a mentionné dans « Card »`,
      );
    });
  });
});

describe('comments helpers', () => {
  describe('parseMentionedUserIds', () => {
    it('returns unique mentioned user ids, ignoring malformed tokens', () => {
      expect(
        sails.helpers.comments.parseMentionedUserIds(
          '@[A](1) @[B](2) @[A again](1) @[C](abc) @C (3) [D](4) @[\n](5)',
        ),
      ).to.deep.equal(['1', '2']);
    });

    it('returns an empty list for empty text', () => {
      expect(sails.helpers.comments.parseMentionedUserIds(null)).to.deep.equal([]);
      expect(sails.helpers.comments.parseMentionedUserIds('')).to.deep.equal([]);
    });
  });

  describe('formatText', () => {
    it('shows mentions as @Name, escapes HTML and keeps line breaks', () => {
      expect(
        sails.helpers.comments.formatText('<script>x</script> @[Jean "J" Dupont](12)\nok'),
      ).to.equal('&lt;script&gt;x&lt;/script&gt; @Jean &quot;J&quot; Dupont<br>ok');
    });
  });
});
