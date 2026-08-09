<?php

use App\Http\Middleware\EnsureAdminPanelAccess;
use App\Http\Middleware\EnsureTeacherAccount;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectIfAdminAuthenticated;
use App\Http\Middleware\RedirectIfStudentAuthenticated;
use App\Http\Middleware\RedirectIfTeacherAuthenticated;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->prefix('admin')
                ->group(base_path('routes/admin.php'));

            Route::middleware('web')
                ->prefix('teacher')
                ->group(base_path('routes/teacher.php'));

            Route::middleware('web')
                ->prefix('student')
                ->group(base_path('routes/student.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'admin.panel' => EnsureAdminPanelAccess::class,
            'teacher.account' => EnsureTeacherAccount::class,
            'guest.admin' => RedirectIfAdminAuthenticated::class,
            'guest.teacher' => RedirectIfTeacherAuthenticated::class,
            'guest.student' => RedirectIfStudentAuthenticated::class,
        ]);

        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('teacher', 'teacher/*')) {
                return route('teacher.login');
            }

            if ($request->is('student', 'student/*')) {
                return route('student.login');
            }

            if ($request->is('admin', 'admin/*')) {
                return route('login');
            }

            return route('login');
        });

        $middleware->redirectUsersTo(function ($request) {
            if ($request->is('teacher', 'teacher/*')) {
                return route('teacher.dashboard');
            }

            if ($request->is('student', 'student/*')) {
                return route('student.dashboard');
            }

            return route('admin.dashboard');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
