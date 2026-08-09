<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('institutions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type', 20); // government | private
            $table->text('address')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('mou_status', 20)->default('none'); // signed | pending | none
            $table->unsignedInteger('students_count')->default(0);
            $table->unsignedBigInteger('revenue')->default(0);
            $table->unsignedInteger('active_leads')->default(0);
            $table->timestamps();
        });

        Schema::create('institution_departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['institution_id', 'name']);
        });

        Schema::create('labs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedSmallInteger('capacity');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('active'); // active | inactive
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('institution_departments');
        Schema::dropIfExists('institutions');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('labs');
    }
};
