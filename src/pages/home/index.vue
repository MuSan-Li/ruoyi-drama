<script setup lang="ts">
import type { ShortDramaProject } from '@/api/shortDrama/types';
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from '@/utils/message';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { artStyleLabel } from '@/constants/drama';
import { useDramaSkillCatalog } from '@/composables/useDramaSkillCatalog';
import { projectAestheticLabel } from '@/utils/dramaSkillBindings';
import { listShortDramaProjects } from '@/api/shortDrama';
import { useAppStore } from '@/stores';

const router = useRouter();
const { t } = useI18n();
const appStore = useAppStore();
const loading = ref(true);
const projects = ref<ShortDramaProject[]>([]);
const idea = ref('');
const { catalog: skillCatalog } = useDramaSkillCatalog();

const activeCount = computed(() => projects.value.filter(item => item.status !== 'archived').length);
const recentProjects = computed(() => projects.value.slice(0, 6));
const latestProject = computed(() => projects.value[0]);

async function refreshProjects() {
  loading.value = true;
  try {
    projects.value = await listShortDramaProjects();
  }
  catch {
    ElMessage.error(t('home.messages.loadFailed'));
  }
  finally {
    loading.value = false;
  }
}

function startCreation() {
  if (!idea.value.trim()) {
    ElMessage.warning(t('home.messages.ideaRequired'));
    return;
  }
  router.push({
    name: 'shortDrama',
    query: {
      idea: idea.value.trim(),
    },
  });
}

function openProject(projectId?: string) {
  if (!projectId) return;
  router.push({ name: 'shortDrama', query: { projectId: String(projectId) } });
}

