document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('parallax-container');
    const layers = Array.from(container.getElementsByClassName('parallax-layer'));

    // Tentukan kekuatan efek
    const movementStrength = 25; 

    // Fungsi untuk mengupdate posisi layer
    const updateLayers = (x, y) => {
        layers.forEach(layer => {
            const depth = parseFloat(layer.getAttribute('data-depth'));
            if (isNaN(depth)) return;

            // Hitung pergerakan berdasarkan kedalaman
            const moveX = x * movementStrength * depth;
            const moveY = y * movementStrength * depth;

            // Terapkan transformasi. Kita tidak mengubah translateZ yang sudah di set di CSS
            // Jadi kita hanya perlu menambahkan translateX dan translateY
            layer.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
        });
    };

    // --- Untuk Desktop: Mouse Move ---
    document.body.addEventListener('mousemove', (e) => {
        // Normalisasi posisi mouse dari -1 sampai 1
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        
        updateLayers(x, y);
    });


    // --- Untuk Mobile: Device Orientation ---
    // Cek apakah API didukung
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (event) => {
            // Gamma: pergerakan kiri-kanan (-90 to 90)
            // Beta: pergerakan depan-belakang (-180 to 180)
            const gamma = event.gamma; // -90 to 90
            const beta = event.beta;   // -180 to 180

            // Normalisasi nilai agar lebih terkontrol
            // Batasi nilai agar tidak terlalu liar
            const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
            
            let x = clamp(gamma, -45, 45) / 45; // Normalisasi ke -1 sampai 1
            let y = clamp(beta, -45, 45) / 45;  // Normalisasi ke -1 sampai 1
            
            // Di beberapa orientasi, sumbu mungkin perlu dibalik
            // Sesuaikan jika perlu
            updateLayers(x, y);
        });
    } else {
        console.log("DeviceOrientationEvent tidak didukung pada perangkat ini.");
    }
});
