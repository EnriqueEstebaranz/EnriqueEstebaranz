let defecto = 9

function colorAleatorio() {
  const rojo = Math.floor(Math.random() * 256); // Valor aleatorio componente rojo
  const verde = Math.floor(Math.random() * 256); // Valor aleatorio componente verde
  const azul = Math.floor(Math.random() * 256); // Valor aleatorio componente azul

  const colorHex = `#${rojo.toString(16)}${verde.toString(16)}${azul.toString(16)}`;

  return colorHex;
}
let score=0

AFRAME.registerComponent("actua",{
  init:function(){
    const valor = this.el.getAttribute("actua").accion;
    this.el.addEventListener('click',() =>{
      if (valor === "suma"){
        document.querySelector("[text]").setAttribute('value', `${++score} cubos`);
      }else if(valor==="resta"){
        if (score === 0){
          document.querySelector("[text]").setAttribute('value', `${++ score} cubos`);
        } else{
          document.querySelector("[text]").setAttribute('value', `${++ score} cubos`);
        }
      }else if(valor === "acepta"){
        let cubos = document.createElement('a-entity')
        cubos.setAttribute('cubos', `numero: ${score}`);
        this.el.sceneEl.appendChild(cubos);
        const entidadActua = document.querySelector('#eliminar');
        entidadActua.remove();


      }
    })
  }
  
  
})


AFRAME.registerComponent('cubos', {

    schema: {
      numero: {type: 'int', default: defecto}
    },
    init: function () {
      console.log(this.data.numero);
      for (let i = 0; i<this.data.numero; i++){
        let entidad = document.createElement('a-entity')
        entidad.setAttribute('geometry', {primitive: "box", width: Math.random()* 5 + 1.5, height: Math.random()* 5 + 1.5})//declaro componente de geometría 
        //entidad.setAttribute('material', {shader:"flat", src:"#nano"})//declaro componente de material
        //entidad.setAttribute('material', {color:"red"});
        //entidad.setAttribute("class","nano")
        // Generar un color aleatorio en formato hexadecimal
        entidad.setAttribute('material', { color: colorAleatorio() });
        entidad.setAttribute("class","interactua")

        //IMPORTANTE
        //En IFRAME las posiciones no se deben dar con setAtribute, se debe tirar del object3d de three.js
        entidad.object3D.position.set((Math.random()* 60) -30, (Math.random()* 60) -30, (Math.random()* 60) -30)
        entidad.setAttribute("cambiador","")
        this.el.appendChild(entidad);
      }
    }
  });
AFRAME.registerComponent("cambiador",{
  init:function(){
    this.el.addEventListener('click',() =>{
      this.el.setAttribute('material', { color: "red" });
    })
  }
})