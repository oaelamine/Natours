/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alert';

export const UpdateUser = async (email, name) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/updateMe`,
      data: {
        name,
        email
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Your inforamtion hase ben updated');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const updatePassword = async (
  password_current,
  password,
  password_confirm
) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updatePassword',
      data: {
        oldPassword: password_current,
        password,
        passwordConfirm: password_confirm
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Your Password hase ben updated');
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
