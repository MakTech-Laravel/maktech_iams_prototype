<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfTeacherAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth('teacher')->check()) {
            return redirect()->route('teacher.dashboard');
        }

        return $next($request);
    }
}
