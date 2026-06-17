<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrganizationRequest;
use App\Jobs\RefreshOrganizationJob;
use App\Models\Organization;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    private function normalizeYandexUrl(string $url): string
    {
        $scheme = parse_url($url, PHP_URL_SCHEME);
        $host = parse_url($url, PHP_URL_HOST);
        $path = parse_url($url, PHP_URL_PATH);

        return strtolower($scheme.'://'.$host).rtrim($path, '/').'/';
    }

    public function store(
        StoreOrganizationRequest $request,
    ) {
        $url = $this->normalizeYandexUrl(
            $request->validated('yandex_url')
        );

        $organization = Organization::firstOrCreate([
            'user_id' => $request->user()->id,
            'yandex_url' => $url,
        ]);

        $needRefresh =
            $organization->wasRecentlyCreated
            || $organization->updated_at->lte(now()->subHours(1));

        if ($needRefresh) {
            RefreshOrganizationJob::dispatch($organization);
        }

        return response()->json([
            'organization' => $organization->fresh(),
            'message' => 'Обновление организации запущено',
        ], $organization->wasRecentlyCreated ? 201 : 200);
    }

    public function getOne(Request $request, int $id)
    {
        $organization = $request->user()
            ->organizations()
            ->findOrFail($id);

        return response()->json([
            'organization' => $organization->fresh(),
        ]);
    }

    public function getAll(Request $request)
    {
        $organizations = $request->user()
            ->organizations()
            ->get()
            ->unique(fn (Organization $organization) => $this->normalizeYandexUrl($organization->yandex_url)
            )
            ->values();

        return response()->json([
            'organizations' => $organizations,
        ], 200);
    }
}
