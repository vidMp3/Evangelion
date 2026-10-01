import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { gsap } from 'gsap'

// ==========================================
// 1. Parámetros Globales y Ajustes Rápidos
// ==========================================
const SETTINGS = {
  colors: {
    fondo: 0x07050c,
    base: 0x15101f,
    morado: 0x4b2a7a,
    lila: 0x8a5cff,
    verde: 0x9dff3c,
    naranja: 0xff6a00,
    alerta: 0xd7263d
  },
  scene: {
    fogNear: 5,
    fogFar: 14,
    floorColor: 0x0b0814
  },
  camera: {
    fov: 60,
    near: 0.1,
    far: 100,
    distance: 5,
    height: 0.9,
    introHeight: 1.2,
    defaultZ: 6.2
  },
  renderer: {
    pixelRatioMax: 2,
    shadowMap: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.3
  },
  controls: {
    targetY: 0.3,
    damping: true,
    distanceMin: 3,
    distanceMax: 8,
    maxPolarAngle: Math.PI / 2 - 0.05
  },
  lighting: {
    ambientIntensity: 0.55,
    directionalIntensity: 1.9,
    pointIntensity: 10,
    pointDistance: 6,
    directionalPosition: new THREE.Vector3(3, 5, 3)
  },
  motion: {
    introDuration: 2400,
    ramielYBase: -0.5,
    ramielYIntro: 0.45,
    floatAmplitude: 0.08,
    alertRotationSpeed: 3,
    idleRotationSpeed: 1,
    floatLerp: 1.5,
    tiltStrength: 0.4,
    ringScaleStart: 0.01,
    ringScaleEnd: 1,
    portalScaleStart: 0.01,
    portalScaleEnd: 1
  },
  interaction: {
    moveSensitivityX: 0.4,
    moveSensitivityY: 0.4,
    raycastObject: 'ramiel',
    activationKey: 'Space'
  },
  objects: {
    pedestalRadiusTop: 0.9,
    pedestalRadiusBottom: 1.1,
    pedestalHeight: 0.4,
    pedestalY: -0.8,
    ramielScaleY: 1.5,
    ringRadiusA: 1.5,
    ringRadiusB: 2.0,
    ringRadiusC: 2.5,
    portalRadius: 2.2,
    particleCount: 8,
    nucleusY: 1.5,
    nucleusScale: 0.18
  }
}

const {
  colors,
  scene: sceneSettings,
  camera: cameraSettings,
  renderer: rendererSettings,
  controls: controlsSettings,
  lighting,
  motion,
  interaction,
  objects
} = SETTINGS

// ==========================================
// 2. Escena, Cámara, Renderer y Controles
// ==========================================
const canvas = document.querySelector('#webgl')

if (!canvas) {
  throw new Error('No se encontró el canvas #webgl')
}

const scene = new THREE.Scene()
scene.background = new THREE.Color(colors.fondo)
scene.fog = new THREE.Fog(colors.fondo, sceneSettings.fogNear, sceneSettings.fogFar)

const camera = new THREE.PerspectiveCamera(
  cameraSettings.fov,
  window.innerWidth / window.innerHeight,
  cameraSettings.near,
  cameraSettings.far
)
camera.position.set(0, cameraSettings.height, cameraSettings.distance)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, rendererSettings.pixelRatioMax))
renderer.shadowMap.enabled = rendererSettings.shadowMap
renderer.setClearColor(colors.fondo, 1)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = rendererSettings.toneMapping
renderer.toneMappingExposure = rendererSettings.toneMappingExposure

const controls = new OrbitControls(camera, canvas)
controls.target.set(0, controlsSettings.targetY, 0)
controls.enableDamping = controlsSettings.damping
controls.minDistance = controlsSettings.distanceMin
controls.maxDistance = controlsSettings.distanceMax
controls.maxPolarAngle = controlsSettings.maxPolarAngle

