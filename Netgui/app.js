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

AFRAME.registerComponent("simulacro",{
    init:function () {
        this.el.addEventListener("click",()=>{
            // creo la entidad donde se localizará todo el escenario
            const escenario = document.createElement("a-entity")
            escenario.setAttribute("escenario");
            // añadimos la entidad que contiene todo el escenario al escenario de aframe
            const scene = document.querySelector('a-scene');
            scene.appendChild(escenario);

            // Eliminación de la caja (boton) de incio
            const inicio = document.querySelector("#iniciador");
            scene.removeChild(inicio);

            // Añado unos botones que se quedaran fijos en la camara
            const camara = document.querySelector("#camara");
            const botonPausa = document.createElement('a-entity');
            botonPausa.setAttribute('geometry', {primitive: "box", width:1, height: 1, depth:1 })
            botonPausa.object3D.position.set(-7, -3, -7)
            botonPausa.setAttribute("material", {src: "#pausa"});
            botonPausa.setAttribute("pausa");
            camara.appendChild(botonPausa); // añado boton pausa
            const botonReproducir = document.createElement('a-entity');
            botonReproducir.setAttribute('geometry', {primitive: "box", width:1, height: 1, depth:1 })
            botonReproducir.object3D.position.set(7, -3, -7)
            botonReproducir.setAttribute("material", {src: "#reproducir"});
            botonReproducir.setAttribute("reproducir");
            camara.appendChild(botonReproducir); // añado boton reproducir

            const botonCamaraAlta  = document.createElement('a-entity');
            botonCamaraAlta.setAttribute('geometry', {primitive: "box", width:3, height: 1, depth:1 })
            botonCamaraAlta.object3D.position.set(0, 7, -10)
            botonCamaraAlta.setAttribute("material", { color: "#808080" });
            botonCamaraAlta.setAttribute("id","CamaraAlta");
            botonCamaraAlta.setAttribute("camara-alta");
            camara.appendChild(botonCamaraAlta); // añado boton reproducir

            const entidadBCA = document.querySelector("#CamaraAlta");
            const textoBoton = document.createElement('a-text');
            textoBoton.setAttribute('value', 'Camara desde arriba');
            textoBoton.setAttribute('color', 'black');
            textoBoton.setAttribute('position', '0 -0.5 1.1');
            textoBoton.setAttribute('width', '5');
            textoBoton.setAttribute('align', 'center');
            entidadBCA.appendChild(textoBoton);
            // Leer el documento .nkp
            fetch('/Netgui/netgui.txt')
                .then(response => response.text())
                .then(data => {
                // Procesar el contenido del archivo .nkp
                const nodesRegex = /position\(([^)]+)\);\s*(\w+)\("([^"]+)"\)/g;
                const connectionsRegex = /Connect\("([^"]+)"\)\s*To\("([^"]+)"\)/g;
                
                let match;
                const nodes = [];
                const connections = [];

                // Extraigo la información de los nodos del archivo .nkp
                while ((match = nodesRegex.exec(data)) !== null) {
                    const [fullMatch, position, type, name] = match;
                    const [x, y] = position.split(',');
                    
                    nodes.push({
                        type,
                        name,
                        position: {
                            x: parseFloat((x/20)-25),
                            y: parseFloat((y/20)-25),
                        },
                    });
                    console.log(nodes);
                }

                // Extraigo la información de las conexiones del archivo .nkp
                while ((match = connectionsRegex.exec(data)) !== null) {
                    const [fullMatch, from, to] = match;
                    connections.push({ from, to });
                    console.log(connections);
                }

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
                        entidad.object3D.position.set((node.position.x), 0, (node.position.y))
                        entidad.setAttribute("material", {src: "#pc", side: "double"});
                        entidad.setAttribute("id", node.name)
                        escenario.appendChild(entidad);
                    } else if (node.type.includes(hub)){
                    //} else if (node.type == "NKHub"){
                        const entidad = document.createElement('a-entity');
                        entidad.setAttribute('geometry', {primitive: "box", radius:1, height: 0.2})
                        //entidad.setAttribute('position', `${(node.position.x/20)-25} 0 ${((node.position.y/20)-25)} `);
                        entidad.object3D.position.set((node.position.x), 0, (node.position.y))
                        entidad.setAttribute("material", {src: "#hub", side: "double"});
                        entidad.setAttribute("id", node.name)
                        escenario.appendChild(entidad);
                    } else if (node.type.includes(router)){
                    //} else if (node.type == "NKRouter"){
                        const entidad = document.createElement('a-entity');
                        entidad.setAttribute('geometry', {primitive: "cylinder", width:1, height: 0.5})
                        //entidad.setAttribute('position', `${(node.position.x/20)-25} 0 ${((node.position.y/20)-25)} `);
                        entidad.object3D.position.set((node.position.x), 0, (node.position.y))
                        entidad.setAttribute('material', { color: "#808080" });
                        entidad.setAttribute("id", node.name)
                        escenario.appendChild(entidad); 
                    }
                });
                
                
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
                        scene.appendChild(line);
                    }
                });
            })
            .catch(error => console.error('Error al leer el archivo:', error));

        })
    }
})

