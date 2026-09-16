<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Cuántas contraseñas anteriores se recuerdan para impedir su reuso.
     */
    public const HISTORIAL_PASSWORDS_A_CONSERVAR = 5;

    protected $fillable = [
        'name',
        'apellido',
        'email',
        'password',
        'rol',
        'activo',
        'departamento_id',
        'departamento', // si todavía lo tenés como texto en users
        'cargo',
        'profile_photo_path',
        'failed_login_attempts',
        'locked_until',
        'debe_cambiar_password',
        'password_changed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'activo' => 'boolean',
        'locked_until' => 'datetime',
        'debe_cambiar_password' => 'boolean',
        'password_changed_at' => 'datetime',
    ];

    public function historialPasswords()
    {
        return $this->hasMany(PasswordHistory::class)->latest('id');
    }

    /**
     * Guarda el hash actual en el historial y recorta a las últimas N,
     * para poder impedir que el usuario reutilice una contraseña reciente.
     */
    public function registrarHistorialPassword(string $passwordHash): void
    {
        $this->historialPasswords()->create(['password_hash' => $passwordHash]);

        $idsAEliminar = $this->historialPasswords()
            ->skip(self::HISTORIAL_PASSWORDS_A_CONSERVAR)
            ->take(PHP_INT_MAX)
            ->pluck('id');

        if ($idsAEliminar->isNotEmpty()) {
            PasswordHistory::whereIn('id', $idsAEliminar)->delete();
        }
    }

    public function passwordFueUsadaAntes(string $passwordEnTextoPlano): bool
    {
        return $this->historialPasswords()
            ->get()
            ->contains(fn ($h) => Hash::check($passwordEnTextoPlano, $h->password_hash));
    }

    // Relación a departamentos (si users tiene departamento_id)
    public function departamento()
    {
        return $this->belongsTo(Departamento::class, 'departamento_id');
    }

    public function getProfilePhotoUrlAttribute()
    {
        return $this->profile_photo_path
            ? asset('storage/' . $this->profile_photo_path)
            : 'https://ui-avatars.com/api/?name=' . urlencode($this->name);
    }
}