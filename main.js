import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { gsap } from 'gsap'

// ==========================================
// 1. Configuración de Colores y Escena
// ==========================================
const COLORS = {
  fondo: 0x07050c,
  base: 0x15101f,
  morado: 0x4b2a7a,
  azul: 0x4aa3ff,
  lila: 0x8a5cff,
  verde: 0x9dff3c,
  naranja: 0xff6a00,
  amarillo: 0xffd700,
  alerta: 0xd7263d,
  suelo: 0x0b0814
}

const canvas = document.querySelector('#webgl')

const scene = new THREE.Scene()
scene.background = new THREE.Color(COLORS.fondo)
scene.fog = new THREE.Fog(COLORS.fondo, 5, 18)

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.set(0, 0.9, 5)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Sombras suaves
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.3, 0)
controls.enableDamping = true

// --- Textura Procedural para Ramiel ---
function createRamielTexture() {
  const size = 512
  const canvasElem = document.createElement('canvas')
  canvasElem.width = size
  canvasElem.height = size

  const context = canvasElem.getContext('2d')

  const gradient = context.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#e5f4ff')
  gradient.addColorStop(0.35, '#79bbff')
  gradient.addColorStop(0.7, '#2e7ef7')
  gradient.addColorStop(1, '#0d2f7a')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  for (let i = 0; i < 80; i++) {
    const y = Math.random() * size
    const height = 1 + Math.random() * 4
    const alpha = 0.03 + Math.random() * 0.08
    context.fillStyle = `rgba(255, 255, 255, ${alpha})`
    context.fillRect(0, y, size, height)
  }

  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const value = 160 + Math.random() * 95
    const alpha = 0.03 + Math.random() * 0.11
    context.fillStyle = `rgba(${value}, ${value + 18}, 255, ${alpha})`
    context.fillRect(x, y, 1, 1)
  }

  const texture = new THREE.CanvasTexture(canvasElem)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1.25, 1.25)
  texture.needsUpdate = true
  return texture
}

// --- Textura Matcap ---
function createMatcapTexture() {
  const canvasElem = document.createElement('canvas')
  canvasElem.width = 256
  canvasElem.height = 256
  const ctx = canvasElem.getContext('2d')
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.7, '#8a5cff')
  grad.addColorStop(1, '#15101f')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(canvasElem)
}

const ramielTexture = createRamielTexture()
const matcapTexture = createMatcapTexture()

// ==========================================
// 2. Luces
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xc9b8ff, 2.2)
directionalLight.position.set(2, 6, 2)
directionalLight.castShadow = true

directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.near = 0.5
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.top = 5
directionalLight.shadow.camera.bottom = -5
directionalLight.shadow.camera.left = -7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.bias = -0.001

scene.add(directionalLight)

const glow = new THREE.PointLight(COLORS.naranja, 8, 6)
glow.position.set(0, 0.45, 0)
scene.add(glow)

// ==========================================
// 3. Geometrías y Materiales
// ==========================================

// Material 1: MeshStandardMaterial (Suelo, Pedestal y Monolitos)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: COLORS.suelo, roughness: 0.8, metalness: 0.1 })
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -1
floor.receiveShadow = true
scene.add(floor)

const grid = new THREE.GridHelper(30, 30, COLORS.naranja, 0x2a1a45)
grid.position.y = -0.995
scene.add(grid)

// Pedestal por Niveles
const pedestalMaterial = new THREE.MeshStandardMaterial({ color: COLORS.base, roughness: 0.4, metalness: 0.3 })

const pedestalSuperior = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.3, 6), pedestalMaterial)
pedestalSuperior.position.y = -0.65
pedestalSuperior.castShadow = true
pedestalSuperior.receiveShadow = true

const pedestalMedio = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.2, 6), pedestalMaterial)
pedestalMedio.position.y = -0.8
pedestalMedio.castShadow = true
pedestalMedio.receiveShadow = true

const pedestalInferior = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.15, 6), pedestalMaterial)
pedestalInferior.position.y = -0.925
pedestalInferior.castShadow = true
pedestalInferior.receiveShadow = true

