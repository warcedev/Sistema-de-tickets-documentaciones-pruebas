/**
 * Quill (react-quill) solo acepta imágenes con src "data:", "http:" o
 * "https:" — cualquier otra cosa la reemplaza silenciosamente por "//:0"
 * (un ícono de imagen rota) cuando se aplica el delta. El botón de la
 * toolbar ya convierte el archivo a base64 antes de insertarlo, así que
 * siempre funciona. Pero al PEGAR una captura de pantalla o ARRASTRAR un
 * archivo de imagen, el navegador la entrega como una URL "blob:"/"file:",
 * que Quill rechaza y termina guardada como "//:0" para siempre.
 *
 * Esta función intercepta el pegado/arrastre de imágenes ANTES de que
 * Quill las procese (fase de "captura" del evento, para adelantarse al
 * listener interno de Quill) y las inserta ya convertidas a base64.
 */
export function fixQuillImagePaste(quill) {
    if (!quill) return () => {};

    const insertarComoBase64 = (file) => {
        if (!file || !file.type || !file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = () => {
            const seleccion = quill.getSelection(true) || {
                index: quill.getLength(),
                length: 0,
            };
            quill.insertEmbed(seleccion.index, "image", reader.result, "user");
            quill.setSelection(seleccion.index + 1, 0, "user");
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const archivosImagen = Array.from(items)
            .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
            .map((item) => item.getAsFile());

        if (archivosImagen.length === 0) return;

        // Evita que el manejador propio de Quill llegue a procesar este
        // paste (que insertaría la imagen con una URL blob: inválida).
        e.preventDefault();
        e.stopPropagation();
        archivosImagen.forEach(insertarComoBase64);
    };

    const handleDrop = (e) => {
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        const archivosImagen = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (archivosImagen.length === 0) return;

        e.preventDefault();
        e.stopPropagation();
        archivosImagen.forEach(insertarComoBase64);
    };

    // Fase de captura (tercer argumento "true"): así nos adelantamos al
    // listener de "paste"/"drop" que Quill ya tiene registrado en el mismo
    // elemento, que de otro modo procesaría la imagen primero y la rompería.
    quill.root.addEventListener("paste", handlePaste, true);
    quill.root.addEventListener("drop", handleDrop, true);

    return () => {
        quill.root.removeEventListener("paste", handlePaste, true);
        quill.root.removeEventListener("drop", handleDrop, true);
    };
}
