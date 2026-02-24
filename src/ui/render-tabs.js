// Auto-generated module split from dist source.
  function renderActiveTab() {
    switch (state.activeTab) {
      case "matches":
        return renderMatchesTab();
      case "view":
        return renderViewTab();
      case "io":
        return renderIOTab();
      case "settings":
        return renderSettingsTab();
      case "tournament":
      default:
        return renderTournamentTab();
    }
  }


