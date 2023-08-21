/* eslint-disable */

export const UpdateµSettings = async (obj, type) => {
  const data = {
    ...obj
  };
  let resStatus = '';
  try {
    if (type === 'data') {
      const res = await axios({
        method: 'PATCH',
        url: `http://127.0.0.1:3000/api/v1/users/updateMe`,
        data: {
          name: data.name,
          email: data.email
        }
      });
      resStatus = res.data.status;
    } else {
      const res = await axios({
        method: 'PATCH',
        url: `http://127.0.0.1:3000/api/v1/users/updatePassword`,
        data: {
          oldPassword: data.password_current,
          password: data.password,
          passwordConfirm: data.password_confirm
        }
      });
      resStatus = res.data.status;
    }
    if (resStatus === 'success') {
      showAlert('success', 'Your inforamtion hase ben updated');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
