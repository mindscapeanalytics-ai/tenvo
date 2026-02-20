const { auth } = require('./lib/auth');

async function debugSession() {
    console.log('--- BetterAuth Session Debug ---');
    try {
        // Mocking request/headers for getSession
        const session = await auth.api.getSession({
            headers: new Headers()
        });
        console.log('Session retrieved successfully (might be null):', session);
    } catch (err) {
        console.error('BetterAuth getSession CRASHED:', err);
        console.error('Error stack:', err.stack);
    }
}

debugSession();
