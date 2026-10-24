// 토큰은 브라우저 메모리에만 보관한다. 새로고침하면 로그인 상태가 해제된다.
let session = { accessToken: "", user: null };
export const getSession = () => session;
export function clearSession() {
  session = { accessToken: "", user: null };
}
function authorizationHeaders() {
  // FE-02: 토큰이 있을 때만 Bearer 헤더를 만든다. 없으면 헤더 자체를 보내지 않는다.
  return session.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};
}
export async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authorizationHeaders(),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    // FE-03: 401은 토큰 무효(없음·변조·만료)이므로 메모리의 로그인 상태를 해제한다.
    // 403은 인증 자체는 유효하므로 로그아웃시키지 않는다.
    if (response.status === 401) clearSession();
    const error = new Error(
      data.message || data.code || `HTTP ${response.status}`,
    );
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}
export async function login(email, password) {
  // FE-01: 성공 응답의 토큰과 사용자 정보를 메모리에 저장한다.
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  session = { accessToken: data.accessToken, user: data.user };
  return data.user;
}
export function canEdit(post) {
  // FE-04: 로그인 사용자와 글 작성자가 같을 때만 수정·삭제 버튼을 보여 준다.
  // 서버의 작성자 권한 검사와 별개인 화면 표시용 검사다.
  return Boolean(session.user && post && session.user.id === post.authorId);
}
export const api = {
  list: () => request("/posts"),
  detail: (id) => request(`/posts/${id}`),
  create: (input) =>
    request("/posts", { method: "POST", body: JSON.stringify(input) }),
  update: (id, input) =>
    request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  me: () => request("/me"),
};
