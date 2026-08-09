<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_pay_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->string('rate_type', 20); // fixed | per_session | per_hour
            $table->unsignedInteger('rate_amount');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['teacher_id', 'batch_id']);
        });

        Schema::create('teacher_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('batch_id')->constrained()->restrictOnDelete();
            $table->string('type', 20); // lump_sum | installment | bonus | adjustment
            $table->string('period_label')->nullable();
            $table->unsignedInteger('computed_amount')->default(0);
            $table->unsignedInteger('amount');
            $table->string('status', 20)->default('pending'); // pending | approved | paid | rejected
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('requested_date')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('approved_date')->nullable();
            $table->foreignId('paid_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('paid_date')->nullable();
            $table->string('payment_method', 20)->nullable();
            $table->string('txn_ref')->nullable();
            $table->string('voucher_no', 30)->unique();
            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['teacher_id', 'batch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_payments');
        Schema::dropIfExists('teacher_pay_rates');
    }
};
