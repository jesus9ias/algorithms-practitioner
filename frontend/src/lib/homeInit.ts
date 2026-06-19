import { exercises } from "../data/exercises";
import { filterExercises, searchExercises } from "./filters";
import type { FilterCriteria } from "./filters";
import { computeProgress } from "./progress";
import { readLearned, readPrefs } from "./storage";
import { getPrefs, setViewMode, VIEW_MODE_CHANGE_EVENT, LANGUAGE_CHANGE_EVENT } from "./clientPrefs";
import { ViewMode, LearnedStatus, ExerciseCategory, ExerciseLevel } from "./constants";
import type { LanguageCode } from "../i18n";

function checkedValues(nodes: NodeListOf<HTMLInputElement>): string[] {
  return Array.from(nodes)
    .filter((n) => n.checked)
    .map((n) => n.value);
}

/** Wires the home page: search, filters, view toggle, and progress bar. */
export function initHome(): void {
  const list = document.querySelector<HTMLElement>('[data-role="exercise-list"]');
  const noResults = document.querySelector<HTMLElement>('[data-role="no-results"]');
  const search = document.querySelector<HTMLInputElement>('[data-role="search"]');
  const progressFill = document.querySelector<HTMLElement>('[data-role="progress-fill"]');
  const progressLabel = document.querySelector<HTMLElement>('[data-role="progress-label"]');
  if (!list) return;

  const filterPanel = document.querySelector<HTMLElement>('#home-filters');
  const filterToggleBtn = document.querySelector<HTMLButtonElement>('[data-action="toggle-filters"]');
  const filterCountEl = document.querySelector<HTMLElement>('[data-role="filter-count"]');

  const cards = new Map<string, HTMLElement>();
  list.querySelectorAll<HTMLElement>('[data-role="exercise-card"]').forEach((card) => {
    const id = card.dataset.id;
    if (id) cards.set(id, card);
  });

  function lang(): LanguageCode {
    return getPrefs().language as LanguageCode;
  }

  function readCriteria(): FilterCriteria {
    const categories = checkedValues(
      document.querySelectorAll('[data-filter="category"]')
    ) as ExerciseCategory[];
    const levels = checkedValues(
      document.querySelectorAll('[data-filter="level"]')
    ) as ExerciseLevel[];
    const statusEl = document.querySelector<HTMLInputElement>(
      '[data-filter="status"]:checked'
    );
    const status = (statusEl?.value as LearnedStatus) ?? LearnedStatus.ALL;
    const newOnly =
      document.querySelector<HTMLInputElement>('[data-filter="new"]')?.checked ?? false;

    return {
      categories,
      levels,
      status,
      learnedIds: readLearned(),
      newOnly,
    };
  }

  function countActiveFilters(): number {
    const categories = checkedValues(document.querySelectorAll('[data-filter="category"]')).length;
    const levels = checkedValues(document.querySelectorAll('[data-filter="level"]')).length;
    const newOnly = document.querySelector<HTMLInputElement>('[data-filter="new"]')?.checked ? 1 : 0;
    const statusEl = document.querySelector<HTMLInputElement>('[data-filter="status"]:checked');
    const statusActive = statusEl?.value !== LearnedStatus.ALL ? 1 : 0;
    return categories + levels + newOnly + statusActive;
  }

  function updateFilterCount(): void {
    if (!filterCountEl) return;
    const count = countActiveFilters();
    filterCountEl.textContent = String(count);
    filterCountEl.hidden = count === 0;
  }

  function applyFilters(): void {
    const byFilter = filterExercises(exercises, readCriteria());
    const visible = searchExercises(byFilter, search?.value ?? "", lang());
    const visibleIds = new Set(visible.map((e) => e.id));

    cards.forEach((card, id) => {
      card.hidden = !visibleIds.has(id);
    });
    if (noResults) {
      noResults.hidden = visibleIds.size > 0;
    }
    updateFilterCount();
  }

  function updateProgress(): void {
    const { percent, label } = computeProgress(readLearned(), exercises.length);
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
      progressFill.classList.toggle("is-complete", percent >= 100);
    }
    if (progressLabel) progressLabel.textContent = label;
  }

  function markLearned(): void {
    const learned = new Set(readLearned());
    cards.forEach((card, id) => {
      const dot = card.querySelector<HTMLElement>('[data-role="card-learned"]');
      if (dot) dot.hidden = !learned.has(id);
    });
  }

  // --- View mode ---
  function applyViewMode(mode: ViewMode): void {
    list?.classList.toggle("list-grid", mode === ViewMode.GRID);
    list?.classList.toggle("list-rows", mode === ViewMode.LIST);
    document
      .querySelector('[data-action="view-grid"]')
      ?.classList.toggle("is-active", mode === ViewMode.GRID);
    document
      .querySelector('[data-action="view-list"]')
      ?.classList.toggle("is-active", mode === ViewMode.LIST);
  }

  document.querySelector('[data-action="view-grid"]')?.addEventListener("click", () => {
    setViewMode(ViewMode.GRID);
  });
  document.querySelector('[data-action="view-list"]')?.addEventListener("click", () => {
    setViewMode(ViewMode.LIST);
  });
  document.addEventListener(VIEW_MODE_CHANGE_EVENT, (e) => {
    applyViewMode((e as CustomEvent<ViewMode>).detail);
  });

  // --- Filter panel toggle (mobile) ---
  filterToggleBtn?.addEventListener('click', () => {
    const isOpen = filterPanel?.classList.toggle('is-open') ?? false;
    filterToggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  // --- Filter/search inputs ---
  search?.addEventListener("input", applyFilters);
  document
    .querySelectorAll('[data-filter]')
    .forEach((el) => el.addEventListener("change", applyFilters));

  document.querySelector('[data-action="clear-filters"]')?.addEventListener("click", () => {
    document
      .querySelectorAll<HTMLInputElement>('[data-filter="category"], [data-filter="level"], [data-filter="new"]')
      .forEach((el) => {
        el.checked = false;
      });
    const allStatus = document.querySelector<HTMLInputElement>(
      `[data-filter="status"][value="${LearnedStatus.ALL}"]`
    );
    if (allStatus) allStatus.checked = true;
    if (search) search.value = "";
    applyFilters();
    filterPanel?.classList.remove('is-open');
    filterToggleBtn?.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener(LANGUAGE_CHANGE_EVENT, applyFilters);

  // --- Initial paint ---
  // Read the persisted view mode directly from storage so the correct layout is
  // applied regardless of whether global prefs init has run yet on this page.
  applyViewMode(readPrefs().viewMode);
  applyFilters();
  updateProgress();
  markLearned();
}
