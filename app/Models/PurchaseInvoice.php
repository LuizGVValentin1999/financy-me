<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'store_name',
    'cnpj',
    'address',
    'invoice_number',
    'series',
    'access_key',
    'receipt_url',
    'issued_at',
    'items_count',
    'gross_amount',
    'discount_amount',
    'paid_amount',
])]
class PurchaseInvoice extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'issued_at' => 'date',
            'gross_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function purchaseEntries(): HasMany
    {
        return $this->hasMany(PurchaseEntry::class);
    }
}
