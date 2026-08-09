<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institution extends Model
{
    protected $fillable = [
        'name', 'type', 'address', 'contact_person', 'phone', 'email',
        'mou_status', 'students_count', 'revenue', 'active_leads',
    ];

    public function departments(): HasMany
    {
        return $this->hasMany(InstitutionDepartment::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class);
    }
}
