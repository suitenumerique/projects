module.exports = {
  async fn() {
    const { currentUser } = this.req;

    const apiTokens = await ApiToken.find({
      userId: currentUser.id,
    }).sort('id DESC');

    return {
      items: apiTokens,
    };
  },
};
