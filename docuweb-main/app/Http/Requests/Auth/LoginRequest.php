<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Intentos fallidos antes de bloquear la cuenta y minutos que dura el
     * bloqueo, al estilo de la política de bloqueo de cuentas de Redmine.
     */
    protected const MAX_INTENTOS_FALLIDOS = 10;
    protected const MINUTOS_BLOQUEO = 30;
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $user = User::where('email', $this->input('email'))->first();

        if ($user && $user->locked_until && $user->locked_until->isFuture()) {
            throw ValidationException::withMessages([
                'email' => 'Esta cuenta está bloqueada temporalmente por demasiados intentos fallidos. Volvé a intentar más tarde.',
            ]);
        }

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            if ($user) {
                $intentos = $user->failed_login_attempts + 1;
                $datos = ['failed_login_attempts' => $intentos];

                if ($intentos >= self::MAX_INTENTOS_FALLIDOS) {
                    $datos['locked_until'] = now()->addMinutes(self::MINUTOS_BLOQUEO);
                    $datos['failed_login_attempts'] = 0;
                }

                $user->update($datos);
            }

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        $authUser = Auth::user();

        if (! $authUser->activo) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => 'Esta cuenta está desactivada. Contactá a un administrador.',
            ]);
        }

        $authUser->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('email')).'|'.$this->ip());
    }
}
