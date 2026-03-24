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
        Schema::table('purchase_entries', function (Blueprint $table) {
            $table->foreignId('purchase_invoice_id')
                ->nullable()
                ->after('product_id')
                ->constrained('purchase_invoices')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('purchase_invoice_id');
        });
    }
};
