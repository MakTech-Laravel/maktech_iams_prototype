<?php

use App\Http\Controllers\Student\AuthController as StudentAuthController;
use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Student portal — guard: student
|--------------------------------------------------------------------------
| Authenticates against the students table (phone + portal_password).
| No Spatie permissions — students see only their own data.
*/

Route::middleware('guest:student')->group(function () {
    Route::get('/login', [StudentAuthController::class, 'showLogin'])->name('student.login');
    Route::post('/login', [StudentAuthController::class, 'login'])->name('student.login.store');
});

Route::middleware('auth:student')->group(function () {
    Route::get('/dashboard', StudentDashboardController::class)->name('student.dashboard');
    Route::post('/logout', [StudentAuthController::class, 'logout'])->name('student.logout');
});
