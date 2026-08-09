<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->foreignId('institution_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source', 30); // visit | referral | walk-in | campaign | online | online_session
            $table->foreignId('interested_course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->string('status', 20)->default('new');
            $table->text('lost_reason')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('student_id')->nullable(); // set when converted
            $table->date('captured_on')->nullable();
            $table->timestamps();

            $table->index(['status', 'assigned_to']);
        });

        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('visited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('visit_date');
            $table->text('purpose')->nullable();
            $table->text('outcome')->nullable();
            $table->text('next_action')->nullable();
            $table->date('next_action_date')->nullable();
            $table->timestamps();
        });

        Schema::create('contact_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->nullable(); // FK added after students table exists
            $table->foreignId('contacted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 20); // visit | call | email | sms
            $table->text('notes')->nullable();
            $table->text('outcome')->nullable();
            $table->timestamp('contacted_at');
            $table->timestamps();
        });

        Schema::create('follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->nullable(); // FK added after students table exists
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('due_at');
            $table->string('status', 20)->default('pending'); // pending | done
            $table->text('notes')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('completed_date')->nullable();
            $table->timestamps();

            $table->index(['status', 'due_at']);
        });

        Schema::create('online_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('institution_id')->nullable()->constrained()->nullOnDelete();
            $table->string('platform', 30); // zoom | google_meet | facebook_live | youtube_live | ms_teams
            $table->foreignId('host_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('session_date');
            $table->time('start_time');
            $table->unsignedSmallInteger('duration_mins')->default(60);
            $table->string('meeting_link')->nullable();
            $table->string('status', 20)->default('scheduled'); // scheduled | completed | cancelled
            $table->unsignedInteger('registered_count')->default(0);
            $table->unsignedInteger('attended_count')->default(0);
            $table->unsignedInteger('leads_generated')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('marketing_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('month', 7); // YYYY-MM
            $table->unsignedSmallInteger('target')->default(0);
            $table->unsignedSmallInteger('achieved')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_targets');
        Schema::dropIfExists('online_sessions');
        Schema::dropIfExists('follow_ups');
        Schema::dropIfExists('contact_histories');
        Schema::dropIfExists('visits');
        Schema::dropIfExists('leads');
    }
};
