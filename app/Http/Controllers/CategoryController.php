<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
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
            ->withCount('products')
            ->latest()
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'kind' => $category->kind,
                'color' => $category->color,
                'description' => $category->description,
                'products_count' => $category->products_count,
                'created_at' => $category->created_at?->toDateString(),
            ]);

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'kinds' => [
                ['value' => 'produto', 'label' => 'Produto'],
                ['value' => 'servico', 'label' => 'Servico'],
            ],
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $request->user()->categories()->create($request->validated());

        return back()->with('success', 'Categoria criada com sucesso.');
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        abort_unless($category->user_id === $request->user()->id, 404);

        $category->delete();

        return back()->with('success', 'Categoria removida.');
    }
}
