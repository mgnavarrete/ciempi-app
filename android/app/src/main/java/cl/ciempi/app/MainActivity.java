package cl.ciempi.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TelefonoPlugin.class);
        super.onCreate(savedInstanceState);
        // La letra del sistema no agranda la app (el tamaño de la lectura está en
        // Ajustes): si no, las pantallas no caben y todo se desplaza.
        getBridge().getWebView().getSettings().setTextZoom(100);
        pantallaCompleta();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Al volver de otra app (o de un aviso) Android vuelve a mostrar las barras.
        if (hasFocus) pantallaCompleta();
    }

    /**
     * Sin barra de estado ni barra de navegación: nada de notificaciones ni
     * batería encima de la lectura. Deslizando desde el borde aparecen un
     * momento y se vuelven a esconder solas.
     */
    private void pantallaCompleta() {
        WindowInsetsControllerCompat barras = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        barras.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        barras.hide(WindowInsetsCompat.Type.systemBars());
    }
}