// ==========================================
// 3. Iluminación (Luces y Sombras)
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, lighting.ambientIntensity)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xc9b8ff, lighting.directionalIntensity)
directionalLight.position.copy(lighting.directionalPosition)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
scene.add(directionalLight)

const glow = new THREE.PointLight(colors.naranja, lighting.pointIntensity, lighting.pointDistance)
glow.position.set(0, 0.45, 0)
scene.add(glow)

// ==========================================
// 4. Utilidades y Texturas Canvas
// ==========================================
function lerp(a, b, t) {
  return a + (b - a) * t
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const limitar = (valor) => Math.min(Math.max(valor, 0), 1)

const crearCanvasTexture = (dibujar, ancho = 128, alto = 128) => {
  const canvasTexture = document.createElement('canvas')
  canvasTexture.width = ancho
  canvasTexture.height = alto

  const contexto = canvasTexture.getContext('2d')
  dibujar(contexto, ancho, alto)

  const textura = new THREE.CanvasTexture(canvasTexture)
  textura.needsUpdate = true
  return textura
}

const matcapTexture = crearCanvasTexture((contexto, ancho, alto) => {
  const degradado = contexto.createRadialGradient(
    ancho * 0.32,
    alto * 0.28,
    6,
    ancho * 0.5,
    alto * 0.5,
    ancho * 0.52
  )

  degradado.addColorStop(0, '#ffffff')
  degradado.addColorStop(0.18, '#e5d7ff')
  degradado.addColorStop(0.45, '#8a5cff')
  degradado.addColorStop(1, '#1a0a33')

  contexto.fillStyle = degradado
  contexto.fillRect(0, 0, ancho, alto)
})

const toonTexture = crearCanvasTexture((contexto, ancho, alto) => {
  const pasos = ['#07050c', '#4b2a7a', '#9dff3c', '#ffffff']
  const alturaPaso = alto / pasos.length

  for (let i = 0; i < pasos.length; i++) {
    contexto.fillStyle = pasos[i]
    contexto.fillRect(0, i * alturaPaso, ancho, alturaPaso)
  }
})

toonTexture.magFilter = THREE.NearestFilter
toonTexture.minFilter = THREE.NearestFilter

// ==========================================
// 5. Creación de Geometrías, Materiales y Mallas
// ==========================================
// Nota de edición rápida: aquí cambias el tamaño y la forma de cada pieza.
// - pedestal: usa 'objects.pedestalRadiusTop / Bottom / Height' para cambiar altura y ancho del pedestal.
// - nucleo: usa 'objects.nucleusScale' y 'objects.nucleusY' para mover y escalar la esfera central.
// - ramiel: usa 'new THREE.OctahedronGeometry(0.55)' y 'objects.ramielScaleY' para cambiar su altura y proporción.
// - anillos: usa 'datosAnillos[]' y 'ringRadiusA/B/C' para redondear o alargar el AT Field.
// - portal: usa 'objects.portalRadius' y el scale del objeto para hacer el portal más grande o más pequeño.
// - partículas: usa 'objects.particleCount' y 'new THREE.SphereGeometry(0.035, 12, 12)' para cambiar la densidad y tamaño de los electrones.

const createMesh = (geometry, material, config = {}) => {
  const mesh = new THREE.Mesh(geometry, material)

  if (config.position) {
    mesh.position.set(config.position.x, config.position.y, config.position.z)
  }

  if (config.rotation) {
    mesh.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z)
  }

  if (config.scale) {
    mesh.scale.set(config.scale.x, config.scale.y, config.scale.z)
  }

  mesh.castShadow = Boolean(config.castShadow)
  mesh.receiveShadow = Boolean(config.receiveShadow)

  return mesh
}

// Suelo base: cambia la textura/forma del piso desde aquí.
const floor = createMesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: sceneSettings.floorColor,
    roughness: 0.8,
    metalness: 0.1
  }),
  {
    position: { x: 0, y: -1, z: 0 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    receiveShadow: true
  }
)
scene.add(floor)