function formatTime(value?: string) {
  if (!value) return t('common.time.justNow');
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;
  const diff = Date.now() - time;
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return t('common.time.justNow');
  if (minutes < 60) return t('common.time.minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('common.time.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  return days < 30 ? t('common.time.daysAgo', { n: days }) : new Date(value).toLocaleDateString(appStore.locale);
}

onMounted(refreshProjects);

</script>

<template>
  <div class="home-page">
    <div class="ambient ambient-one" />
    <div class="ambient ambient-two" />

    <main class="home-content">
      <section class="hero-grid">
        <div class="hero-copy">
          <div class="eyebrow"><span /> AI SHORT DRAMA STUDIO</div>
          <h1>{{ t('home.hero.titleLead') }}<br><em>{{ t('home.hero.titleTail') }}</em></h1>
          <p>{{ t('home.hero.subtitle') }}</p>

          <div class="hero-metrics">
            <div><strong>{{ projects.length }}</strong><span>{{ t('home.hero.metricAll') }}</span></div>
            <i />
            <div><strong>{{ activeCount }}</strong><span>{{ t('home.hero.metricActive') }}</span></div>
            <i />
            <div><strong>4</strong><span>{{ t('home.hero.metricStages') }}</span></div>
          </div>
        </div>

        <aside class="pipeline-card">
          <div class="pipeline-head">
            <span>PRODUCTION FLOW</span>
            <small><b /> ONLINE</small>
          </div>
          <div class="pipeline-preview">
            <div class="shot shot-main">
              <span>SCENE 01</span>
              <el-icon><VideoPlay /></el-icon>
              <small>{{ t('home.pipeline.sceneCopy') }}</small>
            </div>
            <div class="shot shot-side one"><el-icon><UserFilled /></el-icon><small>{{ t('home.pipeline.charLabel') }}</small></div>
            <div class="shot shot-side two"><el-icon><PictureFilled /></el-icon><small>{{ t('home.pipeline.locLabel') }}</small></div>
          </div>
          <div class="pipeline-steps">
            <span class="done"><b>01</b>{{ t('home.pipeline.steps.idea') }}</span>
            <i />
            <span><b>02</b>{{ t('home.pipeline.steps.script') }}</span>
            <i />
            <span><b>03</b>{{ t('home.pipeline.steps.assets') }}</span>
            <i />
            <span><b>04</b>{{ t('home.pipeline.steps.storyboard') }}</span>
          </div>
        </aside>
      </section>

      <section class="composer-shell">
        <div class="composer-label">
          <span><el-icon><MagicStick /></el-icon></span>
          <div><strong>{{ t('home.composer.title') }}</strong></div>
        </div>
        <el-input
          v-model="idea"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 8 }"
          resize="none"
          :placeholder="t('home.composer.placeholder')"
          @keydown.ctrl.enter="startCreation"
        />
        <div class="composer-footer">
          <div class="quick-options">
            <span class="shortcut">{{ t('home.composer.shortcut') }}</span>
          </div>
          <el-button class="create-button" type="primary" @click="startCreation">
            {{ t('home.composer.create') }} <el-icon><Right /></el-icon>
          </el-button>
        </div>
      </section>

      <section class="section-block">
        <div class="section-heading">
          <div><span>RECENT PROJECTS</span><h2>{{ t('home.section.recentTitle') }}</h2></div>
          <button type="button" @click="router.push({ name: 'shortDrama' })">{{ t('home.section.enterWorkbench') }} <el-icon><ArrowRight /></el-icon></button>
        </div>

        <div v-if="loading" class="project-grid">
          <div v-for="index in 3" :key="index" class="project-card skeleton" />
        </div>
        <div v-else-if="recentProjects.length" class="project-grid">
          <button
            v-for="(project, index) in recentProjects"
            :key="project.id"
            type="button"
            class="project-card"
            @click="openProject(project.id)"
          >
            <div class="project-visual" :class="`tone-${index % 4}`">
              <span class="project-status"><b />{{ project.status === 'archived' ? t('home.project.statusArchived') : t('home.project.statusActive') }}</span>
              <div class="visual-number">{{ String(index + 1).padStart(2, '0') }}</div>
              <el-icon><Film /></el-icon>
              <small>{{ projectAestheticLabel(project, skillCatalog, artStyleLabel(project.artStyle, t)) }}</small>
            </div>
            <div class="project-info">
              <strong>{{ project.projectName }}</strong>
              <p>{{ project.description || t('home.project.emptyDesc') }}</p>
              <span><el-icon><Clock /></el-icon>{{ formatTime(project.updateTime || project.createTime) }}</span>
            </div>
          </button>
        </div>
        <div v-else class="empty-projects">
          <span><el-icon><Film /></el-icon></span>
          <div><strong>{{ t('home.empty.title') }}</strong><p>{{ t('home.empty.desc') }}</p></div>
          <el-button plain @click="idea = t('home.exampleIdea')">{{ t('home.empty.useExample') }}</el-button>
        </div>
      </section>

      <section class="guide-grid">
        <div class="guide-copy">
          <span>CREATIVE PIPELINE</span>
          <h2>{{ t('home.guide.titleLead') }}<br>{{ t('home.guide.titleTail') }}</h2>
          <p>{{ t('home.guide.desc') }}</p>
          <button v-if="latestProject" type="button" @click="openProject(latestProject.id)">{{ t('home.guide.continueLast') }} <el-icon><ArrowRight /></el-icon></button>
        </div>
        <div class="guide-steps">
          <article><b>01</b><span><el-icon><EditPen /></el-icon></span><div><strong>{{ t('home.guide.steps.s1Title') }}</strong><p>{{ t('home.guide.steps.s1Desc') }}</p></div></article>
          <article><b>02</b><span><el-icon><Avatar /></el-icon></span><div><strong>{{ t('home.guide.steps.s2Title') }}</strong><p>{{ t('home.guide.steps.s2Desc') }}</p></div></article>
          <article><b>03</b><span><el-icon><Operation /></el-icon></span><div><strong>{{ t('home.guide.steps.s3Title') }}</strong><p>{{ t('home.guide.steps.s3Desc') }}</p></div></article>
          <article><b>04</b><span><el-icon><VideoCamera /></el-icon></span><div><strong>{{ t('home.guide.steps.s4Title') }}</strong><p>{{ t('home.guide.steps.s4Desc') }}</p></div></article>
        </div>
      </section>
    </main>


  </div>
</template>

