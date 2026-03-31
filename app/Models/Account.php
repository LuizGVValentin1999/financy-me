<?php

namespace App\Models;

use App\Traits\BelongsToHouse;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['house_id', 'code', 'name', 'initial_balance', 'initial_balance_date'])]
class Account extends Model
{
    use HasFactory, BelongsToHouse;

    protected function casts(): array
    {
        return [
            'initial_balance' => 'decimal:2',
            'initial_balance_date' => 'date',
        ];
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function purchaseEntries(): HasMany
    {
        return $this->hasMany(PurchaseEntry::class);
    }

    public function financialEntries(): HasMany
    {
        return $this->hasMany(FinancialEntry::class);
    }
}