scene.add(pedestalSuperior, pedestalMedio, pedestalInferior)

// Monolitos de fondo
const numMonolitos = 5
const radioSemicirculo = 4.8
const monolitoMaterial = new THREE.MeshStandardMaterial({ color: COLORS.base, roughness: 0.5, metalness: 0.2 })

for (let i = 0; i < numMonolitos; i++) {
  const angle = -Math.PI * 5 / 6 + (i / (numMonolitos - 1)) * (Math.PI * 2 / 3)
  const x = Math.cos(angle) * radioSemicirculo
  const z = Math.sin(angle) * radioSemicirculo

  const monolito = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.0, 0.4), monolitoMaterial)
  monolito.position.set(x, 1.0, z)
  monolito.lookAt(0, 1.0, 0)
  monolito.castShadow = true
  monolito.receiveShadow = true
  scene.add(monolito)
}

// Objeto Principal (Ramiel)
const ramielGeometry = new THREE.OctahedronGeometry(0.55)
const ramielMaterial = new THREE.MeshStandardMaterial({
  color: COLORS.azul,
  map: ramielTexture,
  emissive: 0x0d234f,
  roughness: 0.25,
  metalness: 0.6,
  flatShading: true
})

const ramiel = new THREE.Mesh(ramielGeometry, ramielMaterial)
ramiel.position.y = 0.45
ramiel.scale.set(1, 1.5, 1)
ramiel.castShadow = true
ramiel.receiveShadow = true

// Material 2: MeshBasicMaterial (Aro, Portal, Aristas y Shockwave)
const aroPedestal = new THREE.Mesh(
  new THREE.TorusGeometry(0.8, 0.02, 8, 6),
  new THREE.MeshBasicMaterial({ color: COLORS.naranja })
)
aroPedestal.position.set(0, -0.49, 0)
aroPedestal.rotation.set(Math.PI / 2, 0, Math.PI / 6)
scene.add(aroPedestal)

const portal = new THREE.Mesh(
  new THREE.TorusGeometry(2.2, 0.025, 8, 6),
  new THREE.MeshBasicMaterial({ color: COLORS.naranja })
)
portal.position.set(0, 0.905, -2.5)
scene.add(portal)

const aristas = new THREE.LineSegments(
  new THREE.EdgesGeometry(ramielGeometry),
  new THREE.LineBasicMaterial({ color: COLORS.verde })
)
ramiel.add(aristas)
scene.add(ramiel)

const shockwave = new THREE.Mesh(
  new THREE.RingGeometry(0.2, 0.4, 32),
  new THREE.MeshBasicMaterial({ color: COLORS.verde, transparent: true, opacity: 0, side: THREE.DoubleSide })
)
shockwave.rotation.x = -Math.PI / 2
shockwave.position.y = -0.98
scene.add(shockwave)

// Material 3: MeshPhongMaterial (Anillos de energía)
const datosAnillos = [
  { radio: 1.5, color: COLORS.verde, velocidad: 0.5 },
  { radio: 2.0, color: COLORS.naranja, velocidad: -0.3 },
  { radio: 2.5, color: COLORS.lila, velocidad: 0.2 }
]

const anillos = datosAnillos.map((dato) => {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(dato.radio, 0.012, 8, 6),
    new THREE.MeshPhongMaterial({ color: dato.color, shininess: 100 })
  )
  mesh.position.y = 0.45
  mesh.rotation.x = Math.PI / 2
  scene.add(mesh)
  return { mesh, velocidad: dato.velocidad }
})

// Material 4: MeshMatcapMaterial (Bola / Núcleo Central en Y = 1.6)
const nucleo = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.18, 1),
  new THREE.MeshMatcapMaterial({ matcap: matcapTexture, color: COLORS.lila })
)
nucleo.position.y = 1.6
nucleo.castShadow = true
nucleo.receiveShadow = true
scene.add(nucleo)

// Material 5: MeshToonMaterial (Partículas Amarillas orbitando a Ramiel)
const particulas = []
const numParticulas = 8

