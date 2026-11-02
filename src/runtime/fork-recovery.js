// Authorized user-developed extraction from RXY712200/xuexitongScript
// 351c08dc4d772908c3d098e8c9160be434bf1064; namespace/clock adapted.
export function createUnattendedRecoveryCoordinator(env, hooks) {
    const key = 'xxt.unattended-recovery.v1';
    let state, timer = null, disposed = false, storageFailed = false;
    const identity = () => hooks.identity();
    const persist = () => { try { env.sessionStorage.setItem(key, JSON.stringify(state)); return true; } catch (_) { if (!storageFailed) { storageFailed = true; hooks.fail('恢复预算无法持久保存'); } return false; } };
    const fresh = id => ({ version: 1, identity: id, attempts: 0, stage: 'idle', reloadUsed: false, reason: '', stopped: false, cycle: (env.now ? env.now() : Date.now()) });
    const restore = () => {
        const id = identity();
        try {
            const raw = env.sessionStorage.getItem(key); state = raw ? JSON.parse(raw) : fresh(id);
            if (state.version !== 1 || !Number.isInteger(state.attempts) || state.attempts < 0 || state.attempts > 3 ||
                (state.identity !== null && typeof state.identity !== 'string') || !Number.isSafeInteger(state.cycle) || typeof state.reason !== 'string' ||
                typeof state.stopped !== 'boolean' || typeof state.reloadUsed !== 'boolean' ||
                !['idle','waiting','observing','reload','terminal'].includes(state.stage)) throw Error();
            if (id && state.identity !== id) state = { ...fresh(id), stopped: state.stopped };
            if (state.stage === 'waiting' && timer === null) state.stage = 'observing';
        } catch (_) { state = { ...fresh(id), stopped: true, stage: 'terminal' }; }
        return state;
    };
    restore();
    const cancel = reason => { if (timer !== null) env.clearTimeout(timer); timer = null; if (['terminal-block','navigation','user-interaction'].includes(reason)) { state.stage = 'terminal'; persist(); } };
    const finish = reason => { cancel(); state.stage = 'terminal'; state.reason = reason; persist(); hooks.fail(reason); };
    const requestRecovery = reason => {
        if (disposed || state.stopped || state.stage === 'terminal') return false;
        if (!identity() || identity() !== state.identity || !['context-stale','frame-replaced','readiness'].includes(reason) || !hooks.safe()) return false;
        if (timer !== null && state.stage === 'waiting') return true;
        cancel();
        if (state.attempts >= 3) { finish('当前小节连续恢复失败，已停止；不会继续刷新'); return true; }
        state.attempts++; state.stage = 'waiting'; state.reason = reason;
        if (!persist()) return false;
        hooks.notice(`自动恢复 ${state.attempts}/3：${['','重新检测当前任务','重新初始化当前小节','安全刷新当前页面'][state.attempts]}`);
        const fingerprint = hooks.fingerprint?.();
        timer = env.setTimeout(() => {
            timer = null;
            if (disposed || state.stopped || identity() !== state.identity || (hooks.fingerprint && hooks.fingerprint() !== fingerprint) || !hooks.safe()) return finish('恢复上下文或安全条件已变化');
            state.stage = 'observing';
            if (state.attempts === 3) {
                if (state.reloadUsed || !hooks.canReload()) return finish('当前状态不允许安全刷新，已停止');
                state.reloadUsed = true; state.stage = 'reload'; if (persist()) env.location.reload(); return;
            }
            persist(); hooks.retry(state.attempts);
            observe();
        }, 1000);
        return true;
    };
    const observe = () => {
        if (disposed || state.stopped || !state.attempts || timer !== null) return;
        timer = env.setTimeout(() => { timer = null; if (identity() !== state.identity) return cancel(); if (!hooks.progress()) requestRecovery('readiness'); }, 15000);
    };
    return { restore, requestRecovery, classifyFailure: reason => ['context-stale','frame-replaced','readiness'].includes(reason) && hooks.safe(),
        beginReadinessWait() {
            if (disposed || state.stopped || state.stage === 'terminal' || !identity() || identity() !== state.identity || !hooks.safeLoading?.()) return false;
            cancel();
            // Waiting is an attempt too. Preserve the existing third-attempt stop
            // when an automatic reload is not authorized; the runtime owns the deadline.
            state.attempts++;
            if (state.attempts >= 3) { finish('当前小节恢复预算已终止，请手动重新检测'); return false; }
            state.stage = 'observing'; state.reason = 'readiness';
            return persist();
        },
        cancel, dispose() { disposed = true; cancel(); }, getStatus: () => ({ ...state }),
        confirmProgress() { if (!disposed && !state.stopped && state.stage !== 'terminal' && state.attempts && identity() && identity() === state.identity) { cancel(); state = fresh(identity()); persist(); } },
        markExplicitStop() { cancel(); state.stopped = true; persist(); },
        resumeExplicitly() { cancel(); state = fresh(identity()); persist(); },
        observe,
    };
}
