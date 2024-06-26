// Para que se seleccionen colores distintos y que no se pueda enviar dos paquetes del mismo color a la vez.
let coloresActivos = new Set();
let escalaY = 0;
let numeroPaquetes = 0;
let totalPaquetesEnviados = 0;
let totalPaquetes = 0;
let conexionesPorNodo = []
let durDefecto = 2000;

AFRAME.registerComponent('nombre-en-plano', {
    schema: {
        nombre: { type: 'string', default: '' }, // Nombre a mostrar en el plano
        x: { type: 'number', default: 0 }, // Posición en el eje X
        y: { type: 'number', default: 0 }, // Posición en el eje Y
        z: { type: 'number', default: 0 }  // Posición en el eje Z
    },

    init: function () {
        // Acceder al elemento de la escena de A-Frame
        const scene = document.querySelector('a-scene');

        // Crear una entidad grupo para contener el texto y el plano
        const grupo = document.createElement('a-entity');

        // Crear el plano de fondo
        const plano = document.createElement('a-plane');
        plano.setAttribute('color', 'black');
        plano.setAttribute('height', '1');
        plano.setAttribute('width', this.data.nombre.length * 0.5); // Ajustar ancho basado en la longitud del nombre
        plano.setAttribute('position', '0 0 0'); // Centro del grupo

        // Crear el texto
        const texto = document.createElement('a-text');
        texto.setAttribute('value', this.data.nombre);
        texto.setAttribute('color', 'white');
        texto.setAttribute('align', 'center');
        texto.setAttribute('position', '0 0 0.1'); // Ligeramente en frente del plano para evitar z-fighting

        // Añadir texto y plano al grupo
        grupo.appendChild(plano);
        grupo.appendChild(texto);

        // Configurar el grupo para mirar siempre a la cámara
        grupo.setAttribute('look-at', '[camera]');

        // Establecer la posición del grupo, asegurando que esté en la posición pasada a la función
        grupo.object3D.position.set(this.data.x - 1, this.data.y + 2, this.data.z);

        // Añadir el grupo a la escena
        scene.appendChild(grupo);
    }
});

function crearCuadroNombrePaquete(nombre, origen, destino, paquete) {
    const grupo = document.createElement('a-entity');
    const plano = document.createElement('a-plane');
    plano.setAttribute('color', 'black');
    plano.setAttribute('height', '0.5');
    plano.setAttribute('width', '2');
    plano.setAttribute('position', '0 0 0');

    const texto = document.createElement('a-text');
    texto.setAttribute('value', `ID: ${nombre} \n ${origen} -> ${destino}`);
    texto.setAttribute('color', 'white');
    texto.setAttribute('align', 'center');
    texto.setAttribute('position', '0 0 0.01');
    texto.setAttribute('side', 'double');

    grupo.appendChild(plano);
    grupo.appendChild(texto);
    grupo.setAttribute('look-at', '[camera]');


    // Posiciona el grupo encima del paquete
    grupo.object3D.position.set(1.2, 0, 0);

    paquete.appendChild(grupo);
}

function crearCuadroFin(){
    const camara = document.querySelector("#camara");
    const grupo = document.createElement('a-entity');
    
    const plano = document.createElement('a-plane');
    plano.setAttribute('color', 'black');
    plano.setAttribute('height', '0.7');
    plano.setAttribute('width', '2.4');
    plano.setAttribute('position', '-1, -2, -4');

    const texto = document.createElement('a-text');
    texto.setAttribute('value', `Simulacion finalizada \n ${totalPaquetes} Paquetes enviados`);
    texto.setAttribute('color', 'white');
    texto.setAttribute('align', 'center');
    texto.setAttribute('position', '-1, -2, -3.9');
    texto.setAttribute('side', 'double');

    grupo.appendChild(plano);
    grupo.appendChild(texto);
    camara.appendChild(grupo);
    grupo.setAttribute("id", "Cuadro-Fin");
}

