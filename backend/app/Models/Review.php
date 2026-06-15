<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{   
    
    protected $fillable = [
        'organization_id',
        'author',
        'text',
        'rating',
        'review_date',
    ];

    public function organization() {
        return $this->belongsTo(Organization::class);
    }
}
