const API_URL = 'http://localhost:8000';

// Exibe mensagem tipo toast
const toast = document.getElementById('toast');

function showToast(message, err = false, duration = 4000) {
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
