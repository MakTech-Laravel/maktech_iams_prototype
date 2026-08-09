<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Batch extends Model
{
    protected $fillable = [
        'session_id', 'course_id', 'name', 'start_date', 'end_date',
        'coordinator_id', 'lab_id', 'capacity', 'status',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(CourseSession::class, 'session_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function coordinator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    public function lab(): BelongsTo
    {
        return $this->belongsTo(Lab::class);
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'batch_teacher', 'batch_id', 'teacher_id')
            ->withTimestamps();
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function classSchedules(): HasMany
    {
        return $this->hasMany(ClassSchedule::class);
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class);
    }

    public function teacherPayRates(): HasMany
    {
        return $this->hasMany(TeacherPayRate::class);
    }

    public function teacherPayments(): HasMany
    {
        return $this->hasMany(TeacherPayment::class);
    }

    /** Live capacity cap — min(batch.capacity, lab.capacity). */
    public function effectiveCapacity(): int
    {
        if ($this->lab) {
            return min($this->capacity, $this->lab->capacity);
        }

        return $this->capacity;
    }

    public function enrolledCount(): int
    {
        return $this->enrollments()->where('status', 'active')->count();
    }

    public function seatsAvailable(): int
    {
        return max(0, $this->effectiveCapacity() - $this->enrolledCount());
    }
}
