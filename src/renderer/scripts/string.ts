export function highlightString(str: string, ranges: Array<[number, number]>): string {
  const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0]);
  let result = str;
  let offset = 0;

  for (const [start, end] of sortedRanges) {
    const adjustedStart = start + offset;
    const adjustedEnd = end + offset;
    const tag = '<mark>';
    const closeTag = '</mark>';
    result =
      result.slice(0, adjustedStart) +
      tag +
      result.slice(adjustedStart, adjustedEnd) +
      closeTag +
      result.slice(adjustedEnd);
    offset += tag.length + closeTag.length;
  }

  return result;
}

export function animateString(el: HTMLElement, tmout = 2000): () => void {
  const elContainer = el.parentElement;
  if (!elContainer) {
    throw new Error('No element container found');
  }

  let cancelled = false;
  let pendingTimer: NodeJS.Timeout | null = null;

  const cleanup = () => {
    cancelled = true;
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    el.removeEventListener('transitionend', onTransitionEnd);
    el.style.transition = '';
    el.style.transform = '';
  };

  const onTransitionEnd = () => {
    if (cancelled) return;

    el.removeEventListener('transitionend', onTransitionEnd);

    // Esperar 4 segundos al final y volver al principio con animacion
    pendingTimer = setTimeout(() => {
      if (cancelled) return;

      const spanWidth = el.scrollWidth;
      const containerWidth = elContainer.clientWidth;
      const distance = spanWidth - containerWidth;
      const duration = distance * 15; // ms por pixel

      // Vuelta al principio animada con easing
      el.style.transition = `transform ${duration}ms cubic-bezier(0.42, 0, 0.58, 1)`;
      el.style.transform = `translateX(0px)`;
      el.addEventListener('transitionend', onReturnEnd);
    }, 4000);
  };

  const onReturnEnd = () => {
    if (cancelled) return;

    el.removeEventListener('transitionend', onReturnEnd);
    // Fin del ciclo: se detiene aqui
  };

  // Iniciar ciclo
  pendingTimer = setTimeout(() => {
    if (cancelled) return;

    const spanWidth = el.scrollWidth;
    const containerWidth = elContainer.clientWidth;

    if (spanWidth > containerWidth) {
      const distance = spanWidth - containerWidth;
      const duration = distance * 15;

      el.style.transition = `transform ${duration}ms cubic-bezier(0.42, 0, 0.58, 1)`;
      el.style.transform = `translateX(-${distance}px)`;
      el.addEventListener('transitionend', onTransitionEnd);
    }
  }, tmout);

  return cleanup;
}
