<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('store_name');
            $table->string('cnpj')->nullable();
            $table->string('address')->nullable();
            $table->string('invoice_number')->nullable();
            $table->string('series')->nullable();
            $table->string('access_key')->nullable();
            $table->string('receipt_url', 2000)->nullable();
            $table->date('issued_at')->nullable();
            $table->unsignedInteger('items_count')->default(0);
            $table->decimal('gross_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->timestamps();

            $table->index(['user_id', 'issued_at']);
            $table->index(['user_id', 'access_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_invoices');
    }
};
