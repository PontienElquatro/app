document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('.faq-question').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('.faq-item');const open=item.classList.toggle('open');button.setAttribute('aria-expanded',String(open));document.getElementById(button.getAttribute('aria-controls')).hidden=!open;}));
 document.querySelectorAll('.chip[data-filter]').forEach(chip=>chip.addEventListener('click',()=>{document.querySelectorAll('.chip[data-filter]').forEach(c=>{c.classList.toggle('active',c===chip);c.setAttribute('aria-pressed',String(c===chip));});document.querySelectorAll('.faq-item').forEach(item=>item.hidden=chip.dataset.filter!=='all'&&item.dataset.category!==chip.dataset.filter);}));
});
