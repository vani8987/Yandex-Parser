<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Http\Request;

class ReviewsController extends Controller
{
    public function getAll(Organization $organization, Request $request)
    {

        $perReview = $request->integer('count', 50);

        if (! in_array($perReview, [10, 30, 50], true)) {
            $perReview = 50;
        }

        abort_unless($organization->user_id === $request->user()->id, 403);

        $reviews = $organization->reviews()
            ->latest('review_date')
            ->paginate($perReview);

        return response()->json([
            'reviews' => $reviews,
        ]);
    }
}
