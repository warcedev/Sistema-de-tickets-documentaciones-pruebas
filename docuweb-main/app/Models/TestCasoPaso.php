<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestCasoPaso extends Model
{
    protected $fillable = [
        'test_caso_id',
        'orden',
        'paso',
        'resultado_esperado',
    ];

    public function caso()
    {
        return $this->belongsTo(TestCaso::class, 'test_caso_id');
    }
}
