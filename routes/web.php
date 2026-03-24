<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseEntryController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/categorias', [CategoryController::class, 'index'])->name('categories.index');
    Route::post('/categorias', [CategoryController::class, 'store'])->name('categories.store');
    Route::delete('/categorias/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::get('/produtos', [ProductController::class, 'index'])->name('products.index');
    Route::post('/produtos', [ProductController::class, 'store'])->name('products.store');
    Route::delete('/produtos/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::get('/compras', [PurchaseEntryController::class, 'index'])->name('purchases.index');
    Route::post('/compras', [PurchaseEntryController::class, 'store'])->name('purchases.store');
    Route::post('/compras/importar-link', [PurchaseEntryController::class, 'importFromLink'])->name('purchases.import-link');
    Route::post('/compras/importar-confirmar', [PurchaseEntryController::class, 'confirmImported'])->name('purchases.import-confirm');
    Route::delete('/compras/importacao', [PurchaseEntryController::class, 'clearImported'])->name('purchases.import-clear');
    Route::delete('/compras/{purchaseEntry}', [PurchaseEntryController::class, 'destroy'])->name('purchases.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
