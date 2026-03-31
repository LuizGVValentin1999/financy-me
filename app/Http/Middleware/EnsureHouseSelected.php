<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHouseSelected
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->active_house_id) {
            $firstHouseId = $request->user()->houses()->value('houses.id');

            if ($firstHouseId) {
                $request->user()->update(['active_house_id' => $firstHouseId]);

                return $next($request);
            }

            return redirect()->route('house.choose');
        }

        return $next($request);
    }
}
