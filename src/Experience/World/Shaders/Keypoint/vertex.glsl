attribute float aConfidence;

varying vec3 vPosition;
varying float vConfidence;


void main() {
  vPosition = position;
  vConfidence = aConfidence;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 40.0;
}