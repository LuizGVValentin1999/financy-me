<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToHouse
{
    public static function bootBelongsToHouse()
    {
        static::addGlobalScope('house', function (Builder $builder) {
            if (auth()->check()) {
                $house = auth()->user()->getCurrentHouse();
                $hasExplicitHouseFilter = collect($builder->getQuery()->wheres ?? [])
                    ->contains(fn (array $where) => ($where['column'] ?? null) === 'house_id');

                if ($house && ! $hasExplicitHouseFilter) {
                    $builder->where('house_id', $house->id);
                }
            }
        });
    }
}
