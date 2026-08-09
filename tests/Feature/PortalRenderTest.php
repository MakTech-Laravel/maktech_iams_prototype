<?php

use App\Models\Student;
use App\Models\User;
use Database\Seeders\DemoAccessSeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// Both portals are single-page shells: the prototype's in-portal navigation (its `pgo` actions)
// happens client-side, so one authenticated route per portal covers the whole surface.

it('renders the public certificate verification page', function () {
    $this->get('/verify')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Verify'));
});

it('renders the student login screen for guests', function () {
    $this->get('/student/login')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Student/Auth/Login'));
});

it('renders the teacher login screen for guests', function () {
    $this->get('/teacher/login')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Teacher/Auth/Login'));
});

it('renders the student portal for a signed-in student', function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(DemoAccessSeeder::class);

    $student = Student::query()->where('phone', DemoAccessSeeder::STUDENT_PHONE)->sole();

    $this->actingAs($student, 'student')
        ->get('/student/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Student/Dashboard'));
});

it('renders the teacher portal for a signed-in teacher', function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(DemoAccessSeeder::class);

    $teacher = User::query()->where('phone', DemoAccessSeeder::TEACHER_PHONE)->sole();

    $this->actingAs($teacher, 'teacher')
        ->get('/teacher/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Teacher/Dashboard'));
});

it('sends portal guests to their own login screen', function (string $uri, string $login) {
    $this->get($uri)->assertRedirect($login);
})->with([
    ['/student/dashboard', '/student/login'],
    ['/teacher/dashboard', '/teacher/login'],
]);
