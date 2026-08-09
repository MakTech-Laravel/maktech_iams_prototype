<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /** Mirrors DB.permModules in public/prototype/js/data.js */
    private const MODULES = [
        'Institutions', 'Leads/CRM', 'Courses', 'Students', 'Batches', 'Attendance',
        'Payments', 'CashManagement', 'Expenses', 'TeacherPayments', 'Certificates',
        'Reports', 'Notifications', 'Users', 'Audit', 'Settings',
    ];

    /** Mirrors DB.permActions */
    private const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'ChangeStatus'];

    /** Mirrors REPORT_IDS in data.js */
    private const REPORT_IDS = [
        'marketing' => [1, 2, 3, 4, 5, 6, 7, 8],
        'studentAcademic' => [9, 10, 11, 12, 13, 14, 15, 16, 17],
        'financial' => [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 42],
        'teacherPayment' => [43, 44],
        'certificateId' => [36, 37, 38],
        'system' => [39, 40, 41],
    ];

    private const PAYMENT_LIST_KEYS = ['Paid', 'Partial', 'Due', 'Overdue'];

    private const STUDENT_LIST_KEYS = ['Active', 'Dropped', 'OnHold', 'Completed'];

    /** Mirrors DB.roles seed data */
    private const ROLES = [
        1 => ['name' => 'Super Admin', 'desc' => 'Full access to everything, system configuration, user/role management'],
        2 => ['name' => 'Admin / Manager', 'desc' => 'Full operational access except system-level config'],
        3 => ['name' => 'Marketing Officer', 'desc' => 'Leads, polytechnic visits, follow-ups, conversion tracking'],
        4 => ['name' => 'Accountant / Finance Officer', 'desc' => 'Payments, expenses, financial reports, refunds'],
        5 => ['name' => 'Course Coordinator / Teacher', 'desc' => 'Class schedule, attendance, module progress'],
        6 => ['name' => 'Front Desk / Admission Officer', 'desc' => 'Student registration, profile & document collection'],
        7 => ['name' => 'Auditor (Read-only)', 'desc' => 'View-only access to reports & logs'],
        8 => ['name' => 'Managing Director / Boss', 'desc' => 'Senior management — cash custodian, financial oversight & final sign-off'],
    ];

    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = $this->createPermissions();
        $roles = $this->createRoles();
        $this->seedRoleDefaults($roles, $permissions);
    }

    private function createPermissions(): array
    {
        $names = [];

        foreach (self::MODULES as $module) {
            foreach (self::ACTIONS as $action) {
                $names[] = "{$module}.{$action}";
            }
        }

        $names[] = 'Users.AdminPanelAccess';

        foreach (array_merge(...array_values(self::REPORT_IDS)) as $id) {
            $names[] = "Reports.Report_{$id}";
        }

        foreach (self::PAYMENT_LIST_KEYS as $key) {
            $names[] = "Payments.List_{$key}";
        }

        foreach (self::STUDENT_LIST_KEYS as $key) {
            $names[] = "Students.List_{$key}";
        }

        $permissions = [];
        foreach (array_unique($names) as $name) {
            $permissions[$name] = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'admin']);
        }

        return $permissions;
    }

    private function createRoles(): array
    {
        $roles = [];
        foreach (self::ROLES as $id => $meta) {
            $roles[$id] = Role::firstOrCreate(
                ['name' => $meta['name'], 'guard_name' => 'admin'],
                ['description' => $meta['desc']],
            );
        }

        return $roles;
    }

    private function seedRoleDefaults(array $roles, array $permissions): void
    {
        // Super Admin — everything
        $roles[1]->syncPermissions(array_keys($permissions));

        // Admin / Manager
        $this->grant($roles[2], [
            ...$this->moduleActions(['Institutions', 'Leads/CRM', 'Courses', 'Students', 'Batches', 'Attendance', 'Payments', 'CashManagement', 'Expenses', 'Certificates', 'Reports', 'Notifications'], ['View', 'Create', 'Edit', 'Approve']),
            ...$this->moduleActions(['Users'], ['View', 'Create', 'Edit']),
            ...$this->moduleActions(['Audit'], ['View']),
            ...$this->moduleActions(['TeacherPayments'], ['View', 'Create', 'Edit', 'Approve']),
            ...$this->moduleActions(['Students', 'Payments', 'Batches'], ['ChangeStatus']),
            'Users.AdminPanelAccess',
            ...$this->reportIds(array_merge(...array_values(self::REPORT_IDS))),
            ...$this->listKeys('Payments', self::PAYMENT_LIST_KEYS),
            ...$this->listKeys('Students', self::STUDENT_LIST_KEYS),
        ], $permissions);

        // Marketing Officer
        $this->grant($roles[3], [
            ...$this->moduleActions(['Leads/CRM', 'Institutions'], ['View', 'Create', 'Edit']),
            ...$this->moduleActions(['Reports'], ['View']),
            ...$this->reportIds(self::REPORT_IDS['marketing']),
            'Users.AdminPanelAccess',
        ], $permissions);

        // Accountant
        $this->grant($roles[4], [
            ...$this->moduleActions(['Payments'], ['View', 'Create', 'Edit', 'Approve', 'ChangeStatus']),
            ...$this->moduleActions(['CashManagement', 'Expenses'], ['View', 'Create', 'Edit']),
            ...$this->moduleActions(['Reports', 'Students'], ['View']),
            ...$this->moduleActions(['TeacherPayments'], ['View', 'Create', 'Edit', 'Approve']),
            ...$this->reportIds(array_merge(self::REPORT_IDS['financial'], self::REPORT_IDS['teacherPayment'])),
            ...$this->listKeys('Payments', self::PAYMENT_LIST_KEYS),
            ...$this->listKeys('Students', ['Active']),
            'Users.AdminPanelAccess',
        ], $permissions);

        // Coordinator / Teacher — portal-only by default
        $this->grant($roles[5], [
            ...$this->moduleActions(['Batches'], ['View', 'Edit']),
            ...$this->moduleActions(['Attendance'], ['View', 'Create', 'Edit']),
            ...$this->moduleActions(['Students', 'Courses', 'TeacherPayments'], ['View']),
            ...$this->listKeys('Students', self::STUDENT_LIST_KEYS),
        ], $permissions);

        // Front Desk
        $this->grant($roles[6], [
            ...$this->moduleActions(['Students'], ['View', 'Create', 'Edit', 'ChangeStatus']),
            ...$this->moduleActions(['Courses'], ['View']),
            ...$this->listKeys('Students', self::STUDENT_LIST_KEYS),
            'Users.AdminPanelAccess',
        ], $permissions);

        // Auditor — view everything
        $this->grant($roles[7], [
            ...$this->moduleActions(self::MODULES, ['View']),
            ...$this->reportIds(array_merge(...array_values(self::REPORT_IDS))),
            ...$this->listKeys('Payments', self::PAYMENT_LIST_KEYS),
            ...$this->listKeys('Students', self::STUDENT_LIST_KEYS),
            'Users.AdminPanelAccess',
        ], $permissions);

        // MD / Boss
        $this->grant($roles[8], [
            ...$this->moduleActions(['CashManagement'], ['View', 'Approve']),
            ...$this->moduleActions(['Payments', 'Expenses', 'Reports', 'Students'], ['View']),
            ...$this->moduleActions(['Expenses', 'TeacherPayments'], ['Approve']),
            ...$this->reportIds(array_merge(self::REPORT_IDS['financial'], self::REPORT_IDS['teacherPayment'], self::REPORT_IDS['system'])),
            ...$this->listKeys('Payments', self::PAYMENT_LIST_KEYS),
            ...$this->listKeys('Students', ['Active']),
            'Users.AdminPanelAccess',
        ], $permissions);
    }

    private function grant(Role $role, array $permissionNames, array $permissions): void
    {
        $resolved = array_values(array_filter(array_map(
            fn (string $name) => $permissions[$name] ?? null,
            $permissionNames,
        )));

        $role->syncPermissions($resolved);
    }

    private function moduleActions(array $modules, array $actions): array
    {
        $names = [];
        foreach ($modules as $module) {
            foreach ($actions as $action) {
                $names[] = "{$module}.{$action}";
            }
        }

        return $names;
    }

    private function reportIds(array $ids): array
    {
        return array_map(fn (int $id) => "Reports.Report_{$id}", $ids);
    }

    private function listKeys(string $module, array $keys): array
    {
        return array_map(fn (string $key) => "{$module}.List_{$key}", $keys);
    }
}
