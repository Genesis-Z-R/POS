const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Service to handle MTN Mobile Money requests
 * Uses mock / sandbox endpoints commonly used in Capstone scenarios
 */

const MoMoService = {
  requestToPay: async (amount, phoneNumber, externalId, payerMessage) => {
    try {
      // In a real scenario, you'd fetch an access token first
      // Assuming authorization token is fetched and cached:
      const accessToken = 'mock_momo_access_token';
      const subscriptionKey = process.env.MOMO_API_KEY;

      const referenceId = uuidv4(); // Unique UUID for the transaction

      const config = {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Content-Type': 'application/json'
        }
      };

      const body = {
        amount: amount.toString(),
        currency: 'GHS',
        externalId: externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber
        },
        payerMessage: payerMessage || 'POS Payment',
        payeeNote: 'Thank you for your business!'
      };

      // Ensure axios is mocking if the endpoint isn't real, but we will wrap it
      // in a simulated response if API key is not strictly set.
      if (!subscriptionKey || subscriptionKey === 'your_sandbox_api_key_here') {
        console.warn("Using simulated MoMo Request; API key not configured.");
        // Simulate successful pending request
        return {
          status: 202,
          referenceId: referenceId,
          mocked: true
        };
      }

      const response = await axios.post(
        'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
        body,
        config
      );

      return {
        status: response.status,
        referenceId: referenceId,
        mocked: false
      };

    } catch (error) {
      console.error("MoMo API Error:", error.message);
      throw error;
    }
  }
};

module.exports = MoMoService;
