<?php

namespace App\Services;

use App\Models\Organization;

class ReviewSyncService {
    public function saveReviews(
        array $reviews,
        Organization $organization
    ): void {

        foreach ($reviews as $review) {
            $organization->reviews()->updateOrCreate(
                [
                    'author' => $review['author'],
                    'review_date' => $review['review_date'],
                ],
                [   
                    'text' => $review['text'],
                    'rating' => $review['rating'],
                ]
            );
        }
    }
}