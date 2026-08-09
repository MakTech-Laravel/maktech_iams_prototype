/* Bridges the prototype's imperative dialogs to React.

   In the prototype a modal was a string handed to openModal(), and any dialog whose own inputs changed
   the shell (the import wizard's three steps) simply called openModal() again. Here the equivalent is a
   component that stays mounted in the page and pushes a fresh config into the modal/drawer host whenever
   its state moves — which is what lets a footer button read the state owned by the body. */

import { useEffect } from 'react';
import { useUi } from '../../../lib/UiProvider';

export function useHostedModal(config, deps) {
    const { openModal, closeModal } = useUi();

    useEffect(() => {
        openModal(config);
    }, deps);

    useEffect(() => () => closeModal(), [closeModal]);
}

export function useHostedDrawer(config, deps) {
    const { openDrawer, closeDrawer } = useUi();

    useEffect(() => {
        openDrawer(config);
    }, deps);

    useEffect(() => () => closeDrawer(), [closeDrawer]);
}
