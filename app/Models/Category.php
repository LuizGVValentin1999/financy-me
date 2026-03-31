<?php

namespace App\Models;

use App\Traits\BelongsToHouse;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['house_id', 'code', 'name', 'color', 'description'])]
class Category extends Model
{
    use HasFactory, BelongsToHouse;

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function financialEntries(): HasMany
    {
        return $this->hasMany(FinancialEntry::class);
    }
}
