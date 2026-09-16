<script type="text/php">
if (isset($pdf)) {
    $font = $fontMetrics->getFont("DejaVu Sans", "normal");
    $texto = "Página {PAGE_NUM} de {PAGE_COUNT}";
    $ancho = $fontMetrics->get_text_width($texto, $font, 8);
    $anchoPagina = $pdf->get_width();
    $x = $anchoPagina - 40 - $ancho;
    $y = $pdf->get_height() - 32;
    $pdf->page_text($x, $y, $texto, $font, 8, array(0.55, 0.55, 0.55));
    $pdf->page_text(40, $y, "DOCWeb — Casos de Prueba", $font, 8, array(0.55, 0.55, 0.55));
}
</script>
