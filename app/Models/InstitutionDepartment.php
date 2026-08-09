<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstitutionDepartment extends Model
{
    protected $fillable = ['institution_id', 'name'];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }
}
