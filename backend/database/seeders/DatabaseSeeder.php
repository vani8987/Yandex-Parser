<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {

        User::query()->create([
            'name' => 'admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('qwerty123'),
        ]);
    }
}
