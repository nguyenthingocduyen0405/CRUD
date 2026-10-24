import jwt from "jsonwebtoken";
import { ApiError } from "./errors.js";
import { findPublic } from "./users.js";

const ISSUER = process.env.JWT_ISSUER || "webservice-class";
const AUDIENCE = process.env.JWT_AUDIENCE || "board-api";

// BE-01: 64자리 16진수 문자열만 허용하고 32바이트 키로 변환한다.
// 빈 값·형식 오류·제공 예시 키(16진수가 아님)는 서버 시작 시점에 거부한다.
const secretKey = (() => {
  const hex = (process.env.JWT_SECRET || "").trim();
  if (!/^[0-9a-f]{64}$/i.test(hex))
    throw new Error(
      "JWT_SECRET은 64자리 16진수 문자열이어야 합니다. .env의 키를 새 난수로 설정하세요.",
    );
  return Buffer.from(hex, "hex");
})();

export function issueToken(user) {
  // BE-01: 비밀번호 검증이 끝난 사용자에게만 호출된다. 토큰에는 공개 식별자만 넣는다.
  return jwt.sign({}, secretKey, {
    algorithm: "HS256",
    subject: String(user.id),
    expiresIn: Number(process.env.TOKEN_TTL || 90),
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function currentUserId(req) {
  // BE-02: 토큰 없음 또는 Bearer 형식 오류는 401 TOKEN_REQUIRED.
  const match = /^Bearer\s+(\S+)$/.exec(req.get("Authorization") || "");
  if (!match)
    throw new ApiError(401, "TOKEN_REQUIRED", "로그인 토큰이 필요합니다.");
  let payload;
  try {
    // 허용 알고리즘을 HS256으로 고정하고 서명·만료·iss·aud를 라이브러리로 검증한다.
    payload = jwt.verify(match[1], secretKey, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError)
      throw new ApiError(
        401,
        "TOKEN_EXPIRED",
        "로그인 시간이 만료되었습니다. 다시 로그인하세요.",
      );
    throw new ApiError(401, "INVALID_TOKEN", "유효하지 않은 토큰입니다.");
  }
  // exp 존재와 문자열 sub 형식은 verify가 보장하지 않으므로 직접 확인한다.
  if (
    typeof payload.exp !== "number" ||
    typeof payload.sub !== "string" ||
    !/^[1-9]\d*$/.test(payload.sub)
  )
    throw new ApiError(401, "INVALID_TOKEN", "토큰 클레임이 올바르지 않습니다.");
  const userId = Number(payload.sub);
  // sub가 가리키는 계정이 실제로 존재할 때만 검증된 ID를 다음 처리로 전달한다.
  if (!findPublic(userId))
    throw new ApiError(401, "INVALID_TOKEN", "사용자를 확인할 수 없습니다.");
  return userId;
}

export function assertOwner(userId, authorId) {
  // BE-03: 저장된 글의 작성자와 검증된 사용자가 다르면 403으로 거부한다.
  if (userId !== authorId)
    throw new ApiError(
      403,
      "FORBIDDEN",
      "본인이 작성한 글만 수정하거나 삭제할 수 있습니다.",
    );
}
