<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 20)->nullable();
            $table->string('nid', 20)->nullable();
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->text('present_address')->nullable();
            $table->text('permanent_address')->nullable();
            $table->foreignId('institution_id')->nullable()->constrained()->nullOnDelete();
            $table->string('roll', 30)->nullable();
            $table->string('passing_year', 10)->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_relation', 30)->nullable();
            $table->string('guardian_phone', 20)->nullable();
            $table->string('status', 20)->default('prospect');
            $table->boolean('profile_completed')->default(false);
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('portal_password')->nullable(); // hashed, for student portal login
            $table->timestamps();

            $table->index('status');
            $table->index('phone');
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
        });

        Schema::table('contact_histories', function (Blueprint $table) {
            $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
        });

        Schema::table('follow_ups', function (Blueprint $table) {
            $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
        });

        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->foreignId('batch_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('enrolled_price')->default(0);
            $table->unsignedInteger('discount')->default(0);
            $table->date('enrolled_on');
            $table->string('status', 20)->default('active'); // active | dropped | completed
            $table->string('type', 20)->default('primary'); // primary | additional
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('added_reason')->nullable();
            $table->date('added_date')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'batch_id']);
            $table->index(['batch_id', 'status']);
        });

        Schema::create('module_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('course_modules')->cascadeOnDelete();
            $table->string('status', 20)->default('not_started'); // not_started | in_progress | completed
            $table->timestamps();

            $table->unique(['student_id', 'module_id']);
        });

        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->date('session_date');
            $table->foreignId('module_id')->nullable()->constrained('course_modules')->nullOnDelete();
            $table->foreignId('marked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['batch_id', 'session_date', 'module_id']);
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('attendance_sessions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20); // present | absent | late | excused
            $table->timestamps();

            $table->unique(['session_id', 'student_id']);
        });

        Schema::create('enrollment_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->foreignId('session_id')->constrained('course_sessions')->restrictOnDelete();
            $table->foreignId('batch_id')->constrained()->restrictOnDelete();
            $table->string('payment_option', 20); // pay_now | pay_later
            $table->string('status', 20)->default('pending'); // pending | approved | rejected
            $table->date('requested_date');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('reviewed_date')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
        });

        Schema::table('contact_histories', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
        });

        Schema::table('follow_ups', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
        });

        Schema::dropIfExists('enrollment_requests');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('attendance_sessions');
        Schema::dropIfExists('module_progress');
        Schema::dropIfExists('student_enrollments');
        Schema::dropIfExists('students');
    }
};
