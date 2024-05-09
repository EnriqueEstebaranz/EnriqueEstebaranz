// Para que se seleccionen colores distintos y que no se pueda enviar dos paquetes del mismo color a la vez.
let coloresActivos = new Set();

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
        opacidad: {type: "number", default:0.1}
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


        const escenario = document.querySelector("[escenario]");
        const material = this.el.getAttribute('material')
        const color = material.color
        console.log(this.data.intervalo)
        this.traza(escenario, color)

    },
    traza:function(escenario, color){
        console.log("dsdsdsds")
        console.log(this.interval)
        this.interval = setInterval(()=>{
            const posicion = this.el.getAttribute('position')
            const posicionEscenario = escenario.getAttribute('position')
            const entidad = document.createElement('a-entity');
            if (this.data.forma == 'caja'){
                entidad.setAttribute('geometry', 'primitive: box; width: 0.4; height: 0.1; depth: 0.4');
            } else if (this.data.forma == 'esfera'){
                entidad.setAttribute('geometry', 'primitive: sphere; radius: 0.05');
            }
            entidad.setAttribute('material', 'color', color);
            entidad.setAttribute('position', `${posicion.x} ${posicionEscenario.y} ${posicion.z}`);
            entidad.setAttribute('difuminado', '');
            document.querySelector('a-scene').appendChild(entidad);
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
    
    // init se llama automaticamente en cuanto el componente "____" se inicializa
    init: function(){  // Configuración inicial para el funcionamiento del componente
        const escenario = document.querySelector("[escenario]");
        this.envioPaquetes(escenario)
    },

    envioPaquetes: function(escenario){
        fetch('packages.json')
            .then(response => response.json())
            .then(json => {
            const paquetes = json.packages
                paquetes.forEach(paquete => {
                    setTimeout(() => {
                        if (paquete.route.length < 2){
                            liberarColor(color);
                            console.error("Ruta no valida")
                            return
                        }
                        // Introduzco el paquete en el escenario
                        const pqt = document.createElement('a-entity')
                        const color = colorAleatorio(); 
                        pqt.setAttribute('geometry', {primitive: "box", width:0.3, height:0.3, depth:0.3});
                        pqt.setAttribute('material', {color: color });

                        escenario.appendChild(pqt)
                        const salida = document.getElementById(paquete.route[0])
                        pqt.object3D.position.copy(salida.object3D.position);

                        pqt.setAttribute('trazador',{forma: 'esfera', intervalo: 30});
                        const movimiento = (i) => {
                            if (i >= paquete.route.length){
                                // Meter sonido de fin de envio o algo
                                escenario.removeChild(pqt);
                                return;
                            }
                            const siguiente = document.getElementById(paquete.route[i]);
                            if (siguiente){
                                pqt.setAttribute('animation', {
                                    property: 'position',
                                    to: `${siguiente.object3D.position.x} ${siguiente.object3D.position.y} ${siguiente.object3D.position.z}`,
                                    dur:2000,
                                    easing: 'linear'
                                });
                            }
                            pqt.addEventListener('animationcomplete', () => movimiento(i+1), {once: true}); 
                        };
                        movimiento(1);
                    }, paquete.time * 1000);
                })
            })
            .catch(error => console.error('Error al cargar packages.json:', error));
    }
})

// Componente encargado de la creación del mapa en el que se realiza el envio
AFRAME.registerComponent("simulacro",{
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
            this.crearpaquete(escenario)


            const posicionEscenario = escenario.getAttribute('position')
            let initialY = 0; // Comienza en la posición Y = 0
            setInterval(() => {
                initialY += 0.02; // Incrementa en 1 metro cada segundo
                escenario.setAttribute('position', `0 ${initialY} 0`);
            }, 20); // Actualiza cada 1000 milisegundos (1 segundo)
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
                    escenario.appendChild(entidad);
                } else if (node.type.includes(hub)){
                //} else if (node.type == "NKHub"){
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "box", width:1, height: 0.2})
                    //entidad.setAttribute('position', `${(node.position.x/20)-25} 0 ${((node.position.y/20)-25)} `);
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute("material", {src: "#hub", side: "double"});
                    entidad.setAttribute("id", node.name)
                    escenario.appendChild(entidad);
                } else if (node.type.includes(router)){
                //} else if (node.type == "NKRouter"){
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "cylinder", radius:1, height: 0.5})
                    //entidad.setAttribute('position', `${(node.position.x/20)-25} 0 ${((node.position.y/20)-25)} `);
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute('material', { color: "#808080" });
                    entidad.setAttribute("id", node.name)
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
        console.log("holitaaaa")
    }

});


