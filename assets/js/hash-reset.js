window.addEventListener("load", () => {
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0 });
  }
});