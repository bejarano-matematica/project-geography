const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function reproducirTic() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

// VARIABLES GLOBALES
let cantidadTotalAlumnos = 0;
let turnoActual = 1;
let datosClase = [];
let nombreAlumnoJugando = "";
let provinciaElegidaActual = "";
let provinciasDisponibles = []; // <--- NUEVA LISTA

const overlay = document.getElementById('overlay');
const pConfig = document.getElementById('pantalla-configuracion');
const pTurno = document.getElementById('pantalla-turno');
const pPreguntas = document.getElementById('pantalla-preguntas');
const pResultados = document.getElementById('pantalla-resultados');

// FASE 1: CONFIGURACIÓN
document.getElementById('btnEmpezarJuego').addEventListener('click', () => {
    const cantidad = parseInt(document.getElementById('cantidadAlumnos').value);
    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Ingresá una cantidad válida.");
        return;
    }
    
    cantidadTotalAlumnos = cantidad;
    // Llenamos la lista de disponibles al empezar
    provinciasDisponibles = Array.from(document.querySelectorAll('#features path'));
    
    pConfig.style.display = 'none';
    document.getElementById('textoNumeroAlumno').innerText = "Alumno " + turnoActual;
    pTurno.style.display = 'block';
});

// FASE 2: TURNO
document.getElementById('btnGirarRuleta').addEventListener('click', () => {
    nombreAlumnoJugando = document.getElementById('nombreAlumnoActual').value.trim();
    if (nombreAlumnoJugando === "") {
        alert("Ingresá el nombre del alumno.");
        return;
    }
    
    if (provinciasDisponibles.length === 0) {
        alert("Ya no quedan provincias disponibles.");
        return;
    }

    pTurno.style.display = 'none';
    overlay.style.display = 'none';
    iniciarRuleta();
});

// FASE 3: RULETA (SIN REPETICIONES)
function iniciarRuleta() {
    let vueltasRealizadas = 0;
    let totalVueltas = 30 + Math.floor(Math.random() * 10);
    let velocidadActual = 50;

    function girar() {
        // Apagamos todas las provincias del mapa
        document.querySelectorAll('#features path').forEach(p => p.classList.remove('iluminada'));

        // Elegimos una solo de las DISPONIBLES
        const indiceAzar = Math.floor(Math.random() * provinciasDisponibles.length);
        const provSorteada = provinciasDisponibles[indiceAzar];
        
        provSorteada.classList.add('iluminada');
        reproducirTic();

        vueltasRealizadas++;

        if (vueltasRealizadas < totalVueltas) {
            velocidadActual *= 1.06;
            setTimeout(girar, velocidadActual);
        } else {
            provinciaElegidaActual = provSorteada.getAttribute('name');
            
            // LA QUITAMOS DE LA LISTA para que no vuelva a salir
            provinciasDisponibles = provinciasDisponibles.filter(p => p !== provSorteada);

            setTimeout(() => {
                mostrarPreguntas();
            }, 3500);
        }
    }
    girar();
}

function mostrarPreguntas() {
    overlay.style.display = 'flex';
    pPreguntas.style.display = 'block';
}

// GUARDAR RESPUESTAS
document.getElementById('btnGuardarRespuestas').addEventListener('click', () => {
    const respuestas = [
        document.getElementById('resp1').value,
        document.getElementById('resp2').value,
        document.getElementById('resp3').value,
        document.getElementById('resp4').value
    ];

    datosClase.push({
        alumno: nombreAlumnoJugando,
        provincia: provinciaElegidaActual,
        respuestas: respuestas
    });

    // Limpiar campos
    document.querySelectorAll('#pantalla-preguntas input').forEach(i => i.value = "");
    document.getElementById('nombreAlumnoActual').value = "";

    pPreguntas.style.display = 'none';
    turnoActual++;

    if (turnoActual > cantidadTotalAlumnos) {
        mostrarPantallaResultados();
    } else {
        document.getElementById('textoNumeroAlumno').innerText = "Alumno " + turnoActual;
        pTurno.style.display = 'block';
    }
});

// FASE FINAL: RESULTADOS
function mostrarPantallaResultados() {
    const lista = document.getElementById('listaResultados');
    lista.innerHTML = "";

    datosClase.forEach(dato => {
        lista.innerHTML += `
            <div style="margin-bottom: 15px; text-align: left; background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 0.9rem;">
                <strong>${dato.alumno} (${dato.provincia})</strong><br>
                1. ${dato.respuestas[0]} | 2. ${dato.respuestas[1]}<br>
                3. ${dato.respuestas[2]} | 4. ${dato.respuestas[3]}
            </div>`;
    });
    pResultados.style.display = 'block';
}

// COPIAR AL PORTAPAPELES
document.getElementById('btnCopiar').addEventListener('click', () => {
    let texto = "📍 RESULTADOS GEOGRAFÍA:\n\n";
    datosClase.forEach(d => {
        texto += `🎓 ${d.alumno} - ${d.provincia}\nR: ${d.respuestas.join(" / ")}\n\n`;
    });
    navigator.clipboard.writeText(texto);
    alert("¡Copiado al portapapeles!");
});

// ENVIAR POR WHATSAPP (Ajustado para App Inventor)
document.getElementById('btnWhatsApp').addEventListener('click', () => {
    let texto = "📍 *RESULTADOS GEOGRAFÍA*:\n\n";
    datosClase.forEach(d => {
        texto += `*${d.alumno}* (${d.provincia})\n_Respuestas:_ ${d.respuestas.join(" / ")}\n\n`;
    });
    
    const urlWhatsApp = "whatsapp://send?text=" + encodeURIComponent(texto);

    // Si detectamos que la página está abierta desde MIT App Inventor:
    if (window.AppInventor) {
        window.AppInventor.setWebViewString(urlWhatsApp);
    } else {
        // Por si la usás directo en la compu
        window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(texto), '_blank');
    }
});
