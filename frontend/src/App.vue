<script setup>
import { ref, onMounted } from "vue";
import { api, login, getSession, clearSession, canEdit } from "./api";
const posts = ref([]),
  selected = ref(null),
  title = ref(""),
  content = ref(""),
  editing = ref(null);
const email = ref("alice@class.test"),
  password = ref("Classroom!2026"),
  user = ref(null),
  busy = ref(false),
  message = ref("게시판을 불러오는 중입니다.");
const refresh = async () => {
  posts.value = await api.list();
};
// FE-03: 응답 code별 안내 문구. 401은 재로그인 안내, 403은 권한 부족 안내만 한다.
const codeMessages = {
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
  TOKEN_REQUIRED: "로그인이 필요한 기능입니다. 먼저 로그인하세요.",
  INVALID_TOKEN: "로그인 정보가 유효하지 않습니다. 다시 로그인하세요.",
  TOKEN_EXPIRED: "로그인 시간이 만료되었습니다. 다시 로그인하세요.",
  FORBIDDEN: "본인이 작성한 글만 수정하거나 삭제할 수 있습니다.",
  NOT_FOUND: "게시글을 찾을 수 없어 목록을 새로 고쳤습니다.",
};
async function run(action, success) {
  busy.value = true;
  try {
    await action();
    message.value = success;
  } catch (e) {
    message.value = codeMessages[e.code] || e.message;
    // 404: 사라진 글은 상세를 닫고 목록을 갱신한다.
    if (e.status === 404) {
      selected.value = null;
      await refresh().catch(() => {});
    }
  } finally {
    // 401로 세션이 해제된 경우 화면의 로그인 표시도 함께 갱신된다.
    user.value = getSession().user;
    busy.value = false;
  }
}
onMounted(() => run(refresh, "게시판이 준비되었습니다."));
function reset() {
  title.value = "";
  content.value = "";
  editing.value = null;
}
function save() {
  // FE-04: 비로그인 사용자에게는 요청을 보내지 않고 로그인 안내를 표시한다.
  if (!user.value) {
    message.value = "글을 작성하려면 먼저 로그인하세요.";
    return;
  }
  run(async () => {
    const input = { title: title.value, content: content.value };
    selected.value = editing.value
      ? await api.update(editing.value, input)
      : await api.create(input);
    reset();
    await refresh();
  }, "게시글을 저장했습니다.");
}
function edit() {
  editing.value = selected.value.id;
  title.value = selected.value.title;
  content.value = selected.value.content;
}
function remove() {
  if (confirm("게시글을 삭제할까요?"))
    run(async () => {
      await api.remove(selected.value.id);
      selected.value = null;
      reset();
      await refresh();
    }, "게시글을 삭제했습니다.");
}
function logout() {
  clearSession();
  user.value = null;
  message.value = "이 탭의 로그인 상태를 해제했습니다.";
}
function me() {
  run(async () => {
    const u = await api.me();
    alert(`${u.name} (${u.email})`);
  }, "내 정보 조회를 완료했습니다.");
}
</script>
<template>
  <main>
    <header>
      <span class="eyebrow">FOOD REVIEW BOARD</span>
      <h1>오늘의 맛집 후기</h1>
      <p class="muted">
        다녀온 맛집과 음식을 기록하고 공유하는 게시판입니다.
      </p>
    </header>
    <p class="banner">
      후기는 누구나 읽을 수 있습니다. 글 작성은 로그인한 사용자만 가능하며,
      수정과 삭제는 작성자 본인만 할 수 있습니다.
    </p>
    <div role="status" class="message">{{ message }}</div>
    <div class="grid">
      <aside>
        <section class="card">
          <h2>로그인</h2>
          <p>{{ user ? `${user.name}님 로그인 중` : "로그아웃 상태" }}</p>
          <form
            @submit.prevent="
              run(() => login(email, password), '로그인했습니다.')
            "
          >
            <label>이메일<input type="email" v-model="email" required /></label
            ><label
              >비밀번호<input type="password" v-model="password" required
            /></label>
            <div class="actions">
              <button :disabled="busy">로그인</button
              ><button type="button" class="secondary" @click="logout">
                로그아웃
              </button>
            </div>
          </form>
          <p>
            <small
              >테스트 계정: alice@class.test / bob@class.test<br />공통
              비밀번호: Classroom!2026</small
            >
          </p>
          <button class="secondary" :disabled="busy" @click="me">
            내 정보 조회
          </button>
        </section>
        <section class="card">
          <h2>{{ editing ? "후기 수정" : "새 후기 작성" }}</h2>
          <p v-if="!user">
            <small>글을 작성하려면 먼저 로그인하세요.</small>
          </p>
          <form @submit.prevent="save">
            <label>제목<input maxlength="100" v-model="title" required /></label
            ><label
              >내용<textarea maxlength="5000" v-model="content" required />
            </label>
            <div class="actions">
              <button :disabled="busy">
                {{ editing ? "수정 저장" : "등록" }}</button
              ><button type="button" class="secondary" @click="reset">
                입력 초기화
              </button>
            </div>
          </form>
        </section>
      </aside>
      <div>
        <section class="card">
          <h2>
            게시글 목록 <small>{{ posts.length }}개</small>
          </h2>
          <p v-if="!posts.length">첫 번째 기록을 남겨 보세요.</p>
          <article class="post" v-for="p in posts" :key="p.id">
            <button
              class="post-title"
              :disabled="busy"
              @click="
                run(
                  async () => (selected = await api.detail(p.id)),
                  '게시글을 불러왔습니다.',
                )
              "
            >
              {{ p.title }}
            </button>
            <p>
              <small
                >{{ p.authorName }} ·
                {{ new Date(p.createdAt).toLocaleString() }}</small
              >
            </p>
          </article>
        </section>
        <section class="card">
          <h2>게시글 상세</h2>
          <template v-if="selected"
            ><h3>{{ selected.title }}</h3>
            <p class="content">{{ selected.content }}</p>
            <p>
              <small>작성자 {{ selected.authorName }}</small>
            </p>
            <div class="actions" v-if="canEdit(selected)">
              <button class="secondary" @click="edit">수정</button
              ><button class="danger" :disabled="busy" @click="remove">
                삭제
              </button>
            </div></template
          >
          <p class="muted" v-else>목록에서 제목을 선택하세요.</p>
        </section>
      </div>
    </div>
  </main>
</template>
