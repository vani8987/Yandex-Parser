<?php

namespace App\Jobs;

use App\Models\Organization;
use App\Services\ReviewSyncService;
use App\Services\YandexMapsParser;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use RuntimeException;

class RefreshOrganizationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Organization $organization
    ) {
    }

    public function handle(
    YandexMapsParser $parser,
    ReviewSyncService $review
    ): void {

        try {
            $data = $parser->parse($this->organization->yandex_url);
        } catch (RuntimeException $exception) {
            report($exception);
            return;
        }

        if (($data['name'] ?? '') === '' || empty($data['rating'])) {           
            return;
        }

        $this->organization->update([
            'name' => $data['name'],
            'rating' => $data['rating'],
            'ratings_count' => $data['ratings_count'] ?? 0,
            'reviews_count' => $data['reviews_count'] ?? 0,
        ]);

        $review->saveReviews(
            $data['reviews'] ?? [],
            $this->organization
        );
    }
}