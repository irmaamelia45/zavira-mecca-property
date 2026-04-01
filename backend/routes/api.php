<?php

use App\Http\Controllers\Api\KprInfoController;
use App\Http\Controllers\Api\CompanyProfileController;
use App\Http\Controllers\Api\PromoController;
use App\Http\Controllers\Api\PerumahanController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\MarketingDashboardController;
use App\Http\Controllers\Api\MarketingBookingController;
use Illuminate\Support\Facades\Route;

Route::get('/kpr-contents', [KprInfoController::class, 'index']);
Route::get('/kpr-contents/{id}', [KprInfoController::class, 'show']);

Route::get('/company-profile', [CompanyProfileController::class, 'show']);

Route::get('/perumahan', [PerumahanController::class, 'indexPublic']);
Route::get('/perumahan/{id}', [PerumahanController::class, 'showPublic']);

Route::get('/promos', [PromoController::class, 'index']);
Route::get('/promos/{id}', [PromoController::class, 'show']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth.token')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);

    Route::get('/bookings/me', [BookingController::class, 'indexMine']);
    Route::get('/bookings/me/{id}', [BookingController::class, 'showMine']);
    Route::post('/bookings', [BookingController::class, 'store']);

    Route::middleware('role:marketing')->group(function () {
        Route::get('/marketing/dashboard/summary', [MarketingDashboardController::class, 'summary']);
        Route::get('/marketing/bookings', [MarketingBookingController::class, 'index']);
    });

    Route::middleware('role:admin,superadmin')->group(function () {
        Route::get('/admin/dashboard/summary', [AdminDashboardController::class, 'summary']);
        Route::get('/admin/users/marketing', [AdminUserController::class, 'indexMarketing']);
        Route::post('/admin/users/marketing', [AdminUserController::class, 'storeMarketing']);
        Route::delete('/admin/users/marketing/{id}', [AdminUserController::class, 'destroyMarketing']);

        Route::get('/admin/bookings', [BookingController::class, 'indexAdmin']);
        Route::get('/admin/bookings/{id}', [BookingController::class, 'showAdmin']);
        Route::patch('/admin/bookings/{id}/status', [BookingController::class, 'updateStatusAdmin']);

        Route::get('/admin/perumahan', [PerumahanController::class, 'indexAdmin']);
        Route::get('/admin/perumahan/options', [PerumahanController::class, 'optionsAdmin']);
        Route::get('/admin/perumahan/{id}', [PerumahanController::class, 'showAdmin']);
        Route::post('/admin/perumahan', [PerumahanController::class, 'store']);
        Route::put('/admin/perumahan/{id}', [PerumahanController::class, 'update']);
        Route::post('/admin/perumahan/{id}', [PerumahanController::class, 'update']);
        Route::delete('/admin/perumahan/{id}', [PerumahanController::class, 'destroy']);

        Route::post('/kpr-contents', [KprInfoController::class, 'store']);
        Route::put('/kpr-contents/{id}', [KprInfoController::class, 'update']);
        Route::delete('/kpr-contents/{id}', [KprInfoController::class, 'destroy']);

        Route::put('/company-profile', [CompanyProfileController::class, 'update']);
        Route::post('/company-profile', [CompanyProfileController::class, 'update']);

        Route::post('/promos', [PromoController::class, 'store']);
        Route::put('/promos/{id}', [PromoController::class, 'update']);
        Route::post('/promos/{id}', [PromoController::class, 'update']);
        Route::delete('/promos/{id}', [PromoController::class, 'destroy']);
    });

    Route::middleware('role:superadmin')->group(function () {
        Route::get('/admin/users/admins', [AdminUserController::class, 'indexAdmins']);
        Route::post('/admin/users/admins', [AdminUserController::class, 'storeAdmin']);
        Route::delete('/admin/users/admins/{id}', [AdminUserController::class, 'destroyAdmin']);
    });
});
