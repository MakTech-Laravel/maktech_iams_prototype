<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks staff who are portal-only (Coordinators/Teachers by default) from the admin ERP,
 * mirroring prototype applyIdentity() → canAccessAdminPanel().
 */
class EnsureAdminPanelAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('admin');

        if (! $user || ! $user->canAccessAdminPanel()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Admin panel access denied.'], 403);
            }

            auth('admin')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('admin.login')
                ->withErrors(['email' => 'You do not have access to the admin panel. Use the Teacher Portal if you are a coordinator or teacher.']);
        }

        return $next($request);
    }
}
