





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


            // Función que crea el mapa descrito en el archivo Netgui.nkp
            this.construirMapa(escenario);

        })
    },
    
    // Añado los controles (pausa y reprodución) que se quedaran fijos en la camara.

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
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "box", width:2, height: 2, depth:2 })
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute("material", {src: "#pc", side: "double"});
                    entidad.setAttribute("id", node.name)
                    escenario.appendChild(entidad);
                } else if (node.type.includes(hub)){
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "box", width:1, height: 0.2})
                    entidad.object3D.position.set((node.position[0]), 0, (node.position[1]))
                    entidad.setAttribute("material", {src: "#hub", side: "double"});
                    entidad.setAttribute("id", node.name)
                    escenario.appendChild(entidad);
                } else if (node.type.includes(router)){
                    const entidad = document.createElement('a-entity');
                    entidad.setAttribute('geometry', {primitive: "cylinder", radius:1, height: 0.5})
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

});
