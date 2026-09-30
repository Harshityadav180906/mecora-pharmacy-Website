// ===== CONFIGURATION =====
const API_BASE = '';

// ===== STATE =====
let currentUser = null;
let selectedPlan = null;

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initHeroSlider();
  initScrollAnimations();
  initNavbar();
  initMobileMenu();
  initSmoothScroll();
  initParticles();
  initCounterAnimations();
  initAuthForms();
});

// ===== THEME TOGGLE (DARK / LIGHT) =====
function initThemeToggle() {
  const desktopBtn = document.getElementById('themeToggle');
  const mobileBtn = document.getElementById('themeToggleMobile');
  
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
  
  function updateThemeUI(theme) {
    const isLight = theme === 'light';
    const mobileText = document.querySelector('.theme-mode-text');
    if (mobileText) {
      mobileText.textContent = isLight ? 'Light Mode' : 'Dark Mode';
    }
    if (desktopBtn) {
      desktopBtn.setAttribute('title', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');
    }
  }
  
  function setTheme(theme, showNotification = true) {
    document.documentElement.classList.add('theme-transition');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mecora_theme', theme);
    updateThemeUI(theme);
    
    if (showNotification) {
      showToast(theme === 'light' ? '☀️ Switched to Light Mode' : '🌙 Switched to Dark Mode', 'info');
    }
    
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 400);
  }
  
  function toggle() {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next, true);
  }
  
  desktopBtn?.addEventListener('click', toggle);
  mobileBtn?.addEventListener('click', toggle);
  
  // Set initial button status
  updateThemeUI(getTheme());
  
  // Listen for OS system theme changes if user hasn't explicitly set preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('mecora_theme')) {
      setTheme(e.matches ? 'dark' : 'light', false);
    }
  });
}

// ===== HERO IMAGE SLIDER =====
// Auto-sliding hero images with crossfade effect
// Cycle through slides every 4 seconds
// Add dot indicators and prev/next controls
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelector('.slider-dots');
  let currentSlide = 0;
  
  if (!slides.length) return;
  
  // Create dot indicators
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dots?.appendChild(dot);
  });
  
  function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    document.querySelectorAll('.dot')[currentSlide]?.classList.remove('active');
    currentSlide = n;
    slides[currentSlide].classList.add('active');
    document.querySelectorAll('.dot')[currentSlide]?.classList.add('active');
  }
  
  function nextSlide() {
    goToSlide((currentSlide + 1) % slides.length);
  }
  
  setInterval(nextSlide, 4000);
}

// ===== SCROLL ANIMATIONS =====
// Use IntersectionObserver to add 'visible' class to elements with 'animate-on-scroll'
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Add staggered delay for children
        const children = entry.target.querySelectorAll('.stagger-child');
        children.forEach((child, i) => {
          child.style.transitionDelay = `${i * 0.1}s`;
          child.classList.add('visible');
        });
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ===== NAVBAR =====
// Sticky navbar with background change on scroll
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ===== MOBILE MENU =====
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks?.classList.toggle('active');
  });
  
  // Close menu on link click
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('active');
      navLinks?.classList.remove('active');
    });
  });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ===== PARTICLE BACKGROUND =====
// Create floating particles in the hero section for visual effect
function initParticles() {
  const container = document.querySelector('.particles-container');
  if (!container) return;
  
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 6 + 4) + 's';
    particle.style.animationDelay = (Math.random() * 4) + 's';
    particle.style.width = particle.style.height = (Math.random() * 4 + 1) + 'px';
    container.appendChild(particle);
  }
}

// ===== COUNTER ANIMATION =====
function initCounterAnimations() {
  const counters = document.querySelectorAll('.counter');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  });
  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  if (isNaN(target)) return;
  const duration = 2000;
  const start = performance.now();
  
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(target * eased).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ===== AUTH FORMS ATTACHMENT =====
function initAuthForms() {
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

// ===== LOGIN/SIGNUP MODAL =====
function showLoginModal(plan) {
  selectedPlan = plan;
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Default to login tab
  switchAuthTab('login');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  const targetTab = document.querySelector(`.auth-tab[data-tab="${tab}"]`);
  if (targetTab) targetTab.classList.add('active');
  const targetForm = document.getElementById(`${tab}Form`);
  if (targetForm) targetForm.classList.add('active');
}

// ===== SIGNUP =====
async function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('#signupName')?.value || '';
  const email = form.querySelector('#signupEmail')?.value || '';
  const phone = form.querySelector('#signupPhone')?.value || '';
  const password = form.querySelector('#signupPassword')?.value || '';
  
  const btn = form.querySelector('button[type="submit"]');
  const originalBtnText = btn ? btn.innerHTML : 'Create Account & Pay';
  if (btn) {
    btn.innerHTML = '<span class="spinner"></span> Creating Account...';
    btn.disabled = true;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = await res.json();
    
    if (data.success) {
      currentUser = data.user;
      showToast('Account created successfully!', 'success');
      closeAuthModal();
      initiatePayment();
    } else {
      showToast(data.message || 'Signup failed', 'error');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalBtnText;
      btn.disabled = false;
    }
  }
}

