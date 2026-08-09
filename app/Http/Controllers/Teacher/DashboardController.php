<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = auth('teacher')->user();

        return Inertia::render('Teacher/Dashboard', [
            'user' => $user->only(['id', 'name', 'email', 'phone']),
        ]);
    }
}
