<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Welcome'));

// Static prototype reference (unchanged from the pre-Laravel build)
Route::redirect('/prototype', '/prototype/index.html');

// Public QR certificate verification (ported from public/prototype/verify.html)
Route::get('/verify', fn () => Inertia::render('Verify'))->name('verify');
