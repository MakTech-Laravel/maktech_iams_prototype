<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = auth('admin')->user();

        return Inertia::render('Admin/Dashboard', [
            'user' => $user->only(['id', 'name', 'email', 'phone']),
        ]);
    }
}
