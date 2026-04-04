<?php

namespace App\Http\Middleware;

use App\Services\HouseDataVersion;
use Closure;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        $assetVersion = parent::version($request) ?? 'app';
        $house = $request->user()?->getCurrentHouse();

        if (! $house) {
            return $assetVersion;
        }

        return sprintf(
            '%s|house:%s',
            $assetVersion,
            app(HouseDataVersion::class)->current((int) $house->id),
        );
    }

    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        $response = parent::handle($request, $next);
        $house = $request->user()?->getCurrentHouse();

        if (! $house) {
            return $response;
        }

        $houseDataVersion = app(HouseDataVersion::class)->current((int) $house->id);

        $response->headers->set('X-House-Id', (string) $house->id);
        $response->headers->set('X-House-Data-Version', $houseDataVersion);

        return $response;
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $houseDataVersion = null;
        
        // Create a custom user object with current house data
        if ($user) {
            $userData = $user->toArray();
            $currentHouse = $user->getCurrentHouse();
            
            if ($currentHouse) {
                $userData['currentHouse'] = [
                    'id' => $currentHouse->id,
                    'name' => $currentHouse->name,
                    'code' => $currentHouse->code,
                    'description' => $currentHouse->description,
                ];
                $houseDataVersion = app(HouseDataVersion::class)->current((int) $currentHouse->id);
            } else {
                $userData['currentHouse'] = null;
            }
            
            $user = (object) $userData;
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'cache' => [
                'houseDataVersion' => $houseDataVersion,
            ],
        ];
    }
}
