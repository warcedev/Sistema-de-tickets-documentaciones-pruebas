<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestSuite extends Model
{
    protected $fillable = [
        'parent_id',
        'nombre',
        'descripcion',
        'creado_por',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function casos()
    {
        return $this->hasMany(TestCaso::class, 'suite_id');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function padre()
    {
        return $this->belongsTo(TestSuite::class, 'parent_id');
    }

    public function hijas()
    {
        return $this->hasMany(TestSuite::class, 'parent_id');
    }

    /**
     * Ids de esta suite + todas sus sub-suites (recursivo), a partir de una
     * colección plana ya cargada en memoria (evita N+1 al no volver a consultar).
     */
    public static function idsConDescendientes(int $id, $todasLasSuites): array
    {
        $ids = [$id];
        foreach ($todasLasSuites->where('parent_id', $id) as $hija) {
            $ids = array_merge($ids, self::idsConDescendientes($hija->id, $todasLasSuites));
        }

        return $ids;
    }
}
