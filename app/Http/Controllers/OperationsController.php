<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Throwable;

class OperationsController extends Controller
{
    public function migrate(Request $request): JsonResponse
    {
        if ($response = $this->guard($request)) {
            return $response;
        }

        try {
            Artisan::call('migrate', [
                '--force' => true,
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'ok' => false,
                'command' => 'migrate --force',
                'error' => class_basename($exception),
                'message' => $exception->getMessage(),
            ], 500);
        }

        return response()->json([
            'ok' => true,
            'command' => 'migrate --force',
            'output' => trim(Artisan::output()),
        ]);
    }

    public function optimizeClear(Request $request): JsonResponse
    {
        if ($response = $this->guard($request)) {
            return $response;
        }

        try {
            Artisan::call('optimize:clear');
        } catch (Throwable $exception) {
            return response()->json([
                'ok' => false,
                'command' => 'optimize:clear',
                'error' => class_basename($exception),
                'message' => $exception->getMessage(),
            ], 500);
        }

        return response()->json([
            'ok' => true,
            'command' => 'optimize:clear',
            'output' => trim(Artisan::output()),
        ]);
    }

    private function guard(Request $request): ?JsonResponse
    {
        if (! config('operations.route_enabled')) {
            return response()->json([
                'ok' => false,
                'message' => 'Not found.',
            ], 404);
        }

        $configuredToken = (string) config('operations.route_token');
        $requestToken = (string) ($request->header('X-Deploy-Token') ?: $request->query('token'));

        if ($configuredToken === '' || $requestToken === '' || ! hash_equals($configuredToken, $requestToken)) {
            return response()->json([
                'ok' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        return null;
    }
}
