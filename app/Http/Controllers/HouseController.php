<?php

namespace App\Http\Controllers;

use App\Models\House;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class HouseController extends Controller
{
    /**
     * Show the form to choose a house (create or join)
     */
    public function choose(): Response
    {
        return Inertia::render('House/Choose');
    }

    /**
     * Create a new house and assign the user to it
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|regex:/^[a-zA-Z0-9_-]+$/|unique:houses,code',
            'house_password' => 'required|string|min:6|confirmed',
        ]);

        try {
            DB::beginTransaction();

            $house = House::create([
                'name' => $request->name,
                'code' => strtolower($request->code),
                'password' => Hash::make($request->house_password),
            ]);

            // Attach user to house as admin (first user creating the house)
            $request->user()->houses()->attach($house->id, ['role' => 'admin']);

            // Set as active house
            $request->user()->update(['active_house_id' => $house->id]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return redirect(route('dashboard', absolute: false))
            ->with('success', 'Casa criada com sucesso!');
    }

    /**
     * Join an existing house
     */
    public function join(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string|exists:houses,code',
            'password' => 'required|string',
        ]);

        $house = House::where('code', strtolower($request->code))->firstOrFail();

        if (!Hash::check($request->password, $house->password)) {
            throw ValidationException::withMessages([
                'password' => 'Senha da casa incorreta.',
            ]);
        }

        // Check if user is already a member
        if ($request->user()->houses()->where('house_id', $house->id)->exists()) {
            return redirect(route('dashboard', absolute: false))
                ->with('info', 'Você já está um membro desta casa.');
        }

        try {
            DB::beginTransaction();

            // Attach user to house as member
            $request->user()->houses()->attach($house->id, ['role' => 'member']);

            // If user has no active house, set this one
            if (!$request->user()->active_house_id) {
                $request->user()->update(['active_house_id' => $house->id]);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return redirect(route('dashboard', absolute: false))
            ->with('success', 'Você entrou na casa com sucesso!');
    }

    /**
     * Set a house as active
     */
    public function setActive(House $house): RedirectResponse
    {
        // Verify user is a member of this house
        if (!auth()->user()->houses()->where('house_id', $house->id)->exists()) {
            abort(403, 'Não autorizado');
        }

        auth()->user()->update(['active_house_id' => $house->id]);

        return back()->with('success', 'Casa ativa atualizada!');
    }

    /**
     * List user's houses (for house selector)
     */
    public function list(): Response
    {
        $user = auth()->user();
        
        return Inertia::render('House/List', [
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
}
