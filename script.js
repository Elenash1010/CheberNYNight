const form = document.querySelector('#lead-form');
const phone = document.querySelector('#phone');

const heroTitle = document.querySelector('#hero-title');
if (heroTitle) {
  const titleCanvas = document.createElement('canvas');
  const titleContext = titleCanvas.getContext('2d');
  const fitHeroTitle = () => {
    if (!titleContext || !heroTitle.clientWidth) return;
    const style = getComputedStyle(heroTitle);
    titleContext.font = `${style.fontWeight} 100px ${style.fontFamily}`;
    heroTitle.querySelectorAll('.hero__title-text').forEach(line => {
      const measured = titleContext.measureText(line.textContent).width;
      const size = Math.min(144, (heroTitle.clientWidth - 8) / measured * 100 * .92);
      line.style.fontSize = `${size}px`;
    });
  };
  new ResizeObserver(fitHeroTitle).observe(heroTitle);
  document.fonts.ready.then(fitHeroTitle);
}

// Fit overflowing desktop dialogs without shrinking their close buttons.
function fitDialog(dialog) {
  const section = dialog.querySelector(':scope > .section');
  if (!section) return;
  section.style.zoom = '';
  if (!window.matchMedia('(min-width: 781px)').matches) return;
  for (let attempt = 0; attempt < 12 && dialog.scrollHeight > dialog.clientHeight + 1; attempt++) {
    const currentScale = Number(section.style.zoom) || 1;
    const nextScale = Math.max(.7, currentScale * (dialog.clientHeight - 4) / dialog.scrollHeight);
    if (nextScale >= currentScale) break;
    section.style.zoom = String(nextScale);
    if (nextScale === .7) break;
  }
  dialog.scrollTop = 0;
}
window.addEventListener('resize', () => {
  document.querySelectorAll('.stay-dialog[open]').forEach(fitDialog);
});
document.fonts.ready.then(() => {
  document.querySelectorAll('.stay-dialog[open]').forEach(fitDialog);
});
for (const [dialogSelector, buttonSelector] of [
  ['#stay-dialog', '[data-open-stay]'],
  ['#price-stay-dialog', '[data-open-price-stay]'],
  ['#price-visit-dialog', '[data-open-price-visit]'],
  ['#price-banquet-dialog', '[data-open-price-banquet]'],
  ['#early-dialog', '[data-open-early]'],
  ['#special-menu-dialog', '[data-open-special-menu]'],
  ['#included-dialog', '[data-open-included]'],
  ['#adult-dialog', '[data-open-adult]'],
  ['#family-program-dialog', '[data-open-family-program]']
]) {
const stayDialog = document.querySelector(dialogSelector);
const triggers = document.querySelectorAll(buttonSelector);
let stayDetails;
if (stayDialog && triggers.length) {
  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    stayDetails = trigger;
    stayDialog.showModal();
    fitDialog(stayDialog);
    document.body.classList.add('modal-open');
  }));
  stayDialog.querySelector('.stay-dialog__close').addEventListener('click', () => stayDialog.close());
  stayDialog.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => stayDialog.close());
  });
  stayDialog.addEventListener('click', event => {
    if (event.target !== stayDialog) return;
    const bounds = stayDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) stayDialog.close();
  });
  stayDialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    stayDetails.focus({ preventScroll: true });
  });
}
}

function formatPhone(value){let digits=value.replace(/\D/g,'');if(!digits)return'';if(digits[0]==='8')digits='7'+digits.slice(1);if(digits[0]!=='7')digits='7'+digits;digits=digits.slice(0,11);const p=digits.slice(1);let out='+7';if(p.length)out+=' ('+p.slice(0,3);if(p.length>=3)out+=')';if(p.length>3)out+=' '+p.slice(3,6);if(p.length>6)out+='-'+p.slice(6,8);if(p.length>8)out+='-'+p.slice(8,10);return out}
phone.addEventListener('input',()=>{phone.value=formatPhone(phone.value)});
function setError(input,message){input.setAttribute('aria-invalid',message?'true':'false');const error=input.closest('.field').querySelector('.error');if(error)error.textContent=message}
const submitButton = form.querySelector('[type="submit"]');
const success = document.querySelector('#success');
const sendError = document.querySelector('#send-error');
let sending = false;
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sending) return;
  success.hidden = true;
  sendError.hidden = true;
  const name = form.elements.namedItem('name');
  const guests = form.elements.namedItem('guests');
  phone.value = formatPhone(phone.value);
  let valid = true;
  [name, phone, guests].forEach(input => setError(input, ''));
  if (name.value.trim().length < 2) {
    setError(name, 'Укажите имя.');
    valid = false;
  }
  const digits = phone.value.replace(/\D/g, '');
  if (digits.length !== 11 || digits[0] !== '7') {
    setError(phone, 'Введите телефон в формате +7 (___) ___-__-__.');
    valid = false;
  }
  if (!guests.validity.valid) {
    setError(guests, 'Укажите целое количество гостей от 1 до 1000.');
    valid = false;
  }
  if (!valid) {
    event.preventDefault();
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  name.value = name.value.trim();
  const payload = {
    'Имя': name.value,
    'Телефон': phone.value,
    'Количество гостей': guests.value || 'Не указано',
    'Желаемая дата/время звонка': form.elements.namedItem('callback_time').value.trim() || 'Не указано',
    _subject: form.elements.namedItem('_subject').value,
    _template: form.elements.namedItem('_template').value
  };
  sending = true;
  submitButton.disabled = true;
  form.setAttribute('aria-busy', 'true');
  const buttonContent = submitButton.innerHTML;
  submitButton.textContent = 'Отправляем…';
  let timeout;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 20000);
    const response = await fetch('https://formsubmit.co/ajax/lenochkash@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const result = await response.json();
    if (!response.ok || !(result.success === true || result.success === 'true')) {
      throw new Error('Submission failed');
    }
    success.hidden = false;
    // Keep the entered values available after submission.
    success.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  } catch (error) {
    sendError.textContent = 'Не удалось подтвердить отправку. Проверьте соединение и попробуйте ещё раз. Введённые данные сохранены.';
    sendError.hidden = false;
    sendError.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  } finally {
    clearTimeout(timeout);
    sending = false;
    submitButton.disabled = false;
    submitButton.innerHTML = buttonContent;
    form.removeAttribute('aria-busy');
  }
});
