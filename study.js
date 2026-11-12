const controls = document.querySelector('.study-tabs');
const buttons = [...controls.querySelectorAll('button')];
function selectPanel(selected) {
  for (const button of buttons) {
    const active = button === selected;
    button.setAttribute('aria-pressed', String(active));
    document.getElementById(button.dataset.panel).hidden = !active;
  }
}
for (const button of buttons) {
  button.addEventListener('click', () => selectPanel(button));
}
controls.hidden = false;
selectPanel(buttons.find(button => button.getAttribute('aria-pressed') === 'true'));
