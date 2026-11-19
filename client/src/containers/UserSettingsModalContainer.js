import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import selectors from '../selectors';
import entryActions from '../entry-actions';
import UserSettingsModal from '../components/UserSettingsModal';

const mapStateToProps = (state) => {
  const {
    email,
    name,
    avatarUrl,
    phone,
    organization,
    language,
    subscribeToOwnCards,
    notifyMentionsByEmail,
    notifySubscribedCardsByEmail,
  } = selectors.selectCurrentUser(state);

  const { defaultLanguage, supportedLanguages } = selectors.selectConfig(state);

  return {
    email,
    name,
    avatarUrl,
    phone,
    organization,
    language,
    subscribeToOwnCards,
    notifyMentionsByEmail,
    notifySubscribedCardsByEmail,
    defaultLanguage,
    supportedLanguages,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onUpdate: entryActions.updateCurrentUser,
      onLanguageUpdate: entryActions.updateCurrentUserLanguage,
      onClose: entryActions.closeModal,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(UserSettingsModal);
