import axios from 'axios';

const API_URL = 'https://vs1w1flhb5.execute-api.us-east-1.amazonaws.com/pinata';

const faucetAxiosApi = axios.create({
  baseURL: API_URL,
});

export async function uploadFile(file: File, name?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  return await faucetAxiosApi
    .post<{ url: string }>('/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => res.data);
}
