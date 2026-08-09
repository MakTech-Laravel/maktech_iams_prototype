<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoAccessSeeder extends Seeder
{
    /** Default credentials for local / demo environments. */
    public const ADMIN_EMAIL = 'admin@iams.com';

    public const ADMIN_PASSWORD = 'admin@iams.com';

    public const TEACHER_PHONE = '017123456789';

    public const TEACHER_PASSWORD = '017123456789';

    public const STUDENT_PHONE = '017123456789';

    public const STUDENT_PASSWORD = '017123456789';

    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => self::ADMIN_EMAIL],
            [
                'name' => 'IAMS Admin',
                'phone' => '01710000001',
                'password' => Hash::make(self::ADMIN_PASSWORD),
                'status' => 'active',
                'avatar_color' => '#ff6533',
            ],
        );
        $admin->syncRoles(['Super Admin']);

        $teacher = User::query()->updateOrCreate(
            ['phone' => self::TEACHER_PHONE],
            [
                'name' => 'Demo Teacher',
                'email' => 'teacher@iams.com',
                'password' => Hash::make(self::TEACHER_PASSWORD),
                'status' => 'active',
            ],
        );
        $teacher->syncRoles(['Course Coordinator / Teacher']);

        Student::query()->updateOrCreate(
            ['phone' => self::STUDENT_PHONE],
            [
                'code' => 'STU-DEMO-001',
                'name' => 'Demo Student',
                'email' => 'student@iams.com',
                'status' => 'active',
                'profile_completed' => true,
                'portal_password' => self::STUDENT_PASSWORD,
            ],
        );
    }
}