// ===== LOGIN =====
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('#loginEmail')?.value || '';
  const password = form.querySelector('#loginPassword')?.value || '';
  
  const btn = form.querySelector('button[type="submit"]');
  const originalBtnText = btn ? btn.innerHTML : 'Login & Pay';
  if (btn) {
    btn.innerHTML = '<span class="spinner"></span> Logging in...';
    btn.disabled = true;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    
    if (data.success) {
      currentUser = data.user;
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      closeAuthModal();
      initiatePayment();
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalBtnText;
      btn.disabled = false;
    }
  }
}

// ===== RAZORPAY PAYMENT =====
async function initiatePayment() {
  if (!currentUser || !selectedPlan) {
    showToast('Please login first', 'error');
    return;
  }
  
  showLoadingOverlay('Preparing your payment...');
  
  try {
    const res = await fetch(`${API_BASE}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planType: selectedPlan,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userPhone: currentUser.phone,
      }),
    });
    const data = await res.json();
    
    hideLoadingOverlay();
    
    if (!data.success) {
      showToast(data.message || 'Failed to create order', 'error');
      return;
    }
    
    // If in demo/test mode without live keys, simulate payment flow
    if (data.isMock) {
      showToast('⚡ Demo Mode: Simulating UPI Payment...', 'info');
      showLoadingOverlay('Processing UPI Payment Simulation...');
      setTimeout(async () => {
        await verifyPayment({
          razorpay_order_id: data.order.id,
          razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 11),
          razorpay_signature: 'mock_signature',
        });
      }, 1500);
      return;
    }
    
    // Open Razorpay Checkout with UPI preferred
    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: 'INR',
      name: 'Mecora Medical',
      description: `${data.plan.name} - ${data.plan.duration}`,
      order_id: data.order.id,
      prefill: {
        name: currentUser.name,
        email: currentUser.email,
        contact: currentUser.phone,
        method: 'upi',
      },
      config: {
        display: {
          blocks: {
            upi: {
              name: 'Pay using UPI',
              instruments: [
                { method: 'upi', flows: ['collect', 'intent', 'qr'] }
              ],
            },
          },
          sequence: ['block.upi'],
          preferences: { show_default_blocks: true },
        },
      },
      theme: {
        color: '#00d4ff',
        backdrop_color: 'rgba(26, 26, 46, 0.95)',
      },
      modal: {
        ondismiss: function() {
          showToast('Payment cancelled', 'error');
        },
      },
      handler: async function(response) {
        await verifyPayment(response);
      },
    };
    
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function(response) {
      showToast(`Payment failed: ${response.error.description}`, 'error');
    });
    rzp.open();
    
  } catch (err) {
    hideLoadingOverlay();
    showToast('Failed to initiate payment', 'error');
  }
}

// ===== VERIFY PAYMENT =====
async function verifyPayment(response) {
  showLoadingOverlay('Verifying your payment...');
  
  try {
    const res = await fetch(`${API_BASE}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        planType: selectedPlan,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: currentUser.phone,
      }),
    });
    const data = await res.json();
    
    hideLoadingOverlay();
    
    if (data.success) {
      showSuccessModal(data.payment);
    } else {
      showToast('Payment verification failed', 'error');
    }
  } catch (err) {
    hideLoadingOverlay();
    showToast('Verification error. Contact support.', 'error');
  }
}

// ===== SOFTWARE DASHBOARD CONFIGURATION =====
// Points to your live Vercel pharmacy software
const SOFTWARE_URL = 'https://mecora-pharmacy-software.vercel.app';
let redirectTimerInterval = null;

