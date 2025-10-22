
// Se logado, adiciona token ao cabeçalho da requisição
document.body.addEventListener('htmx:configRequest', function (evt) {
  if (window.auth.isLoggedIn()) {
    evt.detail.headers['Authorization'] = 'Bearer ' + window.auth.getToken();
  }
});


async function handleLogin(username, password) {
  const URL = API_URL + '/token';

  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: username, password: password })
    });

    if (!response.ok) {
      throw new Error('E-mail ou senha inválidos.');
    }
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

function login() {

  const dataForm = document.getElementById('login-form');

  if (!dataForm.checkValidity()) {
    showToast('Por favor, preencha os campos de e-mail e senha.', true);
    return;
  }

  const username = dataForm.elements['email'].value;
  const password = dataForm.elements['password'].value;

  handleLogin(username, password)
    .then(data => {
      console.log('Login bem-sucedido!', data);

      window.auth.setToken(data.access_token, { persist: true });
      window.location.href = 'index.html';

      return true;

      // showToast('Login bem-sucedido!');
      // return requisitarDados(data.access_token);
    })
    .then(dados => {
      console.log('Dados recebidos:', dados);
    })
    .catch(error => {
      console.error('Erro:', error);
      showToast(`Não foi possível se autenticar no sistema.\n${error.message}.`, true);

    });
}

function logout() {
  window.auth.clearToken();
  window.location.href = 'login.html';
  // showToast('Logout realizado com sucesso!');
}

// External, exemplo
async function requisitarDados(token) {
  const response = await fetch('http://localhost:8000/people', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return response.json();
}