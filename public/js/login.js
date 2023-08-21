/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alert';

//elamineahmed
//elamineahmedwezza
//elamine@gmail.com
// eslint-disable-next-line import/prefer-default-export, node/no-unsupported-features/es-syntax
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login', //http://127.0.0.1:3000/api/v1/users/login
      data: {
        email,
        password
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'You have successefully logedin');
      window.setTimeout(() => {
        // eslint-disable-next-line no-restricted-globals
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout'
    });

    if (res.data.status === 'success') location.reload(true);
    // true => reload from the server not only from the browser cach
  } catch (error) {
    showAlert('error', 'error loging out, try later');
  }
};
