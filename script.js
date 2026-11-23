document.documentElement.classList.add('js-ready');

const nav = document.querySelector('[data-nav]');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

menuToggle?.addEventListener('click', () => {
  const open = navLinks?.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? 'Close' : 'Menu';
});

navLinks?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  if (menuToggle) menuToggle.textContent = 'Menu';
}));

const reveal = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      reveal.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-reveal]').forEach((element) => reveal.observe(element));

const projectData = {
  wifi: {
    title: 'Wi‑Fi CSI-Based Human Activity Classification',
    body: 'A device-free ambient sensing project using commodity Wi‑Fi network interface cards. The pipeline extracts CSI subcarrier amplitudes and phase matrices, applies PCA for spatiotemporal noise filtering, and trains Transformer-based and deep neural network models in Python and TensorFlow. Reported result: 85.10% classification accuracy and 0.8511 Macro F1.'
  },
  gait: {
    title: 'Video-Based Gait Tracking & Biomechanical Analysis',
    body: 'A markerless motion-capture pipeline using YOLOv12, Google MediaPipe, and TensorFlow in Python. It extracts full-body anatomical keypoints from sagittal-plane and diagonal feeds, calculates joint angles and kinetics, and uses LSTM sequence models to assess trajectories, track repetitions, and flag postural asymmetry.'
  },
  tourist: {
    title: 'Smart Tourist Safety & Incident Response',
    body: 'A Smart India Hackathon 2025 system built with Team Sixquels, ranked 4th in university selection. The project combines PyTorch anomaly detection, hazardous-zone geofencing, rapid alerting, a React.js web client, a Node.js/Express administrative portal, and tamper-proof digital identity credentials.'
  },
  blind: {
    title: 'Blind Cap — ChaturChakshu',
    body: 'An assistive wearable integrating Intel RealSense, TF‑Luna ToF sensors, YDLIDAR X2, YOLOv8, and an embedded processing unit. A quantized Hugging Face model adapted with LoRA turns scene understanding into contextual, natural-language audio cues.'
  }
};

const dialog = document.querySelector('#project-dialog');
document.querySelectorAll('[data-open-project]').forEach((button) => button.addEventListener('click', () => {
  const data = projectData[button.dataset.openProject];
  if (!data || !dialog) return;
  document.querySelector('#dialog-title').textContent = data.title;
  document.querySelector('#dialog-body').textContent = data.body;
  dialog.showModal();
}));
document.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  document.querySelectorAll('.project-card').forEach((card) => {
    card.hidden = filter !== 'all' && card.dataset.category !== filter;
  });
}));

document.querySelectorAll('.pub-filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.pub-filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.pubFilter;
  document.querySelectorAll('.publication').forEach((card) => {
    card.hidden = filter !== 'all' && card.dataset.pubKind !== filter;
  });
}));

if (!reduced) {
  window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const progress = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.7)));
    const copy = document.querySelector('.hero-copy');
    const portrait = document.querySelector('.hero-visual');
    if (copy) copy.style.transform = `translate3d(0, ${progress * 34}px, 0)`;
    if (portrait) portrait.style.transform = `translate3d(0, ${progress * -24}px, 0)`;
  }, { passive: true });
}
