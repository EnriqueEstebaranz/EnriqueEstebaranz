let defecto = 10000
let estadoPaquete = false
//let contador = 0 // lleva la cuenta de los paquetes activados, lo creo aqui para que sea  una variable global
//https://enriqueestebaranz.github.io/EnriqueEstebaranz/Monitoreo/Prueba2/
AFRAME.registerComponent("reloj", {
    schema:{
        tiempo:{type: "int", default:defecto}
    },
    init: function () {
        const paquetes = this.el.querySelectorAll("[paquete]");
        let numeroPaquetes = paquetes.length
        let contador = 0;
        function activarPaquete (){
            if (contador < numeroPaquetes){
                paquetes[contador].setAttribute("paquete", "contador", contador)// paso el valor de contador de la entidad reloj a su entidades paquetes que contiene
                paquetes[contador].components.paquete.activar();
                contador++;
            }
        }
        // Tiempo se puede configurar, se indica en milisegundos, luego 10000 = 10s
        setInterval(activarPaquete, this.data.tiempo);
    }
})

AFRAME.registerComponent("paquete",{
    schema: {
        // Necesario para diferenciar los paquetes que ya se han animaod y llevado a la posición destino.
        activo: {type: "boolean", default : false},
        contador:{ type: "int", default: 0 }
    },
    init: function () {
        // Guardo posicion inicial antes de realizar cualquier animación
        // this.el hace referencia a la entidad a la que se ha agregado el componente
        this.posicionInicial = this.el.getAttribute('position');

    },
    activar:function (){
        const contador = this.data.contador;
        if (!this.data.activo) {
            this.data.activo = true;

            const camino = [
                {property: "position", to: `${this.posicionInicial.x + 6} ${this.posicionInicial.y} ${this.posicionInicial.z}`, dur:1000},
                {property: "position", to: `${this.posicionInicial.x + 6} ${this.posicionInicial.y + 2 + 2 * contador} ${this.posicionInicial.z}`, dur:1000},
                {property: "position", to: `${this.posicionInicial.x + 17} ${this.posicionInicial.y + 2 + 2 * contador} ${this.posicionInicial.z}`, dur:1000},
                {property: "position", to: `${this.posicionInicial.x + 17} ${this.posicionInicial.y + 2 * contador} ${this.posicionInicial.z}`, dur:1000}
            ];

            const ejecutarAnimacion = (i) => {
                if (i < camino.length) {
                    // Activo la animación correspondiente a i en la cadena
                    this.el.setAttribute('animation', camino[i]);
                    // Ejecuta una animación cuando se termina la duranción de la animación que se activo.
                    setTimeout(() => {
                        ejecutarAnimacion(i + 1);
                    },camino[i].dur);
                }
            };
            // Inicia la animación secuencial de los movimientos del paquete activo desde el primer paso.
            ejecutarAnimacion(0);

            
            // Con objetivo de crear "realismo" meto una animación para bajar los paquetes que aun no se han activado
            const todosPaquetes = document.querySelectorAll("[paquete]");
            for (const unPaquete of todosPaquetes){
                if (unPaquete !== this.el && !unPaquete.components.paquete.data.activo && unPaquete.getAttribute("material").color === this.el.getAttribute("material").color){

                    // Condición para asegurarse de que el paquete actual no es el que se está animando, que no está ya activo, y que comparte el mismo color que el paquete que se está animando.

                    const posicion = unPaquete.getAttribute('position');

                    // Asigno una animación al paquete que no está activo para crea un efecto visual en el que los paquetes no activos parecen caer o bajar ligeramente cuando otro paquete se activa.
                    unPaquete.setAttribute("animation",{
                        property: "position",
                        to: {x: posicion.x, 
                            y:posicion.y - 2,
                            z:posicion.z},
                        dur: 1000,
                        easing: 'linear' 
                    });
                }
            }
        }
    }
})