package cl.ciempi.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Rect;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Lo que la web necesita del teléfono y no trae Capacitor (ver src/plataforma/telefono.ts).
 *
 * - El gesto "atrás" (deslizar desde el borde) ya no cierra la app: avisa a la
 *   web con el evento "atras", y ella decide (volver de pantalla o nada).
 * - `excluir` le pide a Android que no tome el gesto "atrás" en ciertas zonas,
 *   como la pista donde el niño arrastra a Ciempi de borde a borde.
 * - `instalarVoz` abre la descarga de voces del motor de voz del teléfono.
 */
@CapacitorPlugin(name = "Telefono")
public class TelefonoPlugin extends Plugin {

    @Override
    public void load() {
        getActivity()
            .getOnBackPressedDispatcher()
            .addCallback(
                getActivity(),
                new OnBackPressedCallback(true) {
                    @Override
                    public void handleOnBackPressed() {
                        notifyListeners("atras", null);
                    }
                }
            );
    }

    /** Zonas en px CSS de la página: [{ x, y, ancho, alto }]. Una lista vacía las quita. */
    @PluginMethod
    public void excluirGestos(PluginCall call) {
        JSArray zonas = call.getArray("zonas", new JSArray());
        float densidad = getActivity().getResources().getDisplayMetrics().density;
        List<Rect> rects = new ArrayList<>();
        try {
            for (int i = 0; i < zonas.length(); i++) {
                JSONObject z = zonas.getJSONObject(i);
                int x = Math.round((float) z.getDouble("x") * densidad);
                int y = Math.round((float) z.getDouble("y") * densidad);
                int ancho = Math.round((float) z.getDouble("ancho") * densidad);
                int alto = Math.round((float) z.getDouble("alto") * densidad);
                rects.add(new Rect(x, y, x + ancho, y + alto));
            }
        } catch (JSONException e) {
            call.reject("Zonas inválidas", e);
            return;
        }
        getActivity()
            .runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    getBridge().getWebView().setSystemGestureExclusionRects(rects);
                }
                call.resolve();
            });
    }

    /** Manda la app al fondo (como el botón de inicio) en vez de cerrarla. */
    @PluginMethod
    public void minimizar(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().moveTaskToBack(true);
            call.resolve();
        });
    }

    /**
     * Abre la pantalla para descargar voces (en "Servicios de voz de Google",
     * el motor más común). Si no está, abre los ajustes de texto a voz.
     */
    @PluginMethod
    public void instalarVoz(PluginCall call) {
        Intent descargar = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA)
            .setPackage("com.google.android.tts")
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        Intent ajustes = new Intent("com.android.settings.TTS_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(descargar);
        } catch (ActivityNotFoundException e) {
            try {
                getContext().startActivity(ajustes);
            } catch (ActivityNotFoundException e2) {
                call.reject("No se pudo abrir la instalación de voces");
                return;
            }
        }
        call.resolve();
    }
}
