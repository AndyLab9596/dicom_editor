import type {
  IStackViewport,
} from "@cornerstonejs/core/types";

/**
 * Cấy fragment shader thay thế khối tô màu mặc định của vtkImageMapper.
 * Ta thực hiện box/gaussian blur 3x3. “sigma” chỉ là hệ số nội suy giữa ảnh gốc và ảnh blur.
 */
export function injectDenoiseShader(vp: IStackViewport, sigma: number) {
  try {
    // Lấy default actor (ImageSlice) từ viewport (Cornerstone3D trả về entry { actor, uid, ... })
    const actorEntry = vp.getActors()[0];
    if (!actorEntry) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actor = (actorEntry.actor as any) || actorEntry; // đề phòng tuỳ phiên bản
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapper = actor?.getMapper() as any;
    
    // Xoá mọi replacement cũ trước khi thêm (tránh nối chồng)
    mapper.clearVertexShaderReplacement?.();
    console.log("sp", mapper);
    mapper.clearFragmentShaderReplacement?.();

    // 1) Khai báo phần mở rộng/biến (section Dec)
    mapper.addFragmentShaderReplacement(
      // marker trong vtk.js
      "//VTK::Output::Dec", // chèn thêm trước khi phần Output được định nghĩa
      `
      //VTK::Output::Dec
      // custom uniforms (nếu cần thêm)
      `,
      false // before original
    );

    // 2) Thay thế phần Color::Impl – nơi tính final color
    // - texture1: sampler2D chính trong vtk image mapper
    // - tcoordVC: vec2 toạ độ texture (0..1)
    // - WebGL2: có textureSize(texture1, 0) để tính texel
    const frag = `
      //VTK::Color::Impl
      // Lấy màu gốc
      vec4 baseColor = texture(texture1, tcoordVC.st);

      // Tắt blur nếu sigma ~ 0
      float s = ${sigma.toFixed(3)};
      if (s <= 0.001) {
        gl_FragData[0] = baseColor;
        return;
      }

      // Tính texel size từ textureSize (WebGL2)
      ivec2 isz = textureSize(texture1, 0);
      vec2 texel = 1.0 / vec2(isz);

      // Kernel Gaussian 3x3 “nhẹ”
      float k[9];
      k[0] = 1.0; k[1] = 2.0; k[2] = 1.0;
      k[3] = 2.0; k[4] = 4.0; k[5] = 2.0;
      k[6] = 1.0; k[7] = 2.0; k[8] = 1.0;

      vec2 off[9];
      off[0] = vec2(-1.0, -1.0);
      off[1] = vec2( 0.0, -1.0);
      off[2] = vec2( 1.0, -1.0);
      off[3] = vec2(-1.0,  0.0);
      off[4] = vec2( 0.0,  0.0);
      off[5] = vec2( 1.0,  0.0);
      off[6] = vec2(-1.0,  1.0);
      off[7] = vec2( 0.0,  1.0);
      off[8] = vec2( 1.0,  1.0);

      float norm = 16.0; // tổng kernel 3x3 ở trên
      vec3 sum = vec3(0.0);

      for (int i = 0; i < 9; i++) {
        vec2 tc = tcoordVC.st + off[i] * texel;
        vec3 c = texture(texture1, tc).rgb;
        sum += c * k[i];
      }
      vec3 blur = sum / norm;

      // trộn: s=0 -> base, s=1 -> blur
      vec3 outColor = mix(baseColor.rgb, blur, clamp(s, 0.0, 1.0));

      gl_FragData[0] = vec4(outColor, baseColor.a);
    `;

    mapper.addFragmentShaderReplacement(
      "//VTK::Color::Impl",
      frag,
      true // replace original section
    );
    console.log("go to here")
    vp.render();
  } catch (err) {
    // Nếu phiên bản Cornerstone/vtk khác marker, ta không thay được.
    console.warn("injectDenoiseShader error:", err);
  }
}
