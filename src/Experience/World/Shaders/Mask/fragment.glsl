varying vec2 vUv;

uniform sampler2D uMap;
uniform sampler2D uSeg;
uniform bool uPersonVisible;
uniform vec2 uPixelSize;
uniform float uPixelOffset;
uniform bool uTransparentBackground;
uniform bool uDisplaySegMask;

float sampleMask(sampler2D tMaskMap, vec2 vUv) {
  return texture2D(tMaskMap, vUv).a;
}

float bidirectionalBlurMask(sampler2D tMap, vec2 vUv) {
  float mask = sampleMask(tMap, vUv);
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(-uPixelSize.x * 3.0, 0));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(-uPixelSize.x * 2.0, 0));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(-uPixelSize.x, 0));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(uPixelSize.x, 0));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(uPixelSize.x * 2.0, 0));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(uPixelSize.x * 3.0, 0));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(0, -uPixelSize.y * 3.0));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(0, -uPixelSize.y * 2.0));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(0, -uPixelSize.y));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(0, uPixelSize.y));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(0, uPixelSize.y * 2.0));
  mask+= sampleMask(tMap, vUv + uPixelOffset
                    * vec2(0, uPixelSize.y * 3.0));
  mask*= 0.076923076923077;  // 1/13

  return mask;
}

void main() {
  vec4 pixelColor = texture2D(uMap, vec2(1.0 - vUv.x, vUv.y));

  float mask = bidirectionalBlurMask(uSeg, vec2(1.0 - vUv.x, vUv.y));
  mask = step(0.5, mask);

  pixelColor.g += float(uDisplaySegMask) * 0.5 * mask * float(uPersonVisible);
  pixelColor.g = clamp(pixelColor.g, 0.0, 1.0);
  pixelColor.a *= 1.0 - float(uTransparentBackground && bool(1.0 - mask));
  gl_FragColor = pixelColor;
}