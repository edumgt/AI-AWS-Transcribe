/* Transcribe Lab UI (Vanilla JS)
 * Endpoints:
 *  GET    /health
 *  POST   /jobs
 *  GET    /jobs
 *  GET    /jobs/:jobName
 *  POST   /jobs/:jobName/stop
 *  DELETE /jobs/:jobName
 *  GET    /result?url=:resultUrl
 */

const $ = (sel) => document.querySelector(sel);

const els = {
  baseUrl: $("#baseUrl"),
  btnSaveBaseUrl: $("#btnSaveBaseUrl"),
  btnHealth: $("#btnHealth"),
  healthStatus: $("#healthStatus"),

  mediaUri: $("#mediaUri"),
  mediaFormat: $("#mediaFormat"),
  languageCode: $("#languageCode"),
  identifyLanguage: $("#identifyLanguage"),
  enableSpeakerLabels: $("#enableSpeakerLabels"),
  maxSpeakerLabels: $("#maxSpeakerLabels"),
  createJobPreview: $("#createJobPreview"),
  btnCreateJob: $("#btnCreateJob"),

  btnListJobs: $("#btnListJobs"),
  btnRefresh: $("#btnRefresh"),
  jobsList: $("#jobsList"),
  jobsCount: $("#jobsCount"),

  jobName: $("#jobName"),
  btnGetJob: $("#btnGetJob"),
  btnStopJob: $("#btnStopJob"),
  btnDeleteJob: $("#btnDeleteJob"),

  resultUrl: $("#resultUrl"),
  btnFetchResult: $("#btnFetchResult"),

  output: $("#output"),
  btnCopy: $("#btnCopy"),
  btnClear: $("#btnClear"),
  toast: $("#toast"),
};

function normalizeBaseUrl(v) {
  const s = String(v || "").trim();
  return s.replace(/\/+$/, ""); // 끝 슬래시 제거
}

function getBaseUrl() {
  const v = normalizeBaseUrl(els.baseUrl.value);
  if (!v) throw new Error("BASE_URL을 입력하세요. (예: http://localhost:8080)");
  return v;
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.add("hidden"), 1400);
}

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function setOutput(title, data) {
  const t = title ? `# ${title}\n` : "";
  els.output.textContent = t + pretty(data);
}

function setError(title, err) {
  const payload = {
    error: true,
    title,
    message: err?.message || String(err),
    detail: err?.detail,
    stack: err?.stack,
  };
  els.output.textContent = pretty(payload);
}

async function apiFetch(path, opts = {}) {
  const base = getBaseUrl();
  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  let body;
  if (contentType.includes("application/json")) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => "");
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.detail = body;
    throw err;
  }
  return body;
}

function buildCreateJobPayload() {
  return {
    mediaUri: String(els.mediaUri.value || "").trim(),
    mediaFormat: String(els.mediaFormat.value || "").trim() || "mp3",
    languageCode: String(els.languageCode.value || "").trim() || "ko-KR",
    identifyLanguage: !!els.identifyLanguage.checked,
    enableSpeakerLabels: !!els.enableSpeakerLabels.checked,
    maxSpeakerLabels: Number(els.maxSpeakerLabels.value || 2) || 2,
  };
}

function refreshCreateJobPreview() {
  const payload = buildCreateJobPayload();
  els.createJobPreview.textContent = pretty(payload);
}

// ---- Jobs UI helpers ----
function guessJobNameFromListItem(job) {
  // 서버 응답 형태가 확정이 아니라서 최대한 관대하게 처리
  return (
    job?.TranscriptionJobName ||
    job?.jobName ||
    job?.name ||
    job?.id ||
    ""
  );
}

function guessJobStatus(job) {
  return (
    job?.TranscriptionJobStatus ||
    job?.status ||
    job?.State ||
    "-"
  );
}

function guessResultUrl(job) {
  // AWS Transcribe 표준: TranscriptFileUri
  return (
    job?.Transcript?.TranscriptFileUri ||
    job?.transcriptFileUri ||
    job?.resultUrl ||
    ""
  );
}

