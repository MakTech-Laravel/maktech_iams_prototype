/* Modal, drawer and toast host — React port of the imperative helpers in the prototype's ui.js.
   The rendered markup matches the prototype's static shells in index.html so theme.css applies unchanged. */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './ui';

const UiContext = createContext(null);

export function useUi() {
    const ctx = useContext(UiContext);

    if (!ctx) {
        throw new Error('useUi must be used inside <UiProvider>');
    }

    return ctx;
}

let toastSeq = 0;

export function UiProvider({ children }) {
    const [modal, setModal] = useState(null);
    const [drawer, setDrawer] = useState(null);
    const [toasts, setToasts] = useState([]);
    const timers = useRef([]);

    const closeModal = useCallback(() => setModal(null), []);
    const closeDrawer = useCallback(() => setDrawer(null), []);
    const openModal = useCallback((config) => setModal(config), []);
    const openDrawer = useCallback((config) => setDrawer(config), []);

    const toast = useCallback((message, kind) => {
        const id = ++toastSeq;
        setToasts((current) => [...current, { id, message, kind, leaving: false }]);

        // Mirrors the prototype timing: visible for 2.6s, then a 300ms opacity fade.
        timers.current.push(
            setTimeout(() => {
                setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
                timers.current.push(setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 300));
            }, 2600),
        );
    }, []);

    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeModal();
                closeDrawer();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [closeModal, closeDrawer]);

    const value = useMemo(
        () => ({ openModal, closeModal, openDrawer, closeDrawer, toast, confirm: null }),
        [openModal, closeModal, openDrawer, closeDrawer, toast],
    );

    const api = useMemo(
        () => ({
            ...value,
            confirmAction: (message, onYes) =>
                openModal({
                    title: 'Please confirm',
                    body: (
                        <div className="flex-gap" style={{ alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--warning-500)', flexShrink: 0 }}>
                                <Icon name="alertCircle" />
                            </span>
                            <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '13.5px' }}>{message}</p>
                        </div>
                    ),
                    foot: (
                        <>
                            <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => {
                                    closeModal();
                                    onYes?.();
                                }}
                            >
                                Yes, proceed
                            </button>
                        </>
                    ),
                }),
        }),
        [value, openModal, closeModal],
    );

    return (
        <UiContext.Provider value={api}>
            {children}

            <div className={`overlay ${modal ? 'show' : ''}`} onClick={(event) => event.target === event.currentTarget && closeModal()}>
                <div className={`modal ${modal?.size || ''}`.trim()}>
                    {modal ? (
                        <>
                            <div className="modal-head">
                                <div>
                                    <h3>{modal.title || ''}</h3>
                                    {modal.sub ? <p>{modal.sub}</p> : null}
                                </div>
                                <div className="close-x" onClick={closeModal}>
                                    <Icon name="close" />
                                </div>
                            </div>
                            <div className="modal-body">{modal.body}</div>
                            <div className="modal-foot">
                                {modal.foot || (
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        Close
                                    </button>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            <div className={`drawer-overlay ${drawer ? 'show' : ''}`} onClick={closeDrawer} />
            <div className={`drawer ${drawer ? 'show' : ''}`}>
                {drawer ? (
                    <>
                        <div className="drawer-head">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '17px' }}>{drawer.title || ''}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--gray-500)' }}>{drawer.sub || ''}</p>
                            </div>
                            <div className="close-x" onClick={closeDrawer}>
                                <Icon name="close" />
                            </div>
                        </div>
                        <div className="drawer-body">{drawer.body}</div>
                    </>
                ) : null}
            </div>

            <div className="toast-wrap">
                {toasts.map((t) => (
                    <div key={t.id} className="toast" style={t.leaving ? { opacity: 0, transition: 'opacity .3s' } : undefined}>
                        <Icon name={t.kind === 'error' ? 'alertCircle' : 'checkCircle'} />
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </UiContext.Provider>
    );
}
