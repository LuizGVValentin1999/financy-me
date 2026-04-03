<?php

namespace App\Models;

use App\Traits\BelongsToHouse;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'house_id',
    'product_id',
    'direction',
    'origin',
    'quantity',
    'moved_at',
    'notes',
])]
class StockMovement extends Model
{
    use HasFactory, BelongsToHouse;

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'moved_at' => 'datetime',
        ];
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
