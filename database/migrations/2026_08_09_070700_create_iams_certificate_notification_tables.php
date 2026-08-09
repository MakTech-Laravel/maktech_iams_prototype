<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->string('cert_no', 40)->nullable()->unique();
            $table->date('issue_date')->nullable();
            $table->string('status', 20)->default('pending'); // pending | issued | revoked
            $table->timestamps();

            $table->unique(['student_id', 'course_id']);
        });

        Schema::create('id_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('card_no', 30)->unique();
            $table->date('issue_date');
            $table->date('valid_till');
            $table->string('status', 20)->default('active'); // active | expired | revoked
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('recipient');
            $table->string('type', 50);
            $table->string('channel', 30);
            $table->text('message');
            $table->string('status', 20)->default('pending'); // pending | sent | failed
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('notification_rules', function (Blueprint $table) {
            $table->id();
            $table->string('trigger', 50)->unique();
            $table->string('channel', 30);
            $table->text('template');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_rules');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('id_cards');
        Schema::dropIfExists('certificates');
    }
};
