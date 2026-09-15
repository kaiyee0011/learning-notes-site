const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const searchInput = document.querySelector("#log-search");
const logRows = Array.from(document.querySelectorAll("#log-body tr"));
const visibleCount = document.querySelector("#visible-count");
const emptyState = document.querySelector("#empty-state");

if (searchInput && logRows.length) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLocaleLowerCase("zh-CN");
    let count = 0;

    logRows.forEach((row) => {
      const haystack = `${row.textContent} ${row.dataset.search || ""}`.toLocaleLowerCase("zh-CN");
      const matches = !query || haystack.includes(query);
      row.hidden = !matches;
      if (matches) count += 1;
    });

    if (visibleCount) visibleCount.textContent = String(count);
    if (emptyState) emptyState.hidden = count !== 0;
  });
}
