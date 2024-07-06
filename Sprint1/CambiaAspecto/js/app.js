//Estudiar manipulación del DOM

window.addEventListener('load', initScene) //Para evitar que el Script se ejecute antes de que la escena este lista-> pongo un evenbto i para que cuando se cargue se inicie la escena.

//Creo un array que contiene todas las posiciones xyz de cada meteorito
const nanos =[
    { x: 5,   y: -10, z: -25},
    { x: -10, y: 10,  z:  15},
    { x: 12,  y: 0,   z:  30},
    { x: -20, y: -10, z: -25},
    { x: 10,  y: 10,  z: -25},
    { x: 20,  y: 0,   z: -45},
    { x: -20, y: 30,  z: -25},
    { x: -20, y: 10,  z:  25}
]
let nano, score=0
//Creo la función initScene y introduzco 8 nanos
function initScene(){
    // dentro de cada orbita meto una identidad de tipo nano texturizado siguiendo la posición del array
    let orbitas = document.querySelectorAll(".orbita")
    orbitas.forEach(orbita =>{ //Para cada orbita (forEach) 
        nanos.forEach(posicion =>{
            //inyecto creando un elemento
            nano = document.createElement('a-entity')
            nano.setAttribute('geometry', {primitive: "box", width: Math.random()* 5 + 1.5, height: Math.random()* 5 + 1.5})//declaro componente de geometría 
            nano.setAttribute('material', {shader:"flat", src:"#am"})//declaro componente de material
            //nano.setAttribute('material', {color:"red"});
            //const nuevoColor = new THREE.Color(0, 0, 0);
            //nano.object3D.material.color=nuevoColor;
            nano.setAttribute("class","nano")

            //IMPORTANTE
            //En IFRAME las posiciones no se deben dar con setAtribute, se debe tirar del object3d de three.js
            nano.object3D.position.set(posicion.x, posicion.y, posicion.z)
            orbita.appendChild(nano)
            nano.setAttribute("shootable","")
        })
    })
}

AFRAME.registerComponent('shootable',{
    init: function(){
        this.el.addEventListener('click',() =>{
            //this.el.parentNode.removeChild(this.el)//hacemos para que desdaparezca el nano
            this.el.setAttribute('material', {shader:"flat", src:"#ferrari"});
            document.querySelector("[text]").setAttribute('value', `${++ score} ferrari convertido`)
        })
    }
})