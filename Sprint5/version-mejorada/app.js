// Para que se seleccionen colores distintos y que no se pueda enviar dos paquetes del mismo color a la vez.
let coloresActivos = new Set();
let escalaY = 0;


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

// Componente trazador
AFRAME.registerComponent("trazador", {
    schema: {
        forma: {type: 'string', default: 'caja'},
        intervalo: {type: 'int', default: 200}
    },
    init: function () {
        const historial = document.querySelector("[historial]");
        const material = this.el.getAttribute('material')
        const color = material.color
        console.log(this.data.intervalo)
        this.traza(historial, color)

    },
    traza:function(historial, color){
        console.log("dsdsdsds")
        console.log(this.interval)
        this.interval = setInterval(()=>{
            const posicion = this.el.getAttribute('position')
            const posicionHistorial = historial.getAttribute('position')
            const entidad = document.createElement('a-entity');
            if (this.data.forma == 'caja'){
                entidad.setAttribute('geometry', 'primitive: box; width: 0.4; height: 0.1; depth: 0.4');
                entidad.setAttribute('material', 'color', color);
                entidad.setAttribute('position', `${posicion.x} ${posicionHistorial.y} ${posicion.z}`);
                entidad.setAttribute('difuminado', '');
            } else if (this.data.forma == 'esfera'){
                entidad.setAttribute('geometry', 'primitive: sphere; radius: 0.05');
                entidad.setAttribute('material', 'color', color);
                entidad.setAttribute('position', `${posicion.x} ${posicionHistorial.y} ${posicion.z}`);
                entidad.setAttribute('difuminado', '');
            } else if (this.data.forma == 'pc'){
                entidad.setAttribute('geometry', {primitive: "box", width:0.2, height: 1, depth:0.2 })
                entidad.setAttribute('position', `${posicion.x} ${posicionHistorial.y} ${posicion.z}`);
                entidad.setAttribute("material", {src: "#pc", side: "double"});
            } else if (this.data.forma == 'router'){
                entidad.setAttribute('geometry', {primitive: "cylinder", radius:0.2, height: 1})
                entidad.setAttribute('material', { color: "#808080" })
                entidad.setAttribute('position', `${posicion.x} ${posicionHistorial.y} ${posicion.z}`);
            } else if (this.data.forma == 'hub'){
                entidad.setAttribute('geometry', {primitive: "box", width:0.2, height: 1, depth:0.2 })
                entidad.setAttribute("material", {src: "#hub", side: "double"});
                entidad.setAttribute('position', `${posicion.x} ${posicionHistorial.y} ${posicion.z}`);
                
            }
            document.querySelector("a-scene").appendChild(entidad);
        },this.data.intervalo)
    },
    remove: function() {
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
                        this.animacion(paquete);
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
});

AFRAME.registerComponent("historial", {
    schema: {
        movimientoVertical: {type: "number", default: 0.05},
        tiempo: {type: "number", default: 50}

    },

    interval: null,

    init: function () {
        
        this.movimientohistorial()
        console.log(this.data.movimientoVertical)

    },

    movimientohistorial: function() {
        
        this.interval = setInterval(() => {
            escalaY -= this.data.movimientoVertical
            this.el.setAttribute('position', `0 ${escalaY} 0`);            
        }, this.data.tiempo); 
    }
})

// Componente encargado de la creación del mapa en el que se realiza el envio
AFRAME.registerComponent("simulacro",{

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

            // Función que crea el mapa descrito en el archivo Netgui.nkp
            this.construirMapa(escenario);

            // Función que mete los paquetes y lo envia entre nodos
            this.crearpaquete(escenario);

            this.crearhistorial(escenario);
            
        })
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