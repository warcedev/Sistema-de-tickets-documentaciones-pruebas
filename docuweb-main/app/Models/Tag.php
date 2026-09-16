<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    protected $fillable = [
        'descripcion',
        'estado',
    ];

    public function documentaciones()
    {
        return $this->belongsToMany(
            Documentacion::class,
            'documentacions_tags',
            'tag_id',
            'documentacion_id'
        );
    }
}