<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Student extends Authenticatable implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'code', 'name', 'date_of_birth', 'gender', 'nid', 'phone', 'email',
        'present_address', 'permanent_address', 'institution_id', 'roll',
        'passing_year', 'guardian_name', 'guardian_relation', 'guardian_phone',
        'status', 'profile_completed', 'lead_id', 'created_by', 'portal_password',
    ];

    protected $hidden = [
        'portal_password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'profile_completed' => 'boolean',
            'portal_password' => 'hashed',
        ];
    }

    /** Student portal authenticates on phone + portal_password via the `student` guard. */
    public function getAuthPassword(): string
    {
        return $this->portal_password;
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')->singleFile();
        $this->addMediaCollection('documents');
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function primaryEnrollment(): ?StudentEnrollment
    {
        return $this->enrollments()->where('type', 'primary')->first()
            ?? $this->enrollments()->first();
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(FeeInvoice::class);
    }

    public function moduleProgress(): HasMany
    {
        return $this->hasMany(ModuleProgress::class);
    }
}
