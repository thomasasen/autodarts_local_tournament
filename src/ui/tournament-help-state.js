// Transient create-help activation and mode reconciliation. State is never persisted.
  function activateCreateHelpTopic(topicId, triggerId, rawDraft) {
    const topic = getCreateHelpTopic(topicId);
    if (!topic || !isCreateHelpTopicAvailable(topic.id, rawDraft)) {
      return false;
    }
    state.activeCreateHelpTopic = topic.id;
    state.lastCreateHelpTriggerId = normalizeText(triggerId || "");
    return true;
  }

  function reconcileCreateHelpState(rawDraft) {
    const activeTopic = normalizeText(state.activeCreateHelpTopic || "");
    if (!activeTopic) return false;
    if (isCreateHelpTopicAvailable(activeTopic, rawDraft)) return false;
    resetCreateHelpState();
    return true;
  }
