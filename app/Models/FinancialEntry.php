<?php

namespace App\Models;

use App\Traits\BelongsToHouse;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'house_id',
    'account_id',
    'category_id',
    'purchase_entry_id',
    'purchase_invoice_id',
    'direction',
    'origin',
    'amount',
    'moved_at',
    'description',
])]
class FinancialEntry extends Model
{
    use HasFactory, BelongsToHouse;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'moved_at' => 'date',
        ];
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function purchaseEntry(): BelongsTo
    {
        return $this->belongsTo(PurchaseEntry::class);
    }

    public function purchaseInvoice(): BelongsTo
    {
        return $this->belongsTo(PurchaseInvoice::class);
    }
}
