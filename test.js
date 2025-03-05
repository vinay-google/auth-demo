import {AuthDemo} from './auth-demo.js'
import {LitElement} from 'lit'
import {expect} from 'chai'

describe('AuthDemo', () => {
    it('should fetch files', async () => {
        const authDemo = new AuthDemo();
        await authDemo._fetchFiles()
    })
    it('should error out if no CLIENT_ID', async () => {
        let error = null;
        try {
            const authDemo = new AuthDemo();
            await authDemo._fetchFiles()
        }
        catch(e){
            error = e.message
        }
        expect(error).to.equal('VITE_CLIENT_ID is not defined in .env file');
    });
})
