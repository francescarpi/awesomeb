export function paginatorManager(
  pageIndicatorId: string,
  pagesIds: string[],
): {
  nextPage: () => void;
  previousPage: () => void;
  refreshPageVisibility: () => void;
  refreshPageIndicator: () => void;
} {
  const pageIndicatorEl = document.getElementById(pageIndicatorId)!;
  const pagesEls = pagesIds.map((id) => document.getElementById(id)!);

  let currentPageIndex = 0;

  const refreshPageVisibility = () => {
    for (const page of pagesEls) {
      if (page === pagesEls[currentPageIndex]) {
        page.style.display = 'grid';
        page.querySelector('input')!.focus();
      } else {
        page.style.display = 'none';
      }
    }
  };

  const refreshPageIndicator = () => {
    pageIndicatorEl.innerHTML = '';

    pagesEls.forEach((page) => {
      const dot = document.createElement('span');
      dot.className = 'mx-1 text-base-content select-none';
      dot.innerText = page === pagesEls[currentPageIndex] ? '●' : '○';
      pageIndicatorEl.appendChild(dot);
    });
  };

  const nextPage = () => {
    currentPageIndex = (currentPageIndex + 1) % pagesEls.length;
    refreshPageVisibility();
    refreshPageIndicator();
  };

  // ------------------------------------------------------
  const previousPage = () => {
    currentPageIndex = (currentPageIndex + 1) % pagesEls.length;
    currentPageIndex = (currentPageIndex - 1 + pagesEls.length) % pagesEls.length;
    refreshPageVisibility();
    refreshPageIndicator();
  };

  return { nextPage, previousPage, refreshPageVisibility, refreshPageIndicator };
}
