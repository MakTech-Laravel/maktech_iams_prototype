<?php

use App\Http\Controllers\Admin\PanelController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin panel — guard: admin
|--------------------------------------------------------------------------
| Authentication is handled by Laravel Fortify under /admin/login.
| Spatie permissions (guard: admin) gate every module action, matching the
| prototype's effectivePerm() / rolePermMatrix system.
*/

Route::middleware(['auth:admin', 'admin.panel'])->group(function () {
    Route::redirect('/', '/admin/dashboard');

    // Named separately because Fortify's home path and the authenticated-redirect both target it.
    Route::get('/dashboard', PanelController::class)
        ->defaults('view', 'dashboard')
        ->name('admin.dashboard');

    Route::get('/{view}', PanelController::class)
        ->whereIn('view', PanelController::VIEWS)
        ->name('admin.view');
});
