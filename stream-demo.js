(() => {
  const instances = [];
  let manualOwner = null;
  const reconcileAutoPlayers = () => instances.forEach(instance => instance.reconcileAutoPlayback());
  document.querySelectorAll('#stream-demo, [data-paired-demo]').forEach(root => {

  const clips = [...root.querySelectorAll('video[data-demo-video]')];
  const playButton = root.querySelector('#stream-play, [data-pair-play]');
  const replayButton = root.querySelector('#stream-replay, [data-pair-replay]');
  const seek = root.querySelector('#stream-seek, [data-pair-seek]');
  const timeOutput = root.querySelector('#stream-time, [data-pair-time]');
  const status = root.querySelector('#stream-status, [data-pair-status]');
  const viewButtons = [...root.querySelectorAll('[data-stream-view]')];
  const allowedViews = new Set(viewButtons.map(button => button.dataset.streamView));
  const isStreamDemo = root.id === 'stream-demo';
  const autoPlay = root.hasAttribute('data-auto-play') && 'IntersectionObserver' in window;
  if (clips.length !== 2 || !playButton || !replayButton || !seek || !timeOutput || !status) return;

  const END_EPSILON = 0.005;
  const SEEK_TOLERANCE = 1 / 30;
  const WAIT_LIMIT = 15000;
  let view = root.dataset.defaultView || 'scene';
  let position = 0;
  let playing = false;
  let wantsPlayback = false;
  let loading = false;
  let scrubbing = false;
  let frame = 0;
  let operation = 0;
  let pending = null;
  let shorterEnded = false;
  let lastProgressTime = 0;
  let lastProgressPosition = 0;
  let inView = false;
  let manuallyPaused = false;
  let heldAtEnd = false;
  let autoBlocked = false;
  let pageActive = true;

  const seconds = value => value.toFixed(1);
  const duration = clip => Number.isFinite(clip.duration) && clip.duration > 0
    ? clip.duration : Number(clip.dataset.knownDuration) || 0;
  const totalDuration = () => Math.max(...clips.map(duration));
  const clockClip = () => clips.reduce((a, b) => duration(a) >= duration(b) ? a : b);
  const bounded = value => Math.max(0, Math.min(Number(value) || 0, totalDuration()));
  const hasEnded = (clip, time) => duration(clip) > 0 && time >= duration(clip) - END_EPSILON;
  const currentPosition = () => playing ? bounded(clockClip().currentTime) : position;
  const cancelled = () => new DOMException('Superseded playback operation', 'AbortError');

  function announce(message) {
    if (status.textContent !== message) status.textContent = message;
  }

  function refresh() {
    const total = totalDuration();
    seek.max = String(total);
    if (!scrubbing) seek.value = String(position);
    seek.setAttribute('aria-valuetext', `${seconds(position)} of ${seconds(total)} seconds`);
    timeOutput.textContent = `${seconds(position)} / ${seconds(total)} s`;
    playButton.dataset.state = loading ? 'loading' : playing ? 'playing' : 'paused';
    playButton.textContent = loading ? (wantsPlayback ? 'Pause loading' : 'Loading…') : wantsPlayback ? 'Pause' : 'Play both';
    playButton.setAttribute('aria-pressed', String(wantsPlayback));
    clips.forEach(clip => {
      const label = root.querySelector(`[data-clip-status="${clip.dataset.demoVideo}"]`);
      if (label) label.textContent = hasEnded(clip, position)
        ? `Clip ended · ${seconds(duration(clip))} s` : `${seconds(duration(clip))} s clip`;
    });
  }

  function stopMedia() {
    playing = false;
    cancelAnimationFrame(frame);
    frame = 0;
    clips.forEach(clip => { clip.pause(); clip.playbackRate = 1; });
  }

  function cancelOperation() {
    operation += 1;
    if (pending) pending.abort();
    pending = null;
    stopMedia();
    loading = false;
    return operation;
  }

  function pause(message = 'Paused.') {
    position = currentPosition();
    wantsPlayback = false;
    scrubbing = false;
    cancelOperation();
    refresh();
    announce(message);
    releaseManualOwner();
  }

  function releaseManualOwner() {
    if (manualOwner !== instance) return;
    manualOwner = null;
    queueMicrotask(reconcileAutoPlayers);
  }

  function reconcileAutoPlayback() {
    if (!autoPlay) return;
    const available = pageActive && inView && !document.hidden && !manualOwner;
    if (!available) {
      if (playing || loading || wantsPlayback) pause(document.hidden
        ? 'Paused.' : 'Paused.');
      return;
    }
    // User-paused seeks may still be loading; leave those operations intact.
    if (manuallyPaused || heldAtEnd || autoBlocked) return;
    if (playing || loading || wantsPlayback) return;
    wantsPlayback = true;
    synchronize(position >= totalDuration() - END_EPSILON ? 0 : position, true);
  }

  const instance = {
    autoPlay,
    reconcileAutoPlayback,
    pauseIfActive() {
      if (playing || loading || wantsPlayback) pause('Paused.');
    }
  };
  instances.push(instance);
  function pauseOtherInstances() {
    instances.forEach(other => {
      if (other !== instance && !(autoPlay && other.autoPlay)) other.pauseIfActive();
    });
  }

  // Every media wait has both an abort path and a deadline, including slow seeks.
  function waitFor(clip, predicate, signal) {
    return new Promise((resolve, reject) => {
      let timer;
      const events = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'seeked', 'timeupdate', 'progress', 'durationchange'];
      const clean = () => {
        clearTimeout(timer);
        events.forEach(event => clip.removeEventListener(event, check));
        clip.removeEventListener('error', onError);
        signal.removeEventListener('abort', onAbort);
      };
      const finish = error => { clean(); error ? reject(error) : resolve(); };
      const onAbort = () => finish(cancelled());
      const onError = () => finish(new Error('A clip could not be loaded.'));
      const check = () => {
        if (signal.aborted) onAbort();
        else if (clip.error) onError();
        else if (predicate()) finish();
      };
      events.forEach(event => clip.addEventListener(event, check));
      clip.addEventListener('error', onError);
      signal.addEventListener('abort', onAbort, {once: true});
      timer = setTimeout(() => finish(new Error('Loading took too long.')), WAIT_LIMIT);
      check();
    });
  }

  // play() itself may remain pending while a browser buffers or asks permission.
  function startClip(clip, signal) {
    return new Promise((resolve, reject) => {
      let done = false;
      let timer;
      const finish = error => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        error ? reject(error) : resolve();
      };
      const onAbort = () => finish(cancelled());
      signal.addEventListener('abort', onAbort, {once: true});
      timer = setTimeout(() => finish(new Error('Playback could not start.')), WAIT_LIMIT);
      if (signal.aborted) return onAbort();
      try { Promise.resolve(clip.play()).then(() => finish(), finish); }
      catch (error) { finish(error); }
    });
  }

  function updateView() {
    viewButtons.forEach(button => {
      const active = button.dataset.streamView === view;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('active', active);
    });
    if (isStreamDemo) {
      root.querySelectorAll('.stream-observed-label').forEach(label => {
        label.textContent = view === 'scene' ? 'Observed scene' : 'Observed wrist';
      });
      root.querySelectorAll('.stream-predicted-label').forEach(label => {
        label.textContent = view === 'scene' ? 'Predicted future' : 'Predicted wrist';
      });
    }
    clips.forEach(clip => {
      const link = root.querySelector(`[data-open-clip="${clip.dataset.demoVideo}"]`);
      if (link) link.href = clip.dataset[`${view}Src`];
    });
  }

  async function synchronize(target, resume, replaceSources = false) {
    const ticket = cancelOperation();
    const controller = new AbortController();
    pending = controller;
    const {signal} = controller;
    position = bounded(target);
    loading = true;
    refresh();
    announce('Loading…');
    try {
      clips.forEach(clip => {
        clip.preload = 'auto';
        if (replaceSources || clip.error) {
          clip.src = clip.dataset[`${view}Src`];
          clip.poster = clip.dataset[`${view}Poster`];
          clip.load();
        }
      });
      await Promise.all(clips.map(clip => waitFor(clip,
        () => clip.readyState >= 1 && Number.isFinite(clip.duration) && clip.duration > 0, signal)));
      if (ticket !== operation || signal.aborted) return;
      position = bounded(target);
      await Promise.all(clips.map(async clip => {
        // Seeking just inside the duration preserves the decoded final frame.
        const atEnd = hasEnded(clip, position);
        const clipTime = atEnd ? Math.max(0, duration(clip) - 0.001) : position;
        if (Math.abs(clip.currentTime - clipTime) > 0.001) clip.currentTime = clipTime;
        await waitFor(clip, () => !clip.seeking
          && Math.abs(clip.currentTime - clipTime) <= SEEK_TOLERANCE
          && clip.readyState >= (resume && !atEnd ? 3 : 2), signal);
      }));
      if (ticket !== operation || signal.aborted) return;
      const activeClips = clips.filter(clip => !hasEnded(clip, position));
      if (resume && wantsPlayback && !document.hidden && activeClips.length) {
        await Promise.all(activeClips.map(clip => startClip(clip, signal)));
        if (ticket !== operation || signal.aborted) return;
        playing = true;
        lastProgressTime = performance.now();
        lastProgressPosition = position;
      } else if (!activeClips.length) {
        wantsPlayback = false;
        releaseManualOwner();
      }
      pending = null;
      loading = false;
      shorterEnded = clips.some(clip => hasEnded(clip, position)) && position < totalDuration() - END_EPSILON;
      refresh();
      announce(playing
        ? (shorterEnded ? 'Playing.'
          : autoPlay ? 'Playing.' : 'Playing.')
        : position >= totalDuration() - END_EPSILON ? 'Finished.' : 'Paused.');
      if (playing) frame = requestAnimationFrame(tick);
    } catch (error) {
      if (ticket !== operation || signal.aborted) return;
      wantsPlayback = false;
      scrubbing = false;
      autoBlocked = true;
      cancelOperation();
      releaseManualOwner();
      refresh();
      announce(error.name === 'NotAllowedError'
        ? 'Playback was blocked. Press Play both to try again, or open a clip directly.'
        : 'The clips could not finish loading. Try Replay, or open a clip directly.');
    }
  }

  function tick() {
    frame = 0;
    if (!playing) return;
    if (document.hidden) return pause('Paused.');
    position = bounded(clockClip().currentTime);
    const total = totalDuration();
    if (position >= total - END_EPSILON || clockClip().ended) {
      // Loop the pair only after natural completion, never each video separately.
      if (autoPlay && inView && !manuallyPaused && !autoBlocked && !manualOwner && pageActive) {
        synchronize(0, true);
        return;
      }
      position = total;
      wantsPlayback = false;
      stopMedia();
      refresh();
      announce('Finished.');
      releaseManualOwner();
      return;
    }
    if (position > lastProgressPosition + 0.01) {
      lastProgressTime = performance.now();
      lastProgressPosition = position;
    } else if (performance.now() - lastProgressTime > 5000) {
      autoBlocked = true;
      return pause('Playback stalled. Press Play both to try again, or open a clip directly.');
    }
    for (const clip of clips) {
      if (hasEnded(clip, position)) {
        if (!clip.paused) clip.pause();
        if (clip.currentTime < duration(clip) - 0.04) clip.currentTime = Math.max(0, duration(clip) - 0.001);
      } else if (Math.abs(clip.currentTime - position) > 0.15 || clip.paused || clip.readyState < 3) {
        synchronize(position, true);
        return;
      }
    }
    const endedNow = clips.some(clip => hasEnded(clip, position));
    if (endedNow && !shorterEnded) announce('Playing.');
    shorterEnded = endedNow;
    refresh();
    frame = requestAnimationFrame(tick);
  }

  clips.forEach(clip => {
    clip.preload = 'metadata';
    clip.autoplay = false;
    clip.loop = false;
    clip.muted = true;
    clip.defaultMuted = true;
    clip.playsInline = true;
    clip.controls = false;
    const initialSource = clip.dataset[`${view}Src`];
    if (initialSource && clip.getAttribute('src') !== initialSource) clip.src = initialSource;
    if (clip.dataset[`${view}Poster`]) clip.poster = clip.dataset[`${view}Poster`];
    clip.addEventListener('loadedmetadata', () => { if (!loading) refresh(); });
    clip.addEventListener('waiting', () => {
      if (playing && !hasEnded(clip, currentPosition())) synchronize(currentPosition(), true);
    });
    clip.addEventListener('error', () => {
      if (!loading) {
        autoBlocked = true;
        pause('A clip could not be loaded. Try Replay, or open it directly.');
      }
    });
  });

  playButton.addEventListener('click', () => {
    if (wantsPlayback || playing) {
      manuallyPaused = true;
      return pause();
    }
    manuallyPaused = false;
    heldAtEnd = false;
    autoBlocked = false;
    if (!autoPlay) manualOwner = instance;
    pauseOtherInstances();
    scrubbing = false;
    wantsPlayback = true;
    synchronize(position >= totalDuration() - END_EPSILON ? 0 : position, true);
  });
  replayButton.addEventListener('click', () => {
    manuallyPaused = false;
    heldAtEnd = false;
    autoBlocked = false;
    if (!autoPlay) manualOwner = instance;
    pauseOtherInstances();
    scrubbing = false;
    wantsPlayback = true;
    synchronize(0, true);
  });
  seek.addEventListener('input', () => {
    heldAtEnd = Number(seek.value) >= totalDuration() - END_EPSILON;
    scrubbing = true;
    synchronize(Number(seek.value), false);
  });
  const finishSeeking = () => {
    if (!scrubbing) return;
    scrubbing = false;
    synchronize(Number(seek.value), wantsPlayback);
  };
  seek.addEventListener('change', finishSeeking);
  seek.addEventListener('blur', finishSeeking);
  viewButtons.forEach(button => button.addEventListener('click', () => {
    const nextView = button.dataset.streamView;
    if (!allowedViews.has(nextView) || nextView === view) return;
    const target = currentPosition();
    scrubbing = false;
    view = nextView;
    updateView();
    synchronize(target, wantsPlayback, true);
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (playing || loading || wantsPlayback)) pause('Paused.');
    else if (!document.hidden) reconcileAutoPlayback();
  });
  window.addEventListener('pagehide', () => { pageActive = false; pause('Paused.'); });
  window.addEventListener('pageshow', () => { pageActive = true; reconcileAutoPlayback(); });
  if (!seek.getAttribute('aria-label') && !seek.labels?.length) seek.setAttribute('aria-label', 'Shared playback position');
  updateView();
  refresh();
  announce(autoPlay ? 'Ready.'
    : 'Ready.');
  if (autoPlay) {
    const visibleFrames = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Separate enter/exit thresholds keep playback stable at viewport edges.
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) visibleFrames.add(entry.target);
        else if (!entry.isIntersecting || entry.intersectionRatio <= 0.05) visibleFrames.delete(entry.target);
      });
      inView = visibleFrames.size > 0;
      reconcileAutoPlayback();
    }, {threshold: [0, 0.05, 0.2], rootMargin: '-76px 0px 0px 0px'});
    clips.forEach(clip => observer.observe(clip.parentElement));
  }
  });
})();
