<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Teacher/Auth/Login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'phone' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('phone', $credentials['phone'])
            ->where('status', 'active')
            ->first();

        if (! $user || ! $user->isTeacher() || ! Hash::check($credentials['password'], $user->password)) {
            return back()
                ->withInput($request->only('phone'))
                ->withErrors(['phone' => 'Invalid credentials or this account is not a teacher/coordinator.']);
        }

        Auth::guard('teacher')->login($user, $request->boolean('remember'));

        $request->session()->regenerate();

        return redirect()->intended(route('teacher.dashboard'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('teacher')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('teacher.login');
    }
}
