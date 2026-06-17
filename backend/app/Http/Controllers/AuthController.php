<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {

        $isAuth = Auth::attempt($request->validated());

        if (! $isAuth) {
            return response()->json([
                'message' => 'неверный email или пароль',
            ], 422);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => $request->user(),
        ], 200);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'выход выполнен',
        ]);

    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ], 200);
    }
}
