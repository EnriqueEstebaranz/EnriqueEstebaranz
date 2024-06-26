//AFRAME.registerComponent('pausar-animacion', {
//    init: function () {
//        this.el.addEventListener('click', () => {
//            // 
//            const camara = document.querySelector("#camara");
//            camara.setAttribute
//            tiktok.components.sound.pauseSound();
//            // Iterar sobre los paquetes y llamar al método para pausar la animación
//            paquetes.forEach(paquete => {
//                paquete.components.paquete.pausarAnimacion();
//            });
//        });
//    }
//});



AFRAME.registerComponent("reproducir",{
    init:function(){
        this.el.addEventListener("click",()=>{
            const escenario = document.querySelector("[escenario]");
            escenario.setAttribute("escenario", "movimiento: true");
        })
    }
})
AFRAME.registerComponent("pausa",{
    init:function(){
        this.el.addEventListener("click",()=>{
            const escenario = document.querySelector("[escenario]");
            escenario.setAttribute("escenario", "movimiento: false");
        })
    }
})





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
            this.envioPaquetes(escenario);

            const posicionEscenario = escenario.getAttribute('position')
            let initialY = 0; // Comienza en la posición Y = 0
            setInterval(() => {
                initialY += 1; // Incrementa en 1 metro cada segundo
                escenario.setAttribute('position', `0 ${initialY} 0`);
            }, 1000); // Actualiza cada 1000 milisegundos (1 segundo)
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

    envioPaquetes: function(escenario){
        fetch('packages.json')
            .then(response => response.json())
            .then(json => {
            const paquetes = json.packages
                paquetes.forEach(paquete => {
                    setTimeout(() => {
                        if (paquete.route.length < 2){
                            console.error("Ruta no valida")
                            return
                        }
                        // Introduzco el paquete en el escenario
                        const pqt = document.createElement('a-entity')
                        pqt.setAttribute('geometry', {primitive: "box", width:0.3, height:0.3, depth:0.3});
                        pqt.setAttribute('material', {color: 'red' });
                        const salida = document.getElementById(paquete.route[0])
                        pqt.object3D.position.copy(salida.object3D.position);
                        escenario.appendChild(pqt)

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

});
