<script>
    // --- Imports ---
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';
    import confetti from 'canvas-confetti';
    // Import Swiper styles removed as we're using custom carousel

    // --- State ---
    let memoryData = null;
    let isLoading = true;
    let errorMessage = null;
    let currentSlide = 0;
    let totalSlides = 0;
    const dividerImageUrl = '/images/divider.png'
    const slug = $page.params.slug;
    // TODO: Mover para .env
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Countdown State
    let days = 0, hours = 0, minutes = 0, seconds = 0, countdownFinished = false, intervalId = null;
    // Confetti State
    let confettiCanvas = null, confettiInstance = null;
    // Carousel State
    let carouselInterval = null;

    // --- Helper Functions ---
    function updateCountdown() {
        if (!memoryData || !memoryData.targetDate) { countdownFinished = true; if(intervalId) clearInterval(intervalId); return; }
        const targetTime = new Date(memoryData.targetDate).getTime(); const now = new Date().getTime(); const difference = targetTime - now;
        if (difference <= 0) { days = 0; hours = 0; minutes = 0; seconds = 0; countdownFinished = true; if(intervalId) clearInterval(intervalId); }
        else { days = Math.floor(difference / (1000 * 60 * 60 * 24)); hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)); seconds = Math.floor((difference % (1000 * 60)) / 1000); countdownFinished = false; }
    }

    function getSpotifyTrackId(url) {
        if (!url || typeof url !== 'string') return null; try { const urlObj = new URL(url); if (urlObj.hostname.includes('spotify.com') && urlObj.pathname.includes('/track/')) { const parts = urlObj.pathname.split('/'); const trackIdIndex = parts.indexOf('track'); if (trackIdIndex !== -1 && parts.length > trackIdIndex + 1) { return parts[trackIdIndex + 1]; } } } catch (e) { console.error("URL Spotify inválida:", url, e); } return null;
    }

    // --- Carousel Functions ---
    function nextSlide() {
        if (!memoryData?.imageUrls || memoryData.imageUrls.length === 0) return;
        currentSlide = (currentSlide + 1) % memoryData.imageUrls.length;
    }

    function prevSlide() {
        if (!memoryData?.imageUrls || memoryData.imageUrls.length === 0) return;
        currentSlide = (currentSlide - 1 + memoryData.imageUrls.length) % memoryData.imageUrls.length;
    }

    function startCarousel() {
        if (carouselInterval) clearInterval(carouselInterval);
        carouselInterval = setInterval(() => {
            nextSlide();
        }, 4500);
    }

    // --- Reactive Variables ---
    $: spotifyEmbedUrl = (() => { const trackId = getSpotifyTrackId(memoryData?.musicUrl); return trackId ? `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0` : null; })();
    $: carouselTransform = `translateX(-${currentSlide * 100}%)`;
    $: if (memoryData?.imageUrls) {
        totalSlides = memoryData.imageUrls.length;
        startCarousel();
    }

    // --- Cleanup ---
    const cleanupConfetti = () => { if (confettiInstance) { confettiInstance.reset(); confettiInstance = null; console.log("Confetti resetado.");} if (confettiCanvas && document.body.contains(confettiCanvas)) { document.body.removeChild(confettiCanvas); confettiCanvas = null; console.log("Canvas do Confetti removido."); } };

    // --- Confetti Logic ---
    function startConfetti() {
        if (isLoading || errorMessage || !memoryData || confettiInstance) return;
        confettiCanvas = document.createElement('canvas'); document.body.appendChild(confettiCanvas); confettiCanvas.style.position = 'fixed'; confettiCanvas.style.top = '0'; confettiCanvas.style.left = '0'; confettiCanvas.style.width = '100vw'; confettiCanvas.style.height = '100vh'; confettiCanvas.style.pointerEvents = 'none'; confettiCanvas.style.zIndex = '10';
        confettiInstance = confetti.create(confettiCanvas, { resize: true, useWorker: true });
        console.log("Iniciando confetes..."); let animationFrameId = null;
        function frame() { if (!confettiInstance) return; confettiInstance({ particleCount: 1, angle: 270, spread: 90, startVelocity: 5 + Math.random() * 15, origin: { x: Math.random(), y: 0 }, gravity: 0.1 + Math.random() * 0.2, scalar: Math.random() * 0.4 + 0.5, ticks: 300, drift: Math.random() * 2 - 1, shapes: ['circle', 'star'], colors: ['#FFFFFF', '#E0E7FF', '#C7D2FE', '#A5B4FC'] }); if (document.body.contains(confettiCanvas)) { animationFrameId = requestAnimationFrame(frame); } else { if (animationFrameId) cancelAnimationFrame(animationFrameId); if (confettiInstance) confettiInstance.reset(); confettiInstance = null; } }
        animationFrameId = requestAnimationFrame(frame);
        setTimeout(() => { if (animationFrameId) cancelAnimationFrame(animationFrameId); cleanupConfetti(); }, 30000);
    }

    // --- Lifecycle ---
    onMount(async () => {
        isLoading = true; errorMessage = null; memoryData = null;
        // *** CORREÇÃO DA URL DA API ***
        const apiUrl = `${API_BASE_URL}/${slug}`;
        console.log(`Buscando dados: ${slug}`);
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) { errorMessage = response.status === 404 ? 'Oops! Memória não encontrada.' : `Erro ${response.status}.`; return; }
            memoryData = await response.json();
            console.log('Dados recebidos:', memoryData);
            if (memoryData?.targetDate) { updateCountdown(); intervalId = setInterval(updateCountdown, 1000); }
            else { countdownFinished = true; }
            setTimeout(startConfetti, 500);
        } catch (error) { console.error(`Erro de rede: ${slug}`, error); errorMessage = 'Falha na conexão.'; }
        finally { isLoading = false; }
    });

    onDestroy(() => {
        if (intervalId) clearInterval(intervalId);
        if (carouselInterval) clearInterval(carouselInterval);
        cleanupConfetti();
    });
