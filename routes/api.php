<?php

use App\Http\Controllers\OperationsController;
use Illuminate\Support\Facades\Route;

Route::prefix('ops')->group(function () {
    Route::match(['GET', 'POST'], '/migrate', [OperationsController::class, 'migrate'])->name('ops.migrate');
    Route::match(['GET', 'POST'], '/optimize-clear', [OperationsController::class, 'optimizeClear'])->name('ops.optimize-clear');
});
