<script>
    // --- Imports ---
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';
    import confetti from 'canvas-confetti';
    import { register } from 'swiper/element/bundle';
    // Import Swiper styles
    import 'swiper/css';
    import 'swiper/css/navigation';
    import 'swiper/css/pagination';
    import 'swiper/css/autoplay';
    import 'swiper/css/effect-fade';

    // --- State ---
    let memoryData = null;
    let isLoading = true;
    let errorMessage = null;
    const slug = $page.params.slug;
    // TODO: Mover para .env
    const API_BASE_URL = 'http://localhost:9090/api/memory';

    // Countdown State
    let days = 0, hours = 0, minutes = 0, seconds = 0, countdownFinished = false, intervalId = null;
    // Confetti State
    let confettiCanvas = null, confettiInstance = null;

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

    // --- Reactive Variables ---
    $: spotifyEmbedUrl = (() => { const trackId = getSpotifyTrackId(memoryData?.musicUrl); return trackId ? `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0` : null; })();

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
        register(); // Registra Swiper
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

    onDestroy(() => { if (intervalId) clearInterval(intervalId); cleanupConfetti(); });

</script>


<div class="relative min-h-screen w-full flex flex-col items-center justify-center p-4 pt-10 sm:p-6 lg:p-8 font-sans antialiased overflow-hidden">

    <div class="absolute inset-0 z-0 background-gradient-layer">
    </div>


    {#if isLoading}
        <div class="text-center text-indigo-200 z-50"> <svg class="animate-spin mx-auto h-10 w-10 text-indigo-300 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Carregando... </div>
    {/if}

    {#if errorMessage}
        <div class="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md mx-auto text-center border-t-4 border-red-500 z-0"> <h2 class="text-xl font-semibold text-red-700 mb-3 font-heading">Problema</h2> <p class="text-gray-700">{errorMessage}</p> <a href="/admin" class="mt-4 inline-block text-sm text-indigo-700 hover:underline font-medium">Admin</a> </div>
    {/if}

    {#if !isLoading && !errorMessage && memoryData}
        <div class="relative z-1 w-full max-w-xl bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden transition-opacity duration-500 ease-in-out opacity-100 text-slate-200 ring-1 ring-white/10">

            <div class="p-4 sm:p-5 text-center bg-black/20 border-b border-white/10">
                <h2 class="font-heading text-lg font-semibold text-indigo-300 tracking-wide">Nossa Trilha Sonora</h2>
            </div>

            {#if spotifyEmbedUrl}
                <div class="p-4 sm:p-5">
                    <iframe title="Spotify Player" style="border-radius:12px;" src={spotifyEmbedUrl} width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                </div>
            {:else if memoryData.musicUrl}
                <div class="p-4 sm:p-5 text-center text-xs text-slate-400">
                    <a href={memoryData.musicUrl} target="_blank" class="hover:underline">Link da música</a>
                </div>
            {/if}

            <div class="p-6 sm:p-8 text-slate-300">

                {#if memoryData.targetDate}
                    <div class="mb-8 p-4 bg-black/20 rounded-lg text-center ring-1 ring-white/10">
                        <p class="text-xs sm:text-sm text-indigo-300 font-semibold tracking-wide uppercase mb-1"> {countdownFinished ? '✨ O Dia Chegou! ✨' : 'Contagem Para'} </p>
                        {#if !countdownFinished}
                            <div class="flex justify-center items-baseline space-x-2 text-3xl sm:text-4xl font-bold text-white tabular-nums">
                                <div>{days}<span class="text-xs font-medium ml-1 text-slate-400">d</span></div>
                                <div>{hours}<span class="text-xs font-medium ml-1 text-slate-400">h</span></div>
                                <div>{minutes}<span class="text-xs font-medium ml-1 text-slate-400">m</span></div>
                                <div>{seconds}<span class="text-xs font-medium ml-1 text-slate-400">s</span></div>
                            </div>
                        {:else}
                            <div class="text-3xl font-bold text-white animate-pulse"> 💖 !!! 💖 </div>
                        {/if}
                        <p class="text-xs text-indigo-300 mt-2"> ({new Date(memoryData.targetDate).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}) </p>
                    </div>
                {/if}

                <div class="prose prose-lg prose-invert max-w-none mb-8">
                    <p class="whitespace-pre-wrap">{memoryData.dedicatedText}</p>
                </div>

                {#if memoryData.imageUrls && memoryData.imageUrls.length > 0}
                    <div class="mb-8 relative group">
                        <swiper-container
                                slides-per-view="1" space-between="15" loop="true"
                                pagination="true" pagination-clickable="true" navigation="true"
                                keyboard="true"
                                autoplay="true" autoplay-delay="4500" autoplay-disable-on-interaction="false"
                                effect="fade" class="rounded-lg overflow-hidden shadow-md bg-black/30 aspect-video" style="--swiper-navigation-color: rgba(255,255,255,0.6); --swiper-pagination-color: rgba(255,255,255,0.8); --swiper-pagination-bullet-inactive-color: rgba(255,255,255,0.4); --swiper-pagination-bullet-size: 8px;"
                        >
                            {#each memoryData.imageUrls as imageUrl, index}
                                <swiper-slide class="flex items-center justify-center">
                                    <img src={imageUrl}
                                         alt="Memória {index + 1}"
                                         class="max-w-full max-h-[70vh] object-contain block"
                                         loading="lazy"
                                    />
                                </swiper-slide>
                            {/each}
                        </swiper-container>
                    </div>
                {:else}
                    <p class="text-center text-slate-500 italic mb-8">(Nenhuma imagem)</p>
                {/if}

                {#if memoryData.slug}
                    <div class="mt-8 pt-6 border-t border-white/10 text-center opacity-60 hover:opacity-90 transition-opacity">
                        <p class="text-xs text-slate-400 mb-2">QR Code:</p>
                        <div class="inline-block p-1 bg-white/80 border border-white/20 rounded shadow-sm">
                            <img src="{API_BASE_URL}/{memoryData.slug}/qrcode" alt="QR Code" class="w-16 h-16">
                        </div>
                    </div>
                {/if}
            </div>
        </div>

    {/if}

    <footer class="relative z-0 mt-8 text-center text-xs text-slate-400/70"> Criado com ❤️ para você! </footer>

</div>

<style>
    /* Estilo Global para o body */
    :global(body) {
        scroll-behavior: smooth;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    .background-gradient-layer {
        /* Cor de fundo de fallback caso o gradiente não carregue */
        background-color: #0D1321; /* Um azul bem escuro */

        /* Múltiplas camadas de gradiente: linear por cima (simulando overlay), radial por baixo (o novo fundo) */
        background-image:
            /* Simula o gradiente escuro de overlay (ajuste opacidade/cores se quiser) */
                linear-gradient(to bottom right,
                rgba(0,0,0,0.4), /* Preto com 40% opacidade */
                rgba(0,0,0,0.6) 50%, /* Preto com 60% opacidade no meio */
                rgba(0,0,0,0.7)), /* Preto com 70% opacidade no canto */
                    /* Gradiente radial: centro ligeiramente mais claro/azulado para bordas mais escuras */
                radial-gradient(circle at center,
                #1A2035 0%,   /* Azul escuro no centro */
                #0D1321 50%,  /* Um azul mais profundo um pouco afastado */
                #000000 100%); /* Preto nas bordas */

        /* Garante que o gradiente cubra toda a área */
        background-size: cover;
        background-repeat: no-repeat;
    }
    /* Estilos do Swiper MOVIDOS PARA CÁ */
    :global(swiper-container) {
        /* Ajusta tamanho da seta via CSS var */
        --swiper-navigation-size: 30px;
        /* Adiciona outros estilos globais do swiper se necessário */
    }
    /* Oculta botões por padrão e mostra no hover do container (classe 'group' adicionada no div pai) */
    :global(.swiper-button-prev), :global(.swiper-button-next) {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    :global(.group:hover .swiper-button-prev), :global(.group:hover .swiper-button-next) {
        opacity: 1;
    }

    /* Customização Prose (Opcional) */
    :global(.prose-invert p) { color: theme('colors.slate.300'); }
    :global(.prose-invert strong) { color: theme('colors.slate.100'); }
</style>