<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class HouseDataVersion
{
    public function current(int $houseId): string
    {
        return Cache::rememberForever(
            $this->key($houseId),
            fn () => $this->newVersion(),
        );
    }

    public function bump(int $houseId): string
    {
        $nextVersion = $this->newVersion();

        Cache::forever($this->key($houseId), $nextVersion);

        return $nextVersion;
    }

    private function key(int $houseId): string
    {
        return "houses:{$houseId}:data_version";
    }

    private function newVersion(): string
    {
        return now()->format('YmdHisv').'-'.Str::lower(Str::random(8));
    }
}
