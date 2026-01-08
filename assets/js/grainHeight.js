function updateGrainHeight() {
  const fullHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  );
    document.querySelector('.grain').style.setProperty('--grain-height', fullHeight + 'px');
}

window.addEventListener('load', updateGrainHeight);
window.addEventListener('resize', updateGrainHeight);
window.addEventListener('scroll', updateGrainHeight);