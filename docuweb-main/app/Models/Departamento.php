<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Departamento extends Model
{
    protected $fillable = [
        'nombre',
        'estado',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function documentaciones()
    {
        return $this->hasMany(Documentacion::class);
    }
}