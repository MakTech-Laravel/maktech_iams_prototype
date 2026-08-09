<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_enrollment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_no', 30)->unique();
            $table->unsignedInteger('total');
            $table->unsignedInteger('paid')->default(0);
            $table->unsignedInteger('due')->default(0);
            $table->date('due_date');
            $table->string('status', 20)->default('due'); // due | partial | paid | overdue | cancelled
            $table->timestamps();

            $table->index(['student_id', 'status']);
        });

        Schema::create('payment_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('fee_invoices')->cascadeOnDelete();
            $table->unsignedSmallInteger('installment_no');
            $table->unsignedInteger('amount');
            $table->date('due_date');
            $table->string('status', 20)->default('pending'); // pending | paid | overdue
            $table->timestamps();

            $table->unique(['invoice_id', 'installment_no']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('fee_invoices')->restrictOnDelete();
            $table->foreignId('student_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('amount');
            $table->string('method', 20); // cash | bkash | nagad | bank | card | cheque | rocket
            $table->string('channel', 20)->default('physical'); // physical | online
            $table->foreignId('collected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('gateway_txn_id')->nullable();
            $table->string('receipt_no', 30)->unique();
            $table->timestamp('paid_at');
            $table->string('status', 20)->default('success'); // success | pending | failed
            $table->timestamps();

            $table->index(['method', 'channel', 'status']);
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('amount');
            $table->text('reason')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('requested'); // requested | approved | rejected | paid
            $table->date('requested_date');
            $table->timestamps();
        });

        Schema::create('course_migrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_course_id')->constrained('courses')->restrictOnDelete();
            $table->foreignId('to_course_id')->constrained('courses')->restrictOnDelete();
            $table->string('requested_by', 20); // student | staff
            $table->text('reason')->nullable();
            $table->unsignedInteger('old_paid')->default(0);
            $table->unsignedInteger('new_price')->default(0);
            $table->unsignedInteger('migration_fee')->default(0);
            $table->integer('net_adjustment')->default(0);
            $table->string('status', 20)->default('requested');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('requested_date');
            $table->timestamps();
        });

        Schema::create('discounts_given', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('amount');
            $table->foreignId('given_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason')->nullable();
            $table->date('given_date');
            $table->timestamps();
        });

        Schema::create('cash_handovers', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20); // bank_deposit | handover
            $table->date('handover_date');
            $table->unsignedInteger('amount');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('receipt_no', 30)->unique();
            $table->string('status', 20)->default('pending'); // pending | confirmed
            $table->text('notes')->nullable();
            // bank deposit fields
            $table->string('bank_name')->nullable();
            $table->string('account_no')->nullable();
            $table->string('branch')->nullable();
            $table->string('slip_no')->nullable();
            // person handover fields
            $table->foreignId('handed_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('confirmed_signature')->nullable();
            $table->date('confirmed_date')->nullable();
            $table->timestamps();
        });

        Schema::create('cash_handover_payment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_handover_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['cash_handover_id', 'payment_id']);
        });

        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('payment_terms')->nullable();
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('category', 50);
            $table->string('title');
            $table->unsignedInteger('amount');
            $table->foreignId('batch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->date('expense_date');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('pending'); // pending | approved | paid | rejected
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('vendors');
        Schema::dropIfExists('cash_handover_payment');
        Schema::dropIfExists('cash_handovers');
        Schema::dropIfExists('discounts_given');
        Schema::dropIfExists('course_migrations');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('payment_installments');
        Schema::dropIfExists('fee_invoices');
    }
};
