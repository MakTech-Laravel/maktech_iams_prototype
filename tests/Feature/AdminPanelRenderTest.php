<?php

use App\Http\Controllers\Admin\PanelController;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function superAdmin(): User
{
    $admin = User::factory()->create(['status' => 'active']);
    $admin->syncRoles(['Super Admin']);

    return $admin;
}

it('redirects the admin root to the dashboard', function () {
    $this->seed(PermissionSeeder::class);

    $this->actingAs(superAdmin(), 'admin')
        ->get('/admin')
        ->assertRedirect('/admin/dashboard');
});

// assertInertia() also fails when the named page component is missing from resources/js/Pages,
// so this doubles as the guarantee that every routed view has a real frontend page.
it('renders every admin panel view for a super admin', function (string $view) {
    $this->seed(PermissionSeeder::class);

    $this->actingAs(superAdmin(), 'admin')
        ->get('/admin/'.$view)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/'.Str::studly($view)));
})->with(PanelController::VIEWS);

it('rejects an unknown admin view', function () {
    $this->seed(PermissionSeeder::class);

    $this->actingAs(superAdmin(), 'admin')
        ->get('/admin/not-a-real-view')
        ->assertNotFound();
});

it('sends guests to the admin login screen', function () {
    $this->get('/admin/dashboard')->assertRedirect('/admin/login');
});
