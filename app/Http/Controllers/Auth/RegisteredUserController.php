<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'house_action' => 'nullable|string|in:create,join',
            'house_name' => 'nullable|string|max:255',
            'house_code' => 'nullable|string|max:50|regex:/^[a-zA-Z0-9_-]+$/',
            'house_password' => 'nullable|string|min:6',
        ]);

        $houseAction = in_array($request->input('house_action'), ['create', 'join'], true)
            ? $request->string('house_action')->toString()
            : 'create';
        $fallbackHouseCode = Str::lower(Str::slug($request->string('name')->toString(), '_')).'_'.Str::lower(Str::random(6));
        $houseCode = Str::lower($request->string('house_code')->toString() ?: $fallbackHouseCode);
        $houseName = $request->string('house_name')->toString() ?: ($request->string('name')->toString().' Casa');
        $housePassword = $request->string('house_password')->toString() ?: $request->string('password')->toString();

        $targetHouse = null;

        if ($houseAction === 'join') {
            $targetHouse = House::query()->where('code', $houseCode)->first();

            if (! $targetHouse || ! Hash::check($housePassword, $targetHouse->password)) {
                throw ValidationException::withMessages([
                    'house_password' => 'Codigo ou senha da casa invalido.',
                ]);
            }
        }

        if ($houseAction === 'create' && House::query()->where('code', $houseCode)->exists()) {
            throw ValidationException::withMessages([
                'house_code' => 'Esse codigo de casa ja existe.',
            ]);
        }

        $user = DB::transaction(function () use ($request, $houseAction, $houseCode, $houseName, $housePassword, $targetHouse) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            $house = $targetHouse;

            if ($houseAction === 'create') {
                $house = House::create([
                    'name' => $houseName,
                    'code' => $houseCode,
                    'password' => Hash::make($housePassword),
                ]);
            }

            if ($house === null) {
                throw ValidationException::withMessages([
                    'house_code' => 'Casa nao encontrada.',
                ]);
            }

            $user->houses()->attach($house->id, [
                'role' => $houseAction === 'create' ? 'admin' : 'member',
            ]);

            $user->update([
                'active_house_id' => $house->id,
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
