import { useCallback, useState } from 'react';

/**
 * Forces a re-render after the in-memory prototype fixtures are mutated.
 *
 * The ported pages still write straight into the `DB` object (exactly as the prototype did)
 * so the click-through demo behaves identically before the real backend exists. React has no
 * way to observe those writes, so any handler that mutates `DB` must call the returned
 * function afterwards — the equivalent of the prototype's refreshCurrentView().
 */
export function useRefresh() {
    const [, setTick] = useState(0);

    return useCallback(() => setTick((n) => n + 1), []);
}
