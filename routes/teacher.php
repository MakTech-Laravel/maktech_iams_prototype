<?php

use App\Http\Controllers\Teacher\AuthController as TeacherAuthController;
use App\Http\Controllers\Teacher\DashboardController as TeacherDashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Teacher portal — guard: teacher
|--------------------------------------------------------------------------
| Same User model as admin, but a separate session guard. Access is limited
| to Coordinator/Teacher role accounts; no Spatie permission matrix here —
| views are batch-scoped instead (mirrors teacher-portal.html).
*/

Route::middleware('guest:teacher')->group(function () {
    Route::get('/login', [TeacherAuthController::class, 'showLogin'])->name('teacher.login');
    Route::post('/login', [TeacherAuthController::class, 'login'])->name('teacher.login.store');
});

Route::middleware(['auth:teacher', 'teacher.account'])->group(function () {
    Route::get('/dashboard', TeacherDashboardController::class)->name('teacher.dashboard');
    Route::post('/logout', [TeacherAuthController::class, 'logout'])->name('teacher.logout');
});
