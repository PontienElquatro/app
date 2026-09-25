/* Comportements de la FAQ ; questions et réponses conservées à l’identique. */
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.faq-question').forEach(button=>button.addEventListener('click',()=>{
    const item=button.closest('.faq-item'),open=!item.classList.contains('open');
    item.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open));item.querySelector('.faq-answer').inert=!open;
  }));
  document.querySelectorAll('.chip[data-filter]').forEach(chip=>chip.addEventListener('click',()=>{
    document.querySelectorAll('.chip[data-filter]').forEach(c=>{c.classList.toggle('active',c===chip);c.setAttribute('aria-pressed',String(c===chip));});
    document.querySelectorAll('.faq-item').forEach(item=>{item.hidden=chip.dataset.filter!=='all'&&item.dataset.category!==chip.dataset.filter;});
  }));
});
