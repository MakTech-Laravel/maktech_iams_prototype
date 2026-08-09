<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Serves the admin panel pages during the static-UI phase.
 *
 * Every view id below matches a sidebar entry in resources/js/lib/nav.js and resolves to
 * resources/js/Pages/Admin/<StudlyId>.jsx. Data still comes from the ported prototype
 * fixtures on the client; each module gets a real controller as its backend is built.
 */
class PanelController extends Controller
{
    /** View ids, mirroring VIEWS in the prototype's app.js. */
    public const VIEWS = [
        'dashboard',
        'institutions',
        'leads',
        'pipeline',
        'visits',
        'online-sessions',
        'followups',
        'courses',
        'sessions',
        'batches',
        'students',
        'enrollment-requests',
        'attendance',
        'invoices',
        'collect-payment',
        'due',
        'cash-management',
        'migrations',
        'refunds',
        'expenses',
        'teacher-payments',
        'certificates',
        'idcards',
        'reports',
        'notifications',
        'users',
        'access',
        'audit',
        'settings',
    ];

    public function __invoke(string $view): Response
    {
        abort_unless(in_array($view, self::VIEWS, true), 404);

        return Inertia::render('Admin/'.Str::studly($view), [
            'view' => $view,
        ]);
    }
}
