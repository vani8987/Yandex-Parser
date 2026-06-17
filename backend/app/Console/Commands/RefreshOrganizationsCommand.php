<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Services\ReviewSyncService;
use App\Services\YandexMapsParser;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('organizations:refresh')]
#[Description('Refresh organizations data from Yandex Maps')]
class RefreshOrganizationsCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(
        ReviewSyncService $reviewSyncService,
        YandexMapsParser $parser
    ) {
        $organizations = Organization::all();

        foreach ($organizations as $organization) {
            try {
                $data = $parser->parse($organization->yandex_url);

                $organization->update([
                    'name' => $data['name'],
                    'rating' => $data['rating'],
                    'ratings_count' => $data['ratings_count'] ?? 0,
                    'reviews_count' => $data['reviews_count'] ?? 0,
                ]);

                $reviewSyncService->saveReviews(
                    $data['reviews'] ?? [],
                    $organization,
                );

            } catch (\Throwable $e) {
                report($e);

                $this->error(
                    "Failed organization {$organization->id}"
                );
            }

            sleep(10);
        }

        return self::SUCCESS;
    }
}