</script>

{#if !isLoading && !errorMessage && memoryData}
    <div class="preview">
        <!-- URL header -->
        <div class="header-url">
            <span class="text-background">SiteDaPenelope/{memoryData.slug}</span>
        </div>

        <!-- Spotify embed centered -->
        {#if spotifyEmbedUrl}
            <div class="spotify-embed">
                <iframe
                        title="Spotify Player"
                        class="w-full spotify-iframe"
                        src={spotifyEmbedUrl}
                        frameborder="0"
                        allowfullscreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                ></iframe>
            </div>
        {/if}

        <!-- Custom Carousel -->
        {#if memoryData.imageUrls && memoryData.imageUrls.length > 0}
            <div class="img-content border-2 border-transparent">
                <div class="carousel-inner" style="transform: {carouselTransform}">
                    {#each memoryData.imageUrls as imageUrl, index}
                        <div class="carousel-item">
                            <img class="img-carousel" src={imageUrl} alt="Carousel image" loading="lazy">
                        </div>
                    {/each}
                </div>

                <!-- Optional: Navigation arrows -->
                <button class="carousel-control prev" on:click={prevSlide}>‹</button>
                <button class="carousel-control next" on:click={nextSlide}>›</button>

                <!-- Optional: Dots indicators -->
                <div class="carousel-dots">
                    {#each Array(totalSlides) as _, index}
                        <span
                                class="dot"
                                class:active={currentSlide === index}
                                on:click={() => currentSlide = index}
                        ></span>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Main title & single counter -->
        <div class="text-block">
            <h1 class="title">{memoryData.title}</h1>
            <p class="subtitle">
                {days} dias, {hours} horas, {minutes} minutos e {seconds} segundos
            </p>
            <hr class="divisor" />
            <p class="body-text">{memoryData.dedicatedText}</p>
        </div>
    </div>
{/if}

<style>
    /* 1) Reset global */
    :global(html, body) {
        height: 100%;
        margin: 0;
        padding: 0;
    }

    :global(body) {
        padding: 1rem;
        scroll-behavior: smooth;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: var(--vc-black);
        color: var(--vc-white);
        font-family: var(--vc-font-family);
        line-height: var(--vc-leading-normal);
    }

    :global(*), :global(*::before), :global(*::after) {
        box-sizing: border-box;
        border-width: 0;
        border-style: solid;
        border-color: #e5e7eb;
    }

    /* 2) Design tokens */
    :global(:root) {
        --vc-white: #ffffff;
        --vc-black: #000000;
        --vc-gray-900: #0f172a;
        --vc-font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
        --vc-text-sm: 14px;
        --vc-text-lg: 18px;
        --vc-text-xl: 20px;
        --vc-text-2xl: 24px;
        --vc-leading-normal: 1.5;
        --vc-rounded-md: .375rem;
        --spacing-section: 2rem;
    }

    /* 3) Container preview */
    .preview {
        background: var(--vc-gray-900);
        border-radius: 9px;
        padding: 1rem;
        height: 100%;
        max-height: 730px;
        width: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .preview > * {
        margin-bottom: var(--spacing-section);
    }
    .preview > :last-child {
        margin-bottom: 0;
    }

    /* URL pill */
    .header-url .text-background {
        display: inline-block;
        background-color: rgba(255, 255, 255, 0.2);
        padding: 0.25rem 0.75rem;
        border-radius: var(--vc-rounded-md);
        font-size: var(--vc-text-sm);
    }

    /* Spotify embed */
    .spotify-embed {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-bottom: var(--spacing-section);
    }
    .spotify-iframe {
        width: 100%;
        height: 152px;
    }

    /* Custom Carousel Styles to match the example */
    .img-content {
        position: relative;
        width: 100%;
        max-width: 600px;
        margin: 0 auto var(--spacing-section);
        display: flex;
        justify-content: center;
        align-items: center;
        height: 450px;
        border-radius: 14px;
        overflow: hidden;
    }

    .carousel-inner {
        display: flex;
        width: 100%;
        height: 100%;
        transition: transform 0.5s ease;
    }

    .carousel-item {
        min-width: 100%;
        height: 100%;
        flex-shrink: 0;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .img-carousel {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    /* Optional: Navigation Controls */
    .carousel-control {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.5);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.7;
        z-index: 1;
    }
    .carousel-control:hover {
        opacity: 1;
    }
    .prev {
        left: 10px;
    }
    .next {
        right: 10px;
    }

    /* Optional: Dot indicators */
    .carousel-dots {
        position: absolute;
        bottom: 10px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        gap: 8px;
    }
    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        cursor: pointer;
    }
    .dot.active {
        background: white;
    }

    /* Divider */
    .divisor {
        width: 320px;
        height: 2px;
        background-color: var(--vc-white);
        margin: 1rem auto;
        border: none;
    }

    /* Text block */
    .text-block {
        text-align: center;
        max-width: 600px;
    }
    .title {
        font-size: var(--vc-text-2xl);
        font-weight: var(--vc-font-semibold);
    }
    .subtitle {
        margin-top: 0.5rem;
        font-size: var(--vc-text-lg);
        font-weight: var(--vc-font-medium);
    }
    .body-text {
        margin-top: 1rem;
        font-size: var(--vc-text-sm);
        color: var(--vc-gray-200);
    }

    /* Responsividade para iPhone XR */
    @media only screen and (max-width: 414px) {
        :global(body) { padding: 0.5rem; }
        .preview { padding: 0.5rem; max-height: none; }
        .header-url .text-background { font-size: 12px; padding: 0.2rem 0.5rem; }
        .spotify-iframe { height: 120px; }
        .title { font-size: 20px; }
        .subtitle { font-size: 16px; }
        .body-text { font-size: 13px; }

        .img-content {
            max-width: 100%;
            height: auto;
            aspect-ratio: 5/9;
            max-height: 450px;
        }

        .carousel-control {
            width: 30px;
            height: 30px;
            font-size: 18px;
        }
    }

    /* Media query para telas médias */
    @media screen and (min-width: 768px) {
        .preview {
            padding: 1.5rem;
            max-width: 90%;
            margin: 0 auto;
        }

        .img-content {
            height: 500px;  /* Um pouco maior em telas médias */
        }

        .carousel-control {
            width: 45px;
            height: 45px;
            font-size: 28px;
        }
    }

    /* Media query para telas grandes */
    @media screen and (min-width: 1280px) {
        .preview {
            padding: 2rem;
            max-width: 80%;
            max-height: 80vh;
            margin: 0 auto;
        }

        .img-content {
            height: 550px;  /* Ainda maior em telas grandes */
            max-width: 70%;
        }

        .text-block {
            max-width: 70%;
        }

        .title {
            font-size: 32px;  /* Título maior em telas grandes */
        }

        .subtitle {
            font-size: 20px;
        }

        .body-text {
            font-size: 16px;
        }

        .divider-img {
            max-width: 180px;  /* Divider um pouco maior */
        }
    }

    /* Media query para telas extra grandes */
    @media screen and (min-width: 1920px) {
        .preview {
            max-width: 70%;
        }

        .img-content {
            height: 600px;
            max-width: 60%;
        }

        .text-block {
            max-width: 60%;
        }
    }
</style>