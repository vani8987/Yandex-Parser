<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\ReviewsController;

use Illuminate\Support\Facades\Route;


Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group( function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/organizations', [OrganizationController::class, 'store']);
    Route::get('/organizations', [OrganizationController::class, 'getAll']);
    Route::get('/organization/{id}', [OrganizationController::class, 'getOne']);

    Route::get('/organizations/{organization}/reviews', [ReviewsController::class, 'getAll']);
});