<style scoped lang="scss">
.home-page {
  position: relative;
  height: 100%;
  overflow: auto;
  color: var(--drama-text);
  background:
    radial-gradient(circle at 8% 8%, rgb(37 99 235 / 8%), transparent 28%),
    radial-gradient(circle at 92% 16%, rgb(82 139 240 / 10%), transparent 25%),
    var(--drama-canvas);
}

.ambient {
  position: fixed;
  z-index: 0;
  width: 460px;
  height: 460px;
  pointer-events: none;
  filter: blur(10px);
  border-radius: 50%;
}

.ambient-one { top: 60px; left: -240px; background: radial-gradient(circle, rgb(37 99 235 / 16%), transparent 68%); }
.ambient-two { top: 140px; right: -250px; background: radial-gradient(circle, rgb(82 139 240 / 17%), transparent 68%); }

.home-content {
  position: relative;
  z-index: 1;
  width: min(1380px, calc(100% - 56px));
  padding: 72px 0 90px;
  margin: 0 auto;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(390px, 0.85fr);
  gap: clamp(50px, 8vw, 120px);
  align-items: center;
  min-height: 360px;
}

.eyebrow,
.section-heading span,
.guide-copy > span {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: .16em;
  color: #64748b;
}

.eyebrow span {
  width: 28px;
  height: 1px;
  background: linear-gradient(90deg, var(--drama-primary), var(--drama-primary));
}

.hero-copy h1 {
  margin: 24px 0 22px;
  font-size: clamp(48px, 5vw, 76px);
  font-weight: 660;
  line-height: 1.08;
  letter-spacing: -.055em;
}

.hero-copy h1 em {
  font-style: normal;
  color: transparent;
  background:var(--drama-primary);
  background-clip: text;
}

.hero-copy > p {
  max-width: 660px;
  margin: 0;
  font-size: 16px;
  line-height: 1.9;
  color: #64748b;
}

.hero-metrics {
  display: flex;
  gap: 22px;
  align-items: center;
  margin-top: 32px;
}

