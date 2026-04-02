<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\House;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'houses' => $user->houses()
                ->get()
                ->map(fn (House $house) => [
                    'id' => $house->id,
                    'code' => $house->code,
                    'name' => $house->name,
                    'description' => $house->description,
                    'role' => $house->pivot->role,
                    'is_active' => $user->active_house_id === $house->id,
                ]),
            'active_house_id' => $user->active_house_id,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    public function destroyWithHouse(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();
        $house = $user->getCurrentHouse();

        if (! $house) {
            return Redirect::route('profile.edit')
                ->with('error', 'Nenhuma casa ativa encontrada para exclusao.');
        }

        $membership = $user->houses()
            ->where('houses.id', $house->id)
            ->first();

        if (! $membership || $membership->pivot->role !== 'admin') {
            return Redirect::route('profile.edit')
                ->with('error', 'Somente administradores podem excluir a casa ativa junto com a conta.');
        }

        if ($house->users()->count() !== 1) {
            return Redirect::route('profile.edit')
                ->with('error', 'A casa ativa so pode ser excluida quando apenas o seu usuario estiver vinculado a ela.');
        }

        Auth::logout();

        DB::transaction(function () use ($house, $user) {
            $house->delete();
            $user->delete();
        });

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
