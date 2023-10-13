async function requestAuthorization() {
  const scope = 'https://www.googleapis.com/auth/drive.readonly'
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: scope,
      callback: async (response) => {
        this.accessToken = response.access_token;
        this.tokenExpiresAt = Date.now() + (response.expires_in * 1000);
        resolve(this.accessToken);
      },
      error_callback: (err) => reject(err)
    });
    client.requestAccessToken();
  });
}
