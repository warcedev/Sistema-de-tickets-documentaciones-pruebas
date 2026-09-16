<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestCaso extends Model
{
    const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Critica'];

    protected $fillable = [
        'suite_id',
        'ticket_id',
        'redmine_numero',
        'redmine_url',
        'titulo',
        'descripcion',
        'preparacion_entorno',
        'prioridad',
        'creado_por',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function suite()
    {
        return $this->belongsTo(TestSuite::class, 'suite_id');
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function pasos()
    {
        return $this->hasMany(TestCasoPaso::class, 'test_caso_id')->orderBy('orden');
    }

    public function ejecuciones()
    {
        return $this->hasMany(TestEjecucion::class, 'test_caso_id')->latest('ejecutado_en');
    }

    public function ultimaEjecucion()
    {
        return $this->hasOne(TestEjecucion::class, 'test_caso_id')->latestOfMany('ejecutado_en');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }
}
