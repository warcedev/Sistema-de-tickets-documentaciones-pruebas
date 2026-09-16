<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestEjecucionPaso extends Model
{
    protected $fillable = [
        'test_ejecucion_id',
        'test_caso_paso_id',
        'paso_texto',
        'resultado_esperado_texto',
        'resultado',
        'observacion',
    ];

    protected $appends = ['paso', 'resultado_esperado'];

    public function ejecucion()
    {
        return $this->belongsTo(TestEjecucion::class, 'test_ejecucion_id');
    }

    public function pasoDefinicion()
    {
        return $this->belongsTo(TestCasoPaso::class, 'test_caso_paso_id');
    }

    public function adjuntos()
    {
        return $this->belongsToMany(
            Adjunto::class,
            'test_ejecucion_paso_adjuntos',
            'test_ejecucion_paso_id',
            'adjunto_id'
        );
    }

    /**
     * Texto del paso en el momento en que se ejecutó (snapshot histórico).
     * Si por algún dato viejo no hay snapshot guardado, cae de respaldo al
     * paso "en vivo" (puede ya no existir si se editó/borró el caso).
     */
    public function getPasoAttribute(): ?string
    {
        return $this->paso_texto ?: $this->pasoDefinicion?->paso;
    }

    public function getResultadoEsperadoAttribute(): ?string
    {
        return $this->resultado_esperado_texto ?: $this->pasoDefinicion?->resultado_esperado;
    }
}