// ===== SUCCESS MODAL =====
function showSuccessModal(payment) {
  const modal = document.getElementById('successModal');
  if (!modal) return;
  const planEl = document.getElementById('successPlan');
  const amountEl = document.getElementById('successAmount');
  const paymentIdEl = document.getElementById('successPaymentId');
  const dateEl = document.getElementById('successDate');
  const launchBtn = document.getElementById('launchSoftwareBtn');

  if (planEl) planEl.textContent = payment.planType.charAt(0).toUpperCase() + payment.planType.slice(1) + ' Plan';
  if (amountEl) amountEl.textContent = payment.amount;
  if (paymentIdEl) paymentIdEl.textContent = payment.id;
  if (dateEl) dateEl.textContent = payment.date;
  if (launchBtn) launchBtn.href = SOFTWARE_URL;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  createConfetti();

  // Start 5-second automatic countdown to launch the software
  let countdown = 5;
  const timerEl = document.getElementById('countdownTimer');
  const redirectCountdownBox = document.getElementById('redirectCountdown');
  if (redirectCountdownBox) redirectCountdownBox.style.display = 'block';
  if (timerEl) timerEl.textContent = countdown;

  if (redirectTimerInterval) clearInterval(redirectTimerInterval);
  redirectTimerInterval = setInterval(() => {
    countdown--;
    if (timerEl) timerEl.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(redirectTimerInterval);
      redirectTimerInterval = null;
      window.location.href = SOFTWARE_URL;
    }
  }, 1000);
}

function cancelRedirectAndClose() {
  if (redirectTimerInterval) {
    clearInterval(redirectTimerInterval);
    redirectTimerInterval = null;
  }
  const redirectCountdownBox = document.getElementById('redirectCountdown');
  if (redirectCountdownBox) redirectCountdownBox.style.display = 'none';
  closeSuccessModal();
}

function closeSuccessModal() {
  if (redirectTimerInterval) {
    clearInterval(redirectTimerInterval);
    redirectTimerInterval = null;
  }
  const modal = document.getElementById('successModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ===== CONFETTI =====
function createConfetti() {
  const container = document.querySelector('.confetti-container');
  if (!container) return;
  container.innerHTML = '';
  
  const colors = ['#00d4ff', '#f6e05e', '#38a169', '#fc8181', '#b794f4', '#f687b3'];
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti-piece');
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    confetti.style.animationDelay = (Math.random() * 1) + 's';
    confetti.style.width = (Math.random() * 8 + 4) + 'px';
    confetti.style.height = (Math.random() * 8 + 4) + 'px';
    container.appendChild(confetti);
  }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('show'));
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function createToastContainer() {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  return container;
}

// ===== LOADING OVERLAY =====
function showLoadingOverlay(message = 'Processing...') {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    const msgEl = overlay.querySelector('.loading-message');
    if (msgEl) msgEl.textContent = message;
  }
  overlay.classList.add('active');
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ===== PLAN SELECTION (called from onclick on pricing cards) =====
function selectPlan(planType) {
  if (currentUser) {
    selectedPlan = planType;
    initiatePayment();
  } else {
    showLoginModal(planType);
  }
}

// ===== TYPING EFFECT =====
function initTypingEffect() {
  const el = document.querySelector('.typing-text');
  if (!el) return;
  const texts = ['Pharmacy Management', 'Inventory Tracking', 'Order Processing', 'Analytics Dashboard'];
  let textIndex = 0, charIndex = 0, isDeleting = false;
  
  function type() {
    const current = texts[textIndex];
    
    if (isDeleting) {
      el.textContent = current.substring(0, charIndex--);
    } else {
      el.textContent = current.substring(0, charIndex++);
    }
    
    let speed = isDeleting ? 50 : 100;
    
    if (!isDeleting && charIndex === current.length + 1) {
      speed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      speed = 500;
    }
    
    setTimeout(type, speed);
  }
  type();
}

// Call typing effect on load
document.addEventListener('DOMContentLoaded', initTypingEffect);

// ===== TILT EFFECT ON PRICING CARDS =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });
});

// Expose handlers to global window for inline onclick / onsubmit attributes
window.showLoginModal = showLoginModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.selectPlan = selectPlan;
window.initiatePayment = initiatePayment;
window.verifyPayment = verifyPayment;
window.showSuccessModal = showSuccessModal;
window.closeSuccessModal = closeSuccessModal;
window.cancelRedirectAndClose = cancelRedirectAndClose;
window.showToast = showToast;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;

