import fetch from 'node-fetch';

async function testEndpoint() {
    // https://REGION-PROJECT_ID.cloudfunctions.net/FUNCTION_NAME
    const url = 'https://us-central1-speaknative-8ce5c.cloudfunctions.net/getSimilarPhrases';

    const payload = {
        data: {
            text: "travel greeting food",
            targetLocale: "es-CO-CTG",
            userLocale: "en-US-CA",
            limit: 5
        }
    };

    try {
        console.log(`Sending request to ${url}...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response body:', text);
            return;
        }

        const json = await response.json();
        console.log('Success! Response data:');
        console.log(JSON.stringify(json, null, 2));

    } catch (error) {
        console.error('Network error:', error);
    }
}

testEndpoint();
