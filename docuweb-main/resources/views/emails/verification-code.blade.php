<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Código de Verificación</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 0 8px rgba(0,0,0,0.1);">
        <h2 style="color: #ff6600;">Verificación de Cuenta</h2>
        <p>Hola,</p>
        <p>Tu código de verificación es:</p>
        <h1 style="color: #000; letter-spacing: 4px;">{{ $code }}</h1>
        <p>Ingresá este código en la página de verificación para activar tu cuenta.</p>
        <hr>
        <small>© {{ date('Y') }} DOCWeb — Departamento de TI</small>
    </div>
</body>
</html>
