document.addEventListener('DOMContentLoaded', () => {
    const scene = document.getElementById('scene');

    // Kekuatan rotasi (sesuaikan nilainya)
    const rotationStrength = 15; // dalam derajat

    const updateSceneRotation = (x, y) => {
        // Hitung rotasi berdasarkan posisi input (-1 sampai 1)
        // Kita balik sumbu Y agar gerakan terasa natural (mouse ke atas, scene miring ke bawah)
        const rotateYValue = x * rotationStrength;
        const rotateXValue = -y * rotationStrength;

        // Terapkan transformasi rotasi ke seluruh scene
        scene.style.transform = `rotateX(${rotateXValue}deg) rotateY(${rotateYValue}deg)`;
    };

    // --- Untuk Desktop: Mouse Move ---
    document.body.addEventListener('mousemove', (e) => {
        // Normalisasi posisi mouse dari -1 sampai 1
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        
        updateSceneRotation(x, y);
    });

    // --- Untuk Mobile: Device Orientation ---
    if (window.DeviceOrientationEvent) {
        // Minta izin untuk iOS 13+
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            document.body.addEventListener('click', () => {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation);
                        }
                    })
                    .catch(console.error);
            }, { once: true });
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        function handleOrientation(event) {
            const gamma = event.gamma; // kiri-kanan
            const beta = event.beta;   // depan-belakang

            const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
            
            // Normalisasi nilai gamma dan beta ke rentang -1 sampai 1
            let x = clamp(gamma, -60, 60) / 60;
            let y = clamp(beta, -60, 60) / 60;
            
            updateSceneRotation(x, y);
        }
    } else {
        console.log("DeviceOrientationEvent tidak didukung.");
    }
});
