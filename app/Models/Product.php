<?php

namespace App\Models;

use App\Traits\BelongsToHouse;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'house_id',
    'category_id',
    'name',
    'brand',
    'sku',
    'unit',
    'type',
    'minimum_stock',
    'current_stock',
    'is_active',
    'notes',
])]
class Product extends Model
{
    use HasFactory, BelongsToHouse;

    protected function casts(): array
    {
        return [
            'minimum_stock' => 'decimal:3',
            'current_stock' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function purchaseEntries(): HasMany
    {
        return $this->hasMany(PurchaseEntry::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
