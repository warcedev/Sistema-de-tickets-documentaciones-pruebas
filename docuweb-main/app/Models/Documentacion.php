<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Documentacion extends Model
{
    protected $table = 'documentacions';

    protected $fillable = [
        'titulo',
        'contenido',
        'portada',
        'user_id',
    ];

    /**
     * Autor
     */
    public function autor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Departamentos (MANY-TO-MANY)
     */
    public function departamentos()
    {
        return $this->belongsToMany(
            Departamento::class,
            'documentacions_departamentos',
            'documentacion_id',
            'departamento_id'
        );
    }

    /**
     * Tags (MANY-TO-MANY)
     */
    public function tags()
    {
        return $this->belongsToMany(
            Tag::class,
            'documentacions_tags',
            'documentacion_id',
            'tag_id'
        );
    }

    /**
     * Adjuntos (MANY-TO-MANY)
     */
    public function adjuntos()
    {
        return $this->belongsToMany(
            Adjunto::class,
            'documentacions_adjuntos',
            'documentacion_id',
            'adjunto_id'
        );
    }

    /**
     * Los usuarios con departamento asignado solo ven documentos de su propio
     * departamento (o documentos sin departamento asignado, que se consideran
     * generales). Administrador y usuarios sin departamento ven todo.
     */
    public function scopeVisiblePara($query, User $user)
    {
        if ($user->rol === 'Administrador' || $user->departamento_id === null) {
            return $query;
        }

        return $query->where(function ($q) use ($user) {
            $q->doesntHave('departamentos')
                ->orWhereHas('departamentos', fn ($qq) => $qq->where('departamento_id', $user->departamento_id));
        });
    }

    public function esVisiblePara(User $user): bool
    {
        if ($user->rol === 'Administrador' || $user->departamento_id === null) {
            return true;
        }

        $departamentos = $this->relationLoaded('departamentos')
            ? $this->departamentos
            : $this->departamentos()->get();

        if ($departamentos->isEmpty()) {
            return true;
        }

        return $departamentos->contains('id', $user->departamento_id);
    }
}