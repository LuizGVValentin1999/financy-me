<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = $request->user()
            ->categories()
            ->latest()
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

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $request->user()->categories()->create($request->validated());

        return back()->with('success', 'Categoria criada com sucesso.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        abort_unless($category->user_id === $request->user()->id, 404);

        $category->update($request->validated());

        return back()->with('success', 'Categoria atualizada com sucesso.');
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        abort_unless($category->user_id === $request->user()->id, 404);

        $category->delete();

        return back()->with('success', 'Categoria removida.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $ids = $request->input('ids', []);

        $request->user()
            ->categories()
            ->whereIn('id', $ids)
            ->delete();

        return back()->with('success', 'Categorias removidas com sucesso.');
    }
}
