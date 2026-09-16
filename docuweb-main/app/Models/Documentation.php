<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Documentation extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'cover_image',
        'file_path',
        'department',
        'user_id',
    ];

    // Relación con el usuario (quién subió la documentación)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
