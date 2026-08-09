<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('code', 30)->unique();
            $table->unsignedSmallInteger('duration_days');
            $table->unsignedInteger('base_price');
            $table->string('status', 20)->default('draft'); // active | draft | archived
            $table->unsignedSmallInteger('seats')->default(0);
            $table->unsignedSmallInteger('enrolled_count')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->unsignedSmallInteger('sequence');
            $table->unsignedSmallInteger('hours')->default(0);
            $table->timestamps();

            $table->unique(['course_id', 'sequence']);
        });

        Schema::create('course_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20); // percentage | flat
            $table->unsignedInteger('value');
            $table->string('reason')->nullable();
            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();
            $table->timestamps();
        });

        Schema::create('course_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 20)->default('upcoming'); // upcoming | ongoing | completed
            $table->timestamps();
        });

        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('course_sessions')->restrictOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->foreignId('coordinator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('lab_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('capacity');
            $table->string('status', 20)->default('upcoming'); // upcoming | ongoing | completed
            $table->timestamps();
        });

        Schema::create('batch_teacher', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['batch_id', 'teacher_id']);
        });

        Schema::create('class_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->nullable()->constrained('course_modules')->nullOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('room')->nullable();
            $table->string('mode', 20)->default('physical'); // physical | online
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_schedules');
        Schema::dropIfExists('batch_teacher');
        Schema::dropIfExists('batches');
        Schema::dropIfExists('course_sessions');
        Schema::dropIfExists('course_discounts');
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('courses');
    }
};
