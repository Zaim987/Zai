// === Scroll Reveal Animation === const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); } }); }, { threshold: 0.1 });

// Observe all sections const sections = document.querySelectorAll('section'); sections.forEach(section => observer.observe(section));

