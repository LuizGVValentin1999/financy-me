<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'active_house_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function activeHouse(): BelongsTo
    {
        return $this->belongsTo(House::class, 'active_house_id');
    }

    public function houses(): BelongsToMany
    {
        return $this->belongsToMany(House::class, 'user_house')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function getCurrentHouse(): ?House
    {
        return $this->activeHouse ?? $this->houses()->first();
    }

    public function categories()
    {
        $house = $this->getCurrentHouse();

        return $house
            ? $house->categories()
            : Category::query()->whereRaw('1 = 0');
    }

    public function accounts()
    {
        $house = $this->getCurrentHouse();

        return $house
            ? $house->accounts()
            : Account::query()->whereRaw('1 = 0');
    }

    public function products()
    {
        $house = $this->getCurrentHouse();

        return $house
            ? $house->products()
            : Product::query()->whereRaw('1 = 0');
    }

    public function purchaseEntries()
    {
        $house = $this->getCurrentHouse();

        return $house
            ? $house->purchaseEntries()
            : PurchaseEntry::query()->whereRaw('1 = 0');
    }

    public function purchaseInvoices()
    {
        $house = $this->getCurrentHouse();

        return $house
            ? $house->purchaseInvoices()
            : PurchaseInvoice::query()->whereRaw('1 = 0');
    }

    public function financialEntries()
    {
        $house = $this->getCurrentHouse();

        return $house
            ? $house->financialEntries()
            : FinancialEntry::query()->whereRaw('1 = 0');
    }
}