// Grid: cambia la intensidad visual del suelo con GridHelper size / colors.
const grid = new THREE.GridHelper(30, 30, colors.naranja, 0x2a1a45)
grid.position.y = -0.995
scene.add(grid)

// Pedestal: ajustar base principal del montaje.
const pedestal = createMesh(
  new THREE.CylinderGeometry(
    objects.pedestalRadiusTop,
    objects.pedestalRadiusBottom,
    objects.pedestalHeight,
    6
  ),
  new THREE.MeshStandardMaterial({
    color: colors.base,
    roughness: 0.4,
    metalness: 0.3
  }),
  {
    position: { x: 0, y: objects.pedestalY, z: 0 },
    castShadow: true,
    receiveShadow: true
  }
)
scene.add(pedestal)

// Aro del pedestal: cambias grosor, radio y rotación aquí.
const aroPedestal = createMesh(
  new THREE.TorusGeometry(0.9, 0.02, 8, 6),
  new THREE.MeshBasicMaterial({ color: colors.naranja }),
  {
    position: { x: 0, y: -0.59, z: 0 },
    rotation: { x: Math.PI / 2, y: 0, z: Math.PI / 6 }
  }
)
scene.add(aroPedestal)

// Núcleo central: se usa para darle peso visual al centro del pedestal.
const nucleo = createMesh(
  new THREE.IcosahedronGeometry(objects.nucleusScale, 1),
  new THREE.MeshMatcapMaterial({ matcap: matcapTexture }),
  {
    position: { x: 0, y: objects.nucleusY, z: 0 },
    castShadow: true
  }
)
scene.add(nucleo)

// Ramiel: cambiar la geometría o la altura por aquí.
const ramielGeometry = new THREE.OctahedronGeometry(0.55)

const ramiel = createMesh(
  ramielGeometry,
  new THREE.MeshStandardMaterial({
    color: colors.morado,
    emissive: 0x1a0a33,
    roughness: 0.25,
    metalness: 0.6,
    flatShading: true
  }),
  {
    position: { x: 0, y: motion.ramielYBase, z: 0 },
    scale: { x: 1, y: objects.ramielScaleY, z: 1 },
    castShadow: true
  }
)

// Bordes del modelo: si quieres líneas más gruesas o más pequeñas, cambia EdgesGeometry y LineBasicMaterial.
const aristas = new THREE.LineSegments(
  new THREE.EdgesGeometry(ramielGeometry),
  new THREE.LineBasicMaterial({ color: colors.verde })
)
ramiel.add(aristas)
scene.add(ramiel)

// AT Field: ajustar radio y velocidad de cada anillo.
const datosAnillos = [
  { radio: objects.ringRadiusA, color: colors.verde, velocidad: 0.5 },
  { radio: objects.ringRadiusB, color: colors.naranja, velocidad: -0.3 },
  { radio: objects.ringRadiusC, color: colors.lila, velocidad: 0.2 }
]

const anillos = []

for (let i = 0; i < datosAnillos.length; i++) {
  const dato = datosAnillos[i]

  const mesh = createMesh(
    new THREE.TorusGeometry(dato.radio, 0.012, 8, 6),
    new THREE.MeshPhongMaterial({
      color: dato.color,
      shininess: 100,
      specular: 0xffffff
    }),
    {
      position: { x: 0, y: 0.45, z: 0 },
      rotation: { x: Math.PI / 2, y: 0, z: 0 },
      scale: { x: motion.ringScaleStart, y: motion.ringScaleStart, z: motion.ringScaleStart }
    }
  )

  scene.add(mesh)
  anillos.push({ mesh, velocidad: dato.velocidad })
}

// Portal: cambiar tamaño, grosor y posición del ring central.
const portal = createMesh(
  new THREE.TorusGeometry(objects.portalRadius, 0.025, 8, 6),
  new THREE.MeshBasicMaterial({ color: colors.naranja }),
  {
    position: { x: 0, y: 0.905, z: -2.5 },
    scale: { x: motion.portalScaleStart, y: motion.portalScaleStart, z: motion.portalScaleStart }
  }
)
scene.add(portal)

