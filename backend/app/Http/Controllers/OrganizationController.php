<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrganizationRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use App\Models\Organization;
use App\Services\YandexMapsParser;
use App\Services\ReviewSyncService;

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
    YandexMapsParser $parser,
    ReviewSyncService $review
    ) {
        $url = $this->normalizeYandexUrl(
            $request->validated('yandex_url')
        );

        try {
            $data = $parser->parse($url);
        } catch (RuntimeException $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'yandex_url' => 'Яндекс Карты временно недоступны. Повторите попытку позже.',
            ]);
        }

        if (($data['name'] ?? '') === '' || empty($data['rating'])) {
            throw ValidationException::withMessages([
                'yandex_url' => 'Не удалось получить данные организации по этой ссылке.',
            ]);
        }

        $organization = Organization::firstOrCreate([
            'user_id' => $request->user()->id,
            'yandex_url' => $url,
        ]);

        $organization->update([
            'yandex_url' => $url,
            'name' => $data['name'],
            'rating' => $data['rating'],
            'ratings_count' => $data['ratings_count'] ?? 0,
            'reviews_count' => $data['reviews_count'] ?? 0,
        ]);

        $review->saveReviews($data['reviews'] ?? [], $organization);

        return response()->json([
            'organization' => $organization->fresh(),
        ], $organization->wasRecentlyCreated ? 201 : 200);
    }

    public function getAll(Request $request)
    {
        $organizations = $request->user()
            ->organizations()
            ->get()
            ->unique(fn (Organization $organization) =>
                $this->normalizeYandexUrl($organization->yandex_url)
            )
            ->values();

        return response()->json([
            'organizations' => $organizations,
        ], 200);
    }
}
