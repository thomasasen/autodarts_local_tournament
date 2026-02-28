// App layer: runtime orchestration, persistence scheduling and user feedback.

  function setNotice(type, message, timeoutMs = 4500) {
    state.notice = { type, message: String(message || "") };
    renderShell();

    if (state.noticeTimer) {
      clearTimeout(state.noticeTimer);
      state.noticeTimer = null;
    }

    if (timeoutMs > 0 && state.notice.message) {
      state.noticeTimer = window.setTimeout(() => {
        state.notice = { type: "info", message: "" };
        renderShell();
      }, timeoutMs);
    }
  }

