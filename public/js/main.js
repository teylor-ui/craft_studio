/**
 * NovaCraft Studio — Frontend Interactions
 * ==========================================
 * Handles navigation, form submissions, scroll animations,
 * and interactive elements on the website.
 *
 * @version 1.2.0
 */

(function () {
  'use strict';

  // ─── Navigation ──────────────────────────────────────────────
  const nav = document.getElementById('main-nav');
  const burger = document.getElementById('nav-burger');
  const navLinks = document.getElementById('nav-links');

  // Scroll-based nav styling
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // Mobile menu toggle
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    navLinks.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ─── Smooth Scroll ───────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = nav ? nav.offsetHeight + 20 : 80;
        const position = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: position, behavior: 'smooth' });
      }
    });
  });

  // ─── Counter Animation ──────────────────────────────────────
  function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(counter => {
      if (counter.dataset.animated) return;
      const rect = counter.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        counter.dataset.animated = 'true';
        const target = parseInt(counter.dataset.count, 10);
        const duration = 2000;
        const start = performance.now();
        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = Math.round(target * eased) + '+';
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
      }
    });
  }
  window.addEventListener('scroll', animateCounters, { passive: true });
  animateCounters();

  // ─── Scroll Reveal ──────────────────────────────────────────
  function initReveal() {
    const revealElements = document.querySelectorAll(
      '.work__card, .services__card, .testimonials__card, .about__content, .about__visual, .contact__info, .contact__form'
    );
    revealElements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(el => observer.observe(el));
  }
  if ('IntersectionObserver' in window) initReveal();

  // ─── Contact Form ───────────────────────────────────────────
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('contact-submit');
      submitBtn.classList.add('btn--loading');

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();

        submitBtn.classList.remove('btn--loading');

        // Remove any existing messages
        contactForm.querySelectorAll('.form-success, .form-error').forEach(el => el.remove());

        const msg = document.createElement('p');
        if (result.success) {
          msg.className = 'form-success';
          msg.textContent = result.message;
          contactForm.reset();
        } else {
          msg.className = 'form-error';
          msg.textContent = result.message || 'Something went wrong. Please try again.';
        }
        contactForm.appendChild(msg);
        setTimeout(() => msg.remove(), 6000);
      } catch (err) {
        submitBtn.classList.remove('btn--loading');
        const msg = document.createElement('p');
        msg.className = 'form-error';
        msg.textContent = 'Network error. Please check your connection and try again.';
        contactForm.appendChild(msg);
        setTimeout(() => msg.remove(), 6000);
      }
    });
  }

  // ─── Newsletter Form ────────────────────────────────────────
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const submitBtn = document.getElementById('newsletter-submit');
      const originalText = submitBtn.textContent;

      submitBtn.textContent = '...';
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput.value }),
        });
        const result = await res.json();

        if (result.success) {
          submitBtn.textContent = '✓ Subscribed!';
          submitBtn.style.background = 'var(--color-success)';
          emailInput.value = '';
          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
          }, 3000);
        } else {
          submitBtn.textContent = 'Try again';
          submitBtn.style.background = 'var(--color-error)';
          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
          }, 2000);
        }
      } catch (err) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // ─── Portfolio Card Hover Effects ───────────────────────────
  document.querySelectorAll('.work__card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const img = card.querySelector('.work__card-image');
      if (img) img.style.transform = 'scale(1.03)';
    });
    card.addEventListener('mouseleave', () => {
      const img = card.querySelector('.work__card-image');
      if (img) img.style.transform = 'scale(1)';
    });
  });

  // ─── Current Year in Footer ─────────────────────────────────
  const footerYear = document.querySelector('.footer__bottom p');
  if (footerYear) {
    footerYear.innerHTML = footerYear.innerHTML.replace('2025', new Date().getFullYear());
  }

})();
