
// --- Custom Premium Dropdown ---
function buildPremiumDropdown(selectElement) {
  if (selectElement.nextElementSibling && selectElement.nextElementSibling.classList.contains('premium-select-wrapper')) {
    selectElement.nextElementSibling.remove();
  }
  selectElement.style.display = 'none';
  const wrapper = document.createElement('div');
  wrapper.className = 'premium-select-wrapper';
  
  const trigger = document.createElement('div');
  trigger.className = 'premium-select-trigger';
  trigger.innerHTML = '<span>' + (selectElement.options[selectElement.selectedIndex]?.text || '') + '</span> <span style="color: #00f2fe;">▼</span>';
  
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'premium-select-options';
  
  Array.from(selectElement.options).forEach((opt, idx) => {
    const div = document.createElement('div');
    div.className = 'premium-select-option' + (opt.selected ? ' selected' : '');
    div.textContent = opt.text;
    div.onclick = (e) => {
      e.stopPropagation();
      selectElement.selectedIndex = idx;
      selectElement.dispatchEvent(new Event('change'));
      trigger.innerHTML = '<span>' + opt.text + '</span> <span style="color: #00f2fe;">▼</span>';
      wrapper.classList.remove('open');
      Array.from(optionsContainer.children).forEach(c => c.classList.remove('selected'));
      div.classList.add('selected');
    };
    optionsContainer.appendChild(div);
  });
  
  trigger.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll('.premium-select-wrapper').forEach(w => { if (w !== wrapper) w.classList.remove('open') });
    wrapper.classList.toggle('open');
  };
  
  wrapper.appendChild(trigger);
  wrapper.appendChild(optionsContainer);
  selectElement.parentNode.insertBefore(wrapper, selectElement.nextSibling);
}

document.addEventListener('click', () => {
  document.querySelectorAll('.premium-select-wrapper').forEach(w => w.classList.remove('open'));
});
