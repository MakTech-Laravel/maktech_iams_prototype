<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'department_id', 'name', 'code', 'duration_days', 'base_price',
        'status', 'seats', 'enrolled_count', 'description',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class)->orderBy('sequence');
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(CourseDiscount::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(CourseSession::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }
}
