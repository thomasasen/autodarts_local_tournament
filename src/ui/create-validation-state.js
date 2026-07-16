// Transient create-validation interaction state. Never persisted.
  function resetCreateValidationState() {
    state.createValidationTouchedFields = {};
    state.createValidationRevealedFields = {};
    state.createValidationSubmitAttempted = false;
    state.createValidationSnapshot = null;
  }


  function markCreateValidationFieldTouched(fieldName) {
    const normalizedFieldName = normalizeText(fieldName || "");
    if (!normalizedFieldName) return false;
    if (!state.createValidationTouchedFields || typeof state.createValidationTouchedFields !== "object") {
      state.createValidationTouchedFields = {};
    }
    state.createValidationTouchedFields[normalizedFieldName] = true;
    return true;
  }


  function revealNewDependentCreateValidationIssues(previousSnapshot, nextSnapshot) {
    if (!previousSnapshot || !nextSnapshot) return;
    if (!state.createValidationRevealedFields || typeof state.createValidationRevealedFields !== "object") {
      state.createValidationRevealedFields = {};
    }
    const previousInvalidFields = new Set((previousSnapshot.issues || []).map((issue) => issue.fieldName));
    (nextSnapshot.issues || []).forEach((issue) => {
      if (!previousInvalidFields.has(issue.fieldName)) {
        state.createValidationRevealedFields[issue.fieldName] = true;
      }
    });
  }


  function shouldShowCreateValidationFieldIssue(fieldName) {
    const normalizedFieldName = normalizeText(fieldName || "");
    return state.createValidationSubmitAttempted === true
      || state.createValidationTouchedFields?.[normalizedFieldName] === true
      || state.createValidationRevealedFields?.[normalizedFieldName] === true;
  }

