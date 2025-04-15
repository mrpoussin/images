import "./styles.css";
import * as THREE from "three";
import WebGL from "./webgl";

// Plane geometry as before
const geometry = new THREE.PlaneBufferGeometry(1, 1, 10, 10);

// Load a *tileable* noise texture
const noiseTexture = new THREE.TextureLoader().load(
  "https://raw.githubusercontent.com/mrpoussin/images/refs/heads/main/perlin.png"
);
// Ensure repeating in X & Y
noiseTexture.wrapS = THREE.RepeatWrapping;
noiseTexture.wrapT = THREE.RepeatWrapping;

// Define uniforms including the new y_offset
const uniforms = {
  time: { value: 0.0 },
  animation_speed: { value: 0.2 },
  flame_color: { value: new THREE.Vector4(0.8, 0.2, 1.0, 1.0) },
  noise_texture: { value: noiseTexture },
  y_offset: { value: 0.5 }, // New uniform: adjust this value to shift the threshold vertically
};

const vertexShader = `
  precision mediump float;

  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `precision mediump float;

uniform float time;
uniform float animation_speed;
uniform sampler2D noise_texture;
uniform float y_offset;

varying vec2 vUv;

void main() {
  // 1) Create a simple scrolling UV in Y (no fract here).
  vec2 uv = vec2(vUv.x, vUv.y - time * animation_speed);

  // 2) Sample noise from the texture.
  vec4 noiseColor = texture2D(noise_texture, uv);

  // 3) Start our final color as the noise color.
  vec4 finalColor = noiseColor;

  // 4) Add (vUv.y - y_offset) into the RGB channels.
  finalColor.rgb -= vec3(vUv.y - y_offset);

  // 5) Step threshold at 0.5 on the RGB channels.
  //    Any component >= 0.5 becomes 1.0, else 0.0
  finalColor.rgb = step(vec3(0.5), finalColor.rgb);

  // 6) Output the final color (with alpha = 1.0).
  gl_FragColor = finalColor;
}
`;

const material = new THREE.RawShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader,
  transparent: true, // Let alpha be visible
});

const mesh = new THREE.Mesh(geometry, material);
mesh.scale.setScalar(500);
WebGL.scene.add(mesh);

// Position camera so the entire plane is visible
WebGL.camera.position.z = 800;

function animate() {
  requestAnimationFrame(animate);
  uniforms.time.value += 0.02;
  WebGL.renderer.render(WebGL.scene, WebGL.camera);
}
animate();