for (let i = 0; i < numParticulas; i++) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 16, 16),
    new THREE.MeshToonMaterial({
      color: COLORS.amarillo,
      emissive: 0xffa500,
      emissiveIntensity: 0.5
    })
  )
  mesh.castShadow = true
  scene.add(mesh)
  particulas.push({
    mesh,
    angulo: (i * Math.PI * 2) / numParticulas
  })
}

// ==========================================
// 4. Importación de Modelo 3D Externo (GLTFLoader)
// ==========================================
const gltfLoader = new GLTFLoader()
let modeloImportado = null

gltfLoader.load(
  './scene.gltf',
  (gltf) => {
    modeloImportado = gltf.scene
    console.log('✓ Modelo scene.gltf cargado exitosamente')

    // Posicionado justo encima del borde superior de la bola (Y = 1.85)
    modeloImportado.position.set(0, 1.85, 0)
    modeloImportado.scale.set(0.5, 0.5, 0.5)

    modeloImportado.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    scene.add(modeloImportado)
  },
  (progress) => {
    if (progress.total > 0) {
      const percent = Math.round((progress.loaded / progress.total) * 100)
      console.log(`Cargando modelo 3D: ${percent}%`)
    }
  },
  (error) => {
    console.warn('✗ No se encontró ./scene.gltf o falló la carga.', error)
  }
)

// ==========================================
// 5. Eventos e Interacción (Raycaster & GSAP)
// ==========================================
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let alerta = false

function toggleAlerta() {
  alerta = !alerta

  gsap.killTweensOf(ramiel.scale)
  gsap.killTweensOf(shockwave.scale)
  gsap.killTweensOf(shockwave.material)

  gsap.to(ramiel.scale, {
    x: 1.2,
    y: 1.8,
    z: 1.2,
    duration: 0.25,
    yoyo: true,
    repeat: 1
  })

  shockwave.material.color.setHex(alerta ? COLORS.alerta : COLORS.verde)
  shockwave.scale.set(0.1, 0.1, 0.1)
  shockwave.material.opacity = 0.8

  gsap.to(shockwave.scale, { x: 15, y: 15, z: 15, duration: 0.7, ease: 'power2.out' })
  gsap.to(shockwave.material, { opacity: 0, duration: 0.7, ease: 'power2.out' })

  ramiel.material.color.setHex(alerta ? COLORS.alerta : COLORS.azul)
  aristas.material.color.setHex(alerta ? COLORS.naranja : COLORS.verde)
  glow.color.setHex(alerta ? COLORS.alerta : COLORS.naranja)
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(ramiel)

  if (intersects.length > 0) toggleAlerta()
})

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') toggleAlerta()
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// ==========================================
// 6. Bucle de Animación
// ==========================================
const clock = new THREE.Clock()

const tick = () => {
  const delta = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()
  const speed = alerta ? 3 : 1

  // 1. Flotación + Rotación de Ramiel
  ramiel.position.y = 0.45 + Math.sin(elapsedTime * 2) * 0.08
  ramiel.rotation.y += 0.6 * speed * delta

  // 2. Rotación de Anillos
  anillos.forEach((anillo) => {
    anillo.mesh.rotation.z += anillo.velocidad * speed * delta
  })

  // 3. Partículas Amarillas (Orbitando a Ramiel)
  particulas.forEach((p, index) => {
    p.angulo += 0.8 * speed * delta
    p.mesh.position.x = Math.cos(p.angulo) * 1.05
    p.mesh.position.z = Math.sin(p.angulo) * 1.05
    p.mesh.position.y = 0.45 + Math.sin(elapsedTime * 3 + index) * 0.1
    p.mesh.rotation.y += 2.5 * delta
  })

  // 4. Portal y Modelo Importado (Flotando suavemente justo arriba de la bola)
  portal.rotation.z += 0.1 * delta

  if (modeloImportado) {
    modeloImportado.rotation.y += 0.5 * delta
    modeloImportado.position.y = 1.85 + Math.sin(elapsedTime * 1.5) * 0.03
  }

  // 5. La luz de brillo sigue a Ramiel
  glow.position.y = ramiel.position.y

  // 6. Renderizado
  controls.update()
  renderer.render(scene, camera)

  requestAnimationFrame(tick)
}

tick()