import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import * as crypto from 'crypto';

export const bunqCommon = {
  baseUrl: 'https://public-api.sandbox.bunq.com/v1',
  
  // Create API context
  createApiContext: async (apiKey: string, deviceName: string) => {
    // Generate key pair for installation
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    
    // Step 1: Register installation
    const installationRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: `${bunqCommon.baseUrl}/installation`,
      body: {
        client_public_key: keyPair.publicKey,
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Request-Id': crypto.randomUUID(),
      },
    };
    
    const { body: installation } = await httpClient.sendRequest<{
      Response: Array<{
        Id: { id: number };
        Token: { token: string };
        ServerPublicKey: { server_public_key: string };
      }>;
    }>(installationRequest);
    
    const installationToken = installation.Response.find(item => item.Token)?.Token.token;
    const serverPublicKey = installation.Response.find(item => item.ServerPublicKey)?.ServerPublicKey.server_public_key;
    
    // Step 2: Register device
    const deviceServerRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: `${bunqCommon.baseUrl}/device-server`,
      body: {
        description: deviceName,
        secret: apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Request-Id': crypto.randomUUID(),
        'X-Bunq-Client-Authentication': installationToken,
      },
    };
    
    await httpClient.sendRequest(deviceServerRequest);
    
    // Step 3: Create session
    const sessionServerRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: `${bunqCommon.baseUrl}/session-server`,
      body: {
        secret: apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Request-Id': crypto.randomUUID(),
        'X-Bunq-Client-Authentication': installationToken,
      },
    };
    
    const { body: session } = await httpClient.sendRequest<{
      Response: Array<{
        Id: { id: number };
        Token: { token: string };
        UserPerson: { id: number };
        UserCompany: { id: number };
      }>;
    }>(sessionServerRequest);
    
    const sessionToken = session.Response.find(item => item.Token)?.Token.token;
    const userId = session.Response.find(item => item.UserPerson)?.UserPerson.id || 
                  session.Response.find(item => item.UserCompany)?.UserCompany.id;
    
    return {
      sessionToken,
      userId,
      privateKey: keyPair.privateKey,
      serverPublicKey,
    };
  },
  
  // Create notification filter for webhooks
  createNotificationFilter: async (
    userId: number,
    category: string,
    webhookUrl: string,
    sessionToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${bunqCommon.baseUrl}/user/${userId}/notification-filter-url`,
      headers: {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Request-Id': crypto.randomUUID(),
        'X-Bunq-Client-Authentication': sessionToken,
      },
      body: {
        notification_filters: [
          {
            category,
            notification_target: webhookUrl,
          },
        ],
      },
    };
    
    const { body: response } = await httpClient.sendRequest<{
      Response: Array<{
        Id: { id: number };
      }>;
    }>(request);
    
    return response.Response.find(item => item.Id)?.Id.id;
  },
  
  // Delete notification filter
  deleteNotificationFilter: async (
    userId: number,
    notificationFilterId: number,
    sessionToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${bunqCommon.baseUrl}/user/${userId}/notification-filter-url/${notificationFilterId}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Request-Id': crypto.randomUUID(),
        'X-Bunq-Client-Authentication': sessionToken,
      },
    };
    
    return await httpClient.sendRequest(request);
  },
  
  // Get monetary accounts
  getMonetaryAccounts: async (userId: number, sessionToken: string) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${bunqCommon.baseUrl}/user/${userId}/monetary-account`,
      headers: {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Request-Id': crypto.randomUUID(),
        'X-Bunq-Client-Authentication': sessionToken,
      },
    };
    
    const { body: response } = await httpClient.sendRequest<{
      Response: Array<{
        MonetaryAccountBank: {
          id: number;
          description: string;
        };
      }>;
    }>(request);
    
    return response.Response.map(item => ({
      id: item.MonetaryAccountBank.id,
      description: item.MonetaryAccountBank.description,
    }));
  },
  
  // Sign request for Bunq API
  signRequest: (privateKey: string, requestData: string) => {
    const sign = crypto.createSign('sha256');
    sign.update(requestData);
    sign.end();
    return sign.sign(privateKey, 'base64');
  },
  
  // Verify response from Bunq API
  verifyResponse: (serverPublicKey: string, responseData: string, signature: string) => {
    const verify = crypto.createVerify('sha256');
    verify.update(responseData);
    verify.end();
    return verify.verify(serverPublicKey, signature, 'base64');
  },
};
