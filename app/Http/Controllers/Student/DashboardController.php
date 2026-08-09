<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $student = auth('student')->user();

        return Inertia::render('Student/Dashboard', [
            'student' => $student->only(['id', 'name', 'phone']),
        ]);
    }
}
