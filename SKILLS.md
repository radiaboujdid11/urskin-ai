# Skills actives

## Frontend Design
- Thème cohérent : variables CSS globales dans index.css
- Pas de couleurs hardcodées dans les composants
- Toujours mobile-first
- Animations : prefer CSS transitions, Three.js pour scènes lourdes

## Three.js dans React
- Utiliser useEffect + useRef pour le canvas
- Toujours cleanup : renderer.dispose() au unmount
- Toujours resize listener avec cleanup
- requestAnimationFrame avec référence pour cancel
- Géométries procédurales si pas de fichier .glb disponible

## Boîte de crème 3D (CreamJar)
Créer une scène Three.js avec :
- Cylindre bas (corps) + cylindre plat (couvercle) = boîte de crème
- Animation d'ouverture : couvercle monte + pivote légèrement (GSAP ou Three.js clock)
- Rotation lente et continue sur Y
- Particules nacrées qui flottent autour (BufferGeometry points)
- Lumières : AmbientLight douce + PointLight rose + PointLight gold
- Matériaux : MeshStandardMaterial avec roughness 0.2, metalness 0.3
- Fond transparent (alpha: true) pour superposer sur le hero
- Réagit à la souris : légère inclinaison selon position curseur
