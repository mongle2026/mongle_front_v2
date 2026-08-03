import { Skia } from '@shopify/react-native-skia';

export const MUSIC_COVER_HALFTONE_EFFECT =
  Skia.RuntimeEffect.Make(`
    uniform shader image;

    uniform float2 resolution;

    uniform float dotSize;
    uniform float dotScale;
    uniform float softness;

    const float PI = 3.14159265359;

    /*
     * Figma 레퍼런스에 맞춘 내부 프리셋입니다.
     * 외부에서 전달하는 dotSize / dotScale / softness는
     * 디자인팀 조건 그대로 유지합니다.
     */
    const float PRINT_GAMMA = 0.96;
    const float BRIGHTNESS_NORMALIZATION = 0.34;

    const float CMY_INK_DENSITY = 0.82;
    const float BLACK_INK_DENSITY = 0.74;

    // 색 분리 높으면 높을 수록 강해짐 
    const float PRINT_COLOR_MIX = 0.52;
    // 은은하게 하고 싶으면 값을 더 낮추면 됨. 
    const float HALFTONE_STRENGTH = 0.34;

    float getLuminance(float3 rgb) {
      return dot(
        rgb,
        float3(
          0.2126,
          0.7152,
          0.0722
        )
      );
    }

    float2 rotateAroundCenter(
      float2 point,
      float angle
    ) {
      float2 center =
        resolution * 0.5;

      float2 translatedPoint =
        point - center;

      float sine =
        sin(angle);

      float cosine =
        cos(angle);

      float2 rotatedPoint =
        float2(
          translatedPoint.x * cosine -
          translatedPoint.y * sine,

          translatedPoint.x * sine +
          translatedPoint.y * cosine
        );

      return rotatedPoint + center;
    }

    /*
     * 별도 brightness prop 없이 입력 밝기를 자동 정규화합니다.
     * 원본을 직접 덮어쓰지 않고 CMYK 잉크량 계산에만 사용해
     * 어두워지거나 하이라이트가 날아가는 현상을 줄입니다.
     */
    float3 normalizeBrightness(float3 rgb) {
      float luminance =
        getLuminance(rgb);

      if (luminance <= 0.0001) {
        return float3(0.0);
      }

      float normalizedLuminance =
        smoothstep(
          0.025,
          0.965,
          luminance
        );

      float brightnessScale =
        normalizedLuminance /
        luminance;

      float appliedScale =
        mix(
          1.0,
          brightnessScale,
          BRIGHTNESS_NORMALIZATION
        );

      return clamp(
        rgb * appliedScale,
        0.0,
        1.0
      );
    }

    float mapInkAmount(float value) {
      float safeValue =
        clamp(
          value,
          0.0,
          1.0
        );

      return clamp(
        pow(
          safeValue,
          PRINT_GAMMA
        ),
        0.0,
        1.0
      );
    }

    float createDot(
      float2 screenPosition,
      float inkAmount,
      float channelRotation
    ) {
      float safeDotSize =
        max(
          dotSize,
          1.0
        );

      /*
       * UV가 아닌 Canvas 화면 좌표 xy를 사용합니다.
       * 이미지 크롭이나 원본 해상도와 무관하게
       * dotSize가 화면 픽셀 기준으로 유지됩니다.
       */
      float2 rotatedPosition =
        rotateAroundCenter(
          screenPosition,
          channelRotation
        );

      float2 cellPosition =
        fract(
          rotatedPosition /
          safeDotSize
        ) - 0.5;

      float distanceFromCenter =
        length(cellPosition);

      float radius =
        0.5 *
        sqrt(
          clamp(
            inkAmount,
            0.0,
            1.0
          )
        ) *
        dotScale;

      float edge =
        max(
          softness /
          safeDotSize,
          0.001
        );

      return 1.0 -
        smoothstep(
          radius - edge,
          radius + edge,
          distanceFromCenter
        );
    }

    half4 main(float2 xy) {
      /*
       * 원본 샘플 좌표는 변경하지 않습니다.
       * 따라서 이미지가 휘거나 밀리지 않습니다.
       */
      half4 sourceColor =
        image.eval(xy);

      float3 sourceRgb =
        clamp(
          float3(sourceColor.rgb),
          0.0,
          1.0
        );

      float sourceLuminance =
        getLuminance(sourceRgb);

      float3 normalizedRgb =
        normalizeBrightness(sourceRgb);

      /*
       * RGB를 CMYK 잉크량으로 변환합니다.
       */
      float black =
        1.0 -
        max(
          normalizedRgb.r,
          max(
            normalizedRgb.g,
            normalizedRgb.b
          )
        );

      float colorDenominator =
        max(
          1.0 - black,
          0.001
        );

      float cyan =
        clamp(
          (
            1.0 -
            normalizedRgb.r -
            black
          ) /
          colorDenominator,
          0.0,
          1.0
        );

      float magenta =
        clamp(
          (
            1.0 -
            normalizedRgb.g -
            black
          ) /
          colorDenominator,
          0.0,
          1.0
        );

      float yellow =
        clamp(
          (
            1.0 -
            normalizedRgb.b -
            black
          ) /
          colorDenominator,
          0.0,
          1.0
        );

      /*
       * CMYK 채널별 인쇄 각도입니다.
       *
       * 전체 이미지를 회전하지 않고
       * 각 채널의 망점 그리드만 회전합니다.
       */
      float cyanDot =
        createDot(
          xy,
          mapInkAmount(cyan),
          15.0 * PI / 180.0
        );

      float magentaDot =
        createDot(
          xy,
          mapInkAmount(magenta),
          75.0 * PI / 180.0
        );

      float yellowDot =
        createDot(
          xy,
          mapInkAmount(yellow),
          0.0
        );

      float blackDot =
        createDot(
          xy,
          mapInkAmount(black),
          45.0 * PI / 180.0
        );

      /*
       * 검은 바탕에 컬러 점을 더하는 방식이 아니라,
       * 밝은 종이에서 CMYK 잉크가 색을 감산하는 방식으로
       * 하프톤을 재구성합니다.
       *
       * 기존 방식보다 회색으로 탁해지거나
       * 전체 이미지가 어두워지는 현상이 적습니다.
       */
      float3 screenedColor =
        float3(
          1.0 -
          cyanDot * CMY_INK_DENSITY,

          1.0 -
          magentaDot * CMY_INK_DENSITY,

          1.0 -
          yellowDot * CMY_INK_DENSITY
        );

      /*
       * K 채널을 별도로 곱해
       * 검정과 그림자의 형태를 유지합니다.
       */
      screenedColor *=
        1.0 -
        blackDot * BLACK_INK_DENSITY;

      /*
       * 망점 때문에 생기는 평균 밝기 변화만 되돌립니다.
       *
       * 점의 형태와 CMYK 채널 각도 차이는 유지하면서
       * 원본보다 갑자기 어두워지는 현상만 줄입니다.
       */
      float normalizedLuminance =
        getLuminance(normalizedRgb);

      float screenedLuminance =
        getLuminance(screenedColor);

      float3 luminanceMatchedScreen =
        clamp(
          screenedColor +
          float3(
            normalizedLuminance -
            screenedLuminance
          ),
          0.0,
          1.0
        );

      /*
       * 하프톤 색상 자체를 원본 정규화 색상과 한 번 섞어
       * 레퍼런스처럼 사진의 형태와 색을 유지합니다.
       */
      float3 printColor =
        mix(
          normalizedRgb,
          luminanceMatchedScreen,
          PRINT_COLOR_MIX
        );

      /*
       * 검은 배경과 매우 어두운 글자는 거의 유지하고,
       * 얼굴·몸의 중간톤과 밝은 영역에서만
       * 하프톤이 은은하게 보이도록 마스크를 만듭니다.
       */
      float shadowMask =
        smoothstep(
          0.10,
          0.42,
          sourceLuminance
        );

      /*
       * 완전히 밝은 흰색 영역에는 효과를 다시 줄입니다.
       *
       * 앨범 커버의 흰 글자나 강한 하이라이트가
       * 뭉개지거나 번지는 현상을 방지합니다.
       */
      float highlightProtection =
        1.0 -
        0.35 *
        smoothstep(
          0.86,
          0.99,
          sourceLuminance
        );

      float localEffectStrength =
        HALFTONE_STRENGTH *
        shadowMask *
        highlightProtection;

      /*
       * 최종적으로 원본 이미지 위에
       * 밝기 영역별로 하프톤을 부분 적용합니다.
       */
      float3 finalColor =
        mix(
          sourceRgb,
          printColor,
          localEffectStrength
        );

      return half4(
        half3(
          clamp(
            finalColor,
            0.0,
            1.0
          )
        ),
        sourceColor.a
      );
    }
  `);

if (!MUSIC_COVER_HALFTONE_EFFECT) {
  throw new Error(
    'MusicCoverImg 하프톤 셰이더 컴파일에 실패했습니다.'
  );
}