// Partículas / electrones flotantes: cambiar densidad, tamaño y radio orbital.
const particulas = []
const materialParticula = new THREE.MeshToonMaterial({
  color: colors.verde,
  gradientMap: toonTexture
})

for (let i = 0; i < objects.particleCount; i++) {
  const particula = createMesh(
    new THREE.SphereGeometry(0.035, 12, 12),
    materialParticula.clone(),
    {
      position: {
        x: Math.cos((i / objects.particleCount) * Math.PI * 2) * 0.85,
        y: 0.1 + (i % 2) * 0.08,
        z: Math.sin((i / objects.particleCount) * Math.PI * 2) * 0.85
      }
    }
  )

  scene.add(particula)
  particulas.push({
    mesh: particula,
    angulo: (i / objects.particleCount) * Math.PI * 2,
    radio: 0.85,
    velocidad: 0.8 + i * 0.08,
    altura: 0.1 + (i % 2) * 0.08
  })
}

// ==========================================
// 6. Interacción y Eventos (Raycaster, Clic, Teclado, Resize)
// ==========================================
// Raycaster: cambia 'raycaster.intersectObject(ramiel)' para apuntar a otra malla si vas a detectar otra geometría.
// Teclado: cambia 'interaction.activationKey' en SETTINGS para usar otra tecla de activación.
const puntero = { x: 0, y: 0 }
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let alerta = false

const toggleAlerta = () => {
  alerta = !alerta

  const colorObjetivo = new THREE.Color(alerta ? colors.alerta : colors.morado)
  const colorAristas = new THREE.Color(alerta ? colors.naranja : colors.verde)
  const colorGlow = new THREE.Color(alerta ? colors.alerta : colors.naranja)

  // GSAP de escala: esto da el golpe de “sacudida” del objeto principal.
  gsap.to(ramiel.scale, {
    x: 1.2,
    y: 1.8,
    z: 1.2,
    duration: 0.25,
    yoyo: true,
    repeat: 1,
    ease: 'power2.out'
  })

  // GSAP de color: si cambias duration o ease, controlas la velocidad y suavidad del cambio de estado.
  gsap.to(ramiel.material.color, {
    r: colorObjetivo.r,
    g: colorObjetivo.g,
    b: colorObjetivo.b,
    duration: 0.35,
    ease: 'power2.out'
  })

  gsap.to(aristas.material.color, {
    r: colorAristas.r,
    g: colorAristas.g,
    b: colorAristas.b,
    duration: 0.35,
    ease: 'power2.out'
  })

  gsap.to(glow.color, {
    r: colorGlow.r,
    g: colorGlow.g,
    b: colorGlow.b,
    duration: 0.35,
    ease: 'power2.out'
  })
}

window.addEventListener('pointermove', (e) => {
  puntero.x = (e.clientX / window.innerWidth) * 2 - 1
  puntero.y = (e.clientY / window.innerHeight) * 2 - 1
})

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect()

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)

  raycaster.setFromCamera(mouse, camera)

  const intersecciones = raycaster.intersectObject(ramiel)

  if (intersecciones.length > 0) {
    toggleAlerta()
  }
})

window.addEventListener('keydown', (event) => {
  if (event.code === interaction.activationKey) {
    event.preventDefault()
    toggleAlerta()
  }
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, rendererSettings.pixelRatioMax))
})

// ==========================================
// 7. Lógica de Estado y Animaciones GSAP
// ==========================================
// Cambia aquí los tiempos generales del comportamiento en estado de alerta o intro.
const DURACION_INTRO = motion.introDuration
const inicio = performance.now()

let anterior = null
let flotacion = 0
let objetivoFlotacion = motion.floatAmplitude
let velocidadActual = 1

