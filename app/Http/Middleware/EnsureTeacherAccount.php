<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Teacher portal may only be used by active Coordinator/Teacher accounts,
 * mirroring prototype teacherByPhone() + role_id === 5 check.
 */
class EnsureTeacherAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('teacher');

        if (! $user || ! $user->isActive() || ! $user->isTeacher()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Teacher portal access denied.'], 403);
            }

            auth('teacher')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('teacher.login')
                ->withErrors(['phone' => 'This account is not authorised for the teacher portal.']);
        }

        return $next($request);
    }
}
