const labels = { automation: '主自动化', video: '视频', audio: '音频', document: '文档', continuation: '安全续接', navigation: '允许小节/章节导航', background: '后台恢复', delays: '随机延迟', restEnabled: '周期休息' };
const names = { video: '视频', audio: '音频', document: '文档', live: '直播（手动）', assessment: '测验（不作答）', unknown: '未知' };
export function mountPanel(document, app) {
  const host = document.createElement('aside'); host.id = 'xxt-control';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = '<style>:host{position:fixed;right:8px;bottom:8px;z-index:2147483000;font:12px sans-serif;color:#222}details{background:#fff;border:1px solid #777;border-radius:6px;padding:6px;max-width:280px;box-shadow:0 1px 6px #999}section{max-height:55vh;overflow:auto;width:260px}label{display:inline-block;margin:3px}input[type=number]{width:85px}button{margin:3px}pre{white-space:pre-wrap;max-height:120px;overflow:auto}textarea{width:95%;height:100px}</style><details><summary>XXT 开发测试版</summary><section><pre id="status"></pre><div id="actions"></div><div id="settings"></div><pre id="error"></pre><textarea hidden aria-label="脱敏诊断"></textarea></section></details>';
  const fields = new Map(), error = root.querySelector('#error');
  function act(fn) { try { fn(); error.textContent = ''; } catch { error.textContent = '操作失败：请检查设置或本地存储；自动化保持安全暂停。'; } render(); }
  for (const [text, fn] of [['开始',app.start],['停止',app.stop],['恢复',app.resume],['重扫当前小节',app.rescan],['恢复默认',app.restore],['查看脱敏诊断',() => { const box = root.querySelector('textarea'); box.hidden = false; box.value = app.exportDiagnostics(); }],['清空诊断',app.clearDiagnostics]]) {
    const button = document.createElement('button'); button.textContent = text; button.addEventListener('click', () => act(fn)); root.querySelector('#actions').append(button);
  }
  for (const [key, text] of Object.entries({ ...labels, minMs: '延迟下限 ms', maxMs: '延迟上限 ms', restCount: '休息任务数（先配置）', restMs: '休息时长 ms（先配置）' })) {
    const label = document.createElement('label'), input = document.createElement('input'); label.textContent = text;
    input.type = key in labels ? 'checkbox' : 'number'; input.dataset.setting = key;
    input.addEventListener('change', () => act(() => app.update({ [key]: input.type === 'checkbox' ? input.checked : input.value === '' ? null : Number(input.value) })));
    label.append(input); root.querySelector('#settings').append(label); fields.set(key, input);
  }
  function render() {
    const view = app.view(), task = view.task;
    for (const [key, input] of fields) if (input.type === 'checkbox') input.checked = view.settings[key]; else if (root.activeElement !== input) input.value = view.settings[key] ?? '';
    const stateNames = { READY: '等待启动', STARTING: '启动中', RUNNING: task?.kind === 'live' ? '人工等待' : '运行中', WAITING_PLATFORM: '等待平台信用', FAILED: '失败', UNRESOLVED: '未解决', UNSUPPORTED: '不支持', PAUSED: '暂停', CANCELLED: '已取消' };
    root.querySelector('#status').textContent = `状态：${view.message} ${stateNames[view.taskState] || ''}\n任务：${names[task?.kind] || '等待识别'} ${task ? `${task.ordinal + 1}/${view.total}` : ''}\n本地结果：${view.localDone ? '已处理，非平台完成' : '尚未处理'}\n平台信用：${view.platformConfirmed ? '已确认' : '未确认'}\n休息剩余：${Math.max(0, Math.ceil(view.restRemaining / 1000))}秒\n延迟：${view.delayed ? '等待中' : '无'}\n未知/PDF专有阅读器及未验证直播需人工处理`;
    if (!root.querySelector('textarea').hidden) root.querySelector('textarea').value = app.exportDiagnostics();
  }
  document.body.append(host); render(); return Object.freeze({ render, destroy() { host.remove(); }, host });
}
