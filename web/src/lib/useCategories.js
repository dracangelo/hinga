import { useEffect, useState } from 'react';
import { api } from './api.js';
import { CATEGORIES as FALLBACK } from './catalog.js';

let cache = null;
let inflight = null;

function fetchCategories() {
  if (!inflight) {
    inflight = api
      .categories()
      .then((data) => {
        cache = Array.isArray(data?.categories) ? data.categories : FALLBACK;
        return cache;
      })
      .catch(() => {
        if (!cache) cache = FALLBACK;
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Let the storefront know that categories changed in the admin panel. */
export function notifyCategoriesChanged() {
  cache = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('hinga:categories-changed'));
  }
}

/**
 * Storefront categories, backed by the categories API with the original
 * hard-coded catalogue as a graceful first-paint fallback.
 */
export function useCategories() {
  const [categories, setCategories] = useState(cache || FALLBACK);

  useEffect(() => {
    let mounted = true;

    const apply = (list) => {
      if (mounted) setCategories(list);
    };

    if (cache) apply(cache);
    else fetchCategories().then(apply);

    const onChange = () => {
      cache = null;
      fetchCategories().then(apply);
    };

    window.addEventListener('hinga:categories-changed', onChange);
    return () => {
      mounted = false;
      window.removeEventListener('hinga:categories-changed', onChange);
    };
  }, []);

  return categories;
}
