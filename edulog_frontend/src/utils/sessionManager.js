export const initSessionWatcher = () => {
    window.addEventListener('storage', (event) => {
      if (event.key === 'logout_event') {
        sessionStorage.clear();
        window.location.href = '/login?reason=logged_out';
      }
    });
  };