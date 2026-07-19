/**
 * Central catalog of user-facing UI text (Korean).
 *
 * Why one file: the app ships a single locale, so editing copy shouldn't mean
 * hunting through components. Everything a user reads in the app chrome lives
 * here — labels, headings, placeholders, aria-labels, toasts, and error
 * messages. Values are either plain strings or, when a string interpolates
 * data, a function returning a string.
 *
 * Deliberately NOT here:
 * - Seed/demo schedule content (src/board/legacy.js) — sample data, not chrome.
 * - Date/duration format fragments (src/lib/time.js) — formatting logic.
 * - Weekday names / color labels (src/lib/config.js) — already centralized.
 * - Server-only OG and REST strings (src/server/*) — separate from the client
 *   bundle; og-meta.js exports its own constants.
 *
 * Adding a locale later means turning each leaf into a per-locale lookup; the
 * call sites (which reference `t.share.linkCopied` etc.) would not change.
 */

export const t = Object.freeze({
  app: {
    name: '주간 계획표',
    nameFull: '주간 계획표 · Weekly Planner',
    tagline: '실시간으로 함께 쓰는 주간 시간표',
    /** Default board name. */
    board: '시간표',
    myBoard: '내 시간표',
    /** Anonymous presence / account fallback. */
    guest: '손님',
    /** Default event title. */
    event: '일정',
  },

  common: {
    loading: '불러오는 중…',
    boardLoading: '시간표를 준비하는 중…',
    checking: '확인 중…',
    sending: '보내는 중…',
    open: '열기',
    add: '추가',
    done: '완료',
    save: '저장',
    cancel: '취소',
    close: '닫기',
    copy: '복사',
    login: '로그인',
    show: '보이기',
    hide: '숨기기',
    view: '보기',
    edit: '편집',
    sep: ' · ',
    errorPrefix: (message) => `오류: ${message}`,
  },

  a11y: {
    toLightMode: '라이트 모드로 전환',
    toDarkMode: '다크 모드로 전환',
    close: '닫기',
    guest: '게스트',
    account: '계정',
    accountMenu: '계정 메뉴',
    more: '더보기',
    print: '인쇄',
    share: '공유',
    todayTodos: '오늘 할 일',
    backToPlanner: '시간표로 돌아가기',
    addBoard: '새 시간표 추가',
    boardList: '시간표 목록',
    boardSettings: '시간표 설정',
    presenceCount: (n) => `접속 중 ${n}명`,
    presenceHeading: (n) => `접속 중 · ${n}명`,
    presenceNames: (n) => `접속 중 ${n}명 — 이름 보기`,
    avatarColor: (c) => `아바타 색 ${c}`,
    colorName: (color) => `${color} 이름`,
    colorToggle: (label, on) => `${label} ${on ? '숨기기' : '보이기'}`,
    swatch: (name) => `색상 ${name}`,
    memberRole: (label) => `${label} 역할`,
    memberRemove: (label) => `${label} 제거`,
    tokenHoldDelete: (name) => `${name} 길게 눌러 삭제`,
    closeTokenReveal: '토큰 표시 닫기',
    deleteEventHold: '일정 삭제 — 길게 눌러 확인',
    clearEventsHold: '모든 일정 비우기 — 길게 눌러 확인',
    deleteBoardHold: '시간표 삭제 — 길게 눌러 확인',
    eventAt: (title, label, dow, from, to) =>
      `${title}${label ? ', ' + label : ''}, ${dow}요일 ${from}부터 ${to}까지`,
  },

  auth: {
    title: '주간 계획표',
    emailHint: '이메일로 로그인 코드를 보내드려요. 계정이 없으면 자동으로 만들어집니다.',
    sendCode: '코드 받기',
    codeTitle: '코드 입력',
    codeSentSuffix: '으로 보낸 6자리 코드를 입력하세요.',
    backToEmail: '다른 이메일',
    holdOn: '길게 누르고 있으세요',
    codeInputLabel: '인증 코드',
    codeDigit: (n) => `${n}번째 자리`,
    passwordTitle: '비밀번호',
    passwordProtected: '이 시간표는 비밀번호로 보호되어 있어요',
    password: '비밀번호',
    unlockFailed: '잠금 해제에 실패했어요',
    err: {
      sendCode: '코드를 보내지 못했어요',
      badCode: '코드가 올바르지 않아요',
      startFailed: '시작하지 못했어요. 다시 시도해 주세요',
    },
  },

  account: {
    title: '계정 설정',
    profileHint: '이름과 색은 함께 보는 사람들에게 아바타와 커서로 표시돼요.',
    displayName: '표시 이름',
    myColor: '내 색',
    autoColor: '자동',
    autoColorTitle: '이메일에서 자동으로 정해진 색',
    guestAccount: '게스트 계정',
    screen: '화면',
    themeAppliesAll: '테마는 이 계정의 모든 기기에 적용돼요.',
    theme: '테마',
    themeLight: '라이트',
    themeDark: '다크',
    apiTokens: 'API 토큰',
    apiTokensHint: 'REST API(',
    apiTokensHint2: ')에 ',
    apiTokensHint3:
      ' 헤더로 사용해요. 토큰은 만들 때 한 번만 표시되고, 언제든 새로 고치거나 삭제할 수 있어요. ',
    apiDocs: 'API 문서',
    tokensEmpty: '아직 토큰이 없어요 — 아래에서 이름을 정하고 첫 토큰을 만들어 보세요.',
    unnamedToken: '이름 없는 토큰',
    tokenFallback: '토큰',
    lastUsed: (stamp) => ` · 마지막 사용 ${stamp}`,
    neverUsed: ' · 사용 전',
    refresh: '새로 고침',
    refreshTitle: '기존 값은 즉시 무효화돼요',
    copyNow: '지금 복사하세요 — 다시 표시되지 않아요.',
    holdToDelete: '길게 눌러 삭제',
    tokenNamePlaceholder: '토큰 이름 (예: 자동화 스크립트)',
    newTokenName: '새 토큰 이름',
    create: '만들기',
    guestTokensHint:
      '게스트 모드에서는 API 토큰을 만들 수 없어요. 계정을 만들면 데이터가 저장되고 REST API도 쓸 수 있어요.',
    createAccount: '계정 만들기',
    signOut: '로그아웃',
    signOutHint: '이 기기에서 로그아웃해요.',
    backToPlanner: '시간표로 돌아가기',
    toast: {
      copied: '복사했어요',
      copyFailed: '복사하지 못했어요',
      nameSaved: '이름을 저장했어요',
      colorChanged: '색을 바꿨어요',
      saveFailed: '저장하지 못했어요',
      tokenCreated: '토큰을 만들었어요',
      tokenRotated: '토큰을 새로 만들었어요',
      tokenDeleted: '토큰을 삭제했어요',
      requestFailed: '요청을 처리하지 못했어요',
    },
  },

  board: {
    namePlaceholder: '시간표 이름',
    startDate: '시작일',
    endDate: '종료일',
    repeat: '반복',
    duplicate: '복제',
    clearAll: '모든 일정 비우기',
    delete: '시간표 삭제',
    soloBoard: '시간표가 하나뿐이에요',
    copySuffix: ' 사본',
    imported: '가져온 시간표',
    importedN: (i) => `가져온 시간표 ${i}`,
    repeatOpts: {
      none: '반복 안 함',
      weekly: '매주',
      week2: '2주마다',
      week3: '3주마다',
      week4: '4주마다',
    },
    toast: {
      addFailed: '시간표를 만들지 못했어요',
      settingsSaveFailed: '시간표 설정을 저장하지 못했어요',
      duplicateFailed: '시간표를 복제하지 못했어요',
      clearFailed: '일정을 비우지 못했어요',
      deleteFailed: '시간표를 삭제하지 못했어요',
      migrated: '이 기기의 시간표를 계정으로 옮겼어요',
      bootFailed: '초기 시간표를 만들지 못했어요',
    },
  },

  transfer: {
    exportJson: 'JSON 내보내기',
    importJson: 'JSON 가져오기',
    exported: 'JSON 파일로 내보냈어요',
    exportFailed: '내보낼 시간표를 불러오지 못했어요',
    importFailed: '파일을 가져오지 못했어요',
    readFailed: 'JSON 파일을 읽을 수 없어요',
    noBoards: '가져올 시간표가 없어요',
    importedOne: (name) => `'${name}' 시간표를 가져왔어요`,
    importedMany: (n) => `시간표 ${n}개를 가져왔어요`,
    hint: '빈 칸을 클릭하거나 드래그해 일정을 만들고, 블록을 끌어 옮기거나 위·아래 가장자리로 길이를 조절할 수 있어요. 모든 변경은 계정에 실시간 동기화됩니다.',
    hintCoarse:
      '빈 칸을 탭해 일정을 추가하고, 블록을 길게 눌러 옮길 수 있어요. 모든 변경은 계정에 실시간 동기화됩니다.',
  },

  grid: {
    gutterTime: '시간',
    newEvent: '새 일정',
  },

  editor: {
    newEvent: '새 일정',
    editEvent: '일정 편집',
    titlePlaceholder: '제목',
    color: '색상',
    day: '요일',
    time: '시간',
    startTime: '시작 시간',
    endTime: '종료 시간',
    memo: '메모',
    memoPlaceholder: '선택 사항',
    delete: '삭제',
    event: '일정',
    emptyHintFine: '빈 칸을 클릭하거나 드래그해 일정을 만들어요',
    emptyHintCoarse: '빈 칸을 탭해 일정을 추가해요',
  },

  print: {
    title: '인쇄',
    hint: '인쇄물에 들어갈 이름·날짜·시간을 정하세요. 비우면 빈 칸으로 나갑니다.',
    showName: '이름 표시',
    name: '이름',
    printName: '인쇄 이름',
    blank: '빈 칸',
    showDate: '날짜 표시',
    start: '시작',
    end: '종료',
    printStart: '인쇄 시작일',
    printEnd: '인쇄 종료일',
    showMemos: '메모 표시',
    showTime: '시간 표시',
    time: '시간',
    timePlaceholder: '빈 칸 · 예: 3교시',
    printTime: '인쇄 시간',
    doPrint: '인쇄하기',
    date: '날짜',
  },

  view: {
    heading: '보기',
    hideWeekend: '주말 숨기기',
    compact: '촘촘하게',
    showMemos: '메모 표시',
    colorFilter: '색상 필터 · 이름',
  },

  todos: {
    title: '오늘 할 일',
    empty: '오늘 일정이 없어요',
    emptyHint: '시간표에 오늘 일정을 추가하면 여기에서 하나씩 체크할 수 있어요.',
    untitled: '제목 없음',
    doneOf: (done, total) => ` · ${done}/${total} 완료`,
    subtitle: (m, d, dow) => `${m}월 ${d}일 ${dow}요일`,
    toast: { toggleFailed: '할 일을 변경하지 못했어요' },
  },

  share: {
    heading: '링크 공유',
    modeOpen: '공개 링크',
    modePassword: '비밀번호',
    roleViewer: '보기',
    roleEditor: '편집',
    mode: '모드',
    permission: '권한',
    password: '비밀번호',
    newPassword: '새 비밀번호',
    inviteMember: '멤버 초대',
    inviteHint: '등록된 계정만 초대할 수 있어요',
    role: '역할',
    invite: '초대',
    members: '멤버',
    member: '멤버',
    remove: '제거',
    shareModeAria: '공유 모드',
    sharePermAria: '공유 권한',
    inviteRoleAria: '초대 역할',
    statusOpen: '공개 링크 · ',
    statusPassword: '비밀번호 필요 · ',
    canEdit: '편집 가능',
    viewerOnly: '보기 전용',
    copyLinkTitle: '클릭해서 전체 링크 복사',
    copyLinkAria: (path) => `공유 링크 ${path}, 클릭해서 복사`,
    setPassword: '비밀번호 설정',
    changePassword: '비밀번호 변경',
    copyLink: '링크 복사',
    newLink: '새 링크',
    disable: '공유 끄기',
    createLink: '공유 링크 만들기',
    leave: '나가기',
    passwordResetTitle: '비밀번호 공유는 다시 설정하세요',
    sharedEditor: '공유 편집',
    sharedViewer: '공유 보기',
    notFound: '공유 링크를 찾을 수 없어요',
    shared: '공유된 주간 계획표',
    docTitle: (name) => `${name} · 주간 계획표`,
    toast: {
      enabled: '공유 링크를 켰어요',
      disabled: '공유 링크를 껐어요',
      updated: '공유 설정을 바꿨어요',
      newLink: '새 링크를 만들었어요',
      linkCopied: '링크를 복사했어요',
      memberRemoved: '멤버를 제거했어요',
      left: '시간표에서 나갔어요',
      invited: '초대했어요',
      roleUpdated: '역할을 업데이트했어요',
    },
    err: {
      ownerOnly: '소유자만 공유할 수 있어요',
      enableFailed: '공유를 켜지 못했어요',
      updateFailed: '공유 설정을 바꾸지 못했어요',
      noLink: '공유 링크가 없어요',
      enterPassword: '비밀번호를 입력하세요',
      passwordTooShort: (min) => `비밀번호는 ${min}자 이상이어야 해요`,
      firstEnable: '먼저 공유를 켜주세요',
      rotateFailed: '링크를 바꾸지 못했어요',
      passwordResetNeeded: '비밀번호 공유는 새 비밀번호로 다시 설정하세요',
      wrongPassword: '비밀번호가 맞지 않아요',
      roleChangeFailed: '멤버 역할을 바꾸지 못했어요',
      removeFailed: '멤버를 제거하지 못했어요',
      leaveFailed: '시간표에서 나가지 못했어요',
      inviteFailed: '초대에 실패했어요',
    },
  },

  event: {
    toast: {
      moveFailed: '일정을 옮기지 못했어요',
      deleteFailed: '일정을 삭제하지 못했어요',
      addFailed: '일정을 추가하지 못했어요',
      saveFailed: '일정을 저장하지 못했어요',
    },
  },

  viewPrefs: {
    saveFailed: '보기 설정을 저장하지 못했어요',
    colorNameSaveFailed: '색상 이름을 저장하지 못했어요',
  },

  theme: { saveFailed: '테마를 저장하지 못했어요' },

  banner: {
    viewerOnly: '보기 전용',
    viewerOnlyDetail: '이 시간표는 보기만 할 수 있어요',
  },

  update: {
    title: '앱 업데이트가 있어요',
    detail: '새로고침해서 최신 버전을 사용하세요',
    action: '새로고침',
  },

  upgrade: {
    codeTitle: '코드 입력',
    createAccount: '계정 만들기',
    intro:
      '이메일을 연결하면 지금까지 만든 시간표를 그대로 유지하면서 어느 기기에서나 로그인할 수 있어요.',
    saveAccount: '계정 저장하기',
  },

  landing: {
    features: [
      {
        title: '실시간 협업',
        body: '같은 시간표를 여럿이 함께 편집해요. 커서와 접속 중인 사람이 바로 보이고, 모든 변경이 즉시 동기화됩니다.',
      },
      {
        title: '색상 라벨',
        body: '일정마다 색을 지정하고 이름을 붙여 분류하세요. 한 주의 균형이 색으로 한눈에 들어와요.',
      },
      {
        title: '링크 공유',
        body: '보기 전용 또는 편집 링크를 만들어 공유하고, 비밀번호로 보호할 수 있어요.',
      },
      {
        title: '인쇄 · PDF',
        body: '화면 그대로 깔끔하게 인쇄되도록 다듬었어요. 벽에 붙일 한 장짜리 시간표로 바로 출력하세요.',
      },
      {
        title: '오프라인 지원',
        body: '연결이 끊겨도 계속 쓸 수 있어요. 다시 온라인이 되면 변경 사항이 알아서 동기화됩니다.',
      },
      {
        title: '유연한 기간',
        body: '특정 주의 날짜부터 반복되는 주간표까지. 여러 개의 보드로 학기, 프로젝트, 일상을 나눠 관리해요.',
      },
    ],
    steps: [
      { title: '게스트로 시작', body: '이메일도, 비밀번호도 없이 버튼 한 번으로 바로 들어와요.' },
      { title: '자유롭게 사용', body: '시간표를 만들고, 편집하고, 공유해 보세요. 전부 실제로 저장돼요.' },
      { title: '이메일로 저장', body: '마음에 들면 이메일을 연결하세요. 만든 데이터는 그대로 이어집니다.' },
    ],
    previewLabel: '주간 시간표 미리보기',
    gutterTime: '시간',
    startGuest: '게스트로 시작하기',
    starting: '시작하는 중…',
    startFailed: '시작하지 못했어요. 다시 시도해 주세요',
    openPlanner: '시간표 열기',
    toggleDark: '다크 모드로 전환',
    toggleLight: '라이트 모드로 전환',
    login: '로그인',
    heroTagline: '실시간으로 함께 쓰는 주간 시간표',
    heroTitle1: '한 주를,',
    heroTitleAccent: '한 화면에.',
    heroLede:
      '드래그 한 번으로 일정을 만들고, 색으로 분류하고, 링크로 나눠요. 팀과 함께 편집한 내용은 그 자리에서 동기화됩니다.',
    loginEmail: '이메일로 로그인',
    ctaSignedIn: '이미 로그인되어 있어요. 시간표로 바로 이동할 수 있습니다.',
    ctaSignedOut: '이메일로 로그인하거나 · 게스트로 바로 시작해도 괜찮아요.',
    featuresKicker: '기능',
    featuresTitle: '한 주를 계획하는 데 필요한 전부',
    featuresSub:
      '복잡한 설정 없이, 딱 필요한 것만. 매일 여는 도구인 만큼 빠르고 조용하게 동작하도록 만들었어요.',
    startNowKicker: '바로 시작',
    backToPlannerTitle: '시간표로 돌아가기',
    signedInSub: '로그인된 상태예요. 만든 보드와 일정은 그대로 기다리고 있습니다.',
    guestKicker: '게스트 모드',
    guestTitle: '가입 없이, 지금 바로 써보세요',
    guestSub:
      '게스트로 시작하면 계정을 만드는 순간을 미룰 수 있어요. 먼저 충분히 써보고, 마음에 들면 그때 이메일을 연결하면 됩니다. 게스트로 만든 시간표는 계정으로 그대로 이어져요.',
    brand: '주간 계획표',
    footerTagline: '실시간으로 함께 쓰는 주간 시간표',
  },

  account_menu: {
    guestMode: '게스트 모드 · 아직 저장되지 않았어요',
    createAccount: '계정 만들기',
    accountSettings: '계정 설정',
    signOut: '로그아웃',
  },
});