function colorAleatorio() {
    let colorHex;
    do {
        const rojo = Math.floor(Math.random() * 256);
        const verde = Math.floor(Math.random() * 256);
        const azul = Math.floor(Math.random() * 256);
        colorHex = `#${rojo.toString(16).padStart(2, '0')}${verde.toString(16).padStart(2, '0')}${azul.toString(16).padStart(2, '0')}`;
    } while (coloresActivos.has(colorHex));  // Verificar si el color ya está en uso
    // Color en uso
    coloresActivos.add(colorHex); 
    return colorHex;
}

function liberarColor(color) {
    // Libero el color
    coloresActivos.delete(color);
}

// Define a custom component to restrict camera movement
AFRAME.registerComponent('movement-restrictor', {
    tick: function () {
      var position = this.el.getAttribute('position');
      if (position.y < -2) {
        position.y = -2; // Restrict y position to 0 or above
        this.el.setAttribute('position', position);
        
      }
    }
});


AFRAME.registerComponent("mostrar-historial", {
    init: function() {
        this.el.addEventListener("click", () => {
            this.mostrar()
            this.botonAtras()
        });
    },
    mostrar:function(){
        // Primero para la simulación porque nos centramos en el trayectod e un paquete ya realizado.
        const  componentePR = document.querySelector('#Boton-Pausa-Reanudar');
        if (componentePR){
            if(componentePR.components['pausa-reproducir'].getState()!== "pausa"){
                componentePR.components['pausa-reproducir'].setPause()
            }
            
        }

        
        const identificador =this.el.getAttribute("id");
        // Hacer invisibles todas las entidades con difuminado excepto el paquete seleccionado
        const entidades = document.querySelectorAll('[difuminado]');
        entidades.forEach(entidad => {
            if ((entidad.getAttribute('id') !== identificador)  && (entidad.getAttribute('id') !== "guia") ) {
                entidad.setAttribute('visible', 'false');
            }
        });
        const cuadroFin = document.querySelector("#Cuadro-Fin");
        if (cuadroFin){
            cuadroFin.parentNode.removeChild(cuadroFin);
        }else{
            componentePR.removeAttribute('geometry');
        }
    },
    botonAtras:function(){
        const camara = document.querySelector("#camara");
        const botonVuelta = document.createElement('a-entity');
        botonVuelta.setAttribute('geometry', {primitive: "box", width:0.99, height: 0.99, depth:0.99})
        botonVuelta.object3D.position.set(-1, -2, -4);
        botonVuelta.setAttribute("material", {src: "#atras"});
        botonVuelta.setAttribute("id", "Vuelta-Atras");
        camara.appendChild(botonVuelta);
        botonVuelta.addEventListener('click', () => {
            // Elimino Boton
            botonVuelta.parentNode.removeChild(botonVuelta);
            
            const componentePR = document.querySelector('[pausa-reproducir]');
            if (componentePR) {
                componentePR.setAttribute('geometry', {primitive: "box", width:1, height: 1, depth:1 })
                componentePR.setAttribute("material", {src: "#reproducir"});
            } else {
                crearCuadroFin()
            }
            const entidades = document.querySelectorAll('[difuminado]');
            entidades.forEach(entidad => {
                entidad.setAttribute('visible', 'true');
            });
        });
    }
})

