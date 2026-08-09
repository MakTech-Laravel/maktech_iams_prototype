<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseModule extends Model
{
    protected $fillable = ['course_id', 'title', 'sequence', 'hours'];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
