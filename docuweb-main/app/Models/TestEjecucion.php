<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestEjecucion extends Model
{
    // El pluralizador en inglés de Eloquent convertiría "TestEjecucion" en
    // "test_ejecucions" (le falta la "e"); forzamos el nombre real de la tabla.
    protected $table = 'test_ejecuciones';

    const ESTADOS = ['Exitoso', 'Fallido', 'Bloqueado'];

    protected $fillable = [
        'test_caso_id',
        'ejecutado_por',
        'estado',
        'ambiente',
        'observaciones',
        'ejecutado_en',
    ];

    protected $casts = [
        'ejecutado_en' => 'datetime',
    ];

    public function caso()
    {
        return $this->belongsTo(TestCaso::class, 'test_caso_id');
    }

    public function ejecutor()
    {
        return $this->belongsTo(User::class, 'ejecutado_por');
    }

    public function pasos()
    {
        return $this->hasMany(TestEjecucionPaso::class, 'test_ejecucion_id');
    }
}