AFRAME.registerComponent("pausa-reproducir", {
    init: function() {
        this.state = 'reproducir'; 
        this.el.addEventListener("click", () => {
            if (this.state ==='reproducir') {
                this.setPause()
            } else {
                this.setReproducir()
            }
        });
    },
    setPause:function() {
        this.state ='pausa'
        this.el.setAttribute("material", {src: "#reproducir"});
        const envioEntity = document.querySelector('[envio-paquetes]');
        envioEntity.components['envio-paquetes'].pausar();

        // Emitir evento de pausa a todos los elementos con animaciones
        document.querySelectorAll("[animation]").forEach((element) => {
            element.emit('animation-pause');
        });
        const historialEntidad = document.querySelector('[historial]');
        historialEntidad.components['historial'].pausado();

    },
    setReproducir:function() {
        this.state ='reproducir'
        this.el.setAttribute("material", {src: "#pausa"});
        // Asegurarse de que el componente envio-paquetes existe
        const envioEntity = document.querySelector('[envio-paquetes]');
        const botonreproducir = document.querySelectorAll('[reproducir]');
        const botonpausar = document.querySelectorAll('[pausa]');
        document.querySelectorAll("[animation]").forEach((element) => {
            element.emit('animation-resume');
        });

        envioEntity.components['envio-paquetes'].reanudar();
        console.log("holaaa" + document.querySelector('[historial]'));
        console.log("quetalll"+document.querySelector('[historial]').components);

        // Asegurarse de que el componente simulacro existe
        const historialEntidad = document.querySelector('[historial]');
        historialEntidad.components['historial'].reanuda();

    },
    finalSimulación:function(){
        this.setPause(); // Forzar la pausa
        const boton = document.querySelector('[pausa-reproducir]')
        boton.parentNode.removeChild(boton);
        crearCuadroFin()
    },
    getState: function() {
        return this.state;
    }
});


AFRAME.registerComponent("reinicio", {
    init: function(){
        this.el.addEventListener("click", () => {
            location.reload();
        });
    },
    
});


AFRAME.registerComponent('sonido', {

    init: function () {
        
        this.state ='sonando'
        this.el.addEventListener('click', () => {
            if (this.state ==='sonando') {
                this.setMuted()
            } else {
                this.setSound()
            }
        });
    },
    setSound:function() {
        this.state ='sonando'

        const botonSonido = document.querySelector('[sonido]');
        botonSonido.setAttribute("material", {src: "#sonando"});
    },
    setMuted:function() {
        this.state ='muteado'

        const botonSonido = document.querySelector('[sonido]');
        botonSonido.setAttribute("material", {src: "#silencio"});
    
    },
    getState: function() {
        return this.state;
    }
});


AFRAME.registerComponent('paquetes-enviados', {
    schema: {
      alturaPaquete: {type: 'number', default: 0.5}, // Altura de cada paquete
    },
    init: function () {
      this.pila = [];
    },
    agregarPaquete: function (paquete) {
      // Calcular la posición para el nuevo paquete en la pila
      const posicionBase = this.el.object3D.position;
      const nuevaAltura = (this.pila.length + 1) * this.data.alturaPaquete;
      
      paquete.setAttribute('position', `${posicionBase.x + 2} ${nuevaAltura} ${posicionBase.z+ 2}`);
      this.pila.push(paquete);
    }
});

// Click y muestro conexiones
AFRAME.registerComponent('direcciones',{
    init: function(){
        this.el.addEventListener("click", () => {
            const identififcador= this.el.getAttribute('id');
            const conexiones = conexionesPorNodo[identififcador]
            const ancho = (1.3 + conexiones.length - 1)* 1;
            const grupo = document.createElement('a-entity');

            // plano
            const plano = document.createElement('a-plane');
            plano.setAttribute('color', 'white');
            plano.setAttribute('height', '1');
            plano.setAttribute('width', ancho);
            plano.setAttribute('position', '0 0 0');

            // Crear el texto
            const texto = document.createElement('a-text');
            texto.setAttribute('value', `Conexiones: \n ${conexiones}`);
            texto.setAttribute('color', 'black');
            texto.setAttribute('align', 'center');
            texto.setAttribute('position', `0 0 0.01`);
            texto.setAttribute('side', 'double');

            // Añadir el plano y el texto al grupo
            grupo.appendChild(plano);
            grupo.appendChild(texto);

            // Configurar el grupo para mirar siempre a la cámara
            grupo.setAttribute('look-at', '[camera]');
            
            // Obtener la posición del elemento y ajustar la posición del grupo
            const posicion = this.el.object3D.position;
            grupo.object3D.position.set(posicion.x, posicion.y+1.3 , posicion.z+1.3);

            // Añadir el grupo a la escena
            const escena = document.querySelector('a-scene');
            escena.appendChild(grupo);
            setTimeout(() => {
                escena.removeChild(grupo);
            }, 5000);
        });
    },
});


