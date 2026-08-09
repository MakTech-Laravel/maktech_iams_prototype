<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    protected $fillable = [
        'name', 'phone', 'email', 'institution_id', 'source',
        'interested_course_id', 'status', 'lost_reason', 'assigned_to',
        'student_id', 'captured_on',
    ];

    protected function casts(): array
    {
        return ['captured_on' => 'date'];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function interestedCourse(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'interested_course_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function contactHistories(): HasMany
    {
        return $this->hasMany(ContactHistory::class);
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(FollowUp::class);
    }
}
