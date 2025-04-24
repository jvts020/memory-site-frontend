<script>
  // --- Seu script existente ---
  // --- NOVO: Variável para o título ---
  let title = '';
  // --- FIM NOVO ---
  let dedicatedText = '';
  let musicUrl = '';
  let suggestedSlug = '';
  let targetDate = '';
  let imageFiles = null;

  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let createdPageUrl = '';
  let createdQrCodeUrl = '';

  const API_BASE_URL = 'http://localhost:9090/api/memory';

  async function handleSubmit() {
    isLoading = true;
    errorMessage = '';
    successMessage = '';
    createdPageUrl = '';
    createdQrCodeUrl = '';

    // Validações básicas do frontend
    if (!title) { // <-- Adicionada validação para título
      errorMessage = 'O título não pode ser vazio.';
      isLoading = false;
      return;
    }
    if (!dedicatedText) {
      errorMessage = 'O texto dedicado não pode ser vazio.';
      isLoading = false;
      return;
    }
    if (imageFiles == null || imageFiles.length === 0) {
      errorMessage = 'Você precisa selecionar pelo menos uma imagem.';
      isLoading = false;
      return;
    }
    if (imageFiles.length > 7) {
      errorMessage = 'Você selecionou mais de 7 imagens.';
      isLoading = false;
      return;
    }

    // Monta o DTO para enviar
    const createRequestDto = {
      title: title, // <-- ADICIONADO: Inclui o título no DTO
      dedicatedText: dedicatedText,
      imageUrls: [],
      musicUrl: musicUrl || null,
      targetDate: targetDate || null,
      suggestedSlug: suggestedSlug || null
    };

    try {
      // 1. Criar Memória (Lógica existente)
      console.log('Enviando dados para criar memória:', JSON.stringify(createRequestDto));
      const createResponse = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify(createRequestDto),
      });

      if (!createResponse.ok) { /* ... tratamento de erro existente ... */
        let errorMsg = `Erro ao criar memória: ${createResponse.statusText}`; try { const errorBody = await createResponse.json(); errorMsg = errorBody.message || errorBody.error || errorMsg; if (errorBody.validationErrors) { errorMsg += ' Detalhes: ' + JSON.stringify(errorBody.validationErrors);}} catch(e) {} throw new Error(errorMsg);
      }
      const createdMemory = await createResponse.json();
      const slug = createdMemory.slug;
      if (!slug) { throw new Error('Erro: Slug não retornado.');}

      // 2. Fazer Upload das Imagens (Lógica existente)
      console.log(`Enviando ${imageFiles.length} imagens para slug ${slug}...`);
      const formData = new FormData();
      for (let i = 0; i < imageFiles.length; i++) { formData.append('files', imageFiles[i]); }
      const uploadResponse = await fetch(`${API_BASE_URL}/${slug}/images`, { method: 'POST', body: formData });

      if (!uploadResponse.ok) { /* ... tratamento de erro existente ... */
        let errorMsg = `Erro no upload: ${uploadResponse.statusText}`; try { const errorBody = await uploadResponse.json(); errorMsg = errorBody.message || errorBody.error || errorMsg;} catch(e) {} throw new Error(errorMsg);
      }
      const uploadedUrls = await uploadResponse.json();
      console.log('URLs salvas:', uploadedUrls);

      // 3. Mostrar Sucesso (Lógica existente)
      const publicBaseUrl = window.location.origin;
      createdPageUrl = `${publicBaseUrl}/m/${slug}`;
      createdQrCodeUrl = `${API_BASE_URL}/${slug}/qrcode`;
      successMessage = 'Página da memória criada com sucesso!';

      // --- Opcional: Limpar campos após sucesso ---
      // title = ''; // <-- ADICIONADO
      // dedicatedText = ''; musicUrl = ''; suggestedSlug = ''; targetDate = ''; imageFiles = null;
      // const fileInput = document.getElementById('imageInput'); if(fileInput) fileInput.value = null;

    } catch (error) {
      console.error('Erro no handleSubmit:', error);
      errorMessage = error.message || 'Ocorreu um erro desconhecido.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6 md:p-8">
    <h1 class="text-3xl font-bold text-center mb-6 text-gray-800 font-heading">✨ Criar Sua Página de Memória ✨</h1>

    <form on:submit|preventDefault={handleSubmit} class="space-y-5">

      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Título da Memória:</label>
        <input type="text" id="title" bind:value={title} required maxlength="100"
               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
               placeholder="Ex: Nosso Primeiro Ano Juntos">
        <p class="text-xs text-gray-500 mt-1">O título principal que aparecerá na página (máx 100 caracteres).</p>
      </div>
      <div>
        <label for="dedicatedText" class="block text-sm font-medium text-gray-700 mb-1">Texto Dedicado:</label>
        <textarea id="dedicatedText" rows="6" bind:value={dedicatedText} required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
                  placeholder="Escreva a mensagem principal aqui..."></textarea>
      </div>

      <div>
        <label for="musicUrl" class="block text-sm font-medium text-gray-700 mb-1">URL da Música (Spotify):</label>
        <input type="url" id="musicUrl" bind:value={musicUrl}
               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
               placeholder="https://open.spotify.com/embed/track/5PRRthP9SLfbXB359MfIWv/......">
      </div>

      <div>
        <label for="suggestedSlug" class="block text-sm font-medium text-gray-700 mb-1">Sugestão de URL Curta (Opcional):</label>
        <input type="text" id="suggestedSlug" bind:value={suggestedSlug} maxlength="50"
               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
               placeholder="Ex: aniversario-ana-2025 (letras minúsculas, números, hífens)">
        <p class="text-xs text-gray-500 mt-1">Se deixado em branco, será gerado automaticamente. Máx 50 caracteres.</p>
      </div>

      <div>
        <label for="targetDate" class="block text-sm font-medium text-gray-700 mb-1">Data/Hora Alvo (Opcional):</label>
        <input type="datetime-local" id="targetDate" bind:value={targetDate}
               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm">
        <p class="text-xs text-gray-500 mt-1">Usado para contadores de tempo.</p>
      </div>

      <div>
        <label for="imageInput" class="block text-sm font-medium text-gray-700 mb-1">Imagens (1 a 7 arquivos):</label>
        <input type="file" id="imageInput" multiple accept="image/png, image/jpeg, image/gif, image/webp" bind:files={imageFiles} required
               class="block w-full text-sm text-gray-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition duration-150 ease-in-out" />
        <p class="text-xs text-gray-500 mt-1">Selecione as fotos que aparecerão na página.</p>
      </div>

      <div class="pt-4">
        <button type="submit" disabled={isLoading}
                class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 ease-in-out">
          {#if isLoading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Criando Magia...
          {:else} Criar Página da Memória 💖 {/if}
        </button>
      </div>
    </form>

    <div class="mt-6 space-y-4">
      {#if errorMessage}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"> <p class="font-bold">Ops! Algo deu errado:</p> <p>{errorMessage}</p> </div>
      {/if}
      {#if successMessage}
        <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert"> <p class="font-bold">Sucesso!</p> <p>{successMessage}</p> <div class="mt-3 border-t border-green-200 pt-3"> <p class="text-sm font-medium">Link para compartilhar:</p> <a href={createdPageUrl} target="_blank" class="text-sm text-indigo-600 hover:text-indigo-800 break-all underline">{createdPageUrl}</a> {#if createdQrCodeUrl} <p class="text-sm font-medium mt-2">QR Code:</p> <div class="mt-1 inline-block p-1 bg-white border rounded"> <img src={createdQrCodeUrl} alt="QR Code" class="w-28 h-28"> </div> <br/> <a href={createdQrCodeUrl} target="_blank" class="text-xs text-indigo-600 hover:text-indigo-800">(Ver/Salvar Imagem QR Code)</a> {/if} </div> </div>
      {/if}
    </div>

  </div>
</div>

<style>
  :global(body) { min-height: 100vh; }
</style>