// Componente difuminado
AFRAME.registerComponent('difuminado',{
    schema: {
        tiempo: {type: "number", default:4000},
        opacidad: {type: "number", default:0.4}
    },
    init: function () {
        this.el.setAttribute('animation__fadeout', {
            property: 'material.opacity',
            to: this.data.opacidad,
            dur: this.data.tiempo,
            easing: 'linear'
        });
    }
});

AFRAME.registerComponent("trazador", {
    schema: {
        forma: {type: 'string', default: 'caja'},
        intervalo: {type: 'int', default: 200}
    },
    init: function () {
        // Acceder a la entidad historial
        this.historial = document.querySelector("[historial]");
        this.material = this.el.getAttribute('material');
        this.color = this.material.color;
        this.id = this.el.getAttribute('id')
        this.traza();
    },
    traza: function () {
        this.interval = setInterval(() => {
            const globalPosition = new THREE.Vector3();
            this.el.object3D.getWorldPosition(globalPosition); // Obtiene la posición global

            const localPosition = this.historial.object3D.worldToLocal(globalPosition.clone()); // Convierte a local
            id = this.el.getAttribute('id')
            const entidad = document.createElement('a-entity');
            if (this.data.forma == 'caja') {
                entidad.setAttribute('geometry', 'primitive: box; width: 0.4; height: 0.1; depth: 0.4');
                entidad.setAttribute('id', this.id);
            } else if (this.data.forma == 'esfera') {
                entidad.setAttribute('geometry', 'primitive: sphere; radius: 0.05');
                entidad.setAttribute('id', this.id);
            } else if (this.data.forma == 'pc') {
                entidad.setAttribute('geometry', 'primitive: box; width: 0.2; height: 1; depth: 0.2');
                entidad.setAttribute("material", 'src: #pc; side: double');
                entidad.setAttribute('id', "guia");
            } else if (this.data.forma == 'router') {
                entidad.setAttribute('geometry', 'primitive: cylinder; radius: 0.2; height: 1');
                entidad.setAttribute('material', 'color: #808080');
                entidad.setAttribute('id', "guia");
            } else if (this.data.forma == 'hub') {
                entidad.setAttribute('geometry', 'primitive: box; width: 0.2; height: 1; depth: 0.2');
                entidad.setAttribute("material", 'src: #hub; side: double');
                entidad.setAttribute('id', "guia");
            } else if (this.data.forma == "switch") {
                entidad.setAttribute('geometry', 'primitive: box; width: 0.2; height: 1; depth: 0.2');
                entidad.setAttribute("material", 'src: #switch; side: double');
                entidad.setAttribute('id', "guia");
            }
            entidad.setAttribute('material', 'color', this.color);
            entidad.setAttribute('position', `${localPosition.x} ${localPosition.y} ${localPosition.z}`);
            entidad.setAttribute('difuminado', '');
            this.historial.appendChild(entidad); // Agregar como hijo de historial
        }, this.data.intervalo);
    },
    remove: function () {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
});

// Componente encargado de la creación y el envio de paquetes
AFRAME.registerComponent("envio-paquetes", {
    almacenTimeouts: [], // Almacenamiento de timeouts
    pausa: false, 
    init: function() {
        this.escenario = document.querySelector("#escenario");  // Asegurarse de que el escenario está definido
        this.envioPaquetes();
    },

    envioPaquetes: function() {
        fetch('packages.json')
        .then(response => response.json())
        .then(json => {
            // Numero total de paquetes que se van a enviar en la simulación
            totalPaquetes = json.packages.length;
            json.packages.forEach(paquete => {
                const delay = paquete.time * 1000;
                const identificador = paquete.id
                const duracion = paquete.duracion
                const timeout = setTimeout(() => {
                    if (!this.pausa) {
                        numeroPaquetes++
                        this.animacion(paquete, identificador, duracion);  
                    }
                    
                    // Elimina el timeout del almacen después de ejecutarse
                    this.almacenTimeouts = this.almacenTimeouts.filter(t => t.id !== timeout);
                }, delay);
                this.almacenTimeouts.push({ id: timeout, package: paquete, delay: delay, startTime: Date.now(), remainingTime: delay, idpaquete: identificador, durpaquete:duracion});
            })
        })
        .catch(error => console.error('Error loading packages.json:', error));
    },

    animacion: function(paquete, id, duracion) {
        if (paquete.route.length < 2) {
            console.error("Ruta no valida");
            return;
        }
        if (id == ""){
            id = "paquete" + numeroPaquetes
            console.log(id)
        }
        if (duracion == ""){
            duracion = durDefecto;
            console.log("duración por defecto:" + duracion)
        }
        const pqt = document.createElement('a-entity');
        const color = colorAleatorio(); 
        pqt.setAttribute('geometry', {primitive: "box", width:0.5, height:0.5, depth:0.5});
        pqt.setAttribute('material', {color: color });
        this.escenario.appendChild(pqt);
        const salida = document.getElementById(paquete.route[0]);
        pqt.object3D.position.copy(salida.object3D.position);
        pqt.setAttribute('id', id)

        
        const destinoFinal = paquete.route[paquete.route.length - 1]; 
        const origen = paquete.route[0]; 
        crearCuadroNombrePaquete(id, origen, destinoFinal, pqt);

        pqt.setAttribute('trazador', {forma: 'esfera', intervalo: 30});
        pqt.setAttribute('mostrar-historial', ' ');
        const movimiento = (i) => {
            if (i >= paquete.route.length) {
                const destino = document.getElementById(paquete.route[i - 1]);
                if (destino){
                    const  sonido = document.querySelector('#BotonSonido');
                    if(sonido.components['sonido'].getState() == "sonando"){
                        const sonar = document.getElementById('logrado');
                        sonar.components.sound.playSound();
                    }
                    
                    destino.components['paquetes-enviados'].agregarPaquete(pqt);
                    pqt.removeAttribute('trazador')
                    totalPaquetesEnviados +=1
                }else{
                    console.log("No existe el nodos destino")
                }
                if (totalPaquetesEnviados == totalPaquetes){
                    setTimeout(()=>{
                        const componentePR = document.querySelector('#Boton-Pausa-Reanudar');
                        componentePR.components['pausa-reproducir'].finalSimulación()
                        console.log("puesse ha finalizado la simulación")
                    },2000)
                }
                
                liberarColor(color);
                return;
            }
            const siguiente = document.getElementById(paquete.route[i]);
            if (siguiente) {
                pqt.setAttribute('animation', {
                    property: 'position',
                    to: `${siguiente.object3D.position.x} ${siguiente.object3D.position.y} ${siguiente.object3D.position.z}`,
                    dur: duracion,
                    easing: 'linear',
                    resumeEvents: 'animation-resume',
                    pauseEvents: 'animation-pause'
                });
                pqt.addEventListener('animationcomplete', () => movimiento(i+1), {once: true}); 
            }
        };
        movimiento(1);
    },
    pausar: function() {
        this.pausa = true;
        this.almacenTimeouts = this.almacenTimeouts.map(t => {
            clearTimeout(t.id);  // Cancela el timeout actual
            const currentTime = Date.now();
            console.log("aqui")
            console.log(t.remainingTime)
            t.remainingTime = t.remainingTime - (currentTime - t.startTime);  // Calcula el tiempo restante
            console.log("despues")
            console.log(t.remainingTime)
            return t
        });
        console.log(this.almacenTimeouts)
    },
    reanudar: function() {
        this.pausa = false;
        this.almacenTimeouts.forEach(t => {

            const timeout = setTimeout(() => {
                numeroPaquetes++
                this.animacion(t.package,t.idpaquete, t.durpaquete);
                // Elimina el timeout del almacen después de ejecutarse
                this.almacenTimeouts = this.almacenTimeouts.filter(t => t.id !== timeout);
            }, t.remainingTime);
            t.startTime = Date.now();
            t.id = timeout; // Actualizar el ID del timeout
            
        });
        console.log(this.almacenTimeouts)
    }
});

AFRAME.registerComponent("historial", {
    schema: {
        movimientoVertical: {type: "number", default: 0.05},
        tiempo: {type: "number", default: 50}

    },
    pausa: false,
    interval: null,
    init: function () {
        
        this.movimientohistorial()
        console.log(this.data.movimientoVertical)

    },
    pausado: function() {
        this.pausa = true;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },
    reanuda: function() {
        this.pausa = false;
        this.movimientohistorial();
        
    },
    movimientohistorial: function() {
        
        this.interval = setInterval(() => {
            escalaY += this.data.movimientoVertical
            //console.log("estamos por aqui")
            //console.log(escalaY)
            if (!this.pausa){
                this.el.setAttribute('position', `0 ${escalaY} 0`);
            }
            
        }, this.data.tiempo); 
    }
})

// Componente encargado de la creación del mapa en el que se realiza el envio
AFRAME.registerComponent("simulacro",{
    pausa: false,
    interval: null,

    init:function () {
        this.iniciarSimulacion(); 
    },
    iniciarSimulacion: function (){
            // creo la entidad donde se localizará todo el escenario y la agrego a la escena
            const scene = document.querySelector('a-scene');
            const escenario = document.createElement("a-entity")
            escenario.setAttribute("id", "escenario");
            scene.appendChild(escenario);

            this.agregarControles();        // Agrego controles para manejar el entorno
            this.construirMapa(escenario);  // Dibuja la topología de la red
            this.crearpaquete(escenario);   // Crea los paquetes
            this.crearhistorial(escenario); // Crea el historial
    },  

    // Añado los controles (pausa y reprodución) que se quedaran fijos en la camara.
    agregarControles: function(){
        const camara = document.querySelector("#camara");

        // Boton de pausa/reanuda
        const botonpausaReproducir = document.createElement('a-entity');
        botonpausaReproducir.setAttribute('geometry', {primitive: "box", width:1, height: 1, depth:1 })
        botonpausaReproducir.object3D.position.set(-1, -2, -4)
        botonpausaReproducir.setAttribute("material", {src: "#pausa"});
        botonpausaReproducir.setAttribute("id", "Boton-Pausa-Reanudar")
        botonpausaReproducir.setAttribute("pausa-reproducir","");
        camara.appendChild(botonpausaReproducir); // añado boton pausa
        

        // Boton reinicio
        const botonReinicio = document.createElement('a-entity');
        botonReinicio.setAttribute('geometry', {primitive: "box", width:1, height: 1, depth:1 })
        botonReinicio.object3D.position.set(1, -2, -4)
        botonReinicio.setAttribute("material", {src: "#reset"});
        botonReinicio.setAttribute("id", "BotonReinicio")
        botonReinicio.setAttribute("reinicio","");
        camara.appendChild(botonReinicio); // añado boton pausa
        

        // Boton sonido
        const sonido = document.createElement('a-entity');
        sonido.setAttribute('geometry', {primitive: "box", width:1, height: 1, depth:0.01 })
        sonido.object3D.position.set(5, 2, -4)
        sonido.setAttribute("material", {src: "#sonando"});
        sonido.setAttribute("id", "BotonSonido")
        sonido.setAttribute("sonido","");
        camara.appendChild(sonido); // añado manejo sonido
        

    },

    construirMapa: function(escenario){
        // Leer el documento .JSON
        fetch('netgui.json')
            .then(response => response.json())
            .then(json => {
            const nodes = json.nodes;
            datosNetgui = json.nodes;
            // Crear entidades A-Frame
            nodes.forEach(node => {
                const entidad = document.createElement('a-entity');
                if (node.type.includes("NKCompaq")){
                    entidad.setAttribute('geometry', {primitive: "box", width:2, height: 2, depth:2 })
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute("material", {src: "#pc", side: "double"});
                    entidad.setAttribute("id", node.name)
                    entidad.setAttribute('trazador', {forma: 'pc', intervalo: 1000});
                    entidad.setAttribute('paquetes-enviados', ''); // Añadir el componente paquetes-enviados
                    entidad.setAttribute('nombre-en-plano', {nombre: node.name,x: node.position[0],y: 0,z: node.position[1]});
                    entidad.setAttribute('direcciones','');
                    escenario.appendChild(entidad);
                } else if (node.type.includes("NKHub")){
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "box", width:1, height: 0.2})
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute("material", {src: "#hub", side: "double"});
                    entidad.setAttribute("id", node.name)
                    entidad.setAttribute('trazador', {forma: 'hub', intervalo: 1000});
                    entidad.setAttribute('direcciones','');
                    entidad.setAttribute('nombre-en-plano', {nombre: node.name,x: node.position[0],y: 0,z: node.position[1]});
                    escenario.appendChild(entidad);
                } else if (node.type.includes("NKRouter")){
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "cylinder", radius:1, height: 0.5})
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute('material', { color: "#808080" });
                    entidad.setAttribute("id", node.name)
                    entidad.setAttribute('trazador', {forma: 'router', intervalo: 1000});
                    entidad.setAttribute('direcciones','');
                    entidad.setAttribute('nombre-en-plano', {nombre: node.name,x: node.position[0],y: 0,z: node.position[1]});
                    escenario.appendChild(entidad);
                }else if (node.type.include("NKSwitch")) {
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "box", width:1, height: 0.4})
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute("material", {src: "#switch", side: "double"});
                    entidad.setAttribute("id", node.name)
                    entidad.setAttribute('trazador', {forma: 'switch', intervalo: 1000});
                    entidad.setAttribute('direcciones','');
                    entidad.setAttribute('nombre-en-plano', {nombre: node.name,x: node.position[0],y: 0,z: node.position[1]});
                    escenario.appendChild(entidad);   
                }
            });
        
            const connections = json.connections;
            // Conectar entidades según las conexiones
            connections.forEach(connection => {
                const fromEntity = document.querySelector(`#${connection.from}`);
                const toEntity = document.querySelector(`#${connection.to}`);
    
                if (fromEntity && toEntity) {
                    const line = document.createElement('a-entity');
                    line.setAttribute('line', {
                        start: fromEntity.getAttribute('position'),
                        end: toEntity.getAttribute('position'),
                    });
                    escenario.appendChild(line);
                }
            });
            connections.forEach(connection => {
                if (!conexionesPorNodo[connection.from]) {
                    conexionesPorNodo[connection.from] = [];
                }
                if (!conexionesPorNodo[connection.to]) {
                    conexionesPorNodo[connection.to] = [];
                }
                conexionesPorNodo[connection.from].push(connection.to);
                conexionesPorNodo[connection.to].push(connection.from);
            });
        })
        .catch(error => console.error("Error al leer el archivo:", error));
    },
    crearpaquete: function (escenario){
        const entidad = document.createElement("a-entity");
        entidad.setAttribute("envio-paquetes","");
        entidad.setAttribute("id", "envio")
        escenario.appendChild(entidad);
    },
    crearhistorial: function (escenario){
        const historial = document.createElement("a-entity")
        historial.setAttribute('historial',{movimientoVertical: 0.05, tiempo: 50})
        historial.setAttribute("id", "historieta")
        escenario.appendChild(historial);
    }
});


