/* eslint-disable */
import '@babel/polyfill';

import { login, logout } from './login';
import { UpdateUser, updatePassword } from './updateSettings';

//SELECTION
const LoginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');

const form_user_data = document.querySelector('.form-user-data');
const form_user_settings = document.querySelector('.form-user-settings');

//ADDING LISTNERS
// LOGIN
if (LoginForm) {
  LoginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

// UPDATE user name and email and photo INFO
if (form_user_data) {
  form_user_data.addEventListener('submit', function(e) {
    e.preventDefault();

    //recreating a multipart/form-data
    const form = new FormData();

    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    UpdateUser(form);
  });
}

// UPDATE USER PASSWORD
if (form_user_settings) {
  form_user_settings.addEventListener('submit', async function(e) {
    e.preventDefault();
    document.querySelector('.btn-password-save').textContent = 'Updating...';
    const password_current = document.querySelector('#password-current').value;
    const password = document.querySelector('#password').value;
    const password_confirm = document.querySelector('#password-confirm').value;

    await updatePassword(password_current, password, password_confirm);

    document.querySelector('.btn-password-save').textContent = 'Save password';
    document.querySelector('#password-current').value = '';
    document.querySelector('#password').value = '';
    document.querySelector('#password-confirm').value = '';
  });
}