// ==========================================
// 8. Bucle de Animación Principal (tick)
// ==========================================
const tick = (ahora) => {
  requestAnimationFrame(tick)

  // delta = tiempo real entre frames para una animación estable y uniforme.
  // Si quieres más lenta o más rápida la animación global, ajusta 'delta' o las velocidades del ánimo.
  if (anterior === null) {
    anterior = ahora
    return
  }

  const delta = (ahora - anterior) / 1000
  anterior = ahora

  // t = progreso de la intro, de 0 a 1, para que Ramiel y el portal entren con easing suave.
  const t = Math.min((ahora - inicio) / DURACION_INTRO, 1)

  // alturaBase = sube a Ramiel desde el pedestal con easing tipo cubic-out.
  const alturaBase = lerp(motion.ramielYBase, motion.ramielYIntro, easeOutCubic(t))

  // flotación continua tras la intro, alternando amplitud para crear un movimiento de balanceo.
  if (t >= 1) {
    flotacion = lerp(flotacion, objetivoFlotacion, delta * motion.floatLerp)

    if (objetivoFlotacion > 0 && flotacion > objetivoFlotacion - 0.02) {
      objetivoFlotacion = -motion.floatAmplitude
    } else if (objetivoFlotacion < 0 && flotacion < objetivoFlotacion + 0.02) {
      objetivoFlotacion = motion.floatAmplitude
    }
  }

  // Ramiel: cambia su altura para entrar desde el pedestal y luego flotar.
  ramiel.position.y = alturaBase + flotacion

  // velocidadObjetivo = cambia de inactiva a alerta, manteniendo respuesta del giro del objeto.
  const velocidadObjetivo = alerta ? motion.alertRotationSpeed : motion.idleRotationSpeed
  velocidadActual = lerp(velocidadActual, velocidadObjetivo, delta * 2)

  // giro y inclinación del modelo principal: aporta sensación de vida y respuesta al mouse.
  ramiel.rotation.y = ramiel.rotation.y + 0.6 * velocidadActual * delta
  ramiel.rotation.x = lerp(ramiel.rotation.x, puntero.y * interaction.moveSensitivityY, delta * 3)
  ramiel.rotation.z = lerp(ramiel.rotation.z, -puntero.x * interaction.moveSensitivityX, delta * 3)

  // anillos AT Field: se abren con escalado gradual; cada uno tiene distinta velocidad.
  for (let i = 0; i < anillos.length; i++) {
    const anillo = anillos[i]

    const tAnillo = limitar((t - i * 0.15) / 0.55)
    const escala = lerp(motion.ringScaleStart, motion.ringScaleEnd, easeOutCubic(tAnillo))
    anillo.mesh.scale.set(escala, escala, escala)

    anillo.mesh.rotation.z = anillo.mesh.rotation.z + anillo.velocidad * velocidadActual * delta
    anillo.mesh.rotation.x = lerp(anillo.mesh.rotation.x, Math.PI / 2 + puntero.y * 0.25, delta * 3)
  }

  // partículas flotantes = orbitan alrededor del núcleo usando sine para moverse de forma orgánica.
  for (let i = 0; i < particulas.length; i++) {
    const particula = particulas[i]
    particula.angulo += particula.velocidad * delta
    particula.mesh.position.x = Math.cos(particula.angulo) * particula.radio
    particula.mesh.position.z = Math.sin(particula.angulo) * particula.radio
    particula.mesh.position.y = particula.altura + Math.sin(ahora * 0.002 + i) * 0.05
    particula.mesh.rotation.y += delta * 2.5
  }

  // portal = aparece al final de la intro; funciona como fondo de la composición.
  const tPortal = limitar((t - 0.3) / 0.7)
  const escalaPortal = lerp(motion.portalScaleStart, motion.portalScaleEnd, easeOutCubic(tPortal))
  portal.scale.set(escalaPortal, escalaPortal, escalaPortal)

  // resplandor sigue a Ramiel y cambia de color con la alerta; si quieres brillo mayor, sube 'lighting.pointIntensity'.
  glow.position.y = ramiel.position.y

  controls.update()
  renderer.render(scene, camera)
}

requestAnimationFrame(tick)
