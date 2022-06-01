varying vec3 vPosition;
varying float vConfidence;

uniform float uMaximumX;
uniform float uMaximumY;

void main() {
  float radius = 0.2;
  float strength = step(distance(gl_PointCoord, vec2(0.5)), radius);

  // Hide keypoints that are out of the image frame.
  float inXRange = step(-uMaximumX / 2.0, vPosition.x) * (1.0 - step(uMaximumX / 2.0, vPosition.x));
  float inYRange = step(-uMaximumY / 2.0, vPosition.y) * (1.0 - step(uMaximumY / 2.0, vPosition.y));
  strength *= inXRange * inYRange;

  // Hide keypoints that are low confidence
  strength *= step(0.6, vConfidence);

  // Final color
  gl_FragColor = vec4(1.0, 0.0, 0.0, strength);
}