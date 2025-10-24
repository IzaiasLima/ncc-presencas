const API_URL = 'https://ncc-presencas.vercel.app';
// const API_URL = 'http://localhost:8000';

const HEADERS = {
    'Authorization': `Bearer ${window.auth.getToken()}`,
    'Content-Type': 'application/json'
}

// Exibe mensagem tipo toast
function showToast(message, err = false, duration = 4000) {
    const toast = document.getElementById('toast');

    toast.classList.add('show');
    toast.innerText = message;

    if (err) {
        toast.style.backgroundColor = '#e74c3c';
    } else {
        toast.style.backgroundColor = '#27ae60';
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
