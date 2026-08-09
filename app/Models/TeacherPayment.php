<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherPayment extends Model
{
    protected $fillable = [
        'teacher_id', 'batch_id', 'type', 'period_label', 'computed_amount', 'amount',
        'status', 'requested_by', 'requested_date', 'approved_by', 'approved_date',
        'paid_by', 'paid_date', 'payment_method', 'txn_ref', 'voucher_no',
        'rejection_reason', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'requested_date' => 'date',
            'approved_date' => 'date',
            'paid_date' => 'date',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }
}
