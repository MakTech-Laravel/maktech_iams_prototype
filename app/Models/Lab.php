<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lab extends Model
{
    protected $fillable = ['name', 'capacity', 'location', 'notes', 'status'];

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }
}