function renderJobsList(list) {
  els.jobsList.innerHTML = "";

  // list가 배열이 아닐 수도 있어서 방어적으로
  const arr = Array.isArray(list)
    ? list
    : (list?.jobs || list?.Items || list?.TranscriptionJobSummaries || []);

  els.jobsCount.textContent = String(arr.length);

  if (!arr.length) {
    els.jobsList.innerHTML = `<div class="text-sm text-slate-400">표시할 Job이 없습니다.</div>`;
    return;
  }

  for (const job of arr) {
    const name = guessJobNameFromListItem(job);
    const status = guessJobStatus(job);
    const resultUrl = guessResultUrl(job);

    const row = document.createElement("div");
    row.className = "rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex flex-col gap-2";

    row.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <div class="text-sm font-semibold truncate">${escapeHtml(name || "(unknown)")}</div>
          <div class="text-xs text-slate-400">status: ${escapeHtml(String(status))}</div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button data-act="select" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">선택</button>
          <button data-act="get" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm">Get</button>
        </div>
      </div>
      ${
        resultUrl
          ? `<div class="text-xs text-slate-300 break-all">
               result: <span class="text-slate-400">${escapeHtml(resultUrl)}</span>
             </div>`
          : ""
      }
    `;

    row.querySelector('[data-act="select"]').addEventListener("click", () => {
      els.jobName.value = name || "";
      if (resultUrl) els.resultUrl.value = resultUrl;
      showToast("JOB_NAME 선택됨");
    });

    row.querySelector('[data-act="get"]').addEventListener("click", async () => {
      try {
        if (!name) throw new Error("JobName을 추정할 수 없습니다.");
        els.jobName.value = name;
        const data = await apiFetch(`/jobs/${encodeURIComponent(name)}`);
        setOutput(`Get Job: ${name}`, data);

        // 응답에서 결과 URL까지 같이 있으면 자동 채우기
        const ru = guessResultUrl(data?.TranscriptionJob || data);
        if (ru) els.resultUrl.value = ru;
      } catch (e) {
        setError("Get Job 실패", e);
      }
    });

    els.jobsList.appendChild(row);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---- Actions ----
async function doHealth() {
  try {
    els.healthStatus.textContent = "checking...";
    const data = await apiFetch("/health");
    els.healthStatus.textContent = "OK";
    setOutput("Health", data);
  } catch (e) {
    els.healthStatus.textContent = "FAILED";
    setError("Health 실패", e);
  }
}

async function doCreateJob() {
  try {
    const payload = buildCreateJobPayload();

    if (!payload.mediaUri) throw new Error("mediaUri는 필수입니다.");
    if (!payload.mediaFormat) throw new Error("mediaFormat은 필수입니다.");

    const data = await apiFetch("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setOutput("Create Job", data);

    // 생성된 jobName을 응답에서 추정해 자동 입력
    const jobName =
      data?.jobName ||
      data?.TranscriptionJob?.TranscriptionJobName ||
      data?.TranscriptionJobName ||
      "";

    if (jobName) {
      els.jobName.value = jobName;
      showToast(`JOB_NAME 자동 입력: ${jobName}`);
    }

    // 리스트 갱신
    await doListJobs();
  } catch (e) {
    setError("Create Job 실패", e);
  }
}

async function doListJobs() {
  try {
    const data = await apiFetch("/jobs");
    setOutput("List Jobs", data);
    renderJobsList(data);
  } catch (e) {
    setError("List Jobs 실패", e);
  }
}

async function doGetJob() {
  try {
    const name = String(els.jobName.value || "").trim();
    if (!name) throw new Error("JOB_NAME을 입력하세요.");
    const data = await apiFetch(`/jobs/${encodeURIComponent(name)}`);
    setOutput(`Get Job: ${name}`, data);

    const ru = guessResultUrl(data?.TranscriptionJob || data);
    if (ru) els.resultUrl.value = ru;
  } catch (e) {
    setError("Get Job 실패", e);
  }
}

async function doStopJob() {
  try {
    const name = String(els.jobName.value || "").trim();
    if (!name) throw new Error("JOB_NAME을 입력하세요.");
    const data = await apiFetch(`/jobs/${encodeURIComponent(name)}/stop`, {
      method: "POST",
    });
    setOutput(`Stop Job: ${name}`, data);
    await doListJobs();
  } catch (e) {
    setError("Stop Job 실패", e);
  }
}

async function doDeleteJob() {
  try {
    const name = String(els.jobName.value || "").trim();
    if (!name) throw new Error("JOB_NAME을 입력하세요.");
    const data = await apiFetch(`/jobs/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    setOutput(`Delete Job: ${name}`, data);
    await doListJobs();
  } catch (e) {
    setError("Delete Job 실패", e);
  }
}

async function doFetchResult() {
  try {
    const ru = String(els.resultUrl.value || "").trim();
    if (!ru) throw new Error("RESULT_URL을 입력하세요.");
    const q = encodeURIComponent(ru);
    const data = await apiFetch(`/result?url=${q}`, { method: "GET" });
    setOutput("Fetch Result JSON (proxy)", data);
  } catch (e) {
    setError("Fetch Result 실패", e);
  }
}

// ---- Init ----
function loadBaseUrl() {
  const saved = localStorage.getItem("TRANSCRIBE_LAB_BASE_URL");
  if (saved) els.baseUrl.value = saved;
}

function saveBaseUrl() {
  const v = normalizeBaseUrl(els.baseUrl.value);
  if (!v) {
    alert("BASE_URL을 입력하세요. 예: http://localhost:8080");
    return;
  }
  localStorage.setItem("TRANSCRIBE_LAB_BASE_URL", v);
  showToast("BASE_URL 저장됨");
}

function wireEvents() {
  // base url
  els.btnSaveBaseUrl.addEventListener("click", saveBaseUrl);
  els.btnHealth.addEventListener("click", doHealth);

  // create job preview live
  [
    els.mediaUri,
    els.mediaFormat,
    els.languageCode,
    els.identifyLanguage,
    els.enableSpeakerLabels,
    els.maxSpeakerLabels,
  ].forEach((el) => el.addEventListener("input", refreshCreateJobPreview));
  [
    els.identifyLanguage,
    els.enableSpeakerLabels,
  ].forEach((el) => el.addEventListener("change", refreshCreateJobPreview));

  els.btnCreateJob.addEventListener("click", doCreateJob);

  // jobs
  els.btnListJobs.addEventListener("click", doListJobs);
  els.btnRefresh.addEventListener("click", async () => {
    await doHealth();
    await doListJobs();
  });

  els.btnGetJob.addEventListener("click", doGetJob);
  els.btnStopJob.addEventListener("click", doStopJob);
  els.btnDeleteJob.addEventListener("click", doDeleteJob);

  els.btnFetchResult.addEventListener("click", doFetchResult);

  // output
  els.btnCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(els.output.textContent || "");
      showToast("Response 복사됨");
    } catch {
      alert("복사 실패(브라우저 권한/HTTPS 확인)");
    }
  });
  els.btnClear.addEventListener("click", () => setOutput("", ""));
}

(function init() {
  loadBaseUrl();
  refreshCreateJobPreview();
  wireEvents();
})();