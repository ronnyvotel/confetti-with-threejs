uniform float uSize;
uniform float uTime;

attribute vec3 aOffset;
attribute vec3 aColor;
attribute float aAlpha;
attribute float aWidthScale;
attribute vec4 aAxisAngularRate;

varying vec4 vColor;

vec3 rotate(vec3 v, float theta, vec3 axis) {
  float ctheta = cos(theta);
  float stheta = sin(theta);
  float ux = axis.x;
  float uy = axis.y;
  float uz = axis.z;
  return vec3(
    (ctheta+ux*ux*(1.-ctheta))*v.x + (ux*uy*(1.-ctheta)-uz*stheta)*v.y + (ux*uz*(1.-ctheta)+uy*stheta)*v.z,
    (uy*ux*(1.-ctheta)+uz*stheta)*v.x + (ctheta+uy*uy*(1.-ctheta))*v.y + (uy*uz*(1.-ctheta)-ux*stheta)*v.z,
    (uz*ux*(1.-ctheta)-uy*stheta)*v.x + (uz*uy*(1.-ctheta)+ux*stheta)*v.y + (ctheta+uz*uz*(1.-ctheta))*v.z
  );

}

void main() {
  vec3 pos = position * uSize;
  pos.x *= aWidthScale;
  pos = rotate(pos, aAxisAngularRate.a * uTime, aAxisAngularRate.xyz);
  pos += aOffset;
  vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;

  // Color
  vColor = vec4(aColor, aAlpha);
}