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
        let texto = document.createElement('a-text')//mismo proceso para crear una herramienta entidad 
        texto.object3D.position.set(-40 + i * 20, 25, -29.2)
        texto.setAttribute("value", "Nodo-" + identificador[i])
        texto.setAttribute("color", "#000000");
        texto.setAttribute("width", 20)
        this.el.appendChild(texto)
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
        this.pausado = true;
        this.i = 0;
        this.animarPaquete();
    },
    animarPaquete: function () {
        let distancia = Math.abs(this.data.xder - (this.posicionInicial.x))
        const xder = this.data.xder;
        // const xizq = this.data.xizq;
        const duracionMovimiento = 1000; // 1 segundo
        const el = this.el;
        let i = 0
        let guia = 1;
        const sonar = document.getElementById('logrado');
        const tiktok = document.getElementById('tiktak');
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
                    this.i = this.i +1
                    i = i+1
                    ejecutarAnimacionDerecha(i);
                    guia = 1
                }, duracionMovimiento);
            } else if (!this.pausado &&  i>=distancia){
                sonar.components.sound.playSound();
                this.i = 0
                i = 0
                ejecutarAnimacionIzquierda(i)

            } else {
                console.log("hola")

            }
        };
        const ejecutarAnimacionIzquierda = (i)=>{
            if (!this.pausado && i < distancia ){
                tiktok.components.sound.playSound();
                el.setAttribute('animation', {
                    property: "position", 
                    to: `${this.posicionInicial.x - 1} 
                         ${this.posicionInicial.y-1} 
                         ${this.posicionInicial.z}`, 
                    dur:duracionMovimiento,
                    easing:"linear"
                });
                setTimeout(() => {
                    this.i = this.i +1
                    i = i+1
                    ejecutarAnimacionIzquierda(i);
                    guia = 2
                }, duracionMovimiento);
            } else if (!this.pausado && i>=distancia){
                sonar.components.sound.playSound();
                this.i = 0
                i = 0
                ejecutarAnimacionDerecha(i);

            } else{
                console.log("hola")

            }
        };
        ejecutarAnimacionDerecha(i);

        this.pausarAnimacion = () => {
            this.pausado = true;
            console.log("i es:"+ this.i)
            return this.i
            
        };
        this.reproducirAnimacion = () => {
            this.pausado = false;
            i = this.i 
            if (guia == 1){
                console.log("i es:"+ i)
                ejecutarAnimacionDerecha(i);
            }else if (guia == 2){
                console.log("i es:"+ i)
                ejecutarAnimacionIzquierda(i);
            }
        };
    }
});
AFRAME.registerComponent('pausar-animacion', {
    init: function () {
        this.el.addEventListener('click', () => {
            // Obtener todos los elementos con el componente 'paquete'
            const paquetes = document.querySelectorAll('[paquete]');
            const tiktok = document.getElementById('tiktak');
            tiktok.components.sound.pauseSound();
            // Iterar sobre los paquetes y llamar al método para pausar la animación
            paquetes.forEach(paquete => {
                paquete.components.paquete.pausarAnimacion();
            });
        });
    }
});
AFRAME.registerComponent('reproducir-animacion', {
    init: function () {
        this.el.addEventListener('click', () => {
            // Obtener todos los elementos con el componente 'paquete'
            const paquetes = document.querySelectorAll('[paquete]');
            const tiktok = document.getElementById('tiktak');
            tiktok.components.sound.playSound();
            // Iterar sobre los paquetes y llamar al método para pausar la animación
            paquetes.forEach(paquete => {
                paquete.components.paquete.reproducirAnimacion();
            });
        });
    }
});
  
  