.hero-metrics div { display: grid; gap: 4px; }
.hero-metrics strong { font-size: 22px; font-weight: 720; }
.hero-metrics span { font-size: 11px; color: #8a94a5; }
.hero-metrics i { width: 1px; height: 28px; background: #dde2e9; }

.pipeline-card {
  padding: 16px;
  background: rgb(255 255 255 / 78%);
  border: 1px solid rgb(255 255 255 / 90%);
  border-radius: 24px;
  box-shadow: 0 24px 70px rgb(37 99 235 / 13%);
  backdrop-filter: blur(18px);
}

.pipeline-head { display: flex; align-items: center; justify-content: space-between; padding: 3px 4px 13px; font: 700 10px/1 monospace; letter-spacing: .12em; color: #707b8e; }
.pipeline-head small { display: flex; gap: 6px; align-items: center; color: #3d8d6d; }
.pipeline-head b, .project-status b { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 4px rgb(16 185 129 / 13%); }

.pipeline-preview {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  height: 230px;
}

.shot { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; color: #fff; border-radius: 14px; }
.shot::after { position: absolute; inset: 0; content: ''; background: linear-gradient(145deg, transparent, rgb(0 0 0 / 30%)); }
.shot > * { position: relative; z-index: 1; }
.shot-main { grid-row: 1 / 3; background: radial-gradient(circle at 62% 30%, #a9ceff, var(--drama-primary) 52%, #214582 100%); }
.shot-main > span { position: absolute; top: 13px; left: 13px; font: 700 9px/1 monospace; letter-spacing: .12em; opacity: .7; }
.shot-main .el-icon { font-size: 40px; opacity: .92; }
.shot-main small { margin-top: 12px; font-size: 11px; opacity: .7; }
.shot-side { gap: 8px; font-size: 24px; }
.shot-side small { font-size: 10px; opacity: .72; }
.shot-side.one { background: linear-gradient(145deg, #a8c5f7, #5b7fae); }
.shot-side.two { background: linear-gradient(145deg, #b5dcfc, var(--drama-primary-hover)); }

.pipeline-steps { display: flex; gap: 9px; align-items: center; padding: 16px 5px 3px; }
.pipeline-steps span { display: flex; gap: 4px; align-items: center; white-space: nowrap; font-size: 10px; color: #8b94a3; }
.pipeline-steps span.done { color: var(--drama-primary); }
.pipeline-steps b { font-family: monospace; }
.pipeline-steps i { flex: 1; height: 1px; background: #e0e4eb; }

.composer-shell {
  position: relative;
  padding: 24px;
  margin: 54px 0 76px;
  background: rgb(255 255 255 / 88%);
  border: 1px solid #e7eaf0;
  border-radius: 22px;
  box-shadow: 0 22px 65px rgb(37 99 235 / 10%);
}

.composer-shell::before { position: absolute; inset: -1px; z-index: -1; content: ''; background: linear-gradient(120deg, rgb(37 99 235 / 42%), transparent 35%, transparent 65%, rgb(82 139 240 / 42%)); border-radius: inherit; filter: blur(10px); opacity: .45; }
.composer-label { display: flex; gap: 12px; align-items: center; margin-bottom: 18px; }
.composer-label > span { display: grid; width: 38px; height: 38px; color: #fff; background: linear-gradient(145deg, var(--drama-primary), var(--drama-primary)); border-radius: 11px; box-shadow: 0 8px 18px rgb(37 99 235 / 22%); place-items: center; }
.composer-label div { display: grid; gap: 4px; }
.composer-label strong { font-size: 15px; }
.composer-label small { font-size: 12px; color: #8a93a2; }
.composer-shell :deep(.el-textarea__inner) { padding: 17px 18px; font-size: 15px; line-height: 1.8; background: #f8f9fb; border-radius: 14px; box-shadow: inset 0 0 0 1px #e6e9ef; }
.composer-shell :deep(.el-textarea__inner:focus) { background: #fff; box-shadow: inset 0 0 0 1px #60a5fa, 0 0 0 4px rgb(37 99 235 / 9%); }
.composer-footer { display: flex; gap: 16px; align-items: center; justify-content: space-between; margin-top: 14px; }
.quick-options { display: flex; gap: 9px; align-items: center; }
.quick-options :deep(.el-select) { width: 138px; }
.shortcut { margin-left: 6px; font-size: 11px; color: #a1a8b4; }
.create-button { height: 42px; padding: 0 22px; background:var(--drama-primary); border: 0; border-radius: 11px; box-shadow: 0 10px 24px rgb(37 99 235 / 25%); }

.section-block { margin-bottom: 88px; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
.section-heading div { display: grid; gap: 8px; }
.section-heading h2, .guide-copy h2 { margin: 0; font-size: 28px; font-weight: 680; letter-spacing: -.025em; }
.section-heading button, .guide-copy button { display: flex; gap: 6px; align-items: center; padding: 0; color: #566986; cursor: pointer; background: none; border: 0; }

.project-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.project-card { overflow: hidden; padding: 0; text-align: left; cursor: pointer; background: #fff; border: 1px solid #e7eaf0; border-radius: 18px; box-shadow: 0 8px 28px rgb(39 51 78 / 5%); transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.project-card:hover { border-color: #93c5fd; box-shadow: 0 18px 40px rgb(37 99 235 / 14%); transform: translateY(-4px); }
.project-visual { position: relative; display: grid; height: 150px; color: rgb(255 255 255 / 82%); place-items: center; }
.tone-0 { background: radial-gradient(circle at 72% 24%, #abcfff, var(--drama-primary) 72%); }
.tone-1 { background: radial-gradient(circle at 70% 20%, #c7d8f6, #5b7fae 72%); }
.tone-2 { background: radial-gradient(circle at 26% 30%, #b5dcfc, #4778be 72%); }
.tone-3 { background: radial-gradient(circle at 68% 28%, #c9d5eb, #647fae 72%); }
.project-visual > .el-icon { font-size: 34px; }
.project-visual > small { position: absolute; right: 14px; bottom: 12px; font-size: 10px; letter-spacing: .08em; }
.visual-number { position: absolute; right: 13px; bottom: -15px; font: 800 76px/1 monospace; color: rgb(255 255 255 / 7%); }
.project-status { position: absolute; top: 12px; left: 13px; display: flex; gap: 7px; align-items: center; padding: 5px 9px; font-size: 9px; background: rgb(18 28 44 / 34%); border: 1px solid rgb(255 255 255 / 12%); border-radius: 999px; backdrop-filter: blur(8px); }
.project-info { display: grid; gap: 8px; padding: 17px 18px 18px; }
.project-info strong { overflow: hidden; font-size: 15px; text-overflow: ellipsis; white-space: nowrap; }
.project-info p { min-height: 37px; margin: 0; overflow: hidden; font-size: 12px; line-height: 1.55; color: #818a99; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.project-info > span { display: flex; gap: 5px; align-items: center; font-size: 10px; color: #a0a7b2; }
.skeleton { height: 320px; background: linear-gradient(100deg, #eef0f4 20%, #f8f9fb 40%, #eef0f4 60%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }

.empty-projects { display: flex; gap: 18px; align-items: center; padding: 30px; background: #fff; border: 1px dashed #cfd6e1; border-radius: 18px; }
.empty-projects > span { display: grid; width: 50px; height: 50px; font-size: 22px; color: #62759a; background: #eef2f8; border-radius: 14px; place-items: center; }
.empty-projects div { flex: 1; display: grid; gap: 5px; }
.empty-projects p { margin: 0; font-size: 12px; color: #8b94a3; }

.guide-grid { display: grid; grid-template-columns: .8fr 1.2fr; gap: 70px; align-items: start; padding: 48px; color: #0f172a; background: linear-gradient(135deg, var(--drama-primary-soft), var(--drama-surface-muted) 68%, #f0f9ff); border: 1px solid var(--drama-border); border-radius: 26px; box-shadow: 0 28px 70px rgb(37 99 235 / 11%); }
.guide-copy { position: sticky; top: 20px; }
.guide-copy > span { color: var(--drama-primary); }
.guide-copy h2 { margin: 18px 0; font-size: 31px; line-height: 1.35; }
.guide-copy p { margin: 0 0 24px; font-size: 13px; line-height: 1.8; color: #64748b; }
.guide-copy button { color: var(--drama-primary); }
.guide-steps { display: grid; gap: 10px; }
.guide-steps article { display: grid; grid-template-columns: 34px 42px 1fr; gap: 13px; align-items: center; padding: 15px; background: rgb(255 255 255 / 76%); border: 1px solid var(--drama-border); border-radius: 14px; box-shadow: 0 8px 24px rgb(37 99 235 / 6%); }
.guide-steps article > b { font: 700 10px/1 monospace; color: var(--drama-primary); }
.guide-steps article > span { display: grid; width: 38px; height: 38px; color: var(--drama-primary); background: var(--drama-border); border-radius: 10px; place-items: center; }
.guide-steps article div { display: grid; gap: 4px; }
.guide-steps strong { font-size: 13px; }
.guide-steps p { margin: 0; font-size: 11px; color: #64748b; }

@keyframes shimmer { to { background-position: -200% 0; } }

@media (width <= 1050px) {
  .hero-grid { grid-template-columns: 1fr; }
  .pipeline-card { width: min(100%, 600px); transform: none; }
  .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .guide-grid { grid-template-columns: 1fr; gap: 34px; }
  .guide-copy { position: static; }
}

@media (width <= 680px) {
  .home-content { width: min(100% - 28px, 1380px); padding-top: 38px; }
  .hero-copy h1 { font-size: 42px; }
  .pipeline-preview { height: 190px; }
  .composer-shell { padding: 17px; margin: 38px 0 56px; }
  .composer-footer, .quick-options, .section-heading { align-items: stretch; flex-direction: column; }
  .quick-options :deep(.el-select), .create-button { width: 100%; }
  .shortcut { display: none; }
  .project-grid { grid-template-columns: 1fr; }
  .guide-grid { padding: 26px 20px; }
  .empty-projects { align-items: flex-start; flex-wrap: wrap; }
}
</style>
