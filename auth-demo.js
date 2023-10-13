/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {LitElement, css, html} from 'lit'

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID

export class AuthDemo extends LitElement {
  static get properties() {
    return {
      error: {type: String},
      files: {type: Array},
      accessToken: {type: String},
      tokenExpiresAt: {type: Number},
    }
  }

  constructor() {
    super()
    this.error = null
    this.files = []
    this.accessToken = null
    this.tokenExpiresAt = 0
  }

  errorMessage() {
    if (this.error) {
      return html`<div class="error">${this.error}</div>`
    }
  }

  filesTemplate() {
    if (this.files.length > 0) {
      return html`
        <div class="files">
          <h3>Files</h3>
          <ul>
            ${this.files.map(file => html`<li class="file">${file.name}</li>`)}
          </ul>
        </div>
      `
    }
  }

  render() {
    return html`
      <div class="root">
        ${this.errorMessage()}
        <button @click=${this._fetchFiles} part="button">
          Fetch files
        </button>
        <button @click=${this._revoke} part="button">
          Revoke access
        </button>
        ${this.filesTemplate()}
      </div>
    `
  }

  async _fetchFiles() {
    if (!this.accessToken || this.tokenExpiresAt < Date.now()) {
      await this._requestAuthorization()
    }
    await this._fetchFileList()
  }

  async _revoke() {
    return new Promise((resolve, reject) => {
      google.accounts.oauth2.revoke(this.accessToken, done => resolve(done))
    })
  }

  /** 
  * Request an access token using the Google Identity Services SDK.
  */
  async _requestAuthorization() {
    const scope = 'https://www.googleapis.com/auth/drive.readonly'
    return new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: scope,
        callback: async (response) => {
          if (response
            && response.access_token
            && google.accounts.oauth2.hasGrantedAnyScope(response, scope)) {
            this.error = null
            this.accessToken = response.access_token
            // Expiry is returned as a relative time (number of seconds remaining)
            // Convert to absolute time
            this.tokenExpiresAt = Date.now() + (response.expires_in * 1000)
            resolve(this.accessToken)
            return
          }
          // Either error or scope not granted
          this.error = 'Authorization required.'
        },
        error_callback: (err) => {
          if (err.type === 'popup_closed') {
            // User closed popup without authorizing.
            this.error = 'Authorization required'
          } else {
            // Popup failed to open or some other unexpected error occurred.
            this.error = 'An unexpected error occurred'
          }
          reject(err)
        }
      })
      client.requestAccessToken()
    })
  }

  async _fetchFileList() {
    const params = new URLSearchParams({
      orderBy: 'modifiedTime desc',
      pageSize: '10'
    })
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })
    if (res.status >= 400) {
      this.error = 'Unable to fetch files'
    }
    const body = await res.json()
    this.files = body.files
  }

  static get styles() {
    return css`
      .error {
        border: #ef4444;
        background-color: #fca5a5;
        padding: 12px;
      }
    `
  }
}

customElements.define('auth-demo', AuthDemo)

