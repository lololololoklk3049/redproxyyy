// Initialize Scramjet Controller
const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
    files: {
        wasm: '/scram/scramjet.wasm.wasm',
        all: '/scram/scramjet.all.js',
        sync: '/scram/scramjet.sync.js'
    }
});

// Initialize BareMux connection
const connection = new BareMux.BareMuxConnection('/baremux/worker.js');

// Setup transport (using Epoxy for better performance)
async function setupTransport() {
    try {
        const transport = new BareMux.EpoxyTransport({
            wisp: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/wisp/`
        });
        await connection.setTransport(transport);
        console.log('✅ Epoxy transport initialized');
    } catch (err) {
        console.error('Failed to set transport:', err);
    }
}

// Register Service Worker
async function registerSW() {
    try {
        await scramjet.init();
        
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
        });
        
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        
        // Setup transport after SW is ready
        await setupTransport();
        
    } catch (err) {
        console.error('Service Worker registration failed:', err);
    }
}

// Handle navigation/proxy requests
function navigateTo(url) {
    // Format URL if needed
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    // Encode and redirect through proxy
    const encodedUrl = btoa(url);
    window.location.href = `/proxy/${encodedUrl}`;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await registerSW();
    
    // Handle search form submission
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        
        if (query) {
            // Check if it's a URL or search query
            if (query.includes('.') && !query.includes(' ')) {
                navigateTo(query);
            } else {
                // Search using Google
                navigateTo(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
            }
        }
    });
    
    // Handle quick links
    document.querySelectorAll('.quick-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = link.dataset.url;
            if (url) {
                navigateTo(url);
            }
        });
    });
    
    // Add some keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K focuses the search bar
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Escape clears the search
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchInput.blur();
        }
    });
});

// Handle errors and show user-friendly messages
window.addEventListener('error', (e) => {
    console.error('Proxy error:', e.error);
    
    // Show error notification if needed
    const infoText = document.querySelector('.info-text p');
    if (infoText) {
        infoText.style.background = 'rgba(255, 0, 0, 0.2)';
        infoText.style.borderColor = '#ff0000';
        infoText.textContent = '⚠️ Connection error - retrying...';
        
        setTimeout(() => {
            infoText.style.background = 'rgba(0, 0, 0, 0.5)';
            infoText.style.borderColor = 'var(--red-primary)';
            infoText.innerHTML = '🔒 Private & Secure • Bypass Censorship • Fast & Reliable';
        }, 3000);
    }
});
