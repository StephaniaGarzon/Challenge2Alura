;(function(){
// ===== CACHE =====
/* Prototipo del cache */
var cacheProto = {
  get(id, fallback) {
    if (this[id]) {
      return this[id]
    }
    this[id] = fallback(id)
    return this[id]
  }
}

var cache = window.cache
if (!cache) {
  cache = window.cache = Object.create(cacheProto)
}
/* cache especializado en queries al DOM */
var $ = cache.html
if (!$) {
  $ = cache.html = Object.create(cacheProto)
}
// ===== FIN CACHE =====

// ===== SISTEMA DE PLANTILLAS =====
/* Si la plantilla tiene una función al llamar irá acá */
var callbacks = window.callbacks = {
  'nuevo-juego':  {
    onenter() {
      nuevoJuego()
      window.onkeypress = adivinarLetra
      if (isMobile()) {
        let entrada = querySelector('#mob-entrada')
        let img = querySelector('#hombre')
        img.onclick = mostrarTeclado
        entrada.onblur = adivinarYOcultarTeclado
      }
    },
    onleave() {
      window.onkeypress = undefined
      if (isMobile()) {
        let entrada = querySelector('#mob-entrada')
        let img = querySelector('#hombre')
        img.onclick = undefined
        entrada.onblur = undefined
      }
    }
  }
}

function isMobile() {
  let userAgent = navigator.userAgent
  return /(?:android|ios|mobile)/i.test(userAgent)
}

function mostrarTeclado(event) {
  var entrada = querySelector('#mob-entrada')
  entrada.style.top = event.clientY + 'px'
  entrada.style.left = '-10000px'
  entrada.focus()
}

function ocultarTeclado(event) {
  var entrada = querySelector('#mob-entrada')
  entrada.style.top = '-10000px'
  entrada.style.left = '-10000px'
  entrada.blur()
}

function adivinarYOcultarTeclado(event) {
  adivinarTelefono(event)
  ocultarTeclado(event)
}

function adivinarTelefono() {
  var entrada = querySelector('#mob-entrada')
  var txt = entrada.value
  entrada.value = ''

  if (txt.length !== 1) {
    return
  }

  let event = new Event('keypress', { bubbles: true })
  event.key = txt
  event.charCode =  txt.charCodeAt(0)
  event.keyCode = 0
  window.dispatchEvent(event)
}

function sourceCode(id) {
  return cache.get('x-template-'+id, () => {
    var div = document.createElement('div')
    var code = document.getElementById(id)
    code = code.content
    div.appendChild(code)
    return div
  })
}

window.mostrar = mostrar

var pagina = undefined
function mostrar(id) {
  if (pagina && id === pagina) {
    return
  }
  old = pagina
  pagina = id

  var body = document.body
  if (old) {
    body.replaceChild(sourceCode(id), sourceCode(old))
  } else {
    body.appendChild(sourceCode(id))
  }
  $ = cache.html = Object.create(cacheProto)

  let callback = callbacks[old]
  if (callback && callback.onleave) {
    callback.onleave()
  }

  callback = callbacks[id]
  if (callback && callback.onenter) {
    callback.onenter()
  }
}
// ===== FIN SISTEMA DE PLANTILLAS =====

// ===== JUEGO =====
var palabras = localStorage.getItem('palabras')
if (palabras === null) {
  palabras = [
    'ALURA',
    'AFINIDAD',
    'PROGRAMAR',
    'ORACLE',
    'YOUTUBE',
    'NATURALEZA',
    'CAMPO',
    'BOSQUE',
    'SELVA',
    'JUNGLA',
    'DESIERTO',
    'COSTA',
    'PULPO',
    'INSECTO',
    'BICHO',
    'MARIPOSA',
    'POLILLA',
    'SALTAMONTES',
    'ALMENDRA',
    'CASTAÑA',
    'AVENA',
    'VERDURA',
    'CODIGO',
    'FRAMEWORK',
    'DOMINIO',
    'SOFTWARE',
    'DESARROLLO'
  ]
  localStorage.setItem('palabras', JSON.stringify(palabras))
} else {
  palabras = JSON.parse(palabras)
}
window.palabras = palabras

// variable para almacenar la configuracion actual
var juego = null
// para ver si ya se ha enviado alguna alerta
var finalizado = false

function dibujar(juego) {
// Actualizar la imagen del hombre
var $elem
$elem = querySelector('#hombre')

var estado = juego.estado
if (estado === 11) {
  estado = juego.previo
}
$elem.src = './imagenes/estados/0' + estado + '.png'

// Creamos las letras adivinadas
var palabra = juego.palabra
var adivinado = juego.adivinado
$elem = querySelector('.adivinado')
// borramos los elementos anteriores
$elem.innerHTML = ''
for (let letra of palabra) {
  let $span = document.createElement('span')
  let $txt = document.createTextNode('')
  if (adivinado.has(letra)) {
  $txt.nodeValue = letra
  }
  $span.setAttribute('class', 'letra adivinada')
  $span.appendChild($txt)
  $elem.appendChild($span)
}

// Creamos las letras erradas
var errado = juego.errado
$elem = querySelector('.errado')
// Borramos los elementos anteriores
$elem.innerHTML = ''
for (let letra of errado) {
  let $span = document.createElement('span')
  let $txt = document.createTextNode(letra)
  $span.setAttribute('class', 'letra errada')
  $span.appendChild($txt)
  $elem.appendChild($span)
}
}

function adivinar(juego, letra) {
var estado = juego.estado
// Si ya se ha perdido, o ganado, no hay que hacer nada
if (estado === 1 || estado === 11) {
  return
}

var adivinado = juego.adivinado
var errado = juego.errado
// Si ya hemos adivinado o errado la letra, no hay que hacer nada
if (adivinado.has(letra) || errado.has(letra)) {
  return
}

var palabra = juego.palabra
var letras = juego.letras
// Si es letra de la palbra
if (letras.has(letra)) {
  // agregamos a la lista de letras adivinadas
  adivinado.add(letra)
  // actualizamos las letras restantes
  juego.restante--

  // Si ya se ha ganado, debemos indicarlo
  if (juego.restante === 0) {
  juego.previo = juego.estado
  juego.estado =  11
  }
} else {
  // Si no es letra de la palabra, acercamos al hombre un paso más de su ahorca
  juego.estado--
  // Agregamos la letra, a la lista de letras erradas
  errado.add(letra)
}
}

window.adivinarLetra  = function adivinarLetra(e) {
var letra = e.key
letra = letra.toUpperCase()

if (letra == 'ENTER') {
  ocultarTeclado()
  return
}

if (/[^A-ZÑ]/.test(letra) || letra.length > 1) {
  return
}
adivinar(juego, letra)
var estado = juego.estado
if (estado === 11 && !finalizado) {
  setTimeout(alertaGanado, 0)
  finalizado = true
}else if (estado === 1 && !finalizado) {
  setTimeout(alertaPerdido, 0)
  finalizado = true
}
dibujar(juego)
}

window.nuevoJuego = nuevoJuego

function nuevoJuego() {
var palabra = palabraAleatoria()
juego = {}
juego.palabra = palabra
juego.estado = 10
juego.adivinado = new Set()
juego.errado = new Set()
finalizado = false

var letras = new Set()
for (let letra of palabra) {
  letras.add(letra)
}
juego.letras = letras
juego.restante = letras.size

dibujar(juego)
console.log(juego)
querySelector('.mensaje').style = ''
}

function palabraAleatoria() {
var index = ~~(Math.random() * palabras.length)
return palabras[index]
}

function alertaGanado() {
  querySelector('.mensaje').innerHTML='Felicidades Ganaste!!';
  querySelector('.mensaje').style.visibility = 'visible'
}

function alertaPerdido() {
  var palabra = juego.palabra
  querySelector('.mensaje').innerHTML='Lo siento, perdiste... la palabra era: ' + palabra;
  querySelector('.mensaje').style.visibility = 'visible'
}

function querySelector(selector) {
  return $.get(selector, () => document.querySelector(selector))
}

window.guardarPalabra = guardarPalabra
function guardarPalabra() {
  var txt = querySelector('#entrada')
  var nuevo = txt.value
  nuevo = nuevo.toUpperCase()

  if (nuevo.length === 0) {
    return
  }

  if (nuevo.length > 20) {
    alert('La cantidad máxima de letras es 20')
    return
  }

  if (/[^A-ZÑ]/.test(nuevo)) {
    alert('La palabra contiene letras inválidas')
    return
  }

  if (!palabras.includes(nuevo)) {
    palabras.push(nuevo)
    localStorage.setItem('palabras', JSON.stringify(palabras))
  }

  mostrar('nuevo-juego')
  console.log(nuevo)
}

}())