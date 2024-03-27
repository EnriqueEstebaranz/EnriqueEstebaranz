let defecto = 2
let identificador = ["A","B","C","D","E","F","G","H","I","J","K"]

function colorAleatorio() {
    const rojo = Math.floor(Math.random() * 256); // Valor aleatorio componente rojo
    const verde = Math.floor(Math.random() * 256); // Valor aleatorio componente verde
    const azul = Math.floor(Math.random() * 256); // Valor aleatorio componente azul
  
    const colorHex = `#${rojo.toString(16)}${verde.toString(16)}${azul.toString(16)}`;
  
    return colorHex;
}
AFRAME.registerComponent('nodes', {

    schema: {
      numero: {type: 'int', default: defecto}
    },
    init: function () {
      console.log(this.data.numero);
      // Creo los nodos
      for (let i = 0; i < this.data.numero; i++){
        let entidad = document.createElement('a-entity')
        entidad.setAttribute('geometry', {primitive: "box", width:2, height: 100})//declaro componente de geometría 
        // Generar un color aleatorio en formato hexadecimal
        entidad.setAttribute('material', { color: colorAleatorio() });
        entidad.setAttribute("id", identificador[i])

        //IMPORTANTE
        //En IFRAME las posiciones no se deben dar con setAtribute, se debe tirar del object3d de three.js
        entidad.object3D.position.set(-40 + i*20, 0, -30)
        entidad.setAttribute("cambiador","")
        this.el.appendChild(entidad);
      }
      // Creo los paquetes
      for (let i = 0; i < ((this.data.numero) - 1); i++){
        let entidad = document.createElement('a-entity')
        entidad.setAttribute('geometry', {primitive: "box", width:4, height: 2})
        entidad.object3D.position.set(-40+3 + i*20, 25, -30)
        // para marcar las coordenadas de las X limite entre nodos tengo que restarle a la x de la derecha 
        entidad.setAttribute("paquete",{xizq: -40 +3 + i * 20, xder: -40 -3+ i * 20 + 20});
        this.el.appendChild(entidad);
      }
    }
});

AFRAME.registerComponent("paquete", {
    schema: {
        xizq: { type: "int", default: 0 },
        xder: { type: "int", default: 0 }
    },
    init: function () {
        this.posicionInicial = this.el.getAttribute("position");
        this.pausado = false;
        this.animarPaquete();
    },
    animarPaquete: function () {
        let distancia = Math.abs(this.data.xder - (this.posicionInicial.x))
        const xder = this.data.xder;
        const xizq = this.data.xizq;
        const duracionMovimiento = 1000; // 1 segundo
        const el = this.el;
        console.log("hola" + Math.abs(xder - this.posicionInicial.x))
        // Función para mover hacia xder y luego hacia xizq, repitiendo el ciclo
        const ejecutarAnimacionDerecha = (i)=>{
            if (!this.pausado && i<  distancia){
                el.setAttribute('animation', {
                    property: "position", 
                    to: `${this.posicionInicial.x + 1} 
                         ${this.posicionInicial.y-1} 
                         ${this.posicionInicial.z}`, 
                    dur:duracionMovimiento,
                    easing:"linear"
                });
                setTimeout(() => {
                    ejecutarAnimacionDerecha(i + 1);
                }, duracionMovimiento);
            } else {
                ejecutarAnimacionIzquierda(0)

            }
        };

        const ejecutarAnimacionIzquierda = (i)=>{

            if (!this.pausado && i<  distancia ){
                el.setAttribute('animation', {
                    property: "position", 
                    to: `${this.posicionInicial.x - 1} 
                         ${this.posicionInicial.y-1} 
                         ${this.posicionInicial.z}`, 
                    dur:duracionMovimiento,
                    easing:"linear"
                });
                setTimeout(() => {
                    ejecutarAnimacionIzquierda(i + 1);
                }, duracionMovimiento);
            } else {
                ejecutarAnimacionDerecha(0)

            }
        };
        ejecutarAnimacionDerecha(0);
        this.pausarAnimacion = () => {
            this.pausado = true;
        };
    }
});
AFRAME.registerComponent('detener-animacion', {
    init: function () {
        this.el.addEventListener('click', () => {
            // Obtener todos los elementos con el componente 'paquete'
            const paquetes = document.querySelectorAll('[paquete]');
            
            // Iterar sobre los paquetes y llamar al método para pausar la animación
            paquetes.forEach(paquete => {
                paquete.components.paquete.pausarAnimacion();
            });
        });
    }
});




