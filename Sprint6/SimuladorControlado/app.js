// Para que se seleccionen colores distintos y que no se pueda enviar dos paquetes del mismo color a la vez.
let coloresActivos = new Set();
let escalaY = 0;
let numeroPaquetes = 0;
let conexionesPorNodo = []


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

AFRAME.registerComponent("reproducir", {
    init: function() {
        this.el.addEventListener("click", () => {
            // Asegurarse de que el componente envio-paquetes existe
            const envioEntity = document.querySelector('[envio-paquetes]');

            document.querySelectorAll('[animation__fadeout]').forEach(element => {
                element.emit('fadeout-resume');
            });
            envioEntity.components['envio-paquetes'].reanudar();
            document.querySelectorAll("[animation]").forEach((element) => {
                element.emit('animation-resume');
            });

            const trazador = document.querySelector('[trazador]');
            trazador.components['trazador'].reanudar();
            console.log("holaaa" + document.querySelector('[historial]'));
            console.log("quetalll"+document.querySelector('[historial]').components);

            // Asegurarse de que el componente simulacro existe
            const historialEntidad = document.querySelector('[historial]');
            historialEntidad.components['historial'].reanuda();


        });
    }
});

AFRAME.registerComponent("pausa", {
    init: function() {
        this.el.addEventListener("click", () => {
            const envioEntity = document.querySelector('[envio-paquetes]');
            envioEntity.components['envio-paquetes'].pausar();

            const trazador = document.querySelector('[trazador]');
            trazador.components['trazador'].pausar();
            
            // Emitir evento de pausa a todos los elementos con animaciones de difuminado
            document.querySelectorAll('[animation__fadeout]').forEach(element => {
                element.emit('fadeout-pause');
            });
            // Emitir evento de pausa a todos los elementos con animaciones
            document.querySelectorAll("[animation]").forEach((element) => {
                element.emit('animation-pause');
            });
            const historialEntidad = document.querySelector('[historial]');
            historialEntidad.components['historial'].pausado();
        });
    }
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
            easing: 'linear',
            resumeEvents: 'fadeout-resume',
            pauseEvents: 'fadeout-pause'
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
        this.pausado = false;
        this.traza();
    },
    traza: function () {
        this.interval = setInterval(() => {
            if(this.pausado)return;
            const globalPosition = new THREE.Vector3();
            this.el.object3D.getWorldPosition(globalPosition); // Obtiene la posición global

            const localPosition = this.historial.object3D.worldToLocal(globalPosition.clone()); // Convierte a local

            const entidad = document.createElement('a-entity');
            if (this.data.forma == 'caja') {
                entidad.setAttribute('geometry', 'primitive: box; width: 0.4; height: 0.1; depth: 0.4');
            } else if (this.data.forma == 'esfera') {
                entidad.setAttribute('geometry', 'primitive: sphere; radius: 0.05');
            } else if (this.data.forma == 'pc') {
                entidad.setAttribute('geometry', 'primitive: box; width: 0.2; height: 1; depth: 0.2');
                entidad.setAttribute("material", 'src: #pc; side: double');
            } else if (this.data.forma == 'router') {
                entidad.setAttribute('geometry', 'primitive: cylinder; radius: 0.2; height: 1');
                entidad.setAttribute('material', 'color: #808080');
            } else if (this.data.forma == 'hub') {
                entidad.setAttribute('geometry', 'primitive: box; width: 0.2; height: 1; depth: 0.2');
                entidad.setAttribute("material", 'src: #hub; side: double');
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
    },
    pausar: function() {
        this.pausado = true
    },

    reanudar: function() {
        this.pausado = false
    }
});

// Componente encargado de la creación y el envio de paquetes
AFRAME.registerComponent("envio-paquetes", {
    almacenTimeouts: [], // Almacenamiento de timeouts
    pausa: false,

    init: function() {
        this.escenario = document.querySelector("[escenario]");  // Asegurarse de que el escenario está definido
        this.envioPaquetes();
    },

    envioPaquetes: function() {
        fetch('packages.json')
        .then(response => response.json())
        .then(json => {
            json.packages.forEach(paquete => {
                const delay = paquete.time * 1000;
                const timeout = setTimeout(() => {
                    if (!this.pausa) {
                        numeroPaquetes +=1
                        this.animacion(paquete, numeroPaquetes);
                    }
                    // Elimina el timeout del almacen después de ejecutarse
                    this.almacenTimeouts = this.almacenTimeouts.filter(t => t.id !== timeout);
                }, delay);
                this.almacenTimeouts.push({ id: timeout, package: paquete, delay: delay, startTime: Date.now(), remainingTime: delay });
            })
        })
        .catch(error => console.error('Error loading packages.json:', error));
    },

    animacion: function(paquete) {
        if (paquete.route.length < 2) {
            console.error("Ruta no valida");
            return;
        }
        const pqt = document.createElement('a-entity');
        const color = colorAleatorio(); 
        pqt.setAttribute('geometry', {primitive: "box", width:0.3, height:0.3, depth:0.3});
        pqt.setAttribute('material', {color: color });

        this.escenario.appendChild(pqt);
        const salida = document.getElementById(paquete.route[0]);
        pqt.object3D.position.copy(salida.object3D.position);

        pqt.setAttribute('trazador', {forma: 'esfera', intervalo: 30});
        const movimiento = (i) => {
            if (i >= paquete.route.length) {
                this.escenario.removeChild(pqt);
                liberarColor(color);
                return;
            }
            const siguiente = document.getElementById(paquete.route[i]);
            if (siguiente) {
                pqt.setAttribute('animation', {
                    property: 'position',
                    to: `${siguiente.object3D.position.x} ${siguiente.object3D.position.y} ${siguiente.object3D.position.z}`,
                    dur: 2000,
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
                this.animacion(t.package);
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
        this.el.addEventListener("click",()=>{
            // creo la entidad donde se localizará todo el escenario
            const escenario = document.createElement("a-entity")
            escenario.setAttribute("escenario","movimiento: false");
            // añadimos la entidad que contiene todo el escenario al escenario de aframe
            const scene = document.querySelector('a-scene');
            scene.appendChild(escenario);

            // Eliminación de la caja (boton) de incio
            const inicio = document.querySelector("#iniciador");
            scene.removeChild(inicio);

            // Función que agrega controles para manejar el entorno
            this.agregarControles();

            // Función que crea el mapa descrito en el archivo Netgui.nkp
            this.construirMapa(escenario);

            // Función que mete los paquetes y lo envia entre nodos
            this.crearpaquete(escenario);

            this.crearhistorial(escenario);
            console.log(conexionesPorNodo)
            
        })
    },




    
    // Añado los controles (pausa y reprodución) que se quedaran fijos en la camara.
    agregarControles: function(){
        const camara = document.querySelector("#camara");

        // Boton de pausa
        const botonPausa = document.createElement('a-entity');
        botonPausa.setAttribute('geometry', {primitive: "box", width:1, height: 1, depth:1 })
        botonPausa.object3D.position.set(-7, -3, -7)
        botonPausa.setAttribute("material", {src: "#pausa"});
        botonPausa.setAttribute("pausa");
        camara.appendChild(botonPausa); // añado boton pausa
        botonPausa.setAttribute("pausa","");
        // Boton de reproducir
        const botonReproducir = document.createElement('a-entity');
        botonReproducir.setAttribute('geometry', {primitive: "box", width:1, height: 1, depth:1 })
        botonReproducir.object3D.position.set(7, -3, -7)
        botonReproducir.setAttribute("material", {src: "#reproducir"});
        camara.appendChild(botonReproducir); // añado boton reproducir
        botonReproducir.setAttribute("reproducir","");
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
                const hub = "NKHub"
                const router = "NKRouter"
                const pc = "NKCompaq"
                if (node.type.includes(pc)){
                //if (node.type == "NKCompaq"){
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "box", width:2, height: 2, depth:2 })
                    //entidad.setAttribute('position', `${(node.position.x/20)-25} 0 ${((node.position.y/20)-25)} `);
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute("material", {src: "#pc", side: "double"});
                    entidad.setAttribute("id", node.name)
                    entidad.setAttribute('trazador', {forma: 'pc', intervalo: 1000});
                    escenario.appendChild(entidad);
                } else if (node.type.includes(hub)){
                //} else if (node.type == "NKHub"){
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "box", width:1, height: 0.2})
                    //entidad.setAttribute('position', `${(node.position.x/20)-25} 0 ${((node.position.y/20)-25)} `);
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute("material", {src: "#hub", side: "double"});
                    entidad.setAttribute("id", node.name)
                    entidad.setAttribute('trazador', {forma: 'hub', intervalo: 1000});
                    escenario.appendChild(entidad);
                } else if (node.type.includes(router)){
                //} else if (node.type == "NKRouter"){
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "cylinder", radius:1, height: 0.5})
                    //entidad.setAttribute('position', `${(node.position.x/20)-25} 0 ${((node.position.y/20)-25)} `);
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute('material', { color: "#808080" });
                    entidad.setAttribute("id", node.name)
                    entidad.setAttribute('trazador', {forma: 'router', intervalo: 1000});
                    escenario.appendChild(entidad); 
                }
                escenario.setAttribute('escalarMapa', 'velocidad: 1');
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
        .catch(error => console.error('Error al leer el archivo:', error));
    },
    crearpaquete: function (escenario){
        const entidad = document.createElement('a-entity');
        entidad.setAttribute('envio-paquetes','');
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


