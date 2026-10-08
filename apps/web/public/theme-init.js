// Applies the saved theme before first paint, so dark mode never flashes light.
(function () {
  try {
    var mode = localStorage.getItem('team-radar:theme');
    if (mode === 'light' || mode === 'dark') document.documentElement.dataset.theme = mode;
  } catch {
    // Storage can be unavailable (private mode); the system theme applies.
  }
})();
