<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements HasMedia
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, InteractsWithMedia, Notifiable;

    /**
     * Spatie permissions for the admin panel use the `admin` guard exclusively.
     * Teacher-portal auth reuses this model on the `teacher` guard but does not
     * consult the permission matrix for navigation — it is batch-scoped instead.
     */
    protected string $guard_name = 'admin';

    /** Prototype role_id for Coordinator / Teacher. */
    public const TEACHER_ROLE = 'Course Coordinator / Teacher';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'status',
        'avatar_color',
        'cash_custodian',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'cash_custodian' => 'boolean',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')->singleFile();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isTeacher(): bool
    {
        return $this->hasRole(self::TEACHER_ROLE);
    }

    /** Mirrors prototype canAccessAdminPanel() — Users.AdminPanelAccess permission. */
    public function canAccessAdminPanel(): bool
    {
        return $this->hasPermissionTo('Users.AdminPanelAccess', 'admin');
    }

    /** Mirrors prototype effectivePerm($userId, $module, $action). */
    public function canModule(string $module, string $action): bool
    {
        return $this->hasPermissionTo("{$module}.{$action}", 'admin');
    }

    public function canAccessReport(int $reportId): bool
    {
        return $this->canModule('Reports', 'View')
            && $this->hasPermissionTo("Reports.Report_{$reportId}", 'admin');
    }

    public function canViewList(string $module, string $listKey): bool
    {
        return $this->hasPermissionTo("{$module}.List_{$listKey}", 'admin');
    }

    public function coordinatedBatches(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Batch::class, 'coordinator_id');
    }

    public function teacherPayRates(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TeacherPayRate::class, 'teacher_id');
    }

    public function teacherPayments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TeacherPayment::class, 'teacher_id');
    }

    public function assignedLeads(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Lead::class, 'assigned_to');
    }
}