// ===== DEMO VIDEO PLAYER =====
document.addEventListener('DOMContentLoaded', () => {
  initDemoVideoPlayer();
});

function initDemoVideoPlayer() {
  const btnPC = document.getElementById('btnPC');
  const btnPhone = document.getElementById('btnPhone');
  const pcPlayer = document.getElementById('pcPlayer');
  const phonePlayer = document.getElementById('phonePlayer');

  if (!btnPC || !pcPlayer) return;

  // ===== Device Toggle =====
  function switchDevice(device) {
    document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.demo-player').forEach(p => p.classList.remove('active'));

    if (device === 'pc') {
      btnPC.classList.add('active');
      pcPlayer.classList.add('active');
    } else {
      btnPhone.classList.add('active');
      phonePlayer.classList.add('active');
    }
  }

  btnPC.addEventListener('click', () => switchDevice('pc'));
  btnPhone.addEventListener('click', () => switchDevice('phone'));

  // ===== Slideshow Player Class =====
  class SlidePlayer {
    constructor(playerEl, playBtnId, progressId, currentId, totalId) {
      this.player = playerEl;
      this.slides = playerEl.querySelectorAll('.video-slide');
      this.playBtn = document.getElementById(playBtnId);
      this.progressBar = document.getElementById(progressId);
      this.currentEl = document.getElementById(currentId);
      this.totalEl = document.getElementById(totalId);
      this.currentIndex = 0;
      this.isPlaying = true;
      this.interval = null;
      this.INTERVAL_MS = 4000;

      if (!this.slides.length) return;

      this.totalEl.textContent = this.slides.length;
      this.updateUI();
      this.startAutoPlay();
      this.bindEvents();
    }

    goTo(index) {
      if (index < 0) index = this.slides.length - 1;
      if (index >= this.slides.length) index = 0;

      this.slides[this.currentIndex].classList.remove('active');
      this.currentIndex = index;
      this.slides[this.currentIndex].classList.add('active');
      this.updateUI();
    }

    next() { this.goTo(this.currentIndex + 1); }
    prev() { this.goTo(this.currentIndex - 1); }

    updateUI() {
      this.currentEl.textContent = this.currentIndex + 1;
      const pct = ((this.currentIndex + 1) / this.slides.length) * 100;
      this.progressBar.style.width = pct + '%';
    }

    startAutoPlay() {
      this.stopAutoPlay();
      this.isPlaying = true;
      this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      this.interval = setInterval(() => this.next(), this.INTERVAL_MS);
    }

    stopAutoPlay() {
      this.isPlaying = false;
      this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }

    togglePlay() {
      if (this.isPlaying) {
        this.stopAutoPlay();
      } else {
        this.startAutoPlay();
      }
    }

    bindEvents() {
      this.playBtn.addEventListener('click', () => this.togglePlay());

      const prevBtn = this.player.querySelector('.nav-prev');
      const nextBtn = this.player.querySelector('.nav-next');
      const fsBtn = this.player.querySelector('.fullscreen-btn');

      prevBtn?.addEventListener('click', () => {
        this.prev();
        if (this.isPlaying) this.startAutoPlay(); // Reset timer
      });

      nextBtn?.addEventListener('click', () => {
        this.next();
        if (this.isPlaying) this.startAutoPlay(); // Reset timer
      });

      // Fullscreen (PC only)
      fsBtn?.addEventListener('click', () => {
        const frame = this.player.querySelector('.player-frame');
        if (frame) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            frame.requestFullscreen?.() || frame.webkitRequestFullscreen?.();
          }
        }
      });

      // Click on progress bar to seek
      const progressContainer = this.player.querySelector('.progress-bar-container');
      progressContainer?.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        const targetIndex = Math.floor(pct * this.slides.length);
        this.goTo(targetIndex);
        if (this.isPlaying) this.startAutoPlay();
      });
    }
  }

  // Initialize both players
  new SlidePlayer(pcPlayer, 'pcPlayBtn', 'pcProgress', 'pcCurrent', 'pcTotal');
  new SlidePlayer(phonePlayer, 'phonePlayBtn', 'phoneProgress', 'phoneCurrent', 'phoneTotal');
}
