<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Services\HouseDataVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = Category::latest()
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'code' => $category->code,
                'name' => $category->name,
                'color' => $category->color,
                'description' => $category->description,
                'created_at' => $category->created_at?->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse|JsonResponse
    {
        $house = $request->user()->getCurrentHouse();
        $category = $house->categories()->create($request->validated());
        app(HouseDataVersion::class)->bump((int) $house->id);

        if ($request->expectsJson()) {
            return response()->json([
                'category' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'color' => $category->color,
                ],
            ], 201);
        }

        return back()->with('success', 'Categoria criada com sucesso.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $house = $request->user()->getCurrentHouse();
        $category->update($request->validated());
        app(HouseDataVersion::class)->bump((int) $house->id);

        return back()->with('success', 'Categoria atualizada com sucesso.');
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        $house = $request->user()->getCurrentHouse();
        $category->delete();
        app(HouseDataVersion::class)->bump((int) $house->id);

        return back()->with('success', 'Categoria removida.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $house = $request->user()->getCurrentHouse();
        $ids = $request->input('ids', []);

        Category::whereIn('id', $ids)->delete();
        app(HouseDataVersion::class)->bump((int) $house->id);

        return back()->with('success', 'Categorias removidas com sucesso.');
    }
}
