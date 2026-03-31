<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinancialEntryController;
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
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    
    Route::get('/contas', [AccountController::class, 'index'])->name('accounts.index');
    Route::post('/contas', [AccountController::class, 'store'])->name('accounts.store');
    Route::patch('/contas/{account}', [AccountController::class, 'update'])->name('accounts.update');
    Route::delete('/contas/lote', [AccountController::class, 'destroyMany'])->name('accounts.destroy-many');
    Route::delete('/contas/{account}', [AccountController::class, 'destroy'])->name('accounts.destroy');

    Route::get('/financeiro', [FinancialEntryController::class, 'index'])->name('financial.index');
    Route::post('/financeiro', [FinancialEntryController::class, 'store'])->name('financial.store');
    Route::patch('/financeiro/{financialEntry}', [FinancialEntryController::class, 'update'])->name('financial.update');
    Route::delete('/financeiro/lote', [FinancialEntryController::class, 'destroyMany'])->name('financial.destroy-many');
    Route::delete('/financeiro/{financialEntry}', [FinancialEntryController::class, 'destroy'])->name('financial.destroy');
    
    Route::get('/categorias', [CategoryController::class, 'index'])->name('categories.index');
    Route::post('/categorias', [CategoryController::class, 'store'])->name('categories.store');
    Route::patch('/categorias/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categorias/lote', [CategoryController::class, 'destroyMany'])->name('categories.destroy-many');
    Route::delete('/categorias/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::get('/produtos', [ProductController::class, 'index'])->name('products.index');
    Route::post('/produtos', [ProductController::class, 'store'])->name('products.store');
    Route::post('/produtos/rapido', [ProductController::class, 'quickStore'])->name('products.quick-store');
    Route::patch('/produtos/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/produtos/lote', [ProductController::class, 'destroyMany'])->name('products.destroy-many');
    Route::delete('/produtos/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::get('/estoque', [StockController::class, 'index'])->name('stock.index');
    Route::post('/estoque/retirada', [StockController::class, 'withdraw'])->name('stock.withdraw');

    Route::get('/compras', [PurchaseEntryController::class, 'index'])->name('purchases.index');
    Route::post('/compras', [PurchaseEntryController::class, 'store'])->name('purchases.store');
    Route::patch('/compras/{purchaseEntry}', [PurchaseEntryController::class, 'update'])->name('purchases.update');
    Route::post('/compras/importar-link', [PurchaseEntryController::class, 'importFromLink'])->name('purchases.import-link');
    Route::post('/compras/importar-confirmar', [PurchaseEntryController::class, 'confirmImported'])->name('purchases.import-confirm');
    Route::delete('/compras/importacao', [PurchaseEntryController::class, 'clearImported'])->name('purchases.import-clear');
    Route::delete('/compras/lote', [PurchaseEntryController::class, 'destroyMany'])->name('purchases.destroy-many');
    Route::delete('/compras/{purchaseEntry}', [PurchaseEntryController::class, 'destroy'])->name('purchases.destroy');
    Route::get('/notas-fiscais', [PurchaseInvoiceController::class, 'index'])->name('invoices.index');
    Route::delete('/notas-fiscais/{purchaseInvoice}', [PurchaseInvoiceController::class, 'destroy'])->name('invoices.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
