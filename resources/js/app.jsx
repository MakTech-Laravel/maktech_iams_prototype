import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { IdentityProvider } from './lib/identity';
import { UiProvider } from './lib/UiProvider';

createInertiaApp({
    title: (title) => (title ? `${title} — MakTech IAMS` : 'MakTech IAMS'),
    // Lazy glob (no `eager`) so Vite emits one chunk per page instead of bundling all
    // ~40 admin/portal screens into the entry chunk.
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <IdentityProvider>
                <UiProvider>
                    <App {...props} />
                </UiProvider>
            </IdentityProvider>,
        );
    },
});
