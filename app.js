const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const app = express();

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

const config = require('./config.json');

app.get('/', async (req, res) => {
  try {
    console.log('Processing request to main route');
    const responses = await Promise.allSettled(
      config.endpoints.map(async (endpoint) => {
        try {
          const response = await axios.get(endpoint.url, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            responseType: 'text',
          });
          return response;
        } catch (error) {
          console.error(`Error fetching health status for ${endpoint.displayName}: ${error}`);
          return { data: 'unhealthy' };
        }
      })
    );

    const statusData = responses.reduce((acc, response, i) => {
      const endpoint = config.endpoints[i];
      const endpointStatus = response.value && response.value.data;

      console.log(`Raw response data for ${endpoint.displayName}:`, endpointStatus);

      const isHealthyStatus = (status) => {
        return status.toLowerCase() === 'healthy' || status.toLowerCase() === 'ok';
      };

      const getStatusFromResponse = (response) => {
        try {
          const parsedData = JSON.parse(response);
          console.log(`Parsed JSON data for ${endpoint.displayName}:`, parsedData);
          return parsedData[endpoint.statusField];
        } catch (error) {
          console.log(`Error parsing JSON data for ${endpoint.displayName}:`, error);
          console.log(`Checking status for ${endpoint.displayName} with raw response:`, response);
          return response.trim();
        }
      };

      const responseStatus = getStatusFromResponse(endpointStatus);
      console.log(`Status for ${endpoint.displayName} after processing: ${responseStatus}`);
      acc[`${endpoint.displayName}Status`] = isHealthyStatus(responseStatus) ? 'healthy' : 'unhealthy';

      console.log(`Final status for ${endpoint.displayName}:`, acc[`${endpoint.displayName}Status`]);

      return acc;
    }, {});

    res.render('index', { statusData, config });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching health status');
  }
});

const port = process.env.PORT || 3000;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
  const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
  const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
  const httpsServer = https.createServer({ key: privateKey, cert: certificate }, app);
  httpsServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
