<?php

use App\Models\Student;
use App\Models\User;

return [

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'admin'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards — one per panel
    |--------------------------------------------------------------------------
    |
    | admin   → staff ERP (User model + Spatie permission matrix from the prototype)
    | teacher → teacher portal (User model, Coordinator/Teacher role only)
    | student → student portal (Student model, phone login)
    |
    | Each guard keeps its own session state, so logging into one panel does not
    | authenticate the others.
    */

    'guards' => [
        'admin' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        'teacher' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        'student' => [
            'driver' => 'session',
            'provider' => 'students',
        ],

        // Legacy alias — points at the admin guard so package defaults keep working.
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => env('AUTH_MODEL', User::class),
        ],

        'students' => [
            'driver' => 'eloquent',
            'model' => Student::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],

        'students' => [
            'provider' => 'students',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
