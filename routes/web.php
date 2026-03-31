<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinancialEntryController;
use App\Http\Controllers\HouseController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseEntryController;
use App\Http\Controllers\PurchaseInvoiceController;
use App\Http\Controllers\StockController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    // House selection routes (no house required yet)
    Route::get('/house/choose', [HouseController::class, 'choose'])->name('house.choose');
    Route::post('/house/create', [HouseController::class, 'store'])->name('house.store');
    Route::post('/house/join', [HouseController::class, 'join'])->name('house.join');
    Route::get('/houses', [HouseController::class, 'list'])->name('houses.list');

    // Main app routes (require house selection)
    Route::middleware('house')->group(function () {
        Route::patch('/house/{house}/active', [HouseController::class, 'setActive'])->name('house.set-active');

        Route::get('/dashboard', DashboardController::class)->name('dashboard');
        
        Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');
        Route::post('/accounts', [AccountController::class, 'store'])->name('accounts.store');
        Route::patch('/accounts/{account}', [AccountController::class, 'update'])->name('accounts.update');
        Route::delete('/accounts/bulk', [AccountController::class, 'destroyMany'])->name('accounts.destroy-many');
        Route::delete('/accounts/{account}', [AccountController::class, 'destroy'])->name('accounts.destroy');

        Route::get('/financial', [FinancialEntryController::class, 'index'])->name('financial.index');
        Route::post('/financial', [FinancialEntryController::class, 'store'])->name('financial.store');
        Route::patch('/financial/{financialEntry}', [FinancialEntryController::class, 'update'])->name('financial.update');
        Route::delete('/financial/bulk', [FinancialEntryController::class, 'destroyMany'])->name('financial.destroy-many');
        Route::delete('/financial/{financialEntry}', [FinancialEntryController::class, 'destroy'])->name('financial.destroy');
        
        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/bulk', [CategoryController::class, 'destroyMany'])->name('categories.destroy-many');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::post('/products', [ProductController::class, 'store'])->name('products.store');
        Route::post('/products/quick', [ProductController::class, 'quickStore'])->name('products.quick-store');
        Route::patch('/products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('/products/bulk', [ProductController::class, 'destroyMany'])->name('products.destroy-many');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

        Route::get('/stock', [StockController::class, 'index'])->name('stock.index');
        Route::post('/stock/withdraw', [StockController::class, 'withdraw'])->name('stock.withdraw');

        Route::get('/purchases', [PurchaseEntryController::class, 'index'])->name('purchases.index');
        Route::post('/purchases', [PurchaseEntryController::class, 'store'])->name('purchases.store');
        Route::patch('/purchases/{purchaseEntry}', [PurchaseEntryController::class, 'update'])->name('purchases.update');
        Route::post('/purchases/import-link', [PurchaseEntryController::class, 'importFromLink'])->name('purchases.import-link');
        Route::post('/purchases/import-confirm', [PurchaseEntryController::class, 'confirmImported'])->name('purchases.import-confirm');
        Route::delete('/purchases/import-draft', [PurchaseEntryController::class, 'clearImported'])->name('purchases.import-clear');
        Route::delete('/purchases/bulk', [PurchaseEntryController::class, 'destroyMany'])->name('purchases.destroy-many');
        Route::delete('/purchases/{purchaseEntry}', [PurchaseEntryController::class, 'destroy'])->name('purchases.destroy');
        Route::get('/invoices', [PurchaseInvoiceController::class, 'index'])->name('invoices.index');
        Route::delete('/invoices/{purchaseInvoice}', [PurchaseInvoiceController::class, 'destroy'])->name('invoices.destroy');

        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });
});

require __DIR__.'/auth.php';

Route::fallback(function () {
    if (! Auth::check()) {
        return redirect()->route('login');
    }

    return Inertia::render('Errors/NotFound')
        ->toResponse(request())
        ->setStatusCode(404);
